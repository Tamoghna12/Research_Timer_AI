import { describe, it, expect, beforeEach, vi } from 'vitest'
import { exportAll, importPreview, importApply, type BackupFile } from './backup'
import { db } from './database'
import type { Session, AppSettings } from './types'

// Mock the database
vi.mock('./database', () => ({
  db: {
    sessions: {
      orderBy: vi.fn(),
      toArray: vi.fn(),
      add: vi.fn(),
      put: vi.fn()
    },
    settings: {
      get: vi.fn(),
      put: vi.fn()
    },
    transaction: vi.fn()
  }
}))

const mockDb = vi.mocked(db)

describe('backup', () => {
  const mockSession: Session = {
    id: 'session-1',
    mode: 'lit',
    plannedMs: 25 * 60 * 1000,
    startedAt: Date.now(),
    endedAt: Date.now() + 25 * 60 * 1000,
    status: 'completed',
    tags: ['#research'],
    goal: 'Test session',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  const mockSettings: AppSettings = {
    id: 'app',
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    privacy: {
      telemetryEnabled: false,
      userAnonId: 'test-uuid'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportAll', () => {
    it('should return valid backup structure with correct counts', async () => {
      const sessions = [mockSession]
      mockDb.sessions.orderBy.mockReturnValue({
        toArray: vi.fn().mockResolvedValue(sessions)
      } as { toArray: () => Promise<Session[]> })
      mockDb.settings.get.mockResolvedValue(mockSettings)

      const backup = await exportAll()

      expect(backup.kind).toBe('research-timer-backup')
      expect(backup.version).toBe(1)
      expect(backup.sessions).toEqual(sessions)
      expect(backup.settings).toEqual(mockSettings)
      expect(typeof backup.createdAt).toBe('number')
    })

    it('should throw error if settings not found', async () => {
      mockDb.sessions.orderBy.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      } as { toArray: () => Promise<Session[]> })
      mockDb.settings.get.mockResolvedValue(undefined)

      await expect(exportAll()).rejects.toThrow('App settings not found')
    })
  })

  describe('importPreview', () => {
    const mockBackup: BackupFile = {
      kind: 'research-timer-backup',
      version: 1,
      createdAt: Date.now(),
      sessions: [mockSession],
      settings: mockSettings
    }

    it('should categorize sessions correctly by updatedAt', async () => {
      const existingSessions = [
        { ...mockSession, id: 'existing-1', updatedAt: Date.now() - 1000 },
        { ...mockSession, id: 'existing-2', updatedAt: Date.now() + 1000 }
      ]

      const importSessions = [
        { ...mockSession, id: 'new-1', updatedAt: Date.now() },
        { ...mockSession, id: 'existing-1', updatedAt: Date.now() }, // should update
        { ...mockSession, id: 'existing-2', updatedAt: Date.now() - 2000 } // should skip
      ]

      mockDb.sessions.toArray.mockResolvedValue(existingSessions)

      const preview = await importPreview({
        ...mockBackup,
        sessions: importSessions
      })

      expect(preview.sessionsToAdd).toBe(1) // new-1
      expect(preview.sessionsToUpdate).toBe(1) // existing-1 (newer)
      expect(preview.sessionsSkipped).toBe(1) // existing-2 (older)
    })

    it('should validate backup file format', async () => {
      await expect(importPreview({
        ...mockBackup,
        kind: 'invalid' as 'research-timer-backup'
      })).rejects.toThrow('Invalid backup file: not a research timer backup')

      await expect(importPreview({
        ...mockBackup,
        version: 2 as 1
      })).rejects.toThrow('Unsupported backup version: 2')
    })
  })

  describe('importApply', () => {
    const mockPreview = {
      sessionsToAdd: 1,
      sessionsToUpdate: 1,
      sessionsSkipped: 1
    }

    const mockBackup: BackupFile = {
      kind: 'research-timer-backup',
      version: 1,
      createdAt: Date.now(),
      sessions: [mockSession],
      settings: mockSettings
    }

    it('should write expected rows with transaction integrity', async () => {
      const existingSessions = [
        { ...mockSession, updatedAt: Date.now() - 1000 }
      ]

      mockDb.sessions.toArray.mockResolvedValue(existingSessions)
      mockDb.settings.get.mockResolvedValue(mockSettings)

      // Mock transaction
      mockDb.transaction.mockImplementation(async (mode, stores, callback) => {
        return callback()
      })

      const result = await importApply(mockBackup, mockPreview)

      expect(mockDb.transaction).toHaveBeenCalledWith('rw', [mockDb.sessions, mockDb.settings], expect.any(Function))
      expect(typeof result.added).toBe('number')
      expect(typeof result.updated).toBe('number')
      expect(typeof result.skipped).toBe('number')
    })
  })
})