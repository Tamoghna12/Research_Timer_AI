import React, { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import type { ResearcherProfile } from '../../data/types';
import Field from '../ui/Field';

const ProfileSettings: React.FC = () => {
  const { settings, saveProfile } = useSettings();
  const [profile, setProfile] = useState<ResearcherProfile>({});
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Initialize from settings
  useEffect(() => {
    if (settings?.researcher) {
      setProfile(settings.researcher);
    }
  }, [settings?.researcher]);

  const handleSave = async (field: keyof ResearcherProfile, value: string) => {
    const updated = { ...profile, [field]: value || undefined };
    setProfile(updated);

    try {
      await saveProfile(updated);
      const now = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setSaveStatus(`Saved • ${now}`);

      // Clear status after 3 seconds
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveStatus('Save failed');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    handleSave('name', e.target.value);
  };

  const handleAffiliationBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    handleSave('affiliation', e.target.value);
  };

  const hasProfile = profile.name || profile.affiliation;

  return (
    <div className="space-y-4">
      <Field label="Researcher Name" htmlFor="researcher-name">
        <input
          id="researcher-name"
          type="text"
          value={profile.name || ''}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          onBlur={handleNameBlur}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Dr. Jane Smith"
        />
      </Field>

      <Field label="Affiliation" htmlFor="affiliation">
        <input
          id="affiliation"
          type="text"
          value={profile.affiliation || ''}
          onChange={(e) => setProfile({ ...profile, affiliation: e.target.value })}
          onBlur={handleAffiliationBlur}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="University, Lab, or Institution"
        />
      </Field>

      {saveStatus && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {saveStatus}
        </div>
      )}

      {hasProfile && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Weekly Report header:</strong>{' '}
            <span className="font-medium">{profile.name}</span>
            {profile.name && profile.affiliation && (
              <span>, <span className="italic">{profile.affiliation}</span></span>
            )}
            {!profile.name && profile.affiliation && (
              <span className="italic">{profile.affiliation}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;