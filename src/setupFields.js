// Custom Fields Setup and Mapping for Risk Score

import api, { route, storage } from '@forge/api';
import { DEFAULT_RISK_SCALE_OPTIONS, RISK_FIELDS } from './utils/constants';

const RISK_ISSUETYPE_PROPERTY_KEY = 'risk-score-calculator';
const RISK_ISSUETYPE_ENABLED_FIELD = 'enabled';
const RISK_FIELD_MAPPING_STORAGE_KEY = 'risk-score-calculator:field-mapping:v2';
const RISK_CALC_LOGS_STORAGE_KEY = 'risk-score-calculator:calculation-logs:v1';
const RISK_USER_CACHE_STORAGE_KEY = 'risk-score-calculator:user-cache:v1';
const RISK_SCALE_CONFIG_STORAGE_KEY = 'risk-score-calculator:scale-config:v1';
const MANAGED_DESCRIPTION_MARKER = 'Managed by Risk Score Calculator.';
const MAX_LOG_ENTRIES = 500;

const RISK_FIELD_KEYS = ['IMPACT', 'LIKELIHOOD', 'RISK_SCORE'];

const LEGACY_FIELD_NAMES = {
  IMPACT: ['Risk Calculator - Impact', 'Impact'],
  LIKELIHOOD: ['Risk Calculator - Likelihood', 'Likelihood'],
  RISK_SCORE: ['Risk Calculator - Risk Score', 'Risk Score']
};

async function createCustomField(name, description, type = 'number') {
  const fieldType =
    type === 'number'
      ? 'com.atlassian.jira.plugin.system.customfieldtypes:float'
      : type;

  const searcherCandidates = [
    'com.atlassian.jira.plugin.system.customfieldtypes:exactnumber',
    'com.atlassian.jira.plugin.system.customfieldtypes:numbersearcher',
    null
  ];

  let lastError = null;

  for (const searcherKey of searcherCandidates) {
    const payload = { name, description, type: fieldType };
    if (searcherKey) payload.searcherKey = searcherKey;

    const response = await api.asApp().requestJira(route`/rest/api/3/field`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) return await response.json();

    const errorText = await response.text();
    lastError = errorText;

    if (response.status === 400 && errorText.includes('Unknown searcher chosen')) {
      continue;
    }

    throw new Error(`Failed to create field ${name}: ${errorText}`);
  }

  throw new Error(`Failed to create field ${name}: ${lastError}`);
}

async function getAllFields() {
  const response = await api.asApp().requestJira(route`/rest/api/3/field`, {
    method: 'GET'
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch fields: ${error}`);
  }

  return await response.json();
}

async function getCachedUserMap() {
  const cached = await storage.get(RISK_USER_CACHE_STORAGE_KEY);
  if (!cached || typeof cached !== 'object') return {};
  return cached;
}

async function setCachedUserMap(userMap) {
  await storage.set(RISK_USER_CACHE_STORAGE_KEY, userMap);
}

async function resolveDisplayNameForAccountId(accountId, cachedUsers) {
  if (!accountId) return '';
  if (cachedUsers[accountId]) return cachedUsers[accountId];

  try {
    const response = await api
      .asApp()
      .requestJira(route`/rest/api/3/user?accountId=${accountId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });

    if (!response.ok) {
      return '';
    }

    const user = await response.json();
    const displayName = String(user?.displayName || '');
    if (displayName) {
      cachedUsers[accountId] = displayName;
      return displayName;
    }
    return '';
  } catch (_error) {
    return '';
  }
}

function isNumberCustomField(field) {
  return (
    String(field?.id || '').startsWith('customfield_') &&
    field?.schema?.type === 'number'
  );
}

function getUniqueFieldByName(fields, names) {
  for (const name of names) {
    const matches = fields.filter((field) => field.name === name);
    if (matches.length === 1) {
      return matches[0];
    }
  }
  return null;
}

function hasCompleteMapping(mapping) {
  return RISK_FIELD_KEYS.every((key) => Boolean(mapping?.[key]));
}

async function getStoredMapping() {
  const mapping = await storage.get(RISK_FIELD_MAPPING_STORAGE_KEY);
  if (!mapping || typeof mapping !== 'object') return null;
  return mapping;
}

