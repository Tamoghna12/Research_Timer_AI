import { useState, useCallback } from 'react';
import type { LinkRef } from '../data/types';
import { parseLink } from '../utils/linkUtils';
import { db } from '../data/database';

export interface UseSessionLinksResult {
  addLink: (sessionId: string, url: string, description?: string) => Promise<LinkRef>;
  removeLink: (sessionId: string, linkId: string) => Promise<void>;
  updateLink: (sessionId: string, linkId: string, updates: Partial<Omit<LinkRef, 'id' | 'addedAt'>>) => Promise<void>;
  addLinks: (sessionId: string, urls: string[], description?: string) => Promise<LinkRef[]>;
  replaceLinks: (sessionId: string, newLinks: LinkRef[]) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useSessionLinks(): UseSessionLinksResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLink = useCallback(async (sessionId: string, url: string, description?: string): Promise<LinkRef> => {
    setIsLoading(true);
    setError(null);

    try {
      // Parse the URL into a LinkRef
      const linkRef = parseLink(url, description);

      // Get current session
      const session = await db.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Add link to session
      const updatedLinks = [...(session.links || []), linkRef];
      await db.sessions.update(sessionId, {
        links: updatedLinks,
        updatedAt: Date.now()
      });

      return linkRef;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add link';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeLink = useCallback(async (sessionId: string, linkId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current session
      const session = await db.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Remove link from session
      const updatedLinks = (session.links || []).filter(link => link.id !== linkId);
      await db.sessions.update(sessionId, {
        links: updatedLinks,
        updatedAt: Date.now()
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove link';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateLink = useCallback(async (
    sessionId: string,
    linkId: string,
    updates: Partial<Omit<LinkRef, 'id' | 'addedAt'>>
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current session
      const session = await db.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Find and update the link
      const updatedLinks = (session.links || []).map(link => {
        if (link.id === linkId) {
          return { ...link, ...updates };
        }
        return link;
      });

      // Check if link was found
      const linkFound = updatedLinks.some(link => link.id === linkId);
      if (!linkFound) {
        throw new Error('Link not found');
      }

      await db.sessions.update(sessionId, {
        links: updatedLinks,
        updatedAt: Date.now()
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update link';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addLinks = useCallback(async (sessionId: string, urls: string[], description?: string): Promise<LinkRef[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Filter out empty URLs and parse into LinkRef objects
      const filteredUrls = urls.filter(url => url.trim().length > 0);
      const linkRefs = filteredUrls.map(url => parseLink(url.trim(), description));

      // Get current session
      const session = await db.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Add links to session
      const updatedLinks = [...(session.links || []), ...linkRefs];
      await db.sessions.update(sessionId, {
        links: updatedLinks,
        updatedAt: Date.now()
      });

      return linkRefs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add links';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const replaceLinks = useCallback(async (sessionId: string, newLinks: LinkRef[]): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current session to ensure it exists
      const session = await db.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Replace all links
      await db.sessions.update(sessionId, {
        links: newLinks,
        updatedAt: Date.now()
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to replace links';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    addLink,
    removeLink,
    updateLink,
    addLinks,
    replaceLinks,
    isLoading,
    error
  };
}