import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { invoke, Modal, view } from '@forge/bridge';
import Button from '@atlaskit/button/new';
import '@atlaskit/css-reset';
import './styles.css';

const I18N = {
  en: {
    title: 'Risk Calculator',
    subtitle: 'Calculate risk with live scoring and automatic save.',
    issueNotFound: 'Issue key not found. Refresh and try again.',
    loadFailed: 'Failed to load current Risk Score values.',
    contextError: 'Context error',
    saveFailed: 'Save failed.',
    saveError: 'Save error',
    loadingCurrentValues: 'Loading current values…',
    impact: 'Impact',
    likelihood: 'Likelihood',
    quickPresets: 'Quick presets',
    lowRisk: 'Low Risk',
    mediumRisk: 'Medium Risk',
    highRisk: 'High Risk',
    saveNow: 'Save now',
    resetToIssue: 'Reset to issue values',
    logs: 'Logs',
    retrySave: 'Retry save',
    saving: 'Saving',
    error: 'Error',
    pending: 'Pending',
    saved: 'Saved',
    savingDots: 'Saving…',
    unsavedChanges: 'Unsaved changes',
    savedAt: 'Saved at',
    notSavedYet: 'Not saved yet',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
    customValue: 'Legacy value (not in config)'
  },
  nl: {
    title: 'Risico Calculator',
    subtitle: 'Bereken risico met live scoring en automatisch opslaan.',
    issueNotFound: 'Issue key niet gevonden. Ververs en probeer opnieuw.',
    loadFailed: 'Huidige risicoscore-waarden konden niet worden geladen.',
    contextError: 'Contextfout',
    saveFailed: 'Opslaan mislukt.',
    saveError: 'Opslagfout',
    loadingCurrentValues: 'Huidige waarden laden…',
    impact: 'Impact',
    likelihood: 'Waarschijnlijkheid',
    quickPresets: 'Snelle presets',
    lowRisk: 'Laag risico',
    mediumRisk: 'Gemiddeld risico',
    highRisk: 'Hoog risico',
    saveNow: 'Nu opslaan',
    resetToIssue: 'Reset naar issue-waarden',
    logs: 'Logs',
    retrySave: 'Opnieuw opslaan',
    saving: 'Opslaan',
    error: 'Fout',
    pending: 'In afwachting',
    saved: 'Opgeslagen',
    savingDots: 'Opslaan…',
    unsavedChanges: 'Niet-opgeslagen wijzigingen',
    savedAt: 'Opgeslagen om',
    notSavedYet: 'Nog niet opgeslagen',
    high: 'HOOG',
    medium: 'MIDDEL',
    low: 'LAAG',
    customValue: 'Oude waarde (niet in configuratie)'
  }
};

