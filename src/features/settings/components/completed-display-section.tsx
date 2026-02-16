import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../store.ts";
import type { CompletedDisplayMode } from "../store.ts";

const OPTIONS: { value: CompletedDisplayMode; labelKey: string }[] = [
  { value: "hidden", labelKey: "settings.completedHidden" },
  { value: "bottom", labelKey: "settings.completedBottom" },
  { value: "toggleable", labelKey: "settings.completedToggleable" },
];

export function CompletedDisplaySection() {
  const { t } = useTranslation();
  const completedDisplayMode = useSettingsStore((s) => s.completedDisplayMode);
  const setCompletedDisplayMode = useSettingsStore(
    (s) => s.setCompletedDisplayMode,
  );

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">
        {t("settings.completedDisplay")}
      </h2>
      <div role="radiogroup" aria-label={t("settings.completedDisplay")}>
        {OPTIONS.map(({ value, labelKey }) => (
          <label
            key={value}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-[var(--color-surface)]"
          >
            <input
              type="radio"
              name="completed-display-mode"
              value={value}
              checked={completedDisplayMode === value}
              onChange={() => setCompletedDisplayMode(value)}
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
