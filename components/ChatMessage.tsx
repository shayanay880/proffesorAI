import React, { useRef, useEffect, useState } from 'react';
import { LearnerLevel, Message } from '../types';
import { References } from './References';
import { EvidenceLevel } from './EvidenceLevel';
import { ROBUST_LTR_REGEX } from '../utils/bidi';
import { DifferentialTable, AidItem } from './DifferentialTable';

const decodeHtmlEntities = (input: string) => {
    if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = input;
        return textarea.value;
    }
    return input;
};

interface ChatMessageProps {
  message: Message;
  learnerLevel: LearnerLevel;
}

const LEVEL_BADGES: Record<LearnerLevel, { label: string; classes: string; hint: string }> = {
  MS3: {
    label: 'MS3',
    classes: 'bg-blue-50 text-blue-800 ring-blue-200 border-blue-100',
    hint: 'Explain foundations, define acronyms once, add gentle scaffolding.'
  },
  Resident: {
    label: 'Resident',
    classes: 'bg-amber-50 text-amber-800 ring-amber-200 border-amber-100',
    hint: 'Assume working knowledge; focus on decision-making and pitfalls.'
  },
  Attending: {
    label: 'Attending',
    classes: 'bg-emerald-50 text-emerald-800 ring-emerald-200 border-emerald-100',
    hint: 'Be concise, emphasize nuance, controversies, and latest standards.'
  }
};

const renderMixedText = (text: string) => {
    // Split by the robust regex which captures LTR phrases including their parentheses
    const parts = text.split(ROBUST_LTR_REGEX);
    return parts.map((part, i) => {
        // If part matches the LTR pattern (starts with Latin, number, or opening bracket/paren followed by latin)
        // We use a simplified check here because the split regex guarantees the capture groups are the LTR parts.
        // We just need to filter out empty strings or purely RTL parts if the regex had issues, 
        // but typically the odd indices in split result (if using capturing group) are the matches.
        // However, standard split iteration mixes them. 
        // We'll check if it matches a simplified version of the LTR content signal.
        if (part.match(/[A-Za-z0-9]/) || part.match(/^https?:/)) {
             return <bdi key={i} dir="ltr" className="bdi-isolate bg-slate-50 text-slate-900 rounded px-1">{part}</bdi>;
        }
        return part;
    });
};

const renderInlineFormatting = (text: string) => {
    const formattingRegex = /(\$\$[\s\S]*?\$\$|\$.*?\$|```[\s\S]*?```|`[^`]+`|\[\[.*?\]\]|\*\*.*?\*\*|\+\+.*?\+\+|==.*?==|\!\!.*?\!\!|\?\?.*?\?\?|~~.*?~~|(?:https?:\/\/|www\.)[\w\-\._~:/?#[\]@!$&'()*+,;=]+)/g;
    const parts = text.split(formattingRegex);

    return parts.filter(part => part).map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
            const latex = part.slice(2, -2);
            return <span key={i} dir="ltr" className="math-display ltr bdi-isolate" data-latex={latex}>{latex}</span>;
        }
        if (part.startsWith('$') && part.endsWith('$')) {
            const latex = part.slice(1, -1);
            return <span key={i} dir="ltr" className="math-inline ltr bdi-isolate" data-latex={latex}>{latex}</span>;
        }
        if (part.startsWith('```') && part.endsWith('```')) {
            const content = part.replace(/^```[a-z]*\n?|```$/g, '');
            return (
                <span key={i} dir="ltr" className="block w-full bg-slate-900 text-slate-100 p-4 my-3 rounded-2xl overflow-x-auto font-mono text-sm shadow-inner whitespace-pre">
                    {content}
                </span>
            );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={i} dir="ltr" className="bg-slate-100 text-cyan-700 rounded-md px-1.5 py-0.5 font-mono text-sm">{part.slice(1, -1)}</code>;
        }
        if (part.startsWith('[[') && part.endsWith(']]')) {
            const term = part.slice(2, -2);
            return (
                <a key={i} href={`https://en.wikipedia.org/wiki/${encodeURIComponent(term)}`} target="_blank" rel="noopener noreferrer" className="text-cyan-600 font-bold border-b-2 border-cyan-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all rounded px-0.5">
                    {term}
                </a>
            );
        }
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-extrabold text-slate-900">{renderMixedText(part.slice(2, -2))}</strong>;
        }
        if (part.startsWith('==')) {
            // Yellow Highlight (Numbers/Doses)
            return <mark key={i} className="bg-amber-100 text-amber-900 px-1 rounded-md font-semibold">{renderMixedText(part.slice(2, -2))}</mark>;
        }
        if (part.startsWith('++')) {
             // Cyan Highlight (Pathophys/Key Terms)
            return <mark key={i} className="bg-cyan-100 text-cyan-900 px-1 rounded-md font-semibold">{renderMixedText(part.slice(2, -2))}</mark>;
        }
        if (part.startsWith('!!')) {
             // Red Alert
            return <span key={i} className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full text-xs font-bold ring-1 ring-rose-200">{renderMixedText(part.slice(2, -2))}</span>;
        }
        if (part.startsWith('??')) {
             // Blue Info/Pearl
            return <span key={i} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-bold ring-1 ring-blue-200">{renderMixedText(part.slice(2, -2))}</span>;
        }
        return renderMixedText(part);
    });
};

