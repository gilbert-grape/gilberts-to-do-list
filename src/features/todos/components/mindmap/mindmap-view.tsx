import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTagStore } from "@/features/tags/store.ts";
import { useTodoStore } from "../../store.ts";
import { buildMindmapGraph } from "./mindmap-graph-utils.ts";
import { TagNode } from "./tag-node.tsx";
import { TodoNode } from "./todo-node.tsx";
import type { Todo } from "../../types.ts";

export interface MindmapViewProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onTitleClick?: (todo: Todo) => void;
}

const nodeTypes = {
  tagNode: TagNode,
  todoNode: TodoNode,
};

export function MindmapView({
  todos,
  onToggle,
  onTitleClick,
}: MindmapViewProps) {
  const { tags } = useTagStore();
  const allTodos = useTodoStore((s) => s.todos);

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

  const { nodes, edges } = useMemo(() => {
    const graph = buildMindmapGraph(todos, tags);

    // Inject callbacks into todo node data
    const nodesWithCallbacks = graph.nodes.map((node) => {
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
      return node;
    });

    return { nodes: nodesWithCallbacks, edges: graph.edges };
  }, [todos, tags, handleToggle, handleTitleClick]);

  return (
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
  );
}
