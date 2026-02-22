import type { StorageAdapter } from "../adapter.ts";
import type { Tag, TagCreate } from "@/features/tags/types.ts";
import type { Todo, TodoCreate } from "@/features/todos/types.ts";
import type { ApiAdapter } from "../api/api-adapter.ts";
import type { IndexedDBAdapter } from "../indexeddb/indexeddb-adapter.ts";
import type { AppDatabase } from "../indexeddb/db.ts";
import { ChangeQueue } from "./change-queue.ts";
import { compactQueue } from "./compact-queue.ts";
import { useConnectionStore } from "./connection-store.ts";

const HEALTH_CHECK_INTERVAL = 30_000;

export class SyncAdapter implements StorageAdapter {
  private api: ApiAdapter;
  private local: IndexedDBAdapter;
  private queue: ChangeQueue;
  private db: AppDatabase;
  private onSyncComplete: () => void;
  private online: boolean;
  private healthTimer: ReturnType<typeof setInterval> | null = null;
  private syncing = false;

  constructor(
    api: ApiAdapter,
    local: IndexedDBAdapter,
    db: AppDatabase,
    onSyncComplete: () => void,
  ) {
    this.api = api;
    this.local = local;
    this.db = db;
    this.queue = new ChangeQueue(db);
    this.onSyncComplete = onSyncComplete;
    this.online = navigator.onLine;

    window.addEventListener("online", () => this.handleOnline());
    window.addEventListener("offline", () => this.handleOffline());

    this.startHealthCheck();
  }

  private setStatus(status: "online" | "offline" | "syncing") {
    useConnectionStore.getState().setStatus(status);
  }

  private async updatePendingCount() {
    const count = await this.queue.count();
    useConnectionStore.getState().setPendingChanges(count);
  }

  private handleOffline() {
    this.online = false;
    this.setStatus("offline");
  }

  private async handleOnline() {
    this.online = true;
    await this.trySync();
  }

  private startHealthCheck() {
    this.healthTimer = setInterval(async () => {
      if (!this.online) {
        const ok = await this.api.healthCheck();
        if (ok) {
          this.online = true;
          await this.trySync();
        }
      }
    }, HEALTH_CHECK_INTERVAL);
  }

  private async trySync() {
    if (this.syncing) return;
    this.syncing = true;
    this.setStatus("syncing");

    try {
      // 1. Replay compacted queue
      const entries = await this.queue.getAll();
      if (entries.length > 0) {
        const compacted = compactQueue(entries);

        for (const entry of compacted) {
          try {
            if (entry.entityType === "tag") {
              if (entry.operationType === "create") {
                await this.api.createTagFull(entry.payload as unknown as Tag);
              } else if (entry.operationType === "update") {
                await this.api.updateTag(
                  entry.entityId,
                  entry.payload as Partial<Tag>,
                );
              } else if (entry.operationType === "delete") {
                await this.api.deleteTag(entry.entityId);
              }
            } else {
              if (entry.operationType === "create") {
                await this.api.createTodoFull(
                  entry.payload as unknown as Todo,
                );
              } else if (entry.operationType === "update") {
                await this.api.updateTodo(
                  entry.entityId,
                  entry.payload as Partial<Todo>,
                );
              } else if (entry.operationType === "delete") {
                await this.api.deleteTodo(entry.entityId);
              }
            }
          } catch {
            // If a single entry fails (e.g. 409 conflict), continue with the rest
          }
        }

        await this.queue.clear();
      }

      // 2. Full refresh from server
      const [serverTags, serverTodos] = await Promise.all([
        this.api.getAllTags(),
        this.api.getAllTodos(),
      ]);

      // Replace local IndexedDB contents
      await this.db.transaction("rw", this.db.tags, this.db.todos, async () => {
        await this.db.tags.clear();
        await this.db.todos.clear();
        if (serverTags.length > 0) await this.db.tags.bulkAdd(serverTags);
        if (serverTodos.length > 0) await this.db.todos.bulkAdd(serverTodos);
      });

      await this.updatePendingCount();
      this.setStatus("online");
      useConnectionStore.getState().setLastError(null);

      // 3. Notify stores to reload
      this.onSyncComplete();
    } catch (err) {
      // Sync failed — go back to offline
      this.online = false;
      this.setStatus("offline");
      useConnectionStore.getState().setLastError(
        err instanceof Error ? err.message : "Sync failed",
      );
    } finally {
      this.syncing = false;
    }
  }

