import Groq from "groq-sdk";
import { z } from "zod";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";

export async function structuredChat<T>(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  schema: z.ZodType<T>,
  systemPrompt: string,
): Promise<T> {
  const response = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in Groq response");
  }

  const parsed: unknown = JSON.parse(jsonMatch[0]);
  return schema.parse(parsed);
}

export async function structuredQuery<T>(
  prompt: string,
  schema: z.ZodType<T>,
  systemPrompt?: string,
): Promise<T> {
  const response = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "system",
        content:
          systemPrompt ??
          "You are a helpful stadium concierge assistant. Always respond with valid JSON matching the requested schema.",
      },
      { role: "user", content: prompt },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in Groq response");
  }

  const parsed: unknown = JSON.parse(jsonMatch[0]);
  return schema.parse(parsed);
}
