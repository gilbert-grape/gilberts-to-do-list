import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppShell } from "./app-shell.tsx";
import { useSettingsStore } from "@/features/settings/store.ts";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => {
      const translations: Record<string, string> = {
        "app.greeting": `Hello ${options?.name ?? ""}!`,
        "app.title": "Gilberts To-Do List",
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
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({ userName: "Löli" });
  });

  it("renders header with greeting using store name", () => {
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

  describe("during onboarding", () => {
    it("shows app title instead of greeting", () => {
      renderWithRouter("/onboarding");
      expect(screen.getByText("Gilberts To-Do List")).toBeInTheDocument();
      expect(screen.queryByText(/Hello/)).not.toBeInTheDocument();
    });

    it("hides nav buttons", () => {
      renderWithRouter("/onboarding");
      expect(
        screen.queryByRole("button", { name: "Statistics" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Settings" }),
      ).not.toBeInTheDocument();
    });
  });

  it("falls back to empty name when userName is empty", () => {
    useSettingsStore.setState({ userName: "" });
    renderWithRouter();
    expect(screen.getByText("Hello !")).toBeInTheDocument();
  });
});
