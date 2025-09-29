import type { Session } from '../data/types';

export function buildSummaryPrompt(session: Session): string {
  const { goal, notes, journal } = session;

  return `
You are an assistant helping a researcher. Summarize their session into 3–5 concise bullet points (≤300 characters each).

Content may include:
- Goal: ${goal || '(none)'}
- Notes: ${notes || '(none)'}
- Journal: ${journal ? JSON.stringify(journal) : '(none)'}

Output only bullet points in plain text.
`.trim();
}