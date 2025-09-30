import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionLinks } from './useSessionLinks';
import * as database from '../data/database';
import type { Session, LinkRef } from '../data/types';

// Mock the database
vi.mock('../data/database', () => ({
  db: {
    sessions: {
      get: vi.fn(),
      update: vi.fn()
    }
  }
}));

const mockDb = database.db as unknown as {
  sessions: {
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
  };
  sessionLinks: {
    where: ReturnType<typeof vi.fn>;
    toArray: ReturnType<typeof vi.fn>;
    add: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-123'
  }
});

describe('useSessionLinks', () => {
  const mockSession: Session = {
    id: 'session-1',
    mode: 'lit',
    plannedMs: 25 * 60 * 1000,
    startedAt: Date.now(),
    status: 'running',
    tags: [],
    links: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.sessions.get.mockResolvedValue(mockSession);
    mockDb.sessions.update.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addLink', () => {
    it('should add a link to a session', async () => {
      const { result } = renderHook(() => useSessionLinks());

      await act(async () => {
        const linkRef = await result.current.addLink('session-1', 'https://github.com/user/repo');

        expect(linkRef).toMatchObject({
          id: 'test-uuid-123',
          type: 'github',
          url: 'https://github.com/user/repo',
          title: 'user/repo'
        });
      });

      expect(mockDb.sessions.get).toHaveBeenCalledWith('session-1');
      expect(mockDb.sessions.update).toHaveBeenCalledWith('session-1', {
        links: [expect.objectContaining({
          id: 'test-uuid-123',
          type: 'github',
          url: 'https://github.com/user/repo'
        })],
        updatedAt: expect.any(Number)
      });
    });

    it('should add link with description', async () => {
      const { result } = renderHook(() => useSessionLinks());

      await act(async () => {
        const linkRef = await result.current.addLink('session-1', 'doi:10.1000/test', 'Test paper');

        expect(linkRef.description).toBe('Test paper');
      });
    });

    it('should throw error if session not found', async () => {
      mockDb.sessions.get.mockResolvedValue(null);
      const { result } = renderHook(() => useSessionLinks());

      await act(async () => {
        await expect(result.current.addLink('nonexistent', 'https://example.com'))
          .rejects.toThrow('Session not found');
      });
    });

    it('should handle empty URL', async () => {
      const { result } = renderHook(() => useSessionLinks());

      await act(async () => {
        await expect(result.current.addLink('session-1', ''))
          .rejects.toThrow('URL is required');
      });
    });
  });

  describe('removeLink', () => {
    it('should remove a link from session', async () => {
      const sessionWithLinks = {
        ...mockSession,
        links: [
          { id: 'link-1', type: 'url', url: 'https://example.com', addedAt: Date.now() },
          { id: 'link-2', type: 'doi', url: 'doi:10.1000/test', addedAt: Date.now() }
        ] as LinkRef[]
      };

      mockDb.sessions.get.mockResolvedValue(sessionWithLinks);
      const { result } = renderHook(() => useSessionLinks());

      await act(async () => {
        await result.current.removeLink('session-1', 'link-1');
      });

      expect(mockDb.sessions.update).toHaveBeenCalledWith('session-1', {
        links: [expect.objectContaining({ id: 'link-2' })],
        updatedAt: expect.any(Number)
      });
    });

    it('should handle removing non-existent link gracefully', async () => {
      const { result } = renderHook(() => useSessionLinks());

      await act(async () => {
        await result.current.removeLink('session-1', 'nonexistent-link');
      });

      expect(mockDb.sessions.update).toHaveBeenCalledWith('session-1', {
        links: [],
        updatedAt: expect.any(Number)
      });
    });
  });

  describe('updateLink', () => {
    it('should update a link in session', async () => {
      const sessionWithLinks = {
        ...mockSession,
        links: [
          { id: 'link-1', type: 'url', url: 'https://example.com', title: 'Example', addedAt: Date.now() }
        ] as LinkRef[]
      };

      mockDb.sessions.get.mockResolvedValue(sessionWithLinks);
      const { result } = renderHook(() => useSessionLinks());

      await act(async () => {
        await result.current.updateLink('session-1', 'link-1', {
          title: 'Updated Example',
          description: 'Updated description'
        });
      });

      expect(mockDb.sessions.update).toHaveBeenCalledWith('session-1', {
        links: [expect.objectContaining({
          id: 'link-1',
          title: 'Updated Example',
          description: 'Updated description'
        })],
        updatedAt: expect.any(Number)
      });
    });

    it('should throw error if link not found', async () => {
      const { result } = renderHook(() => useSessionLinks());

      await act(async () => {
        await expect(result.current.updateLink('session-1', 'nonexistent', { title: 'New Title' }))
          .rejects.toThrow('Link not found');
      });
    });
  });

  describe('addLinks', () => {
    it('should add multiple links to session', async () => {
      const { result } = renderHook(() => useSessionLinks());

      await act(async () => {
        const linkRefs = await result.current.addLinks('session-1', [
          'https://github.com/user/repo',
          'doi:10.1000/test'
        ]);

        expect(linkRefs).toHaveLength(2);
        expect(linkRefs[0].type).toBe('github');
        expect(linkRefs[1].type).toBe('doi');
      });

      expect(mockDb.sessions.update).toHaveBeenCalledWith('session-1', {
        links: expect.arrayContaining([
          expect.objectContaining({ type: 'github' }),
          expect.objectContaining({ type: 'doi' })
        ]),
        updatedAt: expect.any(Number)
      });
    });

    it('should filter out empty URLs', async () => {
      const { result } = renderHook(() => useSessionLinks());

      await act(async () => {
        const linkRefs = await result.current.addLinks('session-1', [
          'https://example.com',
          '',
          '   ',
          'https://github.com/test/repo'
        ]);

        expect(linkRefs).toHaveLength(2);
      });
    });
  });

  describe('replaceLinks', () => {
    it('should replace all links in session', async () => {
      const newLinks: LinkRef[] = [
        { id: 'new-link-1', type: 'url', url: 'https://new.com', addedAt: Date.now() }
      ];

      const { result } = renderHook(() => useSessionLinks());

      await act(async () => {
        await result.current.replaceLinks('session-1', newLinks);
      });

      expect(mockDb.sessions.update).toHaveBeenCalledWith('session-1', {
        links: newLinks,
        updatedAt: expect.any(Number)
      });
    });
  });

  describe('loading and error states', () => {
    it('should initialize with correct loading state', () => {
      const { result } = renderHook(() => useSessionLinks());
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set error state on database error', async () => {
      mockDb.sessions.update.mockRejectedValue(new Error('Database error'));
      const { result } = renderHook(() => useSessionLinks());

      await act(async () => {
        await expect(result.current.addLink('session-1', 'https://example.com'))
          .rejects.toThrow('Database error');
      });

      expect(result.current.error).toBe('Database error');
    });
  });
});