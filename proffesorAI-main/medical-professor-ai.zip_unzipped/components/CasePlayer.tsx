import React, { useMemo, useState } from 'react';
import { GeneratedCase } from '../types';
import { BidiText } from './BidiText';

export const formatCaseAsText = (data: GeneratedCase) => {
  const lines: string[] = [];
  lines.push(`🎭 Case: ${data.meta.topic} (${data.meta.setting})`);
  lines.push(`Hook: ${data.hook}`);
  lines.push(`Stakes: ${data.stakes}`);
  lines.push(`Patient: ${data.patient.demographics} | Setting: ${data.patient.setting}`);
  lines.push(`CC: ${data.patient.chiefComplaint}`);
  lines.push(`Background: ${data.patient.background}`);
  if (data.patient.vitals) lines.push(`Vitals: ${data.patient.vitals}`);

  lines.push('--- Storyline ---');
  data.storyline.forEach((step, idx) => {
    lines.push(`${idx + 1}. ${step.title}: ${step.narrative}`);
    if (step.question) lines.push(`Q: ${step.question}`);
    if (step.options?.length) lines.push(`Options: ${step.options.join(' | ')}`);
    if (step.reveal || step.expectedAnswer) lines.push(`A: ${step.reveal || step.expectedAnswer}`);
    if (step.teaching) lines.push(`Pearl: ${step.teaching}`);
    if (step.trap) lines.push(`Trap: ${step.trap}`);
    if (step.surprise) lines.push(`Surprise: ${step.surprise}`);
  });

  lines.push(`Twist: ${data.twist}`);
  lines.push('Memory Aids:');
  lines.push(`- Vivid cue: ${data.memoryAids.vividCue}`);
  lines.push(`- Stakes: ${data.memoryAids.stakes}`);
  lines.push(`- Analogy: ${data.memoryAids.analogy}`);
  if (data.memoryAids.mnemonics?.length) lines.push(`- Mnemonics: ${data.memoryAids.mnemonics.join(' | ')}`);
  if (data.memoryAids.activeRecall?.length) lines.push(`- Active recall: ${data.memoryAids.activeRecall.join(' | ')}`);
  if (data.memoryAids.trapsToAvoid?.length) lines.push(`- Traps: ${data.memoryAids.trapsToAvoid.join(' | ')}`);
  lines.push(`Hook Question: ${data.memoryAids.hookQuestion}`);

  if (data.keyTakeaways?.length) {
    lines.push('Key Takeaways:');
    data.keyTakeaways.forEach((item, idx) => lines.push(`${idx + 1}) ${item}`));
  }

  if (data.flashcardSeeds?.length) {
    lines.push('Flashcard Seeds:');
    data.flashcardSeeds.forEach((fc, idx) => lines.push(`${idx + 1}) ${fc.question} -> ${fc.answer}`));
  }

  lines.push(`Reflection: ${data.closingReflection}`);
  if (data.warnings?.length) {
    lines.push(`Warnings: ${data.warnings.join(' | ')}`);
  }
  return lines.join('\n');
};

interface CasePlayerProps {
  caseData: GeneratedCase;
  onInsert: (text: string) => void;
  onMakeFlashcards: (text: string) => void;
  isPersisted?: boolean;
}

