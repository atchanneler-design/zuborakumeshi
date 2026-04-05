export type ServingSize = "標準" | "多め";

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
  savingsAmount?: number;
  comparisonTarget?: string;
};

export type RecipeResponse = {
  main: Recipe[];
  side: Recipe[];
  soup: Recipe[];
  remaining?: number;
};
