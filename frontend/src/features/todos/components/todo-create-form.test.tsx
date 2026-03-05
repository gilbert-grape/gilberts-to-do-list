import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TodoCreateForm } from "./todo-create-form.tsx";
import { useTodoStore } from "../store.ts";
import { useTagStore } from "@/features/tags/store.ts";
import type { Tag } from "@/features/tags/types.ts";
import type { Todo } from "../types.ts";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "todos.titlePlaceholder": "What needs to be done?",
        "todos.descriptionPlaceholder": "Add notes...",
        "todos.parentLabel": "Parent To-Do",
        "todos.parentPlaceholder": "Search parent...",
        "todos.clearParent": "Clear parent",
        "todos.moreOptions": "More Options",
        "todos.dueDate": "Due Date",
        "todos.recurrence": "Recurrence",
        "todos.recurrenceNone": "None",
        "todos.recurrenceDaily": "Daily",
        "todos.recurrenceWeekly": "Weekly",
        "todos.recurrenceMonthly": "Monthly",
        "todos.recurrenceCustom": "Custom",
        "todos.customInterval": "Every X days",
        "common.cancel": "Cancel",
        "common.save": "Save",
      };
      return translations[key] ?? key;
    },
  }),
}));

const mockCreateTodo = vi.fn().mockResolvedValue(undefined);
const mockOnClose = vi.fn();

const defaultTag: Tag = {
  id: "tag-default",
  name: "General",
  color: "#ef4444",
  isDefault: true,
  parentId: null,
};

const workTag: Tag = {
  id: "tag-work",
  name: "Work",
  color: "#3b82f6",
  isDefault: false,
  parentId: null,
};

const parentTodo: Todo = {
  id: "todo-parent",
  title: "Parent task",
  description: null,
  tagIds: ["tag-work"],
  parentId: null,
  status: "open",
  dueDate: null,
  recurrence: null,
  recurrenceInterval: null,
  createdAt: "2026-02-10T12:00:00.000Z",
  completedAt: null,
  sortOrder: 0,
};

function setupStores(options?: { tags?: Tag[]; todos?: Todo[] }) {
  const { tags = [defaultTag, workTag], todos = [] } = options ?? {};
  useTagStore.setState({ tags, isLoaded: true });
  useTodoStore.setState({ todos, isLoaded: true });
  const todoState = useTodoStore.getState();
  todoState.createTodo = mockCreateTodo;
}

