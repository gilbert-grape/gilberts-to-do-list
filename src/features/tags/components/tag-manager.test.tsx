import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TagManager } from "./tag-manager.tsx";
import { useTagStore } from "../store.ts";
import type { Tag } from "../types.ts";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "tags.title": "Tag Management",
        "tags.namePlaceholder": "Tag name...",
        "tags.create": "Create",
        "tags.colorPicker": "Color picker",
        "tags.default": "Default",
        "tags.setDefault": "Set as default",
        "tags.selectNewDefault": "Select a new default tag:",
        "tags.errors.lastTag": "Cannot delete the last tag",
        "tags.parentTag": "Parent Tag",
        "tags.noParent": "None (root level)",
        "tags.changeParent": "Change Parent",
        "common.save": "Save",
        "common.cancel": "Cancel",
        "common.edit": "Edit",
        "common.delete": "Delete",
      };
      return translations[key] ?? key;
    },
  }),
}));

const mockCreateTag = vi.fn();
const mockUpdateTag = vi.fn();
const mockDeleteTag = vi.fn();
const mockSetDefaultTag = vi.fn();

function setupStore(tags: Tag[]) {
  useTagStore.setState({
    tags,
    isLoaded: true,
  });
  // Patch actions with mocks
  const state = useTagStore.getState();
  state.createTag = mockCreateTag;
  state.updateTag = mockUpdateTag;
  state.deleteTag = mockDeleteTag;
  state.setDefaultTag = mockSetDefaultTag;
}

const defaultTag: Tag = {
  id: "tag-1",
  name: "General",
  color: "#ef4444",
  isDefault: true,
  parentId: null,
};

const secondTag: Tag = {
  id: "tag-2",
  name: "Work",
  color: "#3b82f6",
  isDefault: false,
  parentId: null,
};

