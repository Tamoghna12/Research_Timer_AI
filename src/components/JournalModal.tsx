import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from './ui/Button';
import Field from './ui/Field';
import { useJournal } from '../hooks/useJournal';
import { useAi } from '../hooks/useAi';
import type { SessionJournal, SessionMode, Session, AiSummaryMeta } from '../data/types';
import { TIMER_PRESETS } from '../data/types';

interface JournalModalProps {
  open: boolean;
  mode: SessionMode;
  sessionId: string;
  session?: Session;
  onSave: (journal: SessionJournal, aiSummary?: string, aiSummaryMeta?: AiSummaryMeta) => void;
  onSkip: () => void;
  onCancel: () => void;
}

const MAX_LENGTH = 300;

// Form data types that handle the discriminated union properly
type FormData =
  | Partial<{ kind: 'lit'; keyClaim: string; method: string; limitation: string }>
  | Partial<{ kind: 'writing'; wordsAdded: number | null; sectionsTouched: string }>
  | Partial<{ kind: 'analysis'; scriptOrNotebook: string; datasetRef: string; nextStep: string }>
  | Partial<{ kind: 'deep' | 'break'; whatMoved: string }>
  | Record<string, never>;

export const JournalModal: React.FC<JournalModalProps> = ({
  open,
  mode,
  sessionId,
  session,
  onSave,
  onSkip,
  onCancel
}) => {
  const { data, saveDraft } = useJournal(sessionId);
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [useAiSummary, setUseAiSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [, setEditingAiSummary] = useState(false);
  const ai = useAi();
  const modalRef = useRef<HTMLDivElement>(null);
  const firstTextareaRef = useRef<HTMLTextAreaElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const draftTimeoutRef = useRef<number | undefined>(undefined);

  const preset = TIMER_PRESETS.find(p => p.id === mode);

  // Initialize form data from existing journal or draft
  useEffect(() => {
    if (!open || !data) return;

    const initial = data.journal || data.journalDraft || getEmptyJournal(mode);
    setFormData(initial);
    setIsDirty(false);
    setErrors({});
  }, [open, data, mode]);

  // Focus trap and initial focus
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    };

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'input, textarea, button, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', trapFocus);

    // Focus first input
    setTimeout(() => {
      if (['lit', 'deep', 'break'].includes(mode)) {
        firstTextareaRef.current?.focus();
      } else {
        firstInputRef.current?.focus();
      }
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', trapFocus);
    };
  }, [open, mode]); // handleCancel and handleSave are stable callbacks

  // Auto-save draft after 5 seconds of inactivity
  useEffect(() => {
    if (!isDirty || !open) return;

    if (draftTimeoutRef.current) {
      clearTimeout(draftTimeoutRef.current);
    }

    draftTimeoutRef.current = setTimeout(() => {
      saveDraft(formData);
    }, 5000);

    return () => {
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current);
      }
    };
  }, [formData, isDirty, open, saveDraft]);

  const getEmptyJournal = (mode: SessionMode): FormData => {
    switch (mode) {
      case 'lit':
        return { kind: 'lit', keyClaim: '', method: '', limitation: '' };
      case 'writing':
        return { kind: 'writing', wordsAdded: null, sectionsTouched: '' };
      case 'analysis':
        return { kind: 'analysis', scriptOrNotebook: '', datasetRef: '', nextStep: '' };
      case 'deep':
      case 'break':
        return { kind: mode, whatMoved: '' };
      default:
        return {};
    }
  };

  const updateFormData = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear field-specific error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === 'writing' && 'wordsAdded' in formData && formData.wordsAdded !== null && formData.wordsAdded !== undefined) {
      const words = Number(formData.wordsAdded);
      if (isNaN(words) || words < 0) {
        newErrors.wordsAdded = 'Words added must be a number ≥ 0 or left blank';
      }
    }

    if (mode === 'analysis') {
      const hasScript = 'scriptOrNotebook' in formData ? formData.scriptOrNotebook?.trim() : '';
      const hasDataset = 'datasetRef' in formData ? formData.datasetRef?.trim() : '';
      const hasNextStep = 'nextStep' in formData ? formData.nextStep?.trim() : '';

      if ((hasScript || hasDataset) && !hasNextStep) {
        newErrors.nextStep = 'Next step is required when script/notebook or dataset is provided';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const trimFormData = (data: FormData): SessionJournal => {
    const trimmed = { ...data };

    Object.keys(trimmed).forEach(key => {
      const typedTrimmed = trimmed as Record<string, unknown>;
      if (typeof typedTrimmed[key] === 'string') {
        typedTrimmed[key] = (typedTrimmed[key] as string).trim();
      }
    });

    // Ensure proper typing
    const typedTrimmed = trimmed as Record<string, unknown>;
    typedTrimmed.kind = mode;
    return trimmed as SessionJournal;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const journal = trimFormData(formData);
    const finalAiSummary = useAiSummary && aiSummary.trim() ? aiSummary.trim() : undefined;
    const aiMeta = finalAiSummary ? {
      provider: 'ollama' as const,
      model: 'llama3:8b',
      createdAt: Date.now()
    } : undefined;

    onSave(journal, finalAiSummary, aiMeta);
  };

  const handleSkip = () => {
    ai.cancel();
    onSkip();
  };

  const handleCancel = () => {
    if (isDirty || ai.status === 'loading') {
      if (!window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        return;
      }
    }
    ai.cancel();
    onCancel();
  };

  const handleGenerateAiSummary = async () => {
    if (!session) return;

    const result = await ai.generateSummary(session);
    if (result) {
      setAiSummary(result.text);
      setEditingAiSummary(true);
    }
  };

  const renderAiSummarySection = () => {
    if (!useAiSummary) return null;

    return (
      <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-800 dark:text-gray-200">AI Summary</h4>
          <div className="flex items-center gap-2">
            {ai.status === 'idle' && !aiSummary && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerateAiSummary}
                disabled={!session || !ai.enabled || !ai.isConfigured}
              >
                Generate
              </Button>
            )}
            {ai.status === 'loading' && (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={ai.cancel}
                >
                  Cancel
                </Button>
              </>
            )}
            {ai.status === 'error' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerateAiSummary}
                disabled={!session || !ai.enabled || !ai.isConfigured}
              >
                Retry
              </Button>
            )}
            {(ai.status === 'success' || aiSummary) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAiSummary('');
                  setEditingAiSummary(false);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {ai.status === 'error' && (
          <div className="text-sm text-red-600 dark:text-red-400 mb-2">
            {ai.error}
          </div>
        )}

        {(ai.result || aiSummary) && (
          <Field label="AI Summary" htmlFor="aiSummary" hint="Editable before saving">
            <textarea
              id="aiSummary"
              value={aiSummary || ai.result || ''}
              onChange={(e) => {
                setAiSummary(e.target.value);
                setEditingAiSummary(true);
              }}
              onFocus={() => setEditingAiSummary(true)}
              className="w-full"
              rows={4}
              placeholder="AI-generated summary will appear here..."
              readOnly={ai.status === 'loading'}
            />
          </Field>
        )}
      </div>
    );
  };

  const renderModeSpecificFields = () => {
    switch (mode) {
      case 'lit':
        return (
          <>
            <Field label="Key Claim" htmlFor="keyClaim" hint={`${('keyClaim' in formData ? formData.keyClaim || '' : '').length}/${MAX_LENGTH} characters`}>
              <textarea
                ref={firstTextareaRef}
                id="keyClaim"
                value={'keyClaim' in formData ? formData.keyClaim || '' : ''}
                onChange={(e) => updateFormData('keyClaim', e.target.value.slice(0, MAX_LENGTH))}
                className="w-full"
                rows={3}
                placeholder="What is the main claim or finding from this literature?"
                maxLength={MAX_LENGTH}
                aria-describedby="keyClaim-help"
              />
              <div id="keyClaim-help" className="sr-only">
                Describe the key claim or finding from the literature you reviewed
              </div>
            </Field>

            <Field label="Method" htmlFor="method" hint={`${('method' in formData ? formData.method || '' : '').length}/${MAX_LENGTH} characters`}>
              <textarea
                id="method"
                value={'method' in formData ? formData.method || '' : ''}
                onChange={(e) => updateFormData('method', e.target.value.slice(0, MAX_LENGTH))}
                className="w-full"
                rows={3}
                placeholder="How was this research conducted?"
                maxLength={MAX_LENGTH}
                aria-describedby="method-help"
              />
              <div id="method-help" className="sr-only">
                Describe the methodology used in the research
              </div>
            </Field>

            <Field label="Limitation" htmlFor="limitation" hint={`${('limitation' in formData ? formData.limitation || '' : '').length}/${MAX_LENGTH} characters`}>
              <textarea
                id="limitation"
                value={'limitation' in formData ? formData.limitation || '' : ''}
                onChange={(e) => updateFormData('limitation', e.target.value.slice(0, MAX_LENGTH))}
                className="w-full"
                rows={3}
                placeholder="What are the key limitations or gaps?"
                maxLength={MAX_LENGTH}
                aria-describedby="limitation-help"
              />
              <div id="limitation-help" className="sr-only">
                Note any limitations, gaps, or areas for improvement
              </div>
            </Field>
          </>
        );

      case 'writing':
        return (
          <>
            <Field
              label="Words Added"
              htmlFor="wordsAdded"
              hint="Leave blank if not applicable"
            >
              <input
                ref={firstInputRef}
                id="wordsAdded"
                type="number"
                min="0"
                value={('wordsAdded' in formData ? formData.wordsAdded || '' : '')}
                onChange={(e) => updateFormData('wordsAdded', e.target.value ? parseInt(e.target.value) : null)}
                className={`w-full ${errors.wordsAdded ? 'border-red-500' : ''}`}
                placeholder="320"
                aria-describedby="wordsAdded-help wordsAdded-error"
                aria-invalid={!!errors.wordsAdded}
              />
              <div id="wordsAdded-help" className="sr-only">
                Approximate number of words added during this writing session
              </div>
              {errors.wordsAdded && (
                <div id="wordsAdded-error" className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.wordsAdded}
                </div>
              )}
            </Field>

            <Field
              label="Sections Touched"
              htmlFor="sectionsTouched"
              hint={`${('sectionsTouched' in formData ? formData.sectionsTouched || '' : '').length}/${MAX_LENGTH} characters`}
            >
              <textarea
                id="sectionsTouched"
                value={'sectionsTouched' in formData ? formData.sectionsTouched || '' : ''}
                onChange={(e) => updateFormData('sectionsTouched', e.target.value.slice(0, MAX_LENGTH))}
                className="w-full"
                rows={3}
                placeholder="Introduction, Methods section - improved flow and clarity"
                maxLength={MAX_LENGTH}
                aria-describedby="sectionsTouched-help"
              />
              <div id="sectionsTouched-help" className="sr-only">
                Which sections or parts did you work on?
              </div>
            </Field>
          </>
        );

      case 'analysis':
        return (
          <>
            <Field label="Script/Notebook" htmlFor="scriptOrNotebook">
              <input
                ref={firstInputRef}
                id="scriptOrNotebook"
                type="text"
                value={'scriptOrNotebook' in formData ? formData.scriptOrNotebook || '' : ''}
                onChange={(e) => updateFormData('scriptOrNotebook', e.target.value)}
                className="w-full"
                placeholder="analysis_v2.ipynb, data_cleaning.py"
                aria-describedby="scriptOrNotebook-help"
              />
              <div id="scriptOrNotebook-help" className="sr-only">
                Name of the script, notebook, or file you worked on
              </div>
            </Field>

            <Field label="Dataset Reference" htmlFor="datasetRef">
              <input
                id="datasetRef"
                type="text"
                value={'datasetRef' in formData ? formData.datasetRef || '' : ''}
                onChange={(e) => updateFormData('datasetRef', e.target.value)}
                className="w-full"
                placeholder="survey_data_2024.csv, /data/experiments/batch_2"
                aria-describedby="datasetRef-help"
              />
              <div id="datasetRef-help" className="sr-only">
                Dataset file, path, or URL you analyzed
              </div>
            </Field>

            <Field
              label="Next Step"
              htmlFor="nextStep"
              hint="What's one actionable next step?"
            >
              <textarea
                id="nextStep"
                value={'nextStep' in formData ? formData.nextStep || '' : ''}
                onChange={(e) => updateFormData('nextStep', e.target.value)}
                className={`w-full ${errors.nextStep ? 'border-red-500' : ''}`}
                rows={2}
                placeholder="Run correlation analysis between variables X and Y"
                aria-describedby="nextStep-help nextStep-error"
                aria-invalid={!!errors.nextStep}
              />
              <div id="nextStep-help" className="sr-only">
                One specific next step to continue this analysis
              </div>
              {errors.nextStep && (
                <div id="nextStep-error" className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.nextStep}
                </div>
              )}
            </Field>
          </>
        );

      case 'deep':
      case 'break':
        return (
          <Field
            label="What Moved Forward?"
            htmlFor="whatMoved"
            hint={`${('whatMoved' in formData ? formData.whatMoved || '' : '').length}/${MAX_LENGTH} characters`}
          >
            <textarea
              ref={firstTextareaRef}
              id="whatMoved"
              value={'whatMoved' in formData ? formData.whatMoved || '' : ''}
              onChange={(e) => updateFormData('whatMoved', e.target.value.slice(0, MAX_LENGTH))}
              className="w-full"
              rows={4}
              placeholder={mode === 'break'
                ? "How did this break help you recharge or gain perspective?"
                : "What progress did you make? What insights emerged?"
              }
              maxLength={MAX_LENGTH}
              aria-describedby="whatMoved-help"
            />
            <div id="whatMoved-help" className="sr-only">
              {mode === 'break'
                ? "Reflect on how this break contributed to your work"
                : "Capture what you accomplished and any insights"
              }
            </div>
          </Field>
        );

      default:
        return null;
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleCancel} />

        {/* Modal */}
        <div
          ref={modalRef}
          className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="px-6 py-4 border-b border-gray-300 dark:border-gray-600">
            <h3 id="modal-title" className="text-lg font-medium text-gray-800 dark:text-gray-200">
              {preset?.name} — Quick Journal
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Capture your insights from this session
            </p>
          </div>

          <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
            {renderModeSpecificFields()}

            <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
              <Field label="AI Summary Options">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={useAiSummary}
                    disabled={!ai.enabled || !ai.isConfigured}
                    onChange={(e) => {
                      setUseAiSummary(e.target.checked);
                      if (!e.target.checked) {
                        setAiSummary('');
                        setEditingAiSummary(false);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50"
                  />
                  Use AI to condense notes/journal
                  <span className="ml-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                    Beta
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                  {!ai.enabled ? 'Enable AI in Settings to use this feature' :
                   !ai.isConfigured ? 'Configure AI provider in Settings to use this feature' :
                   'AI will generate a 3-5 bullet summary that you can edit before saving'}
                </p>
              </Field>
            </div>

            {renderAiSummarySection()}
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-300 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleSkip}>
                Skip
              </Button>
              <Button variant="primary" onClick={handleSave}>
                Save <span className="hidden sm:inline">(Ctrl+Enter)</span>
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Press Esc to cancel • Auto-saves draft after 5s
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default JournalModal;