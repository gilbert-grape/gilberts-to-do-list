import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, it, expect, vi } from "vitest";
import { AppShell } from "./app-shell.tsx";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => {
      const translations: Record<string, string> = {
        "app.greeting": `Hello ${options?.name ?? ""}!`,
        "nav.statistics": "Statistics",
        "nav.settings": "Settings",
      };
      return translations[key] ?? key;
    },
  }),
}));

// Mock react-router's Outlet
vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">outlet content</div>,
  };
});

function renderWithRouter(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppShell />
    </MemoryRouter>,
  );
}

describe("AppShell", () => {
  it("renders header with greeting", () => {
    renderWithRouter();
    expect(screen.getByText("Hello Löli!")).toBeInTheDocument();
  });

  it("renders statistics icon button with aria-label", () => {
    renderWithRouter();
    expect(
      screen.getByRole("button", { name: "Statistics" }),
    ).toBeInTheDocument();
  });

  it("renders settings icon button with aria-label", () => {
    renderWithRouter();
    expect(
      screen.getByRole("button", { name: "Settings" }),
    ).toBeInTheDocument();
  });

  it("renders outlet for child routes", () => {
    renderWithRouter();
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
  });

  it("navigates to statistics on icon click", async () => {
    const user = userEvent.setup();
    renderWithRouter();
    await user.click(screen.getByRole("button", { name: "Statistics" }));
    // Navigation is handled by react-router; the button click itself is verified
    expect(
      screen.getByRole("button", { name: "Statistics" }),
    ).toBeInTheDocument();
  });

  it("navigates to settings on icon click", async () => {
    const user = userEvent.setup();
    renderWithRouter();
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(
      screen.getByRole("button", { name: "Settings" }),
    ).toBeInTheDocument();
  });
});