const DEFAULT_SCALE_OPTIONS = [
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
const getLanguageFromLocale = (locale) =>
  String(locale || '').toLowerCase().startsWith('nl') ? 'nl' : 'en';

const getOptionLabel = (option, language) => {
  if (language === 'nl') {
    return (
      option?.labels?.nl ||
      option?.labelDefault ||
      option?.labels?.en ||
      String(option?.value || '')
    );
  }

  return (
    option?.labelDefault ||
    option?.labels?.en ||
    option?.labels?.nl ||
    String(option?.value || '')
  );
};

const normalizeScaleOption = (option) => ({
  value: Number(option?.value),
  labelDefault: String(option?.labelDefault || '').trim(),
  labels: {
    en: String(option?.labels?.en || '').trim(),
    nl: String(option?.labels?.nl || '').trim()
  }
});

const normalizeScaleOptions = (options, fallback) => {
  const baseList = Array.isArray(options) && options.length > 0 ? options : fallback;
  return baseList
    .map(normalizeScaleOption)
    .filter((item) => Number.isFinite(item.value) && item.value > 0 && item.labelDefault)
    .sort((a, b) => a.value - b.value);
};

const ensureOptionInList = (options, value, fallbackLabel) => {
  if (options.some((item) => Number(item.value) === Number(value))) return options;
  return [
    ...options,
    {
      value: Number(value),
      labelDefault: fallbackLabel,
      labels: { en: fallbackLabel, nl: fallbackLabel }
    }
  ].sort((a, b) => a.value - b.value);
};

const getPresetValueSet = (options) => {
  const values = (options || [])
    .map((item) => Number(item?.value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  if (values.length === 0) {
    return { low: 1, medium: 1, high: 1 };
  }

  const low = values[0];
  const high = values[values.length - 1];
  const medium = values[Math.floor((values.length - 1) / 2)];
  return { low, medium, high };
};

const getPriority = (score, language) => {
  const strings = I18N[language] || I18N.en;
  if (score >= 400) return strings.high;
  if (score >= 100) return strings.medium;
  return strings.low;
};

const getPriorityClass = (score) => {
  if (score >= 400) return 'priority-high';
  if (score >= 100) return 'priority-medium';
  return 'priority-low';
};

const formatTime = (date, language) =>
  date.toLocaleTimeString(language === 'nl' ? 'nl-NL' : 'en-GB', { hour12: false });

function App() {
  const [issueKey, setIssueKey] = useState(null);
  const [language, setLanguage] = useState('en');
  const strings = I18N[language] || I18N.en;

  const [actorAccountId, setActorAccountId] = useState('');
  const [actorName, setActorName] = useState('');
  const [impact, setImpact] = useState(1);
  const [likelihood, setLikelihood] = useState(1);
  const [impactOptions, setImpactOptions] = useState(DEFAULT_SCALE_OPTIONS);
  const [likelihoodOptions, setLikelihoodOptions] = useState(DEFAULT_SCALE_OPTIONS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [lastSavedHash, setLastSavedHash] = useState('');

  const hydrateGuard = useRef(false);
  const autoSaveTimerRef = useRef(null);

  const riskScore = useMemo(() => impact * likelihood, [impact, likelihood]);

  const payloadHash = useMemo(
    () => JSON.stringify([impact, likelihood]),
    [impact, likelihood]
  );

  const hasUnsavedChanges = payloadHash !== lastSavedHash;

  const loadIssueValues = useCallback(
    async (key) => {
      const targetKey = key || issueKey;
      if (!targetKey) {
        setLoadError(strings.issueNotFound);
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError('');
      setSaveError('');

      try {
        const result = await invoke('getRiskState', { issueKey: targetKey });
        if (!result?.success) {
          setLoadError(result?.error || strings.loadFailed);
          setLoading(false);
          return;
        }

        const loaded = result.values || {};
        hydrateGuard.current = true;
        setImpact(Number(loaded.impact) || 1);
        setLikelihood(Number(loaded.likelihood) || 1);

        const loadedHash = JSON.stringify([
          Number(loaded.impact) || 1,
          Number(loaded.likelihood) || 1
        ]);

        setLastSavedHash(loadedHash);
        setLastSavedAt(new Date());
      } catch (error) {
        setLoadError(`${strings.contextError}: ${error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [issueKey, strings.contextError, strings.issueNotFound, strings.loadFailed]
  );

  const loadScaleConfig = useCallback(async () => {
    try {
      const result = await invoke('getRiskScaleConfig');
      if (!result?.success) return;
      const config = result.config || {};
      const nextImpact = normalizeScaleOptions(config.impactOptions, DEFAULT_SCALE_OPTIONS);
      const nextLikelihood = normalizeScaleOptions(config.likelihoodOptions, DEFAULT_SCALE_OPTIONS);

      setImpactOptions(nextImpact.length > 0 ? nextImpact : DEFAULT_SCALE_OPTIONS);
      setLikelihoodOptions(nextLikelihood.length > 0 ? nextLikelihood : DEFAULT_SCALE_OPTIONS);
    } catch (_error) {
      // Keep default options when scale config cannot be loaded.
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const context = await view.getContext();
        const key =
          context?.extension?.issue?.key ||
          context?.extension?.issueKey ||
          context?.platformContext?.issueKey;
        const accountId =
          context?.accountId ||
          context?.platformContext?.accountId ||
          '';
        const displayName =
          context?.user?.displayName ||
          context?.accountName ||
          '';
        const locale =
          context?.locale ||
          context?.user?.locale ||
          context?.platformContext?.locale ||
          '';
        setLanguage(getLanguageFromLocale(locale));

        setIssueKey(key || null);
        setActorAccountId(String(accountId || ''));
        setActorName(String(displayName || ''));
        await Promise.all([loadScaleConfig(), loadIssueValues(key)]);
      } catch (error) {
        setLoadError(`${strings.contextError}: ${error.message}`);
        setLoading(false);
      }
    })();
  }, [loadIssueValues, loadScaleConfig, strings.contextError]);

  const persistValues = useCallback(
    async (origin) => {
      if (!issueKey) {
        setSaveError(strings.issueNotFound);
        return;
      }

      setSaving(true);
      setSaveError('');

      try {
        const result = await invoke('saveRisk', {
          issueKey,
          impact,
          likelihood,
          origin,
          actorAccountId,
          actorName
        });

        if (!result?.success) {
          setSaveError(result?.error || strings.saveFailed);
          return;
        }

        setLastSavedHash(payloadHash);
        setLastSavedAt(new Date());

        if (origin === 'manual') {
          setSaveError('');
        }
      } catch (error) {
        setSaveError(`${strings.saveError}: ${error.message}`);
      } finally {
        setSaving(false);
      }
    },
    [
      actorAccountId,
      actorName,
      impact,
      issueKey,
      likelihood,
      payloadHash,
      strings.issueNotFound,
      strings.saveError,
      strings.saveFailed
    ]
  );

  useEffect(() => {
    if (loading) return;
    if (hydrateGuard.current) {
      hydrateGuard.current = false;
      return;
    }
    if (!hasUnsavedChanges) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      persistValues('auto');
    }, 900);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, loading, persistValues]);

  const saveStateLabel = saving
    ? strings.saving
    : saveError
      ? strings.error
      : hasUnsavedChanges
        ? strings.pending
        : strings.saved;

  const saveStateClass = saveError
    ? 'status-error'
    : hasUnsavedChanges
      ? 'status-pending'
      : 'status-saved';

  const saveStatusText =
    saving
      ? strings.savingDots
      : saveError
        ? saveError
        : hasUnsavedChanges
          ? strings.unsavedChanges
          : lastSavedAt
            ? `${strings.savedAt} ${formatTime(lastSavedAt, language)}`
            : strings.notSavedYet;

  const safeImpactOptions = useMemo(
    () => ensureOptionInList(impactOptions, impact, strings.customValue),
    [impactOptions, impact, strings.customValue]
  );

  const safeLikelihoodOptions = useMemo(
    () => ensureOptionInList(likelihoodOptions, likelihood, strings.customValue),
    [likelihoodOptions, likelihood, strings.customValue]
  );

  const presets = useMemo(() => {
    const impactPreset = getPresetValueSet(safeImpactOptions);
    const likelihoodPreset = getPresetValueSet(safeLikelihoodOptions);
    return [
      { key: 'lowRisk', impact: impactPreset.low, likelihood: likelihoodPreset.low },
      { key: 'mediumRisk', impact: impactPreset.medium, likelihood: likelihoodPreset.medium },
      { key: 'highRisk', impact: impactPreset.high, likelihood: likelihoodPreset.high }
    ];
  }, [safeImpactOptions, safeLikelihoodOptions]);

  const activePreset =
    presets.find(
      (preset) => preset.impact === impact && preset.likelihood === likelihood
    )?.key || null;

  const openLogsModal = async () => {
    if (!issueKey) {
      setSaveError(strings.issueNotFound);
      return;
    }
    const modal = new Modal({
      resource: 'risk-log-modal',
      size: 'max',
      context: {
        issueKey
      }
    });
    await modal.open();
  };

  return (
    <div className="panel">
      <h2 className="title">{strings.title}</h2>
      <p className="subtitle">{strings.subtitle}</p>

      {loadError ? <div className="error-box">{loadError}</div> : null}

      {loading ? (
        <div className="muted">{strings.loadingCurrentValues}</div>
      ) : (
        <>
          <div className="score-card">
            <div className="score-row">
              <div className="score-value">{riskScore}</div>
              <span className={`priority-pill ${getPriorityClass(riskScore)}`}>
                {getPriority(riskScore, language)}
              </span>
            </div>
            <div className="formula">{impact} x {likelihood} = {riskScore}</div>
          </div>

          <div className="fields-row">
            <label>
              <span>{strings.impact}</span>
              <select
                value={impact}
                onChange={(event) => setImpact(Number(event.target.value))}
              >
                {safeImpactOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} - {getOptionLabel(option, language)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>{strings.likelihood}</span>
              <select
                value={likelihood}
                onChange={(event) => setLikelihood(Number(event.target.value))}
              >
                {safeLikelihoodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} - {getOptionLabel(option, language)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="presets">
            <div className="section-title">{strings.quickPresets}</div>
            <div className="preset-row">
              {presets.map((preset) => (
                <Button
                  key={preset.key}
                  appearance={activePreset === preset.key ? 'primary' : 'subtle'}
                  onClick={() => {
                    setImpact(preset.impact);
                    setLikelihood(preset.likelihood);
                  }}
                >
                  {strings[preset.key]}
                </Button>
              ))}
            </div>
          </div>

          {saveError ? <div className="error-box">{saveError}</div> : null}

          <div className="actions">
            <Button appearance="primary" isDisabled={saving} onClick={() => persistValues('manual')}>
              {strings.saveNow}
            </Button>
            <Button appearance="subtle" isDisabled={loading} onClick={() => loadIssueValues()}>
              {strings.resetToIssue}
            </Button>
            <div className="logs-button-wrap">
              <Button appearance="subtle" isDisabled={loading} onClick={openLogsModal}>
                {strings.logs}
              </Button>
            </div>
            {saveError ? (
              <Button appearance="subtle" onClick={() => persistValues('manual')}>
                {strings.retrySave}
              </Button>
            ) : null}
          </div>

          <div className="save-status">
            <span className={`status-pill ${saveStateClass}`}>{saveStateLabel}</span>
            <span>{saveStatusText}</span>
          </div>
        </>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
