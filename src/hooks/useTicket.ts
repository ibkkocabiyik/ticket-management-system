"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTicket, getTicketComments, createComment, uploadAttachment } from "@/lib/api/tickets";
import type { TicketHistory } from "@/types";

export function useTicket(id: string) {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: () => getTicket(id),
    enabled: !!id,
  });
}

export function useTicketComments(ticketId: string) {
  return useQuery({
    queryKey: ["ticket-comments", ticketId],
    queryFn: () => getTicketComments(ticketId),
    enabled: !!ticketId,
  });
}

export function useTicketHistory(ticketId: string) {
  return useQuery<TicketHistory[]>({
    queryKey: ["ticket-history", ticketId],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}/history`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      return res.json() as Promise<TicketHistory[]>;
    },
    enabled: !!ticketId,
    staleTime: 0,
    retry: 1,
  });
}

export function useCreateComment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ content, files }: { content: string; files?: File[] }) => {
      const comment = await createComment(ticketId, content);
      if (files && files.length > 0) {
        await Promise.allSettled(
          files.map((file) => uploadAttachment(file, { commentId: comment.id }))
        );
      }
      return comment;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ticket-comments", ticketId] });
      void queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      void queryClient.invalidateQueries({ queryKey: ["ticket-history", ticketId] });
    },
  });
}
