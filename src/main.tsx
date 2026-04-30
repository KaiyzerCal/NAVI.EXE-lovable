import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

async function boot() {
  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  if (SENTRY_DSN) {
    try {
      const Sentry = await import("@sentry/react");
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.2,
        replaysOnErrorSampleRate: 1.0,
        replaysSessionSampleRate: 0.05,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration(),
        ],
      });
    } catch {
      // Sentry not installed — silent fail
    }
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

boot();
