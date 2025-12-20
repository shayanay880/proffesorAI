import React from 'react';
import { BidiText } from './BidiText';

export type AidSeverity = 'critical' | 'high' | 'moderate' | 'low' | 'info';

export interface AidItem {
  text: string;
  severity?: AidSeverity;
}

export interface DifferentialTableProps {
  mnemonics: AidItem[];
  pearls: AidItem[];
  differentiators: AidItem[];
  title?: string;
}

const severityCopy: Record<AidSeverity, { label: string; className: string }> = {
  critical: {
    label: 'Critical',
    className: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200',
  },
  high: {
    label: 'High',
    className: 'bg-amber-100 text-amber-900 ring-1 ring-amber-200',
  },
  moderate: {
    label: 'Moderate',
    className: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
  },
  low: {
    label: 'Low',
    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  },
  info: {
    label: 'Info',
    className: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  },
};

const columnMeta = [
  { key: 'mnemonics', label: 'Mnemonics / Anchors', icon: '🧠' },
  { key: 'pearls', label: 'Pearls & Pitfalls', icon: '💡' },
  { key: 'differentiators', label: 'Differentiators', icon: '🩺' },
] as const;

const renderBadge = (severity?: AidSeverity) => {
  if (!severity) return null;

  const meta = severityCopy[severity];
  return (
    <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.className}`}>
      <span className="text-[10px]">●</span>
      {meta.label}
    </span>
  );
};

const renderCell = (item?: AidItem) => {
  if (!item) {
    return <span className="text-xs italic text-slate-400">—</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      {renderBadge(item.severity)}
      <span className="text-sm leading-relaxed text-slate-800">
        <BidiText text={item.text} />
      </span>
    </div>
  );
};

export const DifferentialTable: React.FC<DifferentialTableProps> = ({
  mnemonics,
  pearls,
  differentiators,
  title = 'Memory Aid & Differential',
}) => {
  const rows = Math.max(mnemonics.length, pearls.length, differentiators.length);
  if (rows === 0) return null;

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-cyan-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-lg shadow-inner shadow-cyan-200/60 ring-4 ring-white">
            🧭
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Memory Aid</p>
            <p className="text-base font-semibold text-slate-800 leading-tight">{title}</p>
            <p className="text-xs text-slate-500">Mnemonics, pearls, and differentiators at a glance.</p>
          </div>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-700 ring-1 ring-cyan-200 shadow-sm">
          Table View
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left">
          <thead className="bg-white text-xs uppercase tracking-wider text-slate-500">
            <tr>
              {columnMeta.map((col) => (
                <th key={col.key} className="px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="text-lg">{col.icon}</span>
                    <span className="font-semibold text-slate-700">{col.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {Array.from({ length: rows }).map((_, idx) => (
              <tr key={idx} className="odd:bg-slate-50/60">
                <td className="p-4 align-top">{renderCell(mnemonics[idx])}</td>
                <td className="p-4 align-top">{renderCell(pearls[idx])}</td>
                <td className="p-4 align-top">{renderCell(differentiators[idx])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Alias export in case other callers expect the "MemoryAid" name.
export const MemoryAid: React.FC<DifferentialTableProps> = (props) => <DifferentialTable {...props} />;