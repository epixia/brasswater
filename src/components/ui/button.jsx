import { forwardRef } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg dark:bg-blue-600 dark:hover:bg-blue-500",
        secondary:
          "bg-white/50 text-gray-800 backdrop-blur-sm border border-white/30 shadow-sm hover:bg-white/70 hover:shadow-md dark:bg-white/10 dark:text-gray-200 dark:border-white/15 dark:hover:bg-white/15",
        outline:
          "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100/50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-white/5",
        ghost:
          "bg-transparent text-gray-700 hover:bg-gray-100/60 dark:text-gray-300 dark:hover:bg-white/10",
        danger:
          "bg-red-600 text-white shadow-md hover:bg-red-700 hover:shadow-lg dark:bg-red-600 dark:hover:bg-red-500",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        default: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = forwardRef(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    if (asChild) {
      return (
        <span
          ref={ref}
          className={cn(buttonVariants({ variant, size }), className)}
          {...props}
        >
          {children}
        </span>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
