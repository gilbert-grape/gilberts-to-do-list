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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
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
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    onParentChange(null);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredTodos.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      const todo = filteredTodos[highlightedIndex];
      if (todo) handleSelect(todo);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const hasQuery = query.trim().length > 0;

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
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onBlur={() => {
            setIsOpen(false);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t("todos.parentPlaceholder")}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
        />
      )}

      {isOpen && filteredTodos.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
        >
          {filteredTodos.map((todo, index) => (
            <li
              key={todo.id}
              role="option"
              aria-selected={index === highlightedIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(todo);
              }}
              className={`cursor-pointer px-3 py-2 text-sm text-[var(--color-text)] ${
                index === highlightedIndex
                  ? "bg-[var(--color-primary)] text-white"
                  : "hover:bg-[var(--color-primary)] hover:text-white"
              }`}
            >
              {todo.title}
            </li>
          ))}
        </ul>
      )}

      {isOpen && hasQuery && filteredTodos.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-lg">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t("todos.parentNoResults")}
          </p>
        </div>
      )}
    </div>
  );
}
