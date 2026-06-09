'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const NAV = [
  { href: '/dashboard',              icon: '⚡', label: 'Dashboard'    },
  { href: '/dashboard/users',        icon: '👥', label: 'Users'        },
  { href: '/dashboard/projects',     icon: '📁', label: 'Projects'     },
  { href: '/dashboard/disputes',     icon: '⚖️', label: 'Disputes'     },
  { href: '/dashboard/transactions', icon: '💳', label: 'Transactions' },
  { href: '/dashboard/revenue',      icon: '📈', label: 'Revenue'      },
  { href: '/dashboard/etf',          icon: '🏆', label: 'ETF Points'   },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-slate-900">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-800 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          S
        </span>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">Spectrum</p>
          <p className="text-xs text-slate-400 leading-tight">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <p className="mb-1 px-5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Platform
        </p>
        {NAV.map(({ href, icon, label }) => {
          const active = href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-brand-600/20 text-brand-300 font-medium'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-slate-800 px-4 py-3">
        {user && (
          <div className="mb-2 px-1">
            <p className="text-xs font-medium text-slate-300 truncate">{user.username}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user.user_role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
        >
          <span>🚪</span> Sign out
        </button>
      </div>
    </aside>
  );
}
