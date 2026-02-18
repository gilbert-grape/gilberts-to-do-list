import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import i18n from "@/app/i18n.ts";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md space-y-4 text-center">
            <h1 className="text-xl font-bold text-[var(--color-text)]">
              {i18n.t("errors.somethingWentWrong")}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {i18n.t("errors.reloadMessage")}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
            >
              {i18n.t("errors.reload")}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
