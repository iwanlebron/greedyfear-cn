export type Tone =
  | "extreme-fear"
  | "fear"
  | "neutral"
  | "greed"
  | "extreme-greed"
  | "unavailable";

export type SentimentEntry = {
  key: string;
  title: string;
  subtitle: string;
  score: number | null;
  label: string;
  tone: Tone;
  detail: string | null;
  timestamp: string | null;
  sourceName: string;
  sourceUrl: string;
};

export type SentimentPayload = {
  markets: SentimentEntry[];
  stocks: SentimentEntry[];
  cross: SentimentEntry[];
  unavailable: number;
  fetchedAt: string;
};

/** Same bands as the GreedyFear dashboard (CNN-style). */
export function toneFor(score: number | null): Tone {
  if (score == null || Number.isNaN(score)) return "unavailable";
  if (score <= 25) return "extreme-fear";
  if (score <= 45) return "fear";
  if (score <= 54) return "neutral";
  if (score <= 74) return "greed";
  return "extreme-greed";
}

export function labelFor(score: number | null): string {
  const tone = toneFor(score);
  if (tone === "extreme-fear") return "极度恐惧";
  if (tone === "fear") return "恐惧";
  if (tone === "neutral") return "中性";
  if (tone === "greed") return "贪婪";
  if (tone === "extreme-greed") return "极度贪婪";
  return "暂无数据";
}

/** Invert a volatility reading across a fixed band into a 0–100 greed score. */
export function invertVol(value: number, min: number, max: number): number {
  const raw = 100 - ((value - min) / (max - min)) * 100;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

/** Where price sits inside its 52-week range. 0 = year low, 100 = year high. */
export function rangePosition(price: number, low: number, high: number): number | null {
  if (!Number.isFinite(price) || !Number.isFinite(low) || !Number.isFinite(high)) return null;
  if (!(high > low)) return null;
  const raw = ((price - low) / (high - low)) * 100;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

/** 30-session realized volatility, annualized with the sample standard deviation. */
export function realizedVol30(closes: number[]): number | null {
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1];
    const next = closes[i];
    if (prev > 0 && next > 0) rets.push(Math.log(next / prev));
  }
  if (rets.length < 30) return null;
  const window = rets.slice(-30);
  const mean = window.reduce((sum, value) => sum + value, 0) / window.length;
  const variance =
    window.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (window.length - 1);
  if (!(variance >= 0)) return null;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

export function entry(partial: {
  key: string;
  title: string;
  subtitle: string;
  score: number | null;
  detail?: string | null;
  timestamp?: string | null;
  sourceName: string;
  sourceUrl: string;
}): SentimentEntry {
  const score =
    partial.score == null || Number.isNaN(partial.score) ? null : Math.round(partial.score);
  return {
    key: partial.key,
    title: partial.title,
    subtitle: partial.subtitle,
    score,
    label: labelFor(score),
    tone: toneFor(score),
    detail: partial.detail ?? null,
    timestamp: partial.timestamp ?? null,
    sourceName: partial.sourceName,
    sourceUrl: partial.sourceUrl,
  };
}
