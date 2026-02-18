import type { StorageAdapter } from "../adapter.ts";
import type { Tag, TagCreate } from "@/features/tags/types.ts";
import type { Todo, TodoCreate } from "@/features/todos/types.ts";
import type { AppDatabase } from "./db.ts";

export class IndexedDBAdapter implements StorageAdapter {
  private db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  // Tag operations

  async createTag(input: TagCreate): Promise<Tag> {
    const tag: Tag = {
      id: crypto.randomUUID(),
      ...input,
    };
    await this.db.tags.add(tag);
    return tag;
  }

  async updateTag(id: string, changes: Partial<Tag>): Promise<void> {
    await this.db.tags.update(id, changes);
  }

  async deleteTag(id: string): Promise<void> {
    await this.db.tags.delete(id);
  }

  async getAllTags(): Promise<Tag[]> {
    return this.db.tags.toArray();
  }

  // Todo operations

  async createTodo(input: TodoCreate): Promise<Todo> {
    const now = new Date().toISOString();
    const maxItem = await this.db.todos.orderBy("sortOrder").last();
    const sortOrder = maxItem ? maxItem.sortOrder + 1 : 0;
    const todo: Todo = {
      id: crypto.randomUUID(),
      ...input,
      status: "open",
      createdAt: now,
      completedAt: null,
      sortOrder,
    };
    await this.db.todos.add(todo);
    return todo;
  }

  async updateTodo(id: string, changes: Partial<Todo>): Promise<void> {
    await this.db.todos.update(id, changes);
  }

  async deleteTodo(id: string): Promise<void> {
    await this.db.todos.delete(id);
  }

  async getAllTodos(): Promise<Todo[]> {
    return this.db.todos.toArray();
  }
}
