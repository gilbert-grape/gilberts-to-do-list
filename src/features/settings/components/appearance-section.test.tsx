import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppearanceSection } from "./appearance-section.tsx";
import { useSettingsStore } from "../store.ts";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "settings.appearance": "Appearance",
        "settings.theme": "Theme",
        "settings.themeLight": "Light",
        "settings.themeDark": "Dark",
        "settings.themeAuto": "Auto",
        "settings.colorAccent": "Color Accent",
        "settings.accentBlue": "Blue",
        "settings.accentPurple": "Purple",
        "settings.accentGreen": "Green",
        "settings.accentOrange": "Orange",
      };
      return translations[key] ?? key;
    },
  }),
}));

vi.mock("@/app/theme.ts", () => ({
  setTheme: vi.fn(),
  applyColorAccent: vi.fn(),
}));

vi.mock("@/app/i18n.ts", () => ({
  default: { changeLanguage: vi.fn(() => Promise.resolve()) },
}));

describe("AppearanceSection", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      theme: "auto",
      colorAccent: "blue",
      setTheme: vi.fn(),
      setColorAccent: vi.fn(),
    });
  });

  it("renders appearance heading", () => {
    render(<AppearanceSection />);
    expect(screen.getByText("Appearance")).toBeInTheDocument();
  });

  it("renders theme radio group with correct selection", () => {
    render(<AppearanceSection />);
    expect(screen.getByLabelText("Auto")).toBeChecked();
    expect(screen.getByLabelText("Light")).not.toBeChecked();
    expect(screen.getByLabelText("Dark")).not.toBeChecked();
  });

  it("calls setTheme when theme option is clicked", async () => {
    const setTheme = vi.fn();
    useSettingsStore.setState({ setTheme });
    render(<AppearanceSection />);
    await userEvent.click(screen.getByLabelText("Dark"));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("renders color accent buttons", () => {
    render(<AppearanceSection />);
    expect(screen.getByRole("radio", { name: "Blue" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Purple" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Green" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Orange" })).toBeInTheDocument();
  });

  it("marks the current accent as checked", () => {
    useSettingsStore.setState({ colorAccent: "purple" });
    render(<AppearanceSection />);
    expect(screen.getByRole("radio", { name: "Purple" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Blue" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("calls setColorAccent when accent button is clicked", async () => {
    const setColorAccent = vi.fn();
    useSettingsStore.setState({ setColorAccent });
    render(<AppearanceSection />);
    await userEvent.click(screen.getByRole("radio", { name: "Green" }));
    expect(setColorAccent).toHaveBeenCalledWith("green");
  });
});
