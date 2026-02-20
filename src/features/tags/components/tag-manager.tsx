import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTagStore } from "../store.ts";
import { TAG_COLORS } from "../colors.ts";
import { TagChip } from "@/shared/components/tag-chip.tsx";
import { buildTagHierarchy } from "@/shared/utils/index.ts";
import type { Tag } from "../types.ts";

function getDescendantIds(tagId: string, tags: Tag[]): Set<string> {
  const result = new Set<string>();
  const children = tags.filter((t) => t.parentId === tagId);
  for (const child of children) {
    result.add(child.id);
    for (const id of getDescendantIds(child.id, tags)) {
      result.add(id);
    }
  }
  return result;
}

export function TagManager() {
  const { t } = useTranslation();
  const { tags, isLoaded, loadTags, createTag, updateTag, deleteTag, setDefaultTag } =
    useTagStore();

  useEffect(() => {
    if (!isLoaded) {
      void loadTags();
    }
  }, [isLoaded, loadTags]);

  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(TAG_COLORS[0]!);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hierarchy = buildTagHierarchy(tags);

  const handleCreate = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    if (tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) return;
    setError(null);
    try {
      await createTag({
        name: trimmed,
        color: selectedColor,
        isDefault: false,
        parentId: selectedParentId,
      });
      setNewTagName("");
      setSelectedColor(TAG_COLORS[0]!);
      setSelectedParentId(null);
    } catch {
      setError(t("errors.saveFailed"));
    }
  };

  const handleStartEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    setError(null);
    try {
      await updateTag(editingId, { name: trimmed });
      setEditingId(null);
      setEditName("");
    } catch {
      setError(t("errors.saveFailed"));
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleDelete = async (tag: Tag) => {
    setDeleteError(null);

    if (tags.length <= 1) {
      setDeleteError(t("tags.errors.lastTag"));
      return;
    }

    if (tag.isDefault) {
      setConfirmDeleteId(tag.id);
      return;
    }

    try {
      await deleteTag(tag.id);
    } catch {
      setDeleteError(t("errors.deleteFailed"));
    }
  };

  const handleConfirmDeleteDefault = async (newDefaultId: string) => {
    if (!confirmDeleteId) return;
    try {
      await setDefaultTag(newDefaultId);
      await deleteTag(confirmDeleteId);
      setConfirmDeleteId(null);
    } catch {
      setDeleteError(t("errors.deleteFailed"));
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultTag(id);
    } catch {
      setError(t("errors.saveFailed"));
    }
  };

  const handleChangeParent = async (tagId: string, newParentId: string | null) => {
    try {
      await updateTag(tagId, { parentId: newParentId });
    } catch {
      setError(t("errors.saveFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">
        {t("tags.title")}
      </h2>

      {/* Create new tag */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder={t("tags.namePlaceholder")}
            maxLength={50}
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={!newTagName.trim()}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {t("tags.create")}
          </button>
        </div>

        {/* Parent selector */}
        <select
          value={selectedParentId ?? ""}
          onChange={(e) =>
            setSelectedParentId(e.target.value || null)
          }
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
          aria-label={t("tags.parentTag")}
        >
          <option value="">{t("tags.noParent")}</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>

        {/* Color picker */}
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label={t("tags.colorPicker")}
        >
          {TAG_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={selectedColor === color}
              onClick={() => setSelectedColor(color)}
              className={`h-11 w-11 rounded-full border-2 transition-all ${
                selectedColor === color
                  ? "border-[var(--color-text)] scale-110"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
              aria-label={color}
            />
          ))}
        </div>
      </div>

      {/* Error messages */}
      {(deleteError || error) && (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {deleteError || error}
        </p>
      )}

      {/* Reassign default prompt */}
      {confirmDeleteId && (
        <div
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          role="alert"
        >
          <p className="mb-3 text-sm text-[var(--color-text)]">
            {t("tags.selectNewDefault")}
          </p>
          <div className="flex flex-wrap gap-2">
            {tags
              .filter((t) => t.id !== confirmDeleteId)
              .map((tag) => (
                <TagChip
                  key={tag.id}
                  name={tag.name}
                  color={tag.color}
                  onClick={() => handleConfirmDeleteDefault(tag.id)}
                />
              ))}
          </div>
          <button
            type="button"
            onClick={() => setConfirmDeleteId(null)}
            className="mt-3 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          >
            {t("common.cancel")}
          </button>
        </div>
      )}

      {/* Tag list (hierarchical) */}
      <ul className="space-y-2">
        {hierarchy.map(({ tag, depth }) => {
          const descendantIds = getDescendantIds(tag.id, tags);
          const validParents = tags.filter(
            (t) => t.id !== tag.id && !descendantIds.has(t.id),
          );

          return (
            <li
              key={tag.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
              style={{ marginLeft: depth * 24 }}
            >
              <div
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
              />

              {editingId === tag.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit();
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    maxLength={50}
                    className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-sm text-[var(--color-text)]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                  >
                    {t("common.save")}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-sm text-[var(--color-text-secondary)]"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm text-[var(--color-text)]">
                    {tag.name}
                  </span>

                  {tag.isDefault && (
                    <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs text-white">
                      {t("tags.default")}
                    </span>
                  )}

                  {!tag.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(tag.id)}
                      className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                    >
                      {t("tags.setDefault")}
                    </button>
                  )}

                  <select
                    value={tag.parentId ?? ""}
                    onChange={(e) =>
                      handleChangeParent(tag.id, e.target.value || null)
                    }
                    className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1 py-0.5 text-xs text-[var(--color-text-secondary)]"
                    aria-label={t("tags.changeParent")}
                  >
                    <option value="">{t("tags.noParent")}</option>
                    {validParents.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleStartEdit(tag)}
                    className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  >
                    {t("common.edit")}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(tag)}
                    className="text-sm text-[var(--color-danger)] hover:text-[var(--color-danger)]/80"
                  >
                    {t("common.delete")}
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
