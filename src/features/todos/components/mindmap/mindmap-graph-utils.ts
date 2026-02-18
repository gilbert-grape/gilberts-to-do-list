import type { Node, Edge } from "@xyflow/react";
import type { Todo } from "../../types.ts";
import type { Tag } from "@/features/tags/types.ts";
import { getContrastColor } from "@/shared/utils/index.ts";

export interface MindmapGraph {
  nodes: Node[];
  edges: Edge[];
}

const TAG_NODE_WIDTH = 120;
const TAG_NODE_GAP = 40;
const TODO_NODE_WIDTH = 180;
const TODO_NODE_GAP = 20;
const TIER_HEIGHT = 120;

export function buildMindmapGraph(todos: Todo[], tags: Tag[]): MindmapGraph {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Only include tags that have at least one todo
  const activeTags = tags.filter((tag) =>
    todos.some((todo) => todo.tagIds.includes(tag.id)),
  );

  // Tier 0: Tag nodes
  const totalTagWidth =
    activeTags.length * TAG_NODE_WIDTH + (activeTags.length - 1) * TAG_NODE_GAP;
  const tagStartX = -totalTagWidth / 2;

  activeTags.forEach((tag, i) => {
    nodes.push({
      id: `tag-${tag.id}`,
      type: "tagNode",
      position: {
        x: tagStartX + i * (TAG_NODE_WIDTH + TAG_NODE_GAP),
        y: 0,
      },
      data: {
        label: tag.name,
        color: tag.color,
        textColor: getContrastColor(tag.color),
      },
    });
  });

  // Build parent-child map
  const childrenMap = new Map<string | null, Todo[]>();
  for (const todo of todos) {
    const parentKey = todo.parentId;
    const existing = childrenMap.get(parentKey) ?? [];
    existing.push(todo);
    childrenMap.set(parentKey, existing);
  }

  // Root todos: those with no parent, or parent not in the todos list
  const todoIds = new Set(todos.map((t) => t.id));
  const rootTodos = todos.filter(
    (t) => t.parentId === null || !todoIds.has(t.parentId),
  );

  // Position todos by tier using BFS
  interface QueueItem {
    todo: Todo;
    tier: number;
  }

  const queue: QueueItem[] = rootTodos.map((todo) => ({ todo, tier: 1 }));
  const tierGroups = new Map<number, Todo[]>();

  // BFS to assign tiers
  let idx = 0;
  while (idx < queue.length) {
    const item = queue[idx]!;
    idx++;
    const group = tierGroups.get(item.tier) ?? [];
    group.push(item.todo);
    tierGroups.set(item.tier, group);

    const children = childrenMap.get(item.todo.id) ?? [];
    for (const child of children) {
      queue.push({ todo: child, tier: item.tier + 1 });
    }
  }

  // Position each tier's nodes
  for (const [tier, tierTodos] of tierGroups) {
    const totalWidth =
      tierTodos.length * TODO_NODE_WIDTH +
      (tierTodos.length - 1) * TODO_NODE_GAP;
    const startX = -totalWidth / 2;

    tierTodos.forEach((todo, i) => {
      nodes.push({
        id: `todo-${todo.id}`,
        type: "todoNode",
        position: {
          x: startX + i * (TODO_NODE_WIDTH + TODO_NODE_GAP),
          y: tier * TIER_HEIGHT,
        },
        data: {
          todoId: todo.id,
          label: todo.title,
          completed: todo.status === "completed",
        },
      });
    });
  }

  // Edges: tag → root todos (use tag color)
  for (const todo of rootTodos) {
    for (const tagId of todo.tagIds) {
      if (activeTags.some((t) => t.id === tagId)) {
        const tag = activeTags.find((t) => t.id === tagId);
        edges.push({
          id: `edge-tag-${tagId}-todo-${todo.id}`,
          source: `tag-${tagId}`,
          target: `todo-${todo.id}`,
          style: { stroke: tag?.color ?? "#888888" },
        });
      }
    }
  }

  // Edges: parent → child todos (neutral color)
  for (const todo of todos) {
    if (todo.parentId !== null && todoIds.has(todo.parentId)) {
      edges.push({
        id: `edge-parent-${todo.parentId}-child-${todo.id}`,
        source: `todo-${todo.parentId}`,
        target: `todo-${todo.id}`,
        style: { stroke: "#888888" },
      });
    }
  }

  return { nodes, edges };
}
