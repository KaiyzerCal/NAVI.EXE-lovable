import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { Capacitor } from "@capacitor/core";
import { isTauri } from "@tauri-apps/api/core";
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

// Render immediately — never block first paint on a network call. checkForUpdate()
// runs in the background after render instead (see below); if it finds an
// update it stages it for the next full restart rather than reloading live.
createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={({ error, componentStack, eventId, resetError }) => (
      <ErrorFallback error={error} componentStack={componentStack} eventId={eventId} resetError={resetError} fullScreen />
    )}>
    <App />
  </Sentry.ErrorBoundary>
);

// Confirms the bundle that just rendered is good — must come after a real
// render. If this is never reached (crash on startup), the plugin's
// readyTimeout auto-rolls-back to the last known-good bundle on next launch.
void confirmBootSuccess();

void checkForUpdate();

// Web-only: sw.js's own PWA offline/push-notification job is redundant on
// native (LiveUpdate already caches the current bundle locally; native push
// goes through @capacitor/push-notifications instead) and on Tauri desktop
// (no OTA channel at all — checkForUpdate() no-ops there via
// Capacitor.isNativePlatform()). Registering it anyway risks a stale
// cache-first response getting served after a rebuild/update — same
// "renders, but app state never loads" failure mode as mythos-vantara's
// VANTARA.EXE hit before this same isTauri() check was added there.
if (Capacitor.isNativePlatform() || isTauri()) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => {});
  }
  if ("caches" in window) {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
  }
} else if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
