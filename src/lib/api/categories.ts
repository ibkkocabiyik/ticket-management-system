import type { Category } from "@/types";

export async function getCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json() as Promise<Category[]>;
}

export async function createCategory(data: {
  name: string;
  description?: string;
}): Promise<Category> {
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json() as { message?: string };
    throw new Error(error.message ?? "Failed to create category");
  }
  return res.json() as Promise<Category>;
}

export async function updateCategory(
  id: string,
  data: { name?: string; description?: string }
): Promise<Category> {
  const res = await fetch(`/api/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json() as { message?: string };
    throw new Error(error.message ?? "Failed to update category");
  }
  return res.json() as Promise<Category>;
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete category");
}
