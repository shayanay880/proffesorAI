import { GoogleGenAI, Content, Type } from "@google/genai";
import { Message, Reference, Settings, Flashcard } from '../types';
import { getSystemInstruction } from '../prompts/personas';

export const SYSTEM_INSTRUCTION = `You are "Medical Professor AI": a safety-first, evidence-minded clinical educator for medical students and general practitioners.

CORE FORMAT
- Always structure answers as: Summary → Deep Dive → Memory Aids (mnemonics/analogies).
- Use clear headings and bullet points for readability.

HIGHLIGHTING & LINKS
- Use ++like this++ or ==like this== for high-yield “Golden Pearls”.
- Wrap Wikipedia terms in [[double brackets]] so the app can render search links.
- Use ⚠️ for warnings; ⛔ and !! are optional for danger blocks.

TONE & CONTENT
- Be concise but thorough, focusing on must-not-miss safety points and contraindications.
- Teach with clinical reasoning and actionable steps; emphasize red flags and contraindications.
- Remain evidence-minded and explicit about uncertainties.`;

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey || apiKey.includes('PLACEHOLDER')) {
  throw new Error('Missing Gemini API key. Set GEMINI_API_KEY in .env.local');
}
const ai = new GoogleGenAI({ apiKey });

// Switched to gemini-2.5-flash for maximum reliability and speed to prevent RPC/XHR timeouts.
const PRIMARY_MODEL = 'gemini-2.5-flash'; 
const FALLBACK_MODEL = 'gemini-2.5-flash';

// Reduced context limits to prevent large payloads from causing network timeouts
const MAX_CONTEXT_MESSAGES = 12;
const MAX_CONTEXT_CHARS = 15000;

export interface GeminiResponse {
    responseText: string;
    references: Reference[];
}

const normalizeReference = (ref: Partial<Reference> & { uri?: string }): Reference => {
    const url = ref.url || ref.uri || '';
    let title = ref.title || '';
    if (!title && url) {
        try {
            title = new URL(url).hostname;
        } catch {
            title = 'Unknown source';
        }
    }

    return {
        uri: ref.uri,
        title: title || 'Unknown source',
        url: url || '#',
        snippet: ref.snippet ?? '',
    };
};

const isRetryableError = (error: any) => {
    const errStr = (JSON.stringify(error) + error.toString()).toLowerCase();
    return (
        errStr.includes('403') || 
        errStr.includes('permission_denied') ||
        errStr.includes('503') || 
        errStr.includes('unavailable') ||
        errStr.includes('overloaded') ||
        errStr.includes('rpc failed') || 
        errStr.includes('xhr error') ||
        errStr.includes('fetch failed') ||
        errStr.includes('error code: 6') ||
        errStr.includes('500')
    );
};

export const generateResponse = async (messages: Message[], settings?: Settings): Promise<GeminiResponse> => {
    const normalizedMessages: Message[] = messages.map(msg => ({
        ...msg,
        role: (msg as any).role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user',
    }));

    const sanitizedMessages: Message[] = [];
    if (normalizedMessages.length > 0) {
        sanitizedMessages.push({ ...normalizedMessages[0] });
        for (let i = 1; i < normalizedMessages.length; i++) {
            const prev = sanitizedMessages[sanitizedMessages.length - 1];
            const curr = normalizedMessages[i];
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
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));

    const performGeneration = async (modelName: string, useGrounding: boolean) => {
        const currentSettings = settings || { mode: 'Study', studyLoad: 'standard', strictMode: false };
        const finalInstruction = `${SYSTEM_INSTRUCTION}\n\n${getSystemInstruction(currentSettings)}`;

        const config: any = {
            systemInstruction: finalInstruction,
            temperature: 0.1, // Lower temperature for more consistent medical advice
            topP: 0.8,
            topK: 40,
        };

        if (useGrounding) {
            config.tools = [{ googleSearch: {} }];
        }

        return await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: config
        });
    };

    try {
        let result;
        
        // Strategy: 
        // 1. Primary Model + Grounding
        // 2. Primary Model (No Grounding) - if 1 fails with retryable error (often RPC/XHR from tools)
        // 3. Fallback Model (No Grounding) - if 2 fails
        
        try {
            result = await performGeneration(PRIMARY_MODEL, true);
        } catch (e1: any) {
            console.warn(`Attempt 1 (${PRIMARY_MODEL} + Grounding) failed:`, e1);
            
            if (isRetryableError(e1)) {
                try {
                    console.log(`Attempt 2: Retrying ${PRIMARY_MODEL} without grounding...`);
                    result = await performGeneration(PRIMARY_MODEL, false);
                } catch (e2: any) {
                    console.warn(`Attempt 2 (${PRIMARY_MODEL}) failed:`, e2);
                    
                    if (isRetryableError(e2)) {
                         console.log(`Attempt 3: Falling back to ${FALLBACK_MODEL}...`);
                         result = await performGeneration(FALLBACK_MODEL, false);
                    } else {
                        throw e2; // Non-retryable error in attempt 2
                    }
                }
            } else {
                throw e1; // Non-retryable error in attempt 1
            }
        }

        if (!result) throw new Error('No response generated after retries.');

        const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
        const rawRefs = groundingMetadata?.groundingChunks
            ?.map(chunk => chunk.web)
            .filter((web): web is { uri: string; title: string; snippet?: string } => !!web?.uri && !!web.title) || [];

        const references = Array.from(
            new Map<string, Reference>(
                rawRefs.map(r => {
                    const ref = normalizeReference({ title: r.title, url: r.uri, snippet: r.snippet });
                    return [ref.url, ref];
                })
            ).values()
        );

        return {
            responseText: result.text || "No response generated.",
            references: references,
        };

    } catch (error: any) {
        console.error('Error calling Gemini API:', error);
        
        let errorText = "متاسفانه به دلیل خطا در ارتباط با سرور، امکان پردازش درخواست شما وجود ندارد.";
        
        const errorString = (JSON.stringify(error) + error.toString()).toLowerCase();
        
        if (errorString.includes('403') || errorString.includes('permission_denied')) {
            errorText += "\n\n**⚠️ Access Error (403):**\nPermission denied. Please check your VPN/Region or API Key limits.";
        } else if (errorString.includes('rpc failed') || errorString.includes('xhr error') || errorString.includes('error code: 6')) {
            errorText += "\n\n**⚠️ Network/Server Error:**\nThe AI service is currently unstable or unreachable. Please try again in a few moments.";
        } else if (errorString.includes('400')) {
            errorText += "\n\n**⚠️ Request Error (400):**\nThe conversation history might be invalid. Please try a 'New Chat'.";
        } else {
             errorText += `\n\nError details: ${error.message || String(error)}`;
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
        // Use Flash model for flashcards - faster and more reliable for JSON
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
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