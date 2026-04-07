"use client";

import { useState, useEffect } from "react";
import { useTickets } from "@/hooks/useTickets";
import { TicketCard } from "./TicketCard";
import { TicketFilters } from "./TicketFilters";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import type { TicketFilters as Filters } from "@/types";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNewTicket } from "@/context/NewTicketContext";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

interface TicketListProps {
  onTicketClick?: (id: string) => void;
}

export function TicketList({ onTicketClick }: TicketListProps) {
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    pageSize: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data, isLoading, isError } = useTickets(filters);
  const { lastCreatedId, setLastCreatedId } = useNewTicket();

  // Animasyon bittikten sonra yeni ticket vurgusunu temizle
  useEffect(() => {
    if (!lastCreatedId) return;
    const timer = setTimeout(() => setLastCreatedId(null), 2000);
    return () => clearTimeout(timer);
  }, [lastCreatedId, setLastCreatedId]);

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <p className="text-red-700 dark:text-red-400">Talepler yüklenemedi</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TicketFilters filters={filters} onFiltersChange={setFilters} />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : data?.data.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white dark:border-gray-700 dark:bg-[hsl(var(--card))]">
          <Inbox size={36} className="text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Talep bulunamadı</p>
          <p className="text-xs text-gray-400">Yeni talep oluşturmak için &quot;+ Yeni Talep&quot; butonunu kullanın</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-gray-700/60 dark:bg-[hsl(var(--card))]">
          {/* Tablo header — yalnızca masaüstü */}
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_52px] gap-4 border-b border-gray-100 px-5 py-3 dark:border-gray-700">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Talep Adı</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Atanan</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Tarih</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Durum</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Öncelik</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">İşlem</span>
          </div>

          {/* Satırlar */}
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {data?.data.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={onTicketClick}
                isNew={ticket.id === lastCreatedId}
              />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(data.page - 1) * data.pageSize + 1}–
                {Math.min(data.page * data.pageSize, data.total)} / {data.total} sonuç
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
                  disabled={data.page <= 1}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronLeft size={14} />
                </Button>

                {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setFilters((prev) => ({ ...prev, page: n }))}
                    className={cn(
                      "h-8 w-8 rounded-lg text-xs font-medium transition-colors",
                      data.page === n
                        ? "bg-[#6366F1] text-white"
                        : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    )}
                  >
                    {n}
                  </button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
                  disabled={data.page >= data.totalPages}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
