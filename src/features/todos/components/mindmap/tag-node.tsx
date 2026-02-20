import { useCallback, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { useLongPress } from "./use-long-press.ts";

interface TagNodeData {
  tagId: string;
  label: string;
  color: string;
  textColor: string;
  layoutMode?: "normal" | "compact";
  onDrillDown?: (tagId: string) => void;
  onAddAction?: (tagId: string) => void;
  onAddTag?: (tagId: string) => void;
  onAddTodo?: (tagId: string) => void;
  [key: string]: unknown;
}

const hiddenHandle = { opacity: 0, pointerEvents: "none" as const };

function stopEvent(e: React.MouseEvent | React.PointerEvent) {
  e.stopPropagation();
  e.nativeEvent.stopImmediatePropagation();
}

export function TagNode({ data }: NodeProps) {
  const { tagId, label, color, textColor, layoutMode, onDrillDown, onAddAction, onAddTag, onAddTodo } =
    data as TagNodeData;
  const isNormal = layoutMode === "normal";
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

  const handleAddTagClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      e.nativeEvent.stopImmediatePropagation();
      addClickedRef.current = true;
      onAddTag?.(tagId);
    },
    [tagId, onAddTag],
  );

  const handleAddTodoClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      e.nativeEvent.stopImmediatePropagation();
      addClickedRef.current = true;
      onAddTodo?.(tagId);
    },
    [tagId, onAddTodo],
  );

  const longPressHandlers = useLongPress(handleDrillDown);

  return (
    <div
      className={`group relative rounded-lg px-4 py-2 ${isNormal ? "pr-14" : "pr-8"} text-center text-sm font-semibold shadow-md transition-shadow hover:shadow-lg active:ring-2 active:ring-[var(--color-primary)] active:ring-opacity-50`}
      style={{ backgroundColor: color, color: textColor }}
      data-testid="tag-node"
      onClick={handleDrillDown}
      {...longPressHandlers}
    >
      <Handle type="target" position={Position.Top} style={hiddenHandle} id="target-top" />
      <Handle type="target" position={Position.Bottom} style={hiddenHandle} id="target-bottom" />
      <Handle type="target" position={Position.Left} style={hiddenHandle} id="target-left" />
      <Handle type="target" position={Position.Right} style={hiddenHandle} id="target-right" />
      {label}
      {isNormal ? (
        <div className="absolute right-1 top-1/2 z-10 flex -translate-y-1/2 gap-0.5">
          <button
            type="button"
            onClick={handleAddTagClick}
            onMouseDown={stopEvent}
            onPointerDown={stopEvent}
            className="nodrag nopan nowheel flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold opacity-70 transition-opacity hover:opacity-100"
            style={{ backgroundColor: textColor, color, pointerEvents: "all" }}
            aria-label={`Add tag to ${label}`}
            data-testid="tag-add-tag-button"
          >
            #
          </button>
          <button
            type="button"
            onClick={handleAddTodoClick}
            onMouseDown={stopEvent}
            onPointerDown={stopEvent}
            className="nodrag nopan nowheel flex h-5 w-5 items-center justify-center rounded-full text-[10px] opacity-70 transition-opacity hover:opacity-100"
            style={{ backgroundColor: textColor, color, pointerEvents: "all" }}
            aria-label={`Add todo to ${label}`}
            data-testid="tag-add-todo-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" /></svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleAdd}
          onMouseDown={stopEvent}
          onPointerDown={stopEvent}
          className="nodrag nopan nowheel absolute right-1 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-xs font-bold opacity-70 transition-opacity hover:opacity-100"
          style={{ backgroundColor: textColor, color, pointerEvents: "all" }}
          aria-label={`Add to ${label}`}
          data-testid="tag-add-button"
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
