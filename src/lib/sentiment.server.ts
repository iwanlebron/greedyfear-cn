import {
  entry,
  invertVol,
  rangePosition,
  realizedVol30,
  type SentimentEntry,
  type SentimentPayload,
} from "./sentiment";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const TTL_MS = 20_000;

const DEFAULT_BAND = { min: 10, max: 40 };

const VOL_MARKETS = [
  {
    key: "eu",
    title: "欧洲股市",
    subtitle: "Euro Stoxx 50 30 日实现波动率（反向）",
    symbol: "^STOXX50E",
    kind: "rv" as const,
    band: DEFAULT_BAND,
    region: "eu",
  },
  {
    key: "india",
    title: "印度股市",
    subtitle: "印度 VIX（反向）",
    symbol: "^INDIAVIX",
    kind: "level" as const,
    band: DEFAULT_BAND,
    region: "in",
  },
  {
    key: "jp",
    title: "日本股市",
    subtitle: "日经 225 30 日实现波动率（反向）",
    symbol: "^N225",
    kind: "rv" as const,
    band: DEFAULT_BAND,
    region: "jp",
  },
  {
    key: "hk",
    title: "香港 / 中国",
    subtitle: "恒生波幅指数 VHSI（反向）",
    symbol: "^HSIL",
    kind: "level" as const,
    band: { min: 15, max: 45 },
    region: "hk",
  },
  {
    key: "cn",
    title: "沪深300",
    subtitle: "沪深300ETF 30 日实现波动率（反向）",
    symbol: "510300.SS",
    kind: "rv" as const,
    band: DEFAULT_BAND,
    region: "cn",
  },
  {
    key: "gold",
    title: "黄金",
    subtitle: "CBOE 黄金波动率 GVZ（反向）",
    symbol: "^GVZ",
    kind: "level" as const,
    band: DEFAULT_BAND,
    region: "gold",
  },
  {
    key: "oil",
    title: "原油",
    subtitle: "CBOE 原油波动率 OVX（反向）",
    symbol: "^OVX",
    kind: "level" as const,
    band: { min: 25, max: 80 },
    region: "oil",
  },
];

const STOCKS = [
  ["GOOG", "GOOG · 谷歌-C"],
  ["GOOGL", "GOOGL · 谷歌-A"],
  ["CRCL", "CRCL · Circle"],
  ["NVDA", "NVDA · 英伟达"],
  ["AMZN", "AMZN · 亚马逊"],
  ["MSFT", "MSFT · 微软"],
  ["META", "META · Meta"],
  ["AAPL", "AAPL · 苹果"],
  ["TSM", "TSM · 台积电"],
  ["AVGO", "AVGO · 博通"],
  ["MU", "MU · 美光科技"],
  ["ORCL", "ORCL · 甲骨文"],
  ["AMD", "AMD · 美国超微"],
  ["INTC", "INTC · 英特尔"],
  ["SPCX", "SPCX · SpaceX"],
  ["TSLA", "TSLA · 特斯拉"],
] as const;

const CROSS = [
  { symbol: "BTC-USD", title: "BTC · 比特币", subtitle: "价格所处 52 周区间位置", afterHours: false },
  { symbol: "ETH-USD", title: "ETH · 以太坊", subtitle: "价格所处 52 周区间位置", afterHours: false },
  { symbol: "0700.HK", title: "0700 · 腾讯", subtitle: "股价所处 52 周区间位置", afterHours: true },
  { symbol: "BABA", title: "BABA · 阿里巴巴", subtitle: "股价所处 52 周区间位置", afterHours: true },
] as const;

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        regularMarketTime?: number;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
        regularMarketChangePercent?: number;
        currency?: string;
      };
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
  };
};

let cache: { at: number; data: SentimentPayload } | null = null;
let inflight: Promise<SentimentPayload> | null = null;

