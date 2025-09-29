import Dexie, { type EntityTable } from 'dexie';
import type { Session, AppSettings, MusicPreferences, UserPreferences } from './types';
// import { DEFAULT_TAG_SUGGESTIONS } from './types'; // Unused but available for future use
import { parseLink } from '../utils/linkUtils';
import { uuidv4 } from '../utils/uuid';

export class ResearchTimerDB extends Dexie {
  sessions!: EntityTable<Session, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;
  musicPreferences!: EntityTable<MusicPreferences, 'id'>;
  userPreferences!: EntityTable<UserPreferences, 'id'>;

  constructor() {
    super('ResearchTimerDB');

    // Version 1: Initial schema
    this.version(1).stores({
      sessions: 'id, mode, startedAt, status, createdAt',
      settings: 'id'
    });

    // Version 2: Add journal fields
    // Note: Dexie doesn't require schema changes for new fields in existing objects
    // The journal and journalDraft fields are just added to existing Session objects
    this.version(2).stores({
      sessions: 'id, mode, startedAt, status, createdAt', // Same indexes
      settings: 'id'
    });

    // Version 3: Add AI summary fields
    // Note: Dexie doesn't require schema changes for new fields in existing objects
    // The aiSummary and aiSummaryMeta fields are just added to existing Session objects
    this.version(3).stores({
      sessions: 'id, mode, startedAt, status, createdAt', // Same indexes
      settings: 'id'
    });

    // Version 4: Migrate legacy link field to links array
    this.version(4).stores({
      sessions: 'id, mode, startedAt, status, createdAt', // Same indexes
      settings: 'id'
    }).upgrade(async tx => {
      // Migrate sessions with legacy link field
      const sessions = await tx.table('sessions').toArray();

      for (const session of sessions) {
        if (session.link && !session.links) {
          try {
            // Convert legacy link to LinkRef array
            const linkRef = parseLink(session.link);
            session.links = [linkRef];

            // Keep the legacy link field for backward compatibility during migration
            // It will be removed in a future version

            await tx.table('sessions').put(session);

            console.log(`Migrated session ${session.id} link to links array`);
          } catch (error) {
            console.warn(`Failed to migrate link for session ${session.id}:`, error);
            // Continue with other sessions if one fails
          }
        }
      }

      console.log(`Completed migration of ${sessions.length} sessions to v4`);
    });

    // Version 5: Add AI settings with privacy-first defaults
    this.version(5).stores({
      sessions: 'id, mode, startedAt, status, createdAt', // Same indexes
      settings: 'id'
    }).upgrade(async tx => {
      // Initialize AI settings with sensible defaults
      const settings = await tx.table('settings').get('global');
      if (settings) {
        settings.ai = {
          enabled: false,                    // Privacy-first: disabled by default
          provider: 'ollama',               // Default to local Ollama
          model: 'llama3:8b',               // Default Ollama model
          baseUrl: 'http://localhost:11434', // Default Ollama URL
          bullets: 5,                       // Default bullet count
          maxChars: 300,                    // Default character limit
          temperature: 0.2,                 // Conservative temperature
          includeJournal: true              // Include journal by default
        };
        settings.updatedAt = Date.now();

        await tx.table('settings').put(settings);
        console.log('Initialized AI settings with privacy-first defaults');
      }
    });

    // Version 6: Migrate to new AppSettings schema with Profile & Privacy
    this.version(6).stores({
      sessions: 'id, mode, startedAt, status, createdAt', // Same indexes
      settings: 'id'
    }).upgrade(async tx => {
      // Migrate from old 'global' settings to new 'app' settings schema
      const oldSettings = await tx.table('settings').get('global');
      const now = Date.now();

      const appSettings: AppSettings = {
        id: 'app',
        version: 1,
        createdAt: oldSettings?.createdAt || now,
        updatedAt: now,

        // Initialize privacy settings (privacy-first)
        privacy: {
          telemetryEnabled: false,  // Default OFF
          userAnonId: uuidv4()      // Generate stable anonymous ID
        },

        // Carry forward existing AI settings if they exist
        ai: oldSettings?.ai
      };

      // Add new app settings
      await tx.table('settings').put(appSettings);

      // Remove old global settings if it exists
      if (oldSettings) {
        await tx.table('settings').delete('global');
      }

      console.log('Migrated to AppSettings schema with privacy-first defaults');
    });

    // Version 7: Add music and user preferences tables
    this.version(7).stores({
      sessions: 'id, mode, startedAt, status, createdAt',
      settings: 'id',
      musicPreferences: 'id',
      userPreferences: 'id'
    }).upgrade(async tx => {
      const now = Date.now();

      // Initialize default music preferences
      const musicPrefs: MusicPreferences = {
        id: 'music',
        enabled: false,
        source: null,
        volume: 50,
        createdAt: now,
        updatedAt: now
      };
      await tx.table('musicPreferences').put(musicPrefs);

      // Initialize default user preferences
      const userPrefs: UserPreferences = {
        id: 'user',
        focusMode: null,
        musicEnabled: false,
        musicSource: null,
        backgroundsEnabled: false,
        background: {
          autoChange: true,
          interval: 10
        },
        onboardingCompleted: false,
        createdAt: now,
        updatedAt: now
      };
      await tx.table('userPreferences').put(userPrefs);

      console.log('Initialized music and user preferences');
    });

    // Initialize default settings on first run
    this.on('ready', async () => {
      const existingSettings = await this.settings.get('app');
      if (!existingSettings) {
        const now = Date.now();
        const appSettings: AppSettings = {
          id: 'app',
          version: 1,
          createdAt: now,
          updatedAt: now,
          privacy: {
            telemetryEnabled: false,
            userAnonId: uuidv4()
          }
        };
        await this.settings.put(appSettings);
        console.log('Initialized default app settings');
      }
    });
  }
}

export const db = new ResearchTimerDB();