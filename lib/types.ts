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
  name: string;
  method: string;
  uses_priority?: boolean;
  steps: string[];
  ingredients_used: string[];
  seasonings_used: string[];
};

export type RecipeResponse = {
  note?: string;
  main: Recipe[];
  side: Recipe[];
  soup: Recipe[];
  remaining?: number;
};
