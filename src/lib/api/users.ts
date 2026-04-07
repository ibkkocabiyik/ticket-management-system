import type { User } from "@/types";

export async function getUsers(): Promise<User[]> {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json() as Promise<User[]>;
}

export async function createUser(data: { name: string; email: string; password: string; role: User["role"] }): Promise<User> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json() as { message?: string };
    throw new Error(error.message ?? "Kullanıcı oluşturulamadı");
  }
  return res.json() as Promise<User>;
}

export async function updateUserRole(id: string, role: User["role"]): Promise<User> {
  const res = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const error = await res.json() as { message?: string };
    throw new Error(error.message ?? "Rol güncellenemedi");
  }
  return res.json() as Promise<User>;
}

export async function updateUserName(id: string, name: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const error = await res.json() as { message?: string };
    throw new Error(error.message ?? "İsim güncellenemedi");
  }
  return res.json() as Promise<User>;
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const error = await res.json() as { message?: string };
    throw new Error(error.message ?? "Kullanıcı silinemedi");
  }
}

export async function bulkDeleteUsers(ids: string[]): Promise<{ affected: number }> {
  const res = await fetch("/api/users/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, action: "delete" }),
  });
  if (!res.ok) {
    const error = await res.json() as { message?: string };
    throw new Error(error.message ?? "İşlem başarısız");
  }
  return res.json() as Promise<{ affected: number }>;
}
