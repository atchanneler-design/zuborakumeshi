import { NextRequest } from "next/server";
import { peekLimit } from "@/lib/rate-limit";
import { getClientIP } from "@/lib/get-ip";

export async function GET(req: NextRequest) {
  const ip = getClientIP(req);
  const { remaining, bonusUsed } = await peekLimit(ip);
  return Response.json({ remaining, bonusUsed });
}