export function getSentiment(force = false): Promise<SentimentPayload> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return Promise.resolve(cache.data);
  if (inflight) return inflight;
  inflight = build()
    .then((data) => {
      cache = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

async function build(): Promise<SentimentPayload> {
  const [crypto, us, vols, dollar, stocks, cross] = await Promise.all([
    loadCrypto(),
    loadUs(),
    mapPool(VOL_MARKETS, 4, loadVol),
    loadDollar(),
    mapPool(STOCKS, 6, ([symbol, title]) => loadStock(symbol, title)),
    mapPool(CROSS, 4, (item) =>
      loadStock(item.symbol, item.title, {
        afterHours: item.afterHours,
        subtitle: item.subtitle,
      }),
    ),
  ]);
  const markets = [crypto, us, ...vols, dollar];
  const all = [...markets, ...stocks, ...cross];
  return {
    markets,
    stocks,
    cross,
    unavailable: all.filter((item) => item.score == null).length,
    fetchedAt: new Date().toISOString(),
  };
}

async function loadCrypto(): Promise<SentimentEntry> {
  const base = {
    key: "crypto",
    title: "加密货币",
    subtitle: "Alternative.me 恐惧与贪婪指数",
    sourceName: "Alternative.me",
    sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/",
  };
  try {
    const [fng, btc] = await Promise.all([
      getJson("https://api.alternative.me/fng/?limit=2&format=json"),
      loadBtc().catch(() => null),
    ]);
    const rows = asRecord(fng).data;
    const latest = Array.isArray(rows) ? asRecord(rows[0]) : {};
    const prev = Array.isArray(rows) ? asRecord(rows[1]) : {};
    const score = Number(latest.value);
    const prevScore = Number(prev.value);
    const stamp = Number(latest.timestamp);
    const parts: string[] = [];
    if (btc) parts.push(btc);
    if (Number.isFinite(prevScore)) parts.push(`昨日指数 ${Math.round(prevScore)}`);
    return entry({
      ...base,
      score: Number.isFinite(score) ? score : null,
      detail: parts.length ? parts.join(" · ") : "Alternative.me 官方指数",
      timestamp: Number.isFinite(stamp) ? new Date(stamp * 1000).toISOString() : null,
    });
  } catch (error) {
    console.error("[sentiment] crypto", error);
    return entry({ ...base, score: null, detail: null, timestamp: null });
  }
}

async function loadBtc(): Promise<string | null> {
  const yahoo = await loadYahoo("BTC-USD", "5d");
  const price = yahoo.meta?.regularMarketPrice;
  const change = yahoo.meta?.regularMarketChangePercent;
  if (price == null || !Number.isFinite(price)) return null;
  return `BTC ${formatUsd(price)} · ${formatPct(change)}`;
}

async function loadUs(): Promise<SentimentEntry> {
  const base = {
    key: "us",
    title: "美国股市",
    subtitle: "CNN 恐惧与贪婪指数",
    sourceName: "CNN",
    sourceUrl: "https://edition.cnn.com/markets/fear-and-greed",
  };
  try {
    const direct = await getJson(
      "https://raw.githubusercontent.com/whit3rabbit/fear-greed-data/main/json/cnn_output.json",
    ).catch(() => null);
    const block = direct ? asRecord(asRecord(direct).fear_and_greed) : {};
    let score = Number(block.score);
    let timestamp = typeof block.timestamp === "string" ? block.timestamp : null;
    let previous = Number(block.previous_close);

    if (!Number.isFinite(score)) {
      const proxy = asRecord(await getJson("https://www.greedyfear.com/api/us"));
      score = Number(proxy.score);
      timestamp = typeof proxy.timestamp === "string" ? proxy.timestamp : timestamp;
      previous = Number(asRecord(proxy.previous).close);
    }

    return entry({
      ...base,
      score: Number.isFinite(score) ? score : null,
      detail: Number.isFinite(previous) ? `前一日 ${trimNumber(previous, 1)}` : null,
      timestamp,
    });
  } catch (error) {
    console.error("[sentiment] us", error);
    return entry({ ...base, score: null, detail: null, timestamp: null });
  }
}

async function loadVol(spec: (typeof VOL_MARKETS)[number]): Promise<SentimentEntry> {
  const base = {
    key: spec.key,
    title: spec.title,
    subtitle: spec.subtitle,
    sourceName: "Yahoo Finance",
    sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(spec.symbol)}`,
  };
  try {
    const yahoo = await loadYahoo(spec.symbol, spec.kind === "rv" ? "6mo" : "5d");
    const price = yahoo.meta?.regularMarketPrice;
    const closes = yahoo.closes;
    const value =
      spec.kind === "rv"
        ? realizedVol30(closes)
        : price != null && Number.isFinite(price)
          ? price
          : null;
    if (value == null) throw new Error("empty yahoo series");
    const time = yahoo.meta?.regularMarketTime;
    return entry({
      ...base,
      score: invertVol(value, spec.band.min, spec.band.max),
      detail: `原始波动率 ${value.toFixed(2)}`,
      timestamp: time ? new Date(time * 1000).toISOString() : null,
    });
  } catch (error) {
    console.error("[sentiment] vol", spec.key, error);
    return fallbackVol(spec, base);
  }
}

async function fallbackVol(
  spec: (typeof VOL_MARKETS)[number],
  base: Pick<SentimentEntry, "key" | "title" | "subtitle" | "sourceName" | "sourceUrl">,
): Promise<SentimentEntry> {
  try {
    const proxy = asRecord(
      await getJson(`https://www.greedyfear.com/api/vix?region=${spec.region}`),
    );
    const value = Number(proxy.value);
    const score = Number(proxy.score);
    return entry({
      ...base,
      sourceName: "Yahoo Finance",
      score: Number.isFinite(score)
        ? score
        : Number.isFinite(value)
          ? invertVol(value, spec.band.min, spec.band.max)
          : null,
      detail: Number.isFinite(value) ? `原始波动率 ${value.toFixed(2)}` : null,
      timestamp: typeof proxy.timestamp === "string" ? proxy.timestamp : null,
    });
  } catch (error) {
    console.error("[sentiment] vol fallback", spec.key, error);
    return entry({ ...base, score: null, detail: null, timestamp: null });
  }
}

