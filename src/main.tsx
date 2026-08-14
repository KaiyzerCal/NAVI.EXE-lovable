import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import ErrorFallback from "./components/ErrorFallback.tsx";
import "./index.css";
import { checkForUpdate, confirmBootSuccess } from "./lib/liveUpdate";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

// Last-resort boundary: catches anything that crashes outside the routed
// page content itself (auth, providers, app shell) — the per-route
// boundary in App.tsx handles the common case of one page misbehaving.
// Wrapped in an IIFE rather than top-level await — Vite's default build
// target includes safari13, which predates it.
void (async () => {
  // No-ops on web; on native it either finds nothing new (returns
  // immediately) or triggers reload() and this script re-runs fresh.
  await checkForUpdate();

  createRoot(document.getElementById("root")!).render(
    <Sentry.ErrorBoundary fallback={({ resetError }) => <ErrorFallback resetError={resetError} fullScreen />}>
      <App />
    </Sentry.ErrorBoundary>
  );

  // Confirms the bundle that just rendered is good — must come after a
  // real render. If this is never reached (crash on startup), the
  // plugin's readyTimeout auto-rolls-back to the last known-good bundle
  // on next launch.
  void confirmBootSuccess();
})();
