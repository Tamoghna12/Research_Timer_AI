import { test, expect } from '@playwright/test'

test.describe('AI Settings Configuration', () => {
  test.beforeEach(async ({ page }) => {
    // Mock AI test connection responses
    await page.route('**/api/tags', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          models: [
            { name: 'llama3:8b' },
            { name: 'llama3:13b' },
            { name: 'codellama:7b' }
          ]
        })
      })
    })

    await page.route('https://api.openai.com/v1/models', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 'gpt-4o-mini' },
            { id: 'gpt-3.5-turbo' }
          ]
        })
      })
    })

    await page.goto('/settings')
  })

  test('should render AI settings section with master toggle', async ({ page }) => {
    // Should see AI Features section
    await expect(page.getByText('AI Features')).toBeVisible()

    // Should see master enable toggle
    await expect(page.getByText('Enable AI Summarization (opt-in)')).toBeVisible()
    await expect(page.getByText('Generate concise summaries of your research sessions using AI. All settings are stored locally.')).toBeVisible()

    // Master toggle should be unchecked by default (privacy-first)
    const masterToggle = page.locator('input[type="checkbox"]').first()
    await expect(masterToggle).not.toBeChecked()
  })

  test('should show configuration panel when AI is enabled', async ({ page }) => {
    // Enable AI
    const masterToggle = page.locator('input[type="checkbox"]').first()
    await masterToggle.check()

    // Should see configuration options
    await expect(page.getByLabelText('AI Provider')).toBeVisible()
    await expect(page.getByLabelText('Model')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Test Connection' })).toBeVisible()

    // Should see advanced settings
    await expect(page.getByText('Advanced Settings')).toBeVisible()
    await expect(page.getByText(/Summary Bullets:/)).toBeVisible()
    await expect(page.getByText(/Max Characters:/)).toBeVisible()
    await expect(page.getByText(/Creativity:/)).toBeVisible()
    await expect(page.getByText('Include Journal')).toBeVisible()
  })

  test('should hide configuration panel when AI is disabled', async ({ page }) => {
    // Configuration should not be visible by default
    await expect(page.getByLabelText('AI Provider')).not.toBeVisible()
    await expect(page.getByLabelText('Model')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Test Connection' })).not.toBeVisible()
  })

  test('should update model placeholder when provider changes', async ({ page }) => {
    // Enable AI
    const masterToggle = page.locator('input[type="checkbox"]').first()
    await masterToggle.check()

    // Change provider to OpenAI
    const providerSelect = page.getByLabelText('AI Provider')
    await providerSelect.selectOption('openai')

    // Model field should update with OpenAI model placeholder
    const modelField = page.getByLabelText('Model')
    await expect(modelField).toHaveValue('gpt-4o-mini')

    // Should show API key field for remote provider
    await expect(page.getByLabelText('API Key')).toBeVisible()
    await expect(page.getByText('Your API key will be stored locally and never shared')).toBeVisible()

    // Should not show base URL field for OpenAI
    await expect(page.getByLabelText('Base URL')).not.toBeVisible()
  })

  test('should show base URL field for Ollama provider', async ({ page }) => {
    // Enable AI
    const masterToggle = page.locator('input[type="checkbox"]').first()
    await masterToggle.check()

    // Should see base URL field for Ollama (default provider)
    await expect(page.getByLabelText('Base URL')).toBeVisible()
    await expect(page.getByText('Ollama server URL (default: http://localhost:11434)')).toBeVisible()

    // Should not show API key field for local provider
    await expect(page.getByLabelText('API Key')).not.toBeVisible()
  })

  test('should test Ollama connection successfully', async ({ page }) => {
    // Enable AI
    const masterToggle = page.locator('input[type="checkbox"]').first()
    await masterToggle.check()

    // Set a model
    await page.getByLabelText('Model').fill('llama3:8b')

    // Test connection
    await page.getByRole('button', { name: 'Test Connection' }).click()

    // Should show success message
    await expect(page.getByText('Connected to Ollama successfully')).toBeVisible()

    // Success state styling should be applied
    await expect(page.locator('.bg-green-50')).toBeVisible()
  })

  test('should test OpenAI connection successfully', async ({ page }) => {
    // Enable AI
    const masterToggle = page.locator('input[type="checkbox"]').first()
    await masterToggle.check()

    // Switch to OpenAI provider
    await page.getByLabelText('AI Provider').selectOption('openai')
    await page.getByLabelText('API Key').fill('sk-test-api-key')

    // Test connection
    await page.getByRole('button', { name: 'Test Connection' }).click()

    // Should show success message
    await expect(page.getByText(/Connected to OpenAI/)).toBeVisible()
  })

  test('should handle connection test failure gracefully', async ({ page }) => {
    // Mock failed connection
    await page.route('**/api/tags', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Connection failed' })
      })
    })

    // Enable AI
    const masterToggle = page.locator('input[type="checkbox"]').first()
    await masterToggle.check()

    // Test connection
    await page.getByRole('button', { name: 'Test Connection' }).click()

    // Should show error message
    await expect(page.getByText(/Ollama server error/)).toBeVisible()

    // Error state styling should be applied
    await expect(page.locator('.bg-red-50')).toBeVisible()
  })

  test('should update advanced settings with sliders', async ({ page }) => {
    // Enable AI
    const masterToggle = page.locator('input[type="checkbox"]').first()
    await masterToggle.check()

    // Test bullets slider
    const bulletsSlider = page.getByLabelText(/Summary Bullets:/)
    await expect(page.getByText('Summary Bullets: 5')).toBeVisible()
    await bulletsSlider.fill('7')
    await expect(page.getByText('Summary Bullets: 7')).toBeVisible()

    // Test max characters slider
    const maxCharsSlider = page.getByLabelText(/Max Characters:/)
    await expect(page.getByText('Max Characters: 300')).toBeVisible()
    await maxCharsSlider.fill('450')
    await expect(page.getByText('Max Characters: 450')).toBeVisible()

    // Test temperature slider
    const temperatureSlider = page.getByLabelText(/Creativity:/)
    await expect(page.getByText('Creativity: 0.2')).toBeVisible()
    await temperatureSlider.fill('0.7')
    await expect(page.getByText('Creativity: 0.7')).toBeVisible()
  })

  test('should toggle include journal setting', async ({ page }) => {
    // Enable AI
    const masterToggle = page.locator('input[type="checkbox"]').first()
    await masterToggle.check()

    // Find include journal toggle
    const includeJournalToggle = page.locator('input[type="checkbox"]').nth(1)

    // Should be checked by default
    await expect(includeJournalToggle).toBeChecked()

    // Toggle off
    await includeJournalToggle.uncheck()
    await expect(includeJournalToggle).not.toBeChecked()

    // Toggle back on
    await includeJournalToggle.check()
    await expect(includeJournalToggle).toBeChecked()
  })

  test('should persist AI settings across page reloads', async ({ page }) => {
    // Enable AI and configure settings
    const masterToggle = page.locator('input[type="checkbox"]').first()
    await masterToggle.check()

    await page.getByLabelText('AI Provider').selectOption('anthropic')
    await page.getByLabelText('Model').fill('claude-3-haiku-20240307')
    await page.getByLabelText('API Key').fill('test-anthropic-key')

    // Reload page
    await page.reload()

    // Settings should be persisted
    await expect(page.locator('input[type="checkbox"]').first()).toBeChecked()
    await expect(page.getByLabelText('AI Provider')).toHaveValue('anthropic')
    await expect(page.getByLabelText('Model')).toHaveValue('claude-3-haiku-20240307')
    await expect(page.getByLabelText('API Key')).toHaveValue('test-anthropic-key')
  })

  test('should show appropriate provider descriptions', async ({ page }) => {
    // Enable AI
    const masterToggle = page.locator('input[type="checkbox"]').first()
    await masterToggle.check()

    // Test Ollama description
    await expect(page.getByText('Run AI models locally on your machine')).toBeVisible()

    // Test OpenAI description
    await page.getByLabelText('AI Provider').selectOption('openai')
    await expect(page.getByText('GPT models via OpenAI API')).toBeVisible()

    // Test Anthropic description
    await page.getByLabelText('AI Provider').selectOption('anthropic')
    await expect(page.getByText('Claude models via Anthropic API')).toBeVisible()

    // Test Gemini description
    await page.getByLabelText('AI Provider').selectOption('gemini')
    await expect(page.getByText('Gemini models via Google AI API')).toBeVisible()
  })
})