import type { AppDatabase } from "../indexeddb/db.ts";

export type EntityType = "tag" | "todo";
export type OperationType = "create" | "update" | "delete";

export interface ChangeEntry {
  seq?: number;
  entityType: EntityType;
  operationType: OperationType;
  entityId: string;
  payload: Record<string, unknown> | null;
  timestamp: number;
}

export class ChangeQueue {
  private db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  async enqueue(entry: Omit<ChangeEntry, "seq" | "timestamp">): Promise<void> {
    await this.db.changeQueue.add({
      ...entry,
      timestamp: Date.now(),
    } as ChangeEntry);
  }

  async getAll(): Promise<ChangeEntry[]> {
    return this.db.changeQueue.orderBy("seq").toArray();
  }

  async clear(): Promise<void> {
    await this.db.changeQueue.clear();
  }

  async count(): Promise<number> {
    return this.db.changeQueue.count();
  }
}