async function setStoredMapping(mapping) {
  await storage.set(RISK_FIELD_MAPPING_STORAGE_KEY, {
    IMPACT: mapping.IMPACT,
    LIKELIHOOD: mapping.LIKELIHOOD,
    RISK_SCORE: mapping.RISK_SCORE,
    updatedAt: new Date().toISOString()
  });
}

function normalizeMappingInput(mapping) {
  return {
    IMPACT: String(mapping?.IMPACT || ''),
    LIKELIHOOD: String(mapping?.LIKELIHOOD || ''),
    RISK_SCORE: String(mapping?.RISK_SCORE || '')
  };
}

function validateMappingValues(mapping) {
  const missing = RISK_FIELD_KEYS.filter((key) => !mapping[key]);
  if (missing.length > 0) {
    return `Missing mapping values for: ${missing.join(', ')}`;
  }

  const values = [mapping.IMPACT, mapping.LIKELIHOOD, mapping.RISK_SCORE];
  if (new Set(values).size !== values.length) {
    return 'Each mapping must point to a different field.';
  }

  return null;
}

async function resolveAndValidateMapping(mapping) {
  const fields = await getAllFields();
  const byId = new Map(fields.map((field) => [String(field.id), field]));
  const normalized = normalizeMappingInput(mapping);
  const logicalError = validateMappingValues(normalized);

  if (logicalError) {
    return { valid: false, error: logicalError };
  }

  for (const key of RISK_FIELD_KEYS) {
    const id = normalized[key];
    const field = byId.get(id);
    if (!field) {
      return { valid: false, error: `Field ${id} does not exist.` };
    }
    if (!isNumberCustomField(field)) {
      return {
        valid: false,
        error: `${field.name} (${field.id}) is not a number custom field.`
      };
    }
  }

  return { valid: true, mapping: normalized, fields };
}

async function getResolvedRiskFieldMapping() {
  const fields = await getAllFields();
  const byId = new Map(fields.map((field) => [String(field.id), field]));
  const stored = await getStoredMapping();

  if (stored && hasCompleteMapping(stored)) {
    const validStored = RISK_FIELD_KEYS.every((key) => byId.has(String(stored[key])));
    if (validStored) {
      return {
        IMPACT: String(stored.IMPACT),
        LIKELIHOOD: String(stored.LIKELIHOOD),
        RISK_SCORE: String(stored.RISK_SCORE)
      };
    }
  }

  // Migration fallback: only use when names resolve uniquely.
  const migrated = {};
  for (const key of RISK_FIELD_KEYS) {
    const match = getUniqueFieldByName(fields, LEGACY_FIELD_NAMES[key]);
    if (match?.id) {
      migrated[key] = String(match.id);
    }
  }

  if (hasCompleteMapping(migrated)) {
    await setStoredMapping(migrated);
    return migrated;
  }

  return null;
}

function getDefaultRiskScaleConfig() {
  return {
    version: 1,
    impactOptions: DEFAULT_RISK_SCALE_OPTIONS.map((option) => ({
      value: Number(option.value),
      labelDefault: String(option.labelDefault || ''),
      labels: {
        en: String(option?.labels?.en || ''),
        nl: String(option?.labels?.nl || '')
      }
    })),
    likelihoodOptions: DEFAULT_RISK_SCALE_OPTIONS.map((option) => ({
      value: Number(option.value),
      labelDefault: String(option.labelDefault || ''),
      labels: {
        en: String(option?.labels?.en || ''),
        nl: String(option?.labels?.nl || '')
      }
    })),
    updatedAt: null,
    updatedBy: ''
  };
}

function normalizeScaleOption(option) {
  return {
    value: Number(option?.value),
    labelDefault: String(option?.labelDefault || '').trim(),
    labels: {
      en: String(option?.labels?.en || '').trim(),
      nl: String(option?.labels?.nl || '').trim()
    }
  };
}

function validateScaleOptions(options, listName) {
  if (!Array.isArray(options)) {
    return `${listName} must be an array.`;
  }

  if (options.length < 2) {
    return `${listName} must contain at least 2 options.`;
  }

  if (options.length > 30) {
    return `${listName} cannot contain more than 30 options.`;
  }

  const seenValues = new Set();

  for (const [index, item] of options.entries()) {
    const value = Number(item.value);
    if (!Number.isFinite(value) || value <= 0) {
      return `${listName}[${index}] must have a numeric value greater than 0.`;
    }

    if (seenValues.has(value)) {
      return `${listName} contains duplicate value: ${value}`;
    }
    seenValues.add(value);

    const labelDefault = String(item.labelDefault || '').trim();
    if (!labelDefault) {
      return `${listName}[${index}] must have a default label.`;
    }
  }

  return null;
}

