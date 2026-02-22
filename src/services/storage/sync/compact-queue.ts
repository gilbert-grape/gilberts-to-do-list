import type { ChangeEntry } from "./change-queue.ts";

/**
 * Compacts a queue of change entries to minimize the number of API calls on replay.
 *
 * Rules:
 * - create + delete for same entity → remove both
 * - create + updates → fold updates into create payload
 * - multiple updates → merge into one
 * - Sort order: tag creates → todo creates → updates → deletes
 */
export function compactQueue(entries: ChangeEntry[]): ChangeEntry[] {
  // Group by entity key (type + id)
  const groups = new Map<string, ChangeEntry[]>();
  for (const entry of entries) {
    const key = `${entry.entityType}:${entry.entityId}`;
    const list = groups.get(key) || [];
    list.push(entry);
    groups.set(key, list);
  }

  const result: ChangeEntry[] = [];

  for (const [, group] of groups) {
    const first = group[0]!;
    const last = group[group.length - 1]!;

    const hasCreate = group.some((e) => e.operationType === "create");
    const hasDelete = group.some((e) => e.operationType === "delete");

    // create + delete → skip entirely
    if (hasCreate && hasDelete) {
      continue;
    }

    if (hasCreate) {
      // Merge all updates into the create payload
      let mergedPayload = { ...(first.payload || {}) };
      for (const entry of group) {
        if (entry.operationType === "update" && entry.payload) {
          mergedPayload = { ...mergedPayload, ...entry.payload };
        }
      }
      result.push({
        ...first,
        operationType: "create",
        payload: mergedPayload,
        timestamp: last.timestamp,
      });
    } else if (hasDelete) {
      // Only keep the delete
      const deleteEntry = group.find((e) => e.operationType === "delete")!;
      result.push(deleteEntry);
    } else {
      // All updates → merge into one
      let mergedPayload: Record<string, unknown> = {};
      for (const entry of group) {
        if (entry.payload) {
          mergedPayload = { ...mergedPayload, ...entry.payload };
        }
      }
      result.push({
        ...first,
        operationType: "update",
        payload: mergedPayload,
        timestamp: last.timestamp,
      });
    }
  }

  // Sort: tag creates → todo creates → updates → deletes
  const order = (e: ChangeEntry): number => {
    if (e.operationType === "create" && e.entityType === "tag") return 0;
    if (e.operationType === "create" && e.entityType === "todo") return 1;
    if (e.operationType === "update") return 2;
    return 3; // delete
  };

  result.sort((a, b) => order(a) - order(b));

  return result;
}
