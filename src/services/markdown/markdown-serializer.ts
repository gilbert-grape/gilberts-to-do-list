import type { Todo } from "@/features/todos/types.ts";

function buildHierarchy(todos: Todo[]): { todo: Todo; depth: number }[] {
  const result: { todo: Todo; depth: number }[] = [];
  const rootTodos = todos.filter(
    (t) => !t.parentId || !todos.some((p) => p.id === t.parentId),
  );

  const addWithChildren = (parent: Todo, depth: number) => {
    result.push({ todo: parent, depth });
    const children = todos.filter((t) => t.parentId === parent.id);
    for (const child of children) {
      addWithChildren(child, depth + 1);
    }
  };

  for (const root of rootTodos) {
    addWithChildren(root, 0);
  }

  return result;
}

export function todosToMarkdown(tagName: string, todos: Todo[]): string {
  const lines: string[] = [`# ${tagName}`];

  if (todos.length === 0) {
    return lines.join("\n") + "\n";
  }

  lines.push("");

  const hierarchy = buildHierarchy(todos);

  for (const { todo, depth } of hierarchy) {
    const indent = "  ".repeat(depth);
    const checkbox = todo.status === "completed" ? "[x]" : "[ ]";
    lines.push(`${indent}- ${checkbox} ${todo.title}`);
  }

  return lines.join("\n") + "\n";
}
