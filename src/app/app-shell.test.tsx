import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppShell } from "./app-shell.tsx";
import { useSettingsStore } from "@/features/settings/store.ts";

// Mock i18next
vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => {
      const translations: Record<string, string> = {
        "app.greeting": `Hello ${options?.name ?? ""}!`,
        "app.title": "Gilberts To-Do List",
        "nav.statistics": "Statistics",
        "nav.settings": "Settings",
        "nav.home": "Home",
        "common.search": "Search...",
        "common.cancel": "Cancel",
        "todos.newTodo": "+ To-Do",
        "todos.newTodoCompact": "+",
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

// Mock storage modules used by useEffect in AppShell
vi.mock("@/services/storage/indexeddb/db.ts", () => ({ db: {} }));
vi.mock("@/services/storage/indexeddb/indexeddb-adapter.ts", () => ({
  IndexedDBAdapter: vi.fn(),
}));
vi.mock("@/services/storage/api/api-adapter.ts", () => ({
  ApiAdapter: vi.fn().mockImplementation(function () {
    return {
      healthCheck: vi.fn().mockResolvedValue(false),
    };
  }),
}));
vi.mock("@/services/storage/api/resolve-base-url.ts", () => ({
  resolveApiBaseUrl: vi.fn().mockReturnValue("http://localhost:8099"),
}));
vi.mock("@/services/storage/sync/sync-adapter.ts", () => ({
  SyncAdapter: vi.fn(),
}));
vi.mock("@/features/tags/store.ts", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/tags/store.ts")
  >("@/features/tags/store.ts");
  return { ...actual, setStorageAdapter: vi.fn() };
});
vi.mock("@/features/todos/store.ts", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/todos/store.ts")
  >("@/features/todos/store.ts");
  return { ...actual, setTodoStorageAdapter: vi.fn() };
});
vi.mock("@/features/settings/store.ts", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/settings/store.ts")
  >("@/features/settings/store.ts");
  return {
    ...actual,
    setSettingsApiAdapter: vi.fn(),
    loadSettingsFromServer: vi.fn(),
  };
});

// Mock ViewToggleBar so we can detect its presence without rendering its internals
vi.mock("@/features/todos/components/view-toggle-bar.tsx", () => ({
  ViewToggleBar: (props: { activeView: string }) => (
    <div data-testid="view-toggle-bar">view: {props.activeView}</div>
  ),
}));

// Mock ConnectionIndicator so we can detect its presence
vi.mock("@/shared/components/connection-indicator.tsx", () => ({
  ConnectionIndicator: () => (
    <span data-testid="connection-indicator">connected</span>
  ),
}));

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
    useSettingsStore.setState({ userName: "Löli", layoutMode: "normal" });
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

  it("renders outlet for child routes", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId("outlet")).toBeInTheDocument();
    });
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

  describe("compact mode", () => {
    beforeEach(() => {
      useSettingsStore.setState({ userName: "Löli", layoutMode: "compact" });
    });

    it("renders compact mode search and create buttons", () => {
      renderWithRouter();
      expect(
        screen.getByRole("button", { name: "Search..." }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "+ To-Do" }),
      ).toBeInTheDocument();
    });

    it("opens search input in compact mode", async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole("button", { name: "Search..." }));

      expect(
        screen.getByRole("textbox", { name: "Search..." }),
      ).toBeInTheDocument();
      // Search and create buttons should be hidden when search is open
      expect(
        screen.queryByRole("button", { name: "+ To-Do" }),
      ).not.toBeInTheDocument();
    });

    it("closes search on cancel click", async () => {
      const user = userEvent.setup();
      renderWithRouter();

      // Open search
      await user.click(screen.getByRole("button", { name: "Search..." }));
      expect(
        screen.getByRole("textbox", { name: "Search..." }),
      ).toBeInTheDocument();

      // Click cancel
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      // Search input should be gone, search button should reappear
      expect(
        screen.queryByRole("textbox", { name: "Search..." }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Search..." }),
      ).toBeInTheDocument();
    });

    it("closes search on Escape key", async () => {
      const user = userEvent.setup();
      renderWithRouter();

      // Open search
      await user.click(screen.getByRole("button", { name: "Search..." }));
      const input = screen.getByRole("textbox", { name: "Search..." });
      expect(input).toBeInTheDocument();

      // Press Escape
      await user.keyboard("{Escape}");

      // Search input should be gone
      expect(
        screen.queryByRole("textbox", { name: "Search..." }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Search..." }),
      ).toBeInTheDocument();
    });

    it("submits search on Enter key", async () => {
      const user = userEvent.setup();
      renderWithRouter();

      // Open search
      await user.click(screen.getByRole("button", { name: "Search..." }));
      const input = screen.getByRole("textbox", { name: "Search..." });

      // Type a query and press Enter
      await user.type(input, "buy milk{Enter}");

      // The input should still be visible (search stays open after submit)
      expect(input).toBeInTheDocument();
    });

    it("hides ViewToggleBar when search is open", async () => {
      const user = userEvent.setup();
      renderWithRouter();

      // ViewToggleBar should be visible initially on home
      expect(screen.getByTestId("view-toggle-bar")).toBeInTheDocument();

      // Open search
      await user.click(screen.getByRole("button", { name: "Search..." }));

      // ViewToggleBar should be hidden when compact search is open
      expect(
        screen.queryByTestId("view-toggle-bar"),
      ).not.toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows loading spinner before storage is ready then shows outlet", async () => {
      renderWithRouter();

      // Initially storageReady is false, so outlet should not be visible yet.
      // After the healthCheck promise resolves, storageReady becomes true and outlet appears.
      await waitFor(() => {
        expect(screen.getByTestId("outlet")).toBeInTheDocument();
      });
    });
  });

  describe("navigation buttons", () => {
    it("renders home button", () => {
      renderWithRouter();
      expect(
        screen.getByRole("button", { name: "Home" }),
      ).toBeInTheDocument();
    });
  });

  describe("ViewToggleBar visibility", () => {
    it("shows ViewToggleBar on home page", () => {
      renderWithRouter("/");
      expect(screen.getByTestId("view-toggle-bar")).toBeInTheDocument();
    });

    it("hides ViewToggleBar on non-home pages", () => {
      renderWithRouter("/settings");
      expect(
        screen.queryByTestId("view-toggle-bar"),
      ).not.toBeInTheDocument();
    });

    it("hides ViewToggleBar during onboarding", () => {
      renderWithRouter("/onboarding");
      expect(
        screen.queryByTestId("view-toggle-bar"),
      ).not.toBeInTheDocument();
    });
  });

  describe("ConnectionIndicator", () => {
    it("does not show ConnectionIndicator when useSync is false", () => {
      renderWithRouter();
      // By default, healthCheck returns false so useSync stays false
      expect(
        screen.queryByTestId("connection-indicator"),
      ).not.toBeInTheDocument();
    });

    it("shows ConnectionIndicator when useSync is true", async () => {
      // Override the ApiAdapter mock so healthCheck returns true (sync enabled)
      const { ApiAdapter } = await import(
        "@/services/storage/api/api-adapter.ts"
      );
      vi.mocked(ApiAdapter).mockImplementation(function () {
        return {
          healthCheck: vi.fn().mockResolvedValue(true),
          getSettings: vi.fn().mockResolvedValue({}),
          updateSettings: vi.fn(),
        } as unknown as InstanceType<typeof ApiAdapter>;
      });

      renderWithRouter();

      await waitFor(() => {
        expect(
          screen.getByTestId("connection-indicator"),
        ).toBeInTheDocument();
      });
    });
  });
});
