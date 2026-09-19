import type { AIResponse } from "../../shared/ai/contracts";

export type JsonSchema = { type: "object"; properties: Record<string, { type: "string" | "number" | "boolean" | "array" | "object" }>; required?: string[]; additionalProperties?: boolean };

export function validateStructuredOutput(value: unknown, schema: JsonSchema): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Structured output must be an object.");
  const object = value as Record<string, unknown>;
  for (const key of schema.required ?? []) if (!(key in object)) throw new Error(`Structured output is missing required field: ${key}`);
  if (schema.additionalProperties === false) for (const key of Object.keys(object)) if (!(key in schema.properties)) throw new Error(`Structured output has unexpected field: ${key}`);
  for (const [key, descriptor] of Object.entries(schema.properties)) {
    if (!(key in object)) continue;
    const actual = Array.isArray(object[key]) ? "array" : object[key] === null ? "object" : typeof object[key];
    if (actual !== descriptor.type) throw new Error(`Structured output field ${key} must be ${descriptor.type}.`);
  }
}

export function parseAndValidateResponse(response: AIResponse, schema: JsonSchema): Record<string, unknown> {
  let value = response.structuredOutput;
  if (!value) {
    try { value = JSON.parse(response.outputText) as Record<string, unknown>; } catch { throw new Error("AI response is not valid JSON."); }
  }
  validateStructuredOutput(value, schema);
  return value;
}
