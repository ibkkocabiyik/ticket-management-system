import type { Notification } from "@/types";

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export async function getNotifications(): Promise<NotificationsResponse> {
  const res = await fetch("/api/notifications");
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json() as Promise<NotificationsResponse>;
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to mark notification as read");
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch("/api/notifications", { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to mark all notifications as read");
}
