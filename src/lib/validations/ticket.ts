import { z } from "zod";

export const createTicketSchema = z.object({
  title: z
    .string()
    .min(5, "Başlık en az 5 karakter olmalıdır")
    .max(100, "Başlık en fazla 100 karakter olabilir"),
  description: z.string().optional().default(""),
  categoryId: z.string().min(1, "Kategori seçimi zorunludur"),
  priority: z.enum(["Low", "Normal", "High", "Urgent"]).optional(),
});

export const updateTicketSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be at most 100 characters")
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be at most 2000 characters")
    .optional(),
  status: z
    .enum(["Open", "InProgress", "Waiting", "Resolved", "Closed"])
    .optional(),
  priority: z.enum(["Low", "Normal", "High", "Urgent"]).optional(),
  categoryId: z.string().min(1, "Category is required").optional(),
  assigneeId: z.string().nullable().optional(),
});

export const ticketFiltersSchema = z.object({
  status: z
    .enum(["Open", "InProgress", "Waiting", "Resolved", "Closed"])
    .optional(),
  priority: z.enum(["Low", "Normal", "High", "Urgent"]).optional(),
  categoryId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "priority", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type TicketFiltersInput = z.infer<typeof ticketFiltersSchema>;
