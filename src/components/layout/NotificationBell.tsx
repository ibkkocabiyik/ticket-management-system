"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { Spinner } from "@/components/ui/Spinner";
import type { Notification } from "@/types";

const TYPE_ICONS: Record<string, string> = {
  ticket_created: "🎫",
  comment_added: "💬",
  status_changed: "🔄",
  ticket_assigned: "👤",
};

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const router = useRouter();

  const handleClick = () => {
    onRead();
    if (notification.ticketId) {
      router.push(`/tickets/${notification.ticketId}`);
    }
  };

  const formattedDate = new Date(notification.createdAt).toLocaleDateString(
    "tr-TR",
    { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
  );

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
        !notification.isRead
          ? "bg-[#EEF2FF]/60 dark:bg-[#312E81]/10"
          : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-base leading-none mt-0.5" aria-hidden="true">
          {TYPE_ICONS[notification.type] ?? "🔔"}
        </span>
        <div className="flex-1 min-w-0">
          <p
            className={`text-xs leading-relaxed ${
              !notification.isRead
                ? "font-medium text-gray-900 dark:text-gray-100"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {formattedDate}
          </p>
        </div>
        {!notification.isRead && (
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#6366F1]" />
        )}
      </div>
    </button>
  );
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } =
    useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Bildirimler${unreadCount > 0 ? ` (${unreadCount} okunmamış)` : ""}`}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-[#EEF2FF] hover:text-[#6366F1] dark:text-gray-400 dark:hover:bg-[#312E81]/30 dark:hover:text-indigo-300 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="
          fixed md:absolute
          inset-x-0 top-14 md:top-full md:inset-x-auto
          md:right-0 md:mt-2 md:w-80
          mx-3 md:mx-0
          rounded-xl border border-gray-200 bg-white shadow-xl
          dark:border-gray-700 dark:bg-gray-800
          z-50 overflow-hidden
        ">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-gray-500 dark:text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Bildirimler
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#EEF2FF] px-1.5 py-0.5 text-xs font-medium text-[#6366F1] dark:bg-[#312E81]/30 dark:text-indigo-400">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                disabled={isMarkingAll}
                className="flex items-center gap-1 text-xs text-[#6366F1] hover:text-[#4F46E5] dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50"
              >
                <CheckCheck size={12} />
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
                <Bell
                  size={28}
                  className="text-gray-300 dark:text-gray-600"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Henüz bildirim yok
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={() => {
                    if (!notification.isRead) markRead(notification.id);
                    setIsOpen(false);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
