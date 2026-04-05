"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFridgeStore } from "@/store/fridgeStore";
import { resizeImage } from "@/lib/resizeImage";
import { getDefaultUnit, QUANTITY_OPTIONS } from "@/lib/ingredientUtils";
import type { Ingredient, ServingSize } from "@/lib/types";

const CATEGORIES = [
  { label: "🥩 肉", key: "肉", items: ["豚肉", "鶏肉", "牛肉", "ひき肉", "ハム", "ベーコン"] },
  { label: "🥕 野菜", key: "野菜", items: ["玉ねぎ", "人参", "じゃがいも", "キャベツ", "ピーマン", "ナス", "大根", "トマト", "もやし", "ブロッコリー"] },
  { label: "🐟 魚", key: "魚", items: ["鮭", "さば", "ツナ缶"] },
  { label: "🥚 卵乳", key: "卵乳", items: ["卵", "牛乳", "チーズ", "豆腐", "納豆"] },
  { label: "🍞 主食", key: "主食", items: ["ごはん", "食パン", "うどん", "パスタ", "餅"] },
  { label: "🍄 茸", key: "茸", items: ["しめじ", "えのき", "椎茸", "舞茸"] },
] as const;

const DISH_MENU = [
  { id: "main", label: "主菜", icon: "🥩" },
  { id: "side", label: "副菜", icon: "🥗" },
  { id: "soup", label: "汁物", icon: "🥣" },
] as const;

