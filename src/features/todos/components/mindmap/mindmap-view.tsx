import { useMemo, useCallback, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  startOfDay,
  endOfDay,
  endOfWeek,
  endOfMonth,
  isBefore,
} from "date-fns";
import { useTagStore } from "@/features/tags/store.ts";
import { useSettingsStore } from "@/features/settings/store.ts";
import { useTodoStore } from "../../store.ts";
import { buildMindmapGraph } from "./mindmap-graph-utils.ts";
import { CenterNode } from "./center-node.tsx";
import { TagNode } from "./tag-node.tsx";
import { TodoNode } from "./todo-node.tsx";
import { CollapsedTodoGroupNode } from "./collapsed-todo-group-node.tsx";
import { TagActionNode, type ActionChoice } from "./tag-action-node.tsx";
import { TagInputNode } from "./tag-input-node.tsx";
import { TodoInputNode } from "./todo-input-node.tsx";
import {
  MindmapFilterBar,
  type StatusFilter,
  type DueDateFilter,
} from "./mindmap-filter-bar.tsx";
import { MindmapBreadcrumb } from "./mindmap-breadcrumb.tsx";
import type { Todo } from "../../types.ts";
import { TAG_COLORS } from "@/features/tags/colors.ts";

export interface MindmapViewProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onTitleClick?: (todo: Todo) => void;
}

const nodeTypes = {
  centerNode: CenterNode,
  tagNode: TagNode,
  todoNode: TodoNode,
  collapsedTodoGroupNode: CollapsedTodoGroupNode,
  tagActionNode: TagActionNode,
  tagInputNode: TagInputNode,
  todoInputNode: TodoInputNode,
};

const EPHEMERAL_OFFSET = { x: 0, y: 50 };

function applyStatusFilter(todos: Todo[], filter: StatusFilter): Todo[] {
  if (filter === "open") return todos.filter((t) => t.status === "open");
  if (filter === "completed") return todos.filter((t) => t.status === "completed");
  return todos;
}

function applyDueDateFilter(todos: Todo[], filter: DueDateFilter): Todo[] {
  if (filter === "all") return todos;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  return todos.filter((todo) => {
    if (!todo.dueDate) return false;
    const due = new Date(todo.dueDate);

    switch (filter) {
      case "overdue":
        return isBefore(due, todayStart) && todo.status === "open";
      case "today":
        return due >= todayStart && due <= todayEnd;
      case "thisWeek":
        return due >= todayStart && due <= endOfWeek(now, { weekStartsOn: 1 });
      case "thisMonth":
        return due >= todayStart && due <= endOfMonth(now);
      default:
        return true;
    }
  });
}

interface InputMode {
  tagId: string;
  type: "tag" | "todo";
}

const CENTER_ACTION_ID = "__center__";

