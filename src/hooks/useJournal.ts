import { useState, useEffect, useCallback } from 'react';
import { db } from '../data/database';
import type { SessionJournal, SessionMode, AiSummaryMeta, Session } from '../data/types';

export interface JournalData {
  mode: SessionMode;
  journal?: SessionJournal;
  journalDraft?: Partial<SessionJournal>;
}

export function useJournal(sessionId: string) {
  const [data, setData] = useState<JournalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await db.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      setData({
        mode: session.mode,
        journal: session.journal,
        journalDraft: session.journalDraft
      });
    } catch (err) {
      console.error('Failed to load journal:', err);
      setError(err instanceof Error ? err.message : 'Failed to load journal');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const save = useCallback(async (journal: SessionJournal, aiSummary?: string, aiSummaryMeta?: AiSummaryMeta) => {
    try {
      const now = Date.now();
      const updateData: Partial<Session> = {
        journal,
        journalDraft: undefined, // Clear draft when saving final
        updatedAt: now
      };

      if (aiSummary !== undefined) {
        updateData.aiSummary = aiSummary || undefined;
      }
      if (aiSummaryMeta !== undefined) {
        updateData.aiSummaryMeta = aiSummaryMeta || undefined;
      }

      await db.sessions.update(sessionId, updateData);

      setData(prev => prev ? { ...prev, journal, journalDraft: undefined } : null);
    } catch (err) {
      console.error('Failed to save journal:', err);
      throw new Error('Failed to save journal');
    }
  }, [sessionId]);

  const saveDraft = useCallback(async (partialJournal: Partial<SessionJournal>) => {
    try {
      const now = Date.now();
      await db.sessions.update(sessionId, {
        journalDraft: partialJournal,
        updatedAt: now
      });

      setData(prev => prev ? { ...prev, journalDraft: partialJournal } : null);
    } catch (err) {
      console.error('Failed to save journal draft:', err);
      // Don't throw - draft saves should be silent
    }
  }, [sessionId]);

  const clearDraft = useCallback(async () => {
    try {
      const now = Date.now();
      await db.sessions.update(sessionId, {
        journalDraft: undefined,
        updatedAt: now
      });

      setData(prev => prev ? { ...prev, journalDraft: undefined } : null);
    } catch (err) {
      console.error('Failed to clear journal draft:', err);
      // Don't throw - this is a cleanup operation
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      load();
    }
  }, [sessionId, load]);

  return {
    data,
    loading,
    error,
    save,
    saveDraft,
    clearDraft,
    reload: load
  };
}