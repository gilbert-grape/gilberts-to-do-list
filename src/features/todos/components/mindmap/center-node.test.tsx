/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CenterNode } from "./center-node.tsx";

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
}));

const defaultProps = {
  id: "center",
  type: "centerNode" as const,
  data: {
    label: "My Tasks",
    onAddTag: vi.fn(),
    onAddTodo: vi.fn(),
  },
  isConnectable: false,
};

describe("CenterNode", () => {
  it("renders the label", () => {
    render(<CenterNode {...(defaultProps as any)} />);
    expect(screen.getByText("My Tasks")).toBeInTheDocument();
  });

  it("renders zoom, edit, add tag and add todo hover buttons", () => {
    render(<CenterNode {...(defaultProps as any)} />);
    expect(screen.getByTestId("center-zoom-button")).toBeInTheDocument();
    expect(screen.getByTestId("center-edit-button")).toBeInTheDocument();
    expect(screen.getByTestId("center-add-tag-button")).toBeInTheDocument();
    expect(screen.getByTestId("center-add-todo-button")).toBeInTheDocument();
  });

  it("calls onAddTag when tag button is clicked", () => {
    const onAddTag = vi.fn();
    const props = { ...defaultProps, data: { ...defaultProps.data, onAddTag } };
    render(<CenterNode {...(props as any)} />);
    fireEvent.click(screen.getByTestId("center-add-tag-button"));
    expect(onAddTag).toHaveBeenCalledOnce();
  });

  it("calls onAddTodo when todo button is clicked", () => {
    const onAddTodo = vi.fn();
    const props = { ...defaultProps, data: { ...defaultProps.data, onAddTodo } };
    render(<CenterNode {...(props as any)} />);
    fireEvent.click(screen.getByTestId("center-add-todo-button"));
    expect(onAddTodo).toHaveBeenCalledOnce();
  });

  it("calls onEditTag when edit button is clicked", () => {
    const onEditTag = vi.fn();
    const props = { ...defaultProps, data: { ...defaultProps.data, onEditTag } };
    render(<CenterNode {...(props as any)} />);
    fireEvent.click(screen.getByTestId("center-edit-button"));
    expect(onEditTag).toHaveBeenCalledOnce();
  });

  it("calls onDrillDown when zoom button is clicked", () => {
    const onDrillDown = vi.fn();
    const props = { ...defaultProps, data: { ...defaultProps.data, onDrillDown } };
    render(<CenterNode {...(props as any)} />);
    fireEvent.click(screen.getByTestId("center-zoom-button"));
    expect(onDrillDown).toHaveBeenCalledOnce();
  });

  it("uses tag color when color and textColor are provided", () => {
    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, color: "#ef4444", textColor: "#ffffff" },
    };
    render(<CenterNode {...(props as any)} />);
    const node = screen.getByTestId("center-node");
    expect(node.style.backgroundColor).toBe("rgb(239, 68, 68)");
    expect(node.style.color).toBe("rgb(255, 255, 255)");
  });
});
