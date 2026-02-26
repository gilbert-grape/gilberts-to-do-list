/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TagInputNode } from "./tag-input-node.tsx";
import { TAG_COLORS } from "@/features/tags/colors.ts";
import type { Tag } from "@/features/tags/types.ts";

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
}));

const sampleTags: Tag[] = [
  { id: "tag-1", name: "Work", color: "#3b82f6", isDefault: true, parentId: null },
  { id: "tag-2", name: "Personal", color: "#22c55e", isDefault: false, parentId: null },
];

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    id: "input-tag-1",
    type: "tagInputNode" as const,
    data: {
      defaultParentId: "tag-1",
      defaultColor: TAG_COLORS[0],
      tags: sampleTags,
      onCreateTag: vi.fn(),
      onCancel: vi.fn(),
      ...overrides,
    },
    isConnectable: false,
  };
}

describe("TagInputNode", () => {
  it("renders input field, color palette, parent select and buttons", () => {
    render(<TagInputNode {...(makeProps() as any)} />);
    expect(screen.getByTestId("tag-input-node")).toBeInTheDocument();
    expect(screen.getByTestId("tag-input-field")).toBeInTheDocument();
    expect(screen.getByTestId("tag-color-palette")).toBeInTheDocument();
    expect(screen.getByTestId("tag-parent-select")).toBeInTheDocument();
    expect(screen.getByTestId("tag-input-submit")).toBeInTheDocument();
    expect(screen.getByTestId("tag-input-cancel")).toBeInTheDocument();
  });

  it("renders all color buttons", () => {
    render(<TagInputNode {...(makeProps() as any)} />);
    for (const c of TAG_COLORS) {
      expect(screen.getByTestId(`tag-color-${c}`)).toBeInTheDocument();
    }
  });

  it("pre-selects default color", () => {
    render(<TagInputNode {...(makeProps({ defaultColor: "#22c55e" }) as any)} />);
    const btn = screen.getByTestId("tag-color-#22c55e");
    expect(btn.className).toContain("scale-110");
  });

  it("renders parent options from tags", () => {
    render(<TagInputNode {...(makeProps() as any)} />);
    const select = screen.getByTestId("tag-parent-select") as HTMLSelectElement;
    // "-- No parent --" + 2 tags = 3 options
    expect(select.options).toHaveLength(3);
    expect(select.value).toBe("tag-1"); // defaultParentId
  });

  it("calls onCreateTag with name, color and parentId on submit", () => {
    const onCreateTag = vi.fn();
    const props = makeProps({ onCreateTag, defaultColor: "#ef4444" });
    render(<TagInputNode {...(props as any)} />);

    const input = screen.getByTestId("tag-input-field");
    fireEvent.change(input, { target: { value: "New Tag" } });
    fireEvent.click(screen.getByTestId("tag-input-submit"));

    expect(onCreateTag).toHaveBeenCalledWith("New Tag", "#ef4444", "tag-1");
  });

  it("calls onCreateTag on Enter with name, color and parentId", () => {
    const onCreateTag = vi.fn();
    const props = makeProps({ onCreateTag, defaultColor: "#ef4444" });
    render(<TagInputNode {...(props as any)} />);

    const input = screen.getByTestId("tag-input-field");
    fireEvent.change(input, { target: { value: "Enter Tag" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCreateTag).toHaveBeenCalledWith("Enter Tag", "#ef4444", "tag-1");
  });

  it("allows changing color before creating", async () => {
    const user = userEvent.setup();
    const onCreateTag = vi.fn();
    const props = makeProps({ onCreateTag, defaultColor: "#ef4444" });
    render(<TagInputNode {...(props as any)} />);

    // Change color
    await user.click(screen.getByTestId("tag-color-#3b82f6"));

    const input = screen.getByTestId("tag-input-field");
    fireEvent.change(input, { target: { value: "Blue Tag" } });
    fireEvent.click(screen.getByTestId("tag-input-submit"));

    expect(onCreateTag).toHaveBeenCalledWith("Blue Tag", "#3b82f6", "tag-1");
  });

  it("allows changing parent before creating", () => {
    const onCreateTag = vi.fn();
    const props = makeProps({ onCreateTag, defaultColor: "#ef4444" });
    render(<TagInputNode {...(props as any)} />);

    const select = screen.getByTestId("tag-parent-select");
    fireEvent.change(select, { target: { value: "tag-2" } });

    const input = screen.getByTestId("tag-input-field");
    fireEvent.change(input, { target: { value: "Sub Tag" } });
    fireEvent.click(screen.getByTestId("tag-input-submit"));

    expect(onCreateTag).toHaveBeenCalledWith("Sub Tag", "#ef4444", "tag-2");
  });

  it("allows selecting no parent", () => {
    const onCreateTag = vi.fn();
    const props = makeProps({ onCreateTag, defaultColor: "#ef4444" });
    render(<TagInputNode {...(props as any)} />);

    const select = screen.getByTestId("tag-parent-select");
    fireEvent.change(select, { target: { value: "" } });

    const input = screen.getByTestId("tag-input-field");
    fireEvent.change(input, { target: { value: "Root Tag" } });
    fireEvent.click(screen.getByTestId("tag-input-submit"));

    expect(onCreateTag).toHaveBeenCalledWith("Root Tag", "#ef4444", null);
  });

  it("calls onCancel on Escape", () => {
    const onCancel = vi.fn();
    const props = makeProps({ onCancel });
    render(<TagInputNode {...(props as any)} />);
    fireEvent.keyDown(screen.getByTestId("tag-input-field"), { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onCancel on cancel button click", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const props = makeProps({ onCancel });
    render(<TagInputNode {...(props as any)} />);
    await user.click(screen.getByTestId("tag-input-cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("submit button is disabled when name is empty", () => {
    render(<TagInputNode {...(makeProps() as any)} />);
    expect(screen.getByTestId("tag-input-submit")).toBeDisabled();
  });

  it("trims whitespace before creating", () => {
    const onCreateTag = vi.fn();
    const props = makeProps({ onCreateTag, defaultColor: "#ef4444" });
    render(<TagInputNode {...(props as any)} />);
    const input = screen.getByTestId("tag-input-field");
    fireEvent.change(input, { target: { value: "  Trimmed  " } });
    fireEvent.click(screen.getByTestId("tag-input-submit"));
    expect(onCreateTag).toHaveBeenCalledWith("Trimmed", "#ef4444", "tag-1");
  });
});
