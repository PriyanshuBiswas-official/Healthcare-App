import PostHog from 'posthog-react-native';
import { POSTHOG_HOST, POSTHOG_PROJECT_TOKEN } from '@env';

const hasProjectToken = Boolean(
  POSTHOG_PROJECT_TOKEN && POSTHOG_PROJECT_TOKEN !== 'phc_your_project_token_here',
);
const hasHost = Boolean(POSTHOG_HOST);
const isPostHogConfigured = hasProjectToken && hasHost;

if (__DEV__) {
  if (!hasProjectToken) {
    console.error(
      'POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once POSTHOG_PROJECT_TOKEN is configured',
    );
  }
  if (!hasHost) {
    console.error(
      'POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once POSTHOG_HOST is configured',
    );
  }
}

export const posthog = isPostHogConfigured
  ? new PostHog(POSTHOG_PROJECT_TOKEN, {
      host: POSTHOG_HOST,
      captureAppLifecycleEvents: true,
      errorTracking: {
        autocapture: {
          uncaughtExceptions: true,
          unhandledRejections: true,
          console: false,
        },
      },
    })
  : undefined;
