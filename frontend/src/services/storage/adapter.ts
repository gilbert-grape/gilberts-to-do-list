import type { Tag, TagCreate } from "@/features/tags/types.ts";
import type { Todo, TodoCreate } from "@/features/todos/types.ts";

export interface StorageAdapter {
  // Tag operations
  createTag(tag: TagCreate): Promise<Tag>;
  updateTag(id: string, changes: Partial<Tag>): Promise<void>;
  deleteTag(id: string): Promise<void>;
  getAllTags(): Promise<Tag[]>;

  // Todo operations
  createTodo(todo: TodoCreate): Promise<Todo>;
  updateTodo(id: string, changes: Partial<Todo>): Promise<void>;
  deleteTodo(id: string): Promise<void>;
  getAllTodos(): Promise<Todo[]>;

  // Settings operations (Story 3.3+)
  // getSettings(): Promise<Settings>;
  // updateSettings(changes: Partial<Settings>): Promise<void>;
}
