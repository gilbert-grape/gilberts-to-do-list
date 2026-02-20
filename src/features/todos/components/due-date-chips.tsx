import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn, getContrastColor } from "@/shared/utils/index.ts";

export interface DueDateChipsProps {
  dueDate: string | null;
  onDueDateChange: (date: string | null) => void;
}

interface Preset {
  key: string;
  color: string;
  getDate: () => string;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getEndOfWeek(today: Date): Date {
  const d = new Date(today);
  const dayOfWeek = d.getDay(); // 0=Sun
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  d.setDate(d.getDate() + daysUntilSunday);
  return d;
}

function getStartOfNextWeek(today: Date): Date {
  const d = new Date(today);
  const dayOfWeek = d.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  d.setDate(d.getDate() + daysUntilMonday);
  return d;
}

function getEndOfMonth(today: Date): Date {
  return new Date(today.getFullYear(), today.getMonth() + 1, 0);
}

function getEndOfNextMonth(today: Date): Date {
  return new Date(today.getFullYear(), today.getMonth() + 2, 0);
}

function buildPresets(): Preset[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return [
    {
      key: "today",
      color: "#1e3a5f",
      getDate: () => formatDate(today),
    },
    {
      key: "tomorrow",
      color: "#1e5091",
      getDate: () => {
        const d = new Date(today);
        d.setDate(d.getDate() + 1);
        return formatDate(d);
      },
    },
    {
      key: "thisWeek",
      color: "#2563eb",
      getDate: () => formatDate(getEndOfWeek(today)),
    },
    {
      key: "nextWeek",
      color: "#3b82f6",
      getDate: () => {
        const start = getStartOfNextWeek(today);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return formatDate(end);
      },
    },
    {
      key: "thisMonth",
      color: "#60a5fa",
      getDate: () => formatDate(getEndOfMonth(today)),
    },
    {
      key: "nextMonth",
      color: "#93c5fd",
      getDate: () => formatDate(getEndOfNextMonth(today)),
    },
  ];
}

function getActivePreset(dueDate: string | null): string | null {
  if (!dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDate(today);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDate(tomorrow);

  if (dueDate === todayStr) return "today";
  if (dueDate === tomorrowStr) return "tomorrow";

  const dueDateObj = new Date(dueDate + "T00:00:00");

  // thisWeek: dueDate lies between today and end of this week (Sunday)
  const endOfWeek = getEndOfWeek(today);
  if (dueDateObj >= today && dueDateObj <= endOfWeek) return "thisWeek";

  // nextWeek: dueDate lies in next week (Mon-Sun)
  const startOfNextWeek = getStartOfNextWeek(today);
  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(endOfNextWeek.getDate() + 6);
  if (dueDateObj >= startOfNextWeek && dueDateObj <= endOfNextWeek)
    return "nextWeek";

  // thisMonth: dueDate lies in the rest of this month
  const endOfMonth = getEndOfMonth(today);
  if (dueDateObj >= today && dueDateObj <= endOfMonth) return "thisMonth";

  // nextMonth: dueDate lies in next month
  const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const endOfNextMonth = getEndOfNextMonth(today);
  if (dueDateObj >= startOfNextMonth && dueDateObj <= endOfNextMonth)
    return "nextMonth";

  return "custom";
}

const CUSTOM_COLOR = "#bfdbfe";

export function DueDateChips({ dueDate, onDueDateChange }: DueDateChipsProps) {
  const { t } = useTranslation();
  const [showCustomInput, setShowCustomInput] = useState(false);

  const presets = buildPresets();
  const activePreset = getActivePreset(dueDate);

  const handlePresetClick = (preset: Preset) => {
    if (activePreset === preset.key) {
      onDueDateChange(null);
    } else {
      onDueDateChange(preset.getDate());
    }
    setShowCustomInput(false);
  };

  const handleCustomClick = () => {
    if (activePreset === "custom") {
      onDueDateChange(null);
      setShowCustomInput(false);
    } else {
      setShowCustomInput(true);
    }
  };

  const handleCustomDateChange = (value: string) => {
    if (value) {
      onDueDateChange(value);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((preset) => {
        const isActive = activePreset === preset.key;
        return (
          <button
            key={preset.key}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-all",
              isActive
                ? "ring-2 ring-[var(--color-text)] shadow-md"
                : "opacity-70 hover:opacity-100",
            )}
            style={{
              backgroundColor: preset.color,
              color: getContrastColor(preset.color),
            }}
          >
            {t(`todos.due.${preset.key}`)}
          </button>
        );
      })}
      <button
        type="button"
        onClick={handleCustomClick}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium transition-all",
          activePreset === "custom"
            ? "ring-2 ring-[var(--color-text)] shadow-md"
            : "opacity-70 hover:opacity-100",
        )}
        style={{
          backgroundColor: CUSTOM_COLOR,
          color: getContrastColor(CUSTOM_COLOR),
        }}
      >
        {t("todos.due.custom")}
      </button>
      {showCustomInput && (
        <input
          type="date"
          value={dueDate ?? ""}
          onChange={(e) => handleCustomDateChange(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-text)]"
        />
      )}
    </div>
  );
}
