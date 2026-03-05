import type { Todo } from "@/features/todos/types.ts";
import { buildHierarchy } from "@/shared/utils/hierarchy.ts";

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
