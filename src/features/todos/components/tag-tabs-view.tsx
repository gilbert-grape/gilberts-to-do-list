import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTagStore } from "@/features/tags/store.ts";
import { useSettingsStore } from "@/features/settings/store.ts";
import { cn, buildHierarchy, buildTagHierarchy } from "@/shared/utils/index.ts";
import type { Tag } from "@/features/tags/types.ts";
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
  onUnparent?: (activeId: string) => void;
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
  onUnparent,
}: TagTabsViewProps) {
  const { t } = useTranslation();
  const { tags } = useTagStore();
  const completedDisplayMode = useSettingsStore(
    (s) => s.completedDisplayMode,
  );
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const tagHierarchy = buildTagHierarchy(tags);

  const getDescendantTagIds = (tagId: string, allTags: Tag[]): string[] => {
    const children = allTags.filter((t) => t.parentId === tagId);
    return children.flatMap((c) => [c.id, ...getDescendantTagIds(c.id, allTags)]);
  };

  const filteredTodos =
    activeTagId === null
      ? todos
      : (() => {
          const relevantTagIds = [activeTagId, ...getDescendantTagIds(activeTagId, tags)];
          return todos.filter((todo) =>
            todo.tagIds.some((id) => relevantTagIds.includes(id)),
          );
        })();

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
        {tagHierarchy.map(({ tag, depth }) => (
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
              marginLeft: depth > 0 ? depth * 8 : undefined,
            }}
          >
            {depth > 0 ? `└ ${tag.name}` : tag.name}
          </button>
        ))}
      </div>

      {/* Todo list with hierarchy */}
      {openHierarchy.length > 0 && onReorder && onReparent ? (
        <SortableTodoList
          items={openHierarchy}
          onReorder={onReorder}
          onReparent={onReparent}
          onUnparent={onUnparent}
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
                    count: completedTodos.length,
                  })
                : t("settings.showCompleted", {
                    count: completedTodos.length,
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
