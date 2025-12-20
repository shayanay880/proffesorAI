You are a senior frontend engineer. Recreate EXACTLY the current app described below. 
Do NOT redesign UX, do NOT change libraries, do NOT omit features. 
If any detail is ambiguous, choose the simplest implementation that matches the described behavior.

==============================
APP NAME
==============================
"Medical Professor AI" — a React + TypeScript medical assistant chat app.

==============================
TECH STACK (MUST MATCH)
==============================
- React 19 + TypeScript
- Tailwind CSS
- KaTeX for math rendering
- Google Gemini API via @google/genai
- Model: gemini-3-pro-preview
- Output: generate all necessary files:
  index.html, index.tsx, App.tsx, types.ts,
  services/geminiService.ts,
  components/* (separate component files)

No extra heavy frameworks. Keep it clean and minimal.

==============================
CORE APP BEHAVIOR (MUST MATCH)
==============================

A) SYSTEM PERSONA (services/geminiService.ts)
Create a single exported constant SYSTEM_INSTRUCTION string that enforces:
- Persona: "Medical Professor AI" for medical students/GPs
- Safety-first, must-not-miss, red flags, contraindications
- Evidence-minded, structured teaching + clinical action
- Must use highlighting syntax: ++like this++ OR ==like this== for “Golden Pearls / high-yield”
- Must use [[double brackets]] for Wikipedia terms (to be rendered as wiki search links)
- Must use ⚠️ for warnings; optionally ⛔ and !! for danger blocks
- Format preference: Summary → Deep Dive → Memory Aids (mnemonics/analogies)

B) GEMINI CALLING + ROBUSTNESS (services/geminiService.ts)
Implement:
1) Initialize GoogleGenAI with API key:
   new GoogleGenAI({ apiKey: process.env.API_KEY })
2) Primary request tries to enable grounding with googleSearch tool (if available).
3) Fallback mechanism:
   - If API returns 403 PERMISSION_DENIED (commonly from search grounding or region/billing restrictions),
     automatically retry the SAME request WITHOUT googleSearch tool.
4) Message sanitization (CRITICAL):
   - Gemini rejects consecutive messages of same role.
   - Before sending history, merge consecutive messages by role into one.
     Example: user,user → one user message separated by "\n\n".
5) Return:
   - text response (string)
   - references array (grounding chunks if present; else empty)
6) Errors:
   - Show a clear app-level error message: “failed to call gemini api”
   - Include helpful hint: if 403 persists, suggest checking API key permissions / billing / VPN/region restrictions.

C) CHAT UI + RENDERING (components/ChatMessage.tsx)
Build a robust renderer that supports:
1) Markdown: headers, bold, lists, tables.
2) Math (KaTeX):
   - Display: $$...$$
   - Inline: $...$
3) Highlights:
   - ++highlight++ and ==highlight== render as highlighted text (yellow-ish background).
   - Must be reliable; do not use incorrect escaping. Provide clean regex.
4) Wiki links:
   - [[term]] becomes clickable link to Wikipedia search for that term.
5) Badges:
   - !!text!! → red danger badge style
   - ??text?? → blue info badge style
6) Safety alerts (block-level):
   - If a line starts with ⚠️ OR ⛔ OR !! then render the whole contiguous block as a red “alert box”.
7) Evidence level badge:
   - Based on count of references returned by API:
     - Strong/Grounded/Ungrounded (define thresholds; simple rule is fine, but consistent).
8) Render references section under the assistant message when references exist:
   - Show a small “References” list with title/snippet + link if available.

D) HISTORY SIDEBAR + AUTO-RENAME (components/HistorySidebar.tsx)
Implement conversation history:
- Collapsible sidebar
- New chat button
- Delete chat
- List chats with title + timestamp (or last updated)
Auto-rename rule (MUST BE HERE, not only App.tsx):
- After first user message is sent in a conversation, title becomes:
  - If length ≤ 30 chars: title = first message
  - Else: first 30 chars total with ellipsis (truncate to 27 + "..." OR equivalent that yields 30)
- Do not rename again after first rename.

E) APP STATE (App.tsx)
Manage:
- conversations list
- current conversation id
- messages
- loading state
- sidebar open/close
Features:
- Auto-scroll to bottom on new messages
- “Streaming-like” is optional; a simple await response is acceptable if consistent.

F) DISCLAIMER MODAL
On first launch:
- Show mandatory disclaimer modal
- Must be acknowledged
- Save acceptance in localStorage so it doesn’t reappear.

G) PROMPT STARTERS (components/PromptStarters.tsx)
When chat is empty, show 4 cards (click inserts prompt):
- Teach a Topic
- Approach & Algorithms
- Drug Review
- Differential Diagnosis / Must-not-miss

H) VISUAL STYLE
- Clean medical aesthetic: whites/grays/blues
- Responsive layout, mobile-friendly sidebar
- Simple icons (Heroicons or inline SVG)

==============================
DATA TYPES (types.ts)
==============================
Define types for:
- Message (role: 'user'|'assistant', content: string, references?: Reference[])
- Conversation (id, title, messages, createdAt, updatedAt)
- Reference (title, url, snippet) or minimal fields from grounding chunks

==============================
ACCEPTANCE TESTS (MUST PASS)
==============================
1) If assistant outputs:
   "This is ++important++ and ==high yield=="
   → both render highlighted.
2) If assistant outputs:
   "⚠️ Give thrombolysis only if..."
   → renders in red alert box.
3) If assistant outputs:
   "[[Aortic dissection]]"
   → becomes a Wikipedia search link.
4) If two user messages happen consecutively (due to retry/UI issue),
   history is sanitized and API call does not fail with 400.
5) If googleSearch tool causes 403,
   app retries without tool and still returns an answer.
6) Conversation title auto-renames exactly once based on first user message,
   truncation rule enforced to 30 chars with ellipsis.

==============================
DELIVERABLE
==============================
Generate the FULL code for all files. Ensure it builds and runs.
Do not output explanations first — output the code files with clear file separators.