import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { Ingredient, Seasoning } from "@/lib/types";
import { checkLimit } from "@/lib/rate-limit";
import { getClientIP } from "@/lib/get-ip";

const client = new Anthropic();

const SYSTEM_PROMPT = `あなたは、冷蔵庫の在庫と「今ある調味料」だけで作れる、ズボラでも楽に作れる献立を提案するAI「ズボラクめし」です。
ユーザーが指定した【作るもの（主菜・副菜・汁物）】のカテゴリそれぞれについて、個別の料理案を以下の件数で提案してください。

【提案の件数】
- 主菜 (main): 5件
- 副菜 (side): 3件（指定された場合のみ）
- 汁物 (soup): 3件（指定された場合のみ）

【提案の条件】
1. 利用可能な食材のみを使用（買い出し不要）。
2. 出力された【利用可能な調味料】のみを使用。
3. すべてのレシピにおいて「洗い物が少なく済むこと（フライパン1つ、ボウル1つ、レンジのみ等）」および「手順が極めて簡単であること」を最優先してください。
4. 主菜、副菜、汁物はそれぞれ独立した料理として提案してください（セットメニューとしてのタイトルは不要です）。
5. 各料理には、それぞれ適切な「タグ」を2〜3個付与してください（例：⚡爆速, 🥗ヘルシー, 🧼洗い物少なめ, 🥘レンジのみ等）。

必ずJSON形式のみを返してください。
フォーマット：
{
  "main": [
    {
      "title": "料理名",
      "description": "一言説明",
      "steps": ["手順1", "手順2"],
      "usedIngredientNames": ["使用食材"],
      "tags": ["⚡爆速"],
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
