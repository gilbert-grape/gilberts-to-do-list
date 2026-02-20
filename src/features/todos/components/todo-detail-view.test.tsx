import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TodoDetailView } from "./todo-detail-view.tsx";
import { useTodoStore } from "../store.ts";
import { useTagStore } from "@/features/tags/store.ts";
import type { Todo } from "../types.ts";
import type { Tag } from "@/features/tags/types.ts";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "common.back": "Back",
        "common.edit": "Edit",
        "common.delete": "Delete",
        "todos.dueDate": "Due Date",
        "todos.recurrence": "Recurrence",
        "todos.recurrenceDaily": "Daily",
        "todos.recurrenceWeekly": "Weekly",
        "todos.recurrenceMonthly": "Monthly",
        "todos.recurrenceCustom": "Custom",
        "todos.recurrenceCustomInterval": `Every ${options?.count ?? "X"} days`,
        "todos.parentLabel": "Parent To-Do",
        "todos.subTodos": "Sub-Todos",
        "todos.statusOpen": "Open",
        "todos.statusCompleted": "Completed",
      };
      return translations[key] ?? key;
    },
  }),
}));

const defaultTag: Tag = {
  id: "tag-1",
  name: "General",
  color: "#ef4444",
  isDefault: true,
  parentId: null,
};

const workTag: Tag = {
  id: "tag-2",
  name: "Work",
  color: "#3b82f6",
  isDefault: false,
  parentId: null,
};

