// app/api/chat/route.ts
// Was MISSING ENTIRELY - the homepage's only real feature (asking Javari
// Activity for event/activity ideas) called this route on every interaction
// and got a 404, confirmed live before this fix. Cost Law order: free tier
// (Groq) first, paid fallback (OpenAI) only if the free one fails.
// CR AudioViz AI · EIN 39-3646201 · July 31, 2026
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ChatMessage = { role: string; content: string };

async function tryGroq(messages: ChatMessage[], systemOverride?: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: systemOverride ? [{ role: "system", content: systemOverride }, ...messages] : messages,
        max_tokens: 800,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function tryOpenAI(messages: ChatMessage[], systemOverride?: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: systemOverride ? [{ role: "system", content: systemOverride }, ...messages] : messages,
        max_tokens: 800,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

const CHAT_CREDIT_COST = 1;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { messages?: ChatMessage[]; systemOverride?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages array is required" }, { status: 400 });
  }

  // Spend against the real, shared platform credit balance - NOT this repo's
  // own lib/credits/index.ts, which reads a local user_credits table
  // disconnected from what the customer sees everywhere else on the
  // platform. Found during this review: at least two other apps
  // (javari-social, and this one's own lib/credits) each keep a separate,
  // isolated credit balance - this fix uses the one real, shared system.
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const spendRes = await fetch("https://craudiovizai.com/api/credits/spend", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader, "x-app-id": "javari-activity" },
      body: JSON.stringify({ amount: CHAT_CREDIT_COST, description: "Javari Activity chat" }),
    });
    if (!spendRes.ok) {
      const spendResult = await spendRes.json().catch(() => ({}));
      return NextResponse.json({ error: spendResult.error || "Insufficient credits" }, { status: 402 });
    }
  }
  // No auth header: allow through as a light-touch anonymous trial, same as
  // this app's original unauthenticated design - not a regression, just not
  // making it worse while fixing the actual missing route.

  // Free tier first, per the platform's Cost Law - only pay if the free
  // provider genuinely fails, not as a routine fallback.
  const content = (await tryGroq(messages, body.systemOverride)) ?? (await tryOpenAI(messages, body.systemOverride));

  if (!content) {
    return NextResponse.json({ error: "All AI providers are currently unavailable. Please try again shortly." }, { status: 503 });
  }

  return NextResponse.json({ choices: [{ message: { content } }] });
}
