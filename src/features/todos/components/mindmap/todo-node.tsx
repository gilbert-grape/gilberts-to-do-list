import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { cn } from "@/shared/utils/index.ts";

interface TodoNodeData {
  todoId: string;
  label: string;
  completed: boolean;
  onToggle?: (todoId: string) => void;
  onTitleClick?: (todoId: string) => void;
  [key: string]: unknown;
}

export function TodoNode({ data }: NodeProps) {
  const { todoId, label, completed, onToggle, onTitleClick } =
    data as TodoNodeData;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-sm",
        completed && "opacity-60",
      )}
      data-testid="todo-node"
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
      <input
        type="checkbox"
        checked={completed}
        onChange={() => onToggle?.(todoId)}
        className="h-4 w-4 shrink-0 accent-[var(--color-success)]"
        aria-label={`Toggle ${label}`}
      />
      <button
        type="button"
        onClick={() => onTitleClick?.(todoId)}
        className={cn(
          "truncate text-left text-sm text-[var(--color-text)] hover:underline",
          completed && "line-through text-[var(--color-text-secondary)]",
        )}
      >
        {label}
      </button>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
    </div>
  );
}
