import { useCallback } from 'react';
import Button from './Button';
import { useClipboardAttach } from '../../hooks/useClipboardAttach';
import type { LinkRef } from '../../data/types';

export interface ClipboardAttachButtonProps {
  onAttach: (linkRef: LinkRef) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

export function ClipboardAttachButton({
  onAttach,
  onError,
  disabled = false,
  size = 'md',
  variant = 'ghost',
  className = ""
}: ClipboardAttachButtonProps) {
  const { attachFromClipboard, isChecking, error } = useClipboardAttach();

  const handleClick = useCallback(async () => {
    try {
      const linkRef = await attachFromClipboard();
      if (linkRef) {
        onAttach(linkRef);
      } else if (error) {
        onError?.(error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to attach from clipboard';
      onError?.(errorMessage);
    }
  }, [attachFromClipboard, onAttach, onError, error]);

  const isDisabled = disabled || isChecking;

  return (
    <Button
      onClick={handleClick}
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={`inline-flex items-center gap-2 ${className}`}
      title="Attach link from clipboard"
    >
      {isChecking ? (
        <SpinnerIcon className="w-4 h-4" />
      ) : (
        <ClipboardIcon className="w-4 h-4" />
      )}
      {isChecking ? 'Checking...' : 'Paste'}
    </Button>
  );
}

function ClipboardIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
      <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2V5h-2v6z" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-25"
      />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 0116 0A8 8 0 014 12z"
        className="opacity-75"
      />
    </svg>
  );
}