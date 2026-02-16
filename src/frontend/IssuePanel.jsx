import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForgeReconciler, {
  Box,
  Button,
  Heading,
  Inline,
  Lozenge,
  SectionMessage,
  Select,
  Spinner,
  Stack,
  Text,
  useProductContext
} from '@forge/react';
import { invoke } from '@forge/bridge';

const FIBONACCI_OPTIONS = [
  { label: '1 - Minimal', value: 1 },
  { label: '2 - Very low', value: 2 },
  { label: '3 - Low', value: 3 },
  { label: '5 - Medium', value: 5 },
  { label: '8 - High', value: 8 },
  { label: '13 - Very high', value: 13 },
  { label: '20 - Critical', value: 20 },
  { label: '40 - Extreme', value: 40 },
  { label: '100 - Maximum', value: 100 }
];

const PRESETS = [
  {
    label: 'Low Risk',
    values: { impact: 3, likelihood: 2 }
  },
  {
    label: 'Medium Risk',
    values: { impact: 8, likelihood: 8 }
  },
  {
    label: 'High Risk',
    values: { impact: 20, likelihood: 20 }
  }
];

const toOption = (value) =>
  FIBONACCI_OPTIONS.find((option) => option.value === Number(value)) || FIBONACCI_OPTIONS[0];

const optionToNumber = (option) => Number(option?.value) || 1;

const getPriority = (score) => {
  if (score >= 400) return 'HIGH';
  if (score >= 100) return 'MEDIUM';
  return 'LOW';
};

const getPriorityLozenge = (score) => {
  if (score >= 400) return 'moved';
  if (score >= 100) return 'inprogress';
  return 'success';
};

const formatTime = (date) => date.toLocaleTimeString('en-GB', { hour12: false });

