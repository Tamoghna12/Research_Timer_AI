import { useEffect } from 'react';

interface KeyboardShortcuts {
  space?: () => void;      // Toggle start/pause
  r?: () => void;          // Reset
  '1'?: () => void;        // Preset 1
  '2'?: () => void;        // Preset 2
  '3'?: () => void;        // Preset 3
  '4'?: () => void;        // Preset 4
  '5'?: () => void;        // Preset 5
  escape?: () => void;     // General escape/cancel
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcuts,
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, preventDefault = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts when user is typing in an input
      const target = event.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' ||
                            target.tagName === 'TEXTAREA' ||
                            target.contentEditable === 'true';

      if (isInputFocused) return;

      const key = event.key.toLowerCase();
      let handler: (() => void) | undefined;

      switch (key) {
        case ' ':
          handler = shortcuts.space;
          break;
        case 'r':
          handler = shortcuts.r;
          break;
        case '1':
          handler = shortcuts['1'];
          break;
        case '2':
          handler = shortcuts['2'];
          break;
        case '3':
          handler = shortcuts['3'];
          break;
        case '4':
          handler = shortcuts['4'];
          break;
        case '5':
          handler = shortcuts['5'];
          break;
        case 'escape':
          handler = shortcuts.escape;
          break;
      }

      if (handler) {
        if (preventDefault) {
          event.preventDefault();
        }
        handler();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled, preventDefault]);
}