import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// APIキーの確認（サーバーサイドで実行されるため process.env を参照）
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

const SYSTEM_PROMPT = `あなたは冷蔵庫の写真から食材を読み取るアシスタントです。
画像を見て、含まれる食材・食品のリストをJSONのみで返してください。
挨拶文・説明文は一切不要です。以下の形式で返してください：
[{"name":"食材名","amount":"数値（不明なら1）","unit":"単位（個、g、本、枚、ml、1パック、等。不明なら「個」）"}]`;

export async function POST(req: NextRequest) {
  const { imageBase64s }: { imageBase64s: string[] } = await req.json();

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
      "これら冷蔵庫の中（各段、野菜室、ドアポケット、冷凍庫など）を解析し、入っている食材・調味料・食品の名前、大体の量、単位をリストアップしてください。"
    ]);

    const raw = result.response.text();
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ ingredients: parsed });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: "画像解析に失敗しました" }, { status: 500 });
  }
}
