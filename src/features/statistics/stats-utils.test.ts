import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getTagDistribution,
  getCompletionData,
  getTotalCompleted,
  getDailyAverage,
  getDateRange,
} from "./stats-utils.ts";
import type { Todo } from "@/features/todos/types.ts";
import type { Tag } from "@/features/tags/types.ts";

const tag1: Tag = {
  id: "tag-1",
  name: "Work",
  color: "#3b82f6",
  isDefault: true,
  parentId: null,
};

const tag2: Tag = {
  id: "tag-2",
  name: "Personal",
  color: "#22c55e",
  isDefault: false,
  parentId: null,
};

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: crypto.randomUUID(),
    title: "Test",
    description: null,
    tagIds: ["tag-1"],
    parentId: null,
    status: "open",
    dueDate: null,
    recurrence: null,
    recurrenceInterval: null,
    createdAt: "2026-02-10T12:00:00.000Z",
    completedAt: null,
    sortOrder: 0,
    ...overrides,
  };
}

describe("getTagDistribution", () => {
  it("returns distribution counts per tag", () => {
    const todos = [
      makeTodo({ tagIds: ["tag-1"] }),
      makeTodo({ tagIds: ["tag-1"] }),
      makeTodo({ tagIds: ["tag-2"] }),
    ];
    const result = getTagDistribution(todos, [tag1, tag2]);
    expect(result).toEqual([
      { name: "Work", value: 2, color: "#3b82f6" },
      { name: "Personal", value: 1, color: "#22c55e" },
    ]);
  });

  it("counts todos with multiple tags in each tag", () => {
    const todos = [makeTodo({ tagIds: ["tag-1", "tag-2"] })];
    const result = getTagDistribution(todos, [tag1, tag2]);
    expect(result).toEqual([
      { name: "Work", value: 1, color: "#3b82f6" },
      { name: "Personal", value: 1, color: "#22c55e" },
    ]);
  });

  it("excludes tags with zero todos", () => {
    const todos = [makeTodo({ tagIds: ["tag-1"] })];
    const result = getTagDistribution(todos, [tag1, tag2]);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Work");
  });

  it("returns empty array for no todos", () => {
    const result = getTagDistribution([], [tag1, tag2]);
    expect(result).toEqual([]);
  });
});

describe("getDateRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Wednesday 2026-02-11
    vi.setSystemTime(new Date("2026-02-11T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns week range starting Monday", () => {
    const { start, end } = getDateRange("week");
    expect(start.getDay()).toBe(1); // Monday
    expect(start.getDate()).toBe(9);
    expect(end.getDay()).toBe(0); // Sunday
    expect(end.getDate()).toBe(15);
  });

  it("returns month range", () => {
    const { start, end } = getDateRange("month");
    expect(start.getDate()).toBe(1);
    expect(end.getDate()).toBe(28); // Feb 2026
  });

  it("returns year range", () => {
    const { start, end } = getDateRange("year");
    expect(start.getMonth()).toBe(0); // January
    expect(end.getMonth()).toBe(11); // December
  });

  it("returns custom range", () => {
    const from = new Date("2026-01-01");
    const to = new Date("2026-01-31");
    const { start, end } = getDateRange("custom", from, to);
    expect(start).toBe(from);
    expect(end).toBe(to);
  });
});

describe("getCompletionData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-11T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns daily data for week range", () => {
    const todos = [
      makeTodo({
        status: "completed",
        completedAt: "2026-02-09T10:00:00.000Z", // Monday
      }),
      makeTodo({
        status: "completed",
        completedAt: "2026-02-09T14:00:00.000Z", // Monday again
      }),
      makeTodo({
        status: "completed",
        completedAt: "2026-02-11T10:00:00.000Z", // Wednesday
      }),
    ];
    const result = getCompletionData(todos, "week");
    expect(result).toHaveLength(7); // Mon-Sun
    // Monday has 2 completions
    expect(result[0]?.count).toBe(2);
    // Wednesday has 1
    expect(result[2]?.count).toBe(1);
  });

  it("excludes open todos from completion data", () => {
    const todos = [
      makeTodo({ status: "open" }),
      makeTodo({
        status: "completed",
        completedAt: "2026-02-11T10:00:00.000Z",
      }),
    ];
    const result = getCompletionData(todos, "week");
    const total = result.reduce((sum, item) => sum + item.count, 0);
    expect(total).toBe(1);
  });

  it("returns weekly data for month range", () => {
    const result = getCompletionData([], "month");
    // February 2026 has ~4-5 weeks
    expect(result.length).toBeGreaterThanOrEqual(4);
    expect(result[0]?.label).toMatch(/^W\d+$/);
  });

  it("returns monthly data for year range", () => {
    const result = getCompletionData([], "year");
    expect(result).toHaveLength(12);
    expect(result[0]?.label).toBe("Jan");
    expect(result[11]?.label).toBe("Dec");
  });
});

describe("getTotalCompleted", () => {
  it("returns count of completed todos", () => {
    const todos = [
      makeTodo({ status: "completed" }),
      makeTodo({ status: "completed" }),
      makeTodo({ status: "open" }),
    ];
    expect(getTotalCompleted(todos)).toBe(2);
  });

  it("returns 0 for no completed todos", () => {
    expect(getTotalCompleted([makeTodo()])).toBe(0);
  });

  it("returns 0 for empty array", () => {
    expect(getTotalCompleted([])).toBe(0);
  });
});

describe("getDailyAverage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-11T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 0 for no completed todos", () => {
    expect(getDailyAverage([])).toBe(0);
    expect(getDailyAverage([makeTodo()])).toBe(0);
  });

  it("calculates average based on date range of completions", () => {
    const todos = [
      makeTodo({
        status: "completed",
        completedAt: "2026-02-01T10:00:00.000Z",
      }),
      makeTodo({
        status: "completed",
        completedAt: "2026-02-11T10:00:00.000Z",
      }),
    ];
    // 2 completions over 10 days = 0.2
    const avg = getDailyAverage(todos);
    expect(avg).toBe(0.2);
  });
});
