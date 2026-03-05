import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TodoItem } from "./todo-item.tsx";
import { useTagStore } from "@/features/tags/store.ts";
import type { Todo } from "../types.ts";
import type { Tag } from "@/features/tags/types.ts";

const tag: Tag = {
  id: "tag-1",
  name: "Work",
  color: "#3b82f6",
  isDefault: true,
  parentId: null,
};

const openTodo: Todo = {
  id: "todo-1",
  title: "Buy groceries",
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

const completedTodo: Todo = {
  ...openTodo,
  id: "todo-2",
  status: "completed",
  completedAt: "2026-02-10T13:00:00.000Z",
};

describe("TodoItem", () => {
  beforeEach(() => {
    useTagStore.setState({ tags: [tag], isLoaded: true });
  });

  it("renders todo title", () => {
    render(<TodoItem todo={openTodo} onToggle={vi.fn()} />);
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  it("renders tag color indicator", () => {
    render(<TodoItem todo={openTodo} onToggle={vi.fn()} />);
    const colorDot = screen.getByTitle("Work");
    expect(colorDot).toHaveStyle({ backgroundColor: "#3b82f6" });
  });

  it("renders unchecked checkbox for open todo", () => {
    render(<TodoItem todo={openTodo} onToggle={vi.fn()} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-checked", "false");
  });

  it("renders checked checkbox for completed todo", () => {
    render(<TodoItem todo={completedTodo} onToggle={vi.fn()} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-checked", "true");
  });

  it("applies strikethrough for completed todo", () => {
    render(<TodoItem todo={completedTodo} onToggle={vi.fn()} />);
    const title = screen.getByText("Buy groceries");
    expect(title.className).toContain("line-through");
  });

  it("does not apply strikethrough for open todo", () => {
    render(<TodoItem todo={openTodo} onToggle={vi.fn()} />);
    const title = screen.getByText("Buy groceries");
    expect(title.className).not.toContain("line-through");
  });

  it("calls onToggle with todo id when checkbox is clicked", async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();
    render(<TodoItem todo={openTodo} onToggle={handleToggle} />);
    await user.click(screen.getByRole("checkbox"));
    expect(handleToggle).toHaveBeenCalledWith("todo-1");
  });

  it("renders multiple tag indicators", () => {
    const tag2: Tag = {
      id: "tag-2",
      name: "Personal",
      color: "#22c55e",
      isDefault: false,
      parentId: null,
    };
    useTagStore.setState({ tags: [tag, tag2], isLoaded: true });

    const multiTagTodo: Todo = {
      ...openTodo,
      tagIds: ["tag-1", "tag-2"],
    };
    render(<TodoItem todo={multiTagTodo} onToggle={vi.fn()} />);
    expect(screen.getByTitle("Work")).toBeInTheDocument();
    expect(screen.getByTitle("Personal")).toBeInTheDocument();
  });

  it("renders edit button when onEdit is provided", () => {
    render(<TodoItem todo={openTodo} onToggle={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByLabelText("common.edit")).toBeInTheDocument();
  });

  it("does not render edit button when onEdit is not provided", () => {
    render(<TodoItem todo={openTodo} onToggle={vi.fn()} />);
    expect(screen.queryByLabelText("common.edit")).not.toBeInTheDocument();
  });

  it("calls onEdit with todo when edit is clicked", async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();
    render(<TodoItem todo={openTodo} onToggle={vi.fn()} onEdit={handleEdit} />);
    await user.click(screen.getByLabelText("common.edit"));
    expect(handleEdit).toHaveBeenCalledWith(openTodo);
  });

  it("renders delete button when onDelete is provided", () => {
    render(<TodoItem todo={openTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByLabelText("common.delete")).toBeInTheDocument();
  });

  it("calls onDelete with todo when delete is clicked", async () => {
    const user = userEvent.setup();
    const handleDelete = vi.fn();
    render(
      <TodoItem todo={openTodo} onToggle={vi.fn()} onDelete={handleDelete} />,
    );
    await user.click(screen.getByLabelText("common.delete"));
    expect(handleDelete).toHaveBeenCalledWith(openTodo);
  });

  it("does not render due date when null", () => {
    render(<TodoItem todo={openTodo} onToggle={vi.fn()} />);
    expect(screen.queryByText(/\w+ \d+/)).not.toBeInTheDocument();
  });

  it("renders formatted due date when set", () => {
    const todoWithDate: Todo = {
      ...openTodo,
      dueDate: "2026-06-15",
    };
    render(<TodoItem todo={todoWithDate} onToggle={vi.fn()} />);
    expect(screen.getByText("Jun 15")).toBeInTheDocument();
  });

  it("applies danger style when due date is past", () => {
    const todoOverdue: Todo = {
      ...openTodo,
      dueDate: "2020-01-01",
    };
    render(<TodoItem todo={todoOverdue} onToggle={vi.fn()} />);
    const dateEl = screen.getByText("Jan 1");
    expect(dateEl.className).toContain("text-[var(--color-danger)]");
  });

  it("applies muted style for completed todo due date", () => {
    const completedWithDate: Todo = {
      ...completedTodo,
      dueDate: "2020-01-01",
    };
    render(<TodoItem todo={completedWithDate} onToggle={vi.fn()} />);
    const dateEl = screen.getByText("Jan 1");
    expect(dateEl.className).toContain("opacity-60");
    expect(dateEl.className).not.toContain("text-[var(--color-danger)]");
  });

  it("renders create sibling button when onCreateSibling is provided", () => {
    render(
      <TodoItem todo={openTodo} onToggle={vi.fn()} onCreateSibling={vi.fn()} />,
    );
    expect(screen.getByLabelText("todos.newTodo")).toBeInTheDocument();
  });

  it("does not render create sibling button when not provided", () => {
    render(<TodoItem todo={openTodo} onToggle={vi.fn()} />);
    expect(screen.queryByLabelText("todos.newTodo")).not.toBeInTheDocument();
  });

  it("calls onCreateSibling with todo when clicked", async () => {
    const user = userEvent.setup();
    const handleSibling = vi.fn();
    render(
      <TodoItem
        todo={openTodo}
        onToggle={vi.fn()}
        onCreateSibling={handleSibling}
      />,
    );
    await user.click(screen.getByLabelText("todos.newTodo"));
    expect(handleSibling).toHaveBeenCalledWith(openTodo);
  });

  it("renders create sub-todo button when onCreateChild is provided", () => {
    render(
      <TodoItem todo={openTodo} onToggle={vi.fn()} onCreateChild={vi.fn()} />,
    );
    expect(screen.getByLabelText("todos.subTodos")).toBeInTheDocument();
  });

  it("calls onCreateChild with todo when clicked", async () => {
    const user = userEvent.setup();
    const handleChild = vi.fn();
    render(
      <TodoItem
        todo={openTodo}
        onToggle={vi.fn()}
        onCreateChild={handleChild}
      />,
    );
    await user.click(screen.getByLabelText("todos.subTodos"));
    expect(handleChild).toHaveBeenCalledWith(openTodo);
  });

  it("renders title as clickable button when onTitleClick is provided", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <TodoItem
        todo={openTodo}
        onToggle={vi.fn()}
        onTitleClick={handleClick}
      />,
    );
    const titleBtn = screen.getByText("Buy groceries");
    expect(titleBtn.tagName).toBe("BUTTON");
    await user.click(titleBtn);
    expect(handleClick).toHaveBeenCalledWith(openTodo);
  });

  it("renders title as span when onTitleClick is not provided", () => {
    render(<TodoItem todo={openTodo} onToggle={vi.fn()} />);
    const title = screen.getByText("Buy groceries");
    expect(title.tagName).toBe("SPAN");
  });

  it("renders dragHandleSlot when provided", () => {
    render(
      <TodoItem
        todo={openTodo}
        onToggle={vi.fn()}
        dragHandleSlot={<span data-testid="drag-handle">grip</span>}
      />,
    );
    expect(screen.getByTestId("drag-handle")).toBeInTheDocument();
  });

  it("does not render dragHandleSlot when not provided", () => {
    render(<TodoItem todo={openTodo} onToggle={vi.fn()} />);
    expect(screen.queryByTestId("drag-handle")).not.toBeInTheDocument();
  });
});
