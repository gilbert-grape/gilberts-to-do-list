import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { PurposeStep } from "./purpose-step.tsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "onboarding.purposeTitle": "What will you use this for?",
        "onboarding.purposeSubtitle":
          "Select one or more to get personalized tags.",
        "onboarding.purposePersonal": "Personal",
        "onboarding.purposePersonalDesc": "Daily tasks & errands",
        "onboarding.purposeWork": "Work",
        "onboarding.purposeWorkDesc": "Projects & deadlines",
        "onboarding.purposeHobby": "Hobby",
        "onboarding.purposeHobbyDesc": "Fun & creative stuff",
        "common.back": "Back",
        "common.next": "Next",
      };
      return translations[key] ?? key;
    },
  }),
}));

describe("PurposeStep", () => {
  const defaultProps = {
    purposes: [] as ("personal" | "work" | "hobby")[],
    onTogglePurpose: vi.fn(),
    onNext: vi.fn(),
    onBack: vi.fn(),
  };

  it("renders three purpose options", () => {
    render(<PurposeStep {...defaultProps} />);
    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Hobby")).toBeInTheDocument();
  });

  it("disables Next when no purposes selected", () => {
    render(<PurposeStep {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("enables Next when a purpose is selected", () => {
    render(<PurposeStep {...defaultProps} purposes={["work"]} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("calls onTogglePurpose when a card is clicked", async () => {
    const onTogglePurpose = vi.fn();
    const user = userEvent.setup();
    render(<PurposeStep {...defaultProps} onTogglePurpose={onTogglePurpose} />);
    await user.click(screen.getByText("Work"));
    expect(onTogglePurpose).toHaveBeenCalledWith("work");
  });

  it("calls onBack when Back is clicked", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<PurposeStep {...defaultProps} onBack={onBack} />);
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
  });
});
