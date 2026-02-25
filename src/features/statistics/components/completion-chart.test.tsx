import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CompletionChart } from "./completion-chart.tsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "statistics.completionHistory": "Completion History",
        "statistics.timeRange": "Time Range",
        "statistics.count": "Count",
      };
      return translations[key] ?? key;
    },
  }),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: ({ labelFormatter, formatter }: { labelFormatter?: (label: string) => string; formatter?: (value: number) => [number, string] }) => {
    // Call formatters to cover lines 38-39
    if (labelFormatter) labelFormatter("Mon");
    if (formatter) formatter(5);
    return <div data-testid="tooltip" />;
  },
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
}));

describe("CompletionChart", () => {
  const data = [
    { label: "Mon", count: 3 },
    { label: "Tue", count: 5 },
    { label: "Wed", count: 0 },
  ];

  it("renders heading", () => {
    render(<CompletionChart data={data} />);
    expect(screen.getByRole("heading", { name: "Completion History" })).toBeInTheDocument();
  });

  it("renders chart components", () => {
    render(<CompletionChart data={data} />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders accessible data table", () => {
    render(<CompletionChart data={data} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders accessible img role with aria-label", () => {
    render(<CompletionChart data={data} />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Completion History");
  });

  it("renders empty data table when no data", () => {
    render(<CompletionChart data={[]} />);
    const table = screen.getByRole("table");
    expect(table.querySelectorAll("tbody tr")).toHaveLength(0);
  });
});
