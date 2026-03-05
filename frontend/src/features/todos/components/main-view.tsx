import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { arrayMove } from "@dnd-kit/sortable";
import {
  startOfDay,
  endOfDay,
  endOfWeek,
  endOfMonth,
  isBefore,
} from "date-fns";
import { useTodoStore } from "../store.ts";
import { useTagStore } from "@/features/tags/store.ts";
import { TAG_COLORS } from "@/features/tags/colors.ts";
import { useSettingsStore } from "@/features/settings/store.ts";
import { GroupedView } from "./grouped-view.tsx";
import { TagTabsView } from "./tag-tabs-view.tsx";
import { SortableTodoList } from "./sortable-todo-list.tsx";
import { TodoCreateForm } from "./todo-create-form.tsx";
import { TodoDetailView } from "./todo-detail-view.tsx";
import { TodoEditForm } from "./todo-edit-form.tsx";
import { TodoItem } from "./todo-item.tsx";
import {
  MindmapFilterBar,
  type StatusFilter,
  type DueDateFilter,
} from "./mindmap/mindmap-filter-bar.tsx";
import {
  ConfirmDialog,
  ChoiceDialog,
} from "@/shared/components/confirm-dialog.tsx";
import type { Todo } from "../types.ts";
import type { Tag } from "@/features/tags/types.ts";

function applyStatusFilter(todos: Todo[], filter: StatusFilter): Todo[] {
  if (filter === "open") return todos.filter((t) => t.status === "open");
  if (filter === "completed") return todos.filter((t) => t.status === "completed");
  return todos;
}

function applyDueDateFilter(todos: Todo[], filter: DueDateFilter): Todo[] {
  if (filter === "all") return todos;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  return todos.filter((todo) => {
    if (!todo.dueDate) return false;
    const due = new Date(todo.dueDate);

    switch (filter) {
      case "overdue":
        return isBefore(due, todayStart) && todo.status === "open";
      case "today":
        return due >= todayStart && due <= todayEnd;
      case "thisWeek":
        return due >= todayStart && due <= endOfWeek(now, { weekStartsOn: 1 });
      case "thisMonth":
        return due >= todayStart && due <= endOfMonth(now);
      default:
        return true;
    }
  });
}

const LazyMindmapView = lazy(() =>
  import("./mindmap/mindmap-view.tsx").then((m) => ({
    default: m.MindmapView,
  })),
);

const LazyHardcoreView = lazy(() =>
  import("./hardcore/hardcore-view.tsx").then((m) => ({
    default: m.HardcoreView,
  })),
);

