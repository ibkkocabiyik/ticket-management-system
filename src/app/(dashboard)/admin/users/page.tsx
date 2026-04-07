"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, createUser, updateUserRole, updateUserName, deleteUser, bulkDeleteUsers } from "@/lib/api/users";
import {
  Select as RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/interfaces-select";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import type { User, Role } from "@/types";
import { Users, Calendar, Shield, CheckSquare, X, Trash2, UserPlus, Pencil, Check } from "lucide-react";
import Swal from "sweetalert2";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const roleOptions: { value: Role; label: string }[] = [
  { value: "EndUser", label: "Son Kullanıcı" },
  { value: "SupportTeam", label: "Destek Ekibi" },
  { value: "Admin", label: "Admin" },
];

const roleColors: Record<Role, string> = {
  Admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  SupportTeam: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  EndUser: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
};

function getSwalTheme() {
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  return { background: isDark ? "#1f2937" : "#ffffff", color: isDark ? "#f9fafb" : "#111827" };
}

const createUserSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  role: z.enum(["Admin", "SupportTeam", "EndUser"]),
});
type CreateUserInput = z.infer<typeof createUserSchema>;

function UserRow({
  user,
  currentUserId,
  selectable,
  selected,
  onSelect,
}: {
  user: User;
  currentUserId: string;
  selectable: boolean;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const isSelf = user.id === currentUserId;
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user.name);

  const roleMutation = useMutation({
    mutationFn: (role: Role) => updateUserRole(user.id, role),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const nameMutation = useMutation({
    mutationFn: (name: string) => updateUserName(user.id, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingName(false);
    },
  });

  const handleRoleChange = async (newRole: Role) => {
    if (newRole === user.role) return;
    const { background, color } = getSwalTheme();
    const label = roleOptions.find((r) => r.value === newRole)?.label ?? newRole;
    const result = await Swal.fire({
      title: "Rol Değiştir",
      html: `<strong>${user.name}</strong> kullanıcısının rolü <strong>${label}</strong> olarak değiştirilsin mi?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#6366F1",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Evet, değiştir",
      cancelButtonText: "İptal",
      background, color,
    });
    if (!result.isConfirmed) return;
    try {
      await roleMutation.mutateAsync(newRole);
      void Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Rol güncellendi", showConfirmButton: false, timer: 2000, background, color });
    } catch (e) {
      void Swal.fire({ title: "Hata", text: e instanceof Error ? e.message : "Rol güncellenemedi", icon: "error", background, color });
    }
  };

  const handleNameSave = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === user.name) { setEditingName(false); return; }
    const { background, color } = getSwalTheme();
    try {
      await nameMutation.mutateAsync(trimmed);
      void Swal.fire({ toast: true, position: "top-end", icon: "success", title: "İsim güncellendi", showConfirmButton: false, timer: 2000, background, color });
    } catch (e) {
      void Swal.fire({ title: "Hata", text: e instanceof Error ? e.message : "İsim güncellenemedi", icon: "error", background, color });
    }
  };

  const formattedDate = new Date(user.createdAt).toLocaleDateString("tr-TR", { month: "short", day: "numeric", year: "numeric" });
  const selectedClass = selected ? "bg-indigo-50/70 dark:bg-indigo-900/20" : "";

  return (
    <div
      className={`flex items-center border-b border-gray-100 py-3.5 last:border-0 dark:border-gray-700 px-1 transition-colors ${selectedClass} ${selectable ? "cursor-pointer" : ""}`}
      onClick={() => selectable && onSelect(user.id, !selected)}
    >
      {/* Checkbox */}
      {selectable && (
        <div className="mr-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(user.id, e.target.checked)}
            disabled={isSelf}
            className="h-4 w-4 rounded border-gray-300 accent-[#6366F1] cursor-pointer disabled:opacity-40"
          />
        </div>
      )}

      {/* Avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6366F1]/10 dark:bg-[#6366F1]/20 mr-3">
        <span className="text-sm font-semibold text-[#6366F1] dark:text-indigo-400">
          {user.name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* İsim + email */}
      <div className="flex-1 min-w-0">
        {editingName ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleNameSave(); if (e.key === "Escape") { setEditingName(false); setNameValue(user.name); } }}
              className="w-full rounded-lg border border-[#6366F1] bg-white px-2 py-1 text-sm text-gray-900 outline-none dark:bg-gray-800 dark:text-gray-100"
            />
            <button onClick={() => void handleNameSave()} disabled={nameMutation.isPending} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6366F1] text-white hover:bg-indigo-600 disabled:opacity-50">
              <Check size={13} />
            </button>
            <button onClick={() => { setEditingName(false); setNameValue(user.name); }} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 dark:border-gray-600">
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 group/name">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {user.name}
              {isSelf && <span className="ml-1.5 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Siz</span>}
            </p>
            {!selectable && (
              <button
                onClick={(e) => { e.stopPropagation(); setEditingName(true); }}
                className="hidden group-hover/name:flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:text-[#6366F1]"
              >
                <Pencil size={11} />
              </button>
            )}
          </div>
        )}
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
      </div>

      {/* Tarih */}
      <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mx-3 shrink-0">
        <Calendar size={11} />
        {formattedDate}
      </div>

      {/* Rol dropdown */}
      {!selectable && (
        <div onClick={(e) => e.stopPropagation()}>
          <RadixSelect
            value={user.role}
            onValueChange={(v) => void handleRoleChange(v as Role)}
            disabled={roleMutation.isPending || isSelf}
          >
            <SelectTrigger className="w-28 sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </RadixSelect>
        </div>
      )}

      {/* Seçim modunda rol badge */}
      {selectable && (
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[user.role]}`}>
          {user.role === "SupportTeam" ? "Destek Ekibi" : user.role === "EndUser" ? "Son Kullanıcı" : "Admin"}
        </span>
      )}
    </div>
  );
}

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "EndUser" },
  });

  const onSubmit = async (data: CreateUserInput) => {
    const { background, color } = getSwalTheme();
    try {
      await createUser(data);
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
      void Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Kullanıcı oluşturuldu", showConfirmButton: false, timer: 2000, background, color });
    } catch (e) {
      void Swal.fire({ title: "Hata", text: e instanceof Error ? e.message : "Kullanıcı oluşturulamadı", icon: "error", background, color });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-1">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Yeni Kullanıcı Oluştur</h2>
      <Input label="Ad Soyad" placeholder="ör. Ahmet Yılmaz" error={errors.name?.message} {...register("name")} />
      <Input label="E-posta" type="email" placeholder="ornek@mail.com" error={errors.email?.message} {...register("email")} />
      <Input label="Şifre" type="password" placeholder="En az 6 karakter" error={errors.password?.message} {...register("password")} />
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <RadixSelect value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {roleOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </RadixSelect>
          )}
        />
      </div>
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>İptal</Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">Oluştur</Button>
      </div>
    </form>
  );
}

