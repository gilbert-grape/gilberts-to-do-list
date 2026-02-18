import { describe, it, expect } from "vitest";
import { buildMindmapGraph } from "./mindmap-graph-utils.ts";
import { getContrastColor } from "@/shared/utils/color.ts";
import type { Todo } from "../../types.ts";
import type { Tag } from "@/features/tags/types.ts";

const tag1: Tag = {
  id: "tag-1",
  name: "Work",
  color: "#3b82f6",
  isDefault: true,
};

const tag2: Tag = {
  id: "tag-2",
  name: "Personal",
  color: "#22c55e",
  isDefault: false,
};

function makeTodo(
  overrides: Partial<Todo> & { id: string; title: string },
): Todo {
  return {
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
    ...overrides,
  };
}

describe("buildMindmapGraph", () => {
  it("returns empty graph for empty inputs", () => {
    const { nodes, edges } = buildMindmapGraph([], []);
    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
  });

  it("creates tag nodes for tags with todos", () => {
    const todo = makeTodo({ id: "t1", title: "Task 1" });
    const { nodes } = buildMindmapGraph([todo], [tag1, tag2]);

    const tagNodes = nodes.filter((n) => n.type === "tagNode");
    expect(tagNodes).toHaveLength(1);
    expect(tagNodes[0]!.id).toBe("tag-tag-1");
    expect(tagNodes[0]!.data.label).toBe("Work");
  });

  it("does not create tag nodes for tags without todos", () => {
    const todo = makeTodo({ id: "t1", title: "Task 1", tagIds: ["tag-1"] });
    const { nodes } = buildMindmapGraph([todo], [tag1, tag2]);

    const tagNodes = nodes.filter((n) => n.type === "tagNode");
    expect(tagNodes).toHaveLength(1);
  });

  it("creates todo nodes at tier 1 for root todos", () => {
    const todo = makeTodo({ id: "t1", title: "Task 1" });
    const { nodes } = buildMindmapGraph([todo], [tag1]);

    const todoNodes = nodes.filter((n) => n.type === "todoNode");
    expect(todoNodes).toHaveLength(1);
    expect(todoNodes[0]!.data.label).toBe("Task 1");
    expect(todoNodes[0]!.position.y).toBe(120); // tier 1 * TIER_HEIGHT
  });

  it("creates child nodes at tier 2", () => {
    const parent = makeTodo({ id: "t1", title: "Parent" });
    const child = makeTodo({ id: "t2", title: "Child", parentId: "t1" });
    const { nodes } = buildMindmapGraph([parent, child], [tag1]);

    const childNode = nodes.find((n) => n.id === "todo-t2");
    expect(childNode).toBeDefined();
    expect(childNode!.position.y).toBe(240); // tier 2 * TIER_HEIGHT
  });

  it("creates edges from tags to root todos using tag color", () => {
    const todo = makeTodo({ id: "t1", title: "Task 1" });
    const { edges } = buildMindmapGraph([todo], [tag1]);

    const tagEdges = edges.filter((e) => e.id.startsWith("edge-tag-"));
    expect(tagEdges).toHaveLength(1);
    expect(tagEdges[0]!.source).toBe("tag-tag-1");
    expect(tagEdges[0]!.target).toBe("todo-t1");
    expect(tagEdges[0]!.style?.stroke).toBe("#3b82f6");
  });

  it("creates parent-child edges with neutral color", () => {
    const parent = makeTodo({ id: "t1", title: "Parent" });
    const child = makeTodo({ id: "t2", title: "Child", parentId: "t1" });
    const { edges } = buildMindmapGraph([parent, child], [tag1]);

    const parentEdges = edges.filter((e) => e.id.startsWith("edge-parent-"));
    expect(parentEdges).toHaveLength(1);
    expect(parentEdges[0]!.source).toBe("todo-t1");
    expect(parentEdges[0]!.target).toBe("todo-t2");
    expect(parentEdges[0]!.style?.stroke).toBe("#888888");
  });

  it("handles multi-tag todos with multiple edges", () => {
    const todo = makeTodo({
      id: "t1",
      title: "Multi-tag",
      tagIds: ["tag-1", "tag-2"],
    });
    const { edges } = buildMindmapGraph([todo], [tag1, tag2]);

    const tagEdges = edges.filter((e) => e.id.startsWith("edge-tag-"));
    expect(tagEdges).toHaveLength(2);
    expect(tagEdges.map((e) => e.source).sort()).toEqual([
      "tag-tag-1",
      "tag-tag-2",
    ]);
  });

  it("creates only one node for multi-tag todo", () => {
    const todo = makeTodo({
      id: "t1",
      title: "Multi-tag",
      tagIds: ["tag-1", "tag-2"],
    });
    const { nodes } = buildMindmapGraph([todo], [tag1, tag2]);

    const todoNodes = nodes.filter((n) => n.type === "todoNode");
    expect(todoNodes).toHaveLength(1);
  });

  it("marks completed todos in node data", () => {
    const todo = makeTodo({
      id: "t1",
      title: "Done",
      status: "completed",
      completedAt: "2026-02-10T15:00:00.000Z",
    });
    const { nodes } = buildMindmapGraph([todo], [tag1]);

    const todoNode = nodes.find((n) => n.id === "todo-t1");
    expect(todoNode!.data.completed).toBe(true);
  });

  it("positions multiple tag nodes with correct spacing", () => {
    const todo1 = makeTodo({ id: "t1", title: "T1", tagIds: ["tag-1"] });
    const todo2 = makeTodo({ id: "t2", title: "T2", tagIds: ["tag-2"] });
    const { nodes } = buildMindmapGraph([todo1, todo2], [tag1, tag2]);

    const tagNodes = nodes
      .filter((n) => n.type === "tagNode")
      .sort((a, b) => a.position.x - b.position.x);
    expect(tagNodes).toHaveLength(2);
    // Second tag node should be offset by TAG_NODE_WIDTH + TAG_NODE_GAP = 160
    expect(tagNodes[1]!.position.x - tagNodes[0]!.position.x).toBe(160);
  });

  it("handles deep nesting (3 levels)", () => {
    const root = makeTodo({ id: "t1", title: "Root" });
    const child = makeTodo({ id: "t2", title: "Child", parentId: "t1" });
    const grandchild = makeTodo({
      id: "t3",
      title: "Grandchild",
      parentId: "t2",
    });
    const { nodes } = buildMindmapGraph([root, child, grandchild], [tag1]);

    const gcNode = nodes.find((n) => n.id === "todo-t3");
    expect(gcNode!.position.y).toBe(360); // tier 3 * TIER_HEIGHT
  });
});

describe("getContrastColor", () => {
  it("returns white for dark colors", () => {
    expect(getContrastColor("#000000")).toBe("#ffffff");
    expect(getContrastColor("#3b82f6")).toBe("#ffffff");
  });

  it("returns black for light colors", () => {
    expect(getContrastColor("#ffffff")).toBe("#000000");
    expect(getContrastColor("#eab308")).toBe("#000000");
  });
});
