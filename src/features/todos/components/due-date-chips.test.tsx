import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DueDateChips } from "./due-date-chips.tsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "todos.due.today": "Today",
        "todos.due.tomorrow": "Tomorrow",
        "todos.due.thisWeek": "This Week",
        "todos.due.nextWeek": "Next Week",
        "todos.due.thisMonth": "This Month",
        "todos.due.nextMonth": "Next Month",
        "todos.due.custom": "Custom",
      };
      return translations[key] ?? key;
    },
  }),
}));

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

describe("DueDateChips", () => {
  let handleChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handleChange = vi.fn();
  });

  it("renders all 7 preset chips", () => {
    render(<DueDateChips dueDate={null} onDueDateChange={handleChange} />);

    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
    expect(screen.getByText("This Week")).toBeInTheDocument();
    expect(screen.getByText("Next Week")).toBeInTheDocument();
    expect(screen.getByText("This Month")).toBeInTheDocument();
    expect(screen.getByText("Next Month")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("calls onDueDateChange with today's date when 'Today' is clicked", async () => {
    const user = userEvent.setup();
    render(<DueDateChips dueDate={null} onDueDateChange={handleChange} />);

    await user.click(screen.getByText("Today"));
    expect(handleChange).toHaveBeenCalledWith(formatDate(getToday()));
  });

  it("calls onDueDateChange with tomorrow's date when 'Tomorrow' is clicked", async () => {
    const user = userEvent.setup();
    render(<DueDateChips dueDate={null} onDueDateChange={handleChange} />);

    const tomorrow = getToday();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await user.click(screen.getByText("Tomorrow"));
    expect(handleChange).toHaveBeenCalledWith(formatDate(tomorrow));
  });

  it("calls onDueDateChange(null) when clicking the active chip (toggle off)", async () => {
    const user = userEvent.setup();
    const todayStr = formatDate(getToday());
    render(
      <DueDateChips dueDate={todayStr} onDueDateChange={handleChange} />,
    );

    await user.click(screen.getByText("Today"));
    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it("shows date input when 'Custom' is clicked", async () => {
    const user = userEvent.setup();
    render(<DueDateChips dueDate={null} onDueDateChange={handleChange} />);

    await user.click(screen.getByText("Custom"));
    expect(screen.getByDisplayValue("")).toBeInTheDocument();
    const input = screen.getByDisplayValue("");
    expect(input).toHaveAttribute("type", "date");
  });

  it("calls onDueDateChange with custom date from date input", async () => {
    const user = userEvent.setup();
    render(<DueDateChips dueDate={null} onDueDateChange={handleChange} />);

    await user.click(screen.getByText("Custom"));
    const input = screen.getByDisplayValue("");
    await user.type(input, "2026-06-15");
    expect(handleChange).toHaveBeenCalled();
  });

  it("highlights 'Today' chip when dueDate is today", () => {
    const todayStr = formatDate(getToday());
    render(
      <DueDateChips dueDate={todayStr} onDueDateChange={handleChange} />,
    );

    const todayBtn = screen.getByText("Today");
    expect(todayBtn.className).toContain("ring-2");
  });

  it("highlights 'Tomorrow' chip when dueDate is tomorrow", () => {
    const tomorrow = getToday();
    tomorrow.setDate(tomorrow.getDate() + 1);
    render(
      <DueDateChips
        dueDate={formatDate(tomorrow)}
        onDueDateChange={handleChange}
      />,
    );

    const tomorrowBtn = screen.getByText("Tomorrow");
    expect(tomorrowBtn.className).toContain("ring-2");
  });

  it("highlights 'Custom' chip when dueDate doesn't match any preset", () => {
    // Use a date far in the future that won't match any preset
    render(
      <DueDateChips dueDate="2099-12-31" onDueDateChange={handleChange} />,
    );

    const customBtn = screen.getByText("Custom");
    expect(customBtn.className).toContain("ring-2");
  });
});
