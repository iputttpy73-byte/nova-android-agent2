export type ConfidenceBand = "LOW" | "MEDIUM" | "HIGH";
export type ConfidenceFactor = { name: string; contribution: number; explanation: string };
export type IntentConfidence = { score: number; band: ConfidenceBand; factors: ConfidenceFactor[]; requiresClarification: boolean };

export function assessIntentConfidence(score: number, ambiguityCount: number, missingCapabilityCount: number): IntentConfidence {
  const normalized = Math.max(0, Math.min(1, score));
  const factors: ConfidenceFactor[] = [];
  if (ambiguityCount > 0) factors.push({ name: "ambiguity", contribution: -Math.min(0.4, ambiguityCount * 0.1), explanation: `${ambiguityCount} ambiguity marker(s) detected.` });
  if (missingCapabilityCount > 0) factors.push({ name: "missing_capability", contribution: -Math.min(0.3, missingCapabilityCount * 0.1), explanation: `${missingCapabilityCount} capability requirement(s) are unresolved.` });
  const band: ConfidenceBand = normalized >= 0.8 ? "HIGH" : normalized >= 0.55 ? "MEDIUM" : "LOW";
  return { score: normalized, band, factors, requiresClarification: normalized < 0.8 || ambiguityCount > 0 };
}
