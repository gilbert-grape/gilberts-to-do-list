import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
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
        "todos.newTodo": "New To-Do",
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
        "tags.newTag": "New Tag",
        "tags.newTagCompact": "New Tag",
        "tags.namePlaceholder": "Tag name...",
        "tags.create": "Create Tag",
        "errors.deleteFailed": "Delete failed",
        "todos.newTodoCompact": "New To-Do",
        "settings.mindmapFilterAll": "All statuses",
        "settings.mindmapFilterOpen": "Open",
        "settings.mindmapFilterCompleted": "Completed",
        "settings.mindmapFilterDueAll": "All dates",
        "settings.mindmapFilterDueOverdue": "Overdue",
        "settings.mindmapFilterDueToday": "Today",
        "settings.mindmapFilterDueThisWeek": "This week",
        "settings.mindmapFilterDueThisMonth": "This month",
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
  parentId: null,
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
    useSettingsStore.setState({ completedDisplayMode: "bottom", activeView: "flatList" });
  });

  it("shows loading state initially", () => {
    setupStores({ tagsLoaded: false, todosLoaded: false });
    render(<MemoryRouter><MainView /></MemoryRouter>);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows new todo button when loaded", () => {
    setupStores();
    render(<MemoryRouter><MainView /></MemoryRouter>);
    expect(screen.getByText("New To-Do")).toBeInTheDocument();
  });

  it("shows empty state message when no todos", () => {
    setupStores();
    render(<MemoryRouter><MainView /></MemoryRouter>);
    expect(
      screen.getByText("Your to-dos will appear here."),
    ).toBeInTheDocument();
  });

  it("renders open todos", () => {
    setupStores({ todos: [openTodo] });
    render(<MemoryRouter><MainView /></MemoryRouter>);
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
  });

  it("renders completed section with count", () => {
    setupStores({ todos: [completedTodo] });
    render(<MemoryRouter><MainView /></MemoryRouter>);
    expect(screen.getByText("Completed (1)")).toBeInTheDocument();
    expect(screen.getByText("Walk the dog")).toBeInTheDocument();
  });

  it("toggles create form on button click", async () => {
    const user = userEvent.setup();
    setupStores();
    render(<MemoryRouter><MainView /></MemoryRouter>);

    await user.click(screen.getByText("New To-Do"));
    expect(
      screen.getByPlaceholderText("What needs to be done?"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Cancel")).toHaveLength(2);
  });

  it("separates open and completed todos", () => {
    setupStores({ todos: [openTodo, completedTodo] });
    render(<MemoryRouter><MainView /></MemoryRouter>);
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByText("Walk the dog")).toBeInTheDocument();
    expect(screen.getByText("Completed (1)")).toBeInTheDocument();
  });

  describe("search", () => {
    it("renders search bar", () => {
      setupStores();
      render(<MemoryRouter><MainView /></MemoryRouter>);
      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });

    it("filters todos by title", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo, openTodo2] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.type(screen.getByPlaceholderText("Search..."), "milk");
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
      expect(screen.queryByText("Clean house")).not.toBeInTheDocument();
    });

    it("filters todos by description", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo, openTodo2] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.type(screen.getByPlaceholderText("Search..."), "store");
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
      expect(screen.queryByText("Clean house")).not.toBeInTheDocument();
    });

    it("shows no results message when search has no matches", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.type(screen.getByPlaceholderText("Search..."), "xyz");
      expect(screen.getByText("No results found.")).toBeInTheDocument();
    });

    it("restores todos when search is cleared", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo, openTodo2] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "milk");
      expect(screen.queryByText("Clean house")).not.toBeInTheDocument();

      await user.clear(searchInput);
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
      expect(screen.getByText("Clean house")).toBeInTheDocument();
    });
  });

  describe("view toggle", () => {
    it("renders flat list by default", () => {
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
    });

    it("renders TagTabsView when activeView is tagTabs", () => {
      useSettingsStore.setState({ activeView: "tagTabs" });
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      // TagTabsView renders an "All" tab
      expect(screen.getByText("All")).toBeInTheDocument();
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
    });

    it("renders GroupedView when activeView is grouped", () => {
      useSettingsStore.setState({ activeView: "grouped" });
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      // GroupedView renders tag name as group header
      expect(screen.getByText("General")).toBeInTheDocument();
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
    });

    it("renders flat list when activeView is flatList", () => {
      useSettingsStore.setState({ activeView: "flatList" });
      setupStores({ todos: [openTodo, completedTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      // Flat list shows the completed section header
      expect(screen.getByText("Completed (1)")).toBeInTheDocument();
    });

    it("restores view from store on mount", () => {
      useSettingsStore.setState({ activeView: "grouped" });
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      // GroupedView renders the tag name as group header
      expect(screen.getByText("General")).toBeInTheDocument();
    });

    it("renders MindmapView when activeView is mindmap", async () => {
      useSettingsStore.setState({ activeView: "mindmap" });
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      expect(
        await screen.findByTestId("mindmap-view"),
      ).toBeInTheDocument();
      expect(screen.getByText("Mindmap (1 todos)")).toBeInTheDocument();
    });

    it("renders HardcoreView when activeView is hardcore", async () => {
      useSettingsStore.setState({ activeView: "hardcore" });
      setupStores();
      render(<MemoryRouter><MainView /></MemoryRouter>);

      expect(
        await screen.findByTestId("hardcore-view"),
      ).toBeInTheDocument();
      expect(screen.getByText("Hardcore View")).toBeInTheDocument();
    });

    it("does not show empty state for hardcore view", async () => {
      useSettingsStore.setState({ activeView: "hardcore" });
      setupStores();
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await screen.findByTestId("hardcore-view");
      expect(
        screen.queryByText("Your to-dos will appear here."),
      ).not.toBeInTheDocument();
    });
  });

  describe("delete", () => {
    it("shows confirm dialog when delete is clicked", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByLabelText("Delete"));
      expect(screen.getByText("Delete Todo")).toBeInTheDocument();
      expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    });

    it("deletes todo on confirm", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByLabelText("Delete"));
      await user.click(
        screen.getByRole("dialog").querySelector("button:last-of-type")!,
      );

      expect(useTodoStore.getState().deleteTodo).toHaveBeenCalledWith("todo-1");
    });

    it("cancels delete on cancel", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

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
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByLabelText("Edit"));
      expect(screen.getByDisplayValue("Buy milk")).toBeInTheDocument();
    });
  });

  describe("inline create", () => {
    it("renders create sibling button on todo items", () => {
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);
      expect(screen.getByLabelText("New To-Do")).toBeInTheDocument();
    });

    it("renders create sub-todo button on todo items", () => {
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);
      expect(screen.getByLabelText("Sub-Todos")).toBeInTheDocument();
    });

    it("opens create form with parent when create child is clicked", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByLabelText("Sub-Todos"));
      // Create form should appear
      expect(
        screen.getByPlaceholderText("What needs to be done?"),
      ).toBeInTheDocument();
    });

    it("opens create form when create sibling is clicked", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByLabelText("New To-Do"));
      expect(
        screen.getByPlaceholderText("What needs to be done?"),
      ).toBeInTheDocument();
    });
  });

  describe("detail view", () => {
    it("opens detail view when todo title is clicked", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByText("Buy milk"));
      // Detail view should show the todo title as heading
      expect(screen.getByText("Open")).toBeInTheDocument();
      expect(screen.getByText("From the store")).toBeInTheDocument();
    });

    it("returns to list view on back click", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByText("Buy milk"));
      await user.click(screen.getByLabelText("Back"));
      // Should be back in list view
      expect(screen.getByText("New To-Do")).toBeInTheDocument();
    });

    it("opens edit form from detail view", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByText("Buy milk"));
      await user.click(screen.getByText("Edit"));
      // Should show edit form with pre-filled title
      expect(screen.getByDisplayValue("Buy milk")).toBeInTheDocument();
    });

    it("opens delete dialog from detail view", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByText("Buy milk"));
      await user.click(screen.getByText("Delete"));
      expect(screen.getByText("Delete Todo")).toBeInTheDocument();
    });
  });

  describe("drag and drop", () => {
    it("renders drag handles on open todos in flat list", () => {
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);
      expect(screen.getByLabelText("Drag to reorder")).toBeInTheDocument();
    });

    it("does not render drag handles on completed todos", () => {
      setupStores({ todos: [completedTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);
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
      render(<MemoryRouter><MainView /></MemoryRouter>);

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
      render(<MemoryRouter><MainView /></MemoryRouter>);
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
      expect(screen.queryByText("Walk the dog")).not.toBeInTheDocument();
      expect(screen.queryByText(/Completed \(\d+\)/)).not.toBeInTheDocument();
    });

    it("shows completed section at bottom when mode is bottom", () => {
      useSettingsStore.setState({ completedDisplayMode: "bottom", activeView: "flatList" });
      setupStores({ todos: [openTodo, completedTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
      expect(screen.getByText("Walk the dog")).toBeInTheDocument();
      expect(screen.getByText("Completed (1)")).toBeInTheDocument();
    });

    it("shows toggle button when mode is toggleable", () => {
      useSettingsStore.setState({ completedDisplayMode: "toggleable" });
      setupStores({ todos: [openTodo, completedTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
      expect(screen.getByText("Show Completed (1)")).toBeInTheDocument();
      expect(screen.queryByText("Walk the dog")).not.toBeInTheDocument();
    });

    it("expands completed todos when toggle is clicked", async () => {
      const user = userEvent.setup();
      useSettingsStore.setState({ completedDisplayMode: "toggleable" });
      setupStores({ todos: [openTodo, completedTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByText("Show Completed (1)"));
      expect(screen.getByText("Walk the dog")).toBeInTheDocument();
      expect(screen.getByText("Hide Completed (1)")).toBeInTheDocument();
    });
  });

  // --- NEW TESTS START ---
  describe("tag create form", () => {
    it("shows '+ Tag' button in normal layout", () => {
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);
      expect(screen.getByText("New Tag")).toBeInTheDocument();
    });

    it("toggles tag create form when '+ Tag' is clicked", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByText("New Tag"));
      expect(screen.getByPlaceholderText("Tag name...")).toBeInTheDocument();
      expect(screen.getByText("Create Tag")).toBeInTheDocument();
    });

    it("closes tag create form when '+ Tag' is clicked again (shows Cancel)", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByText("New Tag"));
      // Button should now say "Cancel"
      const cancelButtons = screen.getAllByText("Cancel");
      expect(cancelButtons.length).toBeGreaterThanOrEqual(1);
    });

    it("disables submit button when tag name is empty", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByText("New Tag"));
      const submitBtn = screen.getByText("Create Tag");
      expect(submitBtn).toBeDisabled();
    });

    it("calls createTag with correct arguments on form submit", async () => {
      const user = userEvent.setup();
      const createTag = vi.fn().mockResolvedValue({
        id: "tag-2",
        name: "Work",
        color: "#f43f5e",
        isDefault: false,
        parentId: null,
      });
      useTagStore.setState({
        tags: [defaultTag],
        isLoaded: true,
        loadTags: vi.fn().mockResolvedValue(undefined),
        createTag,
      } as never);
      useTodoStore.setState({
        todos: [openTodo],
        isLoaded: true,
        loadTodos: vi.fn().mockResolvedValue(undefined),
        toggleStatus: vi.fn().mockResolvedValue(undefined),
        createTodo: vi.fn().mockResolvedValue(undefined),
        updateTodo: vi.fn().mockResolvedValue(undefined),
        deleteTodo: vi.fn().mockResolvedValue(undefined),
        deleteTodoWithChildren: vi.fn().mockResolvedValue(undefined),
        getChildren: vi.fn().mockReturnValue([]),
        reorderTodos: vi.fn().mockResolvedValue(undefined),
      } as never);
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByText("New Tag"));
      await user.type(screen.getByPlaceholderText("Tag name..."), "Work");
      expect(screen.getByText("Create Tag")).not.toBeDisabled();
      await user.click(screen.getByText("Create Tag"));

      expect(createTag).toHaveBeenCalledWith({
        name: "Work",
        color: expect.any(String),
        isDefault: false,
        parentId: null,
      });
    });

    it("does not call createTag when name is only whitespace", async () => {
      const user = userEvent.setup();
      const createTag = vi.fn().mockResolvedValue(undefined);
      useTagStore.setState({
        tags: [defaultTag],
        isLoaded: true,
        loadTags: vi.fn().mockResolvedValue(undefined),
        createTag,
      } as never);
      useTodoStore.setState({
        todos: [openTodo],
        isLoaded: true,
        loadTodos: vi.fn().mockResolvedValue(undefined),
        toggleStatus: vi.fn().mockResolvedValue(undefined),
        createTodo: vi.fn().mockResolvedValue(undefined),
        updateTodo: vi.fn().mockResolvedValue(undefined),
        deleteTodo: vi.fn().mockResolvedValue(undefined),
        deleteTodoWithChildren: vi.fn().mockResolvedValue(undefined),
        getChildren: vi.fn().mockReturnValue([]),
        reorderTodos: vi.fn().mockResolvedValue(undefined),
      } as never);
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByText("New Tag"));
      await user.type(screen.getByPlaceholderText("Tag name..."), "   ");
      // The submit button should still be disabled for whitespace-only
      expect(screen.getByText("Create Tag")).toBeDisabled();
    });

    it("hides tag create form after successful submission", async () => {
      const user = userEvent.setup();
      const createTag = vi.fn().mockResolvedValue({
        id: "tag-2",
        name: "Work",
        color: "#f43f5e",
        isDefault: false,
        parentId: null,
      });
      useTagStore.setState({
        tags: [defaultTag],
        isLoaded: true,
        loadTags: vi.fn().mockResolvedValue(undefined),
        createTag,
      } as never);
      useTodoStore.setState({
        todos: [openTodo],
        isLoaded: true,
        loadTodos: vi.fn().mockResolvedValue(undefined),
        toggleStatus: vi.fn().mockResolvedValue(undefined),
        createTodo: vi.fn().mockResolvedValue(undefined),
        updateTodo: vi.fn().mockResolvedValue(undefined),
        deleteTodo: vi.fn().mockResolvedValue(undefined),
        deleteTodoWithChildren: vi.fn().mockResolvedValue(undefined),
        getChildren: vi.fn().mockReturnValue([]),
        reorderTodos: vi.fn().mockResolvedValue(undefined),
      } as never);
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByText("New Tag"));
      await user.type(screen.getByPlaceholderText("Tag name..."), "Work");
      await user.click(screen.getByText("Create Tag"));

      // After submission the form should disappear
      expect(screen.queryByPlaceholderText("Tag name...")).not.toBeInTheDocument();
    });
  });

  describe("compact layout mode", () => {
    it("renders compact new todo icon button", () => {
      useSettingsStore.setState({ layoutMode: "compact", completedDisplayMode: "bottom", activeView: "flatList" });
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      expect(screen.getAllByRole("button", { name: "New To-Do" }).length).toBeGreaterThanOrEqual(1);
    });

    it("renders compact new tag icon button", () => {
      useSettingsStore.setState({ layoutMode: "compact", completedDisplayMode: "bottom", activeView: "flatList" });
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      expect(screen.getByRole("button", { name: "New Tag" })).toBeInTheDocument();
    });

    it("renders MindmapFilterBar in compact mode", () => {
      useSettingsStore.setState({ layoutMode: "compact", completedDisplayMode: "bottom", activeView: "flatList" });
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      expect(screen.getByTestId("mindmap-filter-bar")).toBeInTheDocument();
    });

    it("toggles create form with compact button", async () => {
      const user = userEvent.setup();
      useSettingsStore.setState({ layoutMode: "compact", completedDisplayMode: "bottom", activeView: "flatList" });
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getAllByRole("button", { name: "New To-Do" })[0]);
      expect(screen.getByPlaceholderText("What needs to be done?")).toBeInTheDocument();
    });

    it("toggles tag create form with compact tag button", async () => {
      const user = userEvent.setup();
      useSettingsStore.setState({ layoutMode: "compact", completedDisplayMode: "bottom", activeView: "flatList" });
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByRole("button", { name: "New Tag" }));
      expect(screen.getByPlaceholderText("Tag name...")).toBeInTheDocument();
    });

    it("does not show search bar in compact mode", () => {
      useSettingsStore.setState({ layoutMode: "compact", completedDisplayMode: "bottom", activeView: "flatList" });
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      // Compact mode does not have the search input inline
      expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
    });
  });

  describe("filter bar", () => {
    it("renders MindmapFilterBar in normal layout", () => {
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      expect(screen.getByTestId("mindmap-filter-bar")).toBeInTheDocument();
    });

    it("renders status filter dropdown", () => {
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      expect(screen.getByTestId("status-filter")).toBeInTheDocument();
    });

    it("renders due date filter dropdown", () => {
      setupStores({ todos: [openTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      expect(screen.getByTestId("due-date-filter")).toBeInTheDocument();
    });

    it("filters to show only open todos when status filter is set to open", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo, completedTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.selectOptions(screen.getByTestId("status-filter"), "open");
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
      expect(screen.queryByText("Walk the dog")).not.toBeInTheDocument();
    });

    it("filters to show only completed todos when status filter is set to completed", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo, completedTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.selectOptions(screen.getByTestId("status-filter"), "completed");
      expect(screen.queryByText("Buy milk")).not.toBeInTheDocument();
      expect(screen.getByText("Walk the dog")).toBeInTheDocument();
    });

    it("disables due date filter when status is set to completed", async () => {
      const user = userEvent.setup();
      setupStores({ todos: [openTodo, completedTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.selectOptions(screen.getByTestId("status-filter"), "completed");
      expect(screen.getByTestId("due-date-filter")).toBeDisabled();
    });

    it("filters todos by due date when today filter is selected", async () => {
      const user = userEvent.setup();
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const todoWithDueToday: Todo = {
        ...openTodo,
        id: "todo-due-today",
        title: "Due today task",
        dueDate: todayStr,
        sortOrder: 3,
      };
      const todoNoDue: Todo = {
        ...openTodo2,
        id: "todo-no-due",
        title: "No due date task",
        dueDate: null,
        sortOrder: 4,
      };
      setupStores({ todos: [todoWithDueToday, todoNoDue] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.selectOptions(screen.getByTestId("due-date-filter"), "today");
      expect(screen.getByText("Due today task")).toBeInTheDocument();
      expect(screen.queryByText("No due date task")).not.toBeInTheDocument();
    });

    it("filters todos by overdue due date", async () => {
      const user = userEvent.setup();
      const todoOverdue: Todo = {
        ...openTodo,
        id: "todo-overdue",
        title: "Overdue task",
        dueDate: "2020-01-01",
        sortOrder: 3,
      };
      const todoNoDue: Todo = {
        ...openTodo2,
        id: "todo-no-due",
        title: "No due date task",
        dueDate: null,
        sortOrder: 4,
      };
      setupStores({ todos: [todoOverdue, todoNoDue] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.selectOptions(screen.getByTestId("due-date-filter"), "overdue");
      expect(screen.getByText("Overdue task")).toBeInTheDocument();
      expect(screen.queryByText("No due date task")).not.toBeInTheDocument();
    });
  });

  describe("delete with children", () => {
    const childTodo: Todo = {
      id: "todo-child-1",
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

    function setupWithChildren() {
      useTagStore.setState({
        tags: [defaultTag],
        isLoaded: true,
        loadTags: vi.fn().mockResolvedValue(undefined),
        createTag: vi.fn().mockResolvedValue(undefined),
      } as never);

      useTodoStore.setState({
        todos: [openTodo, childTodo],
        isLoaded: true,
        loadTodos: vi.fn().mockResolvedValue(undefined),
        toggleStatus: vi.fn().mockResolvedValue(undefined),
        createTodo: vi.fn().mockResolvedValue(undefined),
        updateTodo: vi.fn().mockResolvedValue(undefined),
        deleteTodo: vi.fn().mockResolvedValue(undefined),
        deleteTodoWithChildren: vi.fn().mockResolvedValue(undefined),
        getChildren: vi.fn().mockImplementation((id: string) =>
          id === "todo-1" ? [childTodo] : [],
        ),
        reorderTodos: vi.fn().mockResolvedValue(undefined),
      } as never);
    }

    it("shows ChoiceDialog when deleting a todo with children", async () => {
      const user = userEvent.setup();
      setupWithChildren();
      render(<MemoryRouter><MainView /></MemoryRouter>);

      // Click delete on the parent todo (first delete button)
      const deleteButtons = screen.getAllByLabelText("Delete");
      await user.click(deleteButtons[0]!);

      // Should show ChoiceDialog with children options
      expect(screen.getByText("Delete with children")).toBeInTheDocument();
      expect(screen.getByText("Has sub-todos.")).toBeInTheDocument();
      expect(screen.getByText("Delete all")).toBeInTheDocument();
      expect(screen.getByText("Keep children")).toBeInTheDocument();
    });

    it("calls deleteTodoWithChildren with 'delete-all' when 'Delete all' is clicked", async () => {
      const user = userEvent.setup();
      setupWithChildren();
      render(<MemoryRouter><MainView /></MemoryRouter>);

      const deleteButtons = screen.getAllByLabelText("Delete");
      await user.click(deleteButtons[0]!);
      await user.click(screen.getByText("Delete all"));

      expect(useTodoStore.getState().deleteTodoWithChildren).toHaveBeenCalledWith(
        "todo-1",
        "delete-all",
      );
    });

    it("calls deleteTodoWithChildren with 'keep-children' when 'Keep children' is clicked", async () => {
      const user = userEvent.setup();
      setupWithChildren();
      render(<MemoryRouter><MainView /></MemoryRouter>);

      const deleteButtons = screen.getAllByLabelText("Delete");
      await user.click(deleteButtons[0]!);
      await user.click(screen.getByText("Keep children"));

      expect(useTodoStore.getState().deleteTodoWithChildren).toHaveBeenCalledWith(
        "todo-1",
        "keep-children",
      );
    });

    it("cancels ChoiceDialog without calling delete", async () => {
      const user = userEvent.setup();
      setupWithChildren();
      render(<MemoryRouter><MainView /></MemoryRouter>);

      const deleteButtons = screen.getAllByLabelText("Delete");
      await user.click(deleteButtons[0]!);

      // Click Cancel in the ChoiceDialog
      const dialog = screen.getByRole("dialog");
      const cancelButton = dialog.querySelector("button:last-of-type")!;
      await user.click(cancelButton);

      expect(useTodoStore.getState().deleteTodoWithChildren).not.toHaveBeenCalled();
      expect(useTodoStore.getState().deleteTodo).not.toHaveBeenCalled();
    });

    it("shows ConfirmDialog (not ChoiceDialog) when deleting a todo without children", async () => {
      const user = userEvent.setup();
      setupWithChildren();
      render(<MemoryRouter><MainView /></MemoryRouter>);

      // Click delete on the child todo (second delete button) - it has no children
      const deleteButtons = screen.getAllByLabelText("Delete");
      await user.click(deleteButtons[1]!);

      // Should show regular ConfirmDialog
      expect(screen.getByText("Delete Todo")).toBeInTheDocument();
      expect(screen.getByText("Are you sure?")).toBeInTheDocument();
      // Should NOT show ChoiceDialog content
      expect(screen.queryByText("Delete all")).not.toBeInTheDocument();
    });
  });

  describe("delete error handling", () => {
    it("shows error message when deleteTodo fails", async () => {
      const user = userEvent.setup();
      useTagStore.setState({
        tags: [defaultTag],
        isLoaded: true,
        loadTags: vi.fn().mockResolvedValue(undefined),
        createTag: vi.fn().mockResolvedValue(undefined),
      } as never);
      useTodoStore.setState({
        todos: [openTodo],
        isLoaded: true,
        loadTodos: vi.fn().mockResolvedValue(undefined),
        toggleStatus: vi.fn().mockResolvedValue(undefined),
        createTodo: vi.fn().mockResolvedValue(undefined),
        updateTodo: vi.fn().mockResolvedValue(undefined),
        deleteTodo: vi.fn().mockRejectedValue(new Error("DB error")),
        deleteTodoWithChildren: vi.fn().mockResolvedValue(undefined),
        getChildren: vi.fn().mockReturnValue([]),
        reorderTodos: vi.fn().mockResolvedValue(undefined),
      } as never);
      render(<MemoryRouter><MainView /></MemoryRouter>);

      await user.click(screen.getByLabelText("Delete"));
      // Confirm deletion
      const dialog = screen.getByRole("dialog");
      const confirmBtn = dialog.querySelector("button:last-of-type")!;
      await user.click(confirmBtn);

      expect(await screen.findByText("Delete failed")).toBeInTheDocument();
    });

    it("shows error message when deleteTodoWithChildren fails", async () => {
      const user = userEvent.setup();
      const childTodo: Todo = {
        id: "todo-child-err",
        title: "Sub task",
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
      useTagStore.setState({
        tags: [defaultTag],
        isLoaded: true,
        loadTags: vi.fn().mockResolvedValue(undefined),
        createTag: vi.fn().mockResolvedValue(undefined),
      } as never);
      useTodoStore.setState({
        todos: [openTodo, childTodo],
        isLoaded: true,
        loadTodos: vi.fn().mockResolvedValue(undefined),
        toggleStatus: vi.fn().mockResolvedValue(undefined),
        createTodo: vi.fn().mockResolvedValue(undefined),
        updateTodo: vi.fn().mockResolvedValue(undefined),
        deleteTodo: vi.fn().mockResolvedValue(undefined),
        deleteTodoWithChildren: vi.fn().mockRejectedValue(new Error("DB error")),
        getChildren: vi.fn().mockImplementation((id: string) =>
          id === "todo-1" ? [childTodo] : [],
        ),
        reorderTodos: vi.fn().mockResolvedValue(undefined),
      } as never);
      render(<MemoryRouter><MainView /></MemoryRouter>);

      // Delete the parent that has children
      const deleteButtons = screen.getAllByLabelText("Delete");
      await user.click(deleteButtons[0]!);
      await user.click(screen.getByText("Delete all"));

      expect(await screen.findByText("Delete failed")).toBeInTheDocument();
    });
  });

  describe("status filter resets due date filter", () => {
    it("resets due date filter to 'all' when status is changed to 'completed'", async () => {
      const user = userEvent.setup();
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const todoWithDue: Todo = {
        ...openTodo,
        id: "todo-due",
        title: "Task with due",
        dueDate: todayStr,
        sortOrder: 0,
      };
      setupStores({ todos: [todoWithDue, completedTodo] });
      render(<MemoryRouter><MainView /></MemoryRouter>);

      // First set due date filter to "today"
      await user.selectOptions(screen.getByTestId("due-date-filter"), "today");
      expect(screen.getByText("Task with due")).toBeInTheDocument();

      // Now change status filter to "completed"
      await user.selectOptions(screen.getByTestId("status-filter"), "completed");

      // Due date filter should be disabled and completed todos should appear
      expect(screen.getByTestId("due-date-filter")).toBeDisabled();
      expect(screen.getByText("Walk the dog")).toBeInTheDocument();
    });
  });
  // --- NEW TESTS END ---
});
