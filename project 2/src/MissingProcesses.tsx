import React, { useState, useCallback } from 'react';
import { ZapIcon, AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, ChevronRightIcon } from 'lucide-react';
import { fetchDelikatDocuments, analyzeSopGaps } from './api';
import { GapSuggestion, SopPrefill } from './types';

const PRIORITY_STYLES = {
  High:   { badge: 'bg-red-900/30 text-red-400 border-red-700/40', dot: 'bg-red-400' },
  Medium: { badge: 'bg-amber-900/30 text-amber-400 border-amber-700/40', dot: 'bg-amber-400' },
  Low:    { badge: 'bg-emerald-900/30 text-emerald-400 border-emerald-700/40', dot: 'bg-emerald-400' },
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

interface MissingProcessesProps {
  onCreateSOPDraft: (prefill: SopPrefill) => void;
}

export default function MissingProcesses({ onCreateSOPDraft }: MissingProcessesProps) {
  const [gaps, setGaps] = useState<GapSuggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [docCount, setDocCount] = useState<number | null>(null);

  const handleAnalyze = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const docs = await fetchDelikatDocuments();
      setDocCount(docs.length);
      const existingDocs = docs.map((d) => ({
        title: d.metadata.title ?? '',
        category: d.metadata.category ?? '',
      }));
      const result = await analyzeSopGaps(existingDocs);
      setGaps(result);
    } catch (err: any) {
      setError(err.message ?? 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const highCount = gaps?.filter((g) => g.priority === 'High').length ?? 0;
  const midCount  = gaps?.filter((g) => g.priority === 'Medium').length ?? 0;
  const lowCount  = gaps?.filter((g) => g.priority === 'Low').length ?? 0;

  return (
    <div className="flex flex-col h-full bg-stone-900">
      <header className="flex items-center gap-2.5 px-6 py-4 border-b border-stone-800/70 bg-stone-900/90 backdrop-blur-sm flex-shrink-0">
        <ZapIcon size={17} className="text-amber-500" />
        <div>
          <h1 className="text-sm font-semibold text-stone-200 leading-none">Missing Processes</h1>
          <p className="text-[10px] text-stone-600 mt-0.5 uppercase tracking-wider">AI-powered SOP gap analysis</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {!gaps && !loading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-700/20 border border-amber-600/20 flex items-center justify-center mb-5">
              <ZapIcon size={28} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-stone-200 mb-2">Analyze Knowledge Gaps</h2>
            <p className="text-sm text-stone-500 max-w-md leading-relaxed mb-2">
              The AI will review your existing knowledge base and identify which critical restaurant processes are missing — from emergency procedures to operational protocols.
            </p>
            <p className="text-xs text-stone-600 mb-8">Checks against 15 standard restaurant process categories.</p>

            {error && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-red-900/20 border border-red-700/40 rounded-lg mb-5 max-w-sm">
                <AlertCircleIcon size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400 text-left">{error}</p>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-sm font-semibold transition-all"
            >
              <ZapIcon size={15} />
              Analyze Knowledge Gaps
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <span className="w-8 h-8 border-2 border-stone-700 border-t-amber-500 rounded-full animate-spin mb-4" />
            <p className="text-sm text-stone-400">Analyzing your knowledge base…</p>
            <p className="text-xs text-stone-600 mt-1">Comparing against 15 critical restaurant processes</p>
          </div>
        )}

        {gaps && !loading && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-stone-200">
                  {gaps.length === 0 ? 'No gaps found' : `${gaps.length} missing process${gaps.length !== 1 ? 'es' : ''} identified`}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Based on {docCount} document{docCount !== 1 ? 's' : ''} in your knowledge base
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {highCount > 0 && <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-400" />{highCount} High</span>}
                {midCount > 0 && <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-400" />{midCount} Medium</span>}
                {lowCount > 0 && <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400" />{lowCount} Low</span>}
                <button onClick={handleAnalyze} className="ml-2 text-stone-500 hover:text-stone-300 transition-colors border border-stone-700/50 hover:border-stone-600 rounded-md px-2.5 py-1">
                  Re-analyze
                </button>
              </div>
            </div>

            {gaps.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <CheckCircleIcon size={32} className="text-emerald-400 mb-3" />
                <p className="text-sm text-stone-400">Your knowledge base covers all critical restaurant processes.</p>
              </div>
            )}

            <div className="space-y-3">
              {['High', 'Medium', 'Low'].map((priority) =>
                gaps
                  .filter((g) => g.priority === priority)
                  .map((gap) => {
                    const ps = PRIORITY_STYLES[priority as keyof typeof PRIORITY_STYLES];
                    return (
                      <div key={gap.title} className="p-4 rounded-xl bg-stone-800/40 border border-stone-700/40 hover:border-stone-600/60 transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${ps.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${ps.dot}`} />
                                {priority}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_STYLES[gap.category] ?? CATEGORY_STYLES.Franchise}`}>
                                {gap.category}
                              </span>
                            </div>
                            <h3 className="text-sm font-semibold text-stone-100 mb-1">{gap.title}</h3>
                            <p className="text-xs text-stone-500 leading-relaxed mb-1">{gap.reason}</p>
                            <p className="text-xs text-stone-600 leading-relaxed">{gap.description}</p>
                          </div>
                          <button
                            onClick={() => onCreateSOPDraft({ title: gap.title, category: gap.category, description: gap.description })}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/15 hover:bg-amber-600/25 border border-amber-600/30 text-amber-400 text-xs font-medium transition-all whitespace-nowrap"
                          >
                            Create SOP Draft
                            <ChevronRightIcon size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
