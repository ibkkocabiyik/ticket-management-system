"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, X, Check, XCircle } from "lucide-react";
import {
  useNotifications,
  useAllNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { useTicketDetail } from "@/context/TicketDetailContext";
import { Spinner } from "@/components/ui/Spinner";
import type { Notification } from "@/types";

const TYPE_ICONS: Record<string, string> = {
  ticket_created: "🎫",
  comment_added: "💬",
  status_changed: "🔄",
  ticket_assigned: "👤",
  transfer_request: "🔁",
  transfer_approved: "✅",
  transfer_rejected: "❌",
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} gün önce`;
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const { openTicket } = useTicketDetail();

  const handleClick = () => {
    onRead();
    if (notification.ticketId) {
      openTicket(notification.ticketId);
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

function PanelNotificationItem({
  notification,
  onRead,
  onClose,
  onRefresh,
}: {
  notification: Notification;
  onRead: () => void;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const { openTicket } = useTicketDetail();
  const [acting, setActing] = useState(false);

  const handleClick = () => {
    if (notification.type === "transfer_request") return; // butonlarla işleniyor
    onRead();
    if (notification.ticketId) {
      onClose();
      openTicket(notification.ticketId);
    }
  };

  const handleTransferAction = async (action: "approve" | "reject") => {
    if (!notification.transferRequestId || !notification.ticketId) return;
    setActing(true);
    try {
      const res = await fetch(`/api/tickets/${notification.ticketId}/transfer/${notification.transferRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? "İşlem gerçekleştirilemedi");
      }
      onRead();
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setActing(false);
    }
  };

  const isTransferRequest = notification.type === "transfer_request";

  return (
    <div
      className={`px-5 py-3.5 border-l-2 ${
        !notification.isRead
          ? "border-[#6366F1] bg-[#EEF2FF]/40 dark:bg-[#312E81]/10 dark:border-indigo-500"
          : "border-transparent"
      }`}
    >
      <button
        onClick={handleClick}
        disabled={isTransferRequest}
        className="w-full text-left hover:opacity-80 transition-opacity disabled:cursor-default"
      >
        <div className="flex items-start gap-3">
          <span className="text-lg leading-none mt-0.5" aria-hidden="true">
            {TYPE_ICONS[notification.type] ?? "🔔"}
          </span>
          <div className="flex-1 min-w-0">
            <p className={`text-xs leading-relaxed ${!notification.isRead ? "font-medium text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"}`}>
              {notification.message}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {formatRelativeTime(notification.createdAt)}
            </p>
          </div>
          {!notification.isRead && !isTransferRequest && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#6366F1] dark:bg-indigo-400" />
          )}
        </div>
      </button>

      {isTransferRequest && !notification.isRead && (
        <div className="mt-2.5 flex gap-2 pl-7">
          <button
            onClick={() => void handleTransferAction("approve")}
            disabled={acting}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            <Check size={11} />
            Onayla
          </button>
          <button
            onClick={() => void handleTransferAction("reject")}
            disabled={acting}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <XCircle size={11} />
            Reddet
          </button>
        </div>
      )}
    </div>
  );
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNotifications();
  const { data: allData, isLoading: allLoading, refetch: refetchAll } = useAllNotifications(isPanelOpen);
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } =
    useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const allNotifications = allData?.notifications ?? [];
  const panelUnreadCount = allNotifications.filter((n) => !n.isRead).length;

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

  useEffect(() => {
    if (!isPanelOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsPanelOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [isPanelOpen]);

  return (
    <>
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
            animate-popover-in
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
                  <Bell size={28} className="text-gray-300 dark:text-gray-600" />
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

            {/* Footer */}
            <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2.5">
              <button
                onClick={() => { setIsOpen(false); setIsPanelOpen(true); }}
                className="w-full text-center text-xs font-medium text-[#6366F1] hover:text-[#4F46E5] dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors py-1"
              >
                Tüm bildirimleri gör
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-out panel */}
      {isPanelOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-overlay-in"
            onClick={() => setIsPanelOpen(false)}
          />

          {/* Drawer */}
          <div
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 flex flex-col bg-white dark:bg-gray-800 shadow-2xl animate-[slide-in-right_0.3s_cubic-bezier(0.32,0.72,0,1)_both]"
            role="dialog"
            aria-modal="true"
            aria-label="Tüm bildirimler"
          >
            {/* Panel header */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 dark:border-gray-700 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#312E81]/30">
                  <Bell size={16} className="text-[#6366F1] dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Bildirimler
                  </h2>
                  {panelUnreadCount > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {panelUnreadCount} okunmamış
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {panelUnreadCount > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    disabled={isMarkingAll}
                    className="flex items-center gap-1 text-xs text-[#6366F1] hover:text-[#4F46E5] dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 transition-colors"
                  >
                    <CheckCheck size={12} />
                    <span className="hidden sm:inline">Tümünü okundu işaretle</span>
                  </button>
                )}
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Kapat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50 overscroll-contain">
              {allLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : allNotifications.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF2FF] dark:bg-[#312E81]/20">
                    <Bell size={28} className="text-[#6366F1] dark:text-indigo-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Henüz bildirim yok
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Yeni bildirimler burada görünecek
                  </p>
                </div>
              ) : (
                allNotifications.map((notification) => (
                  <PanelNotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={() => {
                      if (!notification.isRead) markRead(notification.id);
                    }}
                    onClose={() => setIsPanelOpen(false)}
                    onRefresh={() => void refetchAll()}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
