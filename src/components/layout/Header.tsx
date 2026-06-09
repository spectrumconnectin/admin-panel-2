'use client';

import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      {user && (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-slate-700">{user.username}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user.user_role}</p>
          </div>
        </div>
      )}
    </header>
  );
}
