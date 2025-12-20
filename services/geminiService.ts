import { GoogleGenAI, Content, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Message, Reference, Settings, Flashcard, GeneratedCase } from '../types';
import { getSystemInstruction } from '../prompts/personas';
import { buildCaseGeneratorPrompt } from '../prompts/caseGenerator';

export const SYSTEM_INSTRUCTION = `You are "Medical Professor AI": a safety-first, evidence-minded clinical educator for medical students and general practitioners.

CORE FORMAT
- Always structure answers as: Summary → Deep Dive → Memory Aids (mnemonics/analogies).
- Use clear headings and bullet points for readability.

HIGHLIGHTING & LINKS
- Use ++like this++ (Cyan) or ==like this== (Yellow) for high-yield “Golden Pearls”.
- Wrap Wikipedia terms in [[double brackets]] so the app can render search links.
- Use ⚠️ for warnings; ⛔ and !! are optional for danger blocks.

TONE & CONTENT
- Be concise but thorough, focusing on must-not-miss safety points and contraindications.
- Teach with clinical reasoning and actionable steps; emphasize red flags and contraindications.
- Remain evidence-minded and explicit about uncertainties.`;

// Following the @google/genai coding guidelines:
// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Updated to gemini-3-pro-preview as requested
const PRIMARY_MODEL = 'gemini-3-pro-preview'; 
const FALLBACK_MODEL = 'gemini-3-pro-preview';

// Reduced context limits to prevent large payloads from causing network timeouts
const MAX_CONTEXT_MESSAGES = 12;
const MAX_CONTEXT_CHARS = 15000;

export interface GeminiResponse {
    responseText: string;
    references: Reference[];
}

type CaseValidationResult = {
    errors: string[];
    warnings: string[];
};

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
        const currentSettings = settings || { mode: 'Study', studyLoad: 'standard', strictMode: false, aiModel: 'gemini-3-pro-preview' };
        const finalInstruction = `${SYSTEM_INSTRUCTION}\n\n${getSystemInstruction(currentSettings)}`;

        const config: any = {
            systemInstruction: finalInstruction,
            temperature: 0.1, // Lower temperature for more consistent medical advice
            topP: 0.8,
            topK: 40,
            thinkingConfig: { thinkingBudget: 32768 }, // High level thinking for gemini-3-pro-preview
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
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

        // Fix: explicit Map typing to avoid 'unknown' error
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
        const result = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', 
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
                },
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                ]
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

const caseResponseSchema = {
    type: Type.OBJECT,
    properties: {
        meta: {
            type: Type.OBJECT,
            properties: {
                topic: { type: Type.STRING },
                setting: { type: Type.STRING },
                level: { type: Type.STRING },
                length: { type: Type.STRING },
                language: { type: Type.STRING },
                interactive: { type: Type.BOOLEAN },
                traps: { type: Type.BOOLEAN },
                mode: { type: Type.STRING }
            },
            required: ['topic', 'setting', 'level', 'length', 'language', 'interactive', 'traps']
        },
        hook: { type: Type.STRING },
        stakes: { type: Type.STRING },
        patient: {
            type: Type.OBJECT,
            properties: {
                demographics: { type: Type.STRING },
                setting: { type: Type.STRING },
                chiefComplaint: { type: Type.STRING },
                background: { type: Type.STRING },
                vitals: { type: Type.STRING }
            },
            required: ['demographics', 'setting', 'chiefComplaint', 'background', 'vitals']
        },
        storyline: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    narrative: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    expectedAnswer: { type: Type.STRING },
                    reveal: { type: Type.STRING },
                    teaching: { type: Type.STRING },
                    trap: { type: Type.STRING },
                    surprise: { type: Type.STRING }
                },
                required: ['title', 'narrative']
            }
        },
        twist: { type: Type.STRING },
        memoryAids: {
            type: Type.OBJECT,
            properties: {
                vividCue: { type: Type.STRING },
                stakes: { type: Type.STRING },
                analogy: { type: Type.STRING },
                mnemonics: { type: Type.ARRAY, items: { type: Type.STRING } },
                activeRecall: { type: Type.ARRAY, items: { type: Type.STRING } },
                trapsToAvoid: { type: Type.ARRAY, items: { type: Type.STRING } },
                hookQuestion: { type: Type.STRING }
            },
            required: ['vividCue', 'stakes', 'analogy', 'mnemonics', 'activeRecall', 'trapsToAvoid', 'hookQuestion']
        },
        keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
        flashcardSeeds: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING }
                },
                required: ['question', 'answer']
            }
        },
        closingReflection: { type: Type.STRING }
    },
    required: ['meta', 'hook', 'stakes', 'patient', 'storyline', 'twist', 'memoryAids', 'keyTakeaways', 'flashcardSeeds', 'closingReflection']
};

