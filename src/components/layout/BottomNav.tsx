"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Ticket, PlusCircle, Users, Tag } from "lucide-react";
import { useNewTicket } from "@/context/NewTicketContext";

interface BottomNavProps {
  role: string;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const { open: openNewTicket } = useNewTicket();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname.startsWith(href);

  const baseItem = "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors";
  const activeClass = "text-[#6366F1] dark:text-indigo-400";
  const inactiveClass = "text-gray-400 dark:text-gray-500";

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-100 bg-white dark:border-gray-700/50 dark:bg-[hsl(var(--card))] safe-area-pb">
      <div className="flex h-16 items-stretch">

        <Link href="/dashboard" className={`${baseItem} ${isActive("/dashboard") ? activeClass : inactiveClass}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-medium">Panel</span>
        </Link>

        <Link href="/tickets" className={`${baseItem} ${isActive("/tickets") ? activeClass : inactiveClass}`}>
          <Ticket size={20} />
          <span className="text-[10px] font-medium">Talepler</span>
        </Link>

        <button
          onClick={openNewTicket}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#6366F1] shadow-md transition-transform active:scale-95">
            <PlusCircle size={20} className="text-white" />
          </div>
        </button>

        {role === "Admin" && (
          <>
            <Link href="/admin/users" className={`${baseItem} ${isActive("/admin/users") ? activeClass : inactiveClass}`}>
              <Users size={20} />
              <span className="text-[10px] font-medium">Kullanıcılar</span>
            </Link>

            <Link href="/admin/categories" className={`${baseItem} ${isActive("/admin/categories") ? activeClass : inactiveClass}`}>
              <Tag size={20} />
              <span className="text-[10px] font-medium">Kategoriler</span>
            </Link>
          </>
        )}

      </div>
    </nav>
  );
}
