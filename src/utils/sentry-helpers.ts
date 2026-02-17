import * as Sentry from '@sentry/react';

export interface EnhancedErrorContext {
    errorType: 'runtime' | 'validation' | 'network' | 'business-logic';
    severity: 'critical' | 'high' | 'medium' | 'low';
    affectedFeature: string;
    userAction?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    reproductionSteps?: string[];
    relatedFiles?: string[];
    potentialCause?: string;
}

export const captureEnhancedError = (
    error: Error,
    context: EnhancedErrorContext
) => {
    Sentry.withScope((scope) => {
        // Set structured tags for AI parsing
        scope.setTag('error.type', context.errorType);
        scope.setTag('error.severity', context.severity);
        scope.setTag('error.feature', context.affectedFeature);

        // Add detailed context
        scope.setContext('errorDetails', {
            expectedBehavior: context.expectedBehavior,
            actualBehavior: context.actualBehavior,
            userAction: context.userAction,
            potentialCause: context.potentialCause,
        });

        // Add reproduction steps as breadcrumbs
        if (context.reproductionSteps) {
            context.reproductionSteps.forEach((step, index) => {
                scope.addBreadcrumb({
                    category: 'reproduction',
                    message: step,
                    level: 'info',
                    data: { step: index + 1 },
                });
            });
        }

        // Add file context for AI to target fixes
        if (context.relatedFiles) {
            scope.setContext('codeContext', {
                relatedFiles: context.relatedFiles,
                framework: 'react',
                language: 'typescript',
            });
        }

        // Set fingerprint for better grouping
        scope.setFingerprint([
            context.errorType,
            context.affectedFeature,
            error.name,
        ]);

        Sentry.captureException(error);
    });
};

// Example usage function
export const trackButtonClickError = (error: Error, buttonName: string) => {
    captureEnhancedError(error, {
        errorType: 'runtime',
        severity: 'high',
        affectedFeature: 'user-interaction',
        userAction: `Clicked ${buttonName} button`,
        expectedBehavior: 'Button should trigger action without errors',
        actualBehavior: 'Error thrown during click handler execution',
        reproductionSteps: [
            'Navigate to page',
            `Click ${buttonName} button`,
            'Error occurs',
        ],
        relatedFiles: ['src/components/Button.tsx', 'src/handlers/click.ts'],
        potentialCause: 'Null reference or undefined state',
    });
};

// Track API errors with enhanced context
export const trackApiError = (error: Error, endpoint: string, method: string) => {
    captureEnhancedError(error, {
        errorType: 'network',
        severity: 'high',
        affectedFeature: 'api-communication',
        userAction: `API ${method} request to ${endpoint}`,
        expectedBehavior: 'Successful API response',
        actualBehavior: 'API request failed',
        reproductionSteps: [
            `Make ${method} request to ${endpoint}`,
            'Request fails with error',
        ],
        relatedFiles: ['src/services/api.ts'],
        potentialCause: 'Network error, server error, or invalid request',
    });
};
