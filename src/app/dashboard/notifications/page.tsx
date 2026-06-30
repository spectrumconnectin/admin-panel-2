'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Spinner from '@/components/ui/Spinner';
import {
  Bell, Megaphone, History, Send, Users, User2,
  Film, AlertTriangle, Info, CheckCircle, Zap,
  Wrench, Star, Gift, Calendar, Eye, RefreshCw,
} from 'lucide-react';
import {
  sendAdminNotification, getAdminNotificationHistory,
} from '@/lib/api';
import type { NotificationHistoryEntry } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

// ── types ──────────────────────────────────────────────────────────────────

type Tab          = 'send' | 'announcement' | 'history';
type NotifType    = 'info' | 'warning' | 'success' | 'alert';
type Recipient    = 'all' | 'clients' | 'creators' | 'custom';
type AnnType      = 'maintenance' | 'feature' | 'promotional' | 'emergency';

// category maps to the backend Notification.category field
const NOTIF_TYPE_TO_CATEGORY: Record<NotifType, string> = {
  info:    'info',
  warning: 'warning',
  success: 'success',
  alert:   'alert',
};

const ANN_TYPE_TO_CATEGORY: Record<AnnType, string> = {
  maintenance:  'warning',
  feature:      'info',
  promotional:  'success',
  emergency:    'alert',
};

// ── display metadata ────────────────────────────────────────────────────────

