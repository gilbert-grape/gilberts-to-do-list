import { describe, it, expect } from "vitest";
import { compactQueue } from "./compact-queue.ts";
import type { ChangeEntry } from "./change-queue.ts";

function entry(
  overrides: Partial<ChangeEntry> & Pick<ChangeEntry, "entityType" | "operationType" | "entityId">,
): ChangeEntry {
  return {
    seq: undefined,
    payload: null,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("compactQueue", () => {
  it("returns empty array for empty input", () => {
    expect(compactQueue([])).toEqual([]);
  });

  it("passes through a single create entry", () => {
    const entries = [entry({ entityType: "tag", operationType: "create", entityId: "t1", payload: { name: "Work" } })];
    const result = compactQueue(entries);
    expect(result).toHaveLength(1);
    expect(result[0]!.operationType).toBe("create");
    expect(result[0]!.entityId).toBe("t1");
  });

  it("removes create + delete for same entity", () => {
    const entries = [
      entry({ entityType: "tag", operationType: "create", entityId: "t1", payload: { name: "Work" } }),
      entry({ entityType: "tag", operationType: "delete", entityId: "t1" }),
    ];
    expect(compactQueue(entries)).toHaveLength(0);
  });

  it("merges create + updates into one create", () => {
    const entries = [
      entry({ entityType: "tag", operationType: "create", entityId: "t1", payload: { name: "Work", color: "red" }, timestamp: 1 }),
      entry({ entityType: "tag", operationType: "update", entityId: "t1", payload: { color: "blue" }, timestamp: 2 }),
      entry({ entityType: "tag", operationType: "update", entityId: "t1", payload: { name: "Play" }, timestamp: 3 }),
    ];
    const result = compactQueue(entries);
    expect(result).toHaveLength(1);
    expect(result[0]!.operationType).toBe("create");
    expect(result[0]!.payload).toEqual({ name: "Play", color: "blue" });
    expect(result[0]!.timestamp).toBe(3);
  });

  it("merges multiple updates into one update", () => {
    const entries = [
      entry({ entityType: "todo", operationType: "update", entityId: "td1", payload: { title: "A" }, timestamp: 1 }),
      entry({ entityType: "todo", operationType: "update", entityId: "td1", payload: { title: "B", status: "done" }, timestamp: 2 }),
    ];
    const result = compactQueue(entries);
    expect(result).toHaveLength(1);
    expect(result[0]!.operationType).toBe("update");
    expect(result[0]!.payload).toEqual({ title: "B", status: "done" });
    expect(result[0]!.timestamp).toBe(2);
  });

  it("keeps only delete when updates + delete exist", () => {
    const entries = [
      entry({ entityType: "todo", operationType: "update", entityId: "td1", payload: { title: "A" } }),
      entry({ entityType: "todo", operationType: "delete", entityId: "td1" }),
    ];
    const result = compactQueue(entries);
    expect(result).toHaveLength(1);
    expect(result[0]!.operationType).toBe("delete");
    expect(result[0]!.entityId).toBe("td1");
  });

  it("handles entries with null payload in updates", () => {
    const entries = [
      entry({ entityType: "todo", operationType: "update", entityId: "td1", payload: null, timestamp: 1 }),
      entry({ entityType: "todo", operationType: "update", entityId: "td1", payload: { title: "X" }, timestamp: 2 }),
    ];
    const result = compactQueue(entries);
    expect(result).toHaveLength(1);
    expect(result[0]!.payload).toEqual({ title: "X" });
  });

  it("sorts: tag creates → todo creates → updates → deletes", () => {
    const entries = [
      entry({ entityType: "todo", operationType: "delete", entityId: "td1" }),
      entry({ entityType: "todo", operationType: "update", entityId: "td2", payload: { title: "X" } }),
      entry({ entityType: "todo", operationType: "create", entityId: "td3", payload: { title: "New" } }),
      entry({ entityType: "tag", operationType: "create", entityId: "t1", payload: { name: "A" } }),
    ];
    const result = compactQueue(entries);
    expect(result.map((e) => `${e.entityType}:${e.operationType}`)).toEqual([
      "tag:create",
      "todo:create",
      "todo:update",
      "todo:delete",
    ]);
  });

  it("handles multiple independent entities", () => {
    const entries = [
      entry({ entityType: "tag", operationType: "create", entityId: "t1", payload: { name: "A" } }),
      entry({ entityType: "tag", operationType: "create", entityId: "t2", payload: { name: "B" } }),
      entry({ entityType: "todo", operationType: "create", entityId: "td1", payload: { title: "X" } }),
    ];
    const result = compactQueue(entries);
    expect(result).toHaveLength(3);
  });

  it("create + delete cancellation does not affect other entities", () => {
    const entries = [
      entry({ entityType: "tag", operationType: "create", entityId: "t1", payload: { name: "A" } }),
      entry({ entityType: "tag", operationType: "delete", entityId: "t1" }),
      entry({ entityType: "tag", operationType: "create", entityId: "t2", payload: { name: "B" } }),
    ];
    const result = compactQueue(entries);
    expect(result).toHaveLength(1);
    expect(result[0]!.entityId).toBe("t2");
  });
});
