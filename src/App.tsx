import { useState, useEffect } from 'react';

import { captureEnhancedError } from './utils/sentry-helpers';
import './App.css';

interface SentryIssue {
  id: string;
  title: string;
  status: 'unresolved' | 'resolved' | 'ignored';
  level: string;
  culprit: string;
  permalink: string;
  lastSeen: string;
  count: number;
  project: {
    name: string;
    slug: string;
  };
  metadata?: {
    type?: string;
    value?: string;
  };
}

function App() {
  const [issues, setIssues] = useState<SentryIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Check if Sentry is configured
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    setConnected(!!dsn && dsn !== 'your-sentry-dsn-here');
  }, []);

  const fetchSentryIssues = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/sentry/issues`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setIssues(data);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
      captureEnhancedError(error as Error, {
        errorType: 'network',
        severity: 'high',
        affectedFeature: 'sentry-integration',
        userAction: 'Fetching Sentry issues',
        expectedBehavior: 'Successfully retrieve issues from backend',
        actualBehavior: 'Failed to fetch issues',
        relatedFiles: ['src/App.tsx', 'backend/src/modules/sentry/sentry.controller.ts'],
        potentialCause: 'Backend not running or Sentry API credentials invalid',
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerRuntimeError = () => {
    try {
      // Intentional error for testing
      const obj: any = null;
      obj.nonExistentMethod();
    } catch (error) {
      captureEnhancedError(error as Error, {
        errorType: 'runtime',
        severity: 'high',
        affectedFeature: 'error-testing',
        userAction: 'Clicked "Test Runtime Error" button',
        expectedBehavior: 'Error should be caught and sent to Sentry',
        actualBehavior: 'TypeError: Cannot read properties of null',
        reproductionSteps: [
          'Navigate to dashboard',
          'Click "Test Runtime Error" button',
          'Error occurs',
        ],
        relatedFiles: ['src/App.tsx'],
        potentialCause: 'Intentional null reference for testing',
      });
    }
  };

  const triggerValidationError = () => {
    const error = new Error('Invalid user input: Email format is incorrect');
    captureEnhancedError(error, {
      errorType: 'validation',
      severity: 'medium',
      affectedFeature: 'form-validation',
      userAction: 'Submitted form with invalid email',
      expectedBehavior: 'Show validation error to user',
      actualBehavior: 'Validation error thrown',
      reproductionSteps: [
        'Navigate to form',
        'Enter invalid email',
        'Submit form',
      ],
      relatedFiles: ['src/components/Form.tsx', 'src/utils/validation.ts'],
      potentialCause: 'Email regex validation failed',
    });
  };

  const triggerNetworkError = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/sentry/issues`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      const error = isTimeout
        ? new Error('Network request failed: timeout after 30s')
        : (err as Error);

      captureEnhancedError(error, {
        errorType: 'network',
        severity: 'critical',
        affectedFeature: 'api-communication',
        userAction: 'Making API request to external service',
        expectedBehavior: 'Receive successful response within 30s',
        actualBehavior: 'Request timeout',
        reproductionSteps: [
          'Trigger API call',
          'Wait for 30 seconds',
          'Timeout error occurs',
        ],
        relatedFiles: ['src/App.tsx'],
        potentialCause: 'Slow network or unresponsive server',
      });
    }
  };

  return (
    <main className="container">
      <header className="header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="logo">SENTRY SEER AI</h1>
            <div
              className={connected ? "status-success" : "status-error"}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                boxShadow: connected ? '0 0 8px var(--success)' : '0 0 8px var(--error)'
              }}
            />
          </div>
          <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Self-Healing Intelligence Engine</p>
        </div>
        <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', gap: '24px' }}>
          <div>
            <small>Status</small>
            <div style={{ color: connected ? 'var(--success)' : 'var(--error)', fontWeight: 700 }}>
              {connected ? 'Connected' : 'Not Configured'}
            </div>
          </div>
        </div>
      </header>

      <div className="grid">
        <section>
          <h2 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>Sentry Issues</h2>

          {!connected && (
            <div className="glass-card" style={{ marginBottom: '16px', background: 'rgba(255, 170, 0, 0.1)', borderColor: 'var(--warning)' }}>
              <h3 style={{ color: 'var(--warning)', marginBottom: '8px' }}>⚠️ Sentry Not Configured</h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                Please add your Sentry DSN to <code>.env</code> file:
              </p>
              <pre style={{ marginTop: '12px', fontSize: '0.8rem' }}>
                VITE_SENTRY_DSN=your-sentry-dsn-here
              </pre>
            </div>
          )}

          <div className="glass-card" style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '1rem' }}>Test Error Scenarios</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="glow-btn" onClick={triggerRuntimeError} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Test Runtime Error
              </button>
              <button className="glow-btn" onClick={triggerValidationError} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Test Validation Error
              </button>
              <button className="glow-btn" onClick={triggerNetworkError} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Test Network Error
              </button>
              <button
                className="glow-btn"
                onClick={fetchSentryIssues}
                disabled={loading}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                {loading ? 'Loading...' : 'Fetch Issues'}
              </button>
            </div>
          </div>

          <div className="issue-list">
            {issues.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }}>👁️</div>
                <p style={{ opacity: 0.6 }}>
                  {loading ? 'Loading issues...' : 'No issues found. Click "Fetch Issues" or trigger a test error.'}
                </p>
              </div>
            ) : (
              issues.map((issue) => (
                <div key={issue.id} className="glass-card issue-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        color: 'var(--accent)',
                        fontWeight: 700,
                        background: 'rgba(107, 70, 193, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {issue.project.name}
                      </span>
                      <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>
                        {new Date(issue.lastSeen).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{issue.title}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px', fontFamily: 'monospace' }}>
                      at {issue.culprit}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '4px' }}>
                      Occurrences: {issue.count}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span className={`status-badge status-${issue.status === 'unresolved' ? 'pending' : 'success'}`}>
                      {issue.status}
                    </span>
                    <a
                      href={issue.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glow-btn"
                      style={{ padding: '8px 16px', fontSize: '0.8rem', textDecoration: 'none' }}
                    >
                      View in Sentry
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="info-panel">
          <div className="glass-card">
            <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Active Integrations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>Sentry Seer AI</span>
                <span className={`status-badge ${connected ? 'status-success' : 'status-error'}`}>
                  {connected ? 'connected' : 'not configured'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>GitHub Actions</span>
                <span className="status-badge status-pending">pending</span>
              </div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '8px' }}>SENTRY CONFIGURATION</div>
                <pre style={{ fontSize: '0.65rem', padding: '12px' }}>
                  {`import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: "your-dsn",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
});`}
                </pre>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>How It Works</h3>
            <ol style={{ fontSize: '0.85rem', lineHeight: '1.8', paddingLeft: '20px' }}>
              <li>Errors are captured with enhanced context</li>
              <li>Sentry Seer AI analyzes the error</li>
              <li>AI generates a code fix</li>
              <li>Automatic PR created on GitHub</li>
              <li>Review and merge the fix</li>
            </ol>
          </div>

          <div className="glass-card">
            <h3 style={{ marginBottom: '8px', fontSize: '0.9rem' }}>System Health</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                <div style={{ width: connected ? '85%' : '20%', height: '100%', background: 'var(--accent)', borderRadius: '2px' }}></div>
              </div>
              <div style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>AI Confidence</span>
                <span>{connected ? '85%' : '20%'}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default App;
