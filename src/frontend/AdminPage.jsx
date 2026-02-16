import React, { useEffect, useMemo, useState } from 'react';
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
  Text
} from '@forge/react';
import { invoke } from '@forge/bridge';
import { IssueTypeSelector } from './components/IssueTypeSelector';

const formatTimestamp = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-GB', { hour12: false });
};

const App = () => {
  const [issueTypes, setIssueTypes] = useState([]);
  const [selectedIssueTypeIds, setSelectedIssueTypeIds] = useState([]);

  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState(null);
  const [lastConfiguredAt, setLastConfiguredAt] = useState(null);

  const [setupLoading, setSetupLoading] = useState(false);
  const [setupMessage, setSetupMessage] = useState(null);
  const [fieldIds, setFieldIds] = useState(null);

  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [fieldsSaving, setFieldsSaving] = useState(false);
  const [fieldsMessage, setFieldsMessage] = useState(null);
  const [availableFields, setAvailableFields] = useState([]);
  const [impactField, setImpactField] = useState(null);
  const [likelihoodField, setLikelihoodField] = useState(null);
  const [riskScoreField, setRiskScoreField] = useState(null);

  const fieldOptions = useMemo(
    () =>
      availableFields.map((field) => ({
        label: `${field.name} (${field.id})`,
        value: field.id
      })),
    [availableFields]
  );

  const toOption = (fieldId) => {
    if (!fieldId) return null;
    return fieldOptions.find((option) => option.value === String(fieldId)) || null;
  };

  const loadFieldMapping = async () => {
    setFieldsLoading(true);
    setFieldsMessage(null);

    try {
      const [fieldsResult, mappingResult] = await Promise.all([
        invoke('getRiskFields'),
        invoke('getRiskMapping')
      ]);

      if (!fieldsResult?.success) {
        throw new Error(fieldsResult?.error || 'Failed to load available fields.');
      }
      if (!mappingResult?.success) {
        throw new Error(mappingResult?.error || 'Failed to load field mapping.');
      }

      const fields = fieldsResult.fields || [];
      setAvailableFields(fields);

      const mapping = mappingResult.mapping || {};
      const optionsById = new Map(
        fields.map((field) => [
          String(field.id),
          { label: `${field.name} (${field.id})`, value: String(field.id) }
        ])
      );

      setImpactField(optionsById.get(String(mapping.IMPACT)) || null);
      setLikelihoodField(optionsById.get(String(mapping.LIKELIHOOD)) || null);
      setRiskScoreField(optionsById.get(String(mapping.RISK_SCORE)) || null);
    } catch (error) {
      setFieldsMessage({
        appearance: 'error',
        title: `Load error: ${error.message}`
      });
    } finally {
      setFieldsLoading(false);
    }
  };

  useEffect(() => {
    const loadConfig = async () => {
      setConfigLoading(true);
      setConfigMessage(null);

      try {
        const [typesResult, configResult] = await Promise.all([
          invoke('getIssueTypes'),
          invoke('getRiskConfig')
        ]);

        if (!typesResult?.success) {
          throw new Error(typesResult?.error || 'Issue types could not be loaded.');
        }
        if (!configResult?.success) {
          throw new Error(configResult?.error || 'Visibility config could not be loaded.');
        }

        setIssueTypes(typesResult.issueTypes || []);
        setSelectedIssueTypeIds(configResult.enabledIssueTypeIds || []);
        setLastConfiguredAt(configResult.updatedAt || null);
      } catch (error) {
        setConfigMessage({
          appearance: 'error',
          title: `Load error: ${error.message}`
        });
      } finally {
        setConfigLoading(false);
      }
    };

    loadConfig();
    loadFieldMapping();
  }, []);


  const selectedTypeNames = useMemo(() => {
    if (selectedIssueTypeIds.length === 0) return [];
    const byId = new Map(issueTypes.map((type) => [type.id, type.name]));
    return selectedIssueTypeIds.map((id) => byId.get(id)).filter(Boolean);
  }, [issueTypes, selectedIssueTypeIds]);

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    setConfigMessage(null);

    try {
      const result = await invoke('saveRiskConfig', {
        enabledIssueTypeIds: selectedIssueTypeIds
      });

      if (!result?.success) {
        setConfigMessage({
          appearance: 'error',
          title: result?.error || 'Failed to save visibility configuration.'
        });
        return;
      }

      setLastConfiguredAt(result.updatedAt || new Date().toISOString());
      setConfigMessage({
        appearance: 'confirmation',
        title:
          selectedIssueTypeIds.length === 0
            ? 'Configuration saved. Risk Score is hidden for all issue types.'
            : `Configuration saved. Risk Score is enabled for ${selectedIssueTypeIds.length} issue type(s).`
      });
    } catch (error) {
      setConfigMessage({
        appearance: 'error',
        title: `Save error: ${error.message}`
      });
    } finally {
      setConfigSaving(false);
    }
  };

  const handleSetupFields = async () => {
    setSetupLoading(true);
    setSetupMessage(null);
    setFieldIds(null);

    try {
      const result = await invoke('setupFields');
      if (!result?.success) {
        setSetupMessage({
          appearance: 'error',
          title: result?.error || 'Failed to create default Risk Score fields.'
        });
        return;
      }

      setFieldIds(result.fieldIds || {});
      setSetupMessage({
        appearance: 'confirmation',
        title:
          Number(result.createdCount) > 0
            ? `Default fields ready (${result.createdCount} created).`
            : 'Default fields ready (reused existing managed fields).'
      });

      await loadFieldMapping();
    } catch (error) {
      setSetupMessage({
        appearance: 'error',
        title: `Setup error: ${error.message}`
      });
    } finally {
      setSetupLoading(false);
    }
  };

  const handleSaveFieldMapping = async () => {
    setFieldsSaving(true);
    setFieldsMessage(null);

    try {
      const mapping = {
        IMPACT: impactField?.value,
        LIKELIHOOD: likelihoodField?.value,
        RISK_SCORE: riskScoreField?.value
      };

      const result = await invoke('saveRiskMapping', { mapping });
      if (!result?.success) {
        setFieldsMessage({
          appearance: 'error',
          title: result?.error || 'Failed to save field mapping.'
        });
        return;
      }

      setFieldsMessage({
        appearance: 'confirmation',
        title: 'Field mapping saved.'
      });
    } catch (error) {
      setFieldsMessage({
        appearance: 'error',
        title: `Save error: ${error.message}`
      });
    } finally {
      setFieldsSaving(false);
    }
  };

  return (
    <Stack space="space.300">
      <Heading size="medium">Risk Score Configuration</Heading>

      <Box>
        <Stack space="space.150">
          <Heading size="small">Field Mapping</Heading>
          <Text>
            Map the calculator to your Jira number fields. The app writes values by field ID.
          </Text>

          {fieldsMessage ? (
            <SectionMessage appearance={fieldsMessage.appearance} title={fieldsMessage.title}>
              <Text />
            </SectionMessage>
          ) : null}

          {fieldsLoading ? (
            <Inline space="space.100" alignBlock="center">
              <Spinner size="small" />
              <Text>Loading fields and mapping…</Text>
            </Inline>
          ) : (
            <Stack space="space.100">
              <Text>Impact field</Text>
              <Select options={fieldOptions} value={impactField} onChange={setImpactField} />

              <Text>Likelihood field</Text>
              <Select options={fieldOptions} value={likelihoodField} onChange={setLikelihoodField} />

              <Text>Risk Score field</Text>
              <Select options={fieldOptions} value={riskScoreField} onChange={setRiskScoreField} />
            </Stack>
          )}

          <Inline space="space.100">
            <Button
              appearance="primary"
              isDisabled={fieldsSaving || fieldsLoading}
              onClick={handleSaveFieldMapping}
            >
              {fieldsSaving ? 'Saving mapping…' : 'Save field mapping'}
            </Button>
            <Button appearance="subtle" isDisabled={fieldsLoading} onClick={loadFieldMapping}>
              Refresh fields
            </Button>
          </Inline>

          <Stack space="space.050">
            <Text>Current mapping:</Text>
            <Text>IMPACT: {impactField?.value || 'not mapped'}</Text>
            <Text>LIKELIHOOD: {likelihoodField?.value || 'not mapped'}</Text>
            <Text>RISK_SCORE: {riskScoreField?.value || 'not mapped'}</Text>
          </Stack>
        </Stack>
      </Box>

      <Box>
        <Stack space="space.150">
          <Heading size="small">Default Field Setup</Heading>
          <Text>
            Create app-managed default fields and automatically map them. Optional if you map existing fields.
          </Text>

          {setupMessage ? (
            <SectionMessage appearance={setupMessage.appearance} title={setupMessage.title}>
              <Text />
            </SectionMessage>
          ) : null}

          <Button appearance="primary" isDisabled={setupLoading} onClick={handleSetupFields}>
            {setupLoading ? 'Preparing fields…' : 'Create default fields and map them'}
          </Button>

          {fieldIds ? (
            <Stack space="space.050">
              <Text>Field mapping from setup:</Text>
              {Object.entries(fieldIds).map(([key, value]) => (
                <Text key={key}>
                  {key}: {String(value)}
                </Text>
              ))}
            </Stack>
          ) : null}
        </Stack>
      </Box>

      <Box>
        <Stack space="space.150">
          <Heading size="small">Visibility Configuration</Heading>
          <Text>Choose issue types where Risk Score should be visible in the issue sidebar.</Text>

          <Inline space="space.100" alignBlock="center">
            <Lozenge appearance="new">Enabled</Lozenge>
            <Text>
              {selectedIssueTypeIds.length} of {issueTypes.length || 0} issue types selected
            </Text>
          </Inline>

          {lastConfiguredAt ? (
            <Text>Last configured: {formatTimestamp(lastConfiguredAt)}</Text>
          ) : (
            <Text>Last configured: not available</Text>
          )}

          {configMessage ? (
            <SectionMessage appearance={configMessage.appearance} title={configMessage.title}>
              <Text />
            </SectionMessage>
          ) : null}

          {configLoading ? (
            <Inline space="space.100" alignBlock="center">
              <Spinner size="small" />
              <Text>Loading issue types…</Text>
            </Inline>
          ) : (
            <IssueTypeSelector
              allTypes={issueTypes}
              selectedIds={selectedIssueTypeIds}
              onChange={setSelectedIssueTypeIds}
            />
          )}

          <Button
            appearance="primary"
            isDisabled={configSaving || configLoading}
            onClick={handleSaveConfig}
          >
            {configSaving ? 'Saving configuration…' : 'Save configuration'}
          </Button>

          <Text>
            Enabled for: {selectedTypeNames.length === 0 ? 'none' : selectedTypeNames.join(', ')}
          </Text>
        </Stack>
      </Box>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
