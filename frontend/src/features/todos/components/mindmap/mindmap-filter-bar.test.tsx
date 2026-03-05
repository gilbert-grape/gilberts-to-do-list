import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MindmapFilterBar } from "./mindmap-filter-bar.tsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("MindmapFilterBar", () => {
  const defaultProps = {
    statusFilter: "all" as const,
    dueDateFilter: "all" as const,
    onStatusChange: vi.fn(),
    onDueDateChange: vi.fn(),
  };

  it("renders status and due date filters", () => {
    render(<MindmapFilterBar {...defaultProps} />);
    expect(screen.getByTestId("status-filter")).toBeInTheDocument();
    expect(screen.getByTestId("due-date-filter")).toBeInTheDocument();
  });

  it("calls onStatusChange when status filter changes", () => {
    const onStatusChange = vi.fn();
    render(<MindmapFilterBar {...defaultProps} onStatusChange={onStatusChange} />);
    fireEvent.change(screen.getByTestId("status-filter"), { target: { value: "open" } });
    expect(onStatusChange).toHaveBeenCalledWith("open");
  });

  it("calls onDueDateChange when due date filter changes", () => {
    const onDueDateChange = vi.fn();
    render(<MindmapFilterBar {...defaultProps} onDueDateChange={onDueDateChange} />);
    fireEvent.change(screen.getByTestId("due-date-filter"), { target: { value: "overdue" } });
    expect(onDueDateChange).toHaveBeenCalledWith("overdue");
  });

  it("disables due date filter when status is completed", () => {
    render(<MindmapFilterBar {...defaultProps} statusFilter="completed" />);
    expect(screen.getByTestId("due-date-filter")).toBeDisabled();
  });

  it("enables due date filter when status is all", () => {
    render(<MindmapFilterBar {...defaultProps} statusFilter="all" />);
    expect(screen.getByTestId("due-date-filter")).not.toBeDisabled();
  });

  it("enables due date filter when status is open", () => {
    render(<MindmapFilterBar {...defaultProps} statusFilter="open" />);
    expect(screen.getByTestId("due-date-filter")).not.toBeDisabled();
  });
});
