import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { DueDateRecurrenceSection } from "./due-date-recurrence-section.tsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "todos.moreOptions": "More Options",
        "todos.dueDate": "Due Date",
        "todos.recurrence": "Recurrence",
        "todos.recurrenceNone": "None",
        "todos.recurrenceDaily": "Daily",
        "todos.recurrenceWeekly": "Weekly",
        "todos.recurrenceMonthly": "Monthly",
        "todos.recurrenceCustom": "Custom",
        "todos.customInterval": "Every X days",
      };
      return translations[key] ?? key;
    },
  }),
}));

describe("DueDateRecurrenceSection", () => {
  const defaultProps = {
    dueDate: null,
    recurrence: null as null,
    recurrenceInterval: null as null,
    onDueDateChange: vi.fn(),
    onRecurrenceChange: vi.fn(),
    onRecurrenceIntervalChange: vi.fn(),
  };

  it("renders collapsed by default when no values set", () => {
    render(<DueDateRecurrenceSection {...defaultProps} />);
    expect(screen.getByText("More Options")).toBeInTheDocument();
    expect(screen.queryByText("Due Date")).not.toBeInTheDocument();
  });

  it("renders expanded when dueDate is set", () => {
    render(<DueDateRecurrenceSection {...defaultProps} dueDate="2026-03-15" />);
    expect(screen.getByText("Due Date")).toBeInTheDocument();
  });

  it("renders expanded when recurrence is set", () => {
    render(<DueDateRecurrenceSection {...defaultProps} recurrence="daily" />);
    expect(screen.getByText("Recurrence")).toBeInTheDocument();
  });

  it("expands on toggle click", async () => {
    const user = userEvent.setup();
    render(<DueDateRecurrenceSection {...defaultProps} />);

    await user.click(screen.getByText("More Options"));
    expect(screen.getByText("Due Date")).toBeInTheDocument();
    expect(screen.getByText("Recurrence")).toBeInTheDocument();
  });

  it("calls onDueDateChange when date is selected", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <DueDateRecurrenceSection
        {...defaultProps}
        dueDate={null}
        onDueDateChange={handleChange}
      />,
    );

    await user.click(screen.getByText("More Options"));
    const dateInput = screen.getByLabelText("Due Date");
    await user.type(dateInput, "2026-03-15");
    expect(handleChange).toHaveBeenCalled();
  });

  it("calls onRecurrenceChange when recurrence is selected", async () => {
    const user = userEvent.setup();
    const handleRecChange = vi.fn();
    render(
      <DueDateRecurrenceSection
        {...defaultProps}
        onRecurrenceChange={handleRecChange}
      />,
    );

    await user.click(screen.getByText("More Options"));
    await user.selectOptions(screen.getByLabelText("Recurrence"), "daily");
    expect(handleRecChange).toHaveBeenCalledWith("daily");
  });

  it("shows custom interval input when custom is selected", () => {
    render(
      <DueDateRecurrenceSection
        {...defaultProps}
        recurrence="custom"
        recurrenceInterval={3}
      />,
    );
    expect(screen.getByText("Every X days")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
  });

  it("hides custom interval input for non-custom recurrence", () => {
    render(<DueDateRecurrenceSection {...defaultProps} recurrence="daily" />);
    expect(screen.queryByText("Every X days")).not.toBeInTheDocument();
  });

  it("resets recurrence and interval when None is selected", async () => {
    const user = userEvent.setup();
    const handleRecChange = vi.fn();
    const handleIntervalChange = vi.fn();
    render(
      <DueDateRecurrenceSection
        {...defaultProps}
        recurrence="daily"
        onRecurrenceChange={handleRecChange}
        onRecurrenceIntervalChange={handleIntervalChange}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Recurrence"), "none");
    expect(handleRecChange).toHaveBeenCalledWith(null);
    expect(handleIntervalChange).toHaveBeenCalledWith(null);
  });
});
