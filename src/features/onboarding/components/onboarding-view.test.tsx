import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OnboardingView } from "./onboarding-view.tsx";
import { useOnboardingStore } from "../store.ts";

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "onboarding.nameTitle": "What's your name?",
        "onboarding.nameSubtitle":
          "We'll use this to personalize your experience.",
        "onboarding.namePlaceholder": "Enter your name...",
        "onboarding.purposeTitle": "What will you use this for?",
        "onboarding.purposeSubtitle":
          "Select one or more to get personalized tags.",
        "onboarding.purposePersonal": "Personal",
        "onboarding.purposePersonalDesc": "Daily tasks & errands",
        "onboarding.purposeWork": "Work",
        "onboarding.purposeWorkDesc": "Projects & deadlines",
        "onboarding.purposeHobby": "Hobby",
        "onboarding.purposeHobbyDesc": "Fun & creative stuff",
        "onboarding.tagsTitle": "Customize your tags",
        "onboarding.tagsSubtitle":
          "Add, rename, or remove tags to fit your needs.",
        "onboarding.tagsAddPlaceholder": "New tag name...",
        "onboarding.tagsAdd": "Add",
        "onboarding.defaultTagTitle": "Pick a default tag",
        "onboarding.defaultTagSubtitle":
          "New to-dos will use this tag automatically.",
        "onboarding.defaultTagOption": "Default",
        "onboarding.summaryTitle": `You're all set, ${options?.name ?? ""}!`,
        "onboarding.summarySubtitle": "Here's what we've set up for you:",
        "onboarding.summaryTagCount": `${options?.count ?? 0} tags ready to go`,
        "onboarding.summaryDefaultTag": `Default tag: ${options?.name ?? ""}`,
        "onboarding.summaryLetsGo": "Let's go!",
        "onboarding.tags.groceries": "Groceries",
        "onboarding.tags.health": "Health",
        "onboarding.tags.finance": "Finance",
        "onboarding.tags.household": "Household",
        "onboarding.tags.meetings": "Meetings",
        "onboarding.tags.deadlines": "Deadlines",
        "onboarding.tags.projects": "Projects",
        "onboarding.tags.emails": "Emails",
        "common.next": "Next",
        "common.back": "Back",
        "common.delete": "Delete",
      };
      return translations[key] ?? key;
    },
  }),
}));

function renderOnboarding() {
  return render(
    <MemoryRouter initialEntries={["/onboarding"]}>
      <OnboardingView />
    </MemoryRouter>,
  );
}

describe("OnboardingView", () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  it("starts on step 1 (name input)", () => {
    renderOnboarding();
    expect(screen.getByText("What's your name?")).toBeInTheDocument();
  });

  it("shows step indicator dots", () => {
    renderOnboarding();
    expect(screen.getByLabelText("Progress")).toBeInTheDocument();
  });

  it("navigates from step 1 to step 2", async () => {
    const user = userEvent.setup();
    renderOnboarding();
    await user.type(screen.getByPlaceholderText("Enter your name..."), "Alice");
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("What will you use this for?")).toBeInTheDocument();
  });

  it("navigates from step 2 back to step 1", async () => {
    const user = userEvent.setup();
    useOnboardingStore.getState().setName("Alice");
    useOnboardingStore.getState().setStep(2);
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("What's your name?")).toBeInTheDocument();
  });

  it("navigates from step 2 to step 3 and generates tags", async () => {
    const user = userEvent.setup();
    useOnboardingStore.getState().setName("Alice");
    useOnboardingStore.getState().setStep(2);
    renderOnboarding();
    await user.click(screen.getByText("Personal"));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Customize your tags")).toBeInTheDocument();
    // Should have generated personal tags
    expect(useOnboardingStore.getState().tags.length).toBeGreaterThan(0);
  });

  it("navigates to step 4 (default tag selection)", async () => {
    const user = userEvent.setup();
    useOnboardingStore.getState().setName("Alice");
    useOnboardingStore.getState().setStep(3);
    useOnboardingStore.getState().addTag("Work", "#3b82f6");
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Pick a default tag")).toBeInTheDocument();
  });

  it("navigates to step 5 (summary)", async () => {
    const user = userEvent.setup();
    useOnboardingStore.getState().setName("Alice");
    useOnboardingStore.getState().setStep(4);
    useOnboardingStore.getState().addTag("Work", "#3b82f6");
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("You're all set, Alice!")).toBeInTheDocument();
  });

  it("does not regenerate tags when going back and forth to step 3", async () => {
    const user = userEvent.setup();
    useOnboardingStore.getState().setName("Alice");
    useOnboardingStore.getState().togglePurpose("personal");
    useOnboardingStore.getState().setStep(2);
    renderOnboarding();

    // Go to step 3 — generates tags
    await user.click(screen.getByRole("button", { name: "Next" }));
    const tagCountAfterFirst = useOnboardingStore.getState().tags.length;

    // Go back to step 2
    await user.click(screen.getByRole("button", { name: "Back" }));

    // Go to step 3 again — should NOT regenerate
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(useOnboardingStore.getState().tags.length).toBe(tagCountAfterFirst);
  });
});
