import { describe, it, expect, beforeEach } from "vitest";
import { useConnectionStore } from "./connection-store.ts";

describe("useConnectionStore", () => {
  beforeEach(() => {
    useConnectionStore.setState({
      status: "online",
      pendingChanges: 0,
      lastError: null,
    });
  });

  it("initializes with online status", () => {
    expect(useConnectionStore.getState().status).toBe("online");
  });

  it("initializes with 0 pending changes", () => {
    expect(useConnectionStore.getState().pendingChanges).toBe(0);
  });

  it("initializes with null lastError", () => {
    expect(useConnectionStore.getState().lastError).toBeNull();
  });

  it("setStatus updates status", () => {
    useConnectionStore.getState().setStatus("offline");
    expect(useConnectionStore.getState().status).toBe("offline");

    useConnectionStore.getState().setStatus("syncing");
    expect(useConnectionStore.getState().status).toBe("syncing");
  });

  it("setPendingChanges updates count", () => {
    useConnectionStore.getState().setPendingChanges(5);
    expect(useConnectionStore.getState().pendingChanges).toBe(5);
  });

  it("setLastError updates error", () => {
    useConnectionStore.getState().setLastError("Network failed");
    expect(useConnectionStore.getState().lastError).toBe("Network failed");

    useConnectionStore.getState().setLastError(null);
    expect(useConnectionStore.getState().lastError).toBeNull();
  });
});
