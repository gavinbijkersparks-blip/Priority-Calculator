// Priority Calculator constants and defaults

export const FIBONACCI_VALUES = [1, 2, 3, 5, 8, 13, 20, 40, 100];

export const DEFAULT_PRIORITY_SCALE_OPTIONS = [
  { value: 1, labelDefault: 'Very low', labels: { en: 'Very low', nl: 'Zeer laag' } },
  { value: 2, labelDefault: 'Low', labels: { en: 'Low', nl: 'Laag' } },
  { value: 3, labelDefault: 'Limited', labels: { en: 'Limited', nl: 'Beperkt' } },
  { value: 5, labelDefault: 'Medium', labels: { en: 'Medium', nl: 'Gemiddeld' } },
  { value: 8, labelDefault: 'High', labels: { en: 'High', nl: 'Hoog' } },
  { value: 13, labelDefault: 'Very high', labels: { en: 'Very high', nl: 'Zeer hoog' } },
  { value: 20, labelDefault: 'Critical', labels: { en: 'Critical', nl: 'Kritiek' } },
  { value: 40, labelDefault: 'Extreme', labels: { en: 'Extreme', nl: 'Extreem' } },
  { value: 100, labelDefault: 'Maximum', labels: { en: 'Maximum', nl: 'Maximaal' } }
];

export const DEFAULT_PRIORITY_THRESHOLDS = {
  must: 30,
  should: 20,
  could: 10
};

export const MOSCOW_LABEL_OPTIONS = ['WONT', 'COULD', 'SHOULD', 'MUST'];

export const PRIORITY_FIELDS = {
  BENEFIT_SCORE: {
    name: 'Priority Calculator - Opbrengst score',
    key: 'customfield_priority_benefit_score',
    description:
      'Managed by Priority Calculator. Score voor verwachte opbrengst.',
    type: 'number'
  },
  URGENCY_SCORE: {
    name: 'Priority Calculator - Urgentie score',
    key: 'customfield_priority_urgency_score',
    description:
      'Managed by Priority Calculator. Score voor urgentie.',
    type: 'number'
  },
  AMBITION_SCORE: {
    name: 'Priority Calculator - Ambitie score',
    key: 'customfield_priority_ambition_score',
    description:
      'Managed by Priority Calculator. Score voor ambitie.',
    type: 'number'
  },
  TOTAL_SCORE: {
    name: 'Priority Calculator - Totaal score',
    key: 'customfield_priority_total_score',
    description:
      'Managed by Priority Calculator. Berekende totaalscore = opbrengst + urgentie + ambitie.',
    type: 'number'
  },
  MOSCOW_LABEL: {
    name: 'Priority Calculator - Prioriteitslabel',
    key: 'customfield_priority_moscow_label',
    description:
      'Managed by Priority Calculator. Berekend label voor zoeken en filteren: WONT, COULD, SHOULD of MUST.',
    type: 'single_select'
  },
  BENEFIT_EXPLANATION: {
    name: 'Priority Calculator - Opbrengst toelichting',
    key: 'customfield_priority_benefit_explanation',
    description:
      'Managed by Priority Calculator. Optionele toelichting voor opbrengst score.',
    type: 'textarea'
  },
  URGENCY_EXPLANATION: {
    name: 'Priority Calculator - Urgentie toelichting',
    key: 'customfield_priority_urgency_explanation',
    description:
      'Managed by Priority Calculator. Optionele toelichting voor urgentie score.',
    type: 'textarea'
  },
  AMBITION_EXPLANATION: {
    name: 'Priority Calculator - Ambitie toelichting',
    key: 'customfield_priority_ambition_explanation',
    description:
      'Managed by Priority Calculator. Optionele toelichting voor ambitie score.',
    type: 'textarea'
  }
};

export const DEFAULT_VALUE = 1;
export const EXPLANATION_MAX_LENGTH = 4000;
