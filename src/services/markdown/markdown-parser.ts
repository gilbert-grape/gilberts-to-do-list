import type { Todo } from "@/features/todos/types.ts";

export interface ParsedTodoLine {
  title: string;
  completed: boolean;
  depth: number;
  lineNumber: number;
}

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  tagName: string | null;
  todos: ParsedTodoLine[];
  errors: ParseError[];
}

export interface MarkdownDiff {
  toCreate: { title: string; completed: boolean; parentId: string | null }[];
  toUpdate: { id: string; changes: Partial<Todo> }[];
  toDelete: string[];
}

const TODO_LINE_REGEX = /^( *)- \[(x| )\] (.+)$/;
const HEADER_REGEX = /^# (.+)$/;

export function parseMarkdown(markdown: string): ParseResult {
  const lines = markdown.split("\n");
  const todos: ParsedTodoLine[] = [];
  const errors: ParseError[] = [];
  let tagName: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    if (line.trim() === "") continue;

    const headerMatch = line.match(HEADER_REGEX);
    if (headerMatch) {
      tagName = headerMatch[1];
      continue;
    }

    const todoMatch = line.match(TODO_LINE_REGEX);
    if (todoMatch) {
      const indent = todoMatch[1].length;
      const completed = todoMatch[2] === "x";
      const title = todoMatch[3];

      if (indent % 2 !== 0) {
        errors.push({ line: lineNumber, message: "oddIndent" });
        continue;
      }

      const depth = indent / 2;

      if (todos.length > 0) {
        const lastDepth = todos[todos.length - 1].depth;
        if (depth > lastDepth + 1) {
          errors.push({ line: lineNumber, message: "depthJump" });
          continue;
        }
      } else if (depth > 0) {
        errors.push({ line: lineNumber, message: "depthJump" });
        continue;
      }

      todos.push({ title, completed, depth, lineNumber });
      continue;
    }

    errors.push({ line: lineNumber, message: "invalidLine" });
  }

  return { tagName, todos, errors };
}

function buildHierarchyFlat(todos: Todo[]): { todo: Todo; depth: number }[] {
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

export function diffMarkdownTodos(
  parsed: ParsedTodoLine[],
  existingTodos: Todo[],
  _tagId: string,
): MarkdownDiff {
  const toCreate: MarkdownDiff["toCreate"] = [];
  const toUpdate: MarkdownDiff["toUpdate"] = [];
  const toDelete: string[] = [];

  const existingHierarchy = buildHierarchyFlat(existingTodos);
  const matchedExistingIds = new Set<string>();
  const matchedParsedIndices = new Set<number>();

  // Phase 1: Positional matching (line i ↔ hierarchy entry i, confirmed by title)
  const posLimit = Math.min(parsed.length, existingHierarchy.length);
  for (let i = 0; i < posLimit; i++) {
    if (parsed[i].title === existingHierarchy[i].todo.title) {
      matchedExistingIds.add(existingHierarchy[i].todo.id);
      matchedParsedIndices.add(i);

      const existing = existingHierarchy[i].todo;
      const parsedLine = parsed[i];
      const changes: Partial<Todo> = {};

      const newStatus = parsedLine.completed ? "completed" : "open";
      if (newStatus !== existing.status) {
        changes.status = newStatus;
      }

      // Determine parentId from parsed depth
      const newParentId = resolveParentId(
        parsed,
        i,
        existingHierarchy,
        matchedParsedIndices,
      );
      if (newParentId !== existing.parentId) {
        changes.parentId = newParentId;
      }

      if (Object.keys(changes).length > 0) {
        toUpdate.push({ id: existing.id, changes });
      }
    }
  }

  // Phase 2: Title-based matching for unmatched entries
  for (let i = 0; i < parsed.length; i++) {
    if (matchedParsedIndices.has(i)) continue;

    const match = existingHierarchy.find(
      (h) =>
        !matchedExistingIds.has(h.todo.id) && h.todo.title === parsed[i].title,
    );

    if (match) {
      matchedExistingIds.add(match.todo.id);
      matchedParsedIndices.add(i);

      const changes: Partial<Todo> = {};
      const newStatus = parsed[i].completed ? "completed" : "open";
      if (newStatus !== match.todo.status) {
        changes.status = newStatus;
      }

      const newParentId = resolveParentIdForCreate(parsed, i);
      if (newParentId !== undefined && newParentId !== match.todo.parentId) {
        changes.parentId = newParentId;
      }

      if (Object.keys(changes).length > 0) {
        toUpdate.push({ id: match.todo.id, changes });
      }
    }
  }

  // Phase 3: Unmatched parsed lines → toCreate
  for (let i = 0; i < parsed.length; i++) {
    if (matchedParsedIndices.has(i)) continue;

    toCreate.push({
      title: parsed[i].title,
      completed: parsed[i].completed,
      parentId: null, // Will be resolved during apply
    });
  }

  // Phase 4: Unmatched existing todos → toDelete
  for (const { todo } of existingHierarchy) {
    if (!matchedExistingIds.has(todo.id)) {
      toDelete.push(todo.id);
    }
  }

  return { toCreate, toUpdate, toDelete };
}

function resolveParentId(
  parsed: ParsedTodoLine[],
  index: number,
  existingHierarchy: { todo: Todo; depth: number }[],
  matchedParsedIndices: Set<number>,
): string | null {
  if (parsed[index].depth === 0) return null;

  // Walk backwards to find parent at depth - 1
  for (let j = index - 1; j >= 0; j--) {
    if (parsed[j].depth === parsed[index].depth - 1) {
      // Find the corresponding existing todo for this parent
      if (matchedParsedIndices.has(j)) {
        // Positionally matched
        if (j < existingHierarchy.length) {
          return existingHierarchy[j].todo.id;
        }
      }
      return null;
    }
  }
  return null;
}

function resolveParentIdForCreate(
  parsed: ParsedTodoLine[],
  index: number,
): string | null | undefined {
  if (parsed[index].depth === 0) return null;
  return undefined; // Can't resolve without existing todo mapping
}
