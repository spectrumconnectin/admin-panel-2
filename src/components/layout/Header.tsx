'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { Bell, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const { user } = useAuth();
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-20 flex h-14 lg:h-16 items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-sm px-4 lg:px-6 shadow-sm gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggle}
          className="lg:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base lg:text-lg font-bold text-slate-900 tracking-tight truncate">{title}</h1>
          {subtitle && <p className="hidden sm:block text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Live status — hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
          <span className="text-[10px] font-medium text-green-700">Live</span>
        </div>

        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
          <Bell className="h-4 w-4" />
        </button>

        {user && (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-2 lg:pl-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white shadow-sm shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-slate-700 leading-tight">{user.username}</p>
              <p className="text-[10px] text-slate-400 capitalize leading-tight">{user.user_role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
