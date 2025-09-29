import { test, expect } from '@playwright/test';

test.describe('Research Timer Session Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should start Writing 30m session, add metadata, and complete', async ({ page }) => {
    // Check initial state
    await expect(page.getByRole('heading', { name: 'Research Timer Pro' })).toBeVisible();
    await expect(page.getByText('Ready')).toBeVisible();

    // Select Writing mode (preset 3)
    await page.getByRole('button', { name: 'Writing 30m' }).click();
    await expect(page.getByRole('button', { name: 'Writing 30m' })).toHaveClass(/border-primary/);

    // Fill in metadata
    await page.getByLabel('Goal').fill('Draft methodology section');
    await page.getByLabel('Notes').fill('Focus on data collection methods and analysis approach');

    // Add tags
    const tagInput = page.getByLabel('Tags').last();
    await tagInput.fill('#writing');
    await tagInput.press('Enter');
    await tagInput.fill('#methodology');
    await tagInput.press('Enter');

    // Add reference link
    await page.getByLabel('Reference Link').fill('https://example.com/research-methods');

    // Start the session
    await page.getByRole('button', { name: 'Start' }).click();

    // Check session is running
    await expect(page.getByText('Running')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();

    // Check that mode selection is hidden during session
    await expect(page.getByText('Focus Mode')).not.toBeVisible();

    // Test pause/resume
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByText('Paused')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();

    await page.getByRole('button', { name: 'Resume' }).click();
    await expect(page.getByText('Running')).toBeVisible();

    // Stop the session early
    await page.getByRole('button', { name: 'Stop' }).click();

    // Check completion state
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
    await expect(page.getByText('Focus Mode')).toBeVisible();

    // Navigate to timeline to verify session was saved
    await page.getByRole('link', { name: 'Timeline' }).click();
    await expect(page.getByText('1 session')).toBeVisible();

    // Check session details in timeline
    await expect(page.getByText('Writing')).toBeVisible();
    await expect(page.getByText('Draft methodology section')).toBeVisible();
    await expect(page.getByText('#writing')).toBeVisible();
    await expect(page.getByText('#methodology')).toBeVisible();
    await expect(page.getByRole('link', { name: /example\.com/ })).toBeVisible();
    await expect(page.getByText('completed')).toBeVisible();
  });

  test('should persist session data after page reload', async ({ page }) => {
    // Start a session
    await page.getByLabel('Goal').fill('Test persistence');
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByText('Running')).toBeVisible();

    // Pause the session
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByText('Paused')).toBeVisible();

    // Reload the page
    await page.reload();

    // Check that session data is restored
    await expect(page.getByDisplayValue('Test persistence')).toBeVisible();
    await expect(page.getByText('Ready to resume')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  });

  test('should filter timeline by mode and tag', async ({ page }) => {
    // Navigate to timeline
    await page.getByRole('link', { name: 'Timeline' }).click();

    // Test mode filter
    await page.getByLabel('Focus Mode').selectOption('writing');
    // Should show writing sessions only

    await page.getByLabel('Focus Mode').selectOption('all');
    // Should show all sessions

    // Test tag filter
    await page.getByLabel('Filter by Tag').fill('#writing');
    // Should filter to sessions with writing tag

    // Clear filters
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.getByLabel('Filter by Tag')).toHaveValue('');
  });

  test('should use keyboard shortcuts', async ({ page }) => {
    // Test preset selection with number keys
    await page.keyboard.press('3'); // Writing preset
    await expect(page.getByRole('button', { name: 'Writing 30m' })).toHaveClass(/border-primary/);

    // Test start with spacebar
    await page.keyboard.press(' ');
    await expect(page.getByText('Running')).toBeVisible();

    // Test pause with spacebar
    await page.keyboard.press(' ');
    await expect(page.getByText('Paused')).toBeVisible();

    // Test reset with R key
    await page.keyboard.press('r');
    await expect(page.getByText('Ready')).toBeVisible();
    await expect(page.getByText('Focus Mode')).toBeVisible();
  });

  test('should export timeline data', async ({ page }) => {
    await page.getByRole('link', { name: 'Timeline' }).click();

    // Set up download handler
    const downloadPromise = page.waitForEvent('download');

    // Export as markdown
    await page.getByRole('button', { name: 'Export as Markdown' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/sessions-.*\.md/);

    // Export as CSV
    const csvDownloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export as CSV' }).click();
    const csvDownload = await csvDownloadPromise;

    expect(csvDownload.suggestedFilename()).toMatch(/sessions-.*\.csv/);
  });

  test('should validate reference links', async ({ page }) => {
    // Test invalid URL
    await page.getByLabel('Reference Link').fill('not-a-url');
    await expect(page.getByText('Please enter a valid URL or DOI')).toBeVisible();

    // Test valid URL
    await page.getByLabel('Reference Link').fill('https://example.com');
    await expect(page.getByText('Please enter a valid URL or DOI')).not.toBeVisible();

    // Test valid DOI
    await page.getByLabel('Reference Link').fill('10.1000/182');
    await expect(page.getByText('Please enter a valid URL or DOI')).not.toBeVisible();
  });
});