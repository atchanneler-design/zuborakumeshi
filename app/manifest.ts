import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ズボラクめし",
    short_name: "ズボラクめし",
    description: "冷蔵庫をパシャっと撮るだけで爆速で献立を提案するAIツール",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f97316", // accent color
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
