import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Todo } from "@/features/todos/types.ts";

export interface ParentSearchInputProps {
  todos: Todo[];
  selectedParentId: string | null;
  onParentChange: (parentId: string | null) => void;
  excludeIds?: string[];
}

export function ParentSearchInput({
  todos,
  selectedParentId,
  onParentChange,
  excludeIds = [],
}: ParentSearchInputProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedParent = todos.find((todo) => todo.id === selectedParentId);

  const filteredTodos = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return todos
      .filter(
        (todo) =>
          !excludeIds.includes(todo.id) &&
          todo.status === "open" &&
          todo.title.toLowerCase().includes(lowerQuery),
      )
      .slice(0, 10);
  }, [todos, query, excludeIds]);

  const handleSelect = (todo: Todo) => {
    onParentChange(todo.id);
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onParentChange(null);
    setQuery("");
  };

  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
        {t("todos.parentLabel")}
      </label>

      {selectedParent ? (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm">
          <span className="flex-1 text-[var(--color-text)]">
            {selectedParent.title}
          </span>
          <button
            type="button"
            onClick={handleClear}
            aria-label={t("todos.clearParent")}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.trim().length > 0);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onBlur={() => setIsOpen(false)}
          placeholder={t("todos.parentPlaceholder")}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
        />
      )}

      {isOpen && filteredTodos.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
        >
          {filteredTodos.map((todo) => (
            <li
              key={todo.id}
              role="option"
              aria-selected={false}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(todo);
              }}
              className="cursor-pointer px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-primary)] hover:text-white"
            >
              {todo.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
