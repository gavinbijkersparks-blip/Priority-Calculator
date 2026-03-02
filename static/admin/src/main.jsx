import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { invoke, view } from '@forge/bridge';
import Button from '@atlaskit/button/new';
import '@atlaskit/css-reset';
import './styles.css';

const I18N = {
  en: {
    title: 'Priority Dashboard Configuration',
    loadError: 'Load error',
    saveError: 'Save error',
    fieldMappingTitle: 'Field Mapping',
    fieldMappingSubtitle: 'Map the dashboard to Jira fields. Score fields must be number fields, explanation fields must be text fields.',
    loadingFields: 'Loading fields and mapping…',
    selectField: 'Select field',
    saveFieldMapping: 'Save field mapping',
    savingMapping: 'Saving mapping…',
    refreshFields: 'Refresh fields',
    verifyMapping: 'Verify mapping',
    verifyMappingSuccess: 'Mapping is valid.',
    verifyMappingFailed: 'Mapping verification failed.',
    fieldMappingSaved: 'Field mapping saved.',
    fieldMappingSaveFailed: 'Failed to save field mapping.',
    loadFieldsFailed: 'Failed to load available fields.',
    loadMappingFailed: 'Failed to load field mapping.',
    duplicateFieldNamesWarning: 'Warning: duplicate field names detected. Map by field ID, not by name.',
    currentFieldSetup: 'Current field setup',
    technicalDetails: 'Technical field IDs (for Jira admin/support)',
    notSelected: 'Not selected',

    benefitScoreField: 'Opbrengst score field',
    urgencyScoreField: 'Urgentie score field',
    ambitionScoreField: 'Ambitie score field',
    totalScoreField: 'Totaal score field',
    benefitExplanationField: 'Opbrengst toelichting field',
    urgencyExplanationField: 'Urgentie toelichting field',
    ambitionExplanationField: 'Ambitie toelichting field',

    defaultFieldSetupTitle: 'Default Field Setup',
    defaultFieldSetupSubtitle: 'Create app-managed default fields and map them automatically.',
    preparingFields: 'Preparing fields…',
    createDefaultFields: 'Create default fields and map them',
    defaultFieldsCreated: 'Default fields ready',
    defaultFieldsCreatedCount: 'created',
    defaultFieldsReused: 'Default fields ready (reused existing managed fields).',
    defaultFieldsCreatedAndMapped: 'Default fields created and mapped',

    scaleOptionsTitle: 'Score Scale Options',
    scaleOptionsSubtitle: 'Configure the shared score options used for opbrengst, urgentie and ambitie.',
    loadingScaleConfig: 'Loading scale options…',
    scaleConfigSaved: 'Scale options saved.',
    scaleConfigSaveFailed: 'Failed to save scale options.',
    resetScaleOptions: 'Reset to app defaults',
    resetScaleOptionsDone: 'Scale options reset to app defaults.',
    scoreOptions: 'Score options',
    value: 'Value',
    defaultLabel: 'Default label',
    englishLabel: 'English label (optional)',
    dutchLabel: 'Dutch label (optional)',
    addOption: 'Add option',
    remove: 'Remove',
    moveUp: 'Up',
    moveDown: 'Down',
    saveScaleOptions: 'Save scale options',
    savingScaleOptions: 'Saving scale options…',

    thresholdTitle: 'MoSCoW Thresholds',
    thresholdSubtitle: 'Set thresholds for Must, Should and Could. Values below Could become Won\'t.',
    mustThreshold: 'Must threshold',
    shouldThreshold: 'Should threshold',
    couldThreshold: 'Could threshold',
    saveThresholds: 'Save thresholds',
    savingThresholds: 'Saving thresholds…',
    resetThresholds: 'Reset thresholds',
    thresholdSaved: 'Thresholds saved.',
    thresholdSaveFailed: 'Failed to save thresholds.',

    visibilityTitle: 'Visibility Configuration',
    visibilitySubtitle: 'Choose issue types where Priority Dashboard should be visible in the issue sidebar.',
    loadingIssueTypes: 'Loading issue types…',
    saveConfiguration: 'Save configuration',
    savingConfiguration: 'Saving configuration…',
    configurationSavedHidden: 'Configuration saved. Priority Dashboard is hidden for all issue types.',
    configurationSavedEnabled: 'Configuration saved. Priority Dashboard is enabled for',
    issueTypeCountSuffix: 'issue type(s).',
    visibilitySaveFailed: 'Failed to save visibility configuration.',

    calculationLogTitle: 'Calculation Log',
    calculationLogSubtitle: 'Show who calculated priority score, for which issue, and with what values.',
    showCalculationLog: 'Show calculation log',
    loadingLogs: 'Loading logs…',
    noLogsLoaded: 'No calculation logs loaded yet.',
    logsLoadFailed: 'Failed to load calculation logs.',
    time: 'Time',
    issue: 'Issue',
    benefit: 'Opbrengst',
    urgency: 'Urgentie',
    ambition: 'Ambitie',
    total: 'Totaal',
    moscow: 'MoSCoW',
    by: 'By',
    origin: 'Origin',
    unknown: 'Unknown',
    must: 'Must',
    should: 'Should',
    could: 'Could',
    wont: "Won't"
  },
  nl: {
    title: 'Priority Dashboard Configuratie',
    loadError: 'Laadfout',
    saveError: 'Opslagfout',
    fieldMappingTitle: 'Veldkoppeling',
    fieldMappingSubtitle: 'Koppel het dashboard aan Jira-velden. Scorevelden moeten nummervelden zijn, toelichtingsvelden tekstvelden.',
    loadingFields: 'Velden en koppeling laden…',
    selectField: 'Selecteer veld',
    saveFieldMapping: 'Veldkoppeling opslaan',
    savingMapping: 'Koppeling opslaan…',
    refreshFields: 'Velden verversen',
    verifyMapping: 'Koppeling valideren',
    verifyMappingSuccess: 'Koppeling is geldig.',
    verifyMappingFailed: 'Koppelingsvalidatie mislukt.',
    fieldMappingSaved: 'Veldkoppeling opgeslagen.',
    fieldMappingSaveFailed: 'Veldkoppeling opslaan mislukt.',
    loadFieldsFailed: 'Beschikbare velden konden niet worden geladen.',
    loadMappingFailed: 'Veldkoppeling kon niet worden geladen.',
    duplicateFieldNamesWarning: 'Waarschuwing: dubbele veldnamen gedetecteerd. Koppel op veld-ID, niet op naam.',
    currentFieldSetup: 'Huidige veldconfiguratie',
    technicalDetails: 'Technische veld-IDs (voor Jira beheer/support)',
    notSelected: 'Niet geselecteerd',

    benefitScoreField: 'Opbrengst score veld',
    urgencyScoreField: 'Urgentie score veld',
    ambitionScoreField: 'Ambitie score veld',
    totalScoreField: 'Totaal score veld',
    benefitExplanationField: 'Opbrengst toelichting veld',
    urgencyExplanationField: 'Urgentie toelichting veld',
    ambitionExplanationField: 'Ambitie toelichting veld',

    defaultFieldSetupTitle: 'Standaard veldinstellingen',
    defaultFieldSetupSubtitle: 'Maak standaard app-velden aan en koppel ze automatisch.',
    preparingFields: 'Velden voorbereiden…',
    createDefaultFields: 'Standaardvelden maken en koppelen',
    defaultFieldsCreated: 'Standaardvelden gereed',
    defaultFieldsCreatedCount: 'aangemaakt',
    defaultFieldsReused: 'Standaardvelden gereed (bestaande beheerde velden hergebruikt).',
    defaultFieldsCreatedAndMapped: 'Standaardvelden gemaakt en gekoppeld',

    scaleOptionsTitle: 'Score-schaalopties',
    scaleOptionsSubtitle: 'Configureer de gedeelde score-opties voor opbrengst, urgentie en ambitie.',
    loadingScaleConfig: 'Schaalopties laden…',
    scaleConfigSaved: 'Schaalopties opgeslagen.',
    scaleConfigSaveFailed: 'Schaalopties opslaan mislukt.',
    resetScaleOptions: 'Reset naar app-standaarden',
    resetScaleOptionsDone: 'Schaalopties zijn teruggezet naar app-standaarden.',
    scoreOptions: 'Score-opties',
    value: 'Waarde',
    defaultLabel: 'Standaardlabel',
    englishLabel: 'Engels label (optioneel)',
    dutchLabel: 'Nederlands label (optioneel)',
    addOption: 'Optie toevoegen',
    remove: 'Verwijderen',
    moveUp: 'Omhoog',
    moveDown: 'Omlaag',
    saveScaleOptions: 'Schaalopties opslaan',
    savingScaleOptions: 'Schaalopties opslaan…',

    thresholdTitle: 'MoSCoW-drempels',
    thresholdSubtitle: 'Stel drempels in voor Must, Should en Could. Onder Could wordt Won\'t.',
    mustThreshold: 'Must drempel',
    shouldThreshold: 'Should drempel',
    couldThreshold: 'Could drempel',
    saveThresholds: 'Drempels opslaan',
    savingThresholds: 'Drempels opslaan…',
    resetThresholds: 'Drempels resetten',
    thresholdSaved: 'Drempels opgeslagen.',
    thresholdSaveFailed: 'Drempels opslaan mislukt.',

    visibilityTitle: 'Zichtbaarheidsconfiguratie',
    visibilitySubtitle: 'Kies issue types waarvoor Priority Dashboard zichtbaar is in de issue-zijbalk.',
    loadingIssueTypes: 'Issue types laden…',
    saveConfiguration: 'Configuratie opslaan',
    savingConfiguration: 'Configuratie opslaan…',
    configurationSavedHidden: 'Configuratie opgeslagen. Priority Dashboard is verborgen voor alle issue types.',
    configurationSavedEnabled: 'Configuratie opgeslagen. Priority Dashboard is ingeschakeld voor',
    issueTypeCountSuffix: 'issue type(s).',
    visibilitySaveFailed: 'Zichtbaarheidsconfiguratie opslaan mislukt.',

    calculationLogTitle: 'Berekeningslog',
    calculationLogSubtitle: 'Toon wie de prioriteit heeft berekend, voor welk issue en met welke waarden.',
    showCalculationLog: 'Berekeningslog tonen',
    loadingLogs: 'Logs laden…',
    noLogsLoaded: 'Nog geen berekeningslogs geladen.',
    logsLoadFailed: 'Berekeningslogs konden niet worden geladen.',
    time: 'Tijd',
    issue: 'Issue',
    benefit: 'Opbrengst',
    urgency: 'Urgentie',
    ambition: 'Ambitie',
    total: 'Totaal',
    moscow: 'MoSCoW',
    by: 'Door',
    origin: 'Herkomst',
    unknown: 'Onbekend',
    must: 'Must',
    should: 'Should',
    could: 'Could',
    wont: "Won't"
  }
};

