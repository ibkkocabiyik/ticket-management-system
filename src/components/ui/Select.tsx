import { type SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full appearance-none rounded-xl border px-3 py-2 pr-8 text-sm font-medium transition-all cursor-pointer",
              "bg-white text-gray-700",
              "dark:bg-gray-800/80 dark:text-gray-200",
              "hover:border-[#6366F1]/40 hover:bg-gray-50 dark:hover:bg-gray-700/80",
              "focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-red-400 focus:ring-red-400/25 focus:border-red-400"
                : "border-gray-200 dark:border-gray-700",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
