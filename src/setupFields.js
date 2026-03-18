import api, { route, storage } from '@forge/api';
import {
  DEFAULT_PRIORITY_SCALE_OPTIONS,
  DEFAULT_PRIORITY_THRESHOLDS,
  EXPLANATION_MAX_LENGTH,
  MOSCOW_LABEL_OPTIONS,
  PRIORITY_FIELDS
} from './utils/constants';
import { normalizeThresholds, validateThresholds } from './utils/priorityCalculator';

const PRIORITY_ISSUETYPE_PROPERTY_KEY = 'priority-dashboard';
const PRIORITY_ISSUETYPE_ENABLED_FIELD = 'enabled';
const PRIORITY_FIELD_MAPPING_STORAGE_KEY = 'priority-dashboard:field-mapping:v1';
const PRIORITY_CALC_LOGS_STORAGE_KEY = 'priority-dashboard:calculation-logs:v1';
const PRIORITY_USER_CACHE_STORAGE_KEY = 'priority-dashboard:user-cache:v1';
const PRIORITY_SCALE_CONFIG_STORAGE_KEY = 'priority-dashboard:scale-config:v1';
const PRIORITY_THRESHOLD_CONFIG_STORAGE_KEY = 'priority-dashboard:threshold-config:v1';
const MANAGED_DESCRIPTION_MARKERS = [
  'Managed by Priority Calculator.',
  'Managed by Priority Dashboard.'
];
const MAX_LOG_ENTRIES = 500;

const NUMBER_MAPPING_KEYS = [
  'BENEFIT_SCORE',
  'URGENCY_SCORE',
  'AMBITION_SCORE',
  'TOTAL_SCORE'
];
const LABEL_MAPPING_KEYS = ['MOSCOW_LABEL'];
const TEXT_MAPPING_KEYS = [
  'BENEFIT_EXPLANATION',
  'URGENCY_EXPLANATION',
  'AMBITION_EXPLANATION'
];
const PRIORITY_FIELD_KEYS = [...NUMBER_MAPPING_KEYS, ...LABEL_MAPPING_KEYS, ...TEXT_MAPPING_KEYS];
const SINGLE_SELECT_CUSTOM_TYPE_MARKERS = [':select'];

