import { useState } from "react";
import { useTagStore } from "@/features/tags/store.ts";
import { cn } from "@/shared/utils/index.ts";
import { TodoItem } from "./todo-item.tsx";
import type { Todo } from "../types.ts";

export interface GroupedViewProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onTitleClick?: (todo: Todo) => void;
  onEdit?: (todo: Todo) => void;
  onDelete?: (todo: Todo) => void;
  onCreateSibling?: (todo: Todo) => void;
  onCreateChild?: (todo: Todo) => void;
}

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

export function GroupedView({
  todos,
  onToggle,
  onTitleClick,
  onEdit,
  onDelete,
  onCreateSibling,
  onCreateChild,
}: GroupedViewProps) {
  const { tags } = useTagStore();
  const [collapsedTags, setCollapsedTags] = useState<Set<string>>(new Set());

  const toggleCollapse = (tagId: string) => {
    setCollapsedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {tags.map((tag) => {
        const tagTodos = todos.filter((todo) => todo.tagIds.includes(tag.id));
        if (tagTodos.length === 0) return null;

        const isCollapsed = collapsedTags.has(tag.id);
        const hierarchy = buildHierarchy(tagTodos);

        return (
          <div key={tag.id}>
            <button
              type="button"
              onClick={() => toggleCollapse(tag.id)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-[var(--color-bg)]"
            >
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <span className="flex-1 text-sm font-medium text-[var(--color-text)]">
                {tag.name}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {tagTodos.length}
              </span>
              <svg
                className={cn(
                  "h-3 w-3 text-[var(--color-text-secondary)] transition-transform",
                  isCollapsed ? "" : "rotate-90",
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {!isCollapsed && (
              <ul className="mt-1 space-y-2 pl-2">
                {hierarchy.map(({ todo, depth }) => (
                  <div key={todo.id} style={{ marginLeft: depth * 24 }}>
                    <TodoItem
                      todo={todo}
                      onToggle={onToggle}
                      onTitleClick={onTitleClick}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onCreateSibling={onCreateSibling}
                      onCreateChild={onCreateChild}
                    />
                  </div>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
