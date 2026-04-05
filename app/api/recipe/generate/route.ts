import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { Ingredient, Seasoning } from "@/lib/types";
import { checkLimit } from "@/lib/rate-limit";
import { getClientIP } from "@/lib/get-ip";

const client = new Anthropic();

const SYSTEM_PROMPT = `あなたは、深夜に帰宅した「限界社会人」を救う「ズボラ飯」提案AIです。
「とにかく楽に、洗い物を極限まで減らし、今ある食材だけで生き延びる」ことが信条です。

━━ 使える食材・調味料 ━━
以下のリストにあるものだけを使ってください。
リストにない食材・調味料は一切使わないこと。

━━ 量の定義 ━━
・少量 = 1回使い切れる程度（大切に使う）
・適量 = 2〜3回使える量（普通に使う）
・大量 = 気にせず使っていい量

━━ 絶対ルール ━━
1. ⚠️限界マークの食材は必ず主菜の1品目に使うこと。残りでも可能な限り消費する。
2. 1ステップ = 1動作のみ（「切る」「入れる」「チンする」）。複数動作をまとめること禁止。
3. 最大3ステップで完結するレシピのみ採用。
4. 包丁・まな板は使わない（手でちぎる・キッチンバサミ・ピーラーのみ）。
5. 計量スプーンは使わない（「だいたい1周」「ひとつかみ」などの感覚表現のみ）。
6. 少量の食材を複数レシピで大量消費しない。

━━ 調理法バランス（主菜がONの場合のみ適用） ━━
主菜5品の中で以下を必ず1品以上ずつ含めること。
🥘 レンジのみ：容器1つ、レンジだけで完結
🍳 ワンパン：フライパンまたは鍋1つのみ
❄️ 非加熱：混ぜる・のせるだけ

━━ 出力前の自問 ━━
「料理が苦手で包丁を持ちたくない人が、深夜23時に帰宅した状態で本当に1人で3ステップ以内に作れるか？」
→ NOなら作り直す。

━━ 出力形式 ━━
必ずJSON形式のみを返すこと。前置き・説明文・マークダウン記号は一切不要。
形式：
{
  "note": "（品数不足の場合のみ記載、通常は省略）",
  "main": [
    {
      "name": "料理名",
      "method": "🥘レンジ" | "🍳ワンパン" | "❄️非加熱",
      "uses_priority": true | false,
      "steps": ["ステップ1", "ステップ2", "ステップ3"],
      "ingredients_used": ["食材名"],
      "seasonings_used": ["調味料名"]
    }
  ],
  "side": [
    {
      "name": "料理名",
      "method": "🥘レンジ" | "🍳ワンパン" | "❄️非加熱",
      "estimated_cost": 推定原価(数値),
      "steps": ["ステップ1", "ステップ2"],
      "ingredients_used": ["食材名"],
      "seasonings_used": ["調味料名"]
   }
  ],
  "soup": [
    {
      "name": "料理名",
      "method": "🥘レンジ" | "🍳ワンパン",
      "estimated_cost": 推定原価(数値),
      "steps": ["ステップ1", "ステップ2"],
      "ingredients_used": ["食材名"],
      "seasonings_used": ["調味料名"]
    }
  ]
}`;

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
    .map((i) => `・${i.name}: ${i.amount}${i.priority ? " ⚠️限界" : ""}`)
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
          content: `【食材】:\n${ingredientText}\n\n【調味料】:\n${seasoningText}\n\n【分量】:\n${servingSize === "多め" ? "2人前（弁当込み）" : "1人分"}\n\n【提案する品数】:\n${menuRequestText}\n\n上記設定に合わせて、各カテゴリのレシピ案を提案してください。`,
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
