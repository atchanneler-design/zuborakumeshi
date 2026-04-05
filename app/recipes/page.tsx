"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFridgeStore } from "@/store/fridgeStore";
import type { RecipeResponse } from "@/lib/types";
import { getRandomComparison } from "@/lib/savingsUtils";
import { useHasHydrated } from "@/lib/useHasHydrated";

const LOADING_MESSAGES = [
  "AIも、今布団から出て考えています…",
  "「洗い物したくない」というあなたの深層心理を解析中…",
  "だいたい10秒くらいで終わります、知らんけど。",
  "なるべくフライパンを使わない方向で調整しています…",
  "「買い物に行く気力」を再起動中…",
  "「今日のご飯、何でもいい」という嘘を見抜いています…"
];

export default function RecipesPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const { ingredients, servingSize, seasonings, dishTypes, addSavings } = useFridgeStore();
  const [recipeData, setRecipeData] = useState<RecipeResponse | null>(null);
  const [savingsInfo, setSavingsInfo] = useState<{ target: string; savings: number; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"main" | "side" | "soup">("main");
  const [loading, setLoading] = useState(true);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [error, setError] = useState("");
  const [rateLimited, setRateLimited] = useState(false);
  const [bonusClaiming, setBonusClaiming] = useState(false);
  const [bonusGranted, setBonusGranted] = useState(false);

  const generateRecipes = useCallback(() => {
    setLoading(true);
    setError("");
    setRateLimited(false);
    fetch("/api/recipe/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients, servingSize, seasonings, dishTypes }),
    })
      .then(async (r) => {
        if (r.status === 429) { setRateLimited(true); return; }
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "レシピの生成に失敗しました");
        setRecipeData(data as RecipeResponse);
        
        // 節約額の計算と記録
        const info = getRandomComparison(servingSize);
        setSavingsInfo(info);
        addSavings(info.savings);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ingredients, servingSize, seasonings, dishTypes, addSavings]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    if (ingredients.length === 0) { router.replace("/fridge"); return; }
    generateRecipes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (recipeData && !dishTypes.includes(activeTab)) {
      const available = dishTypes.find(t => t === "main" || t === "side" || t === "soup");
      if (available) setActiveTab(available as "main" | "side" | "soup");
    }
  }, [recipeData, dishTypes, activeTab]);

  async function claimBonus() {
    setBonusClaiming(true);
    try {
      const response = await fetch("/api/bonus", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-3-5-haiku-20241022" })
      });
      const data = await response.json();
      if (data.success) setBonusGranted(true);
    } finally {
      setBonusClaiming(false);
    }
  }

  function openXShare(recipeTitle?: string) {
    const shareText = recipeTitle 
      ? `【限界自炊レポ】\n「${recipeTitle}」を作成！\n💰 ${savingsInfo?.target}との差額：+${savingsInfo?.savings.toLocaleString()}円\n今夜の私は叙々苑に行かなかったことで1万円稼いだも同然です。`
      : "ズボラクめしで資産防衛中！🍳\n冷蔵庫を撮るだけで爆速レシピ提案！";
    
    const text = encodeURIComponent(`${shareText}\n#ズボラクめし #限界社会人 #実質黒字`);
    const url = encodeURIComponent(window.location.origin);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-12 text-center">
        <div className="text-7xl animate-bounce mb-8">🍳</div>
        <h2 className="text-2xl font-black text-accent mb-3 tracking-tighter">ズボラクレシピを考え中...</h2>
        <div className="min-h-[60px] flex flex-col justify-center">
          <p className="text-gray-900 text-sm font-black leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-500 key={loadingMsgIdx}">
            {LOADING_MESSAGES[loadingMsgIdx]}
          </p>
        </div>
        <p className="text-gray-400 text-[10px] font-medium mt-8 opacity-60">
          洗い物少なめ、手順が簡単な<br/>最適な提案を抽出しています。
        </p>
      </div>
    );
  }

  if (rateLimited) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-6">🥲</div>
        <h2 className="text-xl font-black text-gray-900 mb-2 tracking-tighter">本日の無料利用（3回）を使い切りました</h2>
        <p className="text-xs text-gray-400 mb-8 leading-relaxed">
          Xでシェアすると+1回追加できます。<br/>明日またゼロから使えます。
        </p>
        {!bonusGranted ? (
          <div className="w-full max-w-xs space-y-3">
            <button
              onClick={() => openXShare()}
              className="w-full bg-black text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.737-8.84L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Xでシェアして+1回もらう
            </button>
            <button
              onClick={claimBonus}
              disabled={bonusClaiming}
              className="w-full bg-accent/10 text-accent font-black py-3 rounded-2xl text-sm disabled:opacity-50 active:scale-95 transition-all border border-accent/20"
            >
              {bonusClaiming ? "確認中..." : "シェアしました！+1回追加する"}
            </button>
          </div>
        ) : (
          <div className="w-full max-w-xs space-y-3">
            <p className="text-green-600 font-black text-sm bg-green-50 py-3 rounded-2xl border border-green-100">✓ +1回追加されました！</p>
            <button onClick={generateRecipes} className="w-full bg-accent text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
              🍳 レシピを生成する
            </button>
          </div>
        )}
        <button onClick={() => router.push("/fridge")} className="mt-6 text-gray-400 text-xs underline">← 食材リストに戻る</button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center gap-6 p-8">
        <p className="text-rose-600 font-bold text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-rose-100 italic">{error}</p>
        <button onClick={() => router.push("/fridge")} className="bg-foreground text-background px-8 py-4 rounded-2xl shadow-xl font-black text-xs active:scale-95 transition-all">
          ← やり直す
        </button>
      </div>
    );
  }

  const currentRecipes = recipeData?.[activeTab] ?? [];
  const tabs = [
    { id: "main", label: "主菜", icon: "🥩" },
    { id: "side", label: "副菜", icon: "🥗" },
    { id: "soup", label: "汁物", icon: "🥣" },
  ] as const;

  const nextTabMap: Record<string, "side" | "soup" | null> = {
    main: dishTypes.includes("side") ? "side" : (dishTypes.includes("soup") ? "soup" : null),
    side: dishTypes.includes("soup") ? "soup" : null,
    soup: null,
  };
  const nextTab = nextTabMap[activeTab];

  if (!hasHydrated) return null;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-40 flex flex-col">
      <header className="sticky top-0 bg-background/90 backdrop-blur-md z-40 px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-gray-400 shadow-sm active:scale-90 transition-transform">←</button>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tighter italic cursor-pointer" onClick={() => router.push("/")}>ズボラクめし</h1>
              <p className="text-[9px] font-black text-accent/60 uppercase tracking-widest">AIの提案結果</p>
            </div>
          </div>
          {recipeData?.remaining !== undefined && (
            <div className="glass-pill px-3 py-1 text-[9px] font-black text-gray-400">
              本日あと{recipeData.remaining}回
            </div>
          )}
        </div>
        {dishTypes.length > 1 && (
          <nav className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
            {tabs.map((tab) => dishTypes.includes(tab.id as "main" | "side" | "soup") && (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center py-2 transition-all rounded-xl ${activeTab === tab.id ? "bg-white shadow-sm text-accent" : "text-gray-400 grayscale opacity-50"}`}>
                <span className="text-lg">{tab.icon}</span>
                <span className="text-[10px] font-black">{tab.label}</span>
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="px-6 flex-1 space-y-10">
        <div className="px-1 text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-1">{tabs.find(t => t.id === activeTab)?.label}の提案</h2>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em] italic">{tabs.find(t => t.id === activeTab)?.label}のズボラレシピ</p>
        </div>
        <div className="space-y-8">
          {currentRecipes.length === 0 ? (
            <div className="text-center py-12 text-gray-300 italic text-sm">提案された{tabs.find(t => t.id === activeTab)?.label}はありません</div>
          ) : (
            currentRecipes.map((recipe, idx) => (
              <article key={idx} className="premium-card p-8 relative overflow-hidden transition-all">
                <div className="flex flex-wrap gap-2 mb-4">
                  {(recipe.tags ?? []).map(tag => (
                    <span key={tag} className="bg-orange-50 text-accent text-[9px] font-black px-2.5 py-1 rounded-full border border-accent/10 tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight tracking-tighter italic">{recipe.title}</h3>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed font-medium">{recipe.description}</p>
                <div className="bg-white/50 rounded-[1.6rem] p-6 mb-8 border border-white/80">
                  <ol className="space-y-4">
                    {(recipe.steps ?? []).map((step, sIdx) => (
                      <li key={sIdx} className="flex gap-4">
                        <span className="flex-none w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[9px] font-black shadow-lg shadow-accent/20">{sIdx + 1}</span>
                        <p className="text-[12px] text-gray-800 font-bold leading-snug">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={`https://www.google.com/search?q=${encodeURIComponent((recipe.searchLinks ?? [])[0]?.query || recipe.title + " レシピ")}`}
                    target="_blank" rel="noopener noreferrer" 
                    className="flex-1 text-center bg-white border border-border text-gray-900 font-black text-[11px] py-4 rounded-2xl active:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    Webで検索 <span>→</span>
                  </a>
                  <button 
                    onClick={() => openXShare(recipe.title)}
                    className="flex-none bg-black text-white px-5 rounded-2xl active:scale-95 transition-all shadow-sm flex items-center justify-center"
                    title="Xにシェア"
                  >
                    <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.737-8.84L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </button>
                </div>
                <footer className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">食材:</span>
                    <p className="text-[8px] text-gray-300 font-black truncate max-w-[150px]">{(recipe.usedIngredientNames ?? []).join(" / ")}</p>
                  </div>
                  {savingsInfo && (
                    <div className="receipt-stamp flex flex-col items-center leading-none py-1">
                      <span className="text-[10px] whitespace-nowrap">+{savingsInfo.savings.toLocaleString()}円</span>
                      <span className="text-[6px] opacity-70 mt-0.5">{savingsInfo.target.split("（")[0]}との差</span>
                    </div>
                  )}
                </footer>
              </article>
            ))
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 z-40 bg-gradient-to-t from-background via-background to-transparent pt-12 pointer-events-none">
        {nextTab ? (
          <button onClick={() => { setActiveTab(nextTab); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="w-full bg-accent text-white font-black py-5 rounded-[2rem] text-base shadow-2xl shadow-accent/30 active:scale-[0.98] transition-all pointer-events-auto flex items-center justify-center gap-2">
            <span>次（{tabs.find(t => t.id === nextTab)?.label || ""}へ）</span><span className="text-xl">＞</span>
          </button>
        ) : (
          <button onClick={() => router.push("/fridge")} className="w-full bg-foreground text-background font-black py-5 rounded-[2rem] text-base shadow-xl active:scale-[0.98] transition-all pointer-events-auto flex items-center justify-center gap-2">
            <span>🍳 食材を選び直す</span>
          </button>
        )}
      </div>
    </div>
  );
}
