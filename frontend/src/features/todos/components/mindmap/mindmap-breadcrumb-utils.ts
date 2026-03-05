import type { Tag } from "@/features/tags/types.ts";

export interface BreadcrumbItem {
  id: string | null;
  label: string;
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
