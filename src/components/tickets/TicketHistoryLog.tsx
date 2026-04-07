"use client";

import { useTicketHistory } from "@/hooks/useTicket";
import { Spinner } from "@/components/ui/Spinner";
import type { TicketHistory } from "@/types";
import { History, ArrowRight } from "lucide-react";

const roleLabels: Record<string, string> = {
  Admin: "Admin",
  SupportTeam: "Destek Ekibi",
  EndUser: "Kullanıcı",
};

const actionLabels: Record<string, string> = {
  ticket_created: "Talep oluşturuldu",
  status_changed: "Durum değiştirildi",
  priority_changed: "Öncelik değiştirildi",
  assignee_changed: "Atanan değiştirildi",
  assignee_released: "Atanan bırakıldı",
  title_changed: "Başlık değiştirildi",
};

const roleColors: Record<string, string> = {
  Admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  SupportTeam: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  EndUser: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function HistoryItem({ entry }: { entry: TicketHistory }) {
  const isCreated = entry.action === "ticket_created";

  return (
    <div className="flex gap-3">
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 ${
          isCreated
            ? "border-blue-500 bg-blue-500"
            : "border-gray-400 bg-white dark:border-gray-500 dark:bg-gray-800"
        }`} />
        <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {entry.user.name}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[entry.user.role] ?? roleColors.EndUser}`}>
            {roleLabels[entry.user.role] ?? entry.user.role}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(entry.createdAt)}
          </span>
        </div>

        <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
          {actionLabels[entry.action] ?? entry.action}
        </p>

        {/* Old → New value */}
        {entry.field && (entry.oldValue !== undefined || entry.newValue !== undefined) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-gray-500 dark:text-gray-400">{entry.field}:</span>
            {entry.oldValue ? (
              <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-700 line-through dark:bg-red-900/20 dark:text-red-400">
                {entry.oldValue}
              </span>
            ) : (
              <span className="text-gray-400 italic">boş</span>
            )}
            <ArrowRight size={10} className="text-gray-400 shrink-0" />
            {entry.newValue ? (
              <span className="rounded bg-green-50 px-1.5 py-0.5 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                {entry.newValue}
              </span>
            ) : (
              <span className="text-gray-400 italic">boş</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface TicketHistoryLogProps {
  ticketId: string;
}

export function TicketHistoryLog({ ticketId }: TicketHistoryLogProps) {
  const { data: history, isLoading, isError, error } = useTicketHistory(ticketId);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <History size={16} className="text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Geçmiş
        </h3>
        {history && history.length > 0 && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            {history.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner size={14} />
        </div>
      ) : isError ? (
        <p className="text-xs text-red-400">Geçmiş yüklenemedi: {error instanceof Error ? error.message : "Bilinmeyen hata"}</p>
      ) : !history || history.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">Henüz kayıt yok.</p>
      ) : (
        <div className="space-y-0">
          {history.map((entry, idx) => (
            <div key={entry.id} className={idx === history.length - 1 ? "[&_.w-px]:hidden" : ""}>
              <HistoryItem entry={entry} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
