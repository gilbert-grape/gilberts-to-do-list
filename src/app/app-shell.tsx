import { useEffect, useRef, useState } from "react";
import {
  Outlet,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router";
import { useTranslation } from "react-i18next";
import { useSettingsStore, setSettingsApiAdapter, loadSettingsFromServer, syncToServer } from "@/features/settings/store.ts";
import { ONBOARDING_COMPLETE_KEY } from "@/features/onboarding/constants.ts";
import { ViewToggleBar } from "@/features/todos/components/view-toggle-bar.tsx";
import { setStorageAdapter, useTagStore } from "@/features/tags/store.ts";
import { setTodoStorageAdapter, useTodoStore } from "@/features/todos/store.ts";
import { db } from "@/services/storage/indexeddb/db.ts";
import { IndexedDBAdapter } from "@/services/storage/indexeddb/indexeddb-adapter.ts";
import { ApiAdapter } from "@/services/storage/api/api-adapter.ts";
import { resolveApiBaseUrl } from "@/services/storage/api/resolve-base-url.ts";
import { SyncAdapter } from "@/services/storage/sync/sync-adapter.ts";
import { ConnectionIndicator } from "@/shared/components/connection-indicator.tsx";

export function AppShell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const userName = useSettingsStore((s) => s.userName);
  const layoutMode = useSettingsStore((s) => s.layoutMode);
  const activeView = useSettingsStore((s) => s.activeView);
  const setActiveView = useSettingsStore((s) => s.setActiveView);
  const isOnboarding = location.pathname === "/onboarding";
  const isHome = location.pathname === "/";
  const adapterInitialized = useRef(false);
  const [useSync, setUseSync] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    if (adapterInitialized.current) return;
    adapterInitialized.current = true;

    const localAdapter = new IndexedDBAdapter(db);
    const apiAdapter = new ApiAdapter(resolveApiBaseUrl());

    apiAdapter.healthCheck().then(async (ok) => {
      if (ok) {
        setSettingsApiAdapter(apiAdapter);
        await loadSettingsFromServer();
        // Migration: push existing local onboarding flag to server
        if (localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "true") {
          syncToServer({ [ONBOARDING_COMPLETE_KEY]: "true" });
        }
        const onSyncComplete = () => {
          void useTagStore.getState().loadTags();
          void useTodoStore.getState().loadTodos();
          void loadSettingsFromServer();
        };
        const syncAdapter = new SyncAdapter(apiAdapter, localAdapter, db, onSyncComplete);
        setStorageAdapter(syncAdapter);
        setTodoStorageAdapter(syncAdapter);
        setUseSync(true);
      } else {
        setStorageAdapter(localAdapter);
        setTodoStorageAdapter(localAdapter);
      }
      setStorageReady(true);
    });
  }, []);
  const isCompact = layoutMode === "compact" && !isOnboarding;

  const [searchOpen, setSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");

  const handleSearchSubmit = () => {
    if (headerSearchQuery.trim()) {
      void navigate(`/?q=${encodeURIComponent(headerSearchQuery.trim())}`);
    } else {
      // Clear the q param if empty
      if (location.pathname === "/") {
        searchParams.delete("q");
        setSearchParams(searchParams, { replace: true });
      }
    }
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    setHeaderSearchQuery("");
    // Clear q param when closing search
    if (location.pathname === "/") {
      searchParams.delete("q");
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    } else if (e.key === "Escape") {
      handleSearchClose();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        {isCompact && searchOpen ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <input
              type="text"
              value={headerSearchQuery}
              onChange={(e) => setHeaderSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={t("common.search")}
              aria-label={t("common.search")}
              autoFocus
              className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
            />
            <button
              type="button"
              onClick={handleSearchClose}
              className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
              aria-label={t("common.cancel")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ) : (
          <h1
            className="cursor-pointer text-lg font-semibold text-[var(--color-text)]"
            onClick={() => void navigate("/")}
          >
            {isOnboarding
              ? t("app.title")
              : t("app.greeting", { name: userName })}
          </h1>
        )}
        {isHome && !isOnboarding && !(isCompact && searchOpen) && (
          <ViewToggleBar activeView={activeView} onViewChange={setActiveView} />
        )}
        {!isOnboarding && (
          <div className="flex items-center gap-2">
            {useSync && <ConnectionIndicator />}
            {isHome && !(isCompact && searchOpen) && (
              <div className="mx-1 h-6 w-px bg-[var(--color-border)]" />
            )}
            {isCompact && !searchOpen && (
              <>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                  aria-label={t("common.search")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => void navigate("/?create=1")}
                  className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                  aria-label={t("todos.newTodo")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </>
            )}
            <button
              onClick={() => void navigate("/")}
              className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
              aria-label={t("nav.home")}
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </button>
            <button
              onClick={() => void navigate("/statistics")}
              className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
              aria-label={t("nav.statistics")}
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </button>
            <button
              onClick={() => void navigate("/settings")}
              className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
              aria-label={t("nav.settings")}
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        )}
      </header>
      <main className="flex flex-1 flex-col">
        {storageReady ? (
          <Outlet />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)]" />
          </div>
        )}
      </main>
    </div>
  );
}
