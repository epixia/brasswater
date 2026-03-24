import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function DialogOverlay({ onClick }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in"
      style={{ animation: "dialogFadeIn 200ms ease-out" }}
      onClick={onClick}
    />
  );
}

function Dialog({ open, onOpenChange, children }) {
  const handleEsc = useCallback(
    (e) => {
      if (e.key === "Escape") onOpenChange?.(false);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEsc);
        document.body.style.overflow = "";
      };
    }
  }, [open, handleEsc]);

  if (!open) return null;

  return createPortal(
    <>
      <DialogOverlay onClick={() => onOpenChange?.(false)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => onOpenChange?.(false)}>
        <div
          className="relative w-full max-w-lg rounded-xl bg-white dark:bg-gray-900/90 dark:backdrop-blur-xl border border-gray-200/60 dark:border-white/10 shadow-2xl"
          style={{ animation: "dialogSlideUp 250ms ease-out" }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
      <style>{`
        @keyframes dialogFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dialogSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>,
    document.body
  );
}

function DialogClose({ onOpenChange }) {
  return (
    <button
      onClick={() => onOpenChange?.(false)}
      className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

function DialogHeader({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6 pb-0", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }) {
  return (
    <h2
      className={cn(
        "text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-white",
        className
      )}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }) {
  return (
    <p
      className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
      {...props}
    />
  );
}

function DialogContent({ className, ...props }) {
  return <div className={cn("p-6", className)} {...props} />;
}

function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 p-6 pt-0",
        className
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogOverlay,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
};
