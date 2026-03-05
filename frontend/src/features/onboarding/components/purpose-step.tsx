import { useTranslation } from "react-i18next";
import type { Purpose } from "../types.ts";

interface PurposeStepProps {
  purposes: Purpose[];
  onTogglePurpose: (purpose: Purpose) => void;
  onNext: () => void;
  onBack: () => void;
}

const PURPOSE_OPTIONS: { value: Purpose; labelKey: string; descKey: string }[] =
  [
    {
      value: "personal",
      labelKey: "onboarding.purposePersonal",
      descKey: "onboarding.purposePersonalDesc",
    },
    {
      value: "work",
      labelKey: "onboarding.purposeWork",
      descKey: "onboarding.purposeWorkDesc",
    },
    {
      value: "hobby",
      labelKey: "onboarding.purposeHobby",
      descKey: "onboarding.purposeHobbyDesc",
    },
  ];

export function PurposeStep({
  purposes,
  onTogglePurpose,
  onNext,
  onBack,
}: PurposeStepProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-6 px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">
          {t("onboarding.purposeTitle")}
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          {t("onboarding.purposeSubtitle")}
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {PURPOSE_OPTIONS.map((option) => {
          const selected = purposes.includes(option.value);
          return (
            <button
              key={option.value}
              onClick={() => onTogglePurpose(option.value)}
              className={`rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                selected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]"
              }`}
              type="button"
              aria-pressed={selected}
            >
              <div className="font-medium text-[var(--color-text)]">
                {t(option.labelKey)}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                {t(option.descKey)}
              </div>
            </button>
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
          disabled={purposes.length === 0}
          className="rounded-lg bg-[var(--color-primary)] px-6 py-3 font-medium text-white disabled:opacity-50"
          type="button"
        >
          {t("common.next")}
        </button>
      </div>
    </div>
  );
}
