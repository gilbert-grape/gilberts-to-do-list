import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { CompletionBarItem } from "../stats-utils.ts";

export interface CompletionChartProps {
  data: CompletionBarItem[];
}

export function CompletionChart({ data }: CompletionChartProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-[var(--color-text)]">
        {t("statistics.completionHistory")}
      </h3>
      <div role="img" aria-label={t("statistics.completionHistory")}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
            />
            <Tooltip
              labelFormatter={(label) => String(label)}
              formatter={(value: number | undefined) => [value ?? 0, t("statistics.count")]}
            />
            <Bar
              dataKey="count"
              fill="var(--color-primary)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Accessible data table for screen readers */}
      <table className="sr-only">
        <caption>{t("statistics.completionHistory")}</caption>
        <thead>
          <tr>
            <th>{t("statistics.timeRange")}</th>
            <th>{t("statistics.count")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.label}>
              <td>{entry.label}</td>
              <td>{entry.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
