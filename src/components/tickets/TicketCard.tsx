"use client";

import { Calendar, MoreHorizontal, ChevronRight } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import type { Ticket } from "@/types";

interface TicketCardProps {
  ticket: Ticket;
  onClick?: (id: string) => void;
  isNew?: boolean;
}

export function TicketCard({ ticket, onClick, isNew = false }: TicketCardProps) {
  const formattedDate = new Date(ticket.createdAt).toLocaleDateString("tr-TR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const animClass = isNew ? "animate-slide-in-fade-in" : "";

  return (
    <>
      {/* ── Mobil kart (< md) ── */}
      <div
        className={`md:hidden flex items-start gap-3 px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-800/40 cursor-pointer ${animClass} ${isNew ? "bg-[#EEF2FF]/60 dark:bg-[#312E81]/10" : ""}`}
        onClick={() => onClick?.(ticket.id)}
      >
        {/* Sol: öncelik renk çizgisi */}
        <div className={`mt-1 h-full w-1 self-stretch rounded-full shrink-0 ${
          ticket.priority === "Urgent" ? "bg-red-500" :
          ticket.priority === "High" ? "bg-amber-500" :
          ticket.priority === "Normal" ? "bg-blue-500" : "bg-gray-300"
        }`} />

        {/* İçerik */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
            {ticket.title}
          </p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            {ticket.category.name}
          </p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formattedDate}
            </span>
            {ticket.assignee ? (
              <span className="flex items-center gap-1">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#6366F1]/10 text-[8px] font-bold text-[#6366F1]">
                  {ticket.assignee.name.charAt(0).toUpperCase()}
                </span>
                <span className="truncate max-w-[100px]">{ticket.assignee.name}</span>
              </span>
            ) : (
              <span className="italic">Atanmadı</span>
            )}
          </div>
        </div>

        {/* Sağ ok */}
        <ChevronRight size={16} className="mt-1 shrink-0 text-gray-300 dark:text-gray-600" />
      </div>

      {/* ── Masaüstü satır (≥ md) ── */}
      <div
        className={`hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_52px] gap-4 items-center px-5 py-4 transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40 cursor-pointer group ${animClass} ${isNew ? "bg-[#EEF2FF]/60 dark:bg-[#312E81]/10" : ""}`}
        onClick={() => onClick?.(ticket.id)}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 transition-colors group-hover:text-[#6366F1] dark:text-gray-100 dark:group-hover:text-indigo-400">
            {ticket.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
            {ticket.category.name}
          </p>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          {ticket.assignee ? (
            <>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6366F1]/10 dark:bg-[#6366F1]/20">
                <span className="text-xs font-semibold text-[#6366F1] dark:text-indigo-400">
                  {ticket.assignee.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="truncate text-xs text-gray-700 dark:text-gray-300">
                {ticket.assignee.name}
              </span>
            </>
          ) : (
            <span className="text-xs italic text-gray-400">Atanmadı</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="shrink-0 text-gray-300 dark:text-gray-600" />
          <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
        </div>

        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />

        <div className="flex justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); onClick?.(ticket.id); }}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
