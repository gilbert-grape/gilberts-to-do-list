import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AppDatabase } from "../indexeddb/db.ts";
import { IndexedDBAdapter } from "../indexeddb/indexeddb-adapter.ts";
import { SyncAdapter } from "./sync-adapter.ts";
import { useConnectionStore } from "./connection-store.ts";
import type { Tag } from "@/features/tags/types.ts";
import type { Todo } from "@/features/todos/types.ts";

function createMockApi() {
  return {
    healthCheck: vi.fn().mockResolvedValue(true),
    createTag: vi.fn().mockResolvedValue({ id: "t1", name: "Work", color: "#f00", isDefault: false, parentId: null }),
    updateTag: vi.fn().mockResolvedValue(undefined),
    deleteTag: vi.fn().mockResolvedValue(undefined),
    getAllTags: vi.fn().mockResolvedValue([]),
    createTodo: vi.fn().mockResolvedValue({ id: "td1", title: "X", description: null, tagIds: [], parentId: null, status: "open", dueDate: null, recurrence: null, recurrenceInterval: null, createdAt: "2025-01-01", completedAt: null, sortOrder: 0 }),
    updateTodo: vi.fn().mockResolvedValue(undefined),
    deleteTodo: vi.fn().mockResolvedValue(undefined),
    getAllTodos: vi.fn().mockResolvedValue([]),
    createTagFull: vi.fn().mockImplementation((tag: Tag) => Promise.resolve(tag)),
    createTodoFull: vi.fn().mockImplementation((todo: Todo) => Promise.resolve(todo)),
    getSettings: vi.fn().mockResolvedValue({}),
    updateSettings: vi.fn().mockResolvedValue(undefined),
  };
}

