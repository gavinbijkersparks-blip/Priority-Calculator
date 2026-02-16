// Risk Score Calculation Logic

import { DEFAULT_VALUE, RISK_COLORS } from './constants';

/**
 * Calculate Risk Score.
 * Risk Score = Impact x Likelihood
 *
 * @param {number} impact
 * @param {number} likelihood
 * @returns {number} Risk score
 */
export function calculateRiskScore(impact, likelihood) {
  const safeImpact = parseFloat(impact) || DEFAULT_VALUE;
  const safeLikelihood = parseFloat(likelihood) || DEFAULT_VALUE;
  return safeImpact * safeLikelihood;
}

/**
 * Get color code based on Risk Score.
 * @param {number} riskScore
 * @returns {string} Color hex code
 */
export function getRiskColor(riskScore) {
  if (riskScore >= 400) return RISK_COLORS.HIGH;
  if (riskScore >= 100) return RISK_COLORS.MEDIUM;
  return RISK_COLORS.LOW;
}

/**
 * Get Risk priority label.
 * @param {number} riskScore
 * @returns {string} Priority label
 */
export function getRiskPriority(riskScore) {
  if (riskScore >= 400) return 'HIGH';
  if (riskScore >= 100) return 'MEDIUM';
  return 'LOW';
}

/**
 * Validate if value is a valid Fibonacci number.
 * @param {number} value
 * @returns {boolean}
 */
export function isValidFibonacci(value) {
  const VALID_VALUES = [1, 2, 3, 5, 8, 13, 20, 40, 100];
  return VALID_VALUES.includes(parseInt(value, 10));
}
