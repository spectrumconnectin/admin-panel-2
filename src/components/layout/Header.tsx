'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-sm px-6 shadow-sm">
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Live status indicator */}
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
          <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white shadow-sm">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-700 leading-tight">{user.username}</p>
              <p className="text-[10px] text-slate-400 capitalize leading-tight">{user.user_role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
