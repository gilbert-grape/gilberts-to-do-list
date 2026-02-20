import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTagStore } from "../store.ts";
import { TAG_COLORS } from "../colors.ts";

export interface InlineTagCreateProps {
  onTagCreated: (tagId: string) => void;
}

export function InlineTagCreate({ onTagCreated }: InlineTagCreateProps) {
  const { t } = useTranslation();
  const { tags, createTag } = useTagStore();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(TAG_COLORS[0]!);
  const [isSaving, setIsSaving] = useState(false);

  const trimmedName = name.trim();
  const isDuplicate =
    trimmedName.length > 0 &&
    tags.some((t) => t.name.toLowerCase() === trimmedName.toLowerCase());

  const handleCreate = async () => {
    if (!trimmedName || isDuplicate || isSaving) return;
    setIsSaving(true);
    try {
      const tag = await createTag({
        name: trimmedName,
        color: selectedColor,
        isDefault: false,
        parentId: null,
      });
      onTagCreated(tag.id);
      setName("");
      setSelectedColor(TAG_COLORS[0]!);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName("");
    setSelectedColor(TAG_COLORS[0]!);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-2 border-dashed border-[var(--color-border)] px-3 py-1 text-sm text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        title={t("tags.addNew")}
      >
        +
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCreate();
          if (e.key === "Escape") handleCancel();
        }}
        placeholder={t("tags.namePlaceholder")}
        maxLength={50}
        autoFocus
        className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
      />

      {isDuplicate && (
        <p className="text-xs text-[var(--color-danger)]">
          {t("tags.namePlaceholder")}
        </p>
      )}

      <div
        className="flex flex-wrap gap-1"
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
            className={`h-6 w-6 rounded-full border-2 transition-all ${
              selectedColor === color
                ? "border-[var(--color-text)] scale-110"
                : "border-transparent"
            }`}
            style={{ backgroundColor: color }}
            aria-label={color}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCreate}
          disabled={!trimmedName || isDuplicate || isSaving}
          className="rounded bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {t("tags.create")}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded px-3 py-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
