import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../store.ts";
import type { MindmapSpacing } from "../store.ts";

const SPACING_OPTIONS: MindmapSpacing[] = ["small", "medium", "large"];

export function MindmapSection() {
  const { t } = useTranslation();
  const threshold = useSettingsStore((s) => s.mindmapCollapseThreshold);
  const setThreshold = useSettingsStore((s) => s.setMindmapCollapseThreshold);
  const spacing = useSettingsStore((s) => s.mindmapSpacing);
  const setSpacing = useSettingsStore((s) => s.setMindmapSpacing);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">
        {t("settings.mindmap")}
      </h2>
      <div className="flex flex-col gap-2 px-3">
        <label className="text-sm text-[var(--color-text)]">
          {t("settings.mindmapCollapseThreshold")}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={3}
            max={15}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="flex-1 accent-[var(--color-primary)]"
            aria-label={t("settings.mindmapCollapseThreshold")}
          />
          <span className="w-8 text-center text-sm font-medium text-[var(--color-text)]">
            {threshold}
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)]">
          {t("settings.mindmapCollapseHint")}
        </p>
      </div>
      <div className="flex flex-col gap-2 px-3">
        <label className="text-sm text-[var(--color-text)]">
          {t("settings.mindmapSpacing")}
        </label>
        <div className="flex gap-3">
          {SPACING_OPTIONS.map((option) => (
            <label key={option} className="flex items-center gap-1.5 text-sm text-[var(--color-text)]">
              <input
                type="radio"
                name="mindmap-spacing"
                value={option}
                checked={spacing === option}
                onChange={() => setSpacing(option)}
                className="accent-[var(--color-primary)]"
              />
              {t(`settings.mindmapSpacing${option[0]!.toUpperCase() + option.slice(1)}`)}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
