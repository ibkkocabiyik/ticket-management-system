"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, MessageSquare, User as UserIcon, Tag } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import type { Ticket } from "@/types";

interface TicketPreviewCardProps {
  ticket: Ticket;
  cursor: { x: number; y: number };
}

const CARD_WIDTH = 340;
const GAP = 14;
const MARGIN = 12;

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
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const h = cardRef.current.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Yatay: imlecin sağına; sağa sığmazsa soluna
    let left = cursor.x + GAP;
    if (left + CARD_WIDTH > vw - MARGIN) {
      left = cursor.x - CARD_WIDTH - GAP;
    }
    if (left < MARGIN) left = MARGIN;

    // Dikey: imlecin hemen altına; alta sığmazsa üstüne
    let top = cursor.y + GAP;
    if (top + h > vh - MARGIN) {
      top = cursor.y - h - GAP;
    }
    if (top < MARGIN) top = MARGIN;

    setPos({ top, left });
  }, [cursor.x, cursor.y]);

  if (!mounted) return null;

  const description = stripHtml(ticket.description || "").slice(0, 220);
  const commentCount = ticket._count?.comments ?? 0;
  const createdAt = new Date(ticket.createdAt).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return createPortal(
    <div
      ref={cardRef}
      className="pointer-events-none fixed z-[250] animate-fade-in-preview"
      style={{
        top: pos?.top ?? cursor.y + GAP,
        left: pos?.left ?? cursor.x + GAP,
        width: CARD_WIDTH,
        visibility: pos ? "visible" : "hidden",
      }}
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
