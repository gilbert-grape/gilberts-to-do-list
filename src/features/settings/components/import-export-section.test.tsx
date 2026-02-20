import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImportExportSection } from "./import-export-section.tsx";
import { useTagStore } from "@/features/tags/store.ts";
import { useTodoStore } from "@/features/todos/store.ts";
import type { Todo } from "@/features/todos/types.ts";
import type { Tag } from "@/features/tags/types.ts";

// Polyfill Blob.prototype.text for jsdom
if (!Blob.prototype.text) {
  Blob.prototype.text = function () {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "settings.importExport": "Import & Export",
        "settings.export": "Export",
        "settings.import": "Import",
        "settings.downloadMd": "Download .md",
        "settings.exportAll": "Export All",
        "settings.importDescription":
          "Upload .md files to import to-dos. Filename or # header determines the tag.",
        "settings.selectFiles": "Select .md Files",
        "settings.importing": "Importing...",
        "settings.importResult": `${params?.created ?? 0} to-dos imported, ${params?.skipped ?? 0} duplicates skipped.`,
      };
      return translations[key] ?? key;
    },
  }),
}));

const tag1: Tag = {
  id: "tag-1",
  name: "Work",
  color: "#3b82f6",
  isDefault: true,
  parentId: null,
};

const tag2: Tag = {
  id: "tag-2",
  name: "Personal",
  color: "#22c55e",
  isDefault: false,
  parentId: null,
};

const todo1: Todo = {
  id: "todo-1",
  title: "Buy milk",
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
  title: "Walk the dog",
  description: null,
  tagIds: ["tag-2"],
  parentId: null,
  status: "completed",
  dueDate: null,
  recurrence: null,
  recurrenceInterval: null,
  createdAt: "2026-02-10T11:00:00.000Z",
  completedAt: "2026-02-10T12:30:00.000Z",
  sortOrder: 1,
};

function setupStores(todos: Todo[] = [], tags: Tag[] = [tag1, tag2]) {
  useTagStore.setState({
    tags,
    isLoaded: true,
    createTag: vi.fn().mockImplementation(async (input) => {
      const newTag: Tag = {
        id: `tag-new-${Date.now()}`,
        name: input.name,
        color: input.color,
        isDefault: false,
        parentId: null,
      };
      useTagStore.setState((s) => ({ tags: [...s.tags, newTag] }));
    }),
  } as never);
  useTodoStore.setState({
    todos,
    isLoaded: true,
    createTodo: vi.fn().mockImplementation(async (input) => {
      const newTodo: Todo = {
        id: `todo-new-${Date.now()}-${Math.random()}`,
        title: input.title,
        description: input.description,
        tagIds: input.tagIds,
        parentId: input.parentId,
        status: "open",
        dueDate: input.dueDate,
        recurrence: input.recurrence,
        recurrenceInterval: input.recurrenceInterval,
        createdAt: new Date().toISOString(),
        completedAt: null,
        sortOrder: 0,
      };
      useTodoStore.setState((s) => ({ todos: [...s.todos, newTodo] }));
    }),
    updateTodo: vi.fn().mockImplementation(async (id, changes) => {
      useTodoStore.setState((s) => ({
        todos: s.todos.map((t) => (t.id === id ? { ...t, ...changes } : t)),
      }));
    }),
    loadTodos: vi.fn().mockResolvedValue(undefined),
    toggleStatus: vi.fn().mockResolvedValue(undefined),
    deleteTodo: vi.fn().mockResolvedValue(undefined),
    deleteTodoWithChildren: vi.fn().mockResolvedValue(undefined),
    getChildren: vi.fn().mockReturnValue([]),
    reorderTodos: vi.fn().mockResolvedValue(undefined),
  } as never);
}

describe("ImportExportSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn().mockReturnValue("blob:test-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("renders section heading", () => {
    setupStores();
    render(<ImportExportSection />);
    expect(screen.getByText("Import & Export")).toBeInTheDocument();
  });

  it("renders export heading and import heading", () => {
    setupStores();
    render(<ImportExportSection />);
    expect(screen.getByText("Export")).toBeInTheDocument();
    expect(screen.getByText("Import")).toBeInTheDocument();
  });

  it("renders a download button per tag", () => {
    setupStores([todo1, todo2]);
    render(<ImportExportSection />);
    const buttons = screen.getAllByText("Download .md");
    expect(buttons).toHaveLength(2);
  });

  it("renders tag names with todo counts", () => {
    setupStores([todo1, todo2]);
    render(<ImportExportSection />);
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
  });

  it("renders Export All button when multiple tags exist", () => {
    setupStores([todo1, todo2]);
    render(<ImportExportSection />);
    expect(screen.getByText("Export All")).toBeInTheDocument();
  });

  it("does not render Export All button with single tag", () => {
    setupStores([todo1], [tag1]);
    render(<ImportExportSection />);
    expect(screen.queryByText("Export All")).not.toBeInTheDocument();
  });

  it("renders file upload label", () => {
    setupStores();
    render(<ImportExportSection />);
    expect(screen.getByText("Select .md Files")).toBeInTheDocument();
  });

  it("renders import description text", () => {
    setupStores();
    render(<ImportExportSection />);
    expect(
      screen.getByText(
        "Upload .md files to import to-dos. Filename or # header determines the tag.",
      ),
    ).toBeInTheDocument();
  });

  it("exports a markdown file on download click", async () => {
    const user = userEvent.setup();
    setupStores([todo1]);
    render(<ImportExportSection />);

    const downloadButtons = screen.getAllByText("Download .md");
    await user.click(downloadButtons[0]);

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it("imports todos from a markdown file", async () => {
    const user = userEvent.setup();
    setupStores([], [tag1]);
    render(<ImportExportSection />);

    const fileContent = "# Work\n\n- [ ] New task\n- [x] Done task\n";
    const file = new File([fileContent], "Work.md", { type: "text/markdown" });

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(
        screen.getByText("2 to-dos imported, 0 duplicates skipped."),
      ).toBeInTheDocument();
    });
  });

  it("skips duplicate todos during import", async () => {
    const user = userEvent.setup();
    setupStores([todo1], [tag1]);
    render(<ImportExportSection />);

    const fileContent = "# Work\n\n- [ ] Buy milk\n- [ ] New task\n";
    const file = new File([fileContent], "Work.md", { type: "text/markdown" });

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(
        screen.getByText("1 to-dos imported, 1 duplicates skipped."),
      ).toBeInTheDocument();
    });
  });

  it("creates a new tag when importing with unknown tag name", async () => {
    const user = userEvent.setup();
    setupStores([], [tag1]);
    render(<ImportExportSection />);

    const fileContent = "# Shopping\n\n- [ ] Buy groceries\n";
    const file = new File([fileContent], "Shopping.md", {
      type: "text/markdown",
    });

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(
        screen.getByText("1 to-dos imported, 0 duplicates skipped."),
      ).toBeInTheDocument();
    });

    const tags = useTagStore.getState().tags;
    expect(tags.some((t) => t.name === "Shopping")).toBe(true);
  });

  it("uses filename as tag name when no header present", async () => {
    const user = userEvent.setup();
    setupStores([], [tag1]);
    render(<ImportExportSection />);

    const fileContent = "- [ ] Task without header\n";
    const file = new File([fileContent], "MyTag.md", {
      type: "text/markdown",
    });

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(
        screen.getByText("1 to-dos imported, 0 duplicates skipped."),
      ).toBeInTheDocument();
    });

    const tags = useTagStore.getState().tags;
    expect(tags.some((t) => t.name === "MyTag")).toBe(true);
  });
});
