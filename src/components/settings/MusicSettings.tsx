import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Field from '../ui/Field';
import { db } from '../../data/database';
import type { MusicPreferences, MusicSource } from '../../data/types';

const MusicSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<MusicPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await db.musicPreferences.get('music');
        setPreferences(prefs || null);
      } catch (error) {
        console.error('Failed to load music preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const updatePreferences = async (updates: Partial<MusicPreferences>) => {
    if (!preferences) return;

    try {
      const updated = {
        ...preferences,
        ...updates,
        updatedAt: Date.now()
      };
      await db.musicPreferences.put(updated);
      setPreferences(updated);
    } catch (error) {
      console.error('Failed to update music preferences:', error);
    }
  };

  const toggleMusic = () => {
    updatePreferences({ enabled: !preferences?.enabled });
  };

  const setSource = (source: MusicSource) => {
    updatePreferences({ source });
  };

  const resetLocalAudio = () => {
    updatePreferences({ localFile: undefined });
  };

  if (loading) {
    return <div className="text-gray-500 dark:text-gray-400">Loading music settings...</div>;
  }

  if (!preferences) {
    return <div className="text-red-500 dark:text-red-400">Failed to load music preferences</div>;
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">
            Focus Music
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enable music during focus sessions
          </p>
        </div>
        <Button
          onClick={toggleMusic}
          variant={preferences.enabled ? 'primary' : 'secondary'}
          size="sm"
        >
          {preferences.enabled ? 'Enabled' : 'Disabled'}
        </Button>
      </div>

      {preferences.enabled && (
        <>
          {/* Source Selection */}
          <Field label="Preferred Music Source" htmlFor="music-source">
            <div className="grid grid-cols-3 gap-2">
              {(['youtube', 'spotify', 'local'] as MusicSource[]).map((source) => (
                <button
                  key={source}
                  onClick={() => setSource(source)}
                  className={`p-3 rounded-lg border text-center capitalize transition-colors ${
                    preferences.source === source
                      ? 'border-blue-600 bg-blue-600/10 text-blue-600'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-600/50'
                  }`}
                >
                  <div className="text-sm font-medium">{source}</div>
                </button>
              ))}
            </div>
          </Field>

          {/* Current URLs */}
          <div className="space-y-3">
            {preferences.youtubeUrl && (
              <Field label="Saved YouTube URL" htmlFor="saved-youtube">
                <div className="flex items-center space-x-2">
                  <input
                    id="saved-youtube"
                    value={preferences.youtubeUrl}
                    readOnly
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={() => updatePreferences({ youtubeUrl: undefined })}
                    variant="ghost"
                    size="sm"
                    leftIcon="delete"
                  >
                    Clear
                  </Button>
                </div>
              </Field>
            )}

            {preferences.spotifyUrl && (
              <Field label="Saved Spotify URL" htmlFor="saved-spotify">
                <div className="flex items-center space-x-2">
                  <input
                    id="saved-spotify"
                    value={preferences.spotifyUrl}
                    readOnly
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={() => updatePreferences({ spotifyUrl: undefined })}
                    variant="ghost"
                    size="sm"
                    leftIcon="delete"
                  >
                    Clear
                  </Button>
                </div>
              </Field>
            )}

            {preferences.localFile && (
              <Field label="Local Audio File" htmlFor="saved-local">
                <div className="flex items-center space-x-2">
                  <span className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                    {preferences.localFile}
                  </span>
                  <Button
                    onClick={resetLocalAudio}
                    variant="ghost"
                    size="sm"
                    leftIcon="delete"
                  >
                    Clear
                  </Button>
                </div>
              </Field>
            )}
          </div>

          {/* Volume Control */}
          <Field label={`Volume: ${preferences.volume}%`} htmlFor="volume">
            <input
              id="volume"
              type="range"
              min="0"
              max="100"
              value={preferences.volume}
              onChange={(e) => updatePreferences({ volume: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
        </>
      )}
    </div>
  );
};

export default MusicSettings;