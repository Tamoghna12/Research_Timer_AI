import type { Session, SessionJournal } from '../data/types';

export interface PromptOptions {
  mode: string;
  goal?: string;
  notes?: string;
  journalMarkdown?: string;
  bullets: number;
  maxChars: number;
}

/**
 * Convert a session journal to compact markdown representation
 */
export function journalToMarkdown(journal: SessionJournal): string {
  switch (journal.kind) {
    case 'lit':
      return [
        journal.keyClaim && `**Key Claim:** ${journal.keyClaim}`,
        journal.method && `**Method:** ${journal.method}`,
        journal.limitation && `**Limitation:** ${journal.limitation}`
      ].filter(Boolean).join('\n');

    case 'writing':
      return [
        journal.wordsAdded !== null && `**Words Added:** ${journal.wordsAdded}`,
        journal.sectionsTouched && `**Sections:** ${journal.sectionsTouched}`
      ].filter(Boolean).join('\n');

    case 'analysis':
      return [
        journal.scriptOrNotebook && `**Script/Notebook:** ${journal.scriptOrNotebook}`,
        journal.datasetRef && `**Dataset:** ${journal.datasetRef}`,
        journal.nextStep && `**Next Step:** ${journal.nextStep}`
      ].filter(Boolean).join('\n');

    case 'deep':
    case 'break':
      return journal.whatMoved ? `**Progress:** ${journal.whatMoved}` : '';

    default:
      return '';
  }
}

/**
 * Build a strict, factual prompt for AI summarization
 */
export function buildPrompt(options: PromptOptions): string {
  const { mode, goal, notes, journalMarkdown, bullets, maxChars } = options;

  // Collect available content
  const content = [];

  if (goal?.trim()) {
    content.push(`Session Goal: ${goal.trim()}`);
  }

  if (notes?.trim()) {
    content.push(`Notes: ${notes.trim()}`);
  }

  if (journalMarkdown?.trim()) {
    content.push(`Journal Entry:\n${journalMarkdown.trim()}`);
  }

  // If no meaningful content, return a minimal prompt
  if (content.length === 0) {
    return `Please provide ${bullets} brief factual bullets summarizing a ${mode} research session with minimal available information. Total length must be ≤ ${maxChars} characters. Use format:
- First bullet point
- Second bullet point
- etc.

Do not fabricate details. If information is sparse, acknowledge this in the summary.`;
  }

  // Build the main prompt
  const prompt = `Please summarize this ${mode} research session into exactly ${bullets} concise factual bullets. Total response length must be ≤ ${maxChars} characters.

Session Information:
${content.join('\n\n')}

Requirements:
- Exactly ${bullets} bullet points using "- " format
- Be factual and precise - do not fabricate information
- Quote short key phrases when useful
- Total length ≤ ${maxChars} characters
- Focus on concrete outcomes and insights
- If information is limited, provide minimal factual bullets

Format:
- First key point or outcome
- Second key point or outcome
- etc.`;

  return prompt;
}

/**
 * Build prompt from a session object with options
 */
export function buildPromptFromSession(
  session: Session,
  options: { bullets: number; maxChars: number; includeJournal: boolean }
): string {
  const journalMarkdown = options.includeJournal && session.journal
    ? journalToMarkdown(session.journal)
    : undefined;

  return buildPrompt({
    mode: session.mode,
    goal: session.goal,
    notes: session.notes,
    journalMarkdown,
    bullets: options.bullets,
    maxChars: options.maxChars
  });
}