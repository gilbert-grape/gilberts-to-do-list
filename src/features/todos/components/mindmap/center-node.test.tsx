/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CenterNode } from "./center-node.tsx";

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
}));

describe("CenterNode", () => {
  describe("normal layout", () => {
    const defaultProps = {
      id: "center",
      type: "centerNode" as const,
      data: {
        label: "My Tasks",
        layoutMode: "normal",
        onAddTag: vi.fn(),
        onAddTodo: vi.fn(),
        onAddAction: vi.fn(),
      },
      isConnectable: false,
    };

    it("renders the label", () => {
      render(<CenterNode {...(defaultProps as any)} />);
      expect(screen.getByText("My Tasks")).toBeInTheDocument();
    });

    it("renders add tag and add todo buttons in normal mode", () => {
      render(<CenterNode {...(defaultProps as any)} />);
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
  });

  describe("compact layout", () => {
    const compactProps = {
      id: "center",
      type: "centerNode" as const,
      data: {
        label: "My Tasks",
        layoutMode: "compact",
        onAddAction: vi.fn(),
        onAddTag: vi.fn(),
        onAddTodo: vi.fn(),
      },
      isConnectable: false,
    };

    it("renders single + button in compact mode", () => {
      render(<CenterNode {...(compactProps as any)} />);
      expect(screen.getByTestId("center-add-button")).toBeInTheDocument();
    });

    it("calls onAddAction when + button is clicked", () => {
      const onAddAction = vi.fn();
      const props = { ...compactProps, data: { ...compactProps.data, onAddAction } };
      render(<CenterNode {...(props as any)} />);
      fireEvent.click(screen.getByTestId("center-add-button"));
      expect(onAddAction).toHaveBeenCalledOnce();
    });
  });
});
