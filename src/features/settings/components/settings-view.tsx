import { useTranslation } from "react-i18next";
import { TagManager } from "@/features/tags/components/tag-manager.tsx";
import { ProfileSection } from "./profile-section.tsx";
import { CompletedDisplaySection } from "./completed-display-section.tsx";

export function SettingsView() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col gap-8 p-4">
      <h1 className="text-xl font-bold text-[var(--color-text)]">
        {t("nav.settings")}
      </h1>
      <ProfileSection />
      <TagManager />
      <CompletedDisplaySection />
    </div>
  );
}
