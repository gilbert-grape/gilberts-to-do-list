import { useTranslation } from "react-i18next";

interface NameStepProps {
  name: string;
  onNameChange: (name: string) => void;
  onNext: () => void;
}

export function NameStep({ name, onNameChange, onNext }: NameStepProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-6 px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">
          {t("onboarding.nameTitle")}
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          {t("onboarding.nameSubtitle")}
        </p>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onNext();
        }}
        placeholder={t("onboarding.namePlaceholder")}
        className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none"
        autoFocus
      />

      <button
        onClick={onNext}
        disabled={!name.trim()}
        className="rounded-lg bg-[var(--color-primary)] px-6 py-3 font-medium text-white disabled:opacity-50"
        type="button"
      >
        {t("common.next")}
      </button>
    </div>
  );
}
