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
  const addClickedRef = useRef(false);

  const handleDrillDown = useCallback(() => {
    // Skip drill-down if the "+" button was just clicked
    if (addClickedRef.current) {
      addClickedRef.current = false;
      return;
    }
    onDrillDown?.(tagId);
  }, [tagId, onDrillDown]);

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      e.nativeEvent.stopImmediatePropagation();
      addClickedRef.current = true;
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
      onClick={handleDrillDown}
      {...longPressHandlers}
    >
      <Handle type="target" position={Position.Top} style={hiddenHandle} />
      <Handle type="target" position={Position.Left} style={hiddenHandle} id="target-left" />
      {label}
      <button
        type="button"
        onClick={handleAdd}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
        className="nodrag nopan nowheel absolute right-1 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-xs font-bold opacity-70 transition-opacity hover:opacity-100"
        style={{ backgroundColor: textColor, color, pointerEvents: "all" }}
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
