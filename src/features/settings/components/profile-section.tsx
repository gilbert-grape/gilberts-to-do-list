import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../store.ts";

export function ProfileSection() {
  const { t } = useTranslation();
  const userName = useSettingsStore((s) => s.userName);
  const setUserName = useSettingsStore((s) => s.setUserName);
  const [name, setName] = useState(userName);
  const [showSaved, setShowSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(savedTimer.current), []);

  const isUnchanged = name.trim() === userName;
  const isEmpty = name.trim() === "";

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== userName) {
      setUserName(trimmed);
      setShowSaved(true);
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setShowSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">
        {t("settings.profile")}
      </h2>
      <label className="block text-sm text-[var(--color-text-secondary)]">
        {t("settings.displayName")}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
          maxLength={50}
          className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isEmpty || isUnchanged}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {t("common.save")}
        </button>
        {showSaved && (
          <span className="self-center text-sm text-[var(--color-success)]">
            {t("settings.saved")}
          </span>
        )}
      </div>
    </div>
  );
}
