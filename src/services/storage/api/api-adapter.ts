import type { StorageAdapter } from "../adapter.ts";
import type { Tag, TagCreate } from "@/features/tags/types.ts";
import type { Todo, TodoCreate } from "@/features/todos/types.ts";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class ApiAdapter implements StorageAdapter {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ApiError(res.status, `API ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  // --- Health ---

  async healthCheck(): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      await fetch(`${this.baseUrl}/api/health`, {
        signal: controller.signal,
      });
      return true;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  // --- Tags ---

  async createTag(input: TagCreate): Promise<Tag> {
    return this.request<Tag>("/api/tags", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async updateTag(id: string, changes: Partial<Tag>): Promise<void> {
    await this.request(`/api/tags/${id}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
  }

  async deleteTag(id: string): Promise<void> {
    await this.request(`/api/tags/${id}`, { method: "DELETE" });
  }

  async getAllTags(): Promise<Tag[]> {
    return this.request<Tag[]>("/api/tags");
  }

  // --- Todos ---

  async createTodo(input: TodoCreate): Promise<Todo> {
    return this.request<Todo>("/api/todos", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async updateTodo(id: string, changes: Partial<Todo>): Promise<void> {
    await this.request(`/api/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
  }

  async deleteTodo(id: string): Promise<void> {
    await this.request(`/api/todos/${id}`, { method: "DELETE" });
  }

  async getAllTodos(): Promise<Todo[]> {
    return this.request<Todo[]>("/api/todos");
  }

  // --- Sync helpers (send full entity for offline-created items) ---

  async createTagFull(tag: Tag): Promise<Tag> {
    return this.request<Tag>("/api/tags", {
      method: "POST",
      body: JSON.stringify(tag),
    });
  }

  async createTodoFull(todo: Todo): Promise<Todo> {
    return this.request<Todo>("/api/todos", {
      method: "POST",
      body: JSON.stringify(todo),
    });
  }
}
