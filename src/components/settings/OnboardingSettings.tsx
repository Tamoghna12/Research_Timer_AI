import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import OnboardingModal from '../onboarding/OnboardingModal';
import { db } from '../../data/database';
import type { UserPreferences } from '../../data/types';

const OnboardingSettings: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await db.userPreferences.get('user');
        setPreferences(prefs || null);
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const restartOnboarding = async () => {
    if (!preferences) return;

    try {
      // Reset onboarding completed status
      const updated = {
        ...preferences,
        onboardingCompleted: false,
        updatedAt: Date.now()
      };
      await db.userPreferences.put(updated);
      setPreferences(updated);
      setShowModal(true);
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    }
  };

  const handleOnboardingComplete = async () => {
    setShowModal(false);
    // Reload preferences after onboarding completion
    try {
      const updated = await db.userPreferences.get('user');
      setPreferences(updated || null);
    } catch (error) {
      console.error('Failed to reload preferences:', error);
    }
  };

  if (loading) {
    return <div className="text-gray-500 dark:text-gray-400">Loading onboarding settings...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Onboarding Status */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              Onboarding
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {preferences?.onboardingCompleted
                ? 'Welcome setup completed'
                : 'Welcome setup not completed'
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {preferences?.onboardingCompleted && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <span className="material-icons text-xs mr-1">check_circle</span>
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Current Preferences Summary */}
        {preferences?.onboardingCompleted && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Current Preferences
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <span className="material-icons text-blue-600 text-sm">schedule</span>
                <span className="text-gray-600 dark:text-gray-400">
                  Focus Mode: {preferences.focusMode ?
                    preferences.focusMode.charAt(0).toUpperCase() + preferences.focusMode.slice(1)
                    : 'None'
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="material-icons text-blue-600 text-sm">library_music</span>
                <span className="text-gray-600 dark:text-gray-400">
                  Music: {preferences.musicEnabled ?
                    (preferences.musicSource || 'Enabled').charAt(0).toUpperCase() + (preferences.musicSource || 'Enabled').slice(1)
                    : 'Disabled'
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="material-icons text-blue-600 text-sm">landscape</span>
                <span className="text-gray-600 dark:text-gray-400">
                  Backgrounds: {preferences.backgroundsEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col space-y-3">
          <Button
            onClick={restartOnboarding}
            variant="primary"
            leftIcon="refresh"
          >
            Restart Onboarding Questions
          </Button>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            This will walk you through the initial setup questions again and
            allow you to update your preferences.
          </p>
        </div>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showModal}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
};

export default OnboardingSettings;