import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  useFolderSyncStore,
  isFolderSyncSupported,
  connectFolder,
  disconnectFolder,
  restoreFolder,
} from "@/services/sync/folder-sync.ts";

export function LocalFolderSection() {
  const { t } = useTranslation();
  const { status, folderName } = useFolderSyncStore();
  const supported = isFolderSyncSupported();

  useEffect(() => {
    if (supported) {
      void restoreFolder();
    }
  }, [supported]);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">
        {t("settings.localFolder")}
      </h2>

      {!supported ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t("settings.folderSyncUnsupported")}
        </p>
      ) : (
        <>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {t("settings.folderSyncDescription")}
          </p>

          {status === "connected" ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg bg-[var(--color-surface)] px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm text-[var(--color-text)]">
                  {t("settings.connected")}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  — {folderName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void disconnectFolder()}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]"
              >
                {t("settings.disconnect")}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg bg-[var(--color-surface)] px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {t("settings.notConnected")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void connectFolder()}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {t("settings.connectFolder")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
