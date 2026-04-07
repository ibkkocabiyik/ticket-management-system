import type { User } from "@/types";

export async function getUsers(): Promise<User[]> {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json() as Promise<User[]>;
}

export async function updateUserRole(
  id: string,
  role: User["role"]
): Promise<User> {
  const res = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const error = await res.json() as { message?: string };
    throw new Error(error.message ?? "Failed to update user role");
  }
  return res.json() as Promise<User>;
}
