export type TextDir = 'ltr' | 'rtl';
export type TextLang = 'fa' | 'en';

export const detectTextDirection = (text: string): TextDir => {
  if (!text) return 'ltr';
  // Arabic/Persian Unicode ranges
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
  const latinPattern = /[A-Za-z]/g;

  const arabicMatches = text.match(arabicPattern);
  const latinMatches = text.match(latinPattern);

  const arabicCount = arabicMatches ? arabicMatches.length : 0;
  const latinCount = latinMatches ? latinMatches.length : 0;

  return (arabicCount > 0 && arabicCount >= latinCount) ? 'rtl' : 'ltr';
};

export const getTextDir = (text: string): TextDir => {
  return detectTextDirection(text);
};

export const getLangFromDir = (dir: TextDir): TextLang => {
  return dir === 'rtl' ? 'fa' : 'en';
};

/**
 * Match LTR “runs” inside mixed RTL/LTR text so we can wrap them in <bdi dir="ltr">…</bdi>.
 * Includes surrounding parentheses/brackets when they contain Latin, preventing visual flipping.
 * Matches:
 * 1. Parentheses/Brackets with English content: (Start...) or [Start...]
 * 2. URLs
 * 3. English words/phrases
 * 4. Medical units/dosages with numbers
 */
export const ROBUST_LTR_REGEX =
  /(\([^\)\u0600-\u06FF]*[A-Za-z0-9][^\)\u0600-\u06FF]*\)|\[[^\]\u0600-\u06FF]*[A-Za-z0-9][^\]\u0600-\u06FF]*\]|https?:\/\/[^\s]+|www\.[^\s]+|[A-Za-z][A-Za-z0-9]*(?:[A-Za-z0-9\-_.:/%+@#&=]*[A-Za-z0-9])?|\b\d+(?:\.\d+)?\s*(?:mg\/dL|mmHg|bpm|mg|g|mcg|µg|mL|L|IU|U|%)\b)/g;
