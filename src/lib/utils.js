import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with clsx support.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date as "Mar 24, 2026".
 */
export function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date as "Mar 24 · 2:35 PM" (or "Mar 24, 2026" if no time component).
 */
export function formatTimestamp(date) {
  if (!date) return "";
  const d = new Date(date);
  // If date-only string (YYYY-MM-DD), show just the date
  const isDateOnly = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (isDateOnly) return dateStr;
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${dateStr} · ${timeStr}`;
}

/**
 * Format a date as relative time, e.g. "2 hours ago", "3 days ago".
 */
export function formatRelativeTime(date) {
  if (!date) return "";
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
  return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
}

/**
 * Return Tailwind badge classes for a given status string.
 */
export function getStatusColor(status) {
  const map = {
    submitted: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    acknowledged: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    approved: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    assigned: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    scheduled: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    compliant: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    due_soon: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    non_compliant: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    expired: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };
  return map[status] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
}

/**
 * Return a human-readable label for a status key.
 */
export function getStatusLabel(status) {
  const map = {
    submitted: "Submitted",
    acknowledged: "Acknowledged",
    approved: "Approved",
    assigned: "Assigned",
    in_progress: "In Progress",
    completed: "Completed",
    closed: "Closed",
    scheduled: "Scheduled",
    overdue: "Overdue",
    compliant: "Compliant",
    due_soon: "Due Soon",
    non_compliant: "Non-Compliant",
    active: "Active",
    expired: "Expired",
  };
  return map[status] || status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "";
}

/**
 * Return Tailwind classes for priority levels 1-5 (1 = lowest, 5 = critical).
 */
export function getPriorityColor(priority) {
  const map = {
    1: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    2: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    3: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    4: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    5: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };
  return map[priority] || map[1];
}

/**
 * Return an array of 5 booleans: true = filled star, false = empty.
 */
export function getRatingStars(rating) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return Array.from({ length: 5 }, (_, i) => i < clamped);
}

/**
 * Format a number with commas: 1234567 -> "1,234,567".
 */
export function formatNumber(n) {
  if (n == null) return "";
  return Number(n).toLocaleString("en-US");
}

/**
 * Format currency in CAD.
 */
export function formatCurrency(amount) {
  if (amount == null) return "";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
