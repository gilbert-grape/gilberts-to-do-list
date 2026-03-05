import { useTranslation } from "react-i18next";
import type { OnboardingTag, DefaultTagChoice } from "../types.ts";

interface SummaryStepProps {
  name: string;
  tags: OnboardingTag[];
  defaultTagChoice: DefaultTagChoice;
  isCompleting: boolean;
  onComplete: () => void;
  onBack: () => void;
}

export function SummaryStep({
  name,
  tags,
  defaultTagChoice,
  isCompleting,
  onComplete,
  onBack,
}: SummaryStepProps) {
  const { t } = useTranslation();

  const defaultTagName =
    defaultTagChoice.kind === "create-default"
      ? t("onboarding.defaultTagOption")
      : (tags.find((tag) => tag.tempId === defaultTagChoice.tempId)?.name ??
        "");

  return (
    <div className="flex flex-col items-center gap-6 px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">
          {t("onboarding.summaryTitle", { name })}
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          {t("onboarding.summarySubtitle")}
        </p>
      </div>

      <div className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <p className="text-[var(--color-text)]">
          {t("onboarding.summaryTagCount", { count: tags.length })}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.tempId}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm"
              style={{ backgroundColor: tag.color + "20", color: tag.color }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[var(--color-text-secondary)]">
          {t("onboarding.summaryDefaultTag", { name: defaultTagName })}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isCompleting}
          className="rounded-lg border border-[var(--color-border)] px-6 py-3 font-medium text-[var(--color-text)] disabled:opacity-50"
          type="button"
        >
          {t("common.back")}
        </button>
        <button
          onClick={onComplete}
          disabled={isCompleting}
          className="rounded-lg bg-[var(--color-primary)] px-6 py-3 font-medium text-white disabled:opacity-50"
          type="button"
        >
          {t("onboarding.summaryLetsGo")}
        </button>
      </div>
    </div>
  );
}
