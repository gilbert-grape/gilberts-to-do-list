/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TodoInputNode } from "./todo-input-node.tsx";

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
}));

describe("TodoInputNode", () => {
  const defaultProps = {
    id: "input-todo-1",
    type: "todoInputNode" as const,
    data: {
      tagId: "tag-1",
      onCreateTodo: vi.fn(),
      onCancel: vi.fn(),
    },
    isConnectable: false,
  };

  it("renders input field", () => {
    render(<TodoInputNode {...(defaultProps as any)} />);
    expect(screen.getByTestId("todo-input-node")).toBeInTheDocument();
    expect(screen.getByTestId("todo-input-field")).toBeInTheDocument();
  });

  it("calls onCreateTodo on Enter with non-empty value", () => {
    const onCreateTodo = vi.fn();
    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, onCreateTodo },
    };
    render(<TodoInputNode {...(props as any)} />);
    const input = screen.getByTestId("todo-input-field");
    fireEvent.change(input, { target: { value: "Buy milk" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCreateTodo).toHaveBeenCalledWith("tag-1", "Buy milk");
  });

  it("calls onCancel on Escape", () => {
    const onCancel = vi.fn();
    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, onCancel },
    };
    render(<TodoInputNode {...(props as any)} />);
    fireEvent.keyDown(screen.getByTestId("todo-input-field"), {
      key: "Escape",
    });
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onCancel on blur with empty value", () => {
    const onCancel = vi.fn();
    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, onCancel },
    };
    render(<TodoInputNode {...(props as any)} />);
    fireEvent.blur(screen.getByTestId("todo-input-field"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("trims whitespace before creating", () => {
    const onCreateTodo = vi.fn();
    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, onCreateTodo },
    };
    render(<TodoInputNode {...(props as any)} />);
    const input = screen.getByTestId("todo-input-field");
    fireEvent.change(input, { target: { value: "  Trimmed  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCreateTodo).toHaveBeenCalledWith("tag-1", "Trimmed");
  });

  it("calls onCreateTodo on blur with non-empty value", () => {
    const onCreateTodo = vi.fn();
    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, onCreateTodo },
    };
    render(<TodoInputNode {...(props as any)} />);
    const input = screen.getByTestId("todo-input-field");
    fireEvent.change(input, { target: { value: "Blur Todo" } });
    fireEvent.blur(input);
    expect(onCreateTodo).toHaveBeenCalledWith("tag-1", "Blur Todo");
  });
});
