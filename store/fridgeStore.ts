import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Ingredient, ServingSize, Seasoning } from "@/lib/types";

type DishType = "main" | "side" | "soup";

// 固定IDで安定させる（モジュールロードごとにUUIDが変わらないように）
const DEFAULT_SEASONINGS: Seasoning[] = [
  "醤油", "味噌", "塩", "砂糖", "酢", "みりん", "酒",
  "ケチャップ", "マヨネーズ", "コンソメ", "鶏ガラスープの素",
  "めんつゆ", "胡麻油", "オリーブオイル", "ワサビ", "生姜（チューブ）", "ニンニク（チューブ）",
].map((name, i) => ({ id: `seasoning-${i}`, name, checked: true }));

type FridgeStore = {
  ingredients: Ingredient[];
  servingSize: ServingSize;
  dishTypes: DishType[];
  seasonings: Seasoning[];
  totalSavings: number;
  setIngredients: (items: Ingredient[]) => void;
  setServingSize: (size: ServingSize) => void;
  toggleDishType: (type: DishType) => void;
  setSeasonings: (items: Seasoning[]) => void;
  toggleSeasoning: (id: string) => void;
  addIngredient: (item: Omit<Ingredient, "id">) => void;
  updateIngredient: (id: string, patch: Partial<Omit<Ingredient, "id">>) => void;
  removeIngredient: (id: string) => void;
  togglePriority: (id: string) => void;
  addSavings: (amount: number) => void;
};

export const useFridgeStore = create<FridgeStore>()(
  persist(
    (set) => ({
      ingredients: [],
      servingSize: "標準",
      dishTypes: ["main"],
      seasonings: DEFAULT_SEASONINGS,
      totalSavings: 0,

      setIngredients: (items) => set({ ingredients: items }),
      setServingSize: (size) => set({ servingSize: size }),

      toggleDishType: (type) =>
        set((s) => {
          const next = s.dishTypes.includes(type)
            ? s.dishTypes.filter((t) => t !== type)
            : [...s.dishTypes, type];
          return { dishTypes: next.length === 0 ? ["main"] : next };
        }),

      setSeasonings: (items) => set({ seasonings: items }),

      toggleSeasoning: (id) =>
        set((s) => ({
          seasonings: s.seasonings.map((s2) =>
            s2.id === id ? { ...s2, checked: !s2.checked } : s2
          ),
        })),

      addIngredient: (item) =>
        set((s) => ({
          ingredients: [...s.ingredients, { ...item, id: crypto.randomUUID() }],
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

      addSavings: (amount) => set((s) => ({ totalSavings: s.totalSavings + amount })),
    }),
    { name: "zuborakumeshi-fridge" }
  )
);
