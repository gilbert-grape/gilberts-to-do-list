import { create } from "zustand";
import type { Tag, TagCreate } from "./types.ts";
import type { StorageAdapter } from "@/services/storage/adapter.ts";
import { TAG_COLORS } from "./colors.ts";

export interface TagState {
  tags: Tag[];
  isLoaded: boolean;
  loadTags: () => Promise<void>;
  createTag: (input: TagCreate) => Promise<void>;
  updateTag: (id: string, changes: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<boolean>;
  setDefaultTag: (id: string) => Promise<void>;
  getDefaultTag: () => Tag | undefined;
}

let _adapter: StorageAdapter | null = null;

export function setStorageAdapter(adapter: StorageAdapter) {
  _adapter = adapter;
}

function getAdapter(): StorageAdapter {
  if (!_adapter) {
    throw new Error(
      "StorageAdapter not initialized. Call setStorageAdapter() first.",
    );
  }
  return _adapter;
}

const DEFAULT_TAG_NAME = "General";
const DEFAULT_TAG_COLOR = TAG_COLORS[0]!;

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  isLoaded: false,

  loadTags: async () => {
    const adapter = getAdapter();
    let tags = await adapter.getAllTags();

    if (tags.length === 0) {
      const defaultTag = await adapter.createTag({
        name: DEFAULT_TAG_NAME,
        color: DEFAULT_TAG_COLOR,
        isDefault: true,
      });
      tags = [defaultTag];
    }

    set({ tags, isLoaded: true });
  },

  createTag: async (input: TagCreate) => {
    const adapter = getAdapter();
    const tag = await adapter.createTag({ ...input, isDefault: false });
    set((state) => ({ tags: [...state.tags, tag] }));
  },

  updateTag: async (id: string, changes: Partial<Tag>) => {
    const adapter = getAdapter();
    const prev = get().tags;
    set((state) => ({
      tags: state.tags.map((t) => (t.id === id ? { ...t, ...changes } : t)),
    }));
    try {
      await adapter.updateTag(id, changes);
    } catch (err) {
      set({ tags: prev });
      throw err;
    }
  },

  deleteTag: async (id: string) => {
    const { tags } = get();

    if (tags.length <= 1) {
      return false;
    }

    const tagToDelete = tags.find((t) => t.id === id);
    if (!tagToDelete) return false;

    if (tagToDelete.isDefault) {
      return false;
    }

    const adapter = getAdapter();
    const prev = tags;
    set((state) => ({
      tags: state.tags.filter((t) => t.id !== id),
    }));
    try {
      await adapter.deleteTag(id);
    } catch (err) {
      set({ tags: prev });
      throw err;
    }
    return true;
  },

  setDefaultTag: async (id: string) => {
    const { tags } = get();
    const adapter = getAdapter();
    const prev = tags;
    const currentDefault = tags.find((t) => t.isDefault);

    set((state) => ({
      tags: state.tags.map((t) => ({
        ...t,
        isDefault: t.id === id,
      })),
    }));

    try {
      await Promise.all([
        currentDefault && currentDefault.id !== id
          ? adapter.updateTag(currentDefault.id, { isDefault: false })
          : Promise.resolve(),
        adapter.updateTag(id, { isDefault: true }),
      ]);
    } catch (err) {
      set({ tags: prev });
      throw err;
    }
  },

  getDefaultTag: () => {
    return get().tags.find((t) => t.isDefault);
  },
}));
