import React, { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { copyToClipboard } from '../../utils/clipboard';
import Button from '../ui/Button';

const PrivacySettings: React.FC = () => {
  const { settings, savePrivacy } = useSettings();
  const [copyStatus, setCopyStatus] = useState<string>('');

  const privacy = settings?.privacy;

  const handleTelemetryToggle = async () => {
    if (!privacy) return;

    const updated = {
      ...privacy,
      telemetryEnabled: !privacy.telemetryEnabled
    };

    try {
      await savePrivacy(updated);
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
    }
  };

  const handleCopyId = async () => {
    if (!privacy?.userAnonId) return;

    const success = await copyToClipboard(privacy.userAnonId);
    if (success) {
      setCopyStatus('Copied!');
    } else {
      setCopyStatus('Copy failed');
    }

    setTimeout(() => setCopyStatus(''), 2000);
  };

  if (!privacy) {
    return (
      <div className="text-gray-500 dark:text-gray-400">
        Loading privacy settings...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Telemetry Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium text-gray-800 dark:text-gray-200">
            Anonymous Telemetry
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Help improve Research Timer Pro by sharing anonymous usage data.
          </div>
        </div>
        <div className="ml-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              role="switch"
              checked={privacy.telemetryEnabled}
              onChange={handleTelemetryToggle}
              className="sr-only peer"
              aria-describedby="telemetry-description"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 dark:peer-focus:ring-blue-500/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {privacy.telemetryEnabled ? 'On' : 'Off'}
            </span>
          </label>
        </div>
      </div>

      {/* Anonymous ID (shown when telemetry is enabled) */}
      {privacy.telemetryEnabled && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Anonymous ID
              </div>
              <div className="text-xs font-mono text-blue-600 dark:text-blue-300 mt-1 break-all">
                {privacy.userAnonId}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              leftIcon="content_copy"
              onClick={handleCopyId}
            >
              {copyStatus || 'Copy'}
            </Button>
          </div>
        </div>
      )}

      {/* Information */}
      <div id="telemetry-description" className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
          <div className="font-medium mb-2">When telemetry is ON:</div>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Only anonymous counters are shared (session counts, mode usage)</li>
            <li>No personal content is ever sent (notes, journals, links, AI summaries)</li>
            <li>Only your anonymous ID is used to group events</li>
            <li>Data helps improve the app experience for everyone</li>
          </ul>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
          <div className="font-medium mb-2">When telemetry is OFF:</div>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>The app makes zero network requests for analytics</li>
            <li>No usage data is collected or shared</li>
            <li>Everything stays completely private on your device</li>
          </ul>
        </div>

        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
          <div className="font-medium mb-2 text-green-800 dark:text-green-200">
            Your privacy is always protected:
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-green-700 dark:text-green-300">
            <li>AI API keys live only in your browser storage</li>
            <li>All your data stays on your device (IndexedDB)</li>
            <li>No accounts, logins, or cloud storage required</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;