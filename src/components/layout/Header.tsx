"use client";

import { signOut, useSession } from "next-auth/react";
import { Calendar, Search, LogOut, Ticket } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import Swal from "sweetalert2";

const handleSignOut = async () => {
  const result = await Swal.fire({
    title: "Çıkış yapılıyor",
    text: "Oturumunuzu kapatmak istediğinize emin misiniz?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Evet, çıkış yap",
    cancelButtonText: "İptal",
    confirmButtonColor: "#6366F1",
    cancelButtonColor: "#6b7280",
    background: document.documentElement.classList.contains("dark") ? "#1f2937" : "#ffffff",
    color: document.documentElement.classList.contains("dark") ? "#f9fafb" : "#111827",
  });
  if (result.isConfirmed) {
    void signOut({ redirectTo: "/login" });
  }
};

export function Header() {
  const { data: session } = useSession();

  const today = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="flex h-14 md:h-16 items-center gap-3 md:gap-4 border-b border-gray-100 bg-white px-4 md:px-6 dark:border-gray-700/50 dark:bg-[hsl(var(--card))]">

      {/* Mobilde logo — masaüstünde sidebar'da olduğu için gizli */}
      <div className="flex md:hidden items-center gap-2 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6366F1]">
          <Ticket size={15} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">
          TicketSystem v.01
        </span>
      </div>

      {/* Masaüstünde tarih */}
      <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 shrink-0">
        <Calendar size={15} className="text-[#6366F1]" />
        <span className="font-medium">{today}</span>
      </div>

      {/* Masaüstünde search bar */}
      <div className="hidden md:flex mx-auto max-w-md flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
        <Search size={14} className="shrink-0 text-gray-400" />
        <input
          placeholder="Ara..."
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none dark:text-gray-300"
          readOnly
        />
      </div>

      {/* Sağ — her zaman görünür */}
      <div className="ml-auto flex items-center gap-1 shrink-0">
        <NotificationBell />
        <ThemeToggle />

        {/* Masaüstünde kullanıcı bilgisi + çıkış */}
        {session?.user && (
          <div className="hidden md:flex items-center gap-2 pl-2 ml-1 border-l border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6366F1]">
                <span className="text-xs font-bold text-white">
                  {session.user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                  {session.user.name}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight">
                  {session.user.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => void handleSignOut()}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
              title="Çıkış Yap"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}

        {/* Mobilde avatar + çıkış butonu */}
        {session?.user && (
          <div className="flex md:hidden items-center gap-1 pl-1 ml-1 border-l border-gray-100 dark:border-gray-700">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6366F1]">
              <span className="text-xs font-bold text-white">
                {session.user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => void handleSignOut()}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
              title="Çıkış Yap"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
