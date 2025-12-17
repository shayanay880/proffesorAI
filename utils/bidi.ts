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