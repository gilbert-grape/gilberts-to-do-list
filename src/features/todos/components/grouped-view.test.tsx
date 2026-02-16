import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GroupedView } from "./grouped-view.tsx";
import { useTagStore } from "@/features/tags/store.ts";
import { useSettingsStore } from "@/features/settings/store.ts";
import type { Todo } from "../types.ts";
import type { Tag } from "@/features/tags/types.ts";

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "todos.completed": "Completed",
        "todos.dragHandle": "Drag to reorder",
      };
      return translations[key] ?? key;
    },
  }),
}));

const workTag: Tag = {
  id: "tag-work",
  name: "Work",
  color: "#3b82f6",
  isDefault: false,
};

const personalTag: Tag = {
  id: "tag-personal",
  name: "Personal",
  color: "#22c55e",
  isDefault: true,
};

const workTodo: Todo = {
  id: "todo-1",
  title: "Finish report",
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

const personalTodo: Todo = {
  id: "todo-2",
  title: "Buy groceries",
  description: null,
  tagIds: ["tag-personal"],
  parentId: null,
  status: "open",
  dueDate: null,
  recurrence: null,
  recurrenceInterval: null,
  createdAt: "2026-02-10T13:00:00.000Z",
  completedAt: null,
  sortOrder: 1,
};

const childTodo: Todo = {
  id: "todo-child",
  title: "Buy milk",
  description: null,
  tagIds: ["tag-personal"],
  parentId: "todo-2",
  status: "open",
  dueDate: null,
  recurrence: null,
  recurrenceInterval: null,
  createdAt: "2026-02-10T14:00:00.000Z",
  completedAt: null,
  sortOrder: 2,
};

const completedWorkTodo: Todo = {
  id: "todo-done",
  title: "Old report",
  description: null,
  tagIds: ["tag-work"],
  parentId: null,
  status: "completed",
  dueDate: null,
  recurrence: null,
  recurrenceInterval: null,
  createdAt: "2026-02-10T10:00:00.000Z",
  completedAt: "2026-02-10T11:00:00.000Z",
  sortOrder: 3,
};

describe("GroupedView", () => {
  beforeEach(() => {
    useTagStore.setState({
      tags: [workTag, personalTag],
      isLoaded: true,
    });
    useSettingsStore.setState({ completedDisplayMode: "bottom" });
  });

  it("renders group headers with tag names", () => {
    render(
      <GroupedView
        todos={[workTodo, personalTodo]}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
  });

  it("shows count per group", () => {
    render(
      <GroupedView
        todos={[workTodo, personalTodo]}
        onToggle={vi.fn()}
      />,
    );
    // Work group has 1 todo, Personal has 1 — both show "1"
    const counts = screen.getAllByText("1");
    expect(counts).toHaveLength(2);
  });

  it("renders todos under their tag groups", () => {
    render(
      <GroupedView
        todos={[workTodo, personalTodo]}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("Finish report")).toBeInTheDocument();
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  it("collapses group on header click", async () => {
    const user = userEvent.setup();
    render(
      <GroupedView
        todos={[workTodo, personalTodo]}
        onToggle={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Work"));
    expect(screen.queryByText("Finish report")).not.toBeInTheDocument();
    // Personal group should still be visible
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  it("expands collapsed group on header click", async () => {
    const user = userEvent.setup();
    render(
      <GroupedView
        todos={[workTodo, personalTodo]}
        onToggle={vi.fn()}
      />,
    );

    // Collapse then expand
    await user.click(screen.getByText("Work"));
    expect(screen.queryByText("Finish report")).not.toBeInTheDocument();
    await user.click(screen.getByText("Work"));
    expect(screen.getByText("Finish report")).toBeInTheDocument();
  });

  it("does not render empty tag groups", () => {
    render(
      <GroupedView todos={[workTodo]} onToggle={vi.fn()} />,
    );
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.queryByText("Personal")).not.toBeInTheDocument();
  });

  it("indents child todos within groups", () => {
    render(
      <GroupedView
        todos={[personalTodo, childTodo]}
        onToggle={vi.fn()}
      />,
    );
    const childContainer = screen.getByText("Buy milk").closest("div[style]");
    expect(childContainer?.style.marginLeft).toBe("24px");
  });

  it("passes onToggle to TodoItem", async () => {
    const handleToggle = vi.fn();
    render(
      <GroupedView todos={[workTodo]} onToggle={handleToggle} />,
    );
    const checkbox = screen.getByRole("checkbox");
    await userEvent.click(checkbox);
    expect(handleToggle).toHaveBeenCalledWith("todo-1");
  });

  describe("completedDisplayMode", () => {
    it("hides completed todos when mode is hidden", () => {
      useSettingsStore.setState({ completedDisplayMode: "hidden" });
      render(
        <GroupedView
          todos={[workTodo, completedWorkTodo]}
          onToggle={vi.fn()}
        />,
      );
      expect(screen.getByText("Finish report")).toBeInTheDocument();
      expect(screen.queryByText("Old report")).not.toBeInTheDocument();
    });

    it("shows completed todos when mode is bottom", () => {
      useSettingsStore.setState({ completedDisplayMode: "bottom" });
      render(
        <GroupedView
          todos={[workTodo, completedWorkTodo]}
          onToggle={vi.fn()}
        />,
      );
      expect(screen.getByText("Finish report")).toBeInTheDocument();
      expect(screen.getByText("Old report")).toBeInTheDocument();
    });
  });
});
