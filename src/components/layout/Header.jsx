import { Menu, Search, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function Header({ onMenuClick, title }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center gap-4 px-4 sm:px-6
                 bg-white/95 dark:bg-gray-900/60 backdrop-blur-xl
                 border-b border-gray-200/60 dark:border-white/5"
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10
                   dark:text-gray-400 md:hidden transition-colors"
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h1>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-56 rounded-xl bg-gray-100 dark:bg-white/5 pl-9 pr-4
                       text-sm text-gray-700 dark:text-gray-200
                       placeholder-gray-400 dark:placeholder-gray-500
                       border border-gray-200/60 dark:border-white/10
                       backdrop-blur-lg
                       focus:outline-none focus:ring-2 focus:ring-sky-400/40
                       transition-all"
          />
        </div>

        {/* Notifications */}
        <button
          className="relative rounded-xl p-2 text-gray-500 dark:text-gray-400
                     hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-xl p-2 text-gray-500 dark:text-gray-400
                     hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Toggle theme"
        >
          <span className="relative block h-[18px] w-[18px]">
            <Sun
              size={18}
              className={`absolute inset-0 transition-all duration-500 ${
                theme === 'light'
                  ? 'rotate-0 scale-100 opacity-100'
                  : 'rotate-90 scale-0 opacity-0'
              }`}
            />
            <Moon
              size={18}
              className={`absolute inset-0 transition-all duration-500 ${
                theme === 'dark'
                  ? 'rotate-0 scale-100 opacity-100'
                  : '-rotate-90 scale-0 opacity-0'
              }`}
            />
          </span>
        </button>

        {/* User avatar */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full
                     bg-gradient-to-br from-sky-500 to-blue-600
                     text-xs font-bold text-white cursor-pointer
                     ring-2 ring-white/20"
        >
          ML
        </div>
      </div>
    </header>
  );
}
