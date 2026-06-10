import React, { useState, useCallback } from 'react';
import {
  SparklesIcon,
  CheckIcon,
  ChevronLeftIcon,
  AlertCircleIcon,
  RotateCcwIcon,
  ClipboardListIcon,
} from 'lucide-react';
import { generateSOP, saveSOP, updateSOP } from './api';
import { SopPrefill, SopEditDoc } from './types';

const CATEGORIES = [
  'Operations', 'Kitchen', 'Bar', 'Service', 'HR',
  'Training', 'Suppliers', 'Finance', 'Franchise',
] as const;

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

type Step = 1 | 2 | 3;

function StepIndicator({ current, editMode }: { current: Step; editMode: boolean }) {
  const steps = editMode
    ? [{ n: 2 as Step, label: 'Edit' }, { n: 3 as Step, label: 'Saved' }]
    : [{ n: 1 as Step, label: 'Define' }, { n: 2 as Step, label: 'Review & Edit' }, { n: 3 as Step, label: 'Saved' }];

  return (
    <div className="flex items-start justify-center gap-0 mb-10">
      {steps.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <React.Fragment key={s.n}>
            {i > 0 && (
              <div className={`h-px w-14 mt-3.5 mx-1 flex-shrink-0 transition-colors ${done ? 'bg-amber-600' : 'bg-stone-700'}`} />
            )}
            <div className="flex flex-col items-center gap-1.5 w-20">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                done ? 'bg-amber-600 text-stone-950' : active ? 'bg-amber-600/15 border-2 border-amber-500 text-amber-400' : 'bg-stone-800 border border-stone-700 text-stone-600'
              }`}>
                {done ? <CheckIcon size={12} /> : s.n}
              </div>
              <span className={`text-[10px] uppercase tracking-wider text-center leading-tight transition-colors ${active ? 'text-amber-400' : done ? 'text-stone-400' : 'text-stone-600'}`}>
                {s.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

interface SOPBuilderProps {
  prefill?: SopPrefill;
  editDoc?: SopEditDoc;
  onSOPSaved?: () => void;
}

export default function SOPBuilder({ prefill, editDoc, onSOPSaved }: SOPBuilderProps) {
  const editMode = !!editDoc;
  const [step, setStep] = useState<Step>(editMode ? 2 : 1);
  const [title, setTitle] = useState(editDoc?.title ?? prefill?.title ?? '');
  const [category, setCategory] = useState(editDoc?.category ?? prefill?.category ?? 'Operations');
  const [description, setDescription] = useState(prefill?.description ?? '');
  const [draft, setDraft] = useState(editDoc?.content ?? '');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [genError, setGenError] = useState('');
  const [saveError, setSaveError] = useState('');

  const handleGenerate = useCallback(async () => {
    if (!title.trim() || !description.trim()) return;
    setGenerating(true);
    setGenError('');
    try {
      const { draft: generated } = await generateSOP(title.trim(), description.trim(), category);
      setDraft(generated);
      setStep(2);
    } catch (err: any) {
      setGenError(err.message ?? 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [title, description, category]);

  const handleRegenerate = useCallback(async () => {
    setGenerating(true);
    setGenError('');
    try {
      const { draft: generated } = await generateSOP(title.trim(), description.trim(), category);
      setDraft(generated);
    } catch (err: any) {
      setGenError(err.message ?? 'Regeneration failed.');
    } finally {
      setGenerating(false);
    }
  }, [title, description, category]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError('');
    try {
      if (editDoc) {
        await updateSOP(editDoc.id, title.trim(), draft, category);
      } else {
        await saveSOP(title.trim(), draft, category);
      }
      setStep(3);
      onSOPSaved?.();
    } catch (err: any) {
      setSaveError(err.message ?? 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [title, draft, category, editDoc, onSOPSaved]);

  const handleReset = () => {
    setStep(1);
    setTitle('');
    setCategory('Operations');
    setDescription('');
    setDraft('');
    setGenError('');
    setSaveError('');
  };

  return (
    <div className="flex flex-col h-full bg-stone-900">
      <header className="flex items-center gap-2.5 px-6 py-4 border-b border-stone-800/70 bg-stone-900/90 backdrop-blur-sm flex-shrink-0">
        <ClipboardListIcon size={17} className="text-amber-500" />
        <div>
          <h1 className="text-sm font-semibold text-stone-200 leading-none">
            {editMode ? 'Edit SOP' : 'SOP Builder'}
          </h1>
          <p className="text-[10px] text-stone-600 mt-0.5 uppercase tracking-wider">
            {editMode ? `Editing: ${editDoc!.title}` : 'Create structured procedures'}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <StepIndicator current={step} editMode={editMode} />

          {/* Step 1 — Define (new SOPs only) */}
          {step === 1 && !editMode && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs text-stone-500 mb-1.5 uppercase tracking-wider">Process Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Opening Checklist — Front of House"
                  className="w-full bg-stone-800/60 border border-stone-700/60 rounded-lg px-3.5 py-2.5 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-amber-600/60 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-500 mb-1.5 uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-stone-800/60 border border-stone-700/60 rounded-lg px-3.5 py-2.5 text-sm text-stone-200 outline-none focus:border-amber-600/60 transition-colors appearance-none cursor-pointer"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-stone-500 mb-1.5 uppercase tracking-wider">Describe the process</label>
                <p className="text-[11px] text-stone-600 mb-2 leading-relaxed">
                  Explain in plain language what this process involves — key steps, rules, roles, and any context you want included.
                </p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Before opening the restaurant each morning, the FOH manager checks that all tables are clean and set, the POS is running, staff have arrived and are in uniform…"
                  rows={8}
                  className="w-full bg-stone-800/60 border border-stone-700/60 rounded-lg px-3.5 py-3 text-sm text-stone-300 placeholder-stone-600 outline-none focus:border-amber-600/60 transition-colors resize-none leading-relaxed"
                />
              </div>

              {genError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-900/20 border border-red-700/40 rounded-lg">
                  <AlertCircleIcon size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">{genError}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!title.trim() || !description.trim() || generating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 text-sm font-semibold transition-all disabled:cursor-not-allowed"
              >
                {generating ? (
                  <><span className="w-4 h-4 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" />Generating SOP…</>
                ) : (
                  <><SparklesIcon size={15} />Generate SOP</>
                )}
              </button>
            </div>
          )}

          {/* Step 2 — Review & Edit */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-stone-100">{title}</h2>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Operations}`}>
                  {category}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                {editMode ? 'Review and edit the SOP content, then approve to save changes.' : 'Review and edit the generated SOP. All changes are preserved when you approve.'}
              </p>

              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={24}
                disabled={generating}
                className="w-full bg-stone-800/40 border border-stone-700/50 rounded-xl px-4 py-4 text-sm text-stone-200 outline-none focus:border-amber-600/50 transition-colors resize-none leading-7 font-mono disabled:opacity-60"
                spellCheck
              />

              {(genError || saveError) && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-900/20 border border-red-700/40 rounded-lg">
                  <AlertCircleIcon size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">{genError || saveError}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                {!editMode && (
                  <button
                    onClick={() => setStep(1)}
                    disabled={generating || saving}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-all disabled:opacity-40"
                  >
                    <ChevronLeftIcon size={14} />
                    Back
                  </button>
                )}
                {!editMode && (
                  <button
                    onClick={handleRegenerate}
                    disabled={generating || saving}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-700/50 transition-all disabled:opacity-40"
                  >
                    {generating ? (
                      <span className="w-3.5 h-3.5 border border-stone-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RotateCcwIcon size={13} />
                    )}
                    Regenerate
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!draft.trim() || saving || generating}
                  className="ml-auto flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 text-sm font-semibold transition-all disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <><span className="w-3.5 h-3.5 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" />Saving…</>
                  ) : (
                    <><CheckIcon size={14} />Approve & Save</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Saved */}
          {step === 3 && (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-900/30 border border-emerald-600/40 flex items-center justify-center mb-5">
                <CheckIcon size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-stone-100 mb-2">
                {editMode ? 'SOP Updated' : 'SOP Approved & Saved'}
              </h2>
              <p className="text-base text-stone-300 font-medium mb-1">{title}</p>
              <p className="text-sm text-stone-500 max-w-sm leading-relaxed mb-4">
                {editMode
                  ? 'The document has been updated and approved. It is now searchable via the chat.'
                  : 'This procedure has been added to the knowledge base and is now searchable via the chat.'}
              </p>
              <div className="flex items-center gap-2 mb-10">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Operations}`}>
                  {category}
                </span>
                <span className="text-xs text-stone-600">·</span>
                <span className="text-xs text-stone-600">status: approved</span>
              </div>
              {!editMode && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-sm font-semibold transition-all"
                >
                  <SparklesIcon size={14} />
                  Create Another SOP
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
