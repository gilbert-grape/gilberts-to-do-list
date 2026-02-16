import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MainView } from "./main-view.tsx";
import { useTodoStore } from "../store.ts";
import { useTagStore } from "@/features/tags/store.ts";
import { useSettingsStore } from "@/features/settings/store.ts";
import type { Tag } from "@/features/tags/types.ts";
import type { Todo } from "../types.ts";

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => {
      const translations: Record<string, string> = {
        "common.loading": "Loading...",
        "common.cancel": "Cancel",
        "common.save": "Save",
        "common.delete": "Delete",
        "common.search": "Search...",
        "todos.newTodo": "+ New To-Do",
        "todos.completed": "Completed",
        "todos.titlePlaceholder": "What needs to be done?",
        "todos.descriptionPlaceholder": "Add notes...",
        "todos.noResults": "No results found.",
        "todos.deleteTitle": "Delete Todo",
        "todos.deleteMessage": "Are you sure?",
        "todos.deleteWithChildrenTitle": "Delete with children",
        "todos.deleteWithChildrenMessage": "Has sub-todos.",
        "todos.deleteAll": "Delete all",
        "todos.keepChildren": "Keep children",
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
        "todos.statusOpen": "Open",
        "todos.statusCompleted": "Status Completed",
        "todos.subTodos": "Sub-Todos",
        "todos.recurrenceCustomInterval": "Every X days",
        "todos.allTab": "All",
        "todos.dragHandle": "Drag to reorder",
        "placeholder.main": "Your to-dos will appear here.",
        "common.back": "Back",
        "common.edit": "Edit",
        "views.flatList": "Flat List",
        "views.tagTabs": "Tag Tabs",
        "views.grouped": "Grouped",
        "views.mindmap": "Mindmap",
        "views.hardcore": "Hardcore",
        "settings.showCompleted": `Show Completed (${options?.count ?? ""})`,
        "settings.hideCompleted": `Hide Completed (${options?.count ?? ""})`,
      };
      return translations[key] ?? key;
    },
  }),
}));

vi.mock("@/services/storage/indexeddb/db.ts", () => ({
  db: {},
}));

vi.mock("./mindmap/mindmap-view.tsx", () => ({
  MindmapView: ({ todos }: { todos: unknown[] }) => (
    <div data-testid="mindmap-view">Mindmap ({todos.length} todos)</div>
  ),
}));

vi.mock("./hardcore/hardcore-view.tsx", () => ({
  HardcoreView: () => <div data-testid="hardcore-view">Hardcore View</div>,
}));

vi.mock("@/services/storage/indexeddb/indexeddb-adapter.ts", () => ({
  IndexedDBAdapter: vi.fn(),
}));

vi.mock("@/features/tags/store.ts", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/tags/store.ts")
  >("@/features/tags/store.ts");
  return {
    ...actual,
    setStorageAdapter: vi.fn(),
  };
});

vi.mock("../store.ts", async () => {
  const actual =
    await vi.importActual<typeof import("../store.ts")>("../store.ts");
  return {
    ...actual,
    setTodoStorageAdapter: vi.fn(),
  };
});

const defaultTag: Tag = {
  id: "tag-1",
  name: "General",
  color: "#ef4444",
  isDefault: true,
};

