import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";

interface TagNodeData {
  label: string;
  color: string;
  textColor: string;
  [key: string]: unknown;
}

export function TagNode({ data }: NodeProps) {
  const { label, color, textColor } = data as TagNodeData;

  return (
    <div
      className="rounded-lg px-4 py-2 text-center text-sm font-semibold shadow-md"
      style={{ backgroundColor: color, color: textColor }}
      data-testid="tag-node"
    >
      {label}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
    </div>
  );
}
