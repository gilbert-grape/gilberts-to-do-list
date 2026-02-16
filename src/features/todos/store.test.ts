import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { useTodoStore, setTodoStorageAdapter } from "./store.ts";
import { useTagStore, setStorageAdapter } from "@/features/tags/store.ts";
import { AppDatabase } from "@/services/storage/indexeddb/db.ts";
import { IndexedDBAdapter } from "@/services/storage/indexeddb/indexeddb-adapter.ts";

describe("useTodoStore", () => {
  let testDb: AppDatabase;
  let adapter: IndexedDBAdapter;

  beforeEach(async () => {
    testDb = new AppDatabase(`test-db-${crypto.randomUUID()}`);
    adapter = new IndexedDBAdapter(testDb);
    setTodoStorageAdapter(adapter);
    setStorageAdapter(adapter);
    useTodoStore.setState({ todos: [], isLoaded: false });
    useTagStore.setState({ tags: [], isLoaded: false });
    await useTagStore.getState().loadTags();
  });

  const defaultTagId = () => useTagStore.getState().tags[0]!.id;

  describe("loadTodos", () => {
    it("loads todos from storage", async () => {
      await adapter.createTodo({
        title: "Existing",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      await useTodoStore.getState().loadTodos();
      expect(useTodoStore.getState().todos).toHaveLength(1);
      expect(useTodoStore.getState().isLoaded).toBe(true);
    });

    it("returns empty array when no todos exist", async () => {
      await useTodoStore.getState().loadTodos();
      expect(useTodoStore.getState().todos).toEqual([]);
      expect(useTodoStore.getState().isLoaded).toBe(true);
    });
  });

  describe("createTodo", () => {
    it("creates a todo and adds it to the store", async () => {
      await useTodoStore.getState().createTodo({
        title: "New task",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const { todos } = useTodoStore.getState();
      expect(todos).toHaveLength(1);
      expect(todos[0]?.title).toBe("New task");
      expect(todos[0]?.status).toBe("open");
    });

    it("auto-assigns default tag when tagIds is empty", async () => {
      await useTodoStore.getState().createTodo({
        title: "No tags",
        description: null,
        tagIds: [],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const { todos } = useTodoStore.getState();
      expect(todos[0]?.tagIds).toContain(defaultTagId());
    });

    it("preserves user-selected tags", async () => {
      const customTagId = "550e8400-e29b-41d4-a716-446655440000";
      await useTodoStore.getState().createTodo({
        title: "Custom tags",
        description: null,
        tagIds: [customTagId],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const { todos } = useTodoStore.getState();
      expect(todos[0]?.tagIds).toEqual([customTagId]);
    });

    it("saves description when provided", async () => {
      await useTodoStore.getState().createTodo({
        title: "With notes",
        description: "Some details",
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const { todos } = useTodoStore.getState();
      expect(todos[0]?.description).toBe("Some details");
    });
  });

  describe("updateTodo", () => {
    it("updates todo in the store", async () => {
      await useTodoStore.getState().createTodo({
        title: "Original",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const todoId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().updateTodo(todoId, { title: "Updated" });
      expect(useTodoStore.getState().todos[0]?.title).toBe("Updated");
    });
  });

  describe("deleteTodo", () => {
    it("removes todo from the store", async () => {
      await useTodoStore.getState().createTodo({
        title: "Delete me",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const todoId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().deleteTodo(todoId);
      expect(useTodoStore.getState().todos).toHaveLength(0);
    });
  });

  describe("getChildren", () => {
    it("returns children of a todo", async () => {
      await useTodoStore.getState().createTodo({
        title: "Parent",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const parentId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().createTodo({
        title: "Child",
        description: null,
        tagIds: [defaultTagId()],
        parentId,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const children = useTodoStore.getState().getChildren(parentId);
      expect(children).toHaveLength(1);
      expect(children[0]?.title).toBe("Child");
    });
  });

  describe("deleteTodoWithChildren", () => {
    it("delete-all removes parent and all descendants", async () => {
      await useTodoStore.getState().createTodo({
        title: "Parent",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const parentId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().createTodo({
        title: "Child",
        description: null,
        tagIds: [defaultTagId()],
        parentId,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      await useTodoStore
        .getState()
        .deleteTodoWithChildren(parentId, "delete-all");
      expect(useTodoStore.getState().todos).toHaveLength(0);
    });

    it("keep-children promotes children to root", async () => {
      await useTodoStore.getState().createTodo({
        title: "Parent",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const parentId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().createTodo({
        title: "Child",
        description: null,
        tagIds: [defaultTagId()],
        parentId,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      await useTodoStore
        .getState()
        .deleteTodoWithChildren(parentId, "keep-children");
      const { todos } = useTodoStore.getState();
      expect(todos).toHaveLength(1);
      expect(todos[0]?.title).toBe("Child");
      expect(todos[0]?.parentId).toBeNull();
    });
  });

  describe("reorderTodos", () => {
    it("updates sortOrder for multiple todos", async () => {
      await useTodoStore.getState().createTodo({
        title: "First",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      await useTodoStore.getState().createTodo({
        title: "Second",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const [first, second] = useTodoStore.getState().todos;
      await useTodoStore.getState().reorderTodos([
        { id: first!.id, sortOrder: 1 },
        { id: second!.id, sortOrder: 0 },
      ]);
      const { todos } = useTodoStore.getState();
      expect(todos.find((t) => t.title === "First")?.sortOrder).toBe(1);
      expect(todos.find((t) => t.title === "Second")?.sortOrder).toBe(0);
    });

    it("updates parentId when provided", async () => {
      await useTodoStore.getState().createTodo({
        title: "Parent",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      await useTodoStore.getState().createTodo({
        title: "Child",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const parent = useTodoStore.getState().todos.find((t) => t.title === "Parent")!;
      const child = useTodoStore.getState().todos.find((t) => t.title === "Child")!;
      await useTodoStore.getState().reorderTodos([
        { id: child.id, sortOrder: 0, parentId: parent.id },
      ]);
      const updated = useTodoStore.getState().todos.find((t) => t.title === "Child");
      expect(updated?.parentId).toBe(parent.id);
    });

    it("updates tagIds when provided", async () => {
      await useTodoStore.getState().createTodo({
        title: "Move me",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const todo = useTodoStore.getState().todos[0]!;
      const newTagIds = ["new-tag-1", "new-tag-2"];
      await useTodoStore.getState().reorderTodos([
        { id: todo.id, sortOrder: 5, tagIds: newTagIds },
      ]);
      const updated = useTodoStore.getState().todos[0];
      expect(updated?.tagIds).toEqual(newTagIds);
      expect(updated?.sortOrder).toBe(5);
    });

    it("does not change unrelated todos", async () => {
      await useTodoStore.getState().createTodo({
        title: "Keep me",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      await useTodoStore.getState().createTodo({
        title: "Move me",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const moveTodo = useTodoStore.getState().todos.find((t) => t.title === "Move me")!;
      await useTodoStore.getState().reorderTodos([
        { id: moveTodo.id, sortOrder: 99 },
      ]);
      const keepTodo = useTodoStore.getState().todos.find((t) => t.title === "Keep me");
      expect(keepTodo?.sortOrder).toBe(0); // unchanged
    });
  });

  describe("toggleStatus", () => {
    it("toggles open to completed", async () => {
      await useTodoStore.getState().createTodo({
        title: "Complete me",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const todoId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().toggleStatus(todoId);
      const todo = useTodoStore.getState().todos[0];
      expect(todo?.status).toBe("completed");
      expect(todo?.completedAt).toBeDefined();
      expect(todo?.completedAt).not.toBeNull();
    });

    it("toggles completed back to open", async () => {
      await useTodoStore.getState().createTodo({
        title: "Reopen me",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const todoId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().toggleStatus(todoId);
      await useTodoStore.getState().toggleStatus(todoId);
      const todo = useTodoStore.getState().todos[0];
      expect(todo?.status).toBe("open");
      expect(todo?.completedAt).toBeNull();
    });

    it("cascade down: completing parent completes all descendants", async () => {
      await useTodoStore.getState().createTodo({
        title: "Parent",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const parentId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().createTodo({
        title: "Child",
        description: null,
        tagIds: [defaultTagId()],
        parentId,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const childId = useTodoStore.getState().todos[1]!.id;
      await useTodoStore.getState().createTodo({
        title: "Grandchild",
        description: null,
        tagIds: [defaultTagId()],
        parentId: childId,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });

      await useTodoStore.getState().toggleStatus(parentId);

      const { todos } = useTodoStore.getState();
      expect(todos.every((t) => t.status === "completed")).toBe(true);
      expect(todos.every((t) => t.completedAt !== null)).toBe(true);
    });

    it("cascade up: reopening child reopens ancestor chain", async () => {
      await useTodoStore.getState().createTodo({
        title: "Parent",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const parentId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().createTodo({
        title: "Child",
        description: null,
        tagIds: [defaultTagId()],
        parentId,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });

      // Complete parent (cascades to child)
      await useTodoStore.getState().toggleStatus(parentId);
      expect(
        useTodoStore.getState().todos.every((t) => t.status === "completed"),
      ).toBe(true);

      // Reopen child → parent should reopen too
      const childId = useTodoStore.getState().todos[1]!.id;
      await useTodoStore.getState().toggleStatus(childId);

      const { todos } = useTodoStore.getState();
      const parent = todos.find((t) => t.id === parentId);
      const child = todos.find((t) => t.id === childId);
      expect(child?.status).toBe("open");
      expect(child?.completedAt).toBeNull();
      expect(parent?.status).toBe("open");
      expect(parent?.completedAt).toBeNull();
    });

    it("cascade up: reopening child does not reopen siblings", async () => {
      await useTodoStore.getState().createTodo({
        title: "Parent",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const parentId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().createTodo({
        title: "Child A",
        description: null,
        tagIds: [defaultTagId()],
        parentId,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      await useTodoStore.getState().createTodo({
        title: "Child B",
        description: null,
        tagIds: [defaultTagId()],
        parentId,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });

      // Complete parent (cascades to both children)
      await useTodoStore.getState().toggleStatus(parentId);

      // Reopen Child A
      const childAId = useTodoStore
        .getState()
        .todos.find((t) => t.title === "Child A")!.id;
      await useTodoStore.getState().toggleStatus(childAId);

      const { todos } = useTodoStore.getState();
      const childB = todos.find((t) => t.title === "Child B");
      expect(childB?.status).toBe("completed");
    });

    it("bubble up: completing last child auto-completes parent", async () => {
      await useTodoStore.getState().createTodo({
        title: "Parent",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const parentId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().createTodo({
        title: "Child A",
        description: null,
        tagIds: [defaultTagId()],
        parentId,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      await useTodoStore.getState().createTodo({
        title: "Child B",
        description: null,
        tagIds: [defaultTagId()],
        parentId,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });

      const childAId = useTodoStore
        .getState()
        .todos.find((t) => t.title === "Child A")!.id;
      const childBId = useTodoStore
        .getState()
        .todos.find((t) => t.title === "Child B")!.id;

      await useTodoStore.getState().toggleStatus(childAId);
      // Parent should still be open (Child B is still open)
      expect(
        useTodoStore.getState().todos.find((t) => t.id === parentId)?.status,
      ).toBe("open");

      await useTodoStore.getState().toggleStatus(childBId);
      // Parent should auto-complete now
      const parent = useTodoStore
        .getState()
        .todos.find((t) => t.id === parentId);
      expect(parent?.status).toBe("completed");
      expect(parent?.completedAt).not.toBeNull();
    });

    it("recurrence: completing daily recurring todo creates next occurrence", async () => {
      await useTodoStore.getState().createTodo({
        title: "Daily standup",
        description: "Team sync",
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: "2026-03-10",
        recurrence: "daily",
        recurrenceInterval: null,
      });
      const todoId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().toggleStatus(todoId);

      const { todos } = useTodoStore.getState();
      expect(todos).toHaveLength(2);
      const original = todos.find((t) => t.id === todoId);
      const next = todos.find((t) => t.id !== todoId);
      expect(original?.status).toBe("completed");
      expect(next?.status).toBe("open");
      expect(next?.title).toBe("Daily standup");
      expect(next?.description).toBe("Team sync");
      expect(next?.dueDate).toBe("2026-03-11");
      expect(next?.recurrence).toBe("daily");
    });

    it("recurrence: completing weekly recurring todo advances by 7 days", async () => {
      await useTodoStore.getState().createTodo({
        title: "Weekly review",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: "2026-03-10",
        recurrence: "weekly",
        recurrenceInterval: null,
      });
      const todoId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().toggleStatus(todoId);

      const next = useTodoStore.getState().todos.find((t) => t.id !== todoId);
      expect(next?.dueDate).toBe("2026-03-17");
      expect(next?.recurrence).toBe("weekly");
    });

    it("recurrence: completing monthly recurring todo advances by 1 month", async () => {
      await useTodoStore.getState().createTodo({
        title: "Monthly report",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: "2026-01-31",
        recurrence: "monthly",
        recurrenceInterval: null,
      });
      const todoId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().toggleStatus(todoId);

      const next = useTodoStore.getState().todos.find((t) => t.id !== todoId);
      expect(next?.dueDate).toBe("2026-02-28");
      expect(next?.recurrence).toBe("monthly");
    });

    it("recurrence: completing custom recurring todo uses interval", async () => {
      await useTodoStore.getState().createTodo({
        title: "Custom task",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: "2026-03-01",
        recurrence: "custom",
        recurrenceInterval: 5,
      });
      const todoId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().toggleStatus(todoId);

      const next = useTodoStore.getState().todos.find((t) => t.id !== todoId);
      expect(next?.dueDate).toBe("2026-03-06");
      expect(next?.recurrence).toBe("custom");
      expect(next?.recurrenceInterval).toBe(5);
    });

    it("recurrence: no new todo created when recurrence is null", async () => {
      await useTodoStore.getState().createTodo({
        title: "One-off task",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: "2026-03-10",
        recurrence: null,
        recurrenceInterval: null,
      });
      const todoId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().toggleStatus(todoId);
      expect(useTodoStore.getState().todos).toHaveLength(1);
    });

    it("recurrence: no new todo created when dueDate is null", async () => {
      await useTodoStore.getState().createTodo({
        title: "Recurring but no date",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: "daily",
        recurrenceInterval: null,
      });
      const todoId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().toggleStatus(todoId);
      expect(useTodoStore.getState().todos).toHaveLength(1);
    });

    it("bubble up: cascades through multiple ancestor levels", async () => {
      await useTodoStore.getState().createTodo({
        title: "Grandparent",
        description: null,
        tagIds: [defaultTagId()],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const grandparentId = useTodoStore.getState().todos[0]!.id;
      await useTodoStore.getState().createTodo({
        title: "Parent",
        description: null,
        tagIds: [defaultTagId()],
        parentId: grandparentId,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const parentId = useTodoStore.getState().todos[1]!.id;
      await useTodoStore.getState().createTodo({
        title: "Child",
        description: null,
        tagIds: [defaultTagId()],
        parentId,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      const childId = useTodoStore.getState().todos[2]!.id;

      // Complete the only child → parent auto-completes → grandparent auto-completes
      await useTodoStore.getState().toggleStatus(childId);

      const { todos } = useTodoStore.getState();
      expect(todos.every((t) => t.status === "completed")).toBe(true);
    });
  });
});
