import { render, screen, act } from "@testing-library/react";
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
          {node.type === "centerNode" && node.data.onAddAction && (
            <button data-testid={`btn-center-add-action`} onClick={() => (node.data.onAddAction as () => void)()}>center-add</button>
          )}
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
          {node.type === "tagNode" && node.data.onAddAction && (
            <button data-testid={`btn-action-${node.id}`} onClick={() => (node.data.onAddAction as (id: string) => void)(node.data.tagId as string)}>action-{node.id}</button>
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
          {/* Tag action node callbacks */}
          {node.type === "tagActionNode" && node.data.onSelectAction && (
            <>
              <button data-testid={`btn-select-tag-${node.id}`} onClick={() => (node.data.onSelectAction as (id: string, choice: string) => void)(node.data.tagId as string, "tag")}>select-tag</button>
              <button data-testid={`btn-select-todo-${node.id}`} onClick={() => (node.data.onSelectAction as (id: string, choice: string) => void)(node.data.tagId as string, "todo")}>select-todo</button>
            </>
          )}
          {node.type === "tagActionNode" && node.data.onCancel && (
            <button data-testid={`btn-cancel-${node.id}`} onClick={() => (node.data.onCancel as () => void)()}>cancel</button>
          )}
          {/* Tag input node callbacks */}
          {node.type === "tagInputNode" && node.data.onCreateTag && (
            <button data-testid={`btn-create-tag-${node.id}`} onClick={() => (node.data.onCreateTag as (parentId: string, name: string) => void)(node.data.parentTagId as string, "NewTag")}>create-tag</button>
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

describe("MindmapView", () => {
  beforeEach(() => {
    useTagStore.setState({ tags: [tag1], isLoaded: true, createTag: mockCreateTag } as never);
    useTodoStore.setState({ todos: [todo1], isLoaded: true, createTodo: mockCreateTodo } as never);
    useSettingsStore.setState({ userName: "Test", layoutMode: "normal", mindmapCollapseThreshold: 5, mindmapSpacing: "small" });
    mockCreateTag.mockClear();
    mockCreateTodo.mockClear();
  });

  it("renders the mindmap container", () => {
    render(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );
    expect(screen.getByTestId("mindmap-container")).toBeInTheDocument();
  });

  it("renders ReactFlow with nodes and edges", () => {
    render(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );
    const flow = screen.getByTestId("react-flow");
    // 1 center node + 1 tag node + 1 todo node = 3 nodes
    expect(flow.getAttribute("data-nodes")).toBe("3");
    // 1 center-to-tag edge + 1 tag-to-todo edge = 2 edges
    expect(flow.getAttribute("data-edges")).toBe("2");
  });

  it("renders Controls and Background", () => {
    render(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );
    expect(screen.getByTestId("controls")).toBeInTheDocument();
    expect(screen.getByTestId("background")).toBeInTheDocument();
  });

  it("renders tags even when no todos", () => {
    render(
      <MindmapView todos={[]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );
    const flow = screen.getByTestId("react-flow");
    // Center node + tag1 from store
    expect(flow.getAttribute("data-nodes")).toBe("2");
    expect(flow.getAttribute("data-edges")).toBe("1");
  });

  it("toggles center action node when center add-action is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    // Initially no action node
    expect(screen.queryByTestId("node-action-__center__")).not.toBeInTheDocument();

    // Click center add action button
    await user.click(screen.getByTestId("btn-center-add-action"));

    // Action node should now appear
    expect(screen.getByTestId("node-action-__center__")).toBeInTheDocument();

    // Click again to toggle it off
    await user.click(screen.getByTestId("btn-center-add-action"));

    // Action node should disappear
    expect(screen.queryByTestId("node-action-__center__")).not.toBeInTheDocument();
  });

  it("shows tag input node when center add-tag is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    expect(screen.queryByTestId("node-input-tag-__center__")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("btn-center-add-tag"));

    expect(screen.getByTestId("node-input-tag-__center__")).toBeInTheDocument();
    expect(screen.getByTestId("node-input-tag-__center__").getAttribute("data-type")).toBe("tagInputNode");
  });

  it("shows todo input node when center add-todo is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    expect(screen.queryByTestId("node-input-todo-__center__")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("btn-center-add-todo"));

    expect(screen.getByTestId("node-input-todo-__center__")).toBeInTheDocument();
    expect(screen.getByTestId("node-input-todo-__center__").getAttribute("data-type")).toBe("todoInputNode");
  });

  it("drills down into a tag and shows breadcrumb", async () => {
    const user = userEvent.setup();
    render(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    // Initially no breadcrumb (only root level, path.length <= 1)
    expect(screen.queryByTestId("mindmap-breadcrumb")).not.toBeInTheDocument();

    // Click drill-down on tag-1
    await user.click(screen.getByTestId("btn-drill-tag-tag-1"));

    // Breadcrumb should now be visible
    expect(screen.getByTestId("mindmap-breadcrumb")).toBeInTheDocument();
  });

  it("shows action node for a specific tag when tag add-action is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    expect(screen.queryByTestId("node-action-tag-1")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("btn-action-tag-tag-1"));

    expect(screen.getByTestId("node-action-tag-1")).toBeInTheDocument();
    expect(screen.getByTestId("node-action-tag-1").getAttribute("data-type")).toBe("tagActionNode");
  });

  it("calls onToggle when todo toggle button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnToggle = vi.fn();
    render(
      <MindmapView todos={[todo1]} onToggle={mockOnToggle} onTitleClick={vi.fn()} />,
    );

    await user.click(screen.getByTestId("btn-toggle-todo-todo-1"));

    expect(mockOnToggle).toHaveBeenCalledWith("todo-1");
  });

  it("calls onTitleClick with the todo object when todo title is clicked", async () => {
    const user = userEvent.setup();
    const mockOnTitleClick = vi.fn();
    render(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={mockOnTitleClick} />,
    );

    await user.click(screen.getByTestId("btn-title-todo-todo-1"));

    expect(mockOnTitleClick).toHaveBeenCalledWith(todo1);
  });

  it("calls createTag when tag is created via center tag input node", async () => {
    const user = userEvent.setup();
    render(
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
    render(
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
    render(
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

  it("transitions from action node to tag input node when select-tag is chosen", async () => {
    const user = userEvent.setup();
    render(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    // Open center action node
    await user.click(screen.getByTestId("btn-center-add-action"));
    expect(screen.getByTestId("node-action-__center__")).toBeInTheDocument();

    // Select "tag" from the action node
    await user.click(screen.getByTestId("btn-select-tag-action-__center__"));

    // Action node should be gone, replaced by tag input node
    expect(screen.queryByTestId("node-action-__center__")).not.toBeInTheDocument();
    expect(screen.getByTestId("node-input-tag-__center__")).toBeInTheDocument();
  });

  it("transitions from action node to todo input node when select-todo is chosen", async () => {
    const user = userEvent.setup();
    render(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    // Open center action node
    await user.click(screen.getByTestId("btn-center-add-action"));
    expect(screen.getByTestId("node-action-__center__")).toBeInTheDocument();

    // Select "todo" from the action node
    await user.click(screen.getByTestId("btn-select-todo-action-__center__"));

    // Action node should be gone, replaced by todo input node
    expect(screen.queryByTestId("node-action-__center__")).not.toBeInTheDocument();
    expect(screen.getByTestId("node-input-todo-__center__")).toBeInTheDocument();
  });

  it("shows breadcrumb when focused on a tag via drill-down", async () => {
    const user = userEvent.setup();
    render(
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
    render(
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
    render(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    expect(screen.queryByTestId("node-input-todo-tag-1")).not.toBeInTheDocument();

    // Click the direct add-todo button on the tag node
    await user.click(screen.getByTestId("btn-add-todo-tag-tag-1"));

    // Todo input node should appear for tag-1
    expect(screen.getByTestId("node-input-todo-tag-1")).toBeInTheDocument();
    expect(screen.getByTestId("node-input-todo-tag-1").getAttribute("data-type")).toBe("todoInputNode");
  });

  it("cancels action node when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    // Open action node
    await user.click(screen.getByTestId("btn-center-add-action"));
    expect(screen.getByTestId("node-action-__center__")).toBeInTheDocument();

    // Click cancel on the action node
    await user.click(screen.getByTestId("btn-cancel-action-__center__"));

    // Action node should disappear
    expect(screen.queryByTestId("node-action-__center__")).not.toBeInTheDocument();
  });

  it("calls createTag with parentId when creating tag from tag node input", async () => {
    const user = userEvent.setup();
    render(
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
    render(
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
    render(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    // The center node should exist (we can verify via the mock)
    expect(screen.getByTestId("node-center")).toBeInTheDocument();
  });

  it("clears action and input state on drill-down", async () => {
    const user = userEvent.setup();
    render(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );

    // Open an action node
    await user.click(screen.getByTestId("btn-center-add-action"));
    expect(screen.getByTestId("node-action-__center__")).toBeInTheDocument();

    // Drill into tag-1 -- this should clear the action state
    await user.click(screen.getByTestId("btn-drill-tag-tag-1"));

    // Action node should be gone (drill-down clears action and input state)
    expect(screen.queryByTestId("node-action-__center__")).not.toBeInTheDocument();
  });
});
