"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api/notifications";

export function useNotifications() {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    function connect() {
      if (esRef.current) {
        esRef.current.close();
      }

      const es = new EventSource("/api/notifications/stream");
      esRef.current = es;

      es.onmessage = () => {
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.35);
          osc.onended = () => void ctx.close();
        } catch {
          // Tarayıcı ses iznini kısıtlıyorsa sessizce geç
        }

        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        // Retry after 5s
        setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    // Fallback polling every 30s in case SSE misses something
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
