import type { IntentParser, IntentParseRequest } from "../../shared/agent/contracts";
import type { Goal, Intent } from "../../shared/agent/domain";
import { assessIntentConfidence } from "../../shared/ai/confidence";
import { validateIntent } from "../agent/validation";

function normalize(text: string): string { return text.trim().replace(/\s+/g, " "); }
function hasAny(text: string, words: string[]): boolean { return words.some((word) => text.includes(word)); }

export class DeterministicIntentParser implements IntentParser {
  async parse(request: IntentParseRequest): Promise<Intent> {
    const goal = request.goal;
    const text = normalize(goal.text);
    const lower = text.toLowerCase();
    const ambiguities: string[] = [];
    const requiredCapabilities = new Set<string>();
    const entities: Intent["entities"] = [];

    if (text.split(" ").length < 3) ambiguities.push("Goal is too short to establish a reliable outcome.");
    if (hasAny(lower, ["someone", "something", "somewhere", "شيء", "أحد"])) ambiguities.push("Goal contains an unspecified reference.");
    if (hasAny(lower, ["open", "launch", "start", "افتح", "شغل"])) requiredCapabilities.add("APP_LAUNCH");
    if (hasAny(lower, ["send", "message", "reply", "أرسل", "رسالة"])) requiredCapabilities.add("MESSAGE_COMPOSE");
    if (hasAny(lower, ["read", "review", "check", "اقرأ", "راجع", "تحقق"])) requiredCapabilities.add("CONTENT_READ");
    if (hasAny(lower, ["click", "tap", "press", "انقر", "اضغط"])) requiredCapabilities.add("UI_INTERACTION");
    if (goal.constraints.targetApplication) {
      entities.push({ name: "targetApplication", value: goal.constraints.targetApplication, confidence: 0.98 });
    } else if (requiredCapabilities.has("APP_LAUNCH")) {
      ambiguities.push("Target application is not specified.");
    }
    if (requiredCapabilities.has("MESSAGE_COMPOSE") && !/(?:to|إلى|لـ|ل)\s+\S+/i.test(text)) ambiguities.push("Message recipient is not specified.");

    const baseScore = request.previousIntent ? request.previousIntent.confidence : 0.92;
    const confidence = assessIntentConfidence(baseScore, ambiguities.length, 0);
    const sensitivity = hasAny(lower, ["password", "payment", "bank", "دفع", "كلمة المرور", "بنك"]) ? "HIGH" : goal.priority === "HIGH" ? "MEDIUM" : "LOW";
    const intent: Intent = {
      id: `intent_${crypto.randomUUID()}` as Intent["id"],
      goalId: goal.id,
      desiredOutcome: text,
      entities,
      constraints: goal.constraints,
      requiredCapabilities: [...requiredCapabilities],
      ambiguities,
      sensitivity,
      confidence: confidence.score,
      source: "USER_GOAL",
      createdAt: new Date().toISOString(),
    };
    validateIntent(intent);
    return intent;
  }
}

export function parseGoalDeterministically(goal: Goal): Promise<Intent> { return new DeterministicIntentParser().parse({ goal }); }
