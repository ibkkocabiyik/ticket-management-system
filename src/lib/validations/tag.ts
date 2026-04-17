import { z } from "zod";

export const createTagSchema = z.object({
  name: z
    .string()
    .min(2, "En az 2 karakter")
    .max(30, "En fazla 30 karakter")
    .regex(/^[^,]+$/, "Virgül kullanılamaz"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Hex renk olmalı")
    .optional(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
