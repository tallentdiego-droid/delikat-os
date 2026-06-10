import React, { useState, useEffect, useCallback } from 'react';
import {
  SearchIcon,
  BookOpenIcon,
  XIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  FileTextIcon,
} from 'lucide-react';
import { fetchDelikatDocuments } from './api';
import { DelikatDoc } from './types';

const CATEGORIES = [
  'All', 'Operations', 'Kitchen', 'Bar', 'Service', 'HR',
  'Training', 'Suppliers', 'Finance', 'Franchise',
];

const STATUSES = ['All', 'approved', 'draft', 'review', 'needs_update'];

const CATEGORY_STYLES: Record<string, string> = {
  Operations: 'bg-amber-900/30 text-amber-400 border-amber-700/40',
  Kitchen:    'bg-orange-900/30 text-orange-400 border-orange-700/40',
  Bar:        'bg-blue-900/30 text-blue-400 border-blue-700/40',
  Service:    'bg-emerald-900/30 text-emerald-400 border-emerald-700/40',
  HR:         'bg-rose-900/30 text-rose-400 border-rose-700/40',
  Training:   'bg-sky-900/30 text-sky-400 border-sky-700/40',
  Suppliers:  'bg-yellow-900/30 text-yellow-500 border-yellow-700/40',
  Finance:    'bg-teal-900/30 text-teal-400 border-teal-700/40',
  Franchise:  'bg-stone-700/40 text-stone-300 border-stone-600/40',
};

const STATUS_STYLES: Record<string, string> = {
  approved:     'bg-emerald-900/30 text-emerald-400 border-emerald-700/40',
  draft:        'bg-yellow-900/30 text-yellow-500 border-yellow-700/40',
  review:       'bg-blue-900/30 text-blue-400 border-blue-700/40',
  needs_update: 'bg-orange-900/30 text-orange-400 border-orange-700/40',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Franchise}`}>
      {category}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_STYLES[status] ?? 'bg-stone-800 text-stone-400 border-stone-700'}`}>
      {status}
    </span>
  );
}

function DocDetailPanel({ doc, onClose }: { doc: DelikatDoc; onClose: () => void }) {
  const m = doc.metadata;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-xl h-full bg-stone-900 border-l border-stone-700/60 flex flex-col shadow-2xl">
        <div className="flex items-start justify-between px-5 py-4 border-b border-stone-800/70 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-sm font-semibold text-stone-100 leading-snug">{m.title ?? 'Untitled'}</h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {m.category && <CategoryBadge category={m.category} />}
              {m.status && <StatusBadge status={m.status} />}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors flex-shrink-0">
            <XIcon size={16} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-stone-800/50 flex-shrink-0 space-y-1">
          {m.created_by && (
            <p className="text-xs text-stone-500"><span className="text-stone-600">Created by:</span> {m.created_by}</p>
          )}
          {m.source_path && (
            <p className="text-xs text-stone-500 truncate"><span className="text-stone-600">Source:</span> {m.source_path}</p>
          )}
          <p className="text-xs text-stone-500"><span className="text-stone-600">Indexed:</span> {formatDate(doc.created_at)}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm text-stone-300 whitespace-pre-wrap leading-7 font-mono">{doc.content}</p>
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeLibrary() {
  const [docs, setDocs] = useState<DelikatDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDoc, setSelectedDoc] = useState<DelikatDoc | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDelikatDocuments();
      setDocs(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = docs.filter((d) => {
    const title = d.metadata.title ?? '';
    const category = d.metadata.category ?? '';
    const status = d.metadata.status ?? '';
    const matchSearch = !search || title.toLowerCase().includes(search.toLowerCase()) || d.content.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || category === categoryFilter;
    const matchStatus = statusFilter === 'All' || status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div className="flex flex-col h-full bg-stone-900">
      <header className="flex items-center gap-2.5 px-6 py-4 border-b border-stone-800/70 bg-stone-900/90 backdrop-blur-sm flex-shrink-0">
        <BookOpenIcon size={17} className="text-amber-500" />
        <div>
          <h1 className="text-sm font-semibold text-stone-200 leading-none">Knowledge Library</h1>
          <p className="text-[10px] text-stone-600 mt-0.5 uppercase tracking-wider">All indexed documents</p>
        </div>
        <button onClick={load} className="ml-auto p-1.5 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors" title="Refresh">
          <RefreshCwIcon size={14} />
        </button>
      </header>

      <div className="px-6 pt-4 pb-3 space-y-3 flex-shrink-0 border-b border-stone-800/40">
        <div className="relative max-w-sm">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or content…"
            className="w-full bg-stone-800/60 border border-stone-700/60 rounded-lg pl-9 pr-3 py-2 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-amber-600/50 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${categoryFilter === c ? 'bg-amber-600/20 text-amber-400 border-amber-600/50' : 'bg-stone-800/40 text-stone-500 border-stone-700/40 hover:text-stone-300'}`}>
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${statusFilter === s ? 'bg-stone-700 text-stone-200 border-stone-500' : 'bg-stone-800/40 text-stone-500 border-stone-700/40 hover:text-stone-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <span className="w-6 h-6 border-2 border-stone-700 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-900/20 border border-red-700/40 rounded-lg">
            <AlertCircleIcon size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileTextIcon size={32} className="text-stone-700 mb-3" />
            <p className="text-sm text-stone-500">No documents found</p>
            <p className="text-xs text-stone-600 mt-1">
              {docs.length === 0 ? 'The knowledge base is empty. Create SOPs using the SOP Builder.' : 'Try adjusting your filters.'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((doc) => {
              const m = doc.metadata;
              const preview = doc.content.replace(/\s+/g, ' ').trim().slice(0, 140);
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="text-left p-4 rounded-xl bg-stone-800/40 border border-stone-700/40 hover:border-stone-600/60 hover:bg-stone-800/70 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-medium text-stone-200 group-hover:text-stone-100 leading-snug line-clamp-2 flex-1">
                      {m.title ?? 'Untitled'}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {m.category && <CategoryBadge category={m.category} />}
                    {m.status && <StatusBadge status={m.status} />}
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed line-clamp-3">{preview}…</p>
                  <div className="mt-3 pt-2 border-t border-stone-700/30 flex items-center justify-between">
                    <span className="text-[10px] text-stone-600">{m.created_by ?? '—'}</span>
                    <span className="text-[10px] text-stone-600">{formatDate(doc.created_at)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <p className="text-[11px] text-stone-700 mt-4 text-right">
            {filtered.length} of {docs.length} document{docs.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {selectedDoc && (
        <DocDetailPanel doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}
    </div>
  );
}
