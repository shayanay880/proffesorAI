import React, { useEffect, useMemo, useState } from 'react';
import { generateCase } from '../services/geminiService';
import { AiModel, GeneratedCase } from '../types';
import { CasePlayer, formatCaseAsText } from './CasePlayer';

interface CaseGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string | null;
  onInsert: (text: string) => void;
  onMakeFlashcards: (text: string) => void;
  savedCase?: GeneratedCase | null;
  onSaveCase: (conversationId: string, data: GeneratedCase) => void;
  defaultTopic?: string;
  defaultMode?: string;
  aiModel?: AiModel;
}

const DEFAULT_FORM = {
  topic: '',
  setting: 'ED',
  level: 'MS3',
  length: 'medium',
  language: 'English',
  interactive: true,
  traps: true,
};

export const CaseGeneratorModal: React.FC<CaseGeneratorModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  onInsert,
  onMakeFlashcards,
  savedCase,
  onSaveCase,
  defaultTopic,
  defaultMode,
  aiModel
}) => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [caseData, setCaseData] = useState<GeneratedCase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fix: Only hydrate form when modal opens, not when savedCase updates during generation.
  useEffect(() => {
    if (isOpen) {
      setForm((prev) => ({
        ...DEFAULT_FORM,
        ...prev,
        topic: savedCase?.meta.topic || defaultTopic || prev.topic,
        setting: savedCase?.meta.setting || prev.setting,
        level: savedCase?.meta.level || prev.level,
        length: savedCase?.meta.length || prev.length,
        language: savedCase?.meta.language || prev.language,
        interactive: savedCase?.meta.interactive ?? prev.interactive,
        traps: savedCase?.meta.traps ?? prev.traps
      }));
      setCaseData(savedCase || null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); 

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const generated = await generateCase({ ...form, mode: defaultMode || 'Study', aiModel });
      setCaseData(generated);
      if (conversationId) {
        onSaveCase(conversationId, generated);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate case JSON. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formattedCase = useMemo(() => (caseData ? formatCaseAsText(caseData) : ''), [caseData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎭</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Case Generator</h2>
              <p className="text-xs text-gray-500">Build emotionally sticky clinical cases with active recall.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Topic</label>
                <input
                  type="text"
                  value={form.topic}
                  onChange={(e) => handleChange('topic', e.target.value)}
                  placeholder="e.g. Chest pain workup"
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Setting</label>
                <select
                  value={form.setting}
                  onChange={(e) => handleChange('setting', e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="ED">Emergency Department</option>
                  <option value="Ward">Inpatient Ward</option>
                  <option value="Clinic">Outpatient Clinic</option>
                  <option value="Telehealth">Telehealth</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Learner Level</label>
                <select
                  value={form.level}
                  onChange={(e) => handleChange('level', e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="MS2">MS2</option>
                  <option value="MS3">MS3</option>
                  <option value="MS4">MS4</option>
                  <option value="Intern">Intern</option>
                  <option value="Resident">Resident</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Length</label>
                <select
                  value={form.length}
                  onChange={(e) => handleChange('length', e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="short">Short (one-pager)</option>
                  <option value="medium">Medium (2-3 beats)</option>
                  <option value="long">Long (richer detail)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Language</label>
                <select
                  value={form.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="English">English</option>
                  <option value="Persian">Persian / Farsi</option>
                </select>
              </div>
              <div className="flex items-center space-x-4 mt-6">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={form.interactive}
                    onChange={(e) => handleChange('interactive', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Interactive / Progressive</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={form.traps}
                    onChange={(e) => handleChange('traps', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include traps</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md border border-red-200 text-sm">
                {error}
              </div>
            )}

            {caseData ? (
              <CasePlayer
                caseData={caseData}
                onInsert={onInsert}
                onMakeFlashcards={onMakeFlashcards}
                isPersisted={!!savedCase}
              />
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-gray-600">
                Generate a case to preview it here. We'll auto-save it to this conversation.
                {savedCase && <div className="text-sm text-gray-500 mt-2">Saved case loaded from this conversation.</div>}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center rounded-b-lg">
          <div className="text-xs text-gray-500">
            JSON-only output enforced. Handles invalid responses by surfacing the error to you.
          </div>
          <div className="space-x-2 rtl:space-x-reverse">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Close
            </button>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !form.topic}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700 transition flex items-center disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : caseData ? 'Regenerate' : 'Generate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};