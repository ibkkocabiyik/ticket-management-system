import type { Ticket, PaginatedResponse, TicketFilters, Attachment } from "@/types";
import type { CreateTicketInput, UpdateTicketInput } from "@/lib/validations/ticket";

function buildQueryString(filters: TicketFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  return params.toString();
}

export async function getTickets(
  filters: TicketFilters = {}
): Promise<PaginatedResponse<Ticket>> {
  const qs = buildQueryString(filters);
  const res = await fetch(`/api/tickets?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch tickets");
  return res.json() as Promise<PaginatedResponse<Ticket>>;
}

export async function getTicket(id: string): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${id}`);
  if (!res.ok) throw new Error("Failed to fetch ticket");
  return res.json() as Promise<Ticket>;
}

export async function createTicket(data: CreateTicketInput): Promise<Ticket> {
  const res = await fetch("/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json() as { message?: string };
    throw new Error(error.message ?? "Failed to create ticket");
  }
  return res.json() as Promise<Ticket>;
}

export async function updateTicket(
  id: string,
  data: UpdateTicketInput
): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json() as { message?: string };
    throw new Error(error.message ?? "Failed to update ticket");
  }
  return res.json() as Promise<Ticket>;
}

export async function deleteTicket(id: string): Promise<void> {
  const res = await fetch(`/api/tickets/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete ticket");
}

export async function getTicketComments(ticketId: string) {
  const res = await fetch(`/api/tickets/${ticketId}/comments`);
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

export async function createComment(ticketId: string, content: string) {
  const res = await fetch(`/api/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const error = await res.json() as { message?: string };
    throw new Error(error.message ?? "Failed to create comment");
  }
  return res.json();
}

export async function uploadAttachment(
  file: File,
  target: { ticketId: string } | { commentId: string }
): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);
  if ("ticketId" in target) formData.append("ticketId", target.ticketId);
  else formData.append("commentId", target.commentId);

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const error = await res.json() as { message?: string };
    throw new Error(error.message ?? "Dosya yüklenemedi");
  }
  return res.json() as Promise<Attachment>;
}