async function createCustomField(name, description, type = 'number') {
  let fieldType = 'com.atlassian.jira.plugin.system.customfieldtypes:float';
  let searcherCandidates = [
    'com.atlassian.jira.plugin.system.customfieldtypes:exactnumber',
    'com.atlassian.jira.plugin.system.customfieldtypes:numbersearcher',
    null
  ];

  if (type === 'textarea') {
    fieldType = 'com.atlassian.jira.plugin.system.customfieldtypes:textarea';
    searcherCandidates = [
      'com.atlassian.jira.plugin.system.customfieldtypes:textsearcher',
      'com.atlassian.jira.plugin.system.customfieldtypes:exacttextsearcher',
      null
    ];
  } else if (type === 'text') {
    fieldType = 'com.atlassian.jira.plugin.system.customfieldtypes:textfield';
    searcherCandidates = [
      'com.atlassian.jira.plugin.system.customfieldtypes:textsearcher',
      'com.atlassian.jira.plugin.system.customfieldtypes:exacttextsearcher',
      null
    ];
  } else if (type === 'single_select') {
    fieldType = 'com.atlassian.jira.plugin.system.customfieldtypes:select';
    searcherCandidates = [
      'com.atlassian.jira.plugin.system.customfieldtypes:multiselectsearcher',
      'com.atlassian.jira.plugin.system.customfieldtypes:textsearcher',
      null
    ];
  }

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

function isCustomField(field) {
  return String(field?.id || '').startsWith('customfield_');
}

function isNumberCustomField(field) {
  return isCustomField(field) && String(field?.schema?.type || field?.schemaType || '') === 'number';
}

function isTextCustomField(field) {
  return isCustomField(field) && String(field?.schema?.type || field?.schemaType || '') === 'string';
}

function isTextareaCustomField(field) {
  return isTextCustomField(field) && String(field?.schema?.custom || field?.customType || '').includes(':textarea');
}

function isSingleLineTextCustomField(field) {
  return isTextCustomField(field) && String(field?.schema?.custom || field?.customType || '').includes(':textfield');
}

function isSingleSelectCustomField(field) {
  const customType = String(field?.schema?.custom || field?.customType || '');
  if (!isCustomField(field)) return false;
  return SINGLE_SELECT_CUSTOM_TYPE_MARKERS.some((marker) => customType.includes(marker));
}

function fieldMatchesManagedType(field, expectedType) {
  if (expectedType === 'number') return isNumberCustomField(field);
  if (expectedType === 'textarea') return isTextareaCustomField(field);
  if (expectedType === 'text') return isSingleLineTextCustomField(field);
  if (expectedType === 'single_select') return isSingleSelectCustomField(field);
  return false;
}

function normalizeMoscowLabelKey(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

function normalizeMoscowLabel(value) {
  const normalizedKey = normalizeMoscowLabelKey(value);
  if (normalizedKey === 'WONT') return 'WONT';
  if (normalizedKey === 'COULD') return 'COULD';
  if (normalizedKey === 'SHOULD') return 'SHOULD';
  if (normalizedKey === 'MUST') return 'MUST';
  return '';
}

async function getFieldContexts(fieldId) {
  const response = await api.asApp().requestJira(route`/rest/api/3/field/${fieldId}/context`, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to load field contexts for ${fieldId}: ${error}`);
  }

  const body = await response.json();
  return Array.isArray(body?.values) ? body.values : [];
}

async function createFieldContext(fieldId, name) {
  const response = await api.asApp().requestJira(route`/rest/api/3/field/${fieldId}/context`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      description: `Managed by Priority Calculator for ${name}.`,
      isGlobalContext: true
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create field context for ${fieldId}: ${error}`);
  }

  const body = await response.json();
  const createdContextId = body?.id || body?.contextId || body?.values?.[0]?.id;
  if (!createdContextId) {
    throw new Error(`Field context created for ${fieldId}, but no context id was returned.`);
  }

  return {
    id: String(createdContextId),
    name
  };
}

async function getOrCreateGlobalFieldContext(fieldId, fieldName) {
  const contexts = await getFieldContexts(fieldId);
  const globalContext =
    contexts.find((context) => context?.isGlobalContext) ||
    contexts.find((context) => String(context?.projectIds?.length || 0) === '0');

  if (globalContext) {
    return {
      id: String(globalContext.id),
      name: String(globalContext.name || `${fieldName} context`)
    };
  }

  return createFieldContext(fieldId, `${fieldName} context`);
}

async function getFieldContextOptions(fieldId, contextId) {
  const response = await api.asApp().requestJira(
    route`/rest/api/3/field/${fieldId}/context/${contextId}/option`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to load field options for ${fieldId}: ${error}`);
  }

  const body = await response.json();
  return Array.isArray(body?.values) ? body.values : [];
}

async function createFieldContextOptions(fieldId, contextId, options) {
  const response = await api.asApp().requestJira(
    route`/rest/api/3/field/${fieldId}/context/${contextId}/option`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        options: options.map((value) => ({ value }))
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create field options for ${fieldId}: ${error}`);
  }

  const body = await response.json();
  return Array.isArray(body?.options) ? body.options : [];
}

async function ensureMoscowLabelOptions(fieldId, fieldName) {
  const context = await getOrCreateGlobalFieldContext(fieldId, fieldName);
  const existingOptions = await getFieldContextOptions(fieldId, context.id);
  const byValue = new Map(
    existingOptions
      .map((option) => [normalizeMoscowLabel(option?.value || option?.name || ''), option])
      .filter(([value]) => Boolean(value))
  );

  const missingValues = MOSCOW_LABEL_OPTIONS.filter((value) => !byValue.has(value));
  if (missingValues.length > 0) {
    const createdOptions = await createFieldContextOptions(fieldId, context.id, missingValues);
    for (const option of createdOptions) {
      byValue.set(String(option?.value || '').trim().toUpperCase(), option);
    }
  }

  return {
    contextId: String(context.id),
    optionsByValue: byValue
  };
}

