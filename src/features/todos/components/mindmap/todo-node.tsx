import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { cn } from "@/shared/utils/index.ts";

interface TodoNodeData {
  todoId: string;
  label: string;
  completed: boolean;
  onToggle?: (todoId: string) => void;
  onTitleClick?: (todoId: string) => void;
  onAddSubTodo?: (todoId: string) => void;
  [key: string]: unknown;
}

const hiddenHandle = { opacity: 0, pointerEvents: "none" as const };

function stopEvent(e: React.MouseEvent | React.PointerEvent) {
  e.stopPropagation();
  e.nativeEvent.stopImmediatePropagation();
}

export function TodoNode({ data }: NodeProps) {
  const { todoId, label, completed, onToggle, onTitleClick, onAddSubTodo } =
    data as TodoNodeData;

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-sm",
        completed && "opacity-60",
      )}
      data-testid="todo-node"
    >
      <Handle type="target" position={Position.Top} style={hiddenHandle} id="target-top" />
      <Handle type="target" position={Position.Bottom} style={hiddenHandle} id="target-bottom" />
      <Handle type="target" position={Position.Left} style={hiddenHandle} id="target-left" />
      <Handle type="target" position={Position.Right} style={hiddenHandle} id="target-right" />
      <input
        type="checkbox"
        checked={completed}
        onChange={() => onToggle?.(todoId)}
        onMouseDown={stopEvent}
        onPointerDown={stopEvent}
        className="nodrag nopan nowheel h-4 w-4 shrink-0 accent-[var(--color-success)]"
        style={{ pointerEvents: "all" }}
        aria-label={`Toggle ${label}`}
      />
      <button
        type="button"
        onClick={(e) => { stopEvent(e); onTitleClick?.(todoId); }}
        onMouseDown={stopEvent}
        onPointerDown={stopEvent}
        className={cn(
          "nodrag nopan nowheel truncate text-left text-sm text-[var(--color-text)] hover:underline",
          completed && "line-through text-[var(--color-text-secondary)]",
        )}
        style={{ pointerEvents: "all" }}
      >
        {label}
      </button>
      {!completed && onAddSubTodo && (
        <button
          type="button"
          onClick={(e) => { stopEvent(e); onAddSubTodo(todoId); }}
          onMouseDown={stopEvent}
          onPointerDown={stopEvent}
          className="nodrag nopan nowheel ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-70 hover:!opacity-100"
          style={{ pointerEvents: "all" }}
          aria-label={`Add sub-todo to ${label}`}
          data-testid="todo-add-subtodo-button"
        >
          +
        </button>
      )}
      <Handle type="source" position={Position.Top} style={hiddenHandle} id="source-top" />
      <Handle type="source" position={Position.Bottom} style={hiddenHandle} id="source-bottom" />
      <Handle type="source" position={Position.Left} style={hiddenHandle} id="source-left" />
      <Handle type="source" position={Position.Right} style={hiddenHandle} id="source-right" />
    </div>
  );
}