const baseTodo: Todo = {
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

const childTodo: Todo = {
  id: "todo-child",
  title: "Get oat milk",
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

const parentTodo: Todo = {
  id: "todo-parent",
  title: "Shopping list",
  description: null,
  tagIds: ["tag-1"],
  parentId: null,
  status: "open",
  dueDate: null,
  recurrence: null,
  recurrenceInterval: null,
  createdAt: "2026-02-10T11:00:00.000Z",
  completedAt: null,
  sortOrder: 0,
};

const mockOnBack = vi.fn();
const mockOnEdit = vi.fn();
const mockOnDelete = vi.fn();
const mockOnSubTodoClick = vi.fn();

function setupStores(todos: Todo[] = [baseTodo]) {
  useTagStore.setState({ tags: [defaultTag, workTag], isLoaded: true });
  useTodoStore.setState({ todos, isLoaded: true });
}

describe("TodoDetailView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders todo title", () => {
    setupStores();
    render(
      <TodoDetailView
        todo={baseTodo}
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSubTodoClick={mockOnSubTodoClick}
      />,
    );
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  it("renders status badge as Open", () => {
    setupStores();
    render(
      <TodoDetailView
        todo={baseTodo}
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSubTodoClick={mockOnSubTodoClick}
      />,
    );
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("renders status badge as Completed", () => {
    const completed = {
      ...baseTodo,
      status: "completed" as const,
      completedAt: "2026-02-10T14:00:00.000Z",
    };
    setupStores([completed]);
    render(
      <TodoDetailView
        todo={completed}
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSubTodoClick={mockOnSubTodoClick}
      />,
    );
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders description", () => {
    setupStores();
    render(
      <TodoDetailView
        todo={baseTodo}
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSubTodoClick={mockOnSubTodoClick}
      />,
    );
    expect(screen.getByText("Milk, eggs, bread")).toBeInTheDocument();
  });

  it("renders tag chips", () => {
    setupStores();
    render(
      <TodoDetailView
        todo={baseTodo}
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSubTodoClick={mockOnSubTodoClick}
      />,
    );
    expect(screen.getByText("General")).toBeInTheDocument();
  });

  it("renders due date when set", () => {
    const todoWithDate = { ...baseTodo, dueDate: "2026-06-15" };
    setupStores([todoWithDate]);
    render(
      <TodoDetailView
        todo={todoWithDate}
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSubTodoClick={mockOnSubTodoClick}
      />,
    );
    expect(screen.getByText(/Jun 15, 2026/)).toBeInTheDocument();
  });

  it("renders recurrence when set", () => {
    const todoRecurring = { ...baseTodo, recurrence: "weekly" as const };
    setupStores([todoRecurring]);
    render(
      <TodoDetailView
        todo={todoRecurring}
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSubTodoClick={mockOnSubTodoClick}
      />,
    );
    expect(screen.getByText("Weekly")).toBeInTheDocument();
  });

  it("renders custom recurrence with interval", () => {
    const todoCustom = {
      ...baseTodo,
      recurrence: "custom" as const,
      recurrenceInterval: 3,
    };
    setupStores([todoCustom]);
    render(
      <TodoDetailView
        todo={todoCustom}
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSubTodoClick={mockOnSubTodoClick}
      />,
    );
    expect(screen.getByText("Every 3 days")).toBeInTheDocument();
  });

  it("renders parent link when parentId is set", () => {
    const todoWithParent = { ...baseTodo, parentId: "todo-parent" };
    setupStores([todoWithParent, parentTodo]);
    render(
      <TodoDetailView
        todo={todoWithParent}
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSubTodoClick={mockOnSubTodoClick}
      />,
    );
    expect(screen.getByText("Shopping list")).toBeInTheDocument();
  });

  it("navigates to parent on parent link click", async () => {
    const user = userEvent.setup();
    const todoWithParent = { ...baseTodo, parentId: "todo-parent" };
    setupStores([todoWithParent, parentTodo]);
    render(
      <TodoDetailView
        todo={todoWithParent}
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSubTodoClick={mockOnSubTodoClick}
      />,
    );
    await user.click(screen.getByText("Shopping list"));
    expect(mockOnSubTodoClick).toHaveBeenCalledWith(parentTodo);
  });

  it("renders sub-todos list", () => {
    setupStores([baseTodo, childTodo]);
    render(
      <TodoDetailView
        todo={baseTodo}
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSubTodoClick={mockOnSubTodoClick}
      />,
    );
    expect(screen.getByText("Sub-Todos (1)")).toBeInTheDocument();
    expect(screen.getByText("Get oat milk")).toBeInTheDocument();
  });

  it("navigates to sub-todo on click", async () => {
    const user = userEvent.setup();
    setupStores([baseTodo, childTodo]);
    render(
      <TodoDetailView
        todo={baseTodo}
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSubTodoClick={mockOnSubTodoClick}
      />,
    );
    await user.click(screen.getByText("Get oat milk"));
    expect(mockOnSubTodoClick).toHaveBeenCalledWith(childTodo);
  });

  it("calls onBack when back button is clicked", async () => {
    const user = userEvent.setup();
    setupStores();
    render(
      <TodoDetailView
        todo={baseTodo}
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSubTodoClick={mockOnSubTodoClick}
      />,
    );
    await user.click(screen.getByLabelText("Back"));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it("calls onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    setupStores();
    render(
      <TodoDetailView
        todo={baseTodo}
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSubTodoClick={mockOnSubTodoClick}
      />,
    );
    await user.click(screen.getByText("Edit"));
    expect(mockOnEdit).toHaveBeenCalledWith(baseTodo);
  });

  it("calls onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    setupStores();
    render(
      <TodoDetailView
        todo={baseTodo}
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSubTodoClick={mockOnSubTodoClick}
      />,
    );
    await user.click(screen.getByText("Delete"));
    expect(mockOnDelete).toHaveBeenCalledWith(baseTodo);
  });

  it("does not render sub-todos section when none exist", () => {
    setupStores([baseTodo]);
    render(
      <TodoDetailView
        todo={baseTodo}
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSubTodoClick={mockOnSubTodoClick}
      />,
    );
    expect(screen.queryByText(/Sub-Todos/)).not.toBeInTheDocument();
  });

  it("does not render description when null", () => {
    const todoNoDesc = { ...baseTodo, description: null };
    setupStores([todoNoDesc]);
    render(
      <TodoDetailView
        todo={todoNoDesc}
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSubTodoClick={mockOnSubTodoClick}
      />,
    );
    expect(screen.queryByText("Milk, eggs, bread")).not.toBeInTheDocument();
  });
});