async function getMoscowLabelFieldOption(fieldId, fieldName, labelValue) {
  const normalized = normalizeMoscowLabel(labelValue);
  if (!normalized) return null;

  const { optionsByValue } = await ensureMoscowLabelOptions(fieldId, fieldName);
  const option = optionsByValue.get(normalized);

  if (!option?.id) {
    throw new Error(`Option ${normalized} is missing on ${fieldName} (${fieldId}).`);
  }

  return {
    id: String(option.id),
    value: normalized
  };
}

function fromJiraMoscowValue(value) {
  if (typeof value === 'string') return normalizeMoscowLabel(value);
  if (value && typeof value === 'object') {
    return normalizeMoscowLabel(value.value || value.name || '');
  }
  return '';
}

function toAdfDocument(text) {
  const normalized = String(text || '').replace(/\r/g, '');
  const lines = normalized.split('\n');
  const content = (lines.length > 0 ? lines : ['']).map((line) => {
    const safeLine = String(line || '');
    if (!safeLine) {
      return { type: 'paragraph', content: [] };
    }
    return {
      type: 'paragraph',
      content: [{ type: 'text', text: safeLine }]
    };
  });

  return {
    version: 1,
    type: 'doc',
    content
  };
}

function adfNodeToPlainText(node) {
  if (!node || typeof node !== 'object') return '';
  if (node.type === 'text') return String(node.text || '');
  if (!Array.isArray(node.content)) return '';
  return node.content.map(adfNodeToPlainText).join('');
}

function fromAdfDocument(value) {
  if (!value || typeof value !== 'object') return '';
  if (value.type !== 'doc' || !Array.isArray(value.content)) return '';

  return value.content
    .map((block) => adfNodeToPlainText(block))
    .join('\n')
    .trim();
}

function toJiraTextValue(text, fieldMeta) {
  if (isTextareaCustomField(fieldMeta)) {
    return toAdfDocument(text);
  }
  return String(text || '');
}

function fromJiraTextValue(value) {
  if (typeof value === 'string') return value;
  return fromAdfDocument(value);
}

function hasCompleteMapping(mapping) {
  return PRIORITY_FIELD_KEYS.every((key) => Boolean(mapping?.[key]));
}

function normalizeMappingInput(mapping) {
  return PRIORITY_FIELD_KEYS.reduce((acc, key) => {
    acc[key] = String(mapping?.[key] || '');
    return acc;
  }, {});
}

function validateMappingValues(mapping) {
  const missing = PRIORITY_FIELD_KEYS.filter((key) => !mapping[key]);
  if (missing.length > 0) {
    return `Missing mapping values for: ${missing.join(', ')}`;
  }

  const values = PRIORITY_FIELD_KEYS.map((key) => mapping[key]);
  if (new Set(values).size !== values.length) {
    return 'Each mapping must point to a different field.';
  }

  return null;
}

async function getStoredMapping() {
  const mapping = await storage.get(PRIORITY_FIELD_MAPPING_STORAGE_KEY);
  if (!mapping || typeof mapping !== 'object') return null;
  return mapping;
}

async function setStoredMapping(mapping) {
  await storage.set(PRIORITY_FIELD_MAPPING_STORAGE_KEY, {
    ...PRIORITY_FIELD_KEYS.reduce((acc, key) => {
      acc[key] = mapping[key];
      return acc;
    }, {}),
    updatedAt: new Date().toISOString()
  });
}

