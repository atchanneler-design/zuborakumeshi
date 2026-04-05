import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const PROMPT = `冷蔵庫の写真から「メインの食材（肉・魚・野菜・卵・乳製品・主食など）」のみを正確に読み取ってください。

【除外ルール - 以下のものはリストに含めないでください】
1. 調味料（塩、醤油、マヨネーズ、ケチャップ、チューブにんにく、ドレッシング等）
2. 飲み物（ビール、ジュース、水、コーヒー等）
3. お菓子、デザート（ヨーグルト、プリン、スナック菓子等）
4. 調理済みの惣菜、レトルト食品
5. 曖昧なカテゴリ名のみ（×野菜、×肉 ➔ ◯キャベツ、◯豚バラ肉 のように具体名で出すこと）

【出力形式】
JSONのみを返してください。挨拶・説明は不要。
形式: [{"name":"食材名","amount":数値,"unit":"単位（人前/個/g/本/枚/ml/袋/丁/缶等。不明なら個）"}]`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API key is not configured" }, { status: 500 });
  }

  const { imageBase64s }: { imageBase64s: string[] } = await req.json();

  if (!imageBase64s || imageBase64s.length === 0) {
    return NextResponse.json({ error: "画像データが必要です" }, { status: 400 });
  }

  try {
    const imageContents = imageBase64s.map((base64) => {
      const [header, data] = base64.split(",");
      const mediaType = (header.match(/:(.*?);/)?.[1] ?? "image/jpeg") as
        | "image/jpeg"
        | "image/png"
        | "image/gif"
        | "image/webp";
      return {
        type: "image" as const,
        source: { type: "base64" as const, media_type: mediaType, data },
      };
    });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            ...imageContents,
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "[]";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON in response:", raw);
      throw new Error("解析結果の形式が正しくありません");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ingredients: parsed });
  } catch (error) {
    console.error("Vision error:", error);
    const message = error instanceof Error ? error.message : "画像解析に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
