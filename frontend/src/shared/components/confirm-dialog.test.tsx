import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ConfirmDialog, ChoiceDialog } from "./confirm-dialog.tsx";

describe("ConfirmDialog", () => {
  const defaultProps = {
    title: "Delete Todo",
    message: "Are you sure?",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it("renders title and message", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Delete Todo")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("renders confirm and cancel buttons", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    await user.click(screen.getByText("Delete"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    await user.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("has dialog role with aria-modal", () => {
    render(<ConfirmDialog {...defaultProps} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("calls onCancel when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("auto-focuses the first button", () => {
    render(<ConfirmDialog {...defaultProps} />);
    // The Cancel button appears first in the DOM
    expect(document.activeElement?.textContent).toBe("Cancel");
  });

  it("traps focus with Tab key", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);
    // Focus is on Cancel (first button)
    await user.tab(); // → Delete
    expect(document.activeElement?.textContent).toBe("Delete");
    await user.tab(); // → wrap to Cancel
    expect(document.activeElement?.textContent).toBe("Cancel");
  });

  it("traps focus with Shift+Tab", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);
    // Focus is on Cancel (first button)
    await user.tab({ shift: true }); // → wrap to Delete (last)
    expect(document.activeElement?.textContent).toBe("Delete");
  });

  it("renders with default variant", () => {
    render(<ConfirmDialog {...defaultProps} variant="default" />);
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });
});

describe("ChoiceDialog", () => {
  const defaultProps = {
    title: "Delete with children",
    message: "This todo has sub-todos.",
    choices: [
      { label: "Delete all", value: "delete-all" },
      { label: "Keep children", value: "keep-children" },
    ],
    cancelLabel: "Cancel",
    onChoice: vi.fn(),
    onCancel: vi.fn(),
  };

  it("renders title and message", () => {
    render(<ChoiceDialog {...defaultProps} />);
    expect(screen.getByText("Delete with children")).toBeInTheDocument();
    expect(screen.getByText("This todo has sub-todos.")).toBeInTheDocument();
  });

  it("renders all choices", () => {
    render(<ChoiceDialog {...defaultProps} />);
    expect(screen.getByText("Delete all")).toBeInTheDocument();
    expect(screen.getByText("Keep children")).toBeInTheDocument();
  });

  it("calls onChoice with correct value", async () => {
    const user = userEvent.setup();
    const onChoice = vi.fn();
    render(<ChoiceDialog {...defaultProps} onChoice={onChoice} />);
    await user.click(screen.getByText("Delete all"));
    expect(onChoice).toHaveBeenCalledWith("delete-all");
  });

  it("calls onCancel when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ChoiceDialog {...defaultProps} onCancel={onCancel} />);
    await user.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ChoiceDialog {...defaultProps} onCancel={onCancel} />);
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("renders choice with default variant", () => {
    const choices = [{ label: "Option A", value: "a", variant: "default" as const }];
    render(<ChoiceDialog {...defaultProps} choices={choices} />);
    expect(screen.getByText("Option A")).toBeInTheDocument();
  });
});
