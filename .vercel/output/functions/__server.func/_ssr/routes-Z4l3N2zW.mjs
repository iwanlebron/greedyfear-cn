import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Z4l3N2zW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var REFRESH_MS = 3e4;
function Home() {
	const [data, setData] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [refreshing, setRefreshing] = (0, import_react.useState)(false);
	const [notice, setNotice] = (0, import_react.useState)(null);
	const [now, setNow] = (0, import_react.useState)(() => Date.now());
	const [receivedAt, setReceivedAt] = (0, import_react.useState)(null);
	const dataRef = (0, import_react.useRef)(null);
	const load = (0, import_react.useCallback)(async (manual = false) => {
		if (manual) setRefreshing(true);
		try {
			const response = await fetch(`/api/sentiment?t=${Date.now()}${manual ? "&fresh=1" : ""}`, { cache: "no-store" });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const payload = await response.json();
			dataRef.current = payload;
			setData(payload);
			setReceivedAt(Date.now());
			setNotice(payload.unavailable > 0 ? `有 ${payload.unavailable} 项数据暂时不可用，其余指标已按最新行情更新。` : null);
		} catch {
			setNotice(dataRef.current ? "刷新失败，当前继续显示上一次的数据。" : "暂时无法连接数据源，请稍后重试。");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		load(false);
		const timer = window.setInterval(() => setNow(Date.now()), 1e3);
		const poll = window.setInterval(() => void load(false), REFRESH_MS);
		const onOnline = () => void load(false);
		const onVisible = () => {
			if (document.visibilityState === "visible") load(false);
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
	const remain = (0, import_react.useMemo)(() => {
		if (receivedAt == null) return null;
		const elapsed = Math.floor((now - receivedAt) / 1e3);
		return Math.max(0, Math.round(REFRESH_MS / 1e3) - elapsed);
	}, [receivedAt, now]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "site-shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "site-header",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "brand-lockup",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "brand-mark",
						"aria-hidden": "true",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "贪" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "惧" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "eyebrow",
							children: "GREEDYFEAR 中文版"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "全球市场情绪仪表盘" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "subtitle",
							children: "恐惧与贪婪，一眼看懂全球市场。"
						})
					] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "refresh-panel",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "update-status",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
							"最近更新：",
							fetchedLabel,
							remain != null ? ` · ${refreshing ? "刷新中" : `${remain} 秒后自动刷新`}` : ""
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => void load(true),
						disabled: refreshing,
						"aria-label": "刷新全部市场数据",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
							className: refreshing ? "spinning" : "",
							"aria-hidden": "true",
							children: "↻"
						}), refreshing ? "刷新中" : "刷新数据"]
					})]
				})]
			}),
			notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "notice",
				role: "status",
				children: notice
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "全球市场情绪",
				eyebrow: "MARKET PULSE",
				entries: data?.markets ?? [],
				loading,
				placeholders: 10
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "大型科技公司",
				eyebrow: "MEGA-CAP COMPANIES",
				entries: data?.stocks ?? [],
				loading
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "加密与中国资产",
				eyebrow: "CROSS-MARKET",
				entries: data?.cross ?? [],
				loading,
				placeholders: 4
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "site-footer",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "分数越低代表市场越恐惧，越高代表越贪婪。波动率按固定区间反向换算（股市、黄金与沪深300 10–40，恒指波幅 15–45，原油 25–80）。个股、比特币与以太坊看 52 周区间位置；美元指数相反，越靠近一年高点越恐惧。" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "加密指数来自 Alternative.me，美股情绪来自 CNN 恐惧与贪婪指数，价格与波动率来自 Yahoo Finance 公开行情，约每 30 秒自动核对。休市时保留最近成交价。仅供信息参考，不构成投资建议。" })]
			})
		]
	});
}
function Section({ title, eyebrow, entries, loading, placeholders = 8 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "dashboard-section",
		"aria-labelledby": `${eyebrow}-heading`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "section-heading",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "section-kicker",
				children: eyebrow
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				id: `${eyebrow}-heading`,
				children: title
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: loading ? "正在读取数据…" : `${entries.length} 项指标` })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "market-grid",
			children: loading ? Array.from({ length: placeholders }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, {}, index)) : entries.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { entry: item }, item.key))
		})]
	});
}
function Card({ entry }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "market-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "card-header",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: entry.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: entry.subtitle })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { entry }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "score-block",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: entry.tone,
						children: entry.score ?? "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `sentiment-label ${entry.tone}`,
						children: entry.score == null ? "暂无数据" : entry.label
					}),
					entry.detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: entry.detail }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", {})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "card-footer",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: entry.timestamp ? `更新于 ${formatWhen(entry.timestamp)}` : "数据暂不可用" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: entry.sourceUrl,
					target: "_blank",
					rel: "noreferrer",
					"aria-label": `查看${entry.title}数据来源（新窗口）`,
					children: [
						entry.sourceName,
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
							"aria-hidden": "true",
							children: "↗"
						})
					]
				})]
			})
		]
	});
}
function Gauge({ entry }) {
	const score = entry.score ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `gauge ${entry.tone}`,
		style: { ["--score"]: String(score) },
		role: "meter",
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		"aria-valuenow": entry.score ?? void 0,
		"aria-label": entry.score == null ? `${entry.title}暂无数据` : `${entry.title}情绪分数 ${entry.score}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "gauge-needle",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "gauge-hub",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "tick tick-zero",
				children: "0"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "tick tick-mid",
				children: "50"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "tick tick-max",
				children: "100"
			})
		]
	});
}
function Skeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "market-card skeleton-card",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "skeleton-line wide" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "skeleton-line short" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "skeleton-gauge" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "skeleton-score" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "skeleton-pill" })
		]
	});
}
function formatWhen(value) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "等待更新";
	return new Intl.DateTimeFormat("zh-CN", {
		month: "numeric",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	}).format(date);
}
//#endregion
export { Home as component };