export function MindmapView({
  todos,
  onToggle,
  onTitleClick,
}: MindmapViewProps) {
  const { tags, createTag } = useTagStore();
  const allTodos = useTodoStore((s) => s.todos);
  const createTodo = useTodoStore((s) => s.createTodo);
  const userName = useSettingsStore((s) => s.userName);
  const layoutMode = useSettingsStore((s) => s.layoutMode);
  const collapseThreshold = useSettingsStore(
    (s) => s.mindmapCollapseThreshold,
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>("all");
  const [focusTagId, setFocusTagId] = useState<string | null>(null);
  const [actionTagId, setActionTagId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode | null>(null);

  const handleStatusChange = useCallback((filter: StatusFilter) => {
    setStatusFilter(filter);
    if (filter === "completed") {
      setDueDateFilter("all");
    }
  }, []);

  const handleDrillDown = useCallback((tagId: string) => {
    setFocusTagId(tagId);
    setActionTagId(null);
    setInputMode(null);
  }, []);

  const handleBreadcrumbNavigate = useCallback((tagId: string | null) => {
    setFocusTagId(tagId);
    setActionTagId(null);
    setInputMode(null);
  }, []);

  const handleToggle = useCallback(
    (todoId: string) => {
      onToggle(todoId);
    },
    [onToggle],
  );

  const handleTitleClick = useCallback(
    (todoId: string) => {
      const todo = allTodos.find((t) => t.id === todoId);
      if (todo && onTitleClick) {
        onTitleClick(todo);
      }
    },
    [allTodos, onTitleClick],
  );

  const handleAddAction = useCallback(
    (tagId: string) => {
      if (actionTagId === tagId) {
        setActionTagId(null);
      } else {
        setActionTagId(tagId);
        setInputMode(null);
      }
    },
    [actionTagId],
  );

  const handleCenterAddAction = useCallback(() => {
    if (actionTagId === CENTER_ACTION_ID) {
      setActionTagId(null);
    } else {
      setActionTagId(CENTER_ACTION_ID);
      setInputMode(null);
    }
  }, [actionTagId]);

  const handleSelectAction = useCallback(
    (_tagId: string, choice: ActionChoice) => {
      if (actionTagId) {
        setInputMode({ tagId: actionTagId, type: choice });
        setActionTagId(null);
      }
    },
    [actionTagId],
  );

  const handleCreateRootTag = useCallback(
    async (_parentTagId: string, name: string) => {
      const parentId = focusTagId ?? null;
      const colorIndex = tags.length % TAG_COLORS.length;
      await createTag({
        name,
        color: TAG_COLORS[colorIndex]!,
        isDefault: false,
        parentId,
      });
      setInputMode(null);
    },
    [focusTagId, tags.length, createTag],
  );

  const handleCreateRootTodo = useCallback(
    async (_tagId: string, title: string) => {
      const defaultTag = tags.find((t) => t.isDefault);
      const tagId = focusTagId ?? defaultTag?.id ?? tags[0]?.id;
      if (!tagId) return;
      await createTodo({
        title,
        description: null,
        tagIds: [tagId],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      setInputMode(null);
    },
    [focusTagId, tags, createTodo],
  );

  const handleCancelInput = useCallback(() => {
    setActionTagId(null);
    setInputMode(null);
  }, []);

  const handleCreateTag = useCallback(
    async (parentTagId: string, name: string) => {
      const colorIndex = tags.length % TAG_COLORS.length;
      await createTag({
        name,
        color: TAG_COLORS[colorIndex]!,
        isDefault: false,
        parentId: parentTagId,
      });
      setInputMode(null);
    },
    [tags.length, createTag],
  );

  const handleCreateTodo = useCallback(
    async (tagId: string, title: string) => {
      await createTodo({
        title,
        description: null,
        tagIds: [tagId],
        parentId: null,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      setInputMode(null);
    },
    [createTodo],
  );

  const filteredTodos = useMemo(() => {
    let result = applyStatusFilter(todos, statusFilter);
    if (statusFilter !== "completed") {
      result = applyDueDateFilter(result, dueDateFilter);
    }
    return result;
  }, [todos, statusFilter, dueDateFilter]);

  const rootLabel = userName ? `${userName}'s To Do` : "My To Do";

  const { nodes, edges } = useMemo(() => {
    const graph = buildMindmapGraph(filteredTodos, tags, {
      centerLabel: rootLabel,
      collapseThreshold,
      focusTagId,
    });

    // Inject callbacks into node data
    const nodesWithCallbacks = graph.nodes.map((node) => {
      if (node.type === "centerNode") {
        return {
          ...node,
          data: {
            ...node.data,
            onAddAction: handleCenterAddAction,
          },
        };
      }
      if (node.type === "todoNode") {
        return {
          ...node,
          data: {
            ...node.data,
            onToggle: handleToggle,
            onTitleClick: handleTitleClick,
          },
        };
      }
      if (node.type === "tagNode") {
        return {
          ...node,
          data: {
            ...node.data,
            onDrillDown: handleDrillDown,
            onAddAction: handleAddAction,
          },
        };
      }
      return node;
    });

    const resultEdges = [...graph.edges];

    // Helper: find anchor node and source id for action/input
    const findAnchor = (id: string) => {
      if (id === CENTER_ACTION_ID) {
        const centerNode = nodesWithCallbacks.find((n) => n.id === "center");
        return centerNode ? { node: centerNode, sourceId: "center" } : null;
      }
      const tagNode = nodesWithCallbacks.find((n) => n.id === `tag-${id}`);
      return tagNode ? { node: tagNode, sourceId: `tag-${id}` } : null;
    };

    // Inject ephemeral action node
    if (actionTagId) {
      const anchor = findAnchor(actionTagId);
      if (anchor) {
        const actionNodeId = `action-${actionTagId}`;
        nodesWithCallbacks.push({
          id: actionNodeId,
          type: "tagActionNode",
          position: {
            x: anchor.node.position.x + EPHEMERAL_OFFSET.x,
            y: anchor.node.position.y + EPHEMERAL_OFFSET.y,
          },
          data: {
            tagId: actionTagId,
            layoutMode,
            onSelectAction: handleSelectAction,
            onCancel: handleCancelInput,
          },
        });
        resultEdges.push({
          id: `edge-${anchor.sourceId}-action`,
          source: anchor.sourceId,
          target: actionNodeId,
          style: { stroke: "var(--color-primary)", strokeDasharray: "4 2" },
        });
      }
    }

    // Inject ephemeral input node
    if (inputMode) {
      const anchor = findAnchor(inputMode.tagId);
      if (anchor) {
        const inputNodeId =
          inputMode.type === "tag"
            ? `input-tag-${inputMode.tagId}`
            : `input-todo-${inputMode.tagId}`;
        const inputNodeType =
          inputMode.type === "tag" ? "tagInputNode" : "todoInputNode";
        const isCenter = inputMode.tagId === CENTER_ACTION_ID;

        nodesWithCallbacks.push({
          id: inputNodeId,
          type: inputNodeType,
          position: {
            x: anchor.node.position.x + EPHEMERAL_OFFSET.x,
            y: anchor.node.position.y + EPHEMERAL_OFFSET.y,
          },
          data:
            inputMode.type === "tag"
              ? {
                  parentTagId: inputMode.tagId,
                  onCreateTag: isCenter ? handleCreateRootTag : handleCreateTag,
                  onCancel: handleCancelInput,
                }
              : {
                  tagId: inputMode.tagId,
                  onCreateTodo: isCenter ? handleCreateRootTodo : handleCreateTodo,
                  onCancel: handleCancelInput,
                },
        });
        resultEdges.push({
          id: `edge-${anchor.sourceId}-input`,
          source: anchor.sourceId,
          target: inputNodeId,
          style: { stroke: "var(--color-primary)", strokeDasharray: "4 2" },
        });
      }
    }

    return { nodes: nodesWithCallbacks, edges: resultEdges };
  }, [
    filteredTodos,
    tags,
    rootLabel,
    collapseThreshold,
    focusTagId,
    actionTagId,
    inputMode,
    layoutMode,
    handleToggle,
    handleTitleClick,
    handleDrillDown,
    handleAddAction,
    handleCenterAddAction,
    handleSelectAction,
    handleCancelInput,
    handleCreateTag,
    handleCreateTodo,
    handleCreateRootTag,
    handleCreateRootTodo,
  ]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <MindmapFilterBar
          statusFilter={statusFilter}
          dueDateFilter={dueDateFilter}
          onStatusChange={handleStatusChange}
          onDueDateChange={setDueDateFilter}
        />
        <MindmapBreadcrumb
          focusTagId={focusTagId}
          tags={tags}
          rootLabel={rootLabel}
          onNavigate={handleBreadcrumbNavigate}
        />
      </div>
      <div
        className="h-[max(500px,60vh)] w-full overflow-hidden rounded-lg border border-[var(--color-border)]"
        style={
          {
            "--xy-background-color": "var(--color-bg)",
            "--xy-node-border-radius": "8px",
          } as React.CSSProperties
        }
        data-testid="mindmap-container"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Controls showInteractive={false} />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
