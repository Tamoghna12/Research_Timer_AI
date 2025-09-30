import React, { useState, useEffect, useCallback, useMemo } from 'react'
import JournalModal from '../components/JournalModal'
import FocusMusic from '../components/music/FocusMusic'
import OnboardingModal from '../components/onboarding/OnboardingModal'
import { useSessionRunner } from '../hooks/useSessionRunner'
import { usePomodoroTimer } from '../hooks/usePomodoroTimer'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useJournal } from '../hooks/useJournal'
import { useBackgroundTimer } from '../hooks/useBackgroundTimer'
import { TIMER_PRESETS } from '../data/types'
import type { SessionJournal, UserPreferences } from '../data/types'
import { formatTime } from '../utils/time'
import { isValidLink, formatLink } from '../utils/validation'
import { notifySessionComplete } from '../utils/notifications'
import { db } from '../data/database'

const Home: React.FC = () => {
  const [customDuration, setCustomDuration] = useState('')
  const [selectedPresetId, setSelectedPresetId] = useState<string>(TIMER_PRESETS[0].id)
  const [newTag, setNewTag] = useState('')
  const [linkError, setLinkError] = useState<string>('')
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [journalModalOpen, setJournalModalOpen] = useState(false)
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null)
  const [floatingWindow, setFloatingWindow] = useState<Window | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [, setUserPreferences] = useState<UserPreferences | null>(null)

  const selectedPreset = TIMER_PRESETS.find(p => p.id === selectedPresetId) || TIMER_PRESETS[0]

  // Enhanced Pomodoro Timer
  const [pomodoroState, pomodoroControls] = usePomodoroTimer(
    {
      workDuration: customDuration ? parseInt(customDuration) : selectedPreset.duration,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsPerCycle: 4,
      autoStartBreaks: false,
      autoStartWork: false,
    },
    (mode) => {
      // Handle timer completion
      if (mode === 'work') {
        setStatusMessage('Work session complete! Time for a break.');
        backgroundTimer.showNotification(
          'Work Session Complete! 🎉',
          'Great job! Take a well-deserved break.'
        );

        // Complete the session in the database
        if (sessionState.currentSession) {
          sessionControls.stopSession(false); // Mark as completed, not cancelled
        }
      } else {
        setStatusMessage('Break time over! Ready for another session?');
        backgroundTimer.showNotification(
          'Break Complete! 💪',
          'Time to get back to work!'
        );
      }
      setTimeout(() => setStatusMessage(''), 3000);
    },
    (newMode) => {
      // Handle mode changes
      console.log('Mode changed to:', newMode);
    }
  );

  const [sessionState, sessionControls] = useSessionRunner({
    onComplete: async (session) => {
      const preset = TIMER_PRESETS.find(p => p.id === session.mode);
      await notifySessionComplete(preset?.name || session.mode, session.plannedMs);

      // Show notification if tab is hidden
      if (document.hidden) {
        backgroundTimer.showNotification(
          'Research Timer Complete!',
          `${preset?.name || session.mode} session finished. Time for a break!`
        );
      }

      // Show journal modal for completed sessions
      setCompletedSessionId(session.id);
      setJournalModalOpen(true);
    }
  })

  // Background timer for notifications
  const backgroundTimer = useBackgroundTimer({
    onComplete: () => {
      // This is handled by sessionRunner onComplete
    }
  });

  // Check for onboarding completion on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const prefs = await db.userPreferences.get('user');
        setUserPreferences(prefs || null);

        if (!prefs?.onboardingCompleted) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      }
    };

    checkOnboarding();
  }, []);

  // Get current session metadata or defaults
  const currentGoal = sessionState.currentSession?.goal || ''
  const currentNotes = sessionState.currentSession?.notes || ''
  const currentTags = useMemo(() => sessionState.currentSession?.tags || [], [sessionState.currentSession?.tags])
  const currentLink = sessionState.currentSession?.link || ''

  // Timer display logic using Pomodoro timer
  const displayMs = pomodoroState.timeRemaining;
  const timerText = formatTime(displayMs)
  const getStatus = useCallback(() => {
    if (statusMessage) return statusMessage
    if (pomodoroState.isRunning) return `${pomodoroState.currentMode === 'work' ? 'Work' : 'Break'} - Running`
    if (pomodoroState.isPaused) return `${pomodoroState.currentMode === 'work' ? 'Work' : 'Break'} - Paused`
    return `${pomodoroState.currentMode === 'work' ? 'Work' : 'Break'} - Ready`
  }, [statusMessage, pomodoroState.isRunning, pomodoroState.isPaused, pomodoroState.currentMode])

  // Update Pomodoro settings when user changes duration
  useEffect(() => {
    const newDuration = customDuration && !isNaN(parseInt(customDuration)) ?
      parseInt(customDuration) : selectedPreset.duration;

    pomodoroControls.updateSettings({
      workDuration: newDuration
    });
  }, [customDuration, selectedPreset.duration, pomodoroControls]);

  // Metadata handlers
  const handleGoalChange = (goal: string) => {
    if (sessionState.currentSession) {
      sessionControls.updateMetadata({ goal })
    }
  }

  const handleNotesChange = (notes: string) => {
    if (sessionState.currentSession) {
      sessionControls.updateMetadata({ notes })
    }
  }

  const handleTagsChange = (tags: string[]) => {
    if (sessionState.currentSession) {
      sessionControls.updateMetadata({ tags })
    }
  }

  const handleLinkChange = (link: string) => {
    const formattedLink = formatLink(link)
    const isValid = isValidLink(formattedLink)

    setLinkError(isValid ? '' : 'Please enter a valid URL or DOI')

    if (sessionState.currentSession && isValid) {
      sessionControls.updateMetadata({ link: formattedLink })
    }
  }

  const handleAddTag = () => {
    const trimmed = newTag.trim()
    if (trimmed && !currentTags.includes(trimmed)) {
      const newTags = [...currentTags, trimmed]
      handleTagsChange(newTags)
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = currentTags.filter(tag => tag !== tagToRemove)
    handleTagsChange(newTags)
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag()
    } else if (e.key === 'Backspace' && newTag === '' && currentTags.length > 0) {
      handleRemoveTag(currentTags[currentTags.length - 1])
    }
  }

  // Pomodoro timer controls
  const handleStartPause = useCallback(() => {
    if (pomodoroState.isRunning) {
      pomodoroControls.pause()
    } else if (pomodoroState.isPaused) {
      pomodoroControls.resume()
    } else {
      // Start new session - create a session in the database too
      const duration = customDuration && !isNaN(parseInt(customDuration)) ?
        parseInt(customDuration) : selectedPreset.duration;

      // Find the matching preset for session runner
      const preset = customDuration ?
        { ...selectedPreset, duration } :
        selectedPreset;

      sessionControls.startSession(preset, duration * 60 * 1000);
      pomodoroControls.start()
    }
  }, [pomodoroState.isRunning, pomodoroState.isPaused, customDuration, selectedPreset, pomodoroControls, sessionControls]);

  const handleReset = useCallback(() => {
    pomodoroControls.reset()
    if (sessionState.currentSession) {
      sessionControls.stopSession(true) // Cancel current session
    }
    setStatusMessage('')
  }, [pomodoroControls, sessionState.currentSession, sessionControls]);


  // Legacy session controls (kept for compatibility)
  // const handleStop = async () => {
  //   if (sessionState.currentSession) {
  //     try {
  //       const sessionId = sessionState.currentSession.id;
  //       await sessionControls.stopSession()
  //       // Show journal modal for manually stopped sessions too
  //       setCompletedSessionId(sessionId);
  //       setJournalModalOpen(true);
  //     } catch (error) {
  //       console.error('Failed to stop session:', error)
  //       setStatusMessage('Failed to stop session')
  //       setTimeout(() => setStatusMessage(''), 3000)
  //     }
  //   }
  // }


  const handlePresetSelect = (presetId: string) => {
    if (sessionState.currentSession) return // Don't allow changing during session
    setSelectedPresetId(presetId)
    setCustomDuration('') // Clear custom duration when selecting preset
  }

  // Journal modal handlers
  const handleJournalSave = async (journal: SessionJournal) => {
    if (!completedSessionId) return;

    try {
      // Update the session with the journal data
      await journalHook.save(journal);
      setStatusMessage('Journal saved successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save journal:', error);
      setStatusMessage('Failed to save journal');
      setTimeout(() => setStatusMessage(''), 3000);
    } finally {
      setJournalModalOpen(false);
      setCompletedSessionId(null);
    }
  };

  const handleJournalSkip = () => {
    setStatusMessage('Journal skipped');
    setTimeout(() => setStatusMessage(''), 2000);
    setJournalModalOpen(false);
    setCompletedSessionId(null);
  };

  const handleJournalCancel = () => {
    setJournalModalOpen(false);
    setCompletedSessionId(null);
  };

  // Floating window functionality
  const openFloatingWindow = useCallback(() => {
    if (floatingWindow && !floatingWindow.closed) {
      floatingWindow.focus();
      return;
    }

    const width = 320;
    const height = 400;
    const left = window.screen.width - width - 50;
    const top = 50;

    const newWindow = window.open(
      '',
      'floating-timer',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no,directories=no`
    );

    if (newWindow) {
      setFloatingWindow(newWindow);

      // Write the HTML for the floating timer
      newWindow.document.write(`
        <!DOCTYPE html>
        <html class="${document.documentElement.classList.contains('dark') ? 'dark' : ''}" lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Research Timer Pro</title>
          <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Lora:wght@400;500&display=swap" rel="stylesheet">
          <style>
            :root {
              --background-light: #FFFFFF;
              --card-light: #F8FAFC;
              --text-light: #1A202C;
              --text-muted-light: #2D3748;
              --border-light: #CBD5E0;
              --background-dark: #111827;
              --card-dark: #1F2937;
              --text-dark: #F9FAFB;
              --text-muted-dark: #D1D5DB;
              --border-dark: #374151;
              --primary-accent: #63B3ED;
              --primary-accent-hover: #4299E1;
            }
            :root {
              --background: var(--background-light);
              --card: var(--card-light);
              --text-primary: var(--text-light);
              --text-secondary: var(--text-muted-light);
              --border: var(--border-light);
            }
            .dark {
              --background: var(--background-dark);
              --card: var(--card-dark);
              --text-primary: var(--text-dark);
              --text-secondary: var(--text-muted-dark);
              --border: var(--border-dark);
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: var(--background);
              color: var(--text-primary);
              height: 100vh;
              display: flex;
              flex-direction: column;
              padding: 16px;
              overflow-y: auto;
              transition: background-color 0.3s, color 0.3s;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 16px;
              padding-bottom: 12px;
              border-bottom: 1px solid var(--border);
            }
            .logo {
              font-size: 14px;
              font-weight: 600;
              color: var(--text-primary);
            }
            .mode-badge {
              background: var(--card);
              padding: 6px 12px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 500;
              border: 1px solid var(--border);
              color: var(--text-primary);
            }
            .timer-section {
              text-align: center;
              margin: 16px 0;
            }
            .timer-display {
              font-size: 2.5rem;
              font-weight: bold;
              font-family: 'Lora', serif;
              margin-bottom: 8px;
              color: var(--text-primary);
            }
            .dark .timer-display {
              color: white;
            }
            .preset-info {
              font-size: 13px;
              color: var(--text-secondary);
              margin-bottom: 4px;
            }
            .status {
              font-size: 12px;
              color: var(--text-secondary);
              margin-bottom: 16px;
            }
            .progress-section {
              background: var(--card);
              border: 1px solid var(--border);
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 16px;
            }
            .progress-title {
              font-size: 12px;
              font-weight: 500;
              margin-bottom: 8px;
              color: var(--text-primary);
            }
            .progress-stats {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              font-size: 11px;
            }
            .stat {
              text-align: center;
            }
            .stat-value {
              font-size: 16px;
              font-weight: 600;
              display: block;
              color: var(--primary-accent);
            }
            .stat-label {
              color: var(--text-secondary);
            }
            .session-details {
              background: var(--card);
              border: 1px solid var(--border);
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 16px;
              font-size: 11px;
            }
            .detail-row {
              display: flex;
              align-items: flex-start;
              margin-bottom: 6px;
            }
            .detail-row:last-child { margin-bottom: 0; }
            .detail-icon {
              font-size: 14px;
              margin-right: 6px;
              color: var(--text-secondary);
              flex-shrink: 0;
            }
            .detail-text {
              flex: 1;
              color: var(--text-primary);
              line-height: 1.3;
              word-break: break-word;
            }
            .controls {
              display: flex;
              gap: 8px;
              margin-bottom: 16px;
            }
            button {
              padding: 10px 12px;
              border: 1px solid var(--border);
              border-radius: 6px;
              background: var(--card);
              color: var(--text-primary);
              cursor: pointer;
              font-size: 12px;
              font-weight: 500;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
            }
            button:hover {
              background: var(--border);
              transform: translateY(-1px);
            }
            /* Light mode button styling */
            :root button {
              border-color: var(--border-light);
              background: var(--card-light);
              color: var(--text-light);
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            :root button:hover {
              background: var(--background-light);
              border-color: var(--primary-accent);
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            }
            .btn-primary {
              background: var(--primary-accent);
              color: #1A202C;
              border-color: var(--primary-accent);
              font-weight: 600;
            }
            .btn-primary:hover {
              background: var(--primary-accent-hover);
              box-shadow: 0 2px 4px rgba(99, 179, 237, 0.2);
            }
            .dark .btn-primary {
              color: #111827;
              border-color: var(--primary-accent);
            }
            .dark button {
              border-color: var(--border);
              background: var(--card);
              color: var(--text-primary);
            }
            .dark button:hover {
              background: var(--background);
              border-color: var(--primary-accent);
            }
            .material-icons { font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Research Timer Pro</div>
            <div class="mode-badge" id="modeBadge">Work</div>
          </div>

          <div class="timer-section">
            <div class="preset-info" id="presetInfo"></div>
            <div class="timer-display" id="timerDisplay">25:00</div>
            <div class="status" id="statusDisplay">Ready to focus</div>
          </div>

          <div class="progress-section">
            <div class="progress-title">Session Progress</div>
            <div class="progress-stats">
              <div class="stat">
                <span class="stat-value" id="currentSession">1</span>
                <span class="stat-label">Current</span>
              </div>
              <div class="stat">
                <span class="stat-value" id="completedCount">0</span>
                <span class="stat-label">Completed</span>
              </div>
            </div>
          </div>

          <div class="session-details" id="sessionDetails">
            <div class="detail-row" id="goalRow" style="display:none;">
              <span class="material-icons detail-icon">flag</span>
              <span class="detail-text" id="goalText"></span>
            </div>
            <div class="detail-row" id="notesRow" style="display:none;">
              <span class="material-icons detail-icon">note</span>
              <span class="detail-text" id="notesText"></span>
            </div>
            <div class="detail-row" id="tagsRow" style="display:none;">
              <span class="material-icons detail-icon">label</span>
              <span class="detail-text" id="tagsText"></span>
            </div>
            <div class="detail-row" id="linkRow" style="display:none;">
              <span class="material-icons detail-icon">link</span>
              <span class="detail-text" id="linkText"></span>
            </div>
          </div>

          <div class="controls">
            <button class="btn-primary" style="flex: 1;" onclick="console.log('▶️ Timer toggle button clicked'); window.opener && window.opener.postMessage({action: 'toggle'}, '*')">
              <span class="material-icons" id="playIcon">play_arrow</span>
              <span id="playText">Start</span>
            </button>
            <button style="flex: 1;" onclick="console.log('🔄 Timer reset button clicked'); window.opener && window.opener.postMessage({action: 'reset'}, '*')">
              <span class="material-icons">refresh</span>
              Reset
            </button>
          </div>

        </body>
        </html>
      `);

      newWindow.document.close();

      // Handle window close
      newWindow.addEventListener('beforeunload', () => {
        setFloatingWindow(null);
      });

      // Add theme change listener to sync with main window
      const updateFloatingWindowTheme = () => {
        if (newWindow && !newWindow.closed) {
          const isDark = document.documentElement.classList.contains('dark');
          console.log('🎨 Updating floating window theme. Main window is dark:', isDark);
          if (isDark) {
            newWindow.document.documentElement.classList.add('dark');
            console.log('🌙 Applied dark class to floating window');
          } else {
            newWindow.document.documentElement.classList.remove('dark');
            console.log('☀️ Removed dark class from floating window');
          }
          // Force a repaint by updating a style
          newWindow.document.body.style.visibility = 'hidden';
          setTimeout(() => {
            if (newWindow && !newWindow.closed) {
              newWindow.document.body.style.visibility = 'visible';
            }
          }, 10);
        }
      };

      // Set initial theme immediately
      updateFloatingWindowTheme();

      // Listen for class changes on main document
      const observer = new MutationObserver(updateFloatingWindowTheme);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

      // Store observer to clean it up when window closes
      newWindow.addEventListener('beforeunload', () => {
        observer.disconnect();
        setFloatingWindow(null);
      });
    }
  }, [floatingWindow]);

  // Handle messages from floating window
  const handleFloatingMessage = useCallback((event: MessageEvent) => {
    console.log('🎵 Floating window message received:', event.data);
    if (event.data.action === 'toggle') {
      console.log('▶️ Toggle action - current state:', { isRunning: pomodoroState.isRunning, isPaused: pomodoroState.isPaused });
      handleStartPause();
    } else if (event.data.action === 'reset') {
      console.log('🔄 Reset action');
      handleReset();
    }
  }, [handleStartPause, handleReset, pomodoroState.isRunning, pomodoroState.isPaused]);

  useEffect(() => {
    window.addEventListener('message', handleFloatingMessage);
    return () => window.removeEventListener('message', handleFloatingMessage);
  }, [handleFloatingMessage]);

  // Auto-float on browser minimize/hide
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Only auto-float if timer is running and no floating window exists
      if (document.hidden && pomodoroState.isRunning && (!floatingWindow || floatingWindow.closed)) {
        setTimeout(() => {
          // Double-check the timer is still running after a short delay
          if (pomodoroState.isRunning) {
            openFloatingWindow();
          }
        }, 1000);
      }
    };

    const handleWindowFocus = () => {
      // Close floating window when main window gets focus (optional)
      if (!document.hidden && floatingWindow && !floatingWindow.closed) {
        // Don't auto-close, let user decide
        // floatingWindow.close();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [pomodoroState.isRunning, floatingWindow, openFloatingWindow]);

  // Update floating window content
  useEffect(() => {
    if (floatingWindow && !floatingWindow.closed) {
      const doc = floatingWindow.document;

      // Basic timer elements
      const timerDisplay = doc.getElementById('timerDisplay');
      const statusDisplay = doc.getElementById('statusDisplay');
      const playIcon = doc.getElementById('playIcon');
      const playText = doc.getElementById('playText');
      const presetInfo = doc.getElementById('presetInfo');
      const modeBadge = doc.getElementById('modeBadge');

      // Progress elements
      const currentSession = doc.getElementById('currentSession');
      const completedCount = doc.getElementById('completedCount');

      // Session detail elements
      const goalRow = doc.getElementById('goalRow');
      const goalText = doc.getElementById('goalText');
      const notesRow = doc.getElementById('notesRow');
      const notesText = doc.getElementById('notesText');
      const tagsRow = doc.getElementById('tagsRow');
      const tagsText = doc.getElementById('tagsText');
      const linkRow = doc.getElementById('linkRow');
      const linkText = doc.getElementById('linkText');

      // Update timer display
      if (timerDisplay) timerDisplay.textContent = timerText;
      if (statusDisplay) statusDisplay.textContent = getStatus();

      // Update mode badge
      if (modeBadge) {
        if (pomodoroState.currentMode === 'work') {
          modeBadge.textContent = 'Work Session';
          modeBadge.style.background = 'rgba(59, 130, 246, 0.8)'; // Blue
        } else if (pomodoroState.currentMode === 'shortBreak') {
          modeBadge.textContent = 'Short Break';
          modeBadge.style.background = 'rgba(34, 197, 94, 0.8)'; // Green
        } else {
          modeBadge.textContent = 'Long Break';
          modeBadge.style.background = 'rgba(168, 85, 247, 0.8)'; // Purple
        }
      }

      // Update preset info
      if (presetInfo) {
        if (pomodoroState.currentMode === 'work') {
          if (customDuration) {
            presetInfo.textContent = `Custom Duration: ${customDuration} minutes`;
          } else {
            presetInfo.textContent = selectedPreset.name;
          }
        } else {
          const duration = pomodoroState.currentMode === 'shortBreak' ? 5 : 15;
          presetInfo.textContent = `${duration} minute break`;
        }
      }

      // Update progress stats
      if (currentSession) currentSession.textContent = pomodoroState.currentSession.toString();
      if (completedCount) completedCount.textContent = pomodoroState.completedPomodoros.toString();

      // Update session details
      if (goalRow && goalText) {
        if (currentGoal) {
          goalText.textContent = currentGoal;
          goalRow.style.display = 'flex';
        } else {
          goalRow.style.display = 'none';
        }
      }

      if (notesRow && notesText) {
        if (currentNotes) {
          notesText.textContent = currentNotes.length > 100 ?
            currentNotes.substring(0, 100) + '...' : currentNotes;
          notesRow.style.display = 'flex';
        } else {
          notesRow.style.display = 'none';
        }
      }

      if (tagsRow && tagsText) {
        if (currentTags.length > 0) {
          tagsText.textContent = currentTags.map(tag => `#${tag}`).join(', ');
          tagsRow.style.display = 'flex';
        } else {
          tagsRow.style.display = 'none';
        }
      }

      if (linkRow && linkText) {
        if (currentLink) {
          linkText.textContent = currentLink.length > 50 ?
            currentLink.substring(0, 50) + '...' : currentLink;
          linkRow.style.display = 'flex';
        } else {
          linkRow.style.display = 'none';
        }
      }

      // Update control buttons
      if (playIcon && playText) {
        if (pomodoroState.isRunning) {
          playIcon.textContent = 'pause';
          playText.textContent = 'Pause';
        } else if (pomodoroState.isPaused) {
          playIcon.textContent = 'play_arrow';
          playText.textContent = 'Resume';
        } else {
          playIcon.textContent = 'play_arrow';
          playText.textContent = 'Start';
        }
      }

    }
  }, [timerText, pomodoroState, getStatus, selectedPreset.name, customDuration, currentGoal, currentNotes, currentTags, currentLink, floatingWindow]);

  // Use journal hook for the completed session
  const journalHook = useJournal(completedSessionId || '');
  const completedSession = journalHook.data;

  // Keyboard shortcuts
  useKeyboardShortcuts({
    space: handleStartPause,
    r: handleReset,
    '1': () => handlePresetSelect(TIMER_PRESETS[0].id),
    '2': () => handlePresetSelect(TIMER_PRESETS[1].id),
    '3': () => handlePresetSelect(TIMER_PRESETS[2].id),
    '4': () => handlePresetSelect(TIMER_PRESETS[3].id),
    '5': () => handlePresetSelect(TIMER_PRESETS[4].id),
  })

  // Calculate progress for the circular timer using Pomodoro state
  const progress = pomodoroState.progress;
  const circumference = 2 * Math.PI * 56; // radius = 56
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="transition-all duration-300 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-display font-medium text-gray-900 dark:text-white">
          Research Timer Pro
        </h2>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">
          Boost your research productivity with accurate timing and insights
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">

        {/* Timer Section - Spans 2 columns on xl, full width on smaller screens */}
        <div className="lg:col-span-2 xl:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        {/* Circular Timer */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 mx-auto mb-6 flex items-center justify-center">
          <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 120 120">
            <circle
              className="text-gray-300 dark:text-gray-600"
              cx="60"
              cy="60"
              fill="transparent"
              r="56"
              stroke="currentColor"
              strokeWidth="4"
            />
            <circle
              className="progress-ring__circle text-blue-600 dark:text-blue-400"
              cx="60"
              cy="60"
              fill="transparent"
              r="56"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="4"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset
              }}
            />
          </svg>
          <div className="text-center">
            <p className="text-3xl sm:text-4xl lg:text-5xl font-mono text-gray-900 dark:text-white tabular-nums">{timerText}</p>
            <p className="text-sm sm:text-base lg:text-lg text-gray-500 dark:text-gray-300 mt-1 sm:mt-2">
              {pomodoroState.currentMode === 'work' ?
                (customDuration ? `Custom: ${customDuration}min` : selectedPreset.name) :
                pomodoroState.currentMode === 'shortBreak' ? 'Short Break' :
                pomodoroState.currentMode === 'longBreak' ? 'Long Break' : 'Ready'
              }
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
              Session {pomodoroState.currentSession} • {pomodoroState.completedPomodoros} completed
            </p>
          </div>
        </div>

        {/* Research Mode Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-center mb-4 text-gray-700 dark:text-gray-200">
            Research Mode
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4">
            {TIMER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`p-4 border rounded-lg text-center transition-colors ${
                  selectedPresetId === preset.id && !customDuration
                    ? 'border-blue-600 bg-blue-600/10 dark:bg-blue-600/20 ring-2 ring-blue-600'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                disabled={!!sessionState.currentSession}
              >
                <span className={`block text-sm ${
                  selectedPresetId === preset.id && !customDuration
                    ? 'text-blue-600 dark:text-gray-300'
                    : 'text-gray-500 dark:text-gray-300'
                }`}>
                  {preset.name}
                </span>
                <span className={`block font-semibold ${
                  selectedPresetId === preset.id && !customDuration
                    ? 'text-blue-600 dark:text-white'
                    : 'text-gray-800 dark:text-gray-200'
                }`}>
                  {preset.duration}m
                </span>
              </button>
            ))}
          </div>

          {/* Custom Duration Input */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Or set custom duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="480"
              placeholder="e.g. 30"
              value={customDuration}
              onChange={(e) => {
                setCustomDuration(e.target.value)
                // Don't clear preset selection - let both coexist for better UX
              }}
              disabled={!!sessionState.currentSession}
              className={`w-24 text-center bg-white dark:bg-gray-800 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-600 sm:text-sm ${
                customDuration
                  ? 'border-blue-600 ring-2 ring-blue-600'
                  : 'border-gray-300 dark:border-gray-600'
              } placeholder-gray-400 dark:placeholder-gray-500`}
            />
            <span className="text-sm text-gray-500 dark:text-gray-300 ml-2">minutes</span>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
          <button
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-600/90 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-white font-semibold py-3 px-6 rounded-lg transition-colors w-full sm:w-auto"
            onClick={handleStartPause}
            aria-label={pomodoroState.isRunning ? 'Pause timer' : pomodoroState.isPaused ? 'Resume timer' : 'Start timer'}
          >
            <span className="material-icons text-xl" aria-hidden="true">
              {pomodoroState.isRunning ? 'pause' : pomodoroState.isPaused ? 'play_arrow' : 'play_arrow'}
            </span>
            <span className="hidden sm:inline">
              {pomodoroState.isRunning ? 'Pause' : pomodoroState.isPaused ? 'Resume' : 'Start'}
            </span>
            <span className="sm:hidden">
              {pomodoroState.isRunning ? 'Pause' : pomodoroState.isPaused ? 'Resume' : 'Start'}
            </span>
          </button>
          <button
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-semibold py-3 px-6 rounded-lg transition-colors w-full sm:w-auto"
            onClick={handleReset}
            aria-label="Reset timer"
          >
            <span className="material-icons text-xl" aria-hidden="true">restart_alt</span>
            Reset
          </button>
          <button
            className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-semibold py-3 px-6 rounded-lg transition-colors w-full sm:w-auto"
            onClick={openFloatingWindow}
            aria-label="Open floating timer window"
          >
            <span className="material-icons text-xl" aria-hidden="true">open_in_new</span>
            <span className="hidden sm:inline">Float Window</span>
            <span className="sm:hidden">Float</span>
          </button>
        </div>
        </div>

        {/* Right Sidebar - Notes and AI Section */}
        <div className="lg:col-span-2 xl:col-span-1 space-y-6">

          {/* Session Notes Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 h-fit">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center">
              <span className="material-icons mr-2 text-blue-600">edit_note</span>
              Session Notes
            </h3>
            <textarea
              className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500 resize-none"
              placeholder="Keep track of your progress, ideas, and insights..."
              rows={6}
              value={currentNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
            />
          </div>

          {/* AI Integration Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 h-fit">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center">
              <span className="material-icons mr-2 text-purple-600">psychology</span>
              AI Summary
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Configure AI in <a href="/settings" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Settings</a> for session summaries.
            </div>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
              <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                AI summary will appear here after your session...
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Session Details and Focus Music Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Session Details Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg font-semibold mb-6 text-gray-700 dark:text-gray-300 flex items-center">
            <span className="material-icons mr-2 text-green-600">flag</span>
            Session Details
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="goal">
                Goal
              </label>
              <input
                className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                id="goal"
                name="goal"
                placeholder="What do you want to accomplish this session?"
                type="text"
                value={currentGoal}
                onChange={(e) => handleGoalChange(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="tags">
                Tags
              </label>
              <div className="flex items-center flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                {currentTags.map((tag) => (
                  <span key={tag} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium px-3 py-1 rounded-full flex items-center">
                    #{tag}
                    <button
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <span className="material-icons text-sm">close</span>
                    </button>
                  </span>
                ))}
                <input
                  className="flex-1 bg-transparent border-none focus:ring-0 p-0 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500 min-w-0"
                  id="tags"
                  name="tags"
                  placeholder="Add tags..."
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  onBlur={handleAddTag}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Press Enter or comma to add tags. Backspace to remove last tag.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="link">
                Link (DOI or URL)
              </label>
              <input
                className={`w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500 ${
                  linkError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                id="link"
                name="link"
                placeholder="https://example.com or doi:10.1234/example"
                type="url"
                value={currentLink}
                onChange={(e) => handleLinkChange(e.target.value)}
              />
              {linkError && (
                <div className="text-sm text-red-600 dark:text-red-400 mt-2">
                  {linkError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Focus Music Card */}
        <div>
          <FocusMusic />
        </div>
      </div>

      {/* Footer with Keyboard Shortcuts */}
      <footer className="mt-16 text-center">
        <button className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
          <span className="material-icons">keyboard</span>
          Keyboard Shortcuts
        </button>
      </footer>

      {/* Journal Modal */}
      <JournalModal
        open={journalModalOpen}
        mode={completedSession?.mode || 'deep'}
        sessionId={completedSessionId || ''}
        onSave={handleJournalSave}
        onSkip={handleJournalSkip}
        onCancel={handleJournalCancel}
      />



      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={() => {
          setShowOnboarding(false);
          // Reload preferences after onboarding
          const reloadPrefs = async () => {
            try {
              const prefs = await db.userPreferences.get('user');
              setUserPreferences(prefs || null);
            } catch (error) {
              console.error('Failed to reload preferences:', error);
            }
          };
          reloadPrefs();
        }}
      />
    </div>
  )
}

export default Home