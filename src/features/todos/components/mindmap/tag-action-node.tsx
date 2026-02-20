import { useCallback } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";

export type ActionChoice = "tag" | "todo";

interface TagActionNodeData {
  tagId: string;
  layoutMode: "normal" | "compact";
  onSelectAction?: (tagId: string, choice: ActionChoice) => void;
  onCancel?: () => void;
  [key: string]: unknown;
}

const hiddenHandle = { opacity: 0, pointerEvents: "none" as const };

function stopEvent(e: React.MouseEvent | React.PointerEvent) {
  e.stopPropagation();
  e.nativeEvent.stopImmediatePropagation();
}

const interactiveClass = "nodrag nopan nowheel";

function NormalActions({
  tagId,
  onSelectAction,
}: {
  tagId: string;
  onSelectAction?: (tagId: string, choice: ActionChoice) => void;
}) {
  return (
    <div className="flex gap-1" data-testid="action-normal">
      <button
        type="button"
        onClick={(e) => { stopEvent(e); onSelectAction?.(tagId, "tag"); }}
        onMouseDown={stopEvent}
        onPointerDown={stopEvent}
        className={`${interactiveClass} rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs font-medium text-[var(--color-text)] shadow-sm transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]`}
        style={{ pointerEvents: "all" }}
        data-testid="action-add-tag"
      >
        + Tag
      </button>
      <button
        type="button"
        onClick={(e) => { stopEvent(e); onSelectAction?.(tagId, "todo"); }}
        onMouseDown={stopEvent}
        onPointerDown={stopEvent}
        className={`${interactiveClass} rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs font-medium text-[var(--color-text)] shadow-sm transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]`}
        style={{ pointerEvents: "all" }}
        data-testid="action-add-todo"
      >
        + To-Do
      </button>
    </div>
  );
}

function RadialActions({
  tagId,
  onSelectAction,
}: {
  tagId: string;
  onSelectAction?: (tagId: string, choice: ActionChoice) => void;
}) {
  return (
    <div className="relative h-16 w-16" data-testid="action-radial">
      <button
        type="button"
        onClick={(e) => { stopEvent(e); onSelectAction?.(tagId, "tag"); }}
        onMouseDown={stopEvent}
        onPointerDown={stopEvent}
        className={`${interactiveClass} absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-bold text-[var(--color-text)] shadow-sm transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]`}
        style={{ pointerEvents: "all" }}
        aria-label="Add sub-tag"
        data-testid="action-add-tag"
      >
        T
      </button>
      <button
        type="button"
        onClick={(e) => { stopEvent(e); onSelectAction?.(tagId, "todo"); }}
        onMouseDown={stopEvent}
        onPointerDown={stopEvent}
        className={`${interactiveClass} absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-bold text-[var(--color-text)] shadow-sm transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]`}
        style={{ pointerEvents: "all" }}
        aria-label="Add to-do"
        data-testid="action-add-todo"
      >
        D
      </button>
    </div>
  );
}

export function TagActionNode({ data }: NodeProps) {
  const { tagId, layoutMode, onSelectAction, onCancel } =
    data as TagActionNodeData;

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCancel?.();
      }
    },
    [onCancel],
  );

  return (
    <div
      data-testid="tag-action-node"
      onClick={handleBackdropClick}
    >
      <Handle type="target" position={Position.Top} style={hiddenHandle} />
      <Handle type="target" position={Position.Left} style={hiddenHandle} id="target-left" />
      {layoutMode === "compact" ? (
        <RadialActions tagId={tagId} onSelectAction={onSelectAction} />
      ) : (
        <NormalActions tagId={tagId} onSelectAction={onSelectAction} />
      )}
      <Handle type="source" position={Position.Bottom} style={hiddenHandle} />
      <Handle type="source" position={Position.Right} style={hiddenHandle} id="source-right" />
    </div>
  );
}
