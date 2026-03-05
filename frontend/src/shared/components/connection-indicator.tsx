import { useConnectionStore } from "@/services/storage/sync/connection-store.ts";

export function ConnectionIndicator() {
  const status = useConnectionStore((s) => s.status);
  const pendingChanges = useConnectionStore((s) => s.pendingChanges);
  const lastError = useConnectionStore((s) => s.lastError);

  if (status === "online" && pendingChanges === 0) {
    return (
      <span
        className="inline-block h-2.5 w-2.5 rounded-full bg-green-500"
        title="Connected"
      />
    );
  }

  if (status === "syncing") {
    return (
      <span
        className="inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
        title="Syncing..."
      />
    );
  }

  // offline
  const tooltip = lastError
    ? `Offline — ${pendingChanges} pending\n${lastError}`
    : `Offline — ${pendingChanges} pending`;

  return (
    <span className="relative inline-flex items-center" title={tooltip}>
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
      {pendingChanges > 0 && (
        <span className="ml-1 text-xs font-medium text-red-500">
          {pendingChanges}
        </span>
      )}
    </span>
  );
}
