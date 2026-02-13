import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTodoStore, setTodoStorageAdapter } from "../store.ts";
import { useTagStore, setStorageAdapter } from "@/features/tags/store.ts";
import { db } from "@/services/storage/indexeddb/db.ts";
import { IndexedDBAdapter } from "@/services/storage/indexeddb/indexeddb-adapter.ts";
import { GroupedView } from "./grouped-view.tsx";
import { TagTabsView } from "./tag-tabs-view.tsx";
import { TodoCreateForm } from "./todo-create-form.tsx";
import { TodoDetailView } from "./todo-detail-view.tsx";
import { TodoEditForm } from "./todo-edit-form.tsx";
import { TodoItem } from "./todo-item.tsx";
import { ViewToggleBar } from "./view-toggle-bar.tsx";
import {
  ConfirmDialog,
  ChoiceDialog,
} from "@/shared/components/confirm-dialog.tsx";
import type { Todo } from "../types.ts";
import type { ViewType } from "./view-toggle-bar.tsx";

const LazyMindmapView = lazy(() =>
  import("./mindmap/mindmap-view.tsx").then((m) => ({
    default: m.MindmapView,
  })),
);

const VIEW_STORAGE_KEY = "gilberts-todo-active-view";
const VALID_VIEWS: ViewType[] = [
  "flatList",
  "tagTabs",
  "grouped",
  "mindmap",
  "hardcore",
];

function loadSavedView(): ViewType {
  try {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    if (saved && VALID_VIEWS.includes(saved as ViewType)) {
      return saved as ViewType;
    }
  } catch {
    // localStorage unavailable
  }
  return "flatList";
}

export function MainView() {
  const { t } = useTranslation();
  const {
    todos,
    isLoaded: todosLoaded,
    loadTodos,
    toggleStatus,
    deleteTodo,
    deleteTodoWithChildren,
    getChildren,
  } = useTodoStore();
  const { isLoaded: tagsLoaded, loadTags } = useTagStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deletingTodo, setDeletingTodo] = useState<Todo | null>(null);
  const [detailTodoId, setDetailTodoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState<ViewType>(loadSavedView);

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      // localStorage unavailable
    }
  };

  useEffect(() => {
    const adapter = new IndexedDBAdapter(db);
    setStorageAdapter(adapter);
    setTodoStorageAdapter(adapter);
    void loadTags().then(() => loadTodos());
  }, [loadTags, loadTodos]);

  const filteredTodos = useMemo(() => {
    if (!searchQuery.trim()) return todos;
    const query = searchQuery.toLowerCase();
    return todos.filter(
      (todo) =>
        todo.title.toLowerCase().includes(query) ||
        (todo.description && todo.description.toLowerCase().includes(query)),
    );
  }, [todos, searchQuery]);

  if (!tagsLoaded || !todosLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-[var(--color-text-secondary)]">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  const openTodos = filteredTodos.filter((todo) => todo.status === "open");
  const completedTodos = filteredTodos.filter(
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
    await deleteTodo(deletingTodo.id);
    setDeletingTodo(null);
  };

  const handleDeleteWithChildren = async (mode: string) => {
    if (!deletingTodo) return;
    await deleteTodoWithChildren(
      deletingTodo.id,
      mode as "delete-all" | "keep-children",
    );
    setDeletingTodo(null);
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
      <ViewToggleBar activeView={activeView} onViewChange={handleViewChange} />

      {/* Search bar */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t("common.search")}
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
      />

      <button
        type="button"
        onClick={() => {
          setShowCreateForm((prev) => !prev);
          setCreateParentId(null);
          setEditingTodo(null);
        }}
        className="w-full rounded-lg bg-[var(--color-primary)] py-3 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
      >
        {showCreateForm ? t("common.cancel") : t("todos.newTodo")}
      </button>

      {showCreateForm && (
        <TodoCreateForm
          initialParentId={createParentId}
          onClose={() => {
            setShowCreateForm(false);
            setCreateParentId(null);
          }}
        />
      )}

      {editingTodo && (
        <TodoEditForm todo={editingTodo} onClose={() => setEditingTodo(null)} />
      )}

      {filteredTodos.length === 0 && !searchQuery && (
        <p className="text-center text-[var(--color-text-secondary)]">
          {t("placeholder.main")}
        </p>
      )}

      {filteredTodos.length === 0 && searchQuery && (
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
          />
        </Suspense>
      )}

      {filteredTodos.length > 0 && activeView === "flatList" && (
        <>
          {openTodos.length > 0 && (
            <ul className="space-y-2">
              {openTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleStatus}
                  onTitleClick={handleTitleClick}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCreateSibling={handleCreateSibling}
                  onCreateChild={handleCreateChild}
                />
              ))}
            </ul>
          )}

          {completedTodos.length > 0 && (
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
