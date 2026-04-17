"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getNotificationsWithLimit,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api/notifications";

function playNotificationSound() {
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
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const prevCountRef = useRef<number | null>(null);

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    const notifications = query.data;
    if (!notifications) return;

    const unreadCount = notifications.unreadCount;

    if (prevCountRef.current !== null && unreadCount > prevCountRef.current) {
      playNotificationSound();
    }

    prevCountRef.current = unreadCount;
  }, [query.data]);

  return query;
}

export function useAllNotifications(enabled: boolean) {
  return useQuery({
    queryKey: ["notifications", "all"],
    queryFn: () => getNotificationsWithLimit(50),
    enabled,
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications", "all"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications", "all"] });
    },
  });
}
