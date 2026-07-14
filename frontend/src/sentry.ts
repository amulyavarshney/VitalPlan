export async function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  const Sentry = await import('@sentry/react');
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1),
  });
}

export async function captureException(error: unknown, extra?: Record<string, unknown>) {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  const Sentry = await import('@sentry/react');
  Sentry.captureException(error, { extra });
}
