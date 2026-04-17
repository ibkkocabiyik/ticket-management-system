"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, MessageSquare, User as UserIcon, Tag } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import type { Ticket } from "@/types";

interface TicketPreviewCardProps {
  ticket: Ticket;
  cursor: { x: number; y: number };
}

const CARD_WIDTH = 360;
const CARD_MAX_HEIGHT = 340;
const GAP = 16;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function TicketPreviewCard({ ticket, cursor }: TicketPreviewCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // İmlecin sağ-altına yerleştir; taşarsa sol/üst tarafa çevir
  let left = cursor.x + GAP;
  if (left + CARD_WIDTH > vw - 8) {
    left = cursor.x - CARD_WIDTH - GAP;
  }
  if (left < 8) left = 8;

  let top = cursor.y + GAP;
  if (top + CARD_MAX_HEIGHT > vh - 8) {
    top = cursor.y - CARD_MAX_HEIGHT - GAP;
  }
  if (top < 8) top = 8;

  const description = stripHtml(ticket.description || "").slice(0, 220);
  const commentCount = ticket._count?.comments ?? 0;
  const createdAt = new Date(ticket.createdAt).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return createPortal(
    <div
      className="pointer-events-none fixed z-[250] animate-fade-in-preview"
      style={{ top, left, width: CARD_WIDTH }}
    >
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
          {ticket.title}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>

        {description ? (
          <p className="mt-3 text-xs leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-4">
            {description}
          </p>
        ) : (
          <p className="mt-3 text-xs italic text-gray-400 dark:text-gray-500">
            Açıklama yok
          </p>
        )}

        <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <UserIcon size={12} className="shrink-0 text-gray-400" />
            <span className="truncate">{ticket.creator.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag size={12} className="shrink-0 text-gray-400" />
            <span className="truncate">{ticket.category.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={12} className="shrink-0 text-gray-400" />
            <span>{createdAt}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare size={12} className="shrink-0 text-gray-400" />
            <span>{commentCount} yorum</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
