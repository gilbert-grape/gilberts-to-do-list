import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTagStore } from "@/features/tags/store.ts";
import { useSettingsStore } from "@/features/settings/store.ts";
import { cn } from "@/shared/utils/index.ts";
import { SortableTodoList } from "./sortable-todo-list.tsx";
import { TodoItem } from "./todo-item.tsx";
import type { Todo } from "../types.ts";

export interface TagTabsViewProps {
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

function buildHierarchy(todos: Todo[]): { todo: Todo; depth: number }[] {
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

export function TagTabsView({
  todos,
  onToggle,
  onTitleClick,
  onEdit,
  onDelete,
  onCreateSibling,
  onCreateChild,
  onReorder,
  onReparent,
}: TagTabsViewProps) {
  const { t } = useTranslation();
  const { tags } = useTagStore();
  const completedDisplayMode = useSettingsStore(
    (s) => s.completedDisplayMode,
  );
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const filteredTodos =
    activeTagId === null
      ? todos
      : todos.filter((todo) => todo.tagIds.includes(activeTagId));

  const openTodos = filteredTodos.filter((todo) => todo.status === "open");
  const completedTodos = filteredTodos.filter(
    (todo) => todo.status === "completed",
  );

  const openHierarchy = buildHierarchy(openTodos);
  const completedHierarchy = buildHierarchy(completedTodos);

  return (
    <div className="space-y-4">
      {/* Tag tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTagId(null)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
            activeTagId === null
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]",
          )}
        >
          {t("todos.allTab")}
        </button>
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => setActiveTagId(tag.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              activeTagId === tag.id
                ? "text-white"
                : "opacity-70 hover:opacity-100",
            )}
            style={{
              backgroundColor:
                activeTagId === tag.id ? tag.color : undefined,
              borderColor: tag.color,
              borderWidth: activeTagId !== tag.id ? 1 : 0,
              color: activeTagId === tag.id ? "white" : tag.color,
            }}
          >
            {tag.name}
          </button>
        ))}
      </div>

      {/* Todo list with hierarchy */}
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
        completedDisplayMode === "bottom" && (
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
              {t("todos.completed")} ({completedTodos.length})
            </h3>
            <ul className="space-y-2">
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
          </div>
        )}

      {completedHierarchy.length > 0 &&
        completedDisplayMode === "toggleable" && (
          <div>
            <button
              type="button"
              onClick={() => setShowCompleted((prev) => !prev)}
              className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            >
              {showCompleted
                ? t("settings.hideCompleted", {
                    count: String(completedTodos.length),
                  })
                : t("settings.showCompleted", {
                    count: String(completedTodos.length),
                  })}
            </button>
            {showCompleted && (
              <ul className="space-y-2">
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
}
