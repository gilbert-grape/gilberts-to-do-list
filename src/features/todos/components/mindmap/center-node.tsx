import { useCallback, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";

interface CenterNodeData {
  label: string;
  layoutMode?: "normal" | "compact";
  onAddAction?: () => void;
  onAddTag?: () => void;
  onAddTodo?: () => void;
  [key: string]: unknown;
}

const hiddenHandle = { opacity: 0, pointerEvents: "none" as const };

function stopEvent(e: React.MouseEvent | React.PointerEvent) {
  e.stopPropagation();
  e.nativeEvent.stopImmediatePropagation();
}

export function CenterNode({ data }: NodeProps) {
  const { label, layoutMode, onAddAction, onAddTag, onAddTodo } =
    data as CenterNodeData;
  const addClickedRef = useRef(false);
  const isNormal = layoutMode === "normal";

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

  const handleAddTag = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      e.nativeEvent.stopImmediatePropagation();
      addClickedRef.current = true;
      onAddTag?.();
    },
    [onAddTag],
  );

  const handleAddTodo = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      e.nativeEvent.stopImmediatePropagation();
      addClickedRef.current = true;
      onAddTodo?.();
    },
    [onAddTodo],
  );

  return (
    <div
      className={`relative rounded-full bg-[var(--color-primary)] px-6 py-3 ${isNormal ? "pr-16" : "pr-10"} text-center text-sm font-bold text-white shadow-lg`}
      data-testid="center-node"
    >
      {label}
      {isNormal ? (
        <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 gap-0.5">
          <button
            type="button"
            onClick={handleAddTag}
            onMouseDown={stopEvent}
            onPointerDown={stopEvent}
            className="nodrag nopan nowheel flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[var(--color-primary)] opacity-80 transition-opacity hover:opacity-100"
            style={{ pointerEvents: "all" }}
            aria-label="Add tag"
            data-testid="center-add-tag-button"
          >
            #
          </button>
          <button
            type="button"
            onClick={handleAddTodo}
            onMouseDown={stopEvent}
            onPointerDown={stopEvent}
            className="nodrag nopan nowheel flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-[var(--color-primary)] opacity-80 transition-opacity hover:opacity-100"
            style={{ pointerEvents: "all" }}
            aria-label="Add to-do"
            data-testid="center-add-todo-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3" strokeWidth="1"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" /></svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleAdd}
          onMouseDown={stopEvent}
          onPointerDown={stopEvent}
          className="nodrag nopan nowheel absolute right-2 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs font-bold text-[var(--color-primary)] opacity-80 transition-opacity hover:opacity-100"
          style={{ pointerEvents: "all" }}
          aria-label="Add tag or to-do"
          data-testid="center-add-button"
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
