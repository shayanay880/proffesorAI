import React from 'react';
import { Reference } from '../types';

interface EvidenceLevelProps {
  references: Reference[];
}

export const EvidenceLevel: React.FC<EvidenceLevelProps> = ({ references }) => {
  const count = references.length;
  let level: 'strong' | 'grounded' | 'ungrounded';
  let text: string;
  let Icon: React.FC<{ className?: string }>;

  if (count > 1) {
    level = 'strong';
    text = 'Strong Evidence Base';
    Icon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
  } else if (count === 1) {
    level = 'grounded';
    text = 'Clinical Correlation Found';
    Icon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  } else {
    level = 'ungrounded';
    text = 'Generative AI Baseline';
    Icon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.691.346a6 6 0 01-3.86.517l-2.388-.477a2 2 0 00-1.022.547l-1.162 1.163a2 2 0 00.597 3.301l1.565.521a2 2 0 001.216 0l1.565-.521a2 2 0 011.216 0l1.565.521a2 2 0 001.216 0l1.565-.521a2 2 0 00.597-3.301l-1.162-1.163z" /></svg>;
  }

  const styles = {
    strong: 'text-emerald-700 bg-emerald-50 border-emerald-100 ring-emerald-500/20',
    grounded: 'text-cyan-700 bg-cyan-50 border-cyan-100 ring-cyan-500/20',
    ungrounded: 'text-slate-500 bg-slate-50 border-slate-200 ring-slate-400/10',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 mb-3 rounded-xl border ring-2 text-[10px] font-black uppercase tracking-widest ${styles[level]}`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{text}</span>
    </div>
  );
};