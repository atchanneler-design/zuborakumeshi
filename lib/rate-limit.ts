const DAILY_LIMIT = 3;

// --- 日付ユーティリティ (JST基準) ---

function getJSTDateString(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10); // YYYY-MM-DD
}

function getJSTMidnightTTL(): number {
  const now = Date.now();
  const jstNow = new Date(now + 9 * 60 * 60 * 1000);
  const jstMidnight = new Date(
    Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate() + 1) -
      9 * 60 * 60 * 1000
  );
  return Math.ceil((jstMidnight.getTime() - now) / 1000);
}

// --- Redis ---

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const { Redis } = await import("@upstash/redis");
  return new Redis({ url, token });
}

// --- Admin スキップ ---

function isAdminIP(ip: string): boolean {
  const raw = process.env.ADMIN_IPS ?? "";
  if (!raw) return false;
  return raw.split(",").map((s) => s.trim()).includes(ip);
}

// --- In-memory フォールバック (Redis未設定環境用) ---

type MemEntry = { count: number; bonusUsed: boolean; resetAt: number };
const memStore = new Map<string, MemEntry>();

function memCheck(ip: string): { allowed: boolean; remaining: number; bonusUsed: boolean } {
  const now = Date.now();
  const ttl = getJSTMidnightTTL();
  const resetAt = now + ttl * 1000;
  const entry = memStore.get(ip);

  if (!entry || now >= entry.resetAt) {
    memStore.set(ip, { count: 1, bonusUsed: false, resetAt });
    return { allowed: true, remaining: DAILY_LIMIT - 1, bonusUsed: false };
  }

  const limit = entry.bonusUsed ? DAILY_LIMIT + 1 : DAILY_LIMIT;
  if (entry.count >= limit) return { allowed: false, remaining: 0, bonusUsed: entry.bonusUsed };

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, bonusUsed: entry.bonusUsed };
}

// --- Public API ---

/** 使用回数を1消費してチェック */
export async function checkLimit(
  ip: string
): Promise<{ allowed: boolean; remaining: number; bonusUsed: boolean }> {
  if (isAdminIP(ip)) return { allowed: true, remaining: DAILY_LIMIT, bonusUsed: false };

  const redis = await getRedis();
  if (!redis) return memCheck(ip);

  const date = getJSTDateString();
  const ttl = getJSTMidnightTTL();
  const countKey = `ratelimit:${ip}:${date}`;
  const bonusKey = `ratelimit:bonus:${ip}:${date}`;

  try {
    const bonusRaw = await redis.get<string>(bonusKey);
    const bonusUsed = bonusRaw === "1";
    const limit = bonusUsed ? DAILY_LIMIT + 1 : DAILY_LIMIT;

    const count = await redis.incr(countKey);
    if (count === 1) await redis.expire(countKey, ttl);

    if (count > limit) return { allowed: false, remaining: 0, bonusUsed };
    return { allowed: true, remaining: limit - count, bonusUsed };
  } catch {
    return memCheck(ip);
  }
}

/** 消費せずに残り回数だけ確認 */
export async function peekLimit(
  ip: string
): Promise<{ remaining: number; bonusUsed: boolean }> {
  if (isAdminIP(ip)) return { remaining: DAILY_LIMIT, bonusUsed: false };

  const redis = await getRedis();
  if (redis) {
    const date = getJSTDateString();
    try {
      const countRaw = await redis.get<number>(`ratelimit:${ip}:${date}`);
      const bonusRaw = await redis.get<string>(`ratelimit:bonus:${ip}:${date}`);
      const count = countRaw ?? 0;
      const bonusUsed = bonusRaw === "1";
      const limit = bonusUsed ? DAILY_LIMIT + 1 : DAILY_LIMIT;
      return { remaining: Math.max(0, limit - count), bonusUsed };
    } catch { /* fall through */ }
  }

  const entry = memStore.get(ip);
  if (!entry || Date.now() >= entry.resetAt) return { remaining: DAILY_LIMIT, bonusUsed: false };
  const limit = entry.bonusUsed ? DAILY_LIMIT + 1 : DAILY_LIMIT;
  return { remaining: Math.max(0, limit - entry.count), bonusUsed: entry.bonusUsed };
}

/** Xシェアボーナス +1回付与（1日1回まで） */
export async function addBonusCount(
  ip: string
): Promise<{ success: boolean; remaining: number }> {
  if (isAdminIP(ip)) return { success: true, remaining: DAILY_LIMIT };

  const redis = await getRedis();
  const date = getJSTDateString();
  const ttl = getJSTMidnightTTL();

  if (redis) {
    try {
      const bonusKey = `ratelimit:bonus:${ip}:${date}`;
      const countKey = `ratelimit:${ip}:${date}`;

      const alreadyBonused = await redis.get<string>(bonusKey);
      if (alreadyBonused === "1") {
        const count = (await redis.get<number>(countKey)) ?? 0;
        return { success: false, remaining: Math.max(0, DAILY_LIMIT + 1 - count) };
      }

      await redis.set(bonusKey, "1", { ex: ttl });
      const count = (await redis.get<number>(countKey)) ?? 0;
      return { success: true, remaining: Math.max(0, DAILY_LIMIT + 1 - count) };
    } catch { /* fall through */ }
  }

  // In-memory fallback
  const now = Date.now();
  const resetAt = now + ttl * 1000;
  const entry = memStore.get(ip) ?? { count: 0, bonusUsed: false, resetAt };
  if (now >= entry.resetAt) {
    memStore.set(ip, { count: 0, bonusUsed: true, resetAt });
    return { success: true, remaining: DAILY_LIMIT + 1 };
  }
  if (entry.bonusUsed) {
    return { success: false, remaining: Math.max(0, DAILY_LIMIT + 1 - entry.count) };
  }
  entry.bonusUsed = true;
  memStore.set(ip, entry);
  return { success: true, remaining: Math.max(0, DAILY_LIMIT + 1 - entry.count) };
}
