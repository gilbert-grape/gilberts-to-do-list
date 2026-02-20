import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TagManager } from "@/features/tags/components/tag-manager.tsx";
import { ProfileSection } from "./profile-section.tsx";
import { CompletedDisplaySection } from "./completed-display-section.tsx";
import { LayoutSection } from "./layout-section.tsx";
import { AppearanceSection } from "./appearance-section.tsx";
import { LanguageSection } from "./language-section.tsx";
import { MindmapSection } from "./mindmap-section.tsx";
import { ImportExportSection } from "./import-export-section.tsx";
import { LocalFolderSection } from "./local-folder-section.tsx";
import { NotificationsSection } from "./notifications-section.tsx";

type SettingsTab = "tags" | "general" | "appearance" | "data" | "about";

const TABS: SettingsTab[] = ["tags", "general", "appearance", "data", "about"];

const TAB_LABELS: Record<SettingsTab, string> = {
  tags: "settings.tabTags",
  general: "settings.tabGeneral",
  appearance: "settings.tabAppearance",
  data: "settings.tabData",
  about: "settings.tabAbout",
};

export function SettingsView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>("tags");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-4">
      <h1 className="text-xl font-bold text-[var(--color-text)]">
        {t("nav.settings")}
      </h1>
      <div role="tablist" className="flex gap-1 border-b border-[var(--color-border)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            {t(TAB_LABELS[tab])}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="flex flex-col gap-8">
        {activeTab === "tags" && <TagManager />}
        {activeTab === "general" && (
          <>
            <ProfileSection />
            <LanguageSection />
          </>
        )}
        {activeTab === "appearance" && (
          <>
            <AppearanceSection />
            <LayoutSection />
            <CompletedDisplaySection />
            <MindmapSection />
          </>
        )}
        {activeTab === "data" && (
          <>
            <NotificationsSection />
            <ImportExportSection />
            <LocalFolderSection />
          </>
        )}
        {activeTab === "about" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              {t("settings.aboutTitle")}
            </h2>
            <a
              href="https://github.com/gilbert-grape/gilberts-to-do-list"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              {t("settings.aboutSourceCode")}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
