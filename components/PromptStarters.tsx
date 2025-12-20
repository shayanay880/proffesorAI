import React from 'react';

interface PromptStartersProps {
  onSelectPrompt: (prompt: string) => void;
}

const starterPrompts = [
  {
    title: 'آموزش مبحث (Topic)',
    prompt: 'لطفاً پاتوفیزیولوژی، علائم بالینی و درمان این مبحث را با جزئیات توضیح دهید: ',
    icon: '👨‍🏫',
  },
  {
    title: 'الگوریتم بالینی (Algorithm)',
    prompt: 'الگوریتم برخورد قدم‌به‌قدم با بیمار با شکایت: ',
    icon: '🩺',
  },
  {
    title: 'مرور دارویی (Drug Review)',
    prompt: 'فارماکولوژی، دوزاژ و موارد منع مصرف داروی: ',
    icon: '💊',
  },
  {
    title: 'تشخیص افتراقی (DDx)',
    prompt: 'تشخیص‌های افتراقی و موارد "Must-Not-Miss" برای: ',
    icon: '🔍',
  },
];

export const PromptStarters: React.FC<PromptStartersProps> = ({ onSelectPrompt }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      {/* Updated to show a fish picture at load as requested */}
      <div className="mb-6 transform hover:scale-110 transition-transform duration-300">
        <span className="text-9xl filter drop-shadow-xl" role="img" aria-label="Medical Fish">🐠</span>
      </div>
      <h1 className="text-3xl font-bold text-gray-800">Medical Professor AI</h1>
      <p className="mt-2 text-gray-500 max-w-md" dir="rtl">
        دستیار هوشمند آموزشی و بالینی برای پزشکان و دانشجویان پزشکی. یک مبحث را انتخاب کنید تا شروع کنیم.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full max-w-2xl">
        {starterPrompts.map((item) => (
          <button
            key={item.title}
            onClick={() => onSelectPrompt(item.prompt)}
            className="bg-white p-4 border border-gray-200 rounded-lg text-right hover:bg-gray-50 hover:shadow-md transition-all duration-200 group flex flex-col items-end"
          >
            <div className="flex items-center justify-between mb-2 w-full flex-row-reverse">
                <div className="text-2xl group-hover:scale-110 transition-transform duration-200">{item.icon}</div>
            </div>
            <h3 className="font-semibold text-gray-800">{item.title}</h3>
            <p className="text-sm text-gray-500 truncate w-full text-right" dir="rtl">{item.prompt}...</p>
          </button>
        ))}
      </div>
    </div>
  );
};