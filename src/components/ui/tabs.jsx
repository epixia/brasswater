import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

const TabsContext = createContext({ value: "", onValueChange: () => {} });

function Tabs({ value, onValueChange, className, children, ...props }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-white/5 dark:backdrop-blur-sm border border-gray-200/60 dark:border-white/10 p-1",
        className
      )}
      role="tablist"
      {...props}
    />
  );
}

function TabsTrigger({ value, className, ...props }) {
  const { value: activeValue, onValueChange } = useContext(TabsContext);
  const isActive = activeValue === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => onValueChange?.(value)}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
        isActive
          ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/5",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ value, className, ...props }) {
  const { value: activeValue } = useContext(TabsContext);

  if (activeValue !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn("mt-3", className)}
      style={{ animation: "tabFadeIn 200ms ease-out" }}
      {...props}
    >
      {props.children}
      <style>{`
        @keyframes tabFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
