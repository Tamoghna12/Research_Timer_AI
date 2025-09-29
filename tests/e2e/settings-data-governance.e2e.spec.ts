import { test, expect } from '@playwright/test'

test.describe('Settings & Data Governance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
  })

  test.describe('Profile Settings', () => {
    test('should allow setting researcher name and affiliation', async ({ page }) => {
      // Fill in profile information
      await page.getByLabelText('Researcher Name').fill('Dr. Jane Smith')
      await page.getByLabelText('Affiliation').fill('MIT Computer Science')

      // Blur to trigger save
      await page.getByLabelText('Affiliation').blur()

      // Should see save confirmation
      await expect(page.getByText(/Saved •/)).toBeVisible()

      // Should see preview
      await expect(page.getByText('Weekly Report header:')).toBeVisible()
      await expect(page.getByText('Dr. Jane Smith')).toBeVisible()
      await expect(page.getByText('MIT Computer Science')).toBeVisible()
    })

    test('should show profile in weekly report header', async ({ page }) => {
      // Set profile information
      await page.getByLabelText('Researcher Name').fill('Dr. Research Expert')
      await page.getByLabelText('Affiliation').fill('Research University')
      await page.getByLabelText('Affiliation').blur()

      // Wait for save
      await expect(page.getByText(/Saved •/)).toBeVisible()

      // Navigate to weekly report
      await page.getByRole('link', { name: 'Report' }).click()

      // Should see researcher profile in the report
      await expect(page.getByText('Dr. Research Expert')).toBeVisible()
      await expect(page.getByText('Research University')).toBeVisible()
    })
  })

  test.describe('Privacy Settings', () => {
    test('should have telemetry OFF by default', async ({ page }) => {
      const telemetryToggle = page.locator('input[type="checkbox"][role="switch"]')
      await expect(telemetryToggle).not.toBeChecked()
      await expect(page.getByText('Off')).toBeVisible()

      // Should not show anonymous ID when off
      await expect(page.getByText('Anonymous ID')).not.toBeVisible()
    })

    test('should show anonymous ID when telemetry enabled', async ({ page }) => {
      const telemetryToggle = page.locator('input[type="checkbox"][role="switch"]')

      // Enable telemetry
      await telemetryToggle.check()
      await expect(page.getByText('On')).toBeVisible()

      // Should show anonymous ID section
      await expect(page.getByText('Anonymous ID')).toBeVisible()

      // Should show UUID format
      const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/
      await expect(page.locator('.font-mono').textContent()).resolves.toMatch(uuidRegex)

      // Should have copy button
      await expect(page.getByRole('button', { name: /Copy/ })).toBeVisible()
    })

    test('should make no network requests when telemetry is OFF', async ({ page }) => {
      // Monitor network requests
      const requests: string[] = []
      page.on('request', request => {
        if (request.url().includes('/api/') || request.url().includes('analytics')) {
          requests.push(request.url())
        }
      })

      // Ensure telemetry is off
      const telemetryToggle = page.locator('input[type="checkbox"][role="switch"]')
      if (await telemetryToggle.isChecked()) {
        await telemetryToggle.uncheck()
      }

      // Perform actions that might trigger telemetry
      await page.goto('/')
      await page.getByRole('button', { name: 'Literature Review' }).click()
      await page.getByRole('button', { name: 'Start Focus' }).click()
      await page.waitForTimeout(1000)
      await page.getByRole('button', { name: 'Complete' }).click()
      await page.getByRole('button', { name: 'Skip' }).click()

      // Should have made no analytics requests
      expect(requests).toHaveLength(0)
    })
  })

  test.describe('Data Export/Import/Delete', () => {
    test('should export data and show download', async ({ page }) => {
      // Create some test data first
      await page.goto('/')
      await page.getByRole('button', { name: 'Literature Review' }).click()
      await page.getByLabel('Goal').fill('Test session for export')
      await page.getByRole('button', { name: 'Start Focus' }).click()
      await page.waitForTimeout(1000)
      await page.getByRole('button', { name: 'Complete' }).click()
      await page.getByRole('button', { name: 'Skip' }).click()

      // Go to settings and export
      await page.goto('/settings')

      // Set up download listener
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Export All Data' }).click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/research-timer-data-\d{4}-\d{2}-\d{2}\.json/)

      // Should show success toast
      await expect(page.getByText(/Exported \d+ sessions successfully/)).toBeVisible()
    })

    test('should import data with preview and merge', async ({ page }) => {
      // Create a mock backup file for testing
      const mockBackup = {
        kind: 'research-timer-backup',
        version: 1,
        createdAt: Date.now(),
        sessions: [{
          id: 'import-test-session',
          mode: 'lit',
          plannedMs: 25 * 60 * 1000,
          startedAt: Date.now(),
          endedAt: Date.now() + 25 * 60 * 1000,
          status: 'completed',
          tags: ['#imported'],
          goal: 'Imported session',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }],
        settings: {
          id: 'app',
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          privacy: {
            telemetryEnabled: false,
            userAnonId: 'test-uuid'
          }
        }
      }

      // Create a file for upload
      const fileContent = JSON.stringify(mockBackup)
      const buffer = Buffer.from(fileContent, 'utf8')

      // Upload the file
      await page.setInputFiles('input[type="file"]', {
        name: 'test-backup.json',
        mimeType: 'application/json',
        buffer
      })

      // Should show import preview
      await expect(page.getByText('Import Preview:')).toBeVisible()
      await expect(page.getByText('New Sessions')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Merge Data' })).toBeVisible()

      // Click merge
      await page.getByRole('button', { name: 'Merge Data' }).click()

      // Should show success toast
      await expect(page.getByText(/Import complete:/)).toBeVisible()
    })

    test('should delete all data with confirmation', async ({ page }) => {
      // Create some test data
      await page.goto('/')
      await page.getByRole('button', { name: 'Literature Review' }).click()
      await page.getByRole('button', { name: 'Start Focus' }).click()
      await page.waitForTimeout(1000)
      await page.getByRole('button', { name: 'Complete' }).click()
      await page.getByRole('button', { name: 'Skip' }).click()

      // Verify data exists in Timeline
      await page.getByRole('link', { name: 'Timeline' }).click()
      await expect(page.getByText('1 session')).toBeVisible()

      // Go to settings and delete all
      await page.goto('/settings')
      await page.getByRole('button', { name: 'Delete All Data' }).click()

      // Should open confirmation modal
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText('Delete All Data')).toBeVisible()
      await expect(page.getByText('This action cannot be undone')).toBeVisible()

      // Should require typing DELETE
      const deleteButton = page.getByRole('button', { name: 'Delete All Data' })
      await expect(deleteButton).toBeDisabled()

      await page.getByLabelText('Type DELETE to confirm').fill('DELETE')
      await expect(deleteButton).toBeEnabled()

      // Confirm deletion - this will cause page reload
      await deleteButton.click()

      // Wait for page to reload to empty state
      await page.waitForLoadState('networkidle')

      // Verify app is in empty state
      await page.goto('/timeline')
      await expect(page.getByText('0 sessions')).toBeVisible()
    })

    test('should handle invalid import files gracefully', async ({ page }) => {
      // Try importing invalid JSON
      await page.setInputFiles('input[type="file"]', {
        name: 'invalid.json',
        mimeType: 'application/json',
        buffer: Buffer.from('invalid json', 'utf8')
      })

      await expect(page.getByText(/Import Error:/)).toBeVisible()
      await expect(page.getByText(/Invalid backup file/)).toBeVisible()

      // Try importing wrong format
      const wrongFormat = { kind: 'wrong-format', data: [] }
      await page.setInputFiles('input[type="file"]', {
        name: 'wrong-format.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(wrongFormat), 'utf8')
      })

      await expect(page.getByText(/not a research timer backup/)).toBeVisible()
    })
  })

  test.describe('AI Settings Integration', () => {
    test('should show AI settings section', async ({ page }) => {
      await expect(page.getByText('AI Features')).toBeVisible()
      await expect(page.getByText('Enable AI Summarization (opt-in)')).toBeVisible()

      // AI should be disabled by default (privacy-first)
      const aiToggle = page.locator('input[type="checkbox"]').first()
      await expect(aiToggle).not.toBeChecked()
    })

    test('should integrate AI settings from Step 7', async ({ page }) => {
      // Enable AI
      const aiToggle = page.locator('input[type="checkbox"]').first()
      await aiToggle.check()

      // Should see AI configuration options
      await expect(page.getByLabelText('AI Provider')).toBeVisible()
      await expect(page.getByLabelText('Model')).toBeVisible()
      await expect(page.getByText('Test Connection')).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper labels and keyboard navigation', async ({ page }) => {
      // Check form labels
      await expect(page.getByLabelText('Researcher Name')).toBeVisible()
      await expect(page.getByLabelText('Affiliation')).toBeVisible()

      // Check toggles have status text
      await expect(page.getByText('Off')).toBeVisible()

      // Check dangerous actions have warnings
      const deleteButton = page.getByRole('button', { name: 'Delete All Data' })
      await expect(deleteButton).toHaveAttribute('aria-describedby', 'delete-warning')

      // Test keyboard navigation
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await expect(page.locator(':focus')).toBeVisible()
    })

    test('should have visible focus rings', async ({ page }) => {
      // Tab through inputs and check focus visibility
      await page.getByLabelText('Researcher Name').focus()
      await expect(page.getByLabelText('Researcher Name')).toBeFocused()

      // Focus ring should be visible (CSS-dependent)
      const focusedElement = page.getByLabelText('Researcher Name')
      await expect(focusedElement).toHaveCSS('outline', expect.stringMatching(/.*px.*solid.*/))
    })
  })
})