import React from 'react';
import { CaseSession } from '../types';
import { BidiText } from './BidiText';

interface CaseSessionPanelProps {
  session: CaseSession;
  onSelectOption: (stageIndex: number, option: string) => void;
  onReveal: (stageIndex: number) => void;
  onStageChange: (nextStageIndex: number) => void;
  onInsertPrompt: (prompt: string) => void;
  onRestart: () => void;
}

export const CaseSessionPanel: React.FC<CaseSessionPanelProps> = ({
  session,
  onSelectOption,
  onReveal,
  onStageChange,
  onInsertPrompt,
  onRestart
}) => {
  if (!session.activeCase || !session.activeCase.storyline.length) return null;

  const { activeCase } = session;
  const totalStages = activeCase.storyline.length;
  const safeIndex = Math.min(session.stageIndex, totalStages - 1);
  const stage = activeCase.storyline[safeIndex];
  const userChoice = session.userChoices?.[safeIndex];
  const isRevealed = session.revealed?.[safeIndex];
  const storedFeedback = session.feedback?.[safeIndex];

  const isRTL = /persian|farsi|arabic|hebrew|rtl/i.test(activeCase.meta.language || '');
  const checkpoint = stage.question || 'What is your next move and why?';
  const stagePrompt = [
    `Stage ${safeIndex + 1}/${totalStages}: ${stage.title}`,
    stage.narrative,
    `Checkpoint question: ${checkpoint}`,
    stage.options?.length ? `Options: ${stage.options.join(' | ')}` : 'Options: Free-form response (justify your reasoning).'
  ].join('\n');

  const handleReveal = () => onReveal(safeIndex);
  const handlePrev = () => onStageChange(Math.max(safeIndex - 1, 0));
  const handleNext = () => onStageChange(Math.min(safeIndex + 1, totalStages - 1));

  const feedback = storedFeedback || (isRevealed
    ? [stage.reveal || stage.expectedAnswer, stage.teaching].filter(Boolean).join(' — ')
    : '');

  return (
    <div className="bg-white border border-cyan-100 shadow-sm rounded-3xl p-5" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-cyan-600 font-bold">Case Session</div>
          <h3 className="text-xl font-black text-slate-900 mt-1"><BidiText text={activeCase.meta.topic} /></h3>
          <p className="text-sm text-slate-600">
            <BidiText text={`${activeCase.meta.setting} • Mode: ${activeCase.meta.mode || 'Study'}`} />
          </p>
        </div>
        <div className="flex flex-wrap gap-2 rtl:space-x-reverse">
          <button
            onClick={() => onInsertPrompt(stagePrompt)}
            className="px-3 py-2 bg-cyan-600 text-white text-xs font-bold rounded-xl shadow hover:bg-cyan-700 transition"
          >
            Use stage prompt
          </button>
          <button
            onClick={onRestart}
            className="px-3 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition"
          >
            Restart case
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-slate-600">Stage {safeIndex + 1} of {totalStages}</div>
        <div className="flex gap-2 rtl:space-x-reverse">
          <button
            onClick={handlePrev}
            disabled={safeIndex === 0}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={safeIndex >= totalStages - 1}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <h4 className="font-semibold text-slate-900 mb-1"><BidiText text={stage.title} /></h4>
        <p className="text-slate-700 leading-relaxed whitespace-pre-line"><BidiText text={stage.narrative} /></p>
      </div>

      <div className="mt-3 p-4 border border-cyan-100 rounded-2xl bg-cyan-50/40">
        <div className="text-[11px] uppercase font-semibold text-cyan-800 mb-1">Checkpoint Prompt</div>
        <p className="text-slate-800"><BidiText text={checkpoint} /></p>
        {stage.options?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {stage.options.map((opt, idx) => {
              const isSelected = userChoice === opt;
              return (
                <button
                  key={idx}
                  onClick={() => onSelectOption(safeIndex, opt)}
                  className={`px-3 py-2 text-xs rounded-xl border transition ${isSelected ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-300'}`}
                >
                  <BidiText text={opt} />
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No preset options — type your answer in chat before revealing.</p>
        )}
        <div className="mt-2 text-xs text-amber-700 font-semibold">Pick an answer before revealing the rationale.</div>
        <div className="mt-3 flex gap-2 rtl:space-x-reverse">
          <button
            onClick={handleReveal}
            disabled={!userChoice && !!stage.options?.length}
            className="px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow hover:bg-slate-800 disabled:opacity-50"
          >
            Reveal rationale
          </button>
          <button
            onClick={() => onInsertPrompt(`Checkpoint response for stage ${safeIndex + 1}: ${userChoice || '[enter your answer]'}`)}
            className="px-3 py-2 bg-white text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 hover:border-cyan-300"
          >
            Send my answer
          </button>
        </div>
        <div className="mt-3 text-sm text-slate-700">
          <div className="font-semibold text-slate-800">Your choice:</div>
          <p className="text-slate-700">{userChoice ? <BidiText text={userChoice} /> : 'Not answered yet.'}</p>
        </div>
        {isRevealed && (
          <div className="mt-3 space-y-2 p-3 bg-white border border-cyan-100 rounded-xl">
            {(stage.reveal || stage.expectedAnswer) && (
              <div className="text-green-700 font-semibold">
                <BidiText text={stage.reveal || stage.expectedAnswer || ''} />
              </div>
            )}
            {stage.teaching && (
              <p className="text-slate-800">
                <span className="font-semibold text-slate-900">Teaching note: </span>
                <BidiText text={stage.teaching} />
              </p>
            )}
            {stage.trap && <p className="text-rose-700 text-sm">Trap to avoid: <BidiText text={stage.trap} /></p>}
            {stage.surprise && <p className="text-indigo-700 text-sm">Twist: <BidiText text={stage.surprise} /></p>}
          </div>
        )}
      </div>

      <div className="mt-3 p-4 bg-slate-900 text-slate-100 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-cyan-200 font-semibold">Model feedback log</div>
          <p className="text-sm text-slate-100">
            {feedback ? <BidiText text={feedback} /> : 'No rationale revealed yet — ask for hints or reveal after answering.'}
          </p>
        </div>
        <div className="text-xs text-slate-300">
          Rationale unlocks after a checkpoint answer to encourage stage-by-stage learning.
        </div>
      </div>
    </div>
  );
};