import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";

interface CenterNodeData {
  label: string;
  [key: string]: unknown;
}

export function CenterNode({ data }: NodeProps) {
  const { label } = data as CenterNodeData;

  return (
    <div
      className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-center text-sm font-bold text-white shadow-lg"
      data-testid="center-node"
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
