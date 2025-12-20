export type QuickAction = {
  label: string;
  prompt?: string;
  type?: 'prompt' | 'case-generator';
};

export const QUICK_ACTIONS: QuickAction[] = [
  // Study Actions
  {
    label: '🔄 ساده‌تر',
    prompt: 'این توضیح را ساده‌تر و خلاصه‌تر بازنویسی کن. از مثال‌های روزمره برای فهم بهتر استفاده کن.'
  },
  {
    label: '📚 جزئیات بیشتر',
    prompt: 'جزئیات بیشتر و موارد لبه (edge cases) این مبحث را توضیح بده. نکات پیشرفته و استثناها را هم بگو.'
  },
  {
    label: '❓ Quiz Me',
    prompt: '3-5 سوال چند گزینه‌ای از این مبحث طرح کن. بعد از هر سوال، پاسخ صحیح را با توضیح کوتاه بنویس.'
  },
  {
    label: '📋 Summary',
    prompt: 'یک خلاصه فشرده و نکته‌محور از این مبحث بده که برای مرور سریع مناسب باشد.'
  },
  // Clinical Actions
  {
    label: '📝 SOAP Note',
    prompt: 'Using ONLY the information provided in this chat, generate a structured **SOAP Note**. Do not invent findings not mentioned. Format strictly for the medical record. Please answer according to the current Mode style.'
  },
  {
    label: '⚖️ Differential Dx',
    prompt: 'Provide a **Ranked Differential Diagnosis**. List the top 3-5 most likely etiologies with brief reasoning for/against based on the case facts. Highlight "Must-Not-Miss" diagnoses. Please answer according to the current Mode style.'
  },
  {
    label: '💊 Treatment',
    prompt: 'Detail the **Treatment Plan**. Include specific Medications (Doses/Routes), Non-pharmacologic interventions, and Alternatives. Note key Contraindications. Please answer according to the current Mode style.'
  },
  {
    label: '🎭 Case Generator',
    type: 'case-generator'
  }
];