import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { Ingredient, Seasoning } from "@/lib/types";
import { checkLimit } from "@/lib/rate-limit";
import { getClientIP } from "@/lib/get-ip";

const client = new Anthropic();

const SYSTEM_PROMPT = `あなたは、冷蔵庫の在庫と今ある調味料だけで作れる、究極の「ズボラクめし」を提案するAIです。
「とにかく楽に、洗い物を極限まで減らす」ことを信条とし、以下の3つの調理法を最優先してください。

【3大優先調理法】
1. 🥘レンジのみ：電子レンジだけで完結する料理。火を使いません。
2. 🍳ワンパン：フライパン1つ、または鍋1つで完結する料理。
3. ❄️非加熱（のせる・和えるだけ）：TKG、納豆丼、冷奴の進化系など、調理工程がほぼゼロのもの。

【ズボラ特化ルール】
・「包丁・まな板」を極力使わせない工夫（手でちぎる、キッチンバサミで切る、そのまま投入する等）を手順に盛り込んでください。
・手順は最大3ステップ程度にまとめてください。
・主菜については、5件中2〜3件は「レンジのみ」または「のせるだけ」の爆速メニューを含めてください。
・各料理には、属性タグ（🥘レンジのみ, 🍳ワンパン, ❄️非加熱, ✂️包丁不要 等）を必ず2〜3個付与してください。

必ずJSON形式のみを返してください。
フォーマット：
{
  "main": [
    {
      "title": "料理名",
      "description": "一言説明（例：レンジで3分！、ご飯にのせるだけ！）",
      "steps": ["手順1", "手順2"],
      "usedIngredientNames": ["使用食材"],
      "tags": ["🥘レンジのみ", "✂️包丁不要"],
      "searchLinks": [{ "label": "Webで検索", "query": "料理名 レシピ" }]
    }
  ],
  "side": [],
  "soup": []
}

※指定されていないカテゴリは空配列 [] にしてください。
※ searchLinksのqueryは「主に使用する食材 料理法」など検索しやすいキーワードにしてください。`;

export async function POST(req: NextRequest) {
  const { ingredients, servingSize, seasonings, dishTypes }: { 
    ingredients: Ingredient[]; 
    servingSize: string; 
    seasonings: Seasoning[];
    dishTypes: string[];
  } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Recipe API key is not configured" }, { status: 500 });
  }

  const ip = getClientIP(req);
  const { allowed, remaining } = await checkLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "RATE_LIMIT_EXCEEDED", remaining: 0 },
      { status: 429 }
    );
  }

  if (!ingredients || ingredients.length === 0) {
    return NextResponse.json({ error: "食材リストが空です" }, { status: 400 });
  }

  const ingredientText = ingredients
    .map((i) => `・${i.name}（${i.amount}${i.unit}）${i.priority ? "【消費優先！】" : ""}`)
    .join("\n");

  const seasoningText = seasonings
    .filter(s => s.checked)
    .map(s => s.name)
    .join("、");

  const menuRequestText = `主菜: 5品${dishTypes.includes("side") ? "、副菜: 3品" : ""}${dishTypes.includes("soup") ? "、汁物: 3品" : ""}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `【提案依頼】: ${menuRequestText}\n【人数・ボリューム】: ${servingSize}\n【利用可能な食材】:\n${ingredientText}\n\n【利用可能な調味料】:\n${seasoningText}\n\n上記設定に合わせて、各カテゴリのレシピ案を提案してください。`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { main: [], side: [], soup: [] };

    return NextResponse.json({ ...parsed, remaining });
  } catch (error) {
    console.error("Claude API Error:", error);
    return NextResponse.json({ error: "レシピの生成に失敗しました" }, { status: 500 });
  }
}
