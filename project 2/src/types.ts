export interface Source {
  title: string;
  url?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: Date;
  isLoading?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: Date;
  messages: Message[];
}

export interface DelikatDoc {
  id: string;
  content: string;
  metadata: {
    title?: string;
    category?: string;
    status?: string;
    source_path?: string;
    created_by?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

export interface GapSuggestion {
  title: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
  description: string;
}

export interface SopPrefill {
  title: string;
  category: string;
  description: string;
}

export interface SopEditDoc {
  id: string;
  title: string;
  category: string;
  content: string;
}
