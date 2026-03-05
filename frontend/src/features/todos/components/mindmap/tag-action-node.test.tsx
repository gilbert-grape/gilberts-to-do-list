/* eslint-disable @typescript-eslint/no-explicit-any */
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
    };

    it("renders two buttons in normal mode", () => {
      render(<TagActionNode {...(defaultProps as any)} />);
      expect(screen.getByTestId("action-normal")).toBeInTheDocument();
      expect(screen.getByTestId("action-add-tag")).toBeInTheDocument();
      expect(screen.getByTestId("action-add-todo")).toBeInTheDocument();
    });

    it("calls onSelectAction with 'tag' when tag button clicked", () => {
      const onSelectAction = vi.fn();
      const props = {
        ...defaultProps,
        data: { ...defaultProps.data, onSelectAction },
      };
      render(<TagActionNode {...(props as any)} />);
      fireEvent.click(screen.getByTestId("action-add-tag"));
      expect(onSelectAction).toHaveBeenCalledWith("tag-1", "tag");
    });

    it("calls onSelectAction with 'todo' when todo button clicked", () => {
      const onSelectAction = vi.fn();
      const props = {
        ...defaultProps,
        data: { ...defaultProps.data, onSelectAction },
      };
      render(<TagActionNode {...(props as any)} />);
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
    };

    it("renders radial menu in compact mode", () => {
      render(<TagActionNode {...(compactProps as any)} />);
      expect(screen.getByTestId("action-radial")).toBeInTheDocument();
    });

    it("calls onSelectAction with 'tag' from radial menu", () => {
      const onSelectAction = vi.fn();
      const props = {
        ...compactProps,
        data: { ...compactProps.data, onSelectAction },
      };
      render(<TagActionNode {...(props as any)} />);
      fireEvent.click(screen.getByTestId("action-add-tag"));
      expect(onSelectAction).toHaveBeenCalledWith("tag-1", "tag");
    });

    it("calls onSelectAction with 'todo' from radial menu", () => {
      const onSelectAction = vi.fn();
      const props = {
        ...compactProps,
        data: { ...compactProps.data, onSelectAction },
      };
      render(<TagActionNode {...(props as any)} />);
      fireEvent.click(screen.getByTestId("action-add-todo"));
      expect(onSelectAction).toHaveBeenCalledWith("tag-1", "todo");
    });
  });

  describe("backdrop click", () => {
    it("calls onCancel when backdrop is clicked", () => {
      const onCancel = vi.fn();
      const props = {
        id: "action-1",
        type: "tagActionNode" as const,
        data: {
          tagId: "tag-1",
          layoutMode: "normal",
          onSelectAction: vi.fn(),
          onCancel,
        },
        isConnectable: false,
      };
      render(<TagActionNode {...(props as any)} />);
      // Click the outer container directly (not a child button)
      fireEvent.click(screen.getByTestId("tag-action-node"));
      expect(onCancel).toHaveBeenCalled();
    });

    it("does not call onCancel when child button is clicked", () => {
      const onCancel = vi.fn();
      const props = {
        id: "action-1",
        type: "tagActionNode" as const,
        data: {
          tagId: "tag-1",
          layoutMode: "normal",
          onSelectAction: vi.fn(),
          onCancel,
        },
        isConnectable: false,
      };
      render(<TagActionNode {...(props as any)} />);
      fireEvent.click(screen.getByTestId("action-add-tag"));
      expect(onCancel).not.toHaveBeenCalled();
    });
  });
});
