// Priority score calculation logic

import { DEFAULT_PRIORITY_THRESHOLDS, DEFAULT_VALUE } from './constants';

function toSafePositiveNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return DEFAULT_VALUE;
  return numeric;
}

export function calculateTotalScore(benefitScore, urgencyScore, ambitionScore) {
  const safeBenefit = toSafePositiveNumber(benefitScore);
  const safeUrgency = toSafePositiveNumber(urgencyScore);
  const safeAmbition = toSafePositiveNumber(ambitionScore);
  return safeBenefit + safeUrgency + safeAmbition;
}

export function normalizeThresholds(input) {
  const must = Number(input?.must);
  const should = Number(input?.should);
  const could = Number(input?.could);

  const fallback = DEFAULT_PRIORITY_THRESHOLDS;

  return {
    must: Number.isFinite(must) ? must : fallback.must,
    should: Number.isFinite(should) ? should : fallback.should,
    could: Number.isFinite(could) ? could : fallback.could
  };
}

export function validateThresholds(input) {
  const thresholds = normalizeThresholds(input);

  if (thresholds.could < 0) {
    return 'could must be 0 or greater.';
  }

  if (thresholds.should < thresholds.could) {
    return 'should must be greater than or equal to could.';
  }

  if (thresholds.must < thresholds.should) {
    return 'must must be greater than or equal to should.';
  }

  return null;
}

export function getMoscowLabel(totalScore, customThresholds) {
  const score = Number(totalScore) || 0;
  const thresholds = normalizeThresholds(customThresholds);

  if (score >= thresholds.must) return 'MUST';
  if (score >= thresholds.should) return 'SHOULD';
  if (score >= thresholds.could) return 'COULD';
  return 'WONT';
}
