import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  value,
  label,
  trend,
  trendValue,
  accentColor = "border-blue-500",
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white dark:bg-white/5 dark:backdrop-blur-xl border border-gray-200/60 dark:border-white/10 shadow-sm dark:shadow-lg p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-xl",
        `border-l-4 ${accentColor}`,
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold text-gray-900 dark:text-white truncate">
            {value}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            {label}
          </p>
          {trend && trendValue != null && (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1 text-xs font-medium",
                trend === "up"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {trend === "up" ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {trendValue}%
            </div>
          )}
        </div>
        {Icon && (
          <div className="ml-4 rounded-lg bg-gray-100 dark:bg-white/10 p-2.5">
            <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}