const sanitizeGeneratedCase = (data: any): GeneratedCase => {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid JSON: root is not an object');
    }

    if (!Array.isArray(data.storyline) || data.storyline.length === 0) {
        throw new Error('Invalid JSON: storyline is missing or empty');
    }

    return {
        meta: {
            topic: data.meta?.topic || 'Unknown topic',
            setting: data.meta?.setting || 'Unknown setting',
            level: data.meta?.level || 'Standard',
            length: data.meta?.length || 'medium',
            language: data.meta?.language || 'English',
            interactive: Boolean(data.meta?.interactive),
            traps: Boolean(data.meta?.traps),
            mode: data.meta?.mode || 'Study'
        },
        hook: data.hook || '',
        stakes: data.stakes || '',
        patient: {
            demographics: data.patient?.demographics || 'Patient details not provided',
            setting: data.patient?.setting || data.meta?.setting || '',
            chiefComplaint: data.patient?.chiefComplaint || '',
            background: data.patient?.background || '',
            vitals: data.patient?.vitals || ''
        },
        storyline: data.storyline.map((step: any, idx: number) => ({
            title: step.title || `Stage ${idx + 1}`,
            narrative: step.narrative || '',
            question: step.question || '',
            options: Array.isArray(step.options) ? step.options : [],
            expectedAnswer: step.expectedAnswer || '',
            reveal: step.reveal || step.expectedAnswer || '',
            teaching: step.teaching || '',
            trap: step.trap || '',
            surprise: step.surprise || ''
        })),
        twist: data.twist || '',
        memoryAids: {
            vividCue: data.memoryAids?.vividCue || '',
            stakes: data.memoryAids?.stakes || '',
            analogy: data.memoryAids?.analogy || '',
            mnemonics: Array.isArray(data.memoryAids?.mnemonics) ? data.memoryAids.mnemonics : [],
            activeRecall: Array.isArray(data.memoryAids?.activeRecall) ? data.memoryAids.activeRecall : [],
            trapsToAvoid: Array.isArray(data.memoryAids?.trapsToAvoid) ? data.memoryAids.trapsToAvoid : [],
            hookQuestion: data.memoryAids?.hookQuestion || ''
        },
        keyTakeaways: Array.isArray(data.keyTakeaways) ? data.keyTakeaways : [],
        flashcardSeeds: Array.isArray(data.flashcardSeeds) ? data.flashcardSeeds : [],
        closingReflection: data.closingReflection || '',
        warnings: Array.isArray(data.warnings) ? data.warnings : []
    };
};

