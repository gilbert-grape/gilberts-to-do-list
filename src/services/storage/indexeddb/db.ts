import Dexie, { type EntityTable } from "dexie";
import type { Tag } from "@/features/tags/types.ts";
import type { Todo } from "@/features/todos/types.ts";

export class AppDatabase extends Dexie {
  tags!: EntityTable<Tag, "id">;
  todos!: EntityTable<Todo, "id">;

  constructor(name = "gilberts-todo-db") {
    super(name);
    this.version(1).stores({
      tags: "id",
    });
    this.version(2).stores({
      tags: "id",
      todos: "id, status, *tagIds, parentId, sortOrder",
    });
  }
}

export const db = new AppDatabase();
