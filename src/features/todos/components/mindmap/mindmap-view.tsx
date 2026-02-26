import { useMemo, useCallback, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  applyNodeChanges,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTagStore } from "@/features/tags/store.ts";
import { useSettingsStore } from "@/features/settings/store.ts";
import { useTodoStore } from "../../store.ts";
import { buildMindmapGraph, assignEdgeHandles } from "./mindmap-graph-utils.ts";
import { CenterNode } from "./center-node.tsx";
import { TagNode } from "./tag-node.tsx";
import { TodoNode } from "./todo-node.tsx";
import { CollapsedTodoGroupNode } from "./collapsed-todo-group-node.tsx";
import { TagActionNode, type ActionChoice } from "./tag-action-node.tsx";
import { TagInputNode } from "./tag-input-node.tsx";
import { TodoInputNode } from "./todo-input-node.tsx";
import { MindmapBreadcrumb } from "./mindmap-breadcrumb.tsx";
import type { Todo } from "../../types.ts";
import type { Tag } from "@/features/tags/types.ts";
import { TAG_COLORS } from "@/features/tags/colors.ts";

export interface MindmapViewProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onTitleClick?: (todo: Todo) => void;
  onEdit?: (todo: Todo) => void;
  onEditTag?: (tag: Tag) => void;
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

interface InputMode {
  tagId: string;
  type: "tag" | "todo";
  parentTodoId?: string | null;
}

const CENTER_ACTION_ID = "__center__";