async function loadDollar(): Promise<SentimentEntry> {
  const base = {
    key: "dxy",
    title: "美元指数",
    subtitle: "美元走强视为风险偏好下降（52 周反向）",
    sourceName: "Yahoo Finance",
    sourceUrl: "https://finance.yahoo.com/quote/DX-Y.NYB",
  };
  try {
    const yahoo = await loadYahoo("DX-Y.NYB", "5d");
    const meta = yahoo.meta;
    const price = meta?.regularMarketPrice;
    const high = meta?.fiftyTwoWeekHigh;
    const low = meta?.fiftyTwoWeekLow;
    const position = price == null || high == null || low == null ? null : rangePosition(price, low, high);
    const time = meta?.regularMarketTime;
    return entry({
      ...base,
      score: position == null ? null : 100 - position,
      detail:
        price == null ? null : `指数 ${price.toFixed(2)} · ${formatPct(meta?.regularMarketChangePercent)}`,
      timestamp: time ? new Date(time * 1000).toISOString() : null,
    });
  } catch (error) {
    console.error("[sentiment] dxy", error);
    return entry({ ...base, score: null, detail: null, timestamp: null });
  }
}

async function loadStock(
  symbol: string,
  title: string,
  opts?: { afterHours?: boolean; subtitle?: string },
): Promise<SentimentEntry> {
  const base = {
    key: `stock-${symbol}`,
    title,
    subtitle: opts?.subtitle ?? "股价所处 52 周区间位置",
    sourceName: "Yahoo Finance",
    sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`,
  };
  try {
    const yahoo = await loadYahoo(symbol, "1d", { interval: "1m", includePrePost: true });
    const meta = yahoo.meta;
    const price = meta?.regularMarketPrice;
    const high = meta?.fiftyTwoWeekHigh;
    const low = meta?.fiftyTwoWeekLow;
    if (price == null || high == null || low == null) throw new Error("missing 52w");
    const score = rangePosition(price, low, high);
    if (score == null) throw new Error("bad range");
    const time = meta?.regularMarketTime;
    const currency = meta?.currency;
    const afterHours =
      opts?.afterHours === false ? "" : afterHoursDetail(price, time, yahoo.last, currency);
    return entry({
      ...base,
      score,
      detail: `${formatMoney(price, currency)} · ${formatPct(meta?.regularMarketChangePercent)}${afterHours}`,
      timestamp: time ? new Date(time * 1000).toISOString() : null,
    });
  } catch (error) {
    console.error("[sentiment] stock", symbol, error);
    return fallbackStock(symbol, base);
  }
}

async function fallbackStock(
  symbol: string,
  base: Pick<SentimentEntry, "key" | "title" | "subtitle" | "sourceName" | "sourceUrl">,
): Promise<SentimentEntry> {
  try {
    const proxy = asRecord(
      await getJson(`https://www.greedyfear.com/api/stock?symbol=${symbol}`),
    );
    const price = Number(proxy.price);
    const high = Number(proxy.high52);
    const low = Number(proxy.low52);
    const change = Number(proxy.changePercent);
    const given = Number(proxy.score);
    const score = Number.isFinite(given) ? given : rangePosition(price, low, high);
    return entry({
      ...base,
      score,
      detail: Number.isFinite(price) ? `${formatUsd(price)} · ${formatPct(change)}` : null,
      timestamp: typeof proxy.timestamp === "string" ? proxy.timestamp : null,
    });
  } catch (error) {
    console.error("[sentiment] stock fallback", symbol, error);
    return entry({ ...base, score: null, detail: null, timestamp: null });
  }
}

