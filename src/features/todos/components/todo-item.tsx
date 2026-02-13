import { format, isPast, isToday } from "date-fns";
import { cn } from "@/shared/utils/index.ts";
import { useTagStore } from "@/features/tags/store.ts";
import type { Todo } from "../types.ts";

export interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onEdit?: (todo: Todo) => void;
  onDelete?: (todo: Todo) => void;
  onTitleClick?: (todo: Todo) => void;
  onCreateSibling?: (todo: Todo) => void;
  onCreateChild?: (todo: Todo) => void;
}

export function TodoItem({
  todo,
  onToggle,
  onEdit,
  onDelete,
  onTitleClick,
  onCreateSibling,
  onCreateChild,
}: TodoItemProps) {
  const { tags } = useTagStore();
  const isCompleted = todo.status === "completed";
  const todoTags = tags.filter((tag) => todo.tagIds.includes(tag.id));

  return (
    <li className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={isCompleted}
        onClick={() => onToggle(todo.id)}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
          isCompleted
            ? "border-[var(--color-success)] bg-[var(--color-success)]"
            : "border-[var(--color-border)] hover:border-[var(--color-primary)]",
        )}
      >
        {isCompleted && (
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      {onTitleClick ? (
        <button
          type="button"
          onClick={() => onTitleClick(todo)}
          className={cn(
            "flex-1 text-left text-sm hover:underline",
            isCompleted
              ? "text-[var(--color-text-secondary)] line-through opacity-60"
              : "text-[var(--color-text)]",
          )}
        >
          {todo.title}
        </button>
      ) : (
        <span
          className={cn(
            "flex-1 text-sm",
            isCompleted
              ? "text-[var(--color-text-secondary)] line-through opacity-60"
              : "text-[var(--color-text)]",
          )}
        >
          {todo.title}
        </span>
      )}

      {todo.dueDate && (
        <span
          className={cn(
            "shrink-0 text-xs",
            isCompleted
              ? "text-[var(--color-text-secondary)] opacity-60"
              : isPast(new Date(todo.dueDate + "T00:00:00")) &&
                  !isToday(new Date(todo.dueDate + "T00:00:00"))
                ? "font-medium text-[var(--color-danger)]"
                : isToday(new Date(todo.dueDate + "T00:00:00"))
                  ? "font-medium text-[var(--color-warning)]"
                  : "text-[var(--color-text-secondary)]",
          )}
        >
          {format(new Date(todo.dueDate + "T00:00:00"), "MMM d")}
        </span>
      )}

      <div className="flex gap-1">
        {todoTags.map((tag) => (
          <div
            key={tag.id}
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: tag.color }}
            title={tag.name}
          />
        ))}
      </div>

      {onCreateSibling && (
        <button
          type="button"
          onClick={() => onCreateSibling(todo)}
          aria-label="Create sibling"
          className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      )}

      {onCreateChild && (
        <button
          type="button"
          onClick={() => onCreateChild(todo)}
          aria-label="Create sub-todo"
          className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
            />
          </svg>
        </button>
      )}

      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(todo)}
          aria-label="Edit"
          className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(todo)}
          aria-label="Delete"
          className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </li>
  );
}
