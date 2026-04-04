import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dish = searchParams.get("dish") ?? "今日のズボラ飯";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 16 }}>🍳</div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#c2410c",
            textAlign: "center",
            padding: "0 40px",
          }}
        >
          {dish}
        </div>
        <div style={{ fontSize: 24, color: "#9a3412", marginTop: 16 }}>
          今あるもので · 買い出し不要
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 18,
            color: "#ea580c",
            fontWeight: 600,
          }}
        >
          パシャめし
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
