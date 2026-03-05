import { create } from "zustand";

export type ConnectionStatus = "online" | "offline" | "syncing";

export interface ConnectionState {
  status: ConnectionStatus;
  pendingChanges: number;
  lastError: string | null;
  setStatus: (status: ConnectionStatus) => void;
  setPendingChanges: (count: number) => void;
  setLastError: (error: string | null) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: "online",
  pendingChanges: 0,
  lastError: null,
  setStatus: (status) => set({ status }),
  setPendingChanges: (pendingChanges) => set({ pendingChanges }),
  setLastError: (lastError) => set({ lastError }),
}));
