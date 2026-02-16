// Risk Score Constants and Configuration

export const FIBONACCI_VALUES = [1, 2, 3, 5, 8, 13, 20, 40, 100];

export const DEFAULT_RISK_SCALE_OPTIONS = [
  { value: 1, labelDefault: 'Negligible', labels: { en: 'Negligible', nl: 'Verwaarloosbaar' } },
  { value: 2, labelDefault: 'Very low', labels: { en: 'Very low', nl: 'Zeer laag' } },
  { value: 3, labelDefault: 'Low', labels: { en: 'Low', nl: 'Laag' } },
  { value: 5, labelDefault: 'Limited', labels: { en: 'Limited', nl: 'Beperkt' } },
  { value: 8, labelDefault: 'Medium', labels: { en: 'Medium', nl: 'Gemiddeld' } },
  { value: 13, labelDefault: 'High', labels: { en: 'High', nl: 'Hoog' } },
  { value: 20, labelDefault: 'Very high', labels: { en: 'Very high', nl: 'Zeer hoog' } },
  { value: 40, labelDefault: 'Critical', labels: { en: 'Critical', nl: 'Kritiek' } },
  { value: 100, labelDefault: 'Extreme', labels: { en: 'Extreme', nl: 'Extreem' } }
];

export const RISK_FIELDS = {
  IMPACT: {
    name: 'Impact',
    key: 'customfield_impact',
    description:
      'Managed by Risk Score Calculator. Impact als dit risico zich voordoet (waarden configureerbaar in app admin).',
    type: 'number'
  },
  LIKELIHOOD: {
    name: 'Likelihood',
    key: 'customfield_likelihood',
    description:
      'Managed by Risk Score Calculator. Waarschijnlijkheid dat dit risico zich voordoet (waarden configureerbaar in app admin).',
    type: 'number'
  },
  RISK_SCORE: {
    name: 'Risk Score',
    key: 'customfield_risk_score',
    description:
      'Managed by Risk Score Calculator. Automatisch berekende Risk Score = Impact x Likelihood.',
    type: 'number'
  }
};

export const DEFAULT_VALUE = 1;

export const RISK_COLORS = {
  HIGH: '#FF5630',
  MEDIUM: '#FFAB00',
  LOW: '#36B37E'
};
