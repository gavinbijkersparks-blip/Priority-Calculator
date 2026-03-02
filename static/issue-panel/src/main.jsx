import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { invoke, Modal, view } from '@forge/bridge';
import Button from '@atlaskit/button/new';
import '@atlaskit/css-reset';
import './styles.css';

const I18N = {
  en: {
    title: 'Priority Dashboard',
    subtitle: 'Prioritize work with live scoring and automatic save.',
    issueNotFound: 'Issue key not found. Refresh and try again.',
    loadFailed: 'Failed to load current Priority Dashboard values.',
    contextError: 'Context error',
    saveFailed: 'Save failed.',
    saveError: 'Save error',
    loadingCurrentValues: 'Loading current values…',
    benefitScore: 'Opbrengst score',
    urgencyScore: 'Urgentie score',
    ambitionScore: 'Ambitie score',
    benefitExplanation: 'Opbrengst toelichting (optioneel)',
    urgencyExplanation: 'Urgentie toelichting (optioneel)',
    ambitionExplanation: 'Ambitie toelichting (optioneel)',
    quickPresets: 'Quick presets',
    lowPriority: 'Low',
    mediumPriority: 'Medium',
    highPriority: 'High',
    explanation: 'Explanation',
    showExplanation: 'Add explanation',
    hideExplanation: 'Hide explanation',
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
    customValue: 'Legacy value (not in config)',
    must: 'Must',
    should: 'Should',
    could: 'Could',
    wont: "Won't"
  },
  nl: {
    title: 'Priority Dashboard',
    subtitle: 'Prioriteer werk met live scoring en automatisch opslaan.',
    issueNotFound: 'Issue key niet gevonden. Ververs en probeer opnieuw.',
    loadFailed: 'Huidige Priority Dashboard-waarden konden niet worden geladen.',
    contextError: 'Contextfout',
    saveFailed: 'Opslaan mislukt.',
    saveError: 'Opslagfout',
    loadingCurrentValues: 'Huidige waarden laden…',
    benefitScore: 'Opbrengst score',
    urgencyScore: 'Urgentie score',
    ambitionScore: 'Ambitie score',
    benefitExplanation: 'Opbrengst toelichting (optioneel)',
    urgencyExplanation: 'Urgentie toelichting (optioneel)',
    ambitionExplanation: 'Ambitie toelichting (optioneel)',
    quickPresets: 'Snelle presets',
    lowPriority: 'Laag',
    mediumPriority: 'Midden',
    highPriority: 'Hoog',
    explanation: 'Toelichting',
    showExplanation: 'Toelichting toevoegen',
    hideExplanation: 'Toelichting verbergen',
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
    customValue: 'Oude waarde (niet in configuratie)',
    must: 'Must',
    should: 'Should',
    could: 'Could',
    wont: "Won't"
  }
};

