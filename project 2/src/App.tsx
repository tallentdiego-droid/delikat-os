import React, { useState, useCallback } from 'react';
import {
  MessageSquareIcon,
  BookOpenIcon,
  ClipboardListIcon,
  ZapIcon,
  ClockIcon,
  EyeIcon,
  ChefHatIcon,
  MenuIcon,
  XIcon,
  PlusIcon,
} from 'lucide-react';
import { Chat, Message, SopPrefill, SopEditDoc } from './types';
import { askDelikat } from './api';
import { generateId, createNewChat } from './utils';
import ChatView from './ChatView';
import KnowledgeLibrary from './KnowledgeLibrary';
import SOPBuilder from './SOPBuilder';
import MissingProcesses from './MissingProcesses';
import ReviewQueue from './ReviewQueue';
import FranchisePreview from './FranchisePreview';

type ActiveView = 'chat' | 'library' | 'sop' | 'gaps' | 'review' | 'franchise';

const NAV_ITEMS: { id: ActiveView; label: string; icon: React.ReactNode; section?: 'admin' | 'franchise' }[] = [
  { id: 'chat',    label: 'Chat',               icon: <MessageSquareIcon size={14} />, section: 'admin' },
  { id: 'library', label: 'Knowledge Library',  icon: <BookOpenIcon size={14} />,     section: 'admin' },
  { id: 'sop',     label: 'SOP Builder',        icon: <ClipboardListIcon size={14} />, section: 'admin' },
  { id: 'gaps',    label: 'Missing Processes',  icon: <ZapIcon size={14} />,          section: 'admin' },
  { id: 'review',  label: 'Review Queue',       icon: <ClockIcon size={14} />,        section: 'admin' },
  { id: 'franchise', label: 'Franchise Preview', icon: <EyeIcon size={14} />,         section: 'franchise' },
];

function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  isOpen,
  onClose,
  activeView,
  onViewChange,
}: {
  chats: Chat[];
  activeChatId: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
  activeView: ActiveView;
  onViewChange: (v: ActiveView) => void;
}) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col
        bg-stone-950 border-r border-stone-800/70
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-stone-800/70">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center">
              <ChefHatIcon size={14} className="text-stone-950" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-amber-500 leading-none">Delikat</p>
              <p className="text-[9px] tracking-[0.15em] uppercase text-stone-500 leading-none mt-0.5">Admin HQ</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded text-stone-500 hover:text-stone-300 transition-colors">
            <XIcon size={16} />
          </button>
        </div>

        {/* Admin nav */}
        <nav className="px-3 py-2 space-y-0.5">
          <p className="px-3 pt-1 pb-1.5 text-[9px] uppercase tracking-[0.15em] text-stone-600">Admin HQ</p>
          {NAV_ITEMS.filter((n) => n.section === 'admin').map((item) => (
            <button
              key={item.id}
              onClick={() => { onViewChange(item.id); onClose(); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                activeView === item.id
                  ? 'bg-stone-800 text-stone-100 font-medium'
                  : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Franchise nav */}
        <nav className="px-3 py-2 border-t border-stone-800/50 space-y-0.5">
          <p className="px-3 pt-1 pb-1.5 text-[9px] uppercase tracking-[0.15em] text-stone-600">Preview</p>
          {NAV_ITEMS.filter((n) => n.section === 'franchise').map((item) => (
            <button
              key={item.id}
              onClick={() => { onViewChange(item.id); onClose(); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                activeView === item.id
                  ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40'
                  : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Chat history (visible in chat view) */}
        {activeView === 'chat' && (
          <>
            <div className="px-3 py-2 border-t border-stone-800/50">
              <button
                onClick={() => { onNewChat(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-stone-700/60 text-stone-300 hover:text-stone-100 hover:border-stone-600 hover:bg-stone-800/50 transition-all text-sm font-medium"
              >
                <PlusIcon size={14} />
                New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
              {chats.length === 0 && (
                <p className="text-xs text-stone-600 px-3 py-4 text-center">No conversations yet</p>
              )}
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => { onSelectChat(chat.id); onClose(); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all truncate ${
                    activeChatId === chat.id
                      ? 'bg-stone-800 text-stone-100 font-medium'
                      : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
                  }`}
                >
                  {chat.title}
                </button>
              ))}
            </div>
          </>
        )}

        {activeView !== 'chat' && <div className="flex-1" />}

        <div className="px-4 py-4 border-t border-stone-800/70">
          <p className="text-[10px] text-stone-600 tracking-wider uppercase">Internal Platform</p>
          <p className="text-[10px] text-stone-700 mt-0.5">v1.0 — Confidential</p>
        </div>
      </aside>
    </>
  );
}

export default function App() {
  const [chats, setChats] = useState<Chat[]>([createNewChat()]);
  const [activeChatId, setActiveChatId] = useState<string>(() => chats[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('chat');

  // SOPBuilder state — used when navigating from MissingProcesses or ReviewQueue
  const [sopPrefill, setSopPrefill] = useState<SopPrefill | null>(null);
  const [sopEditDoc, setSopEditDoc] = useState<SopEditDoc | null>(null);
  const [sopKey, setSopKey] = useState(0);

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

  const handleCreateSOPDraft = useCallback((prefill: SopPrefill) => {
    setSopPrefill(prefill);
    setSopEditDoc(null);
    setSopKey((k) => k + 1);
    setActiveView('sop');
  }, []);

  const handleEditDoc = useCallback((doc: SopEditDoc) => {
    setSopEditDoc(doc);
    setSopPrefill(null);
    setSopKey((k) => k + 1);
    setActiveView('sop');
  }, []);

  const handleSOPSaved = useCallback(() => {
    if (sopEditDoc) {
      setActiveView('review');
    }
  }, [sopEditDoc]);

  // Franchise preview is full-screen — no sidebar
  if (activeView === 'franchise') {
    return (
      <div className="flex h-screen bg-stone-900 text-stone-100 overflow-hidden">
        <FranchisePreview onExitPreview={() => setActiveView('chat')} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-900 text-stone-100 overflow-hidden">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-stone-800/70 bg-stone-900/90 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <MenuIcon size={18} />
          </button>
          <span className="text-sm font-semibold text-stone-300">
            {NAV_ITEMS.find((n) => n.id === activeView)?.label ?? 'Delikat OS'}
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {activeView === 'chat' && (
            <ChatView
              chat={activeChat}
              isLoading={isLoading}
              onSend={handleSend}
              onNewChat={handleNewChat}
            />
          )}
          {activeView === 'library' && <KnowledgeLibrary />}
          {activeView === 'sop' && (
            <SOPBuilder
              key={sopKey}
              prefill={sopPrefill ?? undefined}
              editDoc={sopEditDoc ?? undefined}
              onSOPSaved={handleSOPSaved}
            />
          )}
          {activeView === 'gaps' && (
            <MissingProcesses onCreateSOPDraft={handleCreateSOPDraft} />
          )}
          {activeView === 'review' && (
            <ReviewQueue onEditDoc={handleEditDoc} />
          )}
        </div>
      </main>
    </div>
  );
}
