"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from "@/hooks/useTemplates";
import { useCategories } from "@/hooks/useCategories";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import type { TicketTemplate } from "@/types";
import { FileText, Plus, Edit, Trash2, AlertCircle, Tag } from "lucide-react";
import Swal from "sweetalert2";

const templateSchema = z.object({
  name: z.string().min(1, "Ad zorunludur").max(100, "Ad en fazla 100 karakter olabilir"),
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır").max(100, "Başlık en fazla 100 karakter olabilir"),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır"),
  categoryId: z.string().optional(),
});

type TemplateInput = z.infer<typeof templateSchema>;

function getSwalTheme() {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  return {
    background: isDark ? "#1f2937" : "#ffffff",
    color: isDark ? "#f9fafb" : "#111827",
  };
}

function TemplateForm({
  onSubmit,
  defaultValues,
  isSubmitting,
  submitLabel,
}: {
  onSubmit: (data: TemplateInput) => void;
  defaultValues?: TemplateInput;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TemplateInput>({
    resolver: zodResolver(templateSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Şablon Adı"
        placeholder="ör. Yavaş internet bağlantısı"
        error={errors.name?.message}
        {...register("name")}
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Kategori
        </label>
        <select
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          {...register("categoryId")}
        >
          <option value="">Kategori seçin</option>
          {!categoriesLoading &&
            categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
        {errors.categoryId && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">
            {errors.categoryId.message}
          </p>
        )}
      </div>

      <Input
        label="Ticket Başlığı"
        placeholder="ör. İnternet bağlantısı çok yavaş"
        error={errors.title?.message}
        {...register("title")}
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Ticket Açıklaması
        </label>
        <textarea
          rows={5}
          placeholder="Kullanıcıya şablon olarak sunulacak açıklama metni..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
          {...register("description")}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function AdminTemplatesContent() {
  const { data: templates, isLoading, isError } = useTemplates();
  const { mutateAsync: createTemplate } = useCreateTemplate();
  const { mutateAsync: updateTemplate } = useUpdateTemplate();
  const { mutateAsync: deleteTemplate } = useDeleteTemplate();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TicketTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (data: TemplateInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createTemplate(data);
      setCreateModalOpen(false);
      const { background, color } = getSwalTheme();
      void Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Şablon oluşturuldu",
        showConfirmButton: false,
        timer: 2000,
        background,
        color,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Şablon oluşturulamadı");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: TemplateInput) => {
    if (!editingTemplate) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateTemplate({ id: editingTemplate.id, data });
      setEditingTemplate(null);
      const { background, color } = getSwalTheme();
      void Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Şablon güncellendi",
        showConfirmButton: false,
        timer: 2000,
        background,
        color,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Şablon güncellenemedi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (template: TicketTemplate) => {
    const { background, color } = getSwalTheme();
    const result = await Swal.fire({
      title: "Şablonu Sil",
      html: `<strong>${template.name}</strong> şablonunu silmek istediğinizden emin misiniz?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Evet, sil",
      cancelButtonText: "İptal",
      background,
      color,
    });

    if (!result.isConfirmed) return;

    try {
      await deleteTemplate(template.id);
      void Swal.fire({
        title: "Silindi!",
        text: `"${template.name}" şablonu silindi.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        background,
        color,
      });
    } catch (err) {
      void Swal.fire({
        title: "Hata",
        text: err instanceof Error ? err.message : "Şablon silinemedi",
        icon: "error",
        background,
        color,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <FileText size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Ticket Şablonları
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hazır ticket taslakları oluşturun ve yönetin
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setError(null);
            setCreateModalOpen(true);
          }}
          className="gap-1.5 shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Yeni Şablon</span>
          <span className="sm:hidden">Yeni</span>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <Card>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-red-500">
            Şablonlar yüklenemedi
          </div>
        ) : templates?.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <FileText size={36} className="text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">Henüz şablon yok</p>
            <Button size="sm" onClick={() => setCreateModalOpen(true)} className="gap-2">
              <Plus size={14} />
              İlk şablonu oluşturun
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates?.map((template) => (
              <div
                key={template.id}
                className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                      <FileText size={14} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {template.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1">
                        <Tag size={10} className="text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-400 truncate">
                          {template.category.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      onClick={() => {
                        setError(null);
                        setEditingTemplate(template);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => void handleDelete(template)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {template.title}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Şablon Oluştur"
      >
        <TemplateForm
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
          submitLabel="Şablon Oluştur"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        title="Şablonu Düzenle"
      >
        {editingTemplate && (
          <TemplateForm
            onSubmit={handleEdit}
            defaultValues={{
              name: editingTemplate.name,
              title: editingTemplate.title,
              description: editingTemplate.description,
              categoryId: editingTemplate.categoryId,
            }}
            isSubmitting={isSubmitting}
            submitLabel="Değişiklikleri Kaydet"
          />
        )}
      </Modal>
    </div>
  );
}

export default function AdminTemplatesPage() {
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

  return <AdminTemplatesContent />;
}
