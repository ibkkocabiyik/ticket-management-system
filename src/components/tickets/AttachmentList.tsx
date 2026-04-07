"use client";

import { Download, FileText, Image } from "lucide-react";
import type { Attachment } from "@/types";

interface AttachmentListProps {
  attachments: Attachment[];
}

export function AttachmentList({ attachments }: AttachmentListProps) {
  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter((a) => a.mimeType.startsWith("image/"));
  const others = attachments.filter((a) => !a.mimeType.startsWith("image/"));

  return (
    <div className="mt-3 space-y-2">
      {/* Resim olmayan dosyalar */}
      {others.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {others.map((att) => (
            <a
              key={att.id}
              href={att.url}
              download={att.filename}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 transition hover:border-[#6366F1]/30 hover:bg-[#EEF2FF] dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:border-[#6366F1]/40 dark:hover:bg-[#312E81]/20"
            >
              <FileText size={13} className="text-gray-400" />
              <span className="max-w-[160px] truncate">{att.filename}</span>
              <span className="text-gray-400">({(att.size / 1024).toFixed(0)} KB)</span>
              <Download size={11} className="opacity-0 transition group-hover:opacity-100 text-[#6366F1]" />
            </a>
          ))}
        </div>
      )}

      {/* Resim thumbnail'ları */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((att) => (
            <a
              key={att.id}
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block"
              title={att.filename}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={att.url}
                alt={att.filename}
                className="h-24 w-24 rounded-lg border border-gray-200 object-cover transition group-hover:opacity-90 dark:border-gray-600"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 transition group-hover:bg-black/10">
                <Image size={16} className="text-white opacity-0 transition group-hover:opacity-100" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
