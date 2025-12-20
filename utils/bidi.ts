export type TextDir = 'rtl' | 'ltr';
export type TextLang = 'fa' | 'en';

export const getTextDir = (text: string): TextDir => {
  if (!text) return 'ltr';
  
  // Arabic/Persian unicode ranges
  // 0600-06FF: Arabic
  // 0750-077F: Arabic Supplement
  // 08A0-08FF: Arabic Extended-A
  // FB50-FDFF: Arabic Presentation Forms-A
  // FE70-FEFF: Arabic Presentation Forms-B
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
  const latinPattern = /[a-zA-Z]/g;

  const arabicMatches = text.match(arabicPattern);
  const latinMatches = text.match(latinPattern);

  const arabicCount = arabicMatches ? arabicMatches.length : 0;
  const latinCount = latinMatches ? latinMatches.length : 0;

  // Heuristic: If there is Arabic script and it's equal or more frequent than Latin, use RTL.
  return (arabicCount > 0 && arabicCount >= latinCount) ? 'rtl' : 'ltr';
};

export const getLangFromDir = (dir: TextDir): TextLang => {
  return dir === 'rtl' ? 'fa' : 'en';
};

/**
 * Regex to identify LTR (Latin/Number) runs.
 * 
 * CRITICAL BIDI LOGIC:
 * We explicitly EXCLUDE leading/trailing parentheses from the LTR capture group.
 * In mixed text like "(در بیمار stable)", capturing "stable)" as LTR causes the closing parenthesis
 * to render to the RIGHT of "stable" (LTR logic), but in an RTL sentence, the visual closing paren
 * should be on the LEFT. By leaving the parenthesis outside the LTR bdi-isolate, we let the
 * browser's BiDi algorithm handle it as a neutral character in the base RTL context.
 * 
 * However, we DO include parentheses that are *inside* the LTR block (e.g. "NSTEMI (Type 1)")
 * to keep atomic English phrases together.
 * 
 * Prefix: Markdown symbols, quotes, etc. (No open paren)
 * Body: Latin, Numbers, Symbols
 * Separator+Body: Allow internal punctuation/parens if followed by more Latin
 * Suffix: Markdown symbols, quotes, etc. (No close paren)
 */
export const ROBUST_LTR_REGEX = /((?:[\<\>"'\*\u2018\u201C\\]\s*)?[A-Za-z0-9\u00C0-\u00FF\+\-\=\%\/\.\:\_\*\?!\u2018\u2019\u201C\u201D,\\\>\<]+(?:[\s\(\)\[\]\.,\-\/\*\?!:;"'\\\>\<]+[A-Za-z0-9\u00C0-\u00FF\+\-\=\%\/\.\:\_\*\?!\u2018\u2019\u201C\u201D,\\\>\<]+)*(?:\s*[\>"'\*\u2019\u201D\?!])?)/g;