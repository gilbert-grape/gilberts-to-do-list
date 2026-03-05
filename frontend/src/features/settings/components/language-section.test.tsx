import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LanguageSection } from "./language-section.tsx";
import { useSettingsStore } from "../store.ts";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "settings.language": "Language",
        "settings.languageEn": "English",
        "settings.languageDe": "Deutsch",
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

describe("LanguageSection", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      language: "en",
      setLanguage: vi.fn(),
    });
  });

  it("renders language heading", () => {
    render(<LanguageSection />);
    expect(screen.getByText("Language")).toBeInTheDocument();
  });

  it("renders language options with correct selection", () => {
    render(<LanguageSection />);
    expect(screen.getByLabelText("English")).toBeChecked();
    expect(screen.getByLabelText("Deutsch")).not.toBeChecked();
  });

  it("calls setLanguage when language option is clicked", async () => {
    const setLanguage = vi.fn();
    useSettingsStore.setState({ setLanguage });
    render(<LanguageSection />);
    await userEvent.click(screen.getByLabelText("Deutsch"));
    expect(setLanguage).toHaveBeenCalledWith("de");
  });

  it("reflects current language selection", () => {
    useSettingsStore.setState({ language: "de" });
    render(<LanguageSection />);
    expect(screen.getByLabelText("Deutsch")).toBeChecked();
    expect(screen.getByLabelText("English")).not.toBeChecked();
  });
});
