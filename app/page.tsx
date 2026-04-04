import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl mb-4">🍳</div>
        <h1 className="text-4xl font-extrabold text-orange-600 mb-2 tracking-tight">
          パシャめし
        </h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          冷蔵庫をパシャっと撮るだけ。<br/>
          今ある食材と調味料で、今日のご飯を決めよう。
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/fridge"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-5 rounded-2xl text-lg shadow-md flex items-center justify-center gap-2"
          >
            <span>🧊</span> 冷蔵庫を撮る
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
