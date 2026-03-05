import { useCallback } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";

interface TagNodeData {
  tagId: string;
  label: string;
  color: string;
  textColor: string;
  onDrillDown?: (tagId: string) => void;
  onEditTag?: (tagId: string) => void;
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
  const { tagId, label, color, textColor, onDrillDown, onEditTag, onAddTag, onAddTodo } =
    data as TagNodeData;

  const handleAddTagClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      e.nativeEvent.stopImmediatePropagation();
      onAddTag?.(tagId);
    },
    [tagId, onAddTag],
  );

  const handleAddTodoClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      e.nativeEvent.stopImmediatePropagation();
      onAddTodo?.(tagId);
    },
    [tagId, onAddTodo],
  );

  return (
    <div
      className="group relative min-w-[8rem] rounded-lg px-4 py-2 text-center text-sm font-semibold shadow-md transition-shadow hover:shadow-lg"
      style={{ backgroundColor: color, color: textColor }}
      data-testid="tag-node"
    >
      <Handle type="target" position={Position.Top} style={hiddenHandle} id="target-top" />
      <Handle type="target" position={Position.Bottom} style={hiddenHandle} id="target-bottom" />
      <Handle type="target" position={Position.Left} style={hiddenHandle} id="target-left" />
      <Handle type="target" position={Position.Right} style={hiddenHandle} id="target-right" />
      {label}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-end gap-1 px-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => { stopEvent(e); onDrillDown?.(tagId); }}
          onMouseDown={stopEvent}
          onPointerDown={stopEvent}
          className="nodrag nopan nowheel flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors hover:scale-110"
          style={{ backgroundColor: textColor, color, pointerEvents: "all" }}
          aria-label={`Zoom into ${label}`}
          data-testid="tag-zoom-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
        <button
          type="button"
          onClick={(e) => { stopEvent(e); onEditTag?.(tagId); }}
          onMouseDown={stopEvent}
          onPointerDown={stopEvent}
          className="nodrag nopan nowheel flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors hover:scale-110"
          style={{ backgroundColor: textColor, color, pointerEvents: "all" }}
          aria-label={`Edit ${label}`}
          data-testid="tag-edit-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
        </button>
        <button
          type="button"
          onClick={handleAddTagClick}
          onMouseDown={stopEvent}
          onPointerDown={stopEvent}
          className="nodrag nopan nowheel flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold transition-colors hover:scale-110"
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
          className="nodrag nopan nowheel flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors hover:scale-110"
          style={{ backgroundColor: textColor, color, pointerEvents: "all" }}
          aria-label={`Add todo to ${label}`}
          data-testid="tag-add-todo-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" /></svg>
        </button>
      </div>
      <Handle type="source" position={Position.Top} style={hiddenHandle} id="source-top" />
      <Handle type="source" position={Position.Bottom} style={hiddenHandle} id="source-bottom" />
      <Handle type="source" position={Position.Left} style={hiddenHandle} id="source-left" />
      <Handle type="source" position={Position.Right} style={hiddenHandle} id="source-right" />
    </div>
  );
}
