import Resolver from '@forge/resolver';
import { calculateRiskScore, getRiskPriority } from './utils/riskCalculator';
import {
  appendRiskCalculationLog,
  getRiskCalculationLogs,
  getRiskCalculationLogsForIssue,
  getRiskScaleConfig,
  getLegacyRiskValueSummary,
  getAvailableRiskFields,
  getRiskFieldMapping,
  saveRiskFieldMapping,
  verifyRiskFieldMapping,
  saveRiskScaleConfig,
  getJiraIssueTypes,
  getRiskVisibilityConfig,
  migrateLegacyRiskValues,
  resetRiskScaleConfig,
  getRiskStateFromIssue,
  saveRiskVisibilityConfig,
  saveRiskToIssue,
  setupCustomFields
} from './setupFields';

const resolver = new Resolver();

resolver.define('calculateRiskScore', async ({ payload }) => {
  const { impact = 1, likelihood = 1 } = payload || {};
  const riskScore = calculateRiskScore(impact, likelihood);

  return {
    success: true,
    riskScore,
    priority: getRiskPriority(riskScore)
  };
});

resolver.define('setupFields', async () => {
  return setupCustomFields();
});

resolver.define('getRiskState', async ({ payload }) => {
  const { issueKey } = payload || {};
  return getRiskStateFromIssue(issueKey);
});

resolver.define('getIssueTypes', async () => {
  return getJiraIssueTypes();
});

resolver.define('getRiskFields', async () => {
  return getAvailableRiskFields();
});

resolver.define('getRiskMapping', async () => {
  return getRiskFieldMapping();
});

resolver.define('getRiskScaleConfig', async () => {
  return getRiskScaleConfig();
});

resolver.define('saveRiskMapping', async ({ payload }) => {
  const { mapping = {} } = payload || {};
  return saveRiskFieldMapping(mapping);
});

resolver.define('verifyRiskMapping', async () => {
  return verifyRiskFieldMapping();
});

resolver.define('saveRiskScaleConfig', async ({ payload, context }) => {
  const { config = {} } = payload || {};
  const actorAccountId =
    context?.accountId ||
    context?.principal?.accountId ||
    '';
  return saveRiskScaleConfig(config, actorAccountId);
});

resolver.define('resetRiskScaleConfig', async ({ context }) => {
  const actorAccountId =
    context?.accountId ||
    context?.principal?.accountId ||
    '';
  return resetRiskScaleConfig(actorAccountId);
});

resolver.define('getLegacyRiskSummary', async ({ payload }) => {
  const { limit = 100 } = payload || {};
  return getLegacyRiskValueSummary(limit);
});

resolver.define('migrateLegacyRiskValues', async ({ payload }) => {
  const { limit = 200 } = payload || {};
  return migrateLegacyRiskValues(limit);
});

resolver.define('getRiskConfig', async () => {
  return getRiskVisibilityConfig();
});

resolver.define('saveRiskConfig', async ({ payload }) => {
  const { enabledIssueTypeIds = [] } = payload || {};
  return saveRiskVisibilityConfig(enabledIssueTypeIds);
});

resolver.define('saveRisk', async ({ payload, context }) => {
  const {
    issueKey,
    impact = 1,
    likelihood = 1,
    origin = 'unknown',
    actorAccountId = '',
    actorName = ''
  } = payload || {};
  const riskScore = calculateRiskScore(impact, likelihood);
  const priority = getRiskPriority(riskScore);
  const resolvedActorAccountId =
    actorAccountId ||
    context?.accountId ||
    context?.principal?.accountId ||
    '';

  const saveResult = await saveRiskToIssue(
    issueKey,
    impact,
    likelihood,
    riskScore
  );

  if (!saveResult.success) {
    return saveResult;
  }

  await appendRiskCalculationLog({
    issueKey,
    impact,
    likelihood,
    riskScore,
    priority,
    actorAccountId: resolvedActorAccountId,
    actorName,
    origin
  });

  return {
    success: true,
    riskScore,
    priority
  };
});

resolver.define('getRiskLogs', async ({ payload }) => {
  const { limit = 100 } = payload || {};
  return getRiskCalculationLogs(limit);
});

resolver.define('getRiskLogsForIssue', async ({ payload }) => {
  const { issueKey, limit = 50 } = payload || {};
  return getRiskCalculationLogsForIssue(issueKey, limit);
});

export const handler = resolver.getDefinitions();
