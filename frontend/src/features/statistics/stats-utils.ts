import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
  isWithinInterval,
  differenceInDays,
} from "date-fns";
import type { Todo } from "@/features/todos/types.ts";
import type { Tag } from "@/features/tags/types.ts";

export type TimeRange = "week" | "month" | "year" | "custom";

export interface TagDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface CompletionBarItem {
  label: string;
  count: number;
}

export function getTagDistribution(
  todos: Todo[],
  tags: Tag[],
): TagDistributionItem[] {
  const tagMap = new Map(tags.map((t) => [t.id, t]));
  const counts = new Map<string, number>();

  for (const todo of todos) {
    for (const tagId of todo.tagIds) {
      counts.set(tagId, (counts.get(tagId) ?? 0) + 1);
    }
  }

  return tags
    .filter((tag) => (counts.get(tag.id) ?? 0) > 0)
    .map((tag) => ({
      name: tagMap.get(tag.id)?.name ?? tag.id,
      value: counts.get(tag.id) ?? 0,
      color: tag.color,
    }));
}

export function getDateRange(
  range: TimeRange,
  customFrom?: Date,
  customTo?: Date,
): { start: Date; end: Date } {
  const now = new Date();
  switch (range) {
    case "week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "year":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "custom":
      return {
        start: customFrom ?? startOfWeek(now, { weekStartsOn: 1 }),
        end: customTo ?? endOfWeek(now, { weekStartsOn: 1 }),
      };
  }
}

export function getCompletionData(
  todos: Todo[],
  range: TimeRange,
  customFrom?: Date,
  customTo?: Date,
): CompletionBarItem[] {
  const { start, end } = getDateRange(range, customFrom, customTo);

  const completed = todos.filter((t) => {
    if (t.status !== "completed" || !t.completedAt) return false;
    const date = new Date(t.completedAt);
    return isWithinInterval(date, { start, end });
  });

  if (range === "week" || (range === "custom" && differenceInDays(end, start) <= 14)) {
    const days = eachDayOfInterval({ start, end });
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const count = completed.filter(
        (t) => format(new Date(t.completedAt!), "yyyy-MM-dd") === dayStr,
      ).length;
      return { label: format(day, "EEE"), count };
    });
  }

  if (range === "month" || (range === "custom" && differenceInDays(end, start) <= 90)) {
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    return weeks.map((weekStart, i) => {
      const weekEnd = i < weeks.length - 1 ? weeks[i + 1]! : end;
      const count = completed.filter((t) => {
        const date = new Date(t.completedAt!);
        return date >= weekStart && date < weekEnd;
      }).length;
      return { label: `W${i + 1}`, count };
    });
  }

  // year or custom > 90 days
  const months = eachMonthOfInterval({ start, end });
  return months.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart);
    const count = completed.filter((t) => {
      const date = new Date(t.completedAt!);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    }).length;
    return { label: format(monthStart, "MMM"), count };
  });
}

export function getTotalCompleted(todos: Todo[]): number {
  return todos.filter((t) => t.status === "completed").length;
}

export function getDailyAverage(todos: Todo[]): number {
  const completed = todos.filter(
    (t) => t.status === "completed" && t.completedAt,
  );
  if (completed.length === 0) return 0;

  const dates = completed.map((t) => new Date(t.completedAt!));
  const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
  const latest = new Date();
  const days = Math.max(differenceInDays(latest, earliest), 1);
  return Math.round((completed.length / days) * 10) / 10;
}
