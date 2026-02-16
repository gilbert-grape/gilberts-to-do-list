import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../store.ts";
import type { Theme, ColorAccent } from "../store.ts";

const THEME_OPTIONS: { value: Theme; labelKey: string }[] = [
  { value: "light", labelKey: "settings.themeLight" },
  { value: "dark", labelKey: "settings.themeDark" },
  { value: "auto", labelKey: "settings.themeAuto" },
];

const ACCENT_OPTIONS: { value: ColorAccent; labelKey: string; color: string }[] = [
  { value: "blue", labelKey: "settings.accentBlue", color: "#3b82f6" },
  { value: "purple", labelKey: "settings.accentPurple", color: "#8b5cf6" },
  { value: "green", labelKey: "settings.accentGreen", color: "#22c55e" },
  { value: "orange", labelKey: "settings.accentOrange", color: "#f97316" },
];

export function AppearanceSection() {
  const { t } = useTranslation();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const colorAccent = useSettingsStore((s) => s.colorAccent);
  const setColorAccent = useSettingsStore((s) => s.setColorAccent);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">
        {t("settings.appearance")}
      </h2>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
          {t("settings.theme")}
        </h3>
        <div role="radiogroup" aria-label={t("settings.theme")}>
          {THEME_OPTIONS.map(({ value, labelKey }) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-[var(--color-surface)]"
            >
              <input
                type="radio"
                name="theme"
                value={value}
                checked={theme === value}
                onChange={() => setTheme(value)}
                className="accent-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-text)]">
                {t(labelKey)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
          {t("settings.colorAccent")}
        </h3>
        <div
          role="radiogroup"
          aria-label={t("settings.colorAccent")}
          className="flex gap-3 px-3"
        >
          {ACCENT_OPTIONS.map(({ value, labelKey, color }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={colorAccent === value}
              aria-label={t(labelKey)}
              onClick={() => setColorAccent(value)}
              className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                borderColor:
                  colorAccent === value
                    ? "var(--color-text)"
                    : "transparent",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
