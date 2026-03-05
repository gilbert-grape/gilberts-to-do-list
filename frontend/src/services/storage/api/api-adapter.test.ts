import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ApiAdapter, ApiError } from "./api-adapter.ts";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

function errorResponse(status: number, body = "error") {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(body),
  });
}

describe("ApiAdapter", () => {
  let api: ApiAdapter;

  beforeEach(() => {
    mockFetch.mockReset();
    api = new ApiAdapter("http://localhost:8099");
  });

  // --- Health ---
  describe("healthCheck", () => {
    it("returns true when server responds", async () => {
      mockFetch.mockResolvedValue({ ok: true });
      expect(await api.healthCheck()).toBe(true);
    });

    it("returns false when server is unreachable", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));
      expect(await api.healthCheck()).toBe(false);
    });

    it("passes abort signal", async () => {
      mockFetch.mockResolvedValue({ ok: true });
      await api.healthCheck();
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8099/api/health",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });
  });

  // --- Tags ---
  describe("createTag", () => {
    it("POSTs to /api/tags and returns tag", async () => {
      const tag = { id: "t1", name: "Work", color: "#f00", isDefault: false, parentId: null };
      mockFetch.mockReturnValue(jsonResponse(tag, 201));
      const result = await api.createTag({ name: "Work", color: "#f00", isDefault: false, parentId: null });
      expect(result).toEqual(tag);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8099/api/tags",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  describe("updateTag", () => {
    it("PATCHes to /api/tags/:id", async () => {
      mockFetch.mockReturnValue(jsonResponse({ ok: true }));
      await api.updateTag("t1", { name: "Play" });
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8099/api/tags/t1",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  describe("deleteTag", () => {
    it("DELETEs /api/tags/:id", async () => {
      mockFetch.mockReturnValue(jsonResponse({ ok: true }));
      await api.deleteTag("t1");
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8099/api/tags/t1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  describe("getAllTags", () => {
    it("GETs /api/tags", async () => {
      const tags = [{ id: "t1", name: "Work", color: "#f00", isDefault: false, parentId: null }];
      mockFetch.mockReturnValue(jsonResponse(tags));
      const result = await api.getAllTags();
      expect(result).toEqual(tags);
    });
  });

  // --- Todos ---
  describe("createTodo", () => {
    it("POSTs to /api/todos", async () => {
      const todo = { id: "td1", title: "Buy milk", tagIds: [], status: "open" };
      mockFetch.mockReturnValue(jsonResponse(todo, 201));
      const result = await api.createTodo({ title: "Buy milk", tagIds: [] });
      expect(result).toEqual(todo);
    });
  });

  describe("updateTodo", () => {
    it("PATCHes /api/todos/:id", async () => {
      mockFetch.mockReturnValue(jsonResponse({ ok: true }));
      await api.updateTodo("td1", { title: "Updated" });
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8099/api/todos/td1",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  describe("deleteTodo", () => {
    it("DELETEs /api/todos/:id", async () => {
      mockFetch.mockReturnValue(jsonResponse({ ok: true }));
      await api.deleteTodo("td1");
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8099/api/todos/td1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  describe("getAllTodos", () => {
    it("GETs /api/todos", async () => {
      const todos = [{ id: "td1", title: "X" }];
      mockFetch.mockReturnValue(jsonResponse(todos));
      expect(await api.getAllTodos()).toEqual(todos);
    });
  });

  // --- Sync helpers ---
  describe("createTagFull", () => {
    it("POSTs full tag object", async () => {
      const tag = { id: "t1", name: "Work", color: "#f00", isDefault: false, parentId: null };
      mockFetch.mockReturnValue(jsonResponse(tag, 201));
      const result = await api.createTagFull(tag);
      expect(result).toEqual(tag);
    });
  });

  describe("createTodoFull", () => {
    it("POSTs full todo object", async () => {
      const todo = { id: "td1", title: "Buy milk", description: null, tagIds: [], parentId: null, status: "open" as const, dueDate: null, recurrence: null, recurrenceInterval: null, createdAt: "2025-01-01", completedAt: null, sortOrder: 0 };
      mockFetch.mockReturnValue(jsonResponse(todo, 201));
      const result = await api.createTodoFull(todo);
      expect(result).toEqual(todo);
    });
  });

  // --- Settings ---
  describe("getSettings", () => {
    it("GETs /api/settings", async () => {
      mockFetch.mockReturnValue(jsonResponse({ theme: "dark" }));
      expect(await api.getSettings()).toEqual({ theme: "dark" });
    });
  });

  describe("updateSettings", () => {
    it("PATCHes /api/settings", async () => {
      mockFetch.mockReturnValue(jsonResponse({ ok: true }));
      await api.updateSettings({ theme: "dark" });
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8099/api/settings",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  // --- Error handling ---
  describe("error handling", () => {
    it("throws ApiError on non-ok response", async () => {
      mockFetch.mockReturnValue(errorResponse(404, "Not found"));
      await expect(api.getAllTags()).rejects.toThrow(ApiError);
      await expect(api.getAllTags()).rejects.toThrow(/404/);
    });

    it("ApiError has correct status", async () => {
      mockFetch.mockReturnValue(errorResponse(500, "Internal error"));
      try {
        await api.getAllTags();
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(500);
      }
    });

    it("handles text() rejection gracefully", async () => {
      mockFetch.mockReturnValue(
        Promise.resolve({
          ok: false,
          status: 502,
          text: () => Promise.reject(new Error("fail")),
        }),
      );
      await expect(api.getAllTags()).rejects.toThrow(ApiError);
    });
  });
});
