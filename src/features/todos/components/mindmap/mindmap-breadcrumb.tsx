import type { Tag } from "@/features/tags/types.ts";

export interface BreadcrumbItem {
  id: string | null;
  label: string;
}

export interface MindmapBreadcrumbProps {
  focusTagId: string | null;
  tags: Tag[];
  rootLabel: string;
  onNavigate: (tagId: string | null) => void;
}

export function buildBreadcrumbPath(
  focusTagId: string | null,
  tags: Tag[],
  rootLabel: string,
): BreadcrumbItem[] {
  const path: BreadcrumbItem[] = [{ id: null, label: rootLabel }];

  if (!focusTagId) return path;

  const tagMap = new Map(tags.map((t) => [t.id, t]));
  const chain: Tag[] = [];
  let current = tagMap.get(focusTagId);

  while (current) {
    chain.unshift(current);
    current = current.parentId ? tagMap.get(current.parentId) : undefined;
  }

  for (const tag of chain) {
    path.push({ id: tag.id, label: tag.name });
  }

  return path;
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
