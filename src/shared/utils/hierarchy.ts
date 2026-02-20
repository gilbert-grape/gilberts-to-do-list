import type { Todo } from "@/features/todos/types.ts";
import type { Tag } from "@/features/tags/types.ts";

export function buildHierarchy(
  todos: Todo[],
): { todo: Todo; depth: number }[] {
  const result: { todo: Todo; depth: number }[] = [];
  const rootTodos = todos
    .filter((t) => !t.parentId || !todos.some((p) => p.id === t.parentId))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const addWithChildren = (parent: Todo, depth: number) => {
    result.push({ todo: parent, depth });
    const children = todos
      .filter((t) => t.parentId === parent.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    for (const child of children) {
      addWithChildren(child, depth + 1);
    }
  };

  for (const root of rootTodos) {
    addWithChildren(root, 0);
  }

  return result;
}

export function buildTagHierarchy(
  tags: Tag[],
): { tag: Tag; depth: number }[] {
  const result: { tag: Tag; depth: number }[] = [];
  const tagIds = new Set(tags.map((t) => t.id));
  const rootTags = tags
    .filter((t) => t.parentId === null || !tagIds.has(t.parentId))
    .sort((a, b) => a.name.localeCompare(b.name));

  const addWithChildren = (parent: Tag, depth: number) => {
    result.push({ tag: parent, depth });
    const children = tags
      .filter((t) => t.parentId === parent.id)
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const child of children) {
      addWithChildren(child, depth + 1);
    }
  };

  for (const root of rootTags) {
    addWithChildren(root, 0);
  }

  return result;
}
