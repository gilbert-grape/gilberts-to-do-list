import { useState } from "react";
import { useTagStore } from "@/features/tags/store.ts";
import { useSettingsStore } from "@/features/settings/store.ts";
import { cn, buildHierarchy, buildTagHierarchy } from "@/shared/utils/index.ts";
import { SortableTodoList } from "./sortable-todo-list.tsx";
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
  onReorder?: (activeId: string, overId: string) => void;
  onReparent?: (activeId: string, newParentId: string) => void;
}

export function GroupedView({
  todos,
  onToggle,
  onTitleClick,
  onEdit,
  onDelete,
  onCreateSibling,
  onCreateChild,
  onReorder,
  onReparent,
}: GroupedViewProps) {
  const { tags } = useTagStore();
  const completedDisplayMode = useSettingsStore(
    (s) => s.completedDisplayMode,
  );
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

  const tagHierarchy = buildTagHierarchy(tags);

  return (
    <div className="space-y-4">
      {tagHierarchy.map(({ tag, depth: tagDepth }) => {
        const tagTodos = todos
          .filter((todo) => todo.tagIds.includes(tag.id))
          .filter(
            (todo) =>
              completedDisplayMode !== "hidden" ||
              todo.status !== "completed",
          );
        if (tagTodos.length === 0) return null;

        const isCollapsed = collapsedTags.has(tag.id);
        const openTagTodos = tagTodos.filter((t) => t.status === "open");
        const completedTagTodos = tagTodos.filter(
          (t) => t.status === "completed",
        );
        const openHierarchy = buildHierarchy(openTagTodos);
        const completedHierarchy = buildHierarchy(completedTagTodos);

        return (
          <div key={tag.id} style={{ marginLeft: tagDepth * 16 }}>
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
              <div className="mt-1 pl-2">
                {openHierarchy.length > 0 && onReorder && onReparent ? (
                  <SortableTodoList
                    items={openHierarchy}
                    onReorder={onReorder}
                    onReparent={onReparent}
                    onToggle={onToggle}
                    onTitleClick={onTitleClick}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onCreateSibling={onCreateSibling}
                    onCreateChild={onCreateChild}
                  />
                ) : openHierarchy.length > 0 ? (
                  <ul className="space-y-2">
                    {openHierarchy.map(({ todo, depth }) => (
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
                ) : null}
                {completedHierarchy.length > 0 &&
                  completedDisplayMode !== "hidden" && (
                    <ul className="mt-2 space-y-2">
                      {completedHierarchy.map(({ todo, depth }) => (
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
            )}
          </div>
        );
      })}
    </div>
  );
}
