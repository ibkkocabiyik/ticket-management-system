import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F0F2FF] px-4 py-12 dark:bg-[#0f1117]">
      {/* Arka plan grid deseni */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-0"
        style={{
          top: "-20%",
          left: "-10%",
          width: "60%",
          height: "70%",
          background: "radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute z-0"
        style={{
          bottom: "-20%",
          right: "-10%",
          width: "50%",
          height: "60%",
          background: "radial-gradient(ellipse at center, rgba(139,92,246,0.10) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* İçerik */}
      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Logo */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6366F1]">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              <path d="M13 5v2" />
              <path d="M13 17v2" />
              <path d="M13 11v2" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-gray-800 dark:text-white/90">
            TicketSystem v.01
          </span>
        </div>

        {/* 404 */}
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#6366F1]">
          Hata Kodu 404
        </p>
        <h1
          className="mb-5"
          style={{
            fontSize: "clamp(4.5rem, 12vw, 8rem)",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            background: "linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </h1>

        <h2 className="mb-3 text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
          Sayfa bulunamadı
        </h2>
        <p
          className="mx-auto mb-10 max-w-sm text-gray-600 dark:text-white/50"
          style={{ fontSize: "0.9375rem", lineHeight: 1.7 }}
        >
          Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
          Ana sayfaya dönerek devam edebilirsiniz.
        </p>

        {/* Aksiyon butonları */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#4F46E5] sm:w-auto"
          >
            <Home size={16} />
            Panele Dön
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-700 transition-colors hover:border-[#6366F1]/30 hover:text-[#6366F1] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80 dark:hover:border-[#6366F1]/40 dark:hover:text-white sm:w-auto"
          >
            <ArrowLeft size={16} />
            Giriş Yap
          </Link>
        </div>

        <p className="mt-12 text-xs text-gray-400 dark:text-white/20">
          © 2026 TicketSystem. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