export const CasePlayer: React.FC<CasePlayerProps> = ({ caseData, onInsert, onMakeFlashcards, isPersisted }) => {
  const [stageIndex, setStageIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const formatted = useMemo(() => formatCaseAsText(caseData), [caseData]);
  const isInteractive = !!caseData.meta?.interactive;
  const isRTL = /persian|farsi|arabic|hebrew|rtl/i.test(caseData.meta.language || '');

  const currentStage = caseData.storyline[Math.min(stageIndex, caseData.storyline.length - 1)];

  const handleNext = () => {
    setRevealed(false);
    setStageIndex((prev) => Math.min(prev + 1, caseData.storyline.length - 1));
  };

  const handlePrev = () => {
    setRevealed(false);
    setStageIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className={`${isRTL ? 'text-right' : 'text-left'} space-y-4`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm uppercase tracking-wide text-gray-500">{caseData.meta.setting}</div>
          <h3 className="text-xl font-bold text-gray-900"><BidiText text={caseData.meta.topic} /></h3>
          <p className="text-gray-600"><BidiText text={caseData.hook} /></p>
        </div>
        <div className="flex space-x-2 rtl:space-x-reverse">
          {caseData.warnings?.length ? (
            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full border border-amber-200">
              Sanity check: {caseData.warnings.length} warning{caseData.warnings.length > 1 ? 's' : ''}
            </span>
          ) : null}
          <button
            onClick={() => onInsert(formatted)}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md shadow hover:bg-blue-700"
          >
            Insert into chat
          </button>
          <button
            onClick={() => onMakeFlashcards(formatted)}
            className="px-3 py-2 bg-green-600 text-white text-sm rounded-md shadow hover:bg-green-700"
          >
            Make Flashcards
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-white rounded border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 uppercase">Stakes</div>
          <p className="text-gray-800 font-medium"><BidiText text={caseData.stakes} /></p>
        </div>
        <div className="p-3 bg-white rounded border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 uppercase">Patient</div>
          <p className="text-gray-800"><BidiText text={caseData.patient.demographics} /></p>
          <p className="text-gray-600 text-sm"><BidiText text={caseData.patient.chiefComplaint} /></p>
        </div>
        <div className="p-3 bg-white rounded border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 uppercase">Mode</div>
          <p className="text-gray-800">{caseData.meta.mode || 'Study'}</p>
          {isPersisted && <p className="text-green-700 text-xs mt-1">Saved for this conversation</p>}
        </div>
      </div>

      {isInteractive ? (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">Step {stageIndex + 1} of {caseData.storyline.length}</div>
            <div className="space-x-2 rtl:space-x-reverse">
              <button
                onClick={handlePrev}
                disabled={stageIndex === 0}
                className="px-3 py-1.5 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={stageIndex >= caseData.storyline.length - 1}
                className="px-3 py-1.5 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-1"><BidiText text={currentStage.title} /></h4>
            <p className="text-gray-700 mb-2 whitespace-pre-line"><BidiText text={currentStage.narrative} /></p>
            {currentStage.question && (
              <div className="mb-2">
                <div className="text-sm font-semibold text-blue-700">Prompt</div>
                <p className="text-gray-800"><BidiText text={currentStage.question} /></p>
              </div>
            )}
            {currentStage.options?.length > 0 && (
              <ul className="list-disc pl-5 text-gray-700 mb-2 space-y-1">
                {currentStage.options.map((opt, idx) => (
                  <li key={idx}><BidiText text={opt} /></li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setRevealed(true)}
              className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded"
            >
              Reveal
            </button>
            {revealed && (
              <div className="mt-3 space-y-2">
                {(currentStage.reveal || currentStage.expectedAnswer) && (
                  <p className="text-green-700 font-semibold"><BidiText text={currentStage.reveal || currentStage.expectedAnswer || ''} /></p>
                )}
                {currentStage.teaching && <p className="text-gray-800"><BidiText text={currentStage.teaching} /></p>}
                {currentStage.trap && <p className="text-red-600 text-sm">Trap: <BidiText text={currentStage.trap} /></p>}
                {currentStage.surprise && <p className="text-indigo-700 text-sm">Twist: <BidiText text={currentStage.surprise} /></p>}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {caseData.storyline.map((step, idx) => (
            <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-gray-900">{idx + 1}. <BidiText text={step.title} /></h4>
                {step.trap && <span className="text-xs text-red-600">Trap: <BidiText text={step.trap} /></span>}
              </div>
              <p className="text-gray-700 whitespace-pre-line"><BidiText text={step.narrative} /></p>
              {step.question && <p className="text-blue-800 font-semibold mt-2">Q: <BidiText text={step.question} /></p>}
              {step.reveal && <p className="text-green-700 mt-1">A: <BidiText text={step.reveal} /></p>}
              {step.teaching && <p className="text-gray-800 mt-1"><BidiText text={step.teaching} /></p>}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <h4 className="font-semibold text-indigo-900 mb-2">Memory Hooks</h4>
          <ul className="list-disc pl-5 space-y-1 text-indigo-900">
            <li><BidiText text={caseData.memoryAids.vividCue} /></li>
            <li><BidiText text={caseData.memoryAids.analogy} /></li>
            {caseData.memoryAids.mnemonics.map((m, idx) => <li key={idx}><BidiText text={m} /></li>)}
            {caseData.memoryAids.activeRecall.map((q, idx) => <li key={idx}>Recall: <BidiText text={q} /></li>)}
            {caseData.memoryAids.trapsToAvoid.map((t, idx) => <li key={idx}>Avoid: <BidiText text={t} /></li>)}
          </ul>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Key Takeaways</h4>
          <ul className="list-disc pl-5 space-y-1 text-green-900">
            {caseData.keyTakeaways.map((k, idx) => <li key={idx}><BidiText text={k} /></li>)}
          </ul>
          <p className="text-gray-700 mt-2"><BidiText text={caseData.closingReflection} /></p>
        </div>
      </div>
    </div>
  );
};