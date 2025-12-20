import React, { useMemo, useState } from 'react';

interface LearningObjectivesSelectorProps {
  selected: string[];
  onChange: (objectives: string[]) => void;
}

const QUICK_OBJECTIVES = [
  'Master pathophysiology and mechanisms',
  'Practice differential diagnosis reasoning',
  'Strengthen treatment and dosing decisions',
  'Focus on red flags and safety steps',
  'Prepare for rapid board-style recall'
];

const DROPDOWN_OBJECTIVES = [
  'Explain concepts in patient-friendly language',
  'Compare and contrast top 3 similar conditions',
  'Reinforce active recall with mnemonics',
  'Identify pitfalls and common misdiagnoses'
];

export const LearningObjectivesSelector: React.FC<LearningObjectivesSelectorProps> = ({
  selected,
  onChange
}) => {
  const [customObjective, setCustomObjective] = useState('');

  const availableDropdown = useMemo(
    () => DROPDOWN_OBJECTIVES.filter(item => !selected.includes(item)),
    [selected]
  );

  const toggleObjective = (objective: string) => {
    const trimmed = objective.trim();
    if (!trimmed) return;
    if (selected.includes(trimmed)) {
      onChange(selected.filter(item => item !== trimmed));
    } else {
      onChange([...selected, trimmed]);
    }
  };

  const handleCustomAdd = () => {
    const clean = customObjective.trim();
    if (!clean || selected.includes(clean)) return;
    onChange([...selected, clean]);
    setCustomObjective('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Learning objectives (optional)</p>
          <p className="text-xs text-slate-500">
            Set goals before starting the chat. Responses and mastery checks will be tailored to these.
          </p>
        </div>
        <span className="text-[10px] uppercase font-bold text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100">
          Guides the prompt
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_OBJECTIVES.map(obj => {
          const active = selected.includes(obj);
          return (
            <button
              key={obj}
              type="button"
              onClick={() => toggleObjective(obj)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                active
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-cyan-200 hover:text-cyan-700'
              }`}
            >
              {obj}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600" htmlFor="objective-select">
            Add from list
          </label>
          <select
            id="objective-select"
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:border-cyan-400 focus:outline-none"
            value=""
            onChange={(e) => {
              const value = e.target.value;
              if (value) toggleObjective(value);
            }}
          >
            <option value="" disabled>
              Choose an objective
            </option>
            {availableDropdown.map(obj => (
              <option key={obj} value={obj}>{obj}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 min-w-[220px] gap-2 items-center">
          <input
            type="text"
            value={customObjective}
            onChange={(e) => setCustomObjective(e.target.value)}
            placeholder="Add a custom objective"
            className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:border-cyan-400 focus:outline-none"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCustomAdd(); } }}
          />
          <button
            type="button"
            onClick={handleCustomAdd}
            className="px-3 py-2 text-sm font-semibold bg-cyan-600 text-white rounded-xl shadow-sm hover:bg-cyan-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {selected.map(obj => (
            <span
              key={obj}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 text-xs font-semibold text-cyan-700 border border-cyan-100"
            >
              {obj}
              <button
                type="button"
                onClick={() => toggleObjective(obj)}
                className="text-cyan-500 hover:text-cyan-700"
                aria-label={`Remove ${obj}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};