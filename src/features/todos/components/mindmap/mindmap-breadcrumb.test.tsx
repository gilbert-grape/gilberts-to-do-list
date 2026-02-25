import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MindmapBreadcrumb } from "./mindmap-breadcrumb.tsx";
import type { Tag } from "@/features/tags/types.ts";

const tags: Tag[] = [
  { id: "t1", name: "Work", color: "#f00", isDefault: false, parentId: null },
  { id: "t2", name: "Dev", color: "#0f0", isDefault: false, parentId: "t1" },
  { id: "t3", name: "Frontend", color: "#00f", isDefault: false, parentId: "t2" },
];

describe("MindmapBreadcrumb", () => {
  it("returns null when path has only 1 item (root)", () => {
    const { container } = render(
      <MindmapBreadcrumb focusTagId={null} tags={tags} rootLabel="Root" onNavigate={vi.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders breadcrumb when focused on a tag", () => {
    render(
      <MindmapBreadcrumb focusTagId="t2" tags={tags} rootLabel="Root" onNavigate={vi.fn()} />,
    );
    expect(screen.getByTestId("mindmap-breadcrumb")).toBeInTheDocument();
    expect(screen.getByText("Root")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Dev")).toBeInTheDocument();
  });

  it("navigates to root when root is clicked", () => {
    const onNavigate = vi.fn();
    render(
      <MindmapBreadcrumb focusTagId="t2" tags={tags} rootLabel="Root" onNavigate={onNavigate} />,
    );
    fireEvent.click(screen.getByText("Root"));
    expect(onNavigate).toHaveBeenCalledWith(null);
  });

  it("navigates to parent tag when clicked", () => {
    const onNavigate = vi.fn();
    render(
      <MindmapBreadcrumb focusTagId="t3" tags={tags} rootLabel="Root" onNavigate={onNavigate} />,
    );
    fireEvent.click(screen.getByText("Work"));
    expect(onNavigate).toHaveBeenCalledWith("t1");
  });

  it("last breadcrumb item is not a button", () => {
    render(
      <MindmapBreadcrumb focusTagId="t2" tags={tags} rootLabel="Root" onNavigate={vi.fn()} />,
    );
    // "Dev" is the last item — should be a span, not a button
    const devText = screen.getByText("Dev");
    expect(devText.tagName).toBe("SPAN");
  });
});
