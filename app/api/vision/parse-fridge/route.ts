import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `あなたは冷蔵庫の写真から食材を読み取るアシスタントです。
画像を見て、含まれる食材・食品のリストをJSONのみで返してください。
挨拶文・説明文は一切不要です。以下の形式で返してください：
[{"name":"食材名","amount":"数値（不明なら1）","unit":"単位（個、g、本、枚、ml、1パック、等。不明なら「個」）"}]`;

export async function POST(req: NextRequest) {
  const { imageBase64s }: { imageBase64s: string[] } = await req.json();

  if (!imageBase64s || imageBase64s.length === 0) {
    return NextResponse.json({ error: "imageBase64s is required" }, { status: 400 });
  }

  const content: any[] = [
    { type: "text", text: "これらの画像（冷蔵庫の各段、野菜室、冷凍庫など）に含まれる食材をJSONで名出ししてください。" },
  ];

  for (const base64 of imageBase64s) {
    const [header, data] = base64.split(",");
    const mediaType = header.match(/:(.*?);/)?.[1] as any;
    content.push({
      type: "image",
      source: { type: "base64", media_type: mediaType ?? "image/jpeg", data },
    });
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1536,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "[]";
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

  return NextResponse.json({ ingredients: parsed });
}
