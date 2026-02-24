import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HardcoreView } from "./hardcore-view.tsx";
import { useTodoStore } from "../../store.ts";
import { useTagStore } from "@/features/tags/store.ts";
import type { Tag } from "@/features/tags/types.ts";
import type { Todo } from "../../types.ts";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      const translations: Record<string, string> = {
        "hardcore.selectTag": "Select tag",
        "hardcore.save": "Save",
        "hardcore.preview": "Preview",
        "hardcore.edit": "Edit",
        "hardcore.discard": "Discard",
        "hardcore.saveSuccess": "Changes saved",
        "hardcore.unsavedChanges": "You have unsaved changes. Discard them?",
        "hardcore.invalidLine": "Invalid syntax",
        "hardcore.depthJump": "Indentation jump too large",
        "hardcore.oddIndent": "Indentation must be multiples of 2 spaces",
        "common.cancel": "Cancel",
        "hardcore.editorLabel": "Markdown editor",
      };
      if (key === "hardcore.validationError" && params) {
        return `Line ${params.line}: ${params.message}`;
      }
      return translations[key] ?? key;
    },
  }),
}));

const tag1: Tag = {
  id: "tag-1",
  name: "Work",
  color: "#ef4444",
  isDefault: true,
  parentId: null,
};

const tag2: Tag = {
  id: "tag-2",
  name: "Personal",
  color: "#3b82f6",
  isDefault: false,
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

const childTodo: Todo = {
  id: "todo-3",
  title: "Get milk",
  description: null,
  tagIds: ["tag-1"],
  parentId: "todo-1",
  status: "open",
  dueDate: null,
  recurrence: null,
  recurrenceInterval: null,
  createdAt: "2026-02-10T12:30:00.000Z",
  completedAt: null,
  sortOrder: 2,
};

function setupStores(options?: { tags?: Tag[]; todos?: Todo[] }) {
  const { tags = [tag1, tag2], todos = [] } = options ?? {};

  useTagStore.setState({
    tags,
    isLoaded: true,
    loadTags: vi.fn().mockResolvedValue(undefined),
  } as never);

  useTodoStore.setState({
    todos,
    isLoaded: true,
    loadTodos: vi.fn().mockResolvedValue(undefined),
    toggleStatus: vi.fn().mockResolvedValue(undefined),
    createTodo: vi.fn().mockResolvedValue(undefined),
    updateTodo: vi.fn().mockResolvedValue(undefined),
    deleteTodo: vi.fn().mockResolvedValue(undefined),
    deleteTodoWithChildren: vi.fn().mockResolvedValue(undefined),
    getChildren: vi.fn().mockReturnValue([]),
  } as never);
}

describe("HardcoreView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tag dropdown", () => {
    setupStores();
    render(<HardcoreView />);
    expect(screen.getByLabelText("Select tag")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
  });

  it("renders textarea with markdown", () => {
    setupStores({ todos: [openTodo] });
    render(<HardcoreView />);
    const textarea = screen.getByLabelText("Markdown editor");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("# Work\n\n- [ ] Buy groceries\n");
  });

  it("updates content when tag is switched", async () => {
    const user = userEvent.setup();
    const personalTodo: Todo = {
      ...openTodo,
      id: "todo-p",
      title: "Exercise",
      tagIds: ["tag-2"],
    };
    setupStores({ todos: [openTodo, personalTodo] });
    render(<HardcoreView />);

    await user.selectOptions(screen.getByLabelText("Select tag"), "tag-2");
    const textarea = screen.getByLabelText("Markdown editor");
    expect(textarea).toHaveValue("# Personal\n\n- [ ] Exercise\n");
  });

  it("shows validation errors for invalid markdown", async () => {
    const user = userEvent.setup();
    setupStores({ todos: [openTodo] });
    render(<HardcoreView />);

    const textarea = screen.getByLabelText("Markdown editor");
    fireEvent.change(textarea, {
      target: { value: "# Work\nsome bad line" },
    });

    await user.click(screen.getByText("Save"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Line 2/)).toBeInTheDocument();
  });

  it("blocks save when there are validation errors", async () => {
    const user = userEvent.setup();
    setupStores({ todos: [openTodo] });
    render(<HardcoreView />);

    const textarea = screen.getByLabelText("Markdown editor");
    fireEvent.change(textarea, {
      target: { value: "# Work\ninvalid line" },
    });

    await user.click(screen.getByText("Save"));
    expect(useTodoStore.getState().deleteTodo).not.toHaveBeenCalled();
    expect(useTodoStore.getState().createTodo).not.toHaveBeenCalled();
  });

  it("calls store actions on valid save", async () => {
    const user = userEvent.setup();
    setupStores({ todos: [] });
    render(<HardcoreView />);

    const textarea = screen.getByLabelText("Markdown editor");
    // Use fireEvent.change since userEvent.type interprets [] as key descriptors
    fireEvent.change(textarea, {
      target: { value: "# Work\n\n- [ ] New task\n" },
    });

    await user.click(screen.getByText("Save"));
    expect(useTodoStore.getState().createTodo).toHaveBeenCalled();
  });

  it("toggles preview mode", async () => {
    const user = userEvent.setup();
    setupStores({ todos: [openTodo] });
    render(<HardcoreView />);

    await user.click(screen.getByText("Preview"));
    expect(screen.getByTestId("markdown-preview")).toBeInTheDocument();
    expect(screen.queryByLabelText("Markdown editor")).not.toBeInTheDocument();

    await user.click(screen.getByText("Edit"));
    expect(screen.getByLabelText("Markdown editor")).toBeInTheDocument();
    expect(screen.queryByTestId("markdown-preview")).not.toBeInTheDocument();
  });

  it("discards changes and resets to canonical markdown", async () => {
    const user = userEvent.setup();
    setupStores({ todos: [openTodo] });
    render(<HardcoreView />);

    const textarea = screen.getByLabelText("Markdown editor");
    const originalValue = "# Work\n\n- [ ] Buy groceries\n";
    expect(textarea).toHaveValue(originalValue);

    await user.type(textarea, "extra text");
    expect(textarea).not.toHaveValue(originalValue);

    await user.click(screen.getByText("Discard"));
    expect(textarea).toHaveValue(originalValue);
  });

  it("renders header only for tag with no todos", () => {
    setupStores({ todos: [] });
    render(<HardcoreView />);
    const textarea = screen.getByLabelText("Markdown editor");
    expect(textarea).toHaveValue("# Work\n");
  });

  it("renders hierarchy with indentation", () => {
    setupStores({ todos: [openTodo, childTodo] });
    render(<HardcoreView />);
    const textarea = screen.getByLabelText("Markdown editor");
    expect(textarea).toHaveValue(
      "# Work\n\n- [ ] Buy groceries\n  - [ ] Get milk\n",
    );
  });
});
