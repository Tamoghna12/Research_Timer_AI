import { test, expect } from '@playwright/test'

test.describe('AI Summarizer Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Mock AI adapter to return predictable responses
    await page.addInitScript(() => {
      window.__mockAI = {
        enabled: true,
        responses: {
          'test-summary': '• Completed literature review on ML transformers\n• Found 5 key papers on attention mechanisms\n• Identified gaps in current research approaches'
        }
      }
    })

    // Mock the AI generate function
    await page.route('**/api/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: '• Completed literature review on ML transformers\n• Found 5 key papers on attention mechanisms\n• Identified gaps in current research approaches',
          done: true,
          prompt_eval_count: 125,
          eval_count: 43
        })
      })
    })

    await page.goto('/')
  })

  test('should allow user to opt-in to AI summary on session completion', async ({ page }) => {
    // Start a new session
    await page.getByRole('button', { name: 'Literature Review' }).click()
    await page.getByRole('button', { name: 'Start Focus' }).click()

    // Wait a moment then complete the session
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Complete' }).click()

    // Journal modal should appear
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Quick Journal')).toBeVisible()

    // Fill out the journal fields
    await page.getByLabel('Key Claim').fill('Transformers are powerful for NLP tasks')
    await page.getByLabel('Method').fill('Systematic literature review')
    await page.getByLabel('Limitation').fill('Limited to English papers only')

    // Enable AI summary
    const aiCheckbox = page.getByRole('checkbox', { name: /Use AI to condense notes/i })
    await expect(aiCheckbox).toBeVisible()
    await aiCheckbox.check()

    // Should see the AI summary section
    await expect(page.getByText('AI Summary')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Generate' })).toBeVisible()
  })

  test('should generate AI summary when generate button is clicked', async ({ page }) => {
    // Start a session with some content
    await page.getByRole('button', { name: 'Literature Review' }).click()

    // Add a goal and some notes
    await page.getByLabel('Goal').fill('Review transformer papers')
    await page.getByLabel('Notes').fill('Found several important papers on attention mechanisms')

    await page.getByRole('button', { name: 'Start Focus' }).click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Complete' }).click()

    // Enable AI summary
    await page.getByRole('checkbox', { name: /Use AI to condense notes/i }).check()

    // Click generate
    await page.getByRole('button', { name: 'Generate' }).click()

    // Should show loading state
    await expect(page.getByText('Cancel')).toBeVisible()
    await expect(page.locator('.animate-spin')).toBeVisible()

    // Wait for generation to complete
    await expect(page.getByLabel('AI Summary')).toBeVisible()

    // Should contain the mocked summary
    const summaryTextarea = page.getByLabel('AI Summary')
    await expect(summaryTextarea).toHaveValue(/Completed literature review on ML transformers/)
    await expect(summaryTextarea).toHaveValue(/Found 5 key papers on attention mechanisms/)
    await expect(summaryTextarea).toHaveValue(/Identified gaps in current research approaches/)
  })

  test('should allow user to edit AI summary before saving', async ({ page }) => {
    // Complete a session and generate AI summary
    await page.getByRole('button', { name: 'Literature Review' }).click()
    await page.getByLabel('Goal').fill('Review papers')
    await page.getByRole('button', { name: 'Start Focus' }).click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Complete' }).click()

    await page.getByRole('checkbox', { name: /Use AI to condense notes/i }).check()
    await page.getByRole('button', { name: 'Generate' }).click()

    // Wait for AI summary to be generated
    const summaryTextarea = page.getByLabel('AI Summary')
    await expect(summaryTextarea).toHaveValue(/Completed literature review/)

    // Edit the summary
    await summaryTextarea.clear()
    await summaryTextarea.fill('• Edited summary point 1\n• Edited summary point 2\n• Edited summary point 3')

    // Save the session
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify the modal closes
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Go to Timeline to verify AI summary was saved
    await page.getByRole('link', { name: 'Timeline' }).click()

    // Should see AI badge on the session
    await expect(page.getByText('AI')).toBeVisible()

    // Should see AI summary preview
    await expect(page.getByText('AI Summary:')).toBeVisible()
    await expect(page.getByText('Edited summary point 1')).toBeVisible()
  })

  test('should show AI badges in Timeline when session has AI summary', async ({ page }) => {
    // Complete a session with AI summary
    await page.getByRole('button', { name: 'Literature Review' }).click()
    await page.getByRole('button', { name: 'Start Focus' }).click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Complete' }).click()

    await page.getByRole('checkbox', { name: /Use AI to condense notes/i }).check()
    await page.getByRole('button', { name: 'Generate' }).click()

    // Wait for generation and save
    await expect(page.getByLabel('AI Summary')).toHaveValue(/Completed literature review/)
    await page.getByRole('button', { name: 'Save' }).click()

    // Navigate to Timeline
    await page.getByRole('link', { name: 'Timeline' }).click()

    // Should see AI badge
    const aiBadge = page.locator('.bg-blue-100').filter({ hasText: 'AI' })
    await expect(aiBadge).toBeVisible()

    // Should see AI summary preview instead of regular notes
    await expect(page.getByText('AI Summary:')).toBeVisible()
    await expect(page.getByText(/Completed literature review/)).toBeVisible()
  })

  test('should include AI summaries in Weekly Report', async ({ page }) => {
    // Complete a session with AI summary
    await page.getByRole('button', { name: 'Literature Review' }).click()
    await page.getByRole('button', { name: 'Start Focus' }).click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Complete' }).click()

    await page.getByRole('checkbox', { name: /Use AI to condense notes/i }).check()
    await page.getByRole('button', { name: 'Generate' }).click()
    await expect(page.getByLabel('AI Summary')).toHaveValue(/Completed literature review/)
    await page.getByRole('button', { name: 'Save' }).click()

    // Navigate to Weekly Report
    await page.getByRole('link', { name: 'Reports' }).click()

    // Should see session in highlights with AI-assisted badge
    await expect(page.getByText('AI-assisted')).toBeVisible()
    await expect(page.getByText(/Completed literature review/)).toBeVisible()

    // Should include AI summaries in session log table
    await expect(page.locator('table')).toContainText('AI Summary')
  })

  test('should handle AI generation cancellation', async ({ page }) => {
    // Mock a slow response
    await page.route('**/api/generate', async route => {
      // Delay the response for 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: 'This should not appear',
          done: true
        })
      })
    })

    await page.getByRole('button', { name: 'Literature Review' }).click()
    await page.getByRole('button', { name: 'Start Focus' }).click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Complete' }).click()

    await page.getByRole('checkbox', { name: /Use AI to condense notes/i }).check()
    await page.getByRole('button', { name: 'Generate' }).click()

    // Should show loading state
    await expect(page.locator('.animate-spin')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()

    // Cancel the generation
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Should return to initial state
    await expect(page.locator('.animate-spin')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Generate' })).toBeVisible()
    await expect(page.getByLabel('AI Summary')).not.toBeVisible()
  })

  test('should show inline error when AI generation fails', async ({ page }) => {
    // Mock an error response
    await page.route('**/api/generate', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { message: 'AI service temporarily unavailable' }
        })
      })
    })

    await page.getByRole('button', { name: 'Literature Review' }).click()
    await page.getByRole('button', { name: 'Start Focus' }).click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Complete' }).click()

    await page.getByRole('checkbox', { name: /Use AI to condense notes/i }).check()
    await page.getByRole('button', { name: 'Generate' }).click()

    // Should show error message
    await expect(page.getByText(/AI service temporarily unavailable/)).toBeVisible()

    // Should show retry button
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()

    // No AI summary textarea should be visible
    await expect(page.getByLabel('AI Summary')).not.toBeVisible()
  })

  test('should save session without AI summary when checkbox is unchecked', async ({ page }) => {
    await page.getByRole('button', { name: 'Literature Review' }).click()
    await page.getByRole('button', { name: 'Start Focus' }).click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Complete' }).click()

    // Fill out journal but don't enable AI
    await page.getByLabel('Key Claim').fill('Some key claim')

    // Ensure AI checkbox is not checked
    const aiCheckbox = page.getByRole('checkbox', { name: /Use AI to condense notes/i })
    await expect(aiCheckbox).not.toBeChecked()

    await page.getByRole('button', { name: 'Save' }).click()

    // Navigate to Timeline
    await page.getByRole('link', { name: 'Timeline' }).click()

    // Should not see AI badge
    await expect(page.getByText('AI')).not.toBeVisible()

    // Should see regular journaled badge
    await expect(page.getByText('Journaled')).toBeVisible()
  })
})