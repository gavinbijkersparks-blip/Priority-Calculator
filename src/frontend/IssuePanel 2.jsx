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
    label: 'Quick Win',
    values: { businessValue: 8, timeCriticality: 5, riskReduction: 3, jobSize: 2 }
  },
  {
    label: 'Compliance',
    values: { businessValue: 13, timeCriticality: 20, riskReduction: 13, jobSize: 8 }
  },
  {
    label: 'Tech Debt',
    values: { businessValue: 5, timeCriticality: 3, riskReduction: 13, jobSize: 5 }
  }
];

const toOption = (value) =>
  FIBONACCI_OPTIONS.find((option) => option.value === Number(value)) || FIBONACCI_OPTIONS[0];

const optionToNumber = (option) => Number(option?.value) || 1;

const getPriority = (score) => {
  if (score >= 10) return 'HIGH';
  if (score >= 3) return 'MEDIUM';
  return 'LOW';
};

const getPriorityLozenge = (score) => {
  if (score >= 10) return 'success';
  if (score >= 3) return 'inprogress';
  return 'moved';
};

const formatTime = (date) => date.toLocaleTimeString('en-GB', { hour12: false });

const App = () => {
  const context = useProductContext();
  const issueKey =
    context?.extension?.issue?.key ||
    context?.extension?.issueKey ||
    context?.platformContext?.issueKey;

  const [businessValue, setBusinessValue] = useState(FIBONACCI_OPTIONS[0]);
  const [timeCriticality, setTimeCriticality] = useState(FIBONACCI_OPTIONS[0]);
  const [riskReduction, setRiskReduction] = useState(FIBONACCI_OPTIONS[0]);
  const [jobSize, setJobSize] = useState(FIBONACCI_OPTIONS[0]);

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
      businessValue: optionToNumber(businessValue),
      timeCriticality: optionToNumber(timeCriticality),
      riskReduction: optionToNumber(riskReduction),
      jobSize: optionToNumber(jobSize)
    }),
    [businessValue, timeCriticality, riskReduction, jobSize]
  );

  const wsjfScore = useMemo(() => {
    const score =
      (values.businessValue + values.timeCriticality + values.riskReduction) /
      values.jobSize;
    return Math.round(score * 100) / 100;
  }, [values]);

  const payloadHash = useMemo(
    () =>
      JSON.stringify([
        values.businessValue,
        values.timeCriticality,
        values.riskReduction,
        values.jobSize
      ]),
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
      const result = await invoke('getWSJFState', { issueKey });
      if (!result?.success) {
        setLoadError(result?.error || 'Failed to load current WSJF values.');
        setLoading(false);
        return;
      }

      const loaded = result.values || {};
      hydrateGuard.current = true;
      setBusinessValue(toOption(loaded.businessValue));
      setTimeCriticality(toOption(loaded.timeCriticality));
      setRiskReduction(toOption(loaded.riskReduction));
      setJobSize(toOption(loaded.jobSize));

      const loadedHash = JSON.stringify([
        Number(loaded.businessValue) || 1,
        Number(loaded.timeCriticality) || 1,
        Number(loaded.riskReduction) || 1,
        Number(loaded.jobSize) || 1
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
        const result = await invoke('saveWSJF', {
          issueKey,
          ...values
        });

        if (!result?.success) {
          setSaveError(result?.error || 'Save failed.');
          return;
        }

        setLastSavedHash(payloadHash);
        setLastSavedAt(new Date());

        // Keep auto-save quiet; manual save clears previous errors as explicit confirmation.
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
    setBusinessValue(toOption(presetValues.businessValue));
    setTimeCriticality(toOption(presetValues.timeCriticality));
    setRiskReduction(toOption(presetValues.riskReduction));
    setJobSize(toOption(presetValues.jobSize));
  };

  const saveStatusText = useMemo(() => {
    if (saving) return 'Saving…';
    if (saveError) return saveError;
    if (hasUnsavedChanges) return 'Unsaved changes';
    if (lastSavedAt) return `Saved at ${formatTime(lastSavedAt)}`;
    return 'Not saved yet';
  }, [hasUnsavedChanges, lastSavedAt, saveError, saving]);

  return (
    <Stack space="space.200">
      <Stack space="space.050">
        <Heading size="small">WSJF Calculator</Heading>
        <Text>Prioritize faster with live scoring and automatic save.</Text>
      </Stack>

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
          <Box>
            <Stack space="space.100">
              <Inline space="space.100" alignBlock="center">
                <Heading size="small">{wsjfScore}</Heading>
                <Lozenge appearance={getPriorityLozenge(wsjfScore)}>
                  {getPriority(wsjfScore)}
                </Lozenge>
              </Inline>
              <Text>Cost of Delay: {values.businessValue + values.timeCriticality + values.riskReduction}</Text>
              <Text>Job Size: {values.jobSize}</Text>
              <Text>Formula: (Business Value + Time Criticality + Risk Reduction) / Job Size</Text>
            </Stack>
          </Box>

          <Stack space="space.100">
            <Text>Business Value</Text>
            <Select options={FIBONACCI_OPTIONS} value={businessValue} onChange={setBusinessValue} />

            <Text>Time Criticality</Text>
            <Select options={FIBONACCI_OPTIONS} value={timeCriticality} onChange={setTimeCriticality} />

            <Text>Risk Reduction / Opportunity</Text>
            <Select options={FIBONACCI_OPTIONS} value={riskReduction} onChange={setRiskReduction} />

            <Text>Job Size</Text>
            <Select options={FIBONACCI_OPTIONS} value={jobSize} onChange={setJobSize} />
          </Stack>

          <Stack space="space.100">
            <Text>Quick presets</Text>
            <Inline space="space.100">
              {PRESETS.map((preset) => (
                <Button key={preset.label} appearance="subtle" onClick={() => applyPreset(preset.values)}>
                  {preset.label}
                </Button>
              ))}
            </Inline>
          </Stack>

          <Inline space="space.100" alignBlock="center">
            <Lozenge appearance={saveError ? 'moved' : hasUnsavedChanges ? 'inprogress' : 'success'}>
              {saving ? 'Saving' : saveError ? 'Error' : hasUnsavedChanges ? 'Pending' : 'Saved'}
            </Lozenge>
            <Text>{saveStatusText}</Text>
            {saveError ? (
              <Button appearance="subtle" onClick={() => persistValues('manual')}>
                Retry
              </Button>
            ) : null}
          </Inline>

          <Inline space="space.100">
            <Button appearance="primary" isDisabled={saving || loading} onClick={() => persistValues('manual')}>
              Save now
            </Button>
            <Button appearance="subtle" isDisabled={loading} onClick={loadIssueValues}>
              Reset to issue values
            </Button>
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
