import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import { References } from './References';
import { EvidenceLevel } from './EvidenceLevel';
import { getTextDir, getLangFromDir } from '../utils/bidi';

interface ChatMessageProps {
  message: Message;
}

const renderMixedText = (text: string) => {
    // Regex matches runs of Latin alphanumeric characters + common medical symbols.
    const strictLatinRegex = /([A-Za-z0-9\u00C0-\u00FF\+\-\=\%\/\.\(\)]+)/g;
    
    const parts = text.split(strictLatinRegex);
    return parts.map((part, i) => {
        // Only wrap if it actually contains a letter/number to avoid wrapping isolated punctuation
        if (part.match(/^[A-Za-z0-9\u00C0-\u00FF\+\-\=\%\/\.\(\)]+$/) && /[A-Za-z0-9]/.test(part)) {
             return <bdi key={i} dir="ltr" className="bdi-isolate">{part}</bdi>;
        }
        return part;
    });
};

const renderInlineFormatting = (text: string) => {
    const formattingRegex = /(\$\$[\s\S]*?\$\$|\$.*?\$|```[\s\S]*?```|`[^`]+`|<span class="hl-(?:red|yellow|blue)">.*?<\/span>|\[\[.*?\]\]|\*\*.*?\*\*|\+\+.*?\+\+|==.*?==|\!\!.*?\!\!|\?\?.*?\?\?|~~.*?~~|(?:https?:\/\/|www\.)[\w\-\._~:/?#[\]@!$&'()*+,;=]+)/g;
    
    const parts = text.split(formattingRegex);

    return parts.filter(part => part).map((part, i) => {
        // Math Display
        if (part.startsWith('$$') && part.endsWith('$$')) {
            const latex = part.slice(2, -2);
            return <span key={i} dir="ltr" className="math-display ltr bdi-isolate" data-latex={latex}>{latex}</span>;
        }
        // Math Inline
        if (part.startsWith('$') && part.endsWith('$')) {
            const latex = part.slice(1, -1);
            return <span key={i} dir="ltr" className="math-inline ltr bdi-isolate" data-latex={latex}>{latex}</span>;
        }
        // Code Block
        if (part.startsWith('```') && part.endsWith('```')) {
            const content = part.replace(/^```[a-z]*\n?|```$/g, '');
            return (
                <span key={i} dir="ltr" className="block w-full bg-gray-900 text-gray-100 p-3 my-2 rounded-lg overflow-x-auto font-mono text-sm ltr bdi-isolate whitespace-pre">
                    {content}
                </span>
            );
        }
        // Inline Code
        if (part.startsWith('`') && part.endsWith('`')) {
            return (
                <code key={i} dir="ltr" className="ltr bdi-isolate bg-gray-100 rounded px-1.5 py-0.5 font-mono text-sm text-pink-600 break-words">
                    {part.slice(1, -1)}
                </code>
            );
        }
        // Persona Highlighting
        if (part.startsWith('<span class="hl-red">')) {
             const content = part.replace(/<span class="hl-red">|<\/span>/g, '');
             return <span key={i} className="bg-red-100 text-red-800 border-b-2 border-red-300 px-1 rounded font-medium">{renderMixedText(content)}</span>;
        }
        if (part.startsWith('<span class="hl-yellow">')) {
             const content = part.replace(/<span class="hl-yellow">|<\/span>/g, '');
             return <span key={i} className="bg-yellow-100 text-yellow-800 border-b-2 border-yellow-300 px-1 rounded font-medium">{renderMixedText(content)}</span>;
        }
        if (part.startsWith('<span class="hl-blue">')) {
             const content = part.replace(/<span class="hl-blue">|<\/span>/g, '');
             return <span key={i} className="bg-blue-100 text-blue-800 border-b-2 border-blue-300 px-1 rounded font-medium">{renderMixedText(content)}</span>;
        }
        // Wiki Links
        if (part.startsWith('[[') && part.endsWith(']]')) {
            const term = part.slice(2, -2);
            const searchUrl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(term)}`;
            return (
                <a 
                    key={i} 
                    href={searchUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 font-medium border-b border-blue-300 border-dotted hover:border-solid hover:bg-blue-50 transition-all"
                    title={`Search for "${term}" on Wikipedia`}
                >
                    <bdi>{term}</bdi>
                </a>
            );
        }
        // Bold
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-semibold text-gray-900">{renderMixedText(part.slice(2, -2))}</strong>;
        }
        // Highlight (Legacy)
        if ((part.startsWith('++') && part.endsWith('++')) || (part.startsWith('==') && part.endsWith('=='))) {
            return <mark key={i} className="bg-yellow-100 text-yellow-900 px-1.5 py-0.5 rounded-md border border-yellow-200">{renderMixedText(part.slice(2, -2))}</mark>;
        }
        // Danger Badge
        if (part.startsWith('!!') && part.endsWith('!!')) {
            return (
                <mark key={i} className="bg-red-100 text-red-900 px-2 py-1 rounded-md border border-red-200 inline-flex items-center space-x-1.5">
                    <span>{renderMixedText(part.slice(2, -2))}</span>
                </mark>
            );
        }
        // Info Badge
        if (part.startsWith('??') && part.endsWith('??')) {
             return (
                <mark key={i} className="bg-blue-100 text-blue-900 px-2 py-1 rounded-md border border-blue-200 inline-flex items-center space-x-1.5">
                    <span>{renderMixedText(part.slice(2, -2))}</span>
                </mark>
            );
        }
        // Strikethrough
        if (part.startsWith('~~') && part.endsWith('~~')) {
            return <del key={i} className="text-gray-500">{renderMixedText(part.slice(2, -2))}</del>;
        }
        // Auto-link URLs
        if (part.match(/^(?:https?:\/\/|www\.)/)) {
            const href = part.startsWith('www.') ? `https://${part}` : part;
            return (
                <a 
                    key={i} 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    dir="ltr"
                    className="ltr bdi-isolate text-blue-600 hover:underline"
                >
                    {part}
                </a>
            );
        }

        return renderMixedText(part);
    });
};

