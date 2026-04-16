import { z } from "zod";

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be at most 1000 characters"),
  parentCommentId: z.string().cuid().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
