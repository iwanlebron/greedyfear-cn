import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, _ as createFileRoute, b as require_jsx_runtime, d as Scripts, f as HeadContent, g as lazyRouteComponent, h as Outlet, m as createRouter, v as createRootRoute, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-CC-L0dJL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* Path-based preview hosts serve the dev server under `/{port_id}/` and strip
* that prefix before forwarding, so SSR sees `/` while the browser URL keeps the
* prefix. TanStack Start resets `basepath` on hydration, so a `rewrite` keeps
* client routing and generated links aligned with the public URL.
*/
var PATH_BASED_PREVIEW_HOSTS = /* @__PURE__ */ new Set([
	"preview.grok.genai.mil",
	"preview.grok.mil",
	"preview.grokgsac.com"
]);
var PORT_ID_PREFIX = /^\/hds-[a-z0-9]+-\d+-[a-z0-9]+(?=\/|$)/i;
function previewPathPrefix(hostname, pathname) {
	if (!PATH_BASED_PREVIEW_HOSTS.has(hostname.toLowerCase())) return void 0;
	return PORT_ID_PREFIX.exec(pathname)?.[0];
}
function prefixRewrite(prefix) {
	return {
		input: ({ url }) => {
			if (url.pathname === prefix) url.pathname = "/";
			else if (url.pathname.startsWith(`${prefix}/`)) url.pathname = url.pathname.slice(prefix.length);
			return url;
		},
		output: ({ url }) => {
			url.pathname = `${prefix}${url.pathname}`;
			return url;
		}
	};
}
function previewPathRewrite() {
	if (typeof window === "undefined") return void 0;
	const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
	return prefix ? prefixRewrite(prefix) : void 0;
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-C2im-UPW.css";
var APP_NAME = "全球市场情绪仪表盘｜GreedyFear 中文版";
var Route$2 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "用中文查看全球股市、加密货币与热门科技公司的恐惧与贪婪情绪，行情自动刷新。"
			},
			{
				name: "theme-color",
				content: "#0b1423"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "zh-CN",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter = () => import("./routes-Z4l3N2zW.mjs");
var Route$1 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
/** Same bands as the GreedyFear dashboard (CNN-style). */
function toneFor(score) {
	if (score == null || Number.isNaN(score)) return "unavailable";
	if (score <= 25) return "extreme-fear";
	if (score <= 45) return "fear";
	if (score <= 54) return "neutral";
	if (score <= 74) return "greed";
	return "extreme-greed";
}
function labelFor(score) {
	const tone = toneFor(score);
	if (tone === "extreme-fear") return "极度恐惧";
	if (tone === "fear") return "恐惧";
	if (tone === "neutral") return "中性";
	if (tone === "greed") return "贪婪";
	if (tone === "extreme-greed") return "极度贪婪";
	return "暂无数据";
}
/** Invert a volatility reading across a fixed band into a 0–100 greed score. */
function invertVol(value, min, max) {
	const raw = 100 - (value - min) / (max - min) * 100;
	return Math.min(100, Math.max(0, Math.round(raw)));
}
/** Where price sits inside its 52-week range. 0 = year low, 100 = year high. */
function rangePosition(price, low, high) {
	if (!Number.isFinite(price) || !Number.isFinite(low) || !Number.isFinite(high)) return null;
	if (!(high > low)) return null;
	const raw = (price - low) / (high - low) * 100;
	return Math.min(100, Math.max(0, Math.round(raw)));
}
/** 30-session realized volatility, annualized with the sample standard deviation. */
function realizedVol30(closes) {
	const rets = [];
	for (let i = 1; i < closes.length; i++) {
		const prev = closes[i - 1];
		const next = closes[i];
		if (prev > 0 && next > 0) rets.push(Math.log(next / prev));
	}
	if (rets.length < 30) return null;
	const window = rets.slice(-30);
	const mean = window.reduce((sum, value) => sum + value, 0) / window.length;
	const variance = window.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (window.length - 1);
	if (!(variance >= 0)) return null;
	return Math.sqrt(variance) * Math.sqrt(252) * 100;
}
function entry(partial) {
	const score = partial.score == null || Number.isNaN(partial.score) ? null : Math.round(partial.score);
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
		sourceUrl: partial.sourceUrl
	};
}
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
var TTL_MS = 2e4;
var DEFAULT_BAND = {
	min: 10,
	max: 40
};
var VOL_MARKETS = [
	{
		key: "eu",
		title: "欧洲股市",
		subtitle: "Euro Stoxx 50 30 日实现波动率（反向）",
		symbol: "^STOXX50E",
		kind: "rv",
		band: DEFAULT_BAND,
		region: "eu"
	},
	{
		key: "india",
		title: "印度股市",
		subtitle: "印度 VIX（反向）",
		symbol: "^INDIAVIX",
		kind: "level",
		band: DEFAULT_BAND,
		region: "in"
	},
	{
		key: "jp",
		title: "日本股市",
		subtitle: "日经 225 30 日实现波动率（反向）",
		symbol: "^N225",
		kind: "rv",
		band: DEFAULT_BAND,
		region: "jp"
	},
	{
		key: "hk",
		title: "香港 / 中国",
		subtitle: "恒生波幅指数 VHSI（反向）",
		symbol: "^HSIL",
		kind: "level",
		band: {
			min: 15,
			max: 45
		},
		region: "hk"
	},
	{
		key: "cn",
		title: "沪深300",
		subtitle: "沪深300ETF 30 日实现波动率（反向）",
		symbol: "510300.SS",
		kind: "rv",
		band: DEFAULT_BAND,
		region: "cn"
	},
	{
		key: "gold",
		title: "黄金",
		subtitle: "CBOE 黄金波动率 GVZ（反向）",
		symbol: "^GVZ",
		kind: "level",
		band: DEFAULT_BAND,
		region: "gold"
	},
	{
		key: "oil",
		title: "原油",
		subtitle: "CBOE 原油波动率 OVX（反向）",
		symbol: "^OVX",
		kind: "level",
		band: {
			min: 25,
			max: 80
		},
		region: "oil"
	}
];
var STOCKS = [
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
	["TSLA", "TSLA · 特斯拉"]
];
var CROSS = [
	{
		symbol: "BTC-USD",
		title: "BTC · 比特币",
		subtitle: "价格所处 52 周区间位置",
		afterHours: false
	},
	{
		symbol: "ETH-USD",
		title: "ETH · 以太坊",
		subtitle: "价格所处 52 周区间位置",
		afterHours: false
	},
	{
		symbol: "0700.HK",
		title: "0700 · 腾讯",
		subtitle: "股价所处 52 周区间位置",
		afterHours: true
	},
	{
		symbol: "BABA",
		title: "BABA · 阿里巴巴",
		subtitle: "股价所处 52 周区间位置",
		afterHours: true
	}
];
var cache = null;
var inflight = null;
function getSentiment(force = false) {
	if (!force && cache && Date.now() - cache.at < TTL_MS) return Promise.resolve(cache.data);
	if (inflight) return inflight;
	inflight = build().then((data) => {
		cache = {
			at: Date.now(),
			data
		};
		return data;
	}).finally(() => {
		inflight = null;
	});
	return inflight;
}
async function build() {
	const [crypto, us, vols, dollar, stocks, cross] = await Promise.all([
		loadCrypto(),
		loadUs(),
		mapPool(VOL_MARKETS, 4, loadVol),
		loadDollar(),
		mapPool(STOCKS, 6, ([symbol, title]) => loadStock(symbol, title)),
		mapPool(CROSS, 4, (item) => loadStock(item.symbol, item.title, {
			afterHours: item.afterHours,
			subtitle: item.subtitle
		}))
	]);
	const markets = [
		crypto,
		us,
		...vols,
		dollar
	];
	return {
		markets,
		stocks,
		cross,
		unavailable: [
			...markets,
			...stocks,
			...cross
		].filter((item) => item.score == null).length,
		fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
async function loadCrypto() {
	const base = {
		key: "crypto",
		title: "加密货币",
		subtitle: "Alternative.me 恐惧与贪婪指数",
		sourceName: "Alternative.me",
		sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/"
	};
	try {
		const [fng, btc] = await Promise.all([getJson("https://api.alternative.me/fng/?limit=2&format=json"), loadBtc().catch(() => null)]);
		const rows = asRecord(fng).data;
		const latest = Array.isArray(rows) ? asRecord(rows[0]) : {};
		const prev = Array.isArray(rows) ? asRecord(rows[1]) : {};
		const score = Number(latest.value);
		const prevScore = Number(prev.value);
		const stamp = Number(latest.timestamp);
		const parts = [];
		if (btc) parts.push(btc);
		if (Number.isFinite(prevScore)) parts.push(`昨日指数 ${Math.round(prevScore)}`);
		return entry({
			...base,
			score: Number.isFinite(score) ? score : null,
			detail: parts.length ? parts.join(" · ") : "Alternative.me 官方指数",
			timestamp: Number.isFinite(stamp) ? (/* @__PURE__ */ new Date(stamp * 1e3)).toISOString() : null
		});
	} catch (error) {
		console.error("[sentiment] crypto", error);
		return entry({
			...base,
			score: null,
			detail: null,
			timestamp: null
		});
	}
}
async function loadBtc() {
	const yahoo = await loadYahoo("BTC-USD", "5d");
	const price = yahoo.meta?.regularMarketPrice;
	const change = yahoo.meta?.regularMarketChangePercent;
	if (price == null || !Number.isFinite(price)) return null;
	return `BTC ${formatUsd(price)} · ${formatPct(change)}`;
}
async function loadUs() {
	const base = {
		key: "us",
		title: "美国股市",
		subtitle: "CNN 恐惧与贪婪指数",
		sourceName: "CNN",
		sourceUrl: "https://edition.cnn.com/markets/fear-and-greed"
	};
	try {
		const direct = await getJson("https://raw.githubusercontent.com/whit3rabbit/fear-greed-data/main/json/cnn_output.json").catch(() => null);
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
			timestamp
		});
	} catch (error) {
		console.error("[sentiment] us", error);
		return entry({
			...base,
			score: null,
			detail: null,
			timestamp: null
		});
	}
}
async function loadVol(spec) {
	const base = {
		key: spec.key,
		title: spec.title,
		subtitle: spec.subtitle,
		sourceName: "Yahoo Finance",
		sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(spec.symbol)}`
	};
	try {
		const yahoo = await loadYahoo(spec.symbol, spec.kind === "rv" ? "6mo" : "5d");
		const price = yahoo.meta?.regularMarketPrice;
		const closes = yahoo.closes;
		const value = spec.kind === "rv" ? realizedVol30(closes) : price != null && Number.isFinite(price) ? price : null;
		if (value == null) throw new Error("empty yahoo series");
		const time = yahoo.meta?.regularMarketTime;
		return entry({
			...base,
			score: invertVol(value, spec.band.min, spec.band.max),
			detail: `原始波动率 ${value.toFixed(2)}`,
			timestamp: time ? (/* @__PURE__ */ new Date(time * 1e3)).toISOString() : null
		});
	} catch (error) {
		console.error("[sentiment] vol", spec.key, error);
		return fallbackVol(spec, base);
	}
}
async function fallbackVol(spec, base) {
	try {
		const proxy = asRecord(await getJson(`https://www.greedyfear.com/api/vix?region=${spec.region}`));
		const value = Number(proxy.value);
		const score = Number(proxy.score);
		return entry({
			...base,
			sourceName: "Yahoo Finance",
			score: Number.isFinite(score) ? score : Number.isFinite(value) ? invertVol(value, spec.band.min, spec.band.max) : null,
			detail: Number.isFinite(value) ? `原始波动率 ${value.toFixed(2)}` : null,
			timestamp: typeof proxy.timestamp === "string" ? proxy.timestamp : null
		});
	} catch (error) {
		console.error("[sentiment] vol fallback", spec.key, error);
		return entry({
			...base,
			score: null,
			detail: null,
			timestamp: null
		});
	}
}
async function loadDollar() {
	const base = {
		key: "dxy",
		title: "美元指数",
		subtitle: "美元走强视为风险偏好下降（52 周反向）",
		sourceName: "Yahoo Finance",
		sourceUrl: "https://finance.yahoo.com/quote/DX-Y.NYB"
	};
	try {
		const meta = (await loadYahoo("DX-Y.NYB", "5d")).meta;
		const price = meta?.regularMarketPrice;
		const high = meta?.fiftyTwoWeekHigh;
		const low = meta?.fiftyTwoWeekLow;
		const position = price == null || high == null || low == null ? null : rangePosition(price, low, high);
		const time = meta?.regularMarketTime;
		return entry({
			...base,
			score: position == null ? null : 100 - position,
			detail: price == null ? null : `指数 ${price.toFixed(2)} · ${formatPct(meta?.regularMarketChangePercent)}`,
			timestamp: time ? (/* @__PURE__ */ new Date(time * 1e3)).toISOString() : null
		});
	} catch (error) {
		console.error("[sentiment] dxy", error);
		return entry({
			...base,
			score: null,
			detail: null,
			timestamp: null
		});
	}
}
async function loadStock(symbol, title, opts) {
	const base = {
		key: `stock-${symbol}`,
		title,
		subtitle: opts?.subtitle ?? "股价所处 52 周区间位置",
		sourceName: "Yahoo Finance",
		sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`
	};
	try {
		const yahoo = await loadYahoo(symbol, "1d", {
			interval: "1m",
			includePrePost: true
		});
		const meta = yahoo.meta;
		const price = meta?.regularMarketPrice;
		const high = meta?.fiftyTwoWeekHigh;
		const low = meta?.fiftyTwoWeekLow;
		if (price == null || high == null || low == null) throw new Error("missing 52w");
		const score = rangePosition(price, low, high);
		if (score == null) throw new Error("bad range");
		const time = meta?.regularMarketTime;
		const currency = meta?.currency;
		const afterHours = opts?.afterHours === false ? "" : afterHoursDetail(price, time, yahoo.last, currency);
		return entry({
			...base,
			score,
			detail: `${formatMoney(price, currency)} · ${formatPct(meta?.regularMarketChangePercent)}${afterHours}`,
			timestamp: time ? (/* @__PURE__ */ new Date(time * 1e3)).toISOString() : null
		});
	} catch (error) {
		console.error("[sentiment] stock", symbol, error);
		return fallbackStock(symbol, base);
	}
}
async function fallbackStock(symbol, base) {
	try {
		const proxy = asRecord(await getJson(`https://www.greedyfear.com/api/stock?symbol=${symbol}`));
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
			timestamp: typeof proxy.timestamp === "string" ? proxy.timestamp : null
		});
	} catch (error) {
		console.error("[sentiment] stock fallback", symbol, error);
		return entry({
			...base,
			score: null,
			detail: null,
			timestamp: null
		});
	}
}
async function loadYahoo(symbol, range, opts) {
	const interval = opts?.interval ?? "1d";
	const prepost = opts?.includePrePost ? "true" : "false";
	const result = (await getJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=${prepost}`)).chart?.result?.[0];
	if (!result) throw new Error(`yahoo empty ${symbol}`);
	const quotes = result.indicators?.quote?.[0]?.close ?? [];
	const times = result.timestamp ?? [];
	const closes = quotes.filter((value) => typeof value === "number" && Number.isFinite(value) && value > 0);
	let last;
	for (let i = quotes.length - 1; i >= 0; i--) {
		const price = quotes[i];
		const time = times[i];
		if (typeof price === "number" && price > 0 && typeof time === "number") {
			last = {
				price,
				time
			};
			break;
		}
	}
	return {
		meta: result.meta,
		closes,
		last
	};
}
function afterHoursDetail(regular, regularTime, last, currency) {
	if (!last || !regularTime || !(regular > 0) || last.time <= regularTime + 60) return "";
	if (Math.abs(last.price - regular) < .005) return "";
	const change = (last.price - regular) / regular * 100;
	return ` · 盘后 ${formatMoney(last.price, currency)} ${formatPct(change)}`;
}
async function getJson(url) {
	const response = await fetch(url, {
		headers: {
			Accept: "application/json",
			"User-Agent": UA
		},
		signal: AbortSignal.timeout(12e3),
		cache: "no-store"
	});
	if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
	return response.json();
}
function asRecord(value) {
	return value && typeof value === "object" ? value : {};
}
function formatUsd(value) {
	return formatMoney(value, "USD");
}
function formatMoney(value, currency) {
	const body = value.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
	if (currency === "HKD") return `HK$${body}`;
	if (currency === "CNY") return `¥${body}`;
	return `$${body}`;
}
function formatPct(value) {
	if (value == null || !Number.isFinite(value)) return "—";
	return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}
function trimNumber(value, digits) {
	return value.toFixed(digits).replace(/\.0$/, "");
}
async function mapPool(items, limit, fn) {
	const results = new Array(items.length);
	let cursor = 0;
	async function worker() {
		while (cursor < items.length) {
			const index = cursor++;
			results[index] = await fn(items[index]);
		}
	}
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
	return results;
}
var Route = createFileRoute("/api/sentiment")({ server: { handlers: { GET: async ({ request }) => {
	const data = await getSentiment(new URL(request.url).searchParams.has("fresh"));
	return Response.json(data, { headers: { "Cache-Control": "no-store" } });
} } } });
var rootRouteChildren = {
	IndexRoute: Route$1.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$2
	}),
	ApiSentimentRoute: Route.update({
		id: "/api/sentiment",
		path: "/api/sentiment",
		getParentRoute: () => Route$2
	})
};
var routeTree = Route$2._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
	return createRouter({
		routeTree,
		rewrite: previewPathRewrite(),
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { getRouter };
