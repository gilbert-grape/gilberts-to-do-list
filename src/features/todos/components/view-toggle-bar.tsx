import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/index.ts";

export type ViewType =
  | "flatList"
  | "tagTabs"
  | "grouped"
  | "mindmap"
  | "hardcore";

export interface ViewToggleBarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const views: { key: ViewType; icon: string }[] = [
  { key: "flatList", icon: "M4 6h16M4 12h16M4 18h16" },
  { key: "tagTabs", icon: "M7 7h10M7 12h10M7 17h10" },
  { key: "grouped", icon: "M3 7h4v4H3V7zm7 0h11M10 15h11M3 15h4v4H3v-4z" },
  {
    key: "mindmap",
    icon: "M12 2a3 3 0 00-3 3c0 1.1.6 2.1 1.5 2.6V9H9a3 3 0 00-3 3v1.4A3 3 0 004 16a3 3 0 003 3 3 3 0 002-5.6V12a1 1 0 011-1h4v2.4A3 3 0 0012 16a3 3 0 002-5.6V11h4a1 1 0 011 1v1.4A3 3 0 0017 16a3 3 0 003 3 3 3 0 002-5.6V12a3 3 0 00-3-3h-1.5V7.6A3 3 0 0015 5a3 3 0 00-3-3z",
  },
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
        const isDisabled = key === "hardcore";

        return (
          <button
            key={key}
            type="button"
            onClick={() => !isDisabled && onViewChange(key)}
            disabled={isDisabled}
            title={t(`views.${key}`)}
            className={cn(
              "flex-1 rounded-md p-2 transition-colors",
              isActive && "bg-[var(--color-primary)] text-white",
              !isActive &&
                !isDisabled &&
                "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]",
              isDisabled && "cursor-not-allowed opacity-30",
            )}
          >
            <svg
              className="mx-auto h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
