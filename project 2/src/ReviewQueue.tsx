import React, { useState, useEffect, useCallback } from 'react';
import { ClockIcon, CheckIcon, XIcon, PencilIcon, AlertCircleIcon, RefreshCwIcon, InboxIcon } from 'lucide-react';
import { fetchDelikatDocuments, updateDocumentStatus } from './api';
import { DelikatDoc, SopEditDoc } from './types';

const STATUS_STYLES: Record<string, string> = {
  draft:        'bg-yellow-900/30 text-yellow-500 border-yellow-700/40',
  review:       'bg-blue-900/30 text-blue-400 border-blue-700/40',
  needs_update: 'bg-orange-900/30 text-orange-400 border-orange-700/40',
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

interface ReviewQueueProps {
  onEditDoc: (doc: SopEditDoc) => void;
}

export default function ReviewQueue({ onEditDoc }: ReviewQueueProps) {
  const [docs, setDocs] = useState<DelikatDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<Record<string, 'approving' | 'rejecting'>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const all = await fetchDelikatDocuments();
      setDocs(all.filter((d) => ['draft', 'review', 'needs_update'].includes(d.metadata.status ?? '')));
    } catch (err: any) {
      setError(err.message ?? 'Failed to load queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (doc: DelikatDoc) => {
    setProcessing((p) => ({ ...p, [doc.id]: 'approving' }));
    try {
      await updateDocumentStatus(doc.id, 'approved');
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err: any) {
      setError(err.message ?? 'Approve failed.');
    } finally {
      setProcessing((p) => { const n = { ...p }; delete n[doc.id]; return n; });
    }
  };

  const handleReject = async (doc: DelikatDoc) => {
    setProcessing((p) => ({ ...p, [doc.id]: 'rejecting' }));
    try {
      await updateDocumentStatus(doc.id, 'rejected');
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err: any) {
      setError(err.message ?? 'Reject failed.');
    } finally {
      setProcessing((p) => { const n = { ...p }; delete n[doc.id]; return n; });
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-900">
      <header className="flex items-center gap-2.5 px-6 py-4 border-b border-stone-800/70 bg-stone-900/90 backdrop-blur-sm flex-shrink-0">
        <ClockIcon size={17} className="text-amber-500" />
        <div>
          <h1 className="text-sm font-semibold text-stone-200 leading-none">Review Queue</h1>
          <p className="text-[10px] text-stone-600 mt-0.5 uppercase tracking-wider">Pending approvals</p>
        </div>
        {!loading && docs.length > 0 && (
          <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-600/20 border border-amber-600/40 text-amber-400 text-xs font-semibold">
            {docs.length}
          </span>
        )}
        <button onClick={load} className="ml-auto p-1.5 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors" title="Refresh">
          <RefreshCwIcon size={14} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <span className="w-6 h-6 border-2 border-stone-700 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-900/20 border border-red-700/40 rounded-lg mb-4">
            <AlertCircleIcon size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && docs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <InboxIcon size={32} className="text-stone-700 mb-3" />
            <p className="text-sm text-stone-500">Queue is empty</p>
            <p className="text-xs text-stone-600 mt-1">No documents with status draft, review, or needs_update.</p>
          </div>
        )}

        {!loading && docs.length > 0 && (
          <div className="max-w-3xl mx-auto space-y-3">
            {docs.map((doc) => {
              const m = doc.metadata;
              const isProcessing = !!processing[doc.id];
              const preview = doc.content.replace(/\s+/g, ' ').trim().slice(0, 200);
              return (
                <div key={doc.id} className={`rounded-xl bg-stone-800/40 border border-stone-700/40 transition-all ${isProcessing ? 'opacity-50' : 'hover:border-stone-600/60'}`}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {m.status && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_STYLES[m.status] ?? 'bg-stone-800 text-stone-400 border-stone-700'}`}>
                            {m.status}
                          </span>
                        )}
                        {m.category && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_STYLES[m.category] ?? CATEGORY_STYLES.Franchise}`}>
                            {m.category}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-600 flex-shrink-0">{formatDate(doc.created_at)}</span>
                    </div>

                    <h3 className="text-sm font-semibold text-stone-100 mb-2">{m.title ?? 'Untitled'}</h3>
                    <p className="text-xs text-stone-500 leading-relaxed line-clamp-3">{preview}…</p>
                  </div>

                  <div className="px-4 py-3 border-t border-stone-700/30 flex items-center gap-2">
                    <button
                      onClick={() => onEditDoc({ id: doc.id, title: m.title ?? '', category: m.category ?? 'Operations', content: doc.content })}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-700/50 border border-stone-700/50 transition-all disabled:opacity-40"
                    >
                      <PencilIcon size={12} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleApprove(doc)}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20 border border-emerald-700/40 transition-all disabled:opacity-40"
                    >
                      {processing[doc.id] === 'approving' ? (
                        <span className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckIcon size={12} />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(doc)}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-700/40 transition-all disabled:opacity-40"
                    >
                      {processing[doc.id] === 'rejecting' ? (
                        <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <XIcon size={12} />
                      )}
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