const DEFAULT_SCALE_OPTIONS = [
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

const DEFAULT_THRESHOLDS = { must: 30, should: 20, could: 10 };

const getLanguageFromLocale = (locale) =>
  String(locale || '').toLowerCase().startsWith('nl') ? 'nl' : 'en';

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

const getOptionLabel = (option, language) => {
  if (language === 'nl') {
    return option?.labels?.nl || option?.labelDefault || option?.labels?.en || String(option?.value || '');
  }

  return option?.labelDefault || option?.labels?.en || option?.labels?.nl || String(option?.value || '');
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

  if (values.length === 0) return { low: 1, medium: 1, high: 1 };

  const low = values[0];
  const high = values[values.length - 1];
  const medium = values[Math.floor((values.length - 1) / 2)];
  return { low, medium, high };
};

const localizeMoscowLabel = (label, language) => {
  const strings = I18N[language] || I18N.en;
  const normalized = String(label || '').toUpperCase();
  if (normalized === 'MUST') return strings.must;
  if (normalized === 'SHOULD') return strings.should;
  if (normalized === 'COULD') return strings.could;
  return strings.wont;
};

const getMoscowClass = (label) => {
  const normalized = String(label || '').toUpperCase();
  if (normalized === 'MUST') return 'priority-high';
  if (normalized === 'SHOULD') return 'priority-medium';
  if (normalized === 'COULD') return 'priority-low';
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
  const [benefitScore, setBenefitScore] = useState(1);
  const [urgencyScore, setUrgencyScore] = useState(1);
  const [ambitionScore, setAmbitionScore] = useState(1);
  const [benefitExplanation, setBenefitExplanation] = useState('');
  const [urgencyExplanation, setUrgencyExplanation] = useState('');
  const [ambitionExplanation, setAmbitionExplanation] = useState('');
  const [showBenefitExplanation, setShowBenefitExplanation] = useState(false);
  const [showUrgencyExplanation, setShowUrgencyExplanation] = useState(false);
  const [showAmbitionExplanation, setShowAmbitionExplanation] = useState(false);
  const [scoreOptions, setScoreOptions] = useState(DEFAULT_SCALE_OPTIONS);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [lastSavedHash, setLastSavedHash] = useState('');

  const hydrateGuard = useRef(false);
  const autoSaveTimerRef = useRef(null);

  const totalScore = useMemo(
    () => Number(benefitScore) + Number(urgencyScore) + Number(ambitionScore),
    [benefitScore, urgencyScore, ambitionScore]
  );

  const moscowLabel = useMemo(() => {
    if (totalScore >= Number(thresholds.must || 30)) return 'MUST';
    if (totalScore >= Number(thresholds.should || 20)) return 'SHOULD';
    if (totalScore >= Number(thresholds.could || 10)) return 'COULD';
    return 'WONT';
  }, [thresholds, totalScore]);

  const payloadHash = useMemo(
    () => JSON.stringify([
      benefitScore,
      urgencyScore,
      ambitionScore,
      benefitExplanation,
      urgencyExplanation,
      ambitionExplanation
    ]),
    [benefitScore, urgencyScore, ambitionScore, benefitExplanation, urgencyExplanation, ambitionExplanation]
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
        const result = await invoke('getPriorityState', { issueKey: targetKey });
        if (!result?.success) {
          setLoadError(result?.error || strings.loadFailed);
          setLoading(false);
          return;
        }

        const loaded = result.values || {};
        const nextBenefit = Number(loaded.benefitScore) || 1;
        const nextUrgency = Number(loaded.urgencyScore) || 1;
        const nextAmbition = Number(loaded.ambitionScore) || 1;

        hydrateGuard.current = true;
        setBenefitScore(nextBenefit);
        setUrgencyScore(nextUrgency);
        setAmbitionScore(nextAmbition);
        setBenefitExplanation(String(loaded.benefitExplanation || ''));
        setUrgencyExplanation(String(loaded.urgencyExplanation || ''));
        setAmbitionExplanation(String(loaded.ambitionExplanation || ''));
        setShowBenefitExplanation(false);
        setShowUrgencyExplanation(false);
        setShowAmbitionExplanation(false);

        const loadedHash = JSON.stringify([
          nextBenefit,
          nextUrgency,
          nextAmbition,
          String(loaded.benefitExplanation || ''),
          String(loaded.urgencyExplanation || ''),
          String(loaded.ambitionExplanation || '')
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

  const loadConfigs = useCallback(async () => {
    try {
      const [scaleResult, thresholdResult] = await Promise.all([
        invoke('getPriorityScaleConfig'),
        invoke('getPriorityThresholdConfig')
      ]);

      if (scaleResult?.success) {
        const config = scaleResult.config || {};
        const next = normalizeScaleOptions(config.scoreOptions, DEFAULT_SCALE_OPTIONS);
        setScoreOptions(next.length > 0 ? next : DEFAULT_SCALE_OPTIONS);
      }

      if (thresholdResult?.success) {
        setThresholds({
          must: Number(thresholdResult?.config?.must) || DEFAULT_THRESHOLDS.must,
          should: Number(thresholdResult?.config?.should) || DEFAULT_THRESHOLDS.should,
          could: Number(thresholdResult?.config?.could) || DEFAULT_THRESHOLDS.could
        });
      }
    } catch (_error) {
      // Keep defaults
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

        await Promise.all([loadConfigs(), loadIssueValues(key)]);
      } catch (error) {
        setLoadError(`${strings.contextError}: ${error.message}`);
        setLoading(false);
      }
    })();
  }, [loadIssueValues, loadConfigs, strings.contextError]);

  const persistValues = useCallback(
    async (origin) => {
      if (!issueKey) {
        setSaveError(strings.issueNotFound);
        return;
      }

      setSaving(true);
      setSaveError('');

      try {
        const result = await invoke('savePriority', {
          issueKey,
          benefitScore,
          urgencyScore,
          ambitionScore,
          benefitExplanation,
          urgencyExplanation,
          ambitionExplanation,
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
      issueKey,
      benefitScore,
      urgencyScore,
      ambitionScore,
      benefitExplanation,
      urgencyExplanation,
      ambitionExplanation,
      actorAccountId,
      actorName,
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

  const safeScoreOptions = useMemo(
    () => ensureOptionInList(
      ensureOptionInList(ensureOptionInList(scoreOptions, benefitScore, strings.customValue), urgencyScore, strings.customValue),
      ambitionScore,
      strings.customValue
    ),
    [scoreOptions, benefitScore, urgencyScore, ambitionScore, strings.customValue]
  );

  const presets = useMemo(() => {
    const preset = getPresetValueSet(safeScoreOptions);
    return [
      { key: 'lowPriority', benefit: preset.low, urgency: preset.low, ambition: preset.low },
      { key: 'mediumPriority', benefit: preset.medium, urgency: preset.medium, ambition: preset.medium },
      { key: 'highPriority', benefit: preset.high, urgency: preset.high, ambition: preset.high }
    ];
  }, [safeScoreOptions]);

  const activePreset =
    presets.find(
      (preset) =>
        preset.benefit === benefitScore &&
        preset.urgency === urgencyScore &&
        preset.ambition === ambitionScore
    )?.key || null;

  const openLogsModal = async () => {
    if (!issueKey) {
      setSaveError(strings.issueNotFound);
      return;
    }

    const modal = new Modal({
      resource: 'prio-log-modal',
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
              <div className="score-value">{totalScore}</div>
              <span className={`priority-pill ${getMoscowClass(moscowLabel)}`}>
                {localizeMoscowLabel(moscowLabel, language)}
              </span>
            </div>
            <div className="formula">{benefitScore} + {urgencyScore} + {ambitionScore} = {totalScore}</div>
          </div>

          <div className="score-input-stack">
            <label className="score-input-block">
              <span className="field-head">
                <span>{strings.benefitScore}</span>
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => setShowBenefitExplanation((current) => !current)}
                >
                  {showBenefitExplanation ? strings.hideExplanation : strings.showExplanation}
                </button>
              </span>
              <select value={benefitScore} onChange={(event) => setBenefitScore(Number(event.target.value))}>
                {safeScoreOptions.map((option) => (
                  <option key={`benefit-${option.value}`} value={option.value}>
                    {option.value} - {getOptionLabel(option, language)}
                  </option>
                ))}
              </select>
              {showBenefitExplanation ? (
                <>
                  <span>{strings.benefitExplanation}</span>
                  <textarea value={benefitExplanation} onChange={(event) => setBenefitExplanation(event.target.value)} rows={4} maxLength={4000} />
                </>
              ) : null}
            </label>

            <label className="score-input-block">
              <span className="field-head">
                <span>{strings.urgencyScore}</span>
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => setShowUrgencyExplanation((current) => !current)}
                >
                  {showUrgencyExplanation ? strings.hideExplanation : strings.showExplanation}
                </button>
              </span>
              <select value={urgencyScore} onChange={(event) => setUrgencyScore(Number(event.target.value))}>
                {safeScoreOptions.map((option) => (
                  <option key={`urgency-${option.value}`} value={option.value}>
                    {option.value} - {getOptionLabel(option, language)}
                  </option>
                ))}
              </select>
              {showUrgencyExplanation ? (
                <>
                  <span>{strings.urgencyExplanation}</span>
                  <textarea value={urgencyExplanation} onChange={(event) => setUrgencyExplanation(event.target.value)} rows={4} maxLength={4000} />
                </>
              ) : null}
            </label>

            <label className="score-input-block">
              <span className="field-head">
                <span>{strings.ambitionScore}</span>
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => setShowAmbitionExplanation((current) => !current)}
                >
                  {showAmbitionExplanation ? strings.hideExplanation : strings.showExplanation}
                </button>
              </span>
              <select value={ambitionScore} onChange={(event) => setAmbitionScore(Number(event.target.value))}>
                {safeScoreOptions.map((option) => (
                  <option key={`ambition-${option.value}`} value={option.value}>
                    {option.value} - {getOptionLabel(option, language)}
                  </option>
                ))}
              </select>
              {showAmbitionExplanation ? (
                <>
                  <span>{strings.ambitionExplanation}</span>
                  <textarea value={ambitionExplanation} onChange={(event) => setAmbitionExplanation(event.target.value)} rows={4} maxLength={4000} />
                </>
              ) : null}
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
                    setBenefitScore(preset.benefit);
                    setUrgencyScore(preset.urgency);
                    setAmbitionScore(preset.ambition);
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
