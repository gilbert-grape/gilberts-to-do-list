import { useState } from "react";
import { useTranslation } from "react-i18next";

export type RecurrenceType =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom"
  | null;

export interface DueDateRecurrenceSectionProps {
  dueDate: string | null;
  recurrence: RecurrenceType;
  recurrenceInterval: number | null;
  onDueDateChange: (date: string | null) => void;
  onRecurrenceChange: (recurrence: RecurrenceType) => void;
  onRecurrenceIntervalChange: (interval: number | null) => void;
}

export function DueDateRecurrenceSection({
  dueDate,
  recurrence,
  recurrenceInterval,
  onDueDateChange,
  onRecurrenceChange,
  onRecurrenceIntervalChange,
}: DueDateRecurrenceSectionProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(dueDate !== null || recurrence !== null);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
      >
        <svg
          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {t("todos.moreOptions")}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-3">
          {/* Due Date */}
          <div>
            <label
              htmlFor="due-date-input"
              className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]"
            >
              {t("todos.dueDate")}
            </label>
            <input
              id="due-date-input"
              type="date"
              value={dueDate ?? ""}
              onChange={(e) => onDueDateChange(e.target.value || null)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
            />
          </div>

          {/* Recurrence */}
          <div>
            <label
              htmlFor="recurrence-select"
              className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]"
            >
              {t("todos.recurrence")}
            </label>
            <select
              id="recurrence-select"
              value={recurrence ?? "none"}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "none") {
                  onRecurrenceChange(null);
                  onRecurrenceIntervalChange(null);
                } else {
                  onRecurrenceChange(val as RecurrenceType);
                  if (val === "custom" && !recurrenceInterval) {
                    onRecurrenceIntervalChange(1);
                  }
                }
              }}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
            >
              <option value="none">{t("todos.recurrenceNone")}</option>
              <option value="daily">{t("todos.recurrenceDaily")}</option>
              <option value="weekly">{t("todos.recurrenceWeekly")}</option>
              <option value="monthly">{t("todos.recurrenceMonthly")}</option>
              <option value="yearly">{t("todos.recurrenceYearly")}</option>
              <option value="custom">{t("todos.recurrenceCustom")}</option>
            </select>
          </div>

          {/* Custom interval */}
          {recurrence === "custom" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                {t("todos.customInterval")}
              </label>
              <input
                type="number"
                min={1}
                value={recurrenceInterval ?? 1}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onRecurrenceIntervalChange(
                    Number.isNaN(val) || val < 1 ? 1 : val,
                  );
                }}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
