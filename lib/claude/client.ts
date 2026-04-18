import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-5";

export async function structuredChat<T>(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  schema: z.ZodType<T>,
  systemPrompt: string,
): Promise<T> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in Claude response");
  }

  const parsed: unknown = JSON.parse(jsonMatch[0]);
  return schema.parse(parsed);
}

export async function structuredQuery<T>(
  prompt: string,
  schema: z.ZodType<T>,
  systemPrompt?: string
): Promise<T> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      systemPrompt ??
      "You are a helpful stadium concierge assistant. Always respond with valid JSON matching the requested schema.",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in Claude response");
  }

  const parsed: unknown = JSON.parse(jsonMatch[0]);
  return schema.parse(parsed);
}
