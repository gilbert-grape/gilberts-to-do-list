import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useConnectionStore } from "@/services/storage/sync/connection-store.ts";
import { ConnectionIndicator } from "./connection-indicator.tsx";

describe("ConnectionIndicator", () => {
  beforeEach(() => {
    useConnectionStore.setState({ status: "online", pendingChanges: 0, lastError: null });
  });

  it("shows green dot when online with no pending changes", () => {
    render(<ConnectionIndicator />);
    const dot = screen.getByTitle("Connected");
    expect(dot).toBeInTheDocument();
    expect(dot.className).toContain("bg-green-500");
  });

  it("shows spinner when syncing", () => {
    useConnectionStore.setState({ status: "syncing" });
    render(<ConnectionIndicator />);
    const spinner = screen.getByTitle("Syncing...");
    expect(spinner).toBeInTheDocument();
    expect(spinner.className).toContain("animate-spin");
  });

  it("shows red dot when offline with no pending changes", () => {
    useConnectionStore.setState({ status: "offline", pendingChanges: 0 });
    render(<ConnectionIndicator />);
    const container = screen.getByTitle(/Offline/);
    expect(container).toBeInTheDocument();
    expect(container.querySelector(".bg-red-500")).toBeInTheDocument();
  });

  it("shows pending count when offline with pending changes", () => {
    useConnectionStore.setState({ status: "offline", pendingChanges: 3 });
    render(<ConnectionIndicator />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows red dot when online but has pending changes", () => {
    useConnectionStore.setState({ status: "online", pendingChanges: 2 });
    render(<ConnectionIndicator />);
    // When online but pending > 0, it falls through to the offline branch
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
