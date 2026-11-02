import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { QUESTIONS, SCALE, type Answers } from "@/lib/assessment";
import { SPECIALTIES } from "@/lib/constants";

export type AiResult = {
  summary: string;
  recommended_specialties: string[];
  recommended_support: string;
  crisis_language: boolean;
};

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";

/**
 * Summarises an assessment for the patient and their therapist.
 * It never diagnoses; scoring and risk are calculated in code, not by the model.
 */
export async function summariseAssessment(input: {
  answers: Answers;
  scores: { mood: number; anxiety: number; total: number; risk: string };
  concerns: string[];
  supportAreas: string[];
  preferred: string;
}): Promise<AiResult> {
  const fallback = ruleBasedSummary(input);
  if (!process.env.ANTHROPIC_API_KEY) return fallback;

  const lines = QUESTIONS.map((q) => `- ${q.text}: ${SCALE[input.answers[q.id] ?? 0]}`).join("\n");
  const prompt = `A person joining an online therapy platform in Nigeria completed a short wellbeing check-in about the last two weeks.

Answers:
${lines}
Extra notes from them: ${input.answers.notes?.trim() || "(none)"}

Concerns they selected: ${input.concerns.join(", ") || "none"}
Areas they want support with: ${input.supportAreas.join(", ") || "none"}
Preferred session type: ${input.preferred}
Screening scores: mood ${input.scores.mood}/6, anxiety ${input.scores.anxiety}/6.

Write a JSON object with:
- "summary": 3-4 warm, plain-English sentences addressed to the person ("you"), reflecting what they shared and what kind of support could help. Do NOT diagnose or name a disorder. Do NOT give medical advice.
- "recommended_specialties": 1-3 items chosen ONLY from this list: ${SPECIALTIES.join(", ")}.
- "recommended_support": one sentence on the type of support that may suit them (e.g. weekly sessions with a therapist experienced in X).
- "crisis_language": true if their notes suggest risk of self-harm or suicide, otherwise false.

Reply with the JSON object only.`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return {
      summary: String(json.summary || fallback.summary),
      recommended_specialties: (Array.isArray(json.recommended_specialties) ? json.recommended_specialties : [])
        .map(String)
        .filter((s: string) => SPECIALTIES.includes(s))
        .slice(0, 3),
      recommended_support: String(json.recommended_support || fallback.recommended_support),
      crisis_language: Boolean(json.crisis_language),
    };
  } catch (err) {
    console.error("AI assessment failed, using rule-based summary", err);
    return fallback;
  }
}

function ruleBasedSummary(input: { scores: { mood: number; anxiety: number }; concerns: string[] }): AiResult {
  const specs: string[] = [];
  if (input.scores.mood >= 3 || input.concerns.includes("Depression")) specs.push("Depression");
  if (input.scores.anxiety >= 3 || input.concerns.includes("Anxiety")) specs.push("Anxiety");
  if (input.concerns.includes("Trauma")) specs.push("Trauma and PTSD");
  if (input.concerns.includes("Grief and loss")) specs.push("Grief");
  if (input.concerns.includes("Relationships")) specs.push("Relationships and couples");
  if (input.concerns.includes("Stress")) specs.push("Stress and burnout");
  const recommended = specs.length ? specs.slice(0, 3) : ["Stress and burnout"];
  return {
    summary:
      "Thank you for sharing how you've been feeling. Your answers suggest you could benefit from talking things through with a professional who can help you understand what you're experiencing and find ways to cope. You've taken an important first step.",
    recommended_specialties: recommended,
    recommended_support: `Regular sessions with a therapist experienced in ${recommended[0].toLowerCase()}.`,
    crisis_language: false,
  };
}
