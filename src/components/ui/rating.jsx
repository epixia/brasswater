import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export function Rating({
  value = 0,
  onChange,
  max = 5,
  size = "md",
  interactive = false,
  className,
  ...props
}) {
  const [hovered, setHovered] = useState(0);

  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const displayValue = hovered || value;

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      onMouseLeave={() => interactive && setHovered(0)}
      {...props}
    >
      {stars.map((star) => {
        const filled = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            onMouseEnter={() => interactive && setHovered(star)}
            className={cn(
              "transition-colors duration-150 focus-visible:outline-none",
              interactive
                ? "cursor-pointer hover:scale-110 transition-transform"
                : "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeMap[size] || sizeMap.md,
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-none text-gray-300 dark:text-gray-600"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
