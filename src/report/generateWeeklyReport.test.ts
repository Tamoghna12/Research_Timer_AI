import { describe, it, expect } from 'vitest';
import { generateWeeklyReportMD } from './generateWeeklyReport';
import type { Session } from '../data/types';
import type { WeeklyInputs } from './generateWeeklyReport';

describe('generateWeeklyReportMD', () => {
  const baseSession: Session = {
    id: 'session-1',
    mode: 'lit',
    plannedMs: 25 * 60 * 1000,
    startedAt: Date.UTC(2024, 0, 10, 10, 0), // Wednesday
    endedAt: Date.UTC(2024, 0, 10, 10, 25),
    status: 'completed',
    tags: ['#research', '#literature'],
    goal: 'Review transformer papers',
    notes: 'Found interesting papers on attention mechanisms',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const baseInputs: WeeklyInputs = {
    sessions: [],
    start: new Date(Date.UTC(2024, 0, 8)), // Monday
    end: new Date(Date.UTC(2024, 0, 14, 23, 59, 59, 999)), // Sunday
    analytics: {
      totalFocusTimeMin: 120,
      sessionsCompleted: 5,
      avgSessionLengthMin: 24.0,
      completionRatePct: 85,
      modeDist: { 'lit': 60, 'writing': 45, 'analysis': 15 },
      tagDist: { '#research': 90, '#literature': 30 },
      tagOtherMin: 0
    }
  };

  describe('Header generation', () => {
    it('should produce correct header with date range', () => {
      const report = generateWeeklyReportMD(baseInputs);

      expect(report).toContain('# Weekly Report');
      expect(report).toContain('Mon 08 Jan 2024');
    });

    it('should include researcher info when provided', () => {
      const inputsWithResearcher: WeeklyInputs = {
        ...baseInputs,
        researcher: { name: 'Dr. Jane Smith', affiliation: 'MIT' }
      };

      const report = generateWeeklyReportMD(inputsWithResearcher);

      expect(report).toContain('**Researcher:** Dr. Jane Smith, MIT');
    });

    it('should include only name when affiliation is missing', () => {
      const inputsWithResearcher: WeeklyInputs = {
        ...baseInputs,
        researcher: { name: 'Dr. Jane Smith' }
      };

      const report = generateWeeklyReportMD(inputsWithResearcher);

      expect(report).toContain('**Researcher:** Dr. Jane Smith');
    });

    it('should skip researcher line when not provided', () => {
      const report = generateWeeklyReportMD(baseInputs);

      expect(report).not.toContain('**Researcher:**');
    });
  });

  describe('KPIs section', () => {
    it('should include all analytics KPIs with correct formatting', () => {
      const report = generateWeeklyReportMD(baseInputs);

      expect(report).toContain('## Summary');
      expect(report).toContain('**Total Focus Time:** 2h');
      expect(report).toContain('**Sessions Completed:** 5');
      expect(report).toContain('**Average Session Length:** 24.0 minutes');
      expect(report).toContain('**Completion Rate:** 85%');
    });

    it('should format time correctly for different durations', () => {
      const inputs: WeeklyInputs = {
        ...baseInputs,
        analytics: {
          ...baseInputs.analytics,
          totalFocusTimeMin: 95 // 1h 35m
        }
      };

      const report = generateWeeklyReportMD(inputs);
      expect(report).toContain('**Total Focus Time:** 1h 35m');
    });

    it('should handle zero minutes correctly', () => {
      const inputs: WeeklyInputs = {
        ...baseInputs,
        analytics: {
          ...baseInputs.analytics,
          totalFocusTimeMin: 0
        }
      };

      const report = generateWeeklyReportMD(inputs);
      expect(report).toContain('**Total Focus Time:** 0m');
    });
  });

  describe('Time distribution', () => {
    it('should list mode distribution sorted by time descending', () => {
      const report = generateWeeklyReportMD(baseInputs);

      expect(report).toContain('### By Mode');
      expect(report).toContain('- **Lit Review:** 1h');
      expect(report).toContain('- **Writing:** 45m');
      expect(report).toContain('- **Analysis:** 15m');

      // Check order (lit should come first with 60 minutes)
      const litIndex = report.indexOf('**Lit Review:**');
      const writingIndex = report.indexOf('**Writing:**');
      expect(litIndex).toBeLessThan(writingIndex);
    });

    it('should list tag distribution with other category', () => {
      const inputs: WeeklyInputs = {
        ...baseInputs,
        analytics: {
          ...baseInputs.analytics,
          tagOtherMin: 20
        }
      };

      const report = generateWeeklyReportMD(inputs);

      expect(report).toContain('### Top Focus Areas');
      expect(report).toContain('- **#research:** 1h 30m');
      expect(report).toContain('- **#literature:** 30m');
      expect(report).toContain('- **Other:** 20m');
    });
  });

  describe('Highlights selection and formatting', () => {
    it('should prioritize sessions with AI summaries', () => {
      const sessionWithAi: Session = {
        ...baseSession,
        id: 'ai-session',
        link: 'https://arxiv.org/abs/2301.12345',
        aiSummary: '• Found important insights about transformers\n• Identified research gaps\n• Next steps defined'
      };

      const sessionWithJournal: Session = {
        ...baseSession,
        id: 'journal-session',
        startedAt: Date.UTC(2024, 0, 11, 10, 0),
        endedAt: Date.UTC(2024, 0, 11, 10, 30),
        link: 'https://github.com/user/repo',
        journal: {
          kind: 'lit',
          keyClaim: 'Transformers are effective',
          method: 'Literature review',
          limitation: 'Limited scope'
        }
      };

      const inputs: WeeklyInputs = {
        ...baseInputs,
        sessions: [sessionWithJournal, sessionWithAi] // Order shouldn't matter
      };

      const report = generateWeeklyReportMD(inputs);

      expect(report).toContain('## Highlights');
      expect(report).toContain('arXiv:2301.12345');
      expect(report).toContain('Found important insights about transformers');
      expect(report).toContain('*AI-assisted summary*');
    });

    it('should extract bullets from journal based on mode', () => {
      const litSession: Session = {
        ...baseSession,
        link: 'https://example.com',
        journal: {
          kind: 'lit',
          keyClaim: 'Key finding here',
          method: 'Survey methodology',
          limitation: 'Sample size limited'
        }
      };

      const inputs: WeeklyInputs = {
        ...baseInputs,
        sessions: [litSession]
      };

      const report = generateWeeklyReportMD(inputs);

      expect(report).toContain('**Key Claim:** Key finding here');
      expect(report).toContain('**Method:** Survey methodology');
      expect(report).toContain('**Limitation:** Sample size limited');
    });

    it('should handle writing journal format', () => {
      const writingSession: Session = {
        ...baseSession,
        mode: 'writing',
        link: 'https://overleaf.com/project/123',
        journal: {
          kind: 'writing',
          wordsAdded: 500,
          sectionsTouched: 'Introduction, Methods'
        }
      };

      const inputs: WeeklyInputs = {
        ...baseInputs,
        sessions: [writingSession]
      };

      const report = generateWeeklyReportMD(inputs);

      expect(report).toContain('**Words Added:** 500');
      expect(report).toContain('**Sections:** Introduction, Methods');
    });

    it('should handle analysis journal format', () => {
      const analysisSession: Session = {
        ...baseSession,
        mode: 'analysis',
        link: 'https://github.com/user/analysis',
        journal: {
          kind: 'analysis',
          nextStep: 'Run correlation analysis',
          scriptOrNotebook: 'analysis.ipynb',
          datasetRef: 'survey_data.csv'
        }
      };

      const inputs: WeeklyInputs = {
        ...baseInputs,
        sessions: [analysisSession]
      };

      const report = generateWeeklyReportMD(inputs);

      expect(report).toContain('**Next Step:** Run correlation analysis');
      expect(report).toContain('**Script:** analysis.ipynb');
      expect(report).toContain('**Dataset:** survey_data.csv');
    });

    it('should fallback to notes when no journal or AI summary', () => {
      const sessionWithNotes: Session = {
        ...baseSession,
        link: 'https://example.com',
        notes: 'First point here\nSecond important finding\nThird observation'
      };

      const inputs: WeeklyInputs = {
        ...baseInputs,
        sessions: [sessionWithNotes]
      };

      const report = generateWeeklyReportMD(inputs);

      expect(report).toContain('• First point here');
      expect(report).toContain('• Second important finding');
      expect(report).toContain('• Third observation');
    });

    it('should limit to 3 highlighted sessions', () => {
      const sessions: Session[] = Array.from({ length: 5 }, (_, i) => ({
        ...baseSession,
        id: `session-${i}`,
        startedAt: Date.UTC(2024, 0, 10 + i, 10, 0),
        endedAt: Date.UTC(2024, 0, 10 + i, 10, 30),
        link: `https://example.com/${i}`
      }));

      const inputs: WeeklyInputs = {
        ...baseInputs,
        sessions
      };

      const report = generateWeeklyReportMD(inputs);

      // Count the number of highlight sections (### followed by mode name)
      const highlightMatches = report.match(/### \w+.*- \w+ \d+/g);
      expect(highlightMatches?.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Session log table', () => {
    it('should generate correct table headers and rows', () => {
      const session: Session = {
        ...baseSession,
        link: 'https://github.com/user/repo',
        journal: {
          kind: 'lit',
          keyClaim: 'Key finding',
          method: 'Survey',
          limitation: 'Limited'
        }
      };

      const inputs: WeeklyInputs = {
        ...baseInputs,
        sessions: [session]
      };

      const report = generateWeeklyReportMD(inputs);

      expect(report).toContain('## Session Log (Appendix)');
      expect(report).toContain('| Date | Mode | Goal | Tags | Links | Duration | Journal |');
      expect(report).toContain('|------|------|------|------|-------|----------|---------|');
      expect(report).toContain('| Jan 10 | Lit Review | Review transformer papers | #research, #literature | user/repo | 25m | Journal |');
    });

    it('should escape markdown table characters', () => {
      const sessionWithPipes: Session = {
        ...baseSession,
        goal: 'Test | with | pipes',
        notes: 'Notes with `backticks`'
      };

      const inputs: WeeklyInputs = {
        ...baseInputs,
        sessions: [sessionWithPipes]
      };

      const report = generateWeeklyReportMD(inputs);

      expect(report).toContain('Test \\| with \\| pipes');
    });

    it('should show correct journal badges', () => {
      const sessions: Session[] = [
        { ...baseSession, id: '1', journal: { kind: 'lit', keyClaim: 'test', method: '', limitation: '' } },
        { ...baseSession, id: '2', aiSummary: '• AI summary' },
        {
          ...baseSession,
          id: '3',
          journal: { kind: 'lit', keyClaim: 'test', method: '', limitation: '' },
          aiSummary: '• Both AI and journal'
        },
        { ...baseSession, id: '4' }
      ];

      const inputs: WeeklyInputs = {
        ...baseInputs,
        sessions
      };

      const report = generateWeeklyReportMD(inputs);

      expect(report).toContain('Journal |');
      expect(report).toContain('AI |');
      expect(report).toContain('AI+Journal |');
      expect(report).toContain('- |');
    });
  });

  describe('Next week plan', () => {
    it('should extract next steps from analysis journals', () => {
      const analysisSession: Session = {
        ...baseSession,
        mode: 'analysis',
        journal: {
          kind: 'analysis',
          nextStep: 'Run statistical analysis on dataset',
          scriptOrNotebook: '',
          datasetRef: ''
        }
      };

      const inputs: WeeklyInputs = {
        ...baseInputs,
        sessions: [analysisSession]
      };

      const report = generateWeeklyReportMD(inputs);

      expect(report).toContain('## Next Week Plan');
      expect(report).toContain('- [ ] Run statistical analysis on dataset');
    });

    it('should extract TODO items from notes', () => {
      const sessionWithTodos: Session = {
        ...baseSession,
        notes: 'Some notes here\nTODO: Complete the analysis\nMore notes\ntodo: Write the report\nFinal notes'
      };

      const inputs: WeeklyInputs = {
        ...baseInputs,
        sessions: [sessionWithTodos]
      };

      const report = generateWeeklyReportMD(inputs);

      expect(report).toContain('- [ ] Complete the analysis');
      expect(report).toContain('- [ ] Write the report');
    });

    it('should remove duplicate plan items', () => {
      const sessions: Session[] = [
        {
          ...baseSession,
          id: '1',
          mode: 'analysis',
          journal: {
            kind: 'analysis',
            nextStep: 'Analyze the data',
            scriptOrNotebook: '',
            datasetRef: ''
          }
        },
        {
          ...baseSession,
          id: '2',
          notes: 'TODO: Analyze the data'
        }
      ];

      const inputs: WeeklyInputs = {
        ...baseInputs,
        sessions
      };

      const report = generateWeeklyReportMD(inputs);

      const matches = (report.match(/- \[ \] Analyze the data/g) || []);
      expect(matches.length).toBe(1);
    });

    it('should show default message when no plans found', () => {
      const inputs: WeeklyInputs = {
        ...baseInputs,
        sessions: [baseSession]
      };

      const report = generateWeeklyReportMD(inputs);

      expect(report).toContain('*No specific plans identified from this week\'s sessions.*');
      expect(report).toContain('Consider adding TODO items in your session notes');
    });

    it('should limit plan items to 10', () => {
      const sessionWithManyTodos: Session = {
        ...baseSession,
        notes: Array.from({ length: 15 }, (_, i) => `TODO: Task ${i + 1}`).join('\n')
      };

      const inputs: WeeklyInputs = {
        ...baseInputs,
        sessions: [sessionWithManyTodos]
      };

      const report = generateWeeklyReportMD(inputs);

      const todoMatches = (report.match(/- \[ \] Task/g) || []);
      expect(todoMatches.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Footer and structure', () => {
    it('should include generated attribution', () => {
      const report = generateWeeklyReportMD(baseInputs);

      expect(report).toContain('*Generated by Research Timer Pro*');
    });

    it('should have proper markdown structure with line breaks', () => {
      const report = generateWeeklyReportMD(baseInputs);
      const lines = report.split('\n');

      // Should have consistent spacing
      expect(lines[0]).toBe('# Weekly Report');
      expect(lines[1]).toBe('');
      expect(lines[2]).toContain('**Week:**');
    });

    it('should keep lines under 100 characters where possible', () => {
      const report = generateWeeklyReportMD(baseInputs);
      const lines = report.split('\n');

      // Check that most lines are reasonably short (allowing some flexibility for data)
      const longLines = lines.filter(line => line.length > 100);
      const totalLines = lines.length;

      // Most lines should be under 100 chars (allowing some exceptions for data)
      expect(longLines.length / totalLines).toBeLessThan(0.3);
    });
  });
});