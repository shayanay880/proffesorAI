interface CaseGeneratorParams {
  topic: string;
  setting: string;
  level: string;
  length: string;
  language: string;
  interactive: boolean;
  traps: boolean;
  mode?: string;
}

export const buildCaseGeneratorPrompt = ({
  topic,
  setting,
  level,
  length,
  language,
  interactive,
  traps,
  mode
}: CaseGeneratorParams) => `
You are building an emotionally engaging clinical case that improves memory through vivid cues, stakes, surprises, and active recall. Return ONLY valid JSON that follows the schema exactly (no Markdown, no commentary). Prefer plain text or <strong> tags for emphasis—avoid Markdown asterisks/bold if the renderer would show raw asterisks.

Memory science constraints:
- Use concrete sensory cues, emotional stakes, small surprises, and cliffhangers.
- Force active recall with short questions, then reveal concise answers.
- Use progressive disclosure when interactive=true (one stage builds on the last, with hints before answers).
- Add traps when traps=true (plausible but wrong paths) and clearly mark how to avoid them.
- Include hooks that beat rote reading: story beats, consequences, and pattern-spotting mnemonics.

Clinical consistency constraints (must be obeyed):
- Use PBW-based ventilator numbers; list settings as starter values with targets/limits (e.g., Pplat ≤30, pH goal when permissive hypercapnia, SpO2 ranges). Avoid outdated myths like “oxygen turns off respiratory drive” in COPD; instead mention V/Q and CO2 retention nuances.
- If the chosen mode is Pressure Control (PCV): reported peak pressure must match PEEP + inspiratory pressure; do not show unexplained PIP spikes unless due to patient effort or auto-PEEP and explain the mechanism explicitly. If plateau pressure is mentioned, explain how it was measured (inspiratory hold) and keep values physiologic.
- In COPD/asthma scenarios, emphasize auto-PEEP prevention (low RR, shorter Ti/higher flow, longer Te, permissive hypercapnia) and ensure RR/I:E align with that goal.
- When the patient is hypotensive, discuss sedation choices with hemodynamic caveats and alternatives (e.g., ketamine vs propofol vs benzo/opioid) rather than naming a single “best” option.
- DOPE/mechanical checks must appear early when there is sudden deterioration; circuit/cuff leaks should be checked early, not only as a late twist.

JSON schema to return:
{
  "meta": {
    "topic": string,
    "setting": string,
    "level": string,
    "length": string,
    "language": string,
    "interactive": boolean,
    "traps": boolean,
    "mode": string
  },
  "hook": string,
  "stakes": string,
  "patient": {
    "demographics": string,
    "setting": string,
    "chiefComplaint": string,
    "background": string,
    "vitals": string
  },
  "storyline": [
    {
      "title": string,
      "narrative": string,
      "question": string,
      "options": string[],
      "expectedAnswer": string,
      "reveal": string,
      "teaching": string,
      "trap": string,
      "surprise": string
    }
  ],
  "twist": string,
  "memoryAids": {
    "vividCue": string,
    "stakes": string,
    "analogy": string,
    "mnemonics": string[],
    "activeRecall": string[],
    "trapsToAvoid": string[],
    "hookQuestion": string
  },
  "keyTakeaways": string[],
  "flashcardSeeds": [{ "question": string, "answer": string }],
  "closingReflection": string
}

Rules:
- Output must be valid JSON. Do NOT wrap in markdown. Do NOT include extra keys.
- Use the requested language: ${language}.
- Keep length aligned to ${length} depth; keep wording at ${level} level and mode=${mode || 'Study'} tone.
- If interactive=true, keep each storyline item concise with a prompt then a reveal; if false, narratives can be fuller.
- If traps=false, keep "trap" and "trapsToAvoid" strings short placeholders like "None".
- Include at least 3 storyline stages. Keep flashcardSeeds focused on the highest-yield discriminators.

Fill the schema now based on topic="${topic}" and setting="${setting}".
`;