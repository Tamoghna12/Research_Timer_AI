import type { Session } from '../data/types';
import { formatRange } from '../utils/weekUtils';
import { getLinkTitle, getLinkRefTitle } from '../utils/linkUtils';
import { TIMER_PRESETS } from '../data/types';
import { millisecondsToMinutes } from '../utils/time';
import { format } from 'date-fns';

export type WeeklyInputs = {
  sessions: Session[];
  start: Date;
  end: Date;
  analytics: {
    totalFocusTimeMin: number;
    sessionsCompleted: number;
    avgSessionLengthMin: number;
    completionRatePct: number;
    modeDist: Record<string, number>;
    tagDist: Record<string, number>;
    tagOtherMin: number;
  };
  researcher?: { name?: string; affiliation?: string };
};

/**
 * Generate bullets from AI summary (already in markdown format)
 */
function extractBulletsFromAiSummary(aiSummary: string): string[] {
  return aiSummary
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 5); // Max 5 bullets
}

/**
 * Generate bullets from journal based on session mode
 */
function extractBulletsFromJournal(session: Session): string[] {
  if (!session.journal) return [];

  const bullets: string[] = [];

  switch (session.journal.kind) {
    case 'lit':
      if (session.journal.keyClaim) {
        bullets.push(`**Key Claim:** ${session.journal.keyClaim}`);
      }
      if (session.journal.method) {
        bullets.push(`**Method:** ${session.journal.method}`);
      }
      if (session.journal.limitation) {
        bullets.push(`**Limitation:** ${session.journal.limitation}`);
      }
      break;

    case 'writing':
      if (session.journal.wordsAdded !== null && session.journal.wordsAdded !== undefined) {
        bullets.push(`**Words Added:** ${session.journal.wordsAdded}`);
      }
      if (session.journal.sectionsTouched) {
        bullets.push(`**Sections:** ${session.journal.sectionsTouched}`);
      }
      break;

    case 'analysis':
      if (session.journal.nextStep) {
        bullets.push(`**Next Step:** ${session.journal.nextStep}`);
      }
      if (session.journal.scriptOrNotebook) {
        bullets.push(`**Script:** ${session.journal.scriptOrNotebook}`);
      }
      if (session.journal.datasetRef) {
        bullets.push(`**Dataset:** ${session.journal.datasetRef}`);
      }
      break;

    case 'deep':
    case 'break':
      if (session.journal.whatMoved) {
        bullets.push(`**Progress:** ${session.journal.whatMoved}`);
      }
      break;
  }

  return bullets.slice(0, 5);
}

/**
 * Generate bullets from notes (fallback)
 */
function extractBulletsFromNotes(notes: string): string[] {
  if (!notes) return [];

  // Split by lines and create bullets from first few sentences/points
  const lines = notes.split('\n').filter(line => line.trim().length > 0);
  const bullets = lines.slice(0, 3).map(line => {
    const trimmed = line.trim();
    // Limit each bullet to 200 characters
    return trimmed.length > 200 ? `${trimmed.substring(0, 197)}...` : trimmed;
  });

  return bullets;
}

/**
 * Select top highlighted sessions based on priority rules
 */
function selectHighlightedSessions(sessions: Session[]): Session[] {
  const linkedSessions = sessions.filter(s =>
    s.status === 'completed' &&
    ((s.links && s.links.length > 0) || (s.link && s.link.length > 0))
  );

  // Sort by priority: aiSummary > journal > notes, then by duration
  linkedSessions.sort((a, b) => {
    // Priority scoring
    const getScore = (session: Session) => {
      let score = 0;
      if (session.aiSummary) score += 1000;
      else if (session.journal) score += 100;
      else if (session.notes) score += 10;

      // Add duration as tiebreaker
      const duration = session.endedAt ? session.endedAt - session.startedAt : 0;
      score += Math.min(duration / 60000, 90); // Cap at 90 minutes for scoring

      return score;
    };

    return getScore(b) - getScore(a);
  });

  return linkedSessions.slice(0, 3);
}

/**
 * Extract next week plan items from sessions
 */
function extractNextWeekPlan(sessions: Session[]): string[] {
  const planItems: string[] = [];

  sessions.forEach(session => {
    // Extract nextStep from Analysis journals
    if (session.journal?.kind === 'analysis' && session.journal.nextStep) {
      planItems.push(session.journal.nextStep);
    }

    // Extract TODO items from notes
    if (session.notes) {
      const todoMatches = session.notes.match(/TODO:\s*(.+)/gi);
      if (todoMatches) {
        todoMatches.forEach(match => {
          const todoText = match.replace(/TODO:\s*/i, '').trim();
          if (todoText) {
            planItems.push(todoText);
          }
        });
      }
    }
  });

  // Remove duplicates and limit length
  const uniquePlans = [...new Set(planItems)]
    .slice(0, 10) // Max 10 items
    .map(item => item.length > 150 ? `${item.substring(0, 147)}...` : item);

  return uniquePlans;
}

/**
 * Escape markdown special characters in table cells
 */
