"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Archflow render error", error, info.componentStack);
  }

  render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}

export function AppCrashFallback() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-[#0b0d10] px-6 text-[#e7e4dc]">
      <p className="text-sm">Archflow hit a render error. Reload the page to get a fresh sketch.</p>
      <button type="button" className="arch-btn" onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  );
}
