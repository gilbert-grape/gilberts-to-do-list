import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { DefaultTagStep } from "./default-tag-step.tsx";
import type { OnboardingTag } from "../types.ts";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "onboarding.defaultTagTitle": "Pick a default tag",
        "onboarding.defaultTagSubtitle":
          "New to-dos will use this tag automatically.",
        "onboarding.defaultTagOption": "Default",
        "common.back": "Back",
        "common.next": "Next",
      };
      return translations[key] ?? key;
    },
  }),
}));

const sampleTags: OnboardingTag[] = [
  { tempId: 1, name: "Work", color: "#3b82f6" },
  { tempId: 2, name: "Personal", color: "#22c55e" },
];

describe("DefaultTagStep", () => {
  const defaultProps = {
    tags: sampleTags,
    defaultTagChoice: { kind: "create-default" as const },
    onSetDefaultTagChoice: vi.fn(),
    onNext: vi.fn(),
    onBack: vi.fn(),
  };

  it("renders default option and all tags as radio options", () => {
    render(<DefaultTagStep {...defaultProps} />);
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
  });

  it("has create-default pre-selected", () => {
    render(<DefaultTagStep {...defaultProps} />);
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toBeChecked();
  });

  it("calls onSetDefaultTagChoice when selecting a tag", async () => {
    const onSetDefaultTagChoice = vi.fn();
    const user = userEvent.setup();
    render(
      <DefaultTagStep
        {...defaultProps}
        onSetDefaultTagChoice={onSetDefaultTagChoice}
      />,
    );
    await user.click(screen.getByText("Work"));
    expect(onSetDefaultTagChoice).toHaveBeenCalledWith({
      kind: "existing",
      tempId: 1,
    });
  });

  it("calls onBack when Back is clicked", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<DefaultTagStep {...defaultProps} onBack={onBack} />);
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
  });
});
