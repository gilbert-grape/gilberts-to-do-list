/* eslint-disable @typescript-eslint/no-explicit-any */
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
};

describe("TagNode", () => {
  it("renders tag name", () => {
    render(<TagNode {...(defaultProps as any)} />);
    expect(screen.getByText("Work")).toBeInTheDocument();
  });

  it("applies background color and text color", () => {
    render(<TagNode {...(defaultProps as any)} />);
    const node = screen.getByTestId("tag-node");
    expect(node.style.backgroundColor).toBe("rgb(59, 130, 246)");
    expect(node.style.color).toBe("rgb(255, 255, 255)");
  });

  it("renders a bottom source handle", () => {
    render(<TagNode {...(defaultProps as any)} />);
    expect(screen.getByTestId("handle-source-bottom")).toBeInTheDocument();
  });

  it("renders a top target handle", () => {
    render(<TagNode {...(defaultProps as any)} />);
    expect(screen.getByTestId("handle-target-top")).toBeInTheDocument();
  });

  it("compact: renders single + button that calls onAddAction", () => {
    const onAddAction = vi.fn();
    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, layoutMode: "compact", onAddAction },
    };
    render(<TagNode {...(props as any)} />);
    expect(screen.getByTestId("tag-add-button")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("tag-add-button"));
    expect(onAddAction).toHaveBeenCalledWith("t1");
  });

  it("normal: renders # and check buttons", () => {
    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, layoutMode: "normal" },
    };
    render(<TagNode {...(props as any)} />);
    expect(screen.getByTestId("tag-add-tag-button")).toBeInTheDocument();
    expect(screen.getByTestId("tag-add-todo-button")).toBeInTheDocument();
    expect(screen.queryByTestId("tag-add-button")).not.toBeInTheDocument();
  });

  it("normal: # button calls onAddTag", () => {
    const onAddTag = vi.fn();
    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, layoutMode: "normal", onAddTag },
    };
    render(<TagNode {...(props as any)} />);
    fireEvent.click(screen.getByTestId("tag-add-tag-button"));
    expect(onAddTag).toHaveBeenCalledWith("t1");
  });

  it("normal: check button calls onAddTodo", () => {
    const onAddTodo = vi.fn();
    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, layoutMode: "normal", onAddTodo },
    };
    render(<TagNode {...(props as any)} />);
    fireEvent.click(screen.getByTestId("tag-add-todo-button"));
    expect(onAddTodo).toHaveBeenCalledWith("t1");
  });
});
