"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Camera, Building2, Phone, Mail, Lock, Eye, EyeOff, Save, X } from "lucide-react";
import Swal from "sweetalert2";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const profileSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır").max(100),
  phone: z.string().max(20).optional().or(z.literal("")),
  company: z.string().max(100).optional().or(z.literal("")),
  image: z.string().url("Geçerli bir URL giriniz").optional().or(z.literal("")),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifrenizi giriniz"),
  newPassword: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const swalTheme = () => ({
  background: document.documentElement.classList.contains("dark") ? "#1f2937" : "#ffffff",
  color: document.documentElement.classList.contains("dark") ? "#f9fafb" : "#111827",
});

type Tab = "profile" | "password";

export function ProfileModal({ isOpen, onClose, size = "lg" }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useProfile();
  const { mutateAsync: updateProfile, isPending: isSaving } = useUpdateProfile();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", phone: "", company: "", image: "" },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name ?? "",
        phone: profile.phone ?? "",
        company: profile.company ?? "",
        image: profile.image ?? "",
      });
      setAvatarPreview(profile.image ?? null);
    }
  }, [profile, profileForm]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      void Swal.fire({ title: "Hata", text: "Fotoğraf 2MB'dan küçük olmalıdır", icon: "error", ...swalTheme() });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json() as { url: string };
      profileForm.setValue("image", data.url);
      setAvatarPreview(data.url);
    } catch {
      void Swal.fire({ title: "Hata", text: "Fotoğraf yüklenemedi", icon: "error", ...swalTheme() });
    }
  };

  const onProfileSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile({
        name: values.name,
        phone: values.phone || null,
        company: values.company || null,
        image: values.image || null,
      });
      void Swal.fire({ title: "Kaydedildi", text: "Profil bilgileriniz güncellendi", icon: "success", timer: 2000, showConfirmButton: false, ...swalTheme() });
    } catch (err) {
      void Swal.fire({ title: "Hata", text: err instanceof Error ? err.message : "Profil güncellenemedi", icon: "error", ...swalTheme() });
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    try {
      await updateProfile({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      passwordForm.reset();
      void Swal.fire({ title: "Kaydedildi", text: "Şifreniz başarıyla değiştirildi", icon: "success", timer: 2000, showConfirmButton: false, ...swalTheme() });
    } catch (err) {
      void Swal.fire({ title: "Hata", text: err instanceof Error ? err.message : "Şifre değiştirilemedi", icon: "error", ...swalTheme() });
    }
  };

  const roleLabel: Record<string, string> = {
    Admin: "Yönetici",
    SupportTeam: "Destek Ekibi",
    EndUser: "Kullanıcı",
  };

  const roleColor: Record<string, string> = {
    Admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    SupportTeam: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    EndUser: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  };

  const initials = profile?.name
    ? profile.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size}>
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="flex flex-col min-h-0">
          {/* Header */}
          <div className="relative shrink-0 flex items-start justify-between px-6 pt-6 pb-5 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="h-16 w-16 rounded-2xl overflow-hidden bg-[#6366F1] flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profil" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-white">{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#6366F1] text-white shadow-md hover:bg-[#4F46E5] transition-colors"
                  title="Fotoğraf değiştir"
                >
                  <Camera size={11} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {profile?.name}
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{profile?.email}</p>
                <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${roleColor[profile?.role ?? "EndUser"]}`}>
                  {roleLabel[profile?.role ?? "EndUser"]}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Kapat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="shrink-0 flex border-b border-gray-100 dark:border-gray-700 px-6">
            {(["profile", "password"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-[#6366F1] text-[#6366F1] dark:text-indigo-400 dark:border-indigo-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab === "profile" ? "Profil Bilgileri" : "Şifre Değiştir"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="px-6 py-5">

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                {/* İsim */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    <User size={12} className="inline mr-1.5" />İsim Soyisim
                  </label>
                  <Input
                    {...profileForm.register("name")}
                    placeholder="Ad Soyad"
                    className="h-10 text-sm"
                  />
                  {profileForm.formState.errors.name && (
                    <p className="mt-1 text-xs text-red-500">{profileForm.formState.errors.name.message}</p>
                  )}
                </div>

                {/* Firma */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    <Building2 size={12} className="inline mr-1.5" />Firma
                  </label>
                  <Input
                    {...profileForm.register("company")}
                    placeholder="Firma adı (isteğe bağlı)"
                    className="h-10 text-sm"
                  />
                </div>

                {/* Telefon */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    <Phone size={12} className="inline mr-1.5" />Telefon
                  </label>
                  <Input
                    {...profileForm.register("phone")}
                    placeholder="+90 5xx xxx xx xx (isteğe bağlı)"
                    className="h-10 text-sm"
                  />
                </div>

                {/* E-posta (read-only) */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    <Mail size={12} className="inline mr-1.5" />E-Posta
                  </label>
                  <div className="flex h-10 items-center rounded-xl border border-gray-200 bg-gray-50 px-3 dark:border-gray-700 dark:bg-gray-800/60">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{profile?.email}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400">E-posta adresi değiştirilemez</p>
                </div>

                {/* Profil fotoğrafı URL */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    <Camera size={12} className="inline mr-1.5" />Profil Fotoğrafı URL
                    <span className="ml-1 text-gray-400 font-normal">(veya yukarıdan yükleyin)</span>
                  </label>
                  <Input
                    {...profileForm.register("image")}
                    placeholder="https://..."
                    className="h-10 text-sm"
                    onChange={(e) => {
                      profileForm.setValue("image", e.target.value);
                      setAvatarPreview(e.target.value || null);
                    }}
                  />
                  {profileForm.formState.errors.image && (
                    <p className="mt-1 text-xs text-red-500">{profileForm.formState.errors.image.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={isSaving} className="w-full gap-2 h-10">
                    {isSaving ? <Spinner size={14} /> : <Save size={14} />}
                    Kaydet
                  </Button>
                </div>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                {/* Mevcut Şifre */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    <Lock size={12} className="inline mr-1.5" />Mevcut Şifre
                  </label>
                  <div className="relative">
                    <Input
                      {...passwordForm.register("currentPassword")}
                      type={showCurrent ? "text" : "password"}
                      placeholder="Mevcut şifreniz"
                      className="h-10 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="mt-1 text-xs text-red-500">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>

                {/* Yeni Şifre */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    <Lock size={12} className="inline mr-1.5" />Yeni Şifre
                  </label>
                  <div className="relative">
                    <Input
                      {...passwordForm.register("newPassword")}
                      type={showNew ? "text" : "password"}
                      placeholder="En az 6 karakter"
                      className="h-10 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="mt-1 text-xs text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>

                {/* Şifre Tekrar */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    <Lock size={12} className="inline mr-1.5" />Şifre Tekrar
                  </label>
                  <div className="relative">
                    <Input
                      {...passwordForm.register("confirmPassword")}
                      type={showConfirm ? "text" : "password"}
                      placeholder="Yeni şifrenizi tekrar giriniz"
                      className="h-10 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={isSaving} className="w-full gap-2 h-10">
                    {isSaving ? <Spinner size={14} /> : <Lock size={14} />}
                    Şifreyi Değiştir
                  </Button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </Modal>
  );
}
