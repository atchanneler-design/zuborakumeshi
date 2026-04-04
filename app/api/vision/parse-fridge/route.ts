import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "");

const SYSTEM_PROMPT = `あなたは冷蔵庫の写真から食材を読み取るアシスタント「ズボラクめし」の実働AIです。
画像を見て、含まれる食材・食品のリストをJSONのみで返してください。
挨拶文・説明文は一切不要です。以下の形式で返してください：
[{"name":"食材名","amount":"数値（不明なら1）","unit":"単位（個、g、本、枚、ml、1パック、等。不明なら「個」）"}]`;

export async function POST(req: NextRequest) {
  const { imageBase64s }: { imageBase64s: string[] } = await req.json();

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json({ error: "Vision API key is not configured" }, { status: 500 });
  }

  if (!imageBase64s || imageBase64s.length === 0) {
    return NextResponse.json({ error: "画像データが必要です" }, { status: 400 });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imageParts = imageBase64s.map((base64) => {
      const [header, data] = base64.split(",");
      const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
      return {
        inlineData: {
          data,
          mimeType,
        },
      };
    });

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      ...imageParts,
      "これら冷蔵庫の中を解析し、入っている食材・食品をリストアップしてください。"
    ]);

    const raw = result.response.text();
    // より堅牢なJSON抽出
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", raw);
      throw new Error("解析結果の形式が正しくありません");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ingredients: parsed });
  } catch (error) {
    console.error("Vision Analyze Error:", error);
    const message = error instanceof Error ? error.message : "画像解析に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
