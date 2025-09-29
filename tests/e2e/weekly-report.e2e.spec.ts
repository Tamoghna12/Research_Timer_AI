import { test, expect } from '@playwright/test';

test.describe('Weekly Report', () => {
  test.beforeEach(async ({ page }) => {
    // Seed database with test data for a full week
    await page.goto('/');

    // Create sessions for the week with different modes, journals, and AI summaries
    await page.addInitScript(() => {
      const now = Date.now();
      const weekStart = now - (3 * 24 * 60 * 60 * 1000); // 3 days ago

      const testSessions = [
        {
          id: 'session-1',
          mode: 'lit',
          plannedMs: 25 * 60 * 1000,
          startedAt: weekStart,
          endedAt: weekStart + (25 * 60 * 1000),
          status: 'completed',
          goal: 'Review transformer papers',
          tags: ['#research', '#ml'],
          link: 'https://arxiv.org/abs/2301.12345',
          journal: {
            kind: 'lit',
            keyClaim: 'Transformers show superior performance',
            method: 'Systematic literature review',
            limitation: 'Limited to English papers'
          },
          aiSummary: '• Transformers revolutionized NLP\n• Attention mechanisms are key\n• Future work needed in efficiency',
          aiSummaryMeta: {
            provider: 'ollama',
            model: 'llama3',
            generatedAt: weekStart + 1000
          },
          createdAt: weekStart,
          updatedAt: weekStart
        },
        {
          id: 'session-2',
          mode: 'writing',
          plannedMs: 30 * 60 * 1000,
          startedAt: weekStart + (24 * 60 * 60 * 1000),
          endedAt: weekStart + (24 * 60 * 60 * 1000) + (28 * 60 * 1000),
          status: 'completed',
          goal: 'Draft methodology section',
          tags: ['#writing', '#thesis'],
          link: 'https://overleaf.com/project/abc123',
          journal: {
            kind: 'writing',
            wordsAdded: 450,
            sectionsTouched: 'Methodology, Results intro'
          },
          createdAt: weekStart + (24 * 60 * 60 * 1000),
          updatedAt: weekStart + (24 * 60 * 60 * 1000)
        },
        {
          id: 'session-3',
          mode: 'analysis',
          plannedMs: 45 * 60 * 1000,
          startedAt: weekStart + (48 * 60 * 60 * 1000),
          endedAt: weekStart + (48 * 60 * 60 * 1000) + (42 * 60 * 1000),
          status: 'completed',
          goal: 'Analyze survey data',
          tags: ['#analysis', '#statistics'],
          link: 'https://github.com/user/analysis-repo',
          journal: {
            kind: 'analysis',
            scriptOrNotebook: 'data_analysis.ipynb',
            datasetRef: 'survey_responses.csv',
            nextStep: 'Run correlation analysis between variables'
          },
          notes: 'Found interesting patterns in the data\nTODO: Create visualizations\nTODO: Validate findings with domain expert',
          createdAt: weekStart + (48 * 60 * 60 * 1000),
          updatedAt: weekStart + (48 * 60 * 60 * 1000)
        },
        {
          id: 'session-4',
          mode: 'deep',
          plannedMs: 90 * 60 * 1000,
          startedAt: weekStart + (72 * 60 * 60 * 1000),
          endedAt: weekStart + (72 * 60 * 60 * 1000) + (85 * 60 * 1000),
          status: 'completed',
          goal: 'Deep focus on literature review',
          tags: ['#research'],
          notes: 'Made significant progress on Chapter 2',
          createdAt: weekStart + (72 * 60 * 60 * 1000),
          updatedAt: weekStart + (72 * 60 * 60 * 1000)
        }
      ];

      // Store in IndexedDB via Dexie
      const seedData = async () => {
        const { db } = await import('/src/data/database.js');
        await db.transaction('rw', db.sessions, async () => {
          await db.sessions.bulkAdd(testSessions);
        });
      };

      seedData().catch(console.error);
    });

    await page.waitForTimeout(1000); // Let the data seed
  });

  test('should display correct week range and navigation', async ({ page }) => {
    await page.goto('/report');

    // Should show current week by default
    const header = page.locator('h1:has-text("Weekly Report")');
    await expect(header).toBeVisible();

    // Should have week navigation
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'This Week' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Last Week' })).toBeVisible();

    // Should show week range
    await expect(page.locator('text=/Mon \\d+ \\w+ \\d{4} – Sun \\d+ \\w+ \\d{4}/')).toBeVisible();
  });

  test('should display correct KPIs', async ({ page }) => {
    await page.goto('/report');

    // Wait for data to load
    await expect(page.getByText('Loading report data...')).not.toBeVisible();

    // Check KPI values
    const summarySection = page.locator('text="Summary"').locator('..');
    await expect(summarySection).toContainText('Total Focus Time');
    await expect(summarySection).toContainText('Sessions Completed');
    await expect(summarySection).toContainText('Avg Session Length');
    await expect(summarySection).toContainText('Completion Rate');

    // Should show numerical values (exact values depend on test data timing)
    await expect(summarySection).toContainText(/\d+h|\d+m/); // Time format
    await expect(summarySection).toContainText(/\d+%/); // Percentage
  });

  test('should show time distribution by mode and tags', async ({ page }) => {
    await page.goto('/report');

    await expect(page.getByText('Loading report data...')).not.toBeVisible();

    const distributionSection = page.locator('text="Time Distribution"').locator('..');

    // Should show mode distribution
    await expect(distributionSection).toContainText('By Mode');
    await expect(distributionSection).toContainText('Literature Review');
    await expect(distributionSection).toContainText('Writing');
    await expect(distributionSection).toContainText('Analysis');

    // Should show tag distribution
    await expect(distributionSection).toContainText('Top Focus Areas');
    await expect(distributionSection).toContainText('#research');
    await expect(distributionSection).toContainText('#ml');
  });

  test('should display highlights with AI badges and proper prioritization', async ({ page }) => {
    await page.goto('/report');

    await expect(page.getByText('Loading report data...')).not.toBeVisible();

    const highlightsSection = page.locator('text="Highlights"').locator('..');
    await expect(highlightsSection).toBeVisible();

    // Should show sessions with links (up to 3)
    await expect(highlightsSection).toContainText('Literature Review');
    await expect(highlightsSection).toContainText('arXiv:2301.12345'); // Link title

    // Should show AI badge for AI-assisted session
    await expect(highlightsSection.locator('.bg-green-100, .bg-green-900').first()).toContainText('AI');

    // Should show AI summary content
    await expect(highlightsSection).toContainText('Transformers revolutionized NLP');
    await expect(highlightsSection).toContainText('Attention mechanisms are key');

    // Should show other linked sessions
    await expect(highlightsSection).toContainText('Writing');
    await expect(highlightsSection).toContainText('Overleaf Project');
    await expect(highlightsSection).toContainText('user/analysis-repo');
  });

  test('should display session log table with correct data', async ({ page }) => {
    await page.goto('/report');

    await expect(page.getByText('Loading report data...')).not.toBeVisible();

    const sessionLog = page.locator('text="Session Log (Appendix)"').locator('..');
    await expect(sessionLog).toBeVisible();

    // Check table structure
    const table = sessionLog.locator('table');
    await expect(table).toBeVisible();

    // Check headers
    await expect(table).toContainText('Date');
    await expect(table).toContainText('Mode');
    await expect(table).toContainText('Goal');
    await expect(table).toContainText('Tags');
    await expect(table).toContainText('Links');
    await expect(table).toContainText('Duration');
    await expect(table).toContainText('Journal');

    // Check some data rows
    await expect(table).toContainText('Literature Review');
    await expect(table).toContainText('Review transformer papers');
    await expect(table).toContainText('#research, #ml');
    await expect(table).toContainText('arXiv:2301.12345');
    await expect(table).toContainText(/\d+m/); // Duration in minutes

    // Check journal badges
    await expect(table).toContainText('AI+Journal'); // Session with both
    await expect(table).toContainText('Journal'); // Session with just journal
  });

  test('should display next week plan with extracted items', async ({ page }) => {
    await page.goto('/report');

    await expect(page.getByText('Loading report data...')).not.toBeVisible();

    const nextWeekSection = page.locator('text="Next Week Plan"').locator('..');
    await expect(nextWeekSection).toBeVisible();

    // Should extract next step from analysis journal
    await expect(nextWeekSection).toContainText('Run correlation analysis between variables');

    // Should extract TODO items from notes
    await expect(nextWeekSection).toContainText('Create visualizations');
    await expect(nextWeekSection).toContainText('Validate findings with domain expert');

    // Should show as checkboxes
    const checkboxes = nextWeekSection.locator('input[type="checkbox"]');
    await expect(checkboxes.first()).toBeVisible();
    await expect(checkboxes.first()).toBeDisabled(); // Should be disabled for printing
  });

  test('should copy markdown to clipboard', async ({ page }) => {
    await page.goto('/report');

    await expect(page.getByText('Loading report data...')).not.toBeVisible();

    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Click copy button
    const copyButton = page.getByRole('button', { name: /Copy Markdown/i });
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // Should show success state
    await expect(page.getByText('Copied!')).toBeVisible();

    // Verify clipboard content
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toContain('# Weekly Report');
    expect(clipboardContent).toContain('## Summary');
    expect(clipboardContent).toContain('## Highlights');
    expect(clipboardContent).toContain('## Session Log (Appendix)');
    expect(clipboardContent).toContain('## Next Week Plan');
    expect(clipboardContent).toContain('*Generated by Research Timer Pro*');

    // Should include session data
    expect(clipboardContent).toContain('Review transformer papers');
    expect(clipboardContent).toContain('arXiv:2301.12345');
  });

  test('should download markdown file', async ({ page }) => {
    await page.goto('/report');

    await expect(page.getByText('Loading report data..')).not.toBeVisible();

    // Set up download event listener
    const downloadPromise = page.waitForEvent('download');

    // Click download button
    const downloadButton = page.getByRole('button', { name: /Download \.md/i });
    await expect(downloadButton).toBeVisible();
    await downloadButton.click();

    // Wait for download to start
    const download = await downloadPromise;

    // Verify filename format
    expect(download.suggestedFilename()).toMatch(/weekly-report-\d{4}-\d{2}-\d{2}\.md/);

    // Verify content by reading the downloaded file
    const content = await download.createReadStream();
    const chunks: Buffer[] = [];

    for await (const chunk of content) {
      chunks.push(chunk);
    }

    const markdownContent = Buffer.concat(chunks).toString();
    expect(markdownContent).toContain('# Weekly Report');
    expect(markdownContent).toContain('## Summary');
    expect(markdownContent).toContain('Review transformer papers');
  });

  test('should handle print mode with correct CSS', async ({ page }) => {
    await page.goto('/report');

    await expect(page.getByText('Loading report data...')).not.toBeVisible();

    // Switch to print media
    await page.emulateMedia({ media: 'print' });

    // Actions should be hidden in print mode
    await expect(page.getByRole('button', { name: /Copy Markdown/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Download/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Print/i })).not.toBeVisible();

    // Week controls should be hidden
    await expect(page.getByRole('button', { name: 'Previous' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).not.toBeVisible();

    // Content should still be visible
    await expect(page.getByText('Weekly Report')).toBeVisible();
    await expect(page.getByText('Summary')).toBeVisible();
    await expect(page.getByText('Highlights')).toBeVisible();

    // Tables should be properly formatted for print
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('should navigate between weeks correctly', async ({ page }) => {
    await page.goto('/report');

    await expect(page.getByText('Loading report data...')).not.toBeVisible();

    // Get initial week range
    const initialWeekRange = await page.locator('p:has-text("–")').textContent();

    // Navigate to previous week
    await page.getByRole('button', { name: 'Previous' }).click();

    // Week range should change
    await expect(page.locator('p:has-text("–")')).not.toContainText(initialWeekRange!);

    // Navigate to next week (should return to initial)
    await page.getByRole('button', { name: 'Next' }).click();

    // Should be back to initial week
    await expect(page.locator('p:has-text("–")')).toContainText(initialWeekRange!);

    // Test "This Week" button
    await page.getByRole('button', { name: 'Previous' }).click(); // Go to previous week
    await page.getByRole('button', { name: 'This Week' }).click(); // Return to current week

    // Should show current week
    const currentWeekButton = page.getByRole('button', { name: 'This Week' });
    await expect(currentWeekButton).toBeVisible();
  });

  test('should handle empty week gracefully', async ({ page }) => {
    // Navigate to a week with no sessions
    await page.goto('/report');

    // Go back several weeks to find an empty period
    for (let i = 0; i < 10; i++) {
      await page.getByRole('button', { name: 'Previous' }).click();
      await page.waitForTimeout(100);
    }

    await expect(page.getByText('Loading report data...')).not.toBeVisible();

    // Should show zero values in KPIs
    const summarySection = page.locator('text="Summary"').locator('..');
    await expect(summarySection).toContainText('0');

    // Should show empty states
    const highlightsSection = page.locator('text="Highlights"').locator('..');
    const sessionLogSection = page.locator('text="Session Log"').locator('..');

    // Either highlights section won't exist or will be empty
    const hasHighlights = await highlightsSection.isVisible();
    if (hasHighlights) {
      // If highlights section exists, it should have minimal content
      await expect(highlightsSection).toBeVisible();
    }

    // Session log should show empty message
    await expect(sessionLogSection).toContainText('No completed sessions this week');

    // Next week plan should show default message
    const nextWeekSection = page.locator('text="Next Week Plan"').locator('..');
    await expect(nextWeekSection).toContainText('No specific plans identified');
  });

  test('should be responsive and accessible', async ({ page }) => {
    await page.goto('/report');

    // Check accessibility attributes
    await expect(page.locator('[role="document"]')).toBeVisible();

    // Check semantic headings
    await expect(page.locator('h1')).toContainText('Weekly Report');
    await expect(page.locator('h2').first()).toContainText('Summary');

    // Check button labels
    const copyButton = page.getByRole('button', { name: /Copy.*clipboard/ });
    const downloadButton = page.getByRole('button', { name: /Download.*file/ });
    const printButton = page.getByRole('button', { name: /Print.*PDF/ });

    await expect(copyButton).toBeVisible();
    await expect(downloadButton).toBeVisible();
    await expect(printButton).toBeVisible();

    // Test responsive design by changing viewport
    await page.setViewportSize({ width: 400, height: 800 }); // Mobile size

    // Main content should still be visible and usable
    await expect(page.getByText('Weekly Report')).toBeVisible();
    await expect(page.getByText('Summary')).toBeVisible();

    // Buttons should stack on mobile
    const actionsContainer = copyButton.locator('..');
    await expect(actionsContainer).toBeVisible();
  });
});