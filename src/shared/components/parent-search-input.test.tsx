import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ParentSearchInput } from "./parent-search-input.tsx";
import type { Todo } from "@/features/todos/types.ts";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "todos.parentLabel": "Parent To-Do",
        "todos.parentPlaceholder": "Search parent...",
        "todos.clearParent": "Clear parent",
      };
      return translations[key] ?? key;
    },
  }),
}));

const makeTodo = (
  overrides: Partial<Todo> & { id: string; title: string },
): Todo => ({
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
  ...overrides,
});

const todos: Todo[] = [
  makeTodo({ id: "t1", title: "Buy groceries", sortOrder: 0 }),
  makeTodo({ id: "t2", title: "Buy flowers", sortOrder: 1 }),
  makeTodo({ id: "t3", title: "Clean house", sortOrder: 2 }),
  makeTodo({ id: "t4", title: "Done task", status: "completed", sortOrder: 3 }),
];

describe("ParentSearchInput", () => {
  it("renders label and search input", () => {
    render(
      <ParentSearchInput
        todos={todos}
        selectedParentId={null}
        onParentChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Parent To-Do")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search parent...")).toBeInTheDocument();
  });

  it("shows filtered results when typing", async () => {
    const user = userEvent.setup();
    render(
      <ParentSearchInput
        todos={todos}
        selectedParentId={null}
        onParentChange={vi.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText("Search parent..."), "Buy");
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
    expect(screen.getByText("Buy flowers")).toBeInTheDocument();
    expect(screen.queryByText("Clean house")).not.toBeInTheDocument();
  });

  it("does not show completed todos in results", async () => {
    const user = userEvent.setup();
    render(
      <ParentSearchInput
        todos={todos}
        selectedParentId={null}
        onParentChange={vi.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText("Search parent..."), "Done");
    expect(screen.queryByText("Done task")).not.toBeInTheDocument();
  });

  it("calls onParentChange when a result is selected", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <ParentSearchInput
        todos={todos}
        selectedParentId={null}
        onParentChange={handleChange}
      />,
    );

    await user.type(screen.getByPlaceholderText("Search parent..."), "Buy g");
    await user.click(screen.getByText("Buy groceries"));
    expect(handleChange).toHaveBeenCalledWith("t1");
  });

  it("shows selected parent name instead of search input", () => {
    render(
      <ParentSearchInput
        todos={todos}
        selectedParentId="t1"
        onParentChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Search parent..."),
    ).not.toBeInTheDocument();
  });

  it("clears selection when clear button is clicked", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <ParentSearchInput
        todos={todos}
        selectedParentId="t1"
        onParentChange={handleChange}
      />,
    );

    await user.click(screen.getByLabelText("Clear parent"));
    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it("excludes specified ids from results", async () => {
    const user = userEvent.setup();
    render(
      <ParentSearchInput
        todos={todos}
        selectedParentId={null}
        onParentChange={vi.fn()}
        excludeIds={["t1"]}
      />,
    );

    await user.type(screen.getByPlaceholderText("Search parent..."), "Buy");
    expect(screen.queryByText("Buy groceries")).not.toBeInTheDocument();
    expect(screen.getByText("Buy flowers")).toBeInTheDocument();
  });

  it("shows no dropdown when query is empty", () => {
    render(
      <ParentSearchInput
        todos={todos}
        selectedParentId={null}
        onParentChange={vi.fn()}
      />,
    );
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
