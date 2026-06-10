import { Chat } from './types';

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createNewChat(): Chat {
  return {
    id: generateId(),
    title: 'New Chat',
    createdAt: new Date(),
    messages: [],
  };
}
