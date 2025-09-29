import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '../ui/Button';
import Field from '../ui/Field';

interface DeleteAllModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteAllModal: React.FC<DeleteAllModalProps> = ({
  open,
  onConfirm,
  onCancel
}) => {
  const [confirmText, setConfirmText] = useState('');
  const isValid = confirmText === 'DELETE';

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && isValid) {
      handleConfirm();
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onCancel} />

        {/* Modal */}
        <div
          className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          aria-describedby="delete-modal-warning"
        >
          <div className="px-6 py-4 border-b border-gray-300 dark:border-gray-600">
            <h3 id="delete-modal-title" className="text-lg font-medium text-red-600 dark:text-red-400">
              Delete All Data
            </h3>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div id="delete-modal-warning" className="text-sm text-gray-600 dark:text-gray-400">
              <div className="font-medium text-red-600 dark:text-red-400 mb-2">
                ⚠️ This action cannot be undone
              </div>
              <p className="mb-4">
                This will permanently delete all your research sessions, journal entries,
                AI summaries, settings, and all other data. Everything will be lost forever.
              </p>
              <p className="mb-4">
                <strong>Before continuing:</strong> Consider exporting your data as a backup
                using the "Export All Data" button above.
              </p>
            </div>

            <Field
              label="Type DELETE to confirm"
              htmlFor="confirm-delete"
              hint="This confirms you understand the data will be permanently lost"
            >
              <input
                id="confirm-delete"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  confirmText && !isValid
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="DELETE"
                autoComplete="off"
                autoFocus
                aria-describedby="delete-modal-warning"
              />
            </Field>

            {confirmText && !isValid && (
              <div className="text-sm text-red-600 dark:text-red-400">
                Please type "DELETE" exactly to confirm
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-300 dark:border-gray-600">
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirm}
                disabled={!isValid}
                leftIcon="delete_forever"
              >
                Delete All Data
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Press Esc to cancel
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteAllModal;