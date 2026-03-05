import { useTranslation } from "react-i18next";
import type { OnboardingTag, DefaultTagChoice } from "../types.ts";

interface DefaultTagStepProps {
  tags: OnboardingTag[];
  defaultTagChoice: DefaultTagChoice;
  onSetDefaultTagChoice: (choice: DefaultTagChoice) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DefaultTagStep({
  tags,
  defaultTagChoice,
  onSetDefaultTagChoice,
  onNext,
  onBack,
}: DefaultTagStepProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-6 px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">
          {t("onboarding.defaultTagTitle")}
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          {t("onboarding.defaultTagSubtitle")}
        </p>
      </div>

      <div
        className="flex w-full max-w-sm flex-col gap-2"
        role="radiogroup"
        aria-label={t("onboarding.defaultTagTitle")}
      >
        <label
          className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors ${
            defaultTagChoice.kind === "create-default"
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
              : "border-[var(--color-border)] bg-[var(--color-surface)]"
          }`}
        >
          <input
            type="radio"
            name="default-tag"
            checked={defaultTagChoice.kind === "create-default"}
            onChange={() => onSetDefaultTagChoice({ kind: "create-default" })}
            className="accent-[var(--color-primary)]"
          />
          <span className="font-medium text-[var(--color-text)]">
            {t("onboarding.defaultTagOption")}
          </span>
        </label>

        {tags.map((tag) => {
          const selected =
            defaultTagChoice.kind === "existing" &&
            defaultTagChoice.tempId === tag.tempId;
          return (
            <label
              key={tag.tempId}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors ${
                selected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]"
              }`}
            >
              <input
                type="radio"
                name="default-tag"
                checked={selected}
                onChange={() =>
                  onSetDefaultTagChoice({
                    kind: "existing",
                    tempId: tag.tempId,
                  })
                }
                className="accent-[var(--color-primary)]"
              />
              <span
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <span className="text-[var(--color-text)]">{tag.name}</span>
            </label>
          );
        })}
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
          className="rounded-lg bg-[var(--color-primary)] px-6 py-3 font-medium text-white"
          type="button"
        >
          {t("common.next")}
        </button>
      </div>
    </div>
  );
}