describe("TagManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteTag.mockResolvedValue(true);
    mockCreateTag.mockResolvedValue(undefined);
    mockUpdateTag.mockResolvedValue(undefined);
    mockSetDefaultTag.mockResolvedValue(undefined);
  });

  it("renders the title", () => {
    setupStore([defaultTag]);
    render(<TagManager />);
    expect(screen.getByText("Tag Management")).toBeInTheDocument();
  });

  it("renders all tags", () => {
    setupStore([defaultTag, secondTag]);
    render(<TagManager />);
    // Tag names appear in both the tag list spans and the parent selector dropdowns
    expect(screen.getAllByText("General").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Work").length).toBeGreaterThanOrEqual(1);
  });

  it("shows default badge on default tag", () => {
    setupStore([defaultTag, secondTag]);
    render(<TagManager />);
    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("shows 'Set as default' button on non-default tags", () => {
    setupStore([defaultTag, secondTag]);
    render(<TagManager />);
    expect(screen.getByText("Set as default")).toBeInTheDocument();
  });

  describe("create tag", () => {
    it("calls createTag with name and color on button click", async () => {
      const user = userEvent.setup();
      setupStore([defaultTag]);
      render(<TagManager />);

      const input = screen.getByPlaceholderText("Tag name...");
      await user.type(input, "NewTag");
      await user.click(screen.getByText("Create"));

      expect(mockCreateTag).toHaveBeenCalledWith({
        name: "NewTag",
        color: "#ef4444",
        isDefault: false,
        parentId: null,
      });
    });

    it("clears input after creation", async () => {
      const user = userEvent.setup();
      setupStore([defaultTag]);
      render(<TagManager />);

      const input = screen.getByPlaceholderText("Tag name...");
      await user.type(input, "NewTag");
      await user.click(screen.getByText("Create"));

      expect(input).toHaveValue("");
    });

    it("disables create button when name is empty", () => {
      setupStore([defaultTag]);
      render(<TagManager />);
      const createBtn = screen.getByText("Create");
      expect(createBtn).toBeDisabled();
    });
  });

  describe("rename tag", () => {
    it("enters edit mode on edit button click", async () => {
      const user = userEvent.setup();
      setupStore([defaultTag, secondTag]);
      render(<TagManager />);

      const editButtons = screen.getAllByText("Edit");
      await user.click(editButtons[0]!);

      const editInput = screen.getByDisplayValue("General");
      expect(editInput).toBeInTheDocument();
    });

    it("saves renamed tag on save click", async () => {
      const user = userEvent.setup();
      setupStore([defaultTag, secondTag]);
      render(<TagManager />);

      const editButtons = screen.getAllByText("Edit");
      await user.click(editButtons[0]!);

      const editInput = screen.getByDisplayValue("General");
      await user.clear(editInput);
      await user.type(editInput, "Renamed");
      await user.click(screen.getByText("Save"));

      expect(mockUpdateTag).toHaveBeenCalledWith("tag-1", { name: "Renamed" });
    });

    it("cancels edit on cancel click", async () => {
      const user = userEvent.setup();
      setupStore([defaultTag, secondTag]);
      render(<TagManager />);

      const editButtons = screen.getAllByText("Edit");
      await user.click(editButtons[0]!);
      await user.click(screen.getByText("Cancel"));

      expect(screen.getAllByText("General").length).toBeGreaterThanOrEqual(1);
      expect(mockUpdateTag).not.toHaveBeenCalled();
    });
  });

  describe("delete tag", () => {
    it("blocks deletion of the last tag", async () => {
      const user = userEvent.setup();
      setupStore([defaultTag]);
      render(<TagManager />);

      await user.click(screen.getByText("Delete"));

      expect(
        screen.getByText("Cannot delete the last tag"),
      ).toBeInTheDocument();
      expect(mockDeleteTag).not.toHaveBeenCalled();
    });

    it("deletes non-default tag directly", async () => {
      const user = userEvent.setup();
      setupStore([defaultTag, secondTag]);
      render(<TagManager />);

      const deleteButtons = screen.getAllByText("Delete");
      await user.click(deleteButtons[1]!);

      expect(mockDeleteTag).toHaveBeenCalledWith("tag-2");
    });

    it("prompts to reassign default before deleting default tag", async () => {
      const user = userEvent.setup();
      setupStore([defaultTag, secondTag]);
      render(<TagManager />);

      const deleteButtons = screen.getAllByText("Delete");
      await user.click(deleteButtons[0]!);

      expect(screen.getByText("Select a new default tag:")).toBeInTheDocument();
    });

    it("reassigns default and deletes after selection", async () => {
      const user = userEvent.setup();
      setupStore([defaultTag, secondTag]);
      render(<TagManager />);

      const deleteButtons = screen.getAllByText("Delete");
      await user.click(deleteButtons[0]!);

      const prompt = screen.getByRole("alert");
      const workChip = within(prompt).getByText("Work");
      await user.click(workChip);

      expect(mockSetDefaultTag).toHaveBeenCalledWith("tag-2");
      expect(mockDeleteTag).toHaveBeenCalledWith("tag-1");
    });
  });

  describe("set default", () => {
    it("calls setDefaultTag when 'Set as default' is clicked", async () => {
      const user = userEvent.setup();
      setupStore([defaultTag, secondTag]);
      render(<TagManager />);

      await user.click(screen.getByText("Set as default"));

      expect(mockSetDefaultTag).toHaveBeenCalledWith("tag-2");
    });
  });

  describe("color picker", () => {
    it("renders color picker buttons", () => {
      setupStore([defaultTag]);
      render(<TagManager />);
      const radioGroup = screen.getByRole("radiogroup");
      const buttons = within(radioGroup).getAllByRole("radio");
      expect(buttons.length).toBe(18);
    });

    it("allows selecting a color", async () => {
      const user = userEvent.setup();
      setupStore([defaultTag]);
      render(<TagManager />);

      const radioGroup = screen.getByRole("radiogroup");
      const buttons = within(radioGroup).getAllByRole("radio");
      await user.click(buttons[2]!);

      expect(buttons[2]).toHaveAttribute("aria-checked", "true");
    });
  });
});
