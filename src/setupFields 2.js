// Custom Fields Setup for WSJF

import api, { route } from '@forge/api';
import { WSJF_FIELDS } from './utils/constants';

const WSJF_ISSUETYPE_PROPERTY_KEY = 'wsjf-calculator';
const WSJF_ISSUETYPE_ENABLED_FIELD = 'enabled';

/**
 * Create a custom field in Jira
 * @param {string} name - Field name
 * @param {string} description - Field description
 * @param {string} type - Field type (number, text, etc.)
 * @returns {Promise<Object>} Created field object
 */
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
    const payload = {
      name,
      description,
      type: fieldType
    };

    if (searcherKey) {
      payload.searcherKey = searcherKey;
    }

    const response = await api.asApp().requestJira(route`/rest/api/3/field`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      return await response.json();
    }

    const errorText = await response.text();
    lastError = errorText;

    // Some Jira sites reject specific searchers. Try the next candidate.
    if (response.status === 400 && errorText.includes('Unknown searcher chosen')) {
      continue;
    }

    console.error(`Failed to create field ${name}:`, errorText);
    throw new Error(`Failed to create field: ${errorText}`);
  }

  console.error(`Failed to create field ${name}:`, lastError);
  throw new Error(`Failed to create field: ${lastError}`);
}

/**
 * Check if custom field already exists
 * @param {string} fieldName 
 * @returns {Promise<Object|null>} Field object if exists, null otherwise
 */
async function getExistingField(fieldName) {
  const response = await api.asApp().requestJira(route`/rest/api/3/field`, {
    method: 'GET'
  });
  
  if (response.ok) {
    const fields = await response.json();
    return fields.find(f => f.name === fieldName);
  }
  
  return null;
}

async function getWSJFFieldIdsByName() {
  const response = await api.asApp().requestJira(route`/rest/api/3/field`, {
    method: 'GET'
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch fields: ${error}`);
  }

  const fields = await response.json();
  const fieldIds = {};

  for (const [key, config] of Object.entries(WSJF_FIELDS)) {
    const match = fields.find((f) => f.name === config.name);
    if (match?.id) {
      fieldIds[key] = match.id;
    }
  }

  return fieldIds;
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
    route`/rest/api/3/issuetype/${issueTypeId}/properties/${WSJF_ISSUETYPE_PROPERTY_KEY}`,
    { method: 'GET' }
  );

  if (response.status === 404) {
    return { enabled: false, updatedAt: null };
  }
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to read issue type property: ${error}`);
  }

  const property = await response.json();
  const value = property?.value?.[WSJF_ISSUETYPE_ENABLED_FIELD];
  const updatedAt = property?.value?.updatedAt || null;
  return { enabled: String(value) === 'true', updatedAt };
}

