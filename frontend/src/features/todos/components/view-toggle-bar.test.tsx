import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ViewToggleBar } from "./view-toggle-bar.tsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "views.flatList": "Flat List",
        "views.tagTabs": "Tag Tabs",
        "views.grouped": "Grouped",
        "views.mindmap": "Mindmap",
        "views.hardcore": "Hardcore",
      };
      return translations[key] ?? key;
    },
  }),
}));

describe("ViewToggleBar", () => {
  it("renders 5 view buttons", () => {
    render(<ViewToggleBar activeView="flatList" onViewChange={vi.fn()} />);
    expect(screen.getByTitle("Flat List")).toBeInTheDocument();
    expect(screen.getByTitle("Tag Tabs")).toBeInTheDocument();
    expect(screen.getByTitle("Grouped")).toBeInTheDocument();
    expect(screen.getByTitle("Mindmap")).toBeInTheDocument();
    expect(screen.getByTitle("Hardcore")).toBeInTheDocument();
  });

  it("marks flatList as active", () => {
    render(<ViewToggleBar activeView="flatList" onViewChange={vi.fn()} />);
    const flatListBtn = screen.getByTitle("Flat List");
    expect(flatListBtn.className).toContain("bg-[var(--color-primary)]");
  });

  it("enables all views", () => {
    render(<ViewToggleBar activeView="flatList" onViewChange={vi.fn()} />);
    expect(screen.getByTitle("Flat List")).not.toBeDisabled();
    expect(screen.getByTitle("Tag Tabs")).not.toBeDisabled();
    expect(screen.getByTitle("Grouped")).not.toBeDisabled();
    expect(screen.getByTitle("Mindmap")).not.toBeDisabled();
    expect(screen.getByTitle("Hardcore")).not.toBeDisabled();
  });

  it("calls onViewChange for hardcore click", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ViewToggleBar activeView="flatList" onViewChange={handleChange} />);
    await user.click(screen.getByTitle("Hardcore"));
    expect(handleChange).toHaveBeenCalledWith("hardcore");
  });

  it("calls onViewChange for mindmap click", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ViewToggleBar activeView="flatList" onViewChange={handleChange} />);
    await user.click(screen.getByTitle("Mindmap"));
    expect(handleChange).toHaveBeenCalledWith("mindmap");
  });

  it("calls onViewChange for tagTabs click", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ViewToggleBar activeView="flatList" onViewChange={handleChange} />);
    await user.click(screen.getByTitle("Tag Tabs"));
    expect(handleChange).toHaveBeenCalledWith("tagTabs");
  });

  it("calls onViewChange for grouped click", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ViewToggleBar activeView="flatList" onViewChange={handleChange} />);
    await user.click(screen.getByTitle("Grouped"));
    expect(handleChange).toHaveBeenCalledWith("grouped");
  });

  it("calls onViewChange for flatList click", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ViewToggleBar activeView="flatList" onViewChange={handleChange} />);
    await user.click(screen.getByTitle("Flat List"));
    expect(handleChange).toHaveBeenCalledWith("flatList");
  });
});
