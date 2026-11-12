import { connection } from "next/server";

// TEMPORARY diagnostics for the Gemini connection. Returns timings and status codes only, never the key.
export async function GET() {
  await connection();
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "";
  const base = "https://generativelanguage.googleapis.com/v1beta";
  const out: Record<string, unknown> = { keyLength: key.length, keyHasWhitespace: /\s/.test(key) };
  const t0 = Date.now();
  try {
    const r = await fetch(`${base}/models?pageSize=200`, { headers: { "x-goog-api-key": key.trim() }, signal: AbortSignal.timeout(15000) });
    const j = await r.json();
    out.list = { status: r.status, ms: Date.now() - t0, flash: (j.models ?? []).map((m: { name: string }) => m.name).filter((n: string) => n.includes("flash")).slice(0, 30), error: j.error?.message };
  } catch (e) {
    out.list = { error: String(e), ms: Date.now() - t0 };
  }
  for (const model of [process.env.GEMINI_MODEL || "gemini-3.6-flash", "gemini-flash-latest"]) {
    const t1 = Date.now();
    try {
      const r = await fetch(`${base}/models/${model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": key.trim(), "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Reply with the single word OK." }] }] }),
        signal: AbortSignal.timeout(20000),
      });
      const j = await r.json();
      out[model] = { status: r.status, ms: Date.now() - t1, text: j.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("").slice(0, 40), error: j.error?.message?.slice(0, 200) };
    } catch (e) {
      out[model] = { error: String(e), ms: Date.now() - t1 };
    }
  }
  return Response.json(out);
}
