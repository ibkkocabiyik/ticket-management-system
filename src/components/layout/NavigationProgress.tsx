"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { OrbitalLoader } from "@/components/ui/orbital-loader";

export function NavigationProgress() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  const handleClick = useCallback((e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest("a");
    if (!target) return;

    const href = target.getAttribute("href");
    if (!href) return;

    if (
      href.startsWith("http") ||
      href.startsWith("//") ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      target.hasAttribute("download") ||
      target.getAttribute("target") === "_blank"
    ) return;

    const targetPath = href.split("?")[0];
    if (targetPath === window.location.pathname) return;

    setLoading(true);
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [handleClick]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-[1px] dark:bg-black/20">
      <div className="flex items-center gap-4 rounded-2xl bg-white/90 px-6 py-5 shadow-xl backdrop-blur dark:bg-gray-900/90">
        <OrbitalLoader color="#6366F1" />
        <span className="text-sm font-semibold text-[#6366F1]">Yükleniyor…</span>
      </div>
    </div>
  );
}
