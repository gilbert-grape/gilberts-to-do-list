import { useTranslation } from "react-i18next";

export function StatisticsView() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <p className="text-[var(--color-text-secondary)]">
        {t("placeholder.statistics")}
      </p>
    </div>
  );
}
