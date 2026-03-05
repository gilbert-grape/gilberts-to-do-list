import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ErrorBoundary } from "./error-boundary.tsx";

vi.mock("@/app/i18n.ts", () => ({
  default: {
    t: (key: string) => {
      const translations: Record<string, string> = {
        "errors.somethingWentWrong": "Something went wrong",
        "errors.reloadMessage":
          "An unexpected error occurred. Please reload the page.",
        "errors.reload": "Reload",
      };
      return translations[key] ?? key;
    },
  },
}));

function ThrowingComponent(): React.ReactNode {
  throw new Error("Test error");
}

function GoodComponent() {
  return <p>Hello world</p>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders error UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText(
        "An unexpected error occurred. Please reload the page.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Reload")).toBeInTheDocument();
  });

  it("renders a reload button", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
  });

  it("calls window.location.reload on button click", async () => {
    const user = userEvent.setup();
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    await user.click(screen.getByRole("button", { name: "Reload" }));
    expect(reloadMock).toHaveBeenCalled();
  });
});
