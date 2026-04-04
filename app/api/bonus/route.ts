import { NextRequest } from "next/server";
import { addBonusCount } from "@/lib/rate-limit";
import { getClientIP } from "@/lib/get-ip";

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const result = await addBonusCount(ip);
  return Response.json(result);
}
