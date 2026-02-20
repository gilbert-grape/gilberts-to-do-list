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

type SettingsTab = "tags" | "general" | "appearance" | "data";

const TABS: SettingsTab[] = ["tags", "general", "appearance", "data"];

const TAB_LABELS: Record<SettingsTab, string> = {
  tags: "settings.tabTags",
  general: "settings.tabGeneral",
  appearance: "settings.tabAppearance",
  data: "settings.tabData",
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
      </div>
    </div>
  );
}
