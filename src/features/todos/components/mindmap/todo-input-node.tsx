import { useState, useCallback, useRef, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";

interface TodoInputNodeData {
  tagId: string;
  onCreateTodo?: (tagId: string, title: string) => void;
  onCancel?: () => void;
  [key: string]: unknown;
}

const hiddenHandle = { opacity: 0, pointerEvents: "none" as const };

export function TodoInputNode({ data }: NodeProps) {
  const { tagId, onCreateTodo, onCancel } = data as TodoInputNodeData;
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) {
      onCreateTodo?.(tagId, trimmed);
    } else {
      onCancel?.();
    }
  }, [value, tagId, onCreateTodo, onCancel]);

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
      data-testid="todo-input-node"
    >
      <Handle type="target" position={Position.Top} style={hiddenHandle} />
      <Handle type="target" position={Position.Left} style={hiddenHandle} id="target-left" />
      <span className="text-xs text-[var(--color-text-secondary)]">To-Do:</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
        className="w-32 border-none bg-transparent text-xs text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-secondary)]"
        placeholder="To-Do title..."
        maxLength={200}
        data-testid="todo-input-field"
      />
      <Handle type="source" position={Position.Bottom} style={hiddenHandle} />
      <Handle type="source" position={Position.Right} style={hiddenHandle} id="source-right" />
    </div>
  );
}
