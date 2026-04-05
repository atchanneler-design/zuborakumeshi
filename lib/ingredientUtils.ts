export const DEFAULT_UNITS: Record<string, string> = {
  "豚肉": "g",
  "鶏肉": "g",
  "牛肉": "g",
  "ひき肉": "g",
  "ハム": "枚",
  "ベーコン": "枚",
  "玉ねぎ": "個",
  "人参": "本",
  "じゃがいも": "個",
  "キャベツ": "玉",
  "ピーマン": "個",
  "ナス": "本",
  "大根": "本",
  "トマト": "個",
  "もやし": "袋",
  "ブロッコリー": "株",
  "鮭": "切身",
  "さば": "切身",
  "ツナ缶": "缶",
  "卵": "個",
  "牛乳": "ml",
  "チーズ": "g",
  "豆腐": "丁",
  "納豆": "ﾊﾟｯｸ",
  "ごはん": "膳",
  "食パン": "枚",
  "うどん": "玉",
  "パスタ": "g",
  "餅": "個",
  "しめじ": "株",
  "えのき": "袋",
  "椎茸": "個",
  "舞茸": "ﾊﾟｯｸ",
};

export const QUANTITY_OPTIONS = [
  "少量", "適量", "大量"
];

export function getDefaultUnit(name: string): string {
  for (const [key, unit] of Object.entries(DEFAULT_UNITS)) {
    if (name.includes(key)) return unit;
  }
  return "個";
}
