"use client";

import { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Spinner } from "./Spinner";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

    const variants = {
      primary:
        "rounded-xl bg-[#6366F1] text-white shadow-sm hover:bg-[#4F46E5]",
      outline:
        "rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800",
      ghost:
        "rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
      danger:
        "rounded-xl bg-red-500 text-white shadow-sm hover:bg-red-600",
    };

    const sizes = {
      sm: "h-8 gap-1.5 px-3 text-xs",
      md: "h-9 gap-2 px-4 text-sm",
      lg: "h-11 gap-2 px-5 text-sm",
    };

    return (
      <button
        ref={ref}
        disabled={disabled ?? isLoading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner size={14} invert={variant === 'primary' || variant === 'danger'} />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
