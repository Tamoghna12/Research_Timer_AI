import { useState, useEffect, useRef, useCallback } from 'react';

export interface TimerState {
  remainingMs: number;
  elapsedMs: number;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
}

export interface TimerControls {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  stop: () => void;
  setDuration: (newDuration: number) => void;
}

interface UseAccurateTimerOptions {
  duration: number; // milliseconds
  onComplete?: () => void;
  onTick?: (state: TimerState) => void;
  interval?: number; // update interval in milliseconds
}

export function useAccurateTimer({
  duration,
  onComplete,
  onTick,
  interval = 1000 // Default to 1 second for better performance
}: UseAccurateTimerOptions): [TimerState, TimerControls] {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingMs, setRemainingMs] = useState(duration);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Keep track of the current duration internally
  const [currentDuration, setCurrentDuration] = useState(duration);

  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateTimer = useCallback(() => {
    if (!startTimeRef.current) return;

    const now = Date.now();
    const totalElapsed = now - startTimeRef.current - pausedTimeRef.current;
    const remaining = Math.max(0, currentDuration - totalElapsed);

    // Only update state if there's a meaningful change (> 100ms) to reduce re-renders
    const elapsedDiff = Math.abs(totalElapsed - elapsedMs);
    const remainingDiff = Math.abs(remaining - remainingMs);

    if (elapsedDiff >= 100 || remainingDiff >= 100 || remaining === 0) {
      setElapsedMs(totalElapsed);
      setRemainingMs(remaining);
    }

    const state: TimerState = {
      remainingMs: remaining,
      elapsedMs: totalElapsed,
      isRunning,
      isPaused,
      isCompleted: remaining === 0
    };

    onTick?.(state);

    if (remaining === 0 && !isCompleted) {
      setIsCompleted(true);
      setIsRunning(false);
      onComplete?.();

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [currentDuration, isRunning, isPaused, isCompleted, onComplete, onTick, elapsedMs, remainingMs]);

  const start = useCallback(() => {
    if (isCompleted) return;

    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    setIsRunning(true);
    setIsPaused(false);

    intervalRef.current = setInterval(updateTimer, interval);
  }, [isCompleted, updateTimer, interval]);

  const pauseTimeRef = useRef<number | null>(null);

  const pause = useCallback(() => {
    if (!isRunning || isPaused) return;

    pauseTimeRef.current = Date.now();
    setIsPaused(true);
    setIsRunning(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isRunning, isPaused]);

  const resume = useCallback(() => {
    if (!isPaused || !pauseTimeRef.current) return;

    // Calculate how long we were paused and add it to our pause accumulator
    const pauseDuration = Date.now() - pauseTimeRef.current;
    pausedTimeRef.current += pauseDuration;
    pauseTimeRef.current = null;

    setIsPaused(false);
    setIsRunning(true);

    intervalRef.current = setInterval(updateTimer, interval);
  }, [isPaused, updateTimer, interval]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setIsCompleted(false);
    setRemainingMs(currentDuration);
    setElapsedMs(0);

    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    pauseTimeRef.current = null;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [currentDuration]);

  const stop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const setDuration = useCallback((newDuration: number) => {
    if (!isRunning) {
      setCurrentDuration(newDuration);
      setRemainingMs(newDuration);
      setElapsedMs(0);
      setIsCompleted(false);
    }
  }, [isRunning]);

  // Update duration when it changes externally (from props)
  useEffect(() => {
    // Always update remaining time when duration changes, unless we're actively running
    if (!isRunning) {
      setCurrentDuration(duration);
      setRemainingMs(duration);
      setElapsedMs(0);
      setIsCompleted(false);
    }
  }, [duration, isRunning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const state: TimerState = {
    remainingMs,
    elapsedMs,
    isRunning,
    isPaused,
    isCompleted
  };

  const controls: TimerControls = {
    start,
    pause,
    resume,
    reset,
    stop,
    setDuration
  };

  return [state, controls];
}