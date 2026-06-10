import React, { useState, useEffect, useCallback } from 'react';
import {
  SearchIcon,
  FileTextIcon,
  TrashIcon,
  FolderOpenIcon,
  DownloadIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { supabase, supabaseUrl } from './lib/supabase';

const CATEGORIES = [
  'Operations', 'Kitchen', 'Bar', 'Service', 'HR',
  'Training', 'Suppliers', 'Finance', 'Franchise',
] as const;

type Category = typeof CATEGORIES[number];

type Doc = {
  id: string;
  title: string;
  category: string;
  file_name: string;
  file_type: string;
  file_path: string | null;
  file_size: number | null;
  uploaded_at: string;
};

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

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function getPublicUrl(filePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/documents/${filePath}`;
}

function CategoryBadge({ category }: { category: string }) {
  const cls = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Franchise;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}>
      {category}
    </span>
  );
}

function FileTypeIcon({ type }: { type: string }) {
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
      type === 'pdf' ? 'bg-red-900/30 border border-red-700/40' : 'bg-blue-900/30 border border-blue-700/40'
    }`}>
      <FileTextIcon size={14} className={type === 'pdf' ? 'text-red-400' : 'text-blue-400'} />
    </div>
  );
}

export default function KnowledgeCenter() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState('');

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      setFetchError(error.message);
    } else {
      setDocs(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleDelete = async (doc: Doc) => {
    setDeletingId(doc.id);
    try {
      if (doc.file_path) {
        await supabase.storage.from('documents').remove([doc.file_path]);
      }
      await supabase.from('documents').delete().eq('id', doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch {
      // silently ignore
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = docs.filter((d) => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.file_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || d.category === activeCategory;
    return matchSearch && matchCat;
  });

  const allCategories = ['All', ...CATEGORIES];

  return (
    <div className="flex flex-col h-full bg-stone-900">
      {/* Header */}
      <header className="flex items-center px-6 py-4 border-b border-stone-800/70 bg-stone-900/90 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <FolderOpenIcon size={17} className="text-amber-500" />
          <div>
            <h1 className="text-sm font-semibold text-stone-200 leading-none">Knowledge Center</h1>
            <p className="text-[10px] text-stone-600 mt-0.5 uppercase tracking-wider">Delikat document library</p>
          </div>
        </div>
      </header>

      {/* Search + Filter */}
      <div className="px-6 pt-4 pb-3 space-y-3 flex-shrink-0">
        <div className="relative">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full max-w-sm bg-stone-800/60 border border-stone-700/60 rounded-lg pl-9 pr-3 py-2 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-amber-600/50 transition-colors"
          />
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
                activeCategory === cat
                  ? 'bg-amber-600/20 text-amber-400 border-amber-600/50'
                  : 'bg-stone-800/40 text-stone-500 border-stone-700/40 hover:text-stone-300 hover:border-stone-600/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-5 h-5 border-2 border-stone-700 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircleIcon size={28} className="text-red-400 mb-3" />
            <p className="text-sm text-stone-400">Failed to load documents</p>
            <p className="text-xs text-stone-600 mt-1">{fetchError}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderOpenIcon size={32} className="text-stone-700 mb-3" />
            <p className="text-sm text-stone-500">
              {docs.length === 0 ? 'No documents uploaded yet' : 'No documents match your search'}
            </p>
            {docs.length === 0 && (
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 px-4 py-2 rounded-lg border border-stone-700/60 text-sm text-stone-400 hover:text-stone-200 hover:border-stone-600 transition-all"
              >
                Upload your first document
              </button>
            )}
          </div>
        ) : (
          <div className="border border-stone-800/70 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[auto_1fr_140px_110px_80px_40px] items-center gap-4 px-4 py-2.5 bg-stone-800/30 border-b border-stone-800/70">
              <div className="w-8" />
              <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Title</p>
              <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Category</p>
              <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Date</p>
              <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Size</p>
              <div />
            </div>

            {/* Rows */}
            <div className="divide-y divide-stone-800/50">
              {filtered.map((doc) => (
                <div
                  key={doc.id}
                  className="grid grid-cols-[auto_1fr_140px_110px_80px_40px] items-center gap-4 px-4 py-3 hover:bg-stone-800/20 transition-colors group"
                >
                  <FileTypeIcon type={doc.file_type} />

                  <div className="min-w-0">
                    <p className="text-sm text-stone-200 font-medium truncate">{doc.title}</p>
                    <p className="text-[11px] text-stone-600 truncate mt-0.5">{doc.file_name}</p>
                  </div>

                  <div>
                    <CategoryBadge category={doc.category} />
                  </div>

                  <p className="text-xs text-stone-500">{formatDate(doc.uploaded_at)}</p>

                  <p className="text-xs text-stone-600">{formatBytes(doc.file_size)}</p>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {doc.file_path && (
                      <a
                        href={getPublicUrl(doc.file_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-stone-500 hover:text-stone-300 hover:bg-stone-700/50 transition-colors"
                        title="Download"
                      >
                        <DownloadIcon size={13} />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(doc)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 rounded-md text-stone-500 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-40"
                      title="Delete"
                    >
                      {deletingId === doc.id ? (
                        <span className="w-3 h-3 border border-stone-500 border-t-transparent rounded-full animate-spin block" />
                      ) : (
                        <TrashIcon size={13} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <p className="text-[11px] text-stone-700 mt-3 text-right">
            {filtered.length} document{filtered.length !== 1 ? 's' : ''}
            {activeCategory !== 'All' || search ? ` matching` : ''}
          </p>
        )}
      </div>
    </div>
  );
}
