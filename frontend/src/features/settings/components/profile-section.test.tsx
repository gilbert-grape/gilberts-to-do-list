import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfileSection } from "./profile-section.tsx";
import { useSettingsStore } from "../store.ts";

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "settings.profile": "Profile",
        "settings.displayName": "Display Name",
        "common.save": "Save",
      };
      return translations[key] ?? key;
    },
  }),
}));

describe("ProfileSection", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({
      userName: "Löli",
      setUserName: vi.fn((name: string) => {
        useSettingsStore.setState({ userName: name });
      }),
    });
  });

  it("renders heading and label", () => {
    render(<ProfileSection />);
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Display Name")).toBeInTheDocument();
  });

  it("pre-fills input with current userName", () => {
    render(<ProfileSection />);
    expect(screen.getByDisplayValue("Löli")).toBeInTheDocument();
  });

  it("disables save button when name is unchanged", () => {
    render(<ProfileSection />);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("disables save button when name is empty", async () => {
    const user = userEvent.setup();
    render(<ProfileSection />);
    const input = screen.getByDisplayValue("Löli");
    await user.clear(input);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("enables save button when name is changed", async () => {
    const user = userEvent.setup();
    render(<ProfileSection />);
    const input = screen.getByDisplayValue("Löli");
    await user.clear(input);
    await user.type(input, "Gilbert");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("calls setUserName on save click", async () => {
    const user = userEvent.setup();
    render(<ProfileSection />);
    const input = screen.getByDisplayValue("Löli");
    await user.clear(input);
    await user.type(input, "Gilbert");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(useSettingsStore.getState().userName).toBe("Gilbert");
  });

  it("calls setUserName on Enter key", async () => {
    const user = userEvent.setup();
    render(<ProfileSection />);
    const input = screen.getByDisplayValue("Löli");
    await user.clear(input);
    await user.type(input, "Gilbert{Enter}");
    expect(useSettingsStore.getState().userName).toBe("Gilbert");
  });
});
