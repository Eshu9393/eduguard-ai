import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

type State = { error: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="font-display text-3xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-ink-soft">
            The page hit an unexpected problem. Reload and try again.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-lg border border-line bg-white p-4 text-xs text-risk">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-dark"
          >
            Reload the page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}