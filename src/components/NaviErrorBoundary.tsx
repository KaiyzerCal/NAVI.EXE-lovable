import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  size?: number;
}

interface State {
  hasError: boolean;
}

/**
 * Wraps lazy-loaded Navi character components.
 * If a chunk fails to load (network blip, missing skin), renders a
 * cyberpunk-styled fallback orb instead of a blank space.
 */
export class NaviErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[NaviErrorBoundary] Failed to render Navi character:", error);
  }

  render() {
    if (this.state.hasError) {
      const size = this.props.size ?? 200;
      return (
        <div
          style={{ width: size, height: size }}
          className="relative flex items-center justify-center"
          role="img"
          aria-label="Navi character unavailable"
        >
          <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-pulse-glow" />
          <div className="absolute inset-2 rounded-full border border-primary/20" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
          <div className="relative z-10 text-center">
            <div className="font-display text-primary text-xs font-bold tracking-widest text-glow-cyan">
              NAVI
            </div>
            <div className="font-mono text-[8px] text-muted-foreground mt-0.5">
              SKIN OFFLINE
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default NaviErrorBoundary;