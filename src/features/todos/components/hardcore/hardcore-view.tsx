import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTagStore } from "@/features/tags/store.ts";
import { useTodoStore } from "../../store.ts";
import {
  todosToMarkdown,
  parseMarkdown,
  diffMarkdownTodos,
  renderMarkdownHtml,
} from "@/services/markdown/index.ts";
import { ConfirmDialog } from "@/shared/components/confirm-dialog.tsx";
import type { ParseError } from "@/services/markdown/index.ts";

export type HardcoreViewProps = Record<string, never>;

export function HardcoreView(_props: HardcoreViewProps) {
  const { t } = useTranslation();
  const { tags } = useTagStore();
  const { todos, createTodo, updateTodo, deleteTodo } = useTodoStore();

  const [selectedTagId, setSelectedTagId] = useState<string>(
    () => tags[0]?.id ?? "",
  );
  const [dirtyMarkdown, setDirtyMarkdown] = useState<string | null>(null);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pendingTagSwitch, setPendingTagSwitch] = useState<string | null>(null);

  const selectedTag = useMemo(
    () => tags.find((tag) => tag.id === selectedTagId),
    [tags, selectedTagId],
  );

  const tagTodos = useMemo(
    () => todos.filter((todo) => todo.tagIds.includes(selectedTagId)),
    [todos, selectedTagId],
  );

  const canonicalMarkdown = useMemo(() => {
    if (!selectedTag) return "";
    return todosToMarkdown(selectedTag.name, tagTodos);
  }, [selectedTag, tagTodos]);

  const isDirty = dirtyMarkdown !== null;
  const markdown = dirtyMarkdown ?? canonicalMarkdown;

  const handleTagChange = useCallback(
    (newTagId: string) => {
      if (isDirty) {
        setPendingTagSwitch(newTagId);
      } else {
        setSelectedTagId(newTagId);
        setErrors([]);
        setIsPreview(false);
        setSaveSuccess(false);
      }
    },
    [isDirty],
  );

  const confirmTagSwitch = useCallback(() => {
    if (pendingTagSwitch) {
      setSelectedTagId(pendingTagSwitch);
      setDirtyMarkdown(null);
      setErrors([]);
      setIsPreview(false);
      setSaveSuccess(false);
      setPendingTagSwitch(null);
    }
  }, [pendingTagSwitch]);

  const cancelTagSwitch = useCallback(() => {
    setPendingTagSwitch(null);
  }, []);

  const handleTextChange = useCallback(
    (value: string) => {
      setDirtyMarkdown(value === canonicalMarkdown ? null : value);
      setSaveSuccess(false);
      setErrors([]);
    },
    [canonicalMarkdown],
  );

  const handleSave = useCallback(async () => {
    const result = parseMarkdown(markdown);

    if (result.errors.length > 0) {
      setErrors(result.errors);
      return;
    }

    const diff = diffMarkdownTodos(result.todos, tagTodos, selectedTagId);

    // Apply deletes first
    for (const id of diff.toDelete) {
      await deleteTodo(id);
    }

    // Apply updates
    for (const { id, changes } of diff.toUpdate) {
      await updateTodo(id, changes);
    }

    // Apply creates
    for (const item of diff.toCreate) {
      await createTodo({
        title: item.title,
        description: null,
        tagIds: [selectedTagId],
        parentId: item.parentId,
        dueDate: null,
        recurrence: null,
        recurrenceInterval: null,
      });
    }

    setDirtyMarkdown(null);
    setErrors([]);
    setSaveSuccess(true);
  }, [markdown, tagTodos, selectedTagId, deleteTodo, updateTodo, createTodo]);

  const handleDiscard = useCallback(() => {
    setDirtyMarkdown(null);
    setErrors([]);
    setSaveSuccess(false);
  }, []);

  const handleTogglePreview = useCallback(() => {
    setIsPreview((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!saveSuccess) return;
    const timer = setTimeout(() => setSaveSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [saveSuccess]);

  const previewHtml = useMemo(() => {
    if (!isPreview) return "";
    return renderMarkdownHtml(markdown);
  }, [isPreview, markdown]);

  return (
    <div className="flex flex-col gap-3">
      {/* Tag dropdown */}
      <select
        value={selectedTagId}
        onChange={(e) => handleTagChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
        aria-label={t("hardcore.selectTag")}
      >
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>

      {/* Textarea or preview */}
      {isPreview ? (
        <div
          data-testid="markdown-preview"
          className="min-h-[200px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text)] prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      ) : (
        <textarea
          value={markdown}
          onChange={(e) => handleTextChange(e.target.value)}
          className="min-h-[200px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)]"
          aria-label={t("hardcore.editorLabel")}
          spellCheck={false}
        />
      )}

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="space-y-1" role="alert">
          {errors.map((error) => (
            <p key={`${error.line}-${error.message}`} className="text-xs text-[var(--color-danger)]">
              {t("hardcore.validationError", {
                line: error.line,
                message: t(`hardcore.${error.message}`),
              })}
            </p>
          ))}
        </div>
      )}

      {/* Save success message */}
      {saveSuccess && (
        <p className="text-xs text-[var(--color-success)]">{t("hardcore.saveSuccess")}</p>
      )}

      {/* Button bar */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDiscard}
          disabled={!isDirty}
          className="flex-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-30"
        >
          {t("hardcore.discard")}
        </button>
        <button
          type="button"
          onClick={handleTogglePreview}
          className="flex-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)]"
        >
          {isPreview ? t("hardcore.edit") : t("hardcore.preview")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty}
          className="flex-1 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-30"
        >
          {t("hardcore.save")}
        </button>
      </div>

      {/* Unsaved changes confirm dialog */}
      {pendingTagSwitch && (
        <ConfirmDialog
          title={t("hardcore.discard")}
          message={t("hardcore.unsavedChanges")}
          confirmLabel={t("hardcore.discard")}
          cancelLabel={t("common.cancel")}
          onConfirm={confirmTagSwitch}
          onCancel={cancelTagSwitch}
          variant="default"
        />
      )}
    </div>
  );
}