const openTodo: Todo = {
  id: "todo-1",
  title: "Buy milk",
  description: "From the store",
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

const openTodo2: Todo = {
  id: "todo-3",
  title: "Clean house",
  description: null,
  tagIds: ["tag-1"],
  parentId: null,
  status: "open",
  dueDate: null,
  recurrence: null,
  recurrenceInterval: null,
  createdAt: "2026-02-10T14:00:00.000Z",
  completedAt: null,
  sortOrder: 2,
};

const completedTodo: Todo = {
  id: "todo-2",
  title: "Walk the dog",
  description: null,
  tagIds: ["tag-1"],
  parentId: null,
  status: "completed",
  dueDate: null,
  recurrence: null,
  recurrenceInterval: null,
  createdAt: "2026-02-10T11:00:00.000Z",
  completedAt: "2026-02-10T12:30:00.000Z",
  sortOrder: 1,
};

function setupStores(options?: {
  todos?: Todo[];
  tagsLoaded?: boolean;
  todosLoaded?: boolean;
}) {
  const { todos = [], tagsLoaded = true, todosLoaded = true } = options ?? {};

  useTagStore.setState({
    tags: [defaultTag],
    isLoaded: tagsLoaded,
    loadTags: vi.fn().mockResolvedValue(undefined),
  } as never);

  useTodoStore.setState({
    todos,
    isLoaded: todosLoaded,
    loadTodos: vi.fn().mockResolvedValue(undefined),
    toggleStatus: vi.fn().mockResolvedValue(undefined),
    createTodo: vi.fn().mockResolvedValue(undefined),
    updateTodo: vi.fn().mockResolvedValue(undefined),
    deleteTodo: vi.fn().mockResolvedValue(undefined),
    deleteTodoWithChildren: vi.fn().mockResolvedValue(undefined),
    getChildren: vi.fn().mockReturnValue([]),
    reorderTodos: vi.fn().mockResolvedValue(undefined),
  } as never);
}

describe("MainView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useSettingsStore.setState({ completedDisplayMode: "bottom" });
  });

  it("shows loading state initially", () => {
    setupStores({ tagsLoaded: false, todosLoaded: false });
    render(<MainView />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows new todo button when loaded", () => {
    setupStores();
    render(<MainView />);
    expect(screen.getByText("+ New To-Do")).toBeInTheDocument();
  });

  it("shows empty state message when no todos", () => {
    setupStores();
    render(<MainView />);
    expect(
      screen.getByText("Your to-dos will appear here."),
    ).toBeInTheDocument();
  });

  it("renders open todos", () => {
    setupStores({ todos: [openTodo] });
    render(<MainView />);
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
  });

  it("renders completed section with count", () => {
    setupStores({ todos: [completedTodo] });
    render(<MainView />);
    expect(screen.getByText("Completed (1)")).toBeInTheDocument();
    expect(screen.getByText("Walk the dog")).toBeInTheDocument();
  });

  it("toggles create form on button click", async () => {
    const user = userEvent.setup();
    setupStores();
    render(<MainView />);

    await user.click(screen.getByText("+ New To-Do"));
    expect(
      screen.getByPlaceholderText("What needs to be done?"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Cancel")).toHaveLength(2);
  });

  it("separates open and completed todos", () => {
    setupStores({ todos: [openTodo, completedTodo] });
    render(<MainView />);
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByText("Walk the dog")).toBeInTheDocument();
    expect(screen.getByText("Completed (1)")).toBeInTheDocument();
  });

  describe("search", () => {
    it("renders search bar", () => {
      setupStores();
      render(<MainView />);
      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });

    it("filters todos by title", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo, openTodo2] });
      render(<MainView />);

      await user.type(screen.getByPlaceholderText("Search..."), "milk");
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
      expect(screen.queryByText("Clean house")).not.toBeInTheDocument();
    });

    it("filters todos by description", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo, openTodo2] });
      render(<MainView />);

      await user.type(screen.getByPlaceholderText("Search..."), "store");
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
      expect(screen.queryByText("Clean house")).not.toBeInTheDocument();
    });

    it("shows no results message when search has no matches", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MainView />);

      await user.type(screen.getByPlaceholderText("Search..."), "xyz");
      expect(screen.getByText("No results found.")).toBeInTheDocument();
    });

    it("restores todos when search is cleared", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo, openTodo2] });
      render(<MainView />);

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "milk");
      expect(screen.queryByText("Clean house")).not.toBeInTheDocument();

      await user.clear(searchInput);
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
      expect(screen.getByText("Clean house")).toBeInTheDocument();
    });
  });

  describe("view toggle", () => {
    it("renders view toggle bar", () => {
      setupStores();
      render(<MainView />);
      expect(screen.getByTitle("Flat List")).toBeInTheDocument();
    });

    it("renders TagTabsView when Tag Tabs is selected", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MainView />);

      await user.click(screen.getByTitle("Tag Tabs"));
      // TagTabsView renders an "All" tab
      expect(screen.getByText("All")).toBeInTheDocument();
      // Todo is still visible
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
    });

    it("renders GroupedView when Grouped is selected", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MainView />);

      await user.click(screen.getByTitle("Grouped"));
      // GroupedView renders tag name as group header
      expect(screen.getByText("General")).toBeInTheDocument();
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
    });

    it("returns to flat list when Flat List is clicked after switching", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo, completedTodo] });
      render(<MainView />);

      await user.click(screen.getByTitle("Tag Tabs"));
      await user.click(screen.getByTitle("Flat List"));
      // Flat list shows the completed section header
      expect(screen.getByText("Completed (1)")).toBeInTheDocument();
    });

    it("persists selected view to localStorage", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MainView />);

      await user.click(screen.getByTitle("Tag Tabs"));
      expect(localStorage.getItem("gilberts-todo-active-view")).toBe("tagTabs");
    });

    it("restores view from localStorage on mount", () => {
      localStorage.setItem("gilberts-todo-active-view", "grouped");
      setupStores({ todos: [openTodo] });
      render(<MainView />);

      // GroupedView renders the tag name as group header
      expect(screen.getByText("General")).toBeInTheDocument();
    });

    it("renders MindmapView when Mindmap is selected", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MainView />);

      await user.click(screen.getByTitle("Mindmap"));
      expect(
        await screen.findByTestId("mindmap-view"),
      ).toBeInTheDocument();
      expect(screen.getByText("Mindmap (1 todos)")).toBeInTheDocument();
    });

    it("renders HardcoreView when Hardcore is selected", async () => {
      const user = userEvent.setup();
      setupStores();
      render(<MainView />);

      await user.click(screen.getByTitle("Hardcore"));
      expect(
        await screen.findByTestId("hardcore-view"),
      ).toBeInTheDocument();
      expect(screen.getByText("Hardcore View")).toBeInTheDocument();
    });

    it("does not show empty state for hardcore view", async () => {
      const user = userEvent.setup();
      setupStores();
      render(<MainView />);

      await user.click(screen.getByTitle("Hardcore"));
      await screen.findByTestId("hardcore-view");
      expect(
        screen.queryByText("Your to-dos will appear here."),
      ).not.toBeInTheDocument();
    });

    it("falls back to flatList for invalid localStorage value", () => {
      localStorage.setItem("gilberts-todo-active-view", "invalid");
      setupStores({ todos: [openTodo] });
      render(<MainView />);

      // Should render flat list (no "All" tab, no group header)
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
      expect(screen.queryByText("All")).not.toBeInTheDocument();
    });
  });

  describe("delete", () => {
    it("shows confirm dialog when delete is clicked", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MainView />);

      await user.click(screen.getByLabelText("Delete"));
      expect(screen.getByText("Delete Todo")).toBeInTheDocument();
      expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    });

    it("deletes todo on confirm", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MainView />);

      await user.click(screen.getByLabelText("Delete"));
      await user.click(
        screen.getByRole("dialog").querySelector("button:last-of-type")!,
      );

      expect(useTodoStore.getState().deleteTodo).toHaveBeenCalledWith("todo-1");
    });

    it("cancels delete on cancel", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MainView />);

      await user.click(screen.getByLabelText("Delete"));
      // Click Cancel in dialog
      const dialog = screen.getByRole("dialog");
      const cancelBtn = dialog.querySelector("button:first-of-type")!;
      await user.click(cancelBtn);

      expect(useTodoStore.getState().deleteTodo).not.toHaveBeenCalled();
    });
  });

  describe("edit", () => {
    it("shows edit form when edit is clicked", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MainView />);

      await user.click(screen.getByLabelText("Edit"));
      expect(screen.getByDisplayValue("Buy milk")).toBeInTheDocument();
    });
  });

  describe("inline create", () => {
    it("renders create sibling button on todo items", () => {
      setupStores({ todos: [openTodo] });
      render(<MainView />);
      expect(screen.getByLabelText("Create sibling")).toBeInTheDocument();
    });

    it("renders create sub-todo button on todo items", () => {
      setupStores({ todos: [openTodo] });
      render(<MainView />);
      expect(screen.getByLabelText("Create sub-todo")).toBeInTheDocument();
    });

    it("opens create form with parent when create child is clicked", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MainView />);

      await user.click(screen.getByLabelText("Create sub-todo"));
      // Create form should appear
      expect(
        screen.getByPlaceholderText("What needs to be done?"),
      ).toBeInTheDocument();
    });

    it("opens create form when create sibling is clicked", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MainView />);

      await user.click(screen.getByLabelText("Create sibling"));
      expect(
        screen.getByPlaceholderText("What needs to be done?"),
      ).toBeInTheDocument();
    });
  });

  describe("detail view", () => {
    it("opens detail view when todo title is clicked", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MainView />);

      await user.click(screen.getByText("Buy milk"));
      // Detail view should show the todo title as heading
      expect(screen.getByText("Open")).toBeInTheDocument();
      expect(screen.getByText("From the store")).toBeInTheDocument();
    });

    it("returns to list view on back click", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MainView />);

      await user.click(screen.getByText("Buy milk"));
      await user.click(screen.getByLabelText("Back"));
      // Should be back in list view
      expect(screen.getByText("+ New To-Do")).toBeInTheDocument();
    });

    it("opens edit form from detail view", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MainView />);

      await user.click(screen.getByText("Buy milk"));
      await user.click(screen.getByText("Edit"));
      // Should show edit form with pre-filled title
      expect(screen.getByDisplayValue("Buy milk")).toBeInTheDocument();
    });

    it("opens delete dialog from detail view", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MainView />);

      await user.click(screen.getByText("Buy milk"));
      await user.click(screen.getByText("Delete"));
      expect(screen.getByText("Delete Todo")).toBeInTheDocument();
    });
  });

  describe("drag and drop", () => {
    it("renders drag handles on open todos in flat list", () => {
      setupStores({ todos: [openTodo] });
      render(<MainView />);
      expect(screen.getByLabelText("Drag to reorder")).toBeInTheDocument();
    });

    it("does not render drag handles on completed todos", () => {
      setupStores({ todos: [completedTodo] });
      render(<MainView />);
      expect(
        screen.queryByLabelText("Drag to reorder"),
      ).not.toBeInTheDocument();
    });
  });

  describe("flat list hierarchy", () => {
    it("shows parent and child todos flat without indentation", () => {
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
      setupStores({ todos: [openTodo, childTodo] });
      render(<MainView />);

      // Both parent and child appear as flat items
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
      expect(screen.getByText("Get oat milk")).toBeInTheDocument();

      // Both are rendered as <li> elements at the same level
      const items = screen.getAllByRole("checkbox");
      expect(items).toHaveLength(2);
    });
  });

  describe("completedDisplayMode", () => {
    it("hides completed section when mode is hidden", () => {
      useSettingsStore.setState({ completedDisplayMode: "hidden" });
      setupStores({ todos: [openTodo, completedTodo] });
      render(<MainView />);
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
      expect(screen.queryByText("Walk the dog")).not.toBeInTheDocument();
      expect(screen.queryByText(/Completed/)).not.toBeInTheDocument();
    });

    it("shows completed section at bottom when mode is bottom", () => {
      useSettingsStore.setState({ completedDisplayMode: "bottom" });
      setupStores({ todos: [openTodo, completedTodo] });
      render(<MainView />);
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
      expect(screen.getByText("Walk the dog")).toBeInTheDocument();
      expect(screen.getByText("Completed (1)")).toBeInTheDocument();
    });

    it("shows toggle button when mode is toggleable", () => {
      useSettingsStore.setState({ completedDisplayMode: "toggleable" });
      setupStores({ todos: [openTodo, completedTodo] });
      render(<MainView />);
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
      expect(screen.getByText("Show Completed (1)")).toBeInTheDocument();
      expect(screen.queryByText("Walk the dog")).not.toBeInTheDocument();
    });

    it("expands completed todos when toggle is clicked", async () => {
      const user = userEvent.setup();
      useSettingsStore.setState({ completedDisplayMode: "toggleable" });
      setupStores({ todos: [openTodo, completedTodo] });
      render(<MainView />);

      await user.click(screen.getByText("Show Completed (1)"));
      expect(screen.getByText("Walk the dog")).toBeInTheDocument();
      expect(screen.getByText("Hide Completed (1)")).toBeInTheDocument();
    });
  });
});
