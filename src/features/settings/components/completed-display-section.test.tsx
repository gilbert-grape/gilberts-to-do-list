import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CompletedDisplaySection } from "./completed-display-section.tsx";
import { useSettingsStore } from "../store.ts";

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "settings.completedDisplay": "Completed Todos Display",
        "settings.completedHidden": "Hidden",
        "settings.completedBottom": "Show at Bottom",
        "settings.completedToggleable": "Toggleable",
      };
      return translations[key] ?? key;
    },
  }),
}));

describe("CompletedDisplaySection", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({
      completedDisplayMode: "bottom",
      setCompletedDisplayMode: vi.fn((mode) => {
        useSettingsStore.setState({ completedDisplayMode: mode });
      }),
    });
  });

  it("renders heading", () => {
    render(<CompletedDisplaySection />);
    expect(screen.getByText("Completed Todos Display")).toBeInTheDocument();
  });

  it("renders three radio options", () => {
    render(<CompletedDisplaySection />);
    expect(screen.getByLabelText("Hidden")).toBeInTheDocument();
    expect(screen.getByLabelText("Show at Bottom")).toBeInTheDocument();
    expect(screen.getByLabelText("Toggleable")).toBeInTheDocument();
  });

  it("checks current mode radio", () => {
    render(<CompletedDisplaySection />);
    expect(screen.getByLabelText("Show at Bottom")).toBeChecked();
  });

  it("calls setCompletedDisplayMode on radio change", async () => {
    const user = userEvent.setup();
    render(<CompletedDisplaySection />);
    await user.click(screen.getByLabelText("Hidden"));
    expect(useSettingsStore.getState().completedDisplayMode).toBe("hidden");
  });
});
