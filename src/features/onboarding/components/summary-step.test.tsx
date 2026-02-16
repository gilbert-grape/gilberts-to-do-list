import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SummaryStep } from "./summary-step.tsx";
import type { OnboardingTag } from "../types.ts";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "onboarding.summaryTitle": `You're all set, ${options?.name ?? ""}!`,
        "onboarding.summarySubtitle": "Here's what we've set up for you:",
        "onboarding.summaryTagCount": `${options?.count ?? 0} tags ready to go`,
        "onboarding.summaryDefaultTag": `Default tag: ${options?.name ?? ""}`,
        "onboarding.summaryLetsGo": "Let's go!",
        "onboarding.defaultTagOption": "Default",
        "common.back": "Back",
      };
      return translations[key] ?? key;
    },
  }),
}));

const sampleTags: OnboardingTag[] = [
  { tempId: 1, name: "Work", color: "#3b82f6" },
  { tempId: 2, name: "Personal", color: "#22c55e" },
];

describe("SummaryStep", () => {
  const defaultProps = {
    name: "Alice",
    tags: sampleTags,
    defaultTagChoice: { kind: "create-default" as const },
    isCompleting: false,
    onComplete: vi.fn(),
    onBack: vi.fn(),
  };

  it("renders greeting with user name", () => {
    render(<SummaryStep {...defaultProps} />);
    expect(screen.getByText("You're all set, Alice!")).toBeInTheDocument();
  });

  it("shows tag count", () => {
    render(<SummaryStep {...defaultProps} />);
    expect(screen.getByText("2 tags ready to go")).toBeInTheDocument();
  });

  it("calls onComplete when Let's go! is clicked", async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<SummaryStep {...defaultProps} onComplete={onComplete} />);
    await user.click(screen.getByRole("button", { name: "Let's go!" }));
    expect(onComplete).toHaveBeenCalled();
  });

  it("disables buttons when isCompleting is true", () => {
    render(<SummaryStep {...defaultProps} isCompleting={true} />);
    expect(screen.getByRole("button", { name: "Let's go!" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });
});
