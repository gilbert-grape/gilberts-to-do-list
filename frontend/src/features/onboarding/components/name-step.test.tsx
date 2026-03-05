import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { NameStep } from "./name-step.tsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "onboarding.nameTitle": "What's your name?",
        "onboarding.nameSubtitle":
          "We'll use this to personalize your experience.",
        "onboarding.namePlaceholder": "Enter your name...",
        "common.next": "Next",
      };
      return translations[key] ?? key;
    },
  }),
}));

describe("NameStep", () => {
  it("renders the title and input", () => {
    render(<NameStep name="" onNameChange={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByText("What's your name?")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your name..."),
    ).toBeInTheDocument();
  });

  it("disables Next when name is empty", () => {
    render(<NameStep name="" onNameChange={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("enables Next when name is provided", () => {
    render(<NameStep name="Alice" onNameChange={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("calls onNameChange when typing", async () => {
    const onNameChange = vi.fn();
    const user = userEvent.setup();
    render(<NameStep name="" onNameChange={onNameChange} onNext={vi.fn()} />);
    await user.type(screen.getByPlaceholderText("Enter your name..."), "A");
    expect(onNameChange).toHaveBeenCalledWith("A");
  });

  it("calls onNext when Enter is pressed with a name", async () => {
    const onNext = vi.fn();
    const user = userEvent.setup();
    render(<NameStep name="Alice" onNameChange={vi.fn()} onNext={onNext} />);
    await user.type(
      screen.getByPlaceholderText("Enter your name..."),
      "{Enter}",
    );
    expect(onNext).toHaveBeenCalled();
  });
});