async function resolveAndValidateMapping(mapping) {
  const fields = await getAllFields();
  const byId = new Map(fields.map((field) => [String(field.id), field]));
  const normalized = normalizeMappingInput(mapping);
  const logicalError = validateMappingValues(normalized);

  if (logicalError) {
    return { valid: false, error: logicalError };
  }

  for (const key of NUMBER_MAPPING_KEYS) {
    const id = normalized[key];
    const field = byId.get(id);
    if (!field) return { valid: false, error: `Field ${id} does not exist.` };
    if (!isNumberCustomField(field)) {
      return {
        valid: false,
        error: `${field.name} (${field.id}) is not a number custom field.`
      };
    }
  }

  for (const key of LABEL_MAPPING_KEYS) {
    const id = normalized[key];
    const field = byId.get(id);
    if (!field) return { valid: false, error: `Field ${id} does not exist.` };
    if (!isSingleSelectCustomField(field)) {
      return {
        valid: false,
        error: `${field.name} (${field.id}) is not a single-select custom field.`
      };
    }
  }

  for (const key of TEXT_MAPPING_KEYS) {
    const id = normalized[key];
    const field = byId.get(id);
    if (!field) return { valid: false, error: `Field ${id} does not exist.` };
    if (!isTextCustomField(field)) {
      return {
        valid: false,
        error: `${field.name} (${field.id}) is not a text custom field.`
      };
    }
  }

  return { valid: true, mapping: normalized };
}

async function getResolvedPriorityFieldMapping() {
  const fields = await getAllFields();
  const byId = new Map(fields.map((field) => [String(field.id), field]));
  const stored = await getStoredMapping();

  if (stored && hasCompleteMapping(stored)) {
    const validStored = PRIORITY_FIELD_KEYS.every((key) => byId.has(String(stored[key])));
    if (validStored) {
      return PRIORITY_FIELD_KEYS.reduce((acc, key) => {
        acc[key] = String(stored[key]);
        return acc;
      }, {});
    }
  }

  return null;
}

