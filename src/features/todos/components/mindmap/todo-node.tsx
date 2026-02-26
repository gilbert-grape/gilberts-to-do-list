import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { cn } from "@/shared/utils/index.ts";

interface TodoNodeData {
  todoId: string;
  label: string;
  completed: boolean;
  onToggle?: (todoId: string) => void;
  onTitleClick?: (todoId: string) => void;
  onEdit?: (todoId: string) => void;
  onAddSubTodo?: (todoId: string) => void;
  onZoom?: (todoId: string) => void;
  [key: string]: unknown;
}

const hiddenHandle = { opacity: 0, pointerEvents: "none" as const };

function stopEvent(e: React.MouseEvent | React.PointerEvent) {
  e.stopPropagation();
  e.nativeEvent.stopImmediatePropagation();
}

export function TodoNode({ data }: NodeProps) {
  const { todoId, label, completed, onToggle, onTitleClick, onEdit, onAddSubTodo, onZoom } =
    data as TodoNodeData;

  return (
    <div
      className={cn(
        "group relative flex min-w-[6rem] items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-sm",
        completed && "opacity-60",
      )}
      data-testid="todo-node"
    >
      <Handle type="target" position={Position.Top} style={hiddenHandle} id="target-top" />
      <Handle type="target" position={Position.Bottom} style={hiddenHandle} id="target-bottom" />
      <Handle type="target" position={Position.Left} style={hiddenHandle} id="target-left" />
      <Handle type="target" position={Position.Right} style={hiddenHandle} id="target-right" />
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
      {!completed && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-end gap-1 px-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => { stopEvent(e); onZoom?.(todoId); }}
            onMouseDown={stopEvent}
            onPointerDown={stopEvent}
            className="nodrag nopan nowheel flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs text-white transition-colors hover:scale-110"
            style={{ pointerEvents: "all" }}
            aria-label={`Zoom into ${label}`}
            data-testid="todo-zoom-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <button
            type="button"
            onClick={(e) => { stopEvent(e); onEdit?.(todoId); }}
            onMouseDown={stopEvent}
            onPointerDown={stopEvent}
            className="nodrag nopan nowheel flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs text-white transition-colors hover:scale-110"
            style={{ pointerEvents: "all" }}
            aria-label={`Edit ${label}`}
            data-testid="todo-edit-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </button>
          {onAddSubTodo && (
            <button
              type="button"
              onClick={(e) => { stopEvent(e); onAddSubTodo(todoId); }}
              onMouseDown={stopEvent}
              onPointerDown={stopEvent}
              className="nodrag nopan nowheel flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs text-white transition-colors hover:scale-110"
              style={{ pointerEvents: "all" }}
              aria-label={`Add sub-todo to ${label}`}
              data-testid="todo-add-subtodo-button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" /></svg>
            </button>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Top} style={hiddenHandle} id="source-top" />
      <Handle type="source" position={Position.Bottom} style={hiddenHandle} id="source-bottom" />
      <Handle type="source" position={Position.Left} style={hiddenHandle} id="source-left" />
      <Handle type="source" position={Position.Right} style={hiddenHandle} id="source-right" />
    </div>
  );
}
