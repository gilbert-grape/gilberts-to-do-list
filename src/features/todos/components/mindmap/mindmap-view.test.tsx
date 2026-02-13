import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MindmapView } from "./mindmap-view.tsx";
import { useTagStore } from "@/features/tags/store.ts";
import { useTodoStore } from "../../store.ts";
import type { Todo } from "../../types.ts";
import type { Tag } from "@/features/tags/types.ts";

vi.mock("@xyflow/react", () => ({
  ReactFlow: ({
    nodes,
    edges,
    children,
  }: {
    nodes: unknown[];
    edges: unknown[];
    children: React.ReactNode;
  }) => (
    <div
      data-testid="react-flow"
      data-nodes={nodes.length}
      data-edges={edges.length}
    >
      {children}
    </div>
  ),
  Controls: () => <div data-testid="controls" />,
  Background: () => <div data-testid="background" />,
  BackgroundVariant: { Dots: "dots" },
  Handle: () => null,
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
}));

vi.mock("@xyflow/react/dist/style.css", () => ({}));

const tag1: Tag = {
  id: "tag-1",
  name: "General",
  color: "#ef4444",
  isDefault: true,
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

describe("MindmapView", () => {
  beforeEach(() => {
    useTagStore.setState({ tags: [tag1], isLoaded: true } as never);
    useTodoStore.setState({ todos: [todo1], isLoaded: true } as never);
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
    // 1 tag node + 1 todo node = 2 nodes
    expect(flow.getAttribute("data-nodes")).toBe("2");
    // 1 tag-to-todo edge
    expect(flow.getAttribute("data-edges")).toBe("1");
  });

  it("renders Controls and Background", () => {
    render(
      <MindmapView todos={[todo1]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );
    expect(screen.getByTestId("controls")).toBeInTheDocument();
    expect(screen.getByTestId("background")).toBeInTheDocument();
  });

  it("renders empty graph when no todos", () => {
    render(
      <MindmapView todos={[]} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );
    const flow = screen.getByTestId("react-flow");
    expect(flow.getAttribute("data-nodes")).toBe("0");
    expect(flow.getAttribute("data-edges")).toBe("0");
  });
});