export function MindmapView({
  todos,
  onToggle,
  onTitleClick,
  onEdit,
  onEditTag,
}: MindmapViewProps) {
  const { tags, createTag } = useTagStore();
  const allTodos = useTodoStore((s) => s.todos);
  const createTodo = useTodoStore((s) => s.createTodo);
  const userName = useSettingsStore((s) => s.userName);
  const layoutMode = useSettingsStore((s) => s.layoutMode);
  const collapseThreshold = useSettingsStore(
    (s) => s.mindmapCollapseThreshold,
  );
  const mindmapSpacing = useSettingsStore((s) => s.mindmapSpacing);

  const [focusTagId, setFocusTagId] = useState<string | null>(null);
  const [actionTagId, setActionTagId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode | null>(null);

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

  const handleEditTodo = useCallback(
    (todoId: string) => {
      const todo = allTodos.find((t) => t.id === todoId);
      if (todo && onEdit) {
        onEdit(todo);
      }
    },
    [allTodos, onEdit],
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

  const handleCenterAddTag = useCallback(() => {
    setInputMode({ tagId: CENTER_ACTION_ID, type: "tag" });
    setActionTagId(null);
  }, []);

  const handleCenterAddTodo = useCallback(() => {
    setInputMode({ tagId: CENTER_ACTION_ID, type: "todo" });
    setActionTagId(null);
  }, []);

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
    async (name: string, color: string, parentId: string | null) => {
      await createTag({
        name,
        color,
        isDefault: false,
        parentId,
      });
      setInputMode(null);
    },
    [createTag],
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

  const handleDirectAddTag = useCallback((tagId: string) => {
    setInputMode({ tagId, type: "tag" });
    setActionTagId(null);
  }, []);

  const handleDirectAddTodo = useCallback((tagId: string) => {
    setInputMode({ tagId, type: "todo" });
    setActionTagId(null);
  }, []);

  const handleTodoAddSubTodo = useCallback(
    (todoId: string) => {
      const todo = allTodos.find((t) => t.id === todoId);
      if (!todo) return;
      const primaryTagId = todo.tagIds[0];
      if (!primaryTagId) return;
      setInputMode({ tagId: primaryTagId, type: "todo", parentTodoId: todoId });
      setActionTagId(null);
    },
    [allTodos],
  );

  const handleTodoZoom = useCallback(
    (todoId: string) => {
      const todo = allTodos.find((t) => t.id === todoId);
      if (!todo) return;
      const primaryTagId = todo.tagIds[0];
      if (!primaryTagId) return;
      setFocusTagId(primaryTagId);
      setActionTagId(null);
      setInputMode(null);
    },
    [allTodos],
  );

  const handleEditTag = useCallback(
    (tagId: string) => {
      const tag = tags.find((t) => t.id === tagId);
      if (tag && onEditTag) {
        onEditTag(tag);
      }
    },
    [tags, onEditTag],
  );

  const handleCancelInput = useCallback(() => {
    setActionTagId(null);
    setInputMode(null);
  }, []);

  const handleCreateTag = useCallback(
    async (name: string, color: string, parentId: string | null) => {
      await createTag({
        name,
        color,
        isDefault: false,
        parentId,
      });
      setInputMode(null);
    },
    [createTag],
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

  const handleCreateSubTodo = useCallback(
    async (_tagId: string, title: string) => {
      if (!inputMode?.parentTodoId) return;
      const parentTodo = allTodos.find((t) => t.id === inputMode.parentTodoId);
      const tagIds = parentTodo?.tagIds ?? [inputMode.tagId];
      await createTodo({
        title,
        description: null,
        tagIds,
        parentId: inputMode.parentTodoId,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
      setInputMode(null);
    },
    [inputMode, allTodos, createTodo],
  );

  const rootLabel = userName ? `${userName}'s To Do` : "My To Do";

  const computedGraph = useMemo(() => {
    const graph = buildMindmapGraph(todos, tags, {
      centerLabel: rootLabel,
      collapseThreshold: focusTagId ? Infinity : collapseThreshold,
      focusTagId,
      spacing: mindmapSpacing,
    });

    // Inject callbacks into node data
    const nodesWithCallbacks = graph.nodes.map((node) => {
      if (node.type === "centerNode") {
        return {
          ...node,
          data: {
            ...node.data,
            onDrillDown: focusTagId ? () => handleDrillDown(focusTagId) : undefined,
            onEditTag: focusTagId ? () => { const t = tags.find((tg) => tg.id === focusTagId); if (t && onEditTag) onEditTag(t); } : undefined,
            onAddTag: handleCenterAddTag,
            onAddTodo: handleCenterAddTodo,
          },
        };
      }
      if (node.type === "collapsedTodoGroupNode") {
        return {
          ...node,
          data: {
            ...node.data,
            onExpand: handleDrillDown,
          },
        };
      }
      if (node.type === "todoNode") {
        return {
          ...node,
          draggable: true,
          data: {
            ...node.data,
            onToggle: handleToggle,
            onTitleClick: handleTitleClick,
            onEdit: handleEditTodo,
            onAddSubTodo: handleTodoAddSubTodo,
            onZoom: handleTodoZoom,
          },
        };
      }
      if (node.type === "tagNode") {
        return {
          ...node,
          draggable: true,
          data: {
            ...node.data,
            onDrillDown: handleDrillDown,
            onEditTag: handleEditTag,
            onAddTag: handleDirectAddTag,
            onAddTodo: handleDirectAddTodo,
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
          sourceHandle: "source-bottom",
          targetHandle: "target-top",
          style: { stroke: "var(--color-primary)", strokeDasharray: "4 2" },
        });
      }
    }

    // Inject ephemeral input node
    if (inputMode) {
      // When creating a sub-todo, anchor below the parent todo node
      const isSubTodo = !!inputMode.parentTodoId;
      let anchor: { node: Node; sourceId: string } | null = null;
      if (isSubTodo) {
        const todoNode = nodesWithCallbacks.find((n) => n.id === `todo-${inputMode.parentTodoId}`);
        if (todoNode) anchor = { node: todoNode, sourceId: `todo-${inputMode.parentTodoId}` };
      } else {
        anchor = findAnchor(inputMode.tagId);
      }
      if (anchor) {
        const inputNodeId =
          inputMode.type === "tag"
            ? `input-tag-${inputMode.tagId}`
            : isSubTodo
              ? `input-subtodo-${inputMode.parentTodoId}`
              : `input-todo-${inputMode.tagId}`;
        const inputNodeType =
          inputMode.type === "tag" ? "tagInputNode" : "todoInputNode";
        const isCenter = inputMode.tagId === CENTER_ACTION_ID;

        const onCreateTodo = isSubTodo
          ? handleCreateSubTodo
          : isCenter
            ? handleCreateRootTodo
            : handleCreateTodo;

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
                  defaultParentId: isCenter ? (focusTagId ?? null) : inputMode.tagId,
                  defaultColor: TAG_COLORS[tags.length % TAG_COLORS.length]!,
                  tags,
                  onCreateTag: isCenter ? handleCreateRootTag : handleCreateTag,
                  onCancel: handleCancelInput,
                }
              : {
                  tagId: inputMode.tagId,
                  onCreateTodo,
                  onCancel: handleCancelInput,
                },
        });
        resultEdges.push({
          id: `edge-${anchor.sourceId}-input`,
          source: anchor.sourceId,
          target: inputNodeId,
          sourceHandle: "source-bottom",
          targetHandle: "target-top",
          style: { stroke: "var(--color-primary)", strokeDasharray: "4 2" },
        });
      }
    }

    return { nodes: nodesWithCallbacks, edges: resultEdges };
  }, [
    todos,
    tags,
    rootLabel,
    collapseThreshold,
    mindmapSpacing,
    focusTagId,
    actionTagId,
    inputMode,
    layoutMode,
    handleToggle,
    handleTitleClick,
    handleEditTodo,
    handleDrillDown,
    handleAddAction,
    handleCenterAddAction,
    handleCenterAddTag,
    handleCenterAddTodo,
    handleSelectAction,
    handleCancelInput,
    handleCreateTag,
    handleCreateTodo,
    handleCreateSubTodo,
    handleCreateRootTag,
    handleCreateRootTodo,
    handleDirectAddTag,
    handleDirectAddTodo,
    handleEditTag,
    handleTodoAddSubTodo,
    handleTodoZoom,
  ]);

  // Interactive node state: allows tag nodes to be dragged while
  // resetting positions whenever the computed graph changes.
  const [interactiveNodes, setInteractiveNodes] = useState<Node[]>(
    computedGraph.nodes,
  );
  const [prevComputedNodes, setPrevComputedNodes] = useState(computedGraph.nodes);
  if (prevComputedNodes !== computedGraph.nodes) {
    setPrevComputedNodes(computedGraph.nodes);
    setInteractiveNodes(computedGraph.nodes);
  }

  // Derive edges from current (possibly dragged) node positions so
  // edge handles stay optimal after a tag node is moved.
  const activeEdges = useMemo(() => {
    const edgeCopies = computedGraph.edges.map((e) => ({ ...e }));
    assignEdgeHandles(interactiveNodes, edgeCopies);
    return edgeCopies;
  }, [interactiveNodes, computedGraph.edges]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setInteractiveNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <MindmapBreadcrumb
        focusTagId={focusTagId}
        tags={tags}
        rootLabel={rootLabel}
        onNavigate={handleBreadcrumbNavigate}
      />
      <div
        className="h-[calc(100vh-9.5rem)] w-full overflow-hidden rounded-lg border border-[var(--color-border)]"
        style={
          {
            "--xy-background-color": "var(--color-bg)",
            "--xy-node-border-radius": "8px",
          } as React.CSSProperties
        }
        data-testid="mindmap-container"
      >
        <ReactFlow
          nodes={interactiveNodes}
          edges={activeEdges}
          onNodesChange={onNodesChange}
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
