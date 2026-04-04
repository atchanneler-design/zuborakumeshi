export type ServingSize = "少なめ" | "標準" | "2人前" | "3〜4人" | "ﾊﾟｰﾃｨ";

export type Seasoning = {
  id: string;
  name: string;
  checked: boolean;
};

export type Ingredient = {
  id: string;
  name: string;
  amount: number | string;
  unit: string;
  priority?: boolean;
};

export type Recipe = {
  title: string;
  description: string;
  steps: string[];
  usedIngredientNames: string[];
  tags: string[];
  searchLinks: { label: string; query: string }[];
};

export type RecipeResponse = {
  main: Recipe[];
  side: Recipe[];
  soup: Recipe[];
  remaining?: number;
};
