"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, Send, Sparkles, User } from "lucide-react";
import { useData } from "@/components/data-provider";
import { Note, PageHeader, Panel } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { llmContext, monthLabel } from "@/lib/demo";
import { deterministicInsights } from "@/lib/insights";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Summarise the latest data and the 3-month forecast for the production team.",
  "Which model should we trust and why? Compare MAPE and WAPE.",
  "How strong is seasonality, and when should we build stock?",
  "What are the biggest risks and limitations of this forecast?",
];

type Status = { llmConfigured: boolean; model: string; provider: string } | null;

/** Keyed by the dataset timestamp, so a new dataset starts a fresh conversation grounded in new numbers. */
export default function AssistantPage() {
  const { analytics } = useData();
  return <Assistant key={analytics.loadedAt} />;
}

function Assistant() {
  const { analytics: a } = useData();
  const [status, setStatus] = useState<Status>(null);
  const [input, setInput] = useState("");
  const [fallback, setFallback] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status: chatStatus, error } = useChat({ transport: new DefaultChatTransport({ api: "/api/chat" }) });

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => setStatus(null));
  }, []);
  useEffect(() => {
    // block body on purpose: scrollIntoView can return a Promise, which must not become the effect cleanup
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, fallback]);

  function ask(text: string) {
    if (!text.trim()) return;
    if (status && !status.llmConfigured) {
      const ins = deterministicInsights(a);
      setFallback(`${ins.seasonality}\n\n${ins.bestModel}\n\n${ins.recommendations.join(" ")}\n\n${ins.uncertainty}`);
      setInput("");
      return;
    }
    sendMessage({ text }, { body: { context: llmContext(a) } });
    setInput("");
  }

  const busy = chatStatus === "submitted" || chatStatus === "streaming";
  return (
    <>
      <PageHeader eyebrow="AI Copilot" title="Ask about your demand forecast" description="A Gemini-powered analyst that reads the structured results of the dataset currently loaded in the app, not a scripted chatbot." />
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Panel className="flex min-h-[560px] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto pb-4">
            {messages.length === 0 && !fallback && (
              <div className="grid place-items-center py-14 text-center">
                <Sparkles className="mb-3 size-8 text-[var(--teal)]" />
                <p className="font-medium">Grounded in {a.source === "demo" ? "the USDA demo results" : "your uploaded data"}</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">Latest observation {monthLabel(a.meta.last_month)}. Every answer is generated from the computed metrics and forecasts sent with your question.</p>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground")}>
                  {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                </span>
                <div className={cn("max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed", m.role === "user" ? "bg-primary text-primary-foreground" : "border bg-muted/40")}>
                  {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
                </div>
              </div>
            ))}
            {fallback && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-800">Fallback: rule-based summary, not an LLM response (no Gemini key configured on the server)</p>
                {fallback}
              </div>
            )}
            {busy && <p className="text-xs text-muted-foreground">Gemini is analysing the data...</p>}
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">The AI request failed. Check the server key and model, then try again.</p>}
            <div ref={end} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2 border-t pt-4">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about trends, models, the forecast or production plans..." className="flex-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--teal)]/30" disabled={busy} />
            <Button type="submit" disabled={busy || !input.trim()} className="h-auto px-4"><Send className="size-4" /></Button>
          </form>
        </Panel>
        <div className="space-y-5">
          <Panel title="Connection">
            <p className="text-sm">
              {status == null ? "Checking..." : status.llmConfigured ? <>Live: <b>{status.provider}</b> · {status.model}</> : <span className="text-amber-700">No API key on the server. Answers fall back to a labelled rule-based summary.</span>}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">The key is stored only as a server environment variable and never sent to the browser.</p>
          </Panel>
          <Panel title="Try asking">
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)} disabled={busy} className="w-full rounded-lg border bg-white px-3 py-2 text-left text-xs leading-relaxed hover:border-[var(--teal)]">{s}</button>
              ))}
            </div>
          </Panel>
          <Note tone="amber">&quot;Real-time&quot; here means the latest data loaded into the app ({monthLabel(a.meta.last_month)}). There is no live external sales feed.</Note>
        </div>
      </div>
    </>
  );
}
