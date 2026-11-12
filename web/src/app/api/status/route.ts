import { connection } from "next/server";

export async function GET() {
  await connection(); // evaluate at request time so a newly added key is detected
  return Response.json({
    llmConfigured: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    provider: "Google Gemini",
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  });
}
