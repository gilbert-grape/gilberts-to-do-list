import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { AppDatabase } from "../indexeddb/db.ts";
import { ChangeQueue } from "./change-queue.ts";

describe("ChangeQueue", () => {
  let queue: ChangeQueue;

  beforeEach(async () => {
    const testDb = new AppDatabase(`test-cq-${crypto.randomUUID()}`);
    queue = new ChangeQueue(testDb);
  });

  it("starts with count 0", async () => {
    expect(await queue.count()).toBe(0);
  });

  it("starts with empty getAll", async () => {
    expect(await queue.getAll()).toEqual([]);
  });

  it("enqueue adds an entry with timestamp", async () => {
    await queue.enqueue({
      entityType: "tag",
      operationType: "create",
      entityId: "t1",
      payload: { name: "Work" },
    });
    const all = await queue.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]!.entityType).toBe("tag");
    expect(all[0]!.operationType).toBe("create");
    expect(all[0]!.entityId).toBe("t1");
    expect(all[0]!.payload).toEqual({ name: "Work" });
    expect(all[0]!.timestamp).toBeGreaterThan(0);
    expect(all[0]!.seq).toBeDefined();
  });

  it("enqueue multiple entries and count is correct", async () => {
    await queue.enqueue({ entityType: "tag", operationType: "create", entityId: "t1", payload: null });
    await queue.enqueue({ entityType: "todo", operationType: "update", entityId: "td1", payload: { title: "X" } });
    await queue.enqueue({ entityType: "tag", operationType: "delete", entityId: "t1", payload: null });
    expect(await queue.count()).toBe(3);
  });

  it("getAll returns entries ordered by seq", async () => {
    await queue.enqueue({ entityType: "tag", operationType: "create", entityId: "t1", payload: null });
    await queue.enqueue({ entityType: "todo", operationType: "create", entityId: "td1", payload: null });
    await queue.enqueue({ entityType: "tag", operationType: "delete", entityId: "t1", payload: null });

    const all = await queue.getAll();
    expect(all).toHaveLength(3);
    // seq should be increasing
    expect(all[0]!.seq!).toBeLessThan(all[1]!.seq!);
    expect(all[1]!.seq!).toBeLessThan(all[2]!.seq!);
  });

  it("clear removes all entries", async () => {
    await queue.enqueue({ entityType: "tag", operationType: "create", entityId: "t1", payload: null });
    await queue.enqueue({ entityType: "todo", operationType: "create", entityId: "td1", payload: null });
    expect(await queue.count()).toBe(2);

    await queue.clear();
    expect(await queue.count()).toBe(0);
    expect(await queue.getAll()).toEqual([]);
  });
});
