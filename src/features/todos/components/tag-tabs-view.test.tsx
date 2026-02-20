import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TagTabsView } from "./tag-tabs-view.tsx";
import { useTagStore } from "@/features/tags/store.ts";
import { useSettingsStore } from "@/features/settings/store.ts";
import type { Todo } from "../types.ts";
import type { Tag } from "@/features/tags/types.ts";

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => {
      const translations: Record<string, string> = {
        "todos.allTab": "All",
        "todos.completed": "Completed",
        "todos.dragHandle": "Drag to reorder",
        "settings.showCompleted": `Show Completed (${options?.count ?? ""})`,
        "settings.hideCompleted": `Hide Completed (${options?.count ?? ""})`,
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
  parentId: null,
};

const personalTag: Tag = {
  id: "tag-personal",
  name: "Personal",
  color: "#22c55e",
  isDefault: true,
  parentId: null,
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

describe("TagTabsView", () => {
  beforeEach(() => {
    useTagStore.setState({
      tags: [workTag, personalTag],
      isLoaded: true,
    });
    useSettingsStore.setState({ completedDisplayMode: "bottom" });
  });

  it("renders All tab", () => {
    render(
      <TagTabsView todos={[workTodo, personalTodo]} onToggle={vi.fn()} />,
    );
    expect(screen.getByText("All")).toBeInTheDocument();
  });

  it("renders tag tabs", () => {
    render(
      <TagTabsView todos={[workTodo, personalTodo]} onToggle={vi.fn()} />,
    );
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
  });

  it("shows all todos by default (All tab active)", () => {
    render(
      <TagTabsView todos={[workTodo, personalTodo]} onToggle={vi.fn()} />,
    );
    expect(screen.getByText("Finish report")).toBeInTheDocument();
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  it("filters by tag when tag tab is clicked", async () => {
    const user = userEvent.setup();
    render(
      <TagTabsView todos={[workTodo, personalTodo]} onToggle={vi.fn()} />,
    );

    await user.click(screen.getByText("Work"));
    expect(screen.getByText("Finish report")).toBeInTheDocument();
    expect(screen.queryByText("Buy groceries")).not.toBeInTheDocument();
  });

  it("shows all todos when All tab is clicked after filtering", async () => {
    const user = userEvent.setup();
    render(
      <TagTabsView todos={[workTodo, personalTodo]} onToggle={vi.fn()} />,
    );

    await user.click(screen.getByText("Work"));
    await user.click(screen.getByText("All"));
    expect(screen.getByText("Finish report")).toBeInTheDocument();
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  it("indents child todos", () => {
    render(
      <TagTabsView
        todos={[personalTodo, childTodo]}
        onToggle={vi.fn()}
      />,
    );
    const childContainer = screen.getByText("Buy milk").closest("div[style]");
    expect(childContainer?.style.marginLeft).toBe("24px");
  });

  it("does not indent root todos", () => {
    render(
      <TagTabsView
        todos={[personalTodo, childTodo]}
        onToggle={vi.fn()}
      />,
    );
    const parentContainer = screen
      .getByText("Buy groceries")
      .closest("div[style]");
    expect(parentContainer?.style.marginLeft).toBe("0px");
  });

  it("passes onToggle to TodoItem", async () => {
    const handleToggle = vi.fn();
    render(
      <TagTabsView todos={[workTodo]} onToggle={handleToggle} />,
    );
    const checkbox = screen.getByRole("checkbox");
    await userEvent.click(checkbox);
    expect(handleToggle).toHaveBeenCalledWith("todo-1");
  });

  describe("completedDisplayMode", () => {
    it("hides completed todos when mode is hidden", () => {
      useSettingsStore.setState({ completedDisplayMode: "hidden" });
      render(
        <TagTabsView
          todos={[workTodo, completedWorkTodo]}
          onToggle={vi.fn()}
        />,
      );
      expect(screen.getByText("Finish report")).toBeInTheDocument();
      expect(screen.queryByText("Old report")).not.toBeInTheDocument();
    });

    it("shows completed section at bottom when mode is bottom", () => {
      useSettingsStore.setState({ completedDisplayMode: "bottom" });
      render(
        <TagTabsView
          todos={[workTodo, completedWorkTodo]}
          onToggle={vi.fn()}
        />,
      );
      expect(screen.getByText("Finish report")).toBeInTheDocument();
      expect(screen.getByText("Old report")).toBeInTheDocument();
      expect(screen.getByText("Completed (1)")).toBeInTheDocument();
    });

    it("shows toggle button when mode is toggleable", () => {
      useSettingsStore.setState({ completedDisplayMode: "toggleable" });
      render(
        <TagTabsView
          todos={[workTodo, completedWorkTodo]}
          onToggle={vi.fn()}
        />,
      );
      expect(screen.getByText("Finish report")).toBeInTheDocument();
      expect(screen.getByText("Show Completed (1)")).toBeInTheDocument();
      expect(screen.queryByText("Old report")).not.toBeInTheDocument();
    });

    it("expands completed todos when toggle is clicked", async () => {
      const user = userEvent.setup();
      useSettingsStore.setState({ completedDisplayMode: "toggleable" });
      render(
        <TagTabsView
          todos={[workTodo, completedWorkTodo]}
          onToggle={vi.fn()}
        />,
      );
      await user.click(screen.getByText("Show Completed (1)"));
      expect(screen.getByText("Old report")).toBeInTheDocument();
    });
  });
});
