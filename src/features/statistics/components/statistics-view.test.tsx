import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StatisticsView } from "./statistics-view.tsx";
import { useTodoStore } from "@/features/todos/store.ts";
import { useTagStore } from "@/features/tags/store.ts";
import type { Todo } from "@/features/todos/types.ts";
import type { Tag } from "@/features/tags/types.ts";

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "statistics.title": "Statistics",
        "statistics.tagDistribution": "To-Do Distribution by Tag",
        "statistics.completionHistory": "Completion History",
        "statistics.timeRange": "Time Range",
        "statistics.thisWeek": "This Week",
        "statistics.thisMonth": "This Month",
        "statistics.thisYear": "This Year",
        "statistics.custom": "Custom",
        "statistics.from": "From",
        "statistics.to": "To",
        "statistics.totalCompleted": "Total Completed",
        "statistics.dailyAverage": "Daily Average",
        "statistics.emptyState":
          "No completed to-dos yet — get started!",
        "statistics.count": "Count",
      };
      return translations[key] ?? key;
    },
  }),
}));

// Mock recharts to avoid rendering issues in jsdom
vi.mock("recharts", () => {
  const MockResponsiveContainer = ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div data-testid="responsive-container">{children}</div>;
  const MockPieChart = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  );
  const MockBarChart = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  );
  return {
    ResponsiveContainer: MockResponsiveContainer,
    PieChart: MockPieChart,
    Pie: () => null,
    Cell: () => null,
    Legend: () => null,
    Tooltip: () => null,
    BarChart: MockBarChart,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
  };
});

const tag: Tag = {
  id: "tag-1",
  name: "Work",
  color: "#3b82f6",
  isDefault: true,
};

const openTodo: Todo = {
  id: "todo-1",
  title: "Buy milk",
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
};

const completedTodo: Todo = {
  id: "todo-2",
  title: "Walk the dog",
  description: null,
  tagIds: ["tag-1"],
  parentId: null,
  status: "completed",
  dueDate: null,
  recurrence: null,
  recurrenceInterval: null,
  createdAt: "2026-02-10T11:00:00.000Z",
  completedAt: "2026-02-10T12:30:00.000Z",
  sortOrder: 1,
};

function setupStores(todos: Todo[] = [], tags: Tag[] = [tag]) {
  useTagStore.setState({ tags, isLoaded: true });
  useTodoStore.setState({
    todos,
    isLoaded: true,
    loadTodos: vi.fn().mockResolvedValue(undefined),
    toggleStatus: vi.fn().mockResolvedValue(undefined),
    createTodo: vi.fn().mockResolvedValue(undefined),
    updateTodo: vi.fn().mockResolvedValue(undefined),
    deleteTodo: vi.fn().mockResolvedValue(undefined),
    deleteTodoWithChildren: vi.fn().mockResolvedValue(undefined),
    getChildren: vi.fn().mockReturnValue([]),
    reorderTodos: vi.fn().mockResolvedValue(undefined),
  } as never);
}

describe("StatisticsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty state when no completed todos exist", () => {
    setupStores([openTodo]);
    render(<StatisticsView />);
    expect(
      screen.getByText("No completed to-dos yet — get started!"),
    ).toBeInTheDocument();
  });

  it("shows empty state when there are no todos at all", () => {
    setupStores([]);
    render(<StatisticsView />);
    expect(
      screen.getByText("No completed to-dos yet — get started!"),
    ).toBeInTheDocument();
  });

  it("renders statistics title when completed todos exist", () => {
    setupStores([completedTodo]);
    render(<StatisticsView />);
    expect(screen.getByText("Statistics")).toBeInTheDocument();
  });

  it("renders pie chart section", () => {
    setupStores([completedTodo]);
    render(<StatisticsView />);
    expect(
      screen.getAllByText("To-Do Distribution by Tag").length,
    ).toBeGreaterThan(0);
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });

  it("renders bar chart section", () => {
    setupStores([completedTodo]);
    render(<StatisticsView />);
    expect(screen.getAllByText("Completion History").length).toBeGreaterThan(0);
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders total completed count", () => {
    setupStores([completedTodo, openTodo]);
    render(<StatisticsView />);
    expect(screen.getByText("Total Completed")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders daily average", () => {
    setupStores([completedTodo]);
    render(<StatisticsView />);
    expect(screen.getByText("Daily Average")).toBeInTheDocument();
  });

  it("renders time range filter buttons", () => {
    setupStores([completedTodo]);
    render(<StatisticsView />);
    expect(screen.getByText("This Week")).toBeInTheDocument();
    expect(screen.getByText("This Month")).toBeInTheDocument();
    expect(screen.getByText("This Year")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("shows custom date inputs when Custom is clicked", async () => {
    const user = userEvent.setup();
    setupStores([completedTodo]);
    render(<StatisticsView />);

    await user.click(screen.getByText("Custom"));
    expect(screen.getByText("From:")).toBeInTheDocument();
    expect(screen.getByText("To:")).toBeInTheDocument();
  });

  it("does not show custom date inputs by default", () => {
    setupStores([completedTodo]);
    render(<StatisticsView />);
    expect(screen.queryByText("From:")).not.toBeInTheDocument();
    expect(screen.queryByText("To:")).not.toBeInTheDocument();
  });
});
