/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CollapsedTodoGroupNode } from "./collapsed-todo-group-node.tsx";

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
}));

describe("CollapsedTodoGroupNode", () => {
  const makeProps = (overrides: Record<string, unknown> = {}) => ({
    id: "group-1",
    type: "collapsedTodoGroupNode" as const,
    data: {
      tagId: "tag-1",
      count: 5,
      completedCount: 2,
      onExpand: vi.fn(),
      ...overrides,
    },
    isConnectable: false,
  });

  it("renders open and completed counts", () => {
    render(<CollapsedTodoGroupNode {...(makeProps() as any)} />);
    expect(screen.getByText(/3 open/)).toBeInTheDocument();
    expect(screen.getByText(/2 done/)).toBeInTheDocument();
  });

  it("shows only open count when no completed", () => {
    render(<CollapsedTodoGroupNode {...(makeProps({ count: 3, completedCount: 0 }) as any)} />);
    expect(screen.getByText("3 open")).toBeInTheDocument();
  });

  it("shows only done count when all completed", () => {
    render(<CollapsedTodoGroupNode {...(makeProps({ count: 4, completedCount: 4 }) as any)} />);
    expect(screen.getByText("4 done")).toBeInTheDocument();
  });

  it("shows 'N todos' when count is 0", () => {
    render(<CollapsedTodoGroupNode {...(makeProps({ count: 0, completedCount: 0 }) as any)} />);
    expect(screen.getByText("0 todos")).toBeInTheDocument();
  });

  it("calls onExpand with tagId on click", () => {
    const onExpand = vi.fn();
    render(<CollapsedTodoGroupNode {...(makeProps({ onExpand }) as any)} />);
    fireEvent.click(screen.getByTestId("collapsed-todo-group-node"));
    expect(onExpand).toHaveBeenCalledWith("tag-1");
  });

  it("calls onExpand on Enter keypress", () => {
    const onExpand = vi.fn();
    render(<CollapsedTodoGroupNode {...(makeProps({ onExpand }) as any)} />);
    fireEvent.keyDown(screen.getByTestId("collapsed-todo-group-node"), { key: "Enter" });
    expect(onExpand).toHaveBeenCalledWith("tag-1");
  });

  it("calls onExpand on Space keypress", () => {
    const onExpand = vi.fn();
    render(<CollapsedTodoGroupNode {...(makeProps({ onExpand }) as any)} />);
    fireEvent.keyDown(screen.getByTestId("collapsed-todo-group-node"), { key: " " });
    expect(onExpand).toHaveBeenCalledWith("tag-1");
  });
});
