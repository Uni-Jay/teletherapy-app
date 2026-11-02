export const SCALE = ["Not at all", "Several days", "More than half the days", "Nearly every day"];

/** Questions asked about the last two weeks. Items 1–4 follow the PHQ-2 and GAD-2 screening questions. */
export const QUESTIONS = [
  { id: "interest", text: "Little interest or pleasure in doing things", group: "mood" },
  { id: "down", text: "Feeling down, depressed, or hopeless", group: "mood" },
  { id: "nervous", text: "Feeling nervous, anxious, or on edge", group: "anxiety" },
  { id: "worry", text: "Not being able to stop or control worrying", group: "anxiety" },
  { id: "sleep", text: "Trouble falling or staying asleep, or sleeping too much", group: "other" },
  { id: "stress", text: "Feeling overwhelmed by stress at work, school or home", group: "other" },
  { id: "selfharm", text: "Thoughts that you would be better off dead, or of hurting yourself", group: "safety" },
] as const;

export type QuestionId = (typeof QUESTIONS)[number]["id"];
export type Answers = Record<QuestionId, number> & { notes?: string };

const CRISIS_WORDS = [/suicid/i, /kill myself/i, /end my life/i, /want to die/i, /self[- ]?harm/i, /hurt myself/i, /no reason to live/i];

export function scoreAnswers(a: Answers) {
  const mood = (a.interest ?? 0) + (a.down ?? 0);
  const anxiety = (a.nervous ?? 0) + (a.worry ?? 0);
  const total = mood + anxiety + (a.sleep ?? 0) + (a.stress ?? 0);
  let risk: "low" | "moderate" | "high" = "low";
  if (mood >= 3 || anxiety >= 3 || total >= 8) risk = "moderate";
  if ((a.selfharm ?? 0) > 0 || CRISIS_WORDS.some((r) => r.test(a.notes ?? ""))) risk = "high";
  return { mood, anxiety, total, risk };
}
