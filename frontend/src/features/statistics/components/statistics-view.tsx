import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTodoStore } from "@/features/todos/store.ts";
import { useTagStore } from "@/features/tags/store.ts";
import { TagDistributionChart } from "./tag-distribution-chart.tsx";
import { CompletionChart } from "./completion-chart.tsx";
import {
  getTagDistribution,
  getCompletionData,
  getTotalCompleted,
  getDailyAverage,
  type TimeRange,
} from "../stats-utils.ts";

export function StatisticsView() {
  const { t } = useTranslation();
  const { todos } = useTodoStore();
  const { tags } = useTagStore();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const totalCompleted = useMemo(() => getTotalCompleted(todos), [todos]);
  const dailyAverage = useMemo(() => getDailyAverage(todos), [todos]);

  const tagDistribution = useMemo(
    () => getTagDistribution(todos, tags),
    [todos, tags],
  );

  const completionData = useMemo(
    () =>
      getCompletionData(
        todos,
        timeRange,
        customFrom ? new Date(customFrom + "T00:00:00") : undefined,
        customTo ? new Date(customTo + "T00:00:00") : undefined,
      ),
    [todos, timeRange, customFrom, customTo],
  );

  if (totalCompleted === 0 && todos.every((t) => t.status === "open")) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-center text-[var(--color-text-secondary)]">
          {t("statistics.emptyState")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">
        {t("statistics.title")}
      </h2>

      {/* Pie chart: tag distribution */}
      {tagDistribution.length > 0 && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <TagDistributionChart data={tagDistribution} />
        </div>
      )}

      {/* Bar chart: completion history */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        {/* Time range filter */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            {t("statistics.timeRange")}:
          </label>
          {(["week", "month", "year", "custom"] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                timeRange === range
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              {t(
                `statistics.${range === "week" ? "thisWeek" : range === "month" ? "thisMonth" : range === "year" ? "thisYear" : "custom"}`,
              )}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        {timeRange === "custom" && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
              {t("statistics.from")}:
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-text)]"
              />
            </label>
            <label className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
              {t("statistics.to")}:
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-text)]"
              />
            </label>
          </div>
        )}

        <CompletionChart data={completionData} />
      </div>

      {/* Totals */}
      <div className="flex gap-4">
        <div className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-primary)]">
            {totalCompleted}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {t("statistics.totalCompleted")}
          </p>
        </div>
        <div className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-primary)]">
            {dailyAverage}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {t("statistics.dailyAverage")}
          </p>
        </div>
      </div>
    </div>
  );
}
