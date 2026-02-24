import type { Node, Edge } from "@xyflow/react";
import type { Todo } from "../../types.ts";
import type { Tag } from "@/features/tags/types.ts";
import { getContrastColor } from "@/shared/utils/index.ts";

export interface MindmapGraph {
  nodes: Node[];
  edges: Edge[];
}

// Layout constants
const RING_RADIUS_BASE = 200;
const RING_RADIUS_STEP = 180;
const TODO_RING_EXTRA = 160;

function getDescendantTagIds(tagId: string, tags: Tag[]): string[] {
  const children = tags.filter((t) => t.parentId === tagId);
  return children.flatMap((c) => [c.id, ...getDescendantTagIds(c.id, tags)]);
}

/** Convert polar coordinates to cartesian (x, y) */
function polarToCartesian(
  angle: number,
  radius: number,
): { x: number; y: number } {
  return {
    x: Math.round(radius * Math.cos(angle)),
    y: Math.round(radius * Math.sin(angle)),
  };
}

/**
 * Distribute items evenly across an angular range.
 * Returns center angles for each item.
 */
function distributeAngles(
  count: number,
  startAngle: number,
  endAngle: number,
): number[] {
  if (count === 0) return [];
  if (count === 1) return [(startAngle + endAngle) / 2];
  const step = (endAngle - startAngle) / count;
  return Array.from({ length: count }, (_, i) => startAngle + step * (i + 0.5));
}

/**
 * Given a source and target position, pick the best handle pair.
 * The source handle faces toward the target; the target handle faces toward the source.
 */
function pickHandles(
  src: { x: number; y: number },
  tgt: { x: number; y: number },
): { sourceHandle: string; targetHandle: string } {
  const dx = tgt.x - src.x;
  const dy = tgt.y - src.y;
  const angle = Math.atan2(dy, dx); // radians, 0 = right, PI/2 = down

  // Quadrants: right (-45°..45°), down (45°..135°), left (135°..-135°), up (-135°..-45°)
  if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
    return { sourceHandle: "source-right", targetHandle: "target-left" };
  } else if (angle >= Math.PI / 4 && angle < (3 * Math.PI) / 4) {
    return { sourceHandle: "source-bottom", targetHandle: "target-top" };
  } else if (angle >= (-3 * Math.PI) / 4 && angle < -Math.PI / 4) {
    return { sourceHandle: "source-top", targetHandle: "target-bottom" };
  } else {
    return { sourceHandle: "source-left", targetHandle: "target-right" };
  }
}

export interface MindmapGraphOptions {
  centerLabel?: string;
  collapseThreshold?: number;
  focusTagId?: string | null;
}

