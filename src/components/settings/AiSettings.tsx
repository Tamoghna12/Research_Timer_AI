import React, { useState, useCallback } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { useAi } from '../../hooks/useAi'
import type { AiProvider, AiSettings as AiSettingsType } from '../../data/types'
import Field from '../ui/Field'
import Button from '../ui/Button'

const AiSettings: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null)

  const { settings, saveAi } = useSettings()
  const { testConnection } = useAi()

  const updateSettings = useCallback(async (updates: Partial<AiSettingsType>) => {
    const currentAi = settings?.ai || {
      enabled: false,
      provider: 'openai',
      model: 'gpt-4o-mini',
      bullets: 5,
      maxChars: 300,
      temperature: 0.2,
      includeJournal: true
    }

    await saveAi({
      ...currentAi,
      ...updates
    })
  }, [settings?.ai, saveAi])

  const handleTestConnection = useCallback(async () => {
    setConnectionStatus('testing')
    setConnectionMessage(null)

    const result = await testConnection()

    setConnectionStatus(result.ok ? 'success' : 'error')
    setConnectionMessage(result.message || null)
  }, [testConnection])

  const defaultSettings: AiSettingsType = {
    enabled: false,
    provider: 'openai',
    model: 'gpt-4o-mini',
    bullets: 5,
    maxChars: 300,
    temperature: 0.2,
    includeJournal: true
  }

  const currentSettings = settings?.ai || defaultSettings

  const providers: { value: AiProvider; label: string; description: string }[] = [
    { value: 'openai', label: 'OpenAI', description: 'GPT models via OpenAI API' },
    { value: 'anthropic', label: 'Anthropic', description: 'Claude models via Anthropic API' },
    { value: 'gemini', label: 'Google Gemini', description: 'Gemini models via Google AI API' },
    { value: 'groq', label: 'Groq', description: 'Ultra-fast inference with Llama, Mixtral, and Gemma models' }
  ]

  const getModelPlaceholder = (provider: AiProvider) => {
    switch (provider) {
      case 'openai': return 'gpt-4o-mini'
      case 'anthropic': return 'claude-3-haiku-20240307'
      case 'gemini': return 'gemini-1.5-pro'
      case 'groq': return 'llama-3.1-70b-versatile'
      default: return ''
    }
  }

  const getModelHint = (provider: AiProvider) => {
    switch (provider) {
      case 'openai': return 'Available models: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo'
      case 'anthropic': return 'Available models: claude-3-5-sonnet-20241022, claude-3-opus-20240229, claude-3-haiku-20240307'
      case 'gemini': return 'Available models: gemini-1.5-pro, gemini-1.5-flash, gemini-pro'
      case 'groq': return 'Available models: llama-3.1-70b-versatile, llama-3.1-8b-instant, llama3-70b-8192, llama3-8b-8192, mixtral-8x7b-32768, gemma-7b-it, gemma2-9b-it'
      default: return 'The AI model to use for summarization'
    }
  }

  const needsApiKey = true // All providers now require API keys

  return (
    <div className="space-y-4">
      {/* Master Enable Switch */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium text-gray-800 dark:text-gray-200">
            Enable AI Summarization (opt-in)
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Generate concise summaries of your research sessions using AI. All settings are stored locally.
          </div>
        </div>
        <div className="ml-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={currentSettings.enabled}
              onChange={(e) => updateSettings({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 dark:peer-focus:ring-blue-500/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Configuration Panel */}
      {currentSettings.enabled && (
        <div className="mt-6 space-y-6 border-t border-gray-300 dark:border-gray-600 pt-6">
          {/* Provider Selection */}
          <Field label="AI Provider" htmlFor="provider">
            <select
              id="provider"
              value={currentSettings.provider || 'ollama'}
              onChange={(e) => updateSettings({
                provider: e.target.value as AiProvider,
                model: getModelPlaceholder(e.target.value as AiProvider)
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {providers.map(provider => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {providers.find(p => p.value === currentSettings.provider)?.description}
            </div>
          </Field>

          {/* Model */}
          <Field
            label="Model"
            htmlFor="model"
            hint={getModelHint(currentSettings.provider || 'openai')}
          >
            <input
              id="model"
              type="text"
              value={currentSettings.model || ''}
              onChange={(e) => updateSettings({ model: e.target.value })}
              onBlur={() => {}} // Save on blur is handled by the onChange
              placeholder={getModelPlaceholder(currentSettings.provider || 'openai')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </Field>

          {/* API Key (if needed) */}
          {needsApiKey && (
            <Field
              label="API Key"
              htmlFor="apiKey"
              hint="Your API key will be stored locally and never shared"
            >
              <input
                id="apiKey"
                type="password"
                value={currentSettings.apiKey || ''}
                onChange={(e) => updateSettings({ apiKey: e.target.value })}
                onBlur={() => {}} // Save on blur is handled by the onChange
                placeholder="Enter your API key"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </Field>
          )}


          {/* Advanced Settings */}
          <div className="space-y-4 pt-4 border-t border-gray-300 dark:border-gray-600">
            <h3 className="font-medium text-gray-800 dark:text-gray-200">Advanced Settings</h3>

            {/* Bullets */}
            <Field
              label={`Summary Bullets: ${currentSettings.bullets}`}
              htmlFor="bullets"
              hint="Number of bullet points in the summary (3-7)"
            >
              <input
                id="bullets"
                type="range"
                min="3"
                max="7"
                step="1"
                value={currentSettings.bullets || 5}
                onChange={(e) => updateSettings({ bullets: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </Field>

            {/* Max Characters */}
            <Field
              label={`Max Characters: ${currentSettings.maxChars}`}
              htmlFor="maxChars"
              hint="Maximum length of the summary (150-600 characters)"
            >
              <input
                id="maxChars"
                type="range"
                min="150"
                max="600"
                step="50"
                value={currentSettings.maxChars || 300}
                onChange={(e) => updateSettings({ maxChars: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </Field>

            {/* Temperature */}
            <Field
              label={`Creativity: ${currentSettings.temperature?.toFixed(1)}`}
              htmlFor="temperature"
              hint="Higher values make output more creative, lower values more focused (0.0-1.0)"
            >
              <input
                id="temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={currentSettings.temperature || 0.2}
                onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </Field>

            {/* Include Journal */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-800 dark:text-gray-200">
                  Include Journal
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Include journal entries in the summary (recommended)
                </div>
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSettings.includeJournal ?? true}
                    onChange={(e) => updateSettings({ includeJournal: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 dark:peer-focus:ring-blue-500/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Test Connection */}
          <div className="pt-4 border-t border-gray-300 dark:border-gray-600">
            <Button
              onClick={handleTestConnection}
              disabled={connectionStatus === 'testing'}
              leftIcon={
                connectionStatus === 'testing' ? 'hourglass_empty' :
                connectionStatus === 'success' ? 'check_circle' :
                connectionStatus === 'error' ? 'error' :
                'wifi'
              }
              variant={connectionStatus === 'error' ? 'danger' : 'secondary'}
            >
              {connectionStatus === 'testing' ? 'Testing Connection...' : 'Test Connection'}
            </Button>

            {connectionMessage && (
              <div className={`mt-2 p-3 rounded-md text-sm ${
                connectionStatus === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              }`}>
                {connectionMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AiSettings