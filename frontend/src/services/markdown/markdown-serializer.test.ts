import { describe, it, expect } from "vitest";
import { todosToMarkdown } from "./markdown-serializer.ts";
import type { Todo } from "@/features/todos/types.ts";

function makeTodo(
  overrides: Partial<Todo> & { id: string; title: string },
): Todo {
  return {
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

describe("todosToMarkdown", () => {
  it("renders header for empty list", () => {
    const result = todosToMarkdown("Work", []);
    expect(result).toBe("# Work\n");
  });

  it("renders an open todo", () => {
    const todos = [makeTodo({ id: "1", title: "Buy groceries" })];
    const result = todosToMarkdown("Work", todos);
    expect(result).toBe("# Work\n\n- [ ] Buy groceries\n");
  });

  it("renders a completed todo", () => {
    const todos = [
      makeTodo({
        id: "1",
        title: "Clean house",
        status: "completed",
        completedAt: "2026-01-02T00:00:00.000Z",
      }),
    ];
    const result = todosToMarkdown("Home", todos);
    expect(result).toBe("# Home\n\n- [x] Clean house\n");
  });

  it("renders multiple todos", () => {
    const todos = [
      makeTodo({ id: "1", title: "Task A" }),
      makeTodo({
        id: "2",
        title: "Task B",
        status: "completed",
        completedAt: "2026-01-02T00:00:00.000Z",
      }),
    ];
    const result = todosToMarkdown("Work", todos);
    expect(result).toBe("# Work\n\n- [ ] Task A\n- [x] Task B\n");
  });

  it("renders hierarchy with 2-space indentation", () => {
    const todos = [
      makeTodo({ id: "1", title: "Parent" }),
      makeTodo({ id: "2", title: "Child", parentId: "1" }),
    ];
    const result = todosToMarkdown("Work", todos);
    expect(result).toBe("# Work\n\n- [ ] Parent\n  - [ ] Child\n");
  });

  it("renders deep nesting", () => {
    const todos = [
      makeTodo({ id: "1", title: "Level 0" }),
      makeTodo({ id: "2", title: "Level 1", parentId: "1" }),
      makeTodo({ id: "3", title: "Level 2", parentId: "2" }),
    ];
    const result = todosToMarkdown("Work", todos);
    expect(result).toBe(
      "# Work\n\n- [ ] Level 0\n  - [ ] Level 1\n    - [ ] Level 2\n",
    );
  });

  it("treats orphans as roots", () => {
    const todos = [
      makeTodo({ id: "2", title: "Orphan", parentId: "missing-parent" }),
    ];
    const result = todosToMarkdown("Work", todos);
    expect(result).toBe("# Work\n\n- [ ] Orphan\n");
  });

  it("renders mixed hierarchy with completed children", () => {
    const todos = [
      makeTodo({ id: "1", title: "Buy groceries" }),
      makeTodo({ id: "2", title: "Get milk", parentId: "1" }),
      makeTodo({
        id: "3",
        title: "Get bread",
        parentId: "1",
        status: "completed",
        completedAt: "2026-01-02T00:00:00.000Z",
      }),
      makeTodo({
        id: "4",
        title: "Clean house",
        status: "completed",
        completedAt: "2026-01-02T00:00:00.000Z",
      }),
    ];
    const result = todosToMarkdown("Work", todos);
    expect(result).toBe(
      "# Work\n\n- [ ] Buy groceries\n  - [ ] Get milk\n  - [x] Get bread\n- [x] Clean house\n",
    );
  });
});
