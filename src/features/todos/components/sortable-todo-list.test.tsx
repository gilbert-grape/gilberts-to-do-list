import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SortableTodoList } from "./sortable-todo-list.tsx";
import { useTagStore } from "@/features/tags/store.ts";
import type { Todo } from "../types.ts";
import type { Tag } from "@/features/tags/types.ts";

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "todos.dragHandle": "Drag to reorder",
      };
      return translations[key] ?? key;
    },
  }),
}));

const tag: Tag = {
  id: "tag-1",
  name: "Work",
  color: "#3b82f6",
  isDefault: true,
};

const todo1: Todo = {
  id: "todo-1",
  title: "First task",
  description: null,
  tagIds: ["tag-1"],
  parentId: null,
  status: "open",
  dueDate: null,
  recurrence: null,
  recurrenceInterval: null,
  createdAt: "2026-02-10T12:00:00.000Z",
  completedAt: null,
  sortOrder: 0,
};

const todo2: Todo = {
  id: "todo-2",
  title: "Second task",
  description: null,
  tagIds: ["tag-1"],
  parentId: null,
  status: "open",
  dueDate: null,
  recurrence: null,
  recurrenceInterval: null,
  createdAt: "2026-02-10T13:00:00.000Z",
  completedAt: null,
  sortOrder: 1,
};

describe("SortableTodoList", () => {
  beforeEach(() => {
    useTagStore.setState({ tags: [tag], isLoaded: true });
  });

  it("renders all todo items", () => {
    render(
      <SortableTodoList
        items={[
          { todo: todo1, depth: 0 },
          { todo: todo2, depth: 0 },
        ]}
        onReorder={vi.fn()}
        onReparent={vi.fn()}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("First task")).toBeInTheDocument();
    expect(screen.getByText("Second task")).toBeInTheDocument();
  });

  it("renders drag handles for items", () => {
    render(
      <SortableTodoList
        items={[{ todo: todo1, depth: 0 }]}
        onReorder={vi.fn()}
        onReparent={vi.fn()}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Drag to reorder")).toBeInTheDocument();
  });

  it("renders as a ul element", () => {
    const { container } = render(
      <SortableTodoList
        items={[{ todo: todo1, depth: 0 }]}
        onReorder={vi.fn()}
        onReparent={vi.fn()}
        onToggle={vi.fn()}
      />,
    );
    expect(container.querySelector("ul")).toBeInTheDocument();
  });

  it("passes callback props to todo items", async () => {
    const handleToggle = vi.fn();
    render(
      <SortableTodoList
        items={[{ todo: todo1, depth: 0 }]}
        onReorder={vi.fn()}
        onReparent={vi.fn()}
        onToggle={handleToggle}
      />,
    );
    const checkbox = screen.getByRole("checkbox");
    await checkbox.click();
    expect(handleToggle).toHaveBeenCalledWith("todo-1");
  });

  it("renders multiple drag handles for multiple items", () => {
    render(
      <SortableTodoList
        items={[
          { todo: todo1, depth: 0 },
          { todo: todo2, depth: 0 },
        ]}
        onReorder={vi.fn()}
        onReparent={vi.fn()}
        onToggle={vi.fn()}
      />,
    );
    const handles = screen.getAllByLabelText("Drag to reorder");
    expect(handles).toHaveLength(2);
  });
});
