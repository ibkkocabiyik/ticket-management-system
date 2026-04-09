"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTicket } from "@/hooks/useTicket";
import { useUpdateTicket, useDeleteTicket } from "@/hooks/useTickets";
import { StatusBadge, PriorityBadge, Badge } from "@/components/ui/Badge";
import {
  Select as RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/interfaces-select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { CommentSection } from "./CommentSection";
import { TicketHistoryLog } from "./TicketHistoryLog";
import { AttachmentList } from "./AttachmentList";
import {
  Calendar,
  User,
  Tag,
  AlertCircle,
  ChevronLeft,
  Trash2,
  Edit,
  UserCheck,
  UserMinus,
  ArrowRightLeft,
  EyeOff,
} from "lucide-react";
import type { Status, Priority } from "@/types";
import Swal from "sweetalert2";

interface TicketDetailProps {
  ticketId: string;
  onClose?: () => void;
}

function getSwalTheme() {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  return {
    background: isDark ? "#1f2937" : "#ffffff",
    color: isDark ? "#f9fafb" : "#111827",
  };
}

export function TicketDetail({ ticketId, onClose }: TicketDetailProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { data: ticket, isLoading, isError } = useTicket(ticketId);
  const { mutateAsync: updateTicket, isPending: isUpdating } = useUpdateTicket(ticketId);
  const { mutateAsync: deleteTicket, isPending: isDeleting } = useDeleteTicket();
  const [pendingStatus, setPendingStatus] = useState<Status | null>(null);
  const [pendingPriority, setPendingPriority] = useState<Priority | null>(null);
  const [showTransferPanel, setShowTransferPanel] = useState(false);
  const [supportUsers, setSupportUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [transferring, setTransferring] = useState(false);

  const isAdmin = session?.user?.role === "Admin";
  const isSupport = session?.user?.role === "SupportTeam";
  const isAdminOrSupport = isAdmin || isSupport;

  const statusOptions: { value: Status; label: string }[] = [
    { value: "Open", label: "Açık" },
    { value: "InProgress", label: "İşlemde" },
    { value: "Waiting", label: "Beklemede" },
    { value: "Resolved", label: "Çözüldü" },
    { value: "Closed", label: "Kapatıldı" },
  ];

  const priorityOptions: { value: Priority; label: string }[] = [
    { value: "Low", label: "Düşük" },
    { value: "Normal", label: "Normal" },
    { value: "High", label: "Yüksek" },
    { value: "Urgent", label: "Acil" },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />
        <p className="text-red-700 dark:text-red-400">Talep yüklenemedi</p>
      </div>
    );
  }

  const isAssignedToMe = ticket.assigneeId === session?.user?.id;
  const isAssignedToOther = isSupport && !!ticket.assigneeId && !isAssignedToMe;
  const isUnassigned = !ticket.assigneeId;

  // SupportTeam: sadece kendi üstlendiği talebi düzenleyebilir
  const canEdit = isAdmin || (isSupport && isAssignedToMe);

  const handleStatusChange = async (newStatus: Status) => {
    setPendingStatus(newStatus);
    const label = statusOptions.find((o) => o.value === newStatus)?.label ?? newStatus;
    const { background, color } = getSwalTheme();
    const result = await Swal.fire({
      title: "Durum Değiştir",
      text: `Durum "${label}" olarak güncellensin mi?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#6366F1",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Evet, güncelle",
      cancelButtonText: "İptal",
      background,
      color,
    });
    if (result.isConfirmed) {
      try {
        await updateTicket({ status: newStatus });
      } catch (error) {
        void Swal.fire({ title: "Hata", text: error instanceof Error ? error.message : "Durum güncellenemedi", icon: "error", background, color });
      }
    }
    setPendingStatus(null);
  };

  const handlePriorityChange = async (newPriority: Priority) => {
    setPendingPriority(newPriority);
    const label = priorityOptions.find((o) => o.value === newPriority)?.label ?? newPriority;
    const { background, color } = getSwalTheme();
    const result = await Swal.fire({
      title: "Öncelik Değiştir",
      text: `Öncelik "${label}" olarak güncellensin mi?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#6366F1",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Evet, güncelle",
      cancelButtonText: "İptal",
      background,
      color,
    });
    if (result.isConfirmed) {
      try {
        await updateTicket({ priority: newPriority });
      } catch (error) {
        void Swal.fire({ title: "Hata", text: error instanceof Error ? error.message : "Öncelik güncellenemedi", icon: "error", background, color });
      }
    }
    setPendingPriority(null);
  };

  const handleDelete = async () => {
    const { background, color } = getSwalTheme();
    const result = await Swal.fire({
      title: "Talebi Sil",
      text: "Emin misiniz? Bu işlem talebi ve tüm yorumlarını kalıcı olarak siler.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Evet, sil",
      cancelButtonText: "İptal",
      background,
      color,
    });
    if (result.isConfirmed) {
      try {
        await deleteTicket(ticketId);
        if (onClose) onClose(); else router.push("/tickets");
      } catch (error) {
        void Swal.fire({ title: "Hata", text: error instanceof Error ? error.message : "Talep silinemedi", icon: "error", background, color });
      }
    }
  };

  const handleClaim = async () => {
    const { background, color } = getSwalTheme();
    const result = await Swal.fire({
      title: "Talebi Üstlen",
      text: "Bu talebin sahibi olarak atanacaksınız.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Evet, üstlen",
      cancelButtonText: "İptal",
      background,
      color,
    });
    if (result.isConfirmed) {
      try {
        await updateTicket({ assigneeId: session!.user.id });
        void Swal.fire({ title: "Üstlenildi!", text: "Bu talebin sahibi oldunuz.", icon: "success", timer: 1500, showConfirmButton: false, background, color });
      } catch (error) {
        void Swal.fire({ title: "Hata", text: error instanceof Error ? error.message : "İşlem gerçekleştirilemedi", icon: "error", background, color });
      }
    }
  };

  const handleRelease = async () => {
    const { background, color } = getSwalTheme();
    const result = await Swal.fire({
      title: "Talebi Bırak",
      text: "Bu talebin sahipliğini bırakmak istediğinizden emin misiniz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Evet, bırak",
      cancelButtonText: "İptal",
      background,
      color,
    });
    if (result.isConfirmed) {
      try {
        await updateTicket({ assigneeId: null });
        void Swal.fire({ title: "Bırakıldı", text: "Talep sahipliği bırakıldı.", icon: "success", timer: 1500, showConfirmButton: false, background, color });
      } catch (error) {
        void Swal.fire({ title: "Hata", text: error instanceof Error ? error.message : "İşlem gerçekleştirilemedi", icon: "error", background, color });
      }
    }
  };

  const handleOpenTransfer = async () => {
    if (supportUsers.length === 0) {
      const res = await fetch("/api/support-users");
      if (res.ok) {
        const data = await res.json() as { id: string; name: string; email: string }[];
        setSupportUsers(data);
      }
    }
    setShowTransferPanel(true);
  };

  const handleTransfer = async (toUserId: string, toUserName: string) => {
    const { background, color } = getSwalTheme();
    const result = await Swal.fire({
      title: "Talebi Devret",
      text: `Bu talep ${toUserName} kişisine devredilmek üzere onay isteği gönderilecek.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#6366F1",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Evet, gönder",
      cancelButtonText: "İptal",
      background,
      color,
    });
    if (!result.isConfirmed) return;

    setTransferring(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId }),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message ?? "Devir isteği gönderilemedi");
      }
      setShowTransferPanel(false);
      void Swal.fire({ title: "Gönderildi", text: `${toUserName} kullanıcısına onay isteği gönderildi.`, icon: "success", timer: 2000, showConfirmButton: false, background, color });
    } catch (err) {
      void Swal.fire({ title: "Hata", text: err instanceof Error ? err.message : "Bir hata oluştu", icon: "error", background, color });
    } finally {
      setTransferring(false);
    }
  };

  const formattedCreatedAt = new Date(ticket.createdAt).toLocaleDateString("tr-TR", {
    month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const formattedUpdatedAt = new Date(ticket.updatedAt).toLocaleDateString("tr-TR", {
    month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      {!onClose && (
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ChevronLeft size={16} />
          Taleplere Dön
        </Button>
      )}

      {/* Sadece görüntüleme uyarısı */}
      {isAssignedToOther && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-900/20">
          <EyeOff size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Bu talep <span className="font-semibold">{ticket.assignee?.name}</span> tarafından yönetiliyor. Yalnızca görüntüleyebilirsiniz.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {/* Main content */}
        <div className="order-2 md:order-1 space-y-4 md:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h1 className="text-base md:text-xl font-bold text-gray-900 dark:text-gray-100">
                {ticket.title}
              </h1>
              <div className="flex shrink-0 flex-wrap gap-1.5 justify-end">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
            </div>
            {ticket.description.trim().startsWith("<") ? (
              <div className="rich-content text-sm leading-relaxed text-gray-600 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: ticket.description }} />
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-400">{ticket.description}</p>
            )}
          </div>

          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Ekler ({ticket.attachments.length})</h2>
              <AttachmentList attachments={ticket.attachments} />
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 dark:border-gray-700 dark:bg-gray-800">
            <CommentSection ticketId={ticketId} readOnly={isAssignedToOther} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="order-1 md:order-2 space-y-3">
          {/* Yönet — Admin her zaman, Support yalnızca kendi talebiyse */}
          {canEdit && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Talebi Yönet</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Durum</label>
                  <RadixSelect value={pendingStatus ?? ticket.status} onValueChange={(v) => void handleStatusChange(v as Status)} disabled={isUpdating || pendingStatus !== null}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </RadixSelect>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Öncelik</label>
                  <RadixSelect value={pendingPriority ?? ticket.priority} onValueChange={(v) => void handlePriorityChange(v as Priority)} disabled={isUpdating || pendingPriority !== null}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{priorityOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </RadixSelect>
                </div>
              </div>
            </div>
          )}

          {/* Sahiplik — Support */}
          {isSupport && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Sahiplik</h2>

              {isAssignedToMe ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bu talebin şu an sahibi sizsiniz.</p>

                  {/* Devret paneli */}
                  {showTransferPanel ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Devredilecek kişiyi seçin:</p>
                      {supportUsers.length === 0 ? (
                        <p className="text-xs text-gray-400">Başka destek kullanıcısı bulunamadı.</p>
                      ) : (
                        <div className="space-y-1">
                          {supportUsers.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => void handleTransfer(u.id, u.name)}
                              disabled={transferring}
                              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-[#EEF2FF] dark:hover:bg-[#312E81]/20 transition-colors disabled:opacity-50"
                            >
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6366F1] text-[10px] font-bold text-white">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 dark:text-gray-200">{u.name}</p>
                                <p className="text-gray-400">{u.email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowTransferPanel(false)}>
                        İptal
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => void handleRelease()} isLoading={isUpdating}>
                        <UserMinus size={14} />
                        Bırak
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-2 text-[#6366F1] border-[#6366F1]/30 hover:bg-[#EEF2FF] dark:hover:bg-[#312E81]/20" onClick={() => void handleOpenTransfer()}>
                        <ArrowRightLeft size={14} />
                        Devret
                      </Button>
                    </div>
                  )}
                </div>
              ) : isUnassigned ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bu talebin henüz bir sahibi yok.</p>
                  <Button size="sm" className="w-full gap-2" onClick={() => void handleClaim()} isLoading={isUpdating}>
                    <UserCheck size={14} />
                    Talebi Üstlen
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Şu an sahibi: <span className="font-medium text-gray-700 dark:text-gray-300">{ticket.assignee?.name}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Talep Detayları */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Talep Detayları</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase text-gray-400 dark:text-gray-500"><User size={12} />Oluşturan</dt>
                <dd className="mt-1 text-gray-700 dark:text-gray-300">
                  {ticket.creator.name}
                  <span className="ml-1 text-xs text-gray-400">({ticket.creator.email})</span>
                </dd>
              </div>
              {ticket.assignee && (
                <div>
                  <dt className="flex items-center gap-1.5 text-xs font-medium uppercase text-gray-400 dark:text-gray-500"><User size={12} />Atanan</dt>
                  <dd className="mt-1 text-gray-700 dark:text-gray-300">{ticket.assignee.name}</dd>
                </div>
              )}
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase text-gray-400 dark:text-gray-500"><Tag size={12} />Kategori</dt>
                <dd className="mt-1"><Badge>{ticket.category.name}</Badge></dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase text-gray-400 dark:text-gray-500"><Calendar size={12} />Oluşturulma</dt>
                <dd className="mt-1 text-gray-700 dark:text-gray-300">{formattedCreatedAt}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase text-gray-400 dark:text-gray-500"><Edit size={12} />Son Güncelleme</dt>
                <dd className="mt-1 text-gray-700 dark:text-gray-300">{formattedUpdatedAt}</dd>
              </div>
            </dl>
          </div>

          {/* Geçmiş */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <TicketHistoryLog ticketId={ticketId} />
          </div>

          {/* Sil — sadece Admin */}
          {isAdmin && (
            <Button variant="danger" className="w-full gap-2" onClick={() => void handleDelete()} isLoading={isDeleting}>
              <Trash2 size={16} />
              Talebi Sil
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