function normalizeScaleConfigInput(inputConfig) {
  const fallback = getDefaultRiskScaleConfig();
  const impactInput = Array.isArray(inputConfig?.impactOptions)
    ? inputConfig.impactOptions
    : fallback.impactOptions;
  const likelihoodInput = Array.isArray(inputConfig?.likelihoodOptions)
    ? inputConfig.likelihoodOptions
    : fallback.likelihoodOptions;

  const impactOptions = impactInput.map(normalizeScaleOption);
  const likelihoodOptions = likelihoodInput.map(normalizeScaleOption);

  return {
    version: 1,
    impactOptions,
    likelihoodOptions
  };
}

function validateScaleConfig(config) {
  const impactError = validateScaleOptions(config.impactOptions, 'impactOptions');
  if (impactError) return impactError;

  const likelihoodError = validateScaleOptions(config.likelihoodOptions, 'likelihoodOptions');
  if (likelihoodError) return likelihoodError;

  return null;
}

async function getStoredRiskScaleConfig() {
  const current = await storage.get(RISK_SCALE_CONFIG_STORAGE_KEY);
  if (!current || typeof current !== 'object') return null;
  return current;
}

async function ensureRiskScaleConfigExists() {
  const current = await getStoredRiskScaleConfig();
  if (current) {
    const normalized = normalizeScaleConfigInput(current);
    const validationError = validateScaleConfig(normalized);
    if (!validationError) {
      return {
        ...normalized,
        updatedAt: current.updatedAt || null,
        updatedBy: String(current.updatedBy || '')
      };
    }
  }

  const defaults = getDefaultRiskScaleConfig();
  const next = {
    ...defaults,
    updatedAt: new Date().toISOString(),
    updatedBy: current ? 'system-migration' : 'system-default'
  };
  await storage.set(RISK_SCALE_CONFIG_STORAGE_KEY, next);
  return next;
}

async function getScaleDefaultValues() {
  const config = await ensureRiskScaleConfigExists();
  const impactDefault = Number(config?.impactOptions?.[0]?.value) || 1;
  const likelihoodDefault = Number(config?.likelihoodOptions?.[0]?.value) || 1;
  return { impactDefault, likelihoodDefault };
}

function buildAllowedValueSet(options) {
  return new Set((options || []).map((item) => Number(item?.value)).filter((value) => Number.isFinite(value)));
}

function getMinConfiguredValue(options, fallbackValue = 1) {
  const values = (options || [])
    .map((item) => Number(item?.value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);
  return values[0] || fallbackValue;
}

function getLegacyValueMeta(value, allowedValues) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return { hasValue: false, numeric: null, isLegacy: false };
  }
  return {
    hasValue: true,
    numeric,
    isLegacy: !allowedValues.has(numeric)
  };
}

