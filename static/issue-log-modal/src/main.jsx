import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { invoke, view } from '@forge/bridge';
import Button from '@atlaskit/button/new';
import '@atlaskit/css-reset';
import './styles.css';

const I18N = {
  en: {
    missingIssueKey: 'Issue key is missing.',
    failedToLoadLogs: 'Failed to load logs.',
    loadError: 'Load error',
    contextError: 'Context error',
    logsFor: 'Logs for',
    close: 'Close',
    refreshing: 'Refreshing…',
    refresh: 'Refresh',
    loadingLogs: 'Loading logs…',
    noLogsYet: 'No logs for this issue yet.',
    time: 'Time',
    impact: 'Impact',
    likelihood: 'Likelihood',
    score: 'Score',
    priority: 'Priority',
    by: 'By',
    origin: 'Origin',
    unknown: 'Unknown',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW'
  },
  nl: {
    missingIssueKey: 'Issue key ontbreekt.',
    failedToLoadLogs: 'Logs konden niet worden geladen.',
    loadError: 'Laadfout',
    contextError: 'Contextfout',
    logsFor: 'Logs voor',
    close: 'Sluiten',
    refreshing: 'Verversen…',
    refresh: 'Verversen',
    loadingLogs: 'Logs laden…',
    noLogsYet: 'Nog geen logs voor dit issue.',
    time: 'Tijd',
    impact: 'Impact',
    likelihood: 'Waarschijnlijkheid',
    score: 'Score',
    priority: 'Prioriteit',
    by: 'Door',
    origin: 'Herkomst',
    unknown: 'Onbekend',
    high: 'HOOG',
    medium: 'MIDDEL',
    low: 'LAAG'
  }
};

const getLanguageFromLocale = (locale) =>
  String(locale || '').toLowerCase().startsWith('nl') ? 'nl' : 'en';

const formatTimestamp = (value, language) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
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

function App() {
  const [language, setLanguage] = useState('en');
  const [issueKey, setIssueKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const strings = I18N[language] || I18N.en;

  const loadLogs = useCallback(async (key, lang) => {
    const currentLanguage = lang || language;
    const currentStrings = I18N[currentLanguage] || I18N.en;
    if (!key) {
      setError(currentStrings.missingIssueKey);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await invoke('getRiskLogsForIssue', {
        issueKey: key,
        limit: 100
      });

      if (!result?.success) {
        setError(result?.error || currentStrings.failedToLoadLogs);
        return;
      }

      setLogs(result.logs || []);
    } catch (loadError) {
      setError(`${currentStrings.loadError}: ${loadError.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const context = await view.getContext();
        const locale =
          context?.locale ||
          context?.user?.locale ||
          context?.platformContext?.locale ||
          '';
        const detectedLanguage = getLanguageFromLocale(locale);
        setLanguage(detectedLanguage);
        const key =
          context?.extension?.modal?.issueKey ||
          context?.extension?.issue?.key ||
          '';
        setIssueKey(key);
        await loadLogs(key, detectedLanguage);
      } catch (contextError) {
        setError(`${I18N.en.contextError}: ${contextError.message}`);
        setLoading(false);
      }
    })();
  }, [loadLogs]);

  return (
    <div className="modal-page">
      <div className="modal-header">
        <h2>{strings.logsFor} {issueKey || '-'}</h2>
        <Button appearance="subtle" onClick={() => view.close()}>
          {strings.close}
        </Button>
      </div>

      <div className="toolbar">
        <Button appearance="subtle" isDisabled={loading} onClick={() => loadLogs(issueKey)}>
          {loading ? strings.refreshing : strings.refresh}
        </Button>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      {loading ? (
        <div className="muted">{strings.loadingLogs}</div>
      ) : logs.length === 0 ? (
        <div className="muted">{strings.noLogsYet}</div>
      ) : (
        <div className="table-wrap">
          <table className="log-table">
            <thead>
              <tr>
                <th>{strings.time}</th>
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
                <tr key={`${entry.timestamp}-${index}`}>
                  <td>{formatTimestamp(entry.timestamp, language)}</td>
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
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