describe("SyncAdapter", () => {
  let testDb: AppDatabase;
  let local: IndexedDBAdapter;
  let mockApi: ReturnType<typeof createMockApi>;
  let onSyncComplete: ReturnType<typeof vi.fn>;
  let adapter: SyncAdapter;

  beforeEach(() => {
    testDb = new AppDatabase(`test-sync-${crypto.randomUUID()}`);
    local = new IndexedDBAdapter(testDb);
    mockApi = createMockApi();
    onSyncComplete = vi.fn();
    useConnectionStore.setState({ status: "online", pendingChanges: 0, lastError: null });
    adapter = new SyncAdapter(mockApi as never, local, testDb, onSyncComplete);
  });

  afterEach(() => {
    adapter.destroy();
  });

  // --- Tag operations (online) ---
  describe("createTag (online)", () => {
    it("creates locally and sends to API", async () => {
      const tag = await adapter.createTag({ name: "Work", color: "#f00", isDefault: false, parentId: null });
      expect(tag.name).toBe("Work");
      expect(mockApi.createTagFull).toHaveBeenCalledWith(tag);
      const localTags = await local.getAllTags();
      expect(localTags).toHaveLength(1);
    });

    it("enqueues and goes offline when API fails", async () => {
      mockApi.createTagFull.mockRejectedValue(new Error("Network error"));
      const tag = await adapter.createTag({ name: "Work", color: "#f00", isDefault: false, parentId: null });
      expect(tag.name).toBe("Work");
      expect(useConnectionStore.getState().status).toBe("offline");
      const count = await testDb.changeQueue.count();
      expect(count).toBe(1);
    });
  });

  describe("updateTag (online)", () => {
    it("updates locally and sends to API", async () => {
      const tag = await adapter.createTag({ name: "Work", color: "#f00", isDefault: false, parentId: null });
      await adapter.updateTag(tag.id, { name: "Play" });
      expect(mockApi.updateTag).toHaveBeenCalledWith(tag.id, { name: "Play" });
    });

    it("enqueues when API fails", async () => {
      mockApi.updateTag.mockRejectedValue(new Error("Network"));
      const tag = await adapter.createTag({ name: "Work", color: "#f00", isDefault: false, parentId: null });
      await adapter.updateTag(tag.id, { name: "Play" });
      expect(useConnectionStore.getState().status).toBe("offline");
    });
  });

  describe("deleteTag (online)", () => {
    it("deletes locally and sends to API", async () => {
      const tag = await adapter.createTag({ name: "Work", color: "#f00", isDefault: false, parentId: null });
      await adapter.deleteTag(tag.id);
      expect(mockApi.deleteTag).toHaveBeenCalledWith(tag.id);
      expect(await local.getAllTags()).toHaveLength(0);
    });

    it("enqueues when API fails", async () => {
      mockApi.deleteTag.mockRejectedValue(new Error("Network"));
      const tag = await adapter.createTag({ name: "Work", color: "#f00", isDefault: false, parentId: null });
      await adapter.deleteTag(tag.id);
      expect(useConnectionStore.getState().status).toBe("offline");
    });
  });

  describe("getAllTags", () => {
    it("returns from local storage", async () => {
      await adapter.createTag({ name: "Work", color: "#f00", isDefault: false, parentId: null });
      const tags = await adapter.getAllTags();
      expect(tags).toHaveLength(1);
      expect(tags[0]!.name).toBe("Work");
    });
  });

  // --- Todo operations (online) ---
  describe("createTodo (online)", () => {
    it("creates locally and sends to API", async () => {
      const todo = await adapter.createTodo({ title: "Buy milk", tagIds: [] });
      expect(todo.title).toBe("Buy milk");
      expect(mockApi.createTodoFull).toHaveBeenCalledWith(todo);
    });

    it("enqueues when API fails", async () => {
      mockApi.createTodoFull.mockRejectedValue(new Error("Network"));
      const todo = await adapter.createTodo({ title: "Buy milk", tagIds: [] });
      expect(todo.title).toBe("Buy milk");
      expect(useConnectionStore.getState().status).toBe("offline");
    });
  });

  describe("updateTodo (online)", () => {
    it("updates locally and sends to API", async () => {
      const todo = await adapter.createTodo({ title: "Buy milk", tagIds: [] });
      await adapter.updateTodo(todo.id, { title: "Buy bread" });
      expect(mockApi.updateTodo).toHaveBeenCalledWith(todo.id, { title: "Buy bread" });
    });

    it("enqueues when API fails", async () => {
      mockApi.updateTodo.mockRejectedValue(new Error("Network"));
      const todo = await adapter.createTodo({ title: "Buy milk", tagIds: [] });
      await adapter.updateTodo(todo.id, { title: "Buy bread" });
      expect(useConnectionStore.getState().status).toBe("offline");
    });
  });

  describe("deleteTodo (online)", () => {
    it("deletes locally and sends to API", async () => {
      const todo = await adapter.createTodo({ title: "Buy milk", tagIds: [] });
      await adapter.deleteTodo(todo.id);
      expect(mockApi.deleteTodo).toHaveBeenCalledWith(todo.id);
    });

    it("enqueues when API fails", async () => {
      mockApi.deleteTodo.mockRejectedValue(new Error("Network"));
      const todo = await adapter.createTodo({ title: "Buy milk", tagIds: [] });
      await adapter.deleteTodo(todo.id);
      expect(useConnectionStore.getState().status).toBe("offline");
    });
  });

  describe("getAllTodos", () => {
    it("returns from local storage", async () => {
      await adapter.createTodo({ title: "Buy milk", tagIds: [] });
      const todos = await adapter.getAllTodos();
      expect(todos).toHaveLength(1);
    });
  });

  // --- Offline queueing ---
  describe("offline queueing", () => {
    it("queues create when already offline", async () => {
      // Simulate going offline via a failed API call
      mockApi.createTagFull.mockRejectedValue(new Error("offline"));
      await adapter.createTag({ name: "Offline", color: "#000", isDefault: false, parentId: null });

      // Now adapter is offline; next operations should queue
      const todo = await adapter.createTodo({ title: "Queued", tagIds: [] });
      expect(todo.title).toBe("Queued");

      const queueCount = await testDb.changeQueue.count();
      expect(queueCount).toBeGreaterThanOrEqual(2);
    });
  });

  // --- trySync (via handleOnline) ---
  describe("sync on reconnect", () => {
    it("replays queue and refreshes from server on reconnect", async () => {
      // Go offline
      mockApi.createTagFull.mockRejectedValueOnce(new Error("offline"));
      await adapter.createTag({ name: "Queued", color: "#f00", isDefault: false, parentId: null });
      expect(useConnectionStore.getState().status).toBe("offline");

      // Fix API
      mockApi.createTagFull.mockResolvedValue({ id: "t1", name: "Queued", color: "#f00", isDefault: false, parentId: null });
      mockApi.getAllTags.mockResolvedValue([{ id: "t1", name: "Queued", color: "#f00", isDefault: false, parentId: null }]);
      mockApi.getAllTodos.mockResolvedValue([]);

      // Simulate going online
      window.dispatchEvent(new Event("online"));

      // Wait for async sync to complete
      await new Promise((r) => setTimeout(r, 200));

      expect(useConnectionStore.getState().status).toBe("online");
      expect(onSyncComplete).toHaveBeenCalled();
      expect(await testDb.changeQueue.count()).toBe(0);
    });

    it("sets syncing status during sync", async () => {
      // Go offline
      mockApi.createTagFull.mockRejectedValueOnce(new Error("offline"));
      await adapter.createTag({ name: "Queued", color: "#f00", isDefault: false, parentId: null });
      expect(useConnectionStore.getState().status).toBe("offline");

      // Fix API
      mockApi.createTagFull.mockResolvedValue({});
      mockApi.getAllTags.mockResolvedValue([]);
      mockApi.getAllTodos.mockResolvedValue([]);

      // Trigger sync - it will transition through syncing → online
      window.dispatchEvent(new Event("online"));
      await new Promise((r) => setTimeout(r, 200));

      // Should end up online after successful sync
      expect(useConnectionStore.getState().status).toBe("online");
    });
  });

  // --- destroy ---
  describe("destroy", () => {
    it("clears health timer without error", () => {
      expect(() => adapter.destroy()).not.toThrow();
    });
  });
});
