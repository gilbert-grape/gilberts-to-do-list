import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TodoEditForm } from "./todo-edit-form.tsx";
import { useTodoStore } from "../store.ts";
import { useTagStore } from "@/features/tags/store.ts";
import type { Todo } from "../types.ts";
import type { Tag } from "@/features/tags/types.ts";

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

const mockUpdateTodo = vi.fn().mockResolvedValue(undefined);
const mockOnClose = vi.fn();

const defaultTag: Tag = {
  id: "tag-1",
  name: "General",
  color: "#ef4444",
  isDefault: true,
};

const workTag: Tag = {
  id: "tag-2",
  name: "Work",
  color: "#3b82f6",
  isDefault: false,
};

const existingTodo: Todo = {
  id: "todo-1",
  title: "Buy groceries",
  description: "Milk, eggs, bread",
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

function setupStores() {
  useTagStore.setState({ tags: [defaultTag, workTag], isLoaded: true });
  useTodoStore.setState({ todos: [existingTodo], isLoaded: true });
  const state = useTodoStore.getState();
  state.updateTodo = mockUpdateTodo;
}

describe("TodoEditForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pre-fills title from existing todo", () => {
    setupStores();
    render(<TodoEditForm todo={existingTodo} onClose={mockOnClose} />);
    expect(screen.getByDisplayValue("Buy groceries")).toBeInTheDocument();
  });

  it("pre-fills description from existing todo", () => {
    setupStores();
    render(<TodoEditForm todo={existingTodo} onClose={mockOnClose} />);
    expect(screen.getByDisplayValue("Milk, eggs, bread")).toBeInTheDocument();
  });

  it("pre-selects existing tags", () => {
    setupStores();
    render(<TodoEditForm todo={existingTodo} onClose={mockOnClose} />);
    const generalChip = screen.getByText("General").closest("button");
    expect(generalChip?.className).toContain("shadow-md");
  });

  it("saves changes on save click", async () => {
    const user = userEvent.setup();
    setupStores();
    render(<TodoEditForm todo={existingTodo} onClose={mockOnClose} />);

    const titleInput = screen.getByDisplayValue("Buy groceries");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated title");
    await user.click(screen.getByText("Save"));

    expect(mockUpdateTodo).toHaveBeenCalledWith("todo-1", {
      title: "Updated title",
      description: "Milk, eggs, bread",
      tagIds: ["tag-1"],
      parentId: null,
      dueDate: null,
      recurrence: null,
      recurrenceInterval: null,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("allows changing tags", async () => {
    const user = userEvent.setup();
    setupStores();
    render(<TodoEditForm todo={existingTodo} onClose={mockOnClose} />);

    await user.click(screen.getByText("Work"));
    await user.click(screen.getByText("Save"));

    expect(mockUpdateTodo).toHaveBeenCalledWith(
      "todo-1",
      expect.objectContaining({ tagIds: ["tag-1", "tag-2"] }),
    );
  });

  it("disables save when title is empty", async () => {
    const user = userEvent.setup();
    setupStores();
    render(<TodoEditForm todo={existingTodo} onClose={mockOnClose} />);

    const titleInput = screen.getByDisplayValue("Buy groceries");
    await user.clear(titleInput);

    expect(screen.getByText("Save")).toBeDisabled();
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    setupStores();
    render(<TodoEditForm todo={existingTodo} onClose={mockOnClose} />);
    await user.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("handles todo with null description", () => {
    setupStores();
    const todoNoDesc = { ...existingTodo, description: null };
    render(<TodoEditForm todo={todoNoDesc} onClose={mockOnClose} />);
    const textarea = screen.getByPlaceholderText("Add notes...");
    expect(textarea).toHaveValue("");
  });

  it("renders parent search input", () => {
    setupStores();
    render(<TodoEditForm todo={existingTodo} onClose={mockOnClose} />);
    expect(screen.getByText("Parent To-Do")).toBeInTheDocument();
  });

  it("excludes self from parent search results", async () => {
    const user = userEvent.setup();
    setupStores();
    render(<TodoEditForm todo={existingTodo} onClose={mockOnClose} />);

    await user.type(screen.getByPlaceholderText("Search parent..."), "Buy");
    // existingTodo has title "Buy groceries" but should be excluded
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("excludes descendants from parent search results", async () => {
    const user = userEvent.setup();
    const childTodo: Todo = {
      id: "todo-child",
      title: "Buy milk specifically",
      description: null,
      tagIds: ["tag-1"],
      parentId: "todo-1",
      status: "open",
      dueDate: null,
      recurrence: null,
      recurrenceInterval: null,
      createdAt: "2026-02-10T13:00:00.000Z",
      completedAt: null,
      sortOrder: 1,
    };
    useTodoStore.setState({
      todos: [existingTodo, childTodo],
      isLoaded: true,
    });
    const state = useTodoStore.getState();
    state.updateTodo = mockUpdateTodo;

    render(<TodoEditForm todo={existingTodo} onClose={mockOnClose} />);

    await user.type(screen.getByPlaceholderText("Search parent..."), "Buy");
    // Both "Buy groceries" (self) and "Buy milk specifically" (child) excluded
    expect(screen.queryByText("Buy milk specifically")).not.toBeInTheDocument();
  });

  it("saves parentId change", async () => {
    const user = userEvent.setup();
    const otherTodo: Todo = {
      id: "todo-other",
      title: "Other task",
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
    useTodoStore.setState({
      todos: [existingTodo, otherTodo],
      isLoaded: true,
    });
    const state = useTodoStore.getState();
    state.updateTodo = mockUpdateTodo;

    render(<TodoEditForm todo={existingTodo} onClose={mockOnClose} />);

    await user.type(screen.getByPlaceholderText("Search parent..."), "Other");
    await user.click(screen.getByText("Other task"));
    await user.click(screen.getByText("Save"));

    expect(mockUpdateTodo).toHaveBeenCalledWith(
      "todo-1",
      expect.objectContaining({ parentId: "todo-other" }),
    );
  });
});
