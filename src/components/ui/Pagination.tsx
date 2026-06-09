interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, total, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  // Build page numbers: always show first, last, current ±1
  const pagesArr = Array.from(new Set([1, totalPages, page, page - 1, page + 1]));
  const sorted = pagesArr.filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  return (
    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium">{from}–{to}</span> of{' '}
        <span className="font-medium">{total}</span>
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40"
        >
          ‹ Prev
        </button>
        {sorted.map((p, i) => {
          const prev = sorted[i - 1];
          return (
            <span key={p} className="flex items-center">
              {prev && p - prev > 1 && (
                <span className="px-1 text-slate-400">…</span>
              )}
              <button
                onClick={() => onChange(p)}
                className={`min-w-[32px] rounded px-2 py-1 text-sm font-medium ${
                  p === page
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            </span>
          );
        })}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40"
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
