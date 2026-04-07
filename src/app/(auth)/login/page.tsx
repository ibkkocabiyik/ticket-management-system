import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginThemeToggle } from "@/components/auth/LoginThemeToggle";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#F0F2FF] dark:bg-[#0f1117]">

      {/* ── Tema toggle ── */}
      <div className="absolute right-4 top-4 z-20">
        <LoginThemeToggle />
      </div>

      {/* ── Arka plan grid deseni ── */}
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

      {/* ── Işıma (glow) — dark'ta belirgin, light'ta hafif ── */}
      <div
        aria-hidden
        className="absolute z-0 pointer-events-none"
        style={{
          top: "-20%", left: "-10%",
          width: "60%", height: "70%",
          background: "radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        aria-hidden
        className="absolute z-0 pointer-events-none"
        style={{
          bottom: "-20%", right: "-10%",
          width: "50%", height: "60%",
          background: "radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* ── Sol panel — masaüstünde görünür ── */}
      <div className="relative z-10 hidden lg:flex lg:w-1/2 flex-col justify-between p-14">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6366F1]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
              <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-gray-800 dark:text-white/90">TicketSystem v.01</span>
        </div>

        {/* Orta içerik */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#6366F1]">
            Destek Yönetimi
          </p>
          <h1
            className="text-gray-900 dark:text-white"
            style={{
              fontSize: "clamp(2rem, 3.5vw, 3rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: "1.5rem",
            }}
          >
            Taleplerinizi<br />
            <span style={{
              background: "linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              tek merkezden
            </span><br />
            yönetin.
          </h1>
          <p className="text-gray-600 dark:text-white/45" style={{ fontSize: "0.9375rem", lineHeight: 1.7, maxWidth: 380 }}>
            Destek ekibinizle koordineli çalışın, talepleri takip edin,
            önceliklendirin ve müşterilerinize daha hızlı yanıt verin.
          </p>

          {/* Özellik listesi */}
          <div className="mt-10 flex flex-col gap-3.5">
            {[
              { icon: "⚡", text: "Gerçek zamanlı bildirimler" },
              { icon: "🔒", text: "Rol tabanlı yetkilendirme" },
              { icon: "📎", text: "Dosya ekleri ve zengin metin" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-sm dark:border-indigo-500/20 dark:bg-indigo-500/10">
                  {item.icon}
                </div>
                <span className="text-sm text-gray-600 dark:text-white/60">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alt kısım */}
        <p className="text-xs text-gray-400 dark:text-white/20">
          © 2026 TicketSystem. Tüm hakları saklıdır.
        </p>
      </div>

      {/* ── Dikey ayırıcı çizgi ── */}
      <div
        aria-hidden
        className="hidden lg:block relative z-10 w-px"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(99,102,241,0.25) 30%, rgba(99,102,241,0.25) 70%, transparent)",
        }}
      />

      {/* ── Sağ panel — form ── */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <LoginForm />
      </div>

    </div>
  );
}
