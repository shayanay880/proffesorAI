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
    text = 'Strong Evidence (Multiple Sources)';
    Icon = ({ className }) => (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  } else if (count === 1) {
    level = 'grounded';
    text = 'Grounded (Single Source)';
    Icon = ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
        </svg>
    );
  } else {
    level = 'ungrounded';
    text = 'Ungrounded (AI Generated)';
    Icon = ({ className }) => (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  }

  const colors = {
    strong: 'text-green-700 bg-green-50 border-green-200',
    grounded: 'text-blue-700 bg-blue-50 border-blue-200',
    ungrounded: 'text-gray-600 bg-gray-50 border-gray-200',
  };

  const iconColors = {
      strong: 'text-green-500',
      grounded: 'text-blue-500',
      ungrounded: 'text-gray-400'
  }

  return (
    <div className={`flex items-center text-xs font-semibold px-2.5 py-1.5 mb-3 rounded-md border ${colors[level]}`}>
      <Icon className={`h-4 w-4 mr-1.5 ${iconColors[level]}`} />
      <span>{text}</span>
    </div>
  );
};
