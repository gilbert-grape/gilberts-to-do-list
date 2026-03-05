import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TAG_COLORS } from "@/features/tags/colors.ts";
import type { OnboardingTag } from "../types.ts";

interface TagsStepProps {
  tags: OnboardingTag[];
  onAddTag: (name: string, color: string) => void;
  onRemoveTag: (tempId: number) => void;
  onRenameTag: (tempId: number, name: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function TagsStep({
  tags,
  onAddTag,
  onRemoveTag,
  onRenameTag,
  onNext,
  onBack,
}: TagsStepProps) {
  const { t } = useTranslation();
  const [newTagName, setNewTagName] = useState("");

  const handleAdd = () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    const colorIndex = tags.length % TAG_COLORS.length;
    onAddTag(trimmed, TAG_COLORS[colorIndex]!);
    setNewTagName("");
  };

  return (
    <div className="flex flex-col items-center gap-6 px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">
          {t("onboarding.tagsTitle")}
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          {t("onboarding.tagsSubtitle")}
        </p>
      </div>

      <div className="w-full max-w-sm">
        <ul className="flex flex-col gap-2">
          {tags.map((tag) => (
            <li key={tag.tempId} className="flex items-center gap-2">
              <span
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <input
                type="text"
                value={tag.name}
                onChange={(e) => onRenameTag(tag.tempId, e.target.value)}
                className="min-w-0 flex-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[var(--color-text)]"
                aria-label={tag.name}
              />
              <button
                onClick={() => onRemoveTag(tag.tempId)}
                disabled={tags.length <= 1}
                className="shrink-0 rounded p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] disabled:opacity-30"
                type="button"
                aria-label={`${t("common.delete")} ${tag.name}`}
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
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            placeholder={t("onboarding.tagsAddPlaceholder")}
            className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
          />
          <button
            onClick={handleAdd}
            disabled={!newTagName.trim()}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 font-medium text-white disabled:opacity-50"
            type="button"
          >
            {t("onboarding.tagsAdd")}
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="rounded-lg border border-[var(--color-border)] px-6 py-3 font-medium text-[var(--color-text)]"
          type="button"
        >
          {t("common.back")}
        </button>
        <button
          onClick={onNext}
          disabled={tags.length === 0}
          className="rounded-lg bg-[var(--color-primary)] px-6 py-3 font-medium text-white disabled:opacity-50"
          type="button"
        >
          {t("common.next")}
        </button>
      </div>
    </div>
  );
}
