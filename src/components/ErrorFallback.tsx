import { AlertTriangle, RotateCcw, Home } from "lucide-react";

// Shown by the Sentry error boundaries in App.tsx (per-route) and
// main.tsx (whole-app last resort). Sentry.ErrorBoundary already reports
// the error and calls resetError() to retry — this is just the UI.
export default function ErrorFallback({
  resetError,
  fullScreen = false,
}: {
  resetError: () => void;
  fullScreen?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-4 p-8 ${
        fullScreen ? "min-h-screen" : "min-h-[60vh]"
      }`}
    >
      <div className="w-14 h-14 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center">
        <AlertTriangle size={26} className="text-destructive" />
      </div>
      <div>
        <h1 className="font-display text-lg font-bold tracking-wider text-foreground">
          SOMETHING WENT WRONG
        </h1>
        <p className="text-xs font-mono text-muted-foreground mt-1 max-w-sm">
          This part of NAVI.EXE hit an unexpected error. It's been reported automatically — try again, or head back to the dashboard.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={resetError}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary/40 bg-primary/10 text-primary text-xs font-mono hover:bg-primary/20 transition-colors"
        >
          <RotateCcw size={12} /> TRY AGAIN
        </button>
        <button
          onClick={() => { window.location.href = "/"; }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-muted-foreground text-xs font-mono hover:text-foreground hover:border-foreground/40 transition-colors"
        >
          <Home size={12} /> DASHBOARD
        </button>
      </div>
    </div>
  );
}
