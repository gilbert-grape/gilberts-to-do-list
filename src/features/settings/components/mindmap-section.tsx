import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../store.ts";

export function MindmapSection() {
  const { t } = useTranslation();
  const threshold = useSettingsStore((s) => s.mindmapCollapseThreshold);
  const setThreshold = useSettingsStore((s) => s.setMindmapCollapseThreshold);

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
    </div>
  );
}
