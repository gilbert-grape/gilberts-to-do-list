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
      });
      const { tags } = useTagStore.getState();
      const sneaky = tags.find((t) => t.name === "Sneaky");
      expect(sneaky?.isDefault).toBe(false);
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
      });
      const toDelete = useTagStore
        .getState()
        .tags.find((t) => t.name === "Deletable");
      const result = await useTagStore.getState().deleteTag(toDelete!.id);
      expect(result).toBe(true);
      expect(useTagStore.getState().tags).toHaveLength(1);
    });
  });

  describe("setDefaultTag", () => {
    it("changes the default tag", async () => {
      await useTagStore.getState().loadTags();
      await useTagStore.getState().createTag({
        name: "New Default",
        color: "#a855f7",
        isDefault: false,
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
