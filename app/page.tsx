"use client";

import { useRouter } from "next/navigation";
import { useFridgeStore } from "@/store/fridgeStore";
import { useHasHydrated } from "@/lib/useHasHydrated";

function HPGauge() {
  return (
    <div className="flex flex-col items-end gap-1 scale-75 origin-right">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-red-500 animate-pulse">HP 1 / 100</span>
        <div className="w-32 h-2.5 bg-gray-200 rounded-full overflow-hidden border border-gray-300 shadow-inner">
          <div className="w-[1%] h-full bg-red-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function BackgroundMonologues() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none opacity-[0.03]">
      <div className="absolute top-[10%] -left-10 text-6xl font-black -rotate-12 whitespace-nowrap">
        洗い物は、明日やる。 洗い物は、明日やる。
      </div>
      <div className="absolute top-[40%] -right-20 text-7xl font-black rotate-6 whitespace-nowrap text-accent">
        コンビニすら、遠い。 コンビニすら、遠い。
      </div>
      <div className="absolute bottom-[20%] -left-5 text-5xl font-black -rotate-3 whitespace-nowrap">
        もう、一歩も動けない。 もう、一歩も動けない。
      </div>
      <div className="absolute top-[70%] left-[20%] text-4xl font-black rotate-12 whitespace-nowrap text-accent">
        脳死でOK。 脳死でOK。
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();

  if (!hasHydrated) return null;

  return (
    <div className="min-h-screen flex flex-col items-center max-w-lg mx-auto px-6 py-12 space-y-16 relative bg-background/50">
      <BackgroundMonologues />

      {/* ヘッダー */}
      <header className="w-full flex justify-between items-center z-10">
        <div className="text-xl font-black text-gray-900 tracking-tighter italic">ズボラクめし</div>
        <HPGauge />
      </header>
      
      {/* ヒーローセクション */}
      <section className="text-center space-y-8 pt-4 z-10">
        
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex flex-col items-center leading-tight">
            <span className="text-sm font-bold text-gray-400 mb-2">もう、一歩も外に出たくない夜の。</span>
            <span>冷蔵庫を撮るだけ、</span>
            <span className="text-accent">限界自炊。</span>
          </h1>
          <p className="text-xs font-bold text-gray-500 leading-relaxed max-w-[280px] mx-auto italic">
            HP残り1。それでも「外食は高いしな...」と<br/>
            最後の力を振り絞って悩むあなたへ。
          </p>
        </div>

        <div className="pt-4 flex flex-col items-center">
          <button
            onClick={() => router.push("/fridge")}
            className="w-full bg-accent text-white font-black py-6 rounded-[2.5rem] text-lg shadow-2xl shadow-accent/40 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
          >
            <span className="text-2xl">📸</span>
            <span>とりあえず冷蔵庫を撮る</span>
          </button>
          <p className="mt-4 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
            判断力ゼロ ・ 生存優先 ・ 買い物放棄
          </p>
        </div>
      </section>

      {/* コンセプトセクション */}
      <section className="w-full space-y-6 z-10">
        <div className="premium-card p-8 space-y-8 bg-white/70 backdrop-blur-md">
          <div className="space-y-2 text-center">
            <p className="text-xl font-black text-gray-800 leading-tight">
              あなたの「限界」に、<br/>AIがそっと寄り添う。
            </p>
          </div>

          <div className="grid gap-8">
            <div className="flex gap-4 group">
              <div className="flex-none w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🧼</div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-gray-800 italic">洗い物は、明日やりな。</h3>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  フライパンのまま、レンジのみ。洗い物を増やさないことを最優先にした「逃げ道」を提案します。
                </p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="flex-none w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">⚡</div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-gray-800 italic">コンビニすら、遠い。</h3>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  今、目の前にある「余り物」だけで成立するレシピを。玄関のドアを開ける気力すら不要です。
                </p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="flex-none w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🧠</div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-gray-800 italic">脳死でOK。</h3>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  写真はまとめて撮るだけ。献立を考えるという「最後のひと絞り」をAIが肩代わりします。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer セクション */}
      <footer className="w-full pb-12 text-center space-y-6 opacity-30 z-10">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent w-full" />
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-400">
            ズボラクめし - 限界社会人のためのサバイバルツール
          </p>
          <p className="text-[9px] text-gray-400 leading-relaxed px-4">
            冷蔵庫の中身を解析し、最小限の工数で最大級の「救済」を。<br/>
            私たちは、戦い疲れたあなたの自炊を、一歩も動かずに応援します。
          </p>
        </div>
      </footer>
    </div>
  );
}
