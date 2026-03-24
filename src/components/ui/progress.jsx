import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const trackVariants = cva(
  "w-full overflow-hidden rounded-full bg-white/30 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10",
  {
    variants: {
      height: {
        sm: "h-1.5",
        default: "h-2.5",
        lg: "h-4",
      },
    },
    defaultVariants: {
      height: "default",
    },
  }
);

export function Progress({
  value = 0,
  max = 100,
  label,
  height = "default",
  className,
  ...props
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)} {...props}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(percent)}%
          </span>
        </div>
      )}
      <div className={trackVariants({ height })}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
