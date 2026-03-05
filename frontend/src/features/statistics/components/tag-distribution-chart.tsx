import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import type { TagDistributionItem } from "../stats-utils.ts";

export interface TagDistributionChartProps {
  data: TagDistributionItem[];
}

export function TagDistributionChart({ data }: TagDistributionChartProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-[var(--color-text)]">
        {t("statistics.tagDistribution")}
      </h3>
      <div role="img" aria-label={t("statistics.tagDistribution")}>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, value }) => `${name} (${value})`}
              labelLine
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Accessible data table for screen readers */}
      <table className="sr-only">
        <caption>{t("statistics.tagDistribution")}</caption>
        <thead>
          <tr>
            <th>Tag</th>
            <th>{t("statistics.count")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.name}>
              <td>{entry.name}</td>
              <td>{entry.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
