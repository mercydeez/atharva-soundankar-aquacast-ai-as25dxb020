import { convertToModelMessages, createUIMessageStreamResponse, streamText, toUIMessageStream, type UIMessage } from "ai";
import { google, type GoogleLanguageModelOptions } from "@ai-sdk/google";

export const maxDuration = 60;

const SYSTEM = `You are AQUACAST AI Copilot, a demand-forecasting analyst for a beverage company launching a new flavoured-water product.
Ground every statement in the ANALYTICS JSON supplied below. It is computed by the app from the dataset currently loaded.
Rules:
- Use only numbers that appear in the JSON or simple arithmetic on them; never invent sales, metrics or forecasts.
- Say which dataset you are interpreting and its latest observation month. If it is the USDA demo, state that it is category-level proxy data that ends in 2023, not live sales of the new product.
- Explain trend and seasonality, compare models with MAPE and WAPE, interpret the 3-month forecast and its interval, and give concrete production and distribution recommendations.
- Be explicit about uncertainty, missing data and model limitations. If a question cannot be answered from the JSON, say so.
- Be concise and use short paragraphs or bullet points. Format large numbers as millions (M) where helpful.`;

export async function POST(req: Request) {
  const { messages, context }: { messages: UIMessage[]; context?: unknown } = await req.json();
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json({ fallback: true, error: "No Gemini API key is configured on the server." }, { status: 503 });
  }
  const ctx = JSON.stringify(context ?? {}).slice(0, 60000);
  const result = streamText({
    model: google(process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"),
    instructions: `${SYSTEM}\n\nANALYTICS JSON:\n${ctx}`,
    messages: await convertToModelMessages(messages.slice(-12)),
    providerOptions: { google: { thinkingConfig: { thinkingLevel: "low" } } satisfies GoogleLanguageModelOptions },
    abortSignal: AbortSignal.timeout(50_000),
    onError: ({ error }) => console.error("[chat] Gemini error:", error instanceof Error ? `${error.name}: ${error.message}` : error),
  });
  return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) });
}