async function loadYahoo(
  symbol: string,
  range: string,
  opts?: { interval?: string; includePrePost?: boolean },
): Promise<{
  meta?: NonNullable<NonNullable<YahooChart["chart"]>["result"]>[number]["meta"];
  closes: number[];
  last?: { price: number; time: number };
}> {
  const interval = opts?.interval ?? "1d";
  const prepost = opts?.includePrePost ? "true" : "false";
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=${prepost}`;
  const json = (await getJson(url)) as YahooChart;
  const result = json.chart?.result?.[0];
  if (!result) throw new Error(`yahoo empty ${symbol}`);
  const quotes = result.indicators?.quote?.[0]?.close ?? [];
  const times = (result as { timestamp?: number[] }).timestamp ?? [];
  const closes = quotes.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0,
  );
  let last: { price: number; time: number } | undefined;
  for (let i = quotes.length - 1; i >= 0; i--) {
    const price = quotes[i];
    const time = times[i];
    if (typeof price === "number" && price > 0 && typeof time === "number") {
      last = { price, time };
      break;
    }
  }
  return { meta: result.meta, closes, last };
}

function afterHoursDetail(
  regular: number,
  regularTime: number | undefined,
  last: { price: number; time: number } | undefined,
  currency?: string,
): string {
  if (!last || !regularTime || !(regular > 0) || last.time <= regularTime + 60) return "";
  if (Math.abs(last.price - regular) < 0.005) return "";
  const change = ((last.price - regular) / regular) * 100;
  return ` · 盘后 ${formatMoney(last.price, currency)} ${formatPct(change)}`;
}

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function formatUsd(value: number): string {
  return formatMoney(value, "USD");
}

function formatMoney(value: number, currency?: string): string {
  const body = value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (currency === "HKD") return `HK$${body}`;
  if (currency === "CNY") return `¥${body}`;
  return `$${body}`;
}

function formatPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function trimNumber(value: number, digits: number): string {
  return value.toFixed(digits).replace(/\.0$/, "");
}

async function mapPool<T, R>(items: readonly T[], limit: number, fn: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index] as T);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}
