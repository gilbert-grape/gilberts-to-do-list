import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { InlineTagCreate } from "./inline-tag-create.tsx";
import { useTagStore } from "../store.ts";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "tags.addNew": "Add new tag",
        "tags.namePlaceholder": "Tag name",
        "tags.colorPicker": "Color picker",
        "tags.create": "Create",
        "common.cancel": "Cancel",
      };
      return translations[key] ?? key;
    },
  }),
}));

describe("InlineTagCreate", () => {
  const onTagCreated = vi.fn();

  beforeEach(() => {
    onTagCreated.mockClear();
    useTagStore.setState({
      tags: [{ id: "t1", name: "Work", color: "#f00", isDefault: true, parentId: null }],
    } as never);
  });

  it("renders the + button when closed", () => {
    render(<InlineTagCreate onTagCreated={onTagCreated} />);
    expect(screen.getByTitle("Add new tag")).toBeInTheDocument();
  });

  it("opens the form when + is clicked", async () => {
    const user = userEvent.setup();
    render(<InlineTagCreate onTagCreated={onTagCreated} />);
    await user.click(screen.getByTitle("Add new tag"));
    expect(screen.getByPlaceholderText("Tag name")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("closes the form on Cancel click", async () => {
    const user = userEvent.setup();
    render(<InlineTagCreate onTagCreated={onTagCreated} />);
    await user.click(screen.getByTitle("Add new tag"));
    await user.click(screen.getByText("Cancel"));
    expect(screen.getByTitle("Add new tag")).toBeInTheDocument();
  });

  it("closes the form on Escape key", async () => {
    const user = userEvent.setup();
    render(<InlineTagCreate onTagCreated={onTagCreated} />);
    await user.click(screen.getByTitle("Add new tag"));
    await user.keyboard("{Escape}");
    expect(screen.getByTitle("Add new tag")).toBeInTheDocument();
  });

  it("disables Create button when name is empty", async () => {
    const user = userEvent.setup();
    render(<InlineTagCreate onTagCreated={onTagCreated} />);
    await user.click(screen.getByTitle("Add new tag"));
    expect(screen.getByText("Create")).toBeDisabled();
  });

  it("shows duplicate warning for existing tag name", async () => {
    const user = userEvent.setup();
    render(<InlineTagCreate onTagCreated={onTagCreated} />);
    await user.click(screen.getByTitle("Add new tag"));
    await user.type(screen.getByPlaceholderText("Tag name"), "Work");
    // Duplicate name shown (reuses tags.namePlaceholder key for the warning)
    const warnings = screen.getAllByText("Tag name");
    expect(warnings.length).toBeGreaterThanOrEqual(1);
  });

  it("creates a tag on Enter key and calls onTagCreated", async () => {
    const user = userEvent.setup();
    const createTag = vi.fn().mockResolvedValue({ id: "new-tag", name: "Play", color: "#f00", isDefault: false, parentId: null });
    useTagStore.setState({ tags: [], createTag } as never);

    render(<InlineTagCreate onTagCreated={onTagCreated} />);
    await user.click(screen.getByTitle("Add new tag"));
    await user.type(screen.getByPlaceholderText("Tag name"), "Play");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(createTag).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Play" }),
      );
    });
    expect(onTagCreated).toHaveBeenCalledWith("new-tag");
  });

  it("creates a tag on Create button click", async () => {
    const user = userEvent.setup();
    const createTag = vi.fn().mockResolvedValue({ id: "new-tag", name: "Play", color: "#f00", isDefault: false, parentId: null });
    useTagStore.setState({ tags: [], createTag } as never);

    render(<InlineTagCreate onTagCreated={onTagCreated} />);
    await user.click(screen.getByTitle("Add new tag"));
    await user.type(screen.getByPlaceholderText("Tag name"), "Play");
    await user.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(createTag).toHaveBeenCalled();
    });
  });

  it("allows selecting a color", async () => {
    const user = userEvent.setup();
    render(<InlineTagCreate onTagCreated={onTagCreated} />);
    await user.click(screen.getByTitle("Add new tag"));
    // Click the second color swatch
    const radioButtons = screen.getAllByRole("radio");
    expect(radioButtons.length).toBeGreaterThan(1);
    await user.click(radioButtons[1]!);
    expect(radioButtons[1]).toHaveAttribute("aria-checked", "true");
  });
});
