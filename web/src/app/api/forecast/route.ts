import { runEngine } from "@/lib/engine";
import type { MonthPoint } from "@/lib/types";

/** Trains the AQUACAST engine models on the posted monthly series and returns a full analytics bundle. */
export async function POST(req: Request) {
  let body: { points?: MonthPoint[]; label?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const points = body.points;
  if (!Array.isArray(points) || points.length > 600) return Response.json({ error: "Send 24 to 600 monthly points." }, { status: 400 });
  for (const p of points) {
    if (typeof p?.month !== "string" || !/^\d{4}-\d{2}$/.test(p.month) || typeof p.units !== "number" || !isFinite(p.units) || p.units < 0)
      return Response.json({ error: `Invalid point: ${JSON.stringify(p).slice(0, 80)}` }, { status: 400 });
  }
  try {
    return Response.json(runEngine(points, String(body.label ?? "Uploaded data").slice(0, 120)));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Forecast failed" }, { status: 422 });
  }
}
