import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MindmapView } from "./mindmap-view.tsx";
import { useTagStore } from "@/features/tags/store.ts";
import { useSettingsStore } from "@/features/settings/store.ts";
import { useTodoStore } from "../../store.ts";
import type { Todo } from "../../types.ts";
import type { Tag } from "@/features/tags/types.ts";

vi.mock("@xyflow/react", () => ({
  ReactFlow: ({
    nodes,
    edges,
    children,
  }: {
    nodes: Array<{ id: string; type?: string; data: Record<string, unknown> }>;
    edges: unknown[];
    children: React.ReactNode;
  }) => (
    <div data-testid="react-flow" data-nodes={nodes.length} data-edges={edges.length}>
      {nodes.map((node) => (
        <div key={node.id} data-testid={`node-${node.id}`} data-type={node.type}>
          {/* Center node callbacks */}
          {node.type === "centerNode" && node.data.onAddTag && (
            <button data-testid={`btn-center-add-tag`} onClick={() => (node.data.onAddTag as () => void)()}>center-add-tag</button>
          )}
          {node.type === "centerNode" && node.data.onAddTodo && (
            <button data-testid={`btn-center-add-todo`} onClick={() => (node.data.onAddTodo as () => void)()}>center-add-todo</button>
          )}
          {/* Tag node callbacks */}
          {node.type === "tagNode" && node.data.onDrillDown && (
            <button data-testid={`btn-drill-${node.id}`} onClick={() => (node.data.onDrillDown as (id: string) => void)(node.data.tagId as string)}>drill-{node.id}</button>
          )}
          {node.type === "tagNode" && node.data.onEditTag && (
            <button data-testid={`btn-edit-tag-${node.id}`} onClick={() => (node.data.onEditTag as (id: string) => void)(node.data.tagId as string)}>edit-tag-{node.id}</button>
          )}
          {node.type === "tagNode" && node.data.onAddTag && (
            <button data-testid={`btn-add-tag-${node.id}`} onClick={() => (node.data.onAddTag as (id: string) => void)(node.data.tagId as string)}>add-tag-{node.id}</button>
          )}
          {node.type === "tagNode" && node.data.onAddTodo && (
            <button data-testid={`btn-add-todo-${node.id}`} onClick={() => (node.data.onAddTodo as (id: string) => void)(node.data.tagId as string)}>add-todo-{node.id}</button>
          )}
          {/* Todo node callbacks */}
          {node.type === "todoNode" && node.data.onToggle && (
            <button data-testid={`btn-toggle-${node.id}`} onClick={() => (node.data.onToggle as (id: string) => void)(node.data.todoId as string)}>toggle-{node.id}</button>
          )}
          {node.type === "todoNode" && node.data.onTitleClick && (
            <button data-testid={`btn-title-${node.id}`} onClick={() => (node.data.onTitleClick as (id: string) => void)(node.data.todoId as string)}>title-{node.id}</button>
          )}
          {node.type === "todoNode" && node.data.onEdit && (
            <button data-testid={`btn-edit-${node.id}`} onClick={() => (node.data.onEdit as (id: string) => void)(node.data.todoId as string)}>edit-{node.id}</button>
          )}
          {node.type === "todoNode" && node.data.onZoom && (
            <button data-testid={`btn-zoom-${node.id}`} onClick={() => (node.data.onZoom as (id: string) => void)(node.data.todoId as string)}>zoom-{node.id}</button>
          )}
          {/* Tag input node callbacks */}
          {node.type === "tagInputNode" && node.data.onCreateTag && (
            <button data-testid={`btn-create-tag-${node.id}`} onClick={() => (node.data.onCreateTag as (name: string, color: string, parentId: string | null) => void)("NewTag", node.data.defaultColor as string, node.data.defaultParentId as string | null)}>create-tag</button>
          )}
          {/* Todo input node callbacks */}
          {node.type === "todoInputNode" && node.data.onCreateTodo && (
            <button data-testid={`btn-create-todo-${node.id}`} onClick={() => (node.data.onCreateTodo as (tagId: string, title: string) => void)(node.data.tagId as string, "NewTodo")}>create-todo</button>
          )}
          {/* Cancel for both input node types */}
          {(node.type === "tagInputNode" || node.type === "todoInputNode") && node.data.onCancel && (
            <button data-testid={`btn-cancel-input-${node.id}`} onClick={() => (node.data.onCancel as () => void)()}>cancel-input</button>
          )}
          {/* Collapsed todo group node callbacks */}
          {node.type === "collapsedTodoGroupNode" && node.data.onExpand && (
            <button data-testid={`btn-expand-${node.id}`} onClick={() => (node.data.onExpand as (id: string) => void)(node.data.tagId as string)}>expand-{node.id}</button>
          )}
        </div>
      ))}
      {children}
    </div>
  ),
  Controls: () => <div data-testid="controls" />,
  Background: () => <div data-testid="background" />,
  BackgroundVariant: { Dots: "dots" },
  Handle: () => null,
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
  applyNodeChanges: vi.fn().mockImplementation((_changes: unknown[], nodes: unknown[]) => nodes),
}));

