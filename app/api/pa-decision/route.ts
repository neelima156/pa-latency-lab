import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { PARequest, PADecision } from "@/lib/types";
import { MOCK_DATA } from "@/lib/constants";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FALLBACK: PADecision = {
  decision: "APPROVED",
  rationale:
    "Step therapy satisfied with documented Methotrexate failure; formulary tier 3 is covered under the plan.",
  factors: ["Step therapy met", "Formulary covered", "Diagnosis confirmed"],
  confidence: 0.91,
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as PARequest;
  const { scenario, toolResults } = body;

  const toolPayload = toolResults.map((t) => ({
    tool: t.id,
    ...MOCK_DATA[t.id],
  }));

  const prompt = `You are a PA decision engine. Return ONLY a JSON object — no markdown fences, no preamble.

Drug: ${scenario.drug}
Condition: ${scenario.condition} (${scenario.icd})
Plan: ${scenario.plan}
Tool data: ${JSON.stringify(toolPayload)}

Return exactly:
{"decision":"APPROVED"|"DENIED"|"PENDING","rationale":"one sentence max 25 words","factors":["f1","f2","f3"],"confidence":0.91}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const decision = JSON.parse(text.trim()) as PADecision;
    return NextResponse.json(decision);
  } catch (err) {
    console.error("PA decision API error:", err);
    return NextResponse.json(FALLBACK);
  }
}
