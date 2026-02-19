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
        "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-all",
        "ring ring-transparent",
        selected && "ring-4 ring-[var(--color-text)] shadow-md",
        !selected && "opacity-70 hover:opacity-100",
      )}
      style={{
        backgroundColor: color,
        color: getContrastColor(color),
      }}
    >
      {selected && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {name}
    </button>
  );
}
