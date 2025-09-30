import { useState, useRef, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/database';
import type { Session } from '../data/types';
import { getAdapter } from '../ai';
import { buildPromptFromSession } from '../ai/buildPrompt';
import { cleanError } from '../ai/adapter';

export interface UseAiResult {
  enabled: boolean;
  isConfigured: boolean;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  result: string | null;
  testConnection: () => Promise<{ ok: boolean; message?: string }>;
  generateSummary: (session: Session) => Promise<{ text: string; tokensIn?: number; tokensOut?: number } | null>;
  cancel: () => void;
}

export function useAi(): UseAiResult {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // Load AI settings from Dexie
  const settings = useLiveQuery(async () => {
    const appSettings = await db.settings.get('app');
    return appSettings?.ai;
  }, []);

  // Reset state when settings change
  useEffect(() => {
    setStatus('idle');
    setError(null);
    setResult(null);
  }, [settings]);

  const enabled = settings?.enabled ?? false;

  const isConfigured = useCallback(() => {
    if (!settings || !enabled) return false;
    if (!settings.provider) return false;
    if (!settings.model) return false;

    // All providers now need API keys
    if (!settings.apiKey) {
      return false;
    }

    return true;
  }, [settings, enabled]);

  const testConnection = useCallback(async () => {
    if (!settings || !enabled) {
      return {
        ok: false,
        message: 'AI is not enabled or configured'
      };
    }

    if (!isConfigured()) {
      return {
        ok: false,
        message: 'AI provider not properly configured'
      };
    }

    try {
      const adapter = getAdapter(settings.provider!);
      const controller = new AbortController();
      controllerRef.current = controller;

      const result = await adapter.testConnection({
        model: settings.model!,
        apiKey: settings.apiKey,
        signal: controller.signal
      });

      return result;
    } catch (error) {
      return {
        ok: false,
        message: cleanError(error)
      };
    }
  }, [settings, enabled, isConfigured]);

  const generateSummary = useCallback(async (session: Session) => {
    if (!settings || !enabled) {
      setError('AI is not enabled');
      setStatus('error');
      return null;
    }

    if (!isConfigured()) {
      setError('AI provider not configured');
      setStatus('error');
      return null;
    }

    setStatus('loading');
    setError(null);
    setResult(null);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const adapter = getAdapter(settings.provider!);

      // Build prompt from session
      const prompt = buildPromptFromSession(session, {
        bullets: settings.bullets || 5,
        maxChars: settings.maxChars || 300,
        includeJournal: settings.includeJournal ?? true
      });

      // Handle minimal content case
      if (!session.goal?.trim() && !session.notes?.trim() && !session.journal) {
        const fallbackText = '- Session completed; notes were sparse.';
        setResult(fallbackText);
        setStatus('success');
        return {
          text: fallbackText,
          tokensIn: 0,
          tokensOut: 0
        };
      }

      const result = await adapter.summarize(prompt, {
        model: settings.model!,
        apiKey: settings.apiKey,
        temperature: settings.temperature || 0.2,
        maxTokens: 200,
        signal: controller.signal
      });

      setResult(result.text);
      setStatus('success');
      return result;

    } catch (error) {
      if (controller.signal.aborted) {
        setStatus('idle');
        return null;
      }

      const errorMessage = cleanError(error);
      setError(errorMessage);
      setStatus('error');
      return null;
    }
  }, [settings, enabled, isConfigured]);

  const cancel = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    setStatus('idle');
    setError(null);
  }, []);

  return {
    enabled,
    isConfigured: isConfigured(),
    status,
    error,
    result,
    testConnection,
    generateSummary,
    cancel
  };
}