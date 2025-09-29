import React, { useState, useRef } from 'react';
import { db } from '../../data/database';
import { exportAll, downloadBackup, importPreview, importApply, type BackupFile, type ImportPreview } from '../../data/backup';
import DeleteAllModal from '../modals/DeleteAllModal';
import Button from '../ui/Button';
import Field from '../ui/Field';

const DataSettings: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [importFile, setImportFile] = useState<BackupFile | null>(null);
  const [importPreviewData, setImportPreviewData] = useState<ImportPreview | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string>('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [toast, setToast] = useState<string>('');

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 5000);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const backup = await exportAll();
      downloadBackup(backup);
      showToast(`Exported ${backup.sessions.length} sessions successfully`);
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportFile(null);
    setImportPreviewData(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupFile;

      // Validate and preview
      const preview = await importPreview(data);

      setImportFile(data);
      setImportPreviewData(preview);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid backup file';
      setImportError(message);
      console.error('Import preview failed:', error);
    }
  };

  const handleImportConfirm = async () => {
    if (!importFile || !importPreviewData) return;

    setIsImporting(true);
    try {
      const result = await importApply(importFile, importPreviewData);

      showToast(
        `Import complete: ${result.added} added, ${result.updated} updated, ${result.skipped} skipped`
      );

      // Clear import state
      setImportFile(null);
      setImportPreviewData(null);
      setImportError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh the Timeline page if that's where user might want to see results
      // We could also dispatch a custom event or use a context to trigger refresh
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed';
      setImportError(message);
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      // Clear all data in a transaction
      await db.transaction('rw', [db.sessions, db.settings], async () => {
        await db.sessions.clear();
        await db.settings.clear();
      });

      setDeleteModalOpen(false);

      // Reload the page to reset to fresh empty state
      window.location.reload();
    } catch (error) {
      console.error('Delete all failed:', error);
      showToast('Failed to delete data. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Export */}
      <div>
        <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Export Data</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Download all your research sessions, settings, and AI summaries as a JSON backup file.
        </p>
        <Button
          variant="secondary"
          leftIcon="download"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export All Data'}
        </Button>
      </div>

      {/* Import */}
      <div>
        <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Import Data</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Restore data from a Research Timer Pro backup file. Existing data will be merged intelligently.
        </p>

        <Field label="Backup File" htmlFor="import-file">
          <input
            ref={fileInputRef}
            id="import-file"
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-600/90"
          />
        </Field>

        {importError && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
            <div className="text-sm text-red-800 dark:text-red-200">
              <strong>Import Error:</strong> {importError}
            </div>
          </div>
        )}

        {importPreviewData && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <div className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              <strong>Import Preview:</strong>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-green-700 dark:text-green-300">
                  {importPreviewData.sessionsToAdd}
                </div>
                <div className="text-green-600 dark:text-green-400">New Sessions</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-blue-700 dark:text-blue-300">
                  {importPreviewData.sessionsToUpdate}
                </div>
                <div className="text-blue-600 dark:text-blue-400">Updates</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  {importPreviewData.sessionsSkipped}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Skipped</div>
              </div>
            </div>

            <div className="mt-4">
              <Button
                variant="primary"
                leftIcon="merge"
                onClick={handleImportConfirm}
                disabled={isImporting}
              >
                {isImporting ? 'Importing...' : 'Merge Data'}
              </Button>
            </div>

            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              Sessions are merged by ID. Newer versions (by updatedAt) will replace older ones.
              Your privacy settings and AI configuration will be preserved.
            </div>
          </div>
        )}
      </div>

      {/* Delete All */}
      <div className="border-t border-gray-300 dark:border-gray-600 pt-6">
        <h3 className="font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Permanently delete all your sessions, settings, and data. This action cannot be undone.
          Consider exporting your data first.
        </p>
        <Button
          variant="danger"
          leftIcon="delete_forever"
          onClick={() => setDeleteModalOpen(true)}
          aria-describedby="delete-warning"
        >
          Delete All Data
        </Button>
        <div id="delete-warning" className="sr-only">
          This will permanently delete all your research data and cannot be undone
        </div>
      </div>

      {/* Delete All Confirmation Modal */}
      <DeleteAllModal
        open={deleteModalOpen}
        onConfirm={handleDeleteAll}
        onCancel={() => setDeleteModalOpen(false)}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-green-600 text-white px-4 py-2 rounded-md shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSettings;