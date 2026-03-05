import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../store.ts";
import type { LayoutMode } from "../store.ts";

const OPTIONS: { value: LayoutMode; labelKey: string }[] = [
  { value: "normal", labelKey: "settings.layoutNormal" },
  { value: "compact", labelKey: "settings.layoutCompact" },
];

export function LayoutSection() {
  const { t } = useTranslation();
  const layoutMode = useSettingsStore((s) => s.layoutMode);
  const setLayoutMode = useSettingsStore((s) => s.setLayoutMode);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">
        {t("settings.layout")}
      </h2>
      <div role="radiogroup" aria-label={t("settings.layout")}>
        {OPTIONS.map(({ value, labelKey }) => (
          <label
            key={value}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-[var(--color-surface)]"
          >
            <input
              type="radio"
              name="layout-mode"
              value={value}
              checked={layoutMode === value}
              onChange={() => setLayoutMode(value)}
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
