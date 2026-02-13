import { describe, it, expect } from "vitest";
import { todoSchema, todoCreateSchema } from "./types.ts";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";
const validUUID2 = "660e8400-e29b-41d4-a716-446655440001";

describe("todoSchema", () => {
  const validTodo = {
    id: validUUID,
    title: "Buy groceries",
    description: null,
    tagIds: [validUUID2],
    parentId: null,
    status: "open" as const,
    dueDate: null,
    recurrence: null,
    recurrenceInterval: null,
    createdAt: "2026-02-10T12:00:00.000Z",
    completedAt: null,
    sortOrder: 0,
  };

  it("validates a correct todo", () => {
    const result = todoSchema.safeParse(validTodo);
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = todoSchema.safeParse({ ...validTodo, title: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = todoSchema.safeParse({ ...validTodo, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title longer than 200 characters", () => {
    const result = todoSchema.safeParse({
      ...validTodo,
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("accepts title with exactly 200 characters", () => {
    const result = todoSchema.safeParse({
      ...validTodo,
      title: "a".repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty tagIds array", () => {
    const result = todoSchema.safeParse({ ...validTodo, tagIds: [] });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID tagIds", () => {
    const result = todoSchema.safeParse({
      ...validTodo,
      tagIds: ["not-a-uuid"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts multiple tagIds", () => {
    const result = todoSchema.safeParse({
      ...validTodo,
      tagIds: [validUUID, validUUID2],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = todoSchema.safeParse({
      ...validTodo,
      status: "in-progress",
    });
    expect(result.success).toBe(false);
  });

  it("accepts completed status", () => {
    const result = todoSchema.safeParse({
      ...validTodo,
      status: "completed",
      completedAt: "2026-02-10T13:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts description as string", () => {
    const result = todoSchema.safeParse({
      ...validTodo,
      description: "Some notes",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid recurrence values", () => {
    for (const rec of ["daily", "weekly", "monthly", "yearly", "custom"]) {
      const result = todoSchema.safeParse({
        ...validTodo,
        recurrence: rec,
        recurrenceInterval: 1,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid recurrence value", () => {
    const result = todoSchema.safeParse({
      ...validTodo,
      recurrence: "biweekly",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive recurrenceInterval", () => {
    const result = todoSchema.safeParse({
      ...validTodo,
      recurrenceInterval: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts parentId as UUID", () => {
    const result = todoSchema.safeParse({
      ...validTodo,
      parentId: validUUID2,
    });
    expect(result.success).toBe(true);
  });
});

describe("todoCreateSchema", () => {
  const validCreate = {
    title: "New task",
    description: null,
    tagIds: [validUUID],
    parentId: null,
    dueDate: null,
    recurrence: null,
    recurrenceInterval: null,
  };

  it("validates a correct todo create input", () => {
    const result = todoCreateSchema.safeParse(validCreate);
    expect(result.success).toBe(true);
  });

  it("does not require id, createdAt, completedAt, status, sortOrder", () => {
    const result = todoCreateSchema.safeParse(validCreate);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("id");
      expect(result.data).not.toHaveProperty("createdAt");
      expect(result.data).not.toHaveProperty("completedAt");
      expect(result.data).not.toHaveProperty("status");
      expect(result.data).not.toHaveProperty("sortOrder");
    }
  });

  it("rejects missing title", () => {
    const result = todoCreateSchema.safeParse({
      description: validCreate.description,
      tagIds: validCreate.tagIds,
      parentId: validCreate.parentId,
      dueDate: validCreate.dueDate,
      recurrence: validCreate.recurrence,
      recurrenceInterval: validCreate.recurrenceInterval,
    });
    expect(result.success).toBe(false);
  });
});
