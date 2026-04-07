import { type HTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Status, Priority } from "@/types";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "status" | "priority" | "role";
  status?: Status;
  priority?: Priority;
  role?: string;
}

const statusColors: Record<Status, string> = {
  Open: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  InProgress:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  Waiting:
    "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  Resolved:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  Closed: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

const statusDotColors: Record<Status, string> = {
  Open: "bg-blue-500",
  InProgress: "bg-amber-500",
  Waiting: "bg-orange-500",
  Resolved: "bg-emerald-500",
  Closed: "bg-gray-400",
};

const priorityColors: Record<Priority, string> = {
  Low: "text-gray-500 dark:text-gray-400",
  Normal: "text-blue-600 dark:text-blue-400",
  High: "text-orange-600 dark:text-orange-400",
  Urgent: "text-red-600 dark:text-red-400",
};

const priorityDotColors: Record<Priority, string> = {
  Low: "bg-gray-400",
  Normal: "bg-blue-500",
  High: "bg-orange-500",
  Urgent: "bg-red-500",
};

const statusLabels: Record<Status, string> = {
  Open: "Açık",
  InProgress: "İşlemde",
  Waiting: "Beklemede",
  Resolved: "Çözüldü",
  Closed: "Kapatıldı",
};

const priorityLabels: Record<Priority, string> = {
  Low: "Düşük",
  Normal: "Normal",
  High: "Yüksek",
  Urgent: "Acil",
};

export function StatusBadge({ status, className, ...props }: { status: Status; className?: string } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusColors[status],
        className
      )}
      {...props}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusDotColors[status])} />
      {statusLabels[status]}
    </span>
  );
}

export function PriorityBadge({ priority, className, ...props }: { priority: Priority; className?: string } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        priorityColors[priority],
        className
      )}
      {...props}
    >
      <span className={cn("h-2 w-2 rounded-full shrink-0", priorityDotColors[priority])} />
      {priorityLabels[priority]}
    </span>
  );
}

export function Badge({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
