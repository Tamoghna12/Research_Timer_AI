import { useEffect, useState } from 'react';
import type { SnackbarMessage, SnackbarVariant } from '../../hooks/useSnackbar';

export interface SnackbarContainerProps {
  messages: SnackbarMessage[];
  onDismiss: (id: string) => void;
  position?: 'top' | 'bottom';
  maxVisible?: number;
}

export function SnackbarContainer({
  messages,
  onDismiss,
  position = 'bottom',
  maxVisible = 3
}: SnackbarContainerProps) {
  // Show only the most recent messages
  const visibleMessages = messages.slice(-maxVisible);

  if (visibleMessages.length === 0) {
    return null;
  }

  const containerClasses = position === 'top'
    ? 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50'
    : 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col gap-2 max-w-sm w-full">
        {visibleMessages.map(message => (
          <SnackbarItem
            key={message.id}
            message={message}
            onDismiss={() => onDismiss(message.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface SnackbarItemProps {
  message: SnackbarMessage;
  onDismiss: () => void;
}

function SnackbarItem({ message, onDismiss }: SnackbarItemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Wait for exit animation
    setTimeout(onDismiss, 300);
  };

  const variantStyles = getVariantStyles(message.variant);

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'}
        ${variantStyles.container}
        px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm
        flex items-center justify-between gap-3
        min-w-0 max-w-sm
      `}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${variantStyles.icon}`}>
        {getVariantIcon(message.variant)}
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${variantStyles.text} truncate`}>
          {message.message}
        </p>
      </div>

      {/* Action button */}
      {message.action && (
        <button
          onClick={message.action.onClick}
          className={`flex-shrink-0 text-sm font-medium ${variantStyles.action}
                     hover:underline focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current rounded px-1`}
        >
          {message.action.label}
        </button>
      )}

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className={`flex-shrink-0 ml-2 ${variantStyles.close}
                   hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current rounded`}
        aria-label="Dismiss"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

function getVariantStyles(variant: SnackbarVariant) {
  switch (variant) {
    case 'success':
      return {
        container: 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700',
        icon: 'text-green-600 dark:text-green-400',
        text: 'text-green-800 dark:text-green-200',
        action: 'text-green-700 dark:text-green-300',
        close: 'text-green-500 dark:text-green-400'
      };
    case 'error':
      return {
        container: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700',
        icon: 'text-red-600 dark:text-red-400',
        text: 'text-red-800 dark:text-red-200',
        action: 'text-red-700 dark:text-red-300',
        close: 'text-red-500 dark:text-red-400'
      };
    case 'warning':
      return {
        container: 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700',
        icon: 'text-yellow-600 dark:text-yellow-400',
        text: 'text-yellow-800 dark:text-yellow-200',
        action: 'text-yellow-700 dark:text-yellow-300',
        close: 'text-yellow-500 dark:text-yellow-400'
      };
    case 'info':
    default:
      return {
        container: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700',
        icon: 'text-blue-600 dark:text-blue-400',
        text: 'text-blue-800 dark:text-blue-200',
        action: 'text-blue-700 dark:text-blue-300',
        close: 'text-blue-500 dark:text-blue-400'
      };
  }
}

function getVariantIcon(variant: SnackbarVariant) {
  switch (variant) {
    case 'success':
      return <CheckCircleIcon className="w-5 h-5" />;
    case 'error':
      return <XCircleIcon className="w-5 h-5" />;
    case 'warning':
      return <ExclamationTriangleIcon className="w-5 h-5" />;
    case 'info':
    default:
      return <InformationCircleIcon className="w-5 h-5" />;
  }
}

// Icon components
function CheckCircleIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function XCircleIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );
}

function ExclamationTriangleIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function InformationCircleIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  );
}

function XIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}