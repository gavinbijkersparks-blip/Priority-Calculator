import React, { useEffect, useMemo, useState } from 'react';
import ForgeReconciler, {
  Box,
  Button,
  Heading,
  Inline,
  Lozenge,
  SectionMessage,
  Spinner,
  Stack,
  Text
} from '@forge/react';
import { invoke } from '@forge/bridge';

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

  useEffect(() => {
    const loadConfig = async () => {
      setConfigLoading(true);
      setConfigMessage(null);

      try {
        const [typesResult, configResult] = await Promise.all([
          invoke('getIssueTypes'),
          invoke('getWSJFConfig')
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
  }, []);

  const toggleIssueType = (issueTypeId) => {
    setSelectedIssueTypeIds((current) => {
      if (current.includes(issueTypeId)) {
        return current.filter((id) => id !== issueTypeId);
      }
      return [...current, issueTypeId];
    });
  };

  const selectedTypeNames = useMemo(() => {
    if (selectedIssueTypeIds.length === 0) return [];
    const byId = new Map(issueTypes.map((type) => [type.id, type.name]));
    return selectedIssueTypeIds.map((id) => byId.get(id)).filter(Boolean);
  }, [issueTypes, selectedIssueTypeIds]);

  const handleSelectAll = () => {
    setSelectedIssueTypeIds(issueTypes.map((type) => type.id));
  };

  const handleClearAll = () => {
    setSelectedIssueTypeIds([]);
  };

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    setConfigMessage(null);

    try {
      const result = await invoke('saveWSJFConfig', {
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
            ? 'Configuration saved. WSJF is hidden for all issue types.'
            : `Configuration saved. WSJF is enabled for ${selectedIssueTypeIds.length} issue type(s).`
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
          title: result?.error || 'Failed to create WSJF custom fields.'
        });
        return;
      }
      setFieldIds(result.fieldIds || {});
      setSetupMessage({
        appearance: 'confirmation',
        title: 'Custom fields are ready.'
      });
    } catch (error) {
      setSetupMessage({
        appearance: 'error',
        title: `Setup error: ${error.message}`
      });
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <Stack space="space.300">
      <Heading size="medium">WSJF Configuration</Heading>

      <Box>
        <Stack space="space.150">
          <Heading size="small">Visibility Configuration</Heading>
          <Text>Choose issue types where WSJF should be visible in the issue sidebar.</Text>

          <Inline space="space.100" alignBlock="center">
            <Lozenge appearance="new">Enabled</Lozenge>
            <Text>{selectedIssueTypeIds.length} of {issueTypes.length || 0} issue types selected</Text>
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
            <Stack space="space.100">
              <Inline space="space.100">
                <Button appearance="subtle" onClick={handleSelectAll}>
                  Select all
                </Button>
                <Button appearance="subtle" onClick={handleClearAll}>
                  Clear all
                </Button>
              </Inline>

              <Stack space="space.050">
                {issueTypes.map((issueType) => {
                  const selected = selectedIssueTypeIds.includes(issueType.id);
                  return (
                    <Button
                      key={issueType.id}
                      appearance={selected ? 'primary' : 'subtle'}
                      isDisabled={configSaving}
                      onClick={() => toggleIssueType(issueType.id)}
                    >
                      {selected ? `Enabled: ${issueType.name}` : `Disabled: ${issueType.name}`}
                    </Button>
                  );
                })}
              </Stack>
            </Stack>
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

      <Box>
        <Stack space="space.150">
          <Heading size="small">System Setup</Heading>
          <Text>Create and validate the WSJF custom fields used by the calculator.</Text>

          {setupMessage ? (
            <SectionMessage appearance={setupMessage.appearance} title={setupMessage.title}>
              <Text />
            </SectionMessage>
          ) : null}

          <Button appearance="primary" isDisabled={setupLoading} onClick={handleSetupFields}>
            {setupLoading ? 'Preparing fields…' : 'Create or validate WSJF fields'}
          </Button>

          {fieldIds ? (
            <Stack space="space.050">
              <Text>Field mapping:</Text>
              {Object.entries(fieldIds).map(([key, value]) => (
                <Text key={key}>
                  {key}: {String(value)}
                </Text>
              ))}
            </Stack>
          ) : null}
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