function AdminUsersContent({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();
  const { data: users, isLoading, isError } = useQuery({ queryKey: ["users"], queryFn: getUsers });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteUsers(ids),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const singleDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  function handleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function handleSelectAll(checked: boolean) {
    if (checked && users) {
      setSelectedIds(new Set(users.filter((u) => u.id !== currentUserId).map((u) => u.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  async function handleBulkDelete() {
    const { background, color } = getSwalTheme();
    const result = await Swal.fire({
      title: `${selectedIds.size} kullanıcı silinecek`,
      text: "Bu işlem geri alınamaz. Devam edilsin mi?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Evet, sil",
      cancelButtonText: "İptal",
      confirmButtonColor: "#EF4444",
      background, color,
    });
    if (!result.isConfirmed) return;
    const count = selectedIds.size;
    await bulkDeleteMutation.mutateAsync(Array.from(selectedIds));
    exitSelectMode();
    void Swal.fire({ toast: true, position: "top-end", icon: "success", title: `${count} kullanıcı silindi`, showConfirmButton: false, timer: 2000, background, color });
  }

  async function handleSingleDelete(user: User) {
    const { background, color } = getSwalTheme();
    const result = await Swal.fire({
      title: "Kullanıcıyı Sil",
      html: `<strong>${user.name}</strong> silinsin mi?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Evet, sil",
      cancelButtonText: "İptal",
      confirmButtonColor: "#EF4444",
      background, color,
    });
    if (!result.isConfirmed) return;
    await singleDeleteMutation.mutateAsync(user.id);
    void Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Kullanıcı silindi", showConfirmButton: false, timer: 2000, background, color });
  }

  const allSelectable = users?.filter((u) => u.id !== currentUserId) ?? [];
  const allSelected = allSelectable.length > 0 && allSelectable.every((u) => selectedIds.has(u.id));
  const someSelected = selectedIds.size > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
            <Users size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Kullanıcı Yönetimi</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Kullanıcı hesaplarını ve rollerini yönetin</p>
          </div>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="gap-1.5 shrink-0">
          <UserPlus size={15} />
          <span className="hidden sm:inline">Yeni Kullanıcı</span>
          <span className="sm:hidden">Ekle</span>
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-3">
        {[
          { label: "Toplam", value: users?.length ?? 0, icon: Users, color: "bg-blue-500" },
          { label: "Admin", value: users?.filter((u) => u.role === "Admin").length ?? 0, icon: Shield, color: "bg-purple-500" },
          { label: "Destek Ekibi", value: users?.filter((u) => u.role === "SupportTeam").length ?? 0, icon: Users, color: "bg-green-500" },
        ].map((stat) => (
          <Card key={stat.label} className="flex items-center gap-2 md:gap-4 p-3 md:p-5 min-w-0">
            <div className={`rounded-xl p-2 md:p-3 shrink-0 ${stat.color}`}>
              <stat.icon size={16} className="text-white md:hidden" />
              <stat.icon size={20} className="text-white hidden md:block" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs md:text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Tüm Kullanıcılar</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">{users?.length ?? 0} toplam</span>
        </div>

        {/* Çoklu seçim araç çubuğu */}
        <div className="mb-3 flex items-center gap-2 flex-wrap">
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
                <button
                  disabled={bulkDeleteMutation.isPending}
                  onClick={() => void handleBulkDelete()}
                  className="flex items-center gap-1.5 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  Sil
                </button>
              )}
              <button onClick={exitSelectMode} className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={13} />
                İptal
              </button>
            </div>
          )}
        </div>

        {/* Tümünü seç header */}
        {selectMode && !isLoading && (
          <div className="flex items-center gap-3 border-b border-gray-100 pb-2 mb-1 px-1 dark:border-gray-700">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-[#6366F1] cursor-pointer"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">Tümünü seç</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex h-32 items-center justify-center"><Spinner /></div>
        ) : isError ? (
          <div className="py-8 text-center text-red-500">Kullanıcılar yüklenemedi</div>
        ) : (
          <div>
            {users?.map((user) => (
              <div key={user.id} className="group/row relative">
                <UserRow
                  user={user}
                  currentUserId={currentUserId}
                  selectable={selectMode}
                  selected={selectedIds.has(user.id)}
                  onSelect={handleSelect}
                />
                {!selectMode && user.id !== currentUserId && (
                  <button
                    onClick={() => void handleSingleDelete(user)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover/row:flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    title="Kullanıcıyı sil"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} size="sm">
        <CreateUserModal onClose={() => setCreateModalOpen(false)} />
      </Modal>
    </div>
  );
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") return <div className="flex h-64 items-center justify-center"><Spinner size={32} /></div>;
  if (session?.user?.role !== "Admin") { router.push("/dashboard"); return null; }

  return <AdminUsersContent currentUserId={session.user.id} />;
}
