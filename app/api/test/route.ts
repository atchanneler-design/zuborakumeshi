import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic();

export async function POST() {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 64,
    messages: [{ role: "user", content: "Hello! Reply with just: OK" }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  return NextResponse.json({ ok: true, reply: text });
}
