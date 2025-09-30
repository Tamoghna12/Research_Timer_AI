export type SessionMode = 'lit' | 'analysis' | 'writing' | 'deep' | 'break';

export type LinkType =
  | 'doi'           // Academic papers via DOI
  | 'arxiv'         // arXiv preprints
  | 'url'           // Generic web URLs
  | 'github'        // GitHub repositories
  | 'overleaf'      // Overleaf projects
  | 'zotero'        // Zotero collections/items
  | 'local';        // Local file paths

export type LinkRef = {
  id: string;       // uuid for this link reference
  type: LinkType;   // parsed link type
  url: string;      // original URL/path
  title?: string;   // auto-parsed or user-provided title
  description?: string; // optional user description
  addedAt: number;  // epoch ms when added
};

// Journal types - discriminated union based on mode
export type LitJournal = {
  kind: 'lit';
  keyClaim: string;     // ≤300 chars
  method: string;       // ≤300
  limitation: string;   // ≤300
};

export type WritingJournal = {
  kind: 'writing';
  wordsAdded: number | null;  // >=0 or null
  sectionsTouched: string;    // ≤300
};

export type AnalysisJournal = {
  kind: 'analysis';
  scriptOrNotebook: string;   // file/notebook name
  datasetRef: string;         // dataset id/path/URL
  nextStep: string;           // one actionable next step
};

export type SimpleJournal = {
  kind: 'deep' | 'break';
  whatMoved: string;          // ≤300
};

export type SessionJournal = LitJournal | WritingJournal | AnalysisJournal | SimpleJournal;

export type ResearcherProfile = {
  name?: string;
  affiliation?: string;
};

export type PrivacySettings = {
  telemetryEnabled: boolean;  // default false
  userAnonId: string;         // stable UUID v4, created on first run
};

export type AiProvider = 'openai' | 'anthropic' | 'gemini' | 'groq';

export type AiSummaryMeta = {
  provider: AiProvider;
  model: string;
  createdAt: number;
  tokensIn?: number;
  tokensOut?: number;
};

export type AiSettings = {
  enabled: boolean;                  // master opt-in (default false)
  provider: AiProvider | null;       // default 'openai'
  model?: string;                    // e.g., 'gpt-4o-mini', 'claude-3-haiku', 'gemini-1.5-pro'
  apiKey?: string;                   // stored locally (warning in UI)
  bullets?: number;                  // default 5 (min 3, max 7)
  maxChars?: number;                 // default 300 (150–600)
  temperature?: number;              // default 0.2
  includeJournal?: boolean;          // default true
};

export type Session = {
  id: string;             // uuid
  mode: SessionMode;
  plannedMs: number;
  startedAt: number;      // epoch ms
  endedAt?: number;       // epoch ms
  status: 'running' | 'completed' | 'cancelled';

  goal?: string;
  notes?: string;         // autosaved
  tags: string[];         // e.g., ['#lit-review', '#methods']

  // Legacy field - will be migrated to links[] in Dexie migration
  link?: string;          // DOI/URL; legacy support during migration

  // New multi-link support
  links?: LinkRef[];      // Multiple typed research links

  journal?: SessionJournal;
  journalDraft?: Partial<SessionJournal>; // optional draft storage

  aiSummary?: string;           // markdown bullet list
  aiSummaryMeta?: AiSummaryMeta;

  createdAt: number;
  updatedAt: number;
};

export type AppSettings = {
  id: 'app';                   // singleton
  version: number;             // increment on schema changes
  createdAt: number;
  updatedAt: number;

  researcher?: ResearcherProfile;
  privacy: PrivacySettings;

  ai?: AiSettings;             // from Step 7 (unchanged)
};

export interface TimerPreset {
  id: SessionMode;
  name: string;
  duration: number; // minutes
  description: string;
}

export const TIMER_PRESETS: TimerPreset[] = [
  { id: 'lit', name: 'Lit Review', duration: 25, description: 'Literature review and reading' },
  { id: 'analysis', name: 'Analysis', duration: 45, description: 'Data analysis and research' },
  { id: 'writing', name: 'Writing', duration: 30, description: 'Writing and documentation' },
  { id: 'deep', name: 'Deep Work', duration: 90, description: 'Deep focus sessions' },
  { id: 'break', name: 'Break', duration: 15, description: 'Rest and recovery' },
];

export const DEFAULT_TAG_SUGGESTIONS = [
  '#lit-review',
  '#analysis',
  '#writing',
  '#grant',
  '#admin'
];

export type MusicSource = 'youtube' | 'spotify' | 'local';

export type MusicPreferences = {
  id: 'music';                    // singleton
  enabled: boolean;
  source: MusicSource | null;     // selected tab
  youtubeUrl?: string;            // last YouTube URL
  spotifyUrl?: string;            // last Spotify URL
  localFile?: string;             // filename of uploaded audio
  volume: number;                 // 0-100
  createdAt: number;
  updatedAt: number;
};

export type BackgroundPreferences = {
  autoChange: boolean;
  interval: number;               // minutes
  staticImage?: string;           // specific background if not auto
};

export type UserPreferences = {
  id: 'user';                     // singleton
  focusMode: SessionMode | null;  // preferred focus mode
  musicEnabled: boolean;
  musicSource: MusicSource | null;
  backgroundsEnabled: boolean;
  background: BackgroundPreferences;
  onboardingCompleted: boolean;
  createdAt: number;
  updatedAt: number;
};