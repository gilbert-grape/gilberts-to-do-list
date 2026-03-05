import { z } from "zod";

export const todoStatusEnum = z.enum(["open", "completed"]);

export type TodoStatus = z.infer<typeof todoStatusEnum>;

export const todoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().nullable(),
  tagIds: z.array(z.string().uuid()).min(1),
  parentId: z.string().uuid().nullable(),
  status: todoStatusEnum,
  dueDate: z.string().nullable(),
  recurrence: z
    .enum(["daily", "weekly", "monthly", "yearly", "custom"])
    .nullable(),
  recurrenceInterval: z.number().int().positive().nullable(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
  sortOrder: z.number(),
});

export type Todo = z.infer<typeof todoSchema>;

export const todoCreateSchema = todoSchema.omit({
  id: true,
  createdAt: true,
  completedAt: true,
  status: true,
  sortOrder: true,
});

export type TodoCreate = z.infer<typeof todoCreateSchema>;
