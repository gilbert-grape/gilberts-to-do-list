import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagChip } from "./tag-chip.tsx";

describe("TagChip", () => {
  it("renders the tag name", () => {
    render(<TagChip name="Work" color="#3b82f6" />);
    expect(screen.getByText("Work")).toBeInTheDocument();
  });

  it("applies the background color", () => {
    render(<TagChip name="Work" color="#3b82f6" />);
    const chip = screen.getByText("Work");
    expect(chip).toHaveStyle({ backgroundColor: "#3b82f6" });
  });

  it("uses white text on dark backgrounds", () => {
    render(<TagChip name="Work" color="#1e293b" />);
    const chip = screen.getByText("Work");
    expect(chip).toHaveStyle({ color: "#ffffff" });
  });

  it("uses black text on light backgrounds", () => {
    render(<TagChip name="Work" color="#eab308" />);
    const chip = screen.getByText("Work");
    expect(chip).toHaveStyle({ color: "#000000" });
  });

  it("has minimum touch target of 44x44px", () => {
    render(<TagChip name="A" color="#3b82f6" />);
    const chip = screen.getByRole("button");
    expect(chip.className).toContain("min-h-[44px]");
    expect(chip.className).toContain("min-w-[44px]");
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<TagChip name="Work" color="#3b82f6" onClick={handleClick} />);
    await user.click(screen.getByText("Work"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("applies selected styling when selected", () => {
    render(<TagChip name="Work" color="#3b82f6" selected />);
    const chip = screen.getByRole("button");
    expect(chip.className).toContain("shadow-md");
  });

  it("applies unselected styling when not selected", () => {
    render(<TagChip name="Work" color="#3b82f6" />);
    const chip = screen.getByRole("button");
    expect(chip.className).toContain("opacity-70");
  });
});
