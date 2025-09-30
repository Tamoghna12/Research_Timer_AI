import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../data/database';
import type { Session, SessionMode } from '../data/types';
import { retryDbOperation, cleanDbError } from '../utils/dbRetry';

export interface SessionFilters {
  mode?: SessionMode | 'all';
  tag?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export function useSessions(filters: SessionFilters = {}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sessions from database with retry logic
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const allSessions = await retryDbOperation(async () => {
        let query = db.sessions.orderBy('startedAt').reverse();

        // Apply date range filter
        if (filters.dateRange) {
          query = query.filter(session =>
            session.startedAt >= filters.dateRange!.from.getTime() &&
            session.startedAt <= filters.dateRange!.to.getTime()
          );
        }

        return await query.toArray();
      });

      setSessions(allSessions);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError(cleanDbError(err));
    } finally {
      setLoading(false);
    }
  }, [filters.dateRange]);

  // Refetch when filters change
  useEffect(() => {
    fetchSessions();
  }, [filters.dateRange?.from, filters.dateRange?.to, fetchSessions]);

  // Client-side filtering for mode and tag
  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    // Filter by mode
    if (filters.mode && filters.mode !== 'all') {
      filtered = filtered.filter(session => session.mode === filters.mode);
    }

    // Filter by tag
    if (filters.tag) {
      filtered = filtered.filter(session =>
        session.tags.some(tag =>
          tag.toLowerCase().includes(filters.tag!.toLowerCase())
        )
      );
    }

    return filtered;
  }, [sessions, filters.mode, filters.tag]);

  // Get unique tags for filter suggestions
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    sessions.forEach(session => {
      session.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [sessions]);

  return {
    sessions: filteredSessions,
    allTags,
    loading,
    error,
    refetch: fetchSessions
  };
}