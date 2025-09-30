import { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { useAccurateTimer } from './useAccurateTimer';
import { db } from '../data/database';
import type { Session, TimerPreset } from '../data/types';
import { debounce } from '../utils/debounce';
import { soundManager, initializeSounds } from '../utils/sounds';

export interface SessionMetadata {
  goal?: string;
  notes?: string;
  tags: string[];
  link?: string;
}

export interface SessionRunnerState {
  currentSession: Session | null;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  remainingMs: number;
  elapsedMs: number;
  plannedMs: number;
}

export interface SessionRunnerControls {
  startSession: (preset: TimerPreset, customDurationMs?: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: (cancelled?: boolean) => void;
  resetSession: () => void;
  updateMetadata: (metadata: Partial<SessionMetadata>) => void;
}

interface UseSessionRunnerOptions {
  onComplete?: (session: Session) => void;
  onMetadataUpdate?: (session: Session) => void;
  autoSaveDelayMs?: number;
}

export function useSessionRunner({
  onComplete,
  onMetadataUpdate,
  autoSaveDelayMs = 800
}: UseSessionRunnerOptions = {}): [SessionRunnerState, SessionRunnerControls] {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [plannedMs, setPlannedMs] = useState(0); // Will be set when session starts

  const pendingMetadataRef = useRef<Partial<SessionMetadata>>({});
  const isMountedRef = useRef(true);

  // Initialize sounds on first mount
  useEffect(() => {
    initializeSounds();
  }, []);

  const [timerState, timerControls] = useAccurateTimer({
    duration: plannedMs,
    onComplete: () => handleSessionComplete(),
    interval: 100
  });

  // Debounced metadata save function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveMetadataDebounced = useCallback(
    debounce(async (sessionId: string, metadata: Partial<SessionMetadata>) => {
      if (!isMountedRef.current) return;

      try {
        const now = Date.now();
        await db.sessions.update(sessionId, {
          ...metadata,
          updatedAt: now
        });

        // Update local state
        setCurrentSession(prev => {
          if (!prev || prev.id !== sessionId) return prev;
          const updated = { ...prev, ...metadata, updatedAt: now };
          onMetadataUpdate?.(updated);
          return updated;
        });
      } catch (error) {
        console.error('Failed to save session metadata:', error);
      }
    }, autoSaveDelayMs),
    [autoSaveDelayMs, onMetadataUpdate]
  );

  const handleSessionComplete = useCallback(async () => {
    if (!currentSession) return;

    try {
      const now = Date.now();
      const completedSession: Session = {
        ...currentSession,
        ...pendingMetadataRef.current,
        endedAt: now,
        status: 'completed',
        updatedAt: now
      };

      await db.sessions.update(currentSession.id, {
        endedAt: now,
        status: 'completed',
        updatedAt: now,
        ...pendingMetadataRef.current
      });

      setCurrentSession(completedSession);

      // Play completion sound
      soundManager.playComplete();

      onComplete?.(completedSession);

      // Clear pending metadata
      pendingMetadataRef.current = {};
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  }, [currentSession, onComplete]);

  const startSession = useCallback(async (preset: TimerPreset, customDurationMs?: number) => {
    const durationMs = customDurationMs ?? preset.duration * 60 * 1000;
    const now = Date.now();

    const newSession: Session = {
      id: uuid(),
      mode: preset.id,
      plannedMs: durationMs,
      startedAt: now,
      status: 'running',
      goal: '',
      notes: '',
      tags: [],
      link: '',
      createdAt: now,
      updatedAt: now
    };

    try {
      await db.sessions.add(newSession);
      setCurrentSession(newSession);

      // Clear any pending metadata
      pendingMetadataRef.current = {};

      // Set both the planned duration and the timer duration directly
      setPlannedMs(durationMs);

      // Play start sound
      soundManager.playStart();

      // Set duration directly on the timer, then reset and start
      timerControls.setDuration(durationMs);
      timerControls.reset();
      timerControls.start();
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }, [timerControls]);

  const pauseSession = useCallback(() => {
    timerControls.pause();
    soundManager.playPause();
  }, [timerControls]);

  const resumeSession = useCallback(() => {
    timerControls.resume();
    soundManager.playResume();
  }, [timerControls]);

  const stopSession = useCallback(async (cancelled = false) => {
    if (!currentSession) return;

    try {
      const now = Date.now();
      const status = cancelled ? 'cancelled' : 'completed';

      const stoppedSession: Session = {
        ...currentSession,
        ...pendingMetadataRef.current,
        endedAt: now,
        status,
        updatedAt: now
      };

      await db.sessions.update(currentSession.id, {
        endedAt: now,
        status,
        updatedAt: now,
        ...pendingMetadataRef.current
      });

      setCurrentSession(stoppedSession);
      timerControls.stop();

      // Play appropriate sound
      if (cancelled) {
        soundManager.playStop();
      } else {
        soundManager.playComplete();
      }

      if (!cancelled) {
        onComplete?.(stoppedSession);
      }

      // Clear pending metadata
      pendingMetadataRef.current = {};
    } catch (error) {
      console.error('Failed to stop session:', error);
    }
  }, [currentSession, timerControls, onComplete]);

  const resetSession = useCallback(() => {
    timerControls.reset();
    setCurrentSession(null);
    setPlannedMs(25 * 60 * 1000); // Reset to default 25 minutes
    pendingMetadataRef.current = {};
    soundManager.playStop();
  }, [timerControls]);

  const updateMetadata = useCallback((metadata: Partial<SessionMetadata>) => {
    if (!currentSession) return;

    // Store pending metadata
    pendingMetadataRef.current = { ...pendingMetadataRef.current, ...metadata };

    // Update local state immediately for UI responsiveness
    setCurrentSession(prev => {
      if (!prev) return prev;
      return { ...prev, ...metadata };
    });

    // Debounce the database write
    saveMetadataDebounced(currentSession.id, metadata);
  }, [currentSession, saveMetadataDebounced]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      saveMetadataDebounced.cancel?.();
    };
  }, [saveMetadataDebounced]);

  const state: SessionRunnerState = {
    currentSession,
    isRunning: timerState.isRunning,
    isPaused: timerState.isPaused,
    isCompleted: timerState.isCompleted,
    remainingMs: timerState.remainingMs,
    elapsedMs: timerState.elapsedMs,
    plannedMs
  };

  const controls: SessionRunnerControls = {
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    resetSession,
    updateMetadata
  };

  return [state, controls];
}