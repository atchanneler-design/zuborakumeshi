"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center max-w-lg mx-auto px-6 py-12 space-y-16">
      {/* ヒーローセクション */}
      <section className="text-center space-y-8 pt-8">
        <div className="relative inline-block group">
          <div className="text-7xl animate-bounce drop-shadow-2xl">🍳</div>
          <div className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">AI</div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter italic">
            ズボラク<span className="text-accent underline decoration-4 underline-offset-4">めし</span>
          </h1>
          <p className="text-sm font-bold text-gray-500 leading-relaxed max-w-[280px] mx-auto">
            冷蔵庫をパシャっと撮るだけ。<br/>
            <span className="text-gray-900">「洗い物最小限 × 爆速手順」</span>な<br/>
            最強のズボラ献立をAIが提案。
          </p>
        </div>

        <div className="pt-4">
          <button
            onClick={() => router.push("/fridge")}
            className="w-full bg-accent text-white font-black py-6 rounded-[2.5rem] text-lg shadow-2xl shadow-accent/40 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span className="text-2xl">📸</span>
            <span>撮影して献立を決める</span>
          </button>
          <p className="mt-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">
            No shopping needed • Snap & Decide
          </p>
        </div>
      </section>

      {/* コンセプトセクション */}
      <section className="w-full space-y-6">
        <div className="premium-card p-8 space-y-8">
          <div className="space-y-2">
            <h2 className="text-xs font-black text-accent uppercase tracking-widest">Concept</h2>
            <p className="text-xl font-black text-gray-800 leading-tight">
              自炊の「面倒」を、<br/>AIがすべて肩代わり。
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex gap-4">
              <div className="flex-none w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-xl">🧼</div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-gray-800">洗い物を極限まで減らす</h3>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  ボウル1つ、レンジのみ、フライパンそのまま。AIが洗い物の少なさを計算して提案します。
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-none w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-xl">⚡</div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-gray-800">買い物には行かない</h3>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  冷蔵庫の「今あるもの」と「基本の調味料」だけで作れる。追加の買い出しは不要です。
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-none w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-xl">🧠</div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-gray-800">献立に迷わない</h3>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  写真はまとめて撮影OK。AIが食材を瞬時に解析し、あなたに最適な組み合わせを選びます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO/Footer セクション */}
      <footer className="w-full pb-12 text-center space-y-6 opacity-30">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent w-full" />
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-400">
            ズボラクめし - 冷蔵庫解析型 献立提案AIツール
          </p>
          <p className="text-[9px] text-gray-400 leading-relaxed px-4">
            AIが冷蔵庫の写真を解析し、洗い物が少なく、調理が極めて簡単なレシピを提案します。
            一人暮らし、共働き、忙しいズボラなあなたの自炊を全力でサポート。
          </p>
        </div>
      </footer>
    </div>
  );
}
