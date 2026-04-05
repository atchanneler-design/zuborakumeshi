import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { Ingredient, Seasoning } from "@/lib/types";
import { checkLimit } from "@/lib/rate-limit";
import { getClientIP } from "@/lib/get-ip";

const client = new Anthropic();

const SYSTEM_PROMPT = `あなたは、仕事に疲れ果てた「限界社会人」を救済する、究極の「ズボラクめし」を提案するAIです。
「とにかく楽に、洗い物を極限まで減らし、今あるものだけで生き延びる」ことを信条としてください。

【3大優先調理法と分散ルール】
以下の3つの調理法を、主菜5品の中で必ず1つ以上は含むように分散させてください。
1. 🥘レンジのみ：容器一つ、レンジだけで完結。
2. 🍳ワンパン：フライパンまたは鍋1つ、そのまま食卓へ出せる勢いの料理。
3. ❄️非加熱（のせる・和えるだけ）：切って混ぜるだけ、または既製品をのせるだけの究極。

【限界社会人特化ルール】
・計量器を使わせない：「大さじ1」ではなく「だいたい1周」「ティースプーン山盛り1杯」など、直感的な表現を推奨。
・グラム数を聞かない：食材の量は「1/2個」「1枚」「ひとつかみ」など、目分量で完結する指示にしてください。
・「包丁・まな板」を極力使わせない：手でちぎる、キッチンバサミで切る、ピーラーで削る等。
・手順は最大3ステップ。

必ずJSON形式のみを返してください。
形式：
{
  "main": [
    {
      "title": "料理名",
      "description": "「限界なあなたへの一言」と「調理法一言」を添えて",
      "steps": ["手順1", "手順2"],
      "usedIngredientNames": ["使用食材"],
      "tags": ["🥘レンジのみ", "❄️非加熱", "🍳ワンパン", "✂️包丁不要" から選択]
    }
  ],
  "side": [],
  "soup": []
}
※調味料は基本のもの（醤油、味噌、塩、砂糖、マヨなど）のみを使用。`;

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
