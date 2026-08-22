import { useState } from "react";
import { AlertTriangle, RotateCcw, Home, Copy, ChevronDown, ChevronRight } from "lucide-react";

// Shown by the Sentry error boundaries in App.tsx (per-route) and main.tsx
// (whole-app last resort).
//
// This used to render a fixed sentence — "It's been reported automatically" —
// and discard the error entirely. Both halves were a problem on native:
//
//   * Sentry is initialised with `enabled: !!import.meta.env.VITE_SENTRY_DSN`,
//     and VITE_SENTRY_DSN is not in vite.config.ts's `define` block nor in the
//     Android build environment. So in the APK the DSN is undefined, Sentry is
//     switched off, and nothing is reported. The reassurance was false exactly
//     where it mattered most.
//   * The boundary receives the error and this component never asked for it,
//     so a crash on a device produced no recoverable information at all.
//
// The error is now shown, with the stack behind a toggle and a copy button, so
// a crash on a phone can actually be reported by the person holding it.
const SENTRY_ENABLED = !!import.meta.env.VITE_SENTRY_DSN;

export default function ErrorFallback({
  resetError,
  error,
  componentStack,
  eventId,
  fullScreen = false,
}: {
  resetError: () => void;
  error?: unknown;
  componentStack?: string;
  eventId?: string;
  fullScreen?: boolean;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [copied, setCopied] = useState(false);

  const message =
    error instanceof Error ? error.message
    : typeof error === "string" ? error
    : error ? JSON.stringify(error)
    : "";
  const stack = error instanceof Error ? error.stack ?? "" : "";
  const detail = [message && `Error: ${message}`, stack, componentStack && `Component stack:${componentStack}`]
    .filter(Boolean)
    .join("\n\n");

  const copyDetail = () => {
    void navigator.clipboard.writeText(detail || "(no error detail captured)");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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
          This part of NAVI.EXE hit an unexpected error.
          {SENTRY_ENABLED
            ? ` It's been reported automatically${eventId ? ` (${eventId.slice(0, 8)})` : ""} — try again, or head back to the dashboard.`
            : " Copy the detail below if you're reporting it, then try again."}
        </p>
      </div>

      {message && (
        <div className="w-full max-w-md text-left">
          <p className="font-mono text-xs text-destructive break-words px-3 py-2 rounded bg-destructive/5 border border-destructive/20">
            {message}
          </p>
          {(stack || componentStack) && (
            <>
              <button
                onClick={() => setShowDetail((v) => !v)}
                className="mt-2 flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                {showDetail ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                {showDetail ? "hide detail" : "show detail"}
              </button>
              {showDetail && (
                <pre className="mt-1 max-h-52 overflow-auto whitespace-pre-wrap break-words text-[10px] font-mono text-muted-foreground bg-muted/40 border border-border rounded p-2">
                  {detail}
                </pre>
              )}
            </>
          )}
          <button
            onClick={copyDetail}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-muted-foreground text-[11px] font-mono hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            <Copy size={11} /> {copied ? "COPIED" : "COPY ERROR"}
          </button>
        </div>
      )}

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
