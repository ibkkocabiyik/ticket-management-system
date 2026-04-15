"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTickets, useBulkTicketAction } from "@/hooks/useTickets";
import { TicketCard } from "./TicketCard";
import { TicketFilters } from "./TicketFilters";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import type { TicketFilters as Filters, Status, Priority } from "@/types";
import { ChevronLeft, ChevronRight, Inbox, Trash2, CheckSquare, X } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNewTicket } from "@/context/NewTicketContext";
import Swal from "sweetalert2";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

function getSwalTheme() {
  const isDark = document.documentElement.classList.contains("dark");
  return isDark
    ? { background: "#1e2130", color: "#e5e7eb" }
    : { background: "#ffffff", color: "#111827" };
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "Open", label: "Açık" },
  { value: "InProgress", label: "Devam Ediyor" },
  { value: "Waiting", label: "Beklemede" },
  { value: "Resolved", label: "Çözüldü" },
  { value: "Closed", label: "Kapatıldı" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "Low", label: "Düşük" },
  { value: "Normal", label: "Normal" },
  { value: "High", label: "Yüksek" },
  { value: "Urgent", label: "Acil" },
];

interface TicketListProps {
  onTicketClick?: (id: string) => void;
}

export function TicketList({ onTicketClick }: TicketListProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "Admin";

  const isSupport = session?.user?.role === "SupportTeam";

  const [filters, setFilters] = useState<Filters>({
    page: 1,
    pageSize: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showAll, setShowAll] = useState(true);

  const effectiveFilters: Filters = {
    ...filters,
    assignedToMe: isSupport && !showAll ? true : undefined,
  };

  const { data, isLoading, isError } = useTickets(effectiveFilters);
  const { lastCreatedId, setLastCreatedId } = useNewTicket();
  const { mutateAsync: bulkAction, isPending } = useBulkTicketAction();

  useEffect(() => {
    if (!lastCreatedId) return;
    const timer = setTimeout(() => setLastCreatedId(null), 2000);
    return () => clearTimeout(timer);
  }, [lastCreatedId, setLastCreatedId]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [filters.page]);

  function handleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function handleSelectAll(checked: boolean) {
    if (checked && data) {
      setSelectedIds(new Set(data.data.map((t) => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  async function handleBulkStatus(value: Status) {
    const { background, color } = getSwalTheme();
    const label = STATUS_OPTIONS.find((s) => s.value === value)?.label ?? value;
    const result = await Swal.fire({
      title: `${selectedIds.size} talep güncelleniyor`,
      text: `Durum "${label}" olarak değiştirilsin mi?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Evet, değiştir",
      cancelButtonText: "İptal",
      confirmButtonColor: "#6366F1",
      background,
      color,
    });
    if (!result.isConfirmed) return;
    await bulkAction({ ids: Array.from(selectedIds), action: "status", value });
    exitSelectMode();
    void Swal.fire({ toast: true, position: "top-end", icon: "success", title: `${selectedIds.size} talep güncellendi`, showConfirmButton: false, timer: 2000, background, color });
  }

  async function handleBulkPriority(value: Priority) {
    const { background, color } = getSwalTheme();
    const label = PRIORITY_OPTIONS.find((p) => p.value === value)?.label ?? value;
    const result = await Swal.fire({
      title: `${selectedIds.size} talep güncelleniyor`,
      text: `Öncelik "${label}" olarak değiştirilsin mi?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Evet, değiştir",
      cancelButtonText: "İptal",
      confirmButtonColor: "#6366F1",
      background,
      color,
    });
    if (!result.isConfirmed) return;
    await bulkAction({ ids: Array.from(selectedIds), action: "priority", value });
    exitSelectMode();
    void Swal.fire({ toast: true, position: "top-end", icon: "success", title: `${selectedIds.size} talep güncellendi`, showConfirmButton: false, timer: 2000, background, color });
  }

  async function handleBulkDelete() {
    const { background, color } = getSwalTheme();
    const result = await Swal.fire({
      title: `${selectedIds.size} talep silinecek`,
      text: "Bu işlem geri alınamaz. Devam edilsin mi?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Evet, sil",
      cancelButtonText: "İptal",
      confirmButtonColor: "#EF4444",
      background,
      color,
    });
    if (!result.isConfirmed) return;
    const count = selectedIds.size;
    await bulkAction({ ids: Array.from(selectedIds), action: "delete" });
    exitSelectMode();
    void Swal.fire({ toast: true, position: "top-end", icon: "success", title: `${count} talep silindi`, showConfirmButton: false, timer: 2000, background, color });
  }

  const allSelected = data ? data.data.length > 0 && data.data.every((t) => selectedIds.has(t.id)) : false;
  const someSelected = selectedIds.size > 0;

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <p className="text-red-700 dark:text-red-400">Talepler yüklenemedi</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TicketFilters
        filters={filters}
        onFiltersChange={setFilters}
        isSupport={isSupport}
        showAll={showAll}
        onShowAllChange={setShowAll}
      />

      {/* Admin — çoklu seçim */}
      {isAdmin && (
        <div className="flex items-center gap-2 flex-wrap">
          {!selectMode ? (
            <button
              onClick={() => setSelectMode(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-indigo-300 hover:text-[#6366F1] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
            >
              <CheckSquare size={13} />
              Çoklu Seçim
            </button>
          ) : (
            <div className="flex w-full items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 dark:border-indigo-800 dark:bg-indigo-950/40 flex-wrap">
              <span className="text-sm font-semibold text-[#6366F1] dark:text-indigo-400 shrink-0">
                {someSelected ? `${selectedIds.size} seçili` : "Seçim yapın"}
              </span>

              {someSelected && (
                <>
                  {/* Durum değiştir dropdown */}
                  <div className="relative group">
                    <button
                      disabled={isPending}
                      className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:border-indigo-400 dark:border-indigo-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50"
                    >
                      Durum Değiştir ▾
                    </button>
                    <div className="absolute left-0 top-full z-20 mt-1 hidden w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-lg group-hover:block dark:border-gray-700 dark:bg-gray-800">
                      {STATUS_OPTIONS.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => void handleBulkStatus(s.value)}
                          className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-indigo-50 hover:text-[#6366F1] dark:text-gray-300 dark:hover:bg-indigo-900/30"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Öncelik değiştir dropdown */}
                  <div className="relative group">
                    <button
                      disabled={isPending}
                      className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:border-indigo-400 dark:border-indigo-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50"
                    >
                      Öncelik Değiştir ▾
                    </button>
                    <div className="absolute left-0 top-full z-20 mt-1 hidden w-36 rounded-xl border border-gray-100 bg-white py-1 shadow-lg group-hover:block dark:border-gray-700 dark:bg-gray-800">
                      {PRIORITY_OPTIONS.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => void handleBulkPriority(p.value)}
                          className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-indigo-50 hover:text-[#6366F1] dark:text-gray-300 dark:hover:bg-indigo-900/30"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sil */}
                  <button
                    disabled={isPending}
                    onClick={() => void handleBulkDelete()}
                    className="flex items-center gap-1.5 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    Sil
                  </button>
                </>
              )}

              <button
                onClick={exitSelectMode}
                className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={13} />
                İptal
              </button>
            </div>
          )}
        </div>
      )}

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
          {/* Tablo header */}
          <div className={cn(
            "hidden md:grid gap-4 border-b border-gray-100 px-5 py-3 dark:border-gray-700",
            selectMode
              ? "grid-cols-[32px_2fr_1.5fr_1fr_1fr_1fr_52px]"
              : "grid-cols-[2fr_1.5fr_1fr_1fr_1fr_52px]"
          )}>
            {selectMode && (
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-[#6366F1] cursor-pointer"
              />
            )}
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Talep Adı</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Atanan</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Tarih</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Durum</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Öncelik</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">İşlem</span>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {data?.data.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={selectMode ? undefined : onTicketClick}
                isNew={ticket.id === lastCreatedId}
                selectable={selectMode}
                selected={selectedIds.has(ticket.id)}
                onSelect={handleSelect}
              />
            ))}
          </div>

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
