import { describe, it, expect } from "vitest";
import { buildHierarchy } from "./hierarchy.ts";
import type { Todo } from "@/features/todos/types.ts";

function makeTodo(overrides: Partial<Todo> & { id: string }): Todo {
  return {
    title: "Todo",
    description: null,
    tagIds: ["tag-1"],
    parentId: null,
    status: "open",
    dueDate: null,
    recurrence: null,
    recurrenceInterval: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    completedAt: null,
    sortOrder: 0,
    ...overrides,
  };
}

describe("buildHierarchy", () => {
  it("returns empty array for empty input", () => {
    expect(buildHierarchy([])).toEqual([]);
  });

  it("returns flat list with depth 0 for root todos", () => {
    const todos = [
      makeTodo({ id: "1", title: "A", sortOrder: 1 }),
      makeTodo({ id: "2", title: "B", sortOrder: 0 }),
    ];
    const result = buildHierarchy(todos);
    expect(result).toHaveLength(2);
    expect(result[0]!.todo.title).toBe("B");
    expect(result[0]!.depth).toBe(0);
    expect(result[1]!.todo.title).toBe("A");
    expect(result[1]!.depth).toBe(0);
  });

  it("nests children under parents with correct depth", () => {
    const todos = [
      makeTodo({ id: "1", title: "Parent", sortOrder: 0 }),
      makeTodo({ id: "2", title: "Child", parentId: "1", sortOrder: 0 }),
      makeTodo({ id: "3", title: "Grandchild", parentId: "2", sortOrder: 0 }),
    ];
    const result = buildHierarchy(todos);
    expect(result).toHaveLength(3);
    expect(result[0]!.todo.title).toBe("Parent");
    expect(result[0]!.depth).toBe(0);
    expect(result[1]!.todo.title).toBe("Child");
    expect(result[1]!.depth).toBe(1);
    expect(result[2]!.todo.title).toBe("Grandchild");
    expect(result[2]!.depth).toBe(2);
  });

  it("sorts children by sortOrder", () => {
    const todos = [
      makeTodo({ id: "1", title: "Parent", sortOrder: 0 }),
      makeTodo({ id: "2", title: "Second", parentId: "1", sortOrder: 1 }),
      makeTodo({ id: "3", title: "First", parentId: "1", sortOrder: 0 }),
    ];
    const result = buildHierarchy(todos);
    expect(result[1]!.todo.title).toBe("First");
    expect(result[2]!.todo.title).toBe("Second");
  });

  it("treats orphans as root todos", () => {
    const todos = [
      makeTodo({ id: "1", title: "Orphan", parentId: "nonexistent", sortOrder: 0 }),
    ];
    const result = buildHierarchy(todos);
    expect(result).toHaveLength(1);
    expect(result[0]!.depth).toBe(0);
  });

  it("handles multiple root todos with children", () => {
    const todos = [
      makeTodo({ id: "1", title: "Root A", sortOrder: 0 }),
      makeTodo({ id: "2", title: "Root B", sortOrder: 1 }),
      makeTodo({ id: "3", title: "Child of A", parentId: "1", sortOrder: 0 }),
      makeTodo({ id: "4", title: "Child of B", parentId: "2", sortOrder: 0 }),
    ];
    const result = buildHierarchy(todos);
    expect(result.map((r) => r.todo.title)).toEqual([
      "Root A",
      "Child of A",
      "Root B",
      "Child of B",
    ]);
  });
});
