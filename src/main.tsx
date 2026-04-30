import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (SENTRY_DSN) {
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
}

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary
    fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <p className="font-display text-primary text-lg">SYSTEM ERROR</p>
        <p className="font-mono text-xs text-muted-foreground">A critical error occurred. NAVI is working to restore systems.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded border border-primary/30 text-primary text-xs font-mono hover:bg-primary/10 transition-colors"
        >
          REBOOT
        </button>
      </div>
    }
  >
    <App />
  </Sentry.ErrorBoundary>
);