export function buildMindmapGraph(
  todos: Todo[],
  tags: Tag[],
  centerLabelOrOptions?: string | MindmapGraphOptions,
): MindmapGraph {
  const options: MindmapGraphOptions =
    typeof centerLabelOrOptions === "string"
      ? { centerLabel: centerLabelOrOptions }
      : centerLabelOrOptions ?? {};

  const collapseThreshold = options.collapseThreshold ?? Infinity;
  const focusTagId = options.focusTagId ?? null;
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Determine center label
  const focusTag = focusTagId ? tags.find((t) => t.id === focusTagId) : null;
  const centerLabel = focusTag
    ? focusTag.name
    : (options.centerLabel ?? "My To Do");

  // Always create center node
  nodes.push({
    id: "center",
    type: "centerNode",
    position: { x: 0, y: 0 },
    data: { label: centerLabel },
  });

  if (todos.length === 0 && tags.length === 0) {
    return { nodes, edges };
  }

  // Show all tags in the mindmap (including empty ones)
  const allTagIdSet = new Set(tags.map((t) => t.id));

  // When focused on a tag, only show its direct children as "root" tags
  // and only todos that belong to the focused tag or its descendants
  let rootTags: Tag[];
  let relevantTodoTagIds: Set<string>;

  if (focusTagId && allTagIdSet.has(focusTagId)) {
    rootTags = tags.filter((t) => t.parentId === focusTagId);
    const descendantIds = getDescendantTagIds(focusTagId, tags);
    relevantTodoTagIds = new Set([focusTagId, ...descendantIds]);
  } else {
    rootTags = tags.filter(
      (t) => t.parentId === null || !allTagIdSet.has(t.parentId),
    );
    relevantTodoTagIds = allTagIdSet;
  }

  // BFS to build tag hierarchy with tiers
  interface TagQueueItem {
    tag: Tag;
    tier: number;
    parentAngle: number;
    angleStart: number;
    angleEnd: number;
  }

  // Distribute root tags around full circle (starting from top: -PI/2)
  const rootAngles = distributeAngles(
    rootTags.length,
    -Math.PI,
    Math.PI,
  );

  // Pre-compute todo groupings so the BFS can reserve angular space for todos
  const childrenMap = new Map<string | null, Todo[]>();
  for (const todo of todos) {
    const existing = childrenMap.get(todo.parentId) ?? [];
    existing.push(todo);
    childrenMap.set(todo.parentId, existing);
  }

  const todoIds = new Set(todos.map((t) => t.id));
  const rootTodos = todos.filter(
    (t) => t.parentId === null || !todoIds.has(t.parentId),
  );

  const todosByTag = new Map<string, Todo[]>();
  for (const todo of rootTodos) {
    const primaryTagId = todo.tagIds.find(
      (tid) => allTagIdSet.has(tid) && relevantTodoTagIds.has(tid),
    );
    if (primaryTagId) {
      const group = todosByTag.get(primaryTagId) ?? [];
      group.push(todo);
      todosByTag.set(primaryTagId, group);
    }
  }

  const tagAngleMap = new Map<string, number>();
  const tagTierMap = new Map<string, number>();
  const tagChildAnglesMap = new Map<string, number[]>();
  const tagTodoAngleMap = new Map<string, number>();
  let maxTagTier = 0;

  // Calculate angular weight for each root tag (based on descendant count)
  const rootSliceSize =
    rootTags.length > 0 ? (2 * Math.PI) / rootTags.length : 0;

  const tagQueue: TagQueueItem[] = rootTags.map((tag, i) => ({
    tag,
    tier: 0,
    parentAngle: rootAngles[i]!,
    angleStart: rootAngles[i]! - rootSliceSize / 2,
    angleEnd: rootAngles[i]! + rootSliceSize / 2,
  }));

  let tagIdx = 0;
  while (tagIdx < tagQueue.length) {
    const item = tagQueue[tagIdx]!;
    tagIdx++;

    const { tag, tier, parentAngle, angleStart, angleEnd } = item;
    const radius = RING_RADIUS_BASE + tier * RING_RADIUS_STEP;
    const pos = polarToCartesian(parentAngle, radius);

    tagAngleMap.set(tag.id, parentAngle);
    tagTierMap.set(tag.id, tier);
    if (tier > maxTagTier) maxTagTier = tier;

    nodes.push({
      id: `tag-${tag.id}`,
      type: "tagNode",
      position: pos,
      data: {
        tagId: tag.id,
        label: tag.name,
        color: tag.color,
        textColor: getContrastColor(tag.color),
      },
    });

    // Edge: center → root tag, or parent tag → child tag
    if (tier === 0) {
      edges.push({
        id: `edge-center-tag-${tag.id}`,
        source: "center",
        target: `tag-${tag.id}`,
        style: { stroke: tag.color },
      });
    } else if (tag.parentId && allTagIdSet.has(tag.parentId)) {
      const parentTag = tags.find((t) => t.id === tag.parentId);
      edges.push({
        id: `edge-tag-${tag.parentId}-subtag-${tag.id}`,
        source: `tag-${tag.parentId}`,
        target: `tag-${tag.id}`,
        style: { stroke: parentTag?.color ?? "#888888" },
      });
    }

    // Queue children – reserve an angular slot for todos alongside children
    // so their edges don't cross.
    const children = tags.filter((t) => t.parentId === tag.id);
    const hasTodos = (todosByTag.get(tag.id)?.length ?? 0) > 0;
    const todoSlots = hasTodos ? 1 : 0;
    const totalSlots = children.length + todoSlots;

    if (totalSlots > 0) {
      const allAngles = distributeAngles(totalSlots, angleStart, angleEnd);
      const sliceSize =
        totalSlots > 1
          ? (angleEnd - angleStart) / totalSlots
          : (angleEnd - angleStart);

      // Children get the first N slots
      const childAngles = allAngles.slice(0, children.length);
      tagChildAnglesMap.set(tag.id, childAngles);

      children.forEach((child, ci) => {
        tagQueue.push({
          tag: child,
          tier: tier + 1,
          parentAngle: childAngles[ci]!,
          angleStart: childAngles[ci]! - sliceSize / 2,
          angleEnd: childAngles[ci]! + sliceSize / 2,
        });
      });

      // Todo group gets the last slot
      if (hasTodos) {
        tagTodoAngleMap.set(tag.id, allAngles[children.length]!);
      }
    }
  }

  // Position todos radially around their tag
  const todoAngleMap = new Map<string, number>();
  const todoTierMap = new Map<string, number>();

  // Track which tags are collapsed (todos exceed threshold)
  const collapsedTagIds = new Set<string>();

  for (const [tagId, tagTodos] of todosByTag) {
    const tagAngle = tagAngleMap.get(tagId) ?? 0;
    const tagTier = tagTierMap.get(tagId) ?? 0;
    const todoRadius =
      RING_RADIUS_BASE + tagTier * RING_RADIUS_STEP + TODO_RING_EXTRA;

    // Check if we should collapse this tag's todos
    const collapsedAngle = tagTodoAngleMap.get(tagId) ?? tagAngle;
    if (tagTodos.length > collapseThreshold) {
      collapsedTagIds.add(tagId);
      const pos = polarToCartesian(collapsedAngle, todoRadius);
      const completedCount = tagTodos.filter(
        (t) => t.status === "completed",
      ).length;

      nodes.push({
        id: `collapsed-${tagId}`,
        type: "collapsedTodoGroupNode",
        position: pos,
        data: {
          tagId,
          count: tagTodos.length,
          completedCount,
        },
      });

      const tag = tags.find((t) => t.id === tagId);
      edges.push({
        id: `edge-tag-${tagId}-collapsed-${tagId}`,
        source: `tag-${tagId}`,
        target: `collapsed-${tagId}`,
        style: { stroke: tag?.color ?? "#888888" },
      });
      continue;
    }

    // Use the pre-computed todo angle (allocated alongside children in the BFS)
    // so edges from the same parent don't cross.
    const todoCenter = tagTodoAngleMap.get(tagId) ?? tagAngle;

    const spreadAngle = Math.min(
      Math.PI / 4,
      (tagTodos.length - 1) * 0.15 + 0.1,
    );
    const todoAngles = distributeAngles(
      tagTodos.length,
      todoCenter - spreadAngle,
      todoCenter + spreadAngle,
    );

    tagTodos.forEach((todo, i) => {
      const angle = todoAngles[i]!;
      const pos = polarToCartesian(angle, todoRadius);

      todoAngleMap.set(todo.id, angle);
      todoTierMap.set(todo.id, 0);

      nodes.push({
        id: `todo-${todo.id}`,
        type: "todoNode",
        position: pos,
        data: {
          todoId: todo.id,
          label: todo.title,
          completed: todo.status === "completed",
        },
      });

      // Edges: tag → todo (use tag color)
      for (const tid of todo.tagIds) {
        if (allTagIdSet.has(tid)) {
          const tag = tags.find((t) => t.id === tid);
          const sourceId = tid === focusTagId ? "center" : `tag-${tid}`;
          edges.push({
            id: `edge-tag-${tid}-todo-${todo.id}`,
            source: sourceId,
            target: `todo-${todo.id}`,
            style: { stroke: tag?.color ?? "#888888" },
          });
        }
      }
    });
  }

  // Handle child todos (nested BFS)
  interface TodoQueueItem {
    todo: Todo;
    depth: number;
    parentAngle: number;
    parentRadius: number;
  }

  const todoQueue: TodoQueueItem[] = [];
  for (const todo of rootTodos) {
    // Skip child-todo expansion for collapsed tags
    const primaryTagId = todo.tagIds.find((tid) => allTagIdSet.has(tid));
    if (primaryTagId && collapsedTagIds.has(primaryTagId)) continue;

    const children = childrenMap.get(todo.id) ?? [];
    const angle = todoAngleMap.get(todo.id) ?? 0;
    const parentTagTier = primaryTagId ? (tagTierMap.get(primaryTagId) ?? 0) : 0;
    const radius =
      RING_RADIUS_BASE + parentTagTier * RING_RADIUS_STEP + TODO_RING_EXTRA;

    for (const child of children) {
      todoQueue.push({
        todo: child,
        depth: 1,
        parentAngle: angle,
        parentRadius: radius,
      });
    }
  }

  let todoIdx = 0;
  while (todoIdx < todoQueue.length) {
    const item = todoQueue[todoIdx]!;
    todoIdx++;

    const { todo, depth, parentAngle, parentRadius } = item;
    const radius = parentRadius + TODO_RING_EXTRA * 0.7;
    const pos = polarToCartesian(parentAngle, radius);

    todoAngleMap.set(todo.id, parentAngle);

    nodes.push({
      id: `todo-${todo.id}`,
      type: "todoNode",
      position: pos,
      data: {
        todoId: todo.id,
        label: todo.title,
        completed: todo.status === "completed",
      },
    });

    // Edge: parent todo → child todo
    if (todo.parentId && todoIds.has(todo.parentId)) {
      edges.push({
        id: `edge-parent-${todo.parentId}-child-${todo.id}`,
        source: `todo-${todo.parentId}`,
        target: `todo-${todo.id}`,
        style: { stroke: "#888888" },
      });
    }

    // Queue children of this todo
    const children = childrenMap.get(todo.id) ?? [];
    const spreadAngle = Math.min(
      Math.PI / 6,
      (children.length - 1) * 0.12 + 0.08,
    );
    const childAngles = distributeAngles(
      children.length,
      parentAngle - spreadAngle,
      parentAngle + spreadAngle,
    );

    children.forEach((child, ci) => {
      todoQueue.push({
        todo: child,
        depth: depth + 1,
        parentAngle: childAngles[ci]!,
        parentRadius: radius,
      });
    });
  }

  assignEdgeHandles(nodes, edges);

  return { nodes, edges };
}

/** Assign optimal sourceHandle/targetHandle to edges based on node positions. */
export function assignEdgeHandles(nodes: Node[], edges: Edge[]): void {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  for (const edge of edges) {
    const srcNode = nodeMap.get(edge.source);
    const tgtNode = nodeMap.get(edge.target);
    if (srcNode && tgtNode) {
      const handles = pickHandles(srcNode.position, tgtNode.position);
      edge.sourceHandle = handles.sourceHandle;
      edge.targetHandle = handles.targetHandle;
    }
  }
}
