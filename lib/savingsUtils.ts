export type ComparisonTarget = {
  name: string;
  cost: number;
  message: string;
};

const COMPARISON_TARGETS: ComparisonTarget[] = [
  { name: "コンビニ弁当", cost: 800, message: "コンビニコーヒー数杯分浮きました。" },
  { name: "飲み会", cost: 5000, message: "2次会のカラオケ代まで守り抜きました。" },
  { name: "叙々苑ランチ", cost: 10000, message: "ほぼ不労所得です。" },
  { name: "高級フレンチ", cost: 25000, message: "一晩で富裕層の仲間入りです。" },
  { name: "デパ地下の惣菜盛り合わせ", cost: 3000, message: "贅沢なデザートを追加できる余裕が生まれました。" },
];

export function getTripleComparisons(estimatedCost: number, servingSize: "標準" | "多め"): {
  target: string;
  savings: number;
}[] {
  const multiplier = servingSize === "多め" ? 2 : 1;
  
  return COMPARISON_TARGETS.map(t => ({
    target: t.name + (multiplier > 1 ? "（2食分）" : ""),
    savings: (t.cost * multiplier) - estimatedCost,
  }));
}

export function getRandomComparison(servingSize: "標準" | "多め"): { 
  target: string; 
  savings: number; 
  message: string; 
} {
  const target = COMPARISON_TARGETS[Math.floor(Math.random() * COMPARISON_TARGETS.length)];
  const selfCookingCost = 200; // 自炊1食あたりの推定原価
  
  const multiplier = servingSize === "多め" ? 2 : 1;
  const savings = (target.cost - selfCookingCost) * multiplier;
  
  return {
    target: target.name + (multiplier > 1 ? "（2食分）" : ""),
    savings,
    message: target.message,
  };
}
