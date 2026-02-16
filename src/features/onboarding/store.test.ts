import { describe, it, expect, beforeEach } from "vitest";
import { useOnboardingStore } from "./store.ts";

describe("useOnboardingStore", () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  describe("setStep", () => {
    it("updates the current step", () => {
      useOnboardingStore.getState().setStep(3);
      expect(useOnboardingStore.getState().step).toBe(3);
    });
  });

  describe("setName", () => {
    it("updates the user name", () => {
      useOnboardingStore.getState().setName("Alice");
      expect(useOnboardingStore.getState().name).toBe("Alice");
    });
  });

  describe("togglePurpose", () => {
    it("adds a purpose when not selected", () => {
      useOnboardingStore.getState().togglePurpose("work");
      expect(useOnboardingStore.getState().purposes).toEqual(["work"]);
    });

    it("removes a purpose when already selected", () => {
      useOnboardingStore.getState().togglePurpose("work");
      useOnboardingStore.getState().togglePurpose("work");
      expect(useOnboardingStore.getState().purposes).toEqual([]);
    });

    it("supports multiple purposes", () => {
      useOnboardingStore.getState().togglePurpose("personal");
      useOnboardingStore.getState().togglePurpose("hobby");
      expect(useOnboardingStore.getState().purposes).toEqual([
        "personal",
        "hobby",
      ]);
    });
  });

  describe("addTag", () => {
    it("adds a tag with auto-incremented tempId", () => {
      useOnboardingStore.getState().addTag("Work", "#3b82f6");
      const { tags } = useOnboardingStore.getState();
      expect(tags).toHaveLength(1);
      expect(tags[0]).toEqual({ tempId: 1, name: "Work", color: "#3b82f6" });
    });

    it("increments tempId for each new tag", () => {
      useOnboardingStore.getState().addTag("Work", "#3b82f6");
      useOnboardingStore.getState().addTag("Personal", "#22c55e");
      const { tags } = useOnboardingStore.getState();
      expect(tags[0]?.tempId).toBe(1);
      expect(tags[1]?.tempId).toBe(2);
    });
  });

  describe("removeTag", () => {
    it("removes a tag by tempId", () => {
      useOnboardingStore.getState().addTag("Work", "#3b82f6");
      useOnboardingStore.getState().addTag("Personal", "#22c55e");
      useOnboardingStore.getState().removeTag(1);
      const { tags } = useOnboardingStore.getState();
      expect(tags).toHaveLength(1);
      expect(tags[0]?.name).toBe("Personal");
    });

    it("resets defaultTagChoice when removing the selected default tag", () => {
      useOnboardingStore.getState().addTag("Work", "#3b82f6");
      useOnboardingStore
        .getState()
        .setDefaultTagChoice({ kind: "existing", tempId: 1 });
      useOnboardingStore.getState().removeTag(1);
      expect(useOnboardingStore.getState().defaultTagChoice).toEqual({
        kind: "create-default",
      });
    });

    it("keeps defaultTagChoice when removing a different tag", () => {
      useOnboardingStore.getState().addTag("Work", "#3b82f6");
      useOnboardingStore.getState().addTag("Personal", "#22c55e");
      useOnboardingStore
        .getState()
        .setDefaultTagChoice({ kind: "existing", tempId: 1 });
      useOnboardingStore.getState().removeTag(2);
      expect(useOnboardingStore.getState().defaultTagChoice).toEqual({
        kind: "existing",
        tempId: 1,
      });
    });
  });

  describe("renameTag", () => {
    it("updates the name of a tag", () => {
      useOnboardingStore.getState().addTag("Work", "#3b82f6");
      useOnboardingStore.getState().renameTag(1, "Office");
      expect(useOnboardingStore.getState().tags[0]?.name).toBe("Office");
    });
  });

  describe("setTags", () => {
    it("replaces all tags and updates nextTempId", () => {
      const tags = [
        { tempId: 10, name: "A", color: "#ef4444" },
        { tempId: 20, name: "B", color: "#3b82f6" },
      ];
      useOnboardingStore.getState().setTags(tags);
      expect(useOnboardingStore.getState().tags).toEqual(tags);
      expect(useOnboardingStore.getState().nextTempId).toBe(21);
    });
  });

  describe("reset", () => {
    it("resets all state to initial values", () => {
      useOnboardingStore.getState().setName("Alice");
      useOnboardingStore.getState().setStep(4);
      useOnboardingStore.getState().togglePurpose("work");
      useOnboardingStore.getState().addTag("Test", "#ef4444");
      useOnboardingStore.getState().reset();

      const state = useOnboardingStore.getState();
      expect(state.step).toBe(1);
      expect(state.name).toBe("");
      expect(state.purposes).toEqual([]);
      expect(state.tags).toEqual([]);
      expect(state.defaultTagChoice).toEqual({ kind: "create-default" });
      expect(state.nextTempId).toBe(1);
    });
  });
});
