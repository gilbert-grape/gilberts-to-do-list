import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useConnectionStore } from "@/services/storage/sync/connection-store.ts";

export function SyncSection() {
  const { t } = useTranslation();
  const status = useConnectionStore((s) => s.status);
  const pendingChanges = useConnectionStore((s) => s.pendingChanges);
  const syncAdapter = useConnectionStore((s) => s.syncAdapter);
  const syncLog = useConnectionStore((s) => s.syncLog);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (!syncAdapter || syncing) return;
    setSyncing(true);
    try {
      await syncAdapter.sync();
    } finally {
      setSyncing(false);
    }
  };

  const statusLabel =
    status === "syncing" || syncing
      ? t("settings.syncSyncing")
      : status === "offline"
        ? t("settings.syncOffline")
        : t("settings.syncOnline");

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">
        {t("settings.syncTitle")}
      </h2>

      {/* Status */}
      <div className="flex items-center gap-3">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            status === "online" && !syncing
              ? "bg-green-500"
              : status === "syncing" || syncing
                ? "bg-yellow-500"
                : "bg-red-500"
          }`}
        />
        <span className="text-sm text-[var(--color-text)]">{statusLabel}</span>
        {pendingChanges > 0 && (
          <span className="text-xs text-[var(--color-text-secondary)]">
            ({t("settings.syncPending", { count: pendingChanges })})
          </span>
        )}
      </div>

      {/* Sync now button */}
      <button
        type="button"
        onClick={() => void handleSync()}
        disabled={!syncAdapter || syncing || status === "syncing"}
        className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
      >
        {syncing || status === "syncing"
          ? t("settings.syncSyncing")
          : t("settings.syncNow")}
      </button>

      {/* Sync log */}
      <h3 className="text-sm font-medium text-[var(--color-text)]">
        {t("settings.syncLogTitle")}
      </h3>
      {syncLog.length === 0 ? (
        <p className="text-xs text-[var(--color-text-secondary)]">
          {t("settings.syncLogEmpty")}
        </p>
      ) : (
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {syncLog.map((entry, i) => (
            <li
              key={`${entry.timestamp}-${i}`}
              className="flex items-center gap-2 rounded px-2 py-1 text-xs text-[var(--color-text-secondary)]"
            >
              <span className="shrink-0">
                {entry.direction === "up" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                ) : entry.direction === "down" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                )}
              </span>
              <span className="shrink-0 tabular-nums">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              <span className="truncate">{entry.details}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
