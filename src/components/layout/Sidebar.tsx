"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Users,
  Tag,
  FileText,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNewTicket } from "@/context/NewTicketContext";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/tickets", label: "Tüm Talepler", icon: Ticket },
];

const adminNavItems: NavItem[] = [
  { href: "/admin/users", label: "Kullanıcılar", icon: Users, adminOnly: true },
  { href: "/admin/categories", label: "Kategoriler", icon: Tag, adminOnly: true },
  { href: "/admin/templates", label: "Şablonlar", icon: FileText, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const { open: openNewTicket } = useNewTicket();

  const roleLabel =
    role === "Admin" ? "Yönetici" : role === "SupportTeam" ? "Destek Ekibi" : "Kullanıcı";

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-100 bg-white dark:border-gray-700/50 dark:bg-[hsl(var(--card))]">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-100 px-5 dark:border-gray-700/50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6366F1]">
            <Ticket size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
            TicketSystem v.01
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Menü
        </p>
        <ul className="space-y-0.5">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                    isActive
                      ? "bg-[#EEF2FF] font-semibold text-[#6366F1] dark:bg-[#312E81]/30 dark:text-indigo-300"
                      : "font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  )}
                >
                  <Icon size={17} className={isActive ? "text-[#6366F1] dark:text-indigo-300" : "text-gray-400"} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <span className="h-5 w-1 rounded-full bg-[#6366F1] dark:bg-indigo-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {role === "Admin" && (
          <>
            <p className="mb-2 mt-5 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Yönetim
            </p>
            <ul className="space-y-0.5">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                        isActive
                          ? "bg-[#EEF2FF] font-semibold text-[#6366F1] dark:bg-[#312E81]/30 dark:text-indigo-300"
                          : "font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                      )}
                    >
                      <Icon size={17} className={isActive ? "text-[#6366F1] dark:text-indigo-300" : "text-gray-400"} />
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <span className="h-5 w-1 rounded-full bg-[#6366F1] dark:bg-indigo-400" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </nav>

      {/* Yeni Talep butonu */}
      <div className="px-3 pb-3">
        <button
          onClick={openNewTicket}
          className="flex w-full items-center gap-3 rounded-xl bg-[#6366F1] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#4F46E5] active:scale-[0.98]"
        >
          <PlusCircle size={17} />
          Yeni Talep
        </button>
      </div>

      {/* User card */}
      {session?.user && (
        <div className="border-t border-gray-100 p-4 dark:border-gray-700/50">
          <div className="flex items-center gap-3 rounded-xl bg-[#EEF2FF] p-3 dark:bg-[#312E81]/20">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6366F1]">
              <span className="text-xs font-bold text-white">
                {session.user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-900 dark:text-gray-100">
                {session.user.name}
              </p>
              <p className="truncate text-[10px] font-medium text-[#6366F1] dark:text-indigo-400">
                {roleLabel}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
