import type { Priority, Status } from "@/types";

// Önceliğe göre çözüm süresi (saat cinsinden)
export const SLA_HOURS: Record<Priority, number> = {
  Urgent: 4,
  High: 24,
  Normal: 72,
  Low: 168,
};

const TERMINAL_STATUSES: Status[] = ["Resolved", "Closed"];

export function isTerminalStatus(status: Status): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function getDeadline(createdAt: string | Date, priority: Priority): Date {
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const hours = SLA_HOURS[priority] ?? SLA_HOURS.Normal;
  return new Date(created.getTime() + hours * 3600 * 1000);
}

export interface SLAState {
  deadline: Date;
  overdue: boolean;
  resolvedLate: boolean | null;
  remainingMs: number;
  elapsedMs: number;
  label: string;
}

export function getSLAState(
  createdAt: string | Date,
  priority: Priority,
  status: Status,
  resolvedAt?: string | Date | null
): SLAState {
  const deadline = getDeadline(createdAt, priority);
  const now = Date.now();

  if (isTerminalStatus(status) && resolvedAt) {
    const resolved = typeof resolvedAt === "string" ? new Date(resolvedAt) : resolvedAt;
    const late = resolved.getTime() > deadline.getTime();
    return {
      deadline,
      overdue: false,
      resolvedLate: late,
      remainingMs: 0,
      elapsedMs: resolved.getTime() - (typeof createdAt === "string" ? new Date(createdAt).getTime() : createdAt.getTime()),
      label: late ? "Gecikmeli çözüldü" : "Zamanında çözüldü",
    };
  }

  const remainingMs = deadline.getTime() - now;
  const overdue = remainingMs < 0;
  return {
    deadline,
    overdue,
    resolvedLate: null,
    remainingMs,
    elapsedMs: now - (typeof createdAt === "string" ? new Date(createdAt).getTime() : createdAt.getTime()),
    label: overdue ? "Gecikmiş" : formatRemaining(remainingMs),
  };
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Gecikmiş";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} dk kaldı`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa kaldı`;
  const days = Math.floor(hours / 24);
  return `${days} gün kaldı`;
}
