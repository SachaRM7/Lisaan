// src/analytics/posthog.ts

import PostHog from 'posthog-react-native';

let _client: PostHog | null = null;

export function getPostHog(): PostHog {
  if (!_client) {
    // Fallback hardcodé car Metro ne relit pas toujours .env sans rebuild natif
    const key = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || 'phc_IqV8yiAtDVHlnXVNBTBx9Hq1bCwls8mPazXGDSlhAfn';
    _client = new PostHog(
      key,
      {
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
        disabled: false,
        captureAppLifecycleEvents: true,
        sendFeatureFlagEvent: false,
        preloadFeatureFlags: false,
        flushAt: 20,
        flushInterval: 30000,
      }
    );
  }
  return _client;
}

// Analytics consent gate — set by useSettingsStore on load to avoid circular imports
let _analyticsEnabled = true;
export function setAnalyticsEnabled(enabled: boolean): void {
  _analyticsEnabled = enabled;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function track(event: string, properties?: Record<string, any>): void {
  try {
    if (!_analyticsEnabled) return;
    getPostHog().capture(event, properties);
  } catch (e) {
    console.warn('[Analytics] track error:', e);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function identify(userId: string, traits?: Record<string, any>): void {
  try {
    getPostHog().identify(userId, traits);
  } catch (e) {
    console.warn('[Analytics] identify error:', e);
  }
}

export function reset(): void {
  try {
    getPostHog().reset();
  } catch (e) {
    console.warn('[Analytics] reset error:', e);
  }
}
