"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTickets, createTicket, updateTicket, deleteTicket } from "@/lib/api/tickets";
import type { TicketFilters } from "@/types";
import type { CreateTicketInput, UpdateTicketInput } from "@/lib/validations/ticket";

export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ["tickets", filters],
    queryFn: () => getTickets(filters),
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketInput) => createTicket(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useUpdateTicket(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTicketInput) => updateTicket(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      void queryClient.invalidateQueries({ queryKey: ["ticket-history", id] });
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTicket(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}
