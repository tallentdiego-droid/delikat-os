import { supabase, supabaseUrl, supabaseAnonKey } from './lib/supabase';
import { Source, DelikatDoc, GapSuggestion } from './types';

async function callSopBuilder(body: object): Promise<any> {
  const response = await fetch(`${supabaseUrl}/functions/v1/sop-builder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(body),
  });
  const text = await response.text().catch(() => response.statusText);
  if (!response.ok) throw new Error(text || `Edge function returned ${response.status}`);
  const data = JSON.parse(text);
  if (data.error) throw new Error(data.error);
  return data;
}

export async function askDelikat(question: string): Promise<{ answer: string; sources: Source[] }> {
  const response = await fetch(`${supabaseUrl}/functions/v1/ask-delikat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(text || `Edge function returned ${response.status}`);
  }
  const data = await response.json();
  return {
    answer: data?.answer ?? '',
    sources: (data?.sources ?? []).map((s: any): Source => ({
      title: s.metadata?.title ?? s.title ?? 'Untitled source.',
      url: s.url,
    })),
  };
}

export async function generateSOP(
  title: string,
  description: string,
  category: string
): Promise<{ draft: string }> {
  const data = await callSopBuilder({ action: 'generate', title, description, category });
  return { draft: data.draft };
}

export async function saveSOP(
  title: string,
  content: string,
  category: string
): Promise<{ id: string }> {
  const data = await callSopBuilder({ action: 'save', title, content, category });
  return { id: data.id };
}

export async function updateSOP(
  id: string,
  title: string,
  content: string,
  category: string
): Promise<void> {
  await callSopBuilder({ action: 'update', id, title, content, category });
}

export async function analyzeSopGaps(
  existingDocs: { title: string; category: string }[]
): Promise<GapSuggestion[]> {
  const data = await callSopBuilder({ action: 'analyze-gaps', existingDocs });
  return data.gaps ?? [];
}

export async function fetchDelikatDocuments(): Promise<DelikatDoc[]> {
  const data = await callSopBuilder({ action: 'list' });
  return (data.documents ?? []) as DelikatDoc[];
}

export async function updateDocumentStatus(id: string, status: string): Promise<void> {
  await callSopBuilder({ action: 'update-status', id, status });
}
