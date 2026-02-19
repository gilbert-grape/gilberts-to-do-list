import { cn, getContrastColor } from "@/shared/utils/index.ts";

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
        selected && "ring-[var(--color-text)] shadow-md",
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