  private async enqueueAndGoOffline(
    entityType: "tag" | "todo",
    operationType: "create" | "update" | "delete",
    entityId: string,
    payload: Record<string, unknown> | null,
  ) {
    this.online = false;
    this.setStatus("offline");
    await this.queue.enqueue({
      entityType,
      operationType,
      entityId,
      payload,
    });
    await this.updatePendingCount();
  }

  // --- Tags ---

  async createTag(input: TagCreate): Promise<Tag> {
    // Always write locally first
    const tag = await this.local.createTag(input);

    if (this.online) {
      try {
        await this.api.createTagFull(tag);
      } catch {
        await this.enqueueAndGoOffline(
          "tag",
          "create",
          tag.id,
          tag as unknown as Record<string, unknown>,
        );
      }
    } else {
      await this.queue.enqueue({
        entityType: "tag",
        operationType: "create",
        entityId: tag.id,
        payload: tag as unknown as Record<string, unknown>,
      });
      await this.updatePendingCount();
    }

    return tag;
  }

  async updateTag(id: string, changes: Partial<Tag>): Promise<void> {
    await this.local.updateTag(id, changes);

    if (this.online) {
      try {
        await this.api.updateTag(id, changes);
      } catch {
        await this.enqueueAndGoOffline(
          "tag",
          "update",
          id,
          changes as Record<string, unknown>,
        );
      }
    } else {
      await this.queue.enqueue({
        entityType: "tag",
        operationType: "update",
        entityId: id,
        payload: changes as Record<string, unknown>,
      });
      await this.updatePendingCount();
    }
  }

  async deleteTag(id: string): Promise<void> {
    await this.local.deleteTag(id);

    if (this.online) {
      try {
        await this.api.deleteTag(id);
      } catch {
        await this.enqueueAndGoOffline("tag", "delete", id, null);
      }
    } else {
      await this.queue.enqueue({
        entityType: "tag",
        operationType: "delete",
        entityId: id,
        payload: null,
      });
      await this.updatePendingCount();
    }
  }

  async getAllTags(): Promise<Tag[]> {
    return this.local.getAllTags();
  }

  // --- Todos ---

  async createTodo(input: TodoCreate): Promise<Todo> {
    const todo = await this.local.createTodo(input);

    if (this.online) {
      try {
        await this.api.createTodoFull(todo);
      } catch {
        await this.enqueueAndGoOffline(
          "todo",
          "create",
          todo.id,
          todo as unknown as Record<string, unknown>,
        );
      }
    } else {
      await this.queue.enqueue({
        entityType: "todo",
        operationType: "create",
        entityId: todo.id,
        payload: todo as unknown as Record<string, unknown>,
      });
      await this.updatePendingCount();
    }

    return todo;
  }

  async updateTodo(id: string, changes: Partial<Todo>): Promise<void> {
    await this.local.updateTodo(id, changes);

    if (this.online) {
      try {
        await this.api.updateTodo(id, changes);
      } catch {
        await this.enqueueAndGoOffline(
          "todo",
          "update",
          id,
          changes as Record<string, unknown>,
        );
      }
    } else {
      await this.queue.enqueue({
        entityType: "todo",
        operationType: "update",
        entityId: id,
        payload: changes as Record<string, unknown>,
      });
      await this.updatePendingCount();
    }
  }

  async deleteTodo(id: string): Promise<void> {
    await this.local.deleteTodo(id);

    if (this.online) {
      try {
        await this.api.deleteTodo(id);
      } catch {
        await this.enqueueAndGoOffline("todo", "delete", id, null);
      }
    } else {
      await this.queue.enqueue({
        entityType: "todo",
        operationType: "delete",
        entityId: id,
        payload: null,
      });
      await this.updatePendingCount();
    }
  }

  async getAllTodos(): Promise<Todo[]> {
    return this.local.getAllTodos();
  }

  destroy() {
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
    window.removeEventListener("online", () => this.handleOnline());
    window.removeEventListener("offline", () => this.handleOffline());
  }
}
