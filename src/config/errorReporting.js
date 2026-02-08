// src/config/errorReporting.js
// Sentry error monitoring - gracefully degrades if DSN not configured

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

let initialized = false;

export function initErrorReporting() {
  if (initialized) return;
  initialized = true;

  if (!SENTRY_DSN) {
    if (import.meta.env.DEV) {
      console.info('[ErrorReporting] No VITE_SENTRY_DSN set — errors will only log to console.');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.2,
    replaysOnErrorSampleRate: 0,
  });
}

export function reportError(error, context = {}) {
  if (SENTRY_DSN && initialized) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('[ErrorReporting]', error, context);
  }
}

export function setErrorUser(user) {
  if (SENTRY_DSN && initialized && user) {
    Sentry.setUser({
      id: user.uid,
      role: user.role,
    });
  }
}

export function clearErrorUser() {
  if (SENTRY_DSN && initialized) {
    Sentry.setUser(null);
  }
}
