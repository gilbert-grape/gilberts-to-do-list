import { useCallback, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { useLongPress } from "./use-long-press.ts";

interface TagNodeData {
  tagId: string;
  label: string;
  color: string;
  textColor: string;
  onDrillDown?: (tagId: string) => void;
  onAddAction?: (tagId: string) => void;
  [key: string]: unknown;
}

const hiddenHandle = { opacity: 0, pointerEvents: "none" as const };

export function TagNode({ data }: NodeProps) {
  const { tagId, label, color, textColor, onDrillDown, onAddAction } =
    data as TagNodeData;
  const pressingRef = useRef(false);

  const handleDrillDown = useCallback(() => {
    pressingRef.current = true;
    onDrillDown?.(tagId);
  }, [tagId, onDrillDown]);

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAddAction?.(tagId);
    },
    [tagId, onAddAction],
  );

  const longPressHandlers = useLongPress(handleDrillDown);

  return (
    <div
      className="group relative rounded-lg px-4 py-2 pr-8 text-center text-sm font-semibold shadow-md transition-shadow hover:shadow-lg active:ring-2 active:ring-[var(--color-primary)] active:ring-opacity-50"
      style={{ backgroundColor: color, color: textColor }}
      data-testid="tag-node"
      onDoubleClick={handleDrillDown}
      {...longPressHandlers}
    >
      <Handle type="target" position={Position.Top} style={hiddenHandle} />
      <Handle type="target" position={Position.Left} style={hiddenHandle} id="target-left" />
      {label}
      <button
        type="button"
        onClick={handleAdd}
        className="absolute right-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-xs font-bold opacity-0 transition-opacity group-hover:opacity-80 hover:!opacity-100 focus:opacity-100"
        style={{ backgroundColor: textColor, color }}
        aria-label={`Add to ${label}`}
        data-testid="tag-add-button"
      >
        +
      </button>
      <Handle type="source" position={Position.Bottom} style={hiddenHandle} />
      <Handle type="source" position={Position.Right} style={hiddenHandle} id="source-right" />
    </div>
  );
}
