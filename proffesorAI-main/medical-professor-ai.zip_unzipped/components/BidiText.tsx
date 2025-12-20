import React from 'react';

interface BidiTextProps {
  text: string;
  className?: string;
}

export const BidiText: React.FC<BidiTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split by runs of Latin/Number characters that typically cause RTL issues.
  // We want to wrap English words, numbers, and adjacent punctuation that belongs to English.
  // Regex: matches [English letters, numbers, standard punctuation]+
  const latinRegex = /([A-Za-z0-9\u00C0-\u00FF\+\-\=\%\/\.\(\)\:\[\]]+)/g;

  const parts = text.split(latinRegex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        // Check if the part actually contains Latin/Numbers to warrant wrapping
        if (part.match(/[A-Za-z0-9]/)) {
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