const parseAndRenderText = (text: string) => {
  // Normalize line breaks and split into logical blocks
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/);

  const content = blocks.map((block, index) => {
    const trimmedBlock = block.trim();
    const lines = trimmedBlock.split('\n').map(l => l.trim()).filter(Boolean);

    // Handle Confidence Score
    if (trimmedBlock.startsWith('**Confidence:**') || trimmedBlock.startsWith('Confidence:')) {
        const scoreText = trimmedBlock.replace(/^\*\*Confidence:\*\*|^Confidence:/, '').trim();
        const isHigh = scoreText.toLowerCase().includes('high');
        const isLow = scoreText.toLowerCase().includes('low');
        const borderColor = isHigh ? 'border-green-300' : isLow ? 'border-orange-300' : 'border-gray-300';
        const bgColor = isHigh ? 'bg-green-50' : isLow ? 'bg-orange-50' : 'bg-gray-50';
        const icon = isHigh ? '✅' : isLow ? '⚠️' : '⚖️';

        return (
            <div key={index} className={`my-3 p-2 rounded-lg border ${borderColor} ${bgColor} flex items-center text-sm text-gray-700`}>
                <span className="mr-2 text-base">{icon}</span>
                <div>
                    <span className="font-bold text-gray-900">Confidence:</span> {renderInlineFormatting(scoreText)}
                </div>
            </div>
        );
    }

    // Handle Safety Alerts
    if (trimmedBlock.startsWith('⚠️') || trimmedBlock.startsWith('⛔') || trimmedBlock.startsWith('!!') || trimmedBlock.startsWith('🚨') || trimmedBlock.startsWith('🚫')) {
        const cleanText = trimmedBlock.replace(/^(⚠️|⛔|!!|🚨|🚫)\s*/, '');
        const isContraindication = trimmedBlock.startsWith('🚫');
        const isEmergency = trimmedBlock.startsWith('🚨');
        
        let containerClass = "my-4 p-4 bg-red-50 border-l-4 border-red-600 text-red-900 rounded-r-lg shadow-sm flex items-start";
        let icon = "⚠️";

        if (isContraindication) {
             containerClass = "my-4 p-4 bg-rose-50 border-l-4 border-rose-800 text-rose-900 rounded-r-lg shadow-sm flex items-start";
             icon = "🚫";
        } else if (isEmergency) {
             containerClass = "my-4 p-4 bg-red-100 border-l-4 border-red-600 text-red-900 rounded-r-lg shadow-sm flex items-start animate-pulse-slow";
             icon = "🚨";
        } else if (trimmedBlock.startsWith('⛔')) {
            icon = "⛔";
        } else if (trimmedBlock.startsWith('!!')) {
             icon = "⚠️";
        }

        return (
            <div key={index} className={containerClass}>
                <span className="mr-3 text-2xl flex-shrink-0">{icon}</span>
                <div className="font-medium text-sm md:text-base leading-relaxed bidi-text">
                    {renderInlineFormatting(cleanText)}
                </div>
            </div>
        );
    }
    
    // Handle "Extra" blocks
    if (trimmedBlock.startsWith('[EXTRA]')) {
         const cleanText = trimmedBlock.replace(/^\[EXTRA\]\s*/, '');
         return (
             <div key={index} className="my-2 text-sm leading-relaxed bidi-text">
                 <span className="text-red-700 font-semibold mr-1">➕</span>
                 <span className="text-red-700">{renderInlineFormatting(cleanText)}</span>
             </div>
         )
    }

    // Handle Tables
    if (lines.length > 1 && lines[0].includes('|') && lines[1].includes('-') && lines[1].includes('|')) {
        const headerCells = lines[0].split('|').map(cell => cell.trim()).slice(1, -1);
        const bodyRows = lines.slice(2).map(row => row.split('|').map(cell => cell.trim()).slice(1, -1));

        if (headerCells.length > 0 && bodyRows.every(row => row.length === headerCells.length)) {
            return (
                <div key={index} className="my-4 overflow-x-auto rounded-lg border border-gray-300">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {headerCells.map((header, hIndex) => (
                                    <th key={hIndex} scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-800 bidi-text">
                                        {renderInlineFormatting(header)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {bodyRows.map((row, rIndex) => (
                                <tr key={rIndex} className="hover:bg-gray-50">
                                    {row.map((cell, cIndex) => (
                                        <td key={cIndex} className="px-4 py-3 text-sm text-gray-700 align-top bidi-text">
                                            {renderInlineFormatting(cell)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
    }

    // Handle Headings (H1, H2, H3, H4)
    if (trimmedBlock.startsWith('#### ')) {
      return <h5 key={index} className="text-base font-semibold my-2 text-gray-700 bidi-text">{renderInlineFormatting(trimmedBlock.substring(5))}</h5>;
    }
    if (trimmedBlock.startsWith('### ')) {
      return <h4 key={index} className="text-lg font-semibold my-3 text-gray-800 bidi-text">{renderInlineFormatting(trimmedBlock.substring(4))}</h4>;
    }
    if (trimmedBlock.startsWith('## ')) {
      return <h3 key={index} className="text-xl font-semibold my-4 text-blue-900 bidi-text">{renderInlineFormatting(trimmedBlock.substring(3))}</h3>;
    }
    if (trimmedBlock.startsWith('# ')) {
      return <h2 key={index} className="text-2xl font-bold my-4 text-blue-900 bidi-text border-b border-gray-200 pb-2">{renderInlineFormatting(trimmedBlock.substring(2))}</h2>;
    }
    
    // Handle Bullet Lists
    if (trimmedBlock.startsWith('* ') || trimmedBlock.startsWith('- ')) {
      const listItems = trimmedBlock.split('\n').map(item => item.replace(/^[\*\-]\s*/, '').trim()).filter(Boolean);
      return (
        <ul key={index} className="list-disc pl-6 my-2 space-y-1 text-gray-800">
          {listItems.map((li, liIndex) => <li key={liIndex} className="bidi-text">{renderInlineFormatting(li)}</li>)}
        </ul>
      );
    }
    
    // Handle Numbered Lists
    if (/^\d+[\.\)]\s/.test(trimmedBlock)) {
      const listItems = trimmedBlock.split('\n').map(item => item.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
      return (
        <ol key={index} className="list-decimal pl-6 my-2 space-y-1 text-gray-800">
          {listItems.map((li, liIndex) => <li key={liIndex} className="bidi-text">{renderInlineFormatting(li)}</li>)}
        </ol>
      );
    }
    
    // Handle Paragraphs
    if (trimmedBlock) {
        return <p key={index} className="my-2 text-gray-800 bidi-text">{renderInlineFormatting(trimmedBlock)}</p>;
    }
    
    return null;
  });

  return <>{content}</>;
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const textDir = getTextDir(message.text);
  const textLang = getLangFromDir(textDir);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (message.role === 'assistant' && contentRef.current) {
        // @ts-ignore
        if (typeof katex === 'undefined') return;

        const renderMathInElement = (selector: string, displayMode: boolean) => {
            const elements = contentRef.current!.querySelectorAll(selector);
            elements.forEach(el => {
                const latex = (el as HTMLElement).dataset.latex;
                if (latex) {
                    try {
                        // @ts-ignore
                        katex.render(latex, el as HTMLElement, {
                          throwOnError: false,
                          displayMode: displayMode,
                          output: 'html',
                          strict: false
                        });
                    } catch (e) {
                        console.error('KaTeX rendering error:', e);
                        el.textContent = latex;
                    }
                }
            });
        };

        renderMathInElement('.math-inline', false);
        renderMathInElement('.math-display', true);
    }
  }, [message.text, message.role]);

  return (
    <div className={`flex my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        dir={textDir}
        lang={textLang}
        className={`relative group max-w-3xl p-4 rounded-xl shadow-md ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-white text-gray-800 rounded-bl-none'
        }`}
      >
        {/* Copy Button */}
        {message.role === 'assistant' && (
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                title="Copy to clipboard"
            >
                {copied ? '✓ Copied' : '📋 Copy'}
            </button>
        )}

        {message.role === 'assistant' && <EvidenceLevel references={message.references || []} />}
        <div ref={contentRef} className="leading-relaxed whitespace-pre-wrap bidi-text">
            {message.role === 'assistant' ? parseAndRenderText(message.text) : message.text}
        </div>

        {message.role === 'assistant' && message.references && message.references.length > 0 && (
            <References references={message.references} />
        )}
      </div>
    </div>
  );
};