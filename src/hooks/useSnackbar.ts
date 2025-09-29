import { useState, useCallback, useRef } from 'react';

export type SnackbarVariant = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarMessage {
  id: string;
  message: string;
  variant: SnackbarVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface UseSnackbarResult {
  messages: SnackbarMessage[];
  show: (message: string, variant?: SnackbarVariant, duration?: number, action?: SnackbarMessage['action']) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export function useSnackbar(): UseSnackbarResult {
  const [messages, setMessages] = useState<SnackbarMessage[]>([]);
  const timeoutRefs = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));

    // Clear timeout if exists
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const show = useCallback((
    message: string,
    variant: SnackbarVariant = 'info',
    duration: number = 5000,
    action?: SnackbarMessage['action']
  ): string => {
    const id = crypto.randomUUID();

    const snackbarMessage: SnackbarMessage = {
      id,
      message,
      variant,
      duration,
      action
    };

    setMessages(prev => [...prev, snackbarMessage]);

    // Auto-dismiss after duration
    if (duration > 0) {
      const timeout = setTimeout(() => dismiss(id), duration);
      timeoutRefs.current.set(id, timeout);
    }

    return id;
  }, [dismiss]);

  const dismissAll = useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();

    setMessages([]);
  }, []);

  return {
    messages,
    show,
    dismiss,
    dismissAll
  };
}