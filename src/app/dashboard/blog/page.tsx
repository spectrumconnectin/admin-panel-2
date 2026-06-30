'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Spinner from '@/components/ui/Spinner';
import { Newspaper, Plus, RefreshCw, X, Star, Trash2, ExternalLink } from 'lucide-react';
import {
  getBlogPosts, getBlogPost, createBlogPost, updateBlogPost, deleteBlogPost,
  type BlogPost, type BlogPostInput,
} from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

const STATUS_STYLE: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft:     'bg-amber-50 text-amber-700 border-amber-200',
  archived:  'bg-slate-100 text-slate-500 border-slate-200',
};

const SITE = 'https://spectrumconect.com';

type Draft = BlogPostInput & { id?: string; tagsText?: string };

const EMPTY: Draft = {
  title: '', excerpt: '', content: '', cover_image: '', category: '',
  tags: [], tagsText: '', is_featured: false, status: 'draft',
  author_name: '', author_bio: '',
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setPosts((await getBlogPosts()).posts); }
    catch { /* surfaced by empty state */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setErr(''); setEditing({ ...EMPTY }); };

  const openEdit = async (p: BlogPost) => {
    setErr('');
    // Fetch full content (list payload omits it).
    try {
      const full = await getBlogPost(p.slug);
      setEditing({
        id: full.id, title: full.title, excerpt: full.excerpt, content: full.content ?? '',
        cover_image: full.cover_image ?? '', category: full.category ?? '',
        tags: full.tags ?? [], tagsText: (full.tags ?? []).join(', '),
        is_featured: !!full.is_featured, status: full.status ?? 'draft',
        author_name: full.author?.name ?? '', author_bio: full.author?.bio ?? '',
      });
    } catch { setErr('Could not load that post.'); }
  };

  const save = async (status?: 'draft' | 'published') => {
    if (!editing) return;
    const d = { ...editing, status: status ?? editing.status };
    if (!d.title.trim() || !d.excerpt.trim() || !d.content.trim() || !d.cover_image.trim()) {
      setErr('Title, excerpt, content and cover image are all required.'); return;
    }
    setSaving(true); setErr('');
    const body: BlogPostInput = {
      title: d.title.trim(), excerpt: d.excerpt.trim(), content: d.content,
      cover_image: d.cover_image.trim(), category: d.category?.trim() || undefined,
      tags: (d.tagsText ?? '').split(',').map(t => t.trim()).filter(Boolean),
      is_featured: d.is_featured, status: d.status,
      author_name: d.author_name?.trim() || undefined, author_bio: d.author_bio?.trim() || undefined,
    };
    try {
      if (d.id) await updateBlogPost(d.id, body);
      else await createBlogPost(body);
      setEditing(null);
      await load();
    } catch (e) { setErr((e as Error).message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const remove = async (p: BlogPost) => {
    if (!confirm(`Delete “${p.title}”? This cannot be undone.`)) return;
    try { await deleteBlogPost(p.id); await load(); } catch { /* ignore */ }
  };

  return (
    <div className="flex flex-col">
      <Header
        title="Blog"
        subtitle="Write and publish posts to the public blog"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={load} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
              <Plus className="h-3.5 w-3.5" /> New post
            </button>
          </div>
        }
      />

      <div className="p-4 lg:p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium mb-4">No posts yet.</p>
            <button onClick={openNew} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              <Plus className="h-4 w-4" /> Write your first post
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Title</th>
                  <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Category</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                  <th className="text-left font-semibold px-4 py-3 hidden sm:table-cell">Updated</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 cursor-pointer" onClick={() => openEdit(p)}>
                      <div className="flex items-center gap-2">
                        {p.is_featured && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                        <span className="font-semibold text-slate-800 line-clamp-1">{p.title}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{p.excerpt}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-500">{p.category || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold uppercase tracking-wide border px-2 py-0.5 rounded-md ${STATUS_STYLE[p.status ?? 'draft']}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-slate-400">{p.created_at ? formatDateTime(p.created_at) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {p.status === 'published' && (
                          <a href={`${SITE}/blog/${p.slug}`} target="_blank" rel="noreferrer" title="View live"
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 flex items-center justify-center">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button onClick={() => remove(p)} title="Delete"
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Editor drawer */}
      {editing && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => !saving && setEditing(null)} />
          <aside className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="font-bold text-slate-900">{editing.id ? 'Edit post' : 'New post'}</p>
              <button onClick={() => setEditing(null)} disabled={saving}
                className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {err && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">{err}</div>}

              <Field label="Title">
                <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}
                  placeholder="How to price your creative work" className={inp} />
              </Field>

              <Field label="Excerpt" hint="One or two sentences shown in cards and search.">
                <textarea rows={2} maxLength={500} value={editing.excerpt} onChange={e => setEditing({ ...editing, excerpt: e.target.value })}
                  placeholder="A short summary of the post…" className={inp} />
                <p className={`text-[11px] mt-1 text-right ${editing.excerpt.length > 480 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {editing.excerpt.length}/500
                </p>
              </Field>

              <Field label="Cover image URL">
                <input value={editing.cover_image} onChange={e => setEditing({ ...editing, cover_image: e.target.value })}
                  placeholder="https://…" className={inp} />
                {editing.cover_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editing.cover_image} alt="" className="mt-2 h-32 w-full object-cover rounded-lg border border-slate-200" />
                )}
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Category"><input value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} placeholder="Freelance Advice" className={inp} /></Field>
                <Field label="Tags" hint="comma separated"><input value={editing.tagsText} onChange={e => setEditing({ ...editing, tagsText: e.target.value })} placeholder="pricing, freelance" className={inp} /></Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Author name"><input value={editing.author_name} onChange={e => setEditing({ ...editing, author_name: e.target.value })} placeholder="Spectrum Connect" className={inp} /></Field>
                <Field label="Author bio"><input value={editing.author_bio} onChange={e => setEditing({ ...editing, author_bio: e.target.value })} placeholder="Founding team" className={inp} /></Field>
              </div>

              <Field label="Content" hint="HTML supported: <h2>, <p>, <ul>, <a>, <img>, <blockquote>, <strong>…">
                <textarea rows={14} value={editing.content} onChange={e => setEditing({ ...editing, content: e.target.value })}
                  placeholder="<p>Write your article here…</p>" className={`${inp} font-mono text-xs leading-relaxed`} />
              </Field>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={editing.is_featured} onChange={e => setEditing({ ...editing, is_featured: e.target.checked })} className="rounded" />
                Feature this post at the top of the blog
              </label>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-2">
              <button onClick={() => save('published')} disabled={saving}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-semibold text-sm hover:bg-brand-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Publish'}
              </button>
              <button onClick={() => save('draft')} disabled={saving}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-semibold text-sm hover:bg-slate-50 disabled:opacity-50">
                Save draft
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

const inp = 'w-full text-sm rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
        {label}{hint && <span className="ml-2 normal-case font-normal text-slate-400">· {hint}</span>}
      </label>
      {children}
    </div>
  );
}
