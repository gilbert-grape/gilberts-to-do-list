import { useState, useCallback, useRef, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";

interface TagInputNodeData {
  parentTagId: string;
  onCreateTag?: (parentTagId: string, name: string) => void;
  onCancel?: () => void;
  [key: string]: unknown;
}

const hiddenHandle = { opacity: 0, pointerEvents: "none" as const };

export function TagInputNode({ data }: NodeProps) {
  const { parentTagId, onCreateTag, onCancel } = data as TagInputNodeData;
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus and select on mount
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) {
      onCreateTag?.(parentTagId, trimmed);
    } else {
      onCancel?.();
    }
  }, [value, parentTagId, onCreateTag, onCancel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        onCancel?.();
      }
    },
    [handleSubmit, onCancel],
  );

  return (
    <div
      className="flex items-center gap-1 rounded-lg border-2 border-[var(--color-primary)] bg-[var(--color-surface)] px-2 py-1 shadow-lg"
      data-testid="tag-input-node"
    >
      <Handle type="target" position={Position.Top} style={hiddenHandle} />
      <Handle type="target" position={Position.Left} style={hiddenHandle} id="target-left" />
      <span className="text-xs text-[var(--color-text-secondary)]">Tag:</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
        onMouseDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
        onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
        className="nodrag nopan nowheel w-28 border-none bg-transparent text-xs text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-secondary)]"
        style={{ pointerEvents: "all" }}
        placeholder="Tag name..."
        maxLength={50}
        data-testid="tag-input-field"
      />
      <Handle type="source" position={Position.Bottom} style={hiddenHandle} />
      <Handle type="source" position={Position.Right} style={hiddenHandle} id="source-right" />
    </div>
  );
}
