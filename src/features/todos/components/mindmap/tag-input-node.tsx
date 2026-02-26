import { useState, useCallback, useRef, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { TAG_COLORS } from "@/features/tags/colors.ts";
import type { Tag } from "@/features/tags/types.ts";

interface TagInputNodeData {
  defaultParentId: string | null;
  defaultColor: string;
  tags: Tag[];
  onCreateTag?: (name: string, color: string, parentId: string | null) => void;
  onCancel?: () => void;
  [key: string]: unknown;
}

const hiddenHandle = { opacity: 0, pointerEvents: "none" as const };

function stopEvent(e: React.MouseEvent | React.PointerEvent) {
  e.stopPropagation();
  e.nativeEvent.stopImmediatePropagation();
}

export function TagInputNode({ data }: NodeProps) {
  const { defaultParentId, defaultColor, tags, onCreateTag, onCancel } =
    data as TagInputNodeData;
  const [name, setName] = useState("");
  const [color, setColor] = useState(defaultColor);
  const [parentId, setParentId] = useState<string | null>(defaultParentId);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed) {
      onCreateTag?.(trimmed, color, parentId);
    } else {
      onCancel?.();
    }
  }, [name, color, parentId, onCreateTag, onCancel]);

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
      className="flex w-56 flex-col gap-2 rounded-lg border-2 border-[var(--color-primary)] bg-[var(--color-surface)] p-2 shadow-lg"
      onMouseDown={stopEvent}
      onPointerDown={stopEvent}
      data-testid="tag-input-node"
    >
      <Handle type="target" position={Position.Top} style={hiddenHandle} />
      <Handle type="target" position={Position.Left} style={hiddenHandle} id="target-left" />

      {/* Name input */}
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onMouseDown={stopEvent}
        onPointerDown={stopEvent}
        className="nodrag nopan nowheel w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-secondary)]"
        style={{ pointerEvents: "all" }}
        placeholder="Tag name..."
        maxLength={50}
        data-testid="tag-input-field"
      />

      {/* Color palette */}
      <div className="flex flex-wrap gap-1" data-testid="tag-color-palette">
        {TAG_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={(e) => { stopEvent(e); setColor(c); }}
            onMouseDown={stopEvent}
            onPointerDown={stopEvent}
            className={`nodrag nopan nowheel h-5 w-5 rounded-full border-2 transition-transform ${
              color === c ? "border-[var(--color-text)] scale-110" : "border-transparent"
            }`}
            style={{ backgroundColor: c, pointerEvents: "all" }}
            aria-label={c}
            data-testid={`tag-color-${c}`}
          />
        ))}
      </div>

      {/* Parent tag selector */}
      <select
        value={parentId ?? ""}
        onChange={(e) => setParentId(e.target.value || null)}
        onMouseDown={stopEvent}
        onPointerDown={stopEvent}
        className="nodrag nopan nowheel w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-text)]"
        style={{ pointerEvents: "all" }}
        data-testid="tag-parent-select"
      >
        <option value="">-- No parent --</option>
        {(tags ?? []).map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>

      {/* Actions */}
      <div className="flex justify-end gap-1">
        <button
          type="button"
          onClick={(e) => { stopEvent(e); onCancel?.(); }}
          onMouseDown={stopEvent}
          onPointerDown={stopEvent}
          className="nodrag nopan nowheel rounded px-2 py-0.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          style={{ pointerEvents: "all" }}
          data-testid="tag-input-cancel"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={(e) => { stopEvent(e); handleSubmit(); }}
          onMouseDown={stopEvent}
          onPointerDown={stopEvent}
          disabled={!name.trim()}
          className="nodrag nopan nowheel rounded bg-[var(--color-primary)] px-2 py-0.5 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          style={{ pointerEvents: "all" }}
          data-testid="tag-input-submit"
        >
          Create
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} style={hiddenHandle} />
      <Handle type="source" position={Position.Right} style={hiddenHandle} id="source-right" />
    </div>
  );
}
