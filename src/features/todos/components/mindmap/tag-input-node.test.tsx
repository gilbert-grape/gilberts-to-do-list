import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TagInputNode } from "./tag-input-node.tsx";

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
}));

describe("TagInputNode", () => {
  const defaultProps = {
    id: "input-tag-1",
    type: "tagInputNode" as const,
    data: {
      parentTagId: "tag-1",
      onCreateTag: vi.fn(),
      onCancel: vi.fn(),
    },
    isConnectable: false,
  } as never;

  it("renders input field", () => {
    render(<TagInputNode {...defaultProps} />);
    expect(screen.getByTestId("tag-input-node")).toBeInTheDocument();
    expect(screen.getByTestId("tag-input-field")).toBeInTheDocument();
  });

  it("calls onCreateTag on Enter with non-empty value", () => {
    const onCreateTag = vi.fn();
    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, onCreateTag },
    } as never;
    render(<TagInputNode {...props} />);
    const input = screen.getByTestId("tag-input-field");
    fireEvent.change(input, { target: { value: "New Tag" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCreateTag).toHaveBeenCalledWith("tag-1", "New Tag");
  });

  it("calls onCancel on Escape", () => {
    const onCancel = vi.fn();
    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, onCancel },
    } as never;
    render(<TagInputNode {...props} />);
    fireEvent.keyDown(screen.getByTestId("tag-input-field"), {
      key: "Escape",
    });
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onCancel on blur with empty value", () => {
    const onCancel = vi.fn();
    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, onCancel },
    } as never;
    render(<TagInputNode {...props} />);
    fireEvent.blur(screen.getByTestId("tag-input-field"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("trims whitespace before creating", () => {
    const onCreateTag = vi.fn();
    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, onCreateTag },
    } as never;
    render(<TagInputNode {...props} />);
    const input = screen.getByTestId("tag-input-field");
    fireEvent.change(input, { target: { value: "  Trimmed  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCreateTag).toHaveBeenCalledWith("tag-1", "Trimmed");
  });
});