describe("TodoCreateForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders title input and save button", () => {
    setupStores();
    render(<TodoCreateForm onClose={mockOnClose} />);
    expect(
      screen.getByPlaceholderText("What needs to be done?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("renders description textarea", () => {
    setupStores();
    render(<TodoCreateForm onClose={mockOnClose} />);
    expect(screen.getByPlaceholderText("Add notes...")).toBeInTheDocument();
  });

  it("renders tag chips for selection", () => {
    setupStores();
    render(<TodoCreateForm onClose={mockOnClose} />);
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
  });

  it("does not pre-select any tag", () => {
    setupStores();
    render(<TodoCreateForm onClose={mockOnClose} />);
    const generalChip = screen.getByText("General").closest("button");
    expect(generalChip?.className).not.toContain("shadow-md");
  });

  it("disables save when title is empty", () => {
    setupStores();
    render(<TodoCreateForm onClose={mockOnClose} />);
    expect(screen.getByText("Save")).toBeDisabled();
  });

  it("creates todo with empty tagIds when no tag selected", async () => {
    const user = userEvent.setup();
    setupStores();
    render(<TodoCreateForm onClose={mockOnClose} />);

    await user.type(
      screen.getByPlaceholderText("What needs to be done?"),
      "Buy milk",
    );
    await user.click(screen.getByText("Save"));

    expect(mockCreateTodo).toHaveBeenCalledWith({
      title: "Buy milk",
      description: null,
      tagIds: [],
      parentId: null,
      dueDate: expect.any(String),
      recurrence: null,
      recurrenceInterval: null,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("includes description when provided", async () => {
    const user = userEvent.setup();
    setupStores();
    render(<TodoCreateForm onClose={mockOnClose} />);

    await user.type(
      screen.getByPlaceholderText("What needs to be done?"),
      "Task",
    );
    await user.type(screen.getByPlaceholderText("Add notes..."), "Details");
    await user.click(screen.getByText("Save"));

    expect(mockCreateTodo).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Details" }),
    );
  });

  it("allows toggling tag selection", async () => {
    const user = userEvent.setup();
    setupStores();
    render(<TodoCreateForm onClose={mockOnClose} />);

    await user.click(screen.getByText("Work"));
    await user.type(
      screen.getByPlaceholderText("What needs to be done?"),
      "Task",
    );
    await user.click(screen.getByText("Save"));

    expect(mockCreateTodo).toHaveBeenCalledWith(
      expect.objectContaining({ tagIds: ["tag-work"] }),
    );
  });

  it("allows selecting and deselecting a tag", async () => {
    const user = userEvent.setup();
    setupStores();
    render(<TodoCreateForm onClose={mockOnClose} />);

    await user.click(screen.getByText("Work"));
    await user.click(screen.getByText("Work"));
    await user.type(
      screen.getByPlaceholderText("What needs to be done?"),
      "Task",
    );
    await user.click(screen.getByText("Save"));

    expect(mockCreateTodo).toHaveBeenCalledWith(
      expect.objectContaining({ tagIds: [] }),
    );
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    setupStores();
    render(<TodoCreateForm onClose={mockOnClose} />);
    await user.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("renders parent search input", () => {
    setupStores();
    render(<TodoCreateForm onClose={mockOnClose} />);
    expect(screen.getByText("Parent To-Do")).toBeInTheDocument();
  });

  it("creates todo with selected parent", async () => {
    const user = userEvent.setup();
    setupStores({ todos: [parentTodo] });
    render(<TodoCreateForm onClose={mockOnClose} />);

    await user.type(screen.getByPlaceholderText("Search parent..."), "Parent");
    await user.click(screen.getByText("Parent task"));

    await user.type(
      screen.getByPlaceholderText("What needs to be done?"),
      "Child task",
    );
    await user.click(screen.getByText("Save"));

    expect(mockCreateTodo).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Child task",
        parentId: "todo-parent",
      }),
    );
  });

  it("pre-fills parent from initialParentId prop", async () => {
    const user = userEvent.setup();
    setupStores({ todos: [parentTodo] });
    render(
      <TodoCreateForm onClose={mockOnClose} initialParentId="todo-parent" />,
    );

    // Parent should already be selected (shown in UI)
    expect(screen.getByText("Parent task")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("What needs to be done?"),
      "Child task",
    );
    await user.click(screen.getByText("Save"));

    expect(mockCreateTodo).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Child task",
        parentId: "todo-parent",
      }),
    );
  });

  it("inherits tags from initialParentId on mount", async () => {
    const user = userEvent.setup();
    setupStores({ todos: [parentTodo] });
    render(
      <TodoCreateForm onClose={mockOnClose} initialParentId="todo-parent" />,
    );

    await user.type(
      screen.getByPlaceholderText("What needs to be done?"),
      "Child",
    );
    await user.click(screen.getByText("Save"));

    const callArgs = mockCreateTodo.mock.calls[0]![0];
    expect(callArgs.tagIds).toContain("tag-work");
    expect(callArgs.parentId).toBe("todo-parent");
  });

  it("inherits tags from parent when parent is selected", async () => {
    const user = userEvent.setup();
    setupStores({ todos: [parentTodo] });
    render(<TodoCreateForm onClose={mockOnClose} />);

    await user.type(screen.getByPlaceholderText("Search parent..."), "Parent");
    await user.click(screen.getByText("Parent task"));

    await user.type(
      screen.getByPlaceholderText("What needs to be done?"),
      "Child",
    );
    await user.click(screen.getByText("Save"));

    const callArgs = mockCreateTodo.mock.calls[0]![0];
    expect(callArgs.tagIds).toContain("tag-work");
  });
});
