import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const result: Record<string, unknown> = {
    keySet: !!key,
    keyPrefix: key ? key.slice(0, 8) + "..." : null,
  };

  if (!key) {
    return NextResponse.json({ ...result, step: "key_missing" }, { status: 500 });
  }

  // テキストのみで Gemini 疎通確認
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const res = await model.generateContent(['返答は "OK" のみ']);
    result.textTest = res.response.text().trim().slice(0, 20);
    result.step = "text_ok";
    return NextResponse.json(result);
  } catch (e) {
    result.step = "text_failed";
    result.error = e instanceof Error ? e.message.slice(0, 200) : String(e);
    return NextResponse.json(result, { status: 500 });
  }
}
