import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Ingredient, ServingSize, Seasoning } from "@/lib/types";

// 初期調味料リスト
const DEFAULT_SEASONINGS = [
  "醤油", "味噌", "塩", "砂糖", "酢", "みりん", "酒",
  "ケチャップ", "マヨネーズ", "コンソメ", "鶏ガラスープの素",
  "めんつゆ", "胡麻油", "オリーブオイル", "ワサビ", "生姜（チューブ）", "ニンニク（チューブ）"
].map(name => ({ id: crypto.randomUUID(), name, checked: true }));

type FridgeStore = {
  ingredients: Ingredient[];
  servingSize: ServingSize;
  dishTypes: ("main" | "side" | "soup")[];
  seasonings: Seasoning[];
  setIngredients: (items: Ingredient[]) => void;
  setServingSize: (size: ServingSize) => void;
  setDishTypes: (types: ("main" | "side" | "soup")[]) => void;
  toggleDishType: (type: "main" | "side" | "soup") => void;
  setSeasonings: (items: Seasoning[]) => void;
  toggleSeasoning: (id: string) => void;
  addIngredient: (item: Omit<Ingredient, "id">) => void;
  updateIngredient: (id: string, patch: Partial<Omit<Ingredient, "id">>) => void;
  removeIngredient: (id: string) => void;
  togglePriority: (id: string) => void;
};

export const useFridgeStore = create<FridgeStore>()(
  persist(
    (set) => ({
      ingredients: [],
      servingSize: "標準",
      dishTypes: ["main"],
      seasonings: DEFAULT_SEASONINGS,

      setIngredients: (items) => set({ ingredients: items }),
      setServingSize: (size) => set({ servingSize: size }),
      setDishTypes: (types) => set({ dishTypes: types }),
      toggleDishType: (type) => set((s) => {
        const types = s.dishTypes.includes(type)
          ? s.dishTypes.filter((t) => t !== type)
          : [...s.dishTypes, type];
        return { dishTypes: types.length === 0 ? ["main"] : types }; // 少なくても1品
      }),
      setSeasonings: (items) => set({ seasonings: items }),
      toggleSeasoning: (id) => set((s) => ({
        seasonings: s.seasonings.map(s2 => s2.id === id ? { ...s2, checked: !s2.checked } : s2)
      })),

      addIngredient: (item) =>
        set((s) => ({
          ingredients: [
            ...s.ingredients,
            { ...item, id: crypto.randomUUID() },
          ],
        })),

      updateIngredient: (id, patch) =>
        set((s) => ({
          ingredients: s.ingredients.map((i) =>
            i.id === id ? { ...i, ...patch } : i
          ),
        })),

      removeIngredient: (id) =>
        set((s) => ({
          ingredients: s.ingredients.filter((i) => i.id !== id),
        })),

      togglePriority: (id) =>
        set((s) => ({
          ingredients: s.ingredients.map((i) =>
            i.id === id ? { ...i, priority: !i.priority } : i
          ),
        })),
    }),
    { name: "zuborakumeshi-fridge" }
  )
);