const getLanguageFromLocale = (locale) =>
  String(locale || '').toLowerCase().startsWith('nl') ? 'nl' : 'en';

const formatTimestamp = (value, language) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(language === 'nl' ? 'nl-NL' : 'en-GB', { hour12: false });
};

const localizeMoscow = (value, language) => {
  const strings = I18N[language] || I18N.en;
  const normalized = String(value || '').toUpperCase();
  if (normalized === 'MUST') return strings.must;
  if (normalized === 'SHOULD') return strings.should;
  if (normalized === 'COULD') return strings.could;
  if (normalized === 'WONT') return strings.wont;
  return value || '-';
};

const mappingLabels = {
  BENEFIT_SCORE: 'benefitScoreField',
  URGENCY_SCORE: 'urgencyScoreField',
  AMBITION_SCORE: 'ambitionScoreField',
  TOTAL_SCORE: 'totalScoreField',
  BENEFIT_EXPLANATION: 'benefitExplanationField',
  URGENCY_EXPLANATION: 'urgencyExplanationField',
  AMBITION_EXPLANATION: 'ambitionExplanationField'
};

const scoreMappingKeys = ['BENEFIT_SCORE', 'URGENCY_SCORE', 'AMBITION_SCORE', 'TOTAL_SCORE'];
const explanationMappingKeys = ['BENEFIT_EXPLANATION', 'URGENCY_EXPLANATION', 'AMBITION_EXPLANATION'];
const allMappingKeys = [...scoreMappingKeys, ...explanationMappingKeys];

