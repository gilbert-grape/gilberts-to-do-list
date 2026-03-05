import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TagsStep } from "./tags-step.tsx";
import type { OnboardingTag } from "../types.ts";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "onboarding.tagsTitle": "Customize your tags",
        "onboarding.tagsSubtitle":
          "Add, rename, or remove tags to fit your needs.",
        "onboarding.tagsAddPlaceholder": "New tag name...",
        "onboarding.tagsAdd": "Add",
        "common.back": "Back",
        "common.next": "Next",
        "common.delete": "Delete",
      };
      return translations[key] ?? key;
    },
  }),
}));

const sampleTags: OnboardingTag[] = [
  { tempId: 1, name: "Work", color: "#3b82f6" },
  { tempId: 2, name: "Personal", color: "#22c55e" },
];

describe("TagsStep", () => {
  const defaultProps = {
    tags: sampleTags,
    onAddTag: vi.fn(),
    onRemoveTag: vi.fn(),
    onRenameTag: vi.fn(),
    onNext: vi.fn(),
    onBack: vi.fn(),
  };

  it("renders all tags", () => {
    render(<TagsStep {...defaultProps} />);
    expect(screen.getByDisplayValue("Work")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Personal")).toBeInTheDocument();
  });

  it("disables Next when no tags", () => {
    render(<TagsStep {...defaultProps} tags={[]} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("enables Next when tags exist", () => {
    render(<TagsStep {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("calls onAddTag when Add is clicked", async () => {
    const onAddTag = vi.fn();
    const user = userEvent.setup();
    render(<TagsStep {...defaultProps} onAddTag={onAddTag} />);
    await user.type(screen.getByPlaceholderText("New tag name..."), "NewTag");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onAddTag).toHaveBeenCalledWith("NewTag", expect.any(String));
  });

  it("calls onRemoveTag when delete button is clicked", async () => {
    const onRemoveTag = vi.fn();
    const user = userEvent.setup();
    render(<TagsStep {...defaultProps} onRemoveTag={onRemoveTag} />);
    await user.click(screen.getByRole("button", { name: "Delete Work" }));
    expect(onRemoveTag).toHaveBeenCalledWith(1);
  });

  it("disables delete when only one tag", () => {
    render(<TagsStep {...defaultProps} tags={[sampleTags[0]!]} />);
    expect(screen.getByRole("button", { name: "Delete Work" })).toBeDisabled();
  });

  it("calls onRenameTag when editing a tag name", async () => {
    const onRenameTag = vi.fn();
    const user = userEvent.setup();
    render(<TagsStep {...defaultProps} onRenameTag={onRenameTag} />);
    const input = screen.getByDisplayValue("Work");
    await user.clear(input);
    await user.type(input, "Office");
    expect(onRenameTag).toHaveBeenCalled();
  });
});
