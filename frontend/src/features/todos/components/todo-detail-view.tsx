import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useTagStore } from "@/features/tags/store.ts";
import { useTodoStore } from "../store.ts";
import type { Todo } from "../types.ts";

export interface TodoDetailViewProps {
  todo: Todo;
  onBack: () => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onSubTodoClick: (todo: Todo) => void;
}

export function TodoDetailView({
  todo,
  onBack,
  onEdit,
  onDelete,
  onSubTodoClick,
}: TodoDetailViewProps) {
  const { t } = useTranslation();
  const { tags } = useTagStore();
  const { todos } = useTodoStore();

  const todoTags = tags.filter((tag) => todo.tagIds.includes(tag.id));
  const parentTodo = todo.parentId
    ? todos.find((t) => t.id === todo.parentId)
    : null;
  const subTodos = todos.filter((t) => t.parentId === todo.id);

  const recurrenceLabel = todo.recurrence
    ? todo.recurrence === "custom" && todo.recurrenceInterval
      ? t("todos.recurrenceCustomInterval", {
          count: todo.recurrenceInterval,
        })
      : t(
          `todos.recurrence${todo.recurrence.charAt(0).toUpperCase() + todo.recurrence.slice(1)}`,
        )
    : null;

  return (
    <div className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {/* Header with back button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("common.back")}
          className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h2 className="flex-1 text-lg font-semibold text-[var(--color-text)]">
          {todo.title}
        </h2>
        <span
          className={
            todo.status === "completed"
              ? "rounded-full bg-[var(--color-success)] px-2 py-0.5 text-xs font-medium text-white"
              : "rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-medium text-white"
          }
        >
          {todo.status === "completed"
            ? t("todos.statusCompleted")
            : t("todos.statusOpen")}
        </span>
      </div>

      {/* Description */}
      {todo.description && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          {todo.description}
        </p>
      )}

      {/* Tags */}
      {todoTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {todoTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Due date */}
      {todo.dueDate && (
        <div className="text-sm text-[var(--color-text-secondary)]">
          <span className="font-medium">{t("todos.dueDate")}:</span>{" "}
          {format(new Date(todo.dueDate + "T00:00:00"), "MMM d, yyyy")}
        </div>
      )}

      {/* Recurrence */}
      {recurrenceLabel && (
        <div className="text-sm text-[var(--color-text-secondary)]">
          <span className="font-medium">{t("todos.recurrence")}:</span>{" "}
          {recurrenceLabel}
        </div>
      )}

      {/* Parent */}
      {parentTodo && (
        <div className="text-sm text-[var(--color-text-secondary)]">
          <span className="font-medium">{t("todos.parentLabel")}:</span>{" "}
          <button
            type="button"
            onClick={() => onSubTodoClick(parentTodo)}
            className="text-[var(--color-primary)] hover:underline"
          >
            {parentTodo.title}
          </button>
        </div>
      )}

      {/* Sub-todos */}
      {subTodos.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
            {t("todos.subTodos")} ({subTodos.length})
          </h3>
          <ul className="space-y-1">
            {subTodos.map((sub) => (
              <li key={sub.id}>
                <button
                  type="button"
                  onClick={() => onSubTodoClick(sub)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-[var(--color-bg)]"
                >
                  <span
                    className={
                      sub.status === "completed"
                        ? "text-[var(--color-text-secondary)] line-through opacity-60"
                        : "text-[var(--color-text)]"
                    }
                  >
                    {sub.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 border-t border-[var(--color-border)] pt-3">
        <button
          type="button"
          onClick={() => onEdit(todo)}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
        >
          {t("common.edit")}
        </button>
        <button
          type="button"
          onClick={() => onDelete(todo)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white"
        >
          {t("common.delete")}
        </button>
      </div>
    </div>
  );
}
