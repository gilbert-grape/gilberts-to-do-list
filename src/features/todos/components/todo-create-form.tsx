import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTodoStore } from "../store.ts";
import { useTagStore } from "@/features/tags/store.ts";
import { TagChip } from "@/shared/components/tag-chip.tsx";
import { InlineTagCreate } from "@/features/tags/components/inline-tag-create.tsx";
import { ParentSearchInput } from "@/shared/components/parent-search-input.tsx";
import {
  DueDateRecurrenceSection,
  type RecurrenceType,
} from "./due-date-recurrence-section.tsx";
import { DueDateChips } from "./due-date-chips.tsx";

export interface TodoCreateFormProps {
  onClose: () => void;
  initialParentId?: string | null;
}

export function TodoCreateForm({
  onClose,
  initialParentId = null,
}: TodoCreateFormProps) {
  const { t } = useTranslation();
  const { todos, createTodo } = useTodoStore();
  const { tags } = useTagStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [parentId, setParentId] = useState<string | null>(initialParentId);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [recurrence, setRecurrence] = useState<RecurrenceType>(null);
  const [recurrenceInterval, setRecurrenceInterval] = useState<number | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inherit tags from parent when parent changes
  useEffect(() => {
    if (parentId) {
      const parent = todos.find((todo) => todo.id === parentId);
      if (parent) {
        setSelectedTagIds((prev) => {
          const merged = new Set([...prev, ...parent.tagIds]);
          return [...merged];
        });
      }
    }
  }, [parentId, todos]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSaving) return;
    setIsSaving(true);
    setError(null);

    try {
      await createTodo({
        title: trimmedTitle,
        description: description.trim() || null,
        tagIds: selectedTagIds,
        parentId,
        dueDate,
        recurrence,
        recurrenceInterval,
      });
      onClose();
    } catch {
      setError(t("errors.saveFailed"));
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        placeholder={t("todos.titlePlaceholder")}
        maxLength={200}
        autoFocus
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t("todos.descriptionPlaceholder")}
        rows={2}
        className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
      />

      <ParentSearchInput
        todos={todos}
        selectedParentId={parentId}
        onParentChange={setParentId}
      />

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagChip
            key={tag.id}
            name={tag.name}
            color={tag.color}
            selected={selectedTagIds.includes(tag.id)}
            onClick={() => toggleTag(tag.id)}
          />
        ))}
        <InlineTagCreate
          onTagCreated={(tagId) =>
            setSelectedTagIds((prev) => [...prev, tagId])
          }
        />
      </div>

      <DueDateChips dueDate={dueDate} onDueDateChange={setDueDate} />

      <DueDateRecurrenceSection
        dueDate={dueDate}
        recurrence={recurrence}
        recurrenceInterval={recurrenceInterval}
        onDueDateChange={setDueDate}
        onRecurrenceChange={setRecurrence}
        onRecurrenceIntervalChange={setRecurrenceInterval}
      />

      {error && (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!title.trim() || isSaving}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {t("common.save")}
        </button>
      </div>
    </div>
  );
}
