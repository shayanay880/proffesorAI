import React from 'react';
import { ROBUST_LTR_REGEX } from '../utils/bidi';

interface BidiTextProps {
  text: string;
  className?: string;
}

export const BidiText: React.FC<BidiTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  const parts = text.split(ROBUST_LTR_REGEX);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        // If part matches English/Latin words (and isn't just pure punctuation), isolate it
        // Updated regex check to allow parts starting with * or " or ' or \ or < or >
        if (part.match(/^[A-Za-z0-9\u00C0-\u00FF\(\[\{\<\>"'\*\\\/]/) && /[A-Za-z0-9]/.test(part)) {
          return (
            <bdi key={i} dir="ltr" className="bdi-isolate">
              {part}
            </bdi>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
};