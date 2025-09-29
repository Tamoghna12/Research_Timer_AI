import { describe, it, expect, vi } from 'vitest'
import { createTelemetry, type TelemetryEvent } from './telemetry'

describe('telemetry', () => {
  describe('createTelemetry', () => {
    it('should return enabled false when telemetry disabled', () => {
      const getPrivacy = vi.fn().mockReturnValue({
        telemetryEnabled: false,
        userAnonId: 'test-uuid'
      })

      const telemetry = createTelemetry(getPrivacy)

      expect(telemetry.enabled()).toBe(false)
    })

    it('should return enabled true when telemetry enabled', () => {
      const getPrivacy = vi.fn().mockReturnValue({
        telemetryEnabled: true,
        userAnonId: 'test-uuid'
      })

      const telemetry = createTelemetry(getPrivacy)

      expect(telemetry.enabled()).toBe(true)
    })

    it('should be no-op when disabled', async () => {
      const getPrivacy = vi.fn().mockReturnValue({
        telemetryEnabled: false,
        userAnonId: 'test-uuid'
      })

      const telemetry = createTelemetry(getPrivacy)

      const event: TelemetryEvent = { name: 'app_open' }
      await expect(telemetry.record(event)).resolves.toBeUndefined()
      expect(getPrivacy).toHaveBeenCalled()
    })

    it('should be callable when enabled but still no-op stub', async () => {
      const getPrivacy = vi.fn().mockReturnValue({
        telemetryEnabled: true,
        userAnonId: 'test-uuid'
      })

      const telemetry = createTelemetry(getPrivacy)

      const events: TelemetryEvent[] = [
        { name: 'app_open' },
        { name: 'session_start', props: { plannedMs: 25 * 60 * 1000, mode: 'lit' } },
        { name: 'session_complete', props: { actualMs: 23 * 60 * 1000, mode: 'lit' } },
        { name: 'export_weekly' },
        { name: 'ai_summary_generated' }
      ]

      for (const event of events) {
        await expect(telemetry.record(event)).resolves.toBeUndefined()
      }

      expect(getPrivacy).toHaveBeenCalledTimes(events.length)
    })

    it('should check privacy settings each time record is called', async () => {
      const getPrivacy = vi.fn()
        .mockReturnValueOnce({ telemetryEnabled: false, userAnonId: 'test' })
        .mockReturnValueOnce({ telemetryEnabled: true, userAnonId: 'test' })

      const telemetry = createTelemetry(getPrivacy)

      await telemetry.record({ name: 'app_open' })
      await telemetry.record({ name: 'app_open' })

      expect(getPrivacy).toHaveBeenCalledTimes(2)
    })
  })
})