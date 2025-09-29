import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSettings } from './useSettings'
import type { AppSettings, ResearcherProfile, PrivacySettings, AiSettings } from '../data/types'

// Mock Dexie
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn()
}))

vi.mock('../data/database', () => ({
  db: {
    settings: {
      get: vi.fn(),
      put: vi.fn()
    }
  }
}))

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../data/database'

const mockUseLiveQuery = vi.mocked(useLiveQuery)
const mockDb = vi.mocked(db)

describe('useSettings', () => {
  const mockSettings: AppSettings = {
    id: 'app',
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    privacy: {
      telemetryEnabled: false,
      userAnonId: 'test-uuid'
    },
    researcher: {
      name: 'Dr. Test',
      affiliation: 'Test University'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLiveQuery.mockReturnValue(mockSettings)
    mockDb.settings.get.mockResolvedValue(mockSettings)
  })

  it('should return settings from useLiveQuery', () => {
    const { result } = renderHook(() => useSettings())

    expect(result.current.settings).toEqual(mockSettings)
    expect(result.current.get()).toEqual(mockSettings)
  })

  it('should save profile and update timestamps', async () => {
    const { result } = renderHook(() => useSettings())

    const newProfile: ResearcherProfile = {
      name: 'Dr. Updated',
      affiliation: 'Updated University'
    }

    await act(async () => {
      await result.current.saveProfile(newProfile)
    })

    expect(mockDb.settings.put).toHaveBeenCalledWith({
      ...mockSettings,
      researcher: newProfile,
      updatedAt: expect.any(Number)
    })
  })

  it('should save privacy settings and update timestamps', async () => {
    const { result } = renderHook(() => useSettings())

    const newPrivacy: PrivacySettings = {
      telemetryEnabled: true,
      userAnonId: 'new-uuid'
    }

    await act(async () => {
      await result.current.savePrivacy(newPrivacy)
    })

    expect(mockDb.settings.put).toHaveBeenCalledWith({
      ...mockSettings,
      privacy: newPrivacy,
      updatedAt: expect.any(Number)
    })
  })

  it('should save AI settings and update timestamps', async () => {
    const { result } = renderHook(() => useSettings())

    const newAi: AiSettings = {
      enabled: true,
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: 'test-key',
      bullets: 5,
      maxChars: 300,
      temperature: 0.2,
      includeJournal: true
    }

    await act(async () => {
      await result.current.saveAi(newAi)
    })

    expect(mockDb.settings.put).toHaveBeenCalledWith({
      ...mockSettings,
      ai: newAi,
      updatedAt: expect.any(Number)
    })
  })

  it('should throw error if settings not initialized', async () => {
    mockDb.settings.get.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSettings())

    await expect(
      act(async () => {
        await result.current.saveProfile({ name: 'Test' })
      })
    ).rejects.toThrow('App settings not initialized')
  })

  it('should persist across reload', async () => {
    // Simulate settings persisting
    const persistedSettings = { ...mockSettings, updatedAt: Date.now() + 1000 }
    mockUseLiveQuery.mockReturnValue(persistedSettings)

    const { result } = renderHook(() => useSettings())

    expect(result.current.settings).toEqual(persistedSettings)
  })
})