export function MainView() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    todos,
    isLoaded: todosLoaded,
    loadTodos,
    toggleStatus,
    deleteTodo,
    deleteTodoWithChildren,
    getChildren,
    reorderTodos,
  } = useTodoStore();
  const { tags, isLoaded: tagsLoaded, loadTags, createTag, updateTag } = useTagStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateTagForm, setShowCreateTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState<string>(TAG_COLORS[0]!);
  const [newTagParentId, setNewTagParentId] = useState<string | null>(null);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("");
  const [editTagParentId, setEditTagParentId] = useState<string | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deletingTodo, setDeletingTodo] = useState<Todo | null>(null);
  const [detailTodoId, setDetailTodoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>("all");
  const [actionError, setActionError] = useState<string | null>(null);
  const completedDisplayMode = useSettingsStore(
    (s) => s.completedDisplayMode,
  );
  const activeView = useSettingsStore((s) => s.activeView);
  const layoutMode = useSettingsStore((s) => s.layoutMode);
  const isCompact = layoutMode === "compact";

  // Sync search query from URL params (compact header sets ?q=...)
  const urlQuery = searchParams.get("q");
  if (urlQuery !== null && urlQuery !== searchQuery) {
    setSearchQuery(urlQuery);
  }

  // Handle ?create=1 param from compact header
  const createParam = searchParams.get("create");
  if (createParam === "1") {
    setShowCreateForm(true);
    setCreateParentId(null);
    setEditingTodo(null);
    searchParams.delete("create");
    setSearchParams(searchParams, { replace: true });
  }

  useEffect(() => {
    void loadTags().then(() => loadTodos());
  }, [loadTags, loadTodos]);

  const handleStatusChange = useCallback((filter: StatusFilter) => {
    setStatusFilter(filter);
    if (filter === "completed") {
      setDueDateFilter("all");
    }
  }, []);

  const handleCreateTag = useCallback(async () => {
    const name = newTagName.trim();
    if (!name) return;
    await createTag({
      name,
      color: newTagColor,
      isDefault: false,
      parentId: newTagParentId,
    });
    setNewTagName("");
    setNewTagColor(TAG_COLORS[(tags.length + 1) % TAG_COLORS.length]!);
    setNewTagParentId(null);
    setShowCreateTagForm(false);
  }, [newTagName, newTagColor, newTagParentId, tags.length, createTag]);

  const handleStartEditTag = useCallback((tag: Tag) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
    setEditTagColor(tag.color);
    setEditTagParentId(tag.parentId);
    setShowCreateTagForm(false);
    setShowCreateForm(false);
    setEditingTodo(null);
  }, []);

  const handleSaveTag = useCallback(async () => {
    if (!editingTag) return;
    const name = editTagName.trim();
    if (!name) return;
    await updateTag(editingTag.id, {
      name,
      color: editTagColor,
      parentId: editTagParentId,
    });
    setEditingTag(null);
  }, [editingTag, editTagName, editTagColor, editTagParentId, updateTag]);

  const handleCancelEditTag = useCallback(() => {
    setEditingTag(null);
  }, []);

  const filteredTodos = useMemo(() => {
    let result = todos;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (todo) =>
          todo.title.toLowerCase().includes(query) ||
          (todo.description && todo.description.toLowerCase().includes(query)),
      );
    }

    // Status filter
    result = applyStatusFilter(result, statusFilter);

    // Due date filter (disabled when status=completed)
    if (statusFilter !== "completed") {
      result = applyDueDateFilter(result, dueDateFilter);
    }

    return result;
  }, [todos, searchQuery, statusFilter, dueDateFilter]);

  const sortedTodos = useMemo(
    () => [...filteredTodos].sort((a, b) => a.sortOrder - b.sortOrder),
    [filteredTodos],
  );

  const handleReorder = useCallback(
    (activeId: string, overId: string) => {
      const active = todos.find((t) => t.id === activeId);
      const over = todos.find((t) => t.id === overId);
      if (!active || !over) return;

      const siblings = todos
        .filter(
          (t) =>
            t.parentId === active.parentId &&
            t.status === "open",
        )
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const oldIndex = siblings.findIndex((t) => t.id === activeId);
      const newIndex = siblings.findIndex((t) => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(siblings, oldIndex, newIndex);
      const updates = reordered.map((t, i) => ({ id: t.id, sortOrder: i }));
      void reorderTodos(updates);
    },
    [todos, reorderTodos],
  );

  const handleReparent = useCallback(
    (activeId: string, newParentId: string) => {
      const active = todos.find((t) => t.id === activeId);
      const newParent = todos.find((t) => t.id === newParentId);
      if (!active || !newParent) return;
      if (activeId === newParentId) return;

      // Prevent circular: check if newParent is a descendant of active
      const isDescendant = (parentId: string, checkId: string): boolean => {
        const children = todos.filter((t) => t.parentId === parentId);
        for (const child of children) {
          if (child.id === checkId) return true;
          if (isDescendant(child.id, checkId)) return true;
        }
        return false;
      };
      if (isDescendant(activeId, newParentId)) return;

      const newSiblings = todos
        .filter((t) => t.parentId === newParentId && t.status === "open")
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const newSortOrder =
        newSiblings.length > 0
          ? newSiblings[newSiblings.length - 1]!.sortOrder + 1
          : 0;

      void reorderTodos([
        {
          id: activeId,
          sortOrder: newSortOrder,
          parentId: newParentId,
          tagIds: newParent.tagIds,
        },
      ]);
    },
    [todos, reorderTodos],
  );

  const handleUnparent = useCallback(
    (activeId: string) => {
      const active = todos.find((t) => t.id === activeId);
      if (!active || !active.parentId) return;

      const parent = todos.find((t) => t.id === active.parentId);
      const newParentId = parent?.parentId ?? null;

      const newSiblings = todos
        .filter((t) => t.parentId === newParentId && t.status === "open")
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const newSortOrder =
        newSiblings.length > 0
          ? newSiblings[newSiblings.length - 1]!.sortOrder + 1
          : 0;

      void reorderTodos([
        {
          id: activeId,
          sortOrder: newSortOrder,
          parentId: newParentId,
        },
      ]);
    },
    [todos, reorderTodos],
  );

  if (!tagsLoaded || !todosLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-[var(--color-text-secondary)]">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  const openTodos = sortedTodos.filter((todo) => todo.status === "open");
  const completedTodos = sortedTodos.filter(
    (todo) => todo.status === "completed",
  );

  const handleTitleClick = (todo: Todo) => {
    setDetailTodoId(todo.id);
    setShowCreateForm(false);
    setEditingTodo(null);
  };

  const handleDetailBack = () => {
    setDetailTodoId(null);
  };

  const handleDetailEdit = (todo: Todo) => {
    setDetailTodoId(null);
    setEditingTodo(todo);
    setShowCreateForm(false);
  };

  const handleDetailDelete = (todo: Todo) => {
    setDetailTodoId(null);
    setDeletingTodo(todo);
  };

  const handleCreateSibling = (todo: Todo) => {
    setCreateParentId(todo.parentId);
    setShowCreateForm(true);
    setEditingTodo(null);
  };

  const handleCreateChild = (todo: Todo) => {
    setCreateParentId(todo.id);
    setShowCreateForm(true);
    setEditingTodo(null);
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setShowCreateForm(false);
  };

  const handleDelete = (todo: Todo) => {
    setDeletingTodo(todo);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTodo) return;
    try {
      await deleteTodo(deletingTodo.id);
      setDeletingTodo(null);
      setActionError(null);
    } catch {
      setDeletingTodo(null);
      setActionError(t("errors.deleteFailed"));
    }
  };

  const handleDeleteWithChildren = async (mode: string) => {
    if (!deletingTodo) return;
    try {
      await deleteTodoWithChildren(
        deletingTodo.id,
        mode as "delete-all" | "keep-children",
      );
      setDeletingTodo(null);
      setActionError(null);
    } catch {
      setDeletingTodo(null);
      setActionError(t("errors.deleteFailed"));
    }
  };

  const hasChildren = deletingTodo
    ? getChildren(deletingTodo.id).length > 0
    : false;

  const detailTodo = detailTodoId
    ? (todos.find((t) => t.id === detailTodoId) ?? null)
    : null;

  if (detailTodo) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <TodoDetailView
          todo={detailTodo}
          onBack={handleDetailBack}
          onEdit={handleDetailEdit}
          onDelete={handleDetailDelete}
          onSubTodoClick={handleTitleClick}
        />

        {editingTodo && (
          <TodoEditForm
            todo={editingTodo}
            onClose={() => setEditingTodo(null)}
            onDelete={handleDelete}
          />
        )}

        {/* Delete confirmation dialog */}
        {deletingTodo && !hasChildren && (
          <ConfirmDialog
            title={t("todos.deleteTitle")}
            message={t("todos.deleteMessage")}
            confirmLabel={t("common.delete")}
            cancelLabel={t("common.cancel")}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeletingTodo(null)}
          />
        )}

        {deletingTodo && hasChildren && (
          <ChoiceDialog
            title={t("todos.deleteWithChildrenTitle")}
            message={t("todos.deleteWithChildrenMessage")}
            choices={[
              {
                label: t("todos.deleteAll"),
                value: "delete-all",
              },
              {
                label: t("todos.keepChildren"),
                value: "keep-children",
              },
            ]}
            cancelLabel={t("common.cancel")}
            onChoice={handleDeleteWithChildren}
            onCancel={() => setDeletingTodo(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Filter bar + Search + New Todo/Tag buttons */}
      {isCompact ? (
        <div className="flex items-center gap-2">
          <MindmapFilterBar
            statusFilter={statusFilter}
            dueDateFilter={dueDateFilter}
            onStatusChange={handleStatusChange}
            onDueDateChange={setDueDateFilter}
          />
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => {
              setShowCreateForm((prev) => !prev);
              setShowCreateTagForm(false);
              setCreateParentId(null);
              setEditingTodo(null);
              setEditingTag(null);
            }}
            className="flex h-[30px] items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-2 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)] md:px-3 md:text-sm"
            aria-label={showCreateForm ? t("common.cancel") : t("todos.newTodoCompact")}
          >
            {showCreateForm ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" /></svg>
            )}
            <span className="hidden md:inline">{showCreateForm ? t("common.cancel") : t("todos.newTodoCompact")}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreateTagForm((prev) => !prev);
              setShowCreateForm(false);
              setEditingTodo(null);
              setEditingTag(null);
            }}
            className="flex h-[30px] items-center gap-1.5 rounded-lg border border-[var(--color-primary)] px-2 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white md:px-3 md:text-sm"
            aria-label={showCreateTagForm ? t("common.cancel") : t("tags.newTagCompact")}
          >
            {showCreateTagForm ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            ) : (
              <span className="text-xs font-bold">#</span>
            )}
            <span className="hidden md:inline">{showCreateTagForm ? t("common.cancel") : t("tags.newTagCompact")}</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <MindmapFilterBar
            statusFilter={statusFilter}
            dueDateFilter={dueDateFilter}
            onStatusChange={handleStatusChange}
            onDueDateChange={setDueDateFilter}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("common.search")}
            aria-label={t("common.search")}
            className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
          />
          <button
            type="button"
            onClick={() => setSearchQuery(searchQuery)}
            aria-label={t("common.search")}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreateForm((prev) => !prev);
              setShowCreateTagForm(false);
              setCreateParentId(null);
              setEditingTodo(null);
              setEditingTag(null);
            }}
            className="flex h-[30px] items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-2 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)] md:px-4 md:text-sm"
          >
            {showCreateForm ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 md:hidden"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0 md:hidden"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" /></svg>
            )}
            <span className="hidden md:inline">{showCreateForm ? t("common.cancel") : t("todos.newTodo")}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreateTagForm((prev) => !prev);
              setShowCreateForm(false);
              setEditingTodo(null);
              setEditingTag(null);
            }}
            className="flex h-[30px] items-center gap-1.5 rounded-lg border border-[var(--color-primary)] px-2 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white md:px-4 md:text-sm"
          >
            {showCreateTagForm ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 md:hidden"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            ) : (
              <span className="text-xs font-bold md:hidden">#</span>
            )}
            <span className="hidden md:inline">{showCreateTagForm ? t("common.cancel") : t("tags.newTag")}</span>
          </button>
        </div>
      )}

      {actionError && (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {actionError}
        </p>
      )}

      {showCreateForm && (
        <TodoCreateForm
          initialParentId={createParentId}
          onClose={() => {
            setShowCreateForm(false);
            setCreateParentId(null);
          }}
        />
      )}

      {showCreateTagForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleCreateTag();
          }}
          className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          data-testid="create-tag-form"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder={t("tags.namePlaceholder")}
              autoFocus
              maxLength={50}
              className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
            />
            <button
              type="submit"
              disabled={!newTagName.trim()}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40"
            >
              {t("tags.create")}
            </button>
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={t("tags.colorPicker")}
            data-testid="create-tag-color-picker"
          >
            {TAG_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={newTagColor === color}
                onClick={() => setNewTagColor(color)}
                className={`h-8 w-8 rounded-full border-2 transition-all ${
                  newTagColor === color
                    ? "border-[var(--color-text)] scale-110"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
                aria-label={color}
              />
            ))}
          </div>

          <select
            value={newTagParentId ?? ""}
            onChange={(e) => setNewTagParentId(e.target.value || null)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
            aria-label={t("tags.parentTag")}
            data-testid="create-tag-parent-select"
          >
            <option value="">{t("tags.noParent")}</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </form>
      )}

      {editingTag && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSaveTag();
          }}
          className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          data-testid="edit-tag-form"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={editTagName}
              onChange={(e) => setEditTagName(e.target.value)}
              placeholder={t("tags.namePlaceholder")}
              autoFocus
              maxLength={50}
              className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
              data-testid="edit-tag-name"
            />
            <button
              type="submit"
              disabled={!editTagName.trim()}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40"
              data-testid="edit-tag-save"
            >
              {t("common.save")}
            </button>
            <button
              type="button"
              onClick={handleCancelEditTag}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              data-testid="edit-tag-cancel"
            >
              {t("common.cancel")}
            </button>
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={t("tags.colorPicker")}
            data-testid="edit-tag-color-picker"
          >
            {TAG_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={editTagColor === color}
                onClick={() => setEditTagColor(color)}
                className={`h-8 w-8 rounded-full border-2 transition-all ${
                  editTagColor === color
                    ? "border-[var(--color-text)] scale-110"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
                aria-label={color}
              />
            ))}
          </div>

          <select
            value={editTagParentId ?? ""}
            onChange={(e) => setEditTagParentId(e.target.value || null)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
            aria-label={t("tags.parentTag")}
            data-testid="edit-tag-parent-select"
          >
            <option value="">{t("tags.noParent")}</option>
            {tags.filter((tg) => tg.id !== editingTag.id).map((tg) => (
              <option key={tg.id} value={tg.id}>
                {tg.name}
              </option>
            ))}
          </select>
        </form>
      )}

      {editingTodo && (
        <TodoEditForm todo={editingTodo} onClose={() => setEditingTodo(null)} onDelete={handleDelete} />
      )}

      {filteredTodos.length === 0 &&
        !searchQuery &&
        activeView !== "hardcore" && (
          <p className="text-center text-[var(--color-text-secondary)]">
            {t("placeholder.main")}
          </p>
        )}

      {filteredTodos.length === 0 &&
        searchQuery &&
        activeView !== "hardcore" && (
          <p className="text-center text-[var(--color-text-secondary)]">
            {t("todos.noResults")}
          </p>
        )}

      {filteredTodos.length > 0 && activeView === "tagTabs" && (
        <TagTabsView
          todos={filteredTodos}
          onToggle={toggleStatus}
          onTitleClick={handleTitleClick}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreateSibling={handleCreateSibling}
          onCreateChild={handleCreateChild}
          onReorder={handleReorder}
          onReparent={handleReparent}
          onUnparent={handleUnparent}
        />
      )}

      {filteredTodos.length > 0 && activeView === "grouped" && (
        <GroupedView
          todos={filteredTodos}
          onToggle={toggleStatus}
          onTitleClick={handleTitleClick}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreateSibling={handleCreateSibling}
          onCreateChild={handleCreateChild}
          onReorder={handleReorder}
          onReparent={handleReparent}
          onUnparent={handleUnparent}
        />
      )}

      {filteredTodos.length > 0 && activeView === "mindmap" && (
        <Suspense
          fallback={
            <p className="text-center text-[var(--color-text-secondary)]">
              {t("common.loading")}
            </p>
          }
        >
          <LazyMindmapView
            todos={filteredTodos}
            onToggle={toggleStatus}
            onTitleClick={handleTitleClick}
            onEdit={handleEdit}
            onEditTag={handleStartEditTag}
          />
        </Suspense>
      )}

      {activeView === "hardcore" && (
        <Suspense
          fallback={
            <p className="text-center text-[var(--color-text-secondary)]">
              {t("common.loading")}
            </p>
          }
        >
          <LazyHardcoreView />
        </Suspense>
      )}

      {filteredTodos.length > 0 && activeView === "flatList" && (
        <>
          {openTodos.length > 0 && (
            <SortableTodoList
              items={openTodos.map((todo) => ({ todo, depth: 0 }))}
              onReorder={handleReorder}
              onReparent={handleReparent}
              onUnparent={handleUnparent}
              onToggle={toggleStatus}
              onTitleClick={handleTitleClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreateSibling={handleCreateSibling}
              onCreateChild={handleCreateChild}
            />
          )}

          {completedTodos.length > 0 &&
            completedDisplayMode === "bottom" && (
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
                  {t("todos.completed")} ({completedTodos.length})
                </h3>
                <ul className="space-y-2">
                  {completedTodos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={toggleStatus}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onCreateSibling={handleCreateSibling}
                      onCreateChild={handleCreateChild}
                    />
                  ))}
                </ul>
              </div>
            )}

          {completedTodos.length > 0 &&
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
                    {completedTodos.map((todo) => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={toggleStatus}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onCreateSibling={handleCreateSibling}
                        onCreateChild={handleCreateChild}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )}
        </>
      )}

      {/* Delete confirmation dialog */}
      {deletingTodo && !hasChildren && (
        <ConfirmDialog
          title={t("todos.deleteTitle")}
          message={t("todos.deleteMessage")}
          confirmLabel={t("common.delete")}
          cancelLabel={t("common.cancel")}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTodo(null)}
        />
      )}

      {deletingTodo && hasChildren && (
        <ChoiceDialog
          title={t("todos.deleteWithChildrenTitle")}
          message={t("todos.deleteWithChildrenMessage")}
          choices={[
            {
              label: t("todos.deleteAll"),
              value: "delete-all",
            },
            {
              label: t("todos.keepChildren"),
              value: "keep-children",
              variant: "default" as const,
            },
          ]}
          cancelLabel={t("common.cancel")}
          onChoice={handleDeleteWithChildren}
          onCancel={() => setDeletingTodo(null)}
        />
      )}
    </div>
  );
}
