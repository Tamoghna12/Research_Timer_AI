import { test, expect } from '@playwright/test';

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Clear any existing data
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const deleteReq = indexedDB.deleteDatabase('ResearchTimerDB');
        deleteReq.onsuccess = () => resolve(undefined);
        deleteReq.onerror = () => resolve(undefined);
      });
    });

    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
  });

  test('displays analytics with seeded data', async ({ page }) => {
    // Seed test data directly into IndexedDB
    await page.evaluate(() => {
      return new Promise(async (resolve) => {
        // Import Dexie and setup
        const { db } = await import('../data/database.js');

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const sessions = [
          // Today - deep work session (30 min, completed well)
          {
            id: 'test-1',
            mode: 'deep',
            plannedMs: 30 * 60 * 1000,
            startedAt: today.getTime(),
            endedAt: today.getTime() + 30 * 60 * 1000,
            status: 'completed',
            goal: 'Deep work session',
            notes: 'Focused work',
            tags: ['#research', '#focus'],
            link: '',
            createdAt: today.getTime(),
            updatedAt: today.getTime()
          },
          // Yesterday - lit review (25 min, completed 90%)
          {
            id: 'test-2',
            mode: 'lit',
            plannedMs: 25 * 60 * 1000,
            startedAt: yesterday.getTime(),
            endedAt: yesterday.getTime() + 22.5 * 60 * 1000, // exactly 90%
            status: 'completed',
            goal: 'Literature review',
            notes: 'Reading papers',
            tags: ['#research', '#reading'],
            link: '',
            createdAt: yesterday.getTime(),
            updatedAt: yesterday.getTime()
          },
          // Yesterday - writing session (20 min, incomplete)
          {
            id: 'test-3',
            mode: 'writing',
            plannedMs: 25 * 60 * 1000,
            startedAt: yesterday.getTime() - 60 * 60 * 1000,
            endedAt: yesterday.getTime() - 40 * 60 * 1000,
            status: 'completed',
            goal: 'Writing draft',
            notes: 'Working on paper',
            tags: ['#writing', '#paper'],
            link: '',
            createdAt: yesterday.getTime() - 60 * 60 * 1000,
            updatedAt: yesterday.getTime() - 40 * 60 * 1000
          },
          // Break session (should be excluded from focus metrics)
          {
            id: 'test-4',
            mode: 'break',
            plannedMs: 15 * 60 * 1000,
            startedAt: today.getTime() - 30 * 60 * 1000,
            endedAt: today.getTime() - 15 * 60 * 1000,
            status: 'completed',
            goal: 'Short break',
            notes: 'Rest time',
            tags: ['#break'],
            link: '',
            createdAt: today.getTime() - 30 * 60 * 1000,
            updatedAt: today.getTime() - 15 * 60 * 1000
          }
        ];

        try {
          await db.sessions.bulkAdd(sessions as any);
          resolve(undefined);
        } catch (error) {
          console.error('Failed to seed data:', error);
          resolve(undefined);
        }
      });
    });

    // Navigate to analytics page
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for analytics data to load
    await expect(page.locator('h1')).toContainText('Analytics');

    // Test KPI cards
    // Total Focus Time: 30 + 22.5 + 20 = 72.5 minutes = 1:13
    await expect(page.locator('[data-testid="total-focus-time"], .metric-card').first()).toContainText('1:13');

    // Sessions Completed: 4 (including break)
    await expect(page.locator('text=Sessions Completed').locator('..').locator('..').locator('.text-3xl')).toContainText('4');

    // Average Session Length: (30 + 22.5 + 20) / 3 = 24.2 min (excluding break)
    await expect(page.locator('text=Average Session Length').locator('..').locator('..').locator('.text-3xl')).toContainText('24.2 min');

    // Completion Rate: 2/3 = 67% (sessions meeting 90% threshold)
    await expect(page.locator('text=Completion Rate').locator('..').locator('..').locator('.text-3xl')).toContainText('67%');
  });

  test('shows formula tooltips on hover', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Hover over first metric info icon
    const infoButton = page.locator('button[aria-describedby*="tooltip"]').first();
    await infoButton.hover();

    // Check that tooltip appears with formula
    await expect(page.locator('[role="tooltip"]')).toContainText('Total Focus Time = sum of (actual minutes) for completed non-break sessions in range.');
  });

  test('updates metrics when changing date range', async ({ page }) => {
    // Seed data with sessions across different time periods
    await page.evaluate(() => {
      return new Promise(async (resolve) => {
        const { db } = await import('../data/database.js');

        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 8);

        const sessions = [
          // Recent session (within last 7 days)
          {
            id: 'recent-1',
            mode: 'deep',
            plannedMs: 30 * 60 * 1000,
            startedAt: today.getTime(),
            endedAt: today.getTime() + 30 * 60 * 1000,
            status: 'completed',
            goal: 'Recent work',
            notes: '',
            tags: ['#recent'],
            link: '',
            createdAt: today.getTime(),
            updatedAt: today.getTime()
          },
          // Old session (outside last 7 days)
          {
            id: 'old-1',
            mode: 'lit',
            plannedMs: 60 * 60 * 1000,
            startedAt: lastWeek.getTime(),
            endedAt: lastWeek.getTime() + 60 * 60 * 1000,
            status: 'completed',
            goal: 'Old work',
            notes: '',
            tags: ['#old'],
            link: '',
            createdAt: lastWeek.getTime(),
            updatedAt: lastWeek.getTime()
          }
        ];

        try {
          await db.sessions.bulkAdd(sessions as any);
          resolve(undefined);
        } catch (error) {
          resolve(undefined);
        }
      });
    });

    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Default is "Last 30 days" - should show both sessions
    await expect(page.locator('text=Sessions Completed').locator('..').locator('..').locator('.text-3xl')).toContainText('2');

    // Change to "Last 7 days"
    await page.selectOption('select#range-select', 'last7');
    await page.waitForTimeout(500); // Allow for recalculation

    // Should now show only 1 session
    await expect(page.locator('text=Sessions Completed').locator('..').locator('..').locator('.text-3xl')).toContainText('1');
  });

  test('displays distribution charts with correct data', async ({ page }) => {
    // Seed data with multiple modes and tags
    await page.evaluate(() => {
      return new Promise(async (resolve) => {
        const { db } = await import('../data/database.js');

        const sessions = [
          {
            id: 'deep-1',
            mode: 'deep',
            plannedMs: 60 * 60 * 1000,
            startedAt: Date.now(),
            endedAt: Date.now() + 60 * 60 * 1000,
            status: 'completed',
            goal: 'Deep work',
            notes: '',
            tags: ['#research', '#focus'],
            link: '',
            createdAt: Date.now(),
            updatedAt: Date.now()
          },
          {
            id: 'lit-1',
            mode: 'lit',
            plannedMs: 30 * 60 * 1000,
            startedAt: Date.now(),
            endedAt: Date.now() + 30 * 60 * 1000,
            status: 'completed',
            goal: 'Literature review',
            notes: '',
            tags: ['#research', '#reading'],
            link: '',
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        ];

        try {
          await db.sessions.bulkAdd(sessions as any);
          resolve(undefined);
        } catch (error) {
          resolve(undefined);
        }
      });
    });

    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Check mode distribution shows correct data
    await expect(page.locator('text=Focus Time by Mode').locator('..')).toBeVisible();
    await expect(page.locator('text=deep').first()).toBeVisible();
    await expect(page.locator('text=lit').first()).toBeVisible();

    // Check tag distribution
    await expect(page.locator('text=Focus Time by Tag').locator('..')).toBeVisible();
    await expect(page.locator('text=#research').first()).toBeVisible();
  });

  test('displays heatmap with activity data', async ({ page }) => {
    await page.evaluate(() => {
      return new Promise(async (resolve) => {
        const { db } = await import('../data/database.js');

        const today = new Date();
        const session = {
          id: 'heatmap-1',
          mode: 'deep',
          plannedMs: 30 * 60 * 1000,
          startedAt: today.getTime(),
          endedAt: today.getTime() + 30 * 60 * 1000,
          status: 'completed',
          goal: 'Test session',
          notes: '',
          tags: ['#test'],
          link: '',
          createdAt: today.getTime(),
          updatedAt: today.getTime()
        };

        try {
          await db.sessions.add(session as any);
          resolve(undefined);
        } catch (error) {
          resolve(undefined);
        }
      });
    });

    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Check heatmap is present
    await expect(page.locator('text=Weekly Focus Heatmap').locator('..')).toBeVisible();

    // Should have day labels
    await expect(page.locator('text=Mon')).toBeVisible();
    await expect(page.locator('text=Tue')).toBeVisible();

    // Should show some activity (non-zero cells)
    const activityCells = page.locator('.h-8.rounded.border'); // Heatmap cells
    await expect(activityCells.first()).toBeVisible();
  });

  test('displays streak information', async ({ page }) => {
    // Seed consecutive days of sessions for streak
    await page.evaluate(() => {
      return new Promise(async (resolve) => {
        const { db } = await import('../data/database.js');

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const sessions = [
          {
            id: 'streak-1',
            mode: 'deep',
            plannedMs: 30 * 60 * 1000,
            startedAt: today.getTime(),
            endedAt: today.getTime() + 30 * 60 * 1000,
            status: 'completed',
            goal: 'Today session',
            notes: '',
            tags: ['#streak'],
            link: '',
            createdAt: today.getTime(),
            updatedAt: today.getTime()
          },
          {
            id: 'streak-2',
            mode: 'lit',
            plannedMs: 25 * 60 * 1000,
            startedAt: yesterday.getTime(),
            endedAt: yesterday.getTime() + 25 * 60 * 1000,
            status: 'completed',
            goal: 'Yesterday session',
            notes: '',
            tags: ['#streak'],
            link: '',
            createdAt: yesterday.getTime(),
            updatedAt: yesterday.getTime()
          }
        ];

        try {
          await db.sessions.bulkAdd(sessions as any);
          resolve(undefined);
        } catch (error) {
          resolve(undefined);
        }
      });
    });

    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Check streak section
    await expect(page.locator('text=Focus Streaks').locator('..')).toBeVisible();
    await expect(page.locator('text=Current streak')).toBeVisible();
    await expect(page.locator('text=Longest streak')).toBeVisible();

    // Should show at least 2-day streak
    const currentStreak = page.locator('text=Current streak').locator('..').locator('.text-3xl');
    await expect(currentStreak).toContainText('2');
  });

  test('handles empty state gracefully', async ({ page }) => {
    // Navigate to analytics with no data
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // All metrics should show zero or empty states
    await expect(page.locator('text=Total Focus Time').locator('..').locator('..').locator('.text-3xl')).toContainText('0:00');
    await expect(page.locator('text=Sessions Completed').locator('..').locator('..').locator('.text-3xl')).toContainText('0');
    await expect(page.locator('text=Average Session Length').locator('..').locator('..').locator('.text-3xl')).toContainText('0 min');
    await expect(page.locator('text=Completion Rate').locator('..').locator('..').locator('.text-3xl')).toContainText('0%');

    // Distribution sections should show "No data available"
    await expect(page.locator('text=No data available')).toHaveCount(3); // Mode, tag, and heatmap
  });

  test('accessibility features work correctly', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Check ARIA labels on charts
    await expect(page.locator('[role="img"]')).toHaveCount(3); // Mode distribution, tag distribution, heatmap

    // Info buttons should be keyboard accessible
    const infoButton = page.locator('button[aria-describedby*="tooltip"]').first();
    await infoButton.focus();
    await page.keyboard.press('Enter');

    // Tooltip should appear
    await expect(page.locator('[role="tooltip"]')).toBeVisible();

    // Check that heatmap cells have proper ARIA labels
    const heatmapCells = page.locator('[role="gridcell"]').first();
    if (await heatmapCells.count() > 0) {
      await expect(heatmapCells).toHaveAttribute('aria-label');
    }
  });
});