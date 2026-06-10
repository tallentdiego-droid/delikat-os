import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SendIcon, BotIcon, UserIcon, ChefHatIcon, BookOpenIcon } from 'lucide-react';
import { Chat, Message, Source } from './types';

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function SourceBadge({ source }: { source: Source }) {
  if (source.url) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-stone-700/60 text-stone-300 hover:bg-stone-600/70 hover:text-stone-100 transition-colors border border-stone-600/40"
      >
        <BookOpenIcon size={10} />
        {source.title}
      </a>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-stone-700/60 text-stone-300 border border-stone-600/40">
      <BookOpenIcon size={10} />
      {source.title}
    </span>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70 animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70 animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70 animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  if (isUser) {
    return (
      <div className="flex justify-end gap-3 group">
        <div className="max-w-[70%]">
          <div className="bg-amber-600/90 text-stone-50 px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-md">
            {message.content}
          </div>
          <p className="text-[10px] text-stone-600 mt-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(message.timestamp)}
          </p>
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-700 border border-stone-600 flex items-center justify-center mt-0.5">
          <UserIcon size={14} className="text-stone-300" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 group">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-700/40 border border-amber-600/30 flex items-center justify-center mt-0.5">
        <ChefHatIcon size={14} className="text-amber-400" />
      </div>
      <div className="max-w-[75%]">
        <div className="bg-stone-800/80 border border-stone-700/50 text-stone-200 px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-md">
          {message.isLoading ? (
            <LoadingDots />
          ) : (
            <>
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-700/50">
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1.5 font-medium">Sources</p>
                  <div className="flex flex-wrap gap-1.5">
                    {message.sources.map((src, i) => (
                      <SourceBadge key={i} source={src} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <p className="text-[10px] text-stone-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!message.isLoading && formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

interface ChatViewProps {
  chat: Chat | undefined;
  isLoading: boolean;
  onSend: (message: string) => void;
  onNewChat?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  suggestedPrompts?: string[];
  headerLeft?: React.ReactNode;
  accentClass?: string;
}

export default function ChatView({
  chat,
  isLoading,
  onSend,
  onNewChat,
  emptyTitle = 'Welcome to Delikat OS',
  emptyDescription = 'Your internal intelligence platform. Ask anything about operations, menus, staff, suppliers, or procedures.',
  suggestedPrompts = [
    "What are today's specials?",
    'Supplier contact for dry goods',
    'Closing checklist for front-of-house',
    'Allergen policy for guests',
  ],
  headerLeft,
  accentClass = 'bg-amber-600 hover:bg-amber-500',
}: ChatViewProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, isLoading, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = !chat || chat.messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 py-3.5 border-b border-stone-800/70 bg-stone-900/90 backdrop-blur-sm flex-shrink-0">
        {headerLeft}
        <div className="flex items-center gap-2 min-w-0">
          <BotIcon size={16} className="text-amber-500 flex-shrink-0" />
          <h1 className="text-sm font-semibold text-stone-200 truncate">
            {chat?.title || 'Delikat OS'}
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {onNewChat && (
            <button
              onClick={onNewChat}
              className="text-xs text-stone-500 hover:text-stone-300 transition-colors border border-stone-700/50 hover:border-stone-600 rounded-md px-2.5 py-1"
            >
              + New Chat
            </button>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-stone-500 uppercase tracking-wider">Online</span>
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-700/20 border border-amber-600/20 flex items-center justify-center mb-5">
              <ChefHatIcon size={26} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-stone-200 mb-2">{emptyTitle}</h2>
            <p className="text-sm text-stone-500 max-w-sm leading-relaxed">{emptyDescription}</p>
            {suggestedPrompts.length > 0 && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md w-full">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInput(prompt);
                      textareaRef.current?.focus();
                    }}
                    className="text-left px-4 py-3 rounded-xl bg-stone-800/60 border border-stone-700/50 text-sm text-stone-400 hover:text-stone-200 hover:border-stone-600 hover:bg-stone-800 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {chat!.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="px-4 py-4 border-t border-stone-800/70 bg-stone-900/90 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-stone-800/70 border border-stone-700/60 rounded-2xl px-4 py-3 focus-within:border-amber-600/50 focus-within:bg-stone-800 transition-all shadow-lg">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Ask Delikat OS anything…"
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-stone-200 placeholder-stone-500 resize-none outline-none leading-relaxed disabled:opacity-50 min-h-[24px] max-h-40"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`flex-shrink-0 w-8 h-8 rounded-xl ${accentClass} disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 flex items-center justify-center transition-all disabled:cursor-not-allowed`}
            >
              <SendIcon size={14} />
            </button>
          </div>
          <p className="text-[10px] text-stone-700 text-center mt-2 tracking-wide">
            Delikat OS — Internal use only. Do not share outputs externally.
          </p>
        </div>
      </div>
    </div>
  );
}
