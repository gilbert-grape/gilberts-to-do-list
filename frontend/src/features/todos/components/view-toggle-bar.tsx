import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/index.ts";
import type { ViewType } from "@/features/settings/store.ts";

export type { ViewType };

export interface ViewToggleBarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const mindmapIcon = (
  <>
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="9" x2="12" y2="6" strokeLinecap="round" />
    <line x1="9.6" y1="13.8" x2="5.6" y2="16.8" strokeLinecap="round" />
    <line x1="14.4" y1="13.8" x2="18.4" y2="16.8" strokeLinecap="round" />
    <circle cx="12" cy="4" r="2" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="2" fill="currentColor" stroke="none" />
    <circle cx="20" cy="18" r="2" fill="currentColor" stroke="none" />
  </>
);

const views: { key: ViewType; icon: string | ReactNode }[] = [
  { key: "flatList", icon: "M4 6h16M4 12h16M4 18h16" },
  { key: "tagTabs", icon: "M7 7h10M7 12h10M7 17h10" },
  { key: "grouped", icon: "M3 7h4v4H3V7zm7 0h11M10 15h11M3 15h4v4H3v-4z" },
  { key: "mindmap", icon: mindmapIcon },
  { key: "hardcore", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
];

export function ViewToggleBar({
  activeView,
  onViewChange,
}: ViewToggleBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-1 rounded-lg bg-[var(--color-surface)] p-1">
      {views.map(({ key, icon }) => {
        const isActive = activeView === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onViewChange(key)}
            title={t(`views.${key}`)}
            aria-label={t(`views.${key}`)}
            className={cn(
              "flex-1 rounded-md p-2 transition-colors",
              isActive && "bg-[var(--color-primary)] text-white",
              !isActive &&
                "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]",
            )}
          >
            <svg
              className="mx-auto h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {typeof icon === "string" ? (
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              ) : (
                icon
              )}
            </svg>
          </button>
        );
      })}
    </div>
  );
}
