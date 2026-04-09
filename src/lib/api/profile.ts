import type { User } from "@/types";

export interface UpdateProfileInput {
  name?: string;
  phone?: string | null;
  company?: string | null;
  image?: string | null;
  currentPassword?: string;
  newPassword?: string;
}

export async function getProfile(): Promise<User> {
  const res = await fetch("/api/profile");
  if (!res.ok) throw new Error("Profil yüklenemedi");
  return res.json() as Promise<User>;
}

export async function updateProfile(data: UpdateProfileInput): Promise<User> {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? "Profil güncellenemedi");
  }
  return res.json() as Promise<User>;
}
