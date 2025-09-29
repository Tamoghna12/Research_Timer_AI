import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/database';
import type { AppSettings, ResearcherProfile, PrivacySettings, AiSettings } from '../data/types';

export function useSettings() {
  const settings = useLiveQuery(
    () => db.settings.get('app'),
    []
  );

  const get = (): AppSettings | undefined => settings;

  const saveProfile = async (profile: ResearcherProfile) => {
    const current = await db.settings.get('app');
    if (!current) {
      throw new Error('App settings not initialized');
    }

    const updated: AppSettings = {
      ...current,
      researcher: profile,
      updatedAt: Date.now()
    };

    await db.settings.put(updated);
  };

  const savePrivacy = async (privacy: PrivacySettings) => {
    const current = await db.settings.get('app');
    if (!current) {
      throw new Error('App settings not initialized');
    }

    const updated: AppSettings = {
      ...current,
      privacy,
      updatedAt: Date.now()
    };

    await db.settings.put(updated);
  };

  const saveAi = async (ai: AiSettings) => {
    const current = await db.settings.get('app');
    if (!current) {
      throw new Error('App settings not initialized');
    }

    const updated: AppSettings = {
      ...current,
      ai,
      updatedAt: Date.now()
    };

    await db.settings.put(updated);
  };

  return {
    settings,
    get,
    saveProfile,
    savePrivacy,
    saveAi
  };
}