function getDefaultPriorityScaleConfig() {
  return {
    version: 1,
    scoreOptions: DEFAULT_PRIORITY_SCALE_OPTIONS.map((option) => ({
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

function normalizeScaleConfigInput(inputConfig) {
  const fallback = getDefaultPriorityScaleConfig();
  const scoreInput = Array.isArray(inputConfig?.scoreOptions)
    ? inputConfig.scoreOptions
    : fallback.scoreOptions;

  return {
    version: 1,
    scoreOptions: scoreInput.map(normalizeScaleOption)
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

function validateScaleConfig(config) {
  return validateScaleOptions(config.scoreOptions, 'scoreOptions');
}

async function getStoredPriorityScaleConfig() {
  const current = await storage.get(PRIORITY_SCALE_CONFIG_STORAGE_KEY);
  if (!current || typeof current !== 'object') return null;
  return current;
}

async function ensurePriorityScaleConfigExists() {
  const current = await getStoredPriorityScaleConfig();
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

  const defaults = getDefaultPriorityScaleConfig();
  const next = {
    ...defaults,
    updatedAt: new Date().toISOString(),
    updatedBy: current ? 'system-migration' : 'system-default'
  };
  await storage.set(PRIORITY_SCALE_CONFIG_STORAGE_KEY, next);
  return next;
}

async function getScaleDefaultValues() {
  const config = await ensurePriorityScaleConfigExists();
  const defaultValue = Number(config?.scoreOptions?.[0]?.value) || 1;
  return {
    benefitDefault: defaultValue,
    urgencyDefault: defaultValue,
    ambitionDefault: defaultValue
  };
}

function getDefaultThresholdConfig() {
  return {
    version: 1,
    ...DEFAULT_PRIORITY_THRESHOLDS,
    updatedAt: null,
    updatedBy: ''
  };
}

async function ensurePriorityThresholdConfigExists() {
  const current = await storage.get(PRIORITY_THRESHOLD_CONFIG_STORAGE_KEY);
  if (current && typeof current === 'object') {
    const validationError = validateThresholds(current);
    if (!validationError) {
      return {
        version: 1,
        ...normalizeThresholds(current),
        updatedAt: current.updatedAt || null,
        updatedBy: String(current.updatedBy || '')
      };
    }
  }

  const defaults = getDefaultThresholdConfig();
  const next = {
    ...defaults,
    updatedAt: new Date().toISOString(),
    updatedBy: current ? 'system-migration' : 'system-default'
  };
  await storage.set(PRIORITY_THRESHOLD_CONFIG_STORAGE_KEY, next);
  return next;
}

function sanitizeExplanation(value) {
  return String(value || '').trim().slice(0, EXPLANATION_MAX_LENGTH);
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
    route`/rest/api/3/issuetype/${issueTypeId}/properties/${PRIORITY_ISSUETYPE_PROPERTY_KEY}`,
    { method: 'GET' }
  );

  if (response.status === 404) return { enabled: false, updatedAt: null };

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to read issue type property: ${error}`);
  }

  const property = await response.json();
  const value = property?.value?.[PRIORITY_ISSUETYPE_ENABLED_FIELD];
  const updatedAt = property?.value?.updatedAt || null;
  return { enabled: String(value) === 'true', updatedAt };
}

async function setIssueTypeEnabled(issueTypeId, enabled, updatedAt) {
  const response = await api.asApp().requestJira(
    route`/rest/api/3/issuetype/${issueTypeId}/properties/${PRIORITY_ISSUETYPE_PROPERTY_KEY}`,
    {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        [PRIORITY_ISSUETYPE_ENABLED_FIELD]: enabled ? 'true' : 'false',
        updatedAt
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update issue type property: ${error}`);
  }
}

async function getCachedUserMap() {
  const cached = await storage.get(PRIORITY_USER_CACHE_STORAGE_KEY);
  if (!cached || typeof cached !== 'object') return {};
  return cached;
}

async function setCachedUserMap(userMap) {
  await storage.set(PRIORITY_USER_CACHE_STORAGE_KEY, userMap);
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

export async function verifyPriorityFieldMapping() {
  try {
    const mapping = await getResolvedPriorityFieldMapping();
    if (!mapping || !hasCompleteMapping(mapping)) {
      return {
        success: false,
        error: 'Priority field mapping is not configured. Open Priority Calculator Configuration and map fields.'
      };
    }

    const fields = await getAllFields();
    const byId = new Map(fields.map((field) => [String(field.id), field]));

    const fieldMeta = PRIORITY_FIELD_KEYS.reduce((acc, key) => {
      acc[key] = byId.get(String(mapping[key])) || null;
      return acc;
    }, {});

    const missingKeys = Object.entries(fieldMeta)
      .filter(([, field]) => !field)
      .map(([key]) => key);

    if (missingKeys.length > 0) {
      return {
        success: false,
        error: `Mapped field(s) missing: ${missingKeys.join(', ')}`
      };
    }

    const nonNumber = NUMBER_MAPPING_KEYS
      .filter((key) => !isNumberCustomField(fieldMeta[key]))
      .map((key) => `${key}=${fieldMeta[key]?.name} (${fieldMeta[key]?.id})`);

    if (nonNumber.length > 0) {
      return {
        success: false,
        error: `Mapped score field(s) are not number custom fields: ${nonNumber.join('; ')}`
      };
    }

    const nonLabelText = LABEL_MAPPING_KEYS
      .filter((key) => !isSingleSelectCustomField(fieldMeta[key]))
      .map((key) => `${key}=${fieldMeta[key]?.name} (${fieldMeta[key]?.id})`);

    if (nonLabelText.length > 0) {
      return {
        success: false,
        error: `Mapped label field(s) are not single-select custom fields: ${nonLabelText.join('; ')}`
      };
    }

    const nonText = TEXT_MAPPING_KEYS
      .filter((key) => !isTextCustomField(fieldMeta[key]))
      .map((key) => `${key}=${fieldMeta[key]?.name} (${fieldMeta[key]?.id})`);

    if (nonText.length > 0) {
      return {
        success: false,
        error: `Mapped explanation field(s) are not text custom fields: ${nonText.join('; ')}`
      };
    }

    return {
      success: true,
      mapping,
      fields: PRIORITY_FIELD_KEYS.reduce((acc, key) => {
        acc[key] = {
          id: String(fieldMeta[key].id),
          name: String(fieldMeta[key].name || '')
        };
        return acc;
      }, {})
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getPriorityScaleConfig() {
  try {
    const config = await ensurePriorityScaleConfigExists();
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function savePriorityScaleConfig(config, actorAccountId = '') {
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
    await storage.set(PRIORITY_SCALE_CONFIG_STORAGE_KEY, next);
    return { success: true, config: next };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function resetPriorityScaleConfig(actorAccountId = '') {
  try {
    const defaults = getDefaultPriorityScaleConfig();
    const next = {
      ...defaults,
      updatedAt: new Date().toISOString(),
      updatedBy: String(actorAccountId || '')
    };
    await storage.set(PRIORITY_SCALE_CONFIG_STORAGE_KEY, next);
    return { success: true, config: next };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getPriorityThresholdConfig() {
  try {
    const config = await ensurePriorityThresholdConfigExists();
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function savePriorityThresholdConfig(config, actorAccountId = '') {
  try {
    const validationError = validateThresholds(config || {});
    if (validationError) return { success: false, error: validationError };

    const next = {
      version: 1,
      ...normalizeThresholds(config || {}),
      updatedAt: new Date().toISOString(),
      updatedBy: String(actorAccountId || '')
    };

    await storage.set(PRIORITY_THRESHOLD_CONFIG_STORAGE_KEY, next);
    return { success: true, config: next };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function resetPriorityThresholdConfig(actorAccountId = '') {
  try {
    const defaults = getDefaultThresholdConfig();
    const next = {
      ...defaults,
      updatedAt: new Date().toISOString(),
      updatedBy: String(actorAccountId || '')
    };

    await storage.set(PRIORITY_THRESHOLD_CONFIG_STORAGE_KEY, next);
    return { success: true, config: next };
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

export async function getPriorityVisibilityConfig() {
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

export async function savePriorityVisibilityConfig(enabledIssueTypeIds) {
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

export async function getAvailablePriorityFields() {
  try {
    const fields = await getAllFields();
    const normalized = fields
      .filter((field) => isCustomField(field))
      .map((field) => ({
        id: String(field.id),
        name: field.name,
        description: field.description || '',
        schemaType: String(field?.schema?.type || ''),
        customType: String(field?.schema?.custom || '')
      }))
      .sort((a, b) => {
        const nameCompare = a.name.localeCompare(b.name);
        if (nameCompare !== 0) return nameCompare;
        return a.id.localeCompare(b.id);
      });

    const numberFields = normalized.filter((field) => field.schemaType === 'number');
    const textFields = normalized.filter((field) => field.schemaType === 'string');
    const singleSelectFields = normalized.filter((field) => isSingleSelectCustomField(field));
    const singleLineTextFields = textFields.filter((field) => isSingleLineTextCustomField(field));
    const textAreaFields = textFields.filter((field) => isTextareaCustomField(field));

    return {
      success: true,
      fields: normalized,
      numberFields,
      singleSelectFields,
      textFields,
      singleLineTextFields,
      textAreaFields
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getPriorityFieldMapping() {
  try {
    const mapping = await getResolvedPriorityFieldMapping();
    return { success: true, mapping };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function savePriorityFieldMapping(mapping) {
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

    for (const [key, config] of Object.entries(PRIORITY_FIELDS)) {
      let field = fields.find(
        (candidate) =>
          candidate.name === config.name &&
          fieldMatchesManagedType(candidate, config.type) &&
          MANAGED_DESCRIPTION_MARKERS.some((marker) =>
            String(candidate.description || '').includes(marker)
          )
      );

      if (!field) {
        field = await createCustomField(config.name, config.description, config.type);
        createdCount += 1;
      }

      if (config.type === 'single_select') {
        await ensureMoscowLabelOptions(String(field.id), config.name);
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

export async function savePriorityToIssue(issueKey, values) {
  if (!issueKey) {
    return { success: false, error: 'Issue key is missing.' };
  }

  try {
    const mapping = await getResolvedPriorityFieldMapping();
    if (!mapping || !hasCompleteMapping(mapping)) {
      return {
        success: false,
        error: 'Priority field mapping is not configured. Open Priority Calculator Configuration and map fields.'
      };
    }

    const allFields = await getAllFields();
    const byId = new Map(allFields.map((field) => [String(field.id), field]));
    const benefitExplanationField = byId.get(String(mapping.BENEFIT_EXPLANATION));
    const urgencyExplanationField = byId.get(String(mapping.URGENCY_EXPLANATION));
    const ambitionExplanationField = byId.get(String(mapping.AMBITION_EXPLANATION));
    const moscowLabelField = byId.get(String(mapping.MOSCOW_LABEL));
    const moscowLabelOption = await getMoscowLabelFieldOption(
      String(mapping.MOSCOW_LABEL),
      String(moscowLabelField?.name || 'Prioriteitslabel'),
      values?.moscowLabel
    );

    const payload = {
      fields: {
        [mapping.BENEFIT_SCORE]: Number(values?.benefitScore),
        [mapping.URGENCY_SCORE]: Number(values?.urgencyScore),
        [mapping.AMBITION_SCORE]: Number(values?.ambitionScore),
        [mapping.TOTAL_SCORE]: Number(values?.totalScore),
        [mapping.MOSCOW_LABEL]: moscowLabelOption
          ? { id: moscowLabelOption.id }
          : null,
        [mapping.BENEFIT_EXPLANATION]: toJiraTextValue(
          sanitizeExplanation(values?.benefitExplanation),
          benefitExplanationField
        ),
        [mapping.URGENCY_EXPLANATION]: toJiraTextValue(
          sanitizeExplanation(values?.urgencyExplanation),
          urgencyExplanationField
        ),
        [mapping.AMBITION_EXPLANATION]: toJiraTextValue(
          sanitizeExplanation(values?.ambitionExplanation),
          ambitionExplanationField
        )
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

export async function getPriorityStateFromIssue(issueKey) {
  if (!issueKey) {
    return { success: false, error: 'Issue key is missing.' };
  }

  try {
    const defaults = await getScaleDefaultValues();
    const mapping = await getResolvedPriorityFieldMapping();
    if (!mapping || !hasCompleteMapping(mapping)) {
      return {
        success: false,
        error: 'Priority field mapping is not configured. Open Priority Calculator Configuration and map fields.'
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
        benefitScore: Number(fields[mapping.BENEFIT_SCORE]) || defaults.benefitDefault,
        urgencyScore: Number(fields[mapping.URGENCY_SCORE]) || defaults.urgencyDefault,
        ambitionScore: Number(fields[mapping.AMBITION_SCORE]) || defaults.ambitionDefault,
        totalScore: Number(fields[mapping.TOTAL_SCORE]) || null,
        moscowLabel: fromJiraMoscowValue(fields[mapping.MOSCOW_LABEL]),
        benefitExplanation: fromJiraTextValue(fields[mapping.BENEFIT_EXPLANATION]),
        urgencyExplanation: fromJiraTextValue(fields[mapping.URGENCY_EXPLANATION]),
        ambitionExplanation: fromJiraTextValue(fields[mapping.AMBITION_EXPLANATION])
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function appendPriorityCalculationLog(entry) {
  try {
    const current = await storage.get(PRIORITY_CALC_LOGS_STORAGE_KEY);
    const logs = Array.isArray(current) ? current : [];
    const next = [
      {
        timestamp: new Date().toISOString(),
        issueKey: String(entry?.issueKey || ''),
        benefitScore: Number(entry?.benefitScore) || 1,
        urgencyScore: Number(entry?.urgencyScore) || 1,
        ambitionScore: Number(entry?.ambitionScore) || 1,
        totalScore: Number(entry?.totalScore) || 1,
        moscowLabel: String(entry?.moscowLabel || ''),
        actorAccountId: String(entry?.actorAccountId || ''),
        actorName: String(entry?.actorName || ''),
        origin: String(entry?.origin || '')
      },
      ...logs
    ].slice(0, MAX_LOG_ENTRIES);

    await storage.set(PRIORITY_CALC_LOGS_STORAGE_KEY, next);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getPriorityCalculationLogs(limit = 100) {
  try {
    const current = await storage.get(PRIORITY_CALC_LOGS_STORAGE_KEY);
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

export async function getPriorityCalculationLogsForIssue(issueKey, limit = 50) {
  try {
    const normalizedIssueKey = String(issueKey || '').trim();
    if (!normalizedIssueKey) {
      return { success: false, error: 'Issue key is missing.' };
    }

    const current = await storage.get(PRIORITY_CALC_LOGS_STORAGE_KEY);
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
