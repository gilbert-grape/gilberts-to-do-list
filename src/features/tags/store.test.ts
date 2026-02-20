import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { useTagStore, setStorageAdapter } from "./store.ts";
import { AppDatabase } from "@/services/storage/indexeddb/db.ts";
import { IndexedDBAdapter } from "@/services/storage/indexeddb/indexeddb-adapter.ts";
import { TAG_COLORS } from "./colors.ts";

describe("useTagStore", () => {
  let testDb: AppDatabase;

  beforeEach(async () => {
    testDb = new AppDatabase(`test-db-${crypto.randomUUID()}`);
    const adapter = new IndexedDBAdapter(testDb);
    setStorageAdapter(adapter);
    useTagStore.setState({ tags: [], isLoaded: false });
  });

  describe("loadTags", () => {
    it("creates a default tag when no tags exist", async () => {
      await useTagStore.getState().loadTags();
      const { tags } = useTagStore.getState();
      expect(tags).toHaveLength(1);
      expect(tags[0]?.name).toBe("General");
      expect(tags[0]?.isDefault).toBe(true);
      expect(tags[0]?.color).toBe(TAG_COLORS[0]);
    });

    it("loads existing tags without creating defaults", async () => {
      await testDb.tags.add({
        id: crypto.randomUUID(),
        name: "Existing",
        color: "#3b82f6",
        isDefault: true,
        parentId: null,
      });
      await useTagStore.getState().loadTags();
      const { tags } = useTagStore.getState();
      expect(tags).toHaveLength(1);
      expect(tags[0]?.name).toBe("Existing");
    });

    it("sets isLoaded to true", async () => {
      await useTagStore.getState().loadTags();
      expect(useTagStore.getState().isLoaded).toBe(true);
    });
  });

  describe("createTag", () => {
    it("adds a new tag to the store", async () => {
      await useTagStore.getState().loadTags();
      await useTagStore.getState().createTag({
        name: "Work",
        color: "#3b82f6",
        isDefault: false,
        parentId: null,
      });
      const { tags } = useTagStore.getState();
      expect(tags).toHaveLength(2);
      expect(tags[1]?.name).toBe("Work");
    });

    it("forces isDefault to false for new tags", async () => {
      await useTagStore.getState().loadTags();
      await useTagStore.getState().createTag({
        name: "Sneaky",
        color: "#ef4444",
        isDefault: true,
        parentId: null,
      });
      const { tags } = useTagStore.getState();
      const sneaky = tags.find((t) => t.name === "Sneaky");
      expect(sneaky?.isDefault).toBe(false);
    });

    it("creates a tag with parentId", async () => {
      await useTagStore.getState().loadTags();
      const parentId = useTagStore.getState().tags[0]!.id;
      const child = await useTagStore.getState().createTag({
        name: "Child",
        color: "#22c55e",
        isDefault: false,
        parentId,
      });
      expect(child.parentId).toBe(parentId);
    });

    it("rejects non-existent parentId", async () => {
      await useTagStore.getState().loadTags();
      await expect(
        useTagStore.getState().createTag({
          name: "Orphan",
          color: "#22c55e",
          isDefault: false,
          parentId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      ).rejects.toThrow("Parent tag not found");
    });
  });

  describe("updateTag", () => {
    it("updates tag name in the store", async () => {
      await useTagStore.getState().loadTags();
      const tagId = useTagStore.getState().tags[0]!.id;
      await useTagStore.getState().updateTag(tagId, { name: "Updated" });
      const tag = useTagStore.getState().tags.find((t) => t.id === tagId);
      expect(tag?.name).toBe("Updated");
    });

    it("rejects self-referencing parentId", async () => {
      await useTagStore.getState().loadTags();
      const tagId = useTagStore.getState().tags[0]!.id;
      await expect(
        useTagStore.getState().updateTag(tagId, { parentId: tagId }),
      ).rejects.toThrow("A tag cannot be its own parent");
    });

    it("rejects cycle in tag hierarchy", async () => {
      await useTagStore.getState().loadTags();
      const tagA = useTagStore.getState().tags[0]!;
      const tagB = await useTagStore.getState().createTag({
        name: "B",
        color: "#22c55e",
        isDefault: false,
        parentId: tagA.id,
      });
      const tagC = await useTagStore.getState().createTag({
        name: "C",
        color: "#a855f7",
        isDefault: false,
        parentId: tagB.id,
      });
      // A → B → C, now try to set A.parentId = C → cycle
      await expect(
        useTagStore.getState().updateTag(tagA.id, { parentId: tagC.id }),
      ).rejects.toThrow("Cycle detected in tag hierarchy");
    });
  });

  describe("deleteTag", () => {
    it("blocks deletion of the last tag", async () => {
      await useTagStore.getState().loadTags();
      const tagId = useTagStore.getState().tags[0]!.id;
      const result = await useTagStore.getState().deleteTag(tagId);
      expect(result).toBe(false);
      expect(useTagStore.getState().tags).toHaveLength(1);
    });

    it("blocks deletion of the default tag", async () => {
      await useTagStore.getState().loadTags();
      await useTagStore.getState().createTag({
        name: "Second",
        color: "#22c55e",
        isDefault: false,
        parentId: null,
      });
      const defaultTag = useTagStore.getState().tags.find((t) => t.isDefault);
      const result = await useTagStore.getState().deleteTag(defaultTag!.id);
      expect(result).toBe(false);
    });

    it("allows deletion of a non-default tag when multiple exist", async () => {
      await useTagStore.getState().loadTags();
      await useTagStore.getState().createTag({
        name: "Deletable",
        color: "#22c55e",
        isDefault: false,
        parentId: null,
      });
      const toDelete = useTagStore
        .getState()
        .tags.find((t) => t.name === "Deletable");
      const result = await useTagStore.getState().deleteTag(toDelete!.id);
      expect(result).toBe(true);
      expect(useTagStore.getState().tags).toHaveLength(1);
    });

    it("reparents children to grandparent on delete", async () => {
      await useTagStore.getState().loadTags();
      const tagA = useTagStore.getState().tags[0]!; // General (default)
      const tagB = await useTagStore.getState().createTag({
        name: "B",
        color: "#22c55e",
        isDefault: false,
        parentId: tagA.id,
      });
      await useTagStore.getState().createTag({
        name: "C",
        color: "#a855f7",
        isDefault: false,
        parentId: tagB.id,
      });
      // Delete B → C should become child of A
      await useTagStore.getState().deleteTag(tagB.id);
      const tagC = useTagStore.getState().tags.find((t) => t.name === "C");
      expect(tagC?.parentId).toBe(tagA.id);
    });

    it("promotes children to root when deleting a root tag", async () => {
      await useTagStore.getState().loadTags();
      const rootTag = await useTagStore.getState().createTag({
        name: "Root",
        color: "#22c55e",
        isDefault: false,
        parentId: null,
      });
      await useTagStore.getState().createTag({
        name: "Child",
        color: "#a855f7",
        isDefault: false,
        parentId: rootTag.id,
      });
      await useTagStore.getState().deleteTag(rootTag.id);
      const child = useTagStore.getState().tags.find((t) => t.name === "Child");
      expect(child?.parentId).toBeNull();
    });
  });

  describe("setDefaultTag", () => {
    it("changes the default tag", async () => {
      await useTagStore.getState().loadTags();
      await useTagStore.getState().createTag({
        name: "New Default",
        color: "#a855f7",
        isDefault: false,
        parentId: null,
      });
      const newDefault = useTagStore
        .getState()
        .tags.find((t) => t.name === "New Default");
      await useTagStore.getState().setDefaultTag(newDefault!.id);
      const { tags } = useTagStore.getState();
      const defaults = tags.filter((t) => t.isDefault);
      expect(defaults).toHaveLength(1);
      expect(defaults[0]?.name).toBe("New Default");
    });

    it("removes default from the previous default tag", async () => {
      await useTagStore.getState().loadTags();
      const oldDefaultId = useTagStore.getState().tags[0]!.id;
      await useTagStore.getState().createTag({
        name: "Second",
        color: "#a855f7",
        isDefault: false,
        parentId: null,
      });
      const second = useTagStore
        .getState()
        .tags.find((t) => t.name === "Second");
      await useTagStore.getState().setDefaultTag(second!.id);
      const oldDefault = useTagStore
        .getState()
        .tags.find((t) => t.id === oldDefaultId);
      expect(oldDefault?.isDefault).toBe(false);
    });
  });

  describe("getDefaultTag", () => {
    it("returns the default tag", async () => {
      await useTagStore.getState().loadTags();
      const defaultTag = useTagStore.getState().getDefaultTag();
      expect(defaultTag?.isDefault).toBe(true);
      expect(defaultTag?.name).toBe("General");
    });
  });
});
