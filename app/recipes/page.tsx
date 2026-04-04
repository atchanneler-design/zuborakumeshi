"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFridgeStore } from "@/store/fridgeStore";
import type { Recipe, RecipeResponse } from "@/lib/types";

export default function RecipesPage() {
  const router = useRouter();
  const { ingredients, servingSize, seasonings, dishTypes } = useFridgeStore();
  const [recipeData, setRecipeData] = useState<RecipeResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"main" | "side" | "soup">("main");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ingredients.length === 0) {
      router.replace("/fridge");
      return;
    }
    fetch("/api/recipe/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients, servingSize, seasonings, dishTypes }),
    })
      .then((r) => r.json())
      .then((data: RecipeResponse) => {
        setRecipeData(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (recipeData && !dishTypes.includes(activeTab)) {
      const available = dishTypes.find(t => t === "main" || t === "side" || t === "soup");
      if (available) setActiveTab(available as any);
    }
  }, [recipeData, dishTypes, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-12 text-center">
        <div className="text-7xl animate-bounce mb-8">🍳</div>
        <h2 className="text-2xl font-black text-accent mb-3 tracking-tighter">
          ズボラクレシピを考え中...
        </h2>
        <p className="text-gray-400 text-xs font-medium leading-loose max-w-[200px] mx-auto opacity-60">
          洗い物少なめ、手順が簡単な<br/>
          最適な提案を抽出しています。
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center gap-6 p-8">
        <p className="text-rose-600 font-bold text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-rose-100 italic">{error}</p>
        <button 
          onClick={() => router.push("/fridge")} 
          className="bg-foreground text-background px-8 py-4 rounded-2xl shadow-xl font-black text-xs active:scale-95 transition-all"
        >
          ← やり直す
        </button>
      </div>
    );
  }

  const currentRecipes = recipeData ? recipeData[activeTab] : [];
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

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-40 flex flex-col">
      {/* プレミアム・固定ヘッダー */}
      <header className="sticky top-0 bg-background/90 backdrop-blur-md z-40 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/fridge")} className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-gray-400 shadow-sm active:scale-90 transition-transform">
            ←
          </button>
          <h1 className="text-xl font-black text-gray-900 tracking-tighter">ズボラクレシピ提案</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* タブUI */}
        {dishTypes.length > 0 && (
          <nav className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
            {tabs.map((tab) => dishTypes.includes(tab.id as any) && (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex flex-col items-center py-2 transition-all rounded-xl ${
                  activeTab === tab.id 
                    ? "bg-white shadow-sm text-accent" 
                    : "text-gray-400 grayscale opacity-50"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="text-[10px] font-black">{tab.label}</span>
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="px-6 flex-1 space-y-10">
        <div className="px-1 text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-1 lg:text-3xl">
            {tabs.find(t => t.id === activeTab)?.label}の提案
          </h2>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em] italic">
            Zubora recipes for {activeTab}
          </p>
        </div>

        <div className="space-y-8">
          {currentRecipes.length === 0 ? (
            <div className="text-center py-12 text-gray-300 italic text-sm">
              提案された{tabs.find(t => t.id === activeTab)?.label}はありません
            </div>
          ) : (
            currentRecipes.map((recipe, idx) => (
              <article
                key={idx}
                className="bg-white rounded-[2.5rem] p-8 soft-shadow border border-border relative overflow-hidden group transition-all"
              >
                <div className="flex flex-wrap gap-2 mb-4">
                  {recipe.tags.map(tag => (
                    <span key={tag} className="bg-gray-50 text-gray-400 text-[9px] font-black px-2.5 py-1 rounded-full border border-border tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>

                <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight tracking-tighter italic">{recipe.title}</h3>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed font-medium">{recipe.description}</p>

                <div className="bg-gray-50/50 rounded-[1.6rem] p-6 mb-8 border border-border/50">
                  <ol className="space-y-3">
                    {recipe.steps.map((step, sIdx) => (
                      <li key={sIdx} className="flex gap-4">
                        <span className="flex-none w-5 h-5 rounded-full bg-white border border-border flex items-center justify-center text-[9px] font-black text-gray-400 shadow-sm">{sIdx + 1}</span>
                        <p className="text-[12px] text-gray-700 font-bold leading-snug">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(recipe.searchLinks[0]?.query || recipe.title + " レシピ")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center bg-white border border-border text-gray-900 font-black text-[11px] py-4 rounded-2xl active:bg-gray-50 active:translate-y-0.5 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  Webで検索 <span>→</span>
                </a>
                
                <footer className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-center gap-2">
                  <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">食材:</span>
                  <p className="text-[8px] text-gray-300 font-black truncate max-w-[200px]">
                    {recipe.usedIngredientNames.join(" / ")}
                  </p>
                </footer>
              </article>
            ))
          )}
        </div>
      </main>

      {/* フローティング・ナビゲーション */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-40 bg-gradient-to-t from-background via-background to-transparent pt-12 pointer-events-none">
        {nextTab ? (
          <button
            onClick={() => {
              setActiveTab(nextTab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full bg-accent text-white font-black py-5 rounded-[2rem] text-base shadow-2xl shadow-accent/30 active:scale-[0.98] transition-all pointer-events-auto flex items-center justify-center gap-2"
          >
            <span>次（{tabs.find(t => t.id === nextTab)?.label}へ）</span>
            <span className="text-xl">＞</span>
          </button>
        ) : (
          <button
            onClick={() => {
              router.push("/fridge");
            }}
            className="w-full bg-foreground text-background font-black py-5 rounded-[2rem] text-base shadow-xl active:scale-[0.98] transition-all pointer-events-auto flex items-center justify-center gap-2"
          >
            <span>🍳 食材を選び直す</span>
          </button>
        )}
      </div>

    </div>
  );
}