const TYPE_META: Record<NotifType, { label: string; icon: React.ReactNode; color: string; bg: string; ring: string }> = {
  info:    { label: 'Info',    icon: <Info className="h-4 w-4" />,          color: 'text-blue-600',    bg: 'bg-blue-50',    ring: 'ring-blue-200'    },
  warning: { label: 'Warning', icon: <AlertTriangle className="h-4 w-4" />, color: 'text-amber-600',   bg: 'bg-amber-50',   ring: 'ring-amber-200'   },
  success: { label: 'Success', icon: <CheckCircle className="h-4 w-4" />,   color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
  alert:   { label: 'Alert',   icon: <Zap className="h-4 w-4" />,           color: 'text-red-600',     bg: 'bg-red-50',     ring: 'ring-red-200'     },
};

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; ring: string }> = {
  info:    { label: 'Info',    color: 'text-blue-600',    bg: 'bg-blue-50',    ring: 'ring-blue-200'    },
  warning: { label: 'Warning', color: 'text-amber-600',   bg: 'bg-amber-50',   ring: 'ring-amber-200'   },
  success: { label: 'Success', color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
  alert:   { label: 'Alert',   color: 'text-red-600',     bg: 'bg-red-50',     ring: 'ring-red-200'     },
};

const ANN_META: Record<AnnType, { label: string; icon: React.ReactNode; color: string }> = {
  maintenance:  { label: 'Maintenance',    icon: <Wrench className="h-4 w-4" />,        color: 'text-amber-600'   },
  feature:      { label: 'Feature Update', icon: <Star className="h-4 w-4" />,          color: 'text-violet-600'  },
  promotional:  { label: 'Promotional',    icon: <Gift className="h-4 w-4" />,          color: 'text-emerald-600' },
  emergency:    { label: 'Emergency',      icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-600'     },
};

const RECIPIENT_META: Record<Recipient, { label: string; icon: React.ReactNode }> = {
  all:      { label: 'All Users',     icon: <Users className="h-4 w-4" /> },
  clients:  { label: 'Clients Only',  icon: <User2 className="h-4 w-4" /> },
  creators: { label: 'Creators Only', icon: <Film  className="h-4 w-4" /> },
  custom:   { label: 'Custom',        icon: <User2 className="h-4 w-4" /> },
};

// ── component ──────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [tab, setTab] = useState<Tab>('send');

  // ── Send Notification state ───────────────────────────────────────────────
  const [recipient,    setRecipient]    = useState<Recipient>('all');
  const [customIds,    setCustomIds]    = useState('');
  const [notifType,    setNotifType]    = useState<NotifType>('info');
  const [notifTitle,   setNotifTitle]   = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [sendLoading,  setSendLoading]  = useState(false);
  const [sendResult,   setSendResult]   = useState<{ sent_to: number; title: string } | null>(null);
  const [sendError,    setSendError]    = useState('');

  // ── Announcement state ────────────────────────────────────────────────────
  const [annType,        setAnnType]        = useState<AnnType>('feature');
  const [annTitle,       setAnnTitle]       = useState('');
  const [annContent,     setAnnContent]     = useState('');
  const [annSchedule,    setAnnSchedule]    = useState('');
  const [annLoading,     setAnnLoading]     = useState(false);
  const [annResult,      setAnnResult]      = useState<{ sent_to: number } | null>(null);
  const [annError,       setAnnError]       = useState('');

  // ── History state ─────────────────────────────────────────────────────────
  const [history,        setHistory]        = useState<NotificationHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError,   setHistoryError]   = useState('');

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const data = await getAdminNotificationHistory();
      setHistory(data);
    } catch (e: unknown) {
      setHistoryError(e instanceof Error ? e.message : 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab, loadHistory]);

  // ── Send handler ──────────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError('');
    if (!notifTitle.trim() || !notifMessage.trim()) {
      setSendError('Title and message are required.');
      return;
    }
    setSendLoading(true);
    try {
      const userIds = recipient === 'custom'
        ? customIds.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const result = await sendAdminNotification({
        recipient,
        user_ids:  userIds,
        title:     notifTitle.trim(),
        message:   notifMessage.trim(),
        type:      'system',
        category:  NOTIF_TYPE_TO_CATEGORY[notifType],
      });
      setSendResult({ sent_to: result.sent_to, title: result.title });
      setNotifTitle('');
      setNotifMessage('');
      setTimeout(() => setSendResult(null), 6000);
    } catch (e: unknown) {
      setSendError(e instanceof Error ? e.message : 'Failed to send notification');
    } finally {
      setSendLoading(false);
    }
  };

  // ── Announcement handler ──────────────────────────────────────────────────
  const handleAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnError('');
    if (!annTitle.trim() || !annContent.trim()) {
      setAnnError('Title and content are required.');
      return;
    }
    setAnnLoading(true);
    try {
      const result = await sendAdminNotification({
        recipient: 'all',
        title:    annTitle.trim(),
        message:  annContent.trim(),
        type:     'system',
        category: ANN_TYPE_TO_CATEGORY[annType],
      });
      setAnnResult({ sent_to: result.sent_to });
      setAnnTitle('');
      setAnnContent('');
      setAnnSchedule('');
      setTimeout(() => setAnnResult(null), 6000);
    } catch (e: unknown) {
      setAnnError(e instanceof Error ? e.message : 'Failed to send announcement');
    } finally {
      setAnnLoading(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'send',         label: 'Send Notification', icon: <Send     className="h-4 w-4" /> },
    { id: 'announcement', label: 'Announcement',       icon: <Megaphone className="h-4 w-4" /> },
    { id: 'history',      label: 'History',            icon: <History  className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col">
      <Header title="Notification Center" subtitle="Send real notifications to your users" />

      <div className="p-4 lg:p-6 space-y-5 lg:space-y-5">

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Send Notification ── */}
        {tab === 'send' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <form onSubmit={handleSend} className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Bell className="h-4 w-4 text-brand-500" />
                Compose Notification
              </h3>

              {/* Recipient */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Recipient
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(Object.keys(RECIPIENT_META) as Recipient[]).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRecipient(r)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                        recipient === r
                          ? 'border-brand-400 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {RECIPIENT_META[r].icon}
                      {RECIPIENT_META[r].label}
                    </button>
                  ))}
                </div>
                {recipient === 'custom' && (
                  <div className="mt-2 space-y-1">
                    <input
                      type="text"
                      placeholder="User IDs (comma separated)…"
                      value={customIds}
                      onChange={e => setCustomIds(e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <p className="text-[10px] text-slate-400">Paste the MongoDB user IDs from the Users page, separated by commas.</p>
                  </div>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(Object.keys(TYPE_META) as NotifType[]).map(nt => {
                    const m = TYPE_META[nt];
                    return (
                      <button
                        key={nt}
                        type="button"
                        onClick={() => setNotifType(nt)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                          notifType === nt
                            ? `border-current ${m.color} ${m.bg}`
                            : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className={notifType === nt ? m.color : 'text-slate-400'}>{m.icon}</span>
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Notification title…"
                  value={notifTitle}
                  onChange={e => setNotifTitle(e.target.value)}
                  maxLength={80}
                  className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Message
                </label>
                <textarea
                  placeholder="Write your message…"
                  value={notifMessage}
                  onChange={e => setNotifMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                />
              </div>

              {sendError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {sendError}
                </div>
              )}
              {sendResult && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>"{sendResult.title}"</strong> delivered to{' '}
                    <strong>{sendResult.sent_to.toLocaleString()} users</strong>.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={sendLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
              >
                {sendLoading ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Sending…</>
                ) : (
                  <><Send className="h-4 w-4" />Send Notification</>
                )}
              </button>
            </form>

            {/* Preview */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                <Eye className="h-4 w-4 text-slate-400" />
                Preview
              </h3>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                {notifTitle || notifMessage ? (
                  <div className={`rounded-lg border p-4 ${TYPE_META[notifType].bg} ring-1 ring-inset ${TYPE_META[notifType].ring}`}>
                    <div className={`flex items-center gap-2 font-semibold text-sm mb-1 ${TYPE_META[notifType].color}`}>
                      {TYPE_META[notifType].icon}
                      {notifTitle || 'Untitled'}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{notifMessage || 'No message yet…'}</p>
                    <p className="mt-2 text-[10px] text-slate-400">
                      To: {RECIPIENT_META[recipient].label} · {TYPE_META[notifType].label}
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-sm text-slate-400 py-8">Fill in the form to see a preview</p>
                )}
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-600">How it works</p>
                <p>Notifications are stored in the database and appear in the user's notification bell in the Spectrum Connect app in real time.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Announcement ── */}
        {tab === 'announcement' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <form onSubmit={handleAnnouncement} className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Megaphone className="h-4 w-4 text-brand-500" />
                Broadcast Announcement
                <span className="ml-auto rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Sends to ALL users
                </span>
              </h3>

              {/* Type */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(ANN_META) as AnnType[]).map(at => {
                    const m = ANN_META[at];
                    return (
                      <button
                        key={at}
                        type="button"
                        onClick={() => setAnnType(at)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all ${
                          annType === at
                            ? 'border-brand-400 bg-brand-50 text-brand-700'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <span className={annType === at ? 'text-brand-600' : m.color}>{m.icon}</span>
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Title</label>
                <input
                  type="text"
                  placeholder="Announcement title…"
                  value={annTitle}
                  onChange={e => setAnnTitle(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Content</label>
                <textarea
                  placeholder="Announcement content…"
                  value={annContent}
                  onChange={e => setAnnContent(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                />
              </div>

              {/* Schedule — visual only (immediate send for now) */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Reference Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={annSchedule}
                  onChange={e => setAnnSchedule(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {annError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {annError}
                </div>
              )}
              {annResult && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  Announcement sent to <strong>{annResult.sent_to.toLocaleString()} users</strong>.
                </div>
              )}

              <button
                type="submit"
                disabled={annLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
              >
                {annLoading ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Publishing…</>
                ) : (
                  <><Megaphone className="h-4 w-4" />Broadcast to All Users</>
                )}
              </button>
            </form>

            {/* Preview */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                <Eye className="h-4 w-4 text-slate-400" />
                Preview
              </h3>
              <div className="rounded-xl bg-slate-50 p-4">
                {annTitle || annContent ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={ANN_META[annType].color}>{ANN_META[annType].icon}</span>
                      <span className={`text-xs font-bold uppercase tracking-wider ${ANN_META[annType].color}`}>
                        {ANN_META[annType].label}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">{annTitle || 'Announcement Title'}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {annContent || 'Announcement content will appear here…'}
                    </p>
                    {annSchedule && (
                      <p className="mt-3 text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                        Reference date: {new Date(annSchedule).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-sm text-slate-400 py-8">Fill in the form to see a preview</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── History ── */}
        {tab === 'history' && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <History className="h-4 w-4 text-slate-400" />
                Sent Notifications
              </h3>
              <button
                onClick={loadHistory}
                disabled={historyLoading}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {historyLoading && (
              <div className="flex h-40 items-center justify-center">
                <Spinner size="md" />
              </div>
            )}

            {historyError && (
              <div className="m-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {historyError}
              </div>
            )}

            {!historyLoading && !historyError && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Sent At</th>
                      <th className="px-5 py-3">Title</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Sent By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-sm text-slate-400">
                          No notifications sent yet. Use the Send tab to send your first notification.
                        </td>
                      </tr>
                    )}
                    {history.map(entry => {
                      const cm = CATEGORY_META[entry.category] ?? CATEGORY_META.info;
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                            {formatDateTime(entry.sent_at)}
                          </td>
                          <td className="px-5 py-3 max-w-[300px]">
                            <p className="text-sm font-medium text-slate-700 truncate">{entry.title}</p>
                            <p className="text-xs text-slate-400 truncate">{entry.message}</p>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cm.bg} ${cm.color} ${cm.ring}`}>
                              {cm.label}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500">
                            {entry.actor_name ?? '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
