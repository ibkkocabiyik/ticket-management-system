"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useNewTicket } from "@/context/NewTicketContext";

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

export function KeyboardShortcuts() {
  const { data: session } = useSession();
  const { open, isOpen } = useNewTicket();

  useEffect(() => {
    const role = session?.user?.role;
    if (!role || role === "SupportTeam") return;

    function handler(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      if (e.key !== "n" && e.key !== "N") return;
      if (isOpen) return;
      e.preventDefault();
      open();
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [session?.user?.role, open, isOpen]);

  return null;
}