function escapeMarkdownTableCell(text: string): string {
  return text
    .replace(/\|/g, '\\|')
    .replace(/`/g, '\\`')
    .replace(/\n/g, ' ')
    .trim();
}

/**
 * Format time in hours:minutes
 */
function formatHoursMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

/**
 * Generate complete weekly report in Markdown format
 */
export function generateWeeklyReportMD(input: WeeklyInputs): string {
  const { sessions, start, end, analytics, researcher } = input;

  const lines: string[] = [];

  // Header
  lines.push(`# Weekly Report`);
  lines.push('');
  lines.push(`**Week:** ${formatRange(start, end)}`);
  lines.push('');

  if (researcher?.name || researcher?.affiliation) {
    const researcherLine = [researcher.name, researcher.affiliation]
      .filter(Boolean)
      .join(', ');
    lines.push(`**Researcher:** ${researcherLine}`);
    lines.push('');
  }

  // Summary KPIs
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Total Focus Time:** ${formatHoursMinutes(analytics.totalFocusTimeMin)}`);
  lines.push(`- **Sessions Completed:** ${analytics.sessionsCompleted}`);
  lines.push(`- **Average Session Length:** ${analytics.avgSessionLengthMin.toFixed(1)} minutes`);
  lines.push(`- **Completion Rate:** ${analytics.completionRatePct}%`);
  lines.push('');

  // Time Distribution
  lines.push('## Time Distribution');
  lines.push('');

  // By Mode
  if (Object.keys(analytics.modeDist).length > 0) {
    lines.push('### By Mode');
    lines.push('');
    Object.entries(analytics.modeDist)
      .sort((a, b) => b[1] - a[1])
      .forEach(([mode, minutes]) => {
        const preset = TIMER_PRESETS.find(p => p.id === mode);
        const modeName = preset?.name || mode;
        lines.push(`- **${modeName}:** ${formatHoursMinutes(minutes)}`);
      });
    lines.push('');
  }

  // By Tags
  if (Object.keys(analytics.tagDist).length > 0) {
    lines.push('### Top Focus Areas');
    lines.push('');
    Object.entries(analytics.tagDist)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tag, minutes]) => {
        lines.push(`- **${tag}:** ${formatHoursMinutes(minutes)}`);
      });

    if (analytics.tagOtherMin > 0) {
      lines.push(`- **Other:** ${formatHoursMinutes(analytics.tagOtherMin)}`);
    }
    lines.push('');
  }

  // Highlights
  const highlightedSessions = selectHighlightedSessions(sessions);
  if (highlightedSessions.length > 0) {
    lines.push('## Highlights');
    lines.push('');

    highlightedSessions.forEach((session) => {
      const preset = TIMER_PRESETS.find(p => p.id === session.mode);
      const modeName = preset?.name || session.mode;
      // Get link title from new links array or legacy link
      const linkTitle = session.links && session.links.length > 0
        ? getLinkRefTitle(session.links[0]) // Show first link in title
        : (session.link ? getLinkTitle(session.link) : '');
      const date = format(new Date(session.startedAt), 'MMM dd');

      lines.push(`### ${modeName} - ${date}${linkTitle ? ` (${linkTitle})` : ''}`);
      lines.push('');

      if (session.goal) {
        lines.push(`**Goal:** ${session.goal}`);
        lines.push('');
      }

      // Extract bullets with priority: AI summary > journal > notes
      let bullets: string[] = [];
      let isAi = false;

      if (session.aiSummary) {
        bullets = extractBulletsFromAiSummary(session.aiSummary);
        isAi = true;
      } else if (session.journal) {
        bullets = extractBulletsFromJournal(session);
      } else if (session.notes) {
        bullets = extractBulletsFromNotes(session.notes);
      }

      if (bullets.length > 0) {
        bullets.forEach(bullet => {
          // Ensure bullets start with - or •
          const formattedBullet = bullet.startsWith('•') || bullet.startsWith('-')
            ? bullet
            : `• ${bullet}`;
          lines.push(formattedBullet);
        });

        if (isAi) {
          lines.push('');
          lines.push('*AI-assisted summary*');
        }
      }

      lines.push('');
    });
  }

  // Session Log (Appendix)
  lines.push('## Session Log (Appendix)');
  lines.push('');

  const completedSessions = sessions
    .filter(s => s.status === 'completed')
    .sort((a, b) => b.startedAt - a.startedAt);

  if (completedSessions.length > 0) {
    // Table header
    lines.push('| Date | Mode | Goal | Tags | Links | Duration | Journal |');
    lines.push('|------|------|------|------|-------|----------|---------|');

    completedSessions.forEach(session => {
      const preset = TIMER_PRESETS.find(p => p.id === session.mode);
      const modeName = preset?.name || session.mode;
      const date = format(new Date(session.startedAt), 'MMM dd');
      const duration = session.endedAt ? millisecondsToMinutes(session.endedAt - session.startedAt) : 0;

      const goal = escapeMarkdownTableCell(session.goal || '-');
      const tags = escapeMarkdownTableCell(session.tags.join(', ') || '-');
      // Handle new links array or legacy link
      const links = session.links && session.links.length > 0
        ? escapeMarkdownTableCell(session.links.map(link => getLinkRefTitle(link)).join(', '))
        : (session.link ? escapeMarkdownTableCell(getLinkTitle(session.link)) : '-');
      const journalBadge = session.journal ? (session.aiSummary ? 'AI+Journal' : 'Journal') :
                          session.aiSummary ? 'AI' : '-';

      lines.push(`| ${date} | ${modeName} | ${goal} | ${tags} | ${links} | ${duration}m | ${journalBadge} |`);
    });
  } else {
    lines.push('*No completed sessions this week.*');
  }

  lines.push('');

  // Next Week Plan
  const planItems = extractNextWeekPlan(sessions);
  lines.push('## Next Week Plan');
  lines.push('');

  if (planItems.length > 0) {
    planItems.forEach(item => {
      lines.push(`- [ ] ${item}`);
    });
  } else {
    lines.push('*No specific plans identified from this week\'s sessions.*');
    lines.push('');
    lines.push('Consider adding TODO items in your session notes or next steps in analysis journals.');
  }

  lines.push('');
  lines.push('---');
  lines.push('*Generated by Research Timer Pro*');

  return lines.join('\n');
}