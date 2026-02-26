import { useTranslation } from "react-i18next";

export type StatusFilter = "all" | "open" | "completed";
export type DueDateFilter = "all" | "overdue" | "today" | "thisWeek" | "thisMonth";

export interface MindmapFilterBarProps {
  statusFilter: StatusFilter;
  dueDateFilter: DueDateFilter;
  onStatusChange: (filter: StatusFilter) => void;
  onDueDateChange: (filter: DueDateFilter) => void;
}

export function MindmapFilterBar({
  statusFilter,
  dueDateFilter,
  onStatusChange,
  onDueDateChange,
}: MindmapFilterBarProps) {
  const { t } = useTranslation();

  const isDueDateDisabled = statusFilter === "completed";

  return (
    <div
      className="flex items-center gap-2"
      data-testid="mindmap-filter-bar"
    >
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        className="h-[30px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs text-[var(--color-text)]"
        aria-label={t("settings.mindmapFilterAll")}
        data-testid="status-filter"
      >
        <option value="all">{t("settings.mindmapFilterAll")}</option>
        <option value="open">{t("settings.mindmapFilterOpen")}</option>
        <option value="completed">{t("settings.mindmapFilterCompleted")}</option>
      </select>

      <select
        value={isDueDateDisabled ? "all" : dueDateFilter}
        onChange={(e) => onDueDateChange(e.target.value as DueDateFilter)}
        disabled={isDueDateDisabled}
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text)] disabled:opacity-40"
        aria-label={t("settings.mindmapFilterDueAll")}
        data-testid="due-date-filter"
      >
        <option value="all">{t("settings.mindmapFilterDueAll")}</option>
        <option value="overdue">{t("settings.mindmapFilterDueOverdue")}</option>
        <option value="today">{t("settings.mindmapFilterDueToday")}</option>
        <option value="thisWeek">{t("settings.mindmapFilterDueThisWeek")}</option>
        <option value="thisMonth">{t("settings.mindmapFilterDueThisMonth")}</option>
      </select>
    </div>
  );
}
