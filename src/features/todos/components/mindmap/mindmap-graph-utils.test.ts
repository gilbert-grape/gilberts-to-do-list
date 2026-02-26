import { describe, it, expect } from "vitest";
import { buildMindmapGraph } from "./mindmap-graph-utils.ts";
import { buildBreadcrumbPath } from "./mindmap-breadcrumb-utils.ts";
import { getContrastColor } from "@/shared/utils/color.ts";
import type { Todo } from "../../types.ts";
import type { Tag } from "@/features/tags/types.ts";

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
  describe("center node", () => {
    it("always creates a center node at position (0,0)", () => {
      const { nodes } = buildMindmapGraph([], []);
      const center = nodes.find((n) => n.id === "center");
      expect(center).toBeDefined();
      expect(center!.type).toBe("centerNode");
      expect(center!.position).toEqual({ x: 0, y: 0 });
    });

    it("uses default label when none provided", () => {
      const { nodes } = buildMindmapGraph([], []);
      const center = nodes.find((n) => n.id === "center");
      expect(center!.data.label).toBe("My To Do");
    });

    it("uses custom center label", () => {
      const { nodes } = buildMindmapGraph([], [], "Löli's To Do");
      const center = nodes.find((n) => n.id === "center");
      expect(center!.data.label).toBe("Löli's To Do");
    });
  });

  describe("empty and minimal inputs", () => {
    it("returns only center node for empty inputs", () => {
      const { nodes, edges } = buildMindmapGraph([], []);
      expect(nodes).toHaveLength(1);
      expect(edges).toHaveLength(0);
    });

    it("shows all tags even when no todos exist", () => {
      const { nodes, edges } = buildMindmapGraph([], [tag1, tag2]);
      expect(nodes).toHaveLength(3); // center + 2 tags
      expect(edges).toHaveLength(2); // center → tag1, center → tag2
    });
  });

  describe("tag nodes", () => {
    it("creates tag nodes for all tags", () => {
      const todo = makeTodo({ id: "t1", title: "Task 1" });
      const { nodes } = buildMindmapGraph([todo], [tag1, tag2]);

      const tagNodes = nodes.filter((n) => n.type === "tagNode");
      expect(tagNodes).toHaveLength(2);
      expect(tagNodes.map((n) => n.id)).toContain("tag-tag-1");
      expect(tagNodes.map((n) => n.id)).toContain("tag-tag-2");
    });

    it("shows empty tags without todos", () => {
      const todo = makeTodo({ id: "t1", title: "Task 1", tagIds: ["tag-1"] });
      const { nodes } = buildMindmapGraph([todo], [tag1, tag2]);

      const tagNodes = nodes.filter((n) => n.type === "tagNode");
      expect(tagNodes).toHaveLength(2);
    });

    it("positions root tags radially around center (not at origin)", () => {
      const todo1 = makeTodo({ id: "t1", title: "T1", tagIds: ["tag-1"] });
      const todo2 = makeTodo({ id: "t2", title: "T2", tagIds: ["tag-2"] });
      const { nodes } = buildMindmapGraph([todo1, todo2], [tag1, tag2]);

      const tagNodes = nodes.filter((n) => n.type === "tagNode");
      expect(tagNodes).toHaveLength(2);

      // Both tag nodes should be at a distance from center, not at (0,0)
      for (const tagNode of tagNodes) {
        const dist = Math.sqrt(
          tagNode.position.x ** 2 + tagNode.position.y ** 2,
        );
        expect(dist).toBeGreaterThan(50);
      }
    });

    it("creates edges from center to root tags", () => {
      const todo = makeTodo({ id: "t1", title: "Task 1" });
      const { edges } = buildMindmapGraph([todo], [tag1]);

      const centerEdges = edges.filter((e) => e.source === "center");
      expect(centerEdges).toHaveLength(1);
      expect(centerEdges[0]!.target).toBe("tag-tag-1");
      expect(centerEdges[0]!.style?.stroke).toBe("#3b82f6");
    });
  });

  describe("todo nodes", () => {
    it("creates todo nodes positioned away from center", () => {
      const todo = makeTodo({ id: "t1", title: "Task 1" });
      const { nodes } = buildMindmapGraph([todo], [tag1]);

      const todoNode = nodes.find((n) => n.id === "todo-t1");
      expect(todoNode).toBeDefined();
      expect(todoNode!.data.label).toBe("Task 1");

      // Todo should be further from center than its tag
      const tagNode = nodes.find((n) => n.id === "tag-tag-1");
      const tagDist = Math.sqrt(
        tagNode!.position.x ** 2 + tagNode!.position.y ** 2,
      );
      const todoDist = Math.sqrt(
        todoNode!.position.x ** 2 + todoNode!.position.y ** 2,
      );
      expect(todoDist).toBeGreaterThan(tagDist);
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
  });

  describe("edges", () => {
    it("creates edges from tags to root todos using tag color", () => {
      const todo = makeTodo({ id: "t1", title: "Task 1" });
      const { edges } = buildMindmapGraph([todo], [tag1]);

      const tagTodoEdges = edges.filter(
        (e) => e.id.startsWith("edge-tag-") && e.target === "todo-t1",
      );
      expect(tagTodoEdges).toHaveLength(1);
      expect(tagTodoEdges[0]!.source).toBe("tag-tag-1");
      expect(tagTodoEdges[0]!.style?.stroke).toBe("#3b82f6");
    });

    it("creates parent-child edges with neutral color", () => {
      const parent = makeTodo({ id: "t1", title: "Parent" });
      const child = makeTodo({ id: "t2", title: "Child", parentId: "t1" });
      const { edges } = buildMindmapGraph([parent, child], [tag1]);

      const parentEdges = edges.filter((e) =>
        e.id.startsWith("edge-parent-"),
      );
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

      const tagEdges = edges.filter(
        (e) => e.id.startsWith("edge-tag-") && e.target === "todo-t1",
      );
      expect(tagEdges).toHaveLength(2);
      expect(tagEdges.map((e) => e.source).sort()).toEqual([
        "tag-tag-1",
        "tag-tag-2",
      ]);
    });
  });

  describe("child todos", () => {
    it("creates child todo nodes", () => {
      const parent = makeTodo({ id: "t1", title: "Parent" });
      const child = makeTodo({ id: "t2", title: "Child", parentId: "t1" });
      const { nodes } = buildMindmapGraph([parent, child], [tag1]);

      const childNode = nodes.find((n) => n.id === "todo-t2");
      expect(childNode).toBeDefined();
      expect(childNode!.data.label).toBe("Child");
    });

    it("positions child todos further from center than parent", () => {
      const parent = makeTodo({ id: "t1", title: "Parent" });
      const child = makeTodo({ id: "t2", title: "Child", parentId: "t1" });
      const { nodes } = buildMindmapGraph([parent, child], [tag1]);

      const parentNode = nodes.find((n) => n.id === "todo-t1");
      const childNode = nodes.find((n) => n.id === "todo-t2");

      const parentDist = Math.sqrt(
        parentNode!.position.x ** 2 + parentNode!.position.y ** 2,
      );
      const childDist = Math.sqrt(
        childNode!.position.x ** 2 + childNode!.position.y ** 2,
      );
      expect(childDist).toBeGreaterThan(parentDist);
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

      const rootNode = nodes.find((n) => n.id === "todo-t1");
      const childNode = nodes.find((n) => n.id === "todo-t2");
      const gcNode = nodes.find((n) => n.id === "todo-t3");

      expect(rootNode).toBeDefined();
      expect(childNode).toBeDefined();
      expect(gcNode).toBeDefined();

      // Each level should be further from center
      const rootDist = Math.sqrt(
        rootNode!.position.x ** 2 + rootNode!.position.y ** 2,
      );
      const childDist = Math.sqrt(
        childNode!.position.x ** 2 + childNode!.position.y ** 2,
      );
      const gcDist = Math.sqrt(
        gcNode!.position.x ** 2 + gcNode!.position.y ** 2,
      );
      expect(childDist).toBeGreaterThan(rootDist);
      expect(gcDist).toBeGreaterThan(childDist);
    });
  });

  describe("tag hierarchy", () => {
    it("places child tags further from center than root tags", () => {
      const childTag: Tag = {
        id: "tag-child",
        name: "Sub-Work",
        color: "#60a5fa",
        isDefault: false,
        parentId: "tag-1",
      };
      const todo = makeTodo({
        id: "t1",
        title: "Task",
        tagIds: ["tag-child"],
      });
      const { nodes } = buildMindmapGraph([todo], [tag1, childTag]);

      const rootTagNode = nodes.find((n) => n.id === "tag-tag-1");
      const childTagNode = nodes.find((n) => n.id === "tag-tag-child");

      const rootDist = Math.sqrt(
        rootTagNode!.position.x ** 2 + rootTagNode!.position.y ** 2,
      );
      const childDist = Math.sqrt(
        childTagNode!.position.x ** 2 + childTagNode!.position.y ** 2,
      );
      expect(childDist).toBeGreaterThan(rootDist);
    });

    it("creates edges between parent and child tags", () => {
      const childTag: Tag = {
        id: "tag-child",
        name: "Sub-Work",
        color: "#60a5fa",
        isDefault: false,
        parentId: "tag-1",
      };
      const todo = makeTodo({
        id: "t1",
        title: "Task",
        tagIds: ["tag-child"],
      });
      const { edges } = buildMindmapGraph([todo], [tag1, childTag]);

      const subtagEdges = edges.filter(
        (e) => e.id.startsWith("edge-tag-") && e.id.includes("-subtag-"),
      );
      expect(subtagEdges).toHaveLength(1);
      expect(subtagEdges[0]!.source).toBe("tag-tag-1");
      expect(subtagEdges[0]!.target).toBe("tag-tag-child");
      expect(subtagEdges[0]!.style?.stroke).toBe("#3b82f6"); // parent's color
    });

    it("activates ancestor tags even without direct todos", () => {
      const childTag: Tag = {
        id: "tag-child",
        name: "Sub-Work",
        color: "#60a5fa",
        isDefault: false,
        parentId: "tag-1",
      };
      // Only child tag has a todo, parent should still appear
      const todo = makeTodo({
        id: "t1",
        title: "Task",
        tagIds: ["tag-child"],
      });
      const { nodes } = buildMindmapGraph([todo], [tag1, childTag]);

      const tagNodes = nodes.filter((n) => n.type === "tagNode");
      expect(tagNodes).toHaveLength(2);
    });

    it("positions todos further out than the deepest tag in their chain", () => {
      const childTag: Tag = {
        id: "tag-child",
        name: "Sub-Work",
        color: "#60a5fa",
        isDefault: false,
        parentId: "tag-1",
      };
      const todo = makeTodo({
        id: "t1",
        title: "Task",
        tagIds: ["tag-child"],
      });
      const { nodes } = buildMindmapGraph([todo], [tag1, childTag]);

      const childTagNode = nodes.find((n) => n.id === "tag-tag-child");
      const todoNode = nodes.find((n) => n.id === "todo-t1");

      const tagDist = Math.sqrt(
        childTagNode!.position.x ** 2 + childTagNode!.position.y ** 2,
      );
      const todoDist = Math.sqrt(
        todoNode!.position.x ** 2 + todoNode!.position.y ** 2,
      );
      expect(todoDist).toBeGreaterThan(tagDist);
    });
  });

  describe("collapse threshold", () => {
    it("renders individual todos when count is at threshold", () => {
      const todos = Array.from({ length: 3 }, (_, i) =>
        makeTodo({ id: `t${i}`, title: `Task ${i}` }),
      );
      const { nodes } = buildMindmapGraph(todos, [tag1], {
        collapseThreshold: 3,
      });

      const todoNodes = nodes.filter((n) => n.type === "todoNode");
      const collapsedNodes = nodes.filter(
        (n) => n.type === "collapsedTodoGroupNode",
      );
      expect(todoNodes).toHaveLength(3);
      expect(collapsedNodes).toHaveLength(0);
    });

    it("collapses todos when count exceeds threshold", () => {
      const todos = Array.from({ length: 4 }, (_, i) =>
        makeTodo({ id: `t${i}`, title: `Task ${i}` }),
      );
      const { nodes } = buildMindmapGraph(todos, [tag1], {
        collapseThreshold: 3,
      });

      const todoNodes = nodes.filter((n) => n.type === "todoNode");
      const collapsedNodes = nodes.filter(
        (n) => n.type === "collapsedTodoGroupNode",
      );
      expect(todoNodes).toHaveLength(0);
      expect(collapsedNodes).toHaveLength(1);
      expect(collapsedNodes[0]!.data.count).toBe(4);
    });

    it("includes completed count in collapsed node data", () => {
      const todos = [
        makeTodo({ id: "t1", title: "Open 1" }),
        makeTodo({ id: "t2", title: "Open 2" }),
        makeTodo({
          id: "t3",
          title: "Done",
          status: "completed",
          completedAt: "2026-02-10T15:00:00.000Z",
        }),
        makeTodo({ id: "t4", title: "Open 3" }),
      ];
      const { nodes } = buildMindmapGraph(todos, [tag1], {
        collapseThreshold: 3,
      });

      const collapsed = nodes.find(
        (n) => n.type === "collapsedTodoGroupNode",
      );
      expect(collapsed).toBeDefined();
      expect(collapsed!.data.count).toBe(4);
      expect(collapsed!.data.completedCount).toBe(1);
    });

    it("creates edge from tag to collapsed node", () => {
      const todos = Array.from({ length: 4 }, (_, i) =>
        makeTodo({ id: `t${i}`, title: `Task ${i}` }),
      );
      const { edges } = buildMindmapGraph(todos, [tag1], {
        collapseThreshold: 3,
      });

      const collapsedEdges = edges.filter((e) =>
        e.target.startsWith("collapsed-"),
      );
      expect(collapsedEdges).toHaveLength(1);
      expect(collapsedEdges[0]!.source).toBe("tag-tag-1");
    });

    it("does not collapse when no threshold is set", () => {
      const todos = Array.from({ length: 20 }, (_, i) =>
        makeTodo({ id: `t${i}`, title: `Task ${i}` }),
      );
      const { nodes } = buildMindmapGraph(todos, [tag1]);

      const todoNodes = nodes.filter((n) => n.type === "todoNode");
      const collapsedNodes = nodes.filter(
        (n) => n.type === "collapsedTodoGroupNode",
      );
      expect(todoNodes).toHaveLength(20);
      expect(collapsedNodes).toHaveLength(0);
    });

    it("collapses per tag independently", () => {
      const todos = [
        // 4 todos for tag1 → should collapse
        ...Array.from({ length: 4 }, (_, i) =>
          makeTodo({ id: `t1-${i}`, title: `Work ${i}`, tagIds: ["tag-1"] }),
        ),
        // 2 todos for tag2 → should not collapse
        ...Array.from({ length: 2 }, (_, i) =>
          makeTodo({ id: `t2-${i}`, title: `Personal ${i}`, tagIds: ["tag-2"] }),
        ),
      ];
      const { nodes } = buildMindmapGraph(todos, [tag1, tag2], {
        collapseThreshold: 3,
      });

      const todoNodes = nodes.filter((n) => n.type === "todoNode");
      const collapsedNodes = nodes.filter(
        (n) => n.type === "collapsedTodoGroupNode",
      );
      expect(todoNodes).toHaveLength(2); // tag2's todos
      expect(collapsedNodes).toHaveLength(1); // tag1's collapsed
    });
  });

  describe("no overlapping todos", () => {
    it("sibling todos under the same tag have sufficient separation", () => {
      const todos = Array.from({ length: 5 }, (_, i) =>
        makeTodo({ id: `t${i}`, title: `Task ${i}` }),
      );
      const { nodes } = buildMindmapGraph(todos, [tag1]);

      const todoNodes = nodes.filter((n) => n.type === "todoNode");
      expect(todoNodes).toHaveLength(5);

      // Every pair of todo nodes should be at least 50px apart
      for (let i = 0; i < todoNodes.length; i++) {
        for (let j = i + 1; j < todoNodes.length; j++) {
          const dx = todoNodes[i]!.position.x - todoNodes[j]!.position.x;
          const dy = todoNodes[i]!.position.y - todoNodes[j]!.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          expect(dist).toBeGreaterThan(50);
        }
      }
    });

    it("todos from different tags do not overlap", () => {
      const todos = [
        ...Array.from({ length: 3 }, (_, i) =>
          makeTodo({ id: `t1-${i}`, title: `Work ${i}`, tagIds: ["tag-1"] }),
        ),
        ...Array.from({ length: 3 }, (_, i) =>
          makeTodo({ id: `t2-${i}`, title: `Personal ${i}`, tagIds: ["tag-2"] }),
        ),
      ];
      const { nodes } = buildMindmapGraph(todos, [tag1, tag2]);

      const todoNodes = nodes.filter((n) => n.type === "todoNode");
      expect(todoNodes).toHaveLength(6);

      // Every pair of todo nodes should be at least 40px apart
      for (let i = 0; i < todoNodes.length; i++) {
        for (let j = i + 1; j < todoNodes.length; j++) {
          const dx = todoNodes[i]!.position.x - todoNodes[j]!.position.x;
          const dy = todoNodes[i]!.position.y - todoNodes[j]!.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          expect(dist).toBeGreaterThan(40);
        }
      }
    });
  });

  describe("spacing presets", () => {
    it("positions nodes further out with larger spacing", () => {
      const todo = makeTodo({ id: "t1", title: "Task 1" });

      const smallGraph = buildMindmapGraph([todo], [tag1], { spacing: "small" });
      const largeGraph = buildMindmapGraph([todo], [tag1], { spacing: "large" });

      const smallTag = smallGraph.nodes.find((n) => n.id === "tag-tag-1")!;
      const largeTag = largeGraph.nodes.find((n) => n.id === "tag-tag-1")!;

      const smallDist = Math.sqrt(smallTag.position.x ** 2 + smallTag.position.y ** 2);
      const largeDist = Math.sqrt(largeTag.position.x ** 2 + largeTag.position.y ** 2);
      expect(largeDist).toBeGreaterThan(smallDist);

      const smallTodo = smallGraph.nodes.find((n) => n.id === "todo-t1")!;
      const largeTodo = largeGraph.nodes.find((n) => n.id === "todo-t1")!;

      const smallTodoDist = Math.sqrt(smallTodo.position.x ** 2 + smallTodo.position.y ** 2);
      const largeTodoDist = Math.sqrt(largeTodo.position.x ** 2 + largeTodo.position.y ** 2);
      expect(largeTodoDist).toBeGreaterThan(smallTodoDist);
    });
  });

  describe("drill-down (focusTagId)", () => {
    const childTag: Tag = {
      id: "tag-child",
      name: "Sub-Work",
      color: "#60a5fa",
      isDefault: false,
      parentId: "tag-1",
    };

    const grandchildTag: Tag = {
      id: "tag-grandchild",
      name: "Deep-Work",
      color: "#93c5fd",
      isDefault: false,
      parentId: "tag-child",
    };

    it("uses focused tag name as center label", () => {
      const todo = makeTodo({ id: "t1", title: "Task", tagIds: ["tag-child"] });
      const { nodes } = buildMindmapGraph(
        [todo],
        [tag1, childTag],
        { focusTagId: "tag-1", centerLabel: "Löli's To Do" },
      );

      const center = nodes.find((n) => n.id === "center");
      expect(center!.data.label).toBe("Work"); // tag1's name, not centerLabel
    });

    it("passes focused tag color to center node", () => {
      const todo = makeTodo({ id: "t1", title: "Task", tagIds: ["tag-child"] });
      const { nodes } = buildMindmapGraph(
        [todo],
        [tag1, childTag],
        { focusTagId: "tag-1" },
      );

      const center = nodes.find((n) => n.id === "center");
      expect(center!.data.color).toBe(tag1.color);
      expect(center!.data.textColor).toBeDefined();
    });

    it("does not pass color to center node at root level", () => {
      const todo = makeTodo({ id: "t1", title: "Task", tagIds: ["tag-1"] });
      const { nodes } = buildMindmapGraph(
        [todo],
        [tag1],
        { focusTagId: null },
      );

      const center = nodes.find((n) => n.id === "center");
      expect(center!.data.color).toBeUndefined();
      expect(center!.data.textColor).toBeUndefined();
    });

    it("shows only direct children of focused tag", () => {
      const todo = makeTodo({ id: "t1", title: "Task", tagIds: ["tag-grandchild"] });
      const { nodes } = buildMindmapGraph(
        [todo],
        [tag1, childTag, grandchildTag],
        { focusTagId: "tag-1" },
      );

      // Should show childTag as a root tag (direct child of focused tag1)
      // Should NOT show tag1 itself (it's the center now)
      const tagNodes = nodes.filter((n) => n.type === "tagNode");
      expect(tagNodes.map((n) => n.id)).toContain("tag-tag-child");
      expect(tagNodes.map((n) => n.id)).not.toContain("tag-tag-1");
    });

    it("shows todos belonging to focused tag directly", () => {
      const todo = makeTodo({ id: "t1", title: "Direct", tagIds: ["tag-1"] });
      const { nodes } = buildMindmapGraph(
        [todo],
        [tag1],
        { focusTagId: "tag-1" },
      );

      const todoNodes = nodes.filter((n) => n.type === "todoNode");
      expect(todoNodes).toHaveLength(1);
      expect(todoNodes[0]!.data.label).toBe("Direct");
    });

    it("shows todos belonging to descendant tags", () => {
      const todo = makeTodo({ id: "t1", title: "Deep", tagIds: ["tag-child"] });
      const { nodes } = buildMindmapGraph(
        [todo],
        [tag1, childTag],
        { focusTagId: "tag-1" },
      );

      const todoNodes = nodes.filter((n) => n.type === "todoNode");
      expect(todoNodes).toHaveLength(1);
    });

    it("does not show todos from other top-level tags", () => {
      const todo1 = makeTodo({ id: "t1", title: "Work Task", tagIds: ["tag-1"] });
      const todo2 = makeTodo({ id: "t2", title: "Personal Task", tagIds: ["tag-2"] });
      const { nodes } = buildMindmapGraph(
        [todo1, todo2],
        [tag1, tag2],
        { focusTagId: "tag-1" },
      );

      const todoNodes = nodes.filter((n) => n.type === "todoNode");
      expect(todoNodes).toHaveLength(1);
      expect(todoNodes[0]!.data.label).toBe("Work Task");
    });

    it("does not show child todos of irrelevant parent todos", () => {
      const parentTodo = makeTodo({ id: "t-parent", title: "Personal Parent", tagIds: ["tag-2"] });
      const childTodo = makeTodo({ id: "t-child", title: "Personal Child", tagIds: ["tag-2"], parentId: "t-parent" });
      const workTodo = makeTodo({ id: "t-work", title: "Work Task", tagIds: ["tag-1"] });
      const { nodes } = buildMindmapGraph(
        [parentTodo, childTodo, workTodo],
        [tag1, tag2],
        { focusTagId: "tag-1" },
      );

      const todoNodes = nodes.filter((n) => n.type === "todoNode");
      expect(todoNodes).toHaveLength(1);
      expect(todoNodes[0]!.data.label).toBe("Work Task");
    });

    it("falls back to root view when focusTagId is null", () => {
      const todo1 = makeTodo({ id: "t1", title: "T1", tagIds: ["tag-1"] });
      const todo2 = makeTodo({ id: "t2", title: "T2", tagIds: ["tag-2"] });
      const { nodes } = buildMindmapGraph(
        [todo1, todo2],
        [tag1, tag2],
        { focusTagId: null, centerLabel: "My To Do" },
      );

      const center = nodes.find((n) => n.id === "center");
      expect(center!.data.label).toBe("My To Do");
      const tagNodes = nodes.filter((n) => n.type === "tagNode");
      expect(tagNodes).toHaveLength(2); // both root tags visible
    });

    it("includes tagId in tag node data", () => {
      const todo = makeTodo({ id: "t1", title: "Task" });
      const { nodes } = buildMindmapGraph([todo], [tag1]);

      const tagNode = nodes.find((n) => n.id === "tag-tag-1");
      expect(tagNode!.data.tagId).toBe("tag-1");
    });
  });
});

