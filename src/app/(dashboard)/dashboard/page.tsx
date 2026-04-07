"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TicketDetail } from "@/components/tickets/TicketDetail";
import { SummaryTab } from "@/components/dashboard/SummaryTab";
import { useNewTicket } from "@/context/NewTicketContext";
import type { DashboardStats } from "@/types";
import {
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlusCircle,
  TrendingUp,
  FileText,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <Card className="p-3 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-1 text-2xl md:text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {value}
          </p>
        </div>
        <div className={`flex h-9 w-9 md:h-11 md:w-11 shrink-0 items-center justify-center rounded-xl md:rounded-2xl ${colorClass}`}>
          <Icon size={17} className="text-white md:hidden" />
          <Icon size={20} className="text-white hidden md:block" />
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"tickets" | "summary">("tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const { open: openNewTicket } = useNewTicket();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json() as Promise<DashboardStats>;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            İstatistikler
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Hoş geldiniz, {session?.user?.name}
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={() => setActiveTab("tickets")}
              className={`rounded-lg px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium transition-all duration-200 ${
                activeTab === "tickets"
                  ? "bg-[#6366F1] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Talepler
            </button>
            <button
              onClick={() => setActiveTab("summary")}
              className={`rounded-lg px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium transition-all duration-200 ${
                activeTab === "summary"
                  ? "bg-[#6366F1] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Özet
            </button>
          </div>
          {/* Mobilde Yeni Talep butonu — BottomNav'daki + butonu da var ama burada da olsun */}
          <Button className="gap-1.5 md:gap-2 text-xs md:text-sm px-3 md:px-4" onClick={openNewTicket}>
            <PlusCircle size={14} className="md:hidden" />
            <PlusCircle size={16} className="hidden md:block" />
            <span className="hidden sm:inline">Yeni Talep</span>
            <span className="sm:hidden">Yeni</span>
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="relative">
        {/* Talepler Tab */}
        <div
          className={`transition-all duration-300 ease-out ${
            activeTab === "tickets"
              ? "opacity-100 translate-y-0"
              : "pointer-events-none absolute inset-0 translate-y-3 opacity-0"
          }`}
        >
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner size={32} />
            </div>
          ) : stats ? (
            <div className="space-y-6">
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <StatCard label="Toplam Talep" value={stats.total} icon={Ticket} colorClass="bg-[#6366F1]" />
                <StatCard label="Açık" value={stats.open} icon={AlertCircle} colorClass="bg-blue-500" />
                <StatCard label="İşlemde" value={stats.inProgress} icon={Clock} colorClass="bg-amber-500" />
                <StatCard label="Beklemede" value={stats.waiting} icon={TrendingUp} colorClass="bg-orange-500" />
                <StatCard label="Çözüldü" value={stats.resolved} icon={CheckCircle} colorClass="bg-emerald-500" />
                <StatCard label="Kapatıldı" value={stats.closed} icon={XCircle} colorClass="bg-gray-400" />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
                    Hızlı İşlemler
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button onClick={openNewTicket} className="text-left">
                      <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 p-3 transition-colors hover:border-[#6366F1]/20 hover:bg-[#EEF2FF] dark:border-gray-700 dark:hover:border-[#6366F1]/30 dark:hover:bg-[#312E81]/20">
                        <PlusCircle size={20} className="text-[#6366F1]" />
                        <span className="text-sm font-medium text-gray-700 hover:text-[#6366F1] dark:text-gray-300">Yeni Talep Oluştur</span>
                      </div>
                    </button>
                    <Link href="/tickets?status=Open">
                      <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 p-3 transition-colors hover:border-[#6366F1]/20 hover:bg-[#EEF2FF] dark:border-gray-700 dark:hover:border-[#6366F1]/30 dark:hover:bg-[#312E81]/20">
                        <AlertCircle size={20} className="text-amber-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Açık Talepleri Gör</span>
                      </div>
                    </Link>
                    <Link href="/tickets?status=InProgress">
                      <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 p-3 transition-colors hover:border-[#6366F1]/20 hover:bg-[#EEF2FF] dark:border-gray-700 dark:hover:border-[#6366F1]/30 dark:hover:bg-[#312E81]/20">
                        <Clock size={20} className="text-orange-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">İşlemdekiler</span>
                      </div>
                    </Link>
                    <Link href="/tickets">
                      <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 p-3 transition-colors hover:border-[#6366F1]/20 hover:bg-[#EEF2FF] dark:border-gray-700 dark:hover:border-[#6366F1]/30 dark:hover:bg-[#312E81]/20">
                        <Ticket size={20} className="text-[#6366F1]" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tüm Talepler</span>
                      </div>
                    </Link>
                    {session?.user?.role === "Admin" && (
                      <Link href="/admin/templates">
                        <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 p-3 transition-colors hover:border-[#6366F1]/20 hover:bg-[#EEF2FF] dark:border-gray-700 dark:hover:border-[#6366F1]/30 dark:hover:bg-[#312E81]/20">
                          <FileText size={20} className="text-indigo-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Şablonlar</span>
                        </div>
                      </Link>
                    )}
                  </div>
                </Card>

                <Card>
                  <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
                    Talep Özeti
                  </h2>
                  <div className="space-y-3">
                    {[
                      { label: "Açık", count: stats.open, total: stats.total, color: "bg-blue-500" },
                      { label: "İşlemde", count: stats.inProgress, total: stats.total, color: "bg-amber-500" },
                      { label: "Beklemede", count: stats.waiting, total: stats.total, color: "bg-orange-500" },
                      { label: "Çözüldü", count: stats.resolved, total: stats.total, color: "bg-emerald-500" },
                      { label: "Kapatıldı", count: stats.closed, total: stats.total, color: "bg-gray-300" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{item.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                          <div
                            className={`h-1.5 rounded-full ${item.color} transition-all`}
                            style={{ width: item.total > 0 ? `${(item.count / item.total) * 100}%` : "0%" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          ) : null}
        </div>

        {/* Özet Tab */}
        <div
          className={`transition-all duration-300 ease-out ${
            activeTab === "summary"
              ? "opacity-100 translate-y-0"
              : "pointer-events-none absolute inset-0 translate-y-3 opacity-0"
          }`}
        >
          <SummaryTab />
        </div>
      </div>

      {/* Ticket Detay Modal */}
      <Modal
        isOpen={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        size="2xl"
      >
        {selectedTicketId && (
          <TicketDetail
            ticketId={selectedTicketId}
            onClose={() => setSelectedTicketId(null)}
          />
        )}
      </Modal>
    </div>
  );
}
