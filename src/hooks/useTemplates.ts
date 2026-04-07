"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/api/templates";

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: getTemplates,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTemplate>[1] }) =>
      updateTemplate(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}
