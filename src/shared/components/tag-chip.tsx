import { cn } from "@/shared/utils/index.ts";

export interface TagChipProps {
  name: string;
  color: string;
  selected?: boolean;
  onClick?: () => void;
}

export function TagChip({
  name,
  color,
  selected = false,
  onClick,
}: TagChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-3 py-1 text-sm font-medium transition-all",
        "ring-2 ring-transparent",
        selected && "ring-white/50 shadow-md",
        !selected && "opacity-70 hover:opacity-100",
      )}
      style={{
        backgroundColor: color,
        color: getContrastColor(color),
      }}
    >
      {name}
    </button>
  );
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}
