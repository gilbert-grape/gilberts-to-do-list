import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LocalFolderSection } from "./local-folder-section.tsx";

const mockConnectFolder = vi.fn();
const mockDisconnectFolder = vi.fn();
const mockRestoreFolder = vi.fn();
const mockIsFolderSyncSupported = vi.fn().mockReturnValue(true);

let mockSyncState = { status: "disconnected" as const, folderName: "" };

vi.mock("@/services/sync/folder-sync.ts", () => ({
  useFolderSyncStore: (selector?: (s: typeof mockSyncState) => unknown) =>
    selector ? selector(mockSyncState) : mockSyncState,
  isFolderSyncSupported: () => mockIsFolderSyncSupported(),
  connectFolder: () => mockConnectFolder(),
  disconnectFolder: () => mockDisconnectFolder(),
  restoreFolder: () => mockRestoreFolder(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "settings.localFolder": "Local Folder",
        "settings.connectFolder": "Connect Folder",
        "settings.disconnect": "Disconnect",
        "settings.connected": "Connected",
        "settings.notConnected": "Not connected",
        "settings.folderSyncDescription":
          "Connect a local folder to sync your to-dos as markdown files.",
        "settings.folderSyncUnsupported":
          "Folder sync is only available in Chrome and Edge. Use Import & Export as an alternative.",
      };
      return translations[key] ?? key;
    },
  }),
}));

describe("LocalFolderSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSyncState = { status: "disconnected", folderName: "" };
    mockIsFolderSyncSupported.mockReturnValue(true);
  });

  it("renders section heading", () => {
    render(<LocalFolderSection />);
    expect(screen.getByText("Local Folder")).toBeInTheDocument();
  });

  it("shows unsupported message when browser does not support File System Access API", () => {
    mockIsFolderSyncSupported.mockReturnValue(false);
    render(<LocalFolderSection />);
    expect(
      screen.getByText(
        "Folder sync is only available in Chrome and Edge. Use Import & Export as an alternative.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Connect Folder"),
    ).not.toBeInTheDocument();
  });

  it("shows Connect Folder button when disconnected", () => {
    render(<LocalFolderSection />);
    expect(screen.getByText("Connect Folder")).toBeInTheDocument();
    expect(screen.getByText("Not connected")).toBeInTheDocument();
  });

  it("shows description text when supported", () => {
    render(<LocalFolderSection />);
    expect(
      screen.getByText(
        "Connect a local folder to sync your to-dos as markdown files.",
      ),
    ).toBeInTheDocument();
  });

  it("calls connectFolder when Connect Folder is clicked", async () => {
    const user = userEvent.setup();
    render(<LocalFolderSection />);

    await user.click(screen.getByText("Connect Folder"));
    expect(mockConnectFolder).toHaveBeenCalled();
  });

  it("shows connected status with folder name when connected", () => {
    mockSyncState = { status: "connected", folderName: "my-todos" };
    render(<LocalFolderSection />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("— my-todos")).toBeInTheDocument();
    expect(screen.getByText("Disconnect")).toBeInTheDocument();
  });

  it("calls disconnectFolder when Disconnect is clicked", async () => {
    const user = userEvent.setup();
    mockSyncState = { status: "connected", folderName: "my-todos" };
    render(<LocalFolderSection />);

    await user.click(screen.getByText("Disconnect"));
    expect(mockDisconnectFolder).toHaveBeenCalled();
  });

  it("calls restoreFolder on mount when supported", () => {
    render(<LocalFolderSection />);
    expect(mockRestoreFolder).toHaveBeenCalled();
  });

  it("does not call restoreFolder on mount when not supported", () => {
    mockIsFolderSyncSupported.mockReturnValue(false);
    render(<LocalFolderSection />);
    expect(mockRestoreFolder).not.toHaveBeenCalled();
  });

  it("does not show Connect Folder button when connected", () => {
    mockSyncState = { status: "connected", folderName: "my-todos" };
    render(<LocalFolderSection />);
    expect(
      screen.queryByText("Connect Folder"),
    ).not.toBeInTheDocument();
  });

  it("does not show Disconnect button when disconnected", () => {
    render(<LocalFolderSection />);
    expect(screen.queryByText("Disconnect")).not.toBeInTheDocument();
  });
});