const extractNumber = (text: string, labelPattern: RegExp): number | undefined => {
    const match = text.match(labelPattern);
    if (match?.[1]) {
        const parsed = parseFloat(match[1]);
        return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
};

const buildCaseValidation = (data: any): CaseValidationResult => {
    const warnings: string[] = [];
    const errors: string[] = [];

    const metaMode = (data?.meta?.mode || '').toString().toLowerCase();
    const combinedText = [
        data?.hook,
        data?.stakes,
        data?.twist,
        data?.patient?.vitals,
        ...(Array.isArray(data?.storyline) ? data.storyline.map((s: any) => `${s?.narrative || ''} ${s?.question || ''} ${s?.reveal || ''} ${s?.teaching || ''}`) : [])
    ]
        .filter(Boolean)
        .join(' ');

    const pip = extractNumber(combinedText, /PIP[^0-9]{0,10}(\d+(?:\.\d+)?)/i);
    const peep = extractNumber(combinedText, /PEEP[^0-9]{0,10}(\d+(?:\.\d+)?)/i);
    const driving = extractNumber(combinedText, /(driving pressure|pinsp|inspiratory pressure)[^0-9]{0,10}(\d+(?:\.\d+)?)/i);
    const pplat = extractNumber(combinedText, /Pplat[^0-9]{0,10}(\d+(?:\.\d+)?)/i);
    const rr = extractNumber(combinedText, /RR[^0-9]{0,10}(\d+(?:\.\d+)?)/i);
    const ieRatioRaw = combinedText.match(/1\s*:\s*(\d+(?:\.\d+)?)/i);
    const ie = ieRatioRaw?.[1] ? parseFloat(ieRatioRaw[1]) : undefined;

    if (metaMode.includes('pcv') || /pressure control/i.test(combinedText)) {
        if (pip !== undefined && peep !== undefined && driving !== undefined && pip > peep + driving + 5) {
            errors.push('In PCV, PIP must approximate PEEP + inspiratory pressure; reported values are inconsistent.');
        }
        if (pplat !== undefined && pip !== undefined && pplat > pip + 2) {
            errors.push('Plateau pressure exceeds peak pressure without an explanation.');
        }
    }

    const isObstructiveCase = /copd|asthma/i.test(combinedText) || /copd|asthma/i.test(data?.meta?.topic || '');
    if (isObstructiveCase && rr !== undefined && rr > 18 && (!ie || ie <= 2)) {
        warnings.push('COPD/asthma cases should prioritize auto-PEEP prevention; current RR/I:E may be too short for exhalation.');
    }

    const twistHasLeak = /leak/i.test(data?.twist || '') || /cuff/i.test(data?.twist || '');
    const storylineHasEarlyLeakCheck = Array.isArray(data?.storyline) && data.storyline.some((step: any, idx: number) => idx < 2 && (/leak/i.test(step?.narrative || '') || /dope/i.test(step?.narrative || '')));
    if (twistHasLeak && !storylineHasEarlyLeakCheck) {
        warnings.push('Circuit/cuff leaks should be checked early (DOPE); consider moving this check earlier in the storyline.');
    }

    return { errors, warnings };
};

export const generateCase = async (params: {
    topic: string;
    setting: string;
    level: string;
    length: string;
    language: string;
    interactive: boolean;
    traps: boolean;
    mode?: string;
}): Promise<GeneratedCase> => {
    const prompt = buildCaseGeneratorPrompt(params);

    const runOnce = async (overridePrompt?: string, attempt = 1) => {
        try {
            const result = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: {
                    parts: [{ text: overridePrompt || prompt }]
                },
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: caseResponseSchema,
                    safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    ]
                }
            });

            const rawText = result.text || '';
            if (!rawText) {
                throw new Error('Empty response from model');
            }

            let parsed: any;
            try {
                parsed = typeof rawText === 'string' ? JSON.parse(rawText) : rawText;
            } catch (err) {
                console.error('Failed to parse case JSON:', rawText);
                throw new Error('Model returned invalid JSON');
            }

            return parsed;
        } catch (error: any) {
            // Check if retryable error (using the shared helper) and we haven't exceeded 3 attempts
            if (attempt <= 3 && isRetryableError(error)) {
                console.warn(`generateCase attempt ${attempt} failed, retrying in ${attempt}s...`, error);
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                return runOnce(overridePrompt, attempt + 1);
            }
            throw error;
        }
    };

    try {
        let parsed = await runOnce();
        let validation = buildCaseValidation(parsed);

        if (validation.errors.length > 0) {
            const correctivePrompt = `${prompt}\n\nYour previous case had these inconsistencies: ${validation.errors.join('; ')}. Regenerate with corrected physiology and consistent numbers.`;
            parsed = await runOnce(correctivePrompt);
            validation = buildCaseValidation(parsed);
        }

        const sanitized = sanitizeGeneratedCase({ ...parsed, warnings: validation.warnings });
        
        sanitized.meta = {
            ...sanitized.meta,
            topic: params.topic,
            setting: params.setting,
            level: params.level,
            length: params.length,
            language: params.language,
            interactive: params.interactive,
            traps: params.traps,
            mode: params.mode || sanitized.meta.mode
        };

        return sanitized;
    } catch (error) {
        console.error('Case generation failed:', error);
        throw error;
    }
};