async function searchIssuesByJql(jql, fields, maxResults = 50, nextPageToken = '') {
  const requestBody = {
    jql,
    maxResults: Number(maxResults) || 50,
    fields: Array.isArray(fields) ? fields : []
  };
  if (nextPageToken) {
    requestBody.nextPageToken = String(nextPageToken);
  }

  const response = await api
    .asApp()
    .requestJira(route`/rest/api/3/search/jql`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to search issues: ${error}`);
  }

  const payload = await response.json();
  return {
    issues: payload?.issues || [],
    total: Number(payload?.total) || Number((payload?.issues || []).length) || 0,
    maxResults: Number(payload?.maxResults) || maxResults,
    nextPageToken: String(payload?.nextPageToken || '')
  };
}

export async function verifyRiskFieldMapping() {
  try {
    const mapping = await getResolvedRiskFieldMapping();
    if (!mapping || !hasCompleteMapping(mapping)) {
      return {
        success: false,
        error: 'Risk field mapping is not configured. Open Risk Score Configuration and map fields.'
      };
    }

    const fields = await getAllFields();
    const byId = new Map(fields.map((field) => [String(field.id), field]));

    const fieldMeta = {
      IMPACT: byId.get(String(mapping.IMPACT)) || null,
      LIKELIHOOD: byId.get(String(mapping.LIKELIHOOD)) || null,
      RISK_SCORE: byId.get(String(mapping.RISK_SCORE)) || null
    };

    const missingKeys = Object.entries(fieldMeta)
      .filter(([, field]) => !field)
      .map(([key]) => key);

    if (missingKeys.length > 0) {
      return {
        success: false,
        error: `Mapped field(s) missing: ${missingKeys.join(', ')}`
      };
    }

    const nonNumber = Object.entries(fieldMeta)
      .filter(([, field]) => !isNumberCustomField(field))
      .map(([key, field]) => `${key}=${field.name} (${field.id})`);

    if (nonNumber.length > 0) {
      return {
        success: false,
        error: `Mapped field(s) are not number custom fields: ${nonNumber.join('; ')}`
      };
    }

    return {
      success: true,
      mapping,
      fields: {
        IMPACT: { id: String(fieldMeta.IMPACT.id), name: String(fieldMeta.IMPACT.name || '') },
        LIKELIHOOD: { id: String(fieldMeta.LIKELIHOOD.id), name: String(fieldMeta.LIKELIHOOD.name || '') },
        RISK_SCORE: { id: String(fieldMeta.RISK_SCORE.id), name: String(fieldMeta.RISK_SCORE.name || '') }
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getLegacyRiskValueSummary(limit = 100) {
  try {
    const mappingCheck = await verifyRiskFieldMapping();
    if (!mappingCheck.success) return mappingCheck;

    const scaleConfig = await ensureRiskScaleConfigExists();
    const allowedImpact = buildAllowedValueSet(scaleConfig.impactOptions);
    const allowedLikelihood = buildAllowedValueSet(scaleConfig.likelihoodOptions);
    const fields = [mappingCheck.mapping.IMPACT, mappingCheck.mapping.LIKELIHOOD];
    const safeLimit = Math.max(10, Math.min(Number(limit) || 100, 500));

    const jql = `${mappingCheck.mapping.IMPACT} IS NOT EMPTY OR ${mappingCheck.mapping.LIKELIHOOD} IS NOT EMPTY`;
    const pageSize = Math.max(10, Math.min(safeLimit, 100));
    let allIssues = [];
    let totalMatchedByJql = 0;
    let nextPageToken = '';

    do {
      const page = await searchIssuesByJql(jql, ['key', ...fields], pageSize, nextPageToken);
      if (!totalMatchedByJql) totalMatchedByJql = page.total;
      allIssues = [...allIssues, ...(page.issues || [])].slice(0, safeLimit);
      nextPageToken = page.nextPageToken || '';
    } while (nextPageToken && allIssues.length < safeLimit);

    const legacyIssues = [];
    for (const issue of allIssues) {
      const issueFields = issue?.fields || {};
      const impactMeta = getLegacyValueMeta(issueFields[mappingCheck.mapping.IMPACT], allowedImpact);
      const likelihoodMeta = getLegacyValueMeta(issueFields[mappingCheck.mapping.LIKELIHOOD], allowedLikelihood);
      if (!impactMeta.isLegacy && !likelihoodMeta.isLegacy) continue;

      legacyIssues.push({
        issueKey: String(issue?.key || ''),
        impact: impactMeta.hasValue ? impactMeta.numeric : null,
        likelihood: likelihoodMeta.hasValue ? likelihoodMeta.numeric : null,
        impactLegacy: impactMeta.isLegacy,
        likelihoodLegacy: likelihoodMeta.isLegacy
      });
    }

    return {
      success: true,
      scanned: allIssues.length,
      totalMatchedByJql,
      legacyCount: legacyIssues.length,
      legacyIssues
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function migrateLegacyRiskValues(limit = 200) {
  try {
    const mappingCheck = await verifyRiskFieldMapping();
    if (!mappingCheck.success) return mappingCheck;

    const mapping = mappingCheck.mapping;
    const scaleConfig = await ensureRiskScaleConfigExists();
    const allowedImpact = buildAllowedValueSet(scaleConfig.impactOptions);
    const allowedLikelihood = buildAllowedValueSet(scaleConfig.likelihoodOptions);
    const impactFallback = getMinConfiguredValue(scaleConfig.impactOptions, 1);
    const likelihoodFallback = getMinConfiguredValue(scaleConfig.likelihoodOptions, 1);
    const safeLimit = Math.max(1, Math.min(Number(limit) || 200, 500));

    const jql = `${mapping.IMPACT} IS NOT EMPTY OR ${mapping.LIKELIHOOD} IS NOT EMPTY`;
    const pageSize = Math.max(10, Math.min(safeLimit, 100));
    let allIssues = [];
    let totalMatchedByJql = 0;
    let nextPageToken = '';

    do {
      const page = await searchIssuesByJql(jql, ['key', mapping.IMPACT, mapping.LIKELIHOOD], pageSize, nextPageToken);
      if (!totalMatchedByJql) totalMatchedByJql = page.total;
      allIssues = [...allIssues, ...(page.issues || [])].slice(0, safeLimit);
      nextPageToken = page.nextPageToken || '';
    } while (nextPageToken && allIssues.length < safeLimit);

    let updatedCount = 0;
    const updatedIssues = [];
    const failedIssues = [];

    for (const issue of allIssues) {
      const issueKey = String(issue?.key || '');
      const issueFields = issue?.fields || {};
      const impactMeta = getLegacyValueMeta(issueFields[mapping.IMPACT], allowedImpact);
      const likelihoodMeta = getLegacyValueMeta(issueFields[mapping.LIKELIHOOD], allowedLikelihood);
      if (!impactMeta.isLegacy && !likelihoodMeta.isLegacy) continue;

      const nextImpact = impactMeta.isLegacy
        ? impactFallback
        : (impactMeta.hasValue ? impactMeta.numeric : impactFallback);
      const nextLikelihood = likelihoodMeta.isLegacy
        ? likelihoodFallback
        : (likelihoodMeta.hasValue ? likelihoodMeta.numeric : likelihoodFallback);
      const nextRiskScore = nextImpact * nextLikelihood;

      const payload = {
        fields: {
          [mapping.IMPACT]: Number(nextImpact),
          [mapping.LIKELIHOOD]: Number(nextLikelihood),
          [mapping.RISK_SCORE]: Number(nextRiskScore)
        }
      };

      const updateResponse = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        failedIssues.push({ issueKey, error: errorText });
        continue;
      }

      updatedCount += 1;
      updatedIssues.push({
        issueKey,
        from: {
          impact: impactMeta.hasValue ? impactMeta.numeric : null,
          likelihood: likelihoodMeta.hasValue ? likelihoodMeta.numeric : null
        },
        to: {
          impact: nextImpact,
          likelihood: nextLikelihood,
          riskScore: nextRiskScore
        }
      });

      await appendRiskCalculationLog({
        issueKey,
        impact: nextImpact,
        likelihood: nextLikelihood,
        riskScore: nextRiskScore,
        priority: nextRiskScore >= 400 ? 'HIGH' : nextRiskScore >= 100 ? 'MEDIUM' : 'LOW',
        actorAccountId: '',
        actorName: 'Migration job',
        origin: 'migration'
      });
    }

    return {
      success: true,
      scanned: allIssues.length,
      totalMatchedByJql,
      updatedCount,
      updatedIssues,
      failedCount: failedIssues.length,
      failedIssues
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getRiskScaleConfig() {
  try {
    const config = await ensureRiskScaleConfigExists();
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function saveRiskScaleConfig(config, actorAccountId = '') {
  try {
    const normalized = normalizeScaleConfigInput(config || {});
    const validationError = validateScaleConfig(normalized);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const next = {
      ...normalized,
      updatedAt: new Date().toISOString(),
      updatedBy: String(actorAccountId || '')
    };
    await storage.set(RISK_SCALE_CONFIG_STORAGE_KEY, next);
    return { success: true, config: next };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function resetRiskScaleConfig(actorAccountId = '') {
  try {
    const defaults = getDefaultRiskScaleConfig();
    const next = {
      ...defaults,
      updatedAt: new Date().toISOString(),
      updatedBy: String(actorAccountId || '')
    };
    await storage.set(RISK_SCALE_CONFIG_STORAGE_KEY, next);
    return { success: true, config: next };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function fetchIssueTypes() {
  const response = await api.asApp().requestJira(route`/rest/api/3/issuetype`, {
    method: 'GET'
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to load issue types: ${error}`);
  }

  const types = await response.json();
  return (types || [])
    .filter((type) => !type.subtask)
    .map((type) => ({
      id: String(type.id),
      name: type.name
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function getIssueTypeEnabled(issueTypeId) {
  const response = await api.asApp().requestJira(
    route`/rest/api/3/issuetype/${issueTypeId}/properties/${RISK_ISSUETYPE_PROPERTY_KEY}`,
    { method: 'GET' }
  );

  if (response.status === 404) return { enabled: false, updatedAt: null };

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to read issue type property: ${error}`);
  }

  const property = await response.json();
  const value = property?.value?.[RISK_ISSUETYPE_ENABLED_FIELD];
  const updatedAt = property?.value?.updatedAt || null;
  return { enabled: String(value) === 'true', updatedAt };
}

async function setIssueTypeEnabled(issueTypeId, enabled, updatedAt) {
  const response = await api.asApp().requestJira(
    route`/rest/api/3/issuetype/${issueTypeId}/properties/${RISK_ISSUETYPE_PROPERTY_KEY}`,
    {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        [RISK_ISSUETYPE_ENABLED_FIELD]: enabled ? 'true' : 'false',
        updatedAt
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update issue type property: ${error}`);
  }
}

export async function getRiskVisibilityConfig() {
  try {
    const issueTypes = await fetchIssueTypes();
    const rows = await Promise.all(
      issueTypes.map(async (type) => ({
        id: type.id,
        ...(await getIssueTypeEnabled(type.id))
      }))
    );

    const enabledIssueTypeIds = rows.filter((item) => item.enabled).map((item) => item.id);
    const updatedAt = rows
      .map((item) => item.updatedAt)
      .filter(Boolean)
      .sort()
      .at(-1) || null;

    return { success: true, enabledIssueTypeIds, updatedAt };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function saveRiskVisibilityConfig(enabledIssueTypeIds) {
  try {
    const selected = new Set((enabledIssueTypeIds || []).map(String));
    const issueTypes = await fetchIssueTypes();
    const updatedAt = new Date().toISOString();

    await Promise.all(
      issueTypes.map((type) => setIssueTypeEnabled(type.id, selected.has(type.id), updatedAt))
    );

    return {
      success: true,
      enabledIssueTypeIds: [...selected],
      updatedAt
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getJiraIssueTypes() {
  try {
    return {
      success: true,
      issueTypes: await fetchIssueTypes()
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAvailableRiskFields() {
  try {
    const fields = await getAllFields();
    const numberFields = fields
      .filter((field) => isNumberCustomField(field))
      .map((field) => ({
        id: String(field.id),
        name: field.name,
        description: field.description || ''
      }))
      .sort((a, b) => {
        const nameCompare = a.name.localeCompare(b.name);
        if (nameCompare !== 0) return nameCompare;
        return a.id.localeCompare(b.id);
      });

    return { success: true, fields: numberFields };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getRiskFieldMapping() {
  try {
    const mapping = await getResolvedRiskFieldMapping();
    return { success: true, mapping };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function saveRiskFieldMapping(mapping) {
  try {
    const validated = await resolveAndValidateMapping(mapping || {});
    if (!validated.valid) {
      return { success: false, error: validated.error };
    }

    await setStoredMapping(validated.mapping);
    return {
      success: true,
      mapping: validated.mapping,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function setupCustomFields() {
  const fieldIds = {};

  try {
    const fields = await getAllFields();
    let createdCount = 0;

    for (const [key, config] of Object.entries(RISK_FIELDS)) {
      let field = fields.find(
        (candidate) =>
          candidate.name === config.name &&
          String(candidate.description || '').includes(MANAGED_DESCRIPTION_MARKER)
      );

      if (!field) {
        field = await createCustomField(config.name, config.description, config.type);
        createdCount += 1;
      }

      fieldIds[key] = String(field.id);
    }

    await setStoredMapping(fieldIds);
    return {
      success: true,
      fieldIds,
      createdCount
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function saveRiskToIssue(issueKey, impact, likelihood, riskScore) {
  if (!issueKey) {
    return { success: false, error: 'Issue key is missing.' };
  }

  try {
    const mapping = await getResolvedRiskFieldMapping();
    if (!mapping || !hasCompleteMapping(mapping)) {
      return {
        success: false,
        error: 'Risk field mapping is not configured. Open Risk Score Configuration and map fields.'
      };
    }

    const payload = {
      fields: {
        [mapping.IMPACT]: Number(impact),
        [mapping.LIKELIHOOD]: Number(likelihood),
        [mapping.RISK_SCORE]: Number(riskScore)
      }
    };

    const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Issue update failed: ${error}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getRiskStateFromIssue(issueKey) {
  if (!issueKey) {
    return { success: false, error: 'Issue key is missing.' };
  }

  try {
    const { impactDefault, likelihoodDefault } = await getScaleDefaultValues();
    const mapping = await getResolvedRiskFieldMapping();
    if (!mapping || !hasCompleteMapping(mapping)) {
      return {
        success: false,
        error: 'Risk field mapping is not configured. Open Risk Score Configuration and map fields.'
      };
    }

    const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
      method: 'GET'
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Failed to load issue: ${error}` };
    }

    const issue = await response.json();
    const fields = issue.fields || {};

    return {
      success: true,
      values: {
        impact: Number(fields[mapping.IMPACT]) || impactDefault,
        likelihood: Number(fields[mapping.LIKELIHOOD]) || likelihoodDefault,
        riskScore: Number(fields[mapping.RISK_SCORE]) || null
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function appendRiskCalculationLog(entry) {
  try {
    const current = await storage.get(RISK_CALC_LOGS_STORAGE_KEY);
    const logs = Array.isArray(current) ? current : [];
    const next = [
      {
        timestamp: new Date().toISOString(),
        issueKey: String(entry?.issueKey || ''),
        impact: Number(entry?.impact) || 1,
        likelihood: Number(entry?.likelihood) || 1,
        riskScore: Number(entry?.riskScore) || 1,
        priority: String(entry?.priority || ''),
        actorAccountId: String(entry?.actorAccountId || ''),
        actorName: String(entry?.actorName || ''),
        origin: String(entry?.origin || '')
      },
      ...logs
    ].slice(0, MAX_LOG_ENTRIES);

    await storage.set(RISK_CALC_LOGS_STORAGE_KEY, next);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getRiskCalculationLogs(limit = 100) {
  try {
    const current = await storage.get(RISK_CALC_LOGS_STORAGE_KEY);
    const logs = Array.isArray(current) ? current : [];
    const safeLimit = Math.max(1, Math.min(Number(limit) || 100, MAX_LOG_ENTRIES));
    const sliced = logs.slice(0, safeLimit);
    const enrichedLogs = await enrichLogsWithDisplayNames(sliced);

    return {
      success: true,
      logs: enrichedLogs
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function enrichLogsWithDisplayNames(logEntries) {
  const cachedUsers = await getCachedUserMap();
  const accountIds = [
    ...new Set(
      (logEntries || [])
        .map((entry) => String(entry?.actorAccountId || ''))
        .filter(Boolean)
    )
  ];

  for (const accountId of accountIds) {
    await resolveDisplayNameForAccountId(accountId, cachedUsers);
  }

  await setCachedUserMap(cachedUsers);

  return (logEntries || []).map((entry) => {
    const accountId = String(entry?.actorAccountId || '');
    const cachedName = accountId ? cachedUsers[accountId] || '' : '';
    return {
      ...entry,
      actorName: entry?.actorName || cachedName || ''
    };
  });
}

export async function getRiskCalculationLogsForIssue(issueKey, limit = 50) {
  try {
    const normalizedIssueKey = String(issueKey || '').trim();
    if (!normalizedIssueKey) {
      return { success: false, error: 'Issue key is missing.' };
    }

    const current = await storage.get(RISK_CALC_LOGS_STORAGE_KEY);
    const logs = Array.isArray(current) ? current : [];
    const safeLimit = Math.max(1, Math.min(Number(limit) || 50, MAX_LOG_ENTRIES));
    const filtered = logs
      .filter((entry) => String(entry?.issueKey || '') === normalizedIssueKey)
      .slice(0, safeLimit);
    const enrichedLogs = await enrichLogsWithDisplayNames(filtered);

    return {
      success: true,
      issueKey: normalizedIssueKey,
      logs: enrichedLogs
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
