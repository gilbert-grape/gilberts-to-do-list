import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TagNode } from "./tag-node.tsx";

vi.mock("@xyflow/react", () => ({
  Handle: ({ type, position }: { type: string; position: string }) => (
    <div data-testid={`handle-${type}-${position}`} />
  ),
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
}));

const defaultProps = {
  id: "tag-1",
  type: "tagNode" as const,
  data: { tagId: "t1", label: "Work", color: "#3b82f6", textColor: "#ffffff" },
  isConnectable: false,
} as never;

describe("TagNode", () => {
  it("renders tag name", () => {
    render(<TagNode {...defaultProps} />);
    expect(screen.getByText("Work")).toBeInTheDocument();
  });

  it("applies background color and text color", () => {
    render(<TagNode {...defaultProps} />);
    const node = screen.getByTestId("tag-node");
    expect(node.style.backgroundColor).toBe("rgb(59, 130, 246)");
    expect(node.style.color).toBe("rgb(255, 255, 255)");
  });

  it("renders a bottom source handle", () => {
    render(<TagNode {...defaultProps} />);
    expect(screen.getByTestId("handle-source-bottom")).toBeInTheDocument();
  });

  it("renders a top target handle", () => {
    render(<TagNode {...defaultProps} />);
    expect(screen.getByTestId("handle-target-top")).toBeInTheDocument();
  });

  it("renders add button", () => {
    render(<TagNode {...defaultProps} />);
    expect(screen.getByTestId("tag-add-button")).toBeInTheDocument();
  });

  it("calls onAddAction when add button is clicked", () => {
    const onAddAction = vi.fn();
    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, onAddAction },
    } as never;
    render(<TagNode {...props} />);
    fireEvent.click(screen.getByTestId("tag-add-button"));
    expect(onAddAction).toHaveBeenCalledWith("t1");
  });
});
