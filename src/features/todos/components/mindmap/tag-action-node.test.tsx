import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TagActionNode } from "./tag-action-node.tsx";

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
}));

describe("TagActionNode", () => {
  describe("normal layout", () => {
    const defaultProps = {
      id: "action-1",
      type: "tagActionNode" as const,
      data: {
        tagId: "tag-1",
        layoutMode: "normal",
        onSelectAction: vi.fn(),
        onCancel: vi.fn(),
      },
      isConnectable: false,
    } as never;

    it("renders two buttons in normal mode", () => {
      render(<TagActionNode {...defaultProps} />);
      expect(screen.getByTestId("action-normal")).toBeInTheDocument();
      expect(screen.getByTestId("action-add-tag")).toBeInTheDocument();
      expect(screen.getByTestId("action-add-todo")).toBeInTheDocument();
    });

    it("calls onSelectAction with 'tag' when tag button clicked", () => {
      const onSelectAction = vi.fn();
      const props = {
        ...defaultProps,
        data: { ...defaultProps.data, onSelectAction },
      } as never;
      render(<TagActionNode {...props} />);
      fireEvent.click(screen.getByTestId("action-add-tag"));
      expect(onSelectAction).toHaveBeenCalledWith("tag-1", "tag");
    });

    it("calls onSelectAction with 'todo' when todo button clicked", () => {
      const onSelectAction = vi.fn();
      const props = {
        ...defaultProps,
        data: { ...defaultProps.data, onSelectAction },
      } as never;
      render(<TagActionNode {...props} />);
      fireEvent.click(screen.getByTestId("action-add-todo"));
      expect(onSelectAction).toHaveBeenCalledWith("tag-1", "todo");
    });
  });

  describe("compact layout", () => {
    const compactProps = {
      id: "action-1",
      type: "tagActionNode" as const,
      data: {
        tagId: "tag-1",
        layoutMode: "compact",
        onSelectAction: vi.fn(),
        onCancel: vi.fn(),
      },
      isConnectable: false,
    } as never;

    it("renders radial menu in compact mode", () => {
      render(<TagActionNode {...compactProps} />);
      expect(screen.getByTestId("action-radial")).toBeInTheDocument();
    });

    it("calls onSelectAction with 'tag' from radial menu", () => {
      const onSelectAction = vi.fn();
      const props = {
        ...compactProps,
        data: { ...compactProps.data, onSelectAction },
      } as never;
      render(<TagActionNode {...props} />);
      fireEvent.click(screen.getByTestId("action-add-tag"));
      expect(onSelectAction).toHaveBeenCalledWith("tag-1", "tag");
    });

    it("calls onSelectAction with 'todo' from radial menu", () => {
      const onSelectAction = vi.fn();
      const props = {
        ...compactProps,
        data: { ...compactProps.data, onSelectAction },
      } as never;
      render(<TagActionNode {...props} />);
      fireEvent.click(screen.getByTestId("action-add-todo"));
      expect(onSelectAction).toHaveBeenCalledWith("tag-1", "todo");
    });
  });
});
