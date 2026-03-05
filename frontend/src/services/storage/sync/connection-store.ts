import { create } from "zustand";

export type ConnectionStatus = "online" | "offline" | "syncing";

export interface SyncLogEntry {
  timestamp: string;
  direction: "up" | "down" | "error";
  details: string;
}

export interface ConnectionState {
  status: ConnectionStatus;
  pendingChanges: number;
  lastError: string | null;
  syncLog: SyncLogEntry[];
  syncAdapter: { sync(): Promise<void> } | null;
  setStatus: (status: ConnectionStatus) => void;
  setPendingChanges: (count: number) => void;
  setLastError: (error: string | null) => void;
  addSyncLog: (entry: Omit<SyncLogEntry, "timestamp">) => void;
  setSyncAdapter: (adapter: { sync(): Promise<void> } | null) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: "online",
  pendingChanges: 0,
  lastError: null,
  syncLog: [],
  syncAdapter: null,
  setStatus: (status) => set({ status }),
  setPendingChanges: (pendingChanges) => set({ pendingChanges }),
  setLastError: (lastError) => set({ lastError }),
  addSyncLog: (entry) =>
    set((state) => ({
      syncLog: [
        { ...entry, timestamp: new Date().toISOString() },
        ...state.syncLog,
      ].slice(0, 50),
    })),
  setSyncAdapter: (syncAdapter) => set({ syncAdapter }),
}));
