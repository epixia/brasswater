import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastContext = createContext(null);

const variantStyles = {
  default:
    "bg-white dark:bg-gray-900/80 border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100",
  success:
    "bg-green-50/80 dark:bg-green-950/60 border-green-200/30 dark:border-green-500/20 text-green-900 dark:text-green-100",
  error:
    "bg-red-50/80 dark:bg-red-950/60 border-red-200/30 dark:border-red-500/20 text-red-900 dark:text-red-100",
  warning:
    "bg-amber-50/80 dark:bg-amber-950/60 border-amber-200/30 dark:border-amber-500/20 text-amber-900 dark:text-amber-100",
};

let toastId = 0;

function ToastItem({ toast: t, onDismiss }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onDismiss(t.id);
    }, 4000);
    return () => clearTimeout(timerRef.current);
  }, [t.id, onDismiss]);

  return (
    <div
      className={cn(
        "pointer-events-auto w-80 rounded-xl backdrop-blur-xl border shadow-lg p-4 transition-all duration-300",
        variantStyles[t.variant || "default"]
      )}
      style={{ animation: "toastSlideIn 300ms ease-out" }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {t.title && (
            <p className="text-sm font-semibold leading-tight">{t.title}</p>
          )}
          {t.description && (
            <p className="mt-1 text-sm opacity-80">{t.description}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(t.id)}
          className="shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, variant = "default" }) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, title, description, variant }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export { ToastProvider, useToast };