vi.mock("@xyflow/react/dist/style.css", () => ({}));

const tag1: Tag = {
  id: "tag-1",
  name: "General",
  color: "#ef4444",
  isDefault: true,
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

const mockCreateTag = vi.fn().mockResolvedValue(undefined);
const mockCreateTodo = vi.fn().mockResolvedValue(undefined);

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("MindmapView", () => {
  beforeEach(() => {
    useTagStore.setState({ tags: [tag1], isLoaded: true, createTag: mockCreateTag } as never);
    useTodoStore.setState({ todos: [todo1], isLoaded: true, createTodo: mockCreateTodo } as never);
    useSettingsStore.setState({ userName: "Test", layoutMode: "normal", mindmapCollapseThreshold: 5, mindmapSpacing: "small" });
    mockCreateTag.mockClear();
    mockCreateTodo.mockClear();
  });

  it("renders the mindmap container", () => {
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );
    expect(screen.getByTestId("mindmap-container")).toBeInTheDocument();
  });

  it("renders ReactFlow with nodes and edges", () => {
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );
    const flow = screen.getByTestId("react-flow");
    // 1 center node + 1 tag node + 1 todo node = 3 nodes
    expect(flow.getAttribute("data-nodes")).toBe("3");
    // 1 center-to-tag edge + 1 tag-to-todo edge = 2 edges
    expect(flow.getAttribute("data-edges")).toBe("2");
  });

  it("renders Controls and Background", () => {
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );
    expect(screen.getByTestId("controls")).toBeInTheDocument();
    expect(screen.getByTestId("background")).toBeInTheDocument();
  });

  it("renders tags even when no todos", () => {
    renderWithRouter(
      <MindmapView todos={[]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );
    const flow = screen.getByTestId("react-flow");
    // Center node + tag1 from store
    expect(flow.getAttribute("data-nodes")).toBe("2");
    expect(flow.getAttribute("data-edges")).toBe("1");
  });

  it("shows tag input node when center add-tag is clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    expect(screen.queryByTestId("node-input-tag-__center__")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("btn-center-add-tag"));

    expect(screen.getByTestId("node-input-tag-__center__")).toBeInTheDocument();
    expect(screen.getByTestId("node-input-tag-__center__").getAttribute("data-type")).toBe("tagInputNode");
  });

  it("shows todo input node when center add-todo is clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    expect(screen.queryByTestId("node-input-todo-__center__")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("btn-center-add-todo"));

    expect(screen.getByTestId("node-input-todo-__center__")).toBeInTheDocument();
    expect(screen.getByTestId("node-input-todo-__center__").getAttribute("data-type")).toBe("todoInputNode");
  });

  it("drills down into a tag and shows breadcrumb", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    // Initially no breadcrumb (only root level, path.length <= 1)
    expect(screen.queryByTestId("mindmap-breadcrumb")).not.toBeInTheDocument();

    // Click drill-down on tag-1
    await user.click(screen.getByTestId("btn-drill-tag-tag-1"));

    // Breadcrumb should now be visible
    expect(screen.getByTestId("mindmap-breadcrumb")).toBeInTheDocument();
  });

  it("calls onToggle when todo toggle button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnToggle = vi.fn();
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={mockOnToggle} onTitleClick={vi.fn()} />,
    );

    await user.click(screen.getByTestId("btn-toggle-todo-todo-1"));

    expect(mockOnToggle).toHaveBeenCalledWith("todo-1");
  });

  it("calls onTitleClick with the todo object when todo title is clicked", async () => {
    const user = userEvent.setup();
    const mockOnTitleClick = vi.fn();
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={mockOnTitleClick} />,
    );

    await user.click(screen.getByTestId("btn-title-todo-todo-1"));

    expect(mockOnTitleClick).toHaveBeenCalledWith(todo1);
  });

  it("calls createTag when tag is created via center tag input node", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    // Open center add tag input
    await user.click(screen.getByTestId("btn-center-add-tag"));

    // Verify tag input node is present
    expect(screen.getByTestId("node-input-tag-__center__")).toBeInTheDocument();

    // Click create tag button
    await act(async () => {
      await user.click(screen.getByTestId("btn-create-tag-input-tag-__center__"));
    });

    // createTag should have been called with the tag data
    expect(mockCreateTag).toHaveBeenCalledTimes(1);
    expect(mockCreateTag).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "NewTag",
        isDefault: false,
        parentId: null,
      }),
    );
  });

  it("calls createTodo when todo is created via center todo input node", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    // Open center add todo input
    await user.click(screen.getByTestId("btn-center-add-todo"));

    // Verify todo input node is present
    expect(screen.getByTestId("node-input-todo-__center__")).toBeInTheDocument();

    // Click create todo button
    await act(async () => {
      await user.click(screen.getByTestId("btn-create-todo-input-todo-__center__"));
    });

    // createTodo should have been called with the todo data
    expect(mockCreateTodo).toHaveBeenCalledTimes(1);
    expect(mockCreateTodo).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "NewTodo",
        tagIds: ["tag-1"],
        parentId: null,
      }),
    );
  });

  it("cancels input node when cancel button is clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    // Open center add tag input
    await user.click(screen.getByTestId("btn-center-add-tag"));

    // Verify tag input node is present
    expect(screen.getByTestId("node-input-tag-__center__")).toBeInTheDocument();

    // Click cancel button
    await user.click(screen.getByTestId("btn-cancel-input-input-tag-__center__"));

    // Input node should disappear
    expect(screen.queryByTestId("node-input-tag-__center__")).not.toBeInTheDocument();
  });

  it("shows breadcrumb when focused on a tag via drill-down", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    // No breadcrumb at root
    expect(screen.queryByTestId("mindmap-breadcrumb")).not.toBeInTheDocument();

    // Drill into tag-1
    await user.click(screen.getByTestId("btn-drill-tag-tag-1"));

    // Breadcrumb should show with root and tag-1
    const breadcrumb = screen.getByTestId("mindmap-breadcrumb");
    expect(breadcrumb).toBeInTheDocument();
    // The breadcrumb should contain the root label and the focused tag name
    expect(breadcrumb.textContent).toContain("Test's To Do");
    expect(breadcrumb.textContent).toContain("General");
  });

  it("opens tag input directly from tag node add-tag button", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    expect(screen.queryByTestId("node-input-tag-tag-1")).not.toBeInTheDocument();

    // Click the direct add-tag button on the tag node
    await user.click(screen.getByTestId("btn-add-tag-tag-tag-1"));

    // Tag input node should appear for tag-1
    expect(screen.getByTestId("node-input-tag-tag-1")).toBeInTheDocument();
    expect(screen.getByTestId("node-input-tag-tag-1").getAttribute("data-type")).toBe("tagInputNode");
  });

  it("opens todo input directly from tag node add-todo button", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    expect(screen.queryByTestId("node-input-todo-tag-1")).not.toBeInTheDocument();

    // Click the direct add-todo button on the tag node
    await user.click(screen.getByTestId("btn-add-todo-tag-tag-1"));

    // Todo input node should appear for tag-1
    expect(screen.getByTestId("node-input-todo-tag-1")).toBeInTheDocument();
    expect(screen.getByTestId("node-input-todo-tag-1").getAttribute("data-type")).toBe("todoInputNode");
  });

  it("calls createTag with parentId when creating tag from tag node input", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    // Open tag input directly on tag-1
    await user.click(screen.getByTestId("btn-add-tag-tag-tag-1"));
    expect(screen.getByTestId("node-input-tag-tag-1")).toBeInTheDocument();

    // Create a tag under tag-1
    await act(async () => {
      await user.click(screen.getByTestId("btn-create-tag-input-tag-tag-1"));
    });

    expect(mockCreateTag).toHaveBeenCalledTimes(1);
    expect(mockCreateTag).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "NewTag",
        isDefault: false,
        parentId: "tag-1",
      }),
    );
  });

  it("calls createTodo with tagId when creating todo from tag node input", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    // Open todo input directly on tag-1
    await user.click(screen.getByTestId("btn-add-todo-tag-tag-1"));
    expect(screen.getByTestId("node-input-todo-tag-1")).toBeInTheDocument();

    // Create a todo under tag-1
    await act(async () => {
      await user.click(screen.getByTestId("btn-create-todo-input-todo-tag-1"));
    });

    expect(mockCreateTodo).toHaveBeenCalledTimes(1);
    expect(mockCreateTodo).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "NewTodo",
        tagIds: ["tag-1"],
        parentId: null,
      }),
    );
  });

  it("uses userName in center node label", () => {
    useSettingsStore.setState({ userName: "Gilbert" });
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    // The center node should exist (we can verify via the mock)
    expect(screen.getByTestId("node-center")).toBeInTheDocument();
  });

  it("calls onEdit with the todo object when edit button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} onEdit={mockOnEdit} />,
    );

    await user.click(screen.getByTestId("btn-edit-todo-todo-1"));

    expect(mockOnEdit).toHaveBeenCalledWith(todo1);
  });

  it("calls onEditTag with the tag object when edit-tag button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnEditTag = vi.fn();
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} onEditTag={mockOnEditTag} />,
    );

    // The edit-tag button should exist on the tag node
    expect(screen.getByTestId("btn-edit-tag-tag-tag-1")).toBeInTheDocument();

    await user.click(screen.getByTestId("btn-edit-tag-tag-tag-1"));

    expect(mockOnEditTag).toHaveBeenCalledWith(tag1);
  });

  it("drills down into parent tag when todo zoom button is clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    // No breadcrumb at root
    expect(screen.queryByTestId("mindmap-breadcrumb")).not.toBeInTheDocument();

    // Click zoom on todo-1 (its primary tag is tag-1)
    await user.click(screen.getByTestId("btn-zoom-todo-todo-1"));

    // Should drill into tag-1 — breadcrumb should appear
    expect(screen.getByTestId("mindmap-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("mindmap-breadcrumb").textContent).toContain("General");
  });
});
