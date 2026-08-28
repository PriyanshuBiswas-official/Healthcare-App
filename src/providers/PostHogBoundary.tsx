import React from 'react';
import type { ReactNode } from 'react';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '../config/posthog';

export function PostHogBoundary({ children }: { children: ReactNode }) {
  return posthog ? <PostHogProvider client={posthog}>{children}</PostHogProvider> : <>{children}</>;
}
