import Resolver from '@forge/resolver';
import {
  appendPriorityCalculationLog,
  getJiraIssueTypes,
  getPriorityCalculationLogs,
  getPriorityCalculationLogsForIssue,
  getPriorityFieldMapping,
  getPriorityScaleConfig,
  getPriorityStateFromIssue,
  getPriorityThresholdConfig,
  getPriorityVisibilityConfig,
  getAvailablePriorityFields,
  resetPriorityScaleConfig,
  resetPriorityThresholdConfig,
  savePriorityFieldMapping,
  savePriorityScaleConfig,
  savePriorityThresholdConfig,
  savePriorityToIssue,
  savePriorityVisibilityConfig,
  setupCustomFields,
  verifyPriorityFieldMapping
} from './setupFields';
import { calculateTotalScore, getMoscowLabel } from './utils/priorityCalculator';

const resolver = new Resolver();

resolver.define('calculatePriorityScore', async ({ payload }) => {
  const {
    benefitScore = 1,
    urgencyScore = 1,
    ambitionScore = 1,
    thresholds = null
  } = payload || {};

  const totalScore = calculateTotalScore(benefitScore, urgencyScore, ambitionScore);

  return {
    success: true,
    totalScore,
    moscowLabel: getMoscowLabel(totalScore, thresholds)
  };
});

resolver.define('setupPriorityFields', async () => {
  return setupCustomFields();
});

resolver.define('getPriorityState', async ({ payload }) => {
  const { issueKey } = payload || {};
  return getPriorityStateFromIssue(issueKey);
});

resolver.define('getIssueTypes', async () => {
  return getJiraIssueTypes();
});

resolver.define('getPriorityFields', async () => {
  return getAvailablePriorityFields();
});

resolver.define('getPriorityMapping', async () => {
  return getPriorityFieldMapping();
});

resolver.define('getPriorityScaleConfig', async () => {
  return getPriorityScaleConfig();
});

resolver.define('savePriorityMapping', async ({ payload }) => {
  const { mapping = {} } = payload || {};
  return savePriorityFieldMapping(mapping);
});

resolver.define('verifyPriorityMapping', async () => {
  return verifyPriorityFieldMapping();
});

resolver.define('savePriorityScaleConfig', async ({ payload, context }) => {
  const { config = {} } = payload || {};
  const actorAccountId =
    context?.accountId ||
    context?.principal?.accountId ||
    '';
  return savePriorityScaleConfig(config, actorAccountId);
});

resolver.define('resetPriorityScaleConfig', async ({ context }) => {
  const actorAccountId =
    context?.accountId ||
    context?.principal?.accountId ||
    '';
  return resetPriorityScaleConfig(actorAccountId);
});

resolver.define('getPriorityThresholdConfig', async () => {
  return getPriorityThresholdConfig();
});

resolver.define('savePriorityThresholdConfig', async ({ payload, context }) => {
  const { config = {} } = payload || {};
  const actorAccountId =
    context?.accountId ||
    context?.principal?.accountId ||
    '';
  return savePriorityThresholdConfig(config, actorAccountId);
});

resolver.define('resetPriorityThresholdConfig', async ({ context }) => {
  const actorAccountId =
    context?.accountId ||
    context?.principal?.accountId ||
    '';
  return resetPriorityThresholdConfig(actorAccountId);
});

resolver.define('getPriorityConfig', async () => {
  return getPriorityVisibilityConfig();
});

resolver.define('savePriorityConfig', async ({ payload }) => {
  const { enabledIssueTypeIds = [] } = payload || {};
  return savePriorityVisibilityConfig(enabledIssueTypeIds);
});

resolver.define('savePriority', async ({ payload, context }) => {
  const {
    issueKey,
    benefitScore = 1,
    urgencyScore = 1,
    ambitionScore = 1,
    benefitExplanation = '',
    urgencyExplanation = '',
    ambitionExplanation = '',
    origin = 'unknown',
    actorAccountId = '',
    actorName = ''
  } = payload || {};

  const thresholdConfig = await getPriorityThresholdConfig();
  const thresholds = thresholdConfig?.success ? thresholdConfig.config : null;

  const totalScore = calculateTotalScore(benefitScore, urgencyScore, ambitionScore);
  const moscowLabel = getMoscowLabel(totalScore, thresholds);
  const resolvedActorAccountId =
    actorAccountId ||
    context?.accountId ||
    context?.principal?.accountId ||
    '';

  const saveResult = await savePriorityToIssue(issueKey, {
    benefitScore,
    urgencyScore,
    ambitionScore,
    totalScore,
    benefitExplanation,
    urgencyExplanation,
    ambitionExplanation
  });

  if (!saveResult.success) {
    return saveResult;
  }

  await appendPriorityCalculationLog({
    issueKey,
    benefitScore,
    urgencyScore,
    ambitionScore,
    totalScore,
    moscowLabel,
    actorAccountId: resolvedActorAccountId,
    actorName,
    origin
  });

  return {
    success: true,
    totalScore,
    moscowLabel
  };
});

resolver.define('getPriorityLogs', async ({ payload }) => {
  const { limit = 100 } = payload || {};
  return getPriorityCalculationLogs(limit);
});

resolver.define('getPriorityLogsForIssue', async ({ payload }) => {
  const { issueKey, limit = 50 } = payload || {};
  return getPriorityCalculationLogsForIssue(issueKey, limit);
});

export const handler = resolver.getDefinitions();
