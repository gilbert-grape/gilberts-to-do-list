import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { AppDatabase } from "./db.ts";
import { IndexedDBAdapter } from "./indexeddb-adapter.ts";
import type { TagCreate } from "@/features/tags/types.ts";
import type { TodoCreate } from "@/features/todos/types.ts";

describe("IndexedDBAdapter", () => {
  let adapter: IndexedDBAdapter;
  let testDb: AppDatabase;

  beforeEach(async () => {
    testDb = new AppDatabase(`test-db-${crypto.randomUUID()}`);
    adapter = new IndexedDBAdapter(testDb);
  });

  const sampleTag: TagCreate = {
    name: "Work",
    color: "#3b82f6",
    isDefault: false,
  };

  const sampleTodo: TodoCreate = {
    title: "Buy groceries",
    description: null,
    tagIds: ["550e8400-e29b-41d4-a716-446655440000"],
    parentId: null,
    dueDate: null,
    recurrence: null,
    recurrenceInterval: null,
  };

  describe("createTag", () => {
    it("creates a tag with a generated UUID", async () => {
      const tag = await adapter.createTag(sampleTag);
      expect(tag.id).toBeDefined();
      expect(tag.name).toBe("Work");
      expect(tag.color).toBe("#3b82f6");
      expect(tag.isDefault).toBe(false);
    });

    it("persists the tag in the database", async () => {
      const tag = await adapter.createTag(sampleTag);
      const stored = await testDb.tags.get(tag.id);
      expect(stored).toEqual(tag);
    });
  });

  describe("getAllTags", () => {
    it("returns empty array when no tags exist", async () => {
      const tags = await adapter.getAllTags();
      expect(tags).toEqual([]);
    });

    it("returns all created tags", async () => {
      await adapter.createTag(sampleTag);
      await adapter.createTag({
        name: "Personal",
        color: "#ef4444",
        isDefault: true,
      });
      const tags = await adapter.getAllTags();
      expect(tags).toHaveLength(2);
    });
  });

  describe("updateTag", () => {
    it("updates tag name", async () => {
      const tag = await adapter.createTag(sampleTag);
      await adapter.updateTag(tag.id, { name: "Updated" });
      const updated = await testDb.tags.get(tag.id);
      expect(updated?.name).toBe("Updated");
    });

    it("updates tag color", async () => {
      const tag = await adapter.createTag(sampleTag);
      await adapter.updateTag(tag.id, { color: "#22c55e" });
      const updated = await testDb.tags.get(tag.id);
      expect(updated?.color).toBe("#22c55e");
    });

    it("updates isDefault", async () => {
      const tag = await adapter.createTag(sampleTag);
      await adapter.updateTag(tag.id, { isDefault: true });
      const updated = await testDb.tags.get(tag.id);
      expect(updated?.isDefault).toBe(true);
    });
  });

  describe("deleteTag", () => {
    it("removes the tag from the database", async () => {
      const tag = await adapter.createTag(sampleTag);
      await adapter.deleteTag(tag.id);
      const stored = await testDb.tags.get(tag.id);
      expect(stored).toBeUndefined();
    });

    it("does not affect other tags", async () => {
      const tag1 = await adapter.createTag(sampleTag);
      const tag2 = await adapter.createTag({
        name: "Keep",
        color: "#000",
        isDefault: false,
      });
      await adapter.deleteTag(tag1.id);
      const tags = await adapter.getAllTags();
      expect(tags).toHaveLength(1);
      expect(tags[0]?.id).toBe(tag2.id);
    });
  });

  // Todo operations

  describe("createTodo", () => {
    it("creates a todo with generated UUID, status, and timestamps", async () => {
      const todo = await adapter.createTodo(sampleTodo);
      expect(todo.id).toBeDefined();
      expect(todo.title).toBe("Buy groceries");
      expect(todo.status).toBe("open");
      expect(todo.createdAt).toBeDefined();
      expect(todo.completedAt).toBeNull();
      expect(todo.sortOrder).toBe(0);
    });

    it("persists the todo in the database", async () => {
      const todo = await adapter.createTodo(sampleTodo);
      const stored = await testDb.todos.get(todo.id);
      expect(stored).toEqual(todo);
    });

    it("increments sortOrder for each new todo", async () => {
      const todo1 = await adapter.createTodo(sampleTodo);
      const todo2 = await adapter.createTodo({
        ...sampleTodo,
        title: "Second",
      });
      expect(todo1.sortOrder).toBe(0);
      expect(todo2.sortOrder).toBe(1);
    });
  });

  describe("getAllTodos", () => {
    it("returns empty array when no todos exist", async () => {
      const todos = await adapter.getAllTodos();
      expect(todos).toEqual([]);
    });

    it("returns all created todos", async () => {
      await adapter.createTodo(sampleTodo);
      await adapter.createTodo({ ...sampleTodo, title: "Second" });
      const todos = await adapter.getAllTodos();
      expect(todos).toHaveLength(2);
    });
  });

  describe("updateTodo", () => {
    it("updates todo title", async () => {
      const todo = await adapter.createTodo(sampleTodo);
      await adapter.updateTodo(todo.id, { title: "Updated" });
      const updated = await testDb.todos.get(todo.id);
      expect(updated?.title).toBe("Updated");
    });

    it("updates todo status", async () => {
      const todo = await adapter.createTodo(sampleTodo);
      await adapter.updateTodo(todo.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });
      const updated = await testDb.todos.get(todo.id);
      expect(updated?.status).toBe("completed");
      expect(updated?.completedAt).toBeDefined();
    });
  });

  describe("deleteTodo", () => {
    it("removes the todo from the database", async () => {
      const todo = await adapter.createTodo(sampleTodo);
      await adapter.deleteTodo(todo.id);
      const stored = await testDb.todos.get(todo.id);
      expect(stored).toBeUndefined();
    });

    it("does not affect other todos", async () => {
      const todo1 = await adapter.createTodo(sampleTodo);
      const todo2 = await adapter.createTodo({
        ...sampleTodo,
        title: "Keep",
      });
      await adapter.deleteTodo(todo1.id);
      const todos = await adapter.getAllTodos();
      expect(todos).toHaveLength(1);
      expect(todos[0]?.id).toBe(todo2.id);
    });
  });
});
