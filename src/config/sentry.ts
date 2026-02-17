import * as Sentry from "@sentry/react";

export const initSentry = () => {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,

        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
            }),
        ],

        // Performance Monitoring
        tracesSampleRate: 1.0,

        // Session Replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,

        // Environment
        environment: import.meta.env.MODE,

        // Enhanced error context for Seer AI
        beforeSend(event) {
            // Add custom context for better AI understanding
            if (event.exception) {
                event.tags = {
                    ...event.tags,
                    'error.category': 'frontend',
                    'error.framework': 'react',
                    'error.runtime': 'browser',
                };

                // Add breadcrumbs for better context
                event.contexts = {
                    ...event.contexts,
                    app: {
                        name: 'sentry-seer-ai-frontend',
                        version: '1.0.0',
                    },
                };
            }
            return event;
        },
    });
};
