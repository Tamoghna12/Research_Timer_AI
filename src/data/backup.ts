import { db } from './database';
import type { Session, AppSettings } from './types';

export type BackupFile = {
  kind: 'research-timer-backup';
  version: 1;
  createdAt: number;
  sessions: Session[];     // include journals, links, aiSummary/meta
  settings: AppSettings;   // singleton
};

export async function exportAll(): Promise<BackupFile> {
  const sessions = await db.sessions.orderBy('createdAt').toArray();
  const settings = await db.settings.get('app');

  if (!settings) {
    throw new Error('App settings not found - database may be corrupted');
  }

  return {
    kind: 'research-timer-backup',
    version: 1,
    createdAt: Date.now(),
    sessions,
    settings
  };
}

export function downloadBackup(file: BackupFile): void {
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: 'application/json'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  a.href = url;
  a.download = `research-timer-data-${date}.json`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

export type ImportPreview = {
  sessionsToAdd: number;
  sessionsToUpdate: number;
  sessionsSkipped: number;
};

export async function importPreview(file: BackupFile): Promise<ImportPreview> {
  // Validate backup file structure
  if (file.kind !== 'research-timer-backup') {
    throw new Error('Invalid backup file: not a research timer backup');
  }

  if (file.version !== 1) {
    throw new Error(`Unsupported backup version: ${file.version}. Expected version 1.`);
  }

  if (!Array.isArray(file.sessions) || !file.settings) {
    throw new Error('Invalid backup file: missing sessions or settings data');
  }

  // Get existing sessions to compare
  const existingSessions = await db.sessions.toArray();
  const existingMap = new Map(existingSessions.map(s => [s.id, s]));

  let sessionsToAdd = 0;
  let sessionsToUpdate = 0;
  let sessionsSkipped = 0;

  for (const session of file.sessions) {
    const existing = existingMap.get(session.id);

    if (!existing) {
      sessionsToAdd++;
    } else if (session.updatedAt > existing.updatedAt) {
      sessionsToUpdate++;
    } else {
      sessionsSkipped++;
    }
  }

  return {
    sessionsToAdd,
    sessionsToUpdate,
    sessionsSkipped
  };
}

export async function importApply(
  file: BackupFile,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _preview: ImportPreview
): Promise<{ added: number; updated: number; skipped: number }> {
  // Validate again for safety
  if (file.kind !== 'research-timer-backup' || file.version !== 1) {
    throw new Error('Invalid backup file');
  }

  const existingSessions = await db.sessions.toArray();
  const existingMap = new Map(existingSessions.map(s => [s.id, s]));

  let added = 0;
  let updated = 0;
  let skipped = 0;

  // Use a transaction for data integrity
  await db.transaction('rw', [db.sessions, db.settings], async () => {
    // Process sessions
    for (const session of file.sessions) {
      const existing = existingMap.get(session.id);

      if (!existing) {
        await db.sessions.add(session);
        added++;
      } else if (session.updatedAt > existing.updatedAt) {
        await db.sessions.put(session);
        updated++;
      } else {
        skipped++;
      }
    }

    // Update settings if the backup has newer settings
    const currentSettings = await db.settings.get('app');
    if (!currentSettings || file.settings.updatedAt > currentSettings.updatedAt) {
      // Preserve the current privacy settings (including anonymous ID) and AI settings
      // but update researcher profile if present in backup
      const mergedSettings: AppSettings = {
        ...file.settings,
        // Keep current privacy settings to preserve anonymous ID and user preferences
        privacy: currentSettings?.privacy || file.settings.privacy,
        // Keep current AI settings if they exist
        ai: currentSettings?.ai || file.settings.ai,
        updatedAt: Date.now()
      };

      await db.settings.put(mergedSettings);
    }
  });

  return { added, updated, skipped };
}