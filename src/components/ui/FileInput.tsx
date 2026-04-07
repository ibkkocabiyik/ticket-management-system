"use client";

import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
];
const MAX_SIZE = 5 * 1024 * 1024;

interface FileInputProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

export function FileInput({ files, onChange, maxFiles = 5 }: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = Array.from(e.target.files ?? []);
    const invalid = selected.find((f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_SIZE);
    if (invalid) {
      setError("Geçersiz dosya tipi veya 5MB sınırı aşıldı");
      return;
    }
    const combined = [...files, ...selected].slice(0, maxFiles);
    onChange(combined);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-[#6366F1] dark:text-gray-400 dark:hover:text-indigo-400"
      >
        <Paperclip size={13} />
        Dosya ekle
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={handleChange}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="max-w-[200px] truncate">{f.name}</span>
              <span className="text-gray-400">({(f.size / 1024).toFixed(0)} KB)</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
