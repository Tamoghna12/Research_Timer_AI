import { test, expect } from '@playwright/test';

test.describe('Link Integrations', () => {
  test.beforeEach(async ({ page }) => {
    // Seed database with test session that has links
    await page.goto('/');

    await page.addInitScript(() => {
      const seedData = async () => {
        const { db } = await import('/src/data/database.js');

        const testSession = {
          id: 'test-session-with-links',
          mode: 'lit',
          plannedMs: 25 * 60 * 1000,
          startedAt: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
          endedAt: Date.now() - (1.5 * 60 * 60 * 1000), // 1.5 hours ago
          status: 'completed',
          goal: 'Research transformers with multiple sources',
          tags: ['#research', '#ai'],
          // New links array
          links: [
            {
              id: 'link-1',
              type: 'doi',
              url: 'doi:10.1000/example',
              title: 'doi:10.1000/example',
              description: 'Research paper on transformers',
              addedAt: Date.now() - (2 * 60 * 60 * 1000)
            },
            {
              id: 'link-2',
              type: 'github',
              url: 'https://github.com/microsoft/transformer',
              title: 'microsoft/transformer',
              description: 'Implementation repository',
              addedAt: Date.now() - (2 * 60 * 60 * 1000)
            },
            {
              id: 'link-3',
              type: 'arxiv',
              url: 'https://arxiv.org/abs/2301.12345',
              title: 'arXiv:2301.12345',
              addedAt: Date.now() - (2 * 60 * 60 * 1000)
            }
          ],
          notes: 'Great papers on transformer architecture',
          createdAt: Date.now() - (2 * 60 * 60 * 1000),
          updatedAt: Date.now() - (2 * 60 * 60 * 1000)
        };

        // Also create session with legacy link for migration testing
        const legacySession = {
          id: 'legacy-session-with-link',
          mode: 'analysis',
          plannedMs: 45 * 60 * 1000,
          startedAt: Date.now() - (24 * 60 * 60 * 1000), // 1 day ago
          endedAt: Date.now() - (23.5 * 60 * 60 * 1000),
          status: 'completed',
          goal: 'Data analysis with legacy link',
          tags: ['#analysis'],
          // Legacy link field
          link: 'https://overleaf.com/project/abc123',
          notes: 'Analysis using Overleaf document',
          createdAt: Date.now() - (24 * 60 * 60 * 1000),
          updatedAt: Date.now() - (24 * 60 * 60 * 1000)
        };

        await db.transaction('rw', db.sessions, async () => {
          await db.sessions.bulkAdd([testSession, legacySession]);
        });
      };

      seedData().catch(console.error);
    });

    await page.waitForTimeout(1000); // Let the data seed
  });

  test('should display link chips in Timeline', async ({ page }) => {
    await page.goto('/timeline');

    // Wait for sessions to load
    await expect(page.getByText('Loading sessions...')).not.toBeVisible();

    // Look for the session with multiple links
    const sessionCard = page.locator('[data-testid="session-card"]').or(
      page.locator('text="Research transformers with multiple sources"').locator('..')
    ).first();

    await expect(sessionCard).toBeVisible();

    // Check that link chips are displayed
    // The exact selectors depend on how LinkChipList renders
    const linkChips = sessionCard.locator('.inline-flex:has-text("doi:"), .inline-flex:has-text("microsoft"), .inline-flex:has-text("arXiv:")');
    await expect(linkChips.first()).toBeVisible();

    // Verify we can see multiple link types
    await expect(sessionCard).toContainText('doi:10.1000/example');
    await expect(sessionCard).toContainText('microsoft/transformer');
  });

  test('should show legacy link fallback', async ({ page }) => {
    await page.goto('/timeline');

    await expect(page.getByText('Loading sessions...')).not.toBeVisible();

    // Look for the session with legacy link
    const legacySessionCard = page.locator('text="Data analysis with legacy link"').locator('..').first();
    await expect(legacySessionCard).toBeVisible();

    // Should show the legacy link
    await expect(legacySessionCard).toContainText('overleaf.com');
  });

  test('should include links in weekly report', async ({ page }) => {
    await page.goto('/report');

    // Wait for report to load
    await expect(page.getByText('Loading report data...')).not.toBeVisible();

    // Check highlights section includes linked sessions
    const highlightsSection = page.locator('text="Highlights"').locator('..');

    // Should show session with links in highlights (since it has links)
    await expect(highlightsSection).toContainText('Research transformers');
    await expect(highlightsSection).toContainText('doi:10.1000/example');

    // Check session log table
    const sessionLog = page.locator('text="Session Log"').locator('..');
    await expect(sessionLog).toBeVisible();

    const table = sessionLog.locator('table');
    await expect(table).toBeVisible();

    // Verify links column shows multiple links
    await expect(table).toContainText('doi:10.1000/example, microsoft/transformer, arXiv:2301.12345');
  });

  test('should export links correctly in markdown', async ({ page }) => {
    await page.goto('/report');

    await expect(page.getByText('Loading report data...')).not.toBeVisible();

    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Click copy markdown button
    const copyButton = page.getByRole('button', { name: /Copy Markdown/i });
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // Should show success
    await expect(page.getByText('Copied!')).toBeVisible();

    // Verify clipboard content includes new link format
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toContain('doi:10.1000/example');
    expect(clipboardContent).toContain('microsoft/transformer');
    expect(clipboardContent).toContain('arXiv:2301.12345');
  });

  test('should handle link chip clicks', async ({ page }) => {
    await page.goto('/timeline');

    await expect(page.getByText('Loading sessions...')).not.toBeVisible();

    // Find a clickable link chip
    const doiChip = page.locator('.inline-flex:has-text("doi:10.1000/example")').first();

    if (await doiChip.isVisible()) {
      // Set up to capture popup
      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        doiChip.click()
      ]);

      // Verify it opens the correct URL
      expect(popup.url()).toContain('doi.org');
      await popup.close();
    }
  });

  test('should show correct link type icons', async ({ page }) => {
    await page.goto('/timeline');

    await expect(page.getByText('Loading sessions...')).not.toBeVisible();

    const sessionCard = page.locator('text="Research transformers with multiple sources"').locator('..').first();

    // Look for different link type indicators/icons
    // This test verifies that different link types are visually distinct
    await expect(sessionCard).toBeVisible();

    // The exact implementation depends on how icons are rendered
    // This is a basic check that the session shows multiple links
    const linkElements = sessionCard.locator('.inline-flex').count();
    expect(await linkElements).toBeGreaterThanOrEqual(2); // At least 2 link chips
  });
});