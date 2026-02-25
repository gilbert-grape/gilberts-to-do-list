import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OnboardingView } from "./onboarding-view.tsx";
import { useOnboardingStore } from "../store.ts";
import { useTagStore } from "@/features/tags/store.ts";
import { useSettingsStore } from "@/features/settings/store.ts";
import { ONBOARDING_COMPLETE_KEY, USER_NAME_KEY } from "../constants.ts";
import { TAG_COLORS } from "@/features/tags/colors.ts";
import type { Tag } from "@/features/tags/types.ts";

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
        "onboarding.tags.reading": "Reading",
        "onboarding.tags.sports": "Sports",
        "onboarding.tags.creative": "Creative",
        "onboarding.tags.learning": "Learning",
        "common.next": "Next",
        "common.back": "Back",
        "common.delete": "Delete",
      };
      return translations[key] ?? key;
    },
  }),
}));

vi.mock("@/features/tags/store.ts", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/tags/store.ts")
  >("@/features/tags/store.ts");
  return { ...actual };
});

vi.mock("@/features/settings/store.ts", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/settings/store.ts")
  >("@/features/settings/store.ts");
  return { ...actual };
});

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
    localStorage.clear();
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

  describe("handleComplete", () => {
    let tagIdCounter: number;
    let mockCreateTag: ReturnType<typeof vi.fn>;
    let mockSetDefaultTag: ReturnType<typeof vi.fn>;
    let mockSetUserName: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      tagIdCounter = 0;

      mockCreateTag = vi.fn().mockImplementation(async (input) => {
        const newTag: Tag = {
          id: `real-tag-${++tagIdCounter}`,
          name: input.name,
          color: input.color,
          isDefault: input.isDefault,
          parentId: input.parentId,
        };
        // Simulate the store pushing the new tag into state
        const current = useTagStore.getState().tags;
        useTagStore.setState({ tags: [...current, newTag] });
        return newTag;
      });

      mockSetDefaultTag = vi.fn().mockImplementation(async (id: string) => {
        useTagStore.setState({
          tags: useTagStore
            .getState()
            .tags.map((t) => ({ ...t, isDefault: t.id === id })),
        });
      });

      mockSetUserName = vi.fn();

      useTagStore.setState(
        {
          tags: [],
          createTag: mockCreateTag,
          setDefaultTag: mockSetDefaultTag,
        } as never,
      );

      useSettingsStore.setState(
        {
          setUserName: mockSetUserName,
        } as never,
      );
    });

    it('creates tags, creates a "Default" tag, and completes onboarding with create-default choice', async () => {
      const user = userEvent.setup();

      // Set up onboarding store at step 5 with tags and create-default choice
      useOnboardingStore.getState().setName("Alice");
      useOnboardingStore.getState().setTags([
        { tempId: 1, name: "Work", color: "#3b82f6" },
        { tempId: 2, name: "Personal", color: "#22c55e" },
      ]);
      useOnboardingStore.getState().setDefaultTagChoice({
        kind: "create-default",
      });
      useOnboardingStore.getState().setStep(5);

      renderOnboarding();

      // Verify we are on the summary step
      expect(screen.getByText("You're all set, Alice!")).toBeInTheDocument();

      // Click the "Let's go!" button
      await user.click(
        screen.getByRole("button", { name: "Let's go!" }),
      );

      // Wait for the async handleComplete to finish
      await waitFor(() => {
        // createTag should have been called 3 times:
        // 2 user tags + 1 "Default" tag
        expect(mockCreateTag).toHaveBeenCalledTimes(3);
      });

      // Verify user tags were created with correct params
      expect(mockCreateTag).toHaveBeenNthCalledWith(1, {
        name: "Work",
        color: "#3b82f6",
        isDefault: false,
        parentId: null,
      });
      expect(mockCreateTag).toHaveBeenNthCalledWith(2, {
        name: "Personal",
        color: "#22c55e",
        isDefault: false,
        parentId: null,
      });

      // Verify the "Default" tag was created with the last TAG_COLOR
      expect(mockCreateTag).toHaveBeenNthCalledWith(3, {
        name: "Default",
        color: TAG_COLORS[TAG_COLORS.length - 1],
        isDefault: false,
        parentId: null,
      });

      // setDefaultTag should have been called with the id of the "Default" tag (3rd created)
      expect(mockSetDefaultTag).toHaveBeenCalledTimes(1);
      expect(mockSetDefaultTag).toHaveBeenCalledWith("real-tag-3");

      // localStorage should have been set
      expect(localStorage.getItem(USER_NAME_KEY)).toBe("Alice");
      expect(localStorage.getItem(ONBOARDING_COMPLETE_KEY)).toBe("true");

      // Settings store should have been called
      expect(mockSetUserName).toHaveBeenCalledWith("Alice");

      // Onboarding store should have been reset
      expect(useOnboardingStore.getState().name).toBe("");
      expect(useOnboardingStore.getState().step).toBe(1);
    });

    it("creates tags and sets an existing tag as default with select-existing choice", async () => {
      const user = userEvent.setup();

      // Set up onboarding store at step 5 with tags and select-existing choice
      useOnboardingStore.getState().setName("Bob");
      useOnboardingStore.getState().setTags([
        { tempId: 10, name: "Meetings", color: "#3b82f6" },
        { tempId: 11, name: "Deadlines", color: "#ef4444" },
        { tempId: 12, name: "Projects", color: "#6366f1" },
      ]);
      // Choose the second tag (tempId: 11) as default
      useOnboardingStore.getState().setDefaultTagChoice({
        kind: "existing",
        tempId: 11,
      });
      useOnboardingStore.getState().setStep(5);

      renderOnboarding();

      expect(screen.getByText("You're all set, Bob!")).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: "Let's go!" }),
      );

      await waitFor(() => {
        // Only 3 user tags created, no extra "Default" tag
        expect(mockCreateTag).toHaveBeenCalledTimes(3);
      });

      expect(mockCreateTag).toHaveBeenNthCalledWith(1, {
        name: "Meetings",
        color: "#3b82f6",
        isDefault: false,
        parentId: null,
      });
      expect(mockCreateTag).toHaveBeenNthCalledWith(2, {
        name: "Deadlines",
        color: "#ef4444",
        isDefault: false,
        parentId: null,
      });
      expect(mockCreateTag).toHaveBeenNthCalledWith(3, {
        name: "Projects",
        color: "#6366f1",
        isDefault: false,
        parentId: null,
      });

      // setDefaultTag should have been called with the real id mapped from tempId 11
      // tempId 10 -> real-tag-1, tempId 11 -> real-tag-2, tempId 12 -> real-tag-3
      expect(mockSetDefaultTag).toHaveBeenCalledTimes(1);
      expect(mockSetDefaultTag).toHaveBeenCalledWith("real-tag-2");

      // localStorage should have been set
      expect(localStorage.getItem(USER_NAME_KEY)).toBe("Bob");
      expect(localStorage.getItem(ONBOARDING_COMPLETE_KEY)).toBe("true");

      // Settings store should have been called
      expect(mockSetUserName).toHaveBeenCalledWith("Bob");

      // Onboarding store should have been reset
      expect(useOnboardingStore.getState().name).toBe("");
      expect(useOnboardingStore.getState().step).toBe(1);
    });

    it("sets isCompleting back to false when createTag throws", async () => {
      const user = userEvent.setup();

      mockCreateTag.mockRejectedValueOnce(new Error("Storage error"));

      useOnboardingStore.getState().setName("Eve");
      useOnboardingStore.getState().setTags([
        { tempId: 1, name: "Errands", color: "#f97316" },
      ]);
      useOnboardingStore.getState().setDefaultTagChoice({
        kind: "create-default",
      });
      useOnboardingStore.getState().setStep(5);

      renderOnboarding();

      const letsGoButton = screen.getByRole("button", { name: "Let's go!" });
      await user.click(letsGoButton);

      // After the error, the button should be re-enabled (isCompleting set back to false)
      await waitFor(() => {
        expect(letsGoButton).not.toBeDisabled();
      });

      // localStorage should NOT have been set since the error occurred before that
      expect(localStorage.getItem(ONBOARDING_COMPLETE_KEY)).toBeNull();

      // Onboarding store should NOT have been reset
      expect(useOnboardingStore.getState().name).toBe("Eve");
    });
  });

  describe("goToStep3 tag generation with multiple purposes", () => {
    it("generates deduplicated tags from multiple purposes", async () => {
      const user = userEvent.setup();
      useOnboardingStore.getState().setName("Carol");
      useOnboardingStore.getState().togglePurpose("personal");
      useOnboardingStore.getState().togglePurpose("work");
      useOnboardingStore.getState().togglePurpose("hobby");
      useOnboardingStore.getState().setStep(2);
      renderOnboarding();

      await user.click(screen.getByRole("button", { name: "Next" }));

      const tags = useOnboardingStore.getState().tags;

      // personal has 4 tags, work has 4 tags, hobby has 4 tags
      // None share the same nameKey, so all 12 should be present
      expect(tags.length).toBe(12);

      // Verify no duplicate names
      const names = tags.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);

      // Verify specific tags from each purpose are present
      expect(names).toContain("Groceries");
      expect(names).toContain("Health");
      expect(names).toContain("Finance");
      expect(names).toContain("Household");
      expect(names).toContain("Meetings");
      expect(names).toContain("Deadlines");
      expect(names).toContain("Projects");
      expect(names).toContain("Emails");
      expect(names).toContain("Reading");
      expect(names).toContain("Sports");
      expect(names).toContain("Creative");
      expect(names).toContain("Learning");
    });

    it("generates only personal tags when only personal is selected", async () => {
      const user = userEvent.setup();
      useOnboardingStore.getState().setName("Dan");
      useOnboardingStore.getState().togglePurpose("personal");
      useOnboardingStore.getState().setStep(2);
      renderOnboarding();

      await user.click(screen.getByRole("button", { name: "Next" }));

      const tags = useOnboardingStore.getState().tags;
      expect(tags.length).toBe(4);

      const names = tags.map((t) => t.name);
      expect(names).toContain("Groceries");
      expect(names).toContain("Health");
      expect(names).toContain("Finance");
      expect(names).toContain("Household");

      // Should not contain work or hobby tags
      expect(names).not.toContain("Meetings");
      expect(names).not.toContain("Reading");
    });

    it("assigns sequential tempIds to generated tags", async () => {
      const user = userEvent.setup();
      useOnboardingStore.getState().setName("Frank");
      useOnboardingStore.getState().togglePurpose("work");
      useOnboardingStore.getState().setStep(2);
      renderOnboarding();

      await user.click(screen.getByRole("button", { name: "Next" }));

      const tags = useOnboardingStore.getState().tags;

      // Verify tempIds are sequential starting from 1 (the initial nextTempId)
      for (let i = 0; i < tags.length; i++) {
        expect(tags[i]!.tempId).toBe(i + 1);
      }
    });

    it("preserves manually added tags when going back and forth to step 3", async () => {
      const user = userEvent.setup();
      useOnboardingStore.getState().setName("Grace");
      useOnboardingStore.getState().togglePurpose("personal");
      useOnboardingStore.getState().setStep(2);
      renderOnboarding();

      // Go to step 3 -- generates tags
      await user.click(screen.getByRole("button", { name: "Next" }));
      const initialTags = useOnboardingStore.getState().tags;
      const initialCount = initialTags.length;

      // Manually add a tag on step 3
      const addInput = screen.getByPlaceholderText("New tag name...");
      await user.type(addInput, "Custom Tag");
      await user.click(screen.getByRole("button", { name: "Add" }));

      const tagsAfterAdd = useOnboardingStore.getState().tags;
      expect(tagsAfterAdd.length).toBe(initialCount + 1);
      expect(tagsAfterAdd.map((t) => t.name)).toContain("Custom Tag");

      // Go back to step 2
      await user.click(screen.getByRole("button", { name: "Back" }));

      // Go forward to step 3 again -- should NOT regenerate because tags.length > 0
      await user.click(screen.getByRole("button", { name: "Next" }));

      const tagsAfterReturn = useOnboardingStore.getState().tags;
      expect(tagsAfterReturn.length).toBe(initialCount + 1);
      expect(tagsAfterReturn.map((t) => t.name)).toContain("Custom Tag");
    });
  });
});
