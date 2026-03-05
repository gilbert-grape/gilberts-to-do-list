import { describe, it, expect } from "vitest";
import { parseMarkdown, diffMarkdownTodos } from "./markdown-parser.ts";
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

describe("parseMarkdown", () => {
  it("parses header and tag name", () => {
    const result = parseMarkdown("# Work\n");
    expect(result.tagName).toBe("Work");
    expect(result.todos).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("parses an open todo", () => {
    const result = parseMarkdown("# Work\n\n- [ ] Buy groceries\n");
    expect(result.todos).toHaveLength(1);
    expect(result.todos[0]).toEqual({
      title: "Buy groceries",
      completed: false,
      depth: 0,
      lineNumber: 3,
    });
  });

  it("parses a completed todo", () => {
    const result = parseMarkdown("# Work\n\n- [x] Clean house\n");
    expect(result.todos).toHaveLength(1);
    expect(result.todos[0]!.completed).toBe(true);
  });

  it("parses indented children", () => {
    const result = parseMarkdown("# Work\n\n- [ ] Parent\n  - [ ] Child\n");
    expect(result.todos).toHaveLength(2);
    expect(result.todos[0]!.depth).toBe(0);
    expect(result.todos[1]!.depth).toBe(1);
    expect(result.todos[1]!.title).toBe("Child");
  });

  it("parses deeply nested todos", () => {
    const result = parseMarkdown(
      "# Work\n\n- [ ] L0\n  - [ ] L1\n    - [ ] L2\n",
    );
    expect(result.todos).toHaveLength(3);
    expect(result.todos[2]!.depth).toBe(2);
  });

  it("returns error for odd indentation", () => {
    const result = parseMarkdown("# Work\n\n- [ ] Parent\n - [ ] Bad\n");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({ line: 4, message: "oddIndent" });
    expect(result.todos).toHaveLength(1);
  });

  it("returns error for depth jump > 1", () => {
    const result = parseMarkdown("# Work\n\n- [ ] Parent\n    - [ ] TooDeep\n");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({ line: 4, message: "depthJump" });
  });

  it("returns error for unrecognized lines", () => {
    const result = parseMarkdown("# Work\n\nsome random text\n");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({ line: 3, message: "invalidLine" });
  });

  it("skips empty lines", () => {
    const result = parseMarkdown("# Work\n\n- [ ] A\n\n- [ ] B\n");
    expect(result.todos).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it("returns null tagName when no header", () => {
    const result = parseMarkdown("- [ ] No header\n");
    expect(result.tagName).toBeNull();
    expect(result.todos).toHaveLength(1);
  });

  it("returns error for first todo with nonzero depth", () => {
    const result = parseMarkdown("# Work\n\n  - [ ] Indented first\n");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.message).toBe("depthJump");
  });
});

describe("diffMarkdownTodos", () => {
  it("returns empty diff when nothing changed", () => {
    const existing = [makeTodo({ id: "1", title: "Task A" })];
    const parsed = [
      { title: "Task A", completed: false, depth: 0, lineNumber: 3 },
    ];

    const diff = diffMarkdownTodos(parsed, existing, "tag-1");
    expect(diff.toCreate).toHaveLength(0);
    expect(diff.toUpdate).toHaveLength(0);
    expect(diff.toDelete).toHaveLength(0);
  });

  it("detects new todo to create", () => {
    const existing: Todo[] = [];
    const parsed = [
      { title: "New task", completed: false, depth: 0, lineNumber: 3 },
    ];

    const diff = diffMarkdownTodos(parsed, existing, "tag-1");
    expect(diff.toCreate).toHaveLength(1);
    expect(diff.toCreate[0]!.title).toBe("New task");
  });

  it("detects deleted todo", () => {
    const existing = [makeTodo({ id: "1", title: "Old task" })];
    const parsed: {
      title: string;
      completed: boolean;
      depth: number;
      lineNumber: number;
    }[] = [];

    const diff = diffMarkdownTodos(parsed, existing, "tag-1");
    expect(diff.toDelete).toEqual(["1"]);
  });

  it("detects status change from open to completed", () => {
    const existing = [makeTodo({ id: "1", title: "Task A" })];
    const parsed = [
      { title: "Task A", completed: true, depth: 0, lineNumber: 3 },
    ];

    const diff = diffMarkdownTodos(parsed, existing, "tag-1");
    expect(diff.toUpdate).toHaveLength(1);
    expect(diff.toUpdate[0]).toEqual({
      id: "1",
      changes: { status: "completed" },
    });
  });

  it("detects status change from completed to open", () => {
    const existing = [
      makeTodo({
        id: "1",
        title: "Task A",
        status: "completed",
        completedAt: "2026-01-02T00:00:00.000Z",
      }),
    ];
    const parsed = [
      { title: "Task A", completed: false, depth: 0, lineNumber: 3 },
    ];

    const diff = diffMarkdownTodos(parsed, existing, "tag-1");
    expect(diff.toUpdate).toHaveLength(1);
    expect(diff.toUpdate[0]).toEqual({
      id: "1",
      changes: { status: "open" },
    });
  });

  it("handles title-based matching for reordered todos", () => {
    const existing = [
      makeTodo({ id: "1", title: "Task A" }),
      makeTodo({ id: "2", title: "Task B" }),
    ];
    const parsed = [
      { title: "Task B", completed: false, depth: 0, lineNumber: 3 },
      { title: "Task A", completed: false, depth: 0, lineNumber: 4 },
    ];

    const diff = diffMarkdownTodos(parsed, existing, "tag-1");
    expect(diff.toCreate).toHaveLength(0);
    expect(diff.toDelete).toHaveLength(0);
  });

  it("creates and deletes simultaneously", () => {
    const existing = [makeTodo({ id: "1", title: "Old" })];
    const parsed = [
      { title: "New", completed: false, depth: 0, lineNumber: 3 },
    ];

    const diff = diffMarkdownTodos(parsed, existing, "tag-1");
    expect(diff.toCreate).toHaveLength(1);
    expect(diff.toCreate[0]!.title).toBe("New");
    expect(diff.toDelete).toEqual(["1"]);
  });

  it("detects reparenting via depth change", () => {
    const existing = [
      makeTodo({ id: "1", title: "Parent" }),
      makeTodo({ id: "2", title: "Child", parentId: null }),
    ];
    const parsed = [
      { title: "Parent", completed: false, depth: 0, lineNumber: 3 },
      { title: "Child", completed: false, depth: 1, lineNumber: 4 },
    ];

    const diff = diffMarkdownTodos(parsed, existing, "tag-1");
    expect(diff.toUpdate).toHaveLength(1);
    expect(diff.toUpdate[0]!.id).toBe("2");
    expect(diff.toUpdate[0]!.changes.parentId).toBe("1");
  });
});
