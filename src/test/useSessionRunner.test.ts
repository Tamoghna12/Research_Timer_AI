import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionRunner } from '../hooks/useSessionRunner';
import { db } from '../data/database';
import { TIMER_PRESETS } from '../data/types';

describe('useSessionRunner', () => {
  beforeEach(async () => {
    // Clear database before each test
    await db.sessions.clear();
    await db.settings.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should initialize with no active session', () => {
    const { result } = renderHook(() => useSessionRunner());
    const [state] = result.current;

    expect(state.currentSession).toBeNull();
    expect(state.isRunning).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.isCompleted).toBe(false);
  });

  it('should create a session when starting', async () => {
    const { result } = renderHook(() => useSessionRunner());
    const [, controls] = result.current;

    await act(async () => {
      await controls.startSession(TIMER_PRESETS[0]); // Lit Review preset
    });

    const [state] = result.current;
    expect(state.currentSession).not.toBeNull();
    expect(state.currentSession?.mode).toBe('lit');
    expect(state.currentSession?.plannedMs).toBe(25 * 60 * 1000);
    expect(state.currentSession?.status).toBe('running');

    // Check that session was saved to database
    const sessionInDb = await db.sessions.get(state.currentSession!.id);
    expect(sessionInDb).toBeTruthy();
    expect(sessionInDb?.mode).toBe('lit');
  });

  it('should update session metadata with debounced writes', async () => {
    const { result } = renderHook(() => useSessionRunner());
    const [, controls] = result.current;

    // Start a session
    await act(async () => {
      await controls.startSession(TIMER_PRESETS[0]);
    });

    const sessionId = result.current[0].currentSession!.id;

    // Update metadata
    act(() => {
      controls.updateMetadata({ goal: 'Test goal', notes: 'Test notes' });
    });

    // Check immediate UI update
    expect(result.current[0].currentSession?.goal).toBe('Test goal');
    expect(result.current[0].currentSession?.notes).toBe('Test notes');

    // Fast-forward time to trigger debounced save
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Check database was updated
    const sessionInDb = await db.sessions.get(sessionId);
    expect(sessionInDb?.goal).toBe('Test goal');
    expect(sessionInDb?.notes).toBe('Test notes');
  });

  it('should handle session completion', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useSessionRunner({ onComplete }));
    const [, controls] = result.current;

    await act(async () => {
      await controls.startSession(TIMER_PRESETS[0], 1000); // 1 second for quick test
    });

    const sessionId = result.current[0].currentSession!.id;

    // Fast-forward time to complete the session
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(onComplete).toHaveBeenCalled();
    expect(result.current[0].isCompleted).toBe(true);

    // Check database was updated
    const sessionInDb = await db.sessions.get(sessionId);
    expect(sessionInDb?.status).toBe('completed');
    expect(sessionInDb?.endedAt).toBeTruthy();
  });

  it('should handle manual session stop', async () => {
    const { result } = renderHook(() => useSessionRunner());
    const [, controls] = result.current;

    await act(async () => {
      await controls.startSession(TIMER_PRESETS[0]);
    });

    const sessionId = result.current[0].currentSession!.id;

    // Stop the session manually
    await act(async () => {
      await controls.stopSession();
    });

    // Check session was completed
    const sessionInDb = await db.sessions.get(sessionId);
    expect(sessionInDb?.status).toBe('completed');
    expect(sessionInDb?.endedAt).toBeTruthy();
  });

  it('should handle cancelled sessions', async () => {
    const { result } = renderHook(() => useSessionRunner());
    const [, controls] = result.current;

    await act(async () => {
      await controls.startSession(TIMER_PRESETS[0]);
    });

    const sessionId = result.current[0].currentSession!.id;

    // Cancel the session
    await act(async () => {
      await controls.stopSession(true);
    });

    // Check session was cancelled
    const sessionInDb = await db.sessions.get(sessionId);
    expect(sessionInDb?.status).toBe('cancelled');
  });

  it('should calculate correct duration', async () => {
    const { result } = renderHook(() => useSessionRunner());
    const [, controls] = result.current;

    await act(async () => {
      await controls.startSession(TIMER_PRESETS[0], 5000); // 5 seconds
    });

    const sessionId = result.current[0].currentSession!.id;
    // const startTime = result.current[0].currentSession!.startedAt;

    // Run for 3 seconds then stop
    await act(async () => {
      vi.advanceTimersByTime(3000);
      await controls.stopSession();
    });

    const sessionInDb = await db.sessions.get(sessionId);
    const duration = sessionInDb!.endedAt! - sessionInDb!.startedAt;

    // Should be approximately 3000ms (allowing for small timing differences)
    expect(duration).toBeGreaterThan(2900);
    expect(duration).toBeLessThan(3100);
  });

  it('should handle tags correctly', async () => {
    const { result } = renderHook(() => useSessionRunner());
    const [, controls] = result.current;

    await act(async () => {
      await controls.startSession(TIMER_PRESETS[0]);
    });

    const sessionId = result.current[0].currentSession!.id;

    // Update tags
    act(() => {
      controls.updateMetadata({ tags: ['#research', '#analysis', '#test'] });
    });

    // Check immediate update
    expect(result.current[0].currentSession?.tags).toEqual(['#research', '#analysis', '#test']);

    // Wait for debounced save
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Check database
    const sessionInDb = await db.sessions.get(sessionId);
    expect(sessionInDb?.tags).toEqual(['#research', '#analysis', '#test']);
  });
});