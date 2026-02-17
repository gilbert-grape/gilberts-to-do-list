import Dexie, { type EntityTable } from "dexie";
import type { Tag } from "@/features/tags/types.ts";
import type { Todo } from "@/features/todos/types.ts";

export interface MetaEntry {
  key: string;
  value: unknown;
}

export class AppDatabase extends Dexie {
  tags!: EntityTable<Tag, "id">;
  todos!: EntityTable<Todo, "id">;
  meta!: EntityTable<MetaEntry, "key">;

  constructor(name = "gilberts-todo-db") {
    super(name);
    this.version(1).stores({
      tags: "id",
    });
    this.version(2).stores({
      tags: "id",
      todos: "id, status, *tagIds, parentId, sortOrder",
    });
    this.version(3).stores({
      tags: "id",
      todos: "id, status, *tagIds, parentId, sortOrder",
      meta: "key",
    });
  }
}

export const db = new AppDatabase();