async function setIssueTypeEnabled(issueTypeId, enabled, updatedAt) {
  const response = await api.asApp().requestJira(
    route`/rest/api/3/issuetype/${issueTypeId}/properties/${WSJF_ISSUETYPE_PROPERTY_KEY}`,
    {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        [WSJF_ISSUETYPE_ENABLED_FIELD]: enabled ? 'true' : 'false',
        updatedAt
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update issue type property: ${error}`);
  }
}

export async function getWSJFVisibilityConfig() {
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

    return {
      success: true,
      enabledIssueTypeIds,
      updatedAt
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function saveWSJFVisibilityConfig(enabledIssueTypeIds) {
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
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getJiraIssueTypes() {
  try {
    const issueTypes = await fetchIssueTypes();
    return {
      success: true,
      issueTypes
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Setup all WSJF custom fields
 * @returns {Promise<Object>} Object containing created field IDs
 */
export async function setupCustomFields() {
  const fieldIds = {};
  
  try {
    console.log('Starting WSJF custom fields setup...');
    
    // Create each WSJF field
    for (const [key, fieldConfig] of Object.entries(WSJF_FIELDS)) {
      console.log(`Checking field: ${fieldConfig.name}`);
      
      // Check if field already exists
      let field = await getExistingField(fieldConfig.name);
      
      if (!field) {
        console.log(`Creating field: ${fieldConfig.name}`);
        field = await createCustomField(
          fieldConfig.name,
          fieldConfig.description,
          fieldConfig.type
        );
        console.log(`Created field: ${fieldConfig.name} with ID: ${field.id}`);
      } else {
        console.log(`Field already exists: ${fieldConfig.name} with ID: ${field.id}`);
      }
      
      fieldIds[key] = field.id;
    }
    
    console.log('WSJF custom fields setup completed:', fieldIds);
    return {
      success: true,
      fieldIds: fieldIds
    };
    
  } catch (error) {
    console.error('Error setting up custom fields:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function saveWSJFToIssue(
  issueKey,
  businessValue,
  timeCriticality,
  riskReduction,
  jobSize,
  wsjfScore
) {
  if (!issueKey) {
    return {
      success: false,
      error: 'Issue key is missing.'
    };
  }

  try {
    const fieldIds = await getWSJFFieldIdsByName();
    const missing = Object.keys(WSJF_FIELDS).filter((key) => !fieldIds[key]);

    if (missing.length > 0) {
      return {
        success: false,
        error: `Missing WSJF fields: ${missing.join(', ')}. Run WSJF setup first.`
      };
    }

    const payload = {
      fields: {
        [fieldIds.BUSINESS_VALUE]: Number(businessValue),
        [fieldIds.TIME_CRITICALITY]: Number(timeCriticality),
        [fieldIds.RISK_REDUCTION]: Number(riskReduction),
        [fieldIds.JOB_SIZE]: Number(jobSize),
        [fieldIds.WSJF_SCORE]: Number(wsjfScore)
      }
    };

    const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Issue update failed: ${error}`
      };
    }

    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getWSJFStateFromIssue(issueKey) {
  if (!issueKey) {
    return {
      success: false,
      error: 'Issue key is missing.'
    };
  }

  try {
    const fieldIds = await getWSJFFieldIdsByName();
    const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
      method: 'GET'
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to load issue: ${error}`
      };
    }

    const issue = await response.json();
    const fields = issue.fields || {};

    const values = {
      businessValue: Number(fields[fieldIds.BUSINESS_VALUE]) || 1,
      timeCriticality: Number(fields[fieldIds.TIME_CRITICALITY]) || 1,
      riskReduction: Number(fields[fieldIds.RISK_REDUCTION]) || 1,
      jobSize: Number(fields[fieldIds.JOB_SIZE]) || 1,
      wsjfScore: Number(fields[fieldIds.WSJF_SCORE]) || null
    };

    return {
      success: true,
      values
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all WSJF field values from an issue
 * @param {string} issueKey 
 * @returns {Promise<Object>} Object containing all WSJF values
 */
export async function getWSJFFieldValues(issueKey) {
  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
    method: 'GET'
  });
  
  if (!response.ok) {
    throw new Error('Failed to get issue');
  }
  
  const issue = await response.json();
  const fields = issue.fields;
  
  // Find WSJF fields in the issue (field IDs will be dynamic)
  const wsjfValues = {};
  
  for (const [fieldId, value] of Object.entries(fields)) {
    if (fieldId.startsWith('customfield_')) {
      // Match field names to our WSJF fields
      const fieldMeta = await getFieldMetadata(fieldId);
      if (fieldMeta && fieldMeta.name) {
        for (const [key, config] of Object.entries(WSJF_FIELDS)) {
          if (config.name === fieldMeta.name) {
            wsjfValues[key] = value;
          }
        }
      }
    }
  }
  
  return wsjfValues;
}

/**
 * Get field metadata
 * @param {string} fieldId 
 * @returns {Promise<Object>}
 */
async function getFieldMetadata(fieldId) {
  const response = await api.asApp().requestJira(route`/rest/api/3/field/${fieldId}`, {
    method: 'GET'
  });
  
  if (response.ok) {
    return await response.json();
  }
  
  return null;
}