const buildEmptyScaleOption = () => ({
  value: '',
  labelDefault: '',
  labels: { en: '', nl: '' }
});

const normalizeScaleOption = (option) => ({
  value: String(option?.value ?? ''),
  labelDefault: String(option?.labelDefault || ''),
  labels: {
    en: String(option?.labels?.en || ''),
    nl: String(option?.labels?.nl || '')
  }
});

const getDerivedDefaultLabel = (option) => {
  const english = String(option?.labels?.en || '').trim();
  if (english) return english;
  const dutch = String(option?.labels?.nl || '').trim();
  if (dutch) return dutch;
  return String(option?.labelDefault || '').trim();
};

function Banner({ type, text }) {
  if (!text) return null;
  return <div className={`banner ${type}`}>{text}</div>;
}

function Section({ title, subtitle, children }) {
  return (
    <section className="section">
      <h3>{title}</h3>
      {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
      {children}
    </section>
  );
}

function App() {
  const [language, setLanguage] = useState('en');
  const strings = I18N[language] || I18N.en;

  const [availableNumberFields, setAvailableNumberFields] = useState([]);
  const [availableTextFields, setAvailableTextFields] = useState([]);
  const [mapping, setMapping] = useState({});
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [fieldsSaving, setFieldsSaving] = useState(false);
  const [fieldsMessage, setFieldsMessage] = useState('');
  const [fieldsError, setFieldsError] = useState('');
  const [mappingCheckLoading, setMappingCheckLoading] = useState(false);

  const [setupLoading, setSetupLoading] = useState(false);
  const [setupMessage, setSetupMessage] = useState('');
  const [setupError, setSetupError] = useState('');
  const [fieldIds, setFieldIds] = useState(null);

  const [scaleLoading, setScaleLoading] = useState(true);
  const [scaleSaving, setScaleSaving] = useState(false);
  const [scaleMessage, setScaleMessage] = useState('');
  const [scaleError, setScaleError] = useState('');
  const [scoreOptions, setScoreOptions] = useState([]);

  const [thresholdLoading, setThresholdLoading] = useState(true);
  const [thresholdSaving, setThresholdSaving] = useState(false);
  const [thresholdMessage, setThresholdMessage] = useState('');
  const [thresholdError, setThresholdError] = useState('');
  const [mustThreshold, setMustThreshold] = useState('30');
  const [shouldThreshold, setShouldThreshold] = useState('20');
  const [couldThreshold, setCouldThreshold] = useState('10');

  const [issueTypes, setIssueTypes] = useState([]);
  const [selectedIssueTypeIds, setSelectedIssueTypeIds] = useState([]);
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState('');
  const [configError, setConfigError] = useState('');

  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [logs, setLogs] = useState([]);

  const fieldsById = useMemo(() => {
    const allFields = [...availableNumberFields, ...availableTextFields];
    return new Map(allFields.map((field) => [String(field.id), field]));
  }, [availableNumberFields, availableTextFields]);

  const hasDuplicateFieldNames = useMemo(() => {
    const allFields = [...availableNumberFields, ...availableTextFields];
    const counts = new Map();
    for (const field of allFields) {
      const name = String(field?.name || '');
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    return [...counts.values()].some((count) => count > 1);
  }, [availableNumberFields, availableTextFields]);

  useEffect(() => {
    (async () => {
      try {
        const context = await view.getContext();
        const locale =
          context?.locale ||
          context?.user?.locale ||
          context?.platformContext?.locale ||
          '';
        setLanguage(getLanguageFromLocale(locale));
      } catch (_error) {
        setLanguage('en');
      }
    })();
  }, []);

  const loadFieldMapping = async () => {
    setFieldsLoading(true);
    setFieldsMessage('');
    setFieldsError('');

    try {
      const [fieldsResult, mappingResult] = await Promise.all([
        invoke('getPriorityFields'),
        invoke('getPriorityMapping')
      ]);

      if (!fieldsResult?.success) throw new Error(fieldsResult?.error || strings.loadFieldsFailed);
      if (!mappingResult?.success) throw new Error(mappingResult?.error || strings.loadMappingFailed);

      setAvailableNumberFields(fieldsResult.numberFields || []);
      setAvailableTextFields(fieldsResult.textFields || []);

      const next = {};
      for (const key of allMappingKeys) {
        next[key] = mappingResult?.mapping?.[key] ? String(mappingResult.mapping[key]) : '';
      }
      setMapping(next);
    } catch (error) {
      setFieldsError(`${strings.loadError}: ${error.message}`);
    } finally {
      setFieldsLoading(false);
    }
  };

  const loadScaleConfig = async () => {
    setScaleLoading(true);
    setScaleMessage('');
    setScaleError('');

    try {
      const result = await invoke('getPriorityScaleConfig');
      if (!result?.success) throw new Error(result?.error || strings.loadingScaleConfig);
      setScoreOptions((result.config?.scoreOptions || []).map(normalizeScaleOption));
    } catch (error) {
      setScaleError(`${strings.loadError}: ${error.message}`);
    } finally {
      setScaleLoading(false);
    }
  };

  const loadThresholdConfig = async () => {
    setThresholdLoading(true);
    setThresholdMessage('');
    setThresholdError('');

    try {
      const result = await invoke('getPriorityThresholdConfig');
      if (!result?.success) throw new Error(result?.error || strings.thresholdSaveFailed);

      setMustThreshold(String(result?.config?.must ?? 30));
      setShouldThreshold(String(result?.config?.should ?? 20));
      setCouldThreshold(String(result?.config?.could ?? 10));
    } catch (error) {
      setThresholdError(`${strings.loadError}: ${error.message}`);
    } finally {
      setThresholdLoading(false);
    }
  };

  const loadVisibility = async () => {
    setConfigLoading(true);
    setConfigMessage('');
    setConfigError('');

    try {
      const [typesResult, configResult] = await Promise.all([
        invoke('getIssueTypes'),
        invoke('getPriorityConfig')
      ]);

      if (!typesResult?.success) throw new Error(typesResult?.error || strings.loadingIssueTypes);
      if (!configResult?.success) throw new Error(configResult?.error || strings.visibilitySaveFailed);

      setIssueTypes(typesResult.issueTypes || []);
      setSelectedIssueTypeIds(configResult.enabledIssueTypeIds || []);
    } catch (error) {
      setConfigError(`${strings.loadError}: ${error.message}`);
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    loadFieldMapping();
    loadScaleConfig();
    loadThresholdConfig();
    loadVisibility();
  }, []);

  const handleSaveFieldMapping = async () => {
    setFieldsSaving(true);
    setFieldsMessage('');
    setFieldsError('');

    try {
      const result = await invoke('savePriorityMapping', { mapping });
      if (!result?.success) {
        setFieldsError(result?.error || strings.fieldMappingSaveFailed);
        return;
      }
      setFieldsMessage(strings.fieldMappingSaved);
    } catch (error) {
      setFieldsError(`${strings.saveError}: ${error.message}`);
    } finally {
      setFieldsSaving(false);
    }
  };

  const handleVerifyMapping = async () => {
    setMappingCheckLoading(true);
    setFieldsMessage('');
    setFieldsError('');
    try {
      const result = await invoke('verifyPriorityMapping');
      if (!result?.success) {
        setFieldsError(result?.error || strings.verifyMappingFailed);
        return;
      }
      setFieldsMessage(strings.verifyMappingSuccess);
    } catch (error) {
      setFieldsError(`${strings.saveError}: ${error.message}`);
    } finally {
      setMappingCheckLoading(false);
    }
  };

  const handleSetupFields = async () => {
    setSetupLoading(true);
    setSetupMessage('');
    setSetupError('');
    setFieldIds(null);

    try {
      const result = await invoke('setupPriorityFields');
      if (!result?.success) {
        setSetupError(result?.error || strings.defaultFieldSetupTitle);
        return;
      }

      setFieldIds(result.fieldIds || {});
      setSetupMessage(
        Number(result.createdCount) > 0
          ? `${strings.defaultFieldsCreated} (${result.createdCount} ${strings.defaultFieldsCreatedCount}).`
          : strings.defaultFieldsReused
      );

      await loadFieldMapping();
    } catch (error) {
      setSetupError(`${strings.saveError}: ${error.message}`);
    } finally {
      setSetupLoading(false);
    }
  };

  const updateScaleOption = (index, key, value) => {
    setScoreOptions((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (key === 'value') return { ...item, value };
        if (key === 'labelDefault') return { ...item, labelDefault: value };
        return { ...item, labels: { ...item.labels, [key]: value } };
      })
    );
  };

  const removeScaleOption = (index) => {
    setScoreOptions((current) => current.filter((_item, itemIndex) => itemIndex !== index));
  };

  const moveScaleOption = (index, direction) => {
    setScoreOptions((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const handleSaveScaleConfig = async () => {
    setScaleSaving(true);
    setScaleMessage('');
    setScaleError('');

    try {
      const payload = {
        scoreOptions: scoreOptions.map((item) => ({
          value: Number(item.value),
          labelDefault: getDerivedDefaultLabel(item),
          labels: {
            en: String(item?.labels?.en || '').trim(),
            nl: String(item?.labels?.nl || '').trim()
          }
        }))
      };

      const result = await invoke('savePriorityScaleConfig', { config: payload });
      if (!result?.success) {
        setScaleError(result?.error || strings.scaleConfigSaveFailed);
        return;
      }

      setScoreOptions((result.config?.scoreOptions || []).map(normalizeScaleOption));
      setScaleMessage(strings.scaleConfigSaved);
    } catch (error) {
      setScaleError(`${strings.saveError}: ${error.message}`);
    } finally {
      setScaleSaving(false);
    }
  };

  const handleResetScaleConfig = async () => {
    setScaleSaving(true);
    setScaleMessage('');
    setScaleError('');

    try {
      const result = await invoke('resetPriorityScaleConfig');
      if (!result?.success) {
        setScaleError(result?.error || strings.scaleConfigSaveFailed);
        return;
      }

      setScoreOptions((result.config?.scoreOptions || []).map(normalizeScaleOption));
      setScaleMessage(strings.resetScaleOptionsDone);
    } catch (error) {
      setScaleError(`${strings.saveError}: ${error.message}`);
    } finally {
      setScaleSaving(false);
    }
  };

  const handleSaveThresholds = async () => {
    setThresholdSaving(true);
    setThresholdMessage('');
    setThresholdError('');

    try {
      const payload = {
        must: Number(mustThreshold),
        should: Number(shouldThreshold),
        could: Number(couldThreshold)
      };

      const result = await invoke('savePriorityThresholdConfig', { config: payload });
      if (!result?.success) {
        setThresholdError(result?.error || strings.thresholdSaveFailed);
        return;
      }

      setMustThreshold(String(result.config?.must ?? 30));
      setShouldThreshold(String(result.config?.should ?? 20));
      setCouldThreshold(String(result.config?.could ?? 10));
      setThresholdMessage(strings.thresholdSaved);
    } catch (error) {
      setThresholdError(`${strings.saveError}: ${error.message}`);
    } finally {
      setThresholdSaving(false);
    }
  };

  const handleResetThresholds = async () => {
    setThresholdSaving(true);
    setThresholdMessage('');
    setThresholdError('');

    try {
      const result = await invoke('resetPriorityThresholdConfig');
      if (!result?.success) {
        setThresholdError(result?.error || strings.thresholdSaveFailed);
        return;
      }

      setMustThreshold(String(result.config?.must ?? 30));
      setShouldThreshold(String(result.config?.should ?? 20));
      setCouldThreshold(String(result.config?.could ?? 10));
      setThresholdMessage(strings.thresholdSaved);
    } catch (error) {
      setThresholdError(`${strings.saveError}: ${error.message}`);
    } finally {
      setThresholdSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    setConfigMessage('');
    setConfigError('');

    try {
      const result = await invoke('savePriorityConfig', {
        enabledIssueTypeIds: selectedIssueTypeIds
      });

      if (!result?.success) {
        setConfigError(result?.error || strings.visibilitySaveFailed);
        return;
      }

      setConfigMessage(
        selectedIssueTypeIds.length === 0
          ? strings.configurationSavedHidden
          : `${strings.configurationSavedEnabled} ${selectedIssueTypeIds.length} ${strings.issueTypeCountSuffix}`
      );
    } catch (error) {
      setConfigError(`${strings.saveError}: ${error.message}`);
    } finally {
      setConfigSaving(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    setLogsError('');
    try {
      const result = await invoke('getPriorityLogs', { limit: 200 });
      if (!result?.success) {
        setLogsError(result?.error || strings.logsLoadFailed);
        return;
      }
      setLogs(result.logs || []);
    } catch (error) {
      setLogsError(`${strings.loadError}: ${error.message}`);
    } finally {
      setLogsLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <h2>{strings.title}</h2>

      <Section title={strings.fieldMappingTitle} subtitle={strings.fieldMappingSubtitle}>
        <Banner type="ok" text={fieldsMessage} />
        <Banner type="error" text={fieldsError} />
        {hasDuplicateFieldNames ? <Banner type="error" text={strings.duplicateFieldNamesWarning} /> : null}

        {fieldsLoading ? (
          <p className="muted">{strings.loadingFields}</p>
        ) : (
          <div className="field-grid">
            {scoreMappingKeys.map((key) => (
              <label key={key}>
                <span>{strings[mappingLabels[key]]}</span>
                <select
                  value={mapping[key] || ''}
                  onChange={(event) => setMapping((current) => ({ ...current, [key]: event.target.value }))}
                >
                  <option value="">{strings.selectField}</option>
                  {availableNumberFields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name} ({field.id})
                    </option>
                  ))}
                </select>
              </label>
            ))}

            {explanationMappingKeys.map((key) => (
              <label key={key}>
                <span>{strings[mappingLabels[key]]}</span>
                <select
                  value={mapping[key] || ''}
                  onChange={(event) => setMapping((current) => ({ ...current, [key]: event.target.value }))}
                >
                  <option value="">{strings.selectField}</option>
                  {availableTextFields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name} ({field.id})
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}

        <div className="actions">
          <Button appearance="primary" isDisabled={fieldsSaving || fieldsLoading} onClick={handleSaveFieldMapping}>
            {fieldsSaving ? strings.savingMapping : strings.saveFieldMapping}
          </Button>
          <Button appearance="subtle" isDisabled={fieldsSaving || fieldsLoading || mappingCheckLoading} onClick={handleVerifyMapping}>
            {strings.verifyMapping}
          </Button>
          <Button appearance="subtle" isDisabled={fieldsLoading} onClick={loadFieldMapping}>
            {strings.refreshFields}
          </Button>
        </div>

        <div className="mapping-summary">
          <div className="summary-title">{strings.currentFieldSetup}</div>
          {allMappingKeys.map((key) => (
            <div className="mapping-row" key={`summary-${key}`}>
              <strong>{strings[mappingLabels[key]]}:</strong> {fieldsById.get(mapping[key])?.name || strings.notSelected}
              {fieldsById.get(mapping[key])?.id ? ` (${fieldsById.get(mapping[key]).id})` : ''}
            </div>
          ))}
          <details className="tech-details">
            <summary>{strings.technicalDetails}</summary>
            {allMappingKeys.map((key) => (
              <div className="tech-row" key={`tech-${key}`}>{key}: {mapping[key] || strings.notSelected}</div>
            ))}
          </details>
        </div>
      </Section>

      <Section title={strings.defaultFieldSetupTitle} subtitle={strings.defaultFieldSetupSubtitle}>
        <Banner type="ok" text={setupMessage} />
        <Banner type="error" text={setupError} />

        <div className="actions">
          <Button appearance="primary" isDisabled={setupLoading} onClick={handleSetupFields}>
            {setupLoading ? strings.preparingFields : strings.createDefaultFields}
          </Button>
        </div>

        {fieldIds ? (
          <div className="mapping-summary">
            <div className="summary-title">{strings.defaultFieldsCreatedAndMapped}</div>
            {Object.entries(fieldIds).map(([key, value]) => (
              <div className="mapping-row" key={`created-${key}`}>
                <strong>{key}:</strong> {String(value || '-')}
              </div>
            ))}
          </div>
        ) : null}
      </Section>

      <Section title={strings.scaleOptionsTitle} subtitle={strings.scaleOptionsSubtitle}>
        <Banner type="ok" text={scaleMessage} />
        <Banner type="error" text={scaleError} />

        {scaleLoading ? (
          <p className="muted">{strings.loadingScaleConfig}</p>
        ) : (
          <>
            <div className="scale-col">
              <div className="summary-title">{strings.scoreOptions}</div>
              <div className="scale-list">
                {scoreOptions.map((item, index) => (
                  <div className="scale-row" key={`score-${index}`}>
                    <div className="scale-field">
                      <span className="scale-field-label">{strings.value}</span>
                      <input
                        type="number"
                        className="scale-input value"
                        value={item.value}
                        onChange={(event) => updateScaleOption(index, 'value', event.target.value)}
                        placeholder={strings.value}
                      />
                    </div>
                    <div className="scale-field">
                      <span className="scale-field-label">{strings.defaultLabel}</span>
                      <input
                        type="text"
                        className="scale-input label readonly"
                        value={getDerivedDefaultLabel(item)}
                        readOnly
                        aria-readonly="true"
                        placeholder={strings.defaultLabel}
                      />
                    </div>
                    <div className="scale-field">
                      <span className="scale-field-label">{strings.englishLabel}</span>
                      <input
                        type="text"
                        className="scale-input"
                        value={item.labels.en}
                        onChange={(event) => updateScaleOption(index, 'en', event.target.value)}
                        placeholder={strings.englishLabel}
                      />
                    </div>
                    <div className="scale-field">
                      <span className="scale-field-label">{strings.dutchLabel}</span>
                      <input
                        type="text"
                        className="scale-input"
                        value={item.labels.nl}
                        onChange={(event) => updateScaleOption(index, 'nl', event.target.value)}
                        placeholder={strings.dutchLabel}
                      />
                    </div>
                    <div className="scale-row-actions">
                      <button type="button" className="inline-link" onClick={() => moveScaleOption(index, -1)}>
                        {strings.moveUp}
                      </button>
                      <button type="button" className="inline-link" onClick={() => moveScaleOption(index, 1)}>
                        {strings.moveDown}
                      </button>
                      <button type="button" className="inline-link danger" onClick={() => removeScaleOption(index)}>
                        {strings.remove}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Button appearance="subtle" onClick={() => setScoreOptions((current) => [...current, buildEmptyScaleOption()])}>
                {strings.addOption}
              </Button>
            </div>
          </>
        )}

        <div className="actions">
          <Button appearance="primary" isDisabled={scaleSaving || scaleLoading} onClick={handleSaveScaleConfig}>
            {scaleSaving ? strings.savingScaleOptions : strings.saveScaleOptions}
          </Button>
          <Button appearance="subtle" isDisabled={scaleSaving || scaleLoading} onClick={handleResetScaleConfig}>
            {strings.resetScaleOptions}
          </Button>
        </div>
      </Section>

      <Section title={strings.thresholdTitle} subtitle={strings.thresholdSubtitle}>
        <Banner type="ok" text={thresholdMessage} />
        <Banner type="error" text={thresholdError} />

        {thresholdLoading ? (
          <p className="muted">{strings.loadingFields}</p>
        ) : (
          <div className="field-grid">
            <label>
              <span>{strings.mustThreshold}</span>
              <input className="scale-input value" type="number" value={mustThreshold} onChange={(event) => setMustThreshold(event.target.value)} />
            </label>
            <label>
              <span>{strings.shouldThreshold}</span>
              <input className="scale-input value" type="number" value={shouldThreshold} onChange={(event) => setShouldThreshold(event.target.value)} />
            </label>
            <label>
              <span>{strings.couldThreshold}</span>
              <input className="scale-input value" type="number" value={couldThreshold} onChange={(event) => setCouldThreshold(event.target.value)} />
            </label>
          </div>
        )}

        <div className="actions">
          <Button appearance="primary" isDisabled={thresholdSaving || thresholdLoading} onClick={handleSaveThresholds}>
            {thresholdSaving ? strings.savingThresholds : strings.saveThresholds}
          </Button>
          <Button appearance="subtle" isDisabled={thresholdSaving || thresholdLoading} onClick={handleResetThresholds}>
            {strings.resetThresholds}
          </Button>
        </div>
      </Section>

      <Section title={strings.visibilityTitle} subtitle={strings.visibilitySubtitle}>
        <Banner type="ok" text={configMessage} />
        <Banner type="error" text={configError} />

        {configLoading ? (
          <p className="muted">{strings.loadingIssueTypes}</p>
        ) : (
          <div className="issue-types">
            {issueTypes.map((issueType) => {
              const checked = selectedIssueTypeIds.includes(issueType.id);
              return (
                <label className={`issue-type ${checked ? 'selected' : ''}`} key={issueType.id}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedIssueTypeIds((current) => [...new Set([...current, issueType.id])]);
                      } else {
                        setSelectedIssueTypeIds((current) => current.filter((id) => id !== issueType.id));
                      }
                    }}
                  />
                  <span>{issueType.name}</span>
                </label>
              );
            })}
          </div>
        )}

        <div className="actions">
          <Button appearance="primary" isDisabled={configSaving || configLoading} onClick={handleSaveConfig}>
            {configSaving ? strings.savingConfiguration : strings.saveConfiguration}
          </Button>
        </div>
      </Section>

      <Section title={strings.calculationLogTitle} subtitle={strings.calculationLogSubtitle}>
        <Banner type="error" text={logsError} />
        <div className="actions">
          <Button appearance="primary" isDisabled={logsLoading} onClick={loadLogs}>
            {logsLoading ? strings.loadingLogs : strings.showCalculationLog}
          </Button>
        </div>

        {logs.length > 0 ? (
          <div className="log-table-wrap">
            <table className="log-table">
              <thead>
                <tr>
                  <th>{strings.time}</th>
                  <th>{strings.issue}</th>
                  <th>{strings.benefit}</th>
                  <th>{strings.urgency}</th>
                  <th>{strings.ambition}</th>
                  <th>{strings.total}</th>
                  <th>{strings.moscow}</th>
                  <th>{strings.by}</th>
                  <th>{strings.origin}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((entry, index) => (
                  <tr key={`${entry.timestamp}-${entry.issueKey}-${index}`}>
                    <td>{formatTimestamp(entry.timestamp, language) || '-'}</td>
                    <td>{entry.issueKey || '-'}</td>
                    <td>{String(entry.benefitScore ?? '-')}</td>
                    <td>{String(entry.urgencyScore ?? '-')}</td>
                    <td>{String(entry.ambitionScore ?? '-')}</td>
                    <td>{String(entry.totalScore ?? '-')}</td>
                    <td>{localizeMoscow(entry.moscowLabel, language)}</td>
                    <td>{entry.actorName || entry.actorAccountId || strings.unknown}</td>
                    <td>{entry.origin || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="muted">{strings.noLogsLoaded}</div>
        )}
      </Section>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
