import React, { Component, type ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Send to Sentry with enhanced context
        Sentry.withScope((scope) => {
            scope.setContext('errorBoundary', {
                componentStack: errorInfo.componentStack,
                errorBoundaryLocation: 'ErrorBoundary',
            });

            scope.setTag('error.boundary', 'react');
            scope.setLevel('error');

            Sentry.captureException(error);
        });
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '20px',
                    textAlign: 'center',
                    background: '#0a0a0c',
                    color: '#e1e1e6'
                }}>
                    <div style={{
                        background: 'rgba(255, 77, 77, 0.1)',
                        border: '1px solid #ff4d4d',
                        borderRadius: '12px',
                        padding: '32px',
                        maxWidth: '500px'
                    }}>
                        <h2 style={{ marginBottom: '16px', color: '#ff4d4d' }}>⚠️ Something went wrong</h2>
                        <p style={{ marginBottom: '24px', opacity: 0.8 }}>
                            Our AI is analyzing this issue and will create a fix automatically.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: '#6b46c1',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
