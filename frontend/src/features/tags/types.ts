import { z } from "zod";

export const tagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string(),
  isDefault: z.boolean(),
  parentId: z.string().uuid().nullable(),
});

export type Tag = z.infer<typeof tagSchema>;

export const tagCreateSchema = tagSchema.omit({ id: true });

export type TagCreate = z.infer<typeof tagCreateSchema>;
