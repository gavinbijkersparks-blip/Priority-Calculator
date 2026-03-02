import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { invoke, view } from '@forge/bridge';
import Button from '@atlaskit/button/new';
import '@atlaskit/css-reset';
import './styles.css';

const I18N = {
  en: {
    title: 'Risk Calculator Configuration',
    loadError: 'Load error',
    saveError: 'Save error',
    fieldMappingTitle: 'Field Mapping',
    fieldMappingSubtitle: 'Map the calculator to your Jira number fields. The app writes values by field ID.',
    loadingFields: 'Loading fields and mapping…',
    impactField: 'Impact field',
    likelihoodField: 'Likelihood field',
    riskScoreField: 'Risk Score field',
    selectField: 'Select field',
    saveFieldMapping: 'Save field mapping',
    savingMapping: 'Saving mapping…',
    refreshFields: 'Refresh fields',
    currentFieldSetup: 'Current field setup',
    notSelected: 'Not selected',
    impactHelp: 'This field stores how big the effect is when the risk happens.',
    likelihoodHelp: 'This field stores how likely it is that the risk happens.',
    riskScoreHelp: 'This field stores the calculated result: Impact x Likelihood.',
    technicalDetails: 'Technical field IDs (for Jira admin/support)',
    impactId: 'Impact ID',
    likelihoodId: 'Likelihood ID',
    riskScoreId: 'Risk Score ID',
    fieldMappingSaved: 'Field mapping saved.',
    fieldMappingSaveFailed: 'Failed to save field mapping.',
    loadFieldsFailed: 'Failed to load available fields.',
    loadMappingFailed: 'Failed to load field mapping.',
    defaultFieldSetupTitle: 'Default Field Setup',
    defaultFieldSetupSubtitle: 'Create app-managed default fields and automatically map them. Optional if you map existing fields.',
    preparingFields: 'Preparing fields…',
    createDefaultFields: 'Create default fields and map them',
    defaultFieldsCreated: 'Default fields ready',
    defaultFieldsCreatedCount: 'created',
    defaultFieldsReused: 'Default fields ready (reused existing managed fields).',
    defaultFieldsCreatedAndMapped: 'Default fields created and mapped',
    visibilityTitle: 'Visibility Configuration',
    visibilitySubtitle: 'Choose issue types where Risk Calculator should be visible in the issue sidebar.',
    issueTypesSelected: 'issue types selected',
    of: 'of',
    lastConfigured: 'Last configured',
    notAvailable: 'not available',
    loadingIssueTypes: 'Loading issue types…',
    enabledIssueTypes: 'Enabled Issue Types',
    availableIssueTypes: 'Available Issue Types',
    removeAll: 'Remove all',
    addAll: 'Add all',
    noEnabledIssueTypes: 'No enabled issue types',
    noAvailableIssueTypes: 'No available issue types',
    saveConfiguration: 'Save configuration',
    savingConfiguration: 'Saving configuration…',
    enabledFor: 'Enabled for',
    none: 'none',
    configurationSavedHidden: 'Configuration saved. Risk Calculator is hidden for all issue types.',
    configurationSavedEnabled: 'Configuration saved. Risk Calculator is enabled for',
    issueTypeCountSuffix: 'issue type(s).',
    visibilitySaveFailed: 'Failed to save visibility configuration.',
    calculationLogTitle: 'Calculation Log',
    calculationLogSubtitle: 'Show who calculated risk score, for which issue, and with what values.',
    showCalculationLog: 'Show calculation log',
    loadingLogs: 'Loading logs…',
    noLogsLoaded: 'No calculation logs loaded yet.',
    logsLoadFailed: 'Failed to load calculation logs.',
    time: 'Time',
    issue: 'Issue',
    impact: 'Impact',
    likelihood: 'Likelihood',
    score: 'Score',
    priority: 'Priority',
    by: 'By',
    origin: 'Origin',
    unknown: 'Unknown',
    clickToRemove: 'Click to remove',
    clickToAdd: 'Click to add',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
    scaleOptionsTitle: 'Scale Options',
    scaleOptionsSubtitle: 'Set default values and labels for Impact and Likelihood dropdowns. Values are used for calculation.',
    loadingScaleConfig: 'Loading scale options…',
    scaleConfigSaved: 'Scale options saved.',
    scaleConfigSaveFailed: 'Failed to save scale options.',
    resetScaleOptions: 'Reset to app defaults',
    resetScaleOptionsDone: 'Scale options reset to app defaults.',
    impactOptions: 'Impact options',
    likelihoodOptions: 'Likelihood options',
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
    lastUpdated: 'Last updated',
    byUser: 'By',
    system: 'System',
    scaleInUseHint: 'Tip: if a value is already used in issues, keep it in the list to avoid confusion.',
    duplicateFieldNamesWarning: 'Warning: duplicate field names detected. Map by field ID, not by name.',
    verifyMapping: 'Verify mapping',
    verifyMappingSuccess: 'Mapping is valid and writable number fields are selected.',
    verifyMappingFailed: 'Mapping verification failed.',
    legacySummaryTitle: 'Legacy values cleanup',
    legacySummarySubtitle: 'Find and migrate issue values that are no longer in the current option configuration.',
    scanLegacyValues: 'Scan legacy values',
    scanningLegacyValues: 'Scanning…',
    migrateLegacyValues: 'Migrate legacy values',
    migratingLegacyValues: 'Migrating…',
    legacyNoIssues: 'No legacy values found in scanned issues.',
    legacyFound: 'Legacy values found',
    legacyScanned: 'Scanned',
    legacyIssues: 'Legacy issues',
    migrationDone: 'Migration completed.',
    migrationFailed: 'Migration failed.',
    migrationNote: 'Migration sets non-configured values to the minimum configured value per field.'
  },
  nl: {
    title: 'Risico Calculator Configuratie',
    loadError: 'Laadfout',
    saveError: 'Opslagfout',
    fieldMappingTitle: 'Veldkoppeling',
    fieldMappingSubtitle: 'Koppel de calculator aan Jira-nummervelden. De app schrijft op basis van veld-ID.',
    loadingFields: 'Velden en koppeling laden…',
    impactField: 'Impactveld',
    likelihoodField: 'Waarschijnlijkheidsveld',
    riskScoreField: 'Risicoscoreveld',
    selectField: 'Selecteer veld',
    saveFieldMapping: 'Veldkoppeling opslaan',
    savingMapping: 'Koppeling opslaan…',
    refreshFields: 'Velden verversen',
    currentFieldSetup: 'Huidige veldconfiguratie',
    notSelected: 'Niet geselecteerd',
    impactHelp: 'Dit veld slaat op hoe groot het effect is als het risico optreedt.',
    likelihoodHelp: 'Dit veld slaat op hoe waarschijnlijk het is dat het risico optreedt.',
    riskScoreHelp: 'Dit veld slaat de berekende uitkomst op: Impact x Waarschijnlijkheid.',
    technicalDetails: 'Technische veld-IDs (voor Jira beheer/support)',
    impactId: 'Impact ID',
    likelihoodId: 'Waarschijnlijkheid ID',
    riskScoreId: 'Risicoscore ID',
    fieldMappingSaved: 'Veldkoppeling opgeslagen.',
    fieldMappingSaveFailed: 'Veldkoppeling opslaan mislukt.',
    loadFieldsFailed: 'Beschikbare velden konden niet worden geladen.',
    loadMappingFailed: 'Veldkoppeling kon niet worden geladen.',
    defaultFieldSetupTitle: 'Standaard veldinstellingen',
    defaultFieldSetupSubtitle: 'Maak standaard app-velden aan en koppel ze automatisch. Optioneel als je bestaande velden koppelt.',
    preparingFields: 'Velden voorbereiden…',
    createDefaultFields: 'Standaardvelden maken en koppelen',
    defaultFieldsCreated: 'Standaardvelden gereed',
    defaultFieldsCreatedCount: 'aangemaakt',
    defaultFieldsReused: 'Standaardvelden gereed (bestaande beheerde velden hergebruikt).',
    defaultFieldsCreatedAndMapped: 'Standaardvelden gemaakt en gekoppeld',
    visibilityTitle: 'Zichtbaarheidsconfiguratie',
    visibilitySubtitle: 'Kies work types waarvoor de Risico Calculator zichtbaar is in de issue-zijbalk.',
    issueTypesSelected: 'work types geselecteerd',
    of: 'van',
    lastConfigured: 'Laatst geconfigureerd',
    notAvailable: 'niet beschikbaar',
    loadingIssueTypes: 'Work types laden…',
    enabledIssueTypes: 'Ingeschakelde work types',
    availableIssueTypes: 'Beschikbare work types',
    removeAll: 'Alles verwijderen',
    addAll: 'Alles toevoegen',
    noEnabledIssueTypes: 'Geen ingeschakelde work types',
    noAvailableIssueTypes: 'Geen beschikbare work types',
    saveConfiguration: 'Configuratie opslaan',
    savingConfiguration: 'Configuratie opslaan…',
    enabledFor: 'Ingeschakeld voor',
    none: 'geen',
    configurationSavedHidden: 'Configuratie opgeslagen. Risico Calculator is verborgen voor alle work types.',
    configurationSavedEnabled: 'Configuratie opgeslagen. Risico Calculator is ingeschakeld voor',
    issueTypeCountSuffix: 'work type(s).',
    visibilitySaveFailed: 'Zichtbaarheidsconfiguratie opslaan mislukt.',
    calculationLogTitle: 'Berekeningslog',
    calculationLogSubtitle: 'Toon wie de risicoscore heeft berekend, voor welk issue en met welke waarden.',
    showCalculationLog: 'Berekeningslog tonen',
    loadingLogs: 'Logs laden…',
    noLogsLoaded: 'Nog geen berekeningslogs geladen.',
    logsLoadFailed: 'Berekeningslogs konden niet worden geladen.',
    time: 'Tijd',
    issue: 'Issue',
    impact: 'Impact',
    likelihood: 'Waarschijnlijkheid',
    score: 'Score',
    priority: 'Prioriteit',
    by: 'Door',
    origin: 'Herkomst',
    unknown: 'Onbekend',
    clickToRemove: 'Klik om te verwijderen',
    clickToAdd: 'Klik om toe te voegen',
    high: 'HOOG',
    medium: 'MIDDEL',
    low: 'LAAG',
    scaleOptionsTitle: 'Schaalopties',
    scaleOptionsSubtitle: 'Stel standaardwaarden en labels in voor Impact- en Waarschijnlijkheid-dropdowns. Waarden worden gebruikt voor berekening.',
    loadingScaleConfig: 'Schaalopties laden…',
    scaleConfigSaved: 'Schaalopties opgeslagen.',
    scaleConfigSaveFailed: 'Schaalopties opslaan mislukt.',
    resetScaleOptions: 'Reset naar app-standaarden',
    resetScaleOptionsDone: 'Schaalopties zijn teruggezet naar app-standaarden.',
    impactOptions: 'Impact-opties',
    likelihoodOptions: 'Waarschijnlijkheidsopties',
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
    lastUpdated: 'Laatst bijgewerkt',
    byUser: 'Door',
    system: 'Systeem',
    scaleInUseHint: 'Tip: als een waarde al in issues gebruikt wordt, laat die in de lijst staan om verwarring te voorkomen.',
    duplicateFieldNamesWarning: 'Waarschuwing: dubbele veldnamen gedetecteerd. Koppel op veld-ID, niet op naam.',
    verifyMapping: 'Koppeling valideren',
    verifyMappingSuccess: 'Koppeling is geldig en gebruikt beschrijfbare nummervelden.',
    verifyMappingFailed: 'Koppelingsvalidatie mislukt.',
    legacySummaryTitle: 'Opschonen oude waarden',
    legacySummarySubtitle: 'Vind en migreer issue-waarden die niet meer in de huidige optieconfiguratie zitten.',
    scanLegacyValues: 'Oude waarden scannen',
    scanningLegacyValues: 'Scannen…',
    migrateLegacyValues: 'Oude waarden migreren',
    migratingLegacyValues: 'Migreren…',
    legacyNoIssues: 'Geen oude waarden gevonden in gescande issues.',
    legacyFound: 'Oude waarden gevonden',
    legacyScanned: 'Gescand',
    legacyIssues: 'Issues met oude waarden',
    migrationDone: 'Migratie voltooid.',
    migrationFailed: 'Migratie mislukt.',
    migrationNote: 'Migratie zet niet-geconfigureerde waarden naar de laagste geconfigureerde waarde per veld.'
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

const localizePriority = (value, language) => {
  const strings = I18N[language] || I18N.en;
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'HIGH') return strings.high;
  if (normalized === 'MEDIUM') return strings.medium;
  if (normalized === 'LOW') return strings.low;
  return value || '-';
};

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
  const [issueTypes, setIssueTypes] = useState([]);
  const [selectedIssueTypeIds, setSelectedIssueTypeIds] = useState([]);

  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState('');
  const [configError, setConfigError] = useState('');
  const [lastConfiguredAt, setLastConfiguredAt] = useState(null);

  const [setupLoading, setSetupLoading] = useState(false);
  const [setupMessage, setSetupMessage] = useState('');
  const [setupError, setSetupError] = useState('');
  const [fieldIds, setFieldIds] = useState(null);

  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [fieldsSaving, setFieldsSaving] = useState(false);
  const [fieldsMessage, setFieldsMessage] = useState('');
  const [fieldsError, setFieldsError] = useState('');
  const [availableFields, setAvailableFields] = useState([]);
  const [impactField, setImpactField] = useState('');
  const [likelihoodField, setLikelihoodField] = useState('');
  const [riskScoreField, setRiskScoreField] = useState('');
  const [dragTarget, setDragTarget] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [logs, setLogs] = useState([]);
  const [scaleLoading, setScaleLoading] = useState(true);
  const [scaleSaving, setScaleSaving] = useState(false);
  const [scaleMessage, setScaleMessage] = useState('');
  const [scaleError, setScaleError] = useState('');
  const [impactScaleOptions, setImpactScaleOptions] = useState([]);
  const [likelihoodScaleOptions, setLikelihoodScaleOptions] = useState([]);
  const [scaleUpdatedAt, setScaleUpdatedAt] = useState(null);
  const [scaleUpdatedBy, setScaleUpdatedBy] = useState('');
  const [mappingCheckLoading, setMappingCheckLoading] = useState(false);
  const [legacyScanLoading, setLegacyScanLoading] = useState(false);
  const [legacyMigrateLoading, setLegacyMigrateLoading] = useState(false);
  const [legacySummary, setLegacySummary] = useState(null);
  const [legacySummaryError, setLegacySummaryError] = useState('');
  const [migrationMessage, setMigrationMessage] = useState('');
  const [migrationError, setMigrationError] = useState('');
  const strings = I18N[language] || I18N.en;

  const fieldsById = useMemo(
    () => new Map(availableFields.map((field) => [String(field.id), field])),
    [availableFields]
  );

  const hasDuplicateFieldNames = useMemo(() => {
    const counts = new Map();
    for (const field of availableFields) {
      const name = String(field?.name || '');
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    return [...counts.values()].some((count) => count > 1);
  }, [availableFields]);

  const selectedTypeNames = useMemo(() => {
    if (selectedIssueTypeIds.length === 0) return [];
    const byId = new Map(issueTypes.map((type) => [type.id, type.name]));
    return selectedIssueTypeIds.map((id) => byId.get(id)).filter(Boolean);
  }, [issueTypes, selectedIssueTypeIds]);

  const selectedIssueTypes = useMemo(
    () => issueTypes.filter((type) => selectedIssueTypeIds.includes(type.id)),
    [issueTypes, selectedIssueTypeIds]
  );

  const availableIssueTypes = useMemo(
    () => issueTypes.filter((type) => !selectedIssueTypeIds.includes(type.id)),
    [issueTypes, selectedIssueTypeIds]
  );

  const loadFieldMapping = async () => {
    setFieldsLoading(true);
    setFieldsMessage('');
    setFieldsError('');

    try {
      const [fieldsResult, mappingResult] = await Promise.all([
        invoke('getRiskFields'),
        invoke('getRiskMapping')
      ]);

      if (!fieldsResult?.success) {
        throw new Error(fieldsResult?.error || strings.loadFieldsFailed);
      }
      if (!mappingResult?.success) {
        throw new Error(mappingResult?.error || strings.loadMappingFailed);
      }

      const fields = fieldsResult.fields || [];
      const mapping = mappingResult.mapping || {};

      setAvailableFields(fields);
      setImpactField(mapping.IMPACT ? String(mapping.IMPACT) : '');
      setLikelihoodField(mapping.LIKELIHOOD ? String(mapping.LIKELIHOOD) : '');
      setRiskScoreField(mapping.RISK_SCORE ? String(mapping.RISK_SCORE) : '');
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
      const result = await invoke('getRiskScaleConfig');
      if (!result?.success) {
        throw new Error(result?.error || strings.loadingScaleConfig);
      }

      const config = result.config || {};
      setImpactScaleOptions(
        Array.isArray(config.impactOptions)
          ? config.impactOptions.map(normalizeScaleOption)
          : []
      );
      setLikelihoodScaleOptions(
        Array.isArray(config.likelihoodOptions)
          ? config.likelihoodOptions.map(normalizeScaleOption)
          : []
      );
      setScaleUpdatedAt(config.updatedAt || null);
      setScaleUpdatedBy(String(config.updatedBy || ''));
    } catch (error) {
      setScaleError(`${strings.loadError}: ${error.message}`);
    } finally {
      setScaleLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
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
    };

    const loadConfig = async () => {
      setConfigLoading(true);
      setConfigMessage('');
      setConfigError('');

      try {
        const [typesResult, configResult] = await Promise.all([
          invoke('getIssueTypes'),
          invoke('getRiskConfig')
        ]);

        if (!typesResult?.success) {
          throw new Error(typesResult?.error || strings.loadingIssueTypes);
        }
        if (!configResult?.success) {
          throw new Error(configResult?.error || strings.visibilitySaveFailed);
        }

        setIssueTypes(typesResult.issueTypes || []);
        setSelectedIssueTypeIds(configResult.enabledIssueTypeIds || []);
        setLastConfiguredAt(configResult.updatedAt || null);
      } catch (error) {
        setConfigError(`${strings.loadError}: ${error.message}`);
      } finally {
        setConfigLoading(false);
      }
    };

    initialize();
    loadConfig();
    loadFieldMapping();
    loadScaleConfig();
  }, [strings.loadError, strings.loadingIssueTypes, strings.visibilitySaveFailed, strings.loadFieldsFailed, strings.loadMappingFailed, strings.loadingScaleConfig]);

  const handleSaveFieldMapping = async () => {
    setFieldsSaving(true);
    setFieldsMessage('');
    setFieldsError('');

    try {
      const mapping = {
        IMPACT: impactField,
        LIKELIHOOD: likelihoodField,
        RISK_SCORE: riskScoreField
      };

      const result = await invoke('saveRiskMapping', { mapping });
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
      const result = await invoke('verifyRiskMapping');
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
      const result = await invoke('setupFields');
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

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    setConfigMessage('');
    setConfigError('');

    try {
      const result = await invoke('saveRiskConfig', {
        enabledIssueTypeIds: selectedIssueTypeIds
      });

      if (!result?.success) {
        setConfigError(result?.error || strings.visibilitySaveFailed);
        return;
      }

      setLastConfiguredAt(result.updatedAt || new Date().toISOString());
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
      const result = await invoke('getRiskLogs', { limit: 200 });
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

  const updateScaleOption = (setter, index, key, value) => {
    setter((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (key === 'value') {
          return { ...item, value };
        }
        if (key === 'labelDefault') {
          return { ...item, labelDefault: value };
        }
        return {
          ...item,
          labels: {
            ...item.labels,
            [key]: value
          }
        };
      })
    );
  };

  const removeScaleOption = (setter, index) => {
    setter((current) => current.filter((_item, itemIndex) => itemIndex !== index));
  };

  const moveScaleOption = (setter, index, direction) => {
    setter((current) => {
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
        impactOptions: impactScaleOptions.map((item) => ({
          value: Number(item.value),
          labelDefault: getDerivedDefaultLabel(item),
          labels: {
            en: String(item?.labels?.en || '').trim(),
            nl: String(item?.labels?.nl || '').trim()
          }
        })),
        likelihoodOptions: likelihoodScaleOptions.map((item) => ({
          value: Number(item.value),
          labelDefault: getDerivedDefaultLabel(item),
          labels: {
            en: String(item?.labels?.en || '').trim(),
            nl: String(item?.labels?.nl || '').trim()
          }
        }))
      };

      const result = await invoke('saveRiskScaleConfig', { config: payload });
      if (!result?.success) {
        setScaleError(result?.error || strings.scaleConfigSaveFailed);
        return;
      }

      const config = result.config || {};
      setImpactScaleOptions((config.impactOptions || []).map(normalizeScaleOption));
      setLikelihoodScaleOptions((config.likelihoodOptions || []).map(normalizeScaleOption));
      setScaleUpdatedAt(config.updatedAt || null);
      setScaleUpdatedBy(String(config.updatedBy || ''));
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
      const result = await invoke('resetRiskScaleConfig');
      if (!result?.success) {
        setScaleError(result?.error || strings.scaleConfigSaveFailed);
        return;
      }

      const config = result.config || {};
      setImpactScaleOptions((config.impactOptions || []).map(normalizeScaleOption));
      setLikelihoodScaleOptions((config.likelihoodOptions || []).map(normalizeScaleOption));
      setScaleUpdatedAt(config.updatedAt || null);
      setScaleUpdatedBy(String(config.updatedBy || ''));
      setScaleMessage(strings.resetScaleOptionsDone);
    } catch (error) {
      setScaleError(`${strings.saveError}: ${error.message}`);
    } finally {
      setScaleSaving(false);
    }
  };

  const handleScanLegacyValues = async () => {
    setLegacyScanLoading(true);
    setLegacySummary(null);
    setLegacySummaryError('');
    setMigrationMessage('');
    setMigrationError('');
    try {
      const result = await invoke('getLegacyRiskSummary', { limit: 300 });
      if (!result?.success) {
        setLegacySummaryError(result?.error || strings.migrationFailed);
        return;
      }
      setLegacySummary(result);
    } catch (error) {
      setLegacySummaryError(`${strings.loadError}: ${error.message}`);
    } finally {
      setLegacyScanLoading(false);
    }
  };

  const handleMigrateLegacyValues = async () => {
    setLegacyMigrateLoading(true);
    setMigrationMessage('');
    setMigrationError('');
    try {
      const result = await invoke('migrateLegacyRiskValues', { limit: 300 });
      if (!result?.success) {
        setMigrationError(result?.error || strings.migrationFailed);
        return;
      }

      setMigrationMessage(`${strings.migrationDone} ${result.updatedCount || 0}`);
      await Promise.all([
        handleScanLegacyValues(),
        loadLogs()
      ]);
    } catch (error) {
      setMigrationError(`${strings.saveError}: ${error.message}`);
    } finally {
      setLegacyMigrateLoading(false);
    }
  };

  const addIssueType = (issueTypeId) => {
    setSelectedIssueTypeIds((current) =>
      current.includes(issueTypeId) ? current : [...current, issueTypeId]
    );
  };

  const removeIssueType = (issueTypeId) => {
    setSelectedIssueTypeIds((current) => current.filter((id) => id !== issueTypeId));
  };

  const handleDragStart = (event, issueTypeId, source) => {
    event.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ issueTypeId, source })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event, target) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragTarget(target);
  };

  const handleDrop = (event, target) => {
    event.preventDefault();
    setDragTarget('');

    try {
      const payload = JSON.parse(event.dataTransfer.getData('text/plain'));
      const issueTypeId = String(payload?.issueTypeId || '');
      const source = String(payload?.source || '');
      if (!issueTypeId || !source || source === target) return;

      if (target === 'enabled') {
        addIssueType(issueTypeId);
      } else if (target === 'available') {
        removeIssueType(issueTypeId);
      }
    } catch (_error) {
      // Ignore invalid drag payloads.
    }
  };

  const handleDragEnd = () => {
    setDragTarget('');
  };

  return (
    <div className="admin-page">
      <h2>{strings.title}</h2>

      <Section
        title={strings.fieldMappingTitle}
        subtitle={strings.fieldMappingSubtitle}
      >
        <Banner type="ok" text={fieldsMessage} />
        <Banner type="error" text={fieldsError} />
        {hasDuplicateFieldNames ? <Banner type="error" text={strings.duplicateFieldNamesWarning} /> : null}

        {fieldsLoading ? (
          <p className="muted">{strings.loadingFields}</p>
        ) : (
          <div className="field-grid">
            <label>
              <span>{strings.impactField}</span>
              <select value={impactField} onChange={(event) => setImpactField(event.target.value)}>
                <option value="">{strings.selectField}</option>
                {availableFields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.name} ({field.id})
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>{strings.likelihoodField}</span>
              <select value={likelihoodField} onChange={(event) => setLikelihoodField(event.target.value)}>
                <option value="">{strings.selectField}</option>
                {availableFields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.name} ({field.id})
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>{strings.riskScoreField}</span>
              <select value={riskScoreField} onChange={(event) => setRiskScoreField(event.target.value)}>
                <option value="">{strings.selectField}</option>
                {availableFields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.name} ({field.id})
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="actions">
          <Button
            appearance="primary"
            isDisabled={fieldsSaving || fieldsLoading}
            onClick={handleSaveFieldMapping}
          >
            {fieldsSaving ? strings.savingMapping : strings.saveFieldMapping}
          </Button>
          <Button
            appearance="subtle"
            isDisabled={fieldsSaving || fieldsLoading || mappingCheckLoading}
            onClick={handleVerifyMapping}
          >
            {strings.verifyMapping}
          </Button>
          <Button appearance="subtle" isDisabled={fieldsLoading} onClick={loadFieldMapping}>
            {strings.refreshFields}
          </Button>
        </div>

        <div className="mapping-summary">
          <div className="summary-title">{strings.currentFieldSetup}</div>
          <div className="mapping-row">
            <strong>{strings.impactField}:</strong> {fieldsById.get(impactField)?.name || strings.notSelected}
            {fieldsById.get(impactField)?.id ? ` (${fieldsById.get(impactField)?.id})` : ''}
          </div>
          <div className="mapping-help">
            {strings.impactHelp}
          </div>

          <div className="mapping-row">
            <strong>{strings.likelihoodField}:</strong> {fieldsById.get(likelihoodField)?.name || strings.notSelected}
            {fieldsById.get(likelihoodField)?.id ? ` (${fieldsById.get(likelihoodField)?.id})` : ''}
          </div>
          <div className="mapping-help">
            {strings.likelihoodHelp}
          </div>

          <div className="mapping-row">
            <strong>{strings.riskScoreField}:</strong> {fieldsById.get(riskScoreField)?.name || strings.notSelected}
            {fieldsById.get(riskScoreField)?.id ? ` (${fieldsById.get(riskScoreField)?.id})` : ''}
          </div>
          <div className="mapping-help">
            {strings.riskScoreHelp}
          </div>

          <details className="tech-details">
            <summary>{strings.technicalDetails}</summary>
            <div className="tech-row">{strings.impactId}: {impactField || strings.notSelected}</div>
            <div className="tech-row">{strings.likelihoodId}: {likelihoodField || strings.notSelected}</div>
            <div className="tech-row">{strings.riskScoreId}: {riskScoreField || strings.notSelected}</div>
          </details>
        </div>
      </Section>

      <Section
        title={strings.defaultFieldSetupTitle}
        subtitle={strings.defaultFieldSetupSubtitle}
      >
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
            <div className="mapping-row">
              <strong>{strings.impactId}:</strong> {String(fieldIds.IMPACT || '-')}
            </div>
            <div className="mapping-row">
              <strong>{strings.likelihoodId}:</strong> {String(fieldIds.LIKELIHOOD || '-')}
            </div>
            <div className="mapping-row">
              <strong>{strings.riskScoreId}:</strong> {String(fieldIds.RISK_SCORE || '-')}
            </div>
          </div>
        ) : null}
      </Section>

      <Section
        title={strings.scaleOptionsTitle}
        subtitle={strings.scaleOptionsSubtitle}
      >
        <Banner type="ok" text={scaleMessage} />
        <Banner type="error" text={scaleError} />

        {scaleLoading ? (
          <p className="muted">{strings.loadingScaleConfig}</p>
        ) : (
          <>
            <div className="scale-columns">
              <div className="scale-col">
                <div className="summary-title">{strings.impactOptions}</div>
                <div className="scale-list">
                  {impactScaleOptions.map((item, index) => (
                    <div className="scale-row" key={`impact-${index}`}>
                      <div className="scale-field">
                        <span className="scale-field-label">{strings.value}</span>
                      <input
                        type="number"
                        className="scale-input value"
                        value={item.value}
                        onChange={(event) =>
                          updateScaleOption(setImpactScaleOptions, index, 'value', event.target.value)
                        }
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
                        onChange={(event) =>
                          updateScaleOption(setImpactScaleOptions, index, 'en', event.target.value)
                        }
                        placeholder={strings.englishLabel}
                      />
                      </div>
                      <div className="scale-field">
                        <span className="scale-field-label">{strings.dutchLabel}</span>
                      <input
                        type="text"
                        className="scale-input"
                        value={item.labels.nl}
                        onChange={(event) =>
                          updateScaleOption(setImpactScaleOptions, index, 'nl', event.target.value)
                        }
                        placeholder={strings.dutchLabel}
                      />
                      </div>
                      <div className="scale-row-actions">
                        <button type="button" className="inline-link" onClick={() => moveScaleOption(setImpactScaleOptions, index, -1)}>
                          {strings.moveUp}
                        </button>
                        <button type="button" className="inline-link" onClick={() => moveScaleOption(setImpactScaleOptions, index, 1)}>
                          {strings.moveDown}
                        </button>
                        <button type="button" className="inline-link danger" onClick={() => removeScaleOption(setImpactScaleOptions, index)}>
                          {strings.remove}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button appearance="subtle" onClick={() => setImpactScaleOptions((current) => [...current, buildEmptyScaleOption()])}>
                  {strings.addOption}
                </Button>
              </div>

              <div className="scale-col">
                <div className="summary-title">{strings.likelihoodOptions}</div>
                <div className="scale-list">
                  {likelihoodScaleOptions.map((item, index) => (
                    <div className="scale-row" key={`likelihood-${index}`}>
                      <div className="scale-field">
                        <span className="scale-field-label">{strings.value}</span>
                      <input
                        type="number"
                        className="scale-input value"
                        value={item.value}
                        onChange={(event) =>
                          updateScaleOption(setLikelihoodScaleOptions, index, 'value', event.target.value)
                        }
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
                        onChange={(event) =>
                          updateScaleOption(setLikelihoodScaleOptions, index, 'en', event.target.value)
                        }
                        placeholder={strings.englishLabel}
                      />
                      </div>
                      <div className="scale-field">
                        <span className="scale-field-label">{strings.dutchLabel}</span>
                      <input
                        type="text"
                        className="scale-input"
                        value={item.labels.nl}
                        onChange={(event) =>
                          updateScaleOption(setLikelihoodScaleOptions, index, 'nl', event.target.value)
                        }
                        placeholder={strings.dutchLabel}
                      />
                      </div>
                      <div className="scale-row-actions">
                        <button type="button" className="inline-link" onClick={() => moveScaleOption(setLikelihoodScaleOptions, index, -1)}>
                          {strings.moveUp}
                        </button>
                        <button type="button" className="inline-link" onClick={() => moveScaleOption(setLikelihoodScaleOptions, index, 1)}>
                          {strings.moveDown}
                        </button>
                        <button type="button" className="inline-link danger" onClick={() => removeScaleOption(setLikelihoodScaleOptions, index)}>
                          {strings.remove}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button appearance="subtle" onClick={() => setLikelihoodScaleOptions((current) => [...current, buildEmptyScaleOption()])}>
                  {strings.addOption}
                </Button>
              </div>
            </div>

            <div className="muted">
              {strings.lastUpdated}: {formatTimestamp(scaleUpdatedAt, language) || strings.notAvailable}
              {' '}· {strings.byUser}: {scaleUpdatedBy || strings.system}
            </div>
            <div className="muted">{strings.scaleInUseHint}</div>
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

      <Section
        title={strings.legacySummaryTitle}
        subtitle={strings.legacySummarySubtitle}
      >
        <Banner type="ok" text={migrationMessage} />
        <Banner type="error" text={legacySummaryError || migrationError} />

        <div className="actions">
          <Button appearance="primary" isDisabled={legacyScanLoading || legacyMigrateLoading} onClick={handleScanLegacyValues}>
            {legacyScanLoading ? strings.scanningLegacyValues : strings.scanLegacyValues}
          </Button>
          <Button
            appearance="subtle"
            isDisabled={legacyMigrateLoading || legacyScanLoading || !legacySummary || Number(legacySummary.legacyCount || 0) === 0}
            onClick={handleMigrateLegacyValues}
          >
            {legacyMigrateLoading ? strings.migratingLegacyValues : strings.migrateLegacyValues}
          </Button>
        </div>

        {legacySummary ? (
          <div className="mapping-summary">
            <div className="mapping-row">
              <strong>{strings.legacyScanned}:</strong> {Number(legacySummary.scanned || 0)}
            </div>
            <div className="mapping-row">
              <strong>{strings.legacyIssues}:</strong> {Number(legacySummary.legacyCount || 0)}
            </div>
            {Number(legacySummary.legacyCount || 0) === 0 ? (
              <div className="mapping-help">{strings.legacyNoIssues}</div>
            ) : (
              <>
                <div className="mapping-help">{strings.legacyFound}: {Number(legacySummary.legacyCount || 0)}</div>
                <div className="muted">{strings.migrationNote}</div>
              </>
            )}
          </div>
        ) : null}
      </Section>

      <Section
        title={strings.visibilityTitle}
        subtitle={strings.visibilitySubtitle}
      >
        <Banner type="ok" text={configMessage} />
        <Banner type="error" text={configError} />

        <div className="muted">
          {selectedIssueTypeIds.length} {strings.of} {issueTypes.length || 0} {strings.issueTypesSelected}
        </div>
        <div className="muted">
          {strings.lastConfigured}: {formatTimestamp(lastConfiguredAt, language) || strings.notAvailable}
        </div>

        {configLoading ? (
          <p className="muted">{strings.loadingIssueTypes}</p>
        ) : (
          <div className="dual-list">
            <div
              className={`dual-col ${dragTarget === 'enabled' ? 'drop-active' : ''}`}
              onDragOver={(event) => handleDragOver(event, 'enabled')}
              onDrop={(event) => handleDrop(event, 'enabled')}
              onDragLeave={() => setDragTarget('')}
            >
              <div className="dual-col-header">
                <strong>{strings.enabledIssueTypes}</strong>
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => setSelectedIssueTypeIds([])}
                  disabled={configSaving || selectedIssueTypeIds.length === 0}
                >
                  {strings.removeAll}
                </button>
              </div>
              <div className="dual-items">
                {selectedIssueTypes.map((issueType) => (
                  <button
                    key={issueType.id}
                    type="button"
                    className="dual-item selected"
                    onClick={() => removeIssueType(issueType.id)}
                    disabled={configSaving}
                    title={strings.clickToRemove}
                    draggable={!configSaving}
                    onDragStart={(event) =>
                      handleDragStart(event, issueType.id, 'enabled')
                    }
                    onDragEnd={handleDragEnd}
                  >
                    {issueType.name}
                  </button>
                ))}
                {selectedIssueTypes.length === 0 ? (
                  <div className="empty-state">{strings.noEnabledIssueTypes}</div>
                ) : null}
              </div>
            </div>

            <div
              className={`dual-col ${dragTarget === 'available' ? 'drop-active' : ''}`}
              onDragOver={(event) => handleDragOver(event, 'available')}
              onDrop={(event) => handleDrop(event, 'available')}
              onDragLeave={() => setDragTarget('')}
            >
              <div className="dual-col-header">
                <strong>{strings.availableIssueTypes}</strong>
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => setSelectedIssueTypeIds(issueTypes.map((type) => type.id))}
                  disabled={configSaving || availableIssueTypes.length === 0}
                >
                  {strings.addAll}
                </button>
              </div>
              <div className="dual-items">
                {availableIssueTypes.map((issueType) => (
                  <button
                    key={issueType.id}
                    type="button"
                    className="dual-item"
                    onClick={() => addIssueType(issueType.id)}
                    disabled={configSaving}
                    title={strings.clickToAdd}
                    draggable={!configSaving}
                    onDragStart={(event) =>
                      handleDragStart(event, issueType.id, 'available')
                    }
                    onDragEnd={handleDragEnd}
                  >
                    {issueType.name}
                  </button>
                ))}
                {availableIssueTypes.length === 0 ? (
                  <div className="empty-state">{strings.noAvailableIssueTypes}</div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <div className="actions">
          <Button
            appearance="primary"
            isDisabled={configSaving || configLoading}
            onClick={handleSaveConfig}
          >
            {configSaving ? strings.savingConfiguration : strings.saveConfiguration}
          </Button>
        </div>

        <div className="muted">
          {strings.enabledFor}: {selectedTypeNames.length === 0 ? strings.none : selectedTypeNames.join(', ')}
        </div>
      </Section>

      <Section
        title={strings.calculationLogTitle}
        subtitle={strings.calculationLogSubtitle}
      >
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
                  <th>{strings.impact}</th>
                  <th>{strings.likelihood}</th>
                  <th>{strings.score}</th>
                  <th>{strings.priority}</th>
                  <th>{strings.by}</th>
                  <th>{strings.origin}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((entry, index) => (
                  <tr key={`${entry.timestamp}-${entry.issueKey}-${index}`}>
                    <td>{formatTimestamp(entry.timestamp, language) || '-'}</td>
                    <td>{entry.issueKey || '-'}</td>
                    <td>{String(entry.impact ?? '-')}</td>
                    <td>{String(entry.likelihood ?? '-')}</td>
                    <td>{String(entry.riskScore ?? '-')}</td>
                    <td>{localizePriority(entry.priority, language)}</td>
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
