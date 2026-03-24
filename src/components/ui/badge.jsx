import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-blue-500/15 text-blue-700 border border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-400/20",
        success:
          "bg-green-500/15 text-green-700 border border-green-500/20 dark:bg-green-500/20 dark:text-green-300 dark:border-green-400/20",
        warning:
          "bg-amber-500/15 text-amber-700 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/20",
        danger:
          "bg-red-500/15 text-red-700 border border-red-500/20 dark:bg-red-500/20 dark:text-red-300 dark:border-red-400/20",
        secondary:
          "bg-gray-500/15 text-gray-700 border border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-400/20",
        info:
          "bg-cyan-500/15 text-cyan-700 border border-cyan-500/20 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/20",
        purple:
          "bg-purple-500/15 text-purple-700 border border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-400/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({ className, variant = "default", ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
