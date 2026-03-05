import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../store.ts";
import type { Language } from "../store.ts";

const LANGUAGE_OPTIONS: { value: Language; labelKey: string }[] = [
  { value: "en", labelKey: "settings.languageEn" },
  { value: "de", labelKey: "settings.languageDe" },
];

export function LanguageSection() {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">
        {t("settings.language")}
      </h2>
      <div role="radiogroup" aria-label={t("settings.language")}>
        {LANGUAGE_OPTIONS.map(({ value, labelKey }) => (
          <label
            key={value}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-[var(--color-surface)]"
          >
            <input
              type="radio"
              name="language"
              value={value}
              checked={language === value}
              onChange={() => setLanguage(value)}
              className="accent-[var(--color-primary)]"
            />
            <span className="text-sm text-[var(--color-text)]">
              {t(labelKey)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
