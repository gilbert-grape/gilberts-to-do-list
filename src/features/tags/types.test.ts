import { describe, it, expect } from "vitest";
import { tagSchema, tagCreateSchema } from "./types.ts";

describe("tagSchema", () => {
  const validTag = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Work",
    color: "#3b82f6",
    isDefault: false,
  };

  it("validates a correct tag", () => {
    const result = tagSchema.safeParse(validTag);
    expect(result.success).toBe(true);
  });

  it("rejects missing id", () => {
    const result = tagSchema.safeParse({ ...validTag, id: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID id", () => {
    const result = tagSchema.safeParse({ ...validTag, id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = tagSchema.safeParse({ ...validTag, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 50 characters", () => {
    const result = tagSchema.safeParse({ ...validTag, name: "a".repeat(51) });
    expect(result.success).toBe(false);
  });

  it("accepts name with exactly 50 characters", () => {
    const result = tagSchema.safeParse({ ...validTag, name: "a".repeat(50) });
    expect(result.success).toBe(true);
  });

  it("rejects missing color", () => {
    const result = tagSchema.safeParse({ ...validTag, color: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects missing isDefault", () => {
    const result = tagSchema.safeParse({ ...validTag, isDefault: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean isDefault", () => {
    const result = tagSchema.safeParse({ ...validTag, isDefault: "yes" });
    expect(result.success).toBe(false);
  });
});

describe("tagCreateSchema", () => {
  const validTagCreate = {
    name: "Personal",
    color: "#ef4444",
    isDefault: true,
  };

  it("validates a correct tag create input", () => {
    const result = tagCreateSchema.safeParse(validTagCreate);
    expect(result.success).toBe(true);
  });

  it("does not require id", () => {
    const result = tagCreateSchema.safeParse(validTagCreate);
    expect(result.success).toBe(true);
  });

  it("strips id if provided", () => {
    const result = tagCreateSchema.safeParse({
      ...validTagCreate,
      id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("id");
    }
  });
});
