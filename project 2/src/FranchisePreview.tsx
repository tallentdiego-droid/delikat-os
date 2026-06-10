import React, { useState, useCallback } from 'react';
import {
  ChefHatIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  GraduationCapIcon,
  CheckSquareIcon,
  HeadphonesIcon,
  MessageSquareIcon,
  SearchIcon,
  XIcon,
  ShieldIcon,
} from 'lucide-react';
import { Chat, Message, DelikatDoc } from './types';
import { askDelikat, fetchDelikatDocuments } from './api';
import { generateId, createNewChat } from './utils';
import ChatView from './ChatView';

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

function DocPanel({ doc, onClose }: { doc: DelikatDoc; onClose: () => void }) {
  const m = doc.metadata;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-xl h-full bg-stone-900 border-l border-stone-700/60 flex flex-col shadow-2xl">
        <div className="flex items-start justify-between px-5 py-4 border-b border-stone-800/70 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-[10px] text-emerald-500 uppercase tracking-wider mb-1">Approved Manual</p>
            <h2 className="text-sm font-semibold text-stone-100">{m.title ?? 'Untitled'}</h2>
            {m.category && (
              <span className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_STYLES[m.category] ?? CATEGORY_STYLES.Franchise}`}>
                {m.category}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors flex-shrink-0">
            <XIcon size={16} />
          </button>
        </div>
        <div className="px-5 py-3 border-b border-stone-800/50 flex-shrink-0">
          <p className="text-xs text-stone-500"><span className="text-stone-600">Last updated:</span> {formatDate(doc.created_at)}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm text-stone-300 whitespace-pre-wrap leading-7 font-mono">{doc.content}</p>
        </div>
      </div>
    </div>
  );
}

type FranchiseTab = 'chat' | 'manuals' | 'training' | 'checklists' | 'support';

const TABS: { id: FranchiseTab; label: string; icon: React.ReactNode }[] = [
  { id: 'chat',       label: 'Ask Delikat OS',   icon: <MessageSquareIcon size={14} /> },
  { id: 'manuals',    label: 'Approved Manuals', icon: <BookOpenIcon size={14} /> },
  { id: 'training',   label: 'Training',         icon: <GraduationCapIcon size={14} /> },
  { id: 'checklists', label: 'Checklists',       icon: <CheckSquareIcon size={14} /> },
  { id: 'support',    label: 'Support',          icon: <HeadphonesIcon size={14} /> },
];

interface FranchisePreviewProps {
  onExitPreview: () => void;
}

export default function FranchisePreview({ onExitPreview }: FranchisePreviewProps) {
  const [activeTab, setActiveTab] = useState<FranchiseTab>('chat');

  // Chat state
  const [chats, setChats] = useState<Chat[]>([createNewChat()]);
  const [activeChatId, setActiveChatId] = useState<string>(() => chats[0].id);
  const [isLoading, setIsLoading] = useState(false);

  // Manuals state
  const [manuals, setManuals] = useState<DelikatDoc[] | null>(null);
  const [manualsLoading, setManualsLoading] = useState(false);
  const [manualsError, setManualsError] = useState('');
  const [manualsSearch, setManualsSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DelikatDoc | null>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);

  const handleNewChat = useCallback(() => {
    const chat = createNewChat();
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
  }, []);

  const handleSend = useCallback(async (question: string) => {
    if (!question || isLoading || !activeChatId) return;
    const userMsg: Message = { id: generateId(), role: 'user', content: question, timestamp: new Date() };
    const loadingMsg: Message = { id: generateId(), role: 'assistant', content: '', timestamp: new Date(), isLoading: true };
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        const title = c.messages.length === 0 ? question.slice(0, 40) + (question.length > 40 ? '…' : '') : c.title;
        return { ...c, title, messages: [...c.messages, userMsg, loadingMsg] };
      })
    );
    setIsLoading(true);
    try {
      const { answer, sources } = await askDelikat(question);
      const assistantMsg: Message = { id: loadingMsg.id, role: 'assistant', content: answer, sources, timestamp: new Date(), isLoading: false };
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== activeChatId) return c;
          return { ...c, messages: c.messages.map((m) => (m.id === loadingMsg.id ? assistantMsg : m)) };
        })
      );
    } catch {
      const errorMsg: Message = { id: loadingMsg.id, role: 'assistant', content: 'Something went wrong. Please try again.', timestamp: new Date(), isLoading: false };
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== activeChatId) return c;
          return { ...c, messages: c.messages.map((m) => (m.id === loadingMsg.id ? errorMsg : m)) };
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, activeChatId]);

  const loadManuals = useCallback(async () => {
    setManualsLoading(true);
    setManualsError('');
    try {
      const docs = await fetchDelikatDocuments();
      setManuals(docs.filter((d) => d.metadata.status === 'approved'));
    } catch (err: any) {
      setManualsError(err.message ?? 'Failed to load manuals.');
    } finally {
      setManualsLoading(false);
    }
  }, []);

  const handleTabChange = (tab: FranchiseTab) => {
    setActiveTab(tab);
    if (tab === 'manuals' && manuals === null) loadManuals();
  };

  const filteredManuals = (manuals ?? []).filter((d) => {
    if (!manualsSearch) return true;
    return (d.metadata.title ?? '').toLowerCase().includes(manualsSearch.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-stone-900">
      {/* Franchise header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-emerald-900/40 bg-emerald-950/20 flex-shrink-0">
        <button
          onClick={onExitPreview}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 transition-colors"
        >
          <ArrowLeftIcon size={13} />
          Admin HQ
        </button>
        <div className="h-4 w-px bg-stone-700" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center">
            <ChefHatIcon size={12} className="text-stone-950" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-400 leading-none">Delikat Franchise Portal</p>
            <p className="text-[9px] text-stone-600 uppercase tracking-wider leading-none mt-0.5">Read-only preview</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <ShieldIcon size={12} className="text-emerald-600" />
          <span className="text-[10px] text-emerald-700 uppercase tracking-wider">Franchisee view</span>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-0 px-4 border-b border-stone-800/70 bg-stone-900/80 flex-shrink-0 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Chat */}
        {activeTab === 'chat' && (
          <ChatView
            chat={activeChat}
            isLoading={isLoading}
            onSend={handleSend}
            onNewChat={handleNewChat}
            emptyTitle="Welcome, Franchisee"
            emptyDescription="Ask anything about Delikat procedures, menus, staff policies, or operational guidelines."
            suggestedPrompts={[
              'Opening procedure for the restaurant',
              'How to handle a customer complaint',
              'Allergen and dietary requirement policy',
              'What to do if the POS system fails',
            ]}
            accentClass="bg-emerald-600 hover:bg-emerald-500"
          />
        )}

        {/* Approved Manuals */}
        {activeTab === 'manuals' && (
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-stone-800/40 flex-shrink-0">
              <div className="relative max-w-sm">
                <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
                <input
                  type="text"
                  value={manualsSearch}
                  onChange={(e) => setManualsSearch(e.target.value)}
                  placeholder="Search manuals…"
                  className="w-full bg-stone-800/60 border border-stone-700/60 rounded-lg pl-9 pr-3 py-2 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-emerald-600/50 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {manualsLoading && (
                <div className="flex items-center justify-center py-16">
                  <span className="w-6 h-6 border-2 border-stone-700 border-t-emerald-500 rounded-full animate-spin" />
                </div>
              )}
              {!manualsLoading && manualsError && (
                <p className="text-sm text-red-400">{manualsError}</p>
              )}
              {!manualsLoading && !manualsError && filteredManuals.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <BookOpenIcon size={28} className="text-stone-700 mb-3" />
                  <p className="text-sm text-stone-500">{manuals?.length === 0 ? 'No approved manuals yet.' : 'No results.'}</p>
                </div>
              )}
              {!manualsLoading && filteredManuals.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-3xl">
                  {filteredManuals.map((doc) => {
                    const m = doc.metadata;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className="text-left p-4 rounded-xl bg-stone-800/40 border border-stone-700/40 hover:border-emerald-700/40 hover:bg-stone-800/70 transition-all group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {m.category && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_STYLES[m.category] ?? CATEGORY_STYLES.Franchise}`}>
                              {m.category}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-medium text-stone-200 group-hover:text-stone-100 mb-1.5 line-clamp-2">
                          {m.title ?? 'Untitled'}
                        </h3>
                        <p className="text-xs text-stone-500 line-clamp-2">
                          {doc.content.replace(/\s+/g, ' ').trim().slice(0, 100)}…
                        </p>
                        <p className="text-[10px] text-stone-600 mt-3">{formatDate(doc.created_at)}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {selectedDoc && <DocPanel doc={selectedDoc} onClose={() => setSelectedDoc(null)} />}
          </div>
        )}

        {/* Placeholder tabs */}
        {['training', 'checklists', 'support'].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center mb-4">
              {activeTab === 'training'   && <GraduationCapIcon size={24} className="text-stone-500" />}
              {activeTab === 'checklists' && <CheckSquareIcon size={24} className="text-stone-500" />}
              {activeTab === 'support'    && <HeadphonesIcon size={24} className="text-stone-500" />}
            </div>
            <h3 className="text-base font-semibold text-stone-400 mb-1.5">
              {activeTab === 'training'   && 'Training Modules'}
              {activeTab === 'checklists' && 'Daily Checklists'}
              {activeTab === 'support'    && 'Franchise Support'}
            </h3>
            <p className="text-sm text-stone-600 max-w-xs leading-relaxed">
              {activeTab === 'training'   && 'Interactive training modules for staff onboarding and skill development.'}
              {activeTab === 'checklists' && 'Opening, closing, and operational checklists for daily use.'}
              {activeTab === 'support'    && 'Direct line to franchise support, escalation, and regional manager contact.'}
            </p>
            <span className="mt-4 px-3 py-1 rounded-full bg-stone-800 border border-stone-700 text-xs text-stone-500">
              Coming soon
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