export default function FridgePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState("");

  const { 
    ingredients, 
    servingSize, 
    dishTypes,
    seasonings,
    setIngredients, 
    setServingSize, 
    toggleDishType,
    toggleSeasoning,
    addIngredient, 
    updateIngredient, 
    removeIngredient, 
    togglePriority 
  } = useFridgeStore();

  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showSeasonings, setShowSeasonings] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/remaining")
      .then((r) => r.json())
      .then((d) => setRemaining(d.remaining))
      .catch(() => {/* サイレントに失敗 */});
  }, []);

  async function handleImage(file: File) {
    const base64 = await resizeImage(file);
    setPendingImages(prev => [...prev, base64]);
  }

  async function startScan() {
    if (pendingImages.length === 0) return;
    setScanning(true);
    setScanProgress({ current: 0, total: pendingImages.length });
    setError("");
    
    const allNewItems: Ingredient[] = [];

    try {
      for (let i = 0; i < pendingImages.length; i++) {
        setScanProgress({ current: i + 1, total: pendingImages.length });
        
        const res = await fetch("/api/vision/parse-fridge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64s: [pendingImages[i]] }),
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "解析失敗");

        for (const item of data.ingredients) {
          const trimmedName = item.name.trim();
          // すでに存在するか名前でチェック（部分一致ではなく完全一致想定）
          const exists = ingredients.some(existing => existing.name === trimmedName) || 
                         allNewItems.some(newIt => newIt.name === trimmedName);
          
          if (!exists && trimmedName) {
            allNewItems.push({
              id: crypto.randomUUID(),
              name: trimmedName,
              amount: item.amount || 1,
              unit: getDefaultUnit(trimmedName),
              priority: false,
            });
          }
        }
        
        // 1枚ごとにリストを更新して反映させる
        setIngredients([...ingredients, ...allNewItems]);
      }
      setPendingImages([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setScanning(false);
      setScanProgress({ current: 0, total: 0 });
    }
  }


  return (
    <div className="min-h-screen bg-background text-foreground max-w-lg mx-auto relative overflow-x-hidden pb-32">
      {/* ヘッダー */}
      <header className="px-6 py-8 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-gray-400 shadow-sm active:scale-90 transition-transform"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tighter italic cursor-pointer" onClick={() => router.push("/")}>
              ズボラクめし
            </h1>
            <p className="text-[9px] font-black text-accent/60 uppercase tracking-widest">
              Fridge Inventory
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowSeasonings(true)}
          className="bg-white px-4 py-2 rounded-full shadow-sm border border-border text-[10px] font-black active:scale-90 transition-transform flex items-center gap-1.5"
        >
          <span>🧂</span>
          <span>調味料</span>
        </button>
      </header>

      <main className="px-6 space-y-10">
        {/* 作るものを選ぶ */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">作るものを選ぶ</h2>
          <div className="flex gap-2">
            {DISH_MENU.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleDishType(m.id)}
                className={`flex-1 py-3.5 rounded-2xl border transition-all flex flex-col items-center gap-1 active:scale-95 ${
                  dishTypes.includes(m.id)
                    ? "bg-accent border-accent text-white shadow-lg shadow-accent/20"
                    : "bg-white border-border text-gray-400"
                }`}
              >
                <span className="text-xl">{m.icon}</span>
                <span className="text-[10px] font-black">{m.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ボリューム設定 */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">食べる量</h2>
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            {["少なめ", "標準", "2人前", "3〜4人", "ﾊﾟｰﾃｨ"].map((size) => (
              <button
                key={size}
                onClick={() => setServingSize(size as ServingSize)}
                className={`flex-1 py-2 text-[11px] font-black rounded-xl transition-all ${
                  servingSize === size ? "bg-white text-accent shadow-sm" : "text-gray-400"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </section>

        {/* 撮影セクション */}
        <section className="bg-white rounded-[2rem] p-6 soft-shadow border border-border">
          <div className="flex items-center justify-between mb-5">
            <div className="space-y-1">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest text-[10px]">自動解析</h2>
              <p className="text-[10px] text-gray-300 font-medium">冷蔵庫をまとめて撮影</p>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="bg-accent text-white px-6 py-2.5 rounded-full shadow-lg shadow-accent/20 active:scale-95 transition-all text-xs font-black flex items-center gap-2"
            >
              <span>📷</span>
              <span>撮影する</span>
            </button>
          </div>
          
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar min-h-[64px]">
            {pendingImages.map((img, i) => (
              <div key={i} className="relative flex-none w-16 h-16 rounded-[1.2rem] overflow-hidden border border-border shadow-sm group">
                <img src={img} className="w-full h-full object-cover" alt="preview" />
                <button 
                  onClick={() => setPendingImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >✕</button>
              </div>
            ))}
            {pendingImages.length === 0 && (
              <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-[1.2rem] bg-gray-50/50 text-gray-300 text-[10px] py-4 font-medium italic">
                写真を撮るとここに並びます
              </div>
            )}
          </div>
          
          {pendingImages.length > 0 && (
            <button
              onClick={startScan}
              disabled={scanning}
              className="w-full bg-foreground text-background font-black py-4 rounded-2xl shadow-xl disabled:opacity-30 text-sm active:scale-[0.98] transition-all relative overflow-hidden"
            >
              <div className="relative z-10">
                {scanning 
                  ? `${scanProgress.current}/${scanProgress.total}枚目を読み取り中...` 
                  : `${pendingImages.length}枚を読み取る`
                }
              </div>
              {scanning && (
                <div 
                  className="absolute inset-0 bg-accent/20 transition-all duration-500 ease-out origin-left"
                  style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                />
              )}
            </button>
          )}

          <input
            ref={fileRef}
            type="file" accept="image/*" capture="environment" multiple className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              files.forEach(handleImage);
              e.target.value = "";
            }}
          />
        </section>

        {error && (
          <p className="text-red-500 text-[10px] font-bold text-center bg-red-50 py-2 rounded-xl border border-red-100">{error}</p>
        )}

        {/* 食材リスト */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest text-[10px]">在庫食材</h2>
            {ingredients.length > 0 && (
              <span className="text-[9px] font-black text-accent bg-accent/5 px-2 py-0.5 rounded-full border border-accent/10">🔥 消費優先</span>
            )}
          </div>

          {ingredients.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="text-4xl opacity-20">🧊</div>
              <p className="text-gray-300 text-[10px] font-medium italic">食材がありません</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {ingredients.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border transition-all ${
                    item.priority ? "border-accent/30 ring-1 ring-accent/5" : "border-border"
                  }`}
                >
                  <button
                    onClick={() => togglePriority(item.id)}
                    className={`text-lg transition-all active:scale-125 ${item.priority ? "filter-none opacity-100" : "grayscale opacity-10 font-bold"}`}
                  >
                    🔥
                  </button>
                  <input
                    className="flex-1 text-sm font-black bg-transparent outline-none min-w-0 text-gray-800"
                    value={item.name}
                    onChange={(e) => updateIngredient(item.id, { name: e.target.value })}
                  />
                  <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-2 py-1">
                    <select
                      className="bg-transparent text-[11px] font-black text-gray-700 outline-none appearance-none pr-1"
                      value={item.amount}
                      onChange={(e) => updateIngredient(item.id, { amount: e.target.value })}
                    >
                      {QUANTITY_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <span className="text-[10px] font-black text-gray-400 border-l border-gray-200 pl-1.5 overflow-hidden whitespace-nowrap">
                      {item.unit}
                    </span>
                  </div>
                  <button
                    onClick={() => removeIngredient(item.id)}
                    className="text-gray-200 hover:text-red-400 transition-colors pl-1"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* クイック追加 */}
        <section className="space-y-4 pb-12">
          <div className="grid grid-cols-6 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
                className={`flex flex-col items-center justify-center aspect-square rounded-2xl border transition-all active:scale-95 ${
                  activeCategory === cat.key 
                  ? "bg-accent border-accent text-white shadow-lg shadow-accent/20" 
                  : "bg-white border-border text-gray-400"
                }`}
              >
                <span className="text-xl mb-0.5">{cat.label.split(" ")[0]}</span>
                <span className={`text-[9px] font-black uppercase tracking-tighter ${activeCategory === cat.key ? "text-white/80" : "text-gray-300"}`}>
                  {cat.key}
                </span>
              </button>
            ))}
          </div>
          
          <div className={`overflow-hidden transition-all duration-300 ease-out ${activeCategory ? "max-h-32 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="flex flex-wrap gap-2 p-4 bg-white rounded-[1.5rem] border border-border shadow-inner">
              {activeCategory && CATEGORIES.find(c => c.key === activeCategory)?.items.map(item => (
                <button
                  key={item}
                  onClick={() => {
                    addIngredient({ 
                      name: item, 
                      amount: item.includes("肉") || item.includes("さば") ? 200 : 1, 
                      unit: getDefaultUnit(item),
                      priority: false 
                    });
                    setActiveCategory(null);
                  }}
                  className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-border active:bg-accent active:text-white transition-all transform active:translate-y-0.5"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => addIngredient({ name: "", amount: 1, unit: "適量", priority: false })}
            className="w-full flex items-center justify-center gap-2 text-gray-300 border border-border border-dashed bg-white/30 rounded-2xl py-3 text-[10px] font-black active:bg-white transition-all font-sans"
          >
            <span>＋</span> 手入力で追加
          </button>
        </section>
      </main>

      {/* 調味料ドロワー */}
      <div className={`fixed inset-0 z-50 transition-all duration-500 ${showSeasonings ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div 
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${showSeasonings ? "opacity-100" : "opacity-0"}`} 
          onClick={() => setShowSeasonings(false)}
        />
        <aside className={`absolute top-0 right-0 h-full w-4/5 max-w-xs bg-white shadow-2xl p-6 transition-transform duration-500 ease-out ${showSeasonings ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-gray-800">調味料リスト</h2>
            <button onClick={() => setShowSeasonings(false)} className="text-2xl text-gray-300">✕</button>
          </div>
          <p className="text-[10px] text-gray-400 font-bold mb-6 uppercase tracking-widest">我が家のストック</p>
          <div className="space-y-2 overflow-y-auto max-h-[70vh] no-scrollbar">
            {seasonings.map(s => (
              <button
                key={s.id}
                onClick={() => toggleSeasoning(s.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${
                  s.checked 
                    ? "bg-accent/5 border-accent/20 text-accent" 
                    : "bg-gray-50 border-transparent text-gray-300"
                }`}
              >
                <span className="text-xs font-black">{s.name}</span>
                <span className={`text-xs ${s.checked ? "opacity-100" : "opacity-0"}`}>✓</span>
              </button>
            ))}
          </div>
          <div className="absolute bottom-8 left-6 right-6">
            <button 
              onClick={() => setShowSeasonings(false)}
              className="w-full bg-foreground text-background font-black py-4 rounded-2xl shadow-lg"
            >
              完了
            </button>
          </div>
        </aside>
      </div>

      {/* フローティングボタン */}
      {ingredients.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 z-40 bg-gradient-to-t from-background via-background to-transparent pt-12 pointer-events-none">
          {remaining !== null && (
            <div className="flex justify-center mb-3">
              <div className="glass-pill px-4 py-1.5 text-[10px] font-black text-gray-400 pointer-events-none">
                {remaining === 0
                  ? "本日の無料利用回数を使い切りました"
                  : `本日あと ${remaining} 回`}
              </div>
            </div>
          )}
          <button
            onClick={() => router.push("/recipes")}
            className="w-full bg-accent text-white font-black py-5 rounded-[2rem] text-base shadow-2xl shadow-accent/30 active:scale-[0.98] transition-all pointer-events-auto flex items-center justify-center gap-2"
          >
            <span>🍳</span>
            <span>ズボラクレシピを考える</span>
          </button>
        </div>
      )}
    </div>
  );
}