type TableSectionKey = 'mnemonics' | 'pearls' | 'differentiators';

const SECTION_HEADINGS: { key: TableSectionKey; regex: RegExp }[] = [
  { key: 'mnemonics', regex: /^\s*(?:##?\s*)?(?:memory aid|memory aids|mnemonics?)(?:\s*(?:table)?)?[:\-]?\s*$/i },
  { key: 'pearls', regex: /^\s*(?:##?\s*)?(?:pearls?|clinical pearls?|golden pearls?)(?:[:\-]?\s*)$/i },
  { key: 'differentiators', regex: /^\s*(?:##?\s*)?(?:differentials?|differentiators?|differential diagnosis)(?:[:\-]?\s*)$/i },
];

const INLINE_SECTION_PATTERNS: { key: TableSectionKey; regex: RegExp }[] = [
  { key: 'mnemonics', regex: /^\s*(?:\[(?:memory aid|mnemonics?)\]|memory aids?:)\s*/i },
  { key: 'pearls', regex: /^\s*(?:\[(?:pearls?)\]|pearls?:)\s*/i },
  { key: 'differentiators', regex: /^\s*(?:\[(?:differentials?|differentiators?)\]|differentials?:)\s*/i },
];

const BULLET_PATTERN = /^\s*(?:[-*•]|[0-9]+\.)\s+(.*)$/;

const mapSeverity = (value: string): AidItem['severity'] => {
  const normalized = value.toLowerCase();
  if (['critical', 'emergent', 'must', 'red', 'urgent'].some((k) => normalized.includes(k))) return 'critical';
  if (['high', 'priority', 'important', 'warning'].some((k) => normalized.includes(k))) return 'high';
  if (['moderate', 'medium'].some((k) => normalized.includes(k))) return 'moderate';
  if (['low', 'minor', 'nice'].some((k) => normalized.includes(k))) return 'low';
  if (['pearl', 'tip', 'info'].some((k) => normalized.includes(k))) return 'info';
  return undefined;
};

const parseSeverityFromText = (text: string): { severity?: AidItem['severity']; cleaned: string } => {
  let cleaned = text.trim();
  let severity: AidItem['severity'] | undefined;

  const bracketMatch = cleaned.match(/\[(?:priority|severity|level)?\s*[:\-]?\s*(critical|high|urgent|priority|moderate|medium|low|info|tip|pearl)\]/i);
  if (bracketMatch) {
    severity = mapSeverity(bracketMatch[1]);
    cleaned = cleaned.replace(bracketMatch[0], '').trim();
  }

  if (!severity) {
    if (/🚨|⛔|‼️|!!/.test(cleaned)) severity = 'critical';
    else if (/⚠️|🔶|🟠/.test(cleaned)) severity = 'high';
    else if (/ℹ️|💡|✅|⭐/.test(cleaned)) severity = 'info';
  }

  cleaned = cleaned.replace(/^[🚨⚠️⛔‼️🔶🟠💡⭐✅\s]+/, '').trim();

  return { severity, cleaned };
};

const splitInlineItems = (content: string) =>
  content
    .split(/\s*(?:\||;|•)\s*/g)
    .map((item) => item.trim())
    .filter(Boolean);

const extractMemoryAidTable = (
  rawText: string
): { cleanedText: string; table?: Record<TableSectionKey, AidItem[]>; insertIndex?: number } => {
  const lines = rawText.split('\n');
  const keptLines = [...lines];
  const collected: Record<TableSectionKey, AidItem[]> = {
    mnemonics: [],
    pearls: [],
    differentiators: [],
  };

  let activeSection: TableSectionKey | null = null;
  let firstHitOffset: number | null = null;
  let cursor = 0;

  const addItem = (key: TableSectionKey, content: string) => {
    const { severity, cleaned } = parseSeverityFromText(content);
    if (!cleaned) return;
    collected[key].push({ text: cleaned, severity: severity ?? 'info' });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const lineStart = cursor;
    cursor += line.length + 1;

    const headingMatch = SECTION_HEADINGS.find((section) => section.regex.test(trimmed));
    if (headingMatch) {
      activeSection = headingMatch.key;
      keptLines[idx] = '';
      if (firstHitOffset === null) firstHitOffset = lineStart;
      return;
    }

    const inlineMatch = INLINE_SECTION_PATTERNS.find((section) => section.regex.test(trimmed));
    if (inlineMatch) {
      const payload = trimmed.replace(inlineMatch.regex, '').trim();
      splitInlineItems(payload).forEach((item) => addItem(inlineMatch.key, item));
      keptLines[idx] = '';
      if (firstHitOffset === null) firstHitOffset = lineStart;
      return;
    }

    if (activeSection) {
      if (!trimmed) {
        activeSection = null;
        return;
      }

      const bulletMatch = trimmed.match(BULLET_PATTERN);
      if (bulletMatch) {
        addItem(activeSection, bulletMatch[1]);
        keptLines[idx] = '';
        return;
      }

      if (trimmed.includes('|')) {
        splitInlineItems(trimmed).forEach((item) => addItem(activeSection, item));
        keptLines[idx] = '';
        return;
      }
    }
  });

  const hasContent = Object.values(collected).some((arr) => arr.length > 0);
  if (!hasContent) return { cleanedText: rawText };

  const insertIndex =
    firstHitOffset !== null ? Math.max(0, rawText.slice(0, firstHitOffset).split(/\n{2,}/).length - 1) : undefined;

  return {
    cleanedText: keptLines.join('\n'),
    table: collected,
    insertIndex,
  };
};

const parseAndRenderText = (text: string) => {
  const decodedText = decodeHtmlEntities(text);
  const { cleanedText, table, insertIndex } = extractMemoryAidTable(decodedText);
  const blocks = cleanedText.split(/\n{2,}/);

  const renderedBlocks = blocks.map((block, index) => {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) return null;
    
    if (trimmedBlock.startsWith('⚠️') || trimmedBlock.startsWith('⛔') || trimmedBlock.startsWith('🚨')) {
        const cleanText = trimmedBlock.replace(/^(⚠️|⛔|🚨)\s*/, '');
        return (
            <div key={index} className="my-6 p-5 bg-rose-50 border-r-4 border-rose-500 rounded-l-2xl shadow-sm flex gap-4 animate-in fade-in slide-in-from-right-2" dir="auto">
                <span className="text-2xl pt-0.5">{trimmedBlock.split(' ')[0]}</span>
                <div className="bidi-text text-rose-900 font-medium leading-relaxed" dir="auto">
                    {renderInlineFormatting(cleanText)}
                </div>
            </div>
        );
    }

    if (trimmedBlock.startsWith('## ')) {
      return <h3 key={index} className="text-xl font-black mt-8 mb-4 text-slate-800 border-r-4 border-cyan-500 pr-4" dir="auto">{renderInlineFormatting(trimmedBlock.substring(3))}</h3>;
    }

    if (trimmedBlock.startsWith('* ') || trimmedBlock.startsWith('- ')) {
      const listItems = trimmedBlock.split('\n').map(item => item.replace(/^[\*\-]\s*/, '').trim());
      return (
        <ul key={index} className="list-none space-y-3 my-4 pr-2" dir="auto">
          {listItems.map((li, liIndex) => (
            <li key={liIndex} className="flex items-start gap-3 group">
                <span className="w-2 h-2 rounded-full bg-cyan-400 mt-2.5 transition-all group-hover:scale-125 shrink-0"></span>
                <span className="bidi-text text-slate-700 flex-1">{renderInlineFormatting(li)}</span>
            </li>
          ))}
        </ul>
      );
    }

    return <p key={index} className="my-4 text-slate-700 bidi-text leading-relaxed tracking-tight" dir="auto">{renderInlineFormatting(trimmedBlock)}</p>;
  }).filter(Boolean) as React.ReactElement[];

  if (table && (table.mnemonics.length || table.pearls.length || table.differentiators.length)) {
    const insertionPoint = insertIndex !== undefined ? Math.min(Math.max(insertIndex, 0), renderedBlocks.length) : renderedBlocks.length;
    renderedBlocks.splice(
      insertionPoint,
      0,
      <DifferentialTable
        key="memory-aid-table"
        mnemonics={table.mnemonics}
        pearls={table.pearls}
        differentiators={table.differentiators}
      />
    );
  }

  return renderedBlocks;
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, learnerLevel }) => {
  const isUser = message.role === 'user';
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const levelBadge = LEVEL_BADGES[learnerLevel];

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (message.role === 'assistant' && contentRef.current && (window as any).katex) {
        contentRef.current.querySelectorAll('[data-latex]').forEach((el: any) => {
            try {
                (window as any).katex.render(el.dataset.latex, el, {
                    throwOnError: false,
                    displayMode: el.classList.contains('math-display')
                });
            } catch (e) {}
        });
    }
  }, [message.text, message.role]);

  // Use auto direction for the bubble content
  const alignmentClass = isUser ? 'max-w-2xl ml-auto' : 'max-w-4xl';

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-start' : 'justify-start flex-col'}`}>
      <div className={`group relative w-full ${alignmentClass}`}>
        {!isUser && <EvidenceLevel references={message.references || []} />}
        
        <div className={`p-6 rounded-3xl shadow-sm border transition-all duration-300 relative ${
            isUser 
                ? 'bg-slate-100 border-slate-200 text-slate-800 rounded-tr-none' 
                : 'bg-white border-slate-100 text-slate-800 rounded-tl-none hover:shadow-md'
        }`} dir="auto">
            {!isUser && (
                <button
                    onClick={handleCopy}
                    className="absolute top-4 left-4 p-2 bg-slate-50 text-slate-400 rounded-xl opacity-0 group-hover:opacity-100 hover:text-cyan-600 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500 z-10"
                    aria-label="Copy assistant response"
                >
                    {copied ? '✓' : '📄'}
                </button>
            )}

            {!isUser && levelBadge && (
              <div className="absolute top-4 right-4 flex items-center gap-2 text-xs font-bold z-10">
                <div className={`px-3 py-1 rounded-full border ring-1 shadow-sm ${levelBadge.classes}`} title={levelBadge.hint}>
                  Learner: {levelBadge.label}
                </div>
              </div>
            )}

            <div ref={contentRef} className="bidi-text text-[15px] md:text-[16px] text-start" dir="auto">
                {message.role === 'assistant' ? parseAndRenderText(message.text) : message.text}
            </div>

            {!isUser && message.references && message.references.length > 0 && (
                <References references={message.references} />
            )}
        </div>
      </div>
    </div>
  );
};
