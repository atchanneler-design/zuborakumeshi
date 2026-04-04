import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl mb-4">🍳</div>
        <h1 className="text-4xl font-extrabold text-accent mb-2 tracking-tighter italic">
          ズボラクめし
        </h1>
        <p className="text-gray-400 text-xs mb-8 leading-relaxed font-medium">
          冷蔵庫をパシャっと撮るだけ。<br/>
          残り物だけで、爆速で今夜の献立を決めよう。
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/fridge"
            className="bg-accent hover:bg-accent/90 text-white font-black py-5 rounded-[2rem] text-lg shadow-xl shadow-accent/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <span>📸</span> 撮影して決める
          </Link>
          <Link
            href="/fridge"
            className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-5 rounded-2xl text-lg shadow border border-gray-200 flex items-center justify-center gap-2"
          >
            <span>🧾</span> レシートを撮る
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-8">買い出し不要 · 今あるもので · 即決定</p>
      </div>
    </div>
  );
}
