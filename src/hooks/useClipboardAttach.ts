import { useState, useCallback } from 'react';
import { parseLink } from '../utils/linkUtils';
import type { LinkRef } from '../data/types';

export interface UseClipboardAttachResult {
  attachFromClipboard: () => Promise<LinkRef | null>;
  isChecking: boolean;
  error: string | null;
  lastChecked: number | null;
}

export function useClipboardAttach(): UseClipboardAttachResult {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<number | null>(null);

  const attachFromClipboard = useCallback(async (): Promise<LinkRef | null> => {
    setIsChecking(true);
    setError(null);

    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        throw new Error('Clipboard access not available');
      }

      // Read clipboard text
      const clipboardText = await navigator.clipboard.readText();

      if (!clipboardText.trim()) {
        throw new Error('Clipboard is empty');
      }

      // Check if it looks like a URL or DOI
      const text = clipboardText.trim();
      const isLikelyUrl = isValidUrl(text);
      const isLikelyDoi = text.startsWith('doi:') || text.includes('doi.org');
      const isLikelyArxiv = text.includes('arxiv.org');

      if (!isLikelyUrl && !isLikelyDoi && !isLikelyArxiv) {
        throw new Error('Clipboard content does not appear to be a link');
      }

      // Parse into LinkRef
      const linkRef = parseLink(text);
      setLastChecked(Date.now());

      return linkRef;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to read clipboard';
      setError(errorMessage);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    attachFromClipboard,
    isChecking,
    error,
    lastChecked
  };
}

// Helper function to check if text looks like a URL
function isValidUrl(text: string): boolean {
  try {
    new URL(text.startsWith('http') ? text : `https://${text}`);
    return true;
  } catch {
    // Check for domain-like patterns without protocol
    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,})/;
    const urlPattern = /^[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]+$/;

    return domainPattern.test(text) && urlPattern.test(text);
  }
}