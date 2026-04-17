"use client";

import { useMemo, useRef, useState } from "react";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import { useTags, useCreateTag } from "@/hooks/useTags";
import type { Tag } from "@/types";

interface TagPickerProps {
  value: string[];
  onChange: (ids: string[]) => void;
  allowCreate?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function TagPicker({
  value,
  onChange,
  allowCreate = true,
  disabled = false,
  placeholder = "Etiket ekle...",
}: TagPickerProps) {
  const { data: allTags = [] } = useTags();
  const { mutateAsync: createTag, isPending } = useCreateTag();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedTags = useMemo(
    () => allTags.filter((t) => value.includes(t.id)),
    [allTags, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTags
      .filter((t) => !value.includes(t.id))
      .filter((t) => (q ? t.name.toLowerCase().includes(q) : true));
  }, [allTags, value, query]);

  const exactMatch = allTags.some(
    (t) => t.name.toLowerCase() === query.trim().toLowerCase()
  );
  const canCreate = allowCreate && query.trim().length >= 2 && !exactMatch;

  function addTag(tag: Tag) {
    if (!value.includes(tag.id)) onChange([...value, tag.id]);
    setQuery("");
    inputRef.current?.focus();
  }

  function removeTag(id: string) {
    onChange(value.filter((t) => t !== id));
  }

  async function handleCreate() {
    const name = query.trim();
    if (name.length < 2) return;
    try {
      const tag = await createTag({ name });
      addTag(tag);
    } catch {
      // yoksay
    }
  }

  return (
    <div className="relative">
      <div
        className={`flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-xl border bg-white px-2.5 py-1.5 transition-colors dark:bg-gray-800 ${
          open
            ? "border-[#6366F1] ring-2 ring-[#6366F1]/15"
            : "border-gray-200 dark:border-gray-600"
        } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTags.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1 rounded-lg bg-[#EEF2FF] px-2 py-0.5 text-xs font-medium text-[#6366F1] dark:bg-[#312E81]/40 dark:text-indigo-300"
            style={t.color ? { backgroundColor: `${t.color}22`, color: t.color } : undefined}
          >
            <TagIcon size={10} />
            {t.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(t.id);
              }}
              className="rounded p-0.5 hover:bg-black/10"
              aria-label={`${t.name} etiketini kaldır`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered[0]) addTag(filtered[0]);
              else if (canCreate) void handleCreate();
            } else if (e.key === "Backspace" && !query && selectedTags.length > 0) {
              removeTag(selectedTags[selectedTags.length - 1].id);
            }
          }}
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none dark:text-gray-200"
          disabled={disabled}
        />
      </div>

      {open && (filtered.length > 0 || canCreate) && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {filtered.slice(0, 8).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => addTag(t)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-indigo-50 hover:text-[#6366F1] dark:hover:bg-indigo-900/30"
            >
              <TagIcon size={12} className="text-gray-400" />
              <span>{t.name}</span>
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={isPending}
              className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-1.5 text-left text-sm text-[#6366F1] hover:bg-indigo-50 disabled:opacity-60 dark:border-gray-700 dark:hover:bg-indigo-900/30"
            >
              <Plus size={12} />
              <span>&quot;{query.trim()}&quot; etiketini oluştur</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
