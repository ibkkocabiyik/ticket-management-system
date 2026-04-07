"use client";

import { Button } from "@/components/ui/Button";
import { useCategories } from "@/hooks/useCategories";
import { Search, SlidersHorizontal } from "lucide-react";
import type { TicketFilters as Filters } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/interfaces-select";

interface TicketFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function TicketFilters({ filters, onFiltersChange }: TicketFiltersProps) {
  const { data: categories } = useCategories();

  const handleReset = () => {
    onFiltersChange({
      page: 1,
      pageSize: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const currentSortValue = `${filters.sortBy ?? "createdAt"}_${filters.sortOrder ?? "desc"}`;

  const activeFilterCount = [
    filters.status,
    filters.priority,
    filters.categoryId,
    filters.search,
  ].filter(Boolean).length;

  const categoryOptions = categories?.map((c) => ({ value: c.id, label: c.name })) ?? [];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3 md:p-4 shadow-card dark:border-gray-700/60 dark:bg-[hsl(var(--card))]">

      {/* Arama */}
      <div className="relative w-full">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Talep ara..."
          className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/15 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-500"
          value={filters.search ?? ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value, page: 1 })
          }
        />
      </div>

      {/* Filtreler satırı */}
      <div className="mt-3 flex flex-wrap items-center gap-2">

        {/* Durum */}
        <Select
          value={filters.status ?? "all"}
          onValueChange={(val) =>
            onFiltersChange({
              ...filters,
              status: (val === "all" ? undefined : val) as Filters["status"],
              page: 1,
            })
          }
        >
          <SelectTrigger
            className={`h-9 min-w-[130px] rounded-xl text-xs font-medium transition-all bg-white dark:bg-gray-800 ${
              filters.status
                ? "border-[#6366F1]/60 bg-[#EEF2FF] text-[#6366F1] dark:bg-[#312E81]/30 dark:text-indigo-300 dark:border-[#6366F1]/40"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <SelectValue placeholder="Tüm Durumlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="Open">Açık</SelectItem>
            <SelectItem value="InProgress">İşlemde</SelectItem>
            <SelectItem value="Waiting">Beklemede</SelectItem>
            <SelectItem value="Resolved">Çözüldü</SelectItem>
            <SelectItem value="Closed">Kapatıldı</SelectItem>
          </SelectContent>
        </Select>

        {/* Öncelik */}
        <Select
          value={filters.priority ?? "all"}
          onValueChange={(val) =>
            onFiltersChange({
              ...filters,
              priority: (val === "all" ? undefined : val) as Filters["priority"],
              page: 1,
            })
          }
        >
          <SelectTrigger
            className={`h-9 min-w-[130px] rounded-xl text-xs font-medium transition-all bg-white dark:bg-gray-800 ${
              filters.priority
                ? "border-[#6366F1]/60 bg-[#EEF2FF] text-[#6366F1] dark:bg-[#312E81]/30 dark:text-indigo-300 dark:border-[#6366F1]/40"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <SelectValue placeholder="Tüm Öncelikler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Öncelikler</SelectItem>
            <SelectItem value="Low">Düşük</SelectItem>
            <SelectItem value="Normal">Normal</SelectItem>
            <SelectItem value="High">Yüksek</SelectItem>
            <SelectItem value="Urgent">Acil</SelectItem>
          </SelectContent>
        </Select>

        {/* Kategori */}
        <Select
          value={filters.categoryId ?? "all"}
          onValueChange={(val) =>
            onFiltersChange({
              ...filters,
              categoryId: val === "all" ? undefined : val,
              page: 1,
            })
          }
        >
          <SelectTrigger
            className={`h-9 min-w-[145px] rounded-xl text-xs font-medium transition-all bg-white dark:bg-gray-800 ${
              filters.categoryId
                ? "border-[#6366F1]/60 bg-[#EEF2FF] text-[#6366F1] dark:bg-[#312E81]/30 dark:text-indigo-300 dark:border-[#6366F1]/40"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <SelectValue placeholder="Tüm Kategoriler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {categoryOptions.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sıralama */}
        <Select
          value={currentSortValue}
          onValueChange={(val) => {
            const [field, order] = val.split("_");
            onFiltersChange({
              ...filters,
              sortBy: field as Filters["sortBy"],
              sortOrder: order as "asc" | "desc",
              page: 1,
            });
          }}
        >
          <SelectTrigger className="h-9 min-w-[170px] rounded-xl text-xs font-medium border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt_desc">Oluşturma (Yeni)</SelectItem>
            <SelectItem value="createdAt_asc">Oluşturma (Eski)</SelectItem>
            <SelectItem value="updatedAt_desc">Güncelleme (Yeni)</SelectItem>
            <SelectItem value="priority_desc">Öncelik (Yüksek)</SelectItem>
            <SelectItem value="priority_asc">Öncelik (Düşük)</SelectItem>
          </SelectContent>
        </Select>

        {/* Sıfırla */}
        {activeFilterCount > 0 && (
          <button
            onClick={handleReset}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-gray-700 dark:bg-transparent dark:text-gray-400 dark:hover:border-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            <SlidersHorizontal size={12} />
            Sıfırla
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#6366F1] text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
