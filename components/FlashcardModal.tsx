import React, { useState } from 'react';
import { generateFlashcardsJSON } from '../services/geminiService';
import { Flashcard } from '../types';

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceText: string;
  onSave: (cards: Flashcard[]) => void;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({ isOpen, onClose, sourceText, onSave }) => {
  const [count, setCount] = useState(5);
  const [style, setStyle] = useState<'basic' | 'cloze'>('basic');
  const [language, setLanguage] = useState<'English' | 'Persian'>('English');
  const [isLoading, setIsLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setFlashcards([]);
    try {
      const cards = await generateFlashcardsJSON(sourceText, count, style, language);
      setFlashcards(cards);
      onSave(cards);
    } catch (err: any) {
      setError(err.message || 'Failed to generate flashcards');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (flashcards.length === 0) return;

    // Header: Front, Back, Tags
    let csvContent = "data:text/csv;charset=utf-8,Front,Back,Tags\n";
    
    flashcards.forEach(card => {
      // Escape quotes for CSV
      const q = (t: string) => `"${t.replace(/"/g, '""')}"`;
      
      const front = card.question;
      const back = card.answer;
      const tags = card.tags.join(' ');

      csvContent += `${q(front)},${q(back)},${q(tags)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `medref_flashcards_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚡</span>
            <h2 className="text-xl font-bold text-gray-800">Flashcard Generator</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {flashcards.length === 0 ? (
            <div className="space-y-4">
               <p className="text-gray-600">Generate flashcards from the latest AI response to review in Anki.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Count</label>
                    <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full border rounded-md p-2">
                        <option value={5}>5 Cards</option>
                        <option value={10}>10 Cards</option>
                        <option value={15}>15 Cards</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                    <select value={style} onChange={(e) => setStyle(e.target.value as any)} className="w-full border rounded-md p-2">
                        <option value="basic">Basic Q&A</option>
                        <option value="cloze">Cloze Deletion</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value as any)} className="w-full border rounded-md p-2">
                        <option value="English">English</option>
                        <option value="Persian">Persian</option>
                    </select>
                 </div>
               </div>

               {error && (
                   <div className="bg-red-50 text-red-700 p-3 rounded-md border border-red-200 text-sm">
                       Error: {error}
                   </div>
               )}
            </div>
          ) : (
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-700">{flashcards.length} Cards Generated</h3>
                </div>
                <div className="space-y-3">
                    {flashcards.map((card, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                            <div className="mb-1"><span className="font-semibold text-blue-700">Q:</span> {card.question}</div>
                            <div className="text-gray-700"><span className="font-semibold text-green-700">A:</span> {card.answer}</div>
                            {card.tags.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {card.tags.map(t => <span key={t} className="text-xs bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">#{t}</span>)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          {flashcards.length === 0 ? (
              <button 
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700 transition flex items-center disabled:opacity-50"
              >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                    </>
                ) : 'Generate Cards'}
              </button>
          ) : (
            <>
                <button 
                    onClick={() => setFlashcards([])}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                    Back
                </button>
                <button 
                    onClick={handleDownloadCSV}
                    className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-white hover:bg-green-700 transition font-semibold"
                >
                    Download CSV (Anki)
                </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};