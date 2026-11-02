import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SentimentEntry, SentimentPayload } from "@/lib/sentiment";

const REFRESH_MS = 30_000;

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [data, setData] = useState<SentimentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [receivedAt, setReceivedAt] = useState<number | null>(null);
  const dataRef = useRef<SentimentPayload | null>(null);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const response = await fetch(`/api/sentiment?t=${Date.now()}${manual ? "&fresh=1" : ""}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as SentimentPayload;
      dataRef.current = payload;
      setData(payload);
      setReceivedAt(Date.now());
      setNotice(
        payload.unavailable > 0
          ? `有 ${payload.unavailable} 项数据暂时不可用，其余指标已按最新行情更新。`
          : null,
      );
    } catch {
      setNotice(
        dataRef.current
          ? "刷新失败，当前继续显示上一次的数据。"
          : "暂时无法连接数据源，请稍后重试。",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const poll = window.setInterval(() => void load(false), REFRESH_MS);
    const onOnline = () => void load(false);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load(false);
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(poll);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const fetchedLabel = data ? formatWhen(data.fetchedAt) : "尚未更新";
  const remain = useMemo(() => {
    if (receivedAt == null) return null;
    const elapsed = Math.floor((now - receivedAt) / 1000);
    return Math.max(0, Math.round(REFRESH_MS / 1000) - elapsed);
  }, [receivedAt, now]);

  return (
    <main className="site-shell">
      <header className="site-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <span>贪</span>
            <span>惧</span>
          </div>
          <div>
            <p className="eyebrow">GREEDYFEAR 中文版</p>
            <h1>全球市场情绪仪表盘</h1>
            <p className="subtitle">恐惧与贪婪，一眼看懂全球市场。</p>
          </div>
        </div>
        <div className="refresh-panel">
          <span className="update-status">
            <i />
            最近更新：{fetchedLabel}
            {remain != null ? ` · ${refreshing ? "刷新中" : `${remain} 秒后自动刷新`}` : ""}
          </span>
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            aria-label="刷新全部市场数据"
          >
            <b className={refreshing ? "spinning" : ""} aria-hidden="true">
              ↻
            </b>
            {refreshing ? "刷新中" : "刷新数据"}
          </button>
        </div>
      </header>

      {notice ? (
        <div className="notice" role="status">
          {notice}
        </div>
      ) : null}

      <Section
        title="全球市场情绪"
        eyebrow="MARKET PULSE"
        entries={data?.markets ?? []}
        loading={loading}
        placeholders={10}
      />
      <Section
        title="大型科技公司"
        eyebrow="MEGA-CAP COMPANIES"
        entries={data?.stocks ?? []}
        loading={loading}
      />
      <Section
        title="加密与中国资产"
        eyebrow="CROSS-MARKET"
        entries={data?.cross ?? []}
        loading={loading}
        placeholders={4}
      />

      <footer className="site-footer">
        <p>
          分数越低代表市场越恐惧，越高代表越贪婪。波动率按固定区间反向换算（股市、黄金与沪深300
          10–40，恒指波幅 15–45，原油 25–80）。个股、比特币与以太坊看 52
          周区间位置；美元指数相反，越靠近一年高点越恐惧。
        </p>
        <p>
          加密指数来自 Alternative.me，美股情绪来自 CNN
          恐惧与贪婪指数，价格与波动率来自 Yahoo Finance 公开行情，约每 30
          秒自动核对。休市时保留最近成交价。仅供信息参考，不构成投资建议。
        </p>
      </footer>
    </main>
  );
}

function Section({
  title,
  eyebrow,
  entries,
  loading,
  placeholders = 8,
}: {
  title: string;
  eyebrow: string;
  entries: SentimentEntry[];
  loading: boolean;
  placeholders?: number;
}) {
  return (
    <section className="dashboard-section" aria-labelledby={`${eyebrow}-heading`}>
      <div className="section-heading">
        <div>
          <p className="section-kicker">{eyebrow}</p>
          <h2 id={`${eyebrow}-heading`}>{title}</h2>
        </div>
        <span>{loading ? "正在读取数据…" : `${entries.length} 项指标`}</span>
      </div>
      <div className="market-grid">
        {loading
          ? Array.from({ length: placeholders }, (_, index) => <Skeleton key={index} />)
          : entries.map((item) => <Card key={item.key} entry={item} />)}
      </div>
    </section>
  );
}

function Card({ entry }: { entry: SentimentEntry }) {
  return (
    <article className="market-card">
      <header className="card-header">
        <h3>{entry.title}</h3>
        <p>{entry.subtitle}</p>
      </header>
      <Gauge entry={entry} />
      <div className="score-block">
        <strong className={entry.tone}>{entry.score ?? "—"}</strong>
        <span className={`sentiment-label ${entry.tone}`}>
          {entry.score == null ? "暂无数据" : entry.label}
        </span>
        {entry.detail ? <small>{entry.detail}</small> : <small />}
      </div>
      <footer className="card-footer">
        <span>{entry.timestamp ? `更新于 ${formatWhen(entry.timestamp)}` : "数据暂不可用"}</span>
        <a
          href={entry.sourceUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`查看${entry.title}数据来源（新窗口）`}
        >
          {entry.sourceName} <b aria-hidden="true">↗</b>
        </a>
      </footer>
    </article>
  );
}

function Gauge({ entry }: { entry: SentimentEntry }) {
  const score = entry.score ?? 0;
  return (
    <div
      className={`gauge ${entry.tone}`}
      style={{ ["--score" as string]: String(score) }}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={entry.score ?? undefined}
      aria-label={entry.score == null ? `${entry.title}暂无数据` : `${entry.title}情绪分数 ${entry.score}`}
    >
      <div className="gauge-needle" aria-hidden="true" />
      <div className="gauge-hub" aria-hidden="true" />
      <span className="tick tick-zero">0</span>
      <span className="tick tick-mid">50</span>
      <span className="tick tick-max">100</span>
    </div>
  );
}

function Skeleton() {
  return (
    <article className="market-card skeleton-card" aria-hidden="true">
      <div className="skeleton-line wide" />
      <div className="skeleton-line short" />
      <div className="skeleton-gauge" />
      <div className="skeleton-score" />
      <div className="skeleton-pill" />
    </article>
  );
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "等待更新";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
