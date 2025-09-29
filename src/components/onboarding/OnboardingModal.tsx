import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { db } from '../../data/database';
import type { SessionMode, MusicSource, UserPreferences } from '../../data/types';

interface OnboardingModalProps {
  isOpen?: boolean;
  onComplete: () => void;
}

type OnboardingStep = 1 | 2 | 3;

interface OnboardingData {
  focusMode: SessionMode | null;
  musicEnabled: boolean;
  musicSource: MusicSource | null;
  backgroundsEnabled: boolean;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen = true, onComplete }) => {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [data, setData] = useState<OnboardingData>({
    focusMode: null,
    musicEnabled: false,
    musicSource: null,
    backgroundsEnabled: false
  });

  // Auto-close if onboarding already completed
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const prefs = await db.userPreferences.get('user');
        if (prefs?.onboardingCompleted && isOpen) {
          onComplete();
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      }
    };

    if (isOpen) {
      checkOnboarding();
    }
  }, [isOpen, onComplete]);

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => (prev + 1) as OnboardingStep);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as OnboardingStep);
    }
  };

  const handleComplete = async () => {
    try {
      const now = Date.now();

      // Update user preferences
      const userPrefs: UserPreferences = {
        id: 'user',
        focusMode: data.focusMode,
        musicEnabled: data.musicEnabled,
        musicSource: data.musicSource,
        backgroundsEnabled: data.backgroundsEnabled,
        background: {
          autoChange: true,
          interval: 10
        },
        onboardingCompleted: true,
        createdAt: now,
        updatedAt: now
      };
      await db.userPreferences.put(userPrefs);

      // Update music preferences if enabled
      if (data.musicEnabled) {
        const musicPrefs = await db.musicPreferences.get('music');
        if (musicPrefs) {
          await db.musicPreferences.put({
            ...musicPrefs,
            enabled: true,
            source: data.musicSource,
            updatedAt: now
          });
        }
      }

      onComplete();
    } catch (error) {
      console.error('Failed to save onboarding preferences:', error);
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.focusMode !== null;
      case 2:
        return true; // Music step is optional
      case 3:
        return true; // Background step is optional
      default:
        return false;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="" className="max-w-2xl">
      <div className="p-6">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-center items-center space-x-4 mb-4">
            {[1, 2, 3].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    stepNum === step
                      ? 'bg-blue-600 text-white'
                      : stepNum < step
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {stepNum < step ? (
                    <span className="material-icons text-sm">check</span>
                  ) : (
                    stepNum
                  )}
                </div>
                {stepNum < 3 && (
                  <div
                    className={`w-16 h-0.5 transition-colors ${
                      stepNum < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Step {step} of 3
          </p>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {step === 1 && (
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome to Research Timer Pro! 🎯
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  What's your primary focus activity? This helps us tailor your experience.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
                {[
                  { id: 'deep', name: 'Deep Research', description: 'Complex analysis, writing papers', duration: 25, icon: '🔬' },
                  { id: 'reading', name: 'Reading & Review', description: 'Papers, books, documentation', duration: 30, icon: '📚' },
                  { id: 'coding', name: 'Programming', description: 'Coding, debugging, development', duration: 25, icon: '💻' },
                  { id: 'writing', name: 'Academic Writing', description: 'Papers, proposals, reports', duration: 45, icon: '✍️' }
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => updateData({ focusMode: preset.id as SessionMode })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      data.focusMode === preset.id
                        ? 'border-blue-600 bg-blue-600/10 dark:bg-blue-600/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-600/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{preset.icon}</span>
                      <div className="text-left flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{preset.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {preset.description}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                          Default: {preset.duration} minutes
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                  Focus Environment 🎯
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  How do you prefer to work? Choose what helps you concentrate best.
                </p>
              </div>

              <div className="space-y-3 max-w-sm mx-auto">
                {/* No Music Option */}
                <button
                  onClick={() => updateData({ musicEnabled: false, musicSource: null })}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    !data.musicEnabled
                      ? 'border-blue-600 bg-blue-600/10 dark:bg-blue-600/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🤫</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">Silent Focus</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Pure concentration in silence
                      </div>
                    </div>
                  </div>
                </button>

                {/* Music Options */}
                <button
                  onClick={() => updateData({ musicEnabled: true, musicSource: 'youtube' })}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    data.musicEnabled && data.musicSource === 'youtube'
                      ? 'border-blue-600 bg-blue-600/10 dark:bg-blue-600/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🎵</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">Background Music</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Ambient sounds and lo-fi beats
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateData({ musicEnabled: true, musicSource: 'local' })}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    data.musicEnabled && data.musicSource === 'local'
                      ? 'border-blue-600 bg-blue-600/10 dark:bg-blue-600/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🎧</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">My Music</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Upload your own audio files
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                💡 You can change this later in Settings
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                  Perfect! You're all set! 🚀
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Your Research Timer Pro is ready to boost your productivity.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg max-w-md mx-auto">
                <div className="text-center space-y-4">
                  <div className="text-4xl">🎯</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Quick Start Tips
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left">
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      Use <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Space</kbd> to start/pause timer
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      Timer auto-floats when you minimize the browser
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      Track your progress in Timeline and Analytics
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      Customize everything in Settings
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2 text-green-800 dark:text-green-200">
                  <span className="material-icons text-sm">check_circle</span>
                  <p className="text-sm font-medium">Ready to start your first focus session!</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleBack}
            variant="ghost"
            disabled={step === 1}
          >
            Back
          </Button>

          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              variant="primary"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              variant="primary"
            >
              Get Started! 🚀
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default OnboardingModal;