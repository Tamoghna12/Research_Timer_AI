import React, { useState, useEffect, useRef } from 'react';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Field from '../ui/Field';
import { db } from '../../data/database';
import type { MusicPreferences, MusicSource } from '../../data/types';

const FocusMusic: React.FC = () => {
  const [preferences, setPreferences] = useState<MusicPreferences | null>(null);
  const [activeTab, setActiveTab] = useState<MusicSource>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [volume, setVolume] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await db.musicPreferences.get('music');
        if (prefs) {
          setPreferences(prefs);
          setActiveTab(prefs.source || 'youtube');
          setYoutubeUrl(prefs.youtubeUrl || '');
          setSpotifyUrl(prefs.spotifyUrl || '');
          setVolume(prefs.volume);
        }
      } catch (error) {
        console.error('Failed to load music preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  // Save preferences
  const savePreferences = async (updates: Partial<MusicPreferences>) => {
    try {
      const current = await db.musicPreferences.get('music');
      if (current) {
        const updated = {
          ...current,
          ...updates,
          updatedAt: Date.now()
        };
        await db.musicPreferences.put(updated);
        setPreferences(updated);
      }
    } catch (error) {
      console.error('Failed to save music preferences:', error);
    }
  };

  // Extract video ID from YouTube URL
  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Extract Spotify ID from URL
  const extractSpotifyId = (url: string): string | null => {
    const regex = /spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    return match ? match[2] : null;
  };

  // Handle tab change
  const handleTabChange = (tab: MusicSource) => {
    setActiveTab(tab);
    savePreferences({ source: tab });
  };

  // Handle YouTube URL save
  const handleYouTubeSave = () => {
    if (youtubeUrl) {
      savePreferences({ youtubeUrl, source: 'youtube', enabled: true });
    }
  };

  // Handle Spotify URL save
  const handleSpotifySave = () => {
    if (spotifyUrl) {
      savePreferences({ spotifyUrl, source: 'spotify', enabled: true });
    }
  };

  // Handle local file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLocalFile(file);
      savePreferences({ localFile: file.name, source: 'local', enabled: true });
    }
  };

  // Handle volume change
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    savePreferences({ volume: newVolume });
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  // Toggle play/pause for local audio
  const toggleLocalPlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const youtubeId = youtubeUrl ? extractYouTubeId(youtubeUrl) : null;
  const spotifyId = spotifyUrl ? extractSpotifyId(spotifyUrl) : null;

  if (!preferences?.enabled) {
    return null;
  }

  return (
    <Card data-music-enabled="true">
      <CardHeader>
        <h2 className="font-display text-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Focus Music
        </h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => handleTabChange('youtube')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'youtube'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="material-icons text-sm mr-2">play_circle</span>
              YouTube
            </button>
            <button
              onClick={() => handleTabChange('spotify')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'spotify'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="material-icons text-sm mr-2">library_music</span>
              Spotify
            </button>
            <button
              onClick={() => handleTabChange('local')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'local'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="material-icons text-sm mr-2">upload_file</span>
              Local
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'youtube' && (
            <div className="space-y-4">
              <Field label="YouTube URL" htmlFor="youtube-url">
                <input
                  id="youtube-url"
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full"
                />
              </Field>
              <div className="flex gap-2">
                <Button
                  onClick={handleYouTubeSave}
                  disabled={!youtubeUrl}
                  variant="primary"
                  size="sm"
                >
                  Save & Play
                </Button>
              </div>
              {youtubeId && preferences.youtubeUrl && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&controls=1`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="YouTube Music Player"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'spotify' && (
            <div className="space-y-4">
              <Field label="Spotify URL" htmlFor="spotify-url">
                <input
                  id="spotify-url"
                  type="url"
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  placeholder="https://open.spotify.com/track/..."
                  className="w-full"
                />
              </Field>
              <div className="flex gap-2">
                <Button
                  onClick={handleSpotifySave}
                  disabled={!spotifyUrl}
                  variant="primary"
                  size="sm"
                >
                  Save & Play
                </Button>
              </div>
              {spotifyId && preferences.spotifyUrl && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={`https://open.spotify.com/embed/track/${spotifyId}`}
                    className="w-full h-full"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    title="Spotify Music Player"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'local' && (
            <div className="space-y-4">
              <Field label="Upload Audio File" htmlFor="local-file">
                <input
                  ref={fileInputRef}
                  id="local-file"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="w-full"
                />
              </Field>
              {localFile && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selected: {localFile.name}
                  </p>
                  <audio
                    ref={audioRef}
                    controls
                    className="w-full"
                    onLoadedData={() => {
                      if (audioRef.current) {
                        audioRef.current.volume = volume / 100;
                      }
                    }}
                  >
                    <source src={URL.createObjectURL(localFile)} />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          )}

          {/* Global Controls */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {activeTab === 'local' && localFile && (
                  <Button
                    onClick={toggleLocalPlayback}
                    variant="secondary"
                    size="sm"
                    leftIcon={isPlaying ? 'pause' : 'play_arrow'}
                    data-music-play="true"
                  >
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                )}
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-sm text-gray-500">volume_up</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-500 w-8">{volume}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FocusMusic;