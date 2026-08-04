import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message ?? "Unknown error" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[GlobalErrorBoundary] Uncaught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-card border border-destructive/40 rounded p-8 text-center space-y-4">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              // SYSTEM ERROR
            </p>
            <h1 className="font-display text-2xl font-bold text-destructive tracking-wider">
              FATAL EXCEPTION
            </h1>
            <p className="font-mono text-sm text-destructive/80 break-words">
              {this.state.errorMessage}
            </p>
            <p className="font-body text-xs text-muted-foreground">
              An unexpected error occurred. Please reload to restart your session.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 rounded border border-primary text-primary font-display text-xs tracking-widest uppercase hover:bg-primary/10 transition-colors"
            >
              RELOAD
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
