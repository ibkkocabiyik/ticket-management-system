"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Ticket, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { loginSchema, type LoginInput } from "@/lib/validations/user";
import Swal from "sweetalert2";

const swalTheme = () => ({
  background: document.documentElement.classList.contains("dark") ? "#1f2937" : "#ffffff",
  color: document.documentElement.classList.contains("dark") ? "#f9fafb" : "#111827",
});

function TestHesapSatiri({
  rol,
  email,
  sifre,
  onFill,
}: {
  rol: string;
  email: string;
  sifre: string;
  onFill: (email: string, sifre: string) => void;
}) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedSifre, setCopiedSifre] = useState(false);

  const copy = (text: string, type: "email" | "sifre") => {
    void navigator.clipboard.writeText(text);
    if (type === "email") {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1500);
    } else {
      setCopiedSifre(true);
      setTimeout(() => setCopiedSifre(false), 1500);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-600/40">
      <button
        type="button"
        onClick={() => onFill(email, sifre)}
        className="flex-1 text-left"
        title="Forma doldur"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{rol}</span>
        <p className="text-xs leading-tight text-gray-600 dark:text-gray-300">{email}</p>
        <p className="text-xs leading-tight text-gray-400 dark:text-gray-500">{sifre}</p>
      </button>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => copy(email, "email")}
          title="E-postayı kopyala"
          className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-200"
        >
          {copiedEmail ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
        </button>
        <button
          type="button"
          onClick={() => copy(sifre, "sifre")}
          title="Şifreyi kopyala"
          className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-200"
        >
          {copiedSifre ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
        </button>
      </div>
    </div>
  );
}

const HESAPLAR = [
  { rol: "Admin", email: "admin@hostpanel.com.tr", sifre: "admin123" },
  { rol: "Destek", email: "teknik1@hostpanel.com.tr", sifre: "support123" },
  { rol: "Kullanıcı", email: "info@digitalmedya.com.tr", sifre: "user123" },
];

function TestHesaplar({ setValue }: { setValue: (field: "email" | "password", value: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-gray-500 dark:hover:text-gray-300"
      >
        <span
          className="inline-block transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
        {open ? "Test hesaplarını gizle" : "Test hesaplarını göster"}
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 0.3s ease",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div className="mt-2 space-y-1 rounded-xl bg-gray-50 p-2 dark:bg-gray-700/50">
            {HESAPLAR.map((hesap, i) => (
              <div
                key={hesap.rol}
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? "translateY(0)" : "translateY(-6px)",
                  transition: `opacity 0.25s ease ${i * 60}ms, transform 0.25s ease ${i * 60}ms`,
                }}
              >
                <TestHesapSatiri
                  {...hesap}
                  onFill={(e, s) => { setValue("email", e); setValue("password", s); }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        await Swal.fire({
          icon: "error",
          title: "Giriş başarısız",
          text: "E-posta adresi veya şifre hatalı.",
          confirmButtonText: "Tekrar Dene",
          confirmButtonColor: "#6366F1",
          ...swalTheme(),
        });
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Bağlantı hatası",
        text: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
        confirmButtonText: "Tamam",
        confirmButtonColor: "#6366F1",
        ...swalTheme(),
      });
    }
  };

  return (
    <div className="w-full max-w-sm">

      {/* Başlık — mobilde logo göster, masaüstünde sol panelde var */}
      <div className="mb-7 text-center lg:hidden">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#6366F1] shadow-lg shadow-[#6366F1]/30">
          <Ticket size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">TicketSystem v.01</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/40">Hoş geldiniz</p>
      </div>

      <div className="mb-6 hidden lg:block">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Giriş Yap</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/40">Hesabınıza erişmek için bilgilerinizi girin</p>
      </div>

      {/* Kart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-xl shadow-gray-200/60 dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none dark:backdrop-blur-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* E-posta */}
          <div>
            <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">
              E-posta
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/25" />
              <input
                type="email"
                placeholder="siz@ornek.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder-white/25 dark:focus:border-[#6366F1]/60 dark:focus:ring-[#6366F1]/20"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Şifre */}
          <div>
            <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">
              Şifre
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/25" />
              <input
                type="password"
                placeholder="Şifrenizi girin"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder-white/25 dark:focus:border-[#6366F1]/60 dark:focus:ring-[#6366F1]/20"
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full gap-2"
            isLoading={isSubmitting}
            size="lg"
          >
            Giriş Yap
            {!isSubmitting && <ArrowRight size={16} />}
          </Button>
        </form>

        {/* OR Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.08]" />
          <span className="text-[0.6875rem] font-semibold tracking-[0.08em] text-gray-400 dark:text-white/25">VEYA</span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.08]" />
        </div>

        {/* Google butonu */}
        <button
          type="button"
          onClick={() => void Swal.fire({
            title: "Çok yakında!  ",
            text: "Google ile giriş özelliği üzerinde çalışıyoruz. Yakında kullanıma açılacak!",
            imageUrl: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%234285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/%3E%3Cpath fill='%2334A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/%3E%3Cpath fill='%23FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/%3E%3Cpath fill='%23EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/%3E%3C/svg%3E`,
            imageWidth: 48,
            imageHeight: 48,
            imageAlt: "Google",
            confirmButtonText: "Tamam",
            confirmButtonColor: "#6366F1",
            background: document.documentElement.classList.contains("dark") ? "#1f2937" : "#ffffff",
            color: document.documentElement.classList.contains("dark") ? "#f9fafb" : "#111827",
          })}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70 dark:hover:bg-white/10"
        >
          <svg width="15" height="15" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google ile giriş yap
        </button>

        {/* Alt link */}
        <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
          Hesabınız yok mu?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#6366F1] hover:text-[#4F46E5] dark:text-indigo-400"
          >
            Ücretsiz kaydolun
          </Link>
        </p>

        {/* Test hesapları */}
        <TestHesaplar setValue={setValue} />
      </div>
    </div>
  );
}
