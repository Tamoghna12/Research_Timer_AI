export type TelemetryEvent =
  | { name: 'app_open' }
  | { name: 'session_start'; props: { plannedMs: number; mode: string } }
  | { name: 'session_complete'; props: { actualMs: number; mode: string } }
  | { name: 'export_weekly' }
  | { name: 'ai_summary_generated' };

export interface Telemetry {
  enabled: () => boolean;
  record: (evt: TelemetryEvent) => Promise<void>;
}

export function createTelemetry(
  getPrivacy: () => { telemetryEnabled: boolean; userAnonId: string }
): Telemetry {
  return {
    enabled: () => !!getPrivacy().telemetryEnabled,

    record: async () => {
      if (!getPrivacy().telemetryEnabled) return;

      // NO-OP STUB. Intentionally does nothing.
      // If wired later, send only anonymous counters; NEVER notes/journals/links.
      // This would be where you'd send data to an analytics service
      // with only the anonymous user ID and event type/props
    }
  };
}