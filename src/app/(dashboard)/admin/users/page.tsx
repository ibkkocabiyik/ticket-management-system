"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, updateUserRole } from "@/lib/api/users";
import {
  Select as RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/interfaces-select";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import type { User, Role } from "@/types";
import { Users, Calendar, Shield } from "lucide-react";
import Swal from "sweetalert2";

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
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  return {
    background: isDark ? "#1f2937" : "#ffffff",
    color: isDark ? "#f9fafb" : "#111827",
  };
}

function UserRow({
  user,
  currentUserId,
}: {
  user: User;
  currentUserId: string;
}) {
  const queryClient = useQueryClient();
  const isSelf = user.id === currentUserId;

  const mutation = useMutation({
    mutationFn: (role: Role) => updateUserRole(user.id, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleRoleChange = async (newRole: Role) => {
    if (newRole === user.role) return;

    const { background, color } = getSwalTheme();
    const roleLabel = roleOptions.find((r) => r.value === newRole)?.label ?? newRole;
    const result = await Swal.fire({
      title: "Rol Değiştir",
      html: `<strong>${user.name}</strong> kullanıcısının rolü <strong>${roleLabel}</strong> olarak değiştirilsin mi?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Evet, değiştir",
      cancelButtonText: "İptal",
      background,
      color,
    });

    if (result.isConfirmed) {
      try {
        await mutation.mutateAsync(newRole);
        void Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Rol güncellendi",
          showConfirmButton: false,
          timer: 2000,
          background,
          color,
        });
      } catch (error) {
        void Swal.fire({
          title: "Hata",
          text: error instanceof Error ? error.message : "Rol güncellenemedi",
          icon: "error",
          background,
          color,
        });
      }
    }
  };

  const formattedDate = new Date(user.createdAt).toLocaleDateString("tr-TR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-4 last:border-0 dark:border-gray-700">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {user.name}
            {isSelf && (
              <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Siz
              </span>
            )}
          </p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {user.email}
          </p>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mx-4">
        <Calendar size={12} />
        {formattedDate}
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`hidden md:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[user.role]}`}
        >
          {user.role === "SupportTeam" ? "Destek Ekibi" : user.role === "EndUser" ? "Son Kullanıcı" : user.role}
        </span>

        <RadixSelect
          value={user.role}
          onValueChange={(v) => void handleRoleChange(v as Role)}
          disabled={mutation.isPending || isSelf}
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
    </div>
  );
}

function AdminUsersContent({ currentUserId }: { currentUserId: string }) {
  const { data: users, isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
          <Users size={20} className="text-purple-600 dark:text-purple-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Kullanıcı Yönetimi
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Kullanıcı hesaplarını ve rollerini yönetin
          </p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-3 min-w-0">
        {[
          {
            label: "Toplam Kullanıcı",
            value: users?.length ?? 0,
            icon: Users,
            color: "bg-blue-500",
          },
          {
            label: "Adminler",
            value: users?.filter((u) => u.role === "Admin").length ?? 0,
            icon: Shield,
            color: "bg-purple-500",
          },
          {
            label: "Destek Ekibi",
            value: users?.filter((u) => u.role === "SupportTeam").length ?? 0,
            icon: Users,
            color: "bg-green-500",
          },
        ].map((stat) => (
          <Card key={stat.label} className="flex items-center gap-2 md:gap-4 p-3 md:p-5 min-w-0">
            <div className={`rounded-xl p-2 md:p-3 shrink-0 ${stat.color}`}>
              <stat.icon size={16} className="text-white md:hidden" />
              <stat.icon size={20} className="text-white hidden md:block" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs md:text-sm text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stat.value}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Tüm Kullanıcılar
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {users?.length ?? 0} toplam
          </span>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-red-500">
            Kullanıcılar yüklenemedi
          </div>
        ) : (
          <div>
            {users?.map((user) => (
              <UserRow key={user.id} user={user} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (session?.user?.role !== "Admin") {
    router.push("/dashboard");
    return null;
  }

  return <AdminUsersContent currentUserId={session.user.id} />;
}
