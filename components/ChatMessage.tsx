import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import { References } from './References';
import { EvidenceLevel } from './EvidenceLevel';
import { getTextDir, getLangFromDir, ROBUST_LTR_REGEX } from '../utils/bidi';

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
}

const renderMixedText = (text: string) => {
    // Split by the robust regex which captures LTR phrases including their parentheses
    const parts = text.split(ROBUST_LTR_REGEX);
    return parts.map((part, i) => {
        // If part matches our LTR definition AND contains at least one Latin char or Number, isolate it.
        // Updated regex check to allow parts starting with * or " or ' or \ or < or >
        if (part.match(/^[A-Za-z0-9\u00C0-\u00FF\(\[\{\<\>"'\*\\\/]/) && /[A-Za-z0-9]/.test(part)) {
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
                <a key={i} href={`https://en.wikipedia.org/wiki/${encodeURIComponent(term)}`} target="_blank" rel="noopener" className="text-cyan-600 font-bold border-b-2 border-cyan-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all rounded px-0.5">
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

const parseAndRenderText = (text: string) => {
  const decodedText = decodeHtmlEntities(text);
  const blocks = decodedText.split(/\n{2,}/);

  return blocks.map((block, index) => {
    const trimmedBlock = block.trim();
    const blockDir = getTextDir(trimmedBlock);
    
    if (trimmedBlock.startsWith('⚠️') || trimmedBlock.startsWith('⛔') || trimmedBlock.startsWith('🚨')) {
        const cleanText = trimmedBlock.replace(/^(⚠️|⛔|🚨)\s*/, '');
        return (
            <div key={index} className="my-6 p-5 bg-rose-50 border-r-4 border-rose-500 rounded-l-2xl shadow-sm flex gap-4 animate-in fade-in slide-in-from-right-2">
                <span className="text-2xl pt-0.5">{trimmedBlock.split(' ')[0]}</span>
                <div className="bidi-text text-rose-900 font-medium leading-relaxed">
                    {renderInlineFormatting(cleanText)}
                </div>
            </div>
        );
    }

    if (trimmedBlock.startsWith('## ')) {
      return <h3 key={index} className="text-xl font-black mt-8 mb-4 text-slate-800 border-r-4 border-cyan-500 pr-4">{renderInlineFormatting(trimmedBlock.substring(3))}</h3>;
    }

    if (trimmedBlock.startsWith('* ') || trimmedBlock.startsWith('- ')) {
      const listItems = trimmedBlock.split('\n').map(item => item.replace(/^[\*\-]\s*/, '').trim());
      return (
        <ul key={index} className="list-none space-y-3 my-4 pr-2">
          {listItems.map((li, liIndex) => (
            <li key={liIndex} className="flex items-start gap-3 group">
                <span className="w-2 h-2 rounded-full bg-cyan-400 mt-2.5 transition-all group-hover:scale-125"></span>
                <span className="bidi-text text-slate-700 flex-1">{renderInlineFormatting(li)}</span>
            </li>
          ))}
        </ul>
      );
    }

    return <p key={index} className="my-4 text-slate-700 bidi-text leading-relaxed tracking-tight">{renderInlineFormatting(trimmedBlock)}</p>;
  });
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const textDir = getTextDir(message.text);
  const textAlignClass = !isUser && textDir === 'rtl' ? 'text-right' : 'text-left';

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

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-start' : 'justify-start flex-col'}`}>
      <div className={`group relative w-full ${isUser ? 'max-w-2xl ml-auto' : 'max-w-4xl'}`}>
        {!isUser && <EvidenceLevel references={message.references || []} />}
        
        <div className={`p-6 rounded-3xl shadow-sm border transition-all duration-300 ${
            isUser 
                ? 'bg-slate-100 border-slate-200 text-slate-800 rounded-tr-none' 
                : 'bg-white border-slate-100 text-slate-800 rounded-tl-none hover:shadow-md'
        }`}>
            {!isUser && (
                <button
                    onClick={handleCopy}
                    className="absolute top-4 left-4 p-2 bg-slate-50 text-slate-400 rounded-xl opacity-0 group-hover:opacity-100 hover:text-cyan-600 transition-all shadow-sm"
                >
                    {copied ? '✓' : '📄'}
                </button>
            )}

            <div ref={contentRef} className={`bidi-text text-[15px] md:text-[16px] ${textAlignClass}`} dir={textDir}>
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