import type { TicketTemplate } from "@/types";

export async function getTemplates(): Promise<TicketTemplate[]> {
  const res = await fetch("/api/templates");
  if (!res.ok) throw new Error("Şablonlar yüklenemedi");
  return res.json() as Promise<TicketTemplate[]>;
}

export async function createTemplate(data: {
  name: string;
  title: string;
  description: string;
  categoryId?: string;
}): Promise<TicketTemplate> {
  const res = await fetch("/api/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json() as { message?: string };
    throw new Error(err.message ?? "Şablon oluşturulamadı");
  }
  return res.json() as Promise<TicketTemplate>;
}

export async function updateTemplate(
  id: string,
  data: Partial<{ name: string; title: string; description: string; categoryId: string }>
): Promise<TicketTemplate> {
  const res = await fetch(`/api/templates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json() as { message?: string };
    throw new Error(err.message ?? "Şablon güncellenemedi");
  }
  return res.json() as Promise<TicketTemplate>;
}

export async function deleteTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Şablon silinemedi");
}
