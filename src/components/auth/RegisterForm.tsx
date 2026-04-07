"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { registerSchema, type RegisterInput } from "@/lib/validations/user";
import Swal from "sweetalert2";

const swalTheme = () => ({
  background: document.documentElement.classList.contains("dark") ? "#1f2937" : "#ffffff",
  color: document.documentElement.classList.contains("dark") ? "#f9fafb" : "#111827",
});

export function RegisterForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json() as { message?: string };
        await Swal.fire({
          icon: "error",
          title: "Kayıt başarısız",
          text: err.message ?? "Kayıt sırasında bir hata oluştu.",
          confirmButtonText: "Tamam",
          confirmButtonColor: "#6366F1",
          ...swalTheme(),
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Hesap oluşturuldu!",
        text: "Giriş sayfasına yönlendiriliyorsunuz...",
        confirmButtonText: "Giriş Yap",
        confirmButtonColor: "#6366F1",
        timer: 2500,
        timerProgressBar: true,
        ...swalTheme(),
      });

      router.push("/login");
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
          <UserPlus size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">TicketSystem v.01</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/40">Hesap oluşturun</p>
      </div>

      <div className="mb-6 hidden lg:block">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Kayıt Ol</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/40">Bilgilerinizi girerek hesabınızı oluşturun</p>
      </div>

      {/* Kart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-xl shadow-gray-200/60 dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none dark:backdrop-blur-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Ad Soyad */}
          <div>
            <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">
              Ad Soyad
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/25" />
              <input
                type="text"
                placeholder="Adınız Soyadınız"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder-white/25 dark:focus:border-[#6366F1]/60 dark:focus:ring-[#6366F1]/20"
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.name.message}</p>
            )}
          </div>

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
                placeholder="En az 6 karakter"
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
            Kayıt Ol
            {!isSubmitting && <ArrowRight size={16} />}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
          Zaten hesabınız var mı?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#6366F1] hover:text-[#4F46E5] dark:text-indigo-400"
          >
            Giriş yapın
          </Link>
        </p>
      </div>
    </div>
  );
}