describe("buildBreadcrumbPath", () => {
  const parentTag: Tag = {
    id: "tag-1",
    name: "Work",
    color: "#3b82f6",
    isDefault: true,
    parentId: null,
  };

  const childTag: Tag = {
    id: "tag-child",
    name: "Sub-Work",
    color: "#60a5fa",
    isDefault: false,
    parentId: "tag-1",
  };

  const grandchildTag: Tag = {
    id: "tag-grandchild",
    name: "Deep-Work",
    color: "#93c5fd",
    isDefault: false,
    parentId: "tag-child",
  };

  it("returns only root when focusTagId is null", () => {
    const path = buildBreadcrumbPath(null, [parentTag], "My To Do");
    expect(path).toEqual([{ id: null, label: "My To Do" }]);
  });

  it("returns root + tag for single-level focus", () => {
    const path = buildBreadcrumbPath("tag-1", [parentTag], "My To Do");
    expect(path).toEqual([
      { id: null, label: "My To Do" },
      { id: "tag-1", label: "Work" },
    ]);
  });

  it("returns full chain for deep focus", () => {
    const path = buildBreadcrumbPath(
      "tag-grandchild",
      [parentTag, childTag, grandchildTag],
      "Root",
    );
    expect(path).toEqual([
      { id: null, label: "Root" },
      { id: "tag-1", label: "Work" },
      { id: "tag-child", label: "Sub-Work" },
      { id: "tag-grandchild", label: "Deep-Work" },
    ]);
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
