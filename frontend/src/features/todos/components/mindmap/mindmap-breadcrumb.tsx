import type { Tag } from "@/features/tags/types.ts";
import { buildBreadcrumbPath } from "./mindmap-breadcrumb-utils.ts";

export interface MindmapBreadcrumbProps {
  focusTagId: string | null;
  tags: Tag[];
  rootLabel: string;
  onNavigate: (tagId: string | null) => void;
}

export function MindmapBreadcrumb({
  focusTagId,
  tags,
  rootLabel,
  onNavigate,
}: MindmapBreadcrumbProps) {
  const path = buildBreadcrumbPath(focusTagId, tags, rootLabel);

  if (path.length <= 1) return null;

  return (
    <nav
      className="flex items-center gap-1 text-xs"
      aria-label="Breadcrumb"
      data-testid="mindmap-breadcrumb"
    >
      {path.map((item, i) => {
        const isLast = i === path.length - 1;

        return (
          <span key={item.id ?? "root"} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-[var(--color-text-secondary)]">/</span>
            )}
            {isLast ? (
              <span className="font-medium text-[var(--color-text)]">
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                className="text-[var(--color-primary)] hover:underline"
              >
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
