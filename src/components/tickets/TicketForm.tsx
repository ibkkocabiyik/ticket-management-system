"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useTicketDetail } from "@/context/TicketDetailContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { useCreateTicket } from "@/hooks/useTickets";
import { useCategories } from "@/hooks/useCategories";
import { useTemplates } from "@/hooks/useTemplates";
import { createTicketSchema, type CreateTicketInput } from "@/lib/validations/ticket";
import { uploadAttachment } from "@/lib/api/tickets";
import { FileInput } from "@/components/ui/FileInput";
import { TagPicker } from "@/components/tickets/TagPicker";
import {
  Select as RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/interfaces-select";
import Swal from "sweetalert2";

interface TicketFormProps {
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
}

const swalTheme = () => ({
  background: document.documentElement.classList.contains("dark") ? "#1f2937" : "#ffffff",
  color: document.documentElement.classList.contains("dark") ? "#f9fafb" : "#111827",
});

export function TicketForm({ onSuccess, onCancel }: TicketFormProps) {
  const router = useRouter();
  const { openTicket } = useTicketDetail();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const { mutateAsync: createTicket } = useCreateTicket();
  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("none");
  const [editorKey, setEditorKey] = useState(0);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
  });

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);

    if (templateId === "none") {
      setValue("title", "");
      setValue("categoryId", "");
      setDescription("");
      setEditorKey((k) => k + 1);
      return;
    }

    const template = templates?.find((t) => t.id === templateId);
    if (!template) return;

    setValue("title", template.title, { shouldValidate: true });
    setValue("categoryId", template.categoryId ?? "", { shouldValidate: true });
    setDescription(template.description);
    setEditorKey((k) => k + 1);
    if (descriptionError) setDescriptionError(null);
  };

  const clearTemplate = () => {
    setSelectedTemplateId("none");
    setValue("title", "");
    setValue("categoryId", "");
    setDescription("");
    setEditorKey((k) => k + 1);
  };

  const onSubmit = async (data: CreateTicketInput) => {
    // Öncelik kontrolü — Swal ile
    if (!data.priority) {
      await Swal.fire({
        icon: "warning",
        title: "Öncelik seçiniz",
        text: "Talep oluşturmak için bir öncelik seviyesi seçmeniz gerekmektedir.",
        confirmButtonText: "Tamam",
        confirmButtonColor: "#6366F1",
        ...swalTheme(),
      });
      return;
    }

    const stripped = description.replace(/<[^>]*>/g, "").trim();
    if (!stripped) {
      setDescriptionError("Açıklama zorunludur");
      return;
    }
    if (stripped.length < 10) {
      setDescriptionError("Açıklama en az 10 karakter olmalıdır");
      return;
    }
    setDescriptionError(null);
    setSubmitError(null);

    try {
      const ticket = await createTicket({ ...data, description, tagIds: selectedTagIds });
      if (attachedFiles.length > 0) {
        await Promise.allSettled(
          attachedFiles.map((file) => uploadAttachment(file, { ticketId: ticket.id }))
        );
      }
      if (onSuccess) {
        onSuccess(ticket.id);
      } else {
        router.push("/tickets");
        openTicket(ticket.id);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Talep oluşturulamadı");
    }
  };

  const priorityOptions = [
    { value: "Low", label: "Düşük" },
    { value: "Normal", label: "Normal" },
    { value: "High", label: "Yüksek" },
    { value: "Urgent", label: "Acil" },
  ];

  const categoryOptions = categoriesLoading
    ? []
    : (categories?.map((c) => ({ value: c.id, label: c.name })) ?? []);

  const hasTemplates = !templatesLoading && templates && templates.length > 0;
  const activeTemplate = templates?.find((t) => t.id === selectedTemplateId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* Şablon seçici — yalnızca şablon varsa göster */}
      {hasTemplates && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Şablon Seç
            <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">
              (isteğe bağlı)
            </span>
          </label>
          <div className="flex items-center gap-2">
            <RadixSelect value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger className="flex-1 w-full h-10 rounded-xl border-gray-200 dark:border-gray-600 text-sm">
                <SelectValue placeholder="Şablon seçin..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Şablon kullanma —</SelectItem>
                {templates?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="font-medium">{t.name}</span>
                    {t.category && (
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                        {t.category.name}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </RadixSelect>
            {selectedTemplateId !== "none" && (
              <button
                type="button"
                onClick={clearTemplate}
                title="Şablonu temizle"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-gray-600 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              >
                <X size={15} />
              </button>
            )}
          </div>
          {selectedTemplateId !== "none" && (
            <p className="mt-1.5 text-xs text-[#6366F1] dark:text-indigo-400">
              Şablon uygulandı — başlık ve kategori sabittir, açıklama ile önceliği düzenleyebilirsiniz.
            </p>
          )}
        </div>
      )}

      <Input
        label="Başlık"
        placeholder="Sorunun kısa açıklaması"
        error={errors.title?.message}
        disabled={selectedTemplateId !== "none"}
        {...register("title")}
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Açıklama
        </label>
        <RichTextEditor
          key={editorKey}
          value={description}
          onChange={(html) => {
            setDescription(html);
            if (descriptionError) setDescriptionError(null);
          }}
          placeholder="Sorun hakkında ayrıntılı bilgi verin..."
          maxLength={5000}
          error={descriptionError ?? undefined}
          minHeight="160px"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {selectedTemplateId !== "none" && activeTemplate?.categoryId ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Kategori
            </label>
            <div className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-400">
              <span className="truncate">{activeTemplate.category?.name ?? "—"}</span>
              <span className="ml-auto shrink-0 rounded-md bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:bg-gray-600 dark:text-gray-500">
                Sabit
              </span>
            </div>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Kategori</label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <RadixSelect value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </RadixSelect>
              )}
            />
            {errors.categoryId && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.categoryId.message}</p>
            )}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Öncelik</label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <RadixSelect value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Öncelik seçin" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </RadixSelect>
            )}
          />
          {errors.priority && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.priority.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Etiketler
          <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">(isteğe bağlı)</span>
        </label>
        <TagPicker value={selectedTagIds} onChange={setSelectedTagIds} />
      </div>

      <FileInput files={attachedFiles} onChange={setAttachedFiles} />

      {submitError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {submitError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => (onCancel ? onCancel() : router.back())}
        >
          İptal
        </Button>
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Talep Oluştur
        </Button>
      </div>
    </form>
  );
}
