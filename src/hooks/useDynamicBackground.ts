import { useState, useEffect, useCallback } from 'react';
import { db } from '../data/database';
import type { UserPreferences } from '../data/types';

export type Background = {
  id: string;
  name: string;
  type: 'gradient';
  gradient: string;
};

const DEFAULT_BACKGROUNDS: Background[] = [
  {
    id: 'forest',
    name: 'Forest Canopy',
    type: 'gradient',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 'ocean',
    name: 'Ocean Depth',
    type: 'gradient',
    gradient: 'linear-gradient(135deg, #667db6 0%, #0082c8 100%)'
  },
  {
    id: 'sunset',
    name: 'Sunset Sky',
    type: 'gradient',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)'
  },
  {
    id: 'mountain',
    name: 'Mountain Vista',
    type: 'gradient',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  },
  {
    id: 'space',
    name: 'Deep Space',
    type: 'gradient',
    gradient: 'linear-gradient(135deg, #434343 0%, #000000 100%)'
  }
];

export const useDynamicBackground = () => {
  const [currentBackground, setCurrentBackground] = useState<Background | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [, setBackgroundIndex] = useState(0);

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await db.userPreferences.get('user');
        if (prefs) {
          setPreferences(prefs);

          // Set initial background
          if (prefs.backgroundsEnabled) {
            if (prefs.background.staticImage) {
              const staticBg = DEFAULT_BACKGROUNDS.find(bg => bg.id === prefs.background.staticImage);
              setCurrentBackground(staticBg || DEFAULT_BACKGROUNDS[0]);
            } else {
              setCurrentBackground(DEFAULT_BACKGROUNDS[0]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load background preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  // Auto-change background interval
  useEffect(() => {
    if (!preferences?.backgroundsEnabled || !preferences.background.autoChange || preferences.background.staticImage) {
      return;
    }

    const intervalMs = preferences.background.interval * 60 * 1000; // convert minutes to ms

    const interval = window.setInterval(() => {
      setBackgroundIndex(prev => {
        const newIndex = (prev + 1) % DEFAULT_BACKGROUNDS.length;
        setCurrentBackground(DEFAULT_BACKGROUNDS[newIndex]);
        return newIndex;
      });
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [preferences]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    try {
      const current = await db.userPreferences.get('user');
      if (current) {
        const updated = {
          ...current,
          ...updates,
          updatedAt: Date.now()
        };
        await db.userPreferences.put(updated);
        setPreferences(updated);
      }
    } catch (error) {
      console.error('Failed to update background preferences:', error);
    }
  }, []);

  const setStaticBackground = useCallback(async (backgroundId: string | null) => {
    if (!preferences) return;

    await updatePreferences({
      background: {
        ...preferences.background,
        staticImage: backgroundId ?? undefined
      }
    });

    if (backgroundId) {
      const bg = DEFAULT_BACKGROUNDS.find(b => b.id === backgroundId);
      if (bg) {
        setCurrentBackground(bg);
      }
    }
  }, [preferences, updatePreferences]);

  const toggleAutoChange = useCallback(async (enabled: boolean) => {
    if (!preferences) return;

    await updatePreferences({
      background: {
        ...preferences.background,
        autoChange: enabled
      }
    });
  }, [preferences, updatePreferences]);

  const setInterval = useCallback(async (minutes: number) => {
    if (!preferences) return;

    await updatePreferences({
      background: {
        ...preferences.background,
        interval: minutes
      }
    });
  }, [preferences, updatePreferences]);

  const toggleBackgrounds = useCallback(async (enabled: boolean) => {
    await updatePreferences({
      backgroundsEnabled: enabled
    });

    if (!enabled) {
      setCurrentBackground(null);
    } else {
      setCurrentBackground(DEFAULT_BACKGROUNDS[0]);
    }
  }, [updatePreferences]);

  return {
    currentBackground,
    backgrounds: DEFAULT_BACKGROUNDS,
    preferences,
    setStaticBackground,
    toggleAutoChange,
    setInterval,
    toggleBackgrounds
  };
};