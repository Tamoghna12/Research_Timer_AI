import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAccurateTimer } from '../hooks/useAccurateTimer';

describe('useAccurateTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should initialize with correct duration', () => {
    const duration = 5000; // 5 seconds
    const { result } = renderHook(() => useAccurateTimer({ duration }));
    const [state] = result.current;

    expect(state.remainingMs).toBe(5000);
    expect(state.elapsedMs).toBe(0);
    expect(state.isRunning).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.isCompleted).toBe(false);
  });

  it('should start and tick correctly', () => {
    const duration = 5000;
    const onTick = vi.fn();
    const { result } = renderHook(() => useAccurateTimer({ duration, onTick }));
    const [, controls] = result.current;

    act(() => {
      controls.start();
    });

    expect(result.current[0].isRunning).toBe(true);

    // Advance by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current[0].remainingMs).toBeLessThan(5000);
    expect(result.current[0].elapsedMs).toBeGreaterThan(900); // Allow for timing variations
    expect(onTick).toHaveBeenCalled();
  });

  it('should complete when time runs out', () => {
    const duration = 1000; // 1 second
    const onComplete = vi.fn();
    const { result } = renderHook(() => useAccurateTimer({ duration, onComplete }));
    const [, controls] = result.current;

    act(() => {
      controls.start();
    });

    // Fast-forward past the duration
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current[0].isCompleted).toBe(true);
    expect(result.current[0].isRunning).toBe(false);
    expect(result.current[0].remainingMs).toBe(0);
    expect(onComplete).toHaveBeenCalled();
  });

  it('should pause and resume correctly', () => {
    const duration = 5000;
    const { result } = renderHook(() => useAccurateTimer({ duration }));
    const [, controls] = result.current;

    // Start timer
    act(() => {
      controls.start();
    });

    // Run for 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const elapsedBeforePause = result.current[0].elapsedMs;

    // Pause
    act(() => {
      controls.pause();
    });

    expect(result.current[0].isPaused).toBe(true);
    expect(result.current[0].isRunning).toBe(false);

    // Wait while paused (should not advance)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const elapsedAfterPause = result.current[0].elapsedMs;
    expect(elapsedAfterPause).toBe(elapsedBeforePause);

    // Resume
    act(() => {
      controls.resume();
    });

    expect(result.current[0].isPaused).toBe(false);
    expect(result.current[0].isRunning).toBe(true);

    // Run for another second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Total elapsed should be approximately 2 seconds (not including pause time)
    expect(result.current[0].elapsedMs).toBeGreaterThan(1900);
    expect(result.current[0].elapsedMs).toBeLessThan(2100);
  });

  it('should reset correctly', () => {
    const duration = 5000;
    const { result } = renderHook(() => useAccurateTimer({ duration }));
    const [, controls] = result.current;

    // Start and run for a bit
    act(() => {
      controls.start();
      vi.advanceTimersByTime(2000);
    });

    expect(result.current[0].elapsedMs).toBeGreaterThan(0);

    // Reset
    act(() => {
      controls.reset();
    });

    const [state] = result.current;
    expect(state.remainingMs).toBe(5000);
    expect(state.elapsedMs).toBe(0);
    expect(state.isRunning).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.isCompleted).toBe(false);
  });

  it('should stop correctly', () => {
    const duration = 5000;
    const { result } = renderHook(() => useAccurateTimer({ duration }));
    const [, controls] = result.current;

    // Start timer
    act(() => {
      controls.start();
    });

    expect(result.current[0].isRunning).toBe(true);

    // Stop
    act(() => {
      controls.stop();
    });

    expect(result.current[0].isRunning).toBe(false);
    expect(result.current[0].isPaused).toBe(false);
  });

  it('should update duration when changed externally', () => {
    const { result, rerender } = renderHook(
      ({ duration }) => useAccurateTimer({ duration }),
      { initialProps: { duration: 5000 } }
    );

    expect(result.current[0].remainingMs).toBe(5000);

    // Change duration
    rerender({ duration: 10000 });

    expect(result.current[0].remainingMs).toBe(10000);
    expect(result.current[0].elapsedMs).toBe(0);
  });
});