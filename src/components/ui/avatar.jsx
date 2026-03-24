import { cn } from "@/lib/utils";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export function Avatar({
  name,
  color = "bg-blue-500",
  size = "md",
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white/30 dark:ring-white/10 select-none",
        color,
        sizeClasses[size] || sizeClasses.md,
        className
      )}
      title={name}
      {...props}
    >
      {getInitials(name)}
    </div>
  );
}
