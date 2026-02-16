import { addDays, addMonths, addYears, format } from "date-fns";
import { create } from "zustand";
import type { Todo, TodoCreate } from "./types.ts";
import type { StorageAdapter } from "@/services/storage/adapter.ts";
import { useTagStore } from "@/features/tags/store.ts";

export type DeleteMode = "delete-all" | "keep-children";

export interface TodoState {
  todos: Todo[];
  isLoaded: boolean;
  loadTodos: () => Promise<void>;
  createTodo: (input: TodoCreate) => Promise<void>;
  updateTodo: (id: string, changes: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  deleteTodoWithChildren: (id: string, mode: DeleteMode) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  getChildren: (parentId: string) => Todo[];
  reorderTodos: (
    updates: Array<{
      id: string;
      sortOrder: number;
      parentId?: string | null;
      tagIds?: string[];
    }>,
  ) => Promise<void>;
}

let _adapter: StorageAdapter | null = null;

export function setTodoStorageAdapter(adapter: StorageAdapter) {
  _adapter = adapter;
}

function getAdapter(): StorageAdapter {
  if (!_adapter) {
    throw new Error(
      "StorageAdapter not initialized. Call setTodoStorageAdapter() first.",
    );
  }
  return _adapter;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  isLoaded: false,

  loadTodos: async () => {
    const adapter = getAdapter();
    const todos = await adapter.getAllTodos();
    set({ todos, isLoaded: true });
  },

  createTodo: async (input: TodoCreate) => {
    const adapter = getAdapter();

    let tagIds = input.tagIds;
    if (tagIds.length === 0) {
      const defaultTag = useTagStore.getState().getDefaultTag();
      if (defaultTag) {
        tagIds = [defaultTag.id];
      }
    }

    const todo = await adapter.createTodo({ ...input, tagIds });
    set((state) => ({ todos: [...state.todos, todo] }));
  },

  updateTodo: async (id: string, changes: Partial<Todo>) => {
    const adapter = getAdapter();
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, ...changes } : t)),
    }));
    await adapter.updateTodo(id, changes);
  },

  deleteTodo: async (id: string) => {
    const adapter = getAdapter();
    set((state) => ({
      todos: state.todos.filter((t) => t.id !== id),
    }));
    await adapter.deleteTodo(id);
  },

  deleteTodoWithChildren: async (id: string, mode: DeleteMode) => {
    const adapter = getAdapter();
    const { todos } = get();

    const collectDescendants = (parentId: string): string[] => {
      const children = todos.filter((t) => t.parentId === parentId);
      const ids: string[] = [];
      for (const child of children) {
        ids.push(child.id);
        ids.push(...collectDescendants(child.id));
      }
      return ids;
    };

    if (mode === "delete-all") {
      const descendantIds = collectDescendants(id);
      const allIds = [id, ...descendantIds];
      set((state) => ({
        todos: state.todos.filter((t) => !allIds.includes(t.id)),
      }));
      for (const deleteId of allIds) {
        await adapter.deleteTodo(deleteId);
      }
    } else {
      // keep-children: promote children to root (parentId = null)
      const directChildren = todos.filter((t) => t.parentId === id);
      set((state) => ({
        todos: state.todos
          .filter((t) => t.id !== id)
          .map((t) => (t.parentId === id ? { ...t, parentId: null } : t)),
      }));
      await adapter.deleteTodo(id);
      for (const child of directChildren) {
        await adapter.updateTodo(child.id, { parentId: null });
      }
    }
  },

  getChildren: (parentId: string) => {
    return get().todos.filter((t) => t.parentId === parentId);
  },

  reorderTodos: async (updates) => {
    const adapter = getAdapter();
    // Optimistic batch update
    set((state) => ({
      todos: state.todos.map((t) => {
        const update = updates.find((u) => u.id === t.id);
        if (!update) return t;
        const changes: Partial<Todo> = { sortOrder: update.sortOrder };
        if (update.parentId !== undefined) changes.parentId = update.parentId;
        if (update.tagIds !== undefined) changes.tagIds = update.tagIds;
        return { ...t, ...changes };
      }),
    }));
    // Persist each update
    for (const update of updates) {
      const changes: Partial<Todo> = { sortOrder: update.sortOrder };
      if (update.parentId !== undefined) changes.parentId = update.parentId;
      if (update.tagIds !== undefined) changes.tagIds = update.tagIds;
      await adapter.updateTodo(update.id, changes);
    }
  },

  toggleStatus: async (id: string) => {
    const { todos } = get();
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    const adapter = getAdapter();
    const isCompleting = todo.status === "open";
    const now = new Date().toISOString();

    if (isCompleting) {
      // Cascade down: complete this todo + all descendants
      const collectDescendants = (parentId: string): string[] => {
        const children = todos.filter((t) => t.parentId === parentId);
        const ids: string[] = [];
        for (const child of children) {
          ids.push(child.id);
          ids.push(...collectDescendants(child.id));
        }
        return ids;
      };

      const descendantIds = collectDescendants(id);
      const allIds = new Set([id, ...descendantIds]);
      const completedChanges: Partial<Todo> = {
        status: "completed",
        completedAt: now,
      };

      set((state) => ({
        todos: state.todos.map((t) =>
          allIds.has(t.id) && t.status === "open"
            ? { ...t, ...completedChanges }
            : t,
        ),
      }));

      for (const updateId of allIds) {
        const target = todos.find((t) => t.id === updateId);
        if (target && target.status === "open") {
          await adapter.updateTodo(updateId, completedChanges);
        }
      }

      // Bubble up: check if parent should auto-complete
      const bubbleUp = async (childParentId: string | null) => {
        if (!childParentId) return;
        const currentTodos = get().todos;
        const parent = currentTodos.find((t) => t.id === childParentId);
        if (!parent || parent.status === "completed") return;

        const siblings = currentTodos.filter(
          (t) => t.parentId === childParentId,
        );
        const allSiblingsDone = siblings.every((t) => t.status === "completed");
        if (allSiblingsDone) {
          set((state) => ({
            todos: state.todos.map((t) =>
              t.id === childParentId
                ? { ...t, status: "completed", completedAt: now }
                : t,
            ),
          }));
          await adapter.updateTodo(childParentId, completedChanges);
          await bubbleUp(parent.parentId);
        }
      };

      await bubbleUp(todo.parentId);

      // Recurrence: create next occurrence when completing a recurring todo
      if (todo.recurrence && todo.dueDate) {
        const baseDate = new Date(todo.dueDate + "T00:00:00");
        let nextDate: Date;
        switch (todo.recurrence) {
          case "daily":
            nextDate = addDays(baseDate, 1);
            break;
          case "weekly":
            nextDate = addDays(baseDate, 7);
            break;
          case "monthly":
            nextDate = addMonths(baseDate, 1);
            break;
          case "yearly":
            nextDate = addYears(baseDate, 1);
            break;
          case "custom":
            nextDate = addDays(baseDate, todo.recurrenceInterval ?? 1);
            break;
        }

        const nextInput: TodoCreate = {
          title: todo.title,
          description: todo.description,
          tagIds: todo.tagIds,
          parentId: todo.parentId,
          dueDate: format(nextDate, "yyyy-MM-dd"),
          recurrence: todo.recurrence,
          recurrenceInterval: todo.recurrenceInterval,
        };

        const nextTodo = await adapter.createTodo(nextInput);
        set((state) => ({ todos: [...state.todos, nextTodo] }));
      }
    } else {
      // Cascade up: reopen this todo + direct ancestor chain
      const openChanges: Partial<Todo> = {
        status: "open",
        completedAt: null,
      };

      // Collect ancestor chain
      const ancestorIds: string[] = [];
      let currentParentId = todo.parentId;
      while (currentParentId) {
        const parent = todos.find((t) => t.id === currentParentId);
        if (!parent) break;
        if (parent.status === "completed") {
          ancestorIds.push(parent.id);
        }
        currentParentId = parent.parentId;
      }

      const allIds = new Set([id, ...ancestorIds]);

      set((state) => ({
        todos: state.todos.map((t) =>
          allIds.has(t.id) ? { ...t, ...openChanges } : t,
        ),
      }));

      for (const updateId of allIds) {
        await adapter.updateTodo(updateId, openChanges);
      }
    }
  },
}));
