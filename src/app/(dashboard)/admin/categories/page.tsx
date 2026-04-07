"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useCategories";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import type { Category } from "@/types";
import { Tag, Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";

const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Ad zorunludur")
    .max(50, "Ad en fazla 50 karakter olabilir"),
  description: z.string().max(200).optional(),
});

type CategoryInput = z.infer<typeof categorySchema>;

function CategoryForm({
  onSubmit,
  defaultValues,
  isSubmitting,
  submitLabel,
}: {
  onSubmit: (data: CategoryInput) => void;
  defaultValues?: CategoryInput;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Ad"
        placeholder="Kategori adı"
        error={errors.name?.message}
        {...register("name")}
      />
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Açıklama (isteğe bağlı)
        </label>
        <textarea
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          rows={3}
          placeholder="Bu kategorinin kısa açıklaması"
          {...register("description")}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
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

function getSwalTheme() {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  return {
    background: isDark ? "#1f2937" : "#ffffff",
    color: isDark ? "#f9fafb" : "#111827",
  };
}

function AdminCategoriesContent() {
  const { data: categories, isLoading, isError } = useCategories();
  const { mutateAsync: createCategory } = useCreateCategory();
  const { mutateAsync: updateCategory } = useUpdateCategory();
  const { mutateAsync: deleteCategory } = useDeleteCategory();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (data: CategoryInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createCategory(data);
      setCreateModalOpen(false);
      const { background, color } = getSwalTheme();
      void Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Kategori oluşturuldu",
        showConfirmButton: false,
        timer: 2000,
        background,
        color,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kategori oluşturulamadı");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: CategoryInput) => {
    if (!editingCategory) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateCategory({ id: editingCategory.id, data });
      setEditingCategory(null);
      const { background, color } = getSwalTheme();
      void Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Kategori güncellendi",
        showConfirmButton: false,
        timer: 2000,
        background,
        color,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kategori güncellenemedi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category: Category) => {
    const { background, color } = getSwalTheme();
    const result = await Swal.fire({
      title: "Kategoriyi Sil",
      html: `<strong>${category.name}</strong> kategorisini silmek istediğinizden emin misiniz?<br/><span style="font-size:0.85em;color:#9ca3af">Aktif taleplere sahip kategoriler silinemez.</span>`,
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
      await deleteCategory(category.id);
      void Swal.fire({
        title: "Silindi!",
        text: `"${category.name}" kategorisi silindi.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        background,
        color,
      });
    } catch (err) {
      void Swal.fire({
        title: "Hata",
        text: err instanceof Error ? err.message : "Kategori silinemedi",
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
            <Tag size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Kategoriler
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Talep kategorilerini yönetin
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
          <span className="hidden sm:inline">Yeni Kategori</span>
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
            Kategoriler yüklenemedi
          </div>
        ) : categories?.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Tag size={36} className="text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">
              Henüz kategori yok
            </p>
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="gap-2"
            >
              <Plus size={14} />
              İlk kategoriyi oluşturun
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories?.map((category) => (
              <div
                key={category.id}
                className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Tag
                        size={14}
                        className="text-green-600 dark:text-green-400"
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {category.name}
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => {
                        setError(null);
                        setEditingCategory(category);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => void handleDelete(category)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {category.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {category.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Kategori Oluştur"
      >
        <CategoryForm
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
          submitLabel="Kategori Oluştur"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="Kategoriyi Düzenle"
      >
        {editingCategory && (
          <CategoryForm
            onSubmit={handleEdit}
            defaultValues={{
              name: editingCategory.name,
              description: editingCategory.description ?? undefined,
            }}
            isSubmitting={isSubmitting}
            submitLabel="Değişiklikleri Kaydet"
          />
        )}
      </Modal>
    </div>
  );
}

export default function AdminCategoriesPage() {
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

  return <AdminCategoriesContent />;
}
