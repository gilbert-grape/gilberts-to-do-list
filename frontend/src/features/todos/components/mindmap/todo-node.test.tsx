/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TodoNode } from "./todo-node.tsx";

vi.mock("@xyflow/react", () => ({
  Handle: ({ type, position }: { type: string; position: string }) => (
    <div data-testid={`handle-${type}-${position}`} />
  ),
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
}));

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    id: "todo-1",
    type: "todoNode" as const,
    data: {
      todoId: "t1",
      label: "Buy milk",
      completed: false,
      onToggle: vi.fn(),
      onTitleClick: vi.fn(),
      ...overrides,
    },
    isConnectable: false,
  };
}

describe("TodoNode", () => {
  it("renders todo title", () => {
    render(<TodoNode {...(makeProps() as any)} />);
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
  });

  it("applies strikethrough for completed todo", () => {
    render(<TodoNode {...(makeProps({ completed: true }) as any)} />);
    const button = screen.getByText("Buy milk");
    expect(button.className).toContain("line-through");
  });

  it("calls onTitleClick when title is clicked", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<TodoNode {...(props as any)} />);

    await user.click(screen.getByText("Buy milk"));
    expect(
      (props as { data: { onTitleClick: ReturnType<typeof vi.fn> } }).data
        .onTitleClick,
    ).toHaveBeenCalledWith("t1");
  });

  it("renders top target and bottom source handles", () => {
    render(<TodoNode {...(makeProps() as any)} />);
    expect(screen.getByTestId("handle-target-top")).toBeInTheDocument();
    expect(screen.getByTestId("handle-source-bottom")).toBeInTheDocument();
  });

  it("renders zoom button for non-completed todo", () => {
    render(<TodoNode {...(makeProps() as any)} />);
    expect(screen.getByTestId("todo-zoom-button")).toBeInTheDocument();
  });

  it("zoom button calls onZoom", async () => {
    const user = userEvent.setup();
    const onZoom = vi.fn();
    const props = makeProps({ onZoom });
    render(<TodoNode {...(props as any)} />);

    await user.click(screen.getByTestId("todo-zoom-button"));
    expect(onZoom).toHaveBeenCalledWith("t1");
  });

  it("does not render zoom button for completed todo", () => {
    render(<TodoNode {...(makeProps({ completed: true }) as any)} />);
    expect(screen.queryByTestId("todo-zoom-button")).not.toBeInTheDocument();
  });

  it("edit button calls onEdit", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const props = makeProps({ onEdit });
    render(<TodoNode {...(props as any)} />);

    await user.click(screen.getByTestId("todo-edit-button"));
    expect(onEdit).toHaveBeenCalledWith("t1");
  });
});
