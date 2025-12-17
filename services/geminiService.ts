import { GoogleGenAI, Content, Type } from "@google/genai";
import { Message, Reference, Settings, Flashcard } from '../types';
import { getSystemInstruction } from '../prompts/personas';

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey || apiKey.includes('PLACEHOLDER')) {
  throw new Error('Missing Gemini API key. Set GEMINI_API_KEY in .env.local');
}
const ai = new GoogleGenAI({ apiKey });

const model = 'gemini-3-pro-preview';

const MAX_CONTEXT_MESSAGES = 30;
const MAX_CONTEXT_CHARS = 24000;
const MAX_RETRIES = 2;

export interface GeminiResponse {
    responseText: string;
    references: Reference[];
}

export const generateResponse = async (messages: Message[], settings?: Settings): Promise<GeminiResponse> => {
    const sanitizedMessages: Message[] = [];
    if (messages.length > 0) {
        sanitizedMessages.push({ ...messages[0] });
        for (let i = 1; i < messages.length; i++) {
            const prev = sanitizedMessages[sanitizedMessages.length - 1];
            const curr = messages[i];
            if (prev.role === curr.role) {
                prev.text += "\n\n" + curr.text;
            } else {
                sanitizedMessages.push({ ...curr });
            }
        }
    }

    const trimmedMessages: Message[] = [];
    let charCount = 0;
    for (let i = sanitizedMessages.length - 1; i >= 0; i--) {
      const m = sanitizedMessages[i];
      const nextCount = charCount + (m.text?.length ?? 0);
      if (trimmedMessages.length >= MAX_CONTEXT_MESSAGES || nextCount > MAX_CONTEXT_CHARS) {
        break;
      }
      trimmedMessages.unshift(m);
      charCount = nextCount;
    }
    if (trimmedMessages.length === 0 && sanitizedMessages.length > 0) {
      trimmedMessages.push(sanitizedMessages[sanitizedMessages.length - 1]);
    }

    const contents: Content[] = trimmedMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    const performGeneration = async (useGrounding: boolean) => {
        const currentSettings = settings || { mode: 'Study', studyLoad: 'standard', strictMode: false };
        const finalInstruction = getSystemInstruction(currentSettings);

        const config: any = {
            systemInstruction: finalInstruction,
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
        };

        if (useGrounding) {
            config.tools = [{ googleSearch: {} }];
        }

        return await ai.models.generateContent({
            model: model,
            contents: contents,
            config: config
        });
    };

    try {
        let result;
        let lastError;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                // Try with grounding first
                result = await performGeneration(true);
                break; // Success
            } catch (innerError: any) {
                lastError = innerError;
                const errStr = JSON.stringify(innerError) + innerError.toString();
                
                // Permission Denied (403) - Fallback to no-grounding
                if (errStr.includes('403') || errStr.includes('PERMISSION_DENIED')) {
                    console.warn('Primary attempt with Grounding failed (403). Retrying without Grounding tool...');
                    try {
                        result = await performGeneration(false);
                        break;
                    } catch (fallbackError) {
                        lastError = fallbackError;
                        throw fallbackError; // If fallback fails, it might be a real error
                    }
                } 
                // Service Unavailable (503) - Retry with backoff
                else if (errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('OVERLOADED')) {
                     if (attempt < MAX_RETRIES) {
                        console.warn(`Retry attempt ${attempt + 1}/${MAX_RETRIES} due to service unavailable...`);
                        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt))); // Exponential backoff
                        continue;
                     }
                }
                
                throw innerError;
            }
        }

        if (!result && lastError) throw lastError;

        const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
        const rawRefs = groundingMetadata?.groundingChunks
            ?.map(chunk => chunk.web)
            .filter((web): web is { uri: string; title: string } => !!web?.uri && !!web.title) || [];

        const references = Array.from(new Map<string, Reference>(rawRefs.map(r => [r.uri, r])).values());

        return {
            responseText: result.text || "No response generated.",
            references: references,
        };

    } catch (error: any) {
        console.error('Error calling Gemini API:', error);
        
        let errorText = "متاسفانه به دلیل خطا در ارتباط با سرور، امکان پردازش درخواست شما وجود ندارد.";
        
        const errorString = JSON.stringify(error) + error.toString();
        if (errorString.includes('403') || errorString.includes('PERMISSION_DENIED')) {
            errorText += "\n\n**⚠️ Access Error (403):**\nPermission denied. This commonly happens for two reasons:\n1. **Location Restrictions:** Google AI services may be blocked in your current location (e.g., Iran). **Please ensure your VPN is active and set to a supported region.**\n2. **API Key Limits:** Your API key might not support the Search Grounding feature or has expired.";
        } else if (errorString.includes('400')) {
            errorText += "\n\n**⚠️ Request Error (400):**\nThe conversation history might be invalid or too long. Please try starting a 'New Chat'.";
        }

        return {
            responseText: errorText,
            references: [],
        };
    }
};

export const generateFlashcardsJSON = async (
    sourceText: string,
    count: number,
    style: 'basic' | 'cloze',
    language: 'English' | 'Persian'
): Promise<Flashcard[]> => {
    
    const prompt = `Based on the following medical text, extract exactly ${count} high-yield flashcards.
    
    Style: ${style === 'cloze' ? 'Cloze Deletion (use {{c1::hidden text}} format)' : 'Basic Question & Answer'}.
    Language: ${language} (Ensure content is in this language, medical terms can remain in English if appropriate).
    
    SOURCE TEXT:
    ${sourceText.substring(0, 15000)}
    `;

    try {
        const result = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ['basic', 'cloze'] },
                            question: { type: Type.STRING },
                            answer: { type: Type.STRING },
                            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['type', 'question', 'answer', 'tags']
                    }
                }
            }
        });

        if (result.text) {
            return JSON.parse(result.text) as Flashcard[];
        }
        throw new Error('Empty response from model');
    } catch (e) {
        console.error('Flashcard generation failed:', e);
        throw e;
    }
};