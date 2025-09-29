import { useState, useEffect, useCallback, useRef } from 'react';

export interface PomodoroTimerState {
  timeRemaining: number; // in milliseconds
  isRunning: boolean;
  isPaused: boolean;
  currentMode: 'work' | 'shortBreak' | 'longBreak';
  currentSession: number; // current session in the cycle
  completedPomodoros: number;
  completedCycles: number;
  progress: number; // 0-100 percentage
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsPerCycle: number; // number of work sessions before long break
  autoStartBreaks: boolean;
  autoStartWork: boolean;
}

export interface PomodoroTimerControls {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  updateSettings: (settings: Partial<PomodoroSettings>) => void;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsPerCycle: 4,
  autoStartBreaks: false,
  autoStartWork: false,
};

export function usePomodoroTimer(
  initialSettings: Partial<PomodoroSettings> = {},
  onComplete?: (mode: 'work' | 'shortBreak' | 'longBreak') => void,
  onModeChange?: (newMode: 'work' | 'shortBreak' | 'longBreak') => void
): [PomodoroTimerState, PomodoroTimerControls] {
  const [settings, setSettings] = useState<PomodoroSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });

  const [timeRemaining, setTimeRemaining] = useState<number>(
    settings.workDuration * 60 * 1000
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentMode, setCurrentMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [currentSession, setCurrentSession] = useState(1);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);

  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  // Calculate current session duration
  const getCurrentDuration = useCallback(() => {
    switch (currentMode) {
      case 'work':
        return settings.workDuration * 60 * 1000;
      case 'shortBreak':
        return settings.shortBreakDuration * 60 * 1000;
      case 'longBreak':
        return settings.longBreakDuration * 60 * 1000;
      default:
        return settings.workDuration * 60 * 1000;
    }
  }, [currentMode, settings]);

  // Calculate progress percentage
  const progress = Math.max(0, Math.min(100,
    ((getCurrentDuration() - timeRemaining) / getCurrentDuration()) * 100
  ));

  // Timer tick function using more accurate timing
  const tick = useCallback(() => {
    const now = Date.now();
    const elapsed = now - startTimeRef.current;
    const totalElapsed = accumulatedTimeRef.current + elapsed;
    const duration = getCurrentDuration();
    const remaining = Math.max(0, duration - totalElapsed);

    setTimeRemaining(remaining);

    if (remaining <= 0) {
      // Timer completed
      setIsRunning(false);
      setIsPaused(false);
      accumulatedTimeRef.current = 0;

      onComplete?.(currentMode);

      // Determine next mode
      let nextMode: 'work' | 'shortBreak' | 'longBreak';
      let nextSession = currentSession;
      let newCompletedPomodoros = completedPomodoros;
      let newCompletedCycles = completedCycles;

      if (currentMode === 'work') {
        newCompletedPomodoros += 1;

        if (currentSession >= settings.sessionsPerCycle) {
          // Long break after completing a cycle
          nextMode = 'longBreak';
          nextSession = 1;
          newCompletedCycles += 1;
        } else {
          // Short break
          nextMode = 'shortBreak';
          nextSession += 1;
        }
      } else {
        // Break finished, back to work
        nextMode = 'work';
      }

      // Update state
      setCurrentMode(nextMode);
      setCurrentSession(nextSession);
      setCompletedPomodoros(newCompletedPomodoros);
      setCompletedCycles(newCompletedCycles);
      onModeChange?.(nextMode);

      // Set time for next session
      const nextDuration = (() => {
        switch (nextMode) {
          case 'work': return settings.workDuration * 60 * 1000;
          case 'shortBreak': return settings.shortBreakDuration * 60 * 1000;
          case 'longBreak': return settings.longBreakDuration * 60 * 1000;
        }
      })();

      setTimeRemaining(nextDuration);

      // Auto-start if enabled
      if (
        (nextMode !== 'work' && settings.autoStartBreaks) ||
        (nextMode === 'work' && settings.autoStartWork)
      ) {
        // Auto-start after a brief delay
        setTimeout(() => {
          startTimeRef.current = Date.now();
          accumulatedTimeRef.current = 0;
          setIsRunning(true);
          setIsPaused(false);
        }, 1000);
      }
    }
  }, [currentMode, currentSession, completedPomodoros, completedCycles, settings, onComplete, onModeChange, getCurrentDuration]);

  // Timer effect - using ref to avoid stale closure issues
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(() => {
          const now = Date.now();
          const elapsed = now - startTimeRef.current;
          const totalElapsed = accumulatedTimeRef.current + elapsed;
          const duration = getCurrentDuration();
          const remaining = Math.max(0, duration - totalElapsed);

          if (remaining <= 0) {
            // Timer completed - trigger completion logic
            setTimeout(() => tick(), 0);
            return 0;
          }

          return remaining;
        });
      }, 100); // Update every 100ms for smooth progress
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isRunning, isPaused, tick, getCurrentDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Controls
  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    accumulatedTimeRef.current = 0;
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (isRunning) {
      const now = Date.now();
      accumulatedTimeRef.current += now - startTimeRef.current;
      setIsRunning(false);
      setIsPaused(true);
    }
  }, [isRunning]);

  const resume = useCallback(() => {
    if (isPaused) {
      startTimeRef.current = Date.now();
      setIsRunning(true);
      setIsPaused(false);
    }
  }, [isPaused]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    accumulatedTimeRef.current = 0;
    setTimeRemaining(getCurrentDuration());
  }, [getCurrentDuration]);

  const skip = useCallback(() => {
    setTimeRemaining(0);
    // The tick function will handle the transition
  }, []);

  const updateSettings = useCallback((newSettings: Partial<PomodoroSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };

      // If we're not running, update the time remaining for current mode
      if (!isRunning && !isPaused) {
        const newDuration = (() => {
          switch (currentMode) {
            case 'work': return updated.workDuration * 60 * 1000;
            case 'shortBreak': return updated.shortBreakDuration * 60 * 1000;
            case 'longBreak': return updated.longBreakDuration * 60 * 1000;
          }
        })();
        setTimeRemaining(newDuration);
      }

      return updated;
    });
  }, [isRunning, isPaused, currentMode]);

  const state: PomodoroTimerState = {
    timeRemaining,
    isRunning,
    isPaused,
    currentMode,
    currentSession,
    completedPomodoros,
    completedCycles,
    progress,
  };

  const controls: PomodoroTimerControls = {
    start,
    pause,
    resume,
    reset,
    skip,
    updateSettings,
  };

  return [state, controls];
}