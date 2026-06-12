'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  LayoutDashboard, Users, FolderOpen, Scale,
  CreditCard, TrendingUp, Trophy, LogOut, Zap,
  BarChart3, Activity, Bell, Download, X, Settings, Phone,
} from 'lucide-react';

interface NavItem  { href: string; Icon: React.ElementType; label: string }
interface NavGroup { label: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', Icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { href: '/dashboard/users',        Icon: Users,      label: 'Users'        },
      { href: '/dashboard/projects',     Icon: FolderOpen, label: 'Projects'     },
      { href: '/dashboard/disputes',     Icon: Scale,      label: 'Disputes'     },
      { href: '/dashboard/transactions', Icon: CreditCard, label: 'Transactions' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/dashboard/revenue', Icon: TrendingUp, label: 'Revenue'    },
      { href: '/dashboard/etf',     Icon: Trophy,     label: 'ETF Points' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/dashboard/analytics',     Icon: BarChart3, label: 'Analytics'      },
      { href: '/dashboard/health',        Icon: Activity,  label: 'Health Monitor' },
      { href: '/dashboard/notifications', Icon: Bell,      label: 'Notifications'  },
      { href: '/dashboard/ceo-calls',     Icon: Phone,     label: 'Call the CEO'   },
      { href: '/dashboard/export',        Icon: Download,  label: 'Export'         },
      { href: '/dashboard/settings',      Icon: Settings,  label: 'Settings'       },
    ],
  },
];

export default function Sidebar() {
  const pathname       = usePathname();
  const { user, logout } = useAuth();
  const { open, setOpen } = useSidebar();

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  function handleNavClick() {
    // Close drawer on mobile after navigation
    setOpen(false);
  }

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-slate-900 border-r border-slate-800
        transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:w-60
      `}
    >
      {/* Brand + mobile close */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-900/40">
            <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight tracking-tight">Spectrum</p>
            <p className="text-[10px] text-slate-500 leading-tight uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'mt-5' : ''}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, Icon, label }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={handleNavClick}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      active
                        ? 'bg-brand-600/20 text-brand-300'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-brand-500" />
                    )}
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-800 p-3">
        {user && (
          <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-300">{user.username}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user.user_role}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-red-900/20 hover:text-red-400"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
