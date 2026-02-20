import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";

interface CollapsedTodoGroupNodeData {
  tagId: string;
  count: number;
  completedCount: number;
  onExpand?: (tagId: string) => void;
  [key: string]: unknown;
}

const hiddenHandle = { opacity: 0, pointerEvents: "none" as const };

export function CollapsedTodoGroupNode({ data }: NodeProps) {
  const { tagId, count, completedCount, onExpand } =
    data as CollapsedTodoGroupNodeData;

  const openCount = count - completedCount;

  return (
    <div
      className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-sm transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-surface)]"
      data-testid="collapsed-todo-group-node"
      onClick={() => onExpand?.(tagId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onExpand?.(tagId);
        }
      }}
    >
      <Handle type="target" position={Position.Top} style={hiddenHandle} />
      <Handle type="target" position={Position.Left} style={hiddenHandle} id="target-left" />
      <span className="text-sm text-[var(--color-text)]">
        {openCount > 0 && `${openCount} open`}
        {openCount > 0 && completedCount > 0 && " · "}
        {completedCount > 0 && `${completedCount} done`}
        {openCount === 0 && completedCount === 0 && `${count} todos`}
      </span>
      <Handle type="source" position={Position.Bottom} style={hiddenHandle} />
      <Handle type="source" position={Position.Right} style={hiddenHandle} id="source-right" />
    </div>
  );
}
