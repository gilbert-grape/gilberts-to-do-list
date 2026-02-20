import { useCallback, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";

interface CenterNodeData {
  label: string;
  onAddAction?: () => void;
  [key: string]: unknown;
}

const hiddenHandle = { opacity: 0, pointerEvents: "none" as const };

export function CenterNode({ data }: NodeProps) {
  const { label, onAddAction } = data as CenterNodeData;
  const addClickedRef = useRef(false);

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      e.nativeEvent.stopImmediatePropagation();
      addClickedRef.current = true;
      onAddAction?.();
    },
    [onAddAction],
  );

  return (
    <div
      className="relative rounded-full bg-[var(--color-primary)] px-6 py-3 pr-10 text-center text-sm font-bold text-white shadow-lg"
      data-testid="center-node"
    >
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
        className="nodrag nopan nowheel absolute right-2 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs font-bold text-[var(--color-primary)] opacity-80 transition-opacity hover:opacity-100"
        style={{ pointerEvents: "all" }}
        aria-label="Add tag or to-do"
        data-testid="center-add-button"
      >
        +
      </button>
      <Handle type="source" position={Position.Top} style={hiddenHandle} id="source-top" />
      <Handle type="source" position={Position.Bottom} style={hiddenHandle} id="source-bottom" />
      <Handle type="source" position={Position.Left} style={hiddenHandle} id="source-left" />
      <Handle type="source" position={Position.Right} style={hiddenHandle} id="source-right" />
    </div>
  );
}