const App = () => {
  const context = useProductContext();
  const issueKey =
    context?.extension?.issue?.key ||
    context?.extension?.issueKey ||
    context?.platformContext?.issueKey;

  const [impact, setImpact] = useState(FIBONACCI_OPTIONS[0]);
  const [likelihood, setLikelihood] = useState(FIBONACCI_OPTIONS[0]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [lastSavedHash, setLastSavedHash] = useState('');

  const hydrateGuard = useRef(false);
  const autoSaveTimerRef = useRef(null);

  const values = useMemo(
    () => ({
      impact: optionToNumber(impact),
      likelihood: optionToNumber(likelihood)
    }),
    [impact, likelihood]
  );

  const riskScore = useMemo(() => values.impact * values.likelihood, [values]);

  const payloadHash = useMemo(
    () => JSON.stringify([values.impact, values.likelihood]),
    [values]
  );

  const hasUnsavedChanges = payloadHash !== lastSavedHash;

  const loadIssueValues = useCallback(async () => {
    if (!issueKey) {
      setLoadError('Issue key not found. Refresh and try again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    setSaveError(null);

    try {
      const result = await invoke('getRiskState', { issueKey });
      if (!result?.success) {
        setLoadError(result?.error || 'Failed to load current Risk Score values.');
        setLoading(false);
        return;
      }

      const loaded = result.values || {};
      hydrateGuard.current = true;
      setImpact(toOption(loaded.impact));
      setLikelihood(toOption(loaded.likelihood));

      const loadedHash = JSON.stringify([
        Number(loaded.impact) || 1,
        Number(loaded.likelihood) || 1
      ]);
      setLastSavedHash(loadedHash);
      setLastSavedAt(new Date());
    } catch (error) {
      setLoadError(`Load error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

  useEffect(() => {
    loadIssueValues();
  }, [loadIssueValues]);

  const persistValues = useCallback(
    async (origin) => {
      if (!issueKey) {
        setSaveError('Issue key not found. Refresh and try again.');
        return;
      }

      setSaving(true);
      setSaveError(null);

      try {
        const result = await invoke('saveRisk', {
          issueKey,
          ...values
        });

        if (!result?.success) {
          setSaveError(result?.error || 'Save failed.');
          return;
        }

        setLastSavedHash(payloadHash);
        setLastSavedAt(new Date());

        if (origin === 'manual') {
          setSaveError(null);
        }
      } catch (error) {
        setSaveError(`Save error: ${error.message}`);
      } finally {
        setSaving(false);
      }
    },
    [issueKey, payloadHash, values]
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

  const applyPreset = (presetValues) => {
    setImpact(toOption(presetValues.impact));
    setLikelihood(toOption(presetValues.likelihood));
  };

  const saveStatusText = useMemo(() => {
    if (saving) return 'Saving…';
    if (saveError) return saveError;
    if (hasUnsavedChanges) return 'Unsaved changes';
    if (lastSavedAt) return `Saved at ${formatTime(lastSavedAt)}`;
    return 'Not saved yet';
  }, [hasUnsavedChanges, lastSavedAt, saveError, saving]);

  const saveStateLabel = saving
    ? 'Saving'
    : saveError
      ? 'Error'
      : hasUnsavedChanges
        ? 'Pending'
        : 'Saved';

  const saveStateAppearance = saveError
    ? 'moved'
    : hasUnsavedChanges
      ? 'inprogress'
      : 'success';

  const activePreset = useMemo(
    () =>
      PRESETS.find(
        (preset) =>
          preset.values.impact === values.impact &&
          preset.values.likelihood === values.likelihood
      )?.label || null,
    [values]
  );

  return (
    <Stack space="space.200">
      <Inline space="space.100" alignBlock="center">
        <Stack space="space.050">
          <Heading size="small">Risk Score Calculator</Heading>
          <Text>Calculate risk with live scoring and automatic save.</Text>
        </Stack>
      </Inline>

      {loadError ? (
        <SectionMessage appearance="error" title={loadError}>
          <Text />
        </SectionMessage>
      ) : null}

      {loading ? (
        <Inline space="space.100" alignBlock="center">
          <Spinner size="small" />
          <Text>Loading current values…</Text>
        </Inline>
      ) : (
        <Stack space="space.200">
          <Box padding="space.150">
            <Stack space="space.100">
              <Inline space="space.100" alignBlock="center">
                <Heading size="medium">{riskScore}</Heading>
                <Lozenge appearance={getPriorityLozenge(riskScore)}>
                  {getPriority(riskScore)}
                </Lozenge>
              </Inline>
              <Text>{values.impact} x {values.likelihood} = {riskScore}</Text>
            </Stack>
          </Box>

          <Inline space="space.150">
            <Box>
              <Stack space="space.050">
                <Text>Impact</Text>
                <Select options={FIBONACCI_OPTIONS} value={impact} onChange={setImpact} />
              </Stack>
            </Box>
            <Box>
              <Stack space="space.050">
                <Text>Likelihood</Text>
                <Select options={FIBONACCI_OPTIONS} value={likelihood} onChange={setLikelihood} />
              </Stack>
            </Box>
          </Inline>

          <Stack space="space.100">
            <Text>Quick presets</Text>
            <Inline space="space.100">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  appearance={activePreset === preset.label ? 'primary' : 'subtle'}
                  onClick={() => applyPreset(preset.values)}
                >
                  {preset.label}
                </Button>
              ))}
            </Inline>
          </Stack>

          {saveError ? (
            <SectionMessage appearance="error" title={saveError}>
              <Text />
            </SectionMessage>
          ) : null}

          <Inline space="space.100">
            <Button appearance="primary" isDisabled={saving || loading} onClick={() => persistValues('manual')}>
              Save now
            </Button>
            <Button appearance="subtle" isDisabled={loading} onClick={loadIssueValues}>
              Reset to issue values
            </Button>
            {saveError ? (
              <Button appearance="subtle" onClick={() => persistValues('manual')}>
                Retry save
              </Button>
            ) : null}
          </Inline>

          <Inline space="space.100" alignBlock="center">
            <Lozenge appearance={saveStateAppearance}>{saveStateLabel}</Lozenge>
            <Text>{saveStatusText}</Text>
          </Inline>
        </Stack>
      )}
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
