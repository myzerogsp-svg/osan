import { o as __toESM } from "../_runtime.mjs";
import { K as require_react, _ as createFileRoute, b as require_jsx_runtime, d as require_react_dom, f as Scripts, g as Outlet, h as createRouter, p as HeadContent, v as createRootRoute, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as ChartPie, a as Route, c as Package, d as ListChecks, f as LayoutDashboard, g as Check, h as ChevronDown, i as Settings, l as PackageCheck, m as ClipboardList, n as TriangleAlert, o as PanelLeft, p as Clock, r as Store, s as PanelLeftClose, t as X, u as MapPin, v as ChartColumn, y as ArrowLeftRight } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import { n as inflateSync } from "../_libs/fflate.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-D7sIHQAS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = require_react_dom();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
function stampOf$1(state) {
	const stamp = Number(state?.savedAt);
	return Number.isFinite(stamp) ? stamp : 0;
}
function cleanCenter(center) {
	const id = String(center?.id ?? "").trim();
	const lines = Math.max(1, Math.min(12, Math.round(Number(center?.lines) || 0)));
	if (!/^[1-9]센터$/.test(id) || lines <= 0) return null;
	return {
		id,
		lines
	};
}
function mergeSites(base, incoming, incomingNewer) {
	const byName = /* @__PURE__ */ new Map();
	const put = (site, prefer) => {
		const name = String(site?.name ?? "").trim();
		if (!name) return;
		const centers = (site?.centers ?? []).map(cleanCenter).filter((center) => center != null);
		if (centers.length === 0) return;
		const prev = byName.get(name);
		if (!prev) {
			byName.set(name, {
				name,
				centers
			});
			return;
		}
		const map = /* @__PURE__ */ new Map();
		const older = prefer ? prev.centers : centers;
		const newer = prefer ? centers : prev.centers;
		for (const center of older) map.set(center.id, center);
		for (const center of newer) map.set(center.id, center);
		byName.set(name, {
			name,
			centers: [...map.values()]
		});
	};
	for (const site of base.sites ?? []) put(site, false);
	for (const site of incoming.sites ?? []) put(site, incomingNewer);
	return [...byName.values()];
}
function mergeRecords(base, incoming, incomingNewer) {
	const next = { ...base ?? {} };
	for (const [key, value] of Object.entries(incoming ?? {})) {
		if (value == null) continue;
		if (incomingNewer || !(key in next)) next[key] = value;
	}
	return next;
}
function mergePanel(base, incoming) {
	const incomingNewer = stampOf$1(incoming) >= stampOf$1(base);
	const sites = mergeSites(base, incoming, incomingNewer);
	const layouts = mergeRecords(base.layouts, incoming.layouts, incomingNewer);
	const codes = mergeRecords(base.codes, incoming.codes, incomingNewer);
	const frozenLocs = mergeRecords(base.frozenLocs, incoming.frozenLocs, incomingNewer);
	const savedAt = Math.max(stampOf$1(base), stampOf$1(incoming));
	return {
		...sites.length ? { sites } : {},
		...Object.keys(codes).length ? { codes } : {},
		...Object.keys(layouts).length ? { layouts } : {},
		...Object.keys(frozenLocs).length ? { frozenLocs } : {},
		savedAt
	};
}
function asPanel(value) {
	if (!value || typeof value !== "object") return {};
	const record = value;
	const state = record.state && typeof record.state === "object" ? record.state : record;
	return {
		sites: Array.isArray(state.sites) ? state.sites : void 0,
		codes: state.codes && typeof state.codes === "object" ? state.codes : void 0,
		layouts: state.layouts && typeof state.layouts === "object" ? state.layouts : void 0,
		frozenLocs: state.frozenLocs && typeof state.frozenLocs === "object" ? state.frozenLocs : void 0,
		savedAt: Number(state.savedAt) || 0
	};
}
var PATH = "/api/panel";
function webview() {
	if (typeof window === "undefined") return null;
	return window.chrome?.webview ?? null;
}
async function pullSharedPanel() {
	const host = webview();
	if (host) {
		host.postMessage("panel-pull");
		return "exe";
	}
	const response = await fetch(PATH + "?t=" + Date.now(), { cache: "no-store" });
	if (!response.ok) throw new Error("제어판을 불러오지 못했습니다.");
	const remote = asPanel(await response.json());
	const merged = mergePanel(readPanel(), remote);
	applySharedPanel(merged);
	if (JSON.stringify(merged) !== JSON.stringify(remote)) await pushPanel(merged);
	return "ok";
}
async function pushPanel(state) {
	const response = await fetch(PATH, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(state)
	});
	if (!response.ok) return;
	applySharedPanel(mergePanel(readPanel(), asPanel(await response.json())));
}
var pushTimer = 0;
function schedulePanelPush() {
	if (typeof window === "undefined" || webview()) return;
	window.clearTimeout(pushTimer);
	pushTimer = window.setTimeout(() => {
		pushPanel(readPanel()).catch(() => {});
	}, 800);
}
var KEY = "center-panel";
var sharedListeners = /* @__PURE__ */ new Set();
function stampOf(state) {
	const stamp = Number(state?.savedAt);
	return Number.isFinite(stamp) ? stamp : 0;
}
function readStored$1() {
	if (typeof window === "undefined") return {};
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
}
function readPanel() {
	const stored = readStored$1();
	if (typeof window === "undefined") return stored;
	const boot = window.__PANEL__;
	if (!boot || typeof boot !== "object") return stored;
	const storedStamp = stampOf(stored);
	const bootStamp = stampOf(boot);
	let chosen;
	if (bootStamp !== storedStamp) chosen = bootStamp > storedStamp ? boot : stored;
	else if (stored.sites || stored.codes || stored.layouts) chosen = stored;
	else chosen = boot;
	if (chosen.layouts == null && (stored.layouts || boot.layouts)) chosen = {
		...chosen,
		layouts: stored.layouts ?? boot.layouts
	};
	if (chosen.codes == null && (stored.codes || boot.codes)) chosen = {
		...chosen,
		codes: stored.codes ?? boot.codes
	};
	if (chosen !== stored) try {
		localStorage.setItem(KEY, JSON.stringify(chosen));
	} catch {}
	return chosen;
}
function onSharedPanel(listener) {
	sharedListeners.add(listener);
	return () => sharedListeners.delete(listener);
}
function applySharedPanel(state) {
	if (!state || typeof state !== "object" || typeof window === "undefined") return;
	if (stampOf(state) < stampOf(readStored$1())) return;
	window.__PANEL__ = state;
	try {
		localStorage.setItem(KEY, JSON.stringify(state));
	} catch {}
	sharedListeners.forEach((listener) => listener(state));
}
function writePanel(patch) {
	const next = {
		...readPanel(),
		...patch,
		savedAt: Date.now()
	};
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(KEY, JSON.stringify(next));
	} catch {}
	window.__PANEL__ = next;
	try {
		(window.chrome?.webview)?.postMessage("panel-save:" + JSON.stringify(next));
	} catch {}
	schedulePanelPush();
}
var DEFAULTS = [{
	name: "신오산",
	centers: [
		{
			id: "1센터",
			lines: 8
		},
		{
			id: "2센터",
			lines: 8
		},
		{
			id: "3센터",
			lines: 4
		}
	]
}, {
	name: "포천",
	centers: [{
		id: "1센터",
		lines: 6
	}, {
		id: "2센터",
		lines: 6
	}]
}];
function clean(list) {
	const names = /* @__PURE__ */ new Set();
	const sites = [];
	for (const item of list) {
		const name = String(item?.name ?? "").trim();
		if (!name || names.has(name)) continue;
		const centers = (item.centers ?? []).map((center) => ({
			id: String(center?.id ?? "").trim(),
			lines: Math.max(1, Math.min(12, Math.round(Number(center?.lines) || 0)))
		})).filter((center) => /^[1-9]센터$/.test(center.id) && center.lines > 0);
		const unique = centers.filter((center, index) => centers.findIndex((item) => item.id === center.id) === index);
		if (unique.length === 0) continue;
		names.add(name);
		sites.push({
			name,
			centers: unique
		});
	}
	return sites.length > 0 ? sites : DEFAULTS.map((site) => ({
		...site,
		centers: site.centers.map((center) => ({ ...center }))
	}));
}
var sites = clean(readPanel().sites ?? []);
var listeners$1 = /* @__PURE__ */ new Set();
function save() {
	writePanel({ sites });
	listeners$1.forEach((listener) => listener());
}
function siteDefs() {
	return sites;
}
function subscribeSites(listener) {
	listeners$1.add(listener);
	return () => listeners$1.delete(listener);
}
function centersOf(site) {
	return (sites.find((item) => item.name === site) ?? sites[0])?.centers.map((center) => center.id) ?? ["1센터"];
}
function linesOf(site, center) {
	const found = sites.find((item) => item.name === site)?.centers.find((item) => item.id === center);
	if (found) return found.lines;
	if (site === "포천") return 6;
	return center === "3센터" ? 4 : 8;
}
function addSite(name) {
	const label = name.trim();
	if (!label) return "이름을 넣어 주세요.";
	if (sites.some((item) => item.name === label)) return "이미 있는 지역입니다.";
	sites = [...sites, {
		name: label,
		centers: [{
			id: "1센터",
			lines: 8
		}]
	}];
	save();
	return "";
}
function removeSite(name) {
	if (sites.length <= 1) return;
	sites = sites.filter((item) => item.name !== name);
	save();
}
function addCenter(site) {
	sites = sites.map((item) => {
		if (item.name !== site || item.centers.length >= 9) return item;
		const used = new Set(item.centers.map((center) => center.id));
		let n = 1;
		while (used.has(`${n}센터`)) n += 1;
		return {
			...item,
			centers: [...item.centers, {
				id: `${n}센터`,
				lines: 8
			}]
		};
	});
	save();
}
function removeCenter(site, id) {
	sites = sites.map((item) => {
		if (item.name !== site || item.centers.length <= 1) return item;
		return {
			...item,
			centers: item.centers.filter((center) => center.id !== id)
		};
	});
	save();
}
function setCenterLines(site, id, lines) {
	const next = Math.max(1, Math.min(12, Math.round(lines)));
	sites = sites.map((item) => item.name !== site ? item : {
		...item,
		centers: item.centers.map((center) => center.id === id ? {
			...center,
			lines: next
		} : center)
	});
	save();
}
onSharedPanel((state) => {
	if (!Array.isArray(state.sites)) return;
	const next = clean(state.sites);
	if (JSON.stringify(next) === JSON.stringify(sites)) return;
	sites = next;
	listeners$1.forEach((listener) => listener());
});
var Dn = [
	`1센터`,
	`2센터`,
	`3센터`
];
var On = Dn;
var kn = `신오산`;
function An(e) {
	On = e;
}
function jn(e) {
	kn = e || `신오산`;
}
function Mn() {
	return On;
}
function Nn() {
	return kn;
}
var Pn = [
	`🔴 1라인`,
	`🟠 2라인`,
	`🟡 3라인`,
	`🟢 4라인`,
	`🔵 5라인`,
	`🟣 6라인`,
	`💗 7라인`,
	`💙 8라인`,
	`🟤 9라인`,
	`⚫ 10라인`,
	`⚪ 11라인`,
	`🔶 12라인`
];
var Fn = {
	"1센터": `🔵 1센터`,
	"2센터": `🟠 2센터`,
	"3센터": `🟣 3센터`
};
var In = [
	{
		id: `전체`,
		label: `전체`
	},
	{
		id: `유제 냉장`,
		label: `유제 냉장`
	},
	{
		id: `FF2`,
		label: `FF2`
	}
];
function Ln(e) {
	let t = e.replace(/\D/g, ``);
	return t ? t.padStart(4, `0`).slice(-4) : ``;
}
function Rn(e, t, n = `작업수량`) {
	let r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = Ln(t.location);
		if (!e) continue;
		let a = r.get(e) ?? /* @__PURE__ */ new Map(), o = t.storeNm || t.storeCd || `점포없음`, s = n === `건수` ? 1 : t.orderQty || 0;
		a.set(o, (a.get(o) ?? 0) + s), r.set(e, a);
		let c = Xn(t.route);
		if (!c) continue;
		let l = i.get(e) ?? /* @__PURE__ */ new Map();
		l.set(c, (l.get(c) ?? 0) + s), i.set(e, l);
	}
	let a = /* @__PURE__ */ new Map();
	for (let [e, t] of r) {
		let n = [...t.entries()].sort((e, t) => t[1] - e[1] || e[0].localeCompare(t[0], `ko`)), r = [...i.get(e)?.entries() ?? []].sort((e, t) => t[1] - e[1] || Number(e[0]) - Number(t[0])), o = n.reduce((e, [, t]) => e + t, 0), s = n.length === 1 ? n[0][0] : `${n[0][0]} 외 ${n.length - 1}`, c = r.length === 0 ? `` : r.length === 1 ? r[0][0] : `${r[0][0]} 외 ${r.length - 1}`;
		a.set(e, {
			count: o,
			store: s,
			route: c
		});
	}
	if (t) for (let [e, n] of Object.entries(t)) {
		let t = Ln(e), r = n.trim();
		t && r && !a.has(t) && a.set(t, {
			count: 0,
			store: r,
			route: ``
		});
	}
	return a;
}
function zn(e, t) {
	if (t === `전체`) return !0;
	if (!/^\d+$/.test(e)) return !1;
	let n = Number(e);
	return t === `유제 냉장` ? n >= 100 && n <= 199 : n >= 200 && n <= 299;
}
function Bn(e) {
	return linesOf(kn, e);
}
var Vn = {
	10: 6e5,
	15: 9e5,
	30: 18e5,
	60: 36e5
};
function Hn(e) {
	if (e == null || e === ``) return null;
	if (e instanceof Date && !Number.isNaN(e.getTime())) return Date.UTC(e.getFullYear(), e.getMonth(), e.getDate(), e.getHours(), e.getMinutes(), e.getSeconds());
	if (typeof e == `number` && Number.isFinite(e)) return e > 2e4 && e < 8e4 ? Math.round((e - 25569) * 864e5) : null;
	let t = String(e).trim(), n = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})\s+(오전|오후)\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
	if (n) {
		let e = Number(n[5]);
		return n[4] === `오후` && e !== 12 && (e += 12), n[4] === `오전` && e === 12 && (e = 0), Date.UTC(Number(n[1]), Number(n[2]) - 1, Number(n[3]), e, Number(n[6]), Number(n[7] ?? 0));
	}
	let r = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})[T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
	return r ? Date.UTC(Number(r[1]), Number(r[2]) - 1, Number(r[3]), Number(r[4]), Number(r[5]), Number(r[6] ?? 0)) : null;
}
function Un(e) {
	if (e == null || e === ``) return null;
	let t = typeof e == `number` ? e : Number(String(e).trim());
	return Number.isFinite(t) ? t : null;
}
function Wn(e) {
	return e == null || e === `` ? `` : typeof e == `number` && Number.isFinite(e) ? String(e) : String(e).trim();
}
function Gn(e) {
	let t = e.map((e, t) => ({
		v: e,
		i: t
	})).filter((e) => e.v > 0).sort((e, t) => t.v - e.v), n = e.map(() => ``), r = 1;
	for (let e = 0; e < t.length; e++) e > 0 && t[e].v < t[e - 1].v && (r = e + 1), n[t[e].i] = `${r}위`;
	return n;
}
function Kn(e, t, n) {
	let r = e != null && t != null ? (t - e) / 36e5 : 0;
	return {
		hours: r,
		perHour: r > 0 ? n / r : 0
	};
}
function qn(e, t) {
	let n = 0, r = 0, i = null, a = null;
	for (let e of t) n += 1, e.at != null && (r += 1, (i == null || e.at < i) && (i = e.at), (a == null || e.at > a) && (a = e.at));
	let { hours: o, perHour: s } = Kn(i, a, r);
	return {
		id: e,
		planned: n,
		done: r,
		left: n - r,
		rate: n ? r / n : 0,
		first: i,
		last: a,
		hours: o,
		perHour: s,
		rank: ``
	};
}
function Jn(e) {
	let t = Gn(e.map((e) => e.perHour));
	return e.map((e, n) => ({
		...e,
		rank: t[n] ?? ``
	}));
}
function Yn(e, t = 8) {
	let n = [];
	for (let r = 1; r <= t; r++) {
		let t = 0, i = 0, a = null, o = null;
		for (let n of e) n.line === r && (t += 1, n.at != null && (i += 1, (a == null || n.at < a) && (a = n.at), (o == null || n.at > o) && (o = n.at)));
		let { hours: s, perHour: c } = Kn(a, o, i);
		n.push({
			line: r,
			planned: t,
			done: i,
			left: t - i,
			rate: t ? i / t : 0,
			first: a,
			last: o,
			hours: s,
			perHour: c,
			rank: ``
		});
	}
	let r = Gn(n.map((e) => e.perHour));
	return n.map((e, t) => ({
		...e,
		rank: r[t] ?? ``
	}));
}
function Xn(e) {
	return /^\d+$/.test(e) ? String(Number(e) % 100) : e;
}
function Zn(e, t = !1) {
	let n = /* @__PURE__ */ new Map();
	for (let r of e) {
		let e = r.route || `없음`, i = t ? Xn(e) : e, a = n.get(i) ?? {
			route: i,
			planned: 0,
			done: 0,
			left: 0,
			rate: 0,
			first: null,
			last: null,
			members: ``,
			lines: ``,
			lineKey: 99,
			memberSet: /* @__PURE__ */ new Set(),
			lineSet: /* @__PURE__ */ new Set()
		};
		a.planned += 1, r.at != null && (a.done += 1, (a.first == null || r.at < a.first) && (a.first = r.at), (a.last == null || r.at > a.last) && (a.last = r.at)), r.line >= 1 && r.line <= 8 && a.lineSet.add(r.line), t && e !== `없음` && a.memberSet.add(e), n.set(i, a);
	}
	let r = [];
	for (let e of n.values()) {
		e.left = e.planned - e.done, e.rate = e.planned ? e.done / e.planned : 0;
		let t = [...e.memberSet].sort((e, t) => e.localeCompare(t, `ko`, { numeric: !0 }));
		e.members = t.length > 1 || t.length === 1 && t[0] !== e.route ? t.join(`, `) : ``;
		let n = [...e.lineSet].sort((e, t) => e - t);
		e.lines = n.join(`, `), e.lineKey = n[0] ?? 99, r.push({
			route: e.route,
			planned: e.planned,
			done: e.done,
			left: e.left,
			rate: e.rate,
			first: e.first,
			last: e.last,
			members: e.members,
			lines: e.lines,
			lineKey: e.lineKey
		});
	}
	return r.sort((e, t) => e.route === `없음` ? 1 : t.route === `없음` ? -1 : e.route.localeCompare(t.route, `ko`, { numeric: !0 }));
}
function Qn(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of e) {
		if (t > 0 && r.line !== t) continue;
		let e = r.storeNm || `점포없음`, i = r.storeCd || ``, a = `${i}|${e}`, o = n.get(a) ?? {
			key: a,
			store: e,
			code: i,
			lines: ``,
			planned: 0,
			done: 0,
			left: 0,
			rate: 0,
			lineSet: /* @__PURE__ */ new Set()
		};
		o.planned += 1, r.at != null && (r.qty || 0) > 0 && ((r.orderQty || 0) <= 0 || (r.qty || 0) >= r.orderQty) && (o.done += 1), r.line >= 1 && r.line <= 8 && o.lineSet.add(r.line), n.set(a, o);
	}
	return [...n.values()].map((e) => {
		let t = [...e.lineSet].sort((e, t) => e - t);
		return {
			key: e.key,
			store: e.store,
			code: e.code,
			lines: t.join(`, `),
			planned: e.planned,
			done: e.done,
			left: e.planned - e.done,
			rate: e.planned ? e.done / e.planned : 0
		};
	}).sort((e, t) => e.store.localeCompare(t.store, `ko`));
}
function $n(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	for (let i of e) {
		if (n > 0 && i.line !== n || `${i.storeCd || ``}|${i.storeNm || `점포없음`}` !== t) continue;
		let e = i.goodsCd || ``, a = i.goodsNm || `상품없음`, o = `${e}|${a}`, s = r.get(o) ?? {
			key: o,
			code: e,
			name: a,
			count: 0,
			qty: 0,
			totalQty: 0,
			workQty: 0,
			leftQty: 0
		}, c = i.orderQty || i.qty || 0, l = i.qty || 0, f = i.at != null && l > 0 && ((i.orderQty || 0) <= 0 || l >= i.orderQty);
		s.totalQty += c, f ? s.workQty += l : (s.count += 1, s.qty += l, s.leftQty += Math.max(c - l, 0)), r.set(o, s);
	}
	return [...r.values()].filter((e) => e.count > 0).sort((e, t) => t.count - e.count || e.name.localeCompare(t.name, `ko`));
}
function tr(e, t = 8) {
	return Yn(e, t).map((e) => {
		let t = null;
		return e.left === 0 && e.last != null ? t = e.last : e.left > 0 && e.perHour > 0 && e.last != null && (t = e.last + e.left / e.perHour * 36e5), {
			line: e.line,
			planned: e.planned,
			done: e.done,
			left: e.left,
			perHour: e.perHour,
			last: e.last,
			eta: t
		};
	});
}
function nr(e) {
	let t = 0, n = 0, r = 0, i = null;
	for (let a of e) t += a.planned, n += a.done, r += a.left, a.last != null && (i == null || a.last > i) && (i = a.last);
	let a = e.filter((e) => e.left > 0 && e.planned > 0), o = a.filter((e) => e.eta == null).map((e) => e.line), s = null, c = null;
	if (r === 0) s = i;
	else if (o.length === 0) for (let e of a) e.eta != null && (s == null || e.eta > s) && (s = e.eta, c = e.line);
	return {
		planned: t,
		done: n,
		left: r,
		eta: s,
		slowLine: c,
		unknown: o,
		snapshot: i
	};
}
function rr(e) {
	if (e == null) return `—`;
	if (e <= 3e4) return `끝남`;
	let t = Math.round(e / 6e4), n = Math.floor(t / 60), r = t % 60;
	return n <= 0 ? `${r}분` : r === 0 ? `${n}시간` : `${n}시간 ${r}분`;
}
function ir(e, t) {
	if (e == null) return `—`;
	let n = cr(e);
	if (t == null) return n;
	let r = dr(t), i = dr(e);
	return r.key === i.key ? n : `${i.date} ${n}`;
}
function ar(e, t) {
	let n = Vn[t] ?? t * 6e4, r = new Date(e), i = Date.UTC(r.getUTCFullYear(), r.getUTCMonth(), r.getUTCDate());
	return i + Math.floor((e - i) / n) * n;
}
function or(e, t, n) {
	let r = Vn[t] ?? t * 6e4, i = null, a = null;
	for (let t of e) t.at != null && ((i == null || t.at < i) && (i = t.at), (a == null || t.at > a) && (a = t.at));
	if (i == null || a == null) return [];
	let o = ar(i, t), s = ar(a, t), c = [];
	for (let e = o; e <= s; e += r) c.push({
		start: e,
		end: e + r,
		count: 0,
		perHour: 0,
		cumulative: 0,
		totalRate: 0,
		pickQty: 0,
		sliceRate: 0,
		lines: Array.from({ length: 8 }, () => 0)
	});
	for (let t of e) {
		if (t.at == null) continue;
		let e = c[Math.floor((t.at - o) / r)];
		e && (e.count += 1, e.pickQty += t.qty || 0, t.line >= 1 && t.line <= 8 && (e.lines[t.line - 1] += 1));
	}
	let l = 0, u = 60 / t;
	for (let e of c) l += e.count, e.cumulative = l, e.perHour = e.count * u, e.totalRate = n ? l / n : 0, e.sliceRate = n ? e.count / n : 0;
	return c;
}
function sr(e) {
	let t = -1;
	for (let n = 0; n < e.length; n++) e[n].pickQty !== 0 && (t = n);
	if (t < 0) return Array.from({ length: 8 }, () => 0);
	let n = t + 1, r = Array.from({ length: 8 }, () => 0);
	for (let n = 0; n <= t; n++) for (let t = 0; t < 8; t++) r[t] += e[n].lines[t];
	return r.map((e) => e / n);
}
function cr(e) {
	if (e == null) return ``;
	let t = Math.round(e / 6e4) * 6e4, n = new Date(t);
	return `${String(n.getUTCHours()).padStart(2, `0`)}:${String(n.getUTCMinutes()).padStart(2, `0`)}`;
}
function lr(e) {
	if (e == null) return ``;
	let t = new Date(e);
	return `${String(t.getUTCHours()).padStart(2, `0`)}:${String(t.getUTCMinutes()).padStart(2, `0`)}:${String(t.getUTCSeconds()).padStart(2, `0`)}`;
}
var ur = [
	`일요일`,
	`월요일`,
	`화요일`,
	`수요일`,
	`목요일`,
	`금요일`,
	`토요일`
];
function dr(e) {
	let t = new Date(e), n = t.getUTCMonth() + 1, r = t.getUTCDate();
	return {
		key: `${t.getUTCFullYear()}-${n}-${r}`,
		date: `${n}월 ${r}일`,
		week: ur[t.getUTCDay()] ?? ``
	};
}
function fr(e, t) {
	if (e == null) return {
		date: `—`,
		week: `—`
	};
	let n = dr(e), r = t == null ? n : dr(t);
	return n.key === r.key ? {
		date: n.date,
		week: n.week
	} : {
		date: `${n.date} ~ ${r.date}`,
		week: `${n.week} ~ ${r.week}`
	};
}
function pr(e, t) {
	if (e.length === 0) return 0;
	if (e.length === 1) return e[0];
	let n = (e.length - 1) * t, r = Math.floor(n), i = Math.ceil(n);
	return r === i ? e[r] : e[r] + (e[i] - e[r]) * (n - r);
}
function mr(e, t, n) {
	let r = Math.min(1, Math.max(0, n)), i = e.map((e, n) => Math.round(e + (t[n] - e) * r));
	return `rgb(${i[0]} ${i[1]} ${i[2]})`;
}
var hr = [
	255,
	255,
	255
];
var gr = [
	255,
	249,
	196
];
var _r = [
	39,
	174,
	96
];
var vr = [
	99,
	190,
	123
];
var yr = [
	255,
	235,
	132
];
var br = [
	248,
	105,
	107
];
function xr(e) {
	let t = [...e].sort((e, t) => e - t), n = pr(t, .5), r = pr(t, .9);
	return (e) => e <= 0 ? `transparent` : r <= n ? mr(gr, _r, 1) : e <= n ? mr(hr, gr, n <= 0 ? 1 : e / n) : e >= r ? mr(gr, _r, 1) : mr(gr, _r, (e - n) / (r - n));
}
function Sr(e) {
	let t = e.filter((e) => e != null).sort((e, t) => e - t), n = t[0] ?? 0, r = t[t.length - 1] ?? 0, i = pr(t, .5);
	return (e) => e == null || t.length === 0 ? `transparent` : r === n ? mr(yr, yr, 0) : e <= i ? mr(vr, yr, i === n ? 1 : (e - n) / (i - n)) : mr(yr, br, r === i ? 1 : (e - i) / (r - i));
}
function Cr(e) {
	let [t, n, r] = e.split(`-`).map(Number);
	return !t || !n || !r ? `` : ur[new Date(Date.UTC(t, n - 1, r)).getUTCDay()] ?? ``;
}
function wr(e) {
	let [t, n] = e.split(`-`);
	return `${t}년 ${Number(n)}월`;
}
function Tr(e) {
	let [t, n, r] = e.split(`-`).map(Number), i = new Date(Date.UTC(t, n - 1, r)), a = i.getUTCDay() || 7, o = new Date(i);
	o.setUTCDate(i.getUTCDate() + 4 - a);
	let s = new Date(Date.UTC(o.getUTCFullYear(), 0, 1)), c = Math.ceil(((o.getTime() - s.getTime()) / 864e5 + 1) / 7), l = new Date(i);
	l.setUTCDate(i.getUTCDate() - a + 1);
	let u = new Date(l);
	u.setUTCDate(l.getUTCDate() + 6);
	let d = (e) => `${e.getUTCMonth() + 1}/${e.getUTCDate()}`;
	return {
		key: `${o.getUTCFullYear()}-W${String(c).padStart(2, `0`)}`,
		label: `${o.getUTCFullYear()}년 ${c}주`,
		range: `${d(l)}~${d(u)}`
	};
}
function Er(e, t) {
	let n = e.replace(/\.[^.]+$/, ``), r = /FF\s*1(?!\d)/i.test(n) ? `FF1` : /FF\s*2(?!\d)/i.test(n) ? `FF2` : null;
	if (!r || t < 2e3) return null;
	let i = (e, t, n) => `${e}-${t.padStart(2, `0`)}-${n.padStart(2, `0`)}`, a = n.match(/(20\d{2})[-_.\/년\s]*(0?[1-9]|1[0-2])[-_.\/월\s]*([0-2]?\d|3[01])(?!\d)/);
	if (a) return {
		date: i(a[1], a[2], a[3]),
		kind: r
	};
	let o = n.match(/(0?[1-9]|1[0-2])\s*월\s*([0-2]?\d|3[01])\s*일/);
	if (o) return {
		date: i(String(t), o[1], o[2]),
		kind: r
	};
	let s = n.match(/(?:^|[^0-9])(0?[1-9]|1[0-2])[-_.\/]([0-2]?\d|3[01])(?!\d)/);
	if (s) return {
		date: i(String(t), s[1], s[2]),
		kind: r
	};
	let c = n.match(/(?:^|[^0-9])(0[1-9]|1[0-2])([0-2]\d|3[01])(?!\d)/);
	return c ? {
		date: i(String(t), c[1], c[2]),
		kind: r
	} : null;
}
function Dr(e, t, n, r, i, a, o) {
	let s = a === 0 ? qn(i, o) : Yn(o).find((e) => e.line === a);
	return !s || s.planned === 0 ? null : {
		period: e,
		sub: t,
		sort: n,
		dpt: r,
		center: i,
		line: a,
		days: 1,
		planned: s.planned,
		done: s.done,
		left: s.left,
		rate: s.rate,
		hours: s.hours,
		perHour: s.perHour,
		first: s.first,
		last: s.last
	};
}
function Or(e) {
	if (!/^\d+$/.test(e)) return ``;
	let t = Number(e);
	return t >= 100 && t <= 199 ? `유제 냉장` : t >= 200 && t <= 299 ? `FF2` : t >= 300 && t <= 399 ? `FF1` : ``;
}
function kr(e, t, n) {
	let r = `${Number(e.slice(5, 7))}월 ${Number(e.slice(8, 10))}일`, i = Cr(e), a = /* @__PURE__ */ new Map();
	for (let e of Dn) for (let r of n[e] ?? []) {
		let n = Or(r.route), i = ``;
		if (t === `FF1`) {
			if (n === `유제 냉장` || n === `FF2`) continue;
			i = `FF1`;
		} else (n === `유제 냉장` || n === `FF2`) && (i = n);
		if (!i) continue;
		let o = a.get(i) ?? {};
		o[e] = [...o[e] ?? [], r], a.set(i, o);
	}
	let o = [];
	for (let [t, n] of a) for (let a of Dn) {
		let s = n[a] ?? [];
		if (s.length === 0) continue;
		let c = Dr(r, i, e, t, a, 0, s);
		c && o.push(c);
		for (let n = 1; n <= Bn(a); n++) {
			let c = Dr(r, i, `${e}-${n}`, t, a, n, s);
			c && o.push(c);
		}
	}
	return o;
}
function Ar(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of e) {
		let e = r.sort.slice(0, 10), i = Tr(e), a = t === `week` ? i.label : wr(e), o = t === `week` ? i.range : ``, s = t === `week` ? i.key : e.slice(0, 7), c = `${s}|${r.dpt}|${r.center}|${r.line}`, l = n.get(c) ?? {
			period: a,
			sub: o,
			sort: s,
			dpt: r.dpt,
			center: r.center,
			line: r.line,
			days: 0,
			planned: 0,
			done: 0,
			left: 0,
			rate: 0,
			hours: 0,
			perHour: 0,
			first: null,
			last: null,
			daySet: /* @__PURE__ */ new Set()
		};
		l.planned += r.planned, l.done += r.done, l.hours += r.hours, l.daySet.add(e), r.first != null && (l.first == null || r.first < l.first) && (l.first = r.first), r.last != null && (l.last == null || r.last > l.last) && (l.last = r.last), n.set(c, l);
	}
	return [...n.values()].map((e) => {
		let { daySet: t, ...n } = e;
		return n.days = t.size, n.left = n.planned - n.done, n.rate = n.planned ? n.done / n.planned : 0, n.perHour = n.hours > 0 ? n.done / n.hours : 0, n;
	}).sort((e, t) => e.sort.localeCompare(t.sort) || e.center.localeCompare(t.center, `ko`) || e.line - t.line || e.dpt.localeCompare(t.dpt, `ko`));
}
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
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900",
				onClick: () => window.location.reload(),
				children: "다시 불러오기"
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
function readCap() {
	const hash = window.location.hash;
	if (!hash.startsWith("#cap=")) return "";
	const body = hash.slice(5).replace(/\s/g, "");
	if (body.length < 32) return "";
	return `data:image/jpeg;base64,${body}`;
}
function ClipBridge() {
	const [src, setSrc] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("이 컴퓨터에 복사한 뒤 카톡에 붙여넣으세요.");
	(0, import_react.useEffect)(() => {
		const apply = () => setSrc(readCap());
		apply();
		window.addEventListener("hashchange", apply);
		return () => window.removeEventListener("hashchange", apply);
	}, []);
	if (!src) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-[200] flex flex-col bg-[#f2f2f7]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3 px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[15px] font-semibold text-[#1c1c1e]",
					children: "캡쳐 그림"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-10 rounded-full bg-[#007aff] px-4 text-[15px] font-semibold text-white",
					onClick: () => {
						const image = new Image();
						image.onload = () => {
							const canvas = document.createElement("canvas");
							canvas.width = image.naturalWidth;
							canvas.height = image.naturalHeight;
							canvas.getContext("2d")?.drawImage(image, 0, 0);
							canvas.toBlob(async (blob) => {
								if (!blob) {
									setNote("그림을 복사하지 못했습니다.");
									return;
								}
								try {
									await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
									setNote("이 컴퓨터에 복사했습니다. 카톡에 붙여넣으세요.");
								} catch {
									setNote("복사 버튼을 한 번 더 눌러 주세요.");
								}
							}, "image/png");
						};
						image.onerror = () => setNote("그림을 열지 못했습니다.");
						image.src = src;
					},
					children: "이 컴퓨터에 복사"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-4 pb-3 text-[13px] text-[#8e8e93]",
				children: note
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 flex-1 overflow-auto px-4 pb-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src,
					alt: "캡쳐한 그림",
					className: "mx-auto max-w-full rounded-2xl bg-white shadow-sm"
				})
			})
		]
	});
}
var styles_default = "/assets/styles-BIA2JRg9.css";
function shareHost() {
	const host = String("").split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
	if (!host || !/^[a-z0-9.-]+$/.test(host) || !host.includes(".")) return "";
	if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return "";
	if (host === "vercel.app" || host.endsWith(".vercel.app") || host === "vercel.com" || host.endsWith(".vercel.com")) return "";
	return host;
}
var Route$3 = createRootRoute({
	head: () => {
		const host = shareHost();
		const xBanner = host ? `https://${host}/x-banner.jpg` : "";
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{ title: "센터 생산성" },
				{
					name: "theme-color",
					content: "#1a5276"
				},
				...xBanner ? [
					{
						property: "x:game:image",
						content: xBanner
					},
					{
						property: "x:game:image:width",
						content: "1200"
					},
					{
						property: "x:game:image:height",
						content: "264"
					}
				] : []
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
				},
				{
					rel: "stylesheet",
					href: "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap"
				}
			]
		};
	},
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "ko",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
function Tick({ on }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		"aria-hidden": true,
		className: "grid size-[18px] shrink-0 place-items-center rounded-[5px] " + (on ? "bg-[#007aff]" : "border border-[#c7c7cc] bg-white"),
		children: on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			width: "12",
			height: "10",
			viewBox: "0 0 12 10",
			fill: "none",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M1.4 5.1 4.3 8.1 10.6 1.6",
				stroke: "white",
				strokeWidth: "1.8",
				strokeLinecap: "round",
				strokeLinejoin: "round"
			})
		}) : null
	});
}
function Shell({ label, text, compact, soft = false, up = false, end = false, fill = false, float = false, children }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [box, setBox] = (0, import_react.useState)(null);
	const ref = (0, import_react.useRef)(null);
	const buttonRef = (0, import_react.useRef)(null);
	const menuRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const close = (event) => {
			const node = event.target;
			if (ref.current?.contains(node) || menuRef.current?.contains(node)) return;
			setOpen(false);
		};
		document.addEventListener("pointerdown", close);
		return () => document.removeEventListener("pointerdown", close);
	}, [open]);
	(0, import_react.useEffect)(() => {
		if (!open || !float) return;
		const place = () => {
			const rect = buttonRef.current?.getBoundingClientRect();
			if (!rect) return;
			setBox({
				top: rect.bottom + 4,
				left: rect.left
			});
		};
		place();
		window.addEventListener("resize", place);
		window.addEventListener("scroll", place, true);
		return () => {
			window.removeEventListener("resize", place);
			window.removeEventListener("scroll", place, true);
		};
	}, [open, float]);
	const menu = open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: menuRef,
		className: (float ? "fixed z-[70] " : up ? "absolute bottom-full z-50 mb-1 " : "absolute z-50 mt-1 ") + (end && !float ? "right-0 " : "left-0 ") + "max-h-72 min-w-52 overflow-auto rounded-2xl border border-black/10 bg-white py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
		style: float && box ? {
			top: box.top,
			left: box.left
		} : void 0,
		children: children(() => setOpen(false))
	}) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref,
		className: fill ? "relative w-full" : "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			ref: buttonRef,
			type: "button",
			"aria-expanded": open,
			className: (soft ? "inline-flex h-7 items-center gap-1 rounded-full bg-[#f2f2f7] px-2.5 text-xs font-semibold" : compact ? "inline-flex h-7 max-w-full items-center gap-1 rounded-full bg-[#f2f2f7] px-2.5 text-xs font-semibold text-[#1c1c1e]" : "flex h-[40px] max-w-64 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-sm") + (fill ? " w-full justify-center" : ""),
			onClick: () => {
				if (!open && float) {
					const rect = buttonRef.current?.getBoundingClientRect();
					if (rect) setBox({
						top: rect.bottom + 4,
						left: rect.left
					});
				}
				setOpen((value) => !value);
			},
			children: [label ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "shrink-0 text-[#6b7280]",
				children: label
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "min-w-0 truncate font-medium text-[#1c1c1e]",
				children: text
			})]
		}), float ? open && box ? (0, import_react_dom.createPortal)(menu, document.body) : null : menu]
	});
}
function PickMenu({ label, value, options, onChange, compact = false, soft = false, up = false, search = false, searchLabel = "검색", onSearch, float = false }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const current = options.find((item) => item.id === value)?.label ?? value;
	const needle = query.trim().toLowerCase();
	const matches = !needle ? options : options.filter((item) => item.id !== "전체" && (item.label.toLowerCase().includes(needle) || item.id.toLowerCase().includes(needle)));
	const shown = !search || !needle ? options : matches;
	const text = search && query.trim() ? query.trim() : current;
	function applyQuery(next) {
		setQuery(next);
		onSearch?.(next);
		if (!next.trim()) onChange("전체");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
		label,
		text,
		compact,
		soft,
		up,
		float,
		children: (close) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			search ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sticky top-0 z-10 bg-white px-2 pb-1.5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					autoFocus: true,
					value: query,
					onChange: (event) => applyQuery(event.target.value),
					onKeyDown: (event) => {
						if (event.key !== "Enter") return;
						event.preventDefault();
						close();
					},
					placeholder: searchLabel,
					"aria-label": searchLabel,
					className: "h-9 w-full rounded-lg border border-black/10 px-2.5 text-sm outline-none"
				})
			}) : null,
			shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-3 py-2 text-sm text-[#8e8e93]",
				children: "없습니다."
			}) : null,
			shown.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[15px] text-[#1c1c1e] hover:bg-[#f2f2f7]",
				onClick: () => {
					setQuery("");
					onSearch?.("");
					onChange(item.id);
					close();
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tick, { on: needle ? true : item.id === value }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "whitespace-nowrap",
					children: item.label
				})]
			}, item.id))
		] })
	});
}
function CheckMenu({ label, text, rows, onToggle, compact = false, soft = false, up = false, search = false, searchLabel = "검색", onSearch, end = false, fill = false, float = false, showLabel = false }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const needle = query.trim().toLowerCase();
	const shown = !search || !needle ? rows : rows.filter((item) => item.id !== "전체" && (item.label.toLowerCase().includes(needle) || item.id.toLowerCase().includes(needle)));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
		label: compact && !showLabel ? "" : label,
		text,
		compact,
		soft,
		up,
		end,
		fill,
		float,
		children: (close) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			search ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sticky top-0 z-10 bg-white px-2 pb-1.5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					autoFocus: true,
					value: query,
					onChange: (event) => setQuery(event.target.value),
					onKeyDown: (event) => {
						if (event.key !== "Enter") return;
						event.preventDefault();
						onSearch?.(query);
						close();
					},
					placeholder: searchLabel,
					"aria-label": searchLabel,
					className: "h-9 w-full rounded-lg border border-black/10 px-2.5 text-sm outline-none"
				})
			}) : null,
			shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-3 py-2 text-sm text-[#8e8e93]",
				children: "찾는 항목이 없습니다."
			}) : null,
			shown.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[15px] text-[#1c1c1e] hover:bg-[#f2f2f7]",
				onClick: () => onToggle(item.id),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tick, { on: item.checked }),
					item.swatch ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block size-3 shrink-0 rounded-sm " + item.swatch }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "whitespace-nowrap",
						children: item.label
					})
				]
			}, item.id))
		] })
	});
}
var CENTER_ALIAS = {
	"1센터": "1센터",
	"2센터": "2센터",
	"3센터": "3센터",
	원본_1센터: "1센터",
	원본_2센터: "2센터",
	원본_3센터: "3센터"
};
function u16(b, o) {
	return b[o] | b[o + 1] << 8;
}
function u32(b, o) {
	return (b[o] | b[o + 1] << 8 | b[o + 2] << 16 | b[o + 3] << 24) >>> 0;
}
function zipEntries(buf) {
	let eocd = -1;
	const min = Math.max(0, buf.length - 22 - 65557);
	for (let i = buf.length - 22; i >= min; i--) if (buf[i] === 80 && buf[i + 1] === 75 && buf[i + 2] === 5 && buf[i + 3] === 6) {
		eocd = i;
		break;
	}
	if (eocd < 0) throw new Error("엑셀 파일 형식을 알아보지 못했습니다.");
	const cdOff = u32(buf, eocd + 16);
	const cdSize = u32(buf, eocd + 12);
	const entries = [];
	let p = cdOff;
	const end = cdOff + cdSize;
	const decoder = new TextDecoder();
	while (p + 46 <= end && p + 46 <= buf.length) {
		if (u32(buf, p) !== 33639248) break;
		const method = u16(buf, p + 10);
		const compSize = u32(buf, p + 20);
		const nameLen = u16(buf, p + 28);
		const extraLen = u16(buf, p + 30);
		const commentLen = u16(buf, p + 32);
		const localOff = u32(buf, p + 42);
		const name = decoder.decode(buf.subarray(p + 46, p + 46 + nameLen));
		entries.push({
			name,
			method,
			compSize,
			offset: localOff
		});
		p += 46 + nameLen + extraLen + commentLen;
	}
	return entries;
}
function zipRead(buf, entry) {
	const p = entry.offset;
	if (u32(buf, p) !== 67324752) throw new Error("엑셀 안 시트를 열지 못했습니다.");
	const nameLen = u16(buf, p + 26);
	const extraLen = u16(buf, p + 28);
	const start = p + 30 + nameLen + extraLen;
	const comp = buf.subarray(start, start + entry.compSize);
	if (entry.method === 0) return comp;
	if (entry.method === 8) return inflateSync(comp);
	throw new Error("이 엑셀 압축은 읽지 못합니다.");
}
function stripNs(xml) {
	return xml.replace(/^\uFEFF/, "").replace(/<\/?x:/g, (tag) => tag.replace("x:", ""));
}
function decodeXml(s) {
	return s.replace(/&(#x[\da-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, ent) => {
		if (ent === "amp") return "&";
		if (ent === "lt") return "<";
		if (ent === "gt") return ">";
		if (ent === "quot") return "\"";
		if (ent === "apos") return "'";
		if (ent[1] === "x") return String.fromCodePoint(parseInt(ent.slice(2), 16));
		return String.fromCodePoint(parseInt(ent.slice(1), 10));
	});
}
function attr(tag, name) {
	const m = tag.match(new RegExp(`${name}="([^"]*)"`));
	return m ? decodeXml(m[1]) : null;
}
function sharedStrings(xml) {
	const out = [];
	const re = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
	const tRe = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
	let m;
	while (m = re.exec(xml)) {
		tRe.lastIndex = 0;
		let text = "";
		let t;
		while (t = tRe.exec(m[1])) text += decodeXml(t[1]);
		out.push(text);
	}
	return out;
}
function sheetList(workbookXml, relsXml) {
	const rels = /* @__PURE__ */ new Map();
	const relRe = /<Relationship\b([^>]*)\/>/g;
	let rel;
	while (rel = relRe.exec(relsXml)) {
		const id = attr(rel[1], "Id");
		const target = attr(rel[1], "Target");
		if (id && target) rels.set(id, target.replace(/^\/?xl\//, "").replace(/^\//, ""));
	}
	const sheets = [];
	const sheetRe = /<sheet\b([^>]*)\/>/g;
	let sh;
	while (sh = sheetRe.exec(workbookXml)) {
		const name = attr(sh[1], "name");
		const id = attr(sh[1], "r:id") ?? attr(sh[1], "id");
		if (!name || !id) continue;
		const target = rels.get(id);
		if (!target) continue;
		sheets.push({
			name,
			path: target.startsWith("xl/") ? target : `xl/${target}`
		});
	}
	return sheets;
}
function cellValue(attrs, inner, strings) {
	if (!inner) return null;
	const v = inner.match(/<v>([\s\S]*?)<\/v>/);
	if (/t="s"/.test(attrs) && v) return strings[Number(v[1])] ?? null;
	if (/t="inlineStr"/.test(attrs)) {
		const t = inner.match(/<t\b[^>]*>([\s\S]*?)<\/t>/);
		return t ? decodeXml(t[1]) : null;
	}
	if (!v) return null;
	const raw = decodeXml(v[1]);
	if (/t="str"|t="b"/.test(attrs)) return raw;
	const n = Number(raw);
	return Number.isFinite(n) ? n : raw;
}
function headerMap(rowXml, strings) {
	const map = /* @__PURE__ */ new Map();
	const re = /<c r="([A-Z]{1,3})1"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
	let m;
	while (m = re.exec(rowXml)) {
		const val = cellValue(m[2], m[3] ?? "", strings);
		if (val == null || val === "") continue;
		map.set(String(val).trim().toLowerCase(), m[1]);
	}
	return map;
}
function collectColumns(xml, columns, strings) {
	const out = new Map(columns.map((c) => [c, /* @__PURE__ */ new Map()]));
	const alt = [...columns].sort((a, b) => b.length - a.length).join("|");
	const re = new RegExp(`<c r="(${alt})(\\d+)"([^>]*?)(?:/>|>([\\s\\S]*?)</c>)`, "g");
	let m;
	while (m = re.exec(xml)) {
		const row = Number(m[2]);
		if (row < 1) continue;
		const val = cellValue(m[3], m[4] ?? "", strings);
		if (val == null || val === "") continue;
		out.get(m[1])?.set(row, val);
	}
	return out;
}
function jobsFromXml(xml, strings) {
	const rowStart = xml.indexOf("<row r=\"1\"");
	const rowEnd = rowStart < 0 ? -1 : xml.indexOf("</row>", rowStart);
	const headers = rowStart >= 0 && rowEnd > rowStart ? headerMap(xml.slice(rowStart, rowEnd), strings) : /* @__PURE__ */ new Map();
	const hasHeader = headers.has("blockno") && headers.has("pickdt");
	const blockCol = headers.get("blockno") ?? "R";
	const pickCol = headers.get("pickdt") ?? "Z";
	const qtyCol = headers.get("pickqt") ?? "M";
	const orderCol = headers.get("orderqt") ?? "";
	const routeCol = headers.get("rtecod") ?? "";
	const storeNameCol = headers.get("clientnm") ?? headers.get("storenm") ?? headers.get("점포명") ?? "";
	const storeCodeCol = headers.get("clientcd") ?? headers.get("storecd") ?? headers.get("점포코드") ?? "";
	const goodsNameCol = headers.get("goodsnm") ?? headers.get("상품명") ?? "";
	const goodsCodeCol = headers.get("goodscd") ?? headers.get("상품코드") ?? "";
	const locationCol = headers.get("locationcd") ?? headers.get("loccd") ?? headers.get("로케이션코드") ?? headers.get("로케이션") ?? "";
	const groupCol = headers.get("groupid") ?? "";
	const cols = collectColumns(xml, [
		blockCol,
		pickCol,
		qtyCol,
		orderCol,
		routeCol,
		storeNameCol,
		storeCodeCol,
		goodsNameCol,
		goodsCodeCol,
		locationCol,
		groupCol
	].filter(Boolean), strings);
	const blocks = cols.get(blockCol) ?? /* @__PURE__ */ new Map();
	const picks = cols.get(pickCol) ?? /* @__PURE__ */ new Map();
	const qtys = cols.get(qtyCol) ?? /* @__PURE__ */ new Map();
	const orders = orderCol ? cols.get(orderCol) ?? /* @__PURE__ */ new Map() : /* @__PURE__ */ new Map();
	const routes = routeCol ? cols.get(routeCol) ?? /* @__PURE__ */ new Map() : /* @__PURE__ */ new Map();
	const storeNms = storeNameCol ? cols.get(storeNameCol) ?? /* @__PURE__ */ new Map() : /* @__PURE__ */ new Map();
	const storeCds = storeCodeCol ? cols.get(storeCodeCol) ?? /* @__PURE__ */ new Map() : /* @__PURE__ */ new Map();
	const goodsNms = goodsNameCol ? cols.get(goodsNameCol) ?? /* @__PURE__ */ new Map() : /* @__PURE__ */ new Map();
	const goodsCds = goodsCodeCol ? cols.get(goodsCodeCol) ?? /* @__PURE__ */ new Map() : /* @__PURE__ */ new Map();
	const locations = locationCol ? cols.get(locationCol) ?? /* @__PURE__ */ new Map() : /* @__PURE__ */ new Map();
	const groups = groupCol ? cols.get(groupCol) ?? /* @__PURE__ */ new Map() : /* @__PURE__ */ new Map();
	const jobs = [];
	const rowKeys = /* @__PURE__ */ new Set([...blocks.keys(), ...groups.keys()]);
	for (const row of rowKeys) {
		if (hasHeader && row <= 1) continue;
		const line = Un(blocks.get(row));
		const groupId = String(groups.get(row) ?? "").trim();
		if (line == null && !groupId) continue;
		const qtyRaw = qtys.get(row);
		const qty = typeof qtyRaw === "number" ? qtyRaw : Number(qtyRaw);
		const orderRaw = orders.get(row);
		const orderQty = typeof orderRaw === "number" ? orderRaw : Number(orderRaw);
		jobs.push({
			line,
			at: Hn(picks.get(row) ?? null),
			qty: Number.isFinite(qty) ? qty : 0,
			orderQty: Number.isFinite(orderQty) ? orderQty : 0,
			route: Wn(routes.get(row) ?? null),
			storeCd: Wn(storeCds.get(row) ?? null),
			storeNm: Wn(storeNms.get(row) ?? null),
			goodsCd: Wn(goodsCds.get(row) ?? null),
			goodsNm: Wn(goodsNms.get(row) ?? null),
			location: Wn(locations.get(row) ?? null),
			groupId
		});
	}
	return jobs;
}
function centerIdFrom(name) {
	const trimmed = name.trim();
	const marked = trimmed.match(/^(?:원본_)?([1-9])\s*센터$/);
	if (marked) return `${marked[1]}센터`;
	return CENTER_ALIAS[trimmed] ?? null;
}
function sheetRole(name) {
	const hit = centerIdFrom(name);
	if (hit) return hit;
	if (/torderdetail/i.test(name.trim())) return "raw";
	return null;
}
function xmlOf(buf, entries, path) {
	const entry = entries.find((item) => item.name === path);
	if (!entry) throw new Error("엑셀 안에서 시트를 찾지 못했습니다.");
	return stripNs(new TextDecoder().decode(zipRead(buf, entry)));
}
async function readXlsx(file, fallback, onProgress) {
	const buf = new Uint8Array(file);
	const entries = zipEntries(buf);
	const byName = new Map(entries.map((entry) => [entry.name, entry]));
	const workbook = byName.get("xl/workbook.xml");
	const rels = byName.get("xl/_rels/workbook.xml.rels");
	if (!workbook || !rels) throw new Error("엑셀 파일 내용이 비어 있습니다.");
	onProgress?.("시트 이름 확인 중");
	const sheets = sheetList(stripNs(new TextDecoder().decode(zipRead(buf, workbook))), stripNs(new TextDecoder().decode(zipRead(buf, rels))));
	const stringsEntry = byName.get("xl/sharedStrings.xml");
	const strings = stringsEntry ? sharedStrings(stripNs(new TextDecoder().decode(zipRead(buf, stringsEntry)))) : [];
	const named = sheets.filter((sheet) => {
		const role = sheetRole(sheet.name);
		return role != null && role !== "raw";
	});
	const found = {};
	const used = [];
	const targets = named.length ? named : [sheets.find((sheet) => sheetRole(sheet.name) === "raw") ?? sheets.find((sheet) => /sheet/i.test(sheet.path)) ?? sheets[0]].filter((sheet) => Boolean(sheet));
	for (const sheet of targets) {
		onProgress?.(`${sheet.name} 읽는 중`);
		await new Promise((resolve) => setTimeout(resolve, 0));
		const jobs = jobsFromXml(xmlOf(buf, entries, sheet.path), strings);
		const role = sheetRole(sheet.name);
		const id = role && role !== "raw" ? role : fallback;
		found[id] = jobs;
		used.push(named.length ? sheet.name : `${sheet.name} → ${id}`);
	}
	return {
		centers: found,
		used
	};
}
async function readXls(file, fallback, onProgress) {
	onProgress?.("구형 엑셀 읽는 중");
	const xlsx = await import("../_libs/xlsx.mjs").then((n) => n.t);
	const book = xlsx.read(file, {
		type: "array",
		cellDates: true,
		cellStyles: false,
		cellNF: false,
		cellHTML: false
	});
	const found = {};
	const used = [];
	const named = book.SheetNames.filter((name) => {
		const role = sheetRole(name);
		return role != null && role !== "raw";
	});
	const targets = named.length ? named : [book.SheetNames.find((name) => sheetRole(name) === "raw") ?? book.SheetNames[0]].filter((name) => Boolean(name));
	for (const name of targets) {
		onProgress?.(`${name} 읽는 중`);
		const rows = xlsx.utils.sheet_to_json(book.Sheets[name], {
			header: 1,
			raw: true,
			defval: null
		});
		const head = (rows[0] ?? []).map((cell) => String(cell ?? "").trim().toLowerCase());
		const blockAt = head.indexOf("blockno");
		const pickAt = head.indexOf("pickdt");
		const qtyAt = head.indexOf("pickqt");
		const orderAt = head.indexOf("orderqt");
		const routeAt = head.indexOf("rtecod");
		const storeNameAt = head.indexOf("clientnm");
		const storeCodeAt = head.indexOf("clientcd");
		const goodsNameAt = head.indexOf("goodsnm");
		const goodsCodeAt = head.indexOf("goodscd");
		const locationAt = [
			"locationcd",
			"loccd",
			"로케이션코드",
			"로케이션"
		].map((name) => head.indexOf(name)).find((index) => index >= 0) ?? -1;
		const groupAt = head.indexOf("groupid");
		const b = blockAt >= 0 ? blockAt : 17;
		const p = pickAt >= 0 ? pickAt : 25;
		const q = qtyAt >= 0 ? qtyAt : 12;
		const start = blockAt >= 0 || pickAt >= 0 ? 1 : 0;
		const jobs = [];
		for (let i = start; i < rows.length; i++) {
			const row = rows[i] ?? [];
			const line = Un(row[b]);
			const groupId = groupAt >= 0 ? String(row[groupAt] ?? "").trim() : "";
			if (line == null && !groupId) continue;
			const qtyRaw = row[q];
			const qty = typeof qtyRaw === "number" ? qtyRaw : Number(qtyRaw);
			const orderRaw = orderAt >= 0 ? row[orderAt] : 0;
			const orderQty = typeof orderRaw === "number" ? orderRaw : Number(orderRaw);
			jobs.push({
				line,
				at: Hn(row[p] ?? null),
				qty: Number.isFinite(qty) ? qty : 0,
				orderQty: Number.isFinite(orderQty) ? orderQty : 0,
				route: routeAt >= 0 ? Wn(row[routeAt] ?? null) : "",
				storeCd: storeCodeAt >= 0 ? Wn(row[storeCodeAt] ?? null) : "",
				storeNm: storeNameAt >= 0 ? Wn(row[storeNameAt] ?? null) : "",
				goodsCd: goodsCodeAt >= 0 ? Wn(row[goodsCodeAt] ?? null) : "",
				goodsNm: goodsNameAt >= 0 ? Wn(row[goodsNameAt] ?? null) : "",
				location: locationAt >= 0 ? Wn(row[locationAt] ?? null) : "",
				groupId
			});
		}
		const role = sheetRole(name);
		const id = role && role !== "raw" ? role : fallback;
		found[id] = jobs;
		used.push(named.length ? name : `${name} → ${id}`);
	}
	return {
		centers: found,
		used
	};
}
function centerFromFileName(name, fallback) {
	const base = name.replace(/\.[^.]+$/, "");
	const marked = base.match(/(?:^|[^0-9])([1-9])\s*센터/);
	if (marked) return `${marked[1]}센터`;
	const tail = base.match(/[-_\s]([1-9])$/);
	if (tail) return `${tail[1]}센터`;
	return fallback;
}
function centerFromSheetName(name) {
	return centerIdFrom(name);
}
async function readLocMaster(file, fallback, fileName, force) {
	const xlsx = await import("../_libs/xlsx.mjs").then((n) => n.t);
	const book = xlsx.read(file, {
		type: "array",
		cellDates: false,
		cellStyles: false,
		cellNF: false,
		cellHTML: false
	});
	const places = {};
	const codes = {};
	let matched = false;
	for (const name of book.SheetNames) {
		const rows = xlsx.utils.sheet_to_json(book.Sheets[name], {
			header: 1,
			raw: true,
			defval: ""
		});
		const head = (rows[0] ?? []).map((cell) => String(cell ?? "").trim().toLowerCase());
		if (head.includes("blockno") || head.includes("pickdt")) continue;
		const locAt = [
			"로케이션코드",
			"locationcd",
			"로케이션"
		].map((label) => head.indexOf(label)).find((index) => index >= 0) ?? -1;
		const nameAt = ["점포명", "clientnm"].map((label) => head.indexOf(label)).find((index) => index >= 0) ?? -1;
		if (locAt < 0 || nameAt < 0) continue;
		matched = true;
		const codeAt = [
			"점포코드",
			"clientcd",
			"storecd"
		].map((label) => head.indexOf(label)).find((index) => index >= 0) ?? -1;
		const center = force ?? centerFromSheetName(name) ?? centerFromFileName(fileName, fallback);
		const map = { ...places[center] ?? {} };
		const codeMap = { ...codes[center] ?? {} };
		for (let i = 1; i < rows.length; i++) {
			const code = Ln(String(rows[i]?.[locAt] ?? ""));
			const store = String(rows[i]?.[nameAt] ?? "").trim();
			if (!code || !store) continue;
			map[code] = store;
			const storeCode = codeAt >= 0 ? String(rows[i]?.[codeAt] ?? "").trim() : "";
			if (storeCode) codeMap[code] = storeCode;
		}
		places[center] = map;
		if (Object.keys(codeMap).length > 0) codes[center] = codeMap;
	}
	return matched ? {
		places,
		codes
	} : null;
}
async function readCenters(file, fallback, onProgress) {
	const bytes = new Uint8Array(file.slice(0, 4));
	const result = bytes[0] === 80 && bytes[1] === 75 ? await readXlsx(file, fallback, onProgress) : await readXls(file, fallback, onProgress);
	if (Object.values(result.centers).reduce((sum, rows) => sum + (rows?.length ?? 0), 0) === 0) throw new Error("BlockNO가 있는 작업 행을 찾지 못했습니다. 1센터·2센터·3센터 시트나 tOrderDetail을 올려 주세요.");
	return result;
}
var BLOCKS = [
	{
		center: "1센터",
		col: "B",
		nameCol: "C"
	},
	{
		center: "2센터",
		col: "J",
		nameCol: "K"
	},
	{
		center: "3센터",
		col: "R",
		nameCol: "S"
	}
];
function serialDate(value) {
	return new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 864e5).toISOString().slice(0, 10);
}
function dateFromE2(sheet) {
	const cell = sheet.E2;
	if (!cell || typeof cell === "string") return "";
	if (typeof cell.v === "number" && cell.v > 2e4 && cell.v < 8e4) return serialDate(cell.v);
	if (cell.v instanceof Date && !Number.isNaN(cell.v.getTime())) return cell.v.toISOString().slice(0, 10);
	return "";
}
function raw(sheet, addr) {
	const cell = sheet[addr];
	if (!cell || typeof cell === "string") return null;
	return cell.v ?? null;
}
function label(value) {
	return String(value ?? "").replace(/\s/g, "");
}
function readSheet(sheet, sheetName, year, xlsx) {
	const named = sheetName.match(/(\d+)\s*월\s*(\d+)\s*일/);
	const fromCell = dateFromE2(sheet);
	if (sheetName === "입사내역" || !named && !fromCell) return [];
	const date = fromCell || `${year}-${named[1].padStart(2, "0")}-${named[2].padStart(2, "0")}`;
	const ref = sheet["!ref"];
	const lastRow = ref ? xlsx.utils.decode_range(String(ref)).e.r + 1 : 80;
	const found = [];
	for (const block of BLOCKS) {
		let start = -1;
		for (let row = 1; row <= lastRow; row++) if (label(raw(sheet, `${block.col}${row}`)) === "소분류") {
			start = row + 1;
			break;
		}
		if (start < 0) continue;
		for (let row = start; row <= lastRow; row++) {
			const mark = label(raw(sheet, `${block.col}${row}`));
			if (!mark || mark.startsWith("서브") || mark.startsWith("총")) break;
			const line = Number(mark);
			if (!Number.isInteger(line) || line < 1 || line > 8) continue;
			const name = String(raw(sheet, `${block.nameCol}${row}`) ?? "").trim();
			if (!name || name === "성명" || /^\d+(\.\d+)?$/.test(name)) continue;
			found.push({
				date,
				center: block.center,
				line,
				name
			});
		}
	}
	return found;
}
async function readRoster(buf, year = 2026) {
	const xlsx = await import("../_libs/xlsx.mjs").then((n) => n.t);
	const book = xlsx.read(buf, {
		type: "array",
		cellDates: false
	});
	return book.SheetNames.flatMap((sheetName) => readSheet(book.Sheets[sheetName], sheetName, year, xlsx));
}
async function downloadRosterTemplate() {
	const file = (await import("./roster-template-BugocIw2.mjs")).default;
	const link = document.createElement("a");
	link.href = file;
	link.download = "근태양식.xlsx";
	document.body.appendChild(link);
	link.click();
	link.remove();
}
var nf$3 = new Intl.NumberFormat("ko-KR");
var LINE_BG = [
	"bg-line-1 text-on-dark",
	"bg-line-2 text-on-dark",
	"bg-line-3 text-ink",
	"bg-line-4 text-on-dark",
	"bg-line-5 text-on-dark",
	"bg-line-6 text-on-dark",
	"bg-line-7 text-on-dark",
	"bg-line-8 text-on-dark"
];
var CENTER_BG = {
	"1센터": "bg-line-5 text-on-dark",
	"2센터": "bg-line-2 text-on-dark",
	"3센터": "bg-line-6 text-on-dark"
};
function b64ToArrayBuffer$3(b64) {
	const clean = b64.replace(/\s/g, "");
	return Uint8Array.from(atob(clean), (char) => char.charCodeAt(0)).buffer;
}
function pct(value) {
	return `${(value * 100).toFixed(1)}%`;
}
function hours(value) {
	return value > 0 ? value.toFixed(1) : "";
}
function peopleOf(days, roster, grain, dpt, center, line) {
	const who = /* @__PURE__ */ new Map();
	for (const item of roster) who.set(`${item.date}|${item.center}|${item.line}`, item.name);
	const map = /* @__PURE__ */ new Map();
	for (const row of days) {
		if (row.line === 0) continue;
		if (dpt !== "전체" && row.dpt !== dpt) continue;
		if (center !== "전체" && row.center !== center) continue;
		if (line > 0 && row.line !== line) continue;
		const date = row.sort.slice(0, 10);
		const name = who.get(`${date}|${row.center}|${row.line}`);
		if (!name) continue;
		const week = Tr(date);
		const period = grain === "day" ? row.period : grain === "week" ? week.label : wr(date);
		const sub = grain === "day" ? row.sub : grain === "week" ? week.range : `${row.days > 0 ? "" : ""}`;
		const sort = grain === "day" ? date : grain === "week" ? week.key : date.slice(0, 7);
		const key = `${sort}|${name}`;
		const acc = map.get(key) ?? {
			key,
			name,
			period,
			sub: grain === "week" ? week.range : sub,
			sort,
			dpt: "",
			center: "",
			lineText: "",
			days: 0,
			planned: 0,
			done: 0,
			left: 0,
			rate: 0,
			hours: 0,
			perHour: 0,
			rank: "",
			daySet: /* @__PURE__ */ new Set(),
			centers: /* @__PURE__ */ new Set(),
			spots: /* @__PURE__ */ new Map(),
			dpts: /* @__PURE__ */ new Set()
		};
		acc.planned += row.planned;
		acc.done += row.done;
		acc.hours += row.hours;
		acc.daySet.add(date);
		acc.centers.add(row.center);
		const lines = acc.spots.get(row.center) ?? /* @__PURE__ */ new Set();
		lines.add(row.line);
		acc.spots.set(row.center, lines);
		acc.dpts.add(row.dpt);
		map.set(key, acc);
	}
	const list = [...map.values()].map((acc) => {
		acc.days = acc.daySet.size;
		acc.left = acc.planned - acc.done;
		acc.rate = acc.planned ? acc.done / acc.planned : 0;
		acc.perHour = acc.hours > 0 ? acc.done / acc.hours : 0;
		acc.center = [...acc.centers].sort((a, b) => Dn.indexOf(a) - Dn.indexOf(b)).join(" · ");
		acc.lineText = personLines(acc.spots);
		acc.dpt = acc.dpts.size === 1 ? [...acc.dpts][0] ?? "" : "여러 DPT";
		acc.sub = grain === "day" ? acc.sub : grain === "week" ? acc.sub : `${acc.days}일`;
		return acc;
	});
	const groups = /* @__PURE__ */ new Map();
	for (const row of list) {
		const bucket = groups.get(row.sort) ?? [];
		bucket.push(row);
		groups.set(row.sort, bucket);
	}
	for (const bucket of groups.values()) [...bucket].sort((a, b) => b.perHour - a.perHour).forEach((row, index) => {
		row.rank = row.perHour > 0 ? String(index + 1) : "";
	});
	return list.sort((a, b) => a.sort.localeCompare(b.sort) || Number(a.rank || 99) - Number(b.rank || 99));
}
function personLines(spots) {
	const centers = [...spots.keys()].sort((a, b) => Dn.indexOf(a) - Dn.indexOf(b));
	if (centers.length <= 1) return [...spots.get(centers[0] ?? "") ?? []].sort((a, b) => a - b).map((n) => `${n}라인`).join(" ");
	return centers.map((center) => {
		const lines = [...spots.get(center) ?? []].sort((a, b) => a - b);
		if (lines.length === 0) return "";
		return `${center}${lines[0]}라인${lines.slice(1).map((n) => `,${n}라인`).join("")}`;
	}).filter(Boolean).join(" / ");
}
function ArchiveView({ seed = [] }) {
	const [year, setYear] = (0, import_react.useState)(2026);
	const [batches, setBatches] = (0, import_react.useState)([]);
	const [busy, setBusy] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [grain, setGrain] = (0, import_react.useState)("day");
	const [unit, setUnit] = (0, import_react.useState)("center");
	const [dpt, setDpt] = (0, import_react.useState)("전체");
	const [center, setCenter] = (0, import_react.useState)("전체");
	const [line, setLine] = (0, import_react.useState)(0);
	const lineMax = Bn(center);
	(0, import_react.useEffect)(() => {
		if (line > lineMax) setLine(0);
	}, [line, lineMax]);
	const [roster, setRoster] = (0, import_react.useState)([]);
	const [rosterNote, setRosterNote] = (0, import_react.useState)("");
	const [sortKey, setSortKey] = (0, import_react.useState)("period");
	const [sortDir, setSortDir] = (0, import_react.useState)("asc");
	const seeded = (0, import_react.useRef)(false);
	const [company, setCompany] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setCompany(Boolean(window.__COMPANY_PC__));
	}, []);
	const days = (0, import_react.useMemo)(() => batches.flatMap((batch) => kr(batch.date, batch.kind, batch.centers)), [batches]);
	const rolled = (0, import_react.useMemo)(() => grain === "day" ? days : Ar(days, grain), [days, grain]);
	const rows = (0, import_react.useMemo)(() => rolled.filter((row) => {
		if (unit === "center" ? row.line !== 0 : row.line === 0) return false;
		if (dpt !== "전체" && row.dpt !== dpt) return false;
		if (center !== "전체" && row.center !== center) return false;
		if (unit === "line" && line > 0 && row.line !== line) return false;
		return true;
	}), [
		rolled,
		unit,
		dpt,
		center,
		line
	]);
	const people = (0, import_react.useMemo)(() => peopleOf(days, roster, grain, dpt, center, line), [
		days,
		roster,
		grain,
		dpt,
		center,
		line
	]);
	const shown = unit === "person" ? people : rows;
	const totals = (unit === "person" ? people : rows).reduce((sum, row) => ({
		planned: sum.planned + row.planned,
		done: sum.done + row.done,
		hours: sum.hours + row.hours
	}), {
		planned: 0,
		done: 0,
		hours: 0
	});
	async function ingest(items, fileYear) {
		if (items.length === 0) return;
		setError("");
		const next = [...batches];
		const notes = [];
		for (const item of items) {
			const meta = Er(item.name, fileYear);
			if (!meta) {
				notes.push(`${item.name} 은 1019_FF2 처럼 날짜_FF1 또는 날짜_FF2 이름이어야 합니다.`);
				continue;
			}
			setBusy(`${item.name} 계산 중`);
			await new Promise((resolve) => setTimeout(resolve, 20));
			try {
				const parsed = await readCenters(item.buf, "1센터", setBusy);
				const key = `${meta.date}|${meta.kind}`;
				const index = next.findIndex((batch) => `${batch.date}|${batch.kind}` === key);
				if (index >= 0) {
					notes.push(`${next[index].name} 대신 ${item.name} 을 넣었습니다.`);
					next.splice(index, 1);
				}
				next.push({
					name: item.name,
					date: meta.date,
					kind: meta.kind,
					centers: parsed.centers
				});
			} catch (err) {
				notes.push(err instanceof Error ? `${item.name}: ${err.message}` : item.name);
			}
		}
		next.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));
		setBatches(next);
		setBusy("");
		setError(notes.join(" "));
	}
	(0, import_react.useEffect)(() => {
		if (seeded.current || seed.length === 0) return;
		seeded.current = true;
		ingest(seed, year);
	}, [seed, year]);
	function toggleSort(key) {
		if (sortKey === key) setSortDir((dir) => dir === "asc" ? "desc" : "asc");
		else {
			setSortKey(key);
			setSortDir(key === "name" || key === "period" || key === "center" || key === "dpt" ? "asc" : "desc");
		}
	}
	function ordered(list) {
		const dir = sortDir === "asc" ? 1 : -1;
		return [...list].sort((a, b) => {
			const av = a[sortKey];
			const bv = b[sortKey];
			if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
			if (av == null && bv == null) return 0;
			if (av == null) return 1;
			if (bv == null) return -1;
			return String(av).localeCompare(String(bv), "ko", { numeric: true }) * dir;
		});
	}
	async function addFiles(list) {
		const files = [...list];
		if (files.length === 0 || busy) return;
		await ingest(await Promise.all(files.map(async (file) => ({
			name: file.name,
			buf: await file.arrayBuffer()
		}))), year);
	}
	async function loadRoster(buf, name) {
		setBusy("근태표 읽는 중");
		setError("");
		try {
			const next = await readRoster(buf, year);
			if (next.length === 0) throw new Error("소분류 라인 이름을 찾지 못했습니다. 시트 이름이 10월1일 형식인지 확인해 주세요.");
			setRoster(next);
			const dates = [...new Set(next.map((item) => item.date))].sort();
			const names = new Set(next.map((item) => item.name));
			setRosterNote(`${name} · ${dates[0]?.slice(5)}~${dates[dates.length - 1]?.slice(5)} · ${names.size}명`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "근태표를 읽지 못했습니다.");
		}
		setBusy("");
	}
	(0, import_react.useEffect)(() => {
		const host = window.chrome?.webview;
		if (!host) return;
		const onMessage = (event) => {
			const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
			if (data?.type === "roster" && data.b64) loadRoster(b64ToArrayBuffer$3(data.b64), data.name || "근태표");
		};
		host.addEventListener("message", onMessage);
		return () => host.removeEventListener("message", onMessage);
	}, []);
	async function download() {
		if (days.length === 0) return;
		setBusy("엑셀 만드는 중");
		setError("");
		try {
			const { buildProductivityReport } = await import("./productivity-report-bfMY3Hol.mjs");
			const people = {
				day: peopleOf(days, roster, "day", "전체", "전체", 0),
				week: peopleOf(days, roster, "week", "전체", "전체", 0),
				month: peopleOf(days, roster, "month", "전체", "전체", 0)
			};
			const buffer = await buildProductivityReport(days, people);
			const name = "생산성자료.xlsx";
			const bytes = new Uint8Array(buffer);
			const host = window.chrome?.webview;
			if (company && host) {
				let binary = "";
				const chunk = 32768;
				for (let index = 0; index < bytes.length; index += chunk) binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
				host.postMessage(JSON.stringify({
					type: "save-xlsx",
					name,
					b64: btoa(binary)
				}));
				return;
			}
			const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = name;
			link.click();
			URL.revokeObjectURL(url);
		} catch {
			setError("엑셀을 만들지 못했습니다.");
		} finally {
			setBusy("");
		}
	}
	function mark(label, k) {
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
			className: "whitespace-nowrap border border-header px-2 py-2 font-bold",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "font-bold text-on-dark",
				onClick: () => toggleSort(k),
				children: [label, sortKey === k ? sortDir === "asc" ? " ▲" : " ▼" : ""]
			})
		}, k);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ios-sheet",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-black/5 bg-white/90 px-3 py-2 backdrop-blur",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "min-w-0 flex-1 truncate text-[17px] font-semibold text-[#1c1c1e]",
						children: "생산성 분석"
					}),
					batches.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setBatches([]),
						className: "h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold text-[#ff3b30]",
						children: "비우기"
					}) : null,
					company ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold",
						onClick: () => window.chrome?.webview?.postMessage("archive"),
						children: "생산성 파일"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "inline-flex h-9 cursor-pointer items-center rounded-full border border-black/10 bg-white px-3 text-xs font-semibold",
						children: ["생산성 파일", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: ".xlsx,.xls,.xlsm",
							multiple: true,
							className: "sr-only",
							onChange: (event) => {
								const files = event.target.files;
								if (files) addFiles(files);
								event.target.value = "";
							}
						})]
					}),
					company ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold",
						onClick: () => window.chrome?.webview?.postMessage("roster"),
						children: "근태표"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "inline-flex h-9 cursor-pointer items-center rounded-full border border-black/10 bg-white px-3 text-xs font-semibold",
						children: ["근태표", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: ".xlsx,.xls,.xlsm",
							className: "sr-only",
							onChange: (event) => {
								const file = event.target.files?.[0];
								if (file) file.arrayBuffer().then((buf) => loadRoster(buf, file.name));
								event.target.value = "";
							}
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void downloadRosterTemplate(),
						className: "h-9 rounded-full bg-[#007aff] px-3 text-xs font-semibold text-white",
						children: "근태양식"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: days.length === 0,
						onClick: () => void download(),
						className: "h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold disabled:opacity-40",
						children: "엑셀로 받기"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2 px-3 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-bold",
						children: "연도"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						id: "archive-year",
						"aria-label": "연도",
						type: "number",
						min: 2020,
						max: 2100,
						value: year,
						onChange: (event) => setYear(Number(event.target.value) || 2026),
						className: "h-10 w-24 rounded-xl border border-black/10 bg-white px-3 text-sm font-medium"
					}),
					busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-bold text-title",
						children: busy
					}) : null,
					rosterNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-bold text-title",
						children: rosterNote
					}) : null
				]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-3 pb-2 text-sm font-medium text-line-1",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1 px-3",
				children: batches.map((batch) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "rounded-sm bg-ice px-2 py-1 text-xs font-bold text-title",
					children: [
						batch.date.slice(5),
						" ",
						batch.kind
					]
				}, `${batch.date}-${batch.kind}`))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-wrap items-center gap-2 px-3 py-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
						label: "기간",
						value: grain,
						onChange: (id) => setGrain(id),
						options: [
							{
								id: "day",
								label: "일별"
							},
							{
								id: "week",
								label: "주별"
							},
							{
								id: "month",
								label: "월별"
							}
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
						label: "보기",
						value: unit,
						onChange: (id) => setUnit(id),
						options: [
							{
								id: "center",
								label: "센터"
							},
							{
								id: "line",
								label: "라인"
							},
							{
								id: "person",
								label: "사람"
							}
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
						label: "DPT",
						value: dpt,
						onChange: (id) => setDpt(id),
						options: [
							{
								id: "전체",
								label: "전체"
							},
							{
								id: "유제 냉장",
								label: "유제 냉장"
							},
							{
								id: "FF2",
								label: "FF2"
							},
							{
								id: "FF1",
								label: "FF1"
							}
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
						label: "센터",
						value: center,
						onChange: (id) => setCenter(id),
						options: [{
							id: "전체",
							label: "전체"
						}, ...Mn().map((id) => ({
							id,
							label: id
						}))]
					}),
					unit !== "center" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
						label: "라인",
						value: String(line),
						onChange: (id) => setLine(Number(id)),
						options: [{
							id: "0",
							label: "전체"
						}, ...Pn.slice(0, lineMax).map((label, index) => ({
							id: String(index + 1),
							label: `${index + 1}라인`
						}))]
					}) : null
				]
			}),
			days.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-3 mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-sm bg-title px-3 py-2 text-on-dark",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold",
							children: "작업건수"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl font-bold tabular-nums",
							children: nf$3.format(totals.planned)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-sm bg-header px-3 py-2 text-on-dark",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold",
							children: "완료건수"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl font-bold tabular-nums",
							children: nf$3.format(totals.done)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-sm bg-line-4 px-3 py-2 text-on-dark",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold",
							children: "완료율"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl font-bold tabular-nums",
							children: totals.planned ? pct(totals.done / totals.planned) : "—"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-sm bg-mark px-3 py-2 text-on-dark",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold",
							children: "건/시"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl font-bold tabular-nums",
							children: totals.hours > 0 ? (totals.done / totals.hours).toFixed(0) : "—"
						})]
					})
				]
			}) : null,
			shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-3 py-6 text-sm text-muted",
				children: unit === "person" ? roster.length === 0 ? "오른쪽 근태양식을 받아 위 날짜를 고치고, 소분류에 이름을 적은 뒤 근태표로 올리세요." : "배치된 사람과 같은 날짜의 생산성 파일이 없습니다." : "1019_FF1, 1019_FF2처럼 보관해 둔 업로드 파일을 여러 개 고르면 일별·주별·월별 생산성이 나옵니다."
			}) : unit === "person" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "overflow-auto px-3 pb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[980px] border-collapse text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
						className: "bg-header text-left text-on-dark",
						children: [
							["이름", "name"],
							["기간", "sort"],
							[grain === "day" ? "요일" : "구간", "sub"],
							["DPT", "dpt"],
							["센터", "center"],
							["라인", "lineText"],
							["시간", "hours"],
							["건/시", "perHour"],
							["순위", "rank"]
						].map(([label, k]) => mark(label, k))
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "bg-slate font-bold",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-2",
								children: "전체"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-2",
								colSpan: 5
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-2 text-right tabular-nums",
								children: hours(totals.hours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-2 text-right tabular-nums",
								children: totals.hours > 0 ? (totals.done / totals.hours).toFixed(0) : ""
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "border border-grid px-2 py-2" })
						]
					}), ordered(people).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "whitespace-nowrap border border-grid bg-ice px-2 py-1.5 text-left font-bold",
							children: row.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "whitespace-nowrap border border-grid px-2 py-1.5",
							children: row.period
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "whitespace-nowrap border border-grid px-2 py-1.5",
							children: row.sub
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "whitespace-nowrap border border-grid px-2 py-1.5",
							children: row.dpt
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: `whitespace-nowrap border border-grid px-2 py-1.5 font-bold ${CENTER_BG[row.center] ?? ""}`,
							children: row.center
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "whitespace-nowrap border border-grid px-2 py-1.5 font-bold",
							children: row.lineText
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-grid px-2 py-1.5 text-right tabular-nums",
							children: hours(row.hours)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-grid px-2 py-1.5 text-right font-bold tabular-nums",
							children: row.perHour ? row.perHour.toFixed(0) : ""
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-grid px-2 py-1.5 text-center font-bold",
							children: row.rank
						})
					] }, row.key))] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs text-muted",
					children: "1·2·3센터 소분류에 적힌 이름을 그 라인 작업자로 봅니다. 생산성 파일과 같은 날짜만 붙습니다. 같은 날 여러 DPT가 있으면 건수와 시간을 더합니다. 여러 센터를 한 사람이 하면 라인은 1센터1라인,2라인 / 2센터5라인처럼 센터별로 적습니다."
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "overflow-auto px-3 pb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[980px] border-collapse text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
						className: "bg-header text-left text-on-dark",
						children: [
							["기간", "sort"],
							[grain === "day" ? "요일" : "구간", "sub"],
							["DPT", "dpt"],
							["센터", "center"],
							...unit === "line" ? [["라인", "line"]] : [],
							["일수", "days"],
							["작업건수", "planned"],
							["완료건수", "done"],
							["잔여건수", "left"],
							["몇 %", "rate"],
							["시작", "first"],
							["끝", "last"],
							["시간", "hours"],
							["건/시", "perHour"]
						].map(([label, k]) => mark(label, k))
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "bg-slate font-bold",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-2",
								children: "전체"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-2",
								colSpan: unit === "line" ? 5 : 4
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-2 text-right tabular-nums",
								children: nf$3.format(totals.planned)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-2 text-right tabular-nums",
								children: nf$3.format(totals.done)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-2 text-right tabular-nums",
								children: nf$3.format(Math.max(0, totals.planned - totals.done))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-2 text-right tabular-nums",
								children: totals.planned ? pct(totals.done / totals.planned) : ""
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-2",
								colSpan: 2
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-2 text-right tabular-nums",
								children: hours(totals.hours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-2 text-right tabular-nums",
								children: totals.hours > 0 ? (totals.done / totals.hours).toFixed(0) : ""
							})
						]
					}), ordered(rows).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "whitespace-nowrap border border-grid px-2 py-1.5 font-bold",
							children: row.period
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "whitespace-nowrap border border-grid px-2 py-1.5",
							children: row.sub
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "whitespace-nowrap border border-grid px-2 py-1.5 font-bold",
							children: row.dpt
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: `whitespace-nowrap border border-grid px-2 py-1.5 font-bold ${CENTER_BG[row.center] ?? ""}`,
							children: row.center
						}),
						unit === "line" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: `whitespace-nowrap border border-grid px-2 py-1.5 font-bold ${LINE_BG[row.line - 1] ?? ""}`,
							children: [row.line, "라인"]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-grid px-2 py-1.5 text-right tabular-nums",
							children: row.days
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-grid px-2 py-1.5 text-right tabular-nums",
							children: nf$3.format(row.planned)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-grid px-2 py-1.5 text-right tabular-nums",
							children: nf$3.format(row.done)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-grid px-2 py-1.5 text-right tabular-nums",
							children: nf$3.format(row.left)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-grid px-2 py-1.5 text-right font-bold tabular-nums",
							children: pct(row.rate)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-grid px-2 py-1.5 text-center tabular-nums",
							children: cr(row.first)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-grid px-2 py-1.5 text-center tabular-nums",
							children: cr(row.last)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-grid px-2 py-1.5 text-right tabular-nums",
							children: hours(row.hours)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-grid px-2 py-1.5 text-right font-bold tabular-nums",
							children: row.perHour ? row.perHour.toFixed(0) : ""
						})
					] }, `${row.sort}-${row.dpt}-${row.center}-${row.line}`))] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs text-muted",
					children: "시간은 그날 첫 완료부터 마지막 완료까지입니다. 주·월은 그 날들을 더한 값입니다. FF1은 300번대, FF2 파일은 유제·냉장(100번대)과 FF2(200번대)로 나뉩니다."
				})]
			})
		]
	});
}
var shot_menu_default = "/assets/shot_menu-C4kYROkK.png";
var shot_query_default = "/assets/shot_query-BwLSqpPx.png";
var NOTE_EMPTY = "※ 엑셀을 올리기 전의 초기 화면 모양입니다. 올리면 값이 채워집니다.";
var NOTE_SHORT = "※ 엑셀을 올리기 전의 초기 화면 모양입니다.";
var NOTE_COLS = "※ 열 이름은 화면 기준이고, 값은 엑셀을 올리면 채워집니다.";
var NOTE_HEAT = "※ 색 농도는 설명용 예시입니다. 실제 값은 엑셀을 올리면 채워집니다.";
function lineCell(n, text) {
	return {
		text,
		dot: "line",
		n
	};
}
function centerCell(n, text) {
	return {
		text,
		dot: "center",
		n
	};
}
function allCell(text) {
	return {
		text,
		dot: "all"
	};
}
var lineZeros = [
	"0",
	"0",
	"0",
	"0.0%",
	"",
	"",
	"0.0",
	"0",
	""
];
var dots = [
	"⋮",
	"⋮",
	"⋮",
	"⋮",
	"⋮",
	"⋮",
	"⋮",
	"⋮",
	"⋮"
];
var heatA = [
	.12,
	.34,
	.55,
	.16,
	.92,
	.2,
	.6,
	.96
];
var heatB = [
	.18,
	.46,
	.7,
	.28,
	.5,
	.1,
	.36,
	.76
];
var heatC = [
	.08,
	.2,
	.38,
	.84,
	.66,
	.4,
	.16,
	.52
];
function heatRow(levels) {
	return [
		"··",
		"··",
		"··",
		"··",
		"··",
		"··",
		"··",
		"··",
		...levels.map((heat) => ({ heat }))
	];
}
var MANUAL_PAGES = [
	{
		cover: true,
		title: "센터 생산성 프로그램\n사용 매뉴얼",
		subtitle: "신오산저온센터 · osan.grok.me",
		blocks: []
	},
	{
		title: "프로그램 소개",
		subtitle: "작업 엑셀을 올리면 센터 · 라인 · 루트 · 점포 · 상품 진척이 바로 보입니다",
		blocks: [{
			k: "grid",
			cols: 3,
			gap: 16,
			children: [
				{
					k: "stat",
					n: "9",
					label: "메뉴"
				},
				{
					k: "stat",
					n: "8",
					label: "라인 (1~8 라인)"
				},
				{
					k: "stat",
					n: "3",
					label: "센터 (1·2·3 센터)"
				}
			]
		}, {
			k: "steps",
			grow: true,
			arrows: true,
			items: [
				{
					title: "엑셀 올리기",
					body: "맨 위에서 신오산 또는 포천을 고른 뒤 작업 엑셀을 올립니다. 신오산은 1·2·3센터, 포천은 1·2센터만 나오고 파일은 따로 보관됩니다."
				},
				{
					title: "화면에서 확인",
					body: "왼쪽 메뉴에서 봅니다. 맨 아래 톱니는 제어판입니다. 마스터, 지역센터, 배치를 고칩니다."
				},
				{
					title: "꺼내 쓰기",
					body: "화면에 따라 캡처 · 복사, 인쇄, 엑셀 저장을 쓸 수 있습니다."
				}
			]
		}]
	},
	{
		title: "접속과 엑셀 올리기",
		subtitle: "PC 에 따라 올리는 방법이 다릅니다",
		blocks: [
			{
				k: "grid",
				cols: 2,
				gap: 16,
				children: [{
					k: "card",
					children: [
						{
							k: "badge",
							text: "집 컴퓨터",
							tone: "blue"
						},
						{
							k: "p",
							text: "화면에서 바로 올립니다",
							strong: true,
							size: 22,
							color: "#1A5276"
						},
						{
							k: "p",
							text: "osan.grok.me 화면 맨 위 ‘올리기’ 영역에서 센터를 고르고 엑셀 파일을 선택합니다.",
							size: 16
						}
					]
				}, {
					k: "card",
					children: [
						{
							k: "badge",
							text: "회사 컴퓨터",
							tone: "orange"
						},
						{
							k: "p",
							text: "‘생산성 EXE’ 를 실행합니다",
							strong: true,
							size: 22,
							color: "#1A5276"
						},
						{
							k: "p",
							text: "회사 PC 에서는 Privacy-i 가 브라우저 업로드를 막습니다. 생산성 EXE를 한 번 받아 실행하면, 다음부터 새 버전이 있을 때 알아서 바뀝니다. 다시 열어도 그대로면 생산성 EXE를 다시 받아, 공용폴더의 생산성보기.exe 와 화면.html 만 바꾸세요. 제어판.json 은 그대로 둡니다.",
							size: 16
						},
						{
							k: "link",
							text: "osan.grok.me/company-pc.zip",
							href: "https://osan.grok.me/company-pc.zip"
						}
					]
				}]
			},
			{
				k: "h",
				text: "올리기 순서"
			},
			{
				k: "steps",
				grow: true,
				arrows: false,
				items: [
					{
						title: "센터 고르기",
						body: "올리기 원본을 넣을 센터를 1 센터 · 2 센터 · 3 센터 중에서 고릅니다."
					},
					{
						title: "엑셀 선택",
						body: "올릴 엑셀 파일을 선택합니다. 올리면 모든 화면이 채워집니다."
					},
					{
						title: "배치표 선택",
						body: "로케이션 화면에서 쓰는 센터 배치표입니다. 필요할 때 함께 올립니다."
					}
				]
			}
		]
	},
	{
		title: "화면 구성",
		subtitle: "하위 화면을 열면 지우기 옆에 탭이 생깁니다. 최대 5개까지 오갑니다",
		blocks: [{
			k: "grid",
			cols: 3,
			gap: 14,
			grow: true,
			children: [
				{
					k: "menu",
					n: 1,
					title: "요약",
					body: "라인별 생산성 · 센터비교 · 예상 작업 종료시간 · 라인별 작업 %"
				},
				{
					k: "menu",
					n: 2,
					title: "작업 확인",
					body: "누르면 펼칩니다. 시간별 확인 · 미작업 상품 · 작업 상품 · 점포 진척 · 루트. 다시 누르면 접힙니다."
				},
				{
					k: "menu",
					n: 3,
					title: "로케이션",
					body: "라인별 점포 배치 · 임시 배치"
				},
				{
					k: "menu",
					n: 4,
					title: "오출 확인",
					body: "작업 엑셀과 1·2·3센터 오출 엑셀을 올려 오출 이력을 봅니다. 모든 열 제목의 필터로 검색해 고르고, 열 제목을 누르면 정렬됩니다. 마스터 열 필터는 DPT(FF1 · FF2 · 냉동)입니다."
				},
				{
					k: "menu",
					n: 5,
					title: "데이터분석",
					body: "누르면 펼칩니다. 생산성 분석 · 출고 분석 · 수불분석 · 오출분석. 수불분석은 아직 빈 화면입니다."
				}
			]
		}]
	},
	{
		title: "먼저 알아둘 기준",
		subtitle: "모든 화면에서 같은 기준으로 계산합니다",
		blocks: [{
			k: "row",
			gap: 16,
			grow: true,
			children: [{
				k: "table",
				flex: 1.55,
				left: true,
				columns: ["용어", "뜻"],
				rows: [
					["완료", "피킹 시각이 있는 건"],
					["잔여 · 미작업", "피킹 시각이 없거나, 피킹수량이 0인 건"],
					["건/hr", "한 시간에 처리한 건수 ( 순위 기준 )"],
					["총 작업시간", "첫 완료부터 마지막 완료까지 ( 쉬는 시간 포함 )"],
					["몇 %", "작업건수 중 완료된 비율"],
					["작업수량", "주문수량 합은 총작업수량, 피킹한 수량은 작업수량, 안 한 주문수량은 미작업수량"]
				]
			}, {
				k: "col",
				flex: .85,
				gap: 16,
				children: [{
					k: "card",
					flex: 1,
					title: "DPT 구분",
					body: "전체 / 유제 냉장 / FF2 중에서 고릅니다.\n유제 냉장은 루트 100 번대, FF2 는 루트 200 번대입니다."
				}, {
					k: "card",
					flex: 1,
					title: "라인 (1~8 라인)",
					children: [{ k: "lines" }]
				}]
			}]
		}]
	},
	{
		title: "① 요약 · 라인별 생산성",
		subtitle: "가장 먼저 보는 화면 — 라인마다 진행 상황과 속도를 봅니다",
		blocks: [
			{
				k: "chips",
				label: "화면 선택 항목",
				items: [
					"센터 1·2·3 센터",
					"DPT 전체 · 유제 냉장 · FF2",
					"캡처 · 복사"
				]
			},
			{
				k: "table",
				columns: [
					"라인",
					"작업건수",
					"완료",
					"잔여",
					"%",
					"시작",
					"끝",
					"시간",
					"건/hr",
					"순위"
				],
				rows: [
					[allCell("전체"), ...lineZeros],
					[lineCell(1, "1 라인"), ...lineZeros],
					[lineCell(2, "2 라인"), ...lineZeros],
					["⋮", ...dots],
					[lineCell(8, "8 라인"), ...lineZeros]
				],
				note: NOTE_EMPTY
			},
			{
				k: "grid",
				cols: 3,
				grow: true,
				children: [
					{
						k: "card",
						title: "시간",
						body: "쉬는 시간을 포함해 첫 완료부터 마지막 완료까지로 셉니다."
					},
					{
						k: "card",
						title: "순위 기준",
						body: "순위는 건/hr, 곧 한 시간에 처리한 건수로 매깁니다."
					},
					{
						k: "card",
						title: "DPT 바꿔 보기",
						body: "유제 냉장은 루트 100 번대, FF2 는 루트 200 번대입니다. 위쪽 DPT 버튼으로 바꿉니다."
					}
				]
			}
		]
	},
	{
		title: "① 요약 · 센터비교",
		subtitle: "1~3 센터 비교 — 센터마다 진행 상황과 속도를 나란히 봅니다",
		blocks: [
			{
				k: "chips",
				label: "화면 선택 항목",
				items: ["DPT 전체 · 유제 냉장 · FF2"]
			},
			{
				k: "row",
				gap: 16,
				children: [{
					k: "col",
					flex: 1.7,
					gap: 8,
					children: [{
						k: "table",
						columns: [
							"센터",
							"할 일",
							"끝낸 일",
							"남은 일",
							"%",
							"시작",
							"끝",
							"시간",
							"건/hr",
							"순위"
						],
						rows: [
							[centerCell(1, "1 센터"), ...lineZeros],
							[centerCell(2, "2 센터"), ...lineZeros],
							[centerCell(3, "3 센터"), ...lineZeros]
						],
						note: NOTE_SHORT
					}]
				}, {
					k: "card",
					flex: .72,
					title: "읽는 법",
					body: "할 일은 전체 작업 건수, 끝낸 일은 완료 건수, 남은 일은 아직 안 한 건수입니다. 순위는 건/hr 이 높은 센터가 앞입니다."
				}]
			},
			{
				k: "row",
				gap: 16,
				grow: true,
				children: [{
					k: "card",
					flex: 1.45,
					title: "보는 순서",
					children: [{
						k: "ol",
						items: [
							"위에서 DPT( 전체 · 유제 냉장 · FF2 ) 를 고릅니다.",
							"남은 일과 % 로 센터별 진행 상황을 봅니다.",
							"건/hr · 순위로 센터별 속도를 비교합니다."
						]
					}]
				}, {
					k: "card",
					flex: .9,
					title: "작업 진척률",
					body: "센터비교 아래에서 1~3 센터와 DPT( 전체 · 유제 냉장 · FF2 ) 별 작업 진척률도 함께 봅니다."
				}]
			}
		]
	},
	{
		title: "① 요약 · 예상 작업 종료시간",
		subtitle: "센터별로 유제·FF2 가 몇 시에 끝날지 계산합니다",
		blocks: [
			{
				k: "chips",
				label: "화면 선택 항목",
				items: [
					"유제 구간 · FF2 구간",
					"계산 · 5% 반영 · 수기",
					"캡처 · 복사"
				]
			},
			{
				k: "table",
				columns: [
					"센터",
					"총유제 %",
					"현재 %",
					"유제마감",
					"예상종료"
				],
				rows: [
					[
						centerCell(1, "1 센터"),
						"",
						"",
						"",
						""
					],
					[
						centerCell(2, "2 센터"),
						"",
						"",
						"",
						""
					],
					[
						centerCell(3, "3 센터"),
						"",
						"",
						"",
						""
					]
				],
				note: NOTE_COLS
			},
			{
				k: "grid",
				cols: 3,
				grow: true,
				children: [
					{
						k: "card",
						title: "구간 평균",
						body: "유제 30 분은 유제 · 냉장만, FF2 15 분은 FF2 만 대상으로 평균을 냅니다."
					},
					{
						k: "card",
						title: "마감 · 예상 종료",
						body: "유제 마감과 예상 종료도 이 구간 평균 속도로 계산합니다."
					},
					{
						k: "card",
						title: "표시 방식",
						body: "화면에서 ‘계산 5% 반영’ 과 ‘수기’ 두 가지 표시 중에서 고릅니다."
					}
				]
			}
		]
	},
	{
		title: "① 요약 · 라인별 작업 %",
		subtitle: "센터마다 라인별 작업 비율을 나란히 봅니다",
		blocks: [
			{
				k: "chips",
				label: "화면 선택 항목",
				items: [
					"센터 1·2·3 센터",
					"라인 1~8 라인 · 유제",
					"계산 · 5% 반영 · 수기"
				]
			},
			{
				k: "table",
				dense: true,
				columns: [
					"센터",
					"현재 %",
					"1 라인",
					"2 라인",
					"3 라인",
					"4 라인",
					"5 라인",
					"6 라인",
					"7 라인",
					"8 라인",
					"유제"
				],
				rows: [
					1,
					2,
					3
				].map((n) => [centerCell(n, `${n} 센터`), ...Array(10).fill("0.0%")]),
				note: NOTE_COLS
			},
			{
				k: "grid",
				cols: 3,
				grow: true,
				children: [
					{
						k: "card",
						title: "읽는 법",
						body: "센터별 현재 % 와 1~8 라인, 유제의 작업 % 를 한 줄에서 비교합니다."
					},
					{
						k: "card",
						title: "어느 라인이 느린가",
						body: "같은 센터 안에서 % 가 낮은 라인이 아직 많이 남은 라인입니다."
					},
					{
						k: "card",
						title: "표시 방식",
						body: "화면에서 ‘계산 5% 반영’ 과 ‘수기’ 표시 중에서 고릅니다."
					}
				]
			}
		]
	},
	{
		title: "② 시간별 확인",
		subtitle: "시간별로 얼마나 했는지 구간을 나눠 봅니다",
		blocks: [
			{
				k: "chips",
				label: "화면 선택 항목",
				items: [
					"센터 1·2·3 센터",
					"DPT 전체 · 유제 냉장 · FF2",
					"구간 ( 분 ) 10·15·30·60",
					"인쇄"
				]
			},
			{
				k: "table",
				dense: true,
				columns: [
					"구간시작",
					"구간종료",
					"건수",
					"시간당",
					"누적",
					"총 %",
					"피킹",
					"구간 %",
					"1 라인",
					"2 라인",
					"3 라인",
					"4 라인",
					"5 라인",
					"6 라인",
					"7 라인",
					"8 라인"
				],
				rows: [
					heatRow(heatA),
					heatRow(heatB),
					heatRow(heatC)
				],
				note: NOTE_HEAT
			},
			{
				k: "grid",
				cols: 4,
				grow: true,
				children: [
					{
						k: "card",
						title: "구간 선택",
						body: "10·15·30·60 분 중에서 고르면 그 간격으로 시간대를 나눠 보여줍니다."
					},
					{
						k: "card",
						title: "색 농도",
						body: "색이 진할수록 그 구간에 많이 처리한 것입니다."
					},
					{
						k: "card",
						title: "% 읽는 법",
						body: "총 % 는 처음부터 쌓인 비율, 구간 % 는 그 구간만의 비율, 평균 % 는 구간 % 를 평균 낸 값입니다."
					},
					{
						k: "card",
						title: "계획 · 완료 행",
						body: "표 위쪽에서 계획 · 완료 건수와 시작 · 마지막 시각, 15 분별 평균작업건수를 봅니다."
					}
				]
			}
		]
	},
	{
		title: "③ 미작업 상품",
		subtitle: "미작업 상품리스트 — 아직 안 한 상품만 모아 보고 인쇄합니다",
		blocks: [
			{
				k: "chips",
				label: "화면 선택 항목",
				items: [
					"센터 1·2·3 센터",
					"라인 전체 · 1~8 라인",
					"DPT 전체 · 유제 냉장 · FF2",
					"인쇄"
				]
			},
			{
				k: "kpis",
				items: [
					"총작업량",
					"미작업수량",
					"몇 % 완료"
				]
			},
			{
				k: "table",
				columns: [
					"선택",
					"바코드",
					"상품",
					"총작업량",
					"미작업수량",
					"미작업 라인 수량",
					"몇 % 완료"
				],
				rows: [[
					{ box: true },
					"상품코드 (GoodsCD)",
					"상품명",
					"—",
					"—",
					"1라인 - 2개  2라인 - 1개",
					"—"
				]]
			},
			{
				k: "grid",
				cols: 3,
				grow: true,
				children: [
					{
						k: "card",
						title: "목록 기준",
						body: "미작업이 남은 상품만 보여 줍니다. 총작업량은 주문수량 합, 미작업수량은 아직 못 한 수량입니다. 미작업 라인 수량은 고른 센터 안에서 1라인 - 2개처럼 라인별 미작업수량입니다. 몇 %완료는 이 수량으로 계산합니다."
					},
					{
						k: "card",
						title: "인쇄",
						body: "체크한 상품만 인쇄됩니다. 아무것도 체크하지 않으면 화면에 보이는 상품 전체를 인쇄합니다. 인쇄본에는 몇 %완료가 없습니다."
					},
					{
						k: "card",
						title: "찾아가는 길",
						body: "⑤ 점포 진척에서 점포 이름을 누르면 그 점포의 미작업 상품이 나옵니다."
					}
				]
			}
		]
	},
	{
		title: "④ 작업 상품",
		subtitle: "상품마다 언제 시작해 언제 끝났는지, 작업시간이 얼마나인지 봅니다",
		blocks: [
			{
				k: "chips",
				label: "화면 선택 항목",
				items: [
					"센터 전체 · 1·2·3 센터",
					"DPT 전체 · 유제 냉장 · FF2",
					"라인 전체 · 1~8 라인"
				]
			},
			{
				k: "table",
				dense: true,
				columns: [
					"센터",
					"바코드",
					"상품",
					"작업수량",
					"총건수",
					"완료",
					"미완료",
					"시작",
					"종료",
					"작업시간"
				],
				rows: [[
					"1 센터",
					"GoodsCD",
					"상품명",
					"—",
					"—",
					"—",
					"—",
					"—",
					"—",
					"—"
				]],
				note: NOTE_COLS
			},
			{
				k: "grid",
				cols: 3,
				grow: true,
				children: [
					{
						k: "card",
						title: "상품별로 봅니다",
						body: "작업 시각이 없는 상품도 나옵니다. 상품마다 작업수량, 총건수, 완료 · 미완료 건수를 보여 줍니다."
					},
					{
						k: "card",
						title: "시작 · 종료 · 작업시간",
						body: "상품을 누르면 라인별 작업수량 옆에 작업완료수량이 있습니다. 주문수량만큼 피킹한 것만 완료수량입니다. 0이거나 모자라면 완료에 넣지 않고 미작업으로 남습니다. 라인을 누르면 점포별 작업수량, 작업완료수량, 건수가 나옵니다."
					},
					{
						k: "card",
						title: "상품 · 점포",
						body: "오른쪽 슬라이드로 점포를 고르면 점포 목록이 나옵니다. 점포 검색으로 점포를 찾고, 점포명을 누르면 상품코드, 상품명, 작업수량, 작업완료수량, 작업종료가 나옵니다. 시간 칸에는 02:51:12처럼 초까지 넣을 수 있습니다."
					}
				]
			}
		]
	},
	{
		title: "⑤ 점포 진척",
		subtitle: "점포 작업 진척률 — 점포별로 남은 건수를 봅니다",
		blocks: [
			{
				k: "chips",
				label: "화면 선택 항목",
				items: [
					"센터 1·2·3 센터",
					"라인 전체 · 1~8 라인",
					"점포 전체",
					"DPT 전체 · 유제 냉장 · FF2"
				]
			},
			{
				k: "kpis",
				items: [
					"작업건수",
					"완료건수",
					"잔여건수",
					"몇 % 완료"
				]
			},
			{
				k: "row",
				gap: 16,
				children: [{
					k: "table",
					flex: 1.55,
					columns: [
						"점포",
						"작업건수",
						"완료건수",
						"잔여건수 ▼",
						"몇 % 완료"
					],
					rows: [[
						"점포명 ( 누르면 미작업 상품 )",
						"—",
						"—",
						"—",
						"—"
					]]
				}, {
					k: "card",
					flex: .75,
					title: "정렬",
					body: "표의 제목을 누르면 그 열 기준으로 정렬되고, 다시 누르면 오름차순 · 내림차순이 바뀝니다."
				}]
			},
			{
				k: "row",
				gap: 16,
				grow: true,
				children: [{
					k: "card",
					flex: 1.55,
					title: "점포 이름을 누르면",
					children: [{
						k: "flow",
						from: "점포 이름 클릭",
						to: "피킹 시각이 없는\n미작업 상품 목록"
					}]
				}, {
					k: "card",
					flex: .75,
					title: "점포 · 완료 기준",
					body: "점포는 ClientNM( 점포명 ), 완료는 피킹 시각이 있는 건입니다."
				}]
			}
		]
	},
	{
		title: "⑥ 루트",
		subtitle: "루트 작업 종료 — 루트별로 어디까지 끝났는지 봅니다",
		blocks: [
			{
				k: "chips",
				label: "화면 선택 항목",
				items: [
					"센터 1·2·3 센터",
					"DPT 전체 · 유제 냉장 · FF2",
					"10 자리 묶음",
					"엑셀로 받기"
				]
			},
			{
				k: "table",
				columns: [
					"루트",
					"작업건수",
					"완료건수",
					"잔여건수",
					"몇 %"
				],
				rows: [[
					allCell("전체"),
					"0",
					"0",
					"0",
					"0.0%"
				], [
					"⋮",
					"⋮",
					"⋮",
					"⋮",
					"⋮"
				]],
				note: NOTE_EMPTY
			},
			{
				k: "grid",
				cols: 3,
				grow: true,
				children: [
					{
						k: "card",
						title: "루트 기준",
						body: "루트는 각 센터 시트의 RTECOD( 루트 코드 ) 입니다."
					},
					{
						k: "card",
						title: "완료 기준",
						body: "완료는 피킹 시각이 있는 건입니다. 시각이 없으면 잔여건수로 잡힙니다."
					},
					{
						k: "card",
						title: "꺼내 쓰기",
						body: "‘10 자리 묶음’ 옵션으로 보기 방식을 바꾸고, ‘엑셀로 받기’ 버튼으로 결과를 저장합니다."
					}
				]
			}
		]
	},
	{
		title: "⑦ 오출분석 · 엑셀과 필터",
		subtitle: "오출 엑셀을 올리면 점포 · 상품 · 로케이션에서 오출을 봅니다",
		blocks: [
			{
				k: "chips",
				label: "화면 선택 항목",
				items: [
					"센터",
					"라인",
					"DPT",
					"루트",
					"사유",
					"점포 검색",
					"표시",
					"엑셀 올리기"
				]
			},
			{
				k: "table",
				columns: [
					"DPT",
					"루트 번대",
					"보는 기준"
				],
				rows: [
					[
						"FF1편 · 1차상품",
						"300번대",
						"작업 엑셀 루트에 100을 더합니다."
					],
					[
						"FF2편 · 유제 · 냉장",
						"200번대",
						"배송루트 100번대는 200번대로 바꿉니다."
					],
					[
						"냉동 · 빙과",
						"400번대",
						"작업 엑셀 루트에 200을 더합니다."
					]
				],
				note: "※ 작업 엑셀에 루트가 없으면 오출 엑셀의 배송루트를 같은 번대로 보여 줍니다."
			},
			{
				k: "grid",
				cols: 3,
				grow: true,
				children: [
					{
						k: "card",
						title: "엑셀 올리기",
						body: "오출 엑셀을 올립니다. 작업 파일의 배치표가 있으면 점포가 로케이션에 붙습니다."
					},
					{
						k: "card",
						title: "DPT 여섯 가지",
						body: "FF1편, FF2편, 유제, 냉장, 냉동, 1차상품입니다. 빙과는 냉동으로 봅니다."
					},
					{
						k: "card",
						title: "여러 개 고르기",
						body: "DPT · 루트 · 사유는 여러 개 고릅니다. 루트는 검색 후 엔터로 적용합니다."
					}
				]
			}
		]
	},
	{
		title: "⑦ 오출분석 · 냉장과 냉동",
		subtitle: "위 슬라이드로 냉장 · 냉동을 바꾸고, 아래에서 보는 방식을 고릅니다",
		blocks: [
			{
				k: "chips",
				label: "슬라이드",
				items: [
					"냉장",
					"냉동",
					"로케이션",
					"상위5점",
					"점포",
					"상품"
				]
			},
			{
				k: "table",
				columns: ["화면", "내용"],
				rows: [
					["냉장 로케이션", "배치표에 건수 · 금액 · 오출 일수"],
					["냉장 상위5점", "점포 5곳 · 라인 · 로케이션 · 점포명 순"],
					["냉동 점포", "냉동만 점포 표로 봅니다"],
					["냉동 상품", "냉동 상품만 모읍니다"]
				],
				note: "※ 미오출사유, 상위 10점, 못 찾은 점포 제목을 누르면 아래로 길어지며 아래 화면을 덮습니다."
			},
			{
				k: "grid",
				cols: 3,
				grow: true,
				children: [
					{
						k: "card",
						title: "라인 필터",
						body: "냉장 로케이션과 상위5점에 있습니다. 고른 라인만 집계합니다."
					},
					{
						k: "card",
						title: "상위 10점",
						body: "일수 · 건수 · 금액으로 고르고, 옆의 라인 필터로 라인을 좁힙니다."
					},
					{
						k: "card",
						title: "1센터 냉동",
						body: "냉장 로케이션 배치에는 넣지 않습니다. 냉동 슬라이드에서 봅니다."
					}
				]
			}
		]
	},
	{
		title: "⑦ 오출분석 · 점포 창과 상품",
		subtitle: "점포명이나 상품명을 누르면 그 오출만 따로 봅니다",
		blocks: [
			{
				k: "chips",
				label: "상품 창 필터",
				items: [
					"루트",
					"점포명",
					"사유",
					"검색 후 엔터"
				]
			},
			{
				k: "table",
				columns: [
					"출고일",
					"루트",
					"로케이션",
					"점포명",
					"수량",
					"금액",
					"사유"
				],
				rows: [[
					"····-··-··",
					"···",
					"····",
					"점포명",
					"0",
					"0",
					"사유"
				], [
					"⋮",
					"⋮",
					"⋮",
					"⋮",
					"⋮",
					"⋮",
					"⋮"
				]],
				note: "※ 머리글을 누르면 정렬됩니다. 루트는 작업 엑셀 번대입니다."
			},
			{
				k: "grid",
				cols: 3,
				grow: true,
				children: [
					{
						k: "card",
						title: "점포 창",
						body: "점포명을 누르면 일수 · 건 · 수량 · 금액과 사유, 상품 목록이 나옵니다. DPT · 사유는 여러 개 고릅니다."
					},
					{
						k: "card",
						title: "상품 화면",
						body: "냉장 상품은 냉동을 빼고, 냉동 상품은 냉동만 모읍니다. 같은 상품코드끼리 묶습니다."
					},
					{
						k: "card",
						title: "닫기",
						body: "점포 창과 상품 창은 바깥을 누르거나 ESC 로 닫습니다. 오른쪽 위 프린트로 지금 보이는 목록을 출력합니다."
					}
				]
			}
		]
	},
	{
		title: "⑧ 로케이션",
		subtitle: "라인별 점포 배치 — 점포를 끌어다 빼 두는 임시 배치도 여기서 합니다. 포천은 1·2센터 모두 1~6라인이고 칸 번호가 신오산과 다릅니다.",
		blocks: [
			{
				k: "chips",
				label: "화면 선택 항목",
				items: [
					"센터 1·2·3 센터",
					"DPT 전체 · 유제 냉장 · FF2",
					"루트 · 라인 전체",
					"점포 원위치 · 선택 점포 빼기",
					"엑셀"
				]
			},
			{
				k: "row",
				gap: 16,
				children: [{
					k: "col",
					flex: 1.55,
					gap: 8,
					children: [
						{
							k: "badge",
							text: "1 라인",
							tone: "red"
						},
						{
							k: "row",
							gap: 18,
							children: [{
								k: "table",
								flex: 1,
								columns: [
									"로케이션",
									"점포명",
									"작업수량"
								],
								rows: [
									[
										"0139",
										"",
										""
									],
									[
										"0138",
										"",
										""
									],
									[
										"0137",
										"",
										""
									],
									[
										"⋮",
										"⋮",
										"⋮"
									],
									[
										"0101",
										"",
										""
									]
								]
							}, {
								k: "table",
								flex: 1,
								columns: [
									"작업수량",
									"점포명",
									"로케이션"
								],
								rows: [
									[
										"",
										"",
										"0189"
									],
									[
										"",
										"",
										"0188"
									],
									[
										"",
										"",
										"0187"
									],
									[
										"⋮",
										"⋮",
										"⋮"
									],
									[
										"",
										"",
										"0151"
									]
								]
							}]
						},
						{
							k: "note",
							text: "↑ 1 라인 예시 : 왼쪽 0139→0101, 오른쪽 0189→0151 ( 라인마다 같은 구조 )"
						}
					]
				}, {
					k: "card",
					flex: .72,
					title: "배치표 올리기",
					body: "1·2·3 센터 배치표를 올리면 발주가 없는 점포도 칸에 나옵니다. 올리기 전에는 작업 엑셀에 있는 점포만 보입니다."
				}]
			},
			{
				k: "row",
				gap: 16,
				grow: true,
				children: [{
					k: "card",
					flex: 1.55,
					title: "위치 규칙",
					body: "칸 번호와 기둥은 센터마다 다릅니다. 제어판의 배치에서 고칩니다. 점포는 ClientNM 이고, 빼 두어도 로케이션 번호는 움직이지 않습니다."
				}, {
					k: "card",
					flex: .72,
					title: "임시 배치",
					body: "점포만 끌어다 빼 둘 수 있습니다. 로케이션 번호는 움직이지 않고, 빼 둔 작업수량은 라인 합계에서 빠집니다."
				}]
			}
		]
	},
	{
		title: "오출 확인",
		subtitle: "작업 엑셀과 오출 엑셀을 맞추면 라인 · 로케이션이 붙은 오출 이력이 나옵니다",
		blocks: [{
			k: "chips",
			label: "열",
			items: [
				"오출일자",
				"센터",
				"라인",
				"로케이션",
				"루트",
				"점포코드",
				"점포명",
				"마스터",
				"상품코드",
				"상품명",
				"출고수량",
				"수량",
				"오출금액",
				"작업 시간",
				"미오출사유"
			]
		}, {
			k: "row",
			gap: 16,
			grow: true,
			children: [
				{
					k: "card",
					flex: 1,
					title: "파일",
					body: "엑셀 업로드를 누르거나 파일을 화면에 놓습니다. 센터는 1센터 · 2센터 · 3센터 · 냉동 · 통합, 구분은 작업 · 오출입니다. 통합은 1·2·3센터 작업이 한 파일일 때 씁니다. 1센터 오출 파일 안의 냉동은 냉동으로 나눕니다."
				},
				{
					k: "card",
					flex: 1,
					title: "맞추는 기준",
					body: "같은 센터의 점포코드와 상품코드로 작업 행을 찾습니다. 코드가 없으면 상품명으로 찾습니다. 출고수량은 그렇게 찾은 작업 행의 피킹 수량 합입니다. 작업 파일이 없으면 비어 있습니다. 그 상품에 작업 시간이 없어도, 같은 점포의 다른 작업에 있는 라인 · 로케이션을 가져옵니다. 냉동은 표시기주소를 로케이션 파일과 맞춰 라인은 존코드, 로케이션은 로케이션코드로 보입니다. 신오산 파일은 기본으로 들어 있고, 다른 지역은 제어판에서 올립니다."
				},
				{
					k: "card",
					flex: 1,
					title: "필터",
					body: "모든 열 제목 옆 필터를 누르면 검색과 체크 목록이 나옵니다. 고른 항목만 표에 남고, 전체 초기화로 다시 다 봅니다. 상품은 이름 또는 바코드로 찾고, 마스터 열은 DPT(FF1 · FF2 · 냉동)로 좁힙니다. 수량이 -5 이하인 줄은 연한 빨강입니다. 왼쪽 회색 칸의 점포 10 · 상품 10은 오출 금액이 마이너스인 항목이고, 이름을 누르면 상세가 열립니다."
				}
			]
		}]
	},
	{
		title: "⑨ 생산성 분석",
		subtitle: "보관해 둔 생산성 파일을 여러 개 골라 일 · 주 · 월별로 봅니다",
		blocks: [
			{
				k: "chips",
				label: "화면 선택 항목",
				items: [
					"연도",
					"기간 일별 · 주별 · 월별",
					"보기 센터 · DPT"
				]
			},
			{
				k: "chips",
				label: "상단 버튼",
				items: [
					"생산성 파일",
					"근태표",
					"근태양식",
					"엑셀로 받기"
				]
			},
			{
				k: "steps",
				grow: true,
				arrows: true,
				items: [
					{
						title: "파일 고르기",
						body: "보관해 둔 업로드 파일을 여러 개 고릅니다.\n예 : 1019_FF1, 1019_FF2"
					},
					{
						title: "기간 정하기",
						body: "일별 · 주별 · 월별 중에서 고릅니다."
					},
					{
						title: "범위 좁히기",
						body: "연도, 센터, DPT 로 좁혀 봅니다."
					},
					{
						title: "엑셀로 받기",
						body: "요약 · 분석 · 일별 · 주별 · 월별 · 사람 · 분석데이터 시트로 받습니다. 분석 시트의 노란 칸(시작 9시, 종료 6시, 연장 1시간)을 바꾸면 판정이 다시 계산됩니다."
					}
				]
			},
			{
				k: "bar",
				title: "근태 연계",
				body: "근태표와 근태양식으로 근태 자료를 함께 다루는 버튼입니다. 세부 사용법은 화면의 안내를 따릅니다."
			}
		]
	},
	{
		title: "⑩ 출고 분석 · 파일 만들기",
		subtitle: "출고 분석에 쓸 파일은 가맹지원시스템에서 받아 만듭니다",
		blocks: [{
			k: "row",
			gap: 16,
			grow: true,
			children: [
				{
					k: "shot",
					which: "menu",
					label: "메뉴 위치",
					flex: .72
				},
				{
					k: "col",
					flex: 1,
					gap: 14,
					children: [{
						k: "card",
						flex: 1,
						title: "1 단계 · 메뉴 열기",
						body: "가맹지원시스템에서 물류 → 재고 → 입출고실적 → 배송상품군별미출실적조회를 엽니다."
					}, {
						k: "card",
						flex: 1,
						title: "3 · 4 단계 · 올리기",
						body: "받은 파일을 ‘업로드 만들기’ 에 올리면 저장 위치를 묻습니다. 취소하면 저장되지 않습니다. 만든 파일은 ‘월 파일 올리기’ 로 올립니다."
					}]
				},
				{
					k: "col",
					flex: 1.15,
					gap: 14,
					children: [{
						k: "shot",
						which: "screen",
						label: "조회 화면",
						flex: 1.15
					}, {
						k: "card",
						title: "2 단계 · 조건 정하기",
						body: "센터는 전 센터, 기간은 확정월로 합니다. 미출로 한 번 받아 두고, 오출로 한 번 더 받습니다."
					}]
				}
			]
		}]
	},
	{
		title: "⑩ 출고 분석 · 화면 사용",
		subtitle: "만든 월 파일을 불러와 요약 · 피벗 · 추이 · 출고정리로 봅니다",
		blocks: [
			{
				k: "chips",
				label: "화면 선택 항목",
				items: [
					"센터",
					"DPT",
					"루트",
					"표시 건수 · 작업수량",
					"라인"
				]
			},
			{
				k: "chips",
				label: "하위 메뉴",
				items: [
					"요약",
					"피벗",
					"추이",
					"출고정리"
				]
			},
			{
				k: "grid",
				cols: 3,
				grow: true,
				children: [
					{
						k: "card",
						n: 1,
						title: "업로드 만들기",
						body: "가맹지원시스템에서 받은 미출 · 오출 파일을 올려 월 파일을 만듭니다. 저장 위치를 묻고, 취소하면 저장되지 않습니다."
					},
					{
						k: "card",
						n: 2,
						title: "월 파일 올리기",
						body: "만든 월 파일을 올립니다. 화면에 파일을 놓아도 같이 열립니다. 그다음 요약, 피벗, 추이, 출고정리를 봅니다."
					},
					{
						k: "card",
						n: 3,
						title: "데이터 비우기",
						body: "불러온 데이터를 비웁니다. 새 월 파일로 바꿀 때 씁니다."
					}
				]
			},
			{
				k: "bar",
				title: "사용 순서",
				body: "가맹지원시스템에서 미출 · 오출 파일 받기 → 업로드 만들기 → 월 파일 올리기 → 센터 · DPT · 루트 · 표시 ( 건수 · 작업수량 ) · 라인으로 범위를 좁혀 하위 메뉴에서 확인합니다."
			}
		]
	},
	{
		title: "알아두면 좋은 점",
		subtitle: "숫자를 읽을 때 꼭 기억해 둘 여섯 가지",
		blocks: [{
			k: "grid",
			cols: 3,
			gap: 16,
			grow: true,
			children: [
				{
					k: "card",
					n: 1,
					tone: "amber",
					title: "회사 PC 는 EXE 로",
					body: "브라우저 업로드는 Privacy-i 가 막습니다. EXE 는 새 버전이 있으면 다음에 열 때 바꿉니다. 메뉴 아래 Build 번호로 버전을 확인합니다. 안 바뀌면 생산성 EXE를 다시 받아 생산성보기.exe 와 화면.html 만 바꾸세요. 제어판.json 은 그대로 둡니다."
				},
				{
					k: "card",
					n: 2,
					tone: "amber",
					title: "쉬는 시간이 포함됩니다",
					body: "시간, 건/hr, 예상 종료시간에 쉬는 시간이 들어 있어 실제보다 느리게 보일 수 있습니다."
				},
				{
					k: "card",
					n: 3,
					tone: "amber",
					title: "완료 = 피킹 시각",
					body: "피킹 시각이 없는 건은 잔여 · 미작업으로 셉니다."
				},
				{
					k: "card",
					n: 4,
					tone: "amber",
					title: "DPT 는 루트 번대로",
					body: "유제 냉장은 루트 100 번대, FF2 는 루트 200 번대입니다."
				},
				{
					k: "card",
					n: 5,
					tone: "amber",
					title: "인쇄는 선택한 것만",
					body: "인쇄할 때는 지금 선택한 센터, DPT, 구간만 출력됩니다."
				},
				{
					k: "card",
					n: 6,
					tone: "amber",
					title: "로케이션 번호는 그대로",
					body: "점포를 빼 두어도 로케이션 번호는 움직이지 않고, 빼 둔 작업수량만 라인 합계에서 빠집니다."
				}
			]
		}]
	},
	{
		title: "제어판",
		subtitle: "왼쪽이 메뉴, 오른쪽이 내용입니다. 순서는 마스터 수정 · 지역센터 · 배치 · 냉동 로케이션",
		blocks: [
			{
				k: "chips",
				label: "메뉴",
				items: [
					"마스터 수정",
					"지역센터",
					"배치",
					"냉동 로케이션"
				]
			},
			{
				k: "chips",
				label: "저장",
				items: [
					"가져오기",
					"회사 EXE도 같이 올림",
					"지역은 합쳐서 남음"
				]
			},
			{
				k: "steps",
				items: [
					{
						title: "마스터 수정",
						body: "배송상품군 코드를 추가합니다. 코드, 이름, 편(FF1편 · FF2편 · 유제 · 냉장 · 냉동 · 1차상품)을 넣습니다."
					},
					{
						title: "지역센터",
						body: "지역 이름을 추가하거나 지웁니다. 그 안에서 센터를 더하고, 라인 수를 + − 로 바꿉니다."
					},
					{
						title: "배치",
						body: "지역, 센터, 라인을 고른 뒤 왼쪽·오른쪽 칸 수와 이름을 바꿉니다. 포천 2센터는 FF1 · FF2 가 따로입니다."
					},
					{
						title: "냉동 로케이션",
						body: "지역을 고르고 로케이션 목록 엑셀을 올립니다. 표시기주소로 맞춰 오출의 라인은 존코드, 로케이션은 로케이션코드가 됩니다. 오른쪽에 최신 업데이트 일자가 나옵니다. 신오산은 기본 파일이 있고, 올린 파일은 그 지역에만 적용됩니다."
					},
					{
						title: "어디에 남나",
						body: "저장하면 사이트에 올라가고, 다른 센터 EXE와 사이트는 가져오기로 받습니다. 없는 지역만 더하고, 이미 있는 지역은 더 나중에 저장한 쪽이 남습니다. 회사 EXE의 제어판.json 도 같이 갱신됩니다."
					}
				]
			},
			{
				k: "bar",
				title: "여는 곳",
				body: "왼쪽 메뉴 맨 아래 톱니입니다. 메뉴를 누르면 오른쪽 화면이 바뀌고, 뒤로 가기는 없습니다."
			}
		]
	},
	{
		title: "배치 고치기",
		subtitle: "첫 칸 숫자는 아래, 끝 칸 숫자는 위에 채워집니다",
		blocks: [
			{
				k: "chips",
				label: "번호",
				items: [
					"첫 칸",
					"끝 칸",
					"80칸까지"
				]
			},
			{
				k: "chips",
				label: "칸",
				items: [
					"칸 추가",
					"기둥 넣기",
					"위로 · 아래로",
					"원래 배치"
				]
			},
			{
				k: "steps",
				items: [
					{
						title: "번호 채우기",
						body: "왼쪽 또는 오른쪽에 첫 칸과 끝 칸을 적고 칸 밖을 누릅니다. 0101 과 0139 이면 위가 0139, 아래가 0101 입니다."
					},
					{
						title: "칸 · 기둥",
						body: "칸을 누른 뒤 칸 추가 또는 기둥 넣기를 누르면 그 칸 위에 생깁니다. 기둥은 한 칸이고, 기둥 다음 기둥은 한 덩어리로 보입니다."
					},
					{
						title: "옮기기",
						body: "≡ 를 끌어 왼쪽·오른쪽으로 옮깁니다. 위로 · 아래로 버튼도 됩니다."
					},
					{
						title: "라인",
						body: "라인 추가 · 라인 삭제로 줄 수를 바꿉니다. 원래 배치는 그 센터를 처음 배치로 되돌립니다."
					}
				]
			},
			{
				k: "bar",
				title: "기둥은 다시",
				body: "첫 칸 · 끝 칸으로 번호를 채우면 그 줄의 칸이 번호로 바뀝니다. 사이에 둘 기둥은 기둥 넣기로 다시 끼웁니다."
			}
		]
	}
];
var FONT = "\"Malgun Gothic\", \"맑은 고딕\", Pretendard, \"Noto Sans KR\", sans-serif";
var INK = "#1B2631";
var TITLE = "#1A5276";
var SUB = "#5D6D7E";
var CHIP = "#2E86C1";
var LINE = "#D5DDE5";
var CARD = "#EEF3F8";
var TIP = "#F39C12";
var LINES = [
	"#E74C3C",
	"#F39C12",
	"#F1C40F",
	"#2ECC71",
	"#3498DB",
	"#9B59B6",
	"#FF6FA5",
	"#1F4E9E"
];
var CENTERS = [
	"#3498DB",
	"#F39C12",
	"#9B59B6"
];
var W = 1280;
var H = 720;
var X$1 = 58;
var CW = 1164;
/** Card bottom is exclusive: a card at y with height (CARD_BOTTOM - y) ends on pixel 652. */
var CARD_BOTTOM = 653;
var COL_W = {
	5: [
		161,
		123,
		103,
		104,
		94,
		113,
		113,
		104,
		113,
		116
	],
	7: [
		286,
		218,
		219,
		219,
		212
	],
	8: [
		151,
		123,
		89,
		89,
		90,
		89,
		89,
		89,
		89,
		90,
		154
	],
	9: [
		79,
		80,
		55,
		66,
		55,
		56,
		55,
		66,
		78,
		79,
		79,
		79,
		79,
		78,
		79,
		79
	],
	11: [
		94,
		142,
		247,
		113,
		104,
		89,
		94,
		85,
		84,
		92
	],
	13: [
		334,
		209,
		209,
		209,
		193
	]
};
function heatColor$2(t) {
	const x = Math.min(1, Math.max(0, t));
	const from = [
		214,
		234,
		248
	];
	const to = [
		26,
		82,
		118
	];
	const rgb = from.map((v, i) => Math.round(v + (to[i] - v) * x));
	return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}
function findAll(nodes, kind) {
	const out = [];
	for (const node of nodes) {
		if (node.k === kind) out.push(node);
		if ("children" in node && node.children) out.push(...findAll(node.children, kind));
	}
	return out;
}
function Dot({ color, size }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		"aria-hidden": true,
		style: {
			display: "inline-block",
			width: size,
			height: size,
			borderRadius: "50%",
			background: color,
			flex: "0 0 auto"
		}
	});
}
function Num$1({ n, tone = "navy", size, fontSize }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		style: {
			width: size,
			height: size,
			borderRadius: "50%",
			background: tone === "amber" ? TIP : TITLE,
			color: "#fff",
			fontWeight: 700,
			fontSize,
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			flex: "0 0 auto",
			lineHeight: 1
		},
		children: n
	});
}
function Arrow() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		width: "18",
		height: "22",
		viewBox: "0 0 18 22",
		"aria-hidden": true,
		style: { position: "absolute" },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M2 1 L16 11 L2 21 Z",
			fill: TITLE
		})
	});
}
function slots(count, y, bottom = CARD_BOTTOM) {
	const h = bottom - y;
	if (count === 4) {
		const widths = [
			273,
			272,
			273,
			273
		];
		const gap = 25;
		let x = 57;
		return widths.map((w) => {
			const slot = {
				x,
				y,
				w,
				h
			};
			x += w + gap;
			return slot;
		});
	}
	if (count === 3) {
		const w = 370;
		return [
			0,
			1,
			2
		].map((i) => ({
			x: 57 + i * 398,
			y,
			w,
			h
		}));
	}
	if (count === 2) {
		const w = 569;
		return [0, 1].map((i) => ({
			x: 57 + i * 597,
			y,
			w,
			h
		}));
	}
	if (count === 5) {
		const w = 214;
		return [
			0,
			1,
			2,
			3,
			4
		].map((i) => ({
			x: 57 + i * 232,
			y,
			w,
			h
		}));
	}
	return [{
		x: 57,
		y,
		w: 1166,
		h
	}];
}
function box(extra) {
	return {
		position: "absolute",
		boxSizing: "border-box",
		fontFamily: FONT,
		...extra
	};
}
function Chips({ node, y }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: box({
			left: X$1,
			top: y,
			width: CW,
			height: 36,
			display: "flex",
			alignItems: "center",
			gap: 10
		}),
		children: [node.label ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			style: {
				fontSize: 16,
				fontWeight: 700,
				color: SUB,
				lineHeight: "16px",
				flex: "0 0 auto"
			},
			children: node.label
		}) : null, node.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			style: {
				height: 36,
				display: "inline-flex",
				alignItems: "center",
				padding: "0 14px",
				borderRadius: 999,
				border: `1.5px solid ${CHIP}`,
				background: "#fff",
				color: TITLE,
				fontWeight: 700,
				fontSize: 16,
				lineHeight: "16px",
				boxSizing: "border-box",
				whiteSpace: "nowrap"
			},
			children: item
		}, item))]
	});
}
function cellView(cell) {
	if (typeof cell !== "object") return cell ?? "";
	const color = cell.dot === "line" ? LINES[(cell.n ?? 1) - 1] : cell.dot === "center" ? CENTERS[(cell.n ?? 1) - 1] : TITLE;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		style: {
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			gap: 6
		},
		children: [
			cell.dot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dot, {
				color,
				size: 12
			}) : null,
			cell.box ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				style: {
					width: 14,
					height: 14,
					border: `1.5px solid ${INK}`,
					borderRadius: 2,
					display: "inline-block"
				}
			}) : null,
			cell.text
		]
	});
}
function DataTable({ table, x, y, w, font = 16, widths, headH = 36, rowH = 33 }) {
	const sum = widths?.reduce((a, b) => a + b, 0) ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
		style: box({
			left: x,
			top: y,
			width: w,
			borderCollapse: "collapse",
			tableLayout: "fixed",
			fontSize: font,
			color: INK,
			background: "#fff"
		}),
		children: [
			widths && sum > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("colgroup", { children: widths.map((width, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("col", { style: { width: `${width / sum * 100}%` } }, i)) }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
				style: { height: headH },
				children: table.columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					style: {
						height: headH,
						background: TITLE,
						color: "#fff",
						fontWeight: 700,
						fontSize: font,
						lineHeight: `${headH}px`,
						textAlign: "center",
						border: `1px solid ${LINE}`,
						padding: 0,
						whiteSpace: "nowrap"
					},
					children: column
				}, column))
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: table.rows.map((row, ri) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
				style: { height: rowH },
				children: row.map((cell, ci) => {
					const heat = typeof cell === "object" ? cell.heat : void 0;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						style: {
							height: rowH,
							lineHeight: `${rowH}px`,
							textAlign: table.left ? "left" : "center",
							padding: table.left ? "0 10px" : 0,
							border: `1px solid ${LINE}`,
							background: heat == null ? "#fff" : heatColor$2(heat),
							fontSize: font,
							whiteSpace: "nowrap",
							overflow: "hidden"
						},
						children: heat == null ? cellView(cell) : ""
					}, ci);
				})
			}, ri)) })
		]
	});
}
function Note({ text, y }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		style: box({
			left: X$1,
			top: y,
			width: CW,
			height: 20,
			fontSize: 15,
			lineHeight: "20px",
			color: SUB
		}),
		children: text
	});
}
function cardShell(x, y, w, h) {
	return box({
		left: x,
		top: y,
		width: w,
		height: h,
		background: CARD,
		borderRadius: 10,
		padding: 21,
		overflow: "hidden"
	});
}
var bodyText = {
	marginTop: 8,
	fontSize: 19,
	lineHeight: 1.4,
	color: INK,
	whiteSpace: "pre-line"
};
function Inner({ node }) {
	if (node.k === "badge") {
		const background = node.tone === "orange" ? TIP : node.tone === "red" ? LINES[0] : TITLE;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			style: {
				display: "inline-flex",
				alignItems: "center",
				height: 32,
				padding: "0 14px",
				borderRadius: 999,
				background,
				color: "#fff",
				fontWeight: 700,
				fontSize: 16,
				lineHeight: "16px"
			},
			children: node.text
		});
	}
	if (node.k === "p") {
		const size = node.size ?? (node.strong ? 24 : 19);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: {
				marginTop: node.strong ? 12 : 8,
				fontSize: size,
				fontWeight: node.strong ? 700 : 400,
				lineHeight: 1.4,
				color: node.strong ? TITLE : INK
			},
			children: node.text
		});
	}
	if (node.k === "link") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
		href: node.href,
		style: {
			display: "inline-block",
			marginTop: 10,
			color: CHIP,
			fontSize: 16,
			fontWeight: 700,
			lineHeight: "20px",
			textDecoration: "none"
		},
		children: node.text
	});
	if (node.k === "ol") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			gap: 12,
			marginTop: 14
		},
		children: node.items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				alignItems: "center",
				gap: 12
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num$1, {
				n: i + 1,
				size: 40,
				fontSize: 18
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				style: {
					fontSize: 19,
					lineHeight: 1.4,
					color: INK
				},
				children: item
			})]
		}, item))
	});
	if (node.k === "flow") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			display: "flex",
			alignItems: "center",
			gap: 16,
			marginTop: 28
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				style: {
					background: TITLE,
					color: "#fff",
					fontWeight: 700,
					fontSize: 19,
					borderRadius: 10,
					padding: "14px 18px",
					lineHeight: 1.3
				},
				children: node.from
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
				width: "22",
				height: "22",
				viewBox: "0 0 22 22",
				"aria-hidden": true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M4 2 L18 11 L4 20 Z",
					fill: TITLE
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				style: {
					border: `2px solid ${TITLE}`,
					color: TITLE,
					fontWeight: 700,
					fontSize: 19,
					borderRadius: 10,
					padding: "12px 16px",
					lineHeight: 1.35,
					background: "#fff",
					whiteSpace: "pre-line"
				},
				children: node.to
			})
		]
	});
	if (node.k === "lines") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		style: {
			display: "grid",
			gridTemplateColumns: "repeat(4, 44px)",
			gap: 14,
			marginTop: 18
		},
		children: LINES.map((color, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			style: {
				width: 44,
				height: 44,
				borderRadius: "50%",
				background: color,
				color: "#fff",
				fontWeight: 700,
				fontSize: 21,
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center"
			},
			children: i + 1
		}, color))
	});
	return null;
}
function CardView({ card, x, y, w, h, titleSize = 21 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: cardShell(x, y, w, h),
		children: [
			card.n != null || card.title ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 12
				},
				children: [card.n != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num$1, {
					n: card.n,
					tone: card.tone === "amber" ? "amber" : "navy",
					size: 44,
					fontSize: 21
				}) : null, card.title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						fontSize: titleSize,
						fontWeight: 700,
						color: TITLE,
						lineHeight: 1.25
					},
					children: card.title
				}) : null]
			}) : null,
			card.body ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: bodyText,
				children: card.body
			}) : null,
			card.children?.map((child, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inner, { node: child }, i))
		]
	});
}
function StepRow({ items, y, bottom = CARD_BOTTOM, arrows, titleSize = 24 }) {
	const place = slots(items.length, y, bottom);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: cardShell(place[i].x, place[i].y, place[i].w, place[i].h),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				alignItems: "center",
				gap: 12
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num$1, {
				n: i + 1,
				size: 44,
				fontSize: 21
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					fontSize: titleSize,
					fontWeight: 700,
					color: TITLE,
					lineHeight: 1.25
				},
				children: item.title
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: bodyText,
			children: item.body
		})]
	}, item.title)), arrows ? items.slice(1).map((_, i) => {
		const gap = items.length === 4 ? 26 : 29;
		const left = place[i].x + place[i].w + gap / 2 - 9;
		const top = place[i].y + place[i].h / 2 - 11;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left,
				top,
				width: 18,
				height: 22
			}),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arrow, {})
		}, i);
	}) : null] });
}
function TitleBlock({ title }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		style: box({
			left: X$1,
			top: 34,
			width: CW,
			height: 72,
			display: "flex",
			alignItems: "center",
			color: TITLE,
			fontSize: 45,
			fontWeight: 700,
			lineHeight: "45px",
			whiteSpace: "nowrap"
		}),
		children: title
	});
}
function SubtitleBlock({ text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		style: box({
			left: X$1,
			top: 100,
			width: CW,
			height: 28,
			color: SUB,
			fontSize: 21,
			lineHeight: "28px",
			whiteSpace: "nowrap"
		}),
		children: text
	});
}
function Footer({ index }) {
	const dot = 15;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left: 56,
				top: 675,
				height: dot,
				display: "flex",
				alignItems: "center",
				gap: 5
			}),
			children: LINES.map((color) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dot, {
				color,
				size: dot
			}, color))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left: 231,
				top: 676,
				height: 18,
				color: SUB,
				fontSize: 13,
				lineHeight: "18px"
			}),
			children: "센터 생산성 프로그램 사용 매뉴얼 · osan.grok.me"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left: X$1,
				top: 676,
				width: CW,
				height: 18,
				textAlign: "right",
				color: SUB,
				fontSize: 13,
				lineHeight: "18px"
			}),
			children: index + 1
		})
	] });
}
function tableMetrics(rows, top = 198) {
	const height = 36 + rows * 33;
	return {
		top,
		height,
		noteY: top + height + 12,
		cardY: top + height + 47
	};
}
function Standard({ page, font = 16, index }) {
	const chips = findAll(page.blocks, "chips");
	const table = findAll(page.blocks, "table")[0];
	const cards = findAll(page.blocks, "card");
	if (!table) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tips, { page });
	const metrics = tableMetrics(table.rows.length);
	const place = slots(cards.length, metrics.cardY);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		chips[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chips, {
			node: chips[0],
			y: 148
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
			table,
			x: 59,
			y: metrics.top,
			w: 1162,
			font,
			widths: COL_W[index]
		}),
		table.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Note, {
			text: table.note,
			y: metrics.noteY
		}) : null,
		cards.map((card, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card,
			x: place[i].x,
			y: place[i].y,
			w: place[i].w,
			h: place[i].h
		}, card.title))
	] });
}
function Intro({ page }) {
	const stats = findAll(page.blocks, "stat");
	const steps = findAll(page.blocks, "steps")[0];
	const statPlace = slots(3, 172);
	const stepBoxes = [
		{
			x: 57,
			y: 393,
			w: 337,
			h: 251
		},
		{
			x: 471,
			y: 393,
			w: 337,
			h: 251
		},
		{
			x: 885,
			y: 393,
			w: 337,
			h: 251
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		stats.map((stat, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				...cardShell(statPlace[i].x, 172, statPlace[i].w, 184),
				display: "flex",
				alignItems: "center",
				gap: 16,
				padding: "0 24px"
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				style: {
					fontSize: 80,
					fontWeight: 700,
					color: TITLE,
					lineHeight: "80px"
				},
				children: stat.n
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				style: {
					fontSize: 24,
					fontWeight: 700,
					color: TITLE,
					lineHeight: "30px"
				},
				children: stat.label
			})]
		}, stat.label)),
		steps.items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: box({
				left: stepBoxes[i].x,
				top: stepBoxes[i].y,
				width: stepBoxes[i].w,
				height: stepBoxes[i].h,
				border: `1.5px solid ${CHIP}`,
				borderRadius: 14,
				background: "#fff",
				padding: "24px 22px"
			}),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 14
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num$1, {
					n: i + 1,
					size: 58,
					fontSize: 27
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						fontSize: 24,
						fontWeight: 700,
						color: TITLE,
						lineHeight: "30px"
					},
					children: item.title
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					marginTop: 18,
					fontSize: 19,
					lineHeight: 1.4,
					color: INK
				},
				children: item.body
			})]
		}, item.title)),
		stepBoxes.slice(1).map((item, i) => {
			const prev = stepBoxes[i];
			const left = prev.x + prev.w + (item.x - (prev.x + prev.w)) / 2 - 16;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
				width: "32",
				height: "36",
				viewBox: "0 0 32 36",
				"aria-hidden": true,
				style: box({
					left,
					top: 500,
					width: 32,
					height: 36
				}),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M2 2 L30 18 L2 34 Z",
					fill: CHIP
				})
			}, item.x);
		})
	] });
}
function Connect({ page }) {
	const cards = findAll(page.blocks, "card");
	const heading = findAll(page.blocks, "h")[0];
	const steps = findAll(page.blocks, "steps")[0];
	const top = slots(2, 172);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		cards.map((card, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card,
			x: top[i].x,
			y: 172,
			w: top[i].w,
			h: 241
		}, i)),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left: X$1,
				top: 438,
				width: CW,
				height: 28,
				color: TITLE,
				fontSize: 24,
				fontWeight: 700,
				lineHeight: "28px"
			}),
			children: heading?.text
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepRow, {
			items: steps.items,
			y: 479,
			bottom: 649,
			arrows: false,
			titleSize: 24
		})
	] });
}
function MenuGrid({ page }) {
	const items = findAll(page.blocks, "menu");
	const xs = [
		57,
		455,
		853
	];
	const ten = items.length > 9;
	const ys = ten ? [
		158,
		286,
		414,
		542
	] : [
		172,
		335,
		499
	];
	const h = ten ? 116 : 145;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: items.map((item, i) => {
		const col = i % 3;
		const row = Math.floor(i / 3);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				...cardShell(xs[col], ys[row], 370, h),
				display: "flex",
				alignItems: "center",
				gap: ten ? 14 : 18,
				padding: ten ? "12px 16px" : "18px 20px"
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num$1, {
				n: item.n,
				size: ten ? 48 : 58,
				fontSize: ten ? 22 : 27
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					fontSize: ten ? 22 : 27,
					fontWeight: 700,
					color: TITLE,
					lineHeight: ten ? "26px" : "32px"
				},
				children: item.title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					marginTop: 4,
					fontSize: ten ? 15 : 17,
					lineHeight: 1.3,
					color: INK
				},
				children: item.body
			})] })]
		}, item.n);
	}) });
}
function plain(cell) {
	if (typeof cell === "object") return cell.text ?? "";
	return cell ?? "";
}
function Glossary({ page }) {
	const table = findAll(page.blocks, "table")[0];
	const cards = findAll(page.blocks, "card");
	const termYs = [
		221,
		287,
		352,
		417,
		483,
		548
	];
	const termHs = [
		64,
		64,
		64,
		64,
		63,
		64
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left: 59,
				top: 179,
				width: 199,
				height: 41,
				background: TITLE,
				color: "#fff",
				fontWeight: 700,
				fontSize: 16,
				lineHeight: "41px",
				textAlign: "center"
			}),
			children: "용어"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left: 260,
				top: 179,
				width: 507,
				height: 41,
				background: TITLE,
				color: "#fff",
				fontWeight: 700,
				fontSize: 16,
				lineHeight: "41px",
				textAlign: "center"
			}),
			children: "뜻"
		}),
		table.rows.map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left: 58,
				top: termYs[i],
				width: 201,
				height: termHs[i],
				background: CARD,
				borderRadius: 10,
				color: INK,
				fontSize: 16,
				fontWeight: 700,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				textAlign: "center",
				padding: "0 8px"
			}),
			children: plain(row[0])
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left: 270,
				top: termYs[i],
				width: 496,
				height: termHs[i],
				color: INK,
				fontSize: 16,
				lineHeight: "22px",
				display: "flex",
				alignItems: "center"
			}),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: plain(row[1]) })
		})] }, i)),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card: cards[0],
			x: 796,
			y: 177,
			w: 427,
			h: 236
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card: cards[1],
			x: 796,
			y: 431,
			w: 427,
			h: 213
		})
	] });
}
function Compare$1({ page }) {
	const chips = findAll(page.blocks, "chips")[0];
	const table = findAll(page.blocks, "table")[0];
	const cards = findAll(page.blocks, "card");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chips, {
			node: chips,
			y: 148
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
			table,
			x: 59,
			y: 198,
			w: 718,
			widths: [
				103,
				70,
				80,
				79,
				66,
				55,
				46,
				65,
				80,
				56
			],
			headH: 37,
			rowH: 38
		}),
		table.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left: 59,
				top: 363,
				width: 718,
				height: 20,
				fontSize: 15,
				lineHeight: "20px",
				color: SUB
			}),
			children: table.note
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card: cards[0],
			x: 806,
			y: 196,
			w: 417,
			h: 203
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card: cards[1],
			x: 57,
			y: 403,
			w: 721,
			h: 246
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card: cards[2],
			x: 806,
			y: 417,
			w: 417,
			h: 231
		})
	] });
}
function KpiRow({ items, y, h }) {
	const place = slots(4, y, y + h);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: items.map((label, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: cardShell(place[i].x, place[i].y, place[i].w, place[i].h),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: {
				fontSize: 19,
				color: SUB,
				fontWeight: 700,
				lineHeight: "24px"
			},
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: {
				marginTop: 10,
				fontSize: 37,
				fontWeight: 700,
				color: TITLE,
				lineHeight: "37px"
			},
			children: "—"
		})]
	}, label)) });
}
function Goods({ page }) {
	const chips = findAll(page.blocks, "chips")[0];
	const kpis = findAll(page.blocks, "kpis")[0];
	const table = findAll(page.blocks, "table")[0];
	const cards = findAll(page.blocks, "card");
	const place = slots(3, 421, 653);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chips, {
			node: chips,
			y: 148
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiRow, {
			items: kpis.items,
			y: 191,
			h: 107
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
			table,
			x: 59,
			y: 318,
			w: 1162,
			widths: [
				48,
				140,
				220,
				110,
				120,
				360,
				164
			]
		}),
		cards.map((card, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card,
			x: place[i].x,
			y: place[i].y,
			w: place[i].w,
			h: place[i].h
		}, card.title))
	] });
}
function Store$1({ page }) {
	const chips = findAll(page.blocks, "chips")[0];
	const kpis = findAll(page.blocks, "kpis")[0];
	const table = findAll(page.blocks, "table")[0];
	const cards = findAll(page.blocks, "card");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chips, {
			node: chips,
			y: 148
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiRow, {
			items: kpis.items,
			y: 191,
			h: 112
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
			table,
			x: 59,
			y: 327,
			w: 708,
			widths: [
				247,
				113,
				114,
				113,
				113
			],
			headH: 37
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card: cards[0],
			x: 796,
			y: 326,
			w: 427,
			h: 154
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card: cards[1],
			x: 57,
			y: 426,
			w: 711,
			h: 223
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card: cards[2],
			x: 796,
			y: 499,
			w: 427,
			h: 150
		})
	] });
}
function Location({ page }) {
	const chips = findAll(page.blocks, "chips")[0];
	const tables = findAll(page.blocks, "table");
	const note = findAll(page.blocks, "note")[0];
	const cards = findAll(page.blocks, "card");
	const badge = findAll(page.blocks, "badge")[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chips, {
			node: chips,
			y: 148
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left: X$1,
				top: 198,
				height: 32
			}),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inner, { node: badge })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
			table: tables[0],
			x: 59,
			y: 251,
			w: 343,
			widths: [
				113,
				123,
				103
			],
			headH: 30,
			rowH: 29
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
			table: tables[1],
			x: 423,
			y: 251,
			w: 344,
			widths: [
				104,
				123,
				113
			],
			headH: 30,
			rowH: 29
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left: X$1,
				top: 440,
				width: 720,
				height: 22,
				fontSize: 15,
				lineHeight: "22px",
				color: SUB
			}),
			children: note?.text
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card: cards[0],
			x: 796,
			y: 196,
			w: 427,
			h: 227
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card: cards[1],
			x: 57,
			y: 479,
			w: 711,
			h: 170
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card: cards[2],
			x: 796,
			y: 441,
			w: 427,
			h: 208
		})
	] });
}
function Archive({ page }) {
	const chips = findAll(page.blocks, "chips");
	const steps = findAll(page.blocks, "steps")[0];
	const bar = findAll(page.blocks, "bar")[0];
	const items = steps?.items ?? [];
	const places = items.length === 4 ? [
		{
			x: 57,
			w: 270
		},
		{
			x: 355,
			w: 270
		},
		{
			x: 654,
			w: 271
		},
		{
			x: 952,
			w: 271
		}
	] : slots(Math.max(items.length, 1), 263, bar ? 500 : 644).map((slot) => ({
		x: slot.x,
		w: slot.w
	}));
	const cardH = items.length === 4 ? 280 : bar ? 220 : 360;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		chips[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chips, {
			node: chips[0],
			y: 148
		}) : null,
		chips[1] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chips, {
			node: chips[1],
			y: 196
		}) : null,
		items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: cardShell(places[i].x, 263, places[i].w, cardH),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num$1, {
					n: i + 1,
					size: 52,
					fontSize: 22
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						marginTop: 18,
						fontSize: items.length > 4 ? 20 : 24,
						fontWeight: 700,
						color: TITLE,
						lineHeight: "30px"
					},
					children: item.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: bodyText,
					children: item.body
				})
			]
		}, item.title)),
		items.length === 4 ? places.slice(1).map((item, i) => {
			const prev = places[i];
			const left = prev.x + prev.w + (item.x - (prev.x + prev.w)) / 2 - 11;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
				width: "22",
				height: "26",
				viewBox: "0 0 22 26",
				"aria-hidden": true,
				style: box({
					left,
					top: 390,
					width: 22,
					height: 26
				}),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M2 1 L20 13 L2 25 Z",
					fill: TITLE
				})
			}, item.x);
		}) : null,
		bar ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: cardShell(57, 561, 1166, 87),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					fontSize: 21,
					fontWeight: 700,
					color: TITLE,
					lineHeight: "26px"
				},
				children: bar.title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: bodyText,
				children: bar.body
			})]
		}) : null
	] });
}
function ManualImage({ src, x, y, w, h, alt }) {
	const [failed, setFailed] = (0, import_react.useState)(!src);
	if (failed) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: box({
			left: x,
			top: y,
			width: w,
			height: h,
			border: "2px solid #E74C3C",
			color: "#E74C3C",
			background: "#fff",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			textAlign: "center",
			padding: 12,
			fontSize: 16,
			fontWeight: 700,
			lineHeight: 1.4
		}),
		children: [
			"그림을 불러오지 못했습니다",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
			alt
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src,
		alt,
		onError: () => setFailed(true),
		style: box({
			left: x,
			top: y,
			width: w,
			height: h,
			objectFit: "contain",
			objectPosition: "center",
			background: "#fff",
			border: `1px solid ${LINE}`
		})
	});
}
function Files({ page }) {
	const cards = findAll(page.blocks, "card");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left: 58,
				top: 154,
				height: 28,
				fontSize: 16,
				fontWeight: 700,
				color: INK,
				lineHeight: "28px"
			}),
			children: "메뉴 위치"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ManualImage, {
			src: shot_menu_default,
			x: 58,
			y: 192,
			w: 202,
			h: 450,
			alt: "메뉴 위치"
		}),
		cards[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card: cards[0],
			x: 288,
			y: 192,
			w: 326,
			h: 240
		}) : null,
		cards[1] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card: cards[1],
			x: 288,
			y: 452,
			w: 326,
			h: 192
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left: 662,
				top: 154,
				height: 28,
				fontSize: 16,
				fontWeight: 700,
				color: INK,
				lineHeight: "28px"
			}),
			children: "조회 화면"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ManualImage, {
			src: shot_query_default,
			x: 662,
			y: 192,
			w: 560,
			h: 306,
			alt: "조회 화면"
		}),
		cards[2] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card: cards[2],
			x: 662,
			y: 514,
			w: 560,
			h: 134
		}) : null
	] });
}
function Usage({ page }) {
	const chips = findAll(page.blocks, "chips");
	const cards = findAll(page.blocks, "card");
	const bar = findAll(page.blocks, "bar")[0];
	const place = slots(Math.max(cards.length, 1), 263, 476);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		chips[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chips, {
			node: chips[0],
			y: 148
		}) : null,
		chips[1] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chips, {
			node: chips[1],
			y: 196
		}) : null,
		cards.map((card, i) => place[i] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card,
			x: place[i].x,
			y: place[i].y,
			w: place[i].w,
			h: place[i].h
		}, card.title) : null),
		bar ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: cardShell(57, 499, 1166, 150),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					fontSize: 21,
					fontWeight: 700,
					color: TITLE,
					lineHeight: "26px"
				},
				children: bar.title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: bodyText,
				children: bar.body
			})]
		}) : null
	] });
}
function Tips({ page }) {
	const chips = findAll(page.blocks, "chips");
	const cards = findAll(page.blocks, "card");
	const top = slots(3, chips.length ? 248 : 172, chips.length ? 430 : 394);
	const bottom = slots(3, chips.length ? 446 : 422, 644);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [chips[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chips, {
		node: chips[0],
		y: 148
	}) : null, cards.map((card, i) => {
		const place = (i < 3 ? top : bottom)[i % 3];
		if (!place) return null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardView, {
			card,
			x: place.x,
			y: place.y,
			w: place.w,
			h: place.h
		}, card.title);
	})] });
}
function Cover({ page }) {
	const [first, second] = page.title.split("\n");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: box({
				left: 89,
				top: 186,
				width: 1e3,
				color: "#fff",
				fontSize: 59,
				fontWeight: 700,
				lineHeight: "70px"
			}),
			children: [
				first,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
				second
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left: 88,
				top: 341,
				width: 900,
				color: "#fff",
				fontSize: 27,
				fontWeight: 500,
				lineHeight: "32px"
			}),
			children: page.subtitle
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left: 86,
				top: 456,
				height: 40,
				display: "flex",
				gap: 7
			}),
			children: LINES.map((color) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dot, {
				color,
				size: 40
			}, color))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left: 88,
				top: 536,
				color: "#fff",
				fontSize: 27,
				fontWeight: 700,
				lineHeight: "32px"
			}),
			children: "엑셀 올리고 바로 보기"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: box({
				left: 88,
				top: 632,
				color: "#fff",
				fontSize: 19,
				lineHeight: "24px"
			}),
			children: "2026.11"
		})
	] });
}
function PageBody({ page, index }) {
	if (index === 1) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Intro, { page });
	if (index === 2) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Connect, { page });
	if (index === 3) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuGrid, { page });
	if (index === 4) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Glossary, { page });
	if (index === 6) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compare$1, { page });
	if (index === 9) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Standard, {
		page,
		font: 15,
		index
	});
	if (index === 10) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Goods, { page });
	if (index === 12) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store$1, { page });
	if (index === 17) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Location, { page });
	if (findAll(page.blocks, "shot").length > 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Files, { page });
	if (findAll(page.blocks, "steps").length > 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { page });
	if (findAll(page.blocks, "table").length > 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Standard, {
		page,
		index
	});
	if (findAll(page.blocks, "bar").length > 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Usage, { page });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tips, { page });
}
function ManualSheet({ page, index }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		className: "slide manual-sheet",
		"data-slide": index + 1,
		style: {
			width: W,
			height: H,
			position: "relative",
			overflow: "hidden",
			background: page.cover ? TITLE : "#fff",
			color: page.cover ? "#fff" : INK,
			fontFamily: FONT,
			WebkitPrintColorAdjust: "exact",
			printColorAdjust: "exact"
		},
		children: page.cover ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, { page }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TitleBlock, { title: page.title }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubtitleBlock, { text: page.subtitle }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageBody, {
				page,
				index
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, { index })
		] })
	});
}
function chromeButton(disabled = false) {
	return {
		height: 40,
		padding: "0 16px",
		borderRadius: 999,
		border: "0",
		background: "#fff",
		color: TITLE,
		fontWeight: 700,
		fontSize: 14,
		fontFamily: FONT,
		opacity: disabled ? .38 : 1
	};
}
function ManualViewer({ onClose }) {
	const pages = MANUAL_PAGES;
	const [index, setIndex] = (0, import_react.useState)(0);
	const stageRef = (0, import_react.useRef)(null);
	const [scale, setScale] = (0, import_react.useState)(1);
	const touch = (0, import_react.useRef)(null);
	const total = pages.length;
	const page = pages[index] ?? pages[0];
	(0, import_react.useLayoutEffect)(() => {
		const el = stageRef.current;
		if (!el) return;
		const fit = () => {
			const w = el.clientWidth;
			const h = el.clientHeight;
			setScale(Math.max(.05, Math.min(w / W, h / H)));
		};
		fit();
		const observer = new ResizeObserver(fit);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);
	(0, import_react.useEffect)(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		function onKey(event) {
			if (event.key === "ArrowRight") {
				event.preventDefault();
				setIndex((n) => Math.min(total - 1, n + 1));
			} else if (event.key === "ArrowLeft") {
				event.preventDefault();
				setIndex((n) => Math.max(0, n - 1));
			} else if (event.key === "Escape") {
				event.preventDefault();
				onClose();
			}
		}
		window.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = prev;
			window.removeEventListener("keydown", onKey);
		};
	}, [onClose, total]);
	function go(next) {
		setIndex(Math.max(0, Math.min(total - 1, next)));
	}
	function onTouchStart(event) {
		if (event.target.closest("button, a")) return;
		const point = event.changedTouches[0];
		touch.current = {
			x: point.clientX,
			y: point.clientY
		};
	}
	function onTouchEnd(event) {
		const start = touch.current;
		touch.current = null;
		if (!start) return;
		const point = event.changedTouches[0];
		const dx = point.clientX - start.x;
		const dy = point.clientY - start.y;
		if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
		go(index + (dx < 0 ? 1 : -1));
	}
	function download() {
		const previous = document.title;
		document.body.classList.add("manual-export");
		document.title = "센터 생산성 프로그램 사용 매뉴얼";
		const style = document.createElement("style");
		style.id = "manual-page-css";
		style.textContent = "@page { size: 1280px 720px; margin: 0; } .slide { break-after: page; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }";
		document.head.appendChild(style);
		const finish = () => {
			document.body.classList.remove("manual-export");
			document.title = previous;
			style.remove();
		};
		window.addEventListener("afterprint", finish, { once: true });
		window.setTimeout(() => window.print(), 50);
	}
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		role: "dialog",
		"aria-modal": "true",
		"aria-label": "센터 생산성 사용 메뉴얼",
		className: "manual-overlay",
		onTouchStart,
		onTouchEnd,
		style: {
			position: "fixed",
			inset: 0,
			zIndex: 80,
			background: "#10202c",
			display: "flex",
			flexDirection: "column",
			fontFamily: FONT
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					justifyContent: "flex-end",
					gap: 8,
					padding: "10px 12px 0"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					style: chromeButton(),
					onClick: download,
					"aria-label": "가로 16:9 PDF로 내보내기",
					children: "다운로드"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					style: chromeButton(),
					onClick: onClose,
					children: "닫기"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: stageRef,
				style: {
					flex: 1,
					minHeight: 0,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: "8px 12px"
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						width: W * scale,
						height: H * scale,
						position: "relative"
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							width: W,
							height: H,
							transform: `scale(${scale})`,
							transformOrigin: "top left"
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ManualSheet, {
							page,
							index,
							total
						})
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: 12,
					padding: "4px 12px 14px"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						style: chromeButton(index === 0),
						disabled: index === 0,
						onClick: () => go(index - 1),
						children: "이전"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						style: {
							color: "#fff",
							fontWeight: 700,
							fontSize: 16,
							minWidth: 72,
							textAlign: "center"
						},
						children: [
							index + 1,
							" / ",
							total
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						style: chromeButton(index === total - 1),
						disabled: index === total - 1,
						onClick: () => go(index + 1),
						children: "다음"
					})
				]
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "manual-print-root",
		"aria-hidden": true,
		children: pages.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "manual-print-page",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ManualSheet, {
				page: item,
				index: i,
				total
			})
		}, item.title + i))
	})] }), document.body);
}
var BUILD_LABEL = "261113_2238";
var SE = [
	`1차상품`,
	`FF1편`,
	`FF2편`,
	`냉동`,
	`냉장`,
	`유제`
];
var CE = [
	`1센터`,
	`냉동`,
	`2센터`,
	`3센터`
];
var wE = [
	`일`,
	`월`,
	`화`,
	`수`,
	`목`,
	`금`,
	`토`
];
var TE = {
	"020": {
		name: `FF1편`,
		master: `FF1편`
	},
	"022": {
		name: `FF2편(월~토)`,
		master: `FF2편`
	},
	"024": {
		name: `FF1편(주문전용)`,
		master: `FF1편`
	},
	"025": {
		name: `FF단편`,
		master: `FF1편`
	},
	"026": {
		name: `FF1편(편외)`,
		master: `FF1편`
	},
	"030": {
		name: `FF2편`,
		master: `FF2편`
	},
	"032": {
		name: `FF1편(월~토)`,
		master: `FF1편`
	},
	"034": {
		name: `FF2편(주문전용)`,
		master: `FF2편`
	},
	"040": {
		name: `빵`,
		master: `FF2편`
	},
	"060": {
		name: `유제품`,
		master: `유제`
	},
	"061": {
		name: `유제(월~토)`,
		master: `유제`
	},
	"070": {
		name: `냉장`,
		master: `냉장`
	},
	"071": {
		name: `신선(일~월D2)`,
		master: `냉장`
	},
	"080": {
		name: `냉동`,
		master: `냉동`
	},
	"081": {
		name: `냉동D2(월~금)`,
		master: `냉동`
	},
	"082": {
		name: `냉동(카운터FF)`,
		master: `냉동`
	},
	"090": {
		name: `빙과`,
		master: `냉동`
	},
	"092": {
		name: `빙과(월~토)`,
		master: `냉동`
	},
	111: {
		name: `FF1편(D+2)`,
		master: `FF1편`
	},
	170: {
		name: `냉장(월수금)`,
		master: `냉장`
	},
	180: {
		name: `빙과(화목토)`,
		master: `냉동`
	},
	190: {
		name: `1차상품`,
		master: `1차상품`
	},
	191: {
		name: `1차상품(월수금)`,
		master: `1차상품`
	},
	192: {
		name: `1차상품+대형`,
		master: `1차상품`
	},
	193: {
		name: `1차식품(일~금D2)`,
		master: `1차상품`
	},
	194: {
		name: `1차식품(월~금D2)`,
		master: `1차상품`
	},
	195: {
		name: `1차식품(월금D2)`,
		master: `1차상품`
	},
	270: {
		name: `냉장D2`,
		master: `냉장`
	},
	290: {
		name: `1차상품D3`,
		master: `1차상품`
	},
	370: {
		name: `냉장(월~토)`,
		master: `냉장`
	},
	670: {
		name: `냉장(월~토D1)`,
		master: `냉장`
	},
	770: {
		name: `냉장(화목)`,
		master: `냉장`
	},
	870: {
		name: `냉장(일부D1)`,
		master: `냉장`
	},
	970: {
		name: `냉장(일부D1)2`,
		master: `냉장`
	}
};
var EE = new Intl.NumberFormat(`ko-KR`);
function DE(e) {
	return (e < 0 ? `-` : ``) + EE.format(Math.abs(Math.round(e)));
}
function OE(e) {
	let t = e < 0 ? `-` : ``, n = Math.abs(e);
	return n >= 1e8 ? `${t}${(n / 1e8).toFixed(n >= 1e10 ? 1 : 2)}억` : n >= 1e4 ? `${t}${EE.format(Math.round(n / 1e4))}만` : DE(e);
}
function kE(e, t, n) {
	if (!n) return `none`;
	let r = t / n;
	return e === `miss` ? r < .02 ? `none` : r >= .05 ? `bad` : `warn` : r < .005 ? `none` : r >= .01 ? `bad` : `warn`;
}
function AE(e, t, n = 2) {
	return t ? `${(e / t * 100).toFixed(n)}%` : `—`;
}
function jE(e) {
	let [t, n] = e.split(`-`);
	return !t || !n ? e : `${t}년 ${Number(n)}월`;
}
function ME(e) {
	return LE()[e]?.master ?? `미분류`;
}
var NE = `center-codebook-extra`;
var PE = {};
var FE = /* @__PURE__ */ new Set();
function IE() {
	const t = readPanel().codes;
	if (t && typeof t == `object`) {
		PE = t;
		return;
	}
	try {
		let e = localStorage.getItem(NE), n = e ? JSON.parse(e) : {};
		PE = n && typeof n == `object` ? n : {};
	} catch {
		PE = {};
	}
}
IE();
onSharedPanel((e) => {
	if (!e || !e.codes || typeof e.codes != `object`) return;
	if (JSON.stringify(PE) === JSON.stringify(e.codes)) return;
	PE = e.codes;
	try {
		localStorage.setItem(NE, JSON.stringify(PE));
	} catch {}
	FE.forEach((t) => t());
});
function LE() {
	return {
		...TE,
		...PE
	};
}
function RE(e) {
	return FE.add(e), () => FE.delete(e);
}
function zE(e, t, n) {
	let r = e.replace(/\D/g, ``), i = t.trim();
	if (!r || !i || !n) return `코드, 이름, 상품군을 넣어 주세요.`;
	if (LE()[r]) return `이미 있는 코드입니다.`;
	PE = {
		...PE,
		[r]: {
			name: i,
			master: n
		}
	};
	try {
		localStorage.setItem(NE, JSON.stringify(PE));
	} catch {}
	try {
		writePanel({ codes: PE });
	} catch {}
	return FE.forEach((e) => e()), ``;
}
function BE() {
	return Object.entries(LE()).map(([e, t]) => ({
		code: e,
		name: t.name,
		master: t.master
	})).sort((e, t) => e.code.localeCompare(t.code));
}
function VE(e, t) {
	let n = SE.indexOf(e), r = SE.indexOf(t);
	return n === -1 && r === -1 ? e.localeCompare(t, `ko`) : n === -1 ? 1 : r === -1 ? -1 : n - r;
}
function HE(e, t) {
	let n = CE.indexOf(e), r = CE.indexOf(t);
	return n === -1 && r === -1 ? e.localeCompare(t, `ko`) : n === -1 ? 1 : r === -1 ? -1 : n - r;
}
function UE() {
	return {
		order: 0,
		ship: 0,
		miss: 0,
		wrong: 0,
		count: 0
	};
}
function WE(e, t) {
	e.order += t.order, e.ship += t.ship, e.miss += t.miss, e.wrong += t.wrong, e.count += 1;
}
function GE(e) {
	let [t, n, r] = e.split(`-`).map(Number);
	return new Date(Date.UTC(t, (n ?? 1) - 1, r ?? 1));
}
function KE(e) {
	return `${e.getUTCFullYear()}-${String(e.getUTCMonth() + 1).padStart(2, `0`)}-${String(e.getUTCDate()).padStart(2, `0`)}`;
}
function qE(e) {
	let t = GE(e), n = t.getUTCDate(), r = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1)).getUTCDay();
	if (r === 0) return Math.floor((n - 1) / 7) + 1;
	let i = 7 - r;
	return n <= i ? 1 : 1 + Math.ceil((n - i) / 7);
}
function JE(e) {
	return String(e ?? ``).replace(/\s+/g, ``).replace(/^합계[:：]/, ``);
}
function YE(e) {
	let t = Math.min(e.length, 25);
	for (let n = 0; n < t; n++) if ((e[n] ?? []).map(JE).some((e) => e.includes(`배송상품군코드`) || e === `수주금액`)) return n;
	return -1;
}
function XE(e, t) {
	let n = e.map(JE);
	for (let e of t) {
		let t = n.findIndex((t) => t === e || t.endsWith(e));
		if (t >= 0) return t;
	}
	return -1;
}
function ZE(e) {
	if (typeof e == `number` && Number.isFinite(e)) return String(Math.trunc(e)).padStart(3, `0`);
	if (typeof e != `string` && typeof e != `number`) return null;
	let t = String(e).trim();
	return !t || t === `소계` || t === `합계` ? null : /^\d+(\.0+)?$/.test(t) ? String(Math.trunc(Number(t))).padStart(3, `0`) : null;
}
function QE(e) {
	if (typeof e == `number` && Number.isFinite(e)) return e;
	if (typeof e == `string`) {
		let t = e.replace(/,/g, ``).replace(/%/g, ``).trim();
		if (!t) return null;
		let n = Number(t);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}
function $E(e) {
	if (e instanceof Date && !Number.isNaN(e.getTime())) return `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, `0`)}-${String(e.getDate()).padStart(2, `0`)}`;
	if (typeof e == `number` && Number.isFinite(e)) {
		if (e < 2e4 || e > 8e4) return null;
		let t = new Date(Date.UTC(1899, 11, 30) + Math.round(e) * 864e5);
		return Number.isNaN(t.getTime()) ? null : t.toISOString().slice(0, 10);
	}
	if (typeof e == `string`) {
		let t = e.trim(), n = t.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})/);
		if (n) return `${n[1]}-${n[2].padStart(2, `0`)}-${n[3].padStart(2, `0`)}`;
		let r = t.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
		if (r) return `${r[1]}-${r[2].padStart(2, `0`)}-${r[3].padStart(2, `0`)}`;
	}
	return null;
}
function eD(e) {
	let t = XE(e, [`미출금액`]) >= 0, n = XE(e, [`오출금액`]) >= 0;
	return t && n ? `both` : t ? `miss` : n ? `wrong` : null;
}
function tD(e, t, n) {
	let r = YE(e);
	if (r < 0) return [];
	let i = e[r] ?? [], a = XE(i, [`출고일자`]), o = XE(i, [`배송상품군코드`]), s = XE(i, [`배송상품군명`]), c = XE(i, [`수주금액`]), l = XE(i, [`출고금액`]), u = XE(i, [`미출금액`]), d = XE(i, [`오출금액`]), f = XE(i, [`센터`]);
	if (a < 0 || o < 0) return [];
	let p = [];
	for (let i = r + 1; i < e.length; i++) {
		let r = e[i] ?? [], m = $E(r[a]), h = ZE(r[o]);
		if (!m || !h) continue;
		let g = f >= 0 ? String(r[f] ?? ``).trim() : ``, _ = s >= 0 ? String(r[s] ?? ``).trim() : ``;
		p.push({
			center: g || t,
			date: m,
			code: h,
			name: _ || LE()[h]?.name || h,
			order: c >= 0 ? QE(r[c]) : null,
			ship: l >= 0 ? QE(r[l]) : null,
			miss: u >= 0 ? QE(r[u]) : null,
			wrong: d >= 0 ? QE(r[d]) : null,
			source: n
		});
	}
	return p;
}
function nD(e) {
	let t = /* @__PURE__ */ new Map(), n = 0, r = /* @__PURE__ */ new Set();
	for (let i of e) {
		if (!i.center) continue;
		let e = `${i.center}|${i.date}|${i.code}`, a = t.get(e);
		a || (a = {
			...i,
			order: 0,
			ship: 0,
			miss: 0,
			wrong: 0,
			fromMiss: !1,
			sawMiss: !1,
			sawWrong: !1
		}, t.set(e, a));
		let o = i.source === `miss` || i.source === `both`, s = i.source === `wrong` || i.source === `both`;
		o && (a.sawMiss = !0, i.order != null && (a.fromMiss && a.order !== i.order && (n += 1), a.order = i.order, a.ship = i.ship ?? a.ship, a.fromMiss = !0), i.miss != null && (a.miss = i.miss), i.name && (a.name = i.name)), s && (a.sawWrong = !0, i.wrong != null && (a.wrong = i.wrong), !a.fromMiss && i.order != null && (a.order = i.order, a.ship = i.ship ?? a.ship), !a.name && i.name && (a.name = i.name)), LE()[i.code] || r.add(i.code);
	}
	let i = [], a = 0, o = 0;
	for (let e of t.values()) e.sawMiss && !e.sawWrong && (a += 1), e.sawWrong && !e.sawMiss && (o += 1);
	n && i.push(`미출·오출 파일의 수주금액이 다른 행이 ${n.toLocaleString(`ko-KR`)}건 있습니다. 수주·출고는 미출 파일을 기준으로 했습니다.`), a && i.push(`오출 파일이 없는 행이 ${a.toLocaleString(`ko-KR`)}건 있습니다. 오출금액은 0으로 두었습니다.`), o && i.push(`미출 파일이 없는 행이 ${o.toLocaleString(`ko-KR`)}건 있습니다. 수주·출고는 오출 파일을 사용했습니다.`), r.size && i.push(`마스터에 없는 상품군 코드 ${[...r].sort().join(`, `)} 는 '미분류'로 묶었습니다.`);
	let s = [...t.values()].map((e) => ({
		week: qE(e.date),
		dow: wE[GE(e.date).getUTCDay()] ?? ``,
		master: ME(e.code),
		center: e.center,
		date: e.date,
		code: e.code,
		name: e.name,
		order: e.order ?? 0,
		ship: e.ship ?? 0,
		miss: e.miss ?? 0,
		wrong: e.wrong ?? 0
	}));
	return s.sort((e, t) => e.date.localeCompare(t.date) || e.center.localeCompare(t.center, `ko`) || e.code.localeCompare(t.code)), {
		rows: rD(s),
		warnings: i
	};
}
function rD(e) {
	return e.map((e) => e.master === `냉동` && e.center !== `냉동` ? {
		...e,
		center: `냉동`
	} : e);
}
function iD(e) {
	let t = e.normalize(`NFC`).match(/([1-3])\s*센터/);
	return t ? `${t[1]}센터` : null;
}
function aD(e) {
	let t = e.normalize(`NFC`);
	return t.includes(`오출`) ? `wrong` : t.includes(`미출`) ? `miss` : null;
}
async function oD(e) {
	let t = await import("../_libs/xlsx.mjs").then((n) => n.t), n = t.read(await e.arrayBuffer(), { type: `array` }), r = [], i = [], a = [];
	for (let e of n.SheetNames) {
		let o = t.utils.sheet_to_json(n.Sheets[e], {
			header: 1,
			defval: null,
			raw: !0
		}), s = YE(o);
		if (s < 0) continue;
		let c = o[s] ?? [];
		if (XE(c, [`센터`]) >= 0 && XE(c, [`배송상품군코드`]) >= 0 && eD(c) === `both`) {
			let e = nD(tD(o, ``, `both`).filter((e) => e.center));
			r.push(...e.rows), i.push(...e.warnings);
		} else eD(c) && XE(c, [`배송상품군코드`]) >= 0 && a.push(o);
	}
	if (r.length) return {
		kind: `combined`,
		filename: e.name,
		rows: r,
		warnings: [...new Set(i)]
	};
	if (!a.length) return {
		kind: `unknown`,
		filename: e.name
	};
	let o = a[0].slice();
	for (let e of a.slice(1)) {
		let t = YE(e);
		o.push(...e.slice(t + 1));
	}
	let s = eD(o[YE(o)] ?? []), c = aD(e.name), l = s === `both` ? `both` : c === `wrong` || c == null && s === `wrong` ? `wrong` : `miss`, u = iD(e.name), d = tD(o, u ?? `임시`, l).length;
	return {
		kind: `center`,
		draft: {
			filename: e.name,
			center: u,
			role: l,
			matrix: o,
			detailCount: d
		}
	};
}
async function sD(e) {
	let t = e.filter((e) => /\.xls/i.test(e.name));
	if (!t.length) return {
		kind: `error`,
		message: `xlsx 또는 xls 파일만 읽을 수 있습니다.`
	};
	try {
		let e = await Promise.all(t.map((e) => oD(e))), n = e.filter((e) => e.kind === `combined`), r = e.filter((e) => e.kind === `center`), i = e.filter((e) => e.kind === `unknown`).map((e) => e.filename);
		if (n.length && r.length === 0) {
			let e = [...new Set(n.flatMap((e) => e.warnings))];
			for (let t of i) e.push(`${t}은 출고 파일로 읽지 못했습니다.`);
			return {
				kind: `combined`,
				rows: n.flatMap((e) => e.rows),
				warnings: e,
				filename: n.length === 1 ? n[0].filename : `${n.length}개 파일`
			};
		}
		return r.length ? {
			kind: `assign`,
			drafts: r.map((e) => e.draft),
			unknown: i,
			note: n.length ? `통합 원장과 센터 파일이 함께 있습니다. 센터 파일을 기준으로 합칩니다.` : null
		} : {
			kind: `error`,
			message: `출고일자와 배송상품군코드를 찾지 못했습니다.`
		};
	} catch {
		return {
			kind: `error`,
			message: `엑셀을 읽지 못했습니다. 파일이 열려 있지 않은지 확인해 주세요.`
		};
	}
}
function cD(e) {
	let t = [];
	for (let n of e) n.center && n.role && t.push(...tD(n.matrix, n.center, n.role));
	let n = nD(t), r = /* @__PURE__ */ new Map();
	for (let t of e) {
		if (!t.center || !t.role) continue;
		let e = r.get(t.center) ?? /* @__PURE__ */ new Set();
		e.add(t.role), r.set(t.center, e);
	}
	for (let e of r.keys()) {
		let t = r.get(e) ?? /* @__PURE__ */ new Set();
		[...t].some((e) => e === `miss` || e === `both`) || n.warnings.push(`${e} 미출 파일이 없습니다.`), [...t].some((e) => e === `wrong` || e === `both`) || n.warnings.push(`${e} 오출 파일이 없습니다.`);
	}
	return n;
}
function lD(e, t = []) {
	let n = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = t.date.slice(0, 7), r = n.get(e) ?? [];
		r.push(t), n.set(e, r);
	}
	return [...n.entries()].sort((e, t) => e[0].localeCompare(t[0])).map(([e, n]) => ({
		key: e,
		rows: n,
		warnings: t
	}));
}
function uD(e, t) {
	return e.filter((e) => !(t.centers.includes(`\0`) || t.centers.length && !t.centers.includes(e.center) || t.masters.includes(`\0`) || t.masters.length && !t.masters.includes(e.master) || t.weeks.includes(-1) || t.weeks.length && !t.weeks.includes(e.week)));
}
function dD(e) {
	return [...new Set(e.map((e) => e.center))].sort(HE);
}
function fD(e) {
	return [...new Set(e.map((e) => e.master))].sort(VE);
}
function pD(e) {
	return [...new Set(e.map((e) => e.week))].sort((e, t) => e - t);
}
function mD(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = t.get(n.center) ?? /* @__PURE__ */ new Map(), r = e.get(n.master) ?? UE();
		WE(r, n), e.set(n.master, r), t.set(n.center, e);
	}
	let n = [...t.entries()].sort((e, t) => HE(e[0], t[0])).map(([e, t]) => {
		let n = UE();
		return {
			center: e,
			total: n,
			groups: [...t.entries()].sort((e, t) => VE(e[0], t[0])).map(([e, t]) => (n.order += t.order, n.ship += t.ship, n.miss += t.miss, n.wrong += t.wrong, n.count += t.count, {
				master: e,
				bucket: t
			}))
		};
	}), r = UE();
	for (let e of n) r.order += e.total.order, r.ship += e.total.ship, r.miss += e.total.miss, r.wrong += e.total.wrong, r.count += e.total.count;
	return {
		centers: n,
		grand: r
	};
}
function hD(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = t.get(n.week) ?? {
			bucket: UE(),
			from: n.date,
			to: n.date
		};
		WE(e.bucket, n), n.date < e.from && (e.from = n.date), n.date > e.to && (e.to = n.date), t.set(n.week, e);
	}
	let n = [...t.entries()].sort((e, t) => e[0] - t[0]).map(([e, t]) => ({
		week: e,
		...t
	})), r = UE();
	for (let e of n) r.order += e.bucket.order, r.ship += e.bucket.ship, r.miss += e.bucket.miss, r.wrong += e.bucket.wrong;
	return {
		weeks: n,
		grand: r
	};
}
function gD(e) {
	return [
		e.centers.includes(`\0`) ? `센터 없음` : e.centers.length ? `센터 ${e.centers.join(`, `)}` : `센터 전체`,
		e.masters.includes(`\0`) ? `상품군 없음` : e.masters.length ? `상품군 ${e.masters.join(`, `)}` : `상품군 전체`,
		e.weeks.includes(-1) ? `주차 없음` : e.weeks.length ? e.weeks.map((e) => `${e}주차`).join(`, `) : `주차 전체`
	].join(` · `);
}
function _D(e) {
	return [
		e.order,
		e.ship,
		e.miss,
		AE(e.miss, e.order),
		e.wrong,
		AE(e.wrong, e.order)
	];
}
function vD(e, t) {
	let n = mD(e), r = hD(e), i = [
		`행 레이블`,
		`수주금액`,
		`출고금액`,
		`미출금액`,
		`미출율`,
		`오출금액`,
		`오출율`
	], a = [
		[t],
		[],
		i
	];
	for (let e of n.centers) {
		a.push([e.center, ..._D(e.total)]);
		for (let t of e.groups) a.push([`  ${t.master}`, ..._D(t.bucket)]);
	}
	a.push([`총합계`, ..._D(n.grand)], [], i);
	for (let e of r.weeks) a.push([`${e.week}주차`, ..._D(e.bucket)]);
	return a.push([`총합계`, ..._D(r.grand)]), a;
}
function yD(e) {
	return [[
		`주차`,
		`요일`,
		`상품군`,
		`센터`,
		`출고일자`,
		`배송상품군코드`,
		`수주금액`,
		`출고금액`,
		`미출금액`,
		`오출금액`
	], ...e.map((e) => [
		`${e.week}주차`,
		e.dow,
		e.master,
		e.center,
		e.date,
		e.code,
		e.order,
		e.ship,
		e.miss,
		e.wrong
	])];
}
async function bD(e, t) {
	let n = await import("../_libs/xlsx.mjs").then((n) => n.t), r = n.utils.book_new(), i = [[`배송상품군코드`, `상품군`], ...BE().map((e) => [e.code, e.master])];
	if (e.length <= 1) {
		let t = e[0]?.rows ?? [], a = e[0]?.title || gD({
			centers: [],
			masters: [],
			weeks: []
		});
		n.utils.book_append_sheet(r, n.utils.aoa_to_sheet(vD(t, a)), `피벗`), n.utils.book_append_sheet(r, n.utils.aoa_to_sheet(yD(t)), `data`), n.utils.book_append_sheet(r, n.utils.aoa_to_sheet(i), `master`);
	} else {
		let t = /* @__PURE__ */ new Set();
		for (let i of e) {
			let e = (i.title || `원장`).slice(0, 31);
			for (; t.has(e);) e = `${e.slice(0, 28)} ${t.size + 1}`;
			t.add(e), n.utils.book_append_sheet(r, n.utils.aoa_to_sheet(vD(i.rows, `${i.title} · 올린 파일 전체`)), e);
		}
		let a = e.flatMap((e) => e.rows);
		n.utils.book_append_sheet(r, n.utils.aoa_to_sheet(yD(a)), `data`), n.utils.book_append_sheet(r, n.utils.aoa_to_sheet(i), `master`);
	}
	let a = window.chrome?.webview;
	if (window.__COMPANY_PC__ && a) {
		let e = n.write(r, {
			bookType: `xlsx`,
			type: `base64`
		});
		a.postMessage(JSON.stringify({
			type: `save-xlsx`,
			name: t,
			b64: e
		}));
	} else n.writeFile(r, t);
}
function xD(e) {
	let t = GE(e);
	t.setUTCDate(t.getUTCDate() - t.getUTCDay());
	let n = KE(t), r = new Date(t);
	r.setUTCDate(r.getUTCDate() + 6);
	let i = Number(n.slice(8, 10));
	return {
		month: n.slice(0, 7),
		week: Math.floor((i - 1) / 7) + 1,
		sunday: n,
		saturday: KE(r)
	};
}
function SD(e, t) {
	let [, n, r] = e.split(`-`).map(Number), [, i, a] = t.split(`-`).map(Number);
	return n === i ? `${n}/${r}~${a}` : `${n}/${r}~${i}/${a}`;
}
function CD(e) {
	let [t, n] = e.split(`-`).map(Number);
	return !t || !n ? 0 : new Date(Date.UTC(t, n, 0)).getUTCDate();
}
function wD(e) {
	if (e == null || !Number.isFinite(e)) return `—`;
	let t = e * 100;
	return `${t > 0 ? `+` : ``}${t.toFixed(1)}%`;
}
var TD = [
	`#007aff`,
	`#ff9500`,
	`#ff3b30`
];
function ED(e, t = [
	`1센터`,
	`냉동`,
	`2센터`,
	`3센터`
]) {
	if (e === `냉동`) return `#32ade6`;
	let n = t.filter((e) => e !== `냉동`).indexOf(e);
	return TD[(n < 0 ? 0 : n) % TD.length] ?? TD[0];
}
function DD(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		if (!n.date) continue;
		let e = xD(n.date), r = `${e.month}|${e.week}`, i = t.get(r);
		i || (i = {
			month: e.month,
			week: e.week,
			sunday: e.sunday,
			saturday: e.saturday,
			centers: /* @__PURE__ */ new Map(),
			days: /* @__PURE__ */ new Map()
		}, t.set(r, i));
		let a = i.centers.get(n.center) ?? UE();
		WE(a, n), i.centers.set(n.center, a);
		let o = i.days.get(n.date) ?? {};
		o[n.center] = (o[n.center] ?? 0) + n.miss, i.days.set(n.date, o);
	}
	return [...t.values()].sort((e, t) => e.month.localeCompare(t.month) || e.week - t.week).map((e) => ({
		month: e.month,
		week: e.week,
		sunday: e.sunday,
		saturday: e.saturday,
		centers: [...e.centers.entries()].map(([e, t]) => ({
			center: e,
			bucket: t
		})),
		days: [...e.days.entries()].sort((e, t) => e[0].localeCompare(t[0])).map(([e, t]) => ({
			date: e,
			miss: t
		}))
	}));
}
function OD(e, t) {
	return e.map((e) => {
		let n = {};
		for (let r of e.centers) n[r.center] = t(r.bucket);
		return {
			label: `${e.week}주`,
			sub: SD(e.sunday, e.saturday),
			values: n
		};
	});
}
function kD(e, t) {
	let n = [...new Set(e.map((e) => e.date.slice(0, 7)))].filter(Boolean).sort(), r = n.some((e) => e.slice(0, 4) !== n[0]?.slice(0, 4)), i = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = `${t.date.slice(0, 7)}|${t.center}`, n = i.get(e) ?? UE();
		WE(n, t), i.set(e, n);
	}
	return n.map((n) => {
		let a = {};
		for (let r of dD(e)) a[r] = t(i.get(`${n}|${r}`) ?? UE());
		return {
			label: r ? jE(n) : `${Number(n.slice(5))}월`,
			values: a
		};
	});
}
var AD = [
	`1차상품`,
	`FF1`,
	`FF2`,
	`냉동`,
	`냉장`,
	`유제`
];
var jD = [
	`신오산`,
	`1센터`,
	`2센터`,
	`3센터`
];
function MD(e) {
	return e === `FF1편` ? `FF1` : e === `FF2편` ? `FF2` : AD.includes(e) ? e : `미분류`;
}
function ND(e) {
	return e === `냉동` ? `1센터` : e;
}
function PD(e, t) {
	return t ? (e - t) / t : null;
}
function FD(e, t, n, r, i) {
	let a = [...AD, `미분류`], o = [], s = (e) => a.reduce((n, i) => n + t(e, r, i), 0);
	for (let i of a) {
		let a = e.map((e) => {
			let a = t(e.id, r, i), o = n(e.id);
			return {
				ship: a,
				change: PD(a, o ? t(o, r, i) : 0)
			};
		});
		a.some((e) => e.ship) && o.push({
			label: i,
			cells: a
		});
	}
	return o.push({
		label: `합계`,
		cells: e.map((e) => {
			let t = s(e.id), r = n(e.id);
			return {
				ship: t,
				change: PD(t, r ? s(r) : 0)
			};
		})
	}), o.push({
		label: `평균`,
		cells: e.map((e) => {
			let t = s(e.id) / Math.max(1, i(e.id)), r = n(e.id);
			return {
				ship: t,
				change: PD(t, r ? s(r) / Math.max(1, i(r)) : 0)
			};
		})
	}), o;
}
function ID(e, t, n) {
	let r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
	for (let t of e) {
		if (!t.date) continue;
		let e = xD(t.date), n = `${e.month}|${e.week}`;
		i.has(n) || i.set(n, e);
		let a = MD(t.master), o = (e) => {
			let i = `${n}|${e}|${a}`;
			r.set(i, (r.get(i) ?? 0) + t.ship);
		};
		o(`신오산`);
		let s = ND(t.center);
		(s === `1센터` || s === `2센터` || s === `3센터`) && o(s);
	}
	let a = [...i.entries()].sort((e, t) => e[1].sunday.localeCompare(t[1].sunday)), o = /* @__PURE__ */ new Map();
	a.forEach(([e, t], n) => {
		let r = a.slice(0, n).filter((e) => e[1].month === t.month);
		if (r.length) o.set(e, r[r.length - 1][0]);
		else {
			let r = a.slice(0, n).filter((e) => e[1].month < t.month);
			o.set(e, r.length ? r[r.length - 1][0] : null);
		}
	});
	let s = [...new Set(a.map((e) => e[1].month))].sort(), c = t.includes(`\0`) ? [] : t.length ? s.filter((e) => t.includes(e)) : s, l = (e, t, n) => r.get(`${e}|${t}|${n}`) ?? 0;
	return c.map((e) => {
		let t = a.filter((t) => t[1].month === e);
		n.includes(-1) ? t = [] : n.length && (t = t.filter((e) => n.includes(e[1].week)));
		let r = t.map(([e, t]) => ({
			id: e,
			key: e,
			title: `${t.week}주차`,
			sub: SD(t.sunday, t.saturday),
			even: t.week % 2 == 0
		})), i = jD.map((e) => ({
			center: e,
			lines: FD(r, l, (e) => o.get(e) ?? null, e, () => 7)
		}));
		return {
			key: e,
			title: jE(e),
			spans: r,
			centers: i
		};
	}).filter((e) => e.spans.length);
}
function LD(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let t of e) {
		if (!t.date) continue;
		let e = t.date.slice(0, 7), r = MD(t.master), i = (i) => {
			let a = `${e}|${i}|${r}`;
			n.set(a, (n.get(a) ?? 0) + t.ship);
		};
		i(`신오산`);
		let a = ND(t.center);
		(a === `1센터` || a === `2센터` || a === `3센터`) && i(a);
	}
	let r = [...new Set(e.map((e) => e.date.slice(0, 7)).filter(Boolean))].sort(), i = t.includes(`\0`) ? [] : t.length ? r.filter((e) => t.includes(e)) : r, a = /* @__PURE__ */ new Map();
	r.forEach((e, t) => a.set(e, r[t - 1] ?? null));
	let o = i.map((e) => ({
		id: e,
		key: e,
		title: jE(e),
		sub: ``,
		even: Number(e.slice(5)) % 2 == 0
	})), s = (e, t, r) => n.get(`${e}|${t}|${r}`) ?? 0;
	return {
		key: `months`,
		title: `출고-월`,
		spans: o,
		centers: jD.map((e) => ({
			center: e,
			lines: FD(o, s, (e) => a.get(e) ?? null, e, (e) => CD(e))
		}))
	};
}
var STORE = "osan-chulgo-ledger-v1";
var TABS = [
	"요약",
	"피벗",
	"추이",
	"출고정리"
];
var EMPTY = {
	centers: [],
	masters: [],
	weeks: []
};
function b64ToArrayBuffer$2(b64) {
	const binary = atob(b64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes.buffer;
}
function loadStore() {
	try {
		const raw = localStorage.getItem(STORE);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed.books) || parsed.books.length === 0) return null;
		return {
			books: parsed.books,
			active: parsed.active || parsed.books[parsed.books.length - 1].key
		};
	} catch {
		return null;
	}
}
function rateClass(kind, part, whole) {
	const tone = kE(kind, part, whole);
	if (tone === "none") return "text-[#8e8e93]";
	if (kind === "miss") return tone === "bad" ? "rounded bg-[#fff4e5] px-1.5 py-0.5 font-semibold text-[#ff9500]" : "font-medium text-[#ff9500]";
	return tone === "bad" ? "rounded bg-[#ffeceb] px-1.5 py-0.5 font-semibold text-[#ff3b30]" : "font-medium text-[#ff3b30]";
}
function Money({ bucket, strong = false }) {
	const ink = strong ? "font-semibold" : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: `px-2 py-1.5 text-right tabular-nums whitespace-nowrap ${ink}`,
			children: DE(bucket.order)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: `px-2 py-1.5 text-right tabular-nums whitespace-nowrap ${ink}`,
			children: DE(bucket.ship)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: `px-2 py-1.5 text-right tabular-nums whitespace-nowrap ${ink}`,
			children: DE(bucket.miss)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "px-2 py-1.5 text-right tabular-nums whitespace-nowrap",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: rateClass("miss", bucket.miss, bucket.order),
				children: AE(bucket.miss, bucket.order)
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: `px-2 py-1.5 text-right tabular-nums whitespace-nowrap ${ink}`,
			children: DE(bucket.wrong)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "px-2 py-1.5 text-right tabular-nums whitespace-nowrap",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: rateClass("wrong", bucket.wrong, bucket.order),
				children: AE(bucket.wrong, bucket.order)
			})
		})
	] });
}
function Heads() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: [
		"수주금액",
		"출고금액",
		"미출금액",
		"미출율",
		"오출금액",
		"오출율"
	].map((label) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
		className: "sticky top-0 z-10 bg-[#f2f2f7] px-2 py-2 text-right text-xs font-medium whitespace-nowrap text-[#636366]",
		children: label
	}, label)) });
}
function Multi({ label, options, selected, onChange }) {
	const ids = options.map((item) => item.id);
	const none = selected.includes("\0");
	const picked = selected.filter((id) => ids.includes(id));
	const all = !none && picked.length === 0;
	const text = all ? "전체" : none || picked.length === 0 ? "없음" : picked.length === 1 ? options.find((item) => item.id === picked[0])?.label ?? "1개" : `${picked.length}개`;
	function set(next) {
		if (next.length === 0) onChange(["\0"]);
		else if (next.length === ids.length) onChange([]);
		else onChange(next);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
		label,
		text,
		rows: [{
			id: "__all",
			label: "전체",
			checked: all
		}, ...options.map((item) => ({
			id: item.id,
			label: item.label,
			checked: all || picked.includes(item.id)
		}))],
		onToggle: (id) => {
			if (id === "__all") {
				onChange(all ? ["\0"] : []);
				return;
			}
			const base = all ? ids : picked;
			set(all || picked.includes(id) ? base.filter((item) => item !== id) : [...base, id]);
		}
	});
}
function axisTicks(max) {
	if (!(max > 0)) return [0, 1];
	const bases = [
		1,
		2,
		2.5,
		3,
		3.5,
		4,
		5,
		6,
		8,
		10
	];
	const rough = max / 4;
	const mag = 10 ** Math.floor(Math.log10(rough));
	const residual = rough / mag;
	const step = (bases.find((item) => item + 1e-9 >= residual) ?? 10) * mag;
	const top = Math.max(step, Math.ceil((max - step * 1e-9) / step) * step);
	const count = Math.round(top / step);
	return Array.from({ length: count + 1 }, (_, index) => Number((step * index).toPrecision(12)));
}
function tickText(value, unit) {
	if (unit === "pct") {
		if (Math.abs(value) < 1e-9) return "0%";
		return `${Math.abs(value - Math.round(value)) < 1e-6 ? String(Math.round(value)) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}%`;
	}
	return OE(value);
}
function tipText(value, unit) {
	return unit === "won" ? DE(value) : `${value.toFixed(2)}%`;
}
function monotone(points) {
	if (points.length === 0) return "";
	if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
	const slope = [];
	const dx = [];
	for (let i = 0; i < points.length - 1; i++) {
		dx[i] = points[i + 1].x - points[i].x || 1;
		slope[i] = (points[i + 1].y - points[i].y) / dx[i];
	}
	const tangent = slope.map((value, index) => {
		if (index === 0) return value;
		const prev = slope[index - 1];
		if (prev * value <= 0) return 0;
		return (prev + value) / 2;
	});
	tangent.push(slope[slope.length - 1] ?? 0);
	for (let i = 0; i < slope.length; i++) {
		if (Math.abs(slope[i]) < 1e-9) {
			tangent[i] = 0;
			tangent[i + 1] = 0;
			continue;
		}
		const a = tangent[i] / slope[i];
		const b = tangent[i + 1] / slope[i];
		const h = a * a + b * b;
		if (h > 9) {
			const scale = 3 / Math.sqrt(h);
			tangent[i] = scale * a * slope[i];
			tangent[i + 1] = scale * b * slope[i];
		}
	}
	let path = `M ${points[0].x} ${points[0].y}`;
	for (let i = 0; i < points.length - 1; i++) {
		const h = dx[i];
		path += ` C ${points[i].x + h / 3} ${points[i].y + tangent[i] * h / 3}, ${points[i + 1].x - h / 3} ${points[i + 1].y - tangent[i + 1] * h / 3}, ${points[i + 1].x} ${points[i + 1].y}`;
	}
	return path;
}
function SeriesChart({ title, note, points, centers, unit, initial, interval = 0 }) {
	const frame = (0, import_react.useRef)(null);
	const [width, setWidth] = (0, import_react.useState)(0);
	const [shape, setShape] = (0, import_react.useState)(initial);
	const [hover, setHover] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const node = frame.current;
		if (!node) return;
		const measure = () => setWidth(Math.max(1, Math.round(node.clientWidth)));
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		return () => observer.disconnect();
	}, []);
	const height = 256;
	const sub = points.some((point) => point.sub);
	const pad = {
		left: unit === "won" ? 62 : 46,
		right: sub ? 46 : 24,
		top: 10,
		bottom: sub ? 42 : 28
	};
	const innerW = Math.max(width - pad.left - pad.right, 1);
	const innerH = height - pad.top - pad.bottom;
	const ticks = axisTicks(Math.max(0, ...points.flatMap((point) => centers.map((center) => point.values[center] ?? 0))));
	const top = ticks[ticks.length - 1] || 1;
	const y = (value) => pad.top + innerH - value / top * innerH;
	const xAt = (index) => points.length <= 1 ? pad.left + innerW / 2 : pad.left + index / (points.length - 1) * innerW;
	const band = innerW / Math.max(points.length, 1);
	const showLabel = (index) => {
		if (interval <= 0 || points.length <= 8) return true;
		if (index === 0 || index === points.length - 1) return true;
		const step = interval + 1;
		if (index % step !== 0) return false;
		return points.length - 1 - index >= step;
	};
	const hoverPoint = hover == null ? null : points[hover];
	const labelX = (index) => shape === "bar" ? pad.left + band * index + band / 2 : xAt(index);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "min-w-0 rounded-2xl bg-white p-4 shadow-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-base font-semibold text-[#1c1c1e]",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-1",
						children: [["bar", "막대"], ["line", "꺾은선"]].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `h-8 rounded-full px-3 text-xs font-medium ${shape === id ? "bg-[#007aff] text-white" : "bg-[#f2f2f7] text-[#1c1c1e]"}`,
							onClick: () => setShape(id),
							children: label
						}, id))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-[#8e8e93]",
						children: note
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: frame,
				className: "relative h-64 w-full min-w-0",
				children: [points.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "flex h-full items-center justify-center text-sm text-[#8e8e93]",
					children: "표시할 출고가 없습니다."
				}) : width > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
					viewBox: `0 0 ${width} ${height}`,
					className: "block h-64 w-full",
					preserveAspectRatio: "none",
					role: "img",
					"aria-label": title,
					onMouseLeave: () => setHover(null),
					children: [
						ticks.map((tick) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
							x1: pad.left,
							x2: width - pad.right,
							y1: y(tick),
							y2: y(tick),
							stroke: "#e5e5ea"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
							x: pad.left - 6,
							y: y(tick) + 4,
							textAnchor: "end",
							fill: "#8e8e93",
							fontSize: "12",
							children: tickText(tick, unit)
						})] }, tick)),
						shape === "bar" ? points.map((point, index) => {
							const inset = band * .16;
							const gap = centers.length > 1 ? 3 : 0;
							const barW = Math.max(2, (band - inset * 2 - gap * (centers.length - 1)) / centers.length);
							const origin = pad.left + band * index + inset;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
								onMouseEnter: () => setHover(index),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
									x: pad.left + band * index,
									y: pad.top,
									width: band,
									height: innerH,
									fill: "transparent"
								}), centers.map((center, at) => {
									const value = point.values[center] ?? 0;
									const barTop = y(value);
									const barH = Math.max(pad.top + innerH - barTop, 0);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
										x: origin + at * (barW + gap),
										y: barTop,
										width: barW,
										height: barH,
										fill: ED(center, centers),
										rx: "3"
									}, center);
								})]
							}, point.label);
						}) : centers.map((center) => {
							const dots = points.map((point, index) => ({
								x: xAt(index),
								y: y(point.values[center] ?? 0)
							}));
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: monotone(dots),
								fill: "none",
								stroke: ED(center, centers),
								strokeWidth: "2"
							}), points.length <= 12 ? dots.map((dot, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
								cx: dot.x,
								cy: dot.y,
								r: "3.5",
								fill: ED(center, centers)
							}, index)) : null] }, center);
						}),
						shape === "line" ? points.map((point, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: xAt(index) - band / 2,
							y: pad.top,
							width: band,
							height: innerH,
							fill: "transparent",
							onMouseEnter: () => setHover(index)
						}, point.label)) : null,
						hover != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
							x1: labelX(hover),
							x2: labelX(hover),
							y1: pad.top,
							y2: pad.top + innerH,
							stroke: "#c7c7cc",
							strokeDasharray: "3 3"
						}) : null,
						points.map((point, index) => showLabel(index) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
							x: labelX(index),
							y: point.sub ? 232 : 246,
							textAnchor: "middle",
							fill: "#8e8e93",
							fontSize: "12",
							children: point.label
						}), point.sub ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
							x: labelX(index),
							y: 248,
							textAnchor: "middle",
							fill: "#8e8e93",
							fontSize: "12",
							children: point.sub
						}) : null] }, `${point.label}-${point.sub ?? ""}`) : null)
					]
				}) : null, hoverPoint ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-none absolute top-2 right-2 rounded-lg border border-[#e5e5ea] bg-white px-3 py-2 text-xs shadow-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-1 font-medium text-[#1c1c1e]",
						children: hoverPoint.sub ? `${hoverPoint.label} ${hoverPoint.sub}` : hoverPoint.label
					}), centers.map((center) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center gap-2 tabular-nums text-[#1c1c1e]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "inline-block size-2 rounded-sm",
								style: { background: ED(center, centers) }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[#8e8e93]",
								children: center
							}),
							tipText(hoverPoint.values[center] ?? 0, unit)
						]
					}, center))]
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-wrap items-center justify-center gap-4 text-[13px] text-[#1c1c1e]",
				children: centers.map((center) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-1.5",
					children: [shape === "bar" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "inline-block h-2.5 w-2.5 rounded-sm",
						style: { background: ED(center, centers) }
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "relative inline-block h-0.5 w-4",
						style: { background: ED(center, centers) },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
							style: { background: ED(center, centers) }
						})
					}), center]
				}, center))
			})
		]
	});
}
var CAPTURE_FONT = "'Malgun Gothic', 'WenQuanYi Zen Hei', 'Apple SD Gothic Neo', sans-serif";
function shortRange(from, to) {
	const [, fm, fd] = from.split("-").map(Number);
	const [, tm, td] = to.split("-").map(Number);
	if (!fm || !fd || !tm || !td) return `${from} – ${to}`;
	return fm === tm ? `${fm}/${fd}~${td}` : `${fm}/${fd}~${tm}/${td}`;
}
function deltaColor(value) {
	if (value == null || !Number.isFinite(value) || value === 0) return "text-[#8e8e93]";
	return value > 0 ? "text-[#007aff]" : "text-[#ff3b30]";
}
function ShipGrid({ name, spans, lines, delta }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "min-w-0 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "px-3 pt-3 text-sm font-bold",
			children: name
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full border-collapse text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "sticky left-0 z-10 bg-[#f2f2f7] px-3 py-2 text-left text-xs font-semibold whitespace-nowrap",
					children: "구분"
				}), spans.map((span) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
					className: "px-2 py-2 text-right text-xs font-semibold whitespace-nowrap",
					style: { background: span.even ? "#f6e2b8" : "#f2f2f7" },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block",
						children: span.title
					}), span.sub ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block font-normal text-[#636366]",
						children: span.sub
					}) : null]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "px-2 py-2 text-right text-xs font-semibold whitespace-nowrap",
					style: { background: span.even ? "#f6e2b8" : "#f2f2f7" },
					children: delta
				})] }, span.key))] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: lines.map((line) => {
					const foot = line.label === "합계" || line.label === "평균";
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: `sticky left-0 z-10 px-3 py-1.5 text-left whitespace-nowrap ${foot ? "font-semibold" : "font-medium"}`,
						style: { background: foot ? "#f2f2f7" : "#ffffff" },
						children: line.label
					}), line.cells.map((cell, index) => {
						const even = spans[index]?.even;
						const bg = foot ? even ? "#f3ddb0" : "#f2f2f7" : even ? "#fbf0d4" : "#ffffff";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: `px-2 py-1.5 text-right tabular-nums whitespace-nowrap ${foot ? "font-semibold" : ""}`,
							style: { background: bg },
							children: DE(cell.ship)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: `px-2 py-1.5 text-right tabular-nums whitespace-nowrap ${deltaColor(cell.change)}`,
							style: { background: bg },
							children: wD(cell.change)
						})] }, `${spans[index]?.key ?? index}`);
					})] }, line.label);
				}) })]
			})
		})]
	});
}
function drawShipCanvas(board, deltaLabel) {
	const measure = document.createElement("canvas").getContext("2d");
	if (!measure) throw new Error("이미지를 만들지 못했습니다.");
	const widthOf = (text, size, weight = 500) => {
		measure.font = `${weight} ${size}px ${CAPTURE_FONT}`;
		return measure.measureText(text).width;
	};
	const blocks = board.centers.map((block) => ({
		...block,
		name: block.center === "신오산" ? "전체" : block.center
	}));
	const labelW = Math.ceil(Math.max(88, ...blocks.flatMap((block) => block.lines.map((line) => widthOf(line.label, 13, line.label === "합계" || line.label === "평균" ? 700 : 500))))) + 24;
	const amountW = Math.ceil(Math.max(108, ...blocks.flatMap((block) => block.lines.flatMap((line) => line.cells.map((cell) => widthOf(DE(cell.ship), 13)))))) + 20;
	const deltaW = Math.ceil(Math.max(84, widthOf(deltaLabel, 12, 700), ...blocks.flatMap((block) => block.lines.flatMap((line) => line.cells.map((cell) => widthOf(wD(cell.change), 13, 600)))))) + 16;
	const headerH = board.spans.some((span) => span.sub) ? 48 : 34;
	const rowH = 30;
	const nameH = 32;
	const gap = 16;
	const pad = 24;
	const tableW = labelW + board.spans.length * (amountW + deltaW);
	const blockH = nameH + headerH + rowH * (blocks[0]?.lines.length ?? 0);
	const width = Math.max(360, tableW + 48);
	const height = 66 + blocks.length * blockH + Math.max(0, blocks.length - 1) * gap + pad;
	const canvas = document.createElement("canvas");
	const dpr = 2;
	canvas.width = Math.ceil(width * dpr);
	canvas.height = Math.ceil(height * dpr);
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("이미지를 만들지 못했습니다.");
	ctx.scale(dpr, dpr);
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, width, height);
	ctx.textBaseline = "middle";
	ctx.fillStyle = "#1c1c1e";
	ctx.font = `700 18px ${CAPTURE_FONT}`;
	ctx.textAlign = "left";
	ctx.fillText(board.title, pad, 40);
	const paint = (x, y, w, h, bg, text, color, align, weight, size) => {
		ctx.fillStyle = bg;
		ctx.fillRect(x, y, w, h);
		ctx.strokeStyle = "#e5e5ea";
		ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
		ctx.fillStyle = color;
		ctx.font = `${weight} ${size}px ${CAPTURE_FONT}`;
		ctx.textAlign = align;
		ctx.fillText(text, align === "right" ? x + w - 8 : x + 10, y + h / 2);
	};
	blocks.forEach((block, index) => {
		let y = 66 + index * (blockH + gap);
		ctx.fillStyle = "#1c1c1e";
		ctx.font = `700 15px ${CAPTURE_FONT}`;
		ctx.textAlign = "left";
		ctx.fillText(block.name, pad, y + 14);
		y += nameH;
		paint(pad, y, labelW, headerH, "#f2f2f7", "구분", "#3a3a3c", "left", 700, 12);
		board.spans.forEach((span, at) => {
			const x = pad + labelW + at * (amountW + deltaW);
			const head = span.even ? "#f6e2b8" : "#f2f2f7";
			ctx.fillStyle = head;
			ctx.fillRect(x, y, amountW + deltaW, headerH);
			ctx.strokeStyle = "#e5e5ea";
			ctx.strokeRect(x + .5, y + .5, amountW - 1, headerH - 1);
			ctx.strokeRect(x + amountW + .5, y + .5, deltaW - 1, headerH - 1);
			ctx.fillStyle = "#1c1c1e";
			ctx.font = `700 12px ${CAPTURE_FONT}`;
			ctx.textAlign = "right";
			ctx.fillText(span.title, x + amountW - 8, span.sub ? y + 16 : y + headerH / 2);
			if (span.sub) {
				ctx.fillStyle = "#636366";
				ctx.font = `400 11px ${CAPTURE_FONT}`;
				ctx.fillText(span.sub, x + amountW - 8, y + 34);
			}
			ctx.fillStyle = "#3a3a3c";
			ctx.font = `700 12px ${CAPTURE_FONT}`;
			ctx.fillText(deltaLabel, x + amountW + deltaW - 8, y + headerH / 2);
		});
		y += headerH;
		for (const line of block.lines) {
			const foot = line.label === "합계" || line.label === "평균";
			paint(pad, y, labelW, rowH, foot ? "#f2f2f7" : "#ffffff", line.label, "#1c1c1e", "left", foot ? 700 : 500, 13);
			line.cells.forEach((cell, at) => {
				const even = board.spans[at]?.even;
				const bg = foot ? even ? "#f3ddb0" : "#f2f2f7" : even ? "#fbf0d4" : "#ffffff";
				const x = pad + labelW + at * (amountW + deltaW);
				const color = cell.change == null || !Number.isFinite(cell.change) || cell.change === 0 ? "#8e8e93" : cell.change > 0 ? "#007aff" : "#ff3b30";
				paint(x, y, amountW, rowH, bg, DE(cell.ship), "#1c1c1e", "right", foot ? 700 : 500, 13);
				paint(x + amountW, y, deltaW, rowH, bg, wD(cell.change), color, "right", 600, 13);
			});
			y += rowH;
		}
	});
	return canvas;
}
async function copyBoard(board, deltaLabel) {
	const canvas = drawShipCanvas(board, deltaLabel);
	const blob = await new Promise((resolve) => canvas.toBlob((value) => resolve(value), "image/png"));
	if (!blob) throw new Error("이미지를 만들지 못했습니다.");
	const host = window.chrome?.webview;
	if (host) {
		const bytes = new Uint8Array(await blob.arrayBuffer());
		let binary = "";
		for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
		host.postMessage({
			type: "clipboard-png",
			b64: btoa(binary)
		});
	}
	try {
		await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
	} catch (err) {
		if (!host) throw err instanceof Error ? err : /* @__PURE__ */ new Error("복사에 실패했습니다.");
	}
}
function ChulgoView() {
	const [books, setBooks] = (0, import_react.useState)([]);
	const [active, setActive] = (0, import_react.useState)("");
	const [ready, setReady] = (0, import_react.useState)(false);
	const [tab, setTab] = (0, import_react.useState)("요약");
	const [filters, setFilters] = (0, import_react.useState)(EMPTY);
	const [note, setNote] = (0, import_react.useState)("");
	const [dragOver, setDragOver] = (0, import_react.useState)(false);
	const [assign, setAssign] = (0, import_react.useState)(null);
	const [openCenter, setOpenCenter] = (0, import_react.useState)({});
	const [trendScope, setTrendScope] = (0, import_react.useState)("current");
	const [trendWeeks, setTrendWeeks] = (0, import_react.useState)([]);
	const [shipMode, setShipMode] = (0, import_react.useState)("week");
	const [shipMonths, setShipMonths] = (0, import_react.useState)([]);
	const [shipWeeks, setShipWeeks] = (0, import_react.useState)([]);
	const [shipCalMonths, setShipCalMonths] = (0, import_react.useState)([]);
	const [company, setCompany] = (0, import_react.useState)(false);
	const intent = (0, import_react.useRef)("view");
	const input = (0, import_react.useRef)(null);
	const onFilesRef = (0, import_react.useRef)(async () => {});
	const allRows = (0, import_react.useMemo)(() => books.flatMap((item) => item.rows), [books]);
	const monthOptions = (0, import_react.useMemo)(() => {
		const keys = new Set(books.map((item) => item.key));
		for (const row of allRows) if (row.date) keys.add(xD(row.date).month);
		return [...keys].sort();
	}, [books, allRows]);
	const book = books.find((item) => item.key === active) ?? null;
	const rows = (0, import_react.useMemo)(() => book ? uD(book.rows, filters) : [], [book, filters]);
	const trendBase = (0, import_react.useMemo)(() => uD(allRows, {
		centers: filters.centers,
		masters: filters.masters,
		weeks: []
	}), [
		allRows,
		filters.centers,
		filters.masters
	]);
	const sundayRows = (0, import_react.useMemo)(() => trendBase.filter((row) => row.date && xD(row.date).month === active), [trendBase, active]);
	const sundayAll = (0, import_react.useMemo)(() => allRows.filter((row) => row.date && xD(row.date).month === active), [allRows, active]);
	const centers = mD(rows);
	const weeks = hD(rows);
	const weekChoices = (0, import_react.useMemo)(() => DD(sundayAll), [sundayAll]);
	const weekAll = (0, import_react.useMemo)(() => DD(sundayRows), [sundayRows]);
	const shownWeeks = trendWeeks.includes(-1) ? [] : weekAll.filter((item) => trendWeeks.length === 0 || trendWeeks.includes(item.week));
	const rateOf = (part, whole) => whole ? Number((part / whole * 100).toFixed(2)) : 0;
	const shipWeek = OD(shownWeeks, (bucket) => bucket.ship);
	const missWeek = OD(shownWeeks, (bucket) => rateOf(bucket.miss, bucket.order));
	const wrongWeek = OD(shownWeeks, (bucket) => rateOf(bucket.wrong, bucket.order));
	const dayMiss = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const week of shownWeeks) for (const day of week.days) {
			const hit = map.get(day.date) ?? {};
			for (const [center, value] of Object.entries(day.miss)) hit[center] = (hit[center] ?? 0) + value;
			map.set(day.date, hit);
		}
		return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, values]) => ({
			label: `${Number(date.slice(5, 7))}/${Number(date.slice(8))}`,
			values
		}));
	}, [shownWeeks]);
	const monthShip = kD(trendBase, (bucket) => bucket.ship);
	const monthMiss = kD(trendBase, (bucket) => rateOf(bucket.miss, bucket.order));
	const monthWrong = kD(trendBase, (bucket) => rateOf(bucket.wrong, bucket.order));
	const seriesCenters = dD(sundayRows);
	const monthSeries = dD(trendBase);
	const rankPool = (0, import_react.useMemo)(() => {
		const keys = new Set(shownWeeks.map((item) => `${item.month}|${item.week}`));
		const map = /* @__PURE__ */ new Map();
		for (const row of sundayRows) {
			const slot = xD(row.date);
			if (!keys.has(`${slot.month}|${slot.week}`)) continue;
			const key = `${row.center}|${row.master}`;
			const hit = map.get(key) ?? {
				center: row.center,
				master: row.master,
				order: 0,
				miss: 0,
				wrong: 0
			};
			hit.order += row.order;
			hit.miss += row.miss;
			hit.wrong += row.wrong;
			map.set(key, hit);
		}
		return [...map.values()];
	}, [sundayRows, shownWeeks]);
	const missRank = rankPool.filter((item) => item.miss > 0).sort((a, b) => b.miss - a.miss).slice(0, 8);
	const wrongRank = rankPool.filter((item) => item.wrong > 0).sort((a, b) => b.wrong - a.wrong).slice(0, 8);
	const shipMonthOptions = (0, import_react.useMemo)(() => {
		const keys = /* @__PURE__ */ new Set();
		for (const row of allRows) if (row.date) keys.add(xD(row.date).month);
		return [...keys].sort();
	}, [allRows]);
	const shipWeekOptions = (0, import_react.useMemo)(() => {
		const set = /* @__PURE__ */ new Set();
		for (const row of allRows) {
			if (!row.date) continue;
			const slot = xD(row.date);
			if (shipMonths.includes("\0")) continue;
			if (shipMonths.length && !shipMonths.includes(slot.month)) continue;
			set.add(slot.week);
		}
		return [...set].sort((a, b) => a - b);
	}, [allRows, shipMonths]);
	const weekBoards = (0, import_react.useMemo)(() => ID(allRows, shipMonths, shipWeeks), [
		allRows,
		shipMonths,
		shipWeeks
	]);
	const monthBoard = (0, import_react.useMemo)(() => LD(allRows, shipCalMonths), [allRows, shipCalMonths]);
	(0, import_react.useEffect)(() => {
		const saved = loadStore();
		if (saved) {
			setBooks(saved.books);
			setActive(saved.active);
		}
		setCompany(Boolean(window.__COMPANY_PC__));
		setReady(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		if (!monthOptions.length) {
			if (active) setActive("");
			return;
		}
		if (!monthOptions.includes(active)) setActive(monthOptions[monthOptions.length - 1]);
	}, [
		ready,
		monthOptions,
		active
	]);
	(0, import_react.useEffect)(() => {
		setTrendWeeks([]);
	}, [active]);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		try {
			localStorage.setItem(STORE, JSON.stringify({
				books,
				active
			}));
		} catch {
			setNote("월 데이터는 화면에 반영됐지만, 브라우저 저장 공간이 부족해 새로고침하면 사라질 수 있습니다.");
		}
	}, [
		books,
		active,
		ready
	]);
	function resetView(next, key) {
		setBooks(next);
		setActive(key);
		setFilters(EMPTY);
		setTrendWeeks([]);
		setShipMonths([]);
		setShipWeeks([]);
		setShipCalMonths([]);
		setTab("요약");
	}
	function takeRows(list, warnings) {
		const incoming = lD(list, warnings);
		if (!incoming.length) {
			setNote("출고일자를 읽지 못했습니다. 날짜 칸을 확인해 주세요.");
			return;
		}
		const map = new Map(books.map((item) => [item.key, item]));
		for (const item of incoming) map.set(item.key, item);
		resetView([...map.values()].sort((a, b) => a.key.localeCompare(b.key)), incoming[incoming.length - 1]?.key ?? active);
		setNote("");
		setAssign(null);
	}
	async function onFiles(list) {
		const files = [...list ?? []];
		if (!files.length) return;
		setNote("엑셀 읽는 중");
		const result = await sD(files);
		setNote("");
		if (result.kind === "error") {
			setNote(result.message);
			return;
		}
		if (result.kind === "combined") {
			if (intent.current === "bundle") {
				const months = lD(result.rows, result.warnings);
				await bD(months.length <= 1 ? [{
					title: gD(EMPTY),
					rows: months[0]?.rows ?? []
				}] : months.map((item) => ({
					title: jE(item.key),
					rows: item.rows
				})), months.length === 1 ? `${jE(months[0].key).replace(/\s/g, "")}_업로드.xlsx` : "출고_업로드.xlsx");
				return;
			}
			takeRows(result.rows, result.warnings);
			return;
		}
		setAssign({
			drafts: result.drafts,
			unknown: result.unknown,
			note: result.note,
			intent: intent.current
		});
	}
	onFilesRef.current = onFiles;
	(0, import_react.useEffect)(() => {
		const host = window.chrome?.webview;
		if (!host?.addEventListener) return;
		const onMessage = (event) => {
			const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
			if (data?.type !== "ledger") return;
			const files = (Array.isArray(data.files) ? data.files : data.b64 ? [{
				name: data.name,
				b64: data.b64
			}] : []).filter((item) => item.b64).map((item) => new File([b64ToArrayBuffer$2(item.b64 ?? "")], item.name || "출고원장.xlsx"));
			if (files.length) onFilesRef.current(files);
		};
		host.addEventListener("message", onMessage);
		return () => host.removeEventListener("message", onMessage);
	}, []);
	async function applyAssign() {
		if (!assign) return;
		if (assign.drafts.some((draft) => !draft.center || !draft.role)) {
			setNote("센터와 미출·오출을 모두 골라 주세요.");
			return;
		}
		const merged = cD(assign.drafts);
		if (assign.intent === "bundle") {
			const months = lD(merged.rows, merged.warnings);
			if (!months.length) {
				setNote("출고일자를 읽지 못했습니다. 날짜 칸을 확인해 주세요.");
				return;
			}
			await bD(months.length <= 1 ? [{
				title: gD(EMPTY),
				rows: months[0]?.rows ?? []
			}] : months.map((item) => ({
				title: jE(item.key),
				rows: item.rows
			})), months.length === 1 ? `${jE(months[0].key).replace(/\s/g, "")}_업로드.xlsx` : "출고_업로드.xlsx");
			setAssign(null);
			return;
		}
		takeRows(merged.rows, merged.warnings);
	}
	async function capture(board, deltaLabel) {
		try {
			await copyBoard(board, deltaLabel);
			setNote("클립보드에 복사했습니다.");
		} catch (err) {
			setNote(err instanceof Error ? err.message : "복사에 실패했습니다.");
		}
	}
	function clearData() {
		if (!books.length || !window.confirm("올려 둔 월 데이터를 모두 비울까요?")) return;
		setBooks([]);
		setActive("");
		setFilters(EMPTY);
		setTrendWeeks([]);
		setShipMonths([]);
		setShipWeeks([]);
		setShipCalMonths([]);
		setAssign(null);
		setNote("");
		localStorage.removeItem(STORE);
	}
	function openFiles(next) {
		intent.current = next;
		const host = window.chrome?.webview;
		if ((company || Boolean(window.__COMPANY_PC__)) && host) {
			host.postMessage("ledger");
			return;
		}
		input.current?.click();
	}
	function onDropFiles(event) {
		event.preventDefault();
		setDragOver(false);
		const files = [...event.dataTransfer.files].filter((file) => /\.xls/i.test(file.name));
		if (!files.length) {
			setNote("xlsx 또는 xls 파일만 올릴 수 있습니다.");
			return;
		}
		intent.current = "view";
		onFiles(files);
	}
	const grand = centers.grand;
	const filteredOn = filters.centers.length > 0 || filters.masters.length > 0 || tab !== "추이" && filters.weeks.length > 0;
	const filterRows = tab === "추이" ? sundayAll : book?.rows ?? [];
	const pickedLabel = tab === "추이" ? gD({
		...filters,
		weeks: []
	}) : gD(filters);
	const pickedCount = tab === "추이" ? sundayRows.length : rows.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative min-h-full bg-[#f2f2f7] text-[#1c1c1e]",
		onDragEnter: (event) => {
			if ([...event.dataTransfer.types].includes("Files")) {
				event.preventDefault();
				setDragOver(true);
			}
		},
		onDragOver: (event) => {
			if ([...event.dataTransfer.types].includes("Files")) {
				event.preventDefault();
				event.dataTransfer.dropEffect = "copy";
			}
		},
		onDragLeave: (event) => {
			if (event.currentTarget.contains(event.relatedTarget)) return;
			setDragOver(false);
		},
		onDrop: onDropFiles,
		children: [
			dragOver ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-[#007aff]/10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-2xl bg-white px-5 py-3 text-sm font-semibold shadow",
					children: "엑셀을 놓으면 업로드됩니다"
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-black/5 bg-white/90 px-3 py-2 backdrop-blur",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-w-0 flex-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-[17px] font-semibold",
							children: "출고 분석"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold text-[#ff3b30] disabled:opacity-40",
						disabled: !books.length,
						onClick: clearData,
						children: "데이터 비우기"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold",
						onClick: () => openFiles("view"),
						children: "월 파일 올리기"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-9 rounded-full bg-[#007aff] px-3 text-xs font-semibold text-white",
						onClick: () => openFiles("bundle"),
						children: "업로드 만들기"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						id: "ledger-file",
						ref: input,
						type: "file",
						accept: ".xlsx,.xls,.xlsm",
						multiple: true,
						className: "sr-only",
						onChange: (event) => {
							onFiles(event.target.files);
							event.target.value = "";
						}
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2 px-3 pt-3",
				children: [TABS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `h-9 rounded-full px-4 text-sm font-bold ${tab === item ? "bg-[#007aff] text-white" : "bg-white text-[#1c1c1e]"}`,
					onClick: () => setTab(item),
					children: item
				}, item)), monthOptions.length && tab !== "출고정리" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
					label: "월",
					value: monthOptions.includes(active) ? active : monthOptions[monthOptions.length - 1],
					onChange: (id) => {
						setActive(id);
						setFilters(EMPTY);
					},
					options: monthOptions.map((key) => ({
						id: key,
						label: jE(key)
					}))
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-3 py-2 text-sm text-[#8e8e93]",
				children: [
					!books.length ? "파일을 올리기 전에는 숫자 없이 메뉴만 보입니다. 월 파일 올리기는 화면에 넣고, 업로드 만들기는 고른 파일을 엑셀로만 받습니다. 파일을 이 화면에 놓으면 월 파일 올리기와 같이 열립니다." : tab === "출고정리" ? "출고금액만 봅니다. 월을 비우면 올린 달이 모두 나옵니다." : book ? `${jE(active)}을 보고 있습니다.` : `${jE(active)}은 일요일 기준 주차만 있습니다. 요약·피벗은 달력 월이라 숫자가 없습니다.`,
					note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-1 block font-semibold text-[#ff3b30]",
						children: note
					}) : null,
					book?.warnings.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 rounded-xl bg-[#ffeceb] px-3 py-2 text-[#ff3b30]",
						children: book.warnings.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: item }, item))
					}) : null
				]
			}),
			assign ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-3 mb-3 rounded-2xl border border-black/10 bg-white p-3 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[#8e8e93]",
						children: assign.intent === "bundle" ? "고른 미출·오출 파일을 하나의 업로드 엑셀로 만듭니다. 화면의 원장은 바꾸지 않습니다." : "미출 파일과 오출 파일을 함께 올리면 날짜·상품군 기준으로 한 줄로 붙입니다. 이름에 센터와 오출이 있으면 미리 골라 둡니다."
					}),
					assign.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-[#ff3b30]",
						children: assign.note
					}) : null,
					assign.unknown.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-[#ff3b30]",
						children: [name, " 은 출고 파일로 인식하지 못했습니다."]
					}, name)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 flex flex-col gap-3",
						children: assign.drafts.map((draft, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-md border border-black/10 p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: draft.filename
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mb-2 text-xs text-[#8e8e93]",
									children: [draft.detailCount.toLocaleString("ko-KR"), "행"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-2",
										children: ["센터", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											className: "h-10 rounded-md border border-black/10 px-2",
											value: draft.center ?? "",
											onChange: (event) => setAssign({
												...assign,
												drafts: assign.drafts.map((item, at) => at === index ? {
													...item,
													center: event.target.value
												} : item)
											}),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: "선택"
											}), CE.filter((item) => item !== "냉동").map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: item }, item))]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-2",
										children: ["구분", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											className: "h-10 rounded-md border border-black/10 px-2",
											value: draft.role ?? "",
											onChange: (event) => setAssign({
												...assign,
												drafts: assign.drafts.map((item, at) => at === index ? {
													...item,
													role: event.target.value
												} : item)
											}),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "",
													children: "선택"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "miss",
													children: "미출"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "wrong",
													children: "오출"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "both",
													children: "통합"
												})
											]
										})]
									})]
								})
							]
						}, draft.filename))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-10 rounded-full bg-[#007aff] px-4 text-sm font-semibold text-white",
							onClick: () => void applyAssign(),
							children: "적용"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-10 rounded-full border border-black/10 px-4 text-sm",
							onClick: () => setAssign(null),
							children: "닫기"
						})]
					})
				]
			}) : null,
			books.length && tab !== "출고정리" && (tab === "추이" || book) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2 px-3 pb-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Multi, {
						label: "센터",
						options: dD(filterRows).map((id) => ({
							id,
							label: id
						})),
						selected: filters.centers,
						onChange: (next) => setFilters({
							...filters,
							centers: next
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Multi, {
						label: "상품군",
						options: fD(filterRows).map((id) => ({
							id,
							label: id
						})),
						selected: filters.masters,
						onChange: (next) => setFilters({
							...filters,
							masters: next
						})
					}),
					tab !== "추이" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Multi, {
						label: "주차",
						options: pD(filterRows).map((week) => ({
							id: String(week),
							label: `${week}주차`
						})),
						selected: filters.weeks.length === 1 && filters.weeks[0] === -1 ? ["\0"] : filters.weeks.map(String),
						onChange: (ids) => setFilters({
							...filters,
							weeks: ids.includes("\0") ? [-1] : ids.map(Number)
						})
					}) : null,
					filteredOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-10 px-2 text-sm font-medium text-[#007aff]",
						onClick: () => setFilters(EMPTY),
						children: "지우기"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "self-center text-xs text-[#8e8e93]",
						children: [
							pickedLabel,
							" · ",
							pickedCount.toLocaleString("ko-KR"),
							"행"
						]
					})
				]
			}) : null,
			tab === "요약" && book ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 px-3 pb-4 sm:grid-cols-4",
				children: [[
					[
						"수주금액",
						DE(grand.order),
						""
					],
					[
						"출고금액",
						DE(grand.ship),
						""
					],
					[
						"미출금액",
						DE(grand.miss),
						"miss"
					],
					[
						"오출금액",
						DE(grand.wrong),
						"wrong"
					]
				].map(([label, value, kind]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl bg-white px-4 py-3 shadow-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-[#8e8e93]",
							children: label
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl font-semibold tabular-nums",
							children: value
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-[#8e8e93]",
							children: [
								kind === "miss" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: rateClass("miss", grand.miss, grand.order),
									children: ["미출율 ", AE(grand.miss, grand.order)]
								}) : null,
								kind === "wrong" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: rateClass("wrong", grand.wrong, grand.order),
									children: ["오출율 ", AE(grand.wrong, grand.order)]
								}) : null,
								label === "출고금액" ? `출고율 ${AE(grand.ship, grand.order)}` : null
							]
						})
					]
				}, label)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-2 sm:col-span-4 sm:grid-cols-4",
					children: centers.centers.map((center) => {
						const on = filters.centers.length === 1 && filters.centers[0] === center.center;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: `rounded-2xl bg-white px-4 py-3 text-left shadow-sm ${on ? "ring-2 ring-[#007aff]" : ""}`,
							onClick: () => setFilters({
								...filters,
								centers: on ? [] : [center.center]
							}),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: center.center
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-[#8e8e93]",
								children: [
									"미출율 ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: rateClass("miss", center.total.miss, center.total.order),
										children: AE(center.total.miss, center.total.order)
									}),
									" · ",
									"오출율 ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: rateClass("wrong", center.total.wrong, center.total.order),
										children: AE(center.total.wrong, center.total.order)
									})
								]
							})]
						}, center.center);
					})
				})]
			}) : null,
			tab === "요약" && books.length > 0 && !book ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-3 pb-6 text-sm text-[#8e8e93]",
				children: "요약은 선택한 달의 달력 출고만 봅니다. 추이 이번 달에서 일요일 기준 주차를 볼 수 있습니다."
			}) : null,
			tab === "피벗" && book ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 px-3 pb-6 xl:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-base font-semibold",
						children: "센터 × 상품군"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-auto rounded-lg border border-black/10 bg-white",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full border-collapse text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "sticky top-0 left-0 z-20 bg-[#f2f2f7] px-3 py-2 text-left text-xs",
								children: "행 레이블"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heads, {})] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [centers.centers.map((center) => {
								const open = openCenter[center.center] !== false;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-black/5 bg-[#f2f2f7]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
										className: "sticky left-0 bg-[#f2f2f7] px-3 py-2 text-left whitespace-nowrap",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "mr-1 text-[#8e8e93]",
											onClick: () => setOpenCenter((prev) => ({
												...prev,
												[center.center]: !open
											})),
											children: open ? "▾" : "▸"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "font-semibold",
											onClick: () => setFilters({
												...filters,
												centers: [center.center]
											}),
											children: center.center
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										bucket: center.total,
										strong: true
									})]
								}), open ? center.groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-black/5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "sticky left-0 bg-white py-2 pr-3 pl-10 text-left font-normal",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setFilters({
												...filters,
												centers: [center.center],
												masters: [group.master]
											}),
											children: group.master
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, { bucket: group.bucket })]
								}, group.master)) : null] }, center.center);
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t-2 border-[#1c1c1e] bg-[#f2f2f7]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "sticky left-0 bg-[#f2f2f7] px-3 py-2 text-left font-semibold",
									children: "총합계"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
									bucket: centers.grand,
									strong: true
								})]
							})] })]
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mb-2 text-base font-semibold",
							children: "주차"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-xs text-[#8e8e93]",
							children: "일요일 시작 · 월초 남은 날은 1주차"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-auto rounded-lg border border-black/10 bg-white",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-full border-collapse text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "sticky top-0 left-0 z-20 bg-[#f2f2f7] px-3 py-2 text-left text-xs",
									children: "행 레이블"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heads, {})] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [weeks.weeks.map((week) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-black/5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "sticky left-0 bg-white px-3 py-2 text-left",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setFilters({
												...filters,
												weeks: [week.week]
											}),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-semibold",
												children: [week.week, "주차"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-0.5 block text-xs font-normal text-[#8e8e93]",
												children: shortRange(week.from, week.to)
											})]
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										bucket: week.bucket,
										strong: true
									})]
								}, week.week)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-t-2 border-[#1c1c1e] bg-[#f2f2f7]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "sticky left-0 bg-[#f2f2f7] px-3 py-2 text-left font-semibold",
										children: "총합계"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										bucket: weeks.grand,
										strong: true
									})]
								})] })]
							})
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-[#8e8e93] xl:col-span-2",
						children: "단위: 원. 미출율·오출율은 수주금액 대비입니다. 2%·5% 미출, 0.5%·1% 오출부터 색이 진해집니다."
					})
				]
			}) : null,
			tab === "피벗" && books.length > 0 && !book ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-3 pb-6 text-sm text-[#8e8e93]",
				children: "피벗은 선택한 달의 달력 주차입니다. 1일이 일요일이 아니면 첫 일요일 전날은 1주차입니다."
			}) : null,
			tab === "추이" && books.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4 px-3 pb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [[["current", "이번 달"], ["months", "월별"]].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `h-10 rounded-full px-3 text-sm font-medium ${trendScope === id ? "bg-[#007aff] text-white" : "bg-white text-[#1c1c1e]"}`,
						onClick: () => setTrendScope(id),
						children: label
					}, id)), trendScope === "current" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Multi, {
						label: "주차",
						options: weekChoices.map((item) => ({
							id: String(item.week),
							label: `${item.week}주 ${shortRange(item.sunday, item.saturday)}`
						})),
						selected: trendWeeks.length === 1 && trendWeeks[0] === -1 ? ["\0"] : trendWeeks.map(String),
						onChange: (ids) => setTrendWeeks(ids.includes("\0") ? [-1] : ids.map(Number))
					}) : null]
				}), trendScope === "months" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SeriesChart, {
					title: "월별 출고금액",
					note: "올린 달 전체",
					points: monthShip,
					centers: monthSeries,
					unit: "won",
					initial: "line"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-6 xl:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SeriesChart, {
						title: "월별 미출율",
						note: "수주금액 대비 · 올린 달 전체",
						points: monthMiss,
						centers: monthSeries,
						unit: "pct",
						initial: "bar"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SeriesChart, {
						title: "월별 오출율",
						note: "수주금액 대비 · 올린 달 전체",
						points: monthWrong,
						centers: monthSeries,
						unit: "pct",
						initial: "bar"
					})]
				})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SeriesChart, {
						title: "주차별 출하금액",
						note: "일요일~토요일 · 일요일의 달",
						points: shipWeek,
						centers: seriesCenters,
						unit: "won",
						initial: "line"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-6 xl:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SeriesChart, {
							title: "주차별 미출율",
							note: "수주금액 대비 · 일요일의 달",
							points: missWeek,
							centers: seriesCenters,
							unit: "pct",
							initial: "bar"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SeriesChart, {
							title: "주차별 오출율",
							note: "수주금액 대비 · 일요일의 달",
							points: wrongWeek,
							centers: seriesCenters,
							unit: "pct",
							initial: "bar"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SeriesChart, {
						title: "일자별 미출금액",
						note: "선택한 주차",
						points: dayMiss,
						centers: seriesCenters,
						unit: "won",
						initial: "line",
						interval: 2
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-4 md:grid-cols-2",
						children: [[
							"미출금액이 큰 상품군",
							missRank,
							"miss"
						], [
							"오출금액이 큰 상품군",
							wrongRank,
							"wrong"
						]].map(([title, items, field]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-2xl bg-white p-4 shadow-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mb-3 text-base font-semibold",
								children: title
							}), items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-[#8e8e93]",
								children: "이 조건에 해당하는 상품군이 없습니다."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
								className: "flex flex-col gap-3",
								children: items.map((item) => {
									const value = field === "miss" ? item.miss : item.wrong;
									const max = field === "miss" ? missRank[0]?.miss || 1 : wrongRank[0]?.wrong || 1;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mb-1 flex items-baseline justify-between gap-3 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "min-w-0 truncate",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[#8e8e93]",
													children: item.center
												}),
												" ",
												item.master
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "shrink-0 tabular-nums",
											children: [
												DE(value),
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: rateClass(field, value, item.order),
													children: AE(value, item.order)
												})
											]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-1.5 rounded-full bg-[#f2f2f7]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: `h-1.5 rounded-full ${field === "miss" ? "bg-[#ff9500]" : "bg-[#ff3b30]"}`,
											style: { width: `${Math.max(4, Math.round(value / max * 100))}%` }
										})
									})] }, `${item.center}-${item.master}`);
								})
							})]
						}, title))
					})
				] })]
			}) : null,
			tab === "출고정리" && books.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4 px-3 pb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [[["week", "출고-주차"], ["month", "출고-월"]].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `h-10 rounded-full px-3 text-sm font-medium ${shipMode === id ? "bg-[#007aff] text-white" : "bg-white text-[#1c1c1e]"}`,
						onClick: () => setShipMode(id),
						children: label
					}, id)), shipMode === "week" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Multi, {
						label: "월",
						options: shipMonthOptions.map((id) => ({
							id,
							label: jE(id)
						})),
						selected: shipMonths,
						onChange: (next) => {
							setShipMonths(next);
							setShipWeeks([]);
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Multi, {
						label: "주차",
						options: shipWeekOptions.map((week) => ({
							id: String(week),
							label: `${week}주차`
						})),
						selected: shipWeeks.length === 1 && shipWeeks[0] === -1 ? ["\0"] : shipWeeks.map(String),
						onChange: (ids) => setShipWeeks(ids.includes("\0") ? [-1] : ids.map(Number))
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Multi, {
						label: "월",
						options: books.map((item) => ({
							id: item.key,
							label: jE(item.key)
						})),
						selected: shipCalMonths,
						onChange: setShipCalMonths
					})]
				}), shipMode === "week" ? weekBoards.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-[#8e8e93]",
					children: "표시할 출고가 없습니다."
				}) : weekBoards.map((board) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-base font-bold",
							children: board.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-8 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold",
							onClick: () => void capture(board, "전주대비"),
							children: "캡쳐"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-3 lg:grid-cols-2",
						children: board.centers.map((block) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShipGrid, {
							name: block.center,
							spans: board.spans,
							lines: block.lines,
							delta: "전주대비"
						}, block.center))
					})]
				}, board.key)) : monthBoard.spans.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-[#8e8e93]",
					children: "표시할 출고가 없습니다."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-base font-bold",
							children: "출고-월"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-8 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold",
							onClick: () => void capture(monthBoard, "전월대비"),
							children: "캡쳐"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-3 lg:grid-cols-2",
						children: monthBoard.centers.map((block) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShipGrid, {
							name: block.center,
							spans: monthBoard.spans,
							lines: block.lines,
							delta: "전월대비"
						}, block.center))
					})]
				})]
			}) : null
		]
	});
}
var CENTER_12_LAYOUT = [
	{
		line: 1,
		left: [
			{
				kind: "loc",
				code: "0139"
			},
			{
				kind: "loc",
				code: "0138"
			},
			{
				kind: "loc",
				code: "0137"
			},
			{
				kind: "loc",
				code: "0136"
			},
			{
				kind: "loc",
				code: "0135"
			},
			{
				kind: "loc",
				code: "0134"
			},
			{
				kind: "loc",
				code: "0133"
			},
			{
				kind: "loc",
				code: "0132"
			},
			{
				kind: "loc",
				code: "0131"
			},
			{
				kind: "loc",
				code: "0130"
			},
			{
				kind: "loc",
				code: "0129"
			},
			{
				kind: "loc",
				code: "0128"
			},
			{
				kind: "loc",
				code: "0127"
			},
			{
				kind: "loc",
				code: "0126"
			},
			{
				kind: "loc",
				code: "0125"
			},
			{
				kind: "loc",
				code: "0124"
			},
			{
				kind: "loc",
				code: "0123"
			},
			{
				kind: "loc",
				code: "0122"
			},
			{
				kind: "loc",
				code: "0121"
			},
			{
				kind: "loc",
				code: "0120"
			},
			{
				kind: "loc",
				code: "0119"
			},
			{
				kind: "loc",
				code: "0118"
			},
			{
				kind: "loc",
				code: "0117"
			},
			{
				kind: "loc",
				code: "0116"
			},
			{
				kind: "loc",
				code: "0115"
			},
			{
				kind: "loc",
				code: "0114"
			},
			{
				kind: "loc",
				code: "0113"
			},
			{
				kind: "loc",
				code: "0112"
			},
			{
				kind: "loc",
				code: "0111"
			},
			{
				kind: "loc",
				code: "0110"
			},
			{
				kind: "loc",
				code: "0109"
			},
			{
				kind: "loc",
				code: "0108"
			},
			{
				kind: "loc",
				code: "0107"
			},
			{
				kind: "loc",
				code: "0106"
			},
			{
				kind: "loc",
				code: "0105"
			},
			{
				kind: "loc",
				code: "0104"
			},
			{
				kind: "loc",
				code: "0103"
			},
			{
				kind: "loc",
				code: "0102"
			},
			{
				kind: "loc",
				code: "0101"
			}
		],
		right: [
			{
				kind: "loc",
				code: "0189"
			},
			{
				kind: "loc",
				code: "0188"
			},
			{
				kind: "loc",
				code: "0187"
			},
			{
				kind: "loc",
				code: "0186"
			},
			{
				kind: "loc",
				code: "0185"
			},
			{
				kind: "loc",
				code: "0184"
			},
			{
				kind: "loc",
				code: "0183"
			},
			{
				kind: "loc",
				code: "0182"
			},
			{
				kind: "loc",
				code: "0181"
			},
			{
				kind: "loc",
				code: "0180"
			},
			{
				kind: "loc",
				code: "0179"
			},
			{
				kind: "loc",
				code: "0178"
			},
			{
				kind: "loc",
				code: "0177"
			},
			{
				kind: "loc",
				code: "0176"
			},
			{
				kind: "loc",
				code: "0175"
			},
			{
				kind: "loc",
				code: "0174"
			},
			{
				kind: "loc",
				code: "0173"
			},
			{
				kind: "loc",
				code: "0172"
			},
			{
				kind: "loc",
				code: "0171"
			},
			{
				kind: "loc",
				code: "0170"
			},
			{
				kind: "loc",
				code: "0169"
			},
			{
				kind: "loc",
				code: "0168"
			},
			{
				kind: "loc",
				code: "0167"
			},
			{
				kind: "loc",
				code: "0166"
			},
			{
				kind: "loc",
				code: "0165"
			},
			{
				kind: "loc",
				code: "0164"
			},
			{
				kind: "loc",
				code: "0163"
			},
			{
				kind: "loc",
				code: "0162"
			},
			{
				kind: "loc",
				code: "0161"
			},
			{
				kind: "loc",
				code: "0160"
			},
			{
				kind: "loc",
				code: "0159"
			},
			{
				kind: "loc",
				code: "0158"
			},
			{
				kind: "loc",
				code: "0157"
			},
			{
				kind: "loc",
				code: "0156"
			},
			{
				kind: "loc",
				code: "0155"
			},
			{
				kind: "loc",
				code: "0154"
			},
			{
				kind: "loc",
				code: "0153"
			},
			{
				kind: "loc",
				code: "0152"
			},
			{
				kind: "loc",
				code: "0151"
			}
		]
	},
	{
		line: 2,
		left: [
			{
				kind: "loc",
				code: "0239"
			},
			{
				kind: "loc",
				code: "0238"
			},
			{
				kind: "loc",
				code: "0237"
			},
			{
				kind: "loc",
				code: "0236"
			},
			{
				kind: "loc",
				code: "0235"
			},
			{
				kind: "loc",
				code: "0234"
			},
			{
				kind: "loc",
				code: "0233"
			},
			{
				kind: "loc",
				code: "0232"
			},
			{
				kind: "loc",
				code: "0231"
			},
			{
				kind: "loc",
				code: "0230"
			},
			{
				kind: "loc",
				code: "0229"
			},
			{
				kind: "loc",
				code: "0228"
			},
			{
				kind: "loc",
				code: "0227"
			},
			{
				kind: "loc",
				code: "0226"
			},
			{
				kind: "loc",
				code: "0225"
			},
			{
				kind: "loc",
				code: "0224"
			},
			{
				kind: "loc",
				code: "0223"
			},
			{
				kind: "loc",
				code: "0222"
			},
			{
				kind: "loc",
				code: "0221"
			},
			{
				kind: "loc",
				code: "0220"
			},
			{
				kind: "loc",
				code: "0219"
			},
			{
				kind: "loc",
				code: "0218"
			},
			{
				kind: "loc",
				code: "0217"
			},
			{
				kind: "loc",
				code: "0216"
			},
			{
				kind: "loc",
				code: "0215"
			},
			{
				kind: "loc",
				code: "0214"
			},
			{
				kind: "loc",
				code: "0213"
			},
			{
				kind: "loc",
				code: "0212"
			},
			{
				kind: "loc",
				code: "0211"
			},
			{
				kind: "loc",
				code: "0210"
			},
			{
				kind: "loc",
				code: "0209"
			},
			{
				kind: "loc",
				code: "0208"
			},
			{
				kind: "loc",
				code: "0207"
			},
			{
				kind: "loc",
				code: "0206"
			},
			{
				kind: "loc",
				code: "0205"
			},
			{
				kind: "loc",
				code: "0204"
			},
			{
				kind: "loc",
				code: "0203"
			},
			{
				kind: "loc",
				code: "0202"
			},
			{
				kind: "loc",
				code: "0201"
			}
		],
		right: [
			{
				kind: "loc",
				code: "0289"
			},
			{
				kind: "loc",
				code: "0288"
			},
			{
				kind: "loc",
				code: "0287"
			},
			{
				kind: "loc",
				code: "0286"
			},
			{
				kind: "loc",
				code: "0285"
			},
			{
				kind: "loc",
				code: "0284"
			},
			{
				kind: "loc",
				code: "0283"
			},
			{
				kind: "loc",
				code: "0282"
			},
			{
				kind: "loc",
				code: "0281"
			},
			{
				kind: "loc",
				code: "0280"
			},
			{
				kind: "loc",
				code: "0279"
			},
			{
				kind: "loc",
				code: "0278"
			},
			{
				kind: "loc",
				code: "0277"
			},
			{
				kind: "loc",
				code: "0276"
			},
			{
				kind: "loc",
				code: "0275"
			},
			{
				kind: "loc",
				code: "0274"
			},
			{
				kind: "loc",
				code: "0273"
			},
			{
				kind: "loc",
				code: "0272"
			},
			{
				kind: "loc",
				code: "0271"
			},
			{
				kind: "loc",
				code: "0270"
			},
			{
				kind: "loc",
				code: "0269"
			},
			{
				kind: "loc",
				code: "0268"
			},
			{
				kind: "loc",
				code: "0267"
			},
			{
				kind: "loc",
				code: "0266"
			},
			{
				kind: "loc",
				code: "0265"
			},
			{
				kind: "loc",
				code: "0264"
			},
			{
				kind: "loc",
				code: "0263"
			},
			{
				kind: "loc",
				code: "0262"
			},
			{
				kind: "loc",
				code: "0261"
			},
			{
				kind: "loc",
				code: "0260"
			},
			{
				kind: "loc",
				code: "0259"
			},
			{
				kind: "loc",
				code: "0258"
			},
			{
				kind: "loc",
				code: "0257"
			},
			{
				kind: "loc",
				code: "0256"
			},
			{
				kind: "loc",
				code: "0255"
			},
			{
				kind: "loc",
				code: "0254"
			},
			{
				kind: "loc",
				code: "0253"
			},
			{
				kind: "loc",
				code: "0252"
			},
			{
				kind: "loc",
				code: "0251"
			}
		]
	},
	{
		line: 3,
		left: [
			{
				kind: "loc",
				code: "0337"
			},
			{
				kind: "loc",
				code: "0336"
			},
			{
				kind: "loc",
				code: "0335"
			},
			{
				kind: "loc",
				code: "0334"
			},
			{
				kind: "loc",
				code: "0333"
			},
			{
				kind: "loc",
				code: "0332"
			},
			{
				kind: "loc",
				code: "0331"
			},
			{
				kind: "loc",
				code: "0330"
			},
			{
				kind: "loc",
				code: "0329"
			},
			{
				kind: "loc",
				code: "0328"
			},
			{
				kind: "loc",
				code: "0327"
			},
			{
				kind: "loc",
				code: "0326"
			},
			{
				kind: "loc",
				code: "0325"
			},
			{
				kind: "loc",
				code: "0324"
			},
			{
				kind: "loc",
				code: "0323"
			},
			{
				kind: "loc",
				code: "0322"
			},
			{
				kind: "loc",
				code: "0321"
			},
			{
				kind: "loc",
				code: "0320"
			},
			{
				kind: "loc",
				code: "0319"
			},
			{
				kind: "pillar",
				span: 2
			},
			{
				kind: "loc",
				code: "0318"
			},
			{
				kind: "loc",
				code: "0317"
			},
			{
				kind: "loc",
				code: "0316"
			},
			{
				kind: "loc",
				code: "0315"
			},
			{
				kind: "loc",
				code: "0314"
			},
			{
				kind: "loc",
				code: "0313"
			},
			{
				kind: "loc",
				code: "0312"
			},
			{
				kind: "loc",
				code: "0311"
			},
			{
				kind: "loc",
				code: "0310"
			},
			{
				kind: "loc",
				code: "0309"
			},
			{
				kind: "loc",
				code: "0308"
			},
			{
				kind: "loc",
				code: "0307"
			},
			{
				kind: "loc",
				code: "0306"
			},
			{
				kind: "loc",
				code: "0305"
			},
			{
				kind: "loc",
				code: "0304"
			},
			{
				kind: "loc",
				code: "0303"
			},
			{
				kind: "loc",
				code: "0302"
			},
			{
				kind: "loc",
				code: "0301"
			}
		],
		right: [
			{
				kind: "loc",
				code: "0389"
			},
			{
				kind: "loc",
				code: "0388"
			},
			{
				kind: "loc",
				code: "0387"
			},
			{
				kind: "loc",
				code: "0386"
			},
			{
				kind: "loc",
				code: "0385"
			},
			{
				kind: "loc",
				code: "0384"
			},
			{
				kind: "loc",
				code: "0383"
			},
			{
				kind: "loc",
				code: "0382"
			},
			{
				kind: "loc",
				code: "0381"
			},
			{
				kind: "loc",
				code: "0380"
			},
			{
				kind: "loc",
				code: "0379"
			},
			{
				kind: "loc",
				code: "0378"
			},
			{
				kind: "loc",
				code: "0377"
			},
			{
				kind: "loc",
				code: "0376"
			},
			{
				kind: "loc",
				code: "0375"
			},
			{
				kind: "loc",
				code: "0374"
			},
			{
				kind: "loc",
				code: "0373"
			},
			{
				kind: "loc",
				code: "0372"
			},
			{
				kind: "loc",
				code: "0371"
			},
			{
				kind: "loc",
				code: "0370"
			},
			{
				kind: "loc",
				code: "0369"
			},
			{
				kind: "loc",
				code: "0368"
			},
			{
				kind: "loc",
				code: "0367"
			},
			{
				kind: "loc",
				code: "0366"
			},
			{
				kind: "loc",
				code: "0365"
			},
			{
				kind: "loc",
				code: "0364"
			},
			{
				kind: "loc",
				code: "0363"
			},
			{
				kind: "loc",
				code: "0362"
			},
			{
				kind: "loc",
				code: "0361"
			},
			{
				kind: "loc",
				code: "0360"
			},
			{
				kind: "loc",
				code: "0359"
			},
			{
				kind: "loc",
				code: "0358"
			},
			{
				kind: "loc",
				code: "0357"
			},
			{
				kind: "loc",
				code: "0356"
			},
			{
				kind: "loc",
				code: "0355"
			},
			{
				kind: "loc",
				code: "0354"
			},
			{
				kind: "loc",
				code: "0353"
			},
			{
				kind: "loc",
				code: "0352"
			},
			{
				kind: "loc",
				code: "0351"
			}
		]
	},
	{
		line: 4,
		left: [
			{
				kind: "loc",
				code: "0439"
			},
			{
				kind: "loc",
				code: "0438"
			},
			{
				kind: "loc",
				code: "0437"
			},
			{
				kind: "loc",
				code: "0436"
			},
			{
				kind: "loc",
				code: "0435"
			},
			{
				kind: "loc",
				code: "0434"
			},
			{
				kind: "loc",
				code: "0433"
			},
			{
				kind: "loc",
				code: "0432"
			},
			{
				kind: "loc",
				code: "0431"
			},
			{
				kind: "loc",
				code: "0430"
			},
			{
				kind: "loc",
				code: "0429"
			},
			{
				kind: "loc",
				code: "0428"
			},
			{
				kind: "loc",
				code: "0427"
			},
			{
				kind: "loc",
				code: "0426"
			},
			{
				kind: "loc",
				code: "0425"
			},
			{
				kind: "loc",
				code: "0424"
			},
			{
				kind: "loc",
				code: "0423"
			},
			{
				kind: "loc",
				code: "0422"
			},
			{
				kind: "loc",
				code: "0421"
			},
			{
				kind: "loc",
				code: "0420"
			},
			{
				kind: "loc",
				code: "0419"
			},
			{
				kind: "loc",
				code: "0418"
			},
			{
				kind: "loc",
				code: "0417"
			},
			{
				kind: "loc",
				code: "0416"
			},
			{
				kind: "loc",
				code: "0415"
			},
			{
				kind: "loc",
				code: "0414"
			},
			{
				kind: "loc",
				code: "0413"
			},
			{
				kind: "loc",
				code: "0412"
			},
			{
				kind: "loc",
				code: "0411"
			},
			{
				kind: "loc",
				code: "0410"
			},
			{
				kind: "loc",
				code: "0409"
			},
			{
				kind: "loc",
				code: "0408"
			},
			{
				kind: "loc",
				code: "0407"
			},
			{
				kind: "loc",
				code: "0406"
			},
			{
				kind: "loc",
				code: "0405"
			},
			{
				kind: "loc",
				code: "0404"
			},
			{
				kind: "loc",
				code: "0403"
			},
			{
				kind: "loc",
				code: "0402"
			},
			{
				kind: "loc",
				code: "0401"
			}
		],
		right: [
			{
				kind: "loc",
				code: "0489"
			},
			{
				kind: "loc",
				code: "0488"
			},
			{
				kind: "loc",
				code: "0487"
			},
			{
				kind: "loc",
				code: "0486"
			},
			{
				kind: "loc",
				code: "0485"
			},
			{
				kind: "loc",
				code: "0484"
			},
			{
				kind: "loc",
				code: "0483"
			},
			{
				kind: "loc",
				code: "0482"
			},
			{
				kind: "loc",
				code: "0481"
			},
			{
				kind: "loc",
				code: "0480"
			},
			{
				kind: "loc",
				code: "0479"
			},
			{
				kind: "loc",
				code: "0478"
			},
			{
				kind: "loc",
				code: "0477"
			},
			{
				kind: "loc",
				code: "0476"
			},
			{
				kind: "loc",
				code: "0475"
			},
			{
				kind: "loc",
				code: "0474"
			},
			{
				kind: "loc",
				code: "0473"
			},
			{
				kind: "loc",
				code: "0472"
			},
			{
				kind: "loc",
				code: "0471"
			},
			{
				kind: "loc",
				code: "0470"
			},
			{
				kind: "loc",
				code: "0469"
			},
			{
				kind: "loc",
				code: "0468"
			},
			{
				kind: "loc",
				code: "0467"
			},
			{
				kind: "loc",
				code: "0466"
			},
			{
				kind: "loc",
				code: "0465"
			},
			{
				kind: "loc",
				code: "0464"
			},
			{
				kind: "loc",
				code: "0463"
			},
			{
				kind: "loc",
				code: "0462"
			},
			{
				kind: "loc",
				code: "0461"
			},
			{
				kind: "loc",
				code: "0460"
			},
			{
				kind: "loc",
				code: "0459"
			},
			{
				kind: "loc",
				code: "0458"
			},
			{
				kind: "loc",
				code: "0457"
			},
			{
				kind: "loc",
				code: "0456"
			},
			{
				kind: "loc",
				code: "0455"
			},
			{
				kind: "loc",
				code: "0454"
			},
			{
				kind: "loc",
				code: "0453"
			},
			{
				kind: "loc",
				code: "0452"
			},
			{
				kind: "loc",
				code: "0451"
			}
		]
	},
	{
		line: 5,
		left: [
			{
				kind: "loc",
				code: "0539"
			},
			{
				kind: "loc",
				code: "0538"
			},
			{
				kind: "loc",
				code: "0537"
			},
			{
				kind: "loc",
				code: "0536"
			},
			{
				kind: "loc",
				code: "0535"
			},
			{
				kind: "loc",
				code: "0534"
			},
			{
				kind: "loc",
				code: "0533"
			},
			{
				kind: "loc",
				code: "0532"
			},
			{
				kind: "loc",
				code: "0531"
			},
			{
				kind: "loc",
				code: "0530"
			},
			{
				kind: "loc",
				code: "0529"
			},
			{
				kind: "loc",
				code: "0528"
			},
			{
				kind: "loc",
				code: "0527"
			},
			{
				kind: "loc",
				code: "0526"
			},
			{
				kind: "loc",
				code: "0525"
			},
			{
				kind: "loc",
				code: "0524"
			},
			{
				kind: "loc",
				code: "0523"
			},
			{
				kind: "loc",
				code: "0522"
			},
			{
				kind: "loc",
				code: "0521"
			},
			{
				kind: "loc",
				code: "0520"
			},
			{
				kind: "loc",
				code: "0519"
			},
			{
				kind: "loc",
				code: "0518"
			},
			{
				kind: "loc",
				code: "0517"
			},
			{
				kind: "loc",
				code: "0516"
			},
			{
				kind: "loc",
				code: "0515"
			},
			{
				kind: "loc",
				code: "0514"
			},
			{
				kind: "loc",
				code: "0513"
			},
			{
				kind: "loc",
				code: "0512"
			},
			{
				kind: "loc",
				code: "0511"
			},
			{
				kind: "loc",
				code: "0510"
			},
			{
				kind: "loc",
				code: "0509"
			},
			{
				kind: "loc",
				code: "0508"
			},
			{
				kind: "loc",
				code: "0507"
			},
			{
				kind: "loc",
				code: "0506"
			},
			{
				kind: "loc",
				code: "0505"
			},
			{
				kind: "loc",
				code: "0504"
			},
			{
				kind: "loc",
				code: "0503"
			},
			{
				kind: "loc",
				code: "0502"
			},
			{
				kind: "loc",
				code: "0501"
			}
		],
		right: [
			{
				kind: "loc",
				code: "0589"
			},
			{
				kind: "loc",
				code: "0588"
			},
			{
				kind: "loc",
				code: "0587"
			},
			{
				kind: "loc",
				code: "0586"
			},
			{
				kind: "loc",
				code: "0585"
			},
			{
				kind: "loc",
				code: "0584"
			},
			{
				kind: "loc",
				code: "0583"
			},
			{
				kind: "loc",
				code: "0582"
			},
			{
				kind: "loc",
				code: "0581"
			},
			{
				kind: "loc",
				code: "0580"
			},
			{
				kind: "loc",
				code: "0579"
			},
			{
				kind: "loc",
				code: "0578"
			},
			{
				kind: "loc",
				code: "0577"
			},
			{
				kind: "loc",
				code: "0576"
			},
			{
				kind: "loc",
				code: "0575"
			},
			{
				kind: "loc",
				code: "0574"
			},
			{
				kind: "loc",
				code: "0573"
			},
			{
				kind: "loc",
				code: "0572"
			},
			{
				kind: "loc",
				code: "0571"
			},
			{
				kind: "loc",
				code: "0570"
			},
			{
				kind: "loc",
				code: "0569"
			},
			{
				kind: "loc",
				code: "0568"
			},
			{
				kind: "loc",
				code: "0567"
			},
			{
				kind: "loc",
				code: "0566"
			},
			{
				kind: "loc",
				code: "0565"
			},
			{
				kind: "loc",
				code: "0564"
			},
			{
				kind: "loc",
				code: "0563"
			},
			{
				kind: "loc",
				code: "0562"
			},
			{
				kind: "loc",
				code: "0561"
			},
			{
				kind: "loc",
				code: "0560"
			},
			{
				kind: "loc",
				code: "0559"
			},
			{
				kind: "loc",
				code: "0558"
			},
			{
				kind: "loc",
				code: "0557"
			},
			{
				kind: "loc",
				code: "0556"
			},
			{
				kind: "loc",
				code: "0555"
			},
			{
				kind: "loc",
				code: "0554"
			},
			{
				kind: "loc",
				code: "0553"
			},
			{
				kind: "loc",
				code: "0552"
			},
			{
				kind: "loc",
				code: "0551"
			}
		]
	},
	{
		line: 6,
		left: [
			{
				kind: "loc",
				code: "0639"
			},
			{
				kind: "loc",
				code: "0638"
			},
			{
				kind: "loc",
				code: "0637"
			},
			{
				kind: "loc",
				code: "0636"
			},
			{
				kind: "loc",
				code: "0635"
			},
			{
				kind: "loc",
				code: "0634"
			},
			{
				kind: "loc",
				code: "0633"
			},
			{
				kind: "loc",
				code: "0632"
			},
			{
				kind: "loc",
				code: "0631"
			},
			{
				kind: "loc",
				code: "0630"
			},
			{
				kind: "loc",
				code: "0629"
			},
			{
				kind: "loc",
				code: "0628"
			},
			{
				kind: "loc",
				code: "0627"
			},
			{
				kind: "loc",
				code: "0626"
			},
			{
				kind: "loc",
				code: "0625"
			},
			{
				kind: "loc",
				code: "0624"
			},
			{
				kind: "loc",
				code: "0623"
			},
			{
				kind: "loc",
				code: "0622"
			},
			{
				kind: "loc",
				code: "0621"
			},
			{
				kind: "loc",
				code: "0620"
			},
			{
				kind: "loc",
				code: "0619"
			},
			{
				kind: "loc",
				code: "0618"
			},
			{
				kind: "loc",
				code: "0617"
			},
			{
				kind: "loc",
				code: "0616"
			},
			{
				kind: "loc",
				code: "0615"
			},
			{
				kind: "loc",
				code: "0614"
			},
			{
				kind: "loc",
				code: "0613"
			},
			{
				kind: "loc",
				code: "0612"
			},
			{
				kind: "loc",
				code: "0611"
			},
			{
				kind: "loc",
				code: "0610"
			},
			{
				kind: "loc",
				code: "0609"
			},
			{
				kind: "loc",
				code: "0608"
			},
			{
				kind: "loc",
				code: "0607"
			},
			{
				kind: "loc",
				code: "0606"
			},
			{
				kind: "loc",
				code: "0605"
			},
			{
				kind: "loc",
				code: "0604"
			},
			{
				kind: "loc",
				code: "0603"
			},
			{
				kind: "loc",
				code: "0602"
			},
			{
				kind: "loc",
				code: "0601"
			}
		],
		right: [
			{
				kind: "loc",
				code: "0689"
			},
			{
				kind: "loc",
				code: "0688"
			},
			{
				kind: "loc",
				code: "0687"
			},
			{
				kind: "loc",
				code: "0686"
			},
			{
				kind: "loc",
				code: "0685"
			},
			{
				kind: "loc",
				code: "0684"
			},
			{
				kind: "loc",
				code: "0683"
			},
			{
				kind: "loc",
				code: "0682"
			},
			{
				kind: "loc",
				code: "0681"
			},
			{
				kind: "loc",
				code: "0680"
			},
			{
				kind: "loc",
				code: "0679"
			},
			{
				kind: "loc",
				code: "0678"
			},
			{
				kind: "loc",
				code: "0677"
			},
			{
				kind: "loc",
				code: "0676"
			},
			{
				kind: "loc",
				code: "0675"
			},
			{
				kind: "loc",
				code: "0674"
			},
			{
				kind: "loc",
				code: "0673"
			},
			{
				kind: "loc",
				code: "0672"
			},
			{
				kind: "loc",
				code: "0671"
			},
			{
				kind: "loc",
				code: "0670"
			},
			{
				kind: "loc",
				code: "0669"
			},
			{
				kind: "loc",
				code: "0668"
			},
			{
				kind: "loc",
				code: "0667"
			},
			{
				kind: "loc",
				code: "0666"
			},
			{
				kind: "loc",
				code: "0665"
			},
			{
				kind: "loc",
				code: "0664"
			},
			{
				kind: "loc",
				code: "0663"
			},
			{
				kind: "loc",
				code: "0662"
			},
			{
				kind: "loc",
				code: "0661"
			},
			{
				kind: "loc",
				code: "0660"
			},
			{
				kind: "loc",
				code: "0659"
			},
			{
				kind: "loc",
				code: "0658"
			},
			{
				kind: "loc",
				code: "0657"
			},
			{
				kind: "loc",
				code: "0656"
			},
			{
				kind: "loc",
				code: "0655"
			},
			{
				kind: "loc",
				code: "0654"
			},
			{
				kind: "loc",
				code: "0653"
			},
			{
				kind: "loc",
				code: "0652"
			},
			{
				kind: "loc",
				code: "0651"
			}
		]
	},
	{
		line: 7,
		left: [
			{
				kind: "loc",
				code: "0739"
			},
			{
				kind: "loc",
				code: "0738"
			},
			{
				kind: "loc",
				code: "0737"
			},
			{
				kind: "loc",
				code: "0736"
			},
			{
				kind: "loc",
				code: "0735"
			},
			{
				kind: "loc",
				code: "0734"
			},
			{
				kind: "loc",
				code: "0733"
			},
			{
				kind: "loc",
				code: "0732"
			},
			{
				kind: "loc",
				code: "0731"
			},
			{
				kind: "loc",
				code: "0730"
			},
			{
				kind: "loc",
				code: "0729"
			},
			{
				kind: "loc",
				code: "0728"
			},
			{
				kind: "loc",
				code: "0727"
			},
			{
				kind: "loc",
				code: "0726"
			},
			{
				kind: "loc",
				code: "0725"
			},
			{
				kind: "loc",
				code: "0724"
			},
			{
				kind: "loc",
				code: "0723"
			},
			{
				kind: "loc",
				code: "0722"
			},
			{
				kind: "loc",
				code: "0721"
			},
			{
				kind: "loc",
				code: "0720"
			},
			{
				kind: "loc",
				code: "0719"
			},
			{
				kind: "loc",
				code: "0718"
			},
			{
				kind: "loc",
				code: "0717"
			},
			{
				kind: "loc",
				code: "0716"
			},
			{
				kind: "loc",
				code: "0715"
			},
			{
				kind: "loc",
				code: "0714"
			},
			{
				kind: "loc",
				code: "0713"
			},
			{
				kind: "loc",
				code: "0712"
			},
			{
				kind: "loc",
				code: "0711"
			},
			{
				kind: "loc",
				code: "0710"
			},
			{
				kind: "loc",
				code: "0709"
			},
			{
				kind: "loc",
				code: "0708"
			},
			{
				kind: "loc",
				code: "0707"
			},
			{
				kind: "loc",
				code: "0706"
			},
			{
				kind: "loc",
				code: "0705"
			},
			{
				kind: "loc",
				code: "0704"
			},
			{
				kind: "loc",
				code: "0703"
			},
			{
				kind: "loc",
				code: "0702"
			},
			{
				kind: "loc",
				code: "0701"
			}
		],
		right: [
			{
				kind: "loc",
				code: "0789"
			},
			{
				kind: "loc",
				code: "0788"
			},
			{
				kind: "loc",
				code: "0787"
			},
			{
				kind: "loc",
				code: "0786"
			},
			{
				kind: "loc",
				code: "0785"
			},
			{
				kind: "loc",
				code: "0784"
			},
			{
				kind: "loc",
				code: "0783"
			},
			{
				kind: "loc",
				code: "0782"
			},
			{
				kind: "loc",
				code: "0781"
			},
			{
				kind: "loc",
				code: "0780"
			},
			{
				kind: "loc",
				code: "0779"
			},
			{
				kind: "loc",
				code: "0778"
			},
			{
				kind: "loc",
				code: "0777"
			},
			{
				kind: "loc",
				code: "0776"
			},
			{
				kind: "loc",
				code: "0775"
			},
			{
				kind: "loc",
				code: "0774"
			},
			{
				kind: "loc",
				code: "0773"
			},
			{
				kind: "loc",
				code: "0772"
			},
			{
				kind: "loc",
				code: "0771"
			},
			{
				kind: "loc",
				code: "0770"
			},
			{
				kind: "loc",
				code: "0769"
			},
			{
				kind: "loc",
				code: "0768"
			},
			{
				kind: "loc",
				code: "0767"
			},
			{
				kind: "loc",
				code: "0766"
			},
			{
				kind: "loc",
				code: "0765"
			},
			{
				kind: "loc",
				code: "0764"
			},
			{
				kind: "loc",
				code: "0763"
			},
			{
				kind: "loc",
				code: "0762"
			},
			{
				kind: "loc",
				code: "0761"
			},
			{
				kind: "loc",
				code: "0760"
			},
			{
				kind: "loc",
				code: "0759"
			},
			{
				kind: "loc",
				code: "0758"
			},
			{
				kind: "loc",
				code: "0757"
			},
			{
				kind: "loc",
				code: "0756"
			},
			{
				kind: "loc",
				code: "0755"
			},
			{
				kind: "loc",
				code: "0754"
			},
			{
				kind: "loc",
				code: "0753"
			},
			{
				kind: "loc",
				code: "0752"
			},
			{
				kind: "loc",
				code: "0751"
			}
		]
	},
	{
		line: 8,
		left: [
			{
				kind: "loc",
				code: "0839"
			},
			{
				kind: "loc",
				code: "0838"
			},
			{
				kind: "loc",
				code: "0837"
			},
			{
				kind: "loc",
				code: "0836"
			},
			{
				kind: "loc",
				code: "0835"
			},
			{
				kind: "loc",
				code: "0834"
			},
			{
				kind: "loc",
				code: "0833"
			},
			{
				kind: "loc",
				code: "0832"
			},
			{
				kind: "loc",
				code: "0831"
			},
			{
				kind: "loc",
				code: "0830"
			},
			{
				kind: "loc",
				code: "0829"
			},
			{
				kind: "loc",
				code: "0828"
			},
			{
				kind: "loc",
				code: "0827"
			},
			{
				kind: "loc",
				code: "0826"
			},
			{
				kind: "loc",
				code: "0825"
			},
			{
				kind: "loc",
				code: "0824"
			},
			{
				kind: "loc",
				code: "0823"
			},
			{
				kind: "loc",
				code: "0822"
			},
			{
				kind: "loc",
				code: "0821"
			},
			{
				kind: "loc",
				code: "0820"
			},
			{
				kind: "loc",
				code: "0819"
			},
			{
				kind: "loc",
				code: "0818"
			},
			{
				kind: "loc",
				code: "0817"
			},
			{
				kind: "loc",
				code: "0816"
			},
			{
				kind: "loc",
				code: "0815"
			},
			{
				kind: "loc",
				code: "0814"
			},
			{
				kind: "loc",
				code: "0813"
			},
			{
				kind: "loc",
				code: "0812"
			},
			{
				kind: "loc",
				code: "0811"
			},
			{
				kind: "loc",
				code: "0810"
			},
			{
				kind: "loc",
				code: "0809"
			},
			{
				kind: "loc",
				code: "0808"
			},
			{
				kind: "loc",
				code: "0807"
			},
			{
				kind: "loc",
				code: "0806"
			},
			{
				kind: "loc",
				code: "0805"
			},
			{
				kind: "loc",
				code: "0804"
			},
			{
				kind: "loc",
				code: "0803"
			},
			{
				kind: "loc",
				code: "0802"
			},
			{
				kind: "loc",
				code: "0801"
			}
		],
		right: [
			{ kind: "blank" },
			{ kind: "blank" },
			{ kind: "blank" },
			{ kind: "blank" },
			{ kind: "blank" },
			{ kind: "blank" },
			{ kind: "blank" },
			{ kind: "blank" },
			{ kind: "blank" },
			{ kind: "blank" },
			{ kind: "blank" },
			{ kind: "blank" },
			{ kind: "blank" },
			{
				kind: "loc",
				code: "0876"
			},
			{
				kind: "loc",
				code: "0875"
			},
			{
				kind: "loc",
				code: "0874"
			},
			{
				kind: "loc",
				code: "0873"
			},
			{
				kind: "loc",
				code: "0872"
			},
			{
				kind: "loc",
				code: "0871"
			},
			{
				kind: "loc",
				code: "0870"
			},
			{
				kind: "loc",
				code: "0869"
			},
			{
				kind: "loc",
				code: "0868"
			},
			{
				kind: "loc",
				code: "0867"
			},
			{
				kind: "loc",
				code: "0866"
			},
			{
				kind: "loc",
				code: "0865"
			},
			{
				kind: "loc",
				code: "0864"
			},
			{
				kind: "loc",
				code: "0863"
			},
			{
				kind: "loc",
				code: "0862"
			},
			{
				kind: "loc",
				code: "0861"
			},
			{
				kind: "loc",
				code: "0860"
			},
			{
				kind: "loc",
				code: "0859"
			},
			{
				kind: "loc",
				code: "0858"
			},
			{
				kind: "loc",
				code: "0857"
			},
			{
				kind: "loc",
				code: "0856"
			},
			{
				kind: "loc",
				code: "0855"
			},
			{
				kind: "loc",
				code: "0854"
			},
			{
				kind: "loc",
				code: "0853"
			},
			{
				kind: "loc",
				code: "0852"
			},
			{
				kind: "loc",
				code: "0851"
			}
		]
	}
];
var CENTER_3_LAYOUT = [
	{
		line: 1,
		left: [
			{
				kind: "loc",
				code: "0139"
			},
			{
				kind: "loc",
				code: "0138"
			},
			{
				kind: "loc",
				code: "0137"
			},
			{
				kind: "loc",
				code: "0136"
			},
			{
				kind: "loc",
				code: "0135"
			},
			{
				kind: "loc",
				code: "0134"
			},
			{
				kind: "loc",
				code: "0133"
			},
			{
				kind: "loc",
				code: "0132"
			},
			{
				kind: "loc",
				code: "0131"
			},
			{
				kind: "loc",
				code: "0130"
			},
			{
				kind: "loc",
				code: "0129"
			},
			{
				kind: "loc",
				code: "0128"
			},
			{
				kind: "loc",
				code: "0127"
			},
			{
				kind: "loc",
				code: "0126"
			},
			{
				kind: "loc",
				code: "0125"
			},
			{
				kind: "loc",
				code: "0124"
			},
			{
				kind: "loc",
				code: "0123"
			},
			{
				kind: "loc",
				code: "0122"
			},
			{
				kind: "loc",
				code: "0121"
			},
			{
				kind: "loc",
				code: "0120"
			},
			{
				kind: "loc",
				code: "0119"
			},
			{
				kind: "loc",
				code: "0118"
			},
			{
				kind: "loc",
				code: "0117"
			},
			{
				kind: "loc",
				code: "0116"
			},
			{
				kind: "loc",
				code: "0115"
			},
			{
				kind: "loc",
				code: "0114"
			},
			{
				kind: "loc",
				code: "0113"
			},
			{
				kind: "loc",
				code: "0112"
			},
			{
				kind: "loc",
				code: "0111"
			},
			{
				kind: "loc",
				code: "0110"
			},
			{
				kind: "loc",
				code: "0109"
			},
			{
				kind: "loc",
				code: "0108"
			},
			{
				kind: "loc",
				code: "0107"
			},
			{
				kind: "loc",
				code: "0106"
			},
			{
				kind: "loc",
				code: "0105"
			},
			{
				kind: "loc",
				code: "0104"
			},
			{
				kind: "loc",
				code: "0103"
			},
			{
				kind: "loc",
				code: "0102"
			},
			{
				kind: "loc",
				code: "0101"
			}
		],
		right: [
			{
				kind: "loc",
				code: "0189"
			},
			{
				kind: "loc",
				code: "0188"
			},
			{
				kind: "loc",
				code: "0187"
			},
			{
				kind: "loc",
				code: "0186"
			},
			{
				kind: "loc",
				code: "0185"
			},
			{
				kind: "loc",
				code: "0184"
			},
			{
				kind: "loc",
				code: "0183"
			},
			{
				kind: "loc",
				code: "0182"
			},
			{
				kind: "loc",
				code: "0181"
			},
			{
				kind: "loc",
				code: "0180"
			},
			{
				kind: "loc",
				code: "0179"
			},
			{
				kind: "loc",
				code: "0178"
			},
			{
				kind: "loc",
				code: "0177"
			},
			{
				kind: "loc",
				code: "0176"
			},
			{
				kind: "loc",
				code: "0175"
			},
			{
				kind: "loc",
				code: "0174"
			},
			{
				kind: "loc",
				code: "0173"
			},
			{
				kind: "loc",
				code: "0172"
			},
			{
				kind: "loc",
				code: "0171"
			},
			{
				kind: "loc",
				code: "0170"
			},
			{
				kind: "loc",
				code: "0169"
			},
			{
				kind: "loc",
				code: "0168"
			},
			{
				kind: "loc",
				code: "0167"
			},
			{
				kind: "loc",
				code: "0166"
			},
			{
				kind: "loc",
				code: "0165"
			},
			{
				kind: "loc",
				code: "0164"
			},
			{
				kind: "loc",
				code: "0163"
			},
			{
				kind: "loc",
				code: "0162"
			},
			{
				kind: "loc",
				code: "0161"
			},
			{
				kind: "loc",
				code: "0160"
			},
			{
				kind: "loc",
				code: "0159"
			},
			{
				kind: "loc",
				code: "0158"
			},
			{
				kind: "loc",
				code: "0157"
			},
			{
				kind: "loc",
				code: "0156"
			},
			{
				kind: "loc",
				code: "0155"
			},
			{
				kind: "loc",
				code: "0154"
			},
			{
				kind: "loc",
				code: "0153"
			},
			{
				kind: "loc",
				code: "0152"
			},
			{
				kind: "loc",
				code: "0151"
			}
		]
	},
	{
		line: 2,
		left: [
			{
				kind: "loc",
				code: "0239"
			},
			{
				kind: "loc",
				code: "0238"
			},
			{
				kind: "loc",
				code: "0237"
			},
			{
				kind: "loc",
				code: "0236"
			},
			{
				kind: "loc",
				code: "0235"
			},
			{
				kind: "loc",
				code: "0234"
			},
			{
				kind: "loc",
				code: "0233"
			},
			{
				kind: "loc",
				code: "0232"
			},
			{
				kind: "loc",
				code: "0231"
			},
			{
				kind: "loc",
				code: "0230"
			},
			{
				kind: "loc",
				code: "0229"
			},
			{
				kind: "loc",
				code: "0228"
			},
			{
				kind: "loc",
				code: "0227"
			},
			{
				kind: "loc",
				code: "0226"
			},
			{
				kind: "loc",
				code: "0225"
			},
			{
				kind: "loc",
				code: "0224"
			},
			{
				kind: "loc",
				code: "0223"
			},
			{
				kind: "loc",
				code: "0222"
			},
			{
				kind: "loc",
				code: "0221"
			},
			{
				kind: "loc",
				code: "0220"
			},
			{
				kind: "loc",
				code: "0219"
			},
			{
				kind: "loc",
				code: "0218"
			},
			{
				kind: "loc",
				code: "0217"
			},
			{
				kind: "loc",
				code: "0216"
			},
			{
				kind: "loc",
				code: "0215"
			},
			{
				kind: "loc",
				code: "0214"
			},
			{
				kind: "loc",
				code: "0213"
			},
			{
				kind: "loc",
				code: "0212"
			},
			{
				kind: "loc",
				code: "0211"
			},
			{
				kind: "loc",
				code: "0210"
			},
			{
				kind: "loc",
				code: "0209"
			},
			{
				kind: "loc",
				code: "0208"
			},
			{
				kind: "loc",
				code: "0207"
			},
			{
				kind: "loc",
				code: "0206"
			},
			{
				kind: "loc",
				code: "0205"
			},
			{
				kind: "loc",
				code: "0204"
			},
			{
				kind: "loc",
				code: "0203"
			},
			{
				kind: "loc",
				code: "0202"
			},
			{
				kind: "loc",
				code: "0201"
			}
		],
		right: [
			{
				kind: "loc",
				code: "0287"
			},
			{
				kind: "loc",
				code: "0286"
			},
			{
				kind: "loc",
				code: "0285"
			},
			{
				kind: "loc",
				code: "0284"
			},
			{
				kind: "loc",
				code: "0283"
			},
			{
				kind: "loc",
				code: "0282"
			},
			{
				kind: "loc",
				code: "0281"
			},
			{
				kind: "loc",
				code: "0280"
			},
			{
				kind: "loc",
				code: "0279"
			},
			{
				kind: "loc",
				code: "0278"
			},
			{
				kind: "loc",
				code: "0277"
			},
			{
				kind: "loc",
				code: "0276"
			},
			{
				kind: "loc",
				code: "0275"
			},
			{
				kind: "loc",
				code: "0274"
			},
			{
				kind: "loc",
				code: "0273"
			},
			{
				kind: "loc",
				code: "0272"
			},
			{
				kind: "loc",
				code: "0271"
			},
			{
				kind: "loc",
				code: "0270"
			},
			{
				kind: "loc",
				code: "0269"
			},
			{
				kind: "loc",
				code: "0268"
			},
			{
				kind: "loc",
				code: "0267"
			},
			{
				kind: "loc",
				code: "0266"
			},
			{
				kind: "loc",
				code: "0265"
			},
			{
				kind: "loc",
				code: "0264"
			},
			{
				kind: "loc",
				code: "0263"
			},
			{
				kind: "loc",
				code: "0262"
			},
			{
				kind: "pillar",
				span: 2
			},
			{
				kind: "loc",
				code: "0261"
			},
			{
				kind: "loc",
				code: "0260"
			},
			{
				kind: "loc",
				code: "0259"
			},
			{
				kind: "loc",
				code: "0258"
			},
			{
				kind: "loc",
				code: "0257"
			},
			{
				kind: "loc",
				code: "0256"
			},
			{
				kind: "loc",
				code: "0255"
			},
			{
				kind: "loc",
				code: "0254"
			},
			{
				kind: "loc",
				code: "0253"
			},
			{
				kind: "loc",
				code: "0252"
			},
			{
				kind: "loc",
				code: "0251"
			}
		]
	},
	{
		line: 3,
		left: [
			{
				kind: "loc",
				code: "0339"
			},
			{
				kind: "loc",
				code: "0338"
			},
			{
				kind: "loc",
				code: "0337"
			},
			{
				kind: "loc",
				code: "0336"
			},
			{
				kind: "loc",
				code: "0335"
			},
			{
				kind: "loc",
				code: "0334"
			},
			{
				kind: "loc",
				code: "0333"
			},
			{
				kind: "loc",
				code: "0332"
			},
			{
				kind: "loc",
				code: "0331"
			},
			{
				kind: "loc",
				code: "0330"
			},
			{
				kind: "loc",
				code: "0329"
			},
			{
				kind: "loc",
				code: "0328"
			},
			{
				kind: "loc",
				code: "0327"
			},
			{
				kind: "loc",
				code: "0326"
			},
			{
				kind: "loc",
				code: "0325"
			},
			{
				kind: "loc",
				code: "0324"
			},
			{
				kind: "loc",
				code: "0323"
			},
			{
				kind: "loc",
				code: "0322"
			},
			{
				kind: "loc",
				code: "0321"
			},
			{
				kind: "loc",
				code: "0320"
			},
			{
				kind: "loc",
				code: "0319"
			},
			{
				kind: "loc",
				code: "0318"
			},
			{
				kind: "loc",
				code: "0317"
			},
			{
				kind: "loc",
				code: "0316"
			},
			{
				kind: "loc",
				code: "0315"
			},
			{
				kind: "loc",
				code: "0314"
			},
			{
				kind: "loc",
				code: "0313"
			},
			{
				kind: "loc",
				code: "0312"
			},
			{
				kind: "loc",
				code: "0311"
			},
			{
				kind: "loc",
				code: "0310"
			},
			{
				kind: "loc",
				code: "0309"
			},
			{
				kind: "loc",
				code: "0308"
			},
			{
				kind: "loc",
				code: "0307"
			},
			{
				kind: "loc",
				code: "0306"
			},
			{
				kind: "loc",
				code: "0305"
			},
			{
				kind: "loc",
				code: "0304"
			},
			{
				kind: "loc",
				code: "0303"
			},
			{
				kind: "loc",
				code: "0302"
			},
			{
				kind: "loc",
				code: "0301"
			}
		],
		right: [
			{
				kind: "loc",
				code: "0389"
			},
			{
				kind: "loc",
				code: "0388"
			},
			{
				kind: "loc",
				code: "0387"
			},
			{
				kind: "loc",
				code: "0386"
			},
			{
				kind: "loc",
				code: "0385"
			},
			{
				kind: "loc",
				code: "0384"
			},
			{
				kind: "loc",
				code: "0383"
			},
			{
				kind: "loc",
				code: "0382"
			},
			{
				kind: "loc",
				code: "0381"
			},
			{
				kind: "loc",
				code: "0380"
			},
			{
				kind: "loc",
				code: "0379"
			},
			{
				kind: "loc",
				code: "0378"
			},
			{
				kind: "loc",
				code: "0377"
			},
			{
				kind: "loc",
				code: "0376"
			},
			{
				kind: "loc",
				code: "0375"
			},
			{
				kind: "loc",
				code: "0374"
			},
			{
				kind: "loc",
				code: "0373"
			},
			{
				kind: "loc",
				code: "0372"
			},
			{
				kind: "loc",
				code: "0371"
			},
			{
				kind: "loc",
				code: "0370"
			},
			{
				kind: "loc",
				code: "0369"
			},
			{
				kind: "loc",
				code: "0368"
			},
			{
				kind: "loc",
				code: "0367"
			},
			{
				kind: "loc",
				code: "0366"
			},
			{
				kind: "loc",
				code: "0365"
			},
			{
				kind: "loc",
				code: "0364"
			},
			{
				kind: "loc",
				code: "0363"
			},
			{
				kind: "loc",
				code: "0362"
			},
			{
				kind: "loc",
				code: "0361"
			},
			{
				kind: "loc",
				code: "0360"
			},
			{
				kind: "loc",
				code: "0359"
			},
			{
				kind: "loc",
				code: "0358"
			},
			{
				kind: "loc",
				code: "0357"
			},
			{
				kind: "loc",
				code: "0356"
			},
			{
				kind: "loc",
				code: "0355"
			},
			{
				kind: "loc",
				code: "0354"
			},
			{
				kind: "loc",
				code: "0353"
			},
			{
				kind: "loc",
				code: "0352"
			},
			{
				kind: "loc",
				code: "0351"
			}
		]
	},
	{
		line: 4,
		left: [
			{
				kind: "loc",
				code: "0439"
			},
			{
				kind: "loc",
				code: "0438"
			},
			{
				kind: "loc",
				code: "0437"
			},
			{
				kind: "loc",
				code: "0436"
			},
			{
				kind: "loc",
				code: "0435"
			},
			{
				kind: "loc",
				code: "0434"
			},
			{
				kind: "loc",
				code: "0433"
			},
			{
				kind: "loc",
				code: "0432"
			},
			{
				kind: "loc",
				code: "0431"
			},
			{
				kind: "loc",
				code: "0430"
			},
			{
				kind: "loc",
				code: "0429"
			},
			{
				kind: "loc",
				code: "0428"
			},
			{
				kind: "loc",
				code: "0427"
			},
			{
				kind: "loc",
				code: "0426"
			},
			{
				kind: "loc",
				code: "0425"
			},
			{
				kind: "loc",
				code: "0424"
			},
			{
				kind: "loc",
				code: "0423"
			},
			{
				kind: "loc",
				code: "0422"
			},
			{
				kind: "loc",
				code: "0421"
			},
			{
				kind: "loc",
				code: "0420"
			},
			{
				kind: "loc",
				code: "0419"
			},
			{
				kind: "loc",
				code: "0418"
			},
			{
				kind: "loc",
				code: "0417"
			},
			{
				kind: "loc",
				code: "0416"
			},
			{
				kind: "loc",
				code: "0415"
			},
			{
				kind: "loc",
				code: "0414"
			},
			{
				kind: "loc",
				code: "0413"
			},
			{
				kind: "loc",
				code: "0412"
			},
			{
				kind: "loc",
				code: "0411"
			},
			{
				kind: "loc",
				code: "0410"
			},
			{
				kind: "loc",
				code: "0409"
			},
			{
				kind: "loc",
				code: "0408"
			},
			{
				kind: "loc",
				code: "0407"
			},
			{
				kind: "loc",
				code: "0406"
			},
			{
				kind: "loc",
				code: "0405"
			},
			{
				kind: "loc",
				code: "0404"
			},
			{
				kind: "loc",
				code: "0403"
			},
			{
				kind: "loc",
				code: "0402"
			},
			{
				kind: "loc",
				code: "0401"
			}
		],
		right: [
			{
				kind: "loc",
				code: "0489"
			},
			{
				kind: "loc",
				code: "0488"
			},
			{
				kind: "loc",
				code: "0487"
			},
			{
				kind: "loc",
				code: "0486"
			},
			{
				kind: "loc",
				code: "0485"
			},
			{
				kind: "loc",
				code: "0484"
			},
			{
				kind: "loc",
				code: "0483"
			},
			{
				kind: "loc",
				code: "0482"
			},
			{
				kind: "loc",
				code: "0481"
			},
			{
				kind: "loc",
				code: "0480"
			},
			{
				kind: "loc",
				code: "0479"
			},
			{
				kind: "loc",
				code: "0478"
			},
			{
				kind: "loc",
				code: "0477"
			},
			{
				kind: "loc",
				code: "0476"
			},
			{
				kind: "loc",
				code: "0475"
			},
			{
				kind: "loc",
				code: "0474"
			},
			{
				kind: "loc",
				code: "0473"
			},
			{
				kind: "loc",
				code: "0472"
			},
			{
				kind: "loc",
				code: "0471"
			},
			{
				kind: "loc",
				code: "0470"
			},
			{
				kind: "loc",
				code: "0469"
			},
			{
				kind: "loc",
				code: "0468"
			},
			{
				kind: "loc",
				code: "0467"
			},
			{
				kind: "loc",
				code: "0466"
			},
			{
				kind: "loc",
				code: "0465"
			},
			{
				kind: "loc",
				code: "0464"
			},
			{
				kind: "loc",
				code: "0463"
			},
			{
				kind: "loc",
				code: "0462"
			},
			{
				kind: "loc",
				code: "0461"
			},
			{
				kind: "loc",
				code: "0460"
			},
			{
				kind: "loc",
				code: "0459"
			},
			{
				kind: "loc",
				code: "0458"
			},
			{
				kind: "loc",
				code: "0457"
			},
			{
				kind: "loc",
				code: "0456"
			},
			{
				kind: "loc",
				code: "0455"
			},
			{
				kind: "loc",
				code: "0454"
			},
			{
				kind: "loc",
				code: "0453"
			},
			{
				kind: "loc",
				code: "0452"
			},
			{
				kind: "loc",
				code: "0451"
			}
		]
	}
];
function locSpan(from, to) {
	const high = Math.max(from, to);
	const low = Math.min(from, to);
	const slots = [];
	for (let n = high; n >= low; n -= 1) slots.push({
		kind: "loc",
		code: String(n).padStart(4, "0")
	});
	return slots;
}
function pocheonLine(line, leftFrom, leftTo, rightFrom, rightTo, spanTo = 0) {
	const left = locSpan(leftFrom, leftTo);
	const right = locSpan(rightFrom, rightTo);
	const span = Math.max(left.length, right.length, spanTo);
	const pad = (slots) => [...Array.from({ length: span - slots.length }, () => ({ kind: "blank" })), ...slots];
	return {
		line,
		left: pad(left),
		right: pad(right)
	};
}
var POCHEON_1_LAYOUT = [
	pocheonLine(1, 101, 152, 201, 252),
	pocheonLine(2, 301, 352, 401, 452),
	pocheonLine(3, 501, 552, 601, 652),
	pocheonLine(4, 701, 752, 801, 852),
	pocheonLine(5, 901, 952, 1001, 1052),
	pocheonLine(6, 1101, 1152, 1201, 1252)
];
var POCHEON_2_LAYOUT = [
	pocheonLine(1, 101, 152, 201, 252),
	pocheonLine(2, 301, 352, 401, 452),
	pocheonLine(3, 501, 552, 601, 652),
	pocheonLine(4, 701, 752, 801, 839),
	pocheonLine(5, 901, 939, 1001, 1039, 52),
	pocheonLine(6, 1101, 1139, 1201, 1239, 52)
];
function genericLine(line) {
	const base = line * 100;
	return {
		line,
		left: locSpan(base + 39, base + 1),
		right: locSpan(base + 89, base + 51)
	};
}
function builtin(site, center) {
	const base = site === "포천" ? center === "2센터" ? POCHEON_2_LAYOUT : POCHEON_1_LAYOUT : site === "신오산" && center === "3센터" ? CENTER_3_LAYOUT : CENTER_12_LAYOUT;
	const want = Math.max(1, Math.min(12, linesOf(site, center)));
	if (want === base.length) return base;
	if (want < base.length) return base.slice(0, want);
	const more = base.slice();
	for (let line = base.length + 1; line <= want; line += 1) more.push(site === "포천" ? pocheonLine(line, (line - 1) * 200 + 101, (line - 1) * 200 + 152, (line - 1) * 200 + 201, (line - 1) * 200 + 252) : genericLine(line));
	return more;
}
function fitSide(slots, target) {
	if (slots.length === target) return slots;
	if (slots.length > target) return slots.slice(slots.length - target);
	return [...Array.from({ length: target - slots.length }, () => ({ kind: "blank" })), ...slots];
}
function extendLine(site, prev, line) {
	const seed = site === "포천" ? pocheonLine(line, (line - 1) * 200 + 101, (line - 1) * 200 + 152, (line - 1) * 200 + 201, (line - 1) * 200 + 252) : genericLine(line);
	const last = prev[prev.length - 1];
	if (!last) return seed;
	return {
		line,
		left: fitSide(seed.left, last.left.length),
		right: fitSide(seed.right, last.right.length)
	};
}
var layoutKey = (site, center) => `${site}\t${center}`;
function tokenOf(slot) {
	if (slot.kind === "blank") return "-";
	if (slot.kind === "pillar") return "기둥";
	return slot.code;
}
function decodeToken(token) {
	if (token === "-" || token === "." || token === "빈칸") return { kind: "blank" };
	if (token === "기둥" || token === "*" || token.toLowerCase() === "pillar") return { kind: "pillar" };
	return {
		kind: "loc",
		code: token.slice(0, 12)
	};
}
function decodeSide(list) {
	const slots = (list ?? []).slice(0, 80).map((item) => decodeToken(String(item ?? "")));
	return slots.length > 0 ? slots : [{ kind: "blank" }];
}
function decodeLine(line) {
	return {
		line: line.line,
		left: decodeSide(line.left),
		right: decodeSide(line.right)
	};
}
function cleanLayouts(raw) {
	const next = {};
	if (!raw || typeof raw !== "object") return next;
	for (const [key, value] of Object.entries(raw)) {
		const [site, center] = key.split("	");
		if (!site || !/^([1-9]센터)$/.test(center ?? "")) continue;
		if (!Array.isArray(value)) continue;
		const lines = [];
		for (const item of value.slice(0, 12)) {
			if (!item || typeof item !== "object") continue;
			const row = item;
			const line = Math.round(Number(row.line));
			if (!line || line < 1 || line > 12) continue;
			lines.push({
				line,
				left: decodeSide(Array.isArray(row.left) ? row.left.map((item) => String(item ?? "")) : []).map(tokenOf),
				right: decodeSide(Array.isArray(row.right) ? row.right.map((item) => String(item ?? "")) : []).map(tokenOf)
			});
		}
		if (lines.length > 0) next[key] = lines;
	}
	return next;
}
var layouts = cleanLayouts(readPanel().layouts);
var layoutListeners = /* @__PURE__ */ new Set();
function emitLayouts() {
	layoutListeners.forEach((listener) => listener());
}
function subscribeLayouts(listener) {
	layoutListeners.add(listener);
	return () => layoutListeners.delete(listener);
}
function storedLines(site, center) {
	const rows = layouts[layoutKey(site, center)];
	if (!rows?.length) return null;
	return rows.map(decodeLine);
}
function sized(site, center, base) {
	const want = Math.max(1, Math.min(12, linesOf(site, center)));
	if (want === base.length) return base;
	if (want < base.length) return base.slice(0, want);
	const more = base.slice();
	for (let line = base.length + 1; line <= want; line += 1) more.push(extendLine(site, more, line));
	return more;
}
function layoutForSite(site, center) {
	const custom = storedLines(site, center);
	if (custom) return sized(site, center, custom);
	return builtin(site, center);
}
function drawnSlots(slots) {
	const drawn = [];
	for (let index = 0; index < slots.length; index += 1) {
		const slot = slots[index];
		if (slot.kind !== "pillar") {
			drawn.push({
				slot,
				index,
				span: 1
			});
			continue;
		}
		const start = index;
		while (index + 1 < slots.length && slots[index + 1]?.kind === "pillar") index += 1;
		drawn.push({
			slot: { kind: "pillar" },
			index: start,
			span: index - start + 1
		});
	}
	return drawn;
}
function pillarBox(span, big) {
	const count = Math.max(1, span);
	if (count === 1) return {
		className: big ? " h-11" : " h-9",
		style: void 0
	};
	return {
		className: "",
		style: { height: `calc(${big ? "2.75rem" : "2.25rem"} * ${count} + 0.125rem * ${count - 1})` }
	};
}
function locRange(fromText, toText) {
	const from = fromText.trim();
	const to = toText.trim();
	if (!/^\d{1,6}$/.test(from) || !/^\d{1,6}$/.test(to)) return null;
	const start = Number(from);
	const end = Number(to);
	const count = Math.abs(end - start) + 1;
	if (count < 1 || count > 80) return null;
	const width = Math.max(from.length, to.length);
	const step = start <= end ? 1 : -1;
	const slots = [];
	for (let n = start; step > 0 ? n <= end : n >= end; n += step) slots.push({
		kind: "loc",
		code: String(n).padStart(width, "0")
	});
	slots.reverse();
	return slots;
}
function layoutFor(center) {
	return layoutForSite(Nn(), center);
}
function remember(site, center, rows) {
	layouts = {
		...layouts,
		[layoutKey(site, center)]: rows.map((row) => ({
			line: row.line,
			left: row.left.map(tokenOf),
			right: row.right.map(tokenOf)
		}))
	};
	writePanel({ layouts });
	emitLayouts();
}
function setLayoutSlots(site, center, line, side, slots) {
	const rows = layoutForSite(site, center).map((row) => ({
		...row,
		left: row.left.slice(),
		right: row.right.slice()
	}));
	const index = rows.findIndex((row) => row.line === line);
	if (index < 0) return;
	const next = slots.slice(0, 80).map((slot) => slot.kind === "pillar" ? { kind: "pillar" } : slot.kind === "blank" ? { kind: "blank" } : {
		kind: "loc",
		code: slot.code.slice(0, 12)
	});
	const safe = next.length > 0 ? next : [{ kind: "blank" }];
	if (rows[index][side].map(tokenOf).join("\n") === safe.map(tokenOf).join("\n")) return;
	rows[index] = {
		...rows[index],
		[side]: safe
	};
	remember(site, center, rows);
}
function addLayoutLine(site, center) {
	const rows = layoutForSite(site, center);
	if (rows.length >= 12) return;
	setCenterLines(site, center, rows.length + 1);
	remember(site, center, [...rows, extendLine(site, rows, rows.length + 1)]);
}
function removeLayoutLine(site, center, line) {
	const rows = layoutForSite(site, center);
	if (rows.length <= 1) return;
	const next = rows.filter((row) => row.line !== line).map((row, index) => ({
		...row,
		line: index + 1
	}));
	setCenterLines(site, center, next.length);
	remember(site, center, next);
}
function resetLayout(site, center) {
	const key = layoutKey(site, center);
	if (!layouts[key]) return;
	const next = { ...layouts };
	delete next[key];
	layouts = next;
	writePanel({ layouts });
	emitLayouts();
}
onSharedPanel((state) => {
	if (!state.layouts || typeof state.layouts !== "object") return;
	const next = cleanLayouts(state.layouts);
	if (JSON.stringify(next) === JSON.stringify(layouts)) return;
	layouts = next;
	emitLayouts();
});
var OSHIP_DPTS = [
	"FF1편",
	"FF2편",
	"유제",
	"냉장",
	"냉동",
	"1차상품"
];
var DPT_BY_CODE = {
	"020": "FF1편",
	"024": "FF1편",
	"025": "FF1편",
	"026": "FF1편",
	"032": "FF1편",
	"111": "FF1편",
	"022": "FF2편",
	"030": "FF2편",
	"034": "FF2편",
	"040": "FF2편",
	"060": "유제",
	"061": "유제",
	"070": "냉장",
	"071": "냉장",
	"170": "냉장",
	"270": "냉장",
	"370": "냉장",
	"670": "냉장",
	"770": "냉장",
	"870": "냉장",
	"970": "냉장",
	"080": "냉동",
	"081": "냉동",
	"082": "냉동",
	"090": "냉동",
	"092": "냉동",
	"180": "냉동",
	"190": "1차상품",
	"191": "1차상품",
	"192": "1차상품",
	"193": "1차상품",
	"194": "1차상품",
	"195": "1차상품",
	"290": "1차상품"
};
function centerFromOshipName(name, fallback) {
	const marked = name.replace(/(\.(xlsx|xls))+$/i, "").match(/([123])\s*센터/);
	if (marked) return `${marked[1]}센터`;
	return fallback;
}
function num$1(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	const text = String(value ?? "").replace(/,/g, "").trim();
	if (!text) return 0;
	const parsed = Number(text);
	return Number.isFinite(parsed) ? parsed : 0;
}
function text(value) {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		const month = String(value.getMonth() + 1).padStart(2, "0");
		const day = String(value.getDate()).padStart(2, "0");
		return `${value.getFullYear()}-${month}-${day}`;
	}
	return String(value ?? "").trim();
}
function groupCode(value) {
	const digits = text(value).replace(/\.0$/, "").replace(/\D/g, "");
	if (!digits) return "";
	return digits.padStart(3, "0").slice(-3);
}
async function readOship(file) {
	const xlsx = await import("../_libs/xlsx.mjs").then((n) => n.t);
	const book = xlsx.read(file, {
		type: "array",
		cellDates: true
	});
	const rows = [];
	for (const name of book.SheetNames) {
		const grid = xlsx.utils.sheet_to_json(book.Sheets[name], {
			header: 1,
			raw: true,
			defval: ""
		});
		const head = (grid[0] ?? []).map((cell) => String(cell ?? "").replace(/\s/g, ""));
		const at = (label) => head.indexOf(label);
		const storeAt = at("점포코드");
		if (storeAt < 0) continue;
		const nameAt = at("점포명");
		const routeAt = at("배송루트");
		const groupAt = at("배송상품군명");
		const codeAt = at("배송상품군코드");
		const reasonAt = at("미오출사유");
		const qtyAt = at("출고량");
		const amountAt = at("금액");
		const seqAt = at("순번");
		const dateAt = at("출고일");
		const goodsAt = at("상품명");
		const goodsCdAt = at("상품코드");
		for (let i = 1; i < grid.length; i++) {
			const line = grid[i] ?? [];
			if (seqAt >= 0 && String(line[seqAt] ?? "").trim() === "합계") continue;
			const storeCd = text(line[storeAt]).toUpperCase();
			if (!storeCd) continue;
			const code = codeAt >= 0 ? groupCode(line[codeAt]) : "";
			const route = routeAt >= 0 ? text(line[routeAt]).replace(/\.0$/, "") : "";
			rows.push({
				date: dateAt >= 0 ? text(line[dateAt]) : "",
				storeCd,
				storeNm: nameAt >= 0 ? text(line[nameAt]) : "",
				route,
				bucket: Xn(route.replace(/\D/g, "") || route),
				group: groupAt >= 0 ? text(line[groupAt]) || "없음" : "없음",
				code,
				goodsCd: goodsCdAt >= 0 ? text(line[goodsCdAt]).replace(/\.0$/, "") : "",
				goods: goodsAt >= 0 ? text(line[goodsAt]) : "",
				dpt: DPT_BY_CODE[code] ?? "기타",
				reason: reasonAt >= 0 ? text(line[reasonAt]) || "없음" : "없음",
				qty: qtyAt >= 0 ? num$1(line[qtyAt]) : 0,
				amount: amountAt >= 0 ? num$1(line[amountAt]) : 0
			});
		}
	}
	return rows;
}
var nf$2 = new Intl.NumberFormat("ko-KR");
var LINE_TONE$1 = [
	"bg-line-1",
	"bg-line-2",
	"bg-line-3",
	"bg-line-4",
	"bg-line-5",
	"bg-line-6",
	"bg-line-7",
	"bg-line-8"
];
function routeKey$1(route) {
	const digits = String(route).replace(/\D/g, "");
	if (!digits) return null;
	const n = Number(digits.length >= 3 ? digits.slice(0, 3) : digits);
	if (n >= 100 && n <= 199) return {
		band: "200",
		key: String(n + 100)
	};
	if (n >= 200 && n <= 299) return {
		band: "200",
		key: String(n)
	};
	if (n >= 300 && n <= 399) return {
		band: "300",
		key: String(n)
	};
	if (n >= 400 && n <= 499) return {
		band: "400",
		key: String(n)
	};
	return null;
}
function dptBand(dpt) {
	if (dpt === "냉동") return "400";
	if (dpt === "FF1편" || dpt === "1차상품") return "300";
	if (dpt === "전체") return "";
	return "200";
}
function toBand(route, band) {
	const hit = routeKey$1(route);
	if (!hit) return "";
	const base = hit.band === "200" ? Number(hit.key) : hit.band === "300" ? Number(hit.key) - 100 : Number(hit.key) - 200;
	if (base < 200 || base > 299) return "";
	return String(base + (band === "200" ? 0 : band === "300" ? 100 : 200));
}
function money(value) {
	return `${nf$2.format(Math.round(value))}원`;
}
function moneyShort$1(value) {
	const sign = value < 0 ? "-" : "";
	const abs = Math.abs(Math.round(value));
	if (abs >= 1e4) return `${sign}${nf$2.format(Math.round(abs / 1e4))}만`;
	return sign + nf$2.format(abs);
}
function shownValue(hit, measure) {
	if (measure === "금액") return Math.abs(hit.amount);
	if (measure === "오출 일수") return hit.days;
	return hit.count;
}
function shownLabel(hit, measure) {
	if (measure === "금액") return moneyShort$1(hit.amount);
	return nf$2.format(measure === "오출 일수" ? hit.days : hit.count);
}
function heatColor$1(count, min, max) {
	if (!(count > 0) || max <= min) return count > 0 ? "rgb(255, 235, 132)" : "#eef3f6";
	const t = Math.min(1, Math.max(0, (count - min) / (max - min)));
	const mix = (from, to, amount) => from.map((value, index) => Math.round(value + (to[index] - value) * amount));
	const green = [
		99,
		190,
		123
	];
	const yellow = [
		255,
		235,
		132
	];
	const rgb = t < .5 ? mix(green, yellow, t * 2) : mix(yellow, [
		248,
		105,
		107
	], (t - .5) * 2);
	return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}
function shortStoreName$2(name) {
	const raw = String(name ?? "").trim();
	if (raw.length < 9) return raw;
	return raw.replace(/^GS25\s*/i, "").replace(/점$/, "") || raw;
}
function lineMapOf(layout) {
	const map = /* @__PURE__ */ new Map();
	for (const item of layout) for (const slot of [...item.left, ...item.right]) if (slot.kind === "loc") map.set(slot.code, item.line);
	return map;
}
function locOfStore(codes) {
	const map = /* @__PURE__ */ new Map();
	if (!codes) return map;
	for (const [loc, code] of Object.entries(codes).sort((a, b) => a[0].localeCompare(b[0]))) {
		const key = code.trim().toUpperCase();
		if (key && !map.has(key)) map.set(key, loc);
	}
	return map;
}
function OshipCell({ slot, hit, side, big, measure, min, max, line }) {
	const box = "grid items-stretch gap-1 overflow-hidden rounded-sm border px-1 " + (big ? "h-11 text-xs" : "h-9 text-[10px]");
	const cols = side === "left" ? " grid-cols-[36px_minmax(0,1fr)_56px]" : " grid-cols-[56px_minmax(0,1fr)_36px]";
	if (slot.kind === "blank") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: box + " border-transparent bg-transparent" });
	if (slot.kind === "pillar") {
		const box = pillarBox(slot.span || 1, big);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "loc-pillar grid items-center justify-center overflow-hidden rounded-sm font-bold tracking-widest text-on-dark " + (big ? "text-xs" : "text-[10px]") + box.className,
			style: box.style,
			children: "기둥"
		});
	}
	const value = hit ? shownValue(hit, measure) : 0;
	const label = hit ? shownLabel(hit, measure) : "";
	const code = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "flex items-center justify-center truncate text-center font-bold tabular-nums text-ink",
		children: slot.code
	});
	const store = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "flex h-full min-w-0 items-center overflow-hidden whitespace-nowrap px-1 font-bold text-ink " + (big ? "text-[13px]" : "text-[12px]"),
		title: hit?.store,
		children: shortStoreName$2(hit?.store ?? "")
	});
	const count = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "flex h-full items-center justify-center rounded-sm text-center font-bold tabular-nums " + (value > 0 ? "text-ink" : "text-muted"),
		style: { background: heatColor$1(value, min, max) },
		children: label
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: box + cols + (hit?.store ? " cursor-pointer border-grid bg-paper" : hit ? " border-grid bg-paper" : " border-[#e4ebf0] bg-[#f7fafc]"),
		title: hit ? `${slot.code} ${hit.store} 건수 ${nf$2.format(hit.count)} 오출 일수 ${nf$2.format(hit.days)} 금액 ${money(hit.amount)}` : slot.code,
		"data-loc": hit?.store ? slot.code : void 0,
		"data-line": hit?.store ? line : void 0,
		children: side === "left" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			code,
			store,
			count
		] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			count,
			store,
			code
		] })
	});
}
function Columns({ side, unit }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid items-center gap-1 rounded-sm bg-header px-1 py-1 text-[9px] font-bold text-on-dark " + (side === "left" ? "grid-cols-[36px_minmax(0,1fr)_56px]" : "grid-cols-[56px_minmax(0,1fr)_36px]"),
		children: (side === "left" ? [
			"로케이션",
			"점포명",
			unit
		] : [
			unit,
			"점포명",
			"로케이션"
		]).map((label) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "whitespace-nowrap text-center leading-none",
			children: label
		}, label))
	});
}
function escPrint$1(value) {
	return value.replace(/[&<>"]/g, (ch) => {
		if (ch === "&") return ["&", "amp;"].join("");
		if (ch === "<") return ["&", "lt;"].join("");
		if (ch === ">") return ["&", "gt;"].join("");
		return ["&", "quot;"].join("");
	});
}
function printHtml$1(title, body) {
	const frame = document.createElement("iframe");
	frame.setAttribute("aria-hidden", "true");
	frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
	document.body.appendChild(frame);
	const doc = frame.contentDocument;
	const win = frame.contentWindow;
	if (!doc || !win) {
		frame.remove();
		return;
	}
	doc.open();
	doc.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${escPrint$1(title)}</title><style>
    @page { margin: 12mm; }
    body { font-family: "Malgun Gothic", "맑은 고딕", sans-serif; color: #1c1c1e; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .sub { color: #636366; font-size: 12px; margin: 0 0 12px; }
    .stats { display: flex; gap: 18px; margin: 0 0 14px; }
    .stats b { display: block; font-size: 16px; }
    .stats span { color: #8e8e93; font-size: 11px; }
    h2 { font-size: 13px; margin: 16px 0 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border-bottom: 1px solid #e5e5ea; padding: 6px 4px; text-align: left; vertical-align: top; }
    th { color: #8e8e93; font-weight: 600; }
    .r { text-align: right; white-space: nowrap; }
  </style></head><body>${body}</body></html>`);
	doc.close();
	window.setTimeout(() => {
		win.focus();
		win.print();
		window.setTimeout(() => frame.remove(), 800);
	}, 40);
}
function monthDay(date) {
	const bits = date.split("-").filter(Boolean);
	const day = Number(bits[bits.length - 1]);
	const month = Number(bits.length >= 2 ? bits[bits.length - 2] : "");
	if (!month || !day) return date || "날짜 없음";
	return `${month}월 ${day}일`;
}
function TrendLine({ points, unit }) {
	const [hover, setHover] = (0, import_react.useState)(null);
	const w = 260;
	const h = 72;
	const values = points.map((point) => point.value);
	const min = Math.min(0, ...values, 0);
	const span = Math.max(0, ...values, 0) - min || 1;
	const pts = values.map((v, i) => {
		return [values.length <= 1 ? w / 2 : i / (values.length - 1) * 252 + 4, 16 + (1 - (v - min) / span) * 50];
	});
	const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
	const zeroY = 16 + (1 - (0 - min) / span) * 50;
	const area = pts.length ? `${pts[0][0]},${h} ${line} ${pts[pts.length - 1][0]},${h}` : "";
	const hot = hover != null ? pts[hover] : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mt-1.5 h-[92px] overflow-hidden rounded-xl bg-white px-1.5 py-1 shadow-sm",
		children: [points.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: `0 0 ${w} ${h}`,
			className: "h-full w-full",
			preserveAspectRatio: "none",
			onMouseLeave: () => setHover(null),
			onMouseMove: (event) => {
				const rect = event.currentTarget.getBoundingClientRect();
				const x = (event.clientX - rect.left) / rect.width * w;
				let best = 0;
				let dist = Infinity;
				pts.forEach((point, index) => {
					const gap = Math.abs(point[0] - x);
					if (gap < dist) {
						dist = gap;
						best = index;
					}
				});
				setHover(best);
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: "0",
					x2: w,
					y1: zeroY,
					y2: zeroY,
					stroke: "#e5e5ea",
					strokeWidth: "1"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
					points: area,
					fill: "#007aff",
					opacity: "0.12"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", {
					points: line,
					fill: "none",
					stroke: "#007aff",
					strokeWidth: "1.75",
					strokeLinejoin: "round",
					strokeLinecap: "round",
					vectorEffect: "non-scaling-stroke"
				}),
				hot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: hot[0],
					x2: hot[0],
					y1: "14",
					y2: h,
					stroke: "#007aff",
					strokeOpacity: "0.35",
					strokeWidth: "1",
					vectorEffect: "non-scaling-stroke"
				}) : null,
				hot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: hot[0],
					cy: hot[1],
					r: "2.4",
					fill: "#007aff"
				}) : null
			]
		}), hot && hover != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-none absolute left-1/2 top-1 z-10 w-max max-w-[calc(100%-8px)] -translate-x-1/2 truncate whitespace-nowrap rounded-full bg-[#1c1c1e]/80 px-2 py-0.5 text-[10px] font-semibold text-white",
			children: [
				monthDay(points[hover].date),
				" · ",
				unit,
				" ",
				unit === "금액" ? moneyShort$1(points[hover].raw) : nf$2.format(points[hover].raw)
			]
		}) : null]
	});
}
function chartMarkup(points, unit) {
	const w = 720;
	const h = 220;
	const left = 58;
	const top = 16;
	const plotW = 646;
	const plotH = 168;
	const maxRaw = Math.max(0, ...points.map((point) => point.value));
	const pow = maxRaw > 0 ? 10 ** Math.floor(Math.log10(maxRaw)) : 1;
	const scaled = maxRaw / pow;
	const ceiling = (scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10) * pow || 1;
	const ticks = [
		0,
		.25,
		.5,
		.75,
		1
	];
	const label = (value) => unit === "금액" ? moneyShort$1(value) : nf$2.format(Math.round(value));
	const shortDate = (date) => {
		const bits = date.split("-").filter(Boolean);
		const day = Number(bits[bits.length - 1]);
		const month = Number(bits.length >= 2 ? bits[bits.length - 2] : "");
		return month && day ? `${month}/${day}` : date;
	};
	const xAt = (index) => points.length <= 1 ? 381 : left + index / (points.length - 1) * plotW;
	const yAt = (value) => top + (1 - value / ceiling) * plotH;
	const pts = points.map((point, index) => [xAt(index), yAt(point.value)]);
	const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
	const base = 184;
	const area = pts.length ? `${pts[0][0]},${base} ${line} ${pts[pts.length - 1][0]},${base}` : "";
	const grids = ticks.map((tick) => {
		const y = yAt(ceiling * tick);
		return `<line x1="${left}" x2="704" y1="${y}" y2="${y}" stroke="#e5e5ea" stroke-width="1"/><text x="50" y="${y + 4}" text-anchor="end" font-size="11" fill="#8e8e93">${escPrint$1(label(ceiling * tick))}</text>`;
	}).join("");
	const step = Math.max(1, Math.ceil(points.length / 8));
	const dates = points.map((point, index) => {
		if (index % step !== 0 && index !== points.length - 1) return "";
		return `<text x="${xAt(index)}" y="208" text-anchor="middle" font-size="11" fill="#8e8e93">${escPrint$1(shortDate(point.date))}</text>`;
	}).join("");
	return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="180" xmlns="http://www.w3.org/2000/svg" font-family="Malgun Gothic, sans-serif">${grids}<polygon points="${area}" fill="#007aff" opacity="0.12"/><polyline points="${line}" fill="none" stroke="#007aff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#007aff"/>`).join("")}${dates}</svg>`;
}
function PrintButton({ onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: "h-7 shrink-0 rounded-full bg-[#e5e5ea] px-3 text-[12px] font-semibold text-[#636366]",
		children: "프린트"
	});
}
function OshipView({ masters, storeCodes, bandMasters, jobs }) {
	const [files, setFiles] = (0, import_react.useState)({});
	const [center, setCenter] = (0, import_react.useState)("1센터");
	const [pickedDpts, setPickedDpts] = (0, import_react.useState)(null);
	const [pickedRoutes, setPickedRoutes] = (0, import_react.useState)(null);
	const [routeQuery, setRouteQuery] = (0, import_react.useState)("");
	const [pickedReasons, setPickedReasons] = (0, import_react.useState)(null);
	const [storeFind, setStoreFind] = (0, import_react.useState)("");
	const [measure, setMeasure] = (0, import_react.useState)("건수");
	const [temp, setTemp] = (0, import_react.useState)("냉장");
	const [mode, setMode] = (0, import_react.useState)("로케이션");
	const [topBy, setTopBy] = (0, import_react.useState)("count");
	const [topLines, setTopLines] = (0, import_react.useState)(null);
	const [summaryOpen, setSummaryOpen] = (0, import_react.useState)(null);
	const [storeSort, setStoreSort] = (0, import_react.useState)("count");
	const [storeDir, setStoreDir] = (0, import_react.useState)("desc");
	const [productSort, setProductSort] = (0, import_react.useState)("count");
	const [productDir, setProductDir] = (0, import_react.useState)("desc");
	const [productSheet, setProductSheet] = (0, import_react.useState)(null);
	const [detailRoutes, setDetailRoutes] = (0, import_react.useState)(null);
	const [detailStores, setDetailStores] = (0, import_react.useState)(null);
	const [detailReasons, setDetailReasons] = (0, import_react.useState)(null);
	const [detailRouteQuery, setDetailRouteQuery] = (0, import_react.useState)("");
	const [detailStoreQuery, setDetailStoreQuery] = (0, import_react.useState)("");
	const [detailReasonQuery, setDetailReasonQuery] = (0, import_react.useState)("");
	const [detailSort, setDetailSort] = (0, import_react.useState)("date");
	const [detailDir, setDetailDir] = (0, import_react.useState)("asc");
	const [checkedByCenter, setCheckedByCenter] = (0, import_react.useState)({});
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [sheet, setSheet] = (0, import_react.useState)(null);
	const [sheetChart, setSheetChart] = (0, import_react.useState)("count");
	const [sheetSort, setSheetSort] = (0, import_react.useState)("date");
	const [sheetDir, setSheetDir] = (0, import_react.useState)("asc");
	const [sheetDpts, setSheetDpts] = (0, import_react.useState)(null);
	const [sheetReasonPick, setSheetReasonPick] = (0, import_react.useState)(null);
	const boardRef = (0, import_react.useRef)(null);
	const pan = (0, import_react.useRef)(null);
	const [panning, setPanning] = (0, import_react.useState)(false);
	const [layoutRev, setLayoutRev] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => subscribeLayouts(() => setLayoutRev((value) => value + 1)), []);
	const book = files[center];
	const layout = (0, import_react.useMemo)(() => layoutFor(center), [
		center,
		layoutRev,
		Nn()
	]);
	const checked = checkedByCenter[center] ?? layout.map((item) => item.line);
	const allLines = layout.every((item) => checked.includes(item.line));
	const lines = layout.filter((item) => checked.includes(item.line));
	const oneLine = lines.length === 1;
	const locOf = (0, import_react.useMemo)(() => {
		if (Nn() === "포천" && center === "2센터") {
			const list = temp === "냉동" ? ["냉동"] : OSHIP_DPTS.filter((id) => id !== "냉동");
			const selected = pickedDpts == null ? list : pickedDpts.filter((id) => list.includes(id));
			const ff2 = selected.length > 0 && selected.every((id) => id === "FF2편");
			const codes = bandMasters?.["2센터"]?.[ff2 ? "FF2" : "FF1"]?.codes;
			if (codes && Object.keys(codes).length > 0) return locOfStore(codes);
		}
		return locOfStore(storeCodes[center]);
	}, [
		storeCodes,
		center,
		bandMasters,
		temp,
		pickedDpts
	]);
	const where = (0, import_react.useMemo)(() => lineMapOf(layout), [layout]);
	const workRoute = (0, import_react.useMemo)(() => {
		const empty = () => ({
			"200": /* @__PURE__ */ new Map(),
			"300": /* @__PURE__ */ new Map(),
			"400": /* @__PURE__ */ new Map()
		});
		const counts = /* @__PURE__ */ new Map();
		const options = {
			"200": /* @__PURE__ */ new Set(),
			"300": /* @__PURE__ */ new Set(),
			"400": /* @__PURE__ */ new Set()
		};
		for (const job of jobs[center] ?? []) {
			const hit = routeKey$1(String(job.route ?? ""));
			if (!hit) continue;
			const base = hit.band === "200" ? Number(hit.key) : hit.band === "300" ? Number(hit.key) - 100 : Number(hit.key) - 200;
			if (base < 200 || base > 299) continue;
			const low = String(base);
			const mid = String(base + 100);
			const high = String(base + 200);
			options["200"].add(low);
			options["300"].add(mid);
			options["400"].add(high);
			const code = String(job.storeCd ?? "").trim().toUpperCase();
			if (!code) continue;
			const box = counts.get(code) ?? empty();
			box["200"].set(low, (box["200"].get(low) ?? 0) + 1);
			box["300"].set(mid, (box["300"].get(mid) ?? 0) + 1);
			box["400"].set(high, (box["400"].get(high) ?? 0) + 1);
			counts.set(code, box);
		}
		const byStore = /* @__PURE__ */ new Map();
		for (const [code, box] of counts) {
			const pick = (band) => [...box[band].entries()].sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))[0]?.[0] ?? "";
			byStore.set(code, {
				"200": pick("200"),
				"300": pick("300"),
				"400": pick("400")
			});
		}
		const sort = (band) => [...options[band]].sort((a, b) => Number(a) - Number(b));
		return {
			byStore,
			options: {
				"200": sort("200"),
				"300": sort("300"),
				"400": sort("400")
			}
		};
	}, [jobs, center]);
	const source = (0, import_react.useMemo)(() => {
		const rows = book?.rows ?? [];
		return temp === "냉동" ? rows.filter((row) => row.dpt === "냉동") : rows.filter((row) => row.dpt !== "냉동");
	}, [book, temp]);
	const dptList = temp === "냉동" ? ["냉동"] : OSHIP_DPTS.filter((id) => id !== "냉동");
	const selectedDpts = pickedDpts == null ? dptList : pickedDpts.filter((id) => dptList.includes(id));
	const dptAll = dptList.length === 0 || selectedDpts.length === dptList.length;
	const routeOptions = (0, import_react.useMemo)(() => {
		const want200 = dptAll || selectedDpts.some((id) => dptBand(id) === "200");
		const want300 = dptAll || selectedDpts.some((id) => dptBand(id) === "300");
		const want400 = dptAll || selectedDpts.some((id) => dptBand(id) === "400");
		return [
			...want200 ? workRoute.options["200"] : [],
			...want300 ? workRoute.options["300"] : [],
			...want400 ? workRoute.options["400"] : []
		];
	}, [
		workRoute,
		dptAll,
		selectedDpts
	]);
	const selectedRoutes = pickedRoutes == null ? routeOptions : pickedRoutes.filter((id) => routeOptions.includes(id));
	const routeNeedle = routeQuery.trim().toLowerCase();
	const queriedRoutes = routeNeedle ? routeOptions.filter((id) => id.toLowerCase().includes(routeNeedle)) : selectedRoutes;
	const routeAll = !routeNeedle && (routeOptions.length === 0 || selectedRoutes.length === routeOptions.length);
	const storeNeedle = storeFind.trim().toLowerCase();
	const sliced = (0, import_react.useMemo)(() => {
		const allowRoute = routeNeedle ? new Set(queriedRoutes) : routeAll ? null : new Set(selectedRoutes);
		return source.filter((row) => {
			if (storeNeedle && !row.storeNm.toLowerCase().includes(storeNeedle) && !row.storeCd.toLowerCase().includes(storeNeedle)) return false;
			if (temp === "냉장" && (mode === "로케이션" || mode === "상위5점") && !allLines) {
				const loc = locOf.get(row.storeCd);
				const line = loc ? where.get(loc) : void 0;
				if (line == null || !checked.includes(line)) return false;
			}
			if (!(temp === "냉장" && mode === "로케이션")) return true;
			if (!allowRoute) return true;
			const band = dptBand(row.dpt);
			const owned = band ? workRoute.byStore.get(row.storeCd)?.[band] || toBand(row.route, band) : "";
			return allowRoute.has(owned);
		});
	}, [
		source,
		temp,
		mode,
		allLines,
		locOf,
		where,
		checked,
		routeAll,
		routeNeedle,
		queriedRoutes,
		selectedRoutes,
		workRoute,
		storeNeedle
	]);
	(0, import_react.useEffect)(() => {
		setPickedRoutes((cur) => {
			if (cur == null) return null;
			const next = cur.filter((id) => routeOptions.includes(id));
			if (next.length === cur.length) return cur;
			return next.length === routeOptions.length ? null : next;
		});
	}, [routeOptions]);
	(0, import_react.useEffect)(() => {
		if (!sheet && !productSheet && !summaryOpen) return;
		const onKey = (event) => {
			if (event.key !== "Escape") return;
			setSheet(null);
			setProductSheet(null);
			setSummaryOpen(null);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		sheet,
		productSheet,
		summaryOpen
	]);
	(0, import_react.useEffect)(() => {
		if (!summaryOpen) return;
		const onDown = (event) => {
			const el = event.target;
			if (el instanceof Element && el.closest("[data-summary]")) return;
			setSummaryOpen(null);
		};
		document.addEventListener("pointerdown", onDown);
		return () => document.removeEventListener("pointerdown", onDown);
	}, [summaryOpen]);
	const shown = (0, import_react.useMemo)(() => dptAll ? sliced : sliced.filter((row) => selectedDpts.includes(row.dpt)), [
		sliced,
		dptAll,
		selectedDpts
	]);
	const reasonOptions = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const row of shown) map.set(row.reason, (map.get(row.reason) ?? 0) + 1);
		return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")).map(([name]) => name);
	}, [shown]);
	const selectedReasons = pickedReasons == null ? reasonOptions : pickedReasons.filter((id) => reasonOptions.includes(id));
	const reasonAll = reasonOptions.length === 0 || selectedReasons.length === reasonOptions.length;
	const onLayout = (0, import_react.useMemo)(() => {
		if (reasonAll) return shown;
		const allow = new Set(selectedReasons);
		return shown.filter((row) => allow.has(row.reason));
	}, [
		shown,
		reasonAll,
		selectedReasons
	]);
	const dptTotals = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const id of dptList) map.set(id, {
			count: 0,
			amount: 0
		});
		for (const row of sliced) {
			const box = map.get(row.dpt) ?? {
				count: 0,
				amount: 0
			};
			box.count += 1;
			box.amount += row.amount;
			map.set(row.dpt, box);
		}
		return map;
	}, [sliced, dptList]);
	const reasons = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const row of shown) {
			const box = map.get(row.reason) ?? {
				count: 0,
				amount: 0
			};
			box.count += 1;
			box.amount += row.amount;
			map.set(row.reason, box);
		}
		return [...map.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0], "ko"));
	}, [shown]);
	const hits = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		const pocheon2 = Nn() === "포천" && center === "2센터";
		const list = temp === "냉동" ? ["냉동"] : OSHIP_DPTS.filter((id) => id !== "냉동");
		const selected = pickedDpts == null ? list : pickedDpts.filter((id) => list.includes(id));
		const ff2 = pocheon2 && selected.length > 0 && selected.every((id) => id === "FF2편");
		const pack = pocheon2 ? bandMasters?.["2센터"]?.[ff2 ? "FF2" : "FF1"] : void 0;
		const places = pack?.places && Object.keys(pack.places).length > 0 ? pack.places : masters[center];
		const codes = pack?.codes && Object.keys(pack.codes).length > 0 ? pack.codes : storeCodes[center];
		for (const [loc, name] of Object.entries(places ?? {})) {
			const store = name.trim();
			if (!store) continue;
			const code = (codes?.[loc] ?? "").trim().toUpperCase();
			if (storeNeedle && !store.toLowerCase().includes(storeNeedle) && !code.toLowerCase().includes(storeNeedle)) continue;
			map.set(loc, {
				store,
				code,
				count: 0,
				amount: 0,
				days: 0,
				dates: /* @__PURE__ */ new Set()
			});
		}
		for (const row of onLayout) {
			const loc = locOf.get(row.storeCd);
			if (!loc) continue;
			const hit = map.get(loc) ?? {
				store: row.storeNm,
				code: row.storeCd,
				count: 0,
				amount: 0,
				days: 0,
				dates: /* @__PURE__ */ new Set()
			};
			hit.count += 1;
			hit.amount += row.amount;
			if (row.date) hit.dates.add(row.date);
			hit.days = hit.dates.size;
			if (!hit.store) hit.store = row.storeNm;
			if (!hit.code) hit.code = row.storeCd;
			map.set(loc, hit);
		}
		return map;
	}, [
		masters,
		center,
		onLayout,
		locOf,
		storeCodes,
		storeNeedle,
		bandMasters,
		temp,
		pickedDpts
	]);
	const unmatched = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const row of onLayout) {
			if (locOf.has(row.storeCd)) continue;
			const box = map.get(row.storeCd) ?? {
				name: row.storeNm,
				count: 0,
				amount: 0
			};
			box.count += 1;
			box.amount += row.amount;
			if (!box.name) box.name = row.storeNm;
			map.set(row.storeCd, box);
		}
		return [...map.entries()].sort((a, b) => b[1].count - a[1].count);
	}, [onLayout, locOf]);
	const rankRows = (0, import_react.useMemo)(() => {
		if (topLines == null || layout.every((item) => topLines.includes(item.line))) return onLayout;
		const allow = new Set(topLines);
		return onLayout.filter((row) => {
			const loc = locOf.get(row.storeCd);
			const line = loc ? where.get(loc) : void 0;
			return line != null && allow.has(line);
		});
	}, [
		onLayout,
		topLines,
		layout,
		locOf,
		where
	]);
	const topStores = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const row of rankRows) {
			const key = row.storeCd || row.storeNm;
			const box = map.get(key) ?? {
				name: row.storeNm,
				code: row.storeCd,
				loc: locOf.get(row.storeCd) ?? "",
				count: 0,
				amount: 0,
				dates: /* @__PURE__ */ new Set()
			};
			box.count += 1;
			box.amount += row.amount;
			if (row.date) box.dates.add(row.date);
			if (!box.name) box.name = row.storeNm;
			if (!box.loc) box.loc = locOf.get(row.storeCd) ?? "";
			map.set(key, box);
		}
		return [...map.values()].map((box) => ({
			...box,
			days: box.dates.size
		})).sort((a, b) => {
			const av = topBy === "amount" ? Math.abs(a.amount) : a[topBy];
			return (topBy === "amount" ? Math.abs(b.amount) : b[topBy]) - av || b.count - a.count || a.name.localeCompare(b.name, "ko");
		}).slice(0, 10);
	}, [
		rankRows,
		locOf,
		topBy
	]);
	const productRows = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const row of onLayout) {
			const key = row.goodsCd || row.goods || "상품명 없음";
			const box = map.get(key) ?? {
				code: row.goodsCd,
				name: row.goods || "상품명 없음",
				dpt: row.dpt,
				count: 0,
				qty: 0,
				amount: 0,
				dates: /* @__PURE__ */ new Set()
			};
			box.count += 1;
			box.qty += row.qty;
			box.amount += row.amount;
			if (row.date) box.dates.add(row.date);
			if (!box.name && row.goods) box.name = row.goods;
			map.set(key, box);
		}
		const dir = productDir === "asc" ? 1 : -1;
		return [...map.values()].map((box) => ({
			...box,
			days: box.dates.size
		})).sort((a, b) => {
			if (productSort === "name" || productSort === "dpt") return a[productSort].localeCompare(b[productSort], "ko") * dir || b.count - a.count;
			return (a[productSort] - b[productSort]) * dir || b.count - a.count || a.name.localeCompare(b.name, "ko");
		});
	}, [
		onLayout,
		productSort,
		productDir
	]);
	const storeRows = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const row of onLayout) {
			const loc = locOf.get(row.storeCd) ?? "";
			const key = row.storeCd || row.storeNm || "점포명 없음";
			const box = map.get(key) ?? {
				code: row.storeCd,
				name: row.storeNm || "점포명 없음",
				loc,
				line: loc ? where.get(loc) ?? 0 : 0,
				count: 0,
				qty: 0,
				amount: 0,
				dates: /* @__PURE__ */ new Set()
			};
			box.count += 1;
			box.qty += row.qty;
			box.amount += row.amount;
			if (row.date) box.dates.add(row.date);
			if (!box.name && row.storeNm) box.name = row.storeNm;
			if (!box.loc && loc) {
				box.loc = loc;
				box.line = where.get(loc) ?? 0;
			}
			map.set(key, box);
		}
		const dir = storeDir === "asc" ? 1 : -1;
		return [...map.values()].map((box) => ({
			...box,
			days: box.dates.size
		})).sort((a, b) => {
			if (storeSort === "name" || storeSort === "loc") return a[storeSort].localeCompare(b[storeSort], "ko") * dir || b.count - a.count;
			return (a[storeSort] - b[storeSort]) * dir || b.count - a.count || a.name.localeCompare(b.name, "ko");
		});
	}, [
		onLayout,
		locOf,
		where,
		storeSort,
		storeDir
	]);
	const topProducts = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const row of rankRows) {
			const key = row.goodsCd || row.goods || "상품명 없음";
			const box = map.get(key) ?? {
				code: row.goodsCd,
				name: row.goods || "상품명 없음",
				dpt: row.dpt,
				count: 0,
				qty: 0,
				amount: 0,
				dates: /* @__PURE__ */ new Set()
			};
			box.count += 1;
			box.qty += row.qty;
			box.amount += row.amount;
			if (row.date) box.dates.add(row.date);
			map.set(key, box);
		}
		return [...map.values()].map((box) => ({
			...box,
			days: box.dates.size
		})).sort((a, b) => {
			const av = topBy === "amount" ? Math.abs(a.amount) : a[topBy];
			return (topBy === "amount" ? Math.abs(b.amount) : b[topBy]) - av || b.count - a.count || a.name.localeCompare(b.name, "ko");
		}).slice(0, 10);
	}, [rankRows, topBy]);
	const productDetail = (0, import_react.useMemo)(() => {
		if (!productSheet) return [];
		return onLayout.filter((row) => productSheet.code ? row.goodsCd === productSheet.code : row.goods === productSheet.name);
	}, [onLayout, productSheet]);
	const routeOf = (row) => {
		const band = dptBand(row.dpt);
		if (!band) return "";
		return workRoute.byStore.get(row.storeCd)?.[band] || toBand(row.route, band);
	};
	const detailRouteOptions = (0, import_react.useMemo)(() => {
		const want200 = productDetail.some((row) => dptBand(row.dpt) === "200");
		const want300 = productDetail.some((row) => dptBand(row.dpt) === "300");
		const want400 = productDetail.some((row) => dptBand(row.dpt) === "400");
		const set = /* @__PURE__ */ new Set([
			...want200 ? workRoute.options["200"] : [],
			...want300 ? workRoute.options["300"] : [],
			...want400 ? workRoute.options["400"] : []
		]);
		for (const row of productDetail) {
			const band = dptBand(row.dpt);
			const owned = band ? workRoute.byStore.get(row.storeCd)?.[band] || toBand(row.route, band) : "";
			if (owned) set.add(owned);
		}
		return [...set].sort((a, b) => Number(a) - Number(b));
	}, [productDetail, workRoute]);
	const detailStoreOptions = (0, import_react.useMemo)(() => [...new Set(productDetail.map((row) => row.storeNm || "점포명 없음"))].sort((a, b) => a.localeCompare(b, "ko")), [productDetail]);
	const detailReasonOptions = (0, import_react.useMemo)(() => [...new Set(productDetail.map((row) => row.reason || "없음"))].sort((a, b) => a.localeCompare(b, "ko")), [productDetail]);
	const detailRouteNeedle = detailRouteQuery.trim().toLowerCase();
	const detailStoreNeedle = detailStoreQuery.trim().toLowerCase();
	const detailReasonNeedle = detailReasonQuery.trim().toLowerCase();
	const pickedDetailRoutes = detailRoutes == null ? detailRouteOptions : detailRoutes.filter((id) => detailRouteOptions.includes(id));
	const pickedDetailStores = detailStores == null ? detailStoreOptions : detailStores.filter((id) => detailStoreOptions.includes(id));
	const pickedDetailReasons = detailReasons == null ? detailReasonOptions : detailReasons.filter((id) => detailReasonOptions.includes(id));
	const detailRouteAll = !detailRouteNeedle && (detailRouteOptions.length === 0 || pickedDetailRoutes.length === detailRouteOptions.length);
	const detailStoreAll = !detailStoreNeedle && (detailStoreOptions.length === 0 || pickedDetailStores.length === detailStoreOptions.length);
	const detailReasonAll = !detailReasonNeedle && (detailReasonOptions.length === 0 || pickedDetailReasons.length === detailReasonOptions.length);
	const visibleProductRows = (0, import_react.useMemo)(() => {
		const rows = productDetail.filter((row) => {
			const route = routeOf(row);
			const store = row.storeNm || "점포명 없음";
			const reason = row.reason || "없음";
			if (detailRouteNeedle) {
				if (!route.toLowerCase().includes(detailRouteNeedle)) return false;
			} else if (!detailRouteAll && !pickedDetailRoutes.includes(route)) return false;
			if (detailStoreNeedle) {
				if (!store.toLowerCase().includes(detailStoreNeedle)) return false;
			} else if (!detailStoreAll && !pickedDetailStores.includes(store)) return false;
			if (detailReasonNeedle) {
				if (!reason.toLowerCase().includes(detailReasonNeedle)) return false;
			} else if (!detailReasonAll && !pickedDetailReasons.includes(reason)) return false;
			return true;
		});
		const dir = detailDir === "asc" ? 1 : -1;
		return rows.slice().sort((a, b) => {
			if (detailSort === "qty" || detailSort === "amount") return (a[detailSort] - b[detailSort]) * dir || a.date.localeCompare(b.date);
			const av = detailSort === "route" ? routeOf(a) : detailSort === "loc" ? locOf.get(a.storeCd) ?? "" : detailSort === "store" ? a.storeNm : detailSort === "reason" ? a.reason : a.date;
			const bv = detailSort === "route" ? routeOf(b) : detailSort === "loc" ? locOf.get(b.storeCd) ?? "" : detailSort === "store" ? b.storeNm : detailSort === "reason" ? b.reason : b.date;
			return av.localeCompare(bv, "ko", { numeric: true }) * dir || a.date.localeCompare(b.date);
		});
	}, [
		productDetail,
		workRoute,
		locOf,
		detailRouteNeedle,
		detailStoreNeedle,
		detailReasonNeedle,
		detailRouteAll,
		detailStoreAll,
		detailReasonAll,
		pickedDetailRoutes,
		pickedDetailStores,
		pickedDetailReasons,
		detailSort,
		detailDir
	]);
	(0, import_react.useEffect)(() => {
		setDetailRoutes(null);
		setDetailStores(null);
		setDetailReasons(null);
		setDetailRouteQuery("");
		setDetailStoreQuery("");
		setDetailReasonQuery("");
	}, [productSheet?.code, productSheet?.name]);
	const productSum = (0, import_react.useMemo)(() => {
		const dates = /* @__PURE__ */ new Set();
		let qty = 0;
		let amount = 0;
		for (const row of visibleProductRows) {
			qty += row.qty;
			amount += row.amount;
			if (row.date) dates.add(row.date);
		}
		return {
			days: dates.size,
			count: visibleProductRows.length,
			qty,
			amount
		};
	}, [visibleProductRows]);
	const totals = (0, import_react.useMemo)(() => {
		const dates = /* @__PURE__ */ new Set();
		let count = 0;
		let amount = 0;
		for (const row of onLayout) {
			count += 1;
			amount += row.amount;
			if (row.date) dates.add(row.date);
		}
		return {
			count,
			amount,
			days: dates.size
		};
	}, [onLayout]);
	const sheetRows = (0, import_react.useMemo)(() => {
		if (!sheet) return [];
		const dir = sheetDir === "asc" ? 1 : -1;
		const text = sheetSort === "date" || sheetSort === "goods" || sheetSort === "reason";
		return onLayout.filter((row) => sheet.code && row.storeCd === sheet.code || locOf.get(row.storeCd) === sheet.loc).slice().sort((a, b) => text ? a[sheetSort].localeCompare(b[sheetSort], "ko") * dir || a.goods.localeCompare(b.goods, "ko") : (a[sheetSort] - b[sheetSort]) * dir || a.date.localeCompare(b.date));
	}, [
		onLayout,
		sheet,
		locOf,
		sheetSort,
		sheetDir
	]);
	const sheetDptOptions = (0, import_react.useMemo)(() => {
		const found = /* @__PURE__ */ new Set();
		for (const row of sheetRows) if (row.dpt) found.add(row.dpt);
		return [...found];
	}, [sheetRows]);
	const sheetReasonChoices = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const row of sheetRows) map.set(row.reason, (map.get(row.reason) ?? 0) + 1);
		return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")).map(([name]) => name);
	}, [sheetRows]);
	const pickedSheetDpts = sheetDpts == null ? sheetDptOptions : sheetDpts.filter((id) => sheetDptOptions.includes(id));
	const sheetDptAll = sheetDptOptions.length === 0 || pickedSheetDpts.length === sheetDptOptions.length;
	const pickedSheetReasons = sheetReasonPick == null ? sheetReasonChoices : sheetReasonPick.filter((id) => sheetReasonChoices.includes(id));
	const sheetReasonAll = sheetReasonChoices.length === 0 || pickedSheetReasons.length === sheetReasonChoices.length;
	const visibleSheetRows = (0, import_react.useMemo)(() => sheetRows.filter((row) => (sheetDptAll || pickedSheetDpts.includes(row.dpt)) && (sheetReasonAll || pickedSheetReasons.includes(row.reason))), [
		sheetRows,
		sheetDptAll,
		pickedSheetDpts,
		sheetReasonAll,
		pickedSheetReasons
	]);
	(0, import_react.useEffect)(() => {
		setSheetDpts(null);
		setSheetReasonPick(null);
		setSheetChart("count");
	}, [
		sheet?.code,
		sheet?.loc,
		sheet?.line
	]);
	const sheetTrend = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const row of visibleSheetRows) {
			const box = map.get(row.date) ?? {
				count: 0,
				qty: 0,
				amount: 0
			};
			box.count += 1;
			box.qty += row.qty;
			box.amount += row.amount;
			map.set(row.date, box);
		}
		return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, box]) => ({
			date,
			...box
		}));
	}, [visibleSheetRows]);
	const sheetSum = (0, import_react.useMemo)(() => {
		const dates = /* @__PURE__ */ new Set();
		const reasons = /* @__PURE__ */ new Map();
		let count = 0;
		let qty = 0;
		let amount = 0;
		for (const row of visibleSheetRows) {
			count += 1;
			qty += row.qty;
			amount += row.amount;
			if (row.date) dates.add(row.date);
			const box = reasons.get(row.reason) ?? {
				count: 0,
				amount: 0
			};
			box.count += 1;
			box.amount += row.amount;
			reasons.set(row.reason, box);
		}
		return {
			count,
			qty,
			amount,
			days: dates.size,
			reasons: [...reasons.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0], "ko"))
		};
	}, [visibleSheetRows]);
	async function upload(list) {
		if (!list?.length) return;
		setBusy(true);
		setError("");
		try {
			const incoming = {};
			const names = {};
			const missed = [];
			for (const file of list) {
				const id = centerFromOshipName(file.name, center);
				const rows = await readOship(await file.arrayBuffer());
				if (!rows.length) {
					missed.push(file.name);
					continue;
				}
				incoming[id] = (incoming[id] ?? []).concat(rows);
				names[id] = [...names[id] ?? [], file.name];
			}
			setFiles((prev) => {
				const next = { ...prev };
				for (const id of Mn()) {
					if (!incoming[id]) continue;
					next[id] = {
						name: names[id]?.join(", ") ?? "",
						rows: incoming[id] ?? []
					};
				}
				return next;
			});
			if (missed.length) setError(`${missed.join(", ")} 에서 점포코드 열을 찾지 못했습니다.`);
		} catch {
			setError("엑셀을 읽지 못했습니다.");
		} finally {
			setBusy(false);
		}
	}
	const masterReady = Object.keys(masters[center] ?? {}).length > 0;
	function startPan(event) {
		if (event.button !== 0) return;
		if (event.target.closest("button, select, input, a, label")) return;
		const board = boardRef.current;
		if (!board) return;
		const node = event.target.closest("[data-loc]");
		const loc = node?.getAttribute("data-loc") ?? "";
		const line = Number(node?.getAttribute("data-line") ?? "0");
		pan.current = {
			x: event.clientX,
			y: event.clientY,
			left: board.scrollLeft,
			top: board.scrollTop,
			moved: false,
			loc,
			line
		};
	}
	function movePan(event) {
		const start = pan.current;
		const board = boardRef.current;
		if (!start || !board) return;
		const dx = event.clientX - start.x;
		const dy = event.clientY - start.y;
		if (!start.moved && Math.hypot(dx, dy) < 4) return;
		if (!start.moved) {
			start.moved = true;
			setPanning(true);
		}
		if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
		board.scrollLeft = start.left - dx;
		board.scrollTop = start.top - dy;
	}
	function endPan(event) {
		const start = pan.current;
		pan.current = null;
		setPanning(false);
		if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
		if (event.type === "pointercancel" || !start || start.moved || !start.loc) return;
		const hit = hits.get(start.loc);
		if (!hit?.store) return;
		setSheet({
			loc: start.loc,
			line: start.line,
			store: hit.store,
			code: hit.code
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col bg-[#f2f2f7]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-40 flex shrink-0 flex-wrap items-center gap-2 bg-[#f2f2f7] px-3 py-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
						label: "센터",
						value: center,
						onChange: (id) => {
							setCenter(id);
							setPickedDpts(null);
							setPickedRoutes(null);
							setRouteQuery("");
							setPickedReasons(null);
							setProductSheet(null);
						},
						options: Mn().map((id) => ({
							id,
							label: id
						}))
					}),
					temp === "냉장" && (mode === "로케이션" || mode === "상위5점") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
						label: "라인",
						text: allLines ? "전체" : checked.length === 0 ? "선택 없음" : checked.slice().sort((a, b) => a - b).map((n) => `${n}라인`).join(", "),
						rows: [{
							id: "전체",
							label: "전체",
							checked: allLines
						}, ...layout.map((item) => ({
							id: String(item.line),
							label: Pn[item.line - 1].replace(/^\S+\s/, ""),
							checked: checked.includes(item.line),
							swatch: LINE_TONE$1[item.line - 1]
						}))],
						onToggle: (id) => {
							if (id === "전체") {
								setCheckedByCenter((prev) => ({
									...prev,
									[center]: allLines ? [] : layout.map((row) => row.line)
								}));
								return;
							}
							const line = Number(id);
							setCheckedByCenter((prev) => {
								const current = prev[center] ?? layout.map((row) => row.line);
								const next = current.includes(line) ? current.filter((n) => n !== line) : [...current, line].sort((a, b) => a - b);
								return {
									...prev,
									[center]: next
								};
							});
						}
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
						label: "DPT",
						text: dptAll ? "전체" : selectedDpts.length === 0 ? "선택 없음" : selectedDpts.join(", "),
						rows: [{
							id: "전체",
							label: "전체",
							checked: dptAll && dptList.length > 0
						}, ...dptList.map((id) => ({
							id,
							label: id,
							checked: selectedDpts.includes(id)
						}))],
						onToggle: (id) => {
							if (id === "전체") {
								setPickedDpts(dptAll ? [] : null);
								return;
							}
							const current = pickedDpts == null ? [...dptList] : pickedDpts.filter((item) => dptList.includes(item));
							const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
							setPickedDpts(dptList.every((item) => next.includes(item)) ? null : next);
						}
					}),
					temp === "냉장" && mode === "로케이션" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
						label: "루트",
						search: true,
						searchLabel: "루트 검색",
						onSearch: (next) => {
							setRouteQuery(next);
							if (!next.trim()) setPickedRoutes(null);
						},
						text: routeQuery.trim() ? routeQuery.trim() : routeAll ? "전체" : selectedRoutes.length === 0 ? "선택 없음" : selectedRoutes.join(", "),
						rows: [{
							id: "전체",
							label: "전체",
							checked: !routeNeedle && routeAll && routeOptions.length > 0
						}, ...routeOptions.map((id) => ({
							id,
							label: id,
							checked: routeNeedle ? id.toLowerCase().includes(routeNeedle) : selectedRoutes.includes(id)
						}))],
						onToggle: (id) => {
							setRouteQuery("");
							if (id === "전체") {
								setPickedRoutes(routeAll ? [] : null);
								return;
							}
							const current = pickedRoutes == null ? [...routeOptions] : pickedRoutes.filter((item) => routeOptions.includes(item));
							const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
							setPickedRoutes(routeOptions.every((item) => next.includes(item)) ? null : next);
						}
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
						label: "사유",
						text: reasonAll ? "전체" : selectedReasons.length === 0 ? "선택 없음" : selectedReasons.join(", "),
						rows: [{
							id: "전체",
							label: "전체",
							checked: reasonAll && reasonOptions.length > 0
						}, ...reasonOptions.map((id) => ({
							id,
							label: id,
							checked: selectedReasons.includes(id)
						}))],
						onToggle: (id) => {
							if (id === "전체") {
								setPickedReasons(reasonAll ? [] : null);
								return;
							}
							const current = pickedReasons == null ? reasonOptions : pickedReasons.filter((item) => reasonOptions.includes(item));
							const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
							setPickedReasons(reasonOptions.every((item) => next.includes(item)) ? null : next);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: storeFind,
						onChange: (event) => setStoreFind(event.target.value),
						placeholder: "점포 검색",
						"aria-label": "점포 검색",
						className: "h-10 w-36 rounded-xl border border-black/10 bg-white px-3 text-sm text-[#1c1c1e] outline-none placeholder:text-[#8e8e93]"
					}),
					temp === "냉장" && mode === "로케이션" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
						label: "표시",
						value: measure,
						onChange: (id) => setMeasure(id),
						options: [
							{
								id: "건수",
								label: "건수"
							},
							{
								id: "금액",
								label: "금액"
							},
							{
								id: "오출 일수",
								label: "오출 일수"
							}
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "inline-flex h-10 cursor-pointer items-center rounded-xl bg-[#007aff] px-3 text-sm font-semibold text-white",
						children: [busy ? "읽는 중" : "엑셀 올리기", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: ".xlsx,.xls,.xlsm",
							multiple: true,
							className: "sr-only",
							disabled: busy,
							onChange: (event) => {
								const list = [...event.target.files ?? []];
								event.target.value = "";
								upload(list);
							}
						})]
					}),
					book ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-10 rounded-xl bg-[#8e8e93] px-3 text-sm font-semibold text-white",
						onClick: () => setFiles((prev) => ({
							...prev,
							[center]: void 0
						})),
						children: "이 센터 지우기"
					}) : null,
					book ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "min-w-0 truncate text-[11px] font-semibold text-muted",
						title: book.name,
						children: book.name
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex shrink-0 flex-col items-end gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative flex h-7 w-[132px] rounded-full bg-[#e5e5ea] p-0.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute top-0.5 left-0.5 h-6 w-[64px] rounded-full bg-white shadow-sm transition-transform duration-200",
								style: { transform: temp === "냉동" ? "translateX(64px)" : "translateX(0)" }
							}), ["냉장", "냉동"].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "relative z-10 h-6 w-[64px] text-xs font-semibold " + (temp === id ? "text-[#1c1c1e]" : "text-[#8e8e93]"),
								onClick: () => {
									setTemp(id);
									setSheet(null);
									setProductSheet(null);
									if (id === "냉장" && mode === "점포") setMode("상위5점");
									if (id === "냉동" && mode === "상위5점") setMode("점포");
								},
								children: id
							}, id))]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative flex h-7 rounded-full bg-[#e5e5ea] p-0.5",
							style: { width: temp === "냉동" ? 196 : 232 },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute top-0.5 left-0.5 h-6 rounded-full bg-white shadow-sm transition-transform duration-200",
								style: {
									width: temp === "냉동" ? 64 : 76,
									transform: `translateX(${(temp === "냉동" ? [
										"로케이션",
										"점포",
										"상품"
									] : [
										"로케이션",
										"상위5점",
										"상품"
									]).indexOf(mode) * (temp === "냉동" ? 64 : 76)}px)`
								}
							}), (temp === "냉동" ? [
								"로케이션",
								"점포",
								"상품"
							] : [
								"로케이션",
								"상위5점",
								"상품"
							]).map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "relative z-10 h-6 text-[11px] font-semibold " + (mode === id ? "text-[#1c1c1e]" : "text-[#8e8e93]"),
								style: { width: temp === "냉동" ? 64 : 76 },
								onClick: () => {
									setMode(id);
									setSheet(null);
									setProductSheet(null);
								},
								children: id
							}, id))]
						})]
					})
				]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "shrink-0 px-3 pb-1 text-xs font-semibold text-[#c0392b]",
				children: error
			}) : null,
			book ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "shrink-0 space-y-2 px-3 pb-2 " + (summaryOpen ? "relative z-30" : ""),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[11px] font-semibold text-muted shadow-sm",
							children: ["건수 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
								className: "ml-1 tabular-nums text-ink",
								children: nf$2.format(totals.count)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[11px] font-semibold text-muted shadow-sm",
							children: ["금액 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
								className: "ml-1 tabular-nums text-ink",
								children: money(totals.amount)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[11px] font-semibold text-muted shadow-sm",
							children: ["오출 일수 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
								className: "ml-1 tabular-nums text-ink",
								children: nf$2.format(totals.days)
							})]
						}),
						dptList.map((id) => {
							const box = dptTotals.get(id) ?? {
								count: 0,
								amount: 0
							};
							const on = !dptAll && selectedDpts.includes(id);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									const current = pickedDpts == null ? [...dptList] : pickedDpts.filter((item) => dptList.includes(item));
									const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
									setPickedDpts(dptList.every((item) => next.includes(item)) ? null : next);
								},
								className: "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold shadow-sm " + (on ? "bg-[#007aff] text-white" : "bg-white text-ink"),
								children: [
									id,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "tabular-nums",
										children: nf$2.format(box.count)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "tabular-nums " + (on ? "text-white/80" : "text-muted"),
										children: moneyShort$1(box.amount)
									})
								]
							}, id);
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-2 " + (temp === "냉장" && mode === "로케이션" ? "md:grid-cols-3" : "md:grid-cols-2"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "relative h-24",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								"data-summary": "",
								className: "rounded-2xl bg-white text-xs shadow-sm " + (summaryOpen === "reason" ? "absolute inset-x-0 top-0 z-30 max-h-[420px] overflow-auto shadow-[0_16px_40px_rgba(0,0,0,0.18)]" : "h-24 overflow-auto"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
									className: "w-full border-collapse text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
										className: "sticky top-0 bg-white",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: "text-muted",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-1 text-left",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														className: "font-semibold text-ink",
														onClick: () => setSummaryOpen((cur) => cur === "reason" ? null : "reason"),
														children: "미오출사유"
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-1 text-right",
													children: "건수"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-1 text-right",
													children: "금액"
												})
											]
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: reasons.map(([name, box]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-t border-black/5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-3 py-0.5",
												children: name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-3 py-0.5 text-right tabular-nums",
												children: nf$2.format(box.count)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-3 py-0.5 text-right tabular-nums",
												children: money(box.amount)
											})
										]
									}, name)) })]
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "relative h-24",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								"data-summary": "",
								className: "rounded-2xl bg-white text-xs shadow-sm " + (summaryOpen === "top" ? "absolute inset-x-0 top-0 z-30 max-h-[420px] shadow-[0_16px_40px_rgba(0,0,0,0.18)]" : "h-24"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative z-20 flex items-center justify-between gap-2 px-3 pt-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "font-semibold text-ink",
										onClick: () => setSummaryOpen((cur) => cur === "top" ? null : "top"),
										children: "상위 10점"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
											compact: true,
											soft: true,
											end: true,
											label: "라인",
											text: topLines == null || layout.every((item) => topLines.includes(item.line)) ? "전체" : topLines.length === 0 ? "없음" : topLines.slice().sort((a, b) => a - b).map((n) => `${n}라인`).join(", "),
											rows: [{
												id: "전체",
												label: "전체",
												checked: topLines == null || layout.every((item) => topLines.includes(item.line))
											}, ...layout.map((item) => ({
												id: String(item.line),
												label: Pn[item.line - 1].replace(/^\S+\s/, ""),
												checked: topLines == null || topLines.includes(item.line),
												swatch: LINE_TONE$1[item.line - 1]
											}))],
											onToggle: (id) => {
												const all = topLines == null || layout.every((item) => topLines.includes(item.line));
												if (id === "전체") {
													setTopLines(all ? [] : null);
													return;
												}
												const line = Number(id);
												const current = topLines == null ? layout.map((row) => row.line) : topLines;
												const next = current.includes(line) ? current.filter((n) => n !== line) : [...current, line].sort((a, b) => a - b);
												setTopLines(layout.every((item) => next.includes(item.line)) ? null : next);
											}
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex rounded-full bg-[#f2f2f7] p-0.5",
											children: [
												["days", "일수"],
												["count", "건수"],
												["amount", "금액"]
											].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setTopBy(id),
												className: "h-5 rounded-full px-2 text-[10px] font-semibold " + (topBy === id ? "bg-white text-[#007aff] shadow-sm" : "text-[#8e8e93]"),
												children: label
											}, id))
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
									className: "space-y-0.5 overflow-auto px-3 pb-1.5 " + (summaryOpen === "top" ? "max-h-[360px]" : "max-h-16"),
									children: (mode === "상품" ? topProducts : topStores).map((box, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-left hover:bg-[#e8f2ff]",
										onClick: () => {
											if (mode === "상품") {
												const hit = topProducts[index];
												if (hit) setProductSheet({
													code: hit.code,
													name: hit.name,
													dpt: hit.dpt
												});
												return;
											}
											const hit = topStores[index];
											if (!hit) return;
											setSheet({
												loc: hit.loc,
												line: hit.loc ? where.get(hit.loc) ?? 0 : 0,
												store: hit.name || hit.code,
												code: hit.code
											});
										},
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "w-4 shrink-0 tabular-nums text-muted",
												children: index + 1
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "min-w-0 flex-1 truncate font-semibold text-[#007aff]",
												children: box.name || box.code
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "shrink-0 tabular-nums text-muted",
												children: topBy === "days" ? `${nf$2.format(box.days)}일` : topBy === "count" ? `${nf$2.format(box.count)}건` : moneyShort$1(box.amount)
											})
										]
									}) }, box.code || box.name))
								})]
							})
						}),
						temp === "냉장" && mode === "로케이션" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "relative h-24",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								"data-summary": "",
								className: "rounded-2xl bg-white px-3 py-1.5 text-xs shadow-sm " + (summaryOpen === "miss" ? "absolute inset-x-0 top-0 z-30 max-h-[420px] overflow-auto shadow-[0_16px_40px_rgba(0,0,0,0.18)]" : "h-24 overflow-auto"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "font-semibold text-ink",
									onClick: () => setSummaryOpen((cur) => cur === "miss" ? null : "miss"),
									children: ["점포코드로 못 찾은 점포 ", nf$2.format(unmatched.length)]
								}), unmatched.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-muted",
									children: masterReady ? "올린 점포가 배치표 점포코드와 맞습니다." : "배치표를 올리면 점포명이 로케이션에 붙습니다."
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-1 space-y-0.5",
									children: unmatched.map(([code, box]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "flex w-full items-center justify-between gap-2 rounded-lg px-1 py-0.5 text-left hover:bg-[#e8f2ff]",
										onClick: () => setSheet({
											loc: "",
											line: 0,
											store: box.name || code,
											code
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "truncate font-semibold text-[#007aff]",
											children: box.name || code
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "shrink-0 tabular-nums text-muted",
											children: [
												nf$2.format(box.count),
												" · ",
												moneyShort$1(box.amount)
											]
										})]
									}) }, code))
								})]
							})
						}) : null
					]
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "shrink-0 px-3 pb-1 text-[11px] font-semibold text-muted",
				children: temp === "냉동" ? "오출 엑셀을 올리면 냉동 오출이 나옵니다." : mode === "상품" ? "오출 엑셀을 올리면 냉동을 뺀 상품 오출이 나옵니다." : mode === "상위5점" ? "오출 엑셀을 올리면 상위 5점 점포가 나옵니다." : "로케이션은 배치표 점포가 바로 보입니다. 오출 엑셀을 올리면 건수와 금액이 칸에 칠해집니다."
			}),
			temp === "냉동" && mode === "로케이션" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "min-h-0 flex-1" }) : mode === "상품" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 flex-1 overflow-auto px-3 pb-3",
				children: !book ? null : productRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-2 py-6 text-sm font-bold text-muted",
					children: temp === "냉동" ? "냉동 상품 오출이 없습니다." : "냉동을 뺀 상품 오출이 없습니다."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-hidden rounded-2xl bg-white shadow-sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-[13px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "sticky top-0 bg-white text-[11px] text-[#8e8e93]",
							children: [
								["name", "상품명"],
								["dpt", "DPT"],
								["days", "일수"],
								["count", "건"],
								["qty", "수량"],
								["amount", "금액"]
							].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium " + (key === "name" || key === "dpt" ? "text-left" : "text-right"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "bg-transparent font-medium text-[#8e8e93]",
									onClick: () => {
										if (productSort === key) setProductDir((dir) => dir === "asc" ? "desc" : "asc");
										else {
											setProductSort(key);
											setProductDir(key === "name" || key === "dpt" ? "asc" : "desc");
										}
									},
									children: [label, productSort === key ? productDir === "asc" ? " ▲" : " ▼" : ""]
								})
							}, key))
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: productRows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "cursor-pointer border-t border-black/[0.06] hover:bg-[#f2f2f7]",
							onClick: () => setProductSheet({
								code: row.code,
								name: row.name,
								dpt: row.dpt
							}),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 font-semibold text-[#1c1c1e]",
									children: row.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-[#3a3a3c]",
									children: row.dpt
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right tabular-nums",
									children: nf$2.format(row.days)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right tabular-nums",
									children: nf$2.format(row.count)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right tabular-nums",
									children: nf$2.format(row.qty)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right tabular-nums",
									children: moneyShort$1(row.amount)
								})
							]
						}, row.code || row.name)) })]
					})
				})
			}) : temp === "냉동" && mode === "점포" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 flex-1 overflow-auto px-3 pb-3",
				children: !book ? null : storeRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-2 py-6 text-sm font-bold text-muted",
					children: "냉동 점포 오출이 없습니다."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-hidden rounded-2xl bg-white shadow-sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-[13px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "sticky top-0 bg-white text-[11px] text-[#8e8e93]",
							children: [
								["name", "점포명"],
								["days", "일수"],
								["count", "건"],
								["qty", "수량"],
								["amount", "금액"]
							].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium " + (key === "name" ? "text-left" : "text-right"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "bg-transparent font-medium text-[#8e8e93]",
									onClick: () => {
										if (storeSort === key) setStoreDir((dir) => dir === "asc" ? "desc" : "asc");
										else {
											setStoreSort(key);
											setStoreDir(key === "name" ? "asc" : "desc");
										}
									},
									children: [label, storeSort === key ? storeDir === "asc" ? " ▲" : " ▼" : ""]
								})
							}, key))
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: storeRows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "cursor-pointer border-t border-black/[0.06] hover:bg-[#f2f2f7]",
							onClick: () => setSheet({
								loc: row.loc,
								line: row.loc ? where.get(row.loc) ?? 0 : 0,
								store: row.name,
								code: row.code
							}),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 font-semibold text-[#1c1c1e]",
									children: row.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right tabular-nums",
									children: nf$2.format(row.days)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right tabular-nums",
									children: nf$2.format(row.count)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right tabular-nums",
									children: nf$2.format(row.qty)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right tabular-nums",
									children: moneyShort$1(row.amount)
								})
							]
						}, row.code || row.name)) })]
					})
				})
			}) : temp === "냉장" && mode === "상위5점" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 flex-1 overflow-auto px-3 pb-3",
				children: !book ? null : storeRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-2 py-6 text-sm font-bold text-muted",
					children: "상위 점포가 없습니다."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-hidden rounded-2xl bg-white shadow-sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-[13px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "sticky top-0 bg-white text-[11px] text-[#8e8e93]",
							children: [
								[
									"line",
									"라인",
									"left"
								],
								[
									"loc",
									"로케이션",
									"left"
								],
								[
									"name",
									"점포명",
									"left"
								],
								[
									"days",
									"일수",
									"right"
								],
								[
									"count",
									"건",
									"right"
								],
								[
									"qty",
									"수량",
									"right"
								],
								[
									"amount",
									"금액",
									"right"
								]
							].map(([key, label, align]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium " + (align === "left" ? "text-left" : "text-right"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "bg-transparent font-medium text-[#8e8e93] " + (align === "right" ? "w-full text-right" : "text-left"),
									onClick: () => {
										if (storeSort === key) setStoreDir((dir) => dir === "asc" ? "desc" : "asc");
										else {
											setStoreSort(key);
											setStoreDir(key === "name" || key === "loc" ? "asc" : "desc");
										}
									},
									children: [label, storeSort === key ? storeDir === "asc" ? " ▲" : " ▼" : ""]
								})
							}, key))
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: storeRows.slice(0, 5).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "cursor-pointer border-t border-black/[0.06] hover:bg-[#f2f2f7]",
							onClick: () => setSheet({
								loc: row.loc,
								line: row.line,
								store: row.name,
								code: row.code
							}),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 tabular-nums text-[#3a3a3c]",
									children: row.line ? `${row.line}라인` : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-[#3a3a3c]",
									children: row.loc || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 font-semibold text-[#1c1c1e]",
									children: row.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right tabular-nums",
									children: nf$2.format(row.days)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right tabular-nums",
									children: nf$2.format(row.count)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right tabular-nums",
									children: nf$2.format(row.qty)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right tabular-nums",
									children: moneyShort$1(row.amount)
								})
							]
						}, row.code || row.name)) })]
					})
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: boardRef,
				className: "min-h-0 flex-1 overflow-auto bg-bg px-3 py-3 " + (panning ? "cursor-grabbing select-none" : "cursor-grab"),
				onPointerDown: startPan,
				onPointerMove: movePan,
				onPointerUp: endPan,
				onPointerCancel: endPan,
				children: lines.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-2 py-6 text-sm font-bold text-muted",
					children: "볼 라인을 체크해 주세요."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-3",
					style: { width: lines.length * (oneLine ? 720 : 600) + Math.max(0, lines.length - 1) * 12 },
					children: lines.map((item) => {
						let lineCount = 0;
						let lineAmount = 0;
						const lineDates = /* @__PURE__ */ new Set();
						const values = [];
						for (const slot of [...item.left, ...item.right]) {
							if (slot.kind !== "loc") continue;
							const hit = hits.get(slot.code);
							if (!hit) continue;
							lineCount += hit.count;
							lineAmount += hit.amount;
							for (const date of hit.dates) lineDates.add(date);
							const value = shownValue(hit, measure);
							if (value > 0) values.push(value);
						}
						const min = values.length ? Math.min(...values) : 0;
						const max = values.length ? Math.max(...values) : 0;
						const bar = "px-2 py-1.5 text-center text-sm font-bold " + LINE_TONE$1[item.line - 1] + (item.line === 3 ? " text-ink" : " text-on-dark");
						const head = measure === "금액" ? moneyShort$1(lineAmount) : measure === "오출 일수" ? `${nf$2.format(lineDates.size)}일` : nf$2.format(lineCount);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "shrink-0 overflow-hidden rounded-md border border-grid bg-paper shadow-sm " + (oneLine ? "w-[720px]" : "w-[600px]"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: bar,
									children: [Pn[item.line - 1], /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "ml-2 tabular-nums",
										children: head
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid min-w-0 grid-cols-[minmax(0,1fr)_10px_minmax(0,1fr)] gap-1 p-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid min-w-0 content-start gap-0.5 overflow-hidden",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Columns, {
													side: "left",
													unit: measure
												}),
												drawnSlots(item.left).map((drawn) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OshipCell, {
													slot: drawn.span > 1 ? {
														...drawn.slot,
														span: drawn.span
													} : drawn.slot,
													side: "left",
													big: oneLine,
													measure,
													min,
													max,
													line: item.line,
													hit: drawn.slot.kind === "loc" ? hits.get(drawn.slot.code) : void 0
												}, `L${drawn.index}`)),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Columns, {
													side: "left",
													unit: measure
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "loc-aisle rounded-sm" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid min-w-0 content-start gap-0.5 overflow-hidden",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Columns, {
													side: "right",
													unit: measure
												}),
												drawnSlots(item.right).map((drawn) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OshipCell, {
													slot: drawn.span > 1 ? {
														...drawn.slot,
														span: drawn.span
													} : drawn.slot,
													side: "right",
													big: oneLine,
													measure,
													min,
													max,
													line: item.line,
													hit: drawn.slot.kind === "loc" ? hits.get(drawn.slot.code) : void 0
												}, `R${drawn.index}`)),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Columns, {
													side: "right",
													unit: measure
												})
											]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: bar,
									children: [Pn[item.line - 1], /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "ml-2 tabular-nums",
										children: head
									})]
								})
							]
						}, item.line);
					})
				})
			}),
			sheet && typeof document !== "undefined" ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6",
				onClick: () => setSheet(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-modal": "true",
					"aria-label": sheet.line ? `${sheet.line}라인 오출` : "오출",
					className: "flex h-[420px] w-full max-w-[860px] overflow-hidden rounded-[22px] bg-[#f2f2f7] shadow-[0_18px_50px_rgba(0,0,0,0.22)]",
					onClick: (event) => event.stopPropagation(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "flex w-[300px] shrink-0 flex-col px-4 pb-4 pt-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-[17px] font-semibold tracking-tight text-[#1c1c1e]",
										children: [sheet.code, shortStoreName$2(sheet.store)].filter(Boolean).join(" ")
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-[13px] text-[#8e8e93]",
										children: [
											center,
											sheet.line ? `${sheet.line}라인` : "",
											sheet.loc
										].filter(Boolean).join(" ")
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrintButton, { onClick: () => {
									const reasons = sheetSum.reasons.map(([name, box]) => `<tr><td>${escPrint$1(name)}</td><td class="r">${nf$2.format(box.count)}</td><td class="r">${escPrint$1(moneyShort$1(box.amount))}</td></tr>`).join("");
									const lines = visibleSheetRows.map((row) => `<tr><td>${escPrint$1(row.date.slice(5))}</td><td>${escPrint$1(row.goods || "상품명 없음")}<div class="sub">${escPrint$1(`${row.dpt} · ${row.group}`)}</div></td><td class="r">${nf$2.format(row.qty)}</td><td class="r">${escPrint$1(moneyShort$1(row.amount))}</td><td>${escPrint$1(row.reason)}</td></tr>`).join("");
									const chartLabel = sheetChart === "count" ? "건" : sheetChart === "qty" ? "수량" : "금액";
									const chartValues = sheetTrend.map((row) => ({
										date: row.date,
										value: sheetChart === "count" ? row.count : Math.abs(row[sheetChart])
									}));
									printHtml$1(sheet.store, `<h1>${escPrint$1([sheet.code, shortStoreName$2(sheet.store)].filter(Boolean).join(" "))}</h1><p class="sub">${escPrint$1([
										center,
										sheet.line ? `${sheet.line}라인` : "",
										sheet.loc
									].filter(Boolean).join(" "))}</p><div class="stats"><div><span>일수</span><b>${nf$2.format(sheetSum.days)}</b></div><div><span>건</span><b>${nf$2.format(sheetSum.count)}</b></div><div><span>수량</span><b>${nf$2.format(sheetSum.qty)}</b></div><div><span>금액</span><b>${escPrint$1(moneyShort$1(sheetSum.amount))}</b></div></div><h2>${escPrint$1(chartLabel)} 추이</h2>${chartMarkup(chartValues, chartLabel)}<h2>미오출사유</h2><table><thead><tr><th>미오출사유</th><th class="r">건수</th><th class="r">금액</th></tr></thead><tbody>${reasons}</tbody></table><h2>상품</h2><table><thead><tr><th>출고일</th><th>상품명</th><th class="r">수량</th><th class="r">금액</th><th>사유</th></tr></thead><tbody>${lines}</tbody></table>`);
								} })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative z-30 mt-2.5 grid grid-cols-2 gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
									compact: true,
									fill: true,
									label: "DPT",
									text: sheetDptAll ? "DPT" : pickedSheetDpts.length === 0 ? "없음" : pickedSheetDpts.join(", "),
									rows: [{
										id: "전체",
										label: "전체",
										checked: sheetDptAll && sheetDptOptions.length > 0
									}, ...sheetDptOptions.map((id) => ({
										id,
										label: id,
										checked: pickedSheetDpts.includes(id)
									}))],
									onToggle: (id) => {
										if (id === "전체") {
											setSheetDpts(sheetDptAll ? [] : null);
											return;
										}
										const current = sheetDpts == null ? [...sheetDptOptions] : sheetDpts.filter((item) => sheetDptOptions.includes(item));
										const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
										setSheetDpts(sheetDptOptions.every((item) => next.includes(item)) ? null : next);
									}
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
									compact: true,
									fill: true,
									end: true,
									label: "사유",
									text: sheetReasonAll ? "사유" : pickedSheetReasons.length === 0 ? "없음" : pickedSheetReasons.join(", "),
									rows: [{
										id: "전체",
										label: "전체",
										checked: sheetReasonAll && sheetReasonChoices.length > 0
									}, ...sheetReasonChoices.map((id) => ({
										id,
										label: id,
										checked: pickedSheetReasons.includes(id)
									}))],
									onToggle: (id) => {
										if (id === "전체") {
											setSheetReasonPick(sheetReasonAll ? [] : null);
											return;
										}
										const current = sheetReasonPick == null ? [...sheetReasonChoices] : sheetReasonPick.filter((item) => sheetReasonChoices.includes(item));
										const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
										setSheetReasonPick(sheetReasonChoices.every((item) => next.includes(item)) ? null : next);
									}
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendLine, {
								unit: sheetChart === "count" ? "건" : sheetChart === "qty" ? "수량" : "금액",
								points: sheetTrend.map((row) => ({
									date: row.date,
									raw: row[sheetChart],
									value: sheetChart === "count" ? row.count : Math.abs(row[sheetChart])
								}))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1.5 grid grid-cols-4 gap-1.5",
								children: [
									[
										"일수",
										nf$2.format(sheetSum.days),
										""
									],
									[
										"건",
										nf$2.format(sheetSum.count),
										"count"
									],
									[
										"수량",
										nf$2.format(sheetSum.qty),
										"qty"
									],
									[
										"금액",
										moneyShort$1(sheetSum.amount),
										"amount"
									]
								].map(([label, value, key]) => {
									const on = key !== "" && sheetChart === key;
									if (!key) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl bg-white px-1.5 py-1.5 text-center shadow-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-medium text-[#8e8e93]",
											children: label
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "truncate text-[13px] font-semibold tabular-nums text-[#1c1c1e]",
											children: value
										})]
									}, label);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "rounded-xl bg-white px-1.5 py-1.5 text-center shadow-sm " + (on ? "ring-1 ring-[#007aff]" : ""),
										onClick: () => setSheetChart(key),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-medium " + (on ? "text-[#007aff]" : "text-[#8e8e93]"),
											children: label
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "truncate text-[13px] font-semibold tabular-nums text-[#1c1c1e]",
											children: value
										})]
									}, label);
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2.5 min-h-0 flex-1 overflow-auto rounded-2xl bg-white shadow-sm",
								children: sheetSum.reasons.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "px-3 py-6 text-center text-[13px] text-[#8e8e93]",
									children: "이 점포의 오출이 없습니다."
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
									className: "w-full text-[13px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "sticky top-0 bg-white text-[11px] text-[#8e8e93]",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2 text-left font-medium",
												children: "미오출사유"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 text-right font-medium",
												children: "건수"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2 text-right font-medium",
												children: "금액"
											})
										]
									}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: sheetSum.reasons.map(([name, box]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-t border-black/[0.06]",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-3 py-2 text-[#1c1c1e]",
												children: name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-2 text-right tabular-nums text-[#1c1c1e]",
												children: nf$2.format(box.count)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-3 py-2 text-right tabular-nums text-[#1c1c1e]",
												children: moneyShort$1(box.amount)
											})
										]
									}, name)) })]
								})
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex min-w-0 flex-1 flex-col py-4 pr-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "min-h-0 flex-1 overflow-auto rounded-2xl bg-white shadow-sm",
							children: visibleSheetRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "px-3 py-6 text-center text-[13px] text-[#8e8e93]",
								children: "이 점포의 오출이 없습니다."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-full text-[13px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
									className: "sticky top-0 bg-white text-[11px] text-[#8e8e93]",
									children: [
										["date", "출고일"],
										["goods", "상품명"],
										["qty", "수량"],
										["amount", "금액"],
										["reason", "사유"]
									].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-2 py-2 font-medium " + (key === "goods" || key === "reason" ? "text-left" : "text-center"),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "bg-transparent font-medium text-[#8e8e93] " + (key === "goods" || key === "reason" ? "text-left" : "w-full text-center"),
											onClick: () => {
												if (sheetSort === key) setSheetDir((dir) => dir === "asc" ? "desc" : "asc");
												else {
													setSheetSort(key);
													setSheetDir(key === "qty" || key === "amount" ? "desc" : "asc");
												}
											},
											children: [label, sheetSort === key ? sheetDir === "asc" ? " ▲" : " ▼" : ""]
										})
									}, key))
								}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: visibleSheetRows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-t border-black/[0.06]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "whitespace-nowrap px-2 py-1.5 text-center tabular-nums text-[#3a3a3c]",
											children: row.date.slice(5)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "min-w-0 px-2 py-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "truncate font-semibold text-[#1c1c1e]",
												children: row.goods || "상품명 없음"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "truncate text-[11px] text-[#8e8e93]",
												children: [
													row.dpt,
													" · ",
													row.group
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-2 py-1.5 text-center tabular-nums",
											children: nf$2.format(row.qty)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "whitespace-nowrap px-2 py-1.5 text-center tabular-nums",
											children: moneyShort$1(row.amount)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-2 py-1.5 text-[#3a3a3c]",
											children: row.reason
										})
									]
								}, `${row.date}-${row.goods}-${index}`)) })]
							})
						})
					})]
				})
			}), document.body) : null,
			productSheet && typeof document !== "undefined" ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6",
				onClick: () => setProductSheet(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-modal": "true",
					"aria-label": productSheet.name,
					className: "flex h-[460px] w-full max-w-[860px] flex-col overflow-hidden rounded-[22px] bg-[#f2f2f7] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)]",
					onClick: (event) => event.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-[17px] font-semibold tracking-tight text-[#1c1c1e]",
									children: productSheet.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-[13px] text-[#8e8e93]",
									children: productSheet.dpt
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrintButton, { onClick: () => {
								const lines = visibleProductRows.map((row) => `<tr><td>${escPrint$1(row.date)}</td><td>${escPrint$1(routeOf(row) || "없음")}</td><td>${escPrint$1(locOf.get(row.storeCd) || "—")}</td><td>${escPrint$1(row.storeNm)}</td><td class="r">${nf$2.format(row.qty)}</td><td class="r">${escPrint$1(moneyShort$1(row.amount))}</td><td>${escPrint$1(row.reason)}</td></tr>`).join("");
								printHtml$1(productSheet.name, `<h1>${escPrint$1(productSheet.name)}</h1><p class="sub">${escPrint$1(productSheet.dpt)}</p><div class="stats"><div><span>일수</span><b>${nf$2.format(productSum.days)}</b></div><div><span>건</span><b>${nf$2.format(productSum.count)}</b></div><div><span>수량</span><b>${nf$2.format(productSum.qty)}</b></div><div><span>금액</span><b>${escPrint$1(moneyShort$1(productSum.amount))}</b></div></div><table><thead><tr><th>출고일</th><th>루트</th><th>로케이션</th><th>점포명</th><th class="r">수량</th><th class="r">금액</th><th>사유</th></tr></thead><tbody>${lines}</tbody></table>`);
							} })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative z-30 mt-2.5 grid grid-cols-3 gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
									compact: true,
									fill: true,
									search: true,
									searchLabel: "루트 검색",
									label: "루트",
									onSearch: (next) => {
										setDetailRouteQuery(next);
										if (!next.trim()) setDetailRoutes(null);
									},
									text: detailRouteQuery.trim() ? detailRouteQuery.trim() : detailRouteAll ? "루트" : pickedDetailRoutes.length === 0 ? "없음" : pickedDetailRoutes.join(", "),
									rows: [{
										id: "전체",
										label: "전체",
										checked: !detailRouteNeedle && detailRouteAll && detailRouteOptions.length > 0
									}, ...detailRouteOptions.map((id) => ({
										id,
										label: id,
										checked: detailRouteNeedle ? id.toLowerCase().includes(detailRouteNeedle) : pickedDetailRoutes.includes(id)
									}))],
									onToggle: (id) => {
										setDetailRouteQuery("");
										if (id === "전체") {
											setDetailRoutes(detailRouteAll ? [] : null);
											return;
										}
										const current = detailRoutes == null ? [...detailRouteOptions] : detailRoutes.filter((item) => detailRouteOptions.includes(item));
										const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
										setDetailRoutes(detailRouteOptions.every((item) => next.includes(item)) ? null : next);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
									compact: true,
									fill: true,
									search: true,
									searchLabel: "점포 검색",
									label: "점포명",
									onSearch: (next) => {
										setDetailStoreQuery(next);
										if (!next.trim()) setDetailStores(null);
									},
									text: detailStoreQuery.trim() ? detailStoreQuery.trim() : detailStoreAll ? "점포명" : pickedDetailStores.length === 0 ? "없음" : pickedDetailStores.join(", "),
									rows: [{
										id: "전체",
										label: "전체",
										checked: !detailStoreNeedle && detailStoreAll && detailStoreOptions.length > 0
									}, ...detailStoreOptions.map((id) => ({
										id,
										label: id,
										checked: detailStoreNeedle ? id.toLowerCase().includes(detailStoreNeedle) : pickedDetailStores.includes(id)
									}))],
									onToggle: (id) => {
										setDetailStoreQuery("");
										if (id === "전체") {
											setDetailStores(detailStoreAll ? [] : null);
											return;
										}
										const current = detailStores == null ? [...detailStoreOptions] : detailStores.filter((item) => detailStoreOptions.includes(item));
										const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
										setDetailStores(detailStoreOptions.every((item) => next.includes(item)) ? null : next);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
									compact: true,
									fill: true,
									end: true,
									search: true,
									searchLabel: "사유 검색",
									label: "사유",
									onSearch: (next) => {
										setDetailReasonQuery(next);
										if (!next.trim()) setDetailReasons(null);
									},
									text: detailReasonQuery.trim() ? detailReasonQuery.trim() : detailReasonAll ? "사유" : pickedDetailReasons.length === 0 ? "없음" : pickedDetailReasons.join(", "),
									rows: [{
										id: "전체",
										label: "전체",
										checked: !detailReasonNeedle && detailReasonAll && detailReasonOptions.length > 0
									}, ...detailReasonOptions.map((id) => ({
										id,
										label: id,
										checked: detailReasonNeedle ? id.toLowerCase().includes(detailReasonNeedle) : pickedDetailReasons.includes(id)
									}))],
									onToggle: (id) => {
										setDetailReasonQuery("");
										if (id === "전체") {
											setDetailReasons(detailReasonAll ? [] : null);
											return;
										}
										const current = detailReasons == null ? [...detailReasonOptions] : detailReasons.filter((item) => detailReasonOptions.includes(item));
										const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
										setDetailReasons(detailReasonOptions.every((item) => next.includes(item)) ? null : next);
									}
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2.5 grid grid-cols-4 gap-1.5",
							children: [
								["일수", nf$2.format(productSum.days)],
								["건", nf$2.format(productSum.count)],
								["수량", nf$2.format(productSum.qty)],
								["금액", moneyShort$1(productSum.amount)]
							].map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl bg-white px-1.5 py-1.5 text-center shadow-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-medium text-[#8e8e93]",
									children: label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-[13px] font-semibold tabular-nums text-[#1c1c1e]",
									children: value
								})]
							}, label))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2.5 min-h-0 flex-1 overflow-auto rounded-2xl bg-white shadow-sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-full text-[13px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
									className: "sticky top-0 bg-white text-[11px] text-[#8e8e93]",
									children: [
										[
											"date",
											"출고일",
											"left"
										],
										[
											"route",
											"루트",
											"left"
										],
										[
											"loc",
											"로케이션",
											"left"
										],
										[
											"store",
											"점포명",
											"left"
										],
										[
											"qty",
											"수량",
											"right"
										],
										[
											"amount",
											"금액",
											"right"
										],
										[
											"reason",
											"사유",
											"left"
										]
									].map(([key, label, align]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2 font-medium " + (align === "right" ? "text-right" : "text-left"),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "bg-transparent font-medium text-[#8e8e93] " + (align === "right" ? "w-full text-right" : "text-left"),
											onClick: () => {
												if (detailSort === key) setDetailDir((dir) => dir === "asc" ? "desc" : "asc");
												else {
													setDetailSort(key);
													setDetailDir(key === "qty" || key === "amount" ? "desc" : "asc");
												}
											},
											children: [label, detailSort === key ? detailDir === "asc" ? " ▲" : " ▼" : ""]
										})
									}, key))
								}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: visibleProductRows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-t border-black/[0.06]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "whitespace-nowrap px-3 py-1.5 tabular-nums text-[#3a3a3c]",
											children: row.date
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "whitespace-nowrap px-3 py-1.5 tabular-nums text-[#1c1c1e]",
											children: routeOf(row) || "없음"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "whitespace-nowrap px-3 py-1.5 tabular-nums text-[#3a3a3c]",
											children: locOf.get(row.storeCd) || "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "max-w-[220px] truncate px-3 py-1.5 font-semibold text-[#1c1c1e]",
											title: row.storeNm,
											children: row.storeNm
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-3 py-1.5 text-right tabular-nums",
											children: nf$2.format(row.qty)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-3 py-1.5 text-right tabular-nums",
											children: moneyShort$1(row.amount)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-3 py-1.5 text-[#3a3a3c]",
											children: row.reason
										})
									]
								}, `${row.date}-${row.storeCd}-${index}`)) })]
							})
						})
					]
				})
			}), document.body) : null
		]
	});
}
var OSAN_FROZEN_FILE = "로케이션등록관리-로케이션목록-20261112.xlsx";
var OSAN_FROZEN_DAY = "2026-11-12";
var OSAN_FROZEN = [
	[
		"",
		"RTR",
		"RTR"
	],
	[
		"",
		"CDC",
		"CDC"
	],
	[
		"",
		"RCV",
		"BDRCV"
	],
	[
		"",
		"RCV",
		"RCV"
	],
	[
		"",
		"ABC",
		"ABC01"
	],
	[
		"",
		"SHOL",
		"SHOL01"
	],
	[
		"",
		"SHOL",
		"SHOL02"
	],
	[
		"130111",
		"A",
		"A1A01A1"
	],
	[
		"130121",
		"A",
		"A1A01B1"
	],
	[
		"130122",
		"A",
		"A1A01B2"
	],
	[
		"130211",
		"A",
		"A1A02A1"
	],
	[
		"130212",
		"A",
		"A1A02A2"
	],
	[
		"130221",
		"A",
		"A1A02B1"
	],
	[
		"130222",
		"A",
		"A1A02B2"
	],
	[
		"130223",
		"A",
		"A1A02B3"
	],
	[
		"130224",
		"A",
		"A1A02B4"
	],
	[
		"130311",
		"A",
		"A1A03A1"
	],
	[
		"130312",
		"A",
		"A1A03A2"
	],
	[
		"130321",
		"A",
		"A1A03B1"
	],
	[
		"130322",
		"A",
		"A1A03B2"
	],
	[
		"130323",
		"A",
		"A1A03B3"
	],
	[
		"130324",
		"A",
		"A1A03B4"
	],
	[
		"140411",
		"A",
		"A1A04A1"
	],
	[
		"140412",
		"A",
		"A1A04A2"
	],
	[
		"140413",
		"A",
		"A1A04A3"
	],
	[
		"140414",
		"A",
		"A1A04A4"
	],
	[
		"140421",
		"A",
		"A1A04B1"
	],
	[
		"140422",
		"A",
		"A1A04B2"
	],
	[
		"140423",
		"A",
		"A1A04B3"
	],
	[
		"140424",
		"A",
		"A1A04B4"
	],
	[
		"150611",
		"A",
		"A1A05A1"
	],
	[
		"150612",
		"A",
		"A1A05A2"
	],
	[
		"150613",
		"A",
		"A1A05A3"
	],
	[
		"150614",
		"A",
		"A1A05A4"
	],
	[
		"150621",
		"A",
		"A1A05B1"
	],
	[
		"150622",
		"A",
		"A1A05B2"
	],
	[
		"150623",
		"A",
		"A1A05B3"
	],
	[
		"150624",
		"A",
		"A1A05B4"
	],
	[
		"150631",
		"A",
		"A1A05C1"
	],
	[
		"150632",
		"A",
		"A1A05C2"
	],
	[
		"150633",
		"A",
		"A1A05C3"
	],
	[
		"150634",
		"A",
		"A1A05C4"
	],
	[
		"135111",
		"A",
		"A1A06A1"
	],
	[
		"135112",
		"A",
		"A1A06A2"
	],
	[
		"135121",
		"A",
		"A1A06B1"
	],
	[
		"135122",
		"A",
		"A1A06B2"
	],
	[
		"135123",
		"A",
		"A1A06B3"
	],
	[
		"135124",
		"A",
		"A1A06B4"
	],
	[
		"135211",
		"A",
		"A1A07A1"
	],
	[
		"135212",
		"A",
		"A1A07A2"
	],
	[
		"135221",
		"A",
		"A1A07B1"
	],
	[
		"135222",
		"A",
		"A1A07B2"
	],
	[
		"135223",
		"A",
		"A1A07B3"
	],
	[
		"135224",
		"A",
		"A1A07B4"
	],
	[
		"135311",
		"A",
		"A1A08A1"
	],
	[
		"135312",
		"A",
		"A1A08A2"
	],
	[
		"135321",
		"A",
		"A1A08B1"
	],
	[
		"135322",
		"A",
		"A1A08B2"
	],
	[
		"135323",
		"A",
		"A1A08B3"
	],
	[
		"135324",
		"A",
		"A1A08B4"
	],
	[
		"145411",
		"A",
		"A1A09A1"
	],
	[
		"145412",
		"A",
		"A1A09A2"
	],
	[
		"145413",
		"A",
		"A1A09A3"
	],
	[
		"145414",
		"A",
		"A1A09A4"
	],
	[
		"145421",
		"A",
		"A1A09B1"
	],
	[
		"145422",
		"A",
		"A1A09B2"
	],
	[
		"145423",
		"A",
		"A1A09B3"
	],
	[
		"145424",
		"A",
		"A1A09B4"
	],
	[
		"145511",
		"A",
		"A1A10A1"
	],
	[
		"145512",
		"A",
		"A1A10A2"
	],
	[
		"145513",
		"A",
		"A1A10A3"
	],
	[
		"145514",
		"A",
		"A1A10A4"
	],
	[
		"145521",
		"A",
		"A1A10B1"
	],
	[
		"145522",
		"A",
		"A1A10B2"
	],
	[
		"145523",
		"A",
		"A1A10B3"
	],
	[
		"145524",
		"A",
		"A1A10B4"
	],
	[
		"155611",
		"A",
		"A1A11A1"
	],
	[
		"155612",
		"A",
		"A1A11A2"
	],
	[
		"155613",
		"A",
		"A1A11A3"
	],
	[
		"155614",
		"A",
		"A1A11A4"
	],
	[
		"155621",
		"A",
		"A1A11B1"
	],
	[
		"155622",
		"A",
		"A1A11B2"
	],
	[
		"155623",
		"A",
		"A1A11B3"
	],
	[
		"155624",
		"A",
		"A1A11B4"
	],
	[
		"155631",
		"A",
		"A1A11C1"
	],
	[
		"155632",
		"A",
		"A1A11C2"
	],
	[
		"155633",
		"A",
		"A1A11C3"
	],
	[
		"155634",
		"A",
		"A1A11C4"
	],
	[
		"",
		"AL",
		"CD101"
	],
	[
		"160111",
		"B",
		"A1B01A1"
	],
	[
		"160112",
		"B",
		"A1B01A2"
	],
	[
		"160121",
		"B",
		"A1B01B1"
	],
	[
		"160122",
		"B",
		"A1B01B2"
	],
	[
		"160123",
		"B",
		"A1B01B3"
	],
	[
		"160124",
		"B",
		"A1B01B4"
	],
	[
		"160211",
		"B",
		"A1B02A1"
	],
	[
		"160212",
		"B",
		"A1B02A2"
	],
	[
		"160221",
		"B",
		"A1B02B1"
	],
	[
		"160222",
		"B",
		"A1B02B2"
	],
	[
		"160223",
		"B",
		"A1B02B3"
	],
	[
		"160224",
		"B",
		"A1B02B4"
	],
	[
		"160311",
		"B",
		"A1B03A1"
	],
	[
		"160312",
		"B",
		"A1B03A2"
	],
	[
		"160321",
		"B",
		"A1B03B1"
	],
	[
		"160322",
		"B",
		"A1B03B2"
	],
	[
		"160323",
		"B",
		"A1B03B3"
	],
	[
		"160324",
		"B",
		"A1B03B4"
	],
	[
		"170411",
		"B",
		"A1B04A1"
	],
	[
		"170412",
		"B",
		"A1B04A2"
	],
	[
		"170413",
		"B",
		"A1B04A3"
	],
	[
		"170414",
		"B",
		"A1B04A4"
	],
	[
		"170421",
		"B",
		"A1B04B1"
	],
	[
		"170422",
		"B",
		"A1B04B2"
	],
	[
		"170423",
		"B",
		"A1B04B3"
	],
	[
		"170424",
		"B",
		"A1B04B4"
	],
	[
		"170511",
		"B",
		"A1B05A1"
	],
	[
		"170512",
		"B",
		"A1B05A2"
	],
	[
		"170513",
		"B",
		"A1B05A3"
	],
	[
		"170514",
		"B",
		"A1B05A4"
	],
	[
		"170521",
		"B",
		"A1B05B1"
	],
	[
		"170522",
		"B",
		"A1B05B2"
	],
	[
		"170523",
		"B",
		"A1B05B3"
	],
	[
		"170524",
		"B",
		"A1B05B4"
	],
	[
		"180611",
		"B",
		"A1B06A1"
	],
	[
		"180612",
		"B",
		"A1B06A2"
	],
	[
		"180613",
		"B",
		"A1B06A3"
	],
	[
		"180614",
		"B",
		"A1B06A4"
	],
	[
		"180621",
		"B",
		"A1B06B1"
	],
	[
		"180622",
		"B",
		"A1B06B2"
	],
	[
		"180623",
		"B",
		"A1B06B3"
	],
	[
		"180624",
		"B",
		"A1B06B4"
	],
	[
		"180631",
		"B",
		"A1B06C1"
	],
	[
		"180632",
		"B",
		"A1B06C2"
	],
	[
		"180633",
		"B",
		"A1B06C3"
	],
	[
		"180634",
		"B",
		"A1B06C4"
	],
	[
		"165111",
		"B",
		"A1B07A1"
	],
	[
		"165112",
		"B",
		"A1B07A2"
	],
	[
		"165121",
		"B",
		"A1B07B1"
	],
	[
		"165122",
		"B",
		"A1B07B2"
	],
	[
		"165123",
		"B",
		"A1B07B3"
	],
	[
		"165124",
		"B",
		"A1B07B4"
	],
	[
		"165211",
		"B",
		"A1B08A1"
	],
	[
		"165212",
		"B",
		"A1B08A2"
	],
	[
		"165221",
		"B",
		"A1B08B1"
	],
	[
		"165222",
		"B",
		"A1B08B2"
	],
	[
		"165223",
		"B",
		"A1B08B3"
	],
	[
		"165224",
		"B",
		"A1B08B4"
	],
	[
		"165311",
		"B",
		"A1B09A1"
	],
	[
		"165312",
		"B",
		"A1B09A2"
	],
	[
		"165321",
		"B",
		"A1B09B1"
	],
	[
		"165322",
		"B",
		"A1B09B2"
	],
	[
		"165323",
		"B",
		"A1B09B3"
	],
	[
		"165324",
		"B",
		"A1B09B4"
	],
	[
		"175411",
		"B",
		"A1B10A1"
	],
	[
		"175412",
		"B",
		"A1B10A2"
	],
	[
		"175413",
		"B",
		"A1B10A3"
	],
	[
		"175414",
		"B",
		"A1B10A4"
	],
	[
		"175421",
		"B",
		"A1B10B1"
	],
	[
		"175422",
		"B",
		"A1B10B2"
	],
	[
		"175423",
		"B",
		"A1B10B3"
	],
	[
		"175424",
		"B",
		"A1B10B4"
	],
	[
		"175511",
		"B",
		"A1B11A1"
	],
	[
		"175512",
		"B",
		"A1B11A2"
	],
	[
		"175513",
		"B",
		"A1B11A3"
	],
	[
		"175514",
		"B",
		"A1B11A4"
	],
	[
		"175521",
		"B",
		"A1B11B1"
	],
	[
		"175522",
		"B",
		"A1B11B2"
	],
	[
		"175523",
		"B",
		"A1B11B3"
	],
	[
		"175524",
		"B",
		"A1B11B4"
	],
	[
		"185611",
		"B",
		"A1B12A1"
	],
	[
		"185612",
		"B",
		"A1B12A2"
	],
	[
		"185613",
		"B",
		"A1B12A3"
	],
	[
		"185614",
		"B",
		"A1B12A4"
	],
	[
		"185621",
		"B",
		"A1B12B1"
	],
	[
		"185622",
		"B",
		"A1B12B2"
	],
	[
		"185623",
		"B",
		"A1B12B3"
	],
	[
		"185624",
		"B",
		"A1B12B4"
	],
	[
		"185631",
		"B",
		"A1B12C1"
	],
	[
		"185632",
		"B",
		"A1B12C2"
	],
	[
		"185633",
		"B",
		"A1B12C3"
	],
	[
		"185634",
		"B",
		"A1B12C4"
	],
	[
		"010111",
		"C",
		"A1C01A1"
	],
	[
		"010112",
		"C",
		"A1C01A2"
	],
	[
		"010113",
		"C",
		"A1C01A3"
	],
	[
		"010114",
		"C",
		"A1C01A4"
	],
	[
		"010115",
		"C",
		"A1C01A5"
	],
	[
		"010121",
		"C",
		"A1C01B1"
	],
	[
		"010122",
		"C",
		"A1C01B2"
	],
	[
		"010123",
		"C",
		"A1C01B3"
	],
	[
		"010124",
		"C",
		"A1C01B4"
	],
	[
		"010125",
		"C",
		"A1C01B5"
	],
	[
		"010131",
		"C",
		"A1C01C1"
	],
	[
		"010132",
		"C",
		"A1C01C2"
	],
	[
		"010133",
		"C",
		"A1C01C3"
	],
	[
		"010134",
		"C",
		"A1C01C4"
	],
	[
		"010135",
		"C",
		"A1C01C5"
	],
	[
		"010141",
		"C",
		"A1C01D1"
	],
	[
		"010142",
		"C",
		"A1C01D2"
	],
	[
		"010143",
		"C",
		"A1C01D3"
	],
	[
		"010144",
		"C",
		"A1C01D4"
	],
	[
		"010145",
		"C",
		"A1C01D5"
	],
	[
		"030211",
		"C",
		"A1C02A1"
	],
	[
		"030212",
		"C",
		"A1C02A2"
	],
	[
		"030213",
		"C",
		"A1C02A3"
	],
	[
		"030214",
		"C",
		"A1C02A4"
	],
	[
		"030215",
		"C",
		"A1C02A5"
	],
	[
		"030221",
		"C",
		"A1C02B1"
	],
	[
		"030222",
		"C",
		"A1C02B2"
	],
	[
		"030223",
		"C",
		"A1C02B3"
	],
	[
		"030224",
		"C",
		"A1C02B4"
	],
	[
		"030225",
		"C",
		"A1C02B5"
	],
	[
		"030231",
		"C",
		"A1C02C1"
	],
	[
		"030232",
		"C",
		"A1C02C2"
	],
	[
		"030233",
		"C",
		"A1C02C3"
	],
	[
		"030234",
		"C",
		"A1C02C4"
	],
	[
		"030235",
		"C",
		"A1C02C5"
	],
	[
		"030241",
		"C",
		"A1C02D1"
	],
	[
		"030242",
		"C",
		"A1C02D2"
	],
	[
		"030243",
		"C",
		"A1C02D3"
	],
	[
		"030244",
		"C",
		"A1C02D4"
	],
	[
		"030245",
		"C",
		"A1C02D5"
	],
	[
		"050311",
		"C",
		"A1C03A1"
	],
	[
		"050312",
		"C",
		"A1C03A2"
	],
	[
		"050313",
		"C",
		"A1C03A3"
	],
	[
		"050314",
		"C",
		"A1C03A4"
	],
	[
		"050315",
		"C",
		"A1C03A5"
	],
	[
		"050321",
		"C",
		"A1C03B1"
	],
	[
		"050322",
		"C",
		"A1C03B2"
	],
	[
		"050323",
		"C",
		"A1C03B3"
	],
	[
		"050324",
		"C",
		"A1C03B4"
	],
	[
		"050325",
		"C",
		"A1C03B5"
	],
	[
		"050331",
		"C",
		"A1C03C1"
	],
	[
		"050332",
		"C",
		"A1C03C2"
	],
	[
		"050333",
		"C",
		"A1C03C3"
	],
	[
		"050334",
		"C",
		"A1C03C4"
	],
	[
		"050335",
		"C",
		"A1C03C5"
	],
	[
		"050341",
		"C",
		"A1C03D1"
	],
	[
		"050342",
		"C",
		"A1C03D2"
	],
	[
		"050343",
		"C",
		"A1C03D3"
	],
	[
		"050344",
		"C",
		"A1C03D4"
	],
	[
		"050345",
		"C",
		"A1C03D5"
	],
	[
		"070411",
		"C",
		"A1C04A1"
	],
	[
		"070412",
		"C",
		"A1C04A2"
	],
	[
		"070413",
		"C",
		"A1C04A3"
	],
	[
		"070414",
		"C",
		"A1C04A4"
	],
	[
		"070415",
		"C",
		"A1C04A5"
	],
	[
		"070421",
		"C",
		"A1C04B1"
	],
	[
		"070422",
		"C",
		"A1C04B2"
	],
	[
		"070423",
		"C",
		"A1C04B3"
	],
	[
		"070424",
		"C",
		"A1C04B4"
	],
	[
		"070425",
		"C",
		"A1C04B5"
	],
	[
		"070431",
		"C",
		"A1C04C1"
	],
	[
		"070432",
		"C",
		"A1C04C2"
	],
	[
		"070433",
		"C",
		"A1C04C3"
	],
	[
		"070434",
		"C",
		"A1C04C4"
	],
	[
		"070435",
		"C",
		"A1C04C5"
	],
	[
		"070441",
		"C",
		"A1C04D1"
	],
	[
		"070442",
		"C",
		"A1C04D2"
	],
	[
		"070443",
		"C",
		"A1C04D3"
	],
	[
		"070444",
		"C",
		"A1C04D4"
	],
	[
		"070445",
		"C",
		"A1C04D5"
	],
	[
		"090511",
		"C",
		"A1C05A1"
	],
	[
		"090512",
		"C",
		"A1C05A2"
	],
	[
		"090513",
		"C",
		"A1C05A3"
	],
	[
		"090514",
		"C",
		"A1C05A4"
	],
	[
		"090515",
		"C",
		"A1C05A5"
	],
	[
		"090521",
		"C",
		"A1C05B1"
	],
	[
		"090522",
		"C",
		"A1C05B2"
	],
	[
		"090523",
		"C",
		"A1C05B3"
	],
	[
		"090524",
		"C",
		"A1C05B4"
	],
	[
		"090525",
		"C",
		"A1C05B5"
	],
	[
		"090531",
		"C",
		"A1C05C1"
	],
	[
		"090532",
		"C",
		"A1C05C2"
	],
	[
		"090533",
		"C",
		"A1C05C3"
	],
	[
		"090534",
		"C",
		"A1C05C4"
	],
	[
		"090535",
		"C",
		"A1C05C5"
	],
	[
		"090541",
		"C",
		"A1C05D1"
	],
	[
		"090542",
		"C",
		"A1C05D2"
	],
	[
		"090543",
		"C",
		"A1C05D3"
	],
	[
		"090544",
		"C",
		"A1C05D4"
	],
	[
		"090545",
		"C",
		"A1C05D5"
	],
	[
		"090551",
		"C",
		"A1C05E1"
	],
	[
		"090552",
		"C",
		"A1C05E2"
	],
	[
		"090553",
		"C",
		"A1C05E3"
	],
	[
		"090554",
		"C",
		"A1C05E4"
	],
	[
		"090555",
		"C",
		"A1C05E5"
	],
	[
		"110611",
		"C",
		"A1C06A1"
	],
	[
		"110612",
		"C",
		"A1C06A2"
	],
	[
		"110613",
		"C",
		"A1C06A3"
	],
	[
		"110614",
		"C",
		"A1C06A4"
	],
	[
		"110615",
		"C",
		"A1C06A5"
	],
	[
		"110621",
		"C",
		"A1C06B1"
	],
	[
		"110622",
		"C",
		"A1C06B2"
	],
	[
		"110623",
		"C",
		"A1C06B3"
	],
	[
		"110624",
		"C",
		"A1C06B4"
	],
	[
		"110625",
		"C",
		"A1C06B5"
	],
	[
		"110631",
		"C",
		"A1C06C1"
	],
	[
		"110632",
		"C",
		"A1C06C2"
	],
	[
		"110633",
		"C",
		"A1C06C3"
	],
	[
		"110634",
		"C",
		"A1C06C4"
	],
	[
		"110635",
		"C",
		"A1C06C5"
	],
	[
		"110641",
		"C",
		"A1C06D1"
	],
	[
		"110642",
		"C",
		"A1C06D2"
	],
	[
		"110643",
		"C",
		"A1C06D3"
	],
	[
		"110644",
		"C",
		"A1C06D4"
	],
	[
		"110645",
		"C",
		"A1C06D5"
	],
	[
		"110651",
		"C",
		"A1C06E1"
	],
	[
		"110652",
		"C",
		"A1C06E2"
	],
	[
		"110653",
		"C",
		"A1C06E3"
	],
	[
		"110654",
		"C",
		"A1C06E4"
	],
	[
		"110655",
		"C",
		"A1C06E5"
	],
	[
		"025111",
		"C",
		"A1C07A1"
	],
	[
		"025112",
		"C",
		"A1C07A2"
	],
	[
		"025113",
		"C",
		"A1C07A3"
	],
	[
		"025114",
		"C",
		"A1C07A4"
	],
	[
		"025115",
		"C",
		"A1C07A5"
	],
	[
		"025121",
		"C",
		"A1C07B1"
	],
	[
		"025122",
		"C",
		"A1C07B2"
	],
	[
		"025123",
		"C",
		"A1C07B3"
	],
	[
		"025124",
		"C",
		"A1C07B4"
	],
	[
		"025125",
		"C",
		"A1C07B5"
	],
	[
		"025131",
		"C",
		"A1C07C1"
	],
	[
		"025132",
		"C",
		"A1C07C2"
	],
	[
		"025133",
		"C",
		"A1C07C3"
	],
	[
		"025134",
		"C",
		"A1C07C4"
	],
	[
		"025135",
		"C",
		"A1C07C5"
	],
	[
		"025141",
		"C",
		"A1C07D1"
	],
	[
		"025142",
		"C",
		"A1C07D2"
	],
	[
		"025143",
		"C",
		"A1C07D3"
	],
	[
		"025144",
		"C",
		"A1C07D4"
	],
	[
		"025145",
		"C",
		"A1C07D5"
	],
	[
		"045211",
		"C",
		"A1C08A1"
	],
	[
		"045212",
		"C",
		"A1C08A2"
	],
	[
		"045213",
		"C",
		"A1C08A3"
	],
	[
		"045214",
		"C",
		"A1C08A4"
	],
	[
		"045215",
		"C",
		"A1C08A5"
	],
	[
		"045221",
		"C",
		"A1C08B1"
	],
	[
		"045222",
		"C",
		"A1C08B2"
	],
	[
		"045223",
		"C",
		"A1C08B3"
	],
	[
		"045224",
		"C",
		"A1C08B4"
	],
	[
		"045225",
		"C",
		"A1C08B5"
	],
	[
		"045231",
		"C",
		"A1C08C1"
	],
	[
		"045232",
		"C",
		"A1C08C2"
	],
	[
		"045233",
		"C",
		"A1C08C3"
	],
	[
		"045234",
		"C",
		"A1C08C4"
	],
	[
		"045235",
		"C",
		"A1C08C5"
	],
	[
		"045241",
		"C",
		"A1C08D1"
	],
	[
		"045242",
		"C",
		"A1C08D2"
	],
	[
		"045243",
		"C",
		"A1C08D3"
	],
	[
		"045244",
		"C",
		"A1C08D4"
	],
	[
		"045245",
		"C",
		"A1C08D5"
	],
	[
		"065311",
		"C",
		"A1C09A1"
	],
	[
		"065312",
		"C",
		"A1C09A2"
	],
	[
		"065313",
		"C",
		"A1C09A3"
	],
	[
		"065314",
		"C",
		"A1C09A4"
	],
	[
		"065315",
		"C",
		"A1C09A5"
	],
	[
		"065321",
		"C",
		"A1C09B1"
	],
	[
		"065322",
		"C",
		"A1C09B2"
	],
	[
		"065323",
		"C",
		"A1C09B3"
	],
	[
		"065324",
		"C",
		"A1C09B4"
	],
	[
		"065325",
		"C",
		"A1C09B5"
	],
	[
		"065331",
		"C",
		"A1C09C1"
	],
	[
		"065332",
		"C",
		"A1C09C2"
	],
	[
		"065333",
		"C",
		"A1C09C3"
	],
	[
		"065334",
		"C",
		"A1C09C4"
	],
	[
		"065335",
		"C",
		"A1C09C5"
	],
	[
		"065341",
		"C",
		"A1C09D1"
	],
	[
		"065342",
		"C",
		"A1C09D2"
	],
	[
		"065343",
		"C",
		"A1C09D3"
	],
	[
		"065344",
		"C",
		"A1C09D4"
	],
	[
		"065345",
		"C",
		"A1C09D5"
	],
	[
		"085411",
		"C",
		"A1C10A1"
	],
	[
		"085412",
		"C",
		"A1C10A2"
	],
	[
		"085413",
		"C",
		"A1C10A3"
	],
	[
		"085414",
		"C",
		"A1C10A4"
	],
	[
		"085415",
		"C",
		"A1C10A5"
	],
	[
		"085421",
		"C",
		"A1C10B1"
	],
	[
		"085422",
		"C",
		"A1C10B2"
	],
	[
		"085423",
		"C",
		"A1C10B3"
	],
	[
		"085424",
		"C",
		"A1C10B4"
	],
	[
		"085425",
		"C",
		"A1C10B5"
	],
	[
		"085431",
		"C",
		"A1C10C1"
	],
	[
		"085432",
		"C",
		"A1C10C2"
	],
	[
		"085433",
		"C",
		"A1C10C3"
	],
	[
		"085434",
		"C",
		"A1C10C4"
	],
	[
		"085435",
		"C",
		"A1C10C5"
	],
	[
		"085441",
		"C",
		"A1C10D1"
	],
	[
		"085442",
		"C",
		"A1C10D2"
	],
	[
		"085443",
		"C",
		"A1C10D3"
	],
	[
		"085444",
		"C",
		"A1C10D4"
	],
	[
		"085445",
		"C",
		"A1C10D5"
	],
	[
		"105511",
		"C",
		"A1C11A1"
	],
	[
		"105512",
		"C",
		"A1C11A2"
	],
	[
		"105513",
		"C",
		"A1C11A3"
	],
	[
		"105514",
		"C",
		"A1C11A4"
	],
	[
		"105515",
		"C",
		"A1C11A5"
	],
	[
		"105521",
		"C",
		"A1C11B1"
	],
	[
		"105522",
		"C",
		"A1C11B2"
	],
	[
		"105523",
		"C",
		"A1C11B3"
	],
	[
		"105524",
		"C",
		"A1C11B4"
	],
	[
		"105525",
		"C",
		"A1C11B5"
	],
	[
		"105531",
		"C",
		"A1C11C1"
	],
	[
		"105532",
		"C",
		"A1C11C2"
	],
	[
		"105533",
		"C",
		"A1C11C3"
	],
	[
		"105534",
		"C",
		"A1C11C4"
	],
	[
		"105535",
		"C",
		"A1C11C5"
	],
	[
		"105541",
		"C",
		"A1C11D1"
	],
	[
		"105542",
		"C",
		"A1C11D2"
	],
	[
		"105543",
		"C",
		"A1C11D3"
	],
	[
		"105544",
		"C",
		"A1C11D4"
	],
	[
		"105545",
		"C",
		"A1C11D5"
	],
	[
		"125611",
		"C",
		"A1C12A1"
	],
	[
		"125612",
		"C",
		"A1C12A2"
	],
	[
		"125613",
		"C",
		"A1C12A3"
	],
	[
		"125614",
		"C",
		"A1C12A4"
	],
	[
		"125615",
		"C",
		"A1C12A5"
	],
	[
		"125621",
		"C",
		"A1C12B1"
	],
	[
		"125622",
		"C",
		"A1C12B2"
	],
	[
		"125623",
		"C",
		"A1C12B3"
	],
	[
		"125624",
		"C",
		"A1C12B4"
	],
	[
		"125625",
		"C",
		"A1C12B5"
	],
	[
		"125631",
		"C",
		"A1C12C1"
	],
	[
		"125632",
		"C",
		"A1C12C2"
	],
	[
		"125633",
		"C",
		"A1C12C3"
	],
	[
		"125634",
		"C",
		"A1C12C4"
	],
	[
		"125635",
		"C",
		"A1C12C5"
	],
	[
		"125641",
		"C",
		"A1C12D1"
	],
	[
		"125642",
		"C",
		"A1C12D2"
	],
	[
		"125643",
		"C",
		"A1C12D3"
	],
	[
		"125644",
		"C",
		"A1C12D4"
	],
	[
		"125645",
		"C",
		"A1C12D5"
	],
	[
		"",
		"DL",
		"D101"
	],
	[
		"",
		"D2TM",
		"D2TM"
	],
	[
		"",
		"SRTR",
		"SRTR"
	],
	[
		"",
		"SHP",
		"SHP"
	],
	[
		"",
		"DB",
		"DB1"
	],
	[
		"",
		"DB",
		"DB2"
	],
	[
		"",
		"DB",
		"DB3"
	],
	[
		"",
		"DB",
		"DBPG"
	],
	[
		"",
		"OC",
		"OC01"
	],
	[
		"",
		"OC",
		"OC02"
	],
	[
		"",
		"OC",
		"OC03"
	],
	[
		"",
		"OC",
		"OC04"
	],
	[
		"",
		"OC",
		"OC05"
	],
	[
		"",
		"OC",
		"OC06"
	],
	[
		"",
		"OC",
		"OC07"
	],
	[
		"",
		"OC",
		"OC08"
	],
	[
		"",
		"OC",
		"OC09"
	],
	[
		"",
		"MI",
		"MI01"
	],
	[
		"",
		"RSRTR",
		"RSRTR"
	],
	[
		"",
		"RSHP",
		"RSHP"
	],
	[
		"",
		"MO",
		"MO01"
	],
	[
		"",
		"MU",
		"MU01"
	],
	[
		"",
		"MU",
		"MU02"
	],
	[
		"",
		"MU",
		"MU03"
	],
	[
		"",
		"MU",
		"MU04"
	],
	[
		"",
		"MU",
		"MU05"
	],
	[
		"",
		"MU",
		"MU06"
	],
	[
		"",
		"MU",
		"MU07"
	],
	[
		"",
		"MU",
		"MU08"
	],
	[
		"",
		"MU",
		"MU09"
	],
	[
		"",
		"MU",
		"MU10"
	],
	[
		"",
		"MU",
		"MU11"
	],
	[
		"",
		"MU",
		"MU12"
	],
	[
		"",
		"MU",
		"MU13"
	],
	[
		"",
		"OB",
		"OB01"
	],
	[
		"",
		"OB",
		"OB02"
	],
	[
		"",
		"OB",
		"OB03"
	],
	[
		"",
		"OB",
		"OB04"
	],
	[
		"",
		"OB",
		"OB05"
	],
	[
		"",
		"OB",
		"OB06"
	],
	[
		"",
		"OB",
		"OB07"
	],
	[
		"",
		"OB",
		"OB08"
	],
	[
		"",
		"OB",
		"OB09"
	],
	[
		"",
		"OB",
		"OB10"
	],
	[
		"",
		"OS",
		"OS01"
	],
	[
		"",
		"SB",
		"SB01"
	],
	[
		"",
		"SB",
		"SB02"
	],
	[
		"",
		"SB",
		"SB03"
	],
	[
		"",
		"SB",
		"SB04"
	],
	[
		"",
		"SB",
		"SB05"
	],
	[
		"",
		"SB",
		"SB06"
	],
	[
		"",
		"SB",
		"SB07"
	],
	[
		"",
		"SB",
		"SB08"
	],
	[
		"",
		"SB",
		"SB09"
	],
	[
		"",
		"SB",
		"SB10"
	],
	[
		"",
		"CP",
		"CP01"
	],
	[
		"",
		"CP",
		"CP06"
	],
	[
		"",
		"DP",
		"DP01"
	],
	[
		"",
		"KRTN",
		"KRTN"
	],
	[
		"",
		"RTN",
		"RTN"
	],
	[
		"",
		"PRTN",
		"PRTN"
	],
	[
		"",
		"PRTN",
		"PRTN01"
	],
	[
		"",
		"PRTN",
		"PRTN02"
	],
	[
		"",
		"PRTN",
		"PRTN03"
	],
	[
		"",
		"PRTN",
		"PRTN04"
	],
	[
		"",
		"PRTN",
		"PRTN05"
	],
	[
		"",
		"PRTN",
		"PRTN06"
	],
	[
		"",
		"PRTN",
		"PRTN07"
	],
	[
		"",
		"PRTN",
		"PRTN08"
	],
	[
		"",
		"PRTN",
		"PRTN09"
	],
	[
		"",
		"PASON",
		"GS"
	],
	[
		"",
		"PASON",
		"GSM"
	],
	[
		"",
		"PASON",
		"H"
	],
	[
		"",
		"PASON",
		"M"
	],
	[
		"",
		"PEGI",
		"C"
	],
	[
		"",
		"PEGI",
		"G"
	],
	[
		"",
		"PEGI",
		"P"
	],
	[
		"",
		"OUT",
		"OUT"
	]
];
var listeners = /* @__PURE__ */ new Set();
var cache = /* @__PURE__ */ new Map();
function keyOf(value) {
	return value.replace(/\.0$/, "").replace(/\s/g, "").toUpperCase();
}
function indexRows(rows, fileName, updatedAt, builtin) {
	const byAddr = /* @__PURE__ */ new Map();
	const byLoc = /* @__PURE__ */ new Map();
	for (const [addr, zone, loc] of rows) {
		if (!zone || !loc) continue;
		const spot = {
			zone,
			loc
		};
		const address = keyOf(addr);
		if (address) byAddr.set(address, spot);
		byLoc.set(keyOf(loc), spot);
	}
	return {
		byAddr,
		byLoc,
		fileName,
		updatedAt,
		count: byLoc.size,
		builtin
	};
}
function savedBook(site) {
	const book = readPanel().frozenLocs?.[site];
	if (!book || !Array.isArray(book.rows) || !book.rows.length) return null;
	return indexRows(book.rows, book.fileName || "냉동 로케이션.xlsx", Number(book.updatedAt) || Date.now(), false);
}
function bookOf(site) {
	const saved = savedBook(site);
	if (saved) return saved;
	if (site === "신오산") return indexRows(OSAN_FROZEN, OSAN_FROZEN_FILE, Date.parse(`${OSAN_FROZEN_DAY}T12:00:00+09:00`), true);
	return null;
}
function cached(site) {
	const found = cache.get(site);
	if (found) return found;
	const next = bookOf(site);
	if (next) cache.set(site, next);
	return next;
}
function refreshFrozen() {
	cache = /* @__PURE__ */ new Map();
	listeners.forEach((listener) => listener());
}
onSharedPanel(() => refreshFrozen());
function subscribeFrozen(listener) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}
function frozenBook(site) {
	const book = cached(site);
	if (!book) return null;
	return {
		site,
		fileName: book.fileName,
		updatedAt: book.updatedAt,
		count: book.count,
		builtin: book.builtin
	};
}
function matchFrozen(site, raw) {
	const book = cached(site);
	if (!book || !raw) return null;
	const key = keyOf(raw);
	return book.byAddr.get(key) ?? book.byLoc.get(key) ?? null;
}
function frozenDay(at) {
	const date = new Date(at);
	const pad = (value) => String(value).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
async function readFrozenFile(file) {
	const xlsx = await import("../_libs/xlsx.mjs").then((n) => n.t);
	const book = xlsx.read(await file.arrayBuffer(), {
		type: "array",
		cellDates: false
	});
	const rows = [];
	for (const name of book.SheetNames) {
		const grid = xlsx.utils.sheet_to_json(book.Sheets[name], {
			header: 1,
			raw: true,
			defval: ""
		});
		const head = (grid[0] ?? []).map((cell) => String(cell ?? "").replace(/\s/g, ""));
		const addrAt = head.indexOf("표시기주소");
		const zoneAt = head.indexOf("존코드");
		const locAt = head.indexOf("로케이션코드");
		if (zoneAt < 0 || locAt < 0) continue;
		for (let i = 1; i < grid.length; i++) {
			const line = grid[i] ?? [];
			const zone = String(line[zoneAt] ?? "").trim();
			const loc = String(line[locAt] ?? "").replace(/\.0$/, "").trim();
			const addr = addrAt >= 0 ? String(line[addrAt] ?? "").replace(/\.0$/, "").trim() : "";
			if (!zone || !loc) continue;
			rows.push([
				addr,
				zone,
				loc
			]);
		}
	}
	return rows;
}
function saveFrozen(site, fileName, rows) {
	const current = { ...readPanel().frozenLocs ?? {} };
	current[site] = {
		fileName,
		updatedAt: Date.now(),
		rows
	};
	writePanel({ frozenLocs: current });
	refreshFrozen();
}
function clearFrozen(site) {
	const current = { ...readPanel().frozenLocs ?? {} };
	delete current[site];
	writePanel({ frozenLocs: current });
	refreshFrozen();
}
var nf$1 = new Intl.NumberFormat("ko-KR");
var won = new Intl.NumberFormat("ko-KR");
function webHost() {
	return window.chrome?.webview;
}
function b64ToArrayBuffer$1(b64) {
	const binary = atob(b64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes.buffer;
}
function normCd(value) {
	return value.replace(/\.0$/, "").replace(/\s/g, "").toUpperCase();
}
function normNm(value) {
	return value.replace(/\s/g, "").toLowerCase();
}
function centerGuess(name) {
	const text = name.normalize("NFC");
	if (text.includes("통합")) return "통합";
	if (text.includes("냉동")) return "냉동";
	const marked = text.match(/([123])\s*센터/) ?? text.match(/(?:^|[^0-9])([123])\s*(?:미|오|작업)/) ?? text.match(/(?:^|[^0-9])10([123])(?![0-9])/);
	return marked ? `${marked[1]}센터` : "";
}
function roleGuess(name) {
	const text = name.normalize("NFC");
	if (text.includes("오출") || /(?:^|[^가-힣])오(?:[^가-힣]|$)/.test(text)) return "wrong";
	if (text.includes("작업") || text.includes("미출") || /(?:^|[^가-힣])미(?:[^가-힣]|$)/.test(text) || text.includes("미")) return "work";
	return "";
}
function centersInSheets(names) {
	const found = unique(names.flatMap((name) => {
		const text = name.normalize("NFC").trim();
		if (text.includes("냉동")) return ["냉동"];
		const marked = text.match(/([123])\s*센터/);
		return marked ? [`${marked[1]}센터`] : [];
	}));
	if (found.length > 1) return "통합";
	return found[0] ?? "";
}
async function sniffFile(file) {
	const named = {
		center: centerGuess(file.name),
		role: roleGuess(file.name)
	};
	if (named.center && named.role) return named;
	try {
		const xlsx = await import("../_libs/xlsx.mjs").then((n) => n.t);
		const book = xlsx.read(await file.arrayBuffer(), {
			type: "array",
			sheetRows: 1
		});
		const heads = book.SheetNames.flatMap((name) => {
			return (xlsx.utils.sheet_to_json(book.Sheets[name], {
				header: 1,
				raw: false,
				defval: ""
			})[0] ?? []).map((cell) => String(cell ?? "").replace(/\s/g, "").toLowerCase());
		});
		const has = (label) => heads.some((cell) => cell === label || cell.includes(label));
		const oship = has("미오출사유") || has("점포코드") && has("배송루트") && (has("출고량") || has("금액"));
		const work = has("blockno") || has("pickdt") || has("pickqt") || book.SheetNames.some((name) => /torderdetail/i.test(name) || /[123]\s*센터|냉동/.test(name));
		const role = named.role || (oship && !work ? "wrong" : work && !oship ? "work" : "");
		return {
			center: named.center || (role === "work" ? centersInSheets(book.SheetNames) : ""),
			role
		};
	} catch {
		return named;
	}
}
function frozenOship(row) {
	if (row.dpt === "냉동" || /냉동|빙과/.test(row.group)) return true;
	const digits = row.route.replace(/\D/g, "");
	const head = Number(digits.length >= 3 ? digits.slice(0, 3) : digits);
	return head >= 400 && head <= 499;
}
function addBook(books, center, rows) {
	if (!rows.length) return;
	const found = books.find((item) => item.center === center);
	if (found) found.rows.push(...rows);
	else books.push({
		center,
		rows: [...rows]
	});
}
function unique(values) {
	return [...new Set(values.filter(Boolean))];
}
var CENTER_RANK = [
	"1센터",
	"2센터",
	"3센터",
	"냉동"
];
function sortCenters(ids) {
	return [...ids].sort((a, b) => {
		const ia = CENTER_RANK.indexOf(a);
		const ib = CENTER_RANK.indexOf(b);
		return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b, "ko");
	});
}
function frozenLane(groupId) {
	const key = groupId.trim().toUpperCase();
	if (key === "A" || key === "소분") return "소분";
	if (key === "B" || key === "빙과") return "빙과";
	return "";
}
function lineRank(line) {
	if (line === "소분") return 1e3;
	if (line === "빙과") return 1001;
	const num = Number(line);
	return Number.isFinite(num) ? num : 2e3;
}
function lineLabel(line) {
	return /^\d+$/.test(line) ? `${line}라인` : line;
}
function lanesOf(hits) {
	return unique(hits.map((hit) => hit.center === "냉동" ? hit.lane : hit.line ? String(hit.line) : "")).sort((a, b) => lineRank(a) - lineRank(b) || a.localeCompare(b, "ko"));
}
function frozenPlace(site, lines, locations) {
	const zones = [];
	const codes = [];
	for (const raw of locations) {
		const hit = matchFrozen(site, raw);
		if (!hit) continue;
		zones.push(hit.zone);
		codes.push(hit.loc);
	}
	if (!codes.length) return {
		lines,
		locations
	};
	return {
		lines: unique(zones).sort((a, b) => a.localeCompare(b, "ko")),
		locations: unique(codes)
	};
}
function routeBand(route) {
	const digits = route.replace(/\D/g, "");
	if (!digits) return "";
	const head = Number(digits.length >= 3 ? digits.slice(0, 3) : digits);
	if (head >= 300 && head <= 399) return "FF1";
	if (head >= 100 && head <= 299) return "FF2";
	if (head >= 400 && head <= 499) return "냉동";
	return "";
}
function masterBand(master) {
	const name = master.replace(/\s/g, "");
	if (/냉동|빙과/.test(name)) return "냉동";
	if (/FF\s*1|1차/.test(name)) return "FF1";
	if (/FF\s*2|유제|냉장/.test(name)) return "FF2";
	return "";
}
var DPT_OPTIONS = [
	"FF1",
	"FF2",
	"냉동"
];
function routeKey(route) {
	const digits = route.replace(/\D/g, "");
	if (digits) return digits.slice(0, 3);
	return route.trim().slice(0, 3);
}
function routeKeys(row) {
	return unique(row.routes.map(routeKey));
}
function manyText(picked) {
	if (picked == null) return "전체";
	if (picked.length === 0) return "선택 없음";
	if (picked.length <= 2) return picked.join(", ");
	return `${picked.length}개`;
}
function allows(picked, values) {
	if (picked == null) return true;
	return values.some((value) => picked.includes(value));
}
function cellValues(row, key) {
	if (key === "date") return [row.date || "없음"];
	if (key === "location") return row.locations.length ? row.locations : ["없음"];
	if (key === "storeCd") return [row.storeCd || "없음"];
	if (key === "code") return [row.code || "없음"];
	if (key === "ship") return [row.ship == null ? "없음" : nf$1.format(row.ship)];
	if (key === "qty") return [nf$1.format(row.qty)];
	if (key === "amount") return [won.format(row.amount)];
	return row.times.length ? row.times.map(clock) : ["없음"];
}
function rowHits(row, picks, skip) {
	if (skip !== "date" && !allows(picks.date, cellValues(row, "date"))) return false;
	if (skip !== "center" && !allows(picks.center, [row.center])) return false;
	if (skip !== "line" && !allows(picks.line, row.lines)) return false;
	if (skip !== "location" && !allows(picks.location, cellValues(row, "location"))) return false;
	if (skip !== "route" && !allows(picks.route, routeKeys(row))) return false;
	if (skip !== "storeCd" && !allows(picks.storeCd, cellValues(row, "storeCd"))) return false;
	if (skip !== "store" && !allows(picks.store, [row.storeNm || "없음"])) return false;
	if (skip !== "dpt" && !allows(picks.dpt, row.groups)) return false;
	if (skip !== "code" && !allows(picks.code, cellValues(row, "code"))) return false;
	if (skip !== "goods" && !allows(picks.goods, [row.goods || row.code || "없음"])) return false;
	if (skip !== "ship" && !allows(picks.ship, cellValues(row, "ship"))) return false;
	if (skip !== "qty" && !allows(picks.qty, cellValues(row, "qty"))) return false;
	if (skip !== "amount" && !allows(picks.amount, cellValues(row, "amount"))) return false;
	if (skip !== "time" && !allows(picks.time, cellValues(row, "time"))) return false;
	if (skip !== "reason" && !allows(picks.reason, [row.reason || "없음"])) return false;
	return true;
}
function toggleValue(prev, id, all) {
	const base = prev ?? all;
	const next = base.includes(id) ? base.filter((item) => item !== id) : [...base, id];
	if (next.length === 0) return [];
	return all.length > 0 && all.every((item) => next.includes(item)) ? null : next;
}
function clearFound(prev, found, all) {
	const next = (prev ?? all).filter((item) => !found.includes(item));
	if (next.length === 0) return [];
	return all.length > 0 && all.every((item) => next.includes(item)) ? null : next;
}
function ColFilter({ label, options, picked, onChange }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [query, setQuery] = (0, import_react.useState)("");
	const [box, setBox] = (0, import_react.useState)(null);
	const buttonRef = (0, import_react.useRef)(null);
	const menuRef = (0, import_react.useRef)(null);
	const on = picked != null;
	const needle = query.trim().toLowerCase();
	const found = needle ? options.filter((item) => item.search.includes(needle) || item.label.toLowerCase().includes(needle)) : options;
	const shown = found.slice(0, 300);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const close = (event) => {
			const node = event.target;
			if (buttonRef.current?.contains(node) || menuRef.current?.contains(node)) return;
			setOpen(false);
		};
		document.addEventListener("pointerdown", close);
		return () => document.removeEventListener("pointerdown", close);
	}, [open]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const place = () => {
			const rect = buttonRef.current?.getBoundingClientRect();
			if (!rect) return;
			const left = Math.min(rect.left, window.innerWidth - 300);
			setBox({
				top: rect.bottom + 4,
				left: Math.max(8, left)
			});
		};
		place();
		window.addEventListener("resize", place);
		window.addEventListener("scroll", place, true);
		return () => {
			window.removeEventListener("resize", place);
			window.removeEventListener("scroll", place, true);
		};
	}, [open]);
	const menu = open && box ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: menuRef,
		className: "fixed z-[80] w-[280px] rounded-xl border border-black/10 bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.16)]",
		style: {
			top: box.top,
			left: box.left
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				autoFocus: true,
				value: query,
				onChange: (event) => setQuery(event.target.value),
				placeholder: `${label} 검색`,
				className: "h-8 w-full rounded-md border border-black/10 px-2 text-[13px] outline-none"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1.5 flex items-center justify-between gap-2 text-[12px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "font-semibold text-[#007aff]",
					onClick: () => onChange(null),
					children: "전체 초기화"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-[#8e8e93]",
					onClick: () => onChange(clearFound(picked, found.map((item) => item.id), options.map((item) => item.id))),
					children: "(검색 선택) 초기화"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-1 max-h-64 overflow-auto",
				children: [shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "px-1 py-2 text-[12px] text-[#8e8e93]",
					children: "없습니다."
				}) : shown.map((item) => {
					const checked = picked == null || picked.includes(item.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "flex w-full items-center gap-2 rounded px-1 py-1 text-left text-[13px] hover:bg-[#f2f2f7]",
						onClick: () => onChange(toggleValue(picked, item.id, options.map((row) => row.id))),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-4 shrink-0 place-items-center rounded-[4px] " + (checked ? "bg-[#007aff] text-white" : "border border-[#c7c7cc] bg-white"),
							children: checked ? "✓" : ""
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "min-w-0 flex-1 truncate",
							children: item.label
						})]
					}) }, item.id);
				}), found.length > shown.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "px-1 py-1 text-[11px] text-[#8e8e93]",
					children: "검색으로 더 좁혀 주세요."
				}) : null]
			})
		]
	}), document.body) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		ref: buttonRef,
		type: "button",
		"aria-label": `${label} 필터`,
		"aria-expanded": open,
		title: on ? manyText(picked) : "전체",
		className: "grid size-5 place-items-center rounded " + (on ? "bg-[#007aff] text-white" : "text-[#8e8e93] hover:bg-black/5"),
		onClick: (event) => {
			event.stopPropagation();
			setOpen((value) => !value);
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			width: "11",
			height: "11",
			viewBox: "0 0 12 12",
			"aria-hidden": "true",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "currentColor",
				d: "M1 1.5h10L7.2 6.2V10L4.8 8.7V6.2L1 1.5z"
			})
		})
	}), menu] });
}
function moneyShort(value) {
	const sign = value < 0 ? "-" : "";
	const abs = Math.abs(Math.round(value));
	if (abs >= 1e4) return `${sign}${nf$1.format(Math.round(abs / 1e4))}만`;
	return sign + nf$1.format(abs);
}
function shortStoreName$1(name) {
	const raw = name.trim();
	if (raw.length < 9) return raw;
	return raw.replace(/^GS25\s*/i, "").replace(/점$/, "") || raw;
}
function escPrint(value) {
	return value.replace(/[&<>"]/g, (ch) => {
		if (ch === "&") return ["&", "amp;"].join("");
		if (ch === "<") return ["&", "lt;"].join("");
		if (ch === ">") return ["&", "gt;"].join("");
		return ["&", "quot;"].join("");
	});
}
function printHtml(title, body) {
	const frame = document.createElement("iframe");
	frame.setAttribute("aria-hidden", "true");
	frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
	document.body.appendChild(frame);
	const doc = frame.contentDocument;
	const win = frame.contentWindow;
	if (!doc || !win) {
		frame.remove();
		return;
	}
	doc.open();
	doc.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${escPrint(title)}</title><style>
    @page { margin: 12mm; }
    body { font-family: "Malgun Gothic", "맑은 고딕", sans-serif; color: #1c1c1e; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .sub { color: #636366; font-size: 12px; margin: 0 0 12px; }
    .stats { display: flex; gap: 18px; margin: 0 0 14px; }
    .stats b { display: block; font-size: 16px; }
    .stats span { color: #8e8e93; font-size: 11px; }
    h2 { font-size: 13px; margin: 16px 0 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border-bottom: 1px solid #e5e5ea; padding: 6px 4px; text-align: left; vertical-align: top; }
    th { color: #8e8e93; font-weight: 600; }
    .r { text-align: right; white-space: nowrap; }
  </style></head><body>${body}</body></html>`);
	doc.close();
	window.setTimeout(() => {
		win.focus();
		win.print();
		window.setTimeout(() => frame.remove(), 800);
	}, 40);
}
function StoreSheet({ rows, kind, onClose }) {
	const [dpts, setDpts] = (0, import_react.useState)(null);
	const [reasons, setReasons] = (0, import_react.useState)(null);
	const [sortKey, setSortKey] = (0, import_react.useState)("date");
	const [sortDir, setSortDir] = (0, import_react.useState)("asc");
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);
	const head = rows[0];
	const dptOptions = (0, import_react.useMemo)(() => unique(rows.map((row) => row.master)).sort((a, b) => a.localeCompare(b, "ko")), [rows]);
	const reasonOptions = (0, import_react.useMemo)(() => unique(rows.map((row) => row.reason || "없음")).sort((a, b) => a.localeCompare(b, "ko")), [rows]);
	const dptAll = dpts == null;
	const reasonAll = reasons == null;
	const visible = (0, import_react.useMemo)(() => {
		const list = rows.filter((row) => {
			if (!dptAll && !(dpts ?? []).includes(row.master)) return false;
			if (!reasonAll && !(reasons ?? []).includes(row.reason || "없음")) return false;
			return true;
		});
		const dir = sortDir === "asc" ? 1 : -1;
		list.sort((a, b) => {
			if (sortKey === "ship") return ((a.ship ?? -1) - (b.ship ?? -1)) * dir;
			if (sortKey === "qty" || sortKey === "amount") return (a[sortKey] - b[sortKey]) * dir;
			if (sortKey === "time") return ((a.times[0] ?? -1) - (b.times[0] ?? -1)) * dir;
			const left = sortKey === "goods" && kind === "상품" ? a.storeNm || a.storeCd : a[sortKey];
			const right = sortKey === "goods" && kind === "상품" ? b.storeNm || b.storeCd : b[sortKey];
			return String(left).localeCompare(String(right), "ko") * dir;
		});
		return list;
	}, [
		rows,
		dpts,
		dptAll,
		reasons,
		reasonAll,
		sortKey,
		sortDir,
		kind
	]);
	const days = new Set(visible.map((row) => row.date).filter(Boolean)).size;
	const qty = visible.reduce((sum, row) => sum + row.qty, 0);
	const amount = visible.reduce((sum, row) => sum + row.amount, 0);
	const reasonRows = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const row of visible) {
			const name = row.reason || "없음";
			const hit = map.get(name) ?? {
				count: 0,
				amount: 0
			};
			hit.count += 1;
			hit.amount += row.amount;
			map.set(name, hit);
		}
		return [...map.entries()].sort((a, b) => a[1].amount - b[1].amount);
	}, [visible]);
	const centers = unique(rows.map((row) => row.center));
	const lineText = unique(rows.flatMap((row) => row.lines)).sort((a, b) => lineRank(a) - lineRank(b)).map(lineLabel).join(", ");
	const locationText = unique(rows.flatMap((row) => row.locations)).sort((a, b) => a.localeCompare(b, "ko", { numeric: true })).join(", ");
	const title = kind === "상품" ? head?.goods || head?.code || "상품" : [head?.storeCd, shortStoreName$1(head?.storeNm || "")].filter(Boolean).join(" ");
	const subtitle = kind === "상품" ? [head?.code, unique(rows.map((row) => row.master)).join(", ")].filter(Boolean).join(" · ") : [
		centers.join(", "),
		lineText,
		locationText
	].filter(Boolean).join(" · ");
	function toggle(key) {
		if (sortKey === key) setSortDir((dir) => dir === "asc" ? "desc" : "asc");
		else {
			setSortKey(key);
			setSortDir(key === "qty" || key === "amount" || key === "ship" ? "desc" : "asc");
		}
	}
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": title || "이상점포",
			className: "flex h-[420px] w-full max-w-[860px] overflow-hidden rounded-[22px] bg-[#f2f2f7] shadow-[0_18px_50px_rgba(0,0,0,0.22)]",
			onClick: (event) => event.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "flex w-[300px] shrink-0 flex-col px-4 pb-4 pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-[17px] font-semibold tracking-tight text-[#1c1c1e]",
								children: title || (kind === "상품" ? "상품" : "점포")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-[13px] text-[#8e8e93]",
								title: subtitle,
								children: subtitle
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-7 shrink-0 rounded-full bg-[#e5e5ea] px-3 text-[12px] font-semibold text-[#636366]",
							onClick: () => {
								const reasonHtml = reasonRows.map(([name, box]) => `<tr><td>${escPrint(name)}</td><td class="r">${nf$1.format(box.count)}</td><td class="r">${escPrint(moneyShort(box.amount))}</td></tr>`).join("");
								const lines = visible.map((row) => {
									const name = kind === "상품" ? row.storeNm || row.storeCd || "점포없음" : row.goods || "상품명 없음";
									const place = [
										row.center,
										row.lines.map(lineLabel).join(", "),
										row.locations.join(", ")
									].filter(Boolean).join(" ");
									const sub = kind === "상품" ? place : row.group ? `${row.master} · ${row.group}` : row.master;
									return `<tr${row.qty <= -5 ? " style=\"background:#fdecec\"" : ""}><td>${escPrint(row.date.length > 5 ? row.date.slice(5) : row.date)}</td><td>${escPrint(name)}<div class="sub">${escPrint(sub)}</div></td><td class="r">${row.ship == null ? "—" : nf$1.format(row.ship)}</td><td class="r">${nf$1.format(row.qty)}</td><td class="r">${escPrint(moneyShort(row.amount))}</td><td>${escPrint(row.times.map(clock).join(", "))}</td></tr>`;
								}).join("");
								const nameHead = kind === "상품" ? "점포명" : "상품명";
								printHtml(title, `<h1>${escPrint(title)}</h1><p class="sub">${escPrint(subtitle)}</p><div class="stats"><div><span>일수</span><b>${nf$1.format(days)}</b></div><div><span>건</span><b>${nf$1.format(visible.length)}</b></div><div><span>수량</span><b>${nf$1.format(qty)}</b></div><div><span>금액</span><b>${escPrint(moneyShort(amount))}</b></div></div><h2>미오출사유</h2><table><thead><tr><th>미오출사유</th><th class="r">건수</th><th class="r">금액</th></tr></thead><tbody>${reasonHtml}</tbody></table><h2>${nameHead}</h2><table><thead><tr><th>출고일</th><th>${nameHead}</th><th class="r">출고수량</th><th class="r">수량</th><th class="r">금액</th><th>작업시간</th></tr></thead><tbody>${lines}</tbody></table>`);
							},
							children: "프린트"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-30 mt-2.5 grid grid-cols-2 gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
							compact: true,
							fill: true,
							label: "DPT",
							text: dptAll ? "DPT" : (dpts ?? []).length === 0 ? "없음" : (dpts ?? []).join(", "),
							rows: [{
								id: "전체",
								label: "전체",
								checked: dptAll && dptOptions.length > 0
							}, ...dptOptions.map((id) => ({
								id,
								label: id,
								checked: dptAll || (dpts ?? []).includes(id)
							}))],
							onToggle: (id) => {
								if (id === "전체") {
									setDpts(dptAll ? [] : null);
									return;
								}
								const current = dpts == null ? [...dptOptions] : dpts.filter((item) => dptOptions.includes(item));
								const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
								setDpts(dptOptions.every((item) => next.includes(item)) ? null : next);
							}
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
							compact: true,
							fill: true,
							end: true,
							label: "사유",
							text: reasonAll ? "사유" : (reasons ?? []).length === 0 ? "없음" : (reasons ?? []).join(", "),
							rows: [{
								id: "전체",
								label: "전체",
								checked: reasonAll && reasonOptions.length > 0
							}, ...reasonOptions.map((id) => ({
								id,
								label: id,
								checked: reasonAll || (reasons ?? []).includes(id)
							}))],
							onToggle: (id) => {
								if (id === "전체") {
									setReasons(reasonAll ? [] : null);
									return;
								}
								const current = reasons == null ? [...reasonOptions] : reasons.filter((item) => reasonOptions.includes(item));
								const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
								setReasons(reasonOptions.every((item) => next.includes(item)) ? null : next);
							}
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2.5 grid grid-cols-4 gap-1.5",
						children: [
							["일수", nf$1.format(days)],
							["건", nf$1.format(visible.length)],
							["수량", nf$1.format(qty)],
							["금액", moneyShort(amount)]
						].map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl bg-white px-1.5 py-1.5 text-center shadow-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-medium text-[#8e8e93]",
								children: label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-[13px] font-semibold tabular-nums text-[#1c1c1e]",
								children: value
							})]
						}, label))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2.5 min-h-0 flex-1 overflow-auto rounded-2xl bg-white shadow-sm",
						children: reasonRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-3 py-6 text-center text-[13px] text-[#8e8e93]",
							children: "이 점포의 오출이 없습니다."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full text-[13px]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "sticky top-0 bg-white text-[11px] text-[#8e8e93]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2 text-left font-medium",
										children: "미오출사유"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-2 py-2 text-right font-medium",
										children: "건수"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2 text-right font-medium",
										children: "금액"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: reasonRows.map(([name, box]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-black/[0.06]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 text-[#1c1c1e]",
										children: name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-2 text-right tabular-nums text-[#1c1c1e]",
										children: nf$1.format(box.count)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 text-right tabular-nums text-[#1c1c1e]",
										children: moneyShort(box.amount)
									})
								]
							}, name)) })]
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex min-w-0 flex-1 flex-col py-4 pr-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-h-0 flex-1 overflow-auto rounded-2xl bg-white shadow-sm",
					children: visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-3 py-6 text-center text-[13px] text-[#8e8e93]",
						children: "이 점포의 오출이 없습니다."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-[13px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "sticky top-0 bg-white text-[11px] text-[#8e8e93]",
							children: [
								["date", "출고일"],
								["goods", kind === "상품" ? "점포명" : "상품명"],
								["ship", "출고수량"],
								["qty", "수량"],
								["amount", "금액"],
								["time", "작업시간"]
							].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-2 py-2 font-medium " + (key === "goods" ? "text-left" : "text-center"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "bg-transparent font-medium text-[#8e8e93] " + (key === "goods" ? "text-left" : "w-full text-center"),
									onClick: () => toggle(key),
									children: [label, sortKey === key ? sortDir === "asc" ? " ▲" : " ▼" : ""]
								})
							}, key))
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: visible.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-black/[0.06]" + (row.qty <= -5 ? " bg-[#fdecec]" : ""),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-2 py-1.5 text-center tabular-nums text-[#3a3a3c]",
									children: row.date.length > 5 ? row.date.slice(5) : row.date || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "min-w-0 px-2 py-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate font-semibold text-[#1c1c1e]",
										children: kind === "상품" ? row.storeNm || row.storeCd || "점포없음" : row.goods || "상품명 없음"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-[11px] text-[#8e8e93]",
										children: kind === "상품" ? [
											row.center,
											row.lines.map(lineLabel).join(", "),
											row.locations.join(", ")
										].filter(Boolean).join(" ") || "—" : row.group ? `${row.master} · ${row.group}` : row.master || "—"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-1.5 text-center tabular-nums text-[#1c1c1e]",
									children: row.ship == null ? "—" : nf$1.format(row.ship)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-1.5 text-center tabular-nums text-[#1c1c1e]",
									children: nf$1.format(row.qty)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-2 py-1.5 text-center tabular-nums",
									children: moneyShort(row.amount)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-2 py-1.5 text-center tabular-nums text-[#3a3a3c]",
									children: row.times.length ? row.times.map(clock).join(", ") : "—"
								})
							]
						}, `${row.date}-${row.goods}-${index}`)) })]
					})
				})
			})]
		})
	}), document.body);
}
function clock(at) {
	const time = new Date(at);
	const pad = (value) => String(value).padStart(2, "0");
	return `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())}`;
}
function indexWork(centers) {
	const byCode = /* @__PURE__ */ new Map();
	const byName = /* @__PURE__ */ new Map();
	const byStore = /* @__PURE__ */ new Map();
	const byFrozenName = /* @__PURE__ */ new Map();
	const byFrozenCode = /* @__PURE__ */ new Map();
	const storeCenters = /* @__PURE__ */ new Map();
	const push = (map, key, hit) => {
		const list = map.get(key) ?? [];
		list.push(hit);
		map.set(key, list);
	};
	for (const [center, jobs] of Object.entries(centers)) for (const job of jobs ?? []) {
		const store = normCd(job.storeCd || "");
		const goods = normCd(job.goodsCd || "");
		const name = normNm(job.goodsNm || "");
		const hit = {
			center,
			line: Number(job.line) || 0,
			location: String(job.location || ""),
			route: String(job.route || ""),
			at: typeof job.at === "number" && Number.isFinite(job.at) ? job.at : null,
			goodsCd: String(job.goodsCd || "").replace(/\.0$/, ""),
			lane: center === "냉동" ? frozenLane(String(job.groupId || "")) : "",
			qty: Number(job.qty) || 0
		};
		if (store) {
			const found = storeCenters.get(store) ?? /* @__PURE__ */ new Set();
			found.add(center);
			storeCenters.set(store, found);
			push(byStore, `${center}|${store}`, hit);
		}
		if (store && goods) push(byCode, `${store}|${goods}`, hit);
		if (store && name) push(byName, `${store}|${name}`, hit);
		if (center === "냉동" && name) push(byFrozenName, name, hit);
		if (center === "냉동" && goods) push(byFrozenCode, goods, hit);
	}
	return {
		byCode,
		byName,
		byStore,
		byFrozenName,
		byFrozenCode,
		storeCenters
	};
}
function hitsFor(index, center, store, goods, name) {
	const coded = (goods ? index.byCode.get(`${store}|${goods}`) : void 0) ?? [];
	const named = coded.length || !name ? [] : index.byName.get(`${store}|${name}`) ?? [];
	const hits = coded.length ? coded : named;
	if (!center) return hits;
	return hits.filter((hit) => hit.center === center);
}
function buildRows(work, books, site) {
	const index = indexWork(work);
	const out = [];
	for (const book of books) for (const row of book.rows) {
		const store = normCd(row.storeCd);
		const goods = normCd(row.goodsCd);
		const name = normNm(row.goods);
		let center = book.center;
		if (!center) {
			const found = index.storeCenters.get(store);
			if (found?.size === 1) center = [...found][0] ?? "";
		}
		const hits = hitsFor(index, center, store, goods, name);
		if (!center) {
			const found = unique(hits.map((hit) => hit.center));
			if (found.length === 1) center = found[0] ?? "";
		}
		const placeHits = (index.byStore.get(`${center}|${store}`) ?? []).filter((hit) => hit.line || hit.location || hit.lane);
		const frozenHits = center === "냉동" ? (name ? index.byFrozenName.get(name) : void 0) ?? (goods ? index.byFrozenCode.get(goods) : void 0) ?? [] : [];
		let lines = lanesOf(hits);
		let locations = unique(hits.map((hit) => hit.location));
		if (!lines.length) lines = lanesOf(center === "냉동" ? frozenHits : placeHits);
		if (!locations.length) locations = unique((center === "냉동" ? frozenHits : placeHits).map((hit) => hit.location));
		if (center === "냉동") {
			const placed = frozenPlace(site, lines, locations);
			lines = placed.lines;
			locations = placed.locations;
		}
		const routes = unique([...hits.map((hit) => hit.route), row.route]);
		const times = unique(hits.map((hit) => hit.at == null ? "" : String(hit.at))).map(Number).sort((a, b) => a - b);
		const master = row.dpt !== "기타" ? row.dpt : row.group !== "없음" ? row.group : "";
		const codes = unique([row.goodsCd, ...hits.map((hit) => hit.goodsCd)]);
		out.push({
			center: center || "미지정",
			lines,
			locations,
			routes,
			groups: unique([...routes.map(routeBand), masterBand(master)]),
			times,
			date: row.date,
			storeCd: row.storeCd,
			storeNm: row.storeNm,
			master,
			group: row.group && row.group !== "없음" ? row.group : "",
			reason: row.reason && row.reason !== "없음" ? row.reason : "",
			code: row.goodsCd || codes[0] || "",
			goods: row.goods,
			ship: hits.length ? hits.reduce((sum, hit) => sum + hit.qty, 0) : null,
			qty: row.qty,
			amount: row.amount
		});
	}
	return out;
}
var COLUMNS = [
	{
		key: "date",
		label: "오출일자"
	},
	{
		key: "center",
		label: "센터"
	},
	{
		key: "line",
		label: "라인"
	},
	{
		key: "location",
		label: "로케이션"
	},
	{
		key: "route",
		label: "루트"
	},
	{
		key: "storeCd",
		label: "점포코드"
	},
	{
		key: "storeNm",
		label: "점포명"
	},
	{
		key: "master",
		label: "마스터"
	},
	{
		key: "code",
		label: "상품코드"
	},
	{
		key: "goods",
		label: "상품명"
	},
	{
		key: "ship",
		label: "출고수량",
		num: true
	},
	{
		key: "qty",
		label: "수량",
		num: true
	},
	{
		key: "amount",
		label: "오출금액",
		num: true
	},
	{
		key: "time",
		label: "작업 시간"
	},
	{
		key: "reason",
		label: "미오출사유"
	}
];
function textOf(row, key) {
	if (key === "line") return row.lines.map(lineLabel).join(", ");
	if (key === "location") return row.locations.join(", ");
	if (key === "route") return routeKeys(row).join(", ");
	if (key === "time") return row.times.map(clock).join(", ");
	if (key === "ship") return row.ship == null ? "" : nf$1.format(row.ship);
	if (key === "qty") return nf$1.format(row.qty);
	if (key === "amount") return won.format(row.amount);
	if (key === "reason") return row.reason || "없음";
	return row[key] || "";
}
function OshipCheckView() {
	const fileRef = (0, import_react.useRef)(null);
	const queueRef = (0, import_react.useRef)(() => {});
	const [uploads, setUploads] = (0, import_react.useState)(null);
	const [dragOver, setDragOver] = (0, import_react.useState)(false);
	const [workName, setWorkName] = (0, import_react.useState)("");
	const [wrongName, setWrongName] = (0, import_react.useState)("");
	const [rows, setRows] = (0, import_react.useState)([]);
	const [work, setWork] = (0, import_react.useState)({});
	const [books, setBooks] = (0, import_react.useState)([]);
	const [busy, setBusy] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [center, setCenter] = (0, import_react.useState)(null);
	const [line, setLine] = (0, import_react.useState)(null);
	const [route, setRoute] = (0, import_react.useState)(null);
	const [store, setStore] = (0, import_react.useState)(null);
	const [pickedDpts, setPickedDpts] = (0, import_react.useState)(null);
	const [pickedReasons, setPickedReasons] = (0, import_react.useState)(null);
	const [pickedGoods, setPickedGoods] = (0, import_react.useState)(null);
	const [pickedShip, setPickedShip] = (0, import_react.useState)(null);
	const [pickedDate, setPickedDate] = (0, import_react.useState)(null);
	const [pickedLocation, setPickedLocation] = (0, import_react.useState)(null);
	const [pickedStoreCd, setPickedStoreCd] = (0, import_react.useState)(null);
	const [pickedCode, setPickedCode] = (0, import_react.useState)(null);
	const [pickedQty, setPickedQty] = (0, import_react.useState)(null);
	const [pickedAmount, setPickedAmount] = (0, import_react.useState)(null);
	const [pickedTime, setPickedTime] = (0, import_react.useState)(null);
	const [sortKey, setSortKey] = (0, import_react.useState)("amount");
	const [sortDir, setSortDir] = (0, import_react.useState)("desc");
	const [oddStore, setOddStore] = (0, import_react.useState)(null);
	const [locRev, setLocRev] = (0, import_react.useState)(0);
	const site = Nn();
	(0, import_react.useEffect)(() => subscribeFrozen(() => setLocRev((value) => value + 1)), []);
	(0, import_react.useEffect)(() => {
		setRows(buildRows(work, books, site));
	}, [
		work,
		books,
		site,
		locRev
	]);
	async function applyUploads() {
		if (!uploads?.length) return;
		if (uploads.some((item) => !item.center || !item.role)) {
			setError("센터와 작업·오출을 모두 골라 주세요.");
			return;
		}
		setBusy("엑셀 읽는 중");
		setError("");
		try {
			const workFiles = uploads.filter((item) => item.role === "work");
			const wrongFiles = uploads.filter((item) => item.role === "wrong");
			if (workFiles.length) {
				const merged = {};
				const missed = [];
				for (const item of workFiles) try {
					if (item.center === "통합") {
						const result = await readCenters(await item.file.arrayBuffer(), "통합");
						let placed = false;
						for (const [id, jobs] of Object.entries(result.centers)) {
							if (!jobs?.length || id === "통합") continue;
							merged[id] = [...merged[id] ?? [], ...jobs];
							placed = true;
						}
						if (!placed) missed.push(`${item.file.name}(1·2·3센터 시트를 찾지 못함)`);
						continue;
					}
					const result = await readCenters(await item.file.arrayBuffer(), item.center);
					const jobs = Object.values(result.centers).flat();
					if (!jobs.length) {
						missed.push(item.file.name);
						continue;
					}
					merged[item.center] = [...merged[item.center] ?? [], ...jobs];
				} catch {
					missed.push(item.file.name);
				}
				if (!Object.values(merged).some((rows) => rows.length)) {
					setError(missed.length ? `${missed.join(", ")} 에서 작업 행을 찾지 못했습니다.` : "작업 엑셀에서 작업 행을 찾지 못했습니다.");
					return;
				}
				setWork(merged);
				setWorkName(workFiles.map((item) => item.file.name).join(", "));
				if (missed.length) setError(`${missed.join(", ")} 은 건너뛰었습니다.`);
			}
			if (wrongFiles.length) {
				const next = [];
				const missed = [];
				for (const item of wrongFiles) {
					const parsed = await readOship(await item.file.arrayBuffer());
					if (!parsed.length) {
						missed.push(item.file.name);
						continue;
					}
					if (item.center === "1센터") {
						addBook(next, "1센터", parsed.filter((row) => !frozenOship(row)));
						addBook(next, "냉동", parsed.filter((row) => frozenOship(row)));
					} else addBook(next, item.center, parsed);
				}
				if (!next.length) {
					setError(missed.length ? `${missed.join(", ")} 에서 점포코드 열을 찾지 못했습니다.` : "오출 엑셀에서 점포코드 열을 찾지 못했습니다.");
					return;
				}
				setBooks(next);
				setWrongName(wrongFiles.map((item) => item.file.name).join(", "));
				if (missed.length) setError(`${missed.join(", ")} 에서 점포코드 열을 찾지 못했습니다.`);
			}
			setUploads(null);
		} catch {
			setError("엑셀을 읽지 못했습니다.");
		} finally {
			setBusy("");
		}
	}
	async function queueUploads(list, role = "") {
		const files = list.filter((file) => /\.xls/i.test(file.name));
		if (!files.length) {
			setError("xlsx 또는 xls 파일만 올릴 수 있습니다.");
			return;
		}
		setError("");
		setBusy("파일을 구분하는 중");
		const drafts = await Promise.all(files.map(async (file, index) => {
			const found = role ? {
				center: centerGuess(file.name),
				role
			} : await sniffFile(file);
			return {
				key: `${index}-${file.name}-${file.size}`,
				file,
				center: found.center,
				role: found.role
			};
		}));
		setBusy("");
		setUploads(drafts);
	}
	queueRef.current = queueUploads;
	(0, import_react.useEffect)(() => {
		const host = webHost();
		if (!host?.addEventListener) return;
		const onMessage = (event) => {
			try {
				const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
				if (data?.type !== "oship-check" || !Array.isArray(data.files)) return;
				const files = data.files.filter((item) => item.b64).map((item) => new File([b64ToArrayBuffer$1(item.b64 ?? "")], item.name || "엑셀.xlsx"));
				if (!files.length) return;
				const role = data.kind === "work" ? "work" : data.kind === "wrong" ? "wrong" : "";
				queueRef.current(files, role);
			} catch {}
		};
		host.addEventListener("message", onMessage);
		return () => host.removeEventListener("message", onMessage);
	}, []);
	function openPicker() {
		const host = webHost();
		const company = window.__COMPANY_PC__;
		if (host && company) {
			host.postMessage("oship-upload");
			return;
		}
		fileRef.current?.click();
	}
	function onDropFiles(event) {
		event.preventDefault();
		setDragOver(false);
		queueUploads([...event.dataTransfer.files]);
	}
	const picks = {
		date: pickedDate,
		center,
		line,
		location: pickedLocation,
		route,
		storeCd: pickedStoreCd,
		store,
		dpt: pickedDpts,
		code: pickedCode,
		goods: pickedGoods,
		ship: pickedShip,
		qty: pickedQty,
		amount: pickedAmount,
		time: pickedTime,
		reason: pickedReasons
	};
	const filterOptions = (0, import_react.useMemo)(() => {
		const dates = /* @__PURE__ */ new Set();
		const centers = /* @__PURE__ */ new Set();
		const lines = /* @__PURE__ */ new Set();
		const locations = /* @__PURE__ */ new Set();
		const routes = /* @__PURE__ */ new Set();
		const storeCds = /* @__PURE__ */ new Set();
		const stores = /* @__PURE__ */ new Map();
		const codes = /* @__PURE__ */ new Set();
		const reasons = /* @__PURE__ */ new Set();
		const goods = /* @__PURE__ */ new Map();
		const ships = /* @__PURE__ */ new Set();
		const qtys = /* @__PURE__ */ new Set();
		const amounts = /* @__PURE__ */ new Set();
		const times = /* @__PURE__ */ new Set();
		for (const row of rows) {
			if (rowHits(row, picks, "date")) cellValues(row, "date").forEach((id) => dates.add(id));
			if (rowHits(row, picks, "center")) centers.add(row.center);
			if (rowHits(row, picks, "line")) row.lines.forEach((id) => lines.add(id));
			if (rowHits(row, picks, "location")) cellValues(row, "location").forEach((id) => locations.add(id));
			if (rowHits(row, picks, "route")) routeKeys(row).forEach((id) => routes.add(id));
			if (rowHits(row, picks, "storeCd")) cellValues(row, "storeCd").forEach((id) => storeCds.add(id));
			if (rowHits(row, picks, "store")) stores.set(row.storeNm || "없음", row.storeCd);
			if (rowHits(row, picks, "code")) cellValues(row, "code").forEach((id) => codes.add(id));
			if (rowHits(row, picks, "reason")) reasons.add(row.reason || "없음");
			if (rowHits(row, picks, "ship")) cellValues(row, "ship").forEach((id) => ships.add(id));
			if (rowHits(row, picks, "qty")) cellValues(row, "qty").forEach((id) => qtys.add(id));
			if (rowHits(row, picks, "amount")) cellValues(row, "amount").forEach((id) => amounts.add(id));
			if (rowHits(row, picks, "time")) cellValues(row, "time").forEach((id) => times.add(id));
			if (rowHits(row, picks, "goods")) {
				const id = row.goods || row.code || "없음";
				const prev = goods.get(id) ?? "";
				const bit = `${row.code}`.toLowerCase();
				goods.set(id, prev.includes(bit) ? prev : `${prev} ${bit}`.trim());
			}
		}
		const opt = (id, label = id, extra = "") => ({
			id,
			label,
			search: `${label} ${id} ${extra}`.toLowerCase()
		});
		const words = (values) => [...values].sort((a, b) => a.localeCompare(b, "ko", { numeric: true })).map((id) => opt(id));
		return {
			date: words(dates),
			center: sortCenters([...centers]).map((id) => opt(id)),
			line: [...lines].sort((a, b) => lineRank(a) - lineRank(b)).map((id) => opt(id, lineLabel(id))),
			location: words(locations),
			route: [...routes].sort((a, b) => a.localeCompare(b, "ko", { numeric: true })).map((id) => opt(id)),
			storeCd: words(storeCds),
			store: [...stores.entries()].sort((a, b) => a[0].localeCompare(b[0], "ko")).map(([id, code]) => opt(id, code ? `${id} ${code}` : id, code)),
			dpt: DPT_OPTIONS.map((id) => opt(id)),
			code: words(codes),
			reason: [...reasons].sort((a, b) => a.localeCompare(b, "ko")).map((id) => opt(id)),
			goods: [...goods.entries()].sort((a, b) => a[0].localeCompare(b[0], "ko")).map(([id, code]) => opt(id, id, code)),
			ship: words(ships),
			qty: words(qtys),
			amount: words(amounts),
			time: words(times)
		};
	}, [
		rows,
		pickedDate,
		center,
		line,
		pickedLocation,
		route,
		pickedStoreCd,
		store,
		pickedDpts,
		pickedCode,
		pickedReasons,
		pickedGoods,
		pickedShip,
		pickedQty,
		pickedAmount,
		pickedTime
	]);
	const shown = (0, import_react.useMemo)(() => {
		const list = rows.filter((row) => rowHits(row, picks));
		const dir = sortDir === "asc" ? 1 : -1;
		list.sort((a, b) => {
			if (sortKey === "ship") return ((a.ship ?? -1) - (b.ship ?? -1)) * dir;
			if (sortKey === "qty" || sortKey === "amount") return (a[sortKey] - b[sortKey]) * dir;
			if (sortKey === "line") return (lineRank(a.lines[0] ?? "") - lineRank(b.lines[0] ?? "")) * dir;
			if (sortKey === "time") return ((a.times[0] ?? -1) - (b.times[0] ?? -1)) * dir;
			return textOf(a, sortKey).localeCompare(textOf(b, sortKey), "ko") * dir;
		});
		return list;
	}, [
		rows,
		pickedDate,
		center,
		line,
		pickedLocation,
		route,
		pickedStoreCd,
		store,
		pickedDpts,
		pickedCode,
		pickedReasons,
		pickedGoods,
		pickedShip,
		pickedQty,
		pickedAmount,
		pickedTime,
		sortKey,
		sortDir
	]);
	const qtySum = shown.reduce((sum, row) => sum + row.qty, 0);
	const amountSum = shown.reduce((sum, row) => sum + row.amount, 0);
	const oddStores = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const row of shown) {
			if (!(row.amount < 0)) continue;
			const name = row.storeNm || row.storeCd || "점포없음";
			const key = `${row.storeCd}|${name}`;
			const hit = map.get(key) ?? {
				name,
				code: row.storeCd,
				count: 0,
				amount: 0
			};
			hit.count += 1;
			hit.amount += row.amount;
			map.set(key, hit);
		}
		return [...map.values()].sort((a, b) => b.count - a.count || a.amount - b.amount || a.name.localeCompare(b.name, "ko")).slice(0, 10);
	}, [shown]);
	const oddGoods = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const row of shown) {
			if (!(row.amount < 0)) continue;
			const name = row.goods || row.code || "상품없음";
			const key = `${row.code}|${name}`;
			const hit = map.get(key) ?? {
				name,
				code: row.code,
				count: 0,
				amount: 0
			};
			hit.count += 1;
			hit.amount += row.amount;
			map.set(key, hit);
		}
		return [...map.values()].sort((a, b) => b.count - a.count || a.amount - b.amount || a.name.localeCompare(b.name, "ko")).slice(0, 10);
	}, [shown]);
	const sheetRows = (0, import_react.useMemo)(() => {
		if (!oddStore) return [];
		return shown.filter((row) => {
			if (!(row.amount < 0)) return false;
			if (oddStore.kind === "상품") return row.code === oddStore.code && (row.goods || row.code || "상품없음") === oddStore.name;
			return row.storeCd === oddStore.code && (row.storeNm || row.storeCd || "점포없음") === oddStore.name;
		});
	}, [shown, oddStore]);
	function toggleSort(key) {
		if (sortKey === key) setSortDir((dir) => dir === "asc" ? "desc" : "asc");
		else {
			setSortKey(key);
			setSortDir(key === "qty" || key === "amount" || key === "ship" ? "desc" : "asc");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ios-sheet relative flex h-full min-h-0 flex-col",
		onDragEnter: (event) => {
			if ([...event.dataTransfer.types].includes("Files")) {
				event.preventDefault();
				setDragOver(true);
			}
		},
		onDragOver: (event) => {
			if ([...event.dataTransfer.types].includes("Files")) {
				event.preventDefault();
				event.dataTransfer.dropEffect = "copy";
			}
		},
		onDragLeave: (event) => {
			if (event.currentTarget.contains(event.relatedTarget)) return;
			setDragOver(false);
		},
		onDrop: onDropFiles,
		children: [
			dragOver ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-[#007aff]/10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-2xl bg-white px-5 py-3 text-sm font-semibold shadow",
					children: "엑셀을 놓으면 업로드됩니다"
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sticky top-0 z-20 border-b border-black/5 bg-white/90 px-3 py-2 backdrop-blur",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mr-1 text-[17px] font-semibold text-[#1c1c1e]",
							children: "오출 확인"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-8 rounded-full bg-[#007aff] px-3 text-xs font-semibold text-white",
							onClick: openPicker,
							children: "엑셀 업로드"
						}),
						rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[12px] text-[#8e8e93]",
							children: "엑셀 업로드를 누르거나 파일을 이 화면에 놓으세요. 센터와 작업·오출을 고른 뒤 적용합니다."
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "oship-upload-file",
							ref: fileRef,
							type: "file",
							accept: ".xlsx,.xls,.xlsm",
							multiple: true,
							className: "sr-only",
							onChange: (event) => {
								const list = [...event.target.files ?? []];
								event.target.value = "";
								queueUploads(list);
							}
						}),
						workName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "max-w-[220px] truncate text-[11px] text-[#8e8e93]",
							title: workName,
							children: ["작업 ", workName]
						}) : null,
						wrongName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "max-w-[280px] truncate text-[11px] text-[#8e8e93]",
							title: wrongName,
							children: ["오출 ", wrongName]
						}) : null,
						busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] font-semibold text-[#007aff]",
							children: busy
						}) : null,
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] font-medium text-[#ff3b30]",
							children: error
						}) : null
					]
				})
			}),
			uploads ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-40 mx-3 mt-3 rounded-2xl border border-black/10 bg-white p-3 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[#8e8e93]",
						children: "파일 내용으로 센터와 작업·오출을 채웁니다. 비어 있으면 직접 고르세요. 1·2·3센터가 한 파일이면 통합입니다. 1센터 오출에 같이 있는 냉동은 냉동으로 나눕니다."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 grid grid-cols-3 gap-3",
						children: uploads.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "min-w-0 rounded-md border border-black/10 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate font-medium",
								title: item.file.name,
								children: item.file.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex items-center gap-2",
									children: ["센터", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "h-10 rounded-md border border-black/10 px-2",
										value: item.center,
										onChange: (event) => setUploads(uploads.map((row, at) => at === index ? {
											...row,
											center: event.target.value
										} : row)),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "선택"
										}), [
											"1센터",
											"2센터",
											"3센터",
											"냉동",
											"통합"
										].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: id }, id))]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex items-center gap-2",
									children: ["구분", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "h-10 rounded-md border border-black/10 px-2",
										value: item.role,
										onChange: (event) => setUploads(uploads.map((row, at) => at === index ? {
											...row,
											role: event.target.value
										} : row)),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: "선택"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "work",
												children: "작업"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "wrong",
												children: "오출"
											})
										]
									})]
								})]
							})]
						}, item.key))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-8 rounded-full bg-[#007aff] px-4 text-sm font-semibold text-white",
							onClick: () => void applyUploads(),
							children: "적용"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-10 rounded-full border border-black/10 px-4 text-sm",
							onClick: () => setUploads(null),
							children: "닫기"
						})]
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-start gap-2 bg-[#f2f2f7] px-3 py-2",
				children: [uploads ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid w-full grid-cols-2 gap-2 md:w-[640px]",
					children: [["점포", oddStores], ["상품", oddGoods]].map(([kind, items]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "h-24 overflow-auto rounded-2xl bg-white px-3 py-1.5 text-xs shadow-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "sticky top-0 flex items-center justify-between bg-white pb-0.5 font-semibold text-[#1c1c1e]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: kind }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums text-[#8e8e93]",
								children: nf$1.format(items.length)
							})]
						}), items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[#8e8e93]",
							children: "없습니다."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: items.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "flex w-full items-center justify-between gap-2 rounded px-0.5 py-0.5 text-left hover:bg-[#e8f2ff]",
							onClick: () => setOddStore({
								kind,
								name: item.name,
								code: item.code
							}),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0 flex-1 truncate font-semibold text-[#007aff]",
								children: item.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "shrink-0 tabular-nums text-[#8e8e93]",
								children: [
									nf$1.format(item.count),
									" · ",
									moneyShort(item.amount)
								]
							})]
						}) }, `${item.code}-${item.name}-${index}`)) })]
					}, kind))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[11px] text-[#8e8e93]",
					children: rows.length === 0 ? "열 제목의 필터로 좁힙니다." : `${nf$1.format(shown.length)}건 · 수량 ${nf$1.format(qtySum)} · ${won.format(amountSum)}원`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 overflow-auto",
				children: [shown.length === 0 && rows.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-4 py-2 text-sm text-[#8e8e93]",
					children: "필터에 맞는 오출이 없습니다."
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full border-collapse text-[12px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "sticky top-0 z-10 bg-[#f2f2f7]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: COLUMNS.map((col) => {
							const filter = col.key === "date" ? {
								label: "오출일자",
								options: filterOptions.date,
								picked: pickedDate,
								onChange: setPickedDate
							} : col.key === "center" ? {
								label: "센터",
								options: filterOptions.center,
								picked: center,
								onChange: setCenter
							} : col.key === "line" ? {
								label: "라인",
								options: filterOptions.line,
								picked: line,
								onChange: setLine
							} : col.key === "location" ? {
								label: "로케이션",
								options: filterOptions.location,
								picked: pickedLocation,
								onChange: setPickedLocation
							} : col.key === "route" ? {
								label: "루트",
								options: filterOptions.route,
								picked: route,
								onChange: setRoute
							} : col.key === "storeCd" ? {
								label: "점포코드",
								options: filterOptions.storeCd,
								picked: pickedStoreCd,
								onChange: setPickedStoreCd
							} : col.key === "storeNm" ? {
								label: "점포명",
								options: filterOptions.store,
								picked: store,
								onChange: setStore
							} : col.key === "master" ? {
								label: "DPT",
								options: filterOptions.dpt,
								picked: pickedDpts,
								onChange: setPickedDpts
							} : col.key === "code" ? {
								label: "상품코드",
								options: filterOptions.code,
								picked: pickedCode,
								onChange: setPickedCode
							} : col.key === "goods" ? {
								label: "상품명 또는 바코드",
								options: filterOptions.goods,
								picked: pickedGoods,
								onChange: setPickedGoods
							} : col.key === "ship" ? {
								label: "출고수량",
								options: filterOptions.ship,
								picked: pickedShip,
								onChange: setPickedShip
							} : col.key === "qty" ? {
								label: "수량",
								options: filterOptions.qty,
								picked: pickedQty,
								onChange: setPickedQty
							} : col.key === "amount" ? {
								label: "오출금액",
								options: filterOptions.amount,
								picked: pickedAmount,
								onChange: setPickedAmount
							} : col.key === "time" ? {
								label: "작업 시간",
								options: filterOptions.time,
								picked: pickedTime,
								onChange: setPickedTime
							} : col.key === "reason" ? {
								label: "미오출사유",
								options: filterOptions.reason,
								picked: pickedReasons,
								onChange: setPickedReasons
							} : null;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "whitespace-nowrap px-2 py-2 font-semibold text-[#1c1c1e] " + (col.num ? "text-right" : "text-left"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1 " + (col.num ? "justify-end" : ""),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "font-semibold",
										onClick: () => toggleSort(col.key),
										children: [col.label, sortKey === col.key ? sortDir === "asc" ? " ↑" : " ↓" : ""]
									}), filter ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColFilter, {
										label: filter.label,
										options: filter.options,
										picked: filter.picked,
										onChange: filter.onChange
									}) : null]
								})
							}, col.key);
						}) })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: shown.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
						className: "border-t border-black/5 " + (row.qty <= -5 ? "bg-[#fdecec]" : "bg-white"),
						children: COLUMNS.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "max-w-[220px] truncate px-2 py-1.5 text-[#1c1c1e] " + (col.num ? "text-right tabular-nums" : col.key === "time" ? "tabular-nums" : "text-left"),
							title: col.key === "route" ? row.routes.join(", ") : textOf(row, col.key),
							children: textOf(row, col.key) || "—"
						}, col.key))
					}, `${row.center}-${row.storeCd}-${row.goods}-${index}`)) })]
				})]
			}),
			oddStore ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreSheet, {
				kind: oddStore.kind,
				rows: sheetRows,
				onClose: () => setOddStore(null)
			}, `${oddStore.kind}|${oddStore.code}|${oddStore.name}`) : null
		]
	});
}
var MENUS = [
	{
		id: "goods",
		title: "마스터 수정"
	},
	{
		id: "sites",
		title: "지역센터"
	},
	{
		id: "layout",
		title: "배치"
	},
	{
		id: "frozen",
		title: "냉동 로케이션"
	}
];
function copySlot(slot) {
	return slot.kind === "loc" ? {
		kind: "loc",
		code: slot.code
	} : slot.kind === "pillar" ? { kind: "pillar" } : { kind: "blank" };
}
function LayoutColumn({ title, side, slots, picked, rangeFrom, rangeTo, onRange, onFill, onPick, onRename, onBlurSide, onRemove, onDragStart, onDrop }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		onDragOver: (event) => event.preventDefault(),
		onDrop: () => onDrop(slots.length),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1 flex items-center justify-between px-1 text-[12px] font-semibold text-[#8e8e93]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: title }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [slots.length, "칸"] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1 grid grid-cols-2 gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: rangeFrom,
					inputMode: "numeric",
					placeholder: "첫 칸",
					"aria-label": `${title} 첫 칸`,
					className: "h-7 rounded-md bg-white px-1 text-center text-[12px] font-semibold tabular-nums outline-none",
					onChange: (event) => onRange("from", event.target.value),
					onBlur: onFill,
					onKeyDown: (event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							onFill();
						}
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: rangeTo,
					inputMode: "numeric",
					placeholder: "끝 칸",
					"aria-label": `${title} 끝 칸`,
					className: "h-7 rounded-md bg-white px-1 text-center text-[12px] font-semibold tabular-nums outline-none",
					onChange: (event) => onRange("to", event.target.value),
					onBlur: onFill,
					onKeyDown: (event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							onFill();
						}
					}
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col",
				children: slots.map((slot, index) => {
					const active = picked?.side === side && picked.index === index;
					const joinedTop = slot.kind === "pillar" && slots[index - 1]?.kind === "pillar";
					const joinedBottom = slot.kind === "pillar" && slots[index + 1]?.kind === "pillar";
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1 " + (index > 0 && !joinedTop ? "mt-1" : ""),
						onDragOver: (event) => event.preventDefault(),
						onDrop: (event) => {
							event.preventDefault();
							event.stopPropagation();
							onDrop(index);
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								draggable: true,
								"aria-label": "칸 이동",
								className: "h-8 w-6 shrink-0 cursor-grab rounded-md bg-white text-[11px] text-[#8e8e93] active:cursor-grabbing",
								onDragStart: (event) => {
									event.dataTransfer.effectAllowed = "move";
									event.dataTransfer.setData("text/plain", `${side}:${index}`);
									onDragStart(index);
								},
								children: "≡"
							}),
							slot.kind === "loc" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: slot.code,
								onFocus: () => onPick(index),
								onChange: (event) => onRename(index, event.target.value),
								onBlur: onBlurSide,
								placeholder: "이름",
								className: "h-8 min-w-0 flex-1 rounded-md border bg-white px-2 text-center text-[13px] font-semibold tabular-nums outline-none " + (active ? "border-[#007aff]" : "border-transparent")
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-8 min-w-0 flex-1 border bg-white text-[12px] font-semibold " + (slot.kind === "pillar" ? "border-[#1c1c1e] bg-[#1c1c1e] text-white " : "border-dashed border-[#d1d1d6] text-[#8e8e93] ") + (joinedTop ? "rounded-t-none border-t-0 " : "rounded-t-md ") + (joinedBottom ? "rounded-b-none " : "rounded-b-md ") + (active && slot.kind !== "pillar" ? "border-[#007aff] text-[#007aff]" : ""),
								onClick: () => onPick(index),
								children: slot.kind === "pillar" ? "기둥" : "빈칸"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "이 칸 삭제",
								className: "h-8 w-7 shrink-0 rounded-md bg-white text-[16px] text-[#ff3b30]",
								onClick: () => onRemove(index),
								children: "×"
							})
						]
					}, `${side}-${index}`);
				})
			})
		]
	});
}
function ControlPanel({ onClose }) {
	const [page, setPage] = (0, import_react.useState)("goods");
	const [siteName, setSiteName] = (0, import_react.useState)("");
	const [adding, setAdding] = (0, import_react.useState)(false);
	const [code, setCode] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [master, setMaster] = (0, import_react.useState)("FF1편");
	const [error, setError] = (0, import_react.useState)("");
	const [siteDraft, setSiteDraft] = (0, import_react.useState)("");
	const [layoutSite, setLayoutSite] = (0, import_react.useState)("");
	const [layoutCenter, setLayoutCenter] = (0, import_react.useState)("");
	const [layoutLine, setLayoutLine] = (0, import_react.useState)(1);
	const [leftSlots, setLeftSlots] = (0, import_react.useState)([]);
	const [rightSlots, setRightSlots] = (0, import_react.useState)([]);
	const [pickedSlot, setPickedSlot] = (0, import_react.useState)(null);
	const [range, setRange] = (0, import_react.useState)({
		leftFrom: "",
		leftTo: "",
		rightFrom: "",
		rightTo: ""
	});
	const rangeRef = (0, import_react.useRef)(range);
	const [rangeNote, setRangeNote] = (0, import_react.useState)("");
	const dragFrom = (0, import_react.useRef)(null);
	const rangeDirty = (0, import_react.useRef)(false);
	const [tick, setTick] = (0, import_react.useState)(0);
	const [frozenSite, setFrozenSite] = (0, import_react.useState)("");
	const [frozenNote, setFrozenNote] = (0, import_react.useState)("");
	const frozenRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);
	(0, import_react.useEffect)(() => RE(() => setTick((value) => value + 1)), []);
	(0, import_react.useEffect)(() => subscribeSites(() => setTick((value) => value + 1)), []);
	(0, import_react.useEffect)(() => subscribeLayouts(() => setTick((value) => value + 1)), []);
	(0, import_react.useEffect)(() => subscribeFrozen(() => setTick((value) => value + 1)), []);
	const rows = BE();
	const sites = siteDefs();
	const site = sites.find((item) => item.name === siteName) ?? sites[0] ?? null;
	const pickedSite = sites.find((item) => item.name === layoutSite) ?? sites[0] ?? null;
	const pickedCenter = pickedSite?.centers.find((item) => item.id === layoutCenter)?.id ?? pickedSite?.centers[0]?.id ?? "";
	const layoutRows = pickedSite && pickedCenter ? layoutForSite(pickedSite.name, pickedCenter) : [];
	(0, import_react.useEffect)(() => {
		if (page !== "layout" || !pickedSite || !pickedCenter) return;
		const row = layoutForSite(pickedSite.name, pickedCenter).find((item) => item.line === layoutLine) ?? layoutForSite(pickedSite.name, pickedCenter)[0];
		if (!row) return;
		if (row.line !== layoutLine) setLayoutLine(row.line);
		setLeftSlots(row.left.map(copySlot));
		setRightSlots(row.right.map(copySlot));
		const edges = (slots) => {
			const codes = slots.flatMap((slot) => slot.kind === "loc" ? [slot.code] : []);
			return [codes.at(-1) ?? "", codes[0] ?? ""];
		};
		const [leftFrom, leftTo] = edges(row.left);
		const [rightFrom, rightTo] = edges(row.right);
		rangeDirty.current = false;
		setRangeNote("");
		const nextRange = {
			leftFrom,
			leftTo,
			rightFrom,
			rightTo
		};
		rangeRef.current = nextRange;
		setRange(nextRange);
		setPickedSlot(null);
	}, [
		page,
		pickedSite,
		pickedCenter,
		layoutLine
	]);
	function sideSlots(side) {
		return side === "left" ? leftSlots : rightSlots;
	}
	function fillRange(side) {
		if (!rangeDirty.current) return;
		const current = rangeRef.current;
		const from = side === "left" ? current.leftFrom : current.rightFrom;
		const to = side === "left" ? current.leftTo : current.rightTo;
		if (!from.trim() || !to.trim()) return;
		const slots = locRange(from, to);
		if (!slots) {
			setRangeNote("첫 칸과 끝 칸은 숫자로, 80칸 이하로 적어 주세요.");
			return;
		}
		setRangeNote("");
		rangeDirty.current = false;
		putSlots(side, slots);
		setPickedSlot(null);
	}
	function editRange(side, edge, value) {
		rangeDirty.current = true;
		const key = side === "left" ? edge === "from" ? "leftFrom" : "leftTo" : edge === "from" ? "rightFrom" : "rightTo";
		const next = {
			...rangeRef.current,
			[key]: value.replace(/[^\d]/g, "").slice(0, 6)
		};
		rangeRef.current = next;
		setRange(next);
	}
	function putSlots(side, slots) {
		const next = slots.slice(0, 80);
		if (side === "left") setLeftSlots(next);
		else setRightSlots(next);
		if (pickedSite && pickedCenter) setLayoutSlots(pickedSite.name, pickedCenter, layoutLine, side, next);
	}
	function renameSlot(side, index, code) {
		const next = sideSlots(side).slice();
		if (next[index]?.kind !== "loc") return;
		next[index] = {
			kind: "loc",
			code: code.slice(0, 12)
		};
		if (side === "left") setLeftSlots(next);
		else setRightSlots(next);
	}
	function saveSide(side) {
		if (!pickedSite || !pickedCenter) return;
		setLayoutSlots(pickedSite.name, pickedCenter, layoutLine, side, sideSlots(side));
	}
	function insertSlot(side, index, slot = {
		kind: "loc",
		code: ""
	}) {
		const next = sideSlots(side).slice();
		if (next.length >= 80) return;
		next.splice(Math.max(0, Math.min(next.length, index)), 0, slot);
		putSlots(side, next);
		setPickedSlot({
			side,
			index: Math.max(0, Math.min(next.length - 1, index))
		});
	}
	function moveSlot(fromSide, fromIndex, toSide, toIndex) {
		if (fromSide === toSide && toIndex === fromIndex) return;
		const source = sideSlots(fromSide).slice();
		const [item] = source.splice(fromIndex, 1);
		if (!item) return;
		if (fromSide === toSide) {
			const at = Math.max(0, Math.min(source.length, toIndex));
			source.splice(at, 0, item);
			putSlots(fromSide, source);
			setPickedSlot({
				side: fromSide,
				index: at
			});
			return;
		}
		putSlots(fromSide, source.length > 0 ? source : [{ kind: "blank" }]);
		const target = sideSlots(toSide).slice();
		const at = Math.max(0, Math.min(target.length, toIndex));
		target.splice(at, 0, item);
		putSlots(toSide, target);
		setPickedSlot({
			side: toSide,
			index: at
		});
	}
	function dropSlot(side, index) {
		const from = dragFrom.current;
		dragFrom.current = null;
		if (!from) return;
		const final = from.side === side && from.index < index ? index - 1 : index;
		moveSlot(from.side, from.index, side, final);
	}
	function removeSlot(side, index) {
		const next = sideSlots(side).slice();
		next.splice(index, 1);
		putSlots(side, next.length > 0 ? next : [{ kind: "blank" }]);
		setPickedSlot(null);
	}
	function markSlot(kind) {
		if (!pickedSlot) return;
		const next = sideSlots(pickedSlot.side).slice();
		const current = next[pickedSlot.index];
		if (!current) return;
		next[pickedSlot.index] = kind === "loc" ? {
			kind: "loc",
			code: current.kind === "loc" ? current.code : ""
		} : kind === "pillar" ? { kind: "pillar" } : { kind: "blank" };
		putSlots(pickedSlot.side, next);
	}
	function saveCode() {
		const message = zE(code, name, master);
		if (message) {
			setError(message);
			return;
		}
		setCode("");
		setName("");
		setError("");
		setAdding(false);
	}
	const [pullNote, setPullNote] = (0, import_react.useState)("");
	async function pullPanel() {
		setPullNote("가져오는 중");
		setError("");
		try {
			const result = await pullSharedPanel();
			setPullNote(result === "exe" ? "EXE에서 가져오는 중" : "가져왔습니다");
		} catch (err) {
			setPullNote("");
			setError(err instanceof Error ? err.message : "제어판을 불러오지 못했습니다.");
		}
	}
	function saveSite() {
		const message = addSite(siteDraft);
		if (message) {
			setError(message);
			return;
		}
		setSiteDraft("");
		setError("");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[60] flex items-start justify-center bg-black/30 p-3 sm:items-center",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "flex h-[min(860px,calc(100vh-24px))] w-full max-w-[980px] flex-col overflow-hidden rounded-[20px] bg-[#f2f2f7] shadow-[0_16px_40px_rgba(0,0,0,0.18)]",
			onClick: (event) => event.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex h-12 shrink-0 items-center border-b border-black/5 px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[17px] font-semibold text-[#1c1c1e]",
						children: "제어판"
					}),
					pullNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-3 text-[12px] font-medium text-[#8e8e93]",
						children: pullNote
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ml-auto inline-flex h-8 items-center rounded-full border border-black/10 bg-white px-3 text-[12px] font-semibold text-[#1c1c1e]",
						onClick: () => void pullPanel(),
						children: "가져오기"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "닫기",
						className: "ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-[#8e8e93]",
						onClick: onClose,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							size: 18,
							strokeWidth: 2
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "flex w-[168px] shrink-0 flex-col gap-1 border-r border-black/5 p-3",
					children: MENUS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-10 rounded-xl px-3 text-left text-[14px] font-semibold " + (page === item.id ? "bg-white text-[#007aff]" : "text-[#1c1c1e]"),
						onClick: () => {
							setPage(item.id);
							setAdding(false);
							setError("");
						},
						children: item.title
					}, item.id))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-h-0 min-w-0 flex-1 flex-col",
					children: [
						page === "goods" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-h-0 flex-1 overflow-auto px-4 pb-4 pt-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-2 flex items-center justify-between px-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[13px] text-[#8e8e93]",
										children: [
											"배송상품군코드 ",
											rows.length,
											"개"
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "inline-flex h-7 items-center rounded-full bg-[#007aff] px-3 text-[13px] font-semibold text-white",
										onClick: () => {
											setAdding((open) => !open);
											setError("");
										},
										children: "코드 추가"
									})]
								}),
								adding ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-2 space-y-2 rounded-2xl bg-white p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											value: code,
											onChange: (event) => setCode(event.target.value),
											inputMode: "numeric",
											placeholder: "코드",
											className: "h-9 w-full rounded-xl bg-[#f2f2f7] px-3 text-sm outline-none"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											value: name,
											onChange: (event) => setName(event.target.value),
											placeholder: "이름",
											className: "h-9 w-full rounded-xl bg-[#f2f2f7] px-3 text-sm outline-none"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
											value: master,
											onChange: (event) => setMaster(event.target.value),
											className: "h-9 w-full rounded-xl bg-[#f2f2f7] px-3 text-sm outline-none",
											children: SE.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: item,
												children: item
											}, item))
										}),
										error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-[#ff3b30]",
											children: error
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "h-9 w-full rounded-xl bg-[#007aff] text-sm font-semibold text-white",
											onClick: saveCode,
											children: "추가"
										})
									]
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "overflow-hidden rounded-2xl bg-white",
									children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex h-11 items-center gap-3 border-t border-black/5 px-4 first:border-t-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "w-10 shrink-0 text-[15px] font-medium tabular-nums text-[#1c1c1e]",
												children: row.code
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "min-w-0 flex-1 truncate text-[14px] text-[#1c1c1e]",
												children: row.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "shrink-0 text-[13px] text-[#8e8e93]",
												children: row.master
											})
										]
									}, row.code))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "px-3 pt-3 text-[12px] leading-5 text-[#8e8e93]",
									children: "회사 프로그램에서 추가한 코드는 공용 폴더에 저장되어 다른 컴퓨터의 출고 분석에도 쓰입니다."
								})
							]
						}) : null,
						page === "sites" && site ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-h-0 flex-1 overflow-auto px-4 pb-4 pt-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-2 flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: siteDraft,
										onChange: (event) => setSiteDraft(event.target.value),
										placeholder: "지역센터 이름",
										className: "h-9 min-w-0 flex-1 rounded-xl bg-white px-3 text-sm outline-none"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "h-9 shrink-0 rounded-xl bg-[#007aff] px-3 text-sm font-semibold text-white",
										onClick: saveSite,
										children: "추가"
									})]
								}),
								error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "px-1 pb-2 text-xs text-[#ff3b30]",
									children: error
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mb-3 flex flex-wrap gap-1.5",
									children: sites.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "h-8 rounded-full px-3 text-[13px] font-semibold " + (item.name === site.name ? "bg-[#007aff] text-white" : "bg-white text-[#1c1c1e]"),
										onClick: () => {
											setSiteName(item.name);
											setError("");
										},
										children: item.name
									}, item.name))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-2 flex items-center justify-between px-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[13px] text-[#8e8e93]",
										children: [site.name, " 센터 · 라인"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "text-[13px] text-[#ff3b30] disabled:text-[#c7c7cc]",
										disabled: sites.length <= 1,
										onClick: () => removeSite(site.name),
										children: "지역 삭제"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "overflow-hidden rounded-2xl bg-white",
									children: site.centers.map((center) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex h-12 items-center gap-2 border-t border-black/5 px-4 first:border-t-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "min-w-0 flex-1 text-[15px] text-[#1c1c1e]",
												children: center.id
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[13px] text-[#8e8e93]",
												children: "라인"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f2f2f7] text-[16px]",
												onClick: () => setCenterLines(site.name, center.id, center.lines - 1),
												children: "−"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "w-6 text-center text-[15px] font-semibold tabular-nums",
												children: center.lines
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f2f2f7] text-[16px]",
												onClick: () => setCenterLines(site.name, center.id, center.lines + 1),
												children: "+"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "text-[13px] text-[#ff3b30] disabled:text-[#c7c7cc]",
												disabled: site.centers.length <= 1,
												onClick: () => removeCenter(site.name, center.id),
												children: "삭제"
											})
										]
									}, center.id))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "mt-2 h-10 w-full rounded-xl bg-white text-sm font-semibold text-[#007aff] disabled:text-[#c7c7cc]",
									disabled: site.centers.length >= 9,
									onClick: () => addCenter(site.name),
									children: "센터 추가"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "px-3 pt-3 text-[12px] leading-5 text-[#8e8e93]",
									children: "회사 프로그램에서 고치면 공용 폴더에 저장되어 다른 컴퓨터에도 보입니다. 사이트에서 고친 내용은 그 브라우저에만 남습니다."
								})
							]
						}) : null,
						page === "layout" && pickedSite ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-h-0 flex-1 flex-col",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "shrink-0 px-4 pb-2 pt-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mb-2 flex flex-wrap gap-1.5",
											children: sites.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "h-8 rounded-full px-3 text-[13px] font-semibold " + (item.name === pickedSite.name ? "bg-[#007aff] text-white" : "bg-white text-[#1c1c1e]"),
												onClick: () => {
													setLayoutSite(item.name);
													setLayoutCenter("");
													setLayoutLine(1);
												},
												children: item.name
											}, item.name))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mb-2 flex flex-wrap gap-1.5",
											children: pickedSite.centers.map((center) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "h-8 rounded-full px-3 text-[13px] font-semibold " + (center.id === pickedCenter ? "bg-[#1c1c1e] text-white" : "bg-white text-[#1c1c1e]"),
												onClick: () => {
													setLayoutCenter(center.id);
													setLayoutLine(1);
												},
												children: center.id
											}, center.id))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex gap-1.5 overflow-x-auto pb-1",
											children: layoutRows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												className: "h-8 shrink-0 rounded-full px-3 text-[13px] font-semibold " + (row.line === layoutLine ? "bg-[#007aff] text-white" : "bg-white text-[#1c1c1e]"),
												onClick: () => setLayoutLine(row.line),
												children: [row.line, "라인"]
											}, row.line))
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-h-0 flex-1 overflow-auto px-4 pb-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mb-2 text-[12px] leading-5 text-[#8e8e93]",
											children: "첫 칸은 아래, 끝 칸은 위에 채워집니다. 칸을 누른 뒤 칸 추가·기둥 넣기를 누르면 그 위에 생깁니다."
										}),
										rangeNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mb-2 text-[12px] text-[#ff3b30]",
											children: rangeNote
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-[minmax(0,1fr)_10px_minmax(0,1fr)] items-start gap-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutColumn, {
													title: "왼쪽",
													side: "left",
													slots: leftSlots,
													picked: pickedSlot,
													rangeFrom: range.leftFrom,
													rangeTo: range.leftTo,
													onRange: (edge, value) => editRange("left", edge, value),
													onFill: () => fillRange("left"),
													onPick: (index) => setPickedSlot({
														side: "left",
														index
													}),
													onRename: (index, code) => renameSlot("left", index, code),
													onBlurSide: () => saveSide("left"),
													onRemove: (index) => removeSlot("left", index),
													onDragStart: (index) => {
														dragFrom.current = {
															side: "left",
															index
														};
													},
													onDrop: (index) => dropSlot("left", index)
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-6 h-full min-h-24 rounded-sm bg-[#d5dde3]" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutColumn, {
													title: "오른쪽",
													side: "right",
													slots: rightSlots,
													picked: pickedSlot,
													rangeFrom: range.rightFrom,
													rangeTo: range.rightTo,
													onRange: (edge, value) => editRange("right", edge, value),
													onFill: () => fillRange("right"),
													onPick: (index) => setPickedSlot({
														side: "right",
														index
													}),
													onRename: (index, code) => renameSlot("right", index, code),
													onBlurSide: () => saveSide("right"),
													onRemove: (index) => removeSlot("right", index),
													onDragStart: (index) => {
														dragFrom.current = {
															side: "right",
															index
														};
													},
													onDrop: (index) => dropSlot("right", index)
												})
											]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "shrink-0 border-t border-black/5 px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mb-2 flex flex-wrap gap-1.5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "h-8 rounded-full bg-[#007aff] px-3 text-[12px] font-semibold text-white disabled:bg-[#d1d1d6]",
												disabled: !pickedSlot,
												onClick: () => pickedSlot && insertSlot(pickedSlot.side, pickedSlot.index),
												children: "칸 추가"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "h-8 rounded-full bg-white px-3 text-[12px] font-semibold text-[#1c1c1e] disabled:text-[#c7c7cc]",
												disabled: !pickedSlot,
												onClick: () => pickedSlot && insertSlot(pickedSlot.side, pickedSlot.index, { kind: "pillar" }),
												children: "기둥 넣기"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "h-8 rounded-full bg-white px-3 text-[12px] font-semibold text-[#1c1c1e] disabled:text-[#c7c7cc]",
												disabled: !pickedSlot || pickedSlot.index <= 0,
												onClick: () => pickedSlot && moveSlot(pickedSlot.side, pickedSlot.index, pickedSlot.side, pickedSlot.index - 1),
												children: "위로"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "h-8 rounded-full bg-white px-3 text-[12px] font-semibold text-[#1c1c1e] disabled:text-[#c7c7cc]",
												disabled: !pickedSlot || pickedSlot.index >= sideSlots(pickedSlot.side).length - 1,
												onClick: () => pickedSlot && moveSlot(pickedSlot.side, pickedSlot.index, pickedSlot.side, pickedSlot.index + 1),
												children: "아래로"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "h-8 rounded-full bg-white px-3 text-[12px] font-semibold text-[#1c1c1e] disabled:text-[#c7c7cc]",
												disabled: !pickedSlot,
												onClick: () => markSlot("loc"),
												children: "이름"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "h-8 rounded-full bg-white px-3 text-[12px] font-semibold text-[#1c1c1e] disabled:text-[#c7c7cc]",
												disabled: !pickedSlot,
												onClick: () => markSlot("blank"),
												children: "빈칸"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "h-8 rounded-full bg-white px-3 text-[12px] font-semibold text-[#ff3b30] disabled:text-[#c7c7cc]",
												disabled: !pickedSlot,
												onClick: () => pickedSlot && removeSlot(pickedSlot.side, pickedSlot.index),
												children: "칸 삭제"
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "h-10 flex-1 rounded-xl bg-white text-sm font-semibold text-[#007aff] disabled:text-[#c7c7cc]",
												disabled: layoutRows.length >= 12,
												onClick: () => addLayoutLine(pickedSite.name, pickedCenter),
												children: "라인 추가"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "h-10 flex-1 rounded-xl bg-white text-sm font-semibold text-[#ff3b30] disabled:text-[#c7c7cc]",
												disabled: layoutRows.length <= 1,
												onClick: () => {
													removeLayoutLine(pickedSite.name, pickedCenter, layoutLine);
													setLayoutLine(1);
												},
												children: "라인 삭제"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "h-10 flex-1 rounded-xl bg-white text-sm font-semibold text-[#8e8e93]",
												onClick: () => {
													resetLayout(pickedSite.name, pickedCenter);
													const row = layoutForSite(pickedSite.name, pickedCenter).find((item) => item.line === layoutLine) ?? layoutForSite(pickedSite.name, pickedCenter)[0];
													if (!row) return;
													setLeftSlots(row.left.map(copySlot));
													setRightSlots(row.right.map(copySlot));
													const codes = (slots) => slots.flatMap((slot) => slot.kind === "loc" ? [slot.code] : []);
													const left = codes(row.left);
													const right = codes(row.right);
													rangeDirty.current = false;
													const nextRange = {
														leftFrom: left.at(-1) ?? "",
														leftTo: left[0] ?? "",
														rightFrom: right.at(-1) ?? "",
														rightTo: right[0] ?? ""
													};
													rangeRef.current = nextRange;
													setRange(nextRange);
													setPickedSlot(null);
												},
												children: "원래 배치"
											})
										]
									})]
								})
							]
						}) : null,
						page === "frozen" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-h-0 flex-1 overflow-auto px-4 pb-4 pt-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mb-3 flex flex-wrap gap-1.5",
									children: sites.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "h-8 rounded-full px-3 text-[13px] font-semibold " + (item.name === (frozenSite || site?.name) ? "bg-[#007aff] text-white" : "bg-white text-[#1c1c1e]"),
										onClick: () => {
											setFrozenSite(item.name);
											setFrozenNote("");
										},
										children: item.name
									}, item.name))
								}),
								(() => {
									const name = frozenSite || site?.name || "";
									const book = name ? frozenBook(name) : null;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-2xl bg-white p-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-[15px] font-semibold text-[#1c1c1e]",
												children: [name || "지역", " 냉동 로케이션"]
											}),
											book ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-2 text-[13px] leading-5 text-[#3a3a3c]",
												children: [
													book.fileName,
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													book.count.toLocaleString("ko-KR"),
													"칸 · 업데이트 ",
													frozenDay(book.updatedAt),
													book.builtin ? " · 기본 파일" : ""
												]
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2 text-[13px] text-[#8e8e93]",
												children: "올린 파일이 없습니다."
											}),
											frozenNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2 text-[12px] text-[#ff3b30]",
												children: frozenNote
											}) : null,
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-3 flex gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													className: "h-9 rounded-full bg-[#007aff] px-4 text-[13px] font-semibold text-white",
													onClick: () => frozenRef.current?.click(),
													children: "엑셀 올리기"
												}), book && !book.builtin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													className: "h-9 rounded-full bg-[#f2f2f7] px-4 text-[13px] font-semibold text-[#ff3b30]",
													onClick: () => {
														if (name) clearFrozen(name);
													},
													children: "올린 파일 지우기"
												}) : null]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												ref: frozenRef,
												type: "file",
												accept: ".xlsx,.xls,.xlsm",
												className: "sr-only",
												onChange: (event) => {
													const file = event.target.files?.[0];
													event.target.value = "";
													if (!file || !name) return;
													readFrozenFile(file).then((rows) => {
														if (!rows.length) {
															setFrozenNote("존코드와 로케이션코드 열을 찾지 못했습니다.");
															return;
														}
														saveFrozen(name, file.name, rows);
														setFrozenNote("");
													}).catch(() => setFrozenNote("엑셀을 읽지 못했습니다."));
												}
											})
										]
									});
								})(),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "px-3 pt-3 text-[12px] leading-5 text-[#8e8e93]",
									children: "표시기주소로 맞춰 오출의 라인은 존코드, 로케이션은 로케이션코드로 보입니다. 고른 지역에만 적용되고, 회사 프로그램에서 올리면 공용 폴더에 남습니다."
								})
							]
						}) : null
					]
				})]
			})]
		})
	});
}
var CODE128 = [
	"212222",
	"222122",
	"222221",
	"121223",
	"121322",
	"131222",
	"122213",
	"122312",
	"132212",
	"221213",
	"221312",
	"231212",
	"112232",
	"122132",
	"122231",
	"113222",
	"123122",
	"123221",
	"223211",
	"221132",
	"221231",
	"213212",
	"223112",
	"312131",
	"311222",
	"321122",
	"321221",
	"312212",
	"322112",
	"322211",
	"212123",
	"212321",
	"232121",
	"111323",
	"131123",
	"131321",
	"112313",
	"132113",
	"132311",
	"211313",
	"231113",
	"231311",
	"112133",
	"112331",
	"132131",
	"113123",
	"113321",
	"133121",
	"313121",
	"211331",
	"231131",
	"213113",
	"213311",
	"213131",
	"311123",
	"311321",
	"331121",
	"312113",
	"312311",
	"332111",
	"314111",
	"221411",
	"431111",
	"111224",
	"111422",
	"121124",
	"121421",
	"141122",
	"141221",
	"112214",
	"112412",
	"122114",
	"122411",
	"142112",
	"142211",
	"241211",
	"221114",
	"413111",
	"241112",
	"134111",
	"111242",
	"121142",
	"121241",
	"114212",
	"124112",
	"124211",
	"411212",
	"421112",
	"421211",
	"212141",
	"214121",
	"412121",
	"111143",
	"111341",
	"131141",
	"114113",
	"114311",
	"411113",
	"411311",
	"113141",
	"114131",
	"311141",
	"411131",
	"211412",
	"211214",
	"211232",
	"2331112"
];
function code128Bars(value) {
	if (!value || [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) > 126)) return null;
	const codes = [...value].map((char) => char.charCodeAt(0) - 32);
	let checksum = 104;
	codes.forEach((code, index) => {
		checksum += code * (index + 1);
	});
	const seq = [
		104,
		...codes,
		checksum % 103,
		106
	];
	const bars = [];
	for (const code of seq) for (const width of CODE128[code]) bars.push(Number(width));
	return bars;
}
var nf = new Intl.NumberFormat("ko-KR");
var pf = new Intl.NumberFormat("ko-KR", {
	style: "percent",
	minimumFractionDigits: 1,
	maximumFractionDigits: 1
});
var LINE_CLASS = [
	"bg-line-1 text-on-dark",
	"bg-line-2 text-on-dark",
	"bg-line-3 text-ink",
	"bg-line-4 text-on-dark",
	"bg-line-5 text-on-dark",
	"bg-line-6 text-on-dark",
	"bg-line-7 text-on-dark",
	"bg-line-8 text-on-dark",
	"bg-line-1 text-on-dark",
	"bg-line-5 text-on-dark",
	"bg-line-3 text-ink",
	"bg-line-2 text-on-dark"
];
var CENTER_CLASS = {
	"1센터": "bg-line-5 text-on-dark",
	"2센터": "bg-line-2 text-on-dark",
	"3센터": "bg-line-6 text-on-dark"
};
function looksLikeMaster(name, buf) {
	const base = name.replace(/\.[^.]+$/, "");
	if (/torderdetail|orderdetail|blockno/i.test(base)) return false;
	if (/[-_\s][1-9]$/.test(base) || /[1-9]\s*센터|배치|로케이션|점포/.test(base)) return true;
	const head = new Uint8Array(buf.slice(0, 2));
	return !(head[0] === 80 && head[1] === 75) && buf.byteLength < 15e5;
}
function num(value) {
	return nf.format(Math.round(value));
}
function hrs(value) {
	return value.toFixed(1);
}
var LINE_FILL = [
	"#e74c3c",
	"#e67e22",
	"#f1c40f",
	"#27ae60",
	"#3498db",
	"#9b59b6",
	"#e91e63",
	"#1abc9c",
	"#795548",
	"#607d8b",
	"#cddc39",
	"#ff5722"
];
var LINE_INK = [
	"#ffffff",
	"#ffffff",
	"#1c2833",
	"#ffffff",
	"#ffffff",
	"#ffffff",
	"#ffffff",
	"#ffffff",
	"#ffffff",
	"#ffffff",
	"#1c2833",
	"#ffffff"
];
function bytesToBase64(bytes) {
	let binary = "";
	for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
	return btoa(binary);
}
async function copyCanvas(canvas) {
	const blob = await new Promise((resolve) => canvas.toBlob((value) => resolve(value), "image/png"));
	if (!blob) throw new Error("이미지를 만들지 못했습니다.");
	const host = window.chrome?.webview;
	if (host) host.postMessage({
		type: "clipboard-png",
		b64: bytesToBase64(new Uint8Array(await blob.arrayBuffer()))
	});
	try {
		await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
	} catch (err) {
		if (!host) throw err instanceof Error ? err : /* @__PURE__ */ new Error("복사에 실패했습니다.");
	}
}
var CAP_FONT = "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
var CAP_TINT = {
	"1센터": "#007aff",
	"2센터": "#ff9500",
	"3센터": "#af52de"
};
function drawSummaryCapture(all, dpt, forecast = false) {
	const headers = forecast ? [
		"라인",
		"작업건수",
		"완료",
		"잔여",
		"%",
		"시작",
		"끝",
		"시간",
		"건/hr",
		"순위",
		"예상종료",
		"앞으로"
	] : [
		"라인",
		"작업건수",
		"완료",
		"잔여",
		"%",
		"시작",
		"끝",
		"시간",
		"건/hr",
		"순위"
	];
	const widths = forecast ? [
		104,
		78,
		64,
		64,
		60,
		60,
		60,
		60,
		64,
		52,
		92,
		78
	] : [
		104,
		78,
		64,
		64,
		60,
		60,
		60,
		60,
		64,
		52
	];
	const tableW = widths.reduce((sum, width) => sum + width, 0);
	const pad = 22;
	const cardPad = 14;
	const cardW = tableW + 28;
	const width = cardW + 44;
	const rowH = 28;
	const headH = 24;
	const gap = 12;
	const blocks = Mn().map((id) => {
		const jobs = jobsOf(all, id, dpt);
		const lines = Yn(jobs, Bn(id));
		const forecasts = tr(jobs, Bn(id));
		const cast = nr(forecasts);
		const whole = qn(id, jobs);
		return {
			id,
			lines,
			forecasts,
			cast,
			whole,
			day: fr(whole.first, whole.last),
			finish: Sr(lines.map((row) => row.last)),
			etaTone: Sr(forecasts.map((row) => row.left > 0 ? row.eta : null))
		};
	});
	const cardH = (count) => 78 + (1 + count) * rowH + 12;
	const height = 46 + blocks.reduce((sum, block) => sum + cardH(block.lines.length) + gap, 0) + 8;
	const canvas = document.createElement("canvas");
	const scale = 2;
	canvas.width = width * scale;
	canvas.height = height * scale;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("이미지를 만들지 못했습니다.");
	ctx.scale(scale, scale);
	ctx.fillStyle = "#f2f2f7";
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = "#1c1c1e";
	ctx.font = `600 20px ${CAP_FONT}`;
	ctx.textBaseline = "middle";
	ctx.textAlign = "left";
	ctx.fillText("라인별 생산성", pad, 26);
	const titleW = ctx.measureText("라인별 생산성").width;
	ctx.fillStyle = "#8e8e93";
	ctx.font = `600 14px ${CAP_FONT}`;
	ctx.fillText(`${dpt} · ${forecast ? "예상" : "기본"}`, pad + titleW + 14, 26);
	let y = 46;
	for (const block of blocks) {
		const top = y;
		const h = cardH(block.lines.length);
		fillRound(ctx, pad, top, cardW, h, 16, "#ffffff");
		ctx.beginPath();
		ctx.arc(46, top + 22, 5, 0, Math.PI * 2);
		ctx.fillStyle = CAP_TINT[block.id];
		ctx.fill();
		ctx.fillStyle = "#1c1c1e";
		ctx.font = `600 15px ${CAP_FONT}`;
		ctx.textAlign = "left";
		ctx.fillText(block.id, 58, top + 22);
		const week = block.day.week || "—";
		ctx.font = `600 12px ${CAP_FONT}`;
		const weekW = ctx.measureText(week).width + 16;
		fillRound(ctx, pad + cardW - cardPad - weekW, top + 10, weekW, 22, 11, "#007aff");
		ctx.fillStyle = "#ffffff";
		ctx.textAlign = "center";
		ctx.fillText(week, pad + cardW - cardPad - weekW / 2, top + 21);
		ctx.fillStyle = "#8e8e93";
		ctx.font = `500 12px ${CAP_FONT}`;
		ctx.textAlign = "right";
		ctx.fillText(block.day.date || "—", pad + cardW - cardPad - weekW - 8, top + 21);
		ctx.textAlign = "left";
		ctx.fillStyle = "#8e8e93";
		ctx.font = `500 12px ${CAP_FONT}`;
		const span = block.whole.first == null ? "—" : `${cr(block.whole.first)} ~ ${cr(block.whole.last)}`;
		ctx.fillText("총 작업시간", 38, top + 44);
		ctx.fillStyle = "#1c1c1e";
		ctx.font = `600 13px ${CAP_FONT}`;
		ctx.fillText(span, 108, top + 44);
		let rowY = top + 58;
		let x = 36;
		ctx.font = `600 11px ${CAP_FONT}`;
		ctx.fillStyle = "#8e8e93";
		ctx.textAlign = "center";
		headers.forEach((label, index) => {
			ctx.fillText(label, x + widths[index] / 2, rowY + headH / 2);
			x += widths[index];
		});
		ctx.strokeStyle = "rgba(0,0,0,0.08)";
		ctx.beginPath();
		ctx.moveTo(36, rowY + headH);
		ctx.lineTo(36 + tableW, rowY + headH);
		ctx.stroke();
		rowY += headH;
		const paint = (label, fill, ink, cells, endFill, whole = false, etaFill) => {
			if (whole) {
				ctx.fillStyle = "#f2f2f7";
				ctx.fillRect(30, rowY, cardW - 16, rowH);
			}
			const pillW = 78;
			fillRound(ctx, 36 + (widths[0] - pillW) / 2, rowY + 4, pillW, 20, 10, fill);
			ctx.fillStyle = ink;
			ctx.font = `600 12px ${CAP_FONT}`;
			ctx.textAlign = "center";
			ctx.fillText(label, 36 + widths[0] / 2, rowY + rowH / 2);
			let col = 36 + widths[0];
			ctx.font = `500 13px ${CAP_FONT}`;
			cells.forEach((cell, index) => {
				if (index === 5 && endFill && endFill !== "transparent") {
					ctx.fillStyle = endFill;
					ctx.fillRect(col, rowY, widths[index + 1], rowH);
				}
				if (index === 9 && etaFill && etaFill !== "transparent") {
					ctx.fillStyle = etaFill;
					ctx.fillRect(col, rowY, widths[index + 1], rowH);
				}
				ctx.fillStyle = "#1c1c1e";
				ctx.fillText(cell, col + widths[index + 1] / 2, rowY + rowH / 2);
				col += widths[index + 1];
			});
			rowY += rowH;
		};
		const cellsOf = (row) => [
			num(row.planned),
			num(row.done),
			num(row.left),
			pf.format(row.rate),
			cr(row.first),
			cr(row.last),
			hrs(row.hours),
			num(row.perHour),
			row.rank ?? ""
		];
		const wholeCells = cellsOf(block.whole);
		const lineCells = (row, index) => {
			const cells = cellsOf(row);
			if (!forecast) return {
				cells,
				eta: void 0
			};
			const seen = block.forecasts[index];
			const etaMs = row.left > 0 ? seen?.eta ?? null : row.last;
			const ahead = row.planned === 0 ? "—" : row.left === 0 ? "끝남" : seen?.eta == null ? "몰라요" : rr(seen.eta - (row.last ?? seen.eta));
			cells.push(row.planned === 0 ? "—" : ir(etaMs, block.cast.snapshot));
			cells.push(ahead);
			return {
				cells,
				eta: block.etaTone(row.left > 0 ? seen?.eta ?? null : null)
			};
		};
		if (forecast) {
			const ahead = block.cast.eta != null && block.cast.snapshot != null ? block.cast.eta - block.cast.snapshot : null;
			wholeCells.push(block.whole.planned === 0 ? "—" : block.cast.unknown.length > 0 ? "몰라요" : ir(block.cast.eta, block.cast.snapshot));
			wholeCells.push(block.whole.planned === 0 ? "—" : block.cast.left === 0 ? "끝남" : block.cast.unknown.length > 0 ? "몰라요" : rr(ahead));
		}
		paint("전체", "#2c3e50", "#ffffff", wholeCells, void 0, true);
		block.lines.forEach((row, index) => {
			const painted = lineCells(row, index);
			paint(Pn[index].replace(/^\S+\s/, ""), LINE_FILL[index], LINE_INK[index], painted.cells, block.finish(row.last), false, painted.eta);
		});
		y += h + gap;
	}
	ctx.fillStyle = "#8e8e93";
	ctx.font = `12px ${CAP_FONT}`;
	ctx.textAlign = "left";
	ctx.fillText(forecast ? "총 작업시간은 쉬는 시간이 포함된 첫 완료~마지막 완료입니다. 예상종료는 건/hr 기준입니다." : "총 작업시간은 쉬는 시간이 포함된 첫 완료~마지막 완료입니다. 순위는 건/hr입니다.", pad, height - 14);
	return canvas;
}
function b64ToArrayBuffer(b64) {
	const clean = b64.replace(/\s/g, "");
	const chunks = [];
	let total = 0;
	for (let i = 0; i < clean.length;) {
		let end = Math.min(clean.length, i + 1048576);
		const span = end - i;
		end -= span % 4;
		if (end <= i) end = clean.length;
		const bin = atob(clean.slice(i, end));
		const part = new Uint8Array(bin.length);
		for (let j = 0; j < bin.length; j++) part[j] = bin.charCodeAt(j);
		chunks.push(part);
		total += part.length;
		i = end;
	}
	const out = new Uint8Array(total);
	let offset = 0;
	for (const part of chunks) {
		out.set(part, offset);
		offset += part.length;
	}
	return out.buffer;
}
var WORK_ITEMS = [
	[
		"time",
		"시간별 확인",
		Clock
	],
	[
		"goods",
		"미작업 상품",
		Package
	],
	[
		"worked",
		"작업 상품",
		PackageCheck
	],
	[
		"store",
		"점포 진척",
		Store
	],
	[
		"route",
		"루트",
		Route
	]
];
var DATA_ITEMS = [
	[
		"archive",
		"생산성 분석",
		ChartColumn
	],
	[
		"ledger",
		"출고 분석",
		ClipboardList
	],
	[
		"stock",
		"수불분석",
		ArrowLeftRight
	],
	[
		"oship",
		"오출분석",
		TriangleAlert
	]
];
var SUB_LABELS = new Map([
	...WORK_ITEMS,
	...DATA_ITEMS,
	["location", "로케이션"],
	["oshipcheck", "오출 확인"]
].map(([id, label]) => [id, label]));
var BLANK_FILES = () => [
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null
];
var BLANK_NAMES = () => [
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	""
];
function workSlots(site) {
	const slots = [{
		label: "1. 작업 엑셀",
		role: "work"
	}];
	for (const id of centersOf(site)) if (site === "포천" && id === "2센터") {
		slots.push({
			label: `${slots.length + 1}. 2센터 FF2`,
			role: "2센터FF2"
		});
		slots.push({
			label: `${slots.length + 1}. 2센터 FF1`,
			role: "2센터FF1"
		});
	} else slots.push({
		label: `${slots.length + 1}. ${id} 배치표`,
		role: id
	});
	return slots.slice(0, 8);
}
function mergeSlots(site) {
	return centersOf(site).slice(0, 8).map((id, index) => ({
		label: `${index + 1}. ${id}`,
		role: id
	}));
}
function emptySite() {
	return {
		jobs: {},
		masters: {},
		storeCodes: {},
		bandMasters: {},
		webFiles: BLANK_FILES(),
		slotNames: {
			work: BLANK_NAMES(),
			merge: BLANK_NAMES()
		},
		archiveSeed: [],
		error: ""
	};
}
function Home() {
	const [jobs, setJobs] = (0, import_react.useState)({});
	const [masters, setMasters] = (0, import_react.useState)({});
	const [storeCodes, setStoreCodes] = (0, import_react.useState)({});
	const [bandMasters, setBandMasters] = (0, import_react.useState)({});
	const [busy, setBusy] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [tab, setTab] = (0, import_react.useState)("summary");
	const [openTabs, setOpenTabs] = (0, import_react.useState)([]);
	const [menuOpen, setMenuOpen] = (0, import_react.useState)(false);
	const [openMenu, setOpenMenu] = (0, import_react.useState)({
		work: false,
		data: false
	});
	const [manualOpen, setManualOpen] = (0, import_react.useState)(false);
	const [controlOpen, setControlOpen] = (0, import_react.useState)(false);
	const [wide, setWide] = (0, import_react.useState)(false);
	const [colPct, setColPct] = (0, import_react.useState)(50);
	const [rowLeft, setRowLeft] = (0, import_react.useState)(50);
	const [rowRight, setRowRight] = (0, import_react.useState)(50);
	const [summaryPane, setSummaryPane] = (0, import_react.useState)("lines");
	const [dragOver, setDragOver] = (0, import_react.useState)(false);
	const [archiveSeed, setArchiveSeed] = (0, import_react.useState)([]);
	const [company, setCompany] = (0, import_react.useState)(false);
	const [fileSheet, setFileSheet] = (0, import_react.useState)("");
	const headRef = (0, import_react.useRef)(null);
	const [sheetPos, setSheetPos] = (0, import_react.useState)({
		top: 0,
		left: 0
	});
	const [slotNames, setSlotNames] = (0, import_react.useState)({
		work: BLANK_NAMES(),
		merge: BLANK_NAMES()
	});
	const [webFiles, setWebFiles] = (0, import_react.useState)(BLANK_FILES);
	const siteBag = (0, import_react.useRef)({});
	const [site, setSite] = (0, import_react.useState)(() => {
		const names = siteDefs().map((item) => item.name);
		try {
			const saved = window.localStorage.getItem("center-site");
			if (saved && names.includes(saved)) return saved;
		} catch {}
		return names[0] ?? "신오산";
	});
	const [siteRev, setSiteRev] = (0, import_react.useState)(0);
	jn(site);
	An(centersOf(site));
	const loaded = Mn().filter((id) => (jobs[id]?.length ?? 0) > 0);
	function chooseSite(next) {
		if (next === site) return;
		siteBag.current[site] = {
			jobs,
			masters,
			storeCodes,
			bandMasters,
			webFiles,
			slotNames,
			archiveSeed,
			error
		};
		const saved = siteBag.current[next] ?? emptySite();
		setJobs(saved.jobs);
		setMasters(saved.masters);
		setStoreCodes(saved.storeCodes);
		setBandMasters(saved.bandMasters ?? {});
		setWebFiles(saved.webFiles);
		setSlotNames(saved.slotNames);
		setArchiveSeed(saved.archiveSeed);
		setError(saved.error);
		setBusy("");
		setFileSheet("");
		setSite(next);
		try {
			window.localStorage.setItem("center-site", next);
		} catch {}
	}
	(0, import_react.useEffect)(() => subscribeSites(() => {
		setSite((cur) => {
			const names = siteDefs().map((item) => item.name);
			const next = names.includes(cur) ? cur : names[0] ?? "신오산";
			jn(next);
			An(centersOf(next));
			return next;
		});
		setSiteRev((value) => value + 1);
	}), []);
	(0, import_react.useLayoutEffect)(() => {
		const query = window.matchMedia("(min-width: 1024px)");
		const apply = () => setWide(query.matches);
		apply();
		query.addEventListener("change", apply);
		return () => query.removeEventListener("change", apply);
	}, []);
	(0, import_react.useEffect)(() => {
		const host = window.chrome?.webview;
		if (!host?.addEventListener) return;
		const onMessage = (event) => {
			try {
				const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
				if (data?.type === "panel" && data.state && typeof data.state === "object") {
					applySharedPanel(data.state);
					return;
				}
				if (!data || data.type !== "slot") return;
				const kind = data.kind === "merge" ? "merge" : "work";
				setSlotNames((prev) => {
					const next = prev[kind].slice();
					next[data.index] = data.name || "";
					return {
						...prev,
						[kind]: next
					};
				});
			} catch {}
		};
		host.addEventListener("message", onMessage);
		return () => host.removeEventListener("message", onMessage);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!fileSheet) return;
		const onDown = (event) => {
			const el = event.target;
			if (el instanceof Element && el.closest("[data-file-sheet]")) return;
			setFileSheet("");
		};
		document.addEventListener("mousedown", onDown);
		return () => document.removeEventListener("mousedown", onDown);
	}, [fileSheet]);
	(0, import_react.useLayoutEffect)(() => {
		if (!fileSheet) return;
		const place = () => {
			const rect = headRef.current?.getBoundingClientRect();
			if (!rect) return;
			setSheetPos({
				top: rect.bottom + 8,
				left: rect.left
			});
		};
		place();
		window.addEventListener("resize", place);
		return () => window.removeEventListener("resize", place);
	}, [fileSheet]);
	(0, import_react.useEffect)(() => {
		pullSharedPanel().catch(() => {});
	}, []);
	(0, import_react.useEffect)(() => {
		const win = window;
		setCompany(Boolean(win.__COMPANY_PC__));
		const files = Array.isArray(win.__WB_FILES__) && win.__WB_FILES__.some((file) => file?.b64) ? win.__WB_FILES__.filter((file) => file?.b64) : win.__WB__ ? [{
			name: win.__WB_NAME__ || "엑셀",
			b64: win.__WB__
		}] : [];
		if (files.length === 0) return;
		let cancelled = false;
		(async () => {
			setBusy("엑셀 여는 중");
			setError("");
			await new Promise((resolve) => setTimeout(resolve, 30));
			try {
				const nextJobs = {};
				const nextMasters = {};
				const nextCodes = {};
				const nextBands = {};
				const nextArchive = [];
				const missed = [];
				const stashBand = (role, master) => {
					const band = role === "2센터FF1" ? "FF1" : role === "2센터FF2" ? "FF2" : "";
					if (!band) return false;
					const places = master.places["2센터"] ?? {};
					const codes = master.codes["2센터"] ?? {};
					nextBands["2센터"] = {
						...nextBands["2센터"],
						[band]: {
							places,
							codes
						}
					};
					if (band === "FF1") {
						nextMasters["2센터"] = places;
						nextCodes["2센터"] = codes;
					}
					return true;
				};
				for (const file of files) {
					if (cancelled) return;
					const name = file.name || "엑셀";
					setBusy(`${name} 여는 중`);
					const buf = b64ToArrayBuffer(file.b64 ?? "");
					if (file.role === "archive") {
						nextArchive.push({
							name,
							buf
						});
						continue;
					}
					const bandRole = file.role === "2센터FF1" || file.role === "2센터FF2" ? file.role : "";
					const forced = /^[1-9]센터$/.test(file.role || "") ? file.role : "";
					if (forced || bandRole) {
						const id = bandRole ? "2센터" : forced;
						const master = await readLocMaster(buf, id, `${id}.xls`, id);
						if (!master) {
							missed.push(`${name} 은 배치표가 아닙니다. 로케이션코드와 점포명 열이 있어야 합니다.`);
							continue;
						}
						if (!stashBand(bandRole, master)) {
							for (const centerId of Mn()) if (master.places[centerId]) nextMasters[centerId] = {
								...nextMasters[centerId] ?? {},
								...master.places[centerId]
							};
							for (const centerId of Mn()) if (master.codes[centerId]) nextCodes[centerId] = {
								...nextCodes[centerId] ?? {},
								...master.codes[centerId]
							};
						}
						continue;
					}
					try {
						const parsed = await readCenters(buf, "1센터", setBusy);
						for (const id of Mn()) if (parsed.centers[id]) nextJobs[id] = parsed.centers[id];
					} catch (err) {
						const master = await readLocMaster(buf, "1센터", name);
						if (master && Mn().some((id) => master.places[id] && Object.keys(master.places[id] ?? {}).length > 0)) {
							for (const id of Mn()) if (master.places[id]) nextMasters[id] = {
								...nextMasters[id] ?? {},
								...master.places[id]
							};
							for (const id of Mn()) if (master.codes[id]) nextCodes[id] = {
								...nextCodes[id] ?? {},
								...master.codes[id]
							};
							missed.push(`${name} 은 작업 엑셀이 아니라 배치표로 넣었습니다. 작업 파일은 1번에 넣어 주세요.`);
							continue;
						}
						missed.push(err instanceof Error ? `${name}: ${err.message}` : `${name} 을 읽지 못했습니다.`);
					}
				}
				if (cancelled) return;
				if (Object.keys(nextJobs).length > 0) setJobs(nextJobs);
				if (Object.keys(nextMasters).length > 0) setMasters(nextMasters);
				if (Object.keys(nextCodes).length > 0) setStoreCodes(nextCodes);
				if (Object.keys(nextBands).length > 0) setBandMasters(nextBands);
				if (nextArchive.length > 0) {
					setArchiveSeed(nextArchive);
					setTab("archive");
					rememberTab("archive");
					setOpenMenu((prev) => ({
						...prev,
						data: true
					}));
				}
				setBusy("");
				if (missed.length > 0) setError(missed.join(" "));
			} catch (err) {
				if (cancelled) return;
				setBusy("");
				setError(err instanceof Error ? err.message : "파일을 읽지 못했습니다.");
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);
	async function onFile(file) {
		if (!file || busy) return;
		setBusy(`${file.name} 여는 중`);
		setError("");
		await new Promise((resolve) => setTimeout(resolve, 30));
		try {
			const buf = await file.arrayBuffer();
			const master = looksLikeMaster(file.name, buf) ? await readLocMaster(buf, "1센터", file.name) : null;
			if (master) {
				setMasters((prev) => ({
					...prev,
					...master.places
				}));
				setStoreCodes((prev) => ({
					...prev,
					...master.codes
				}));
				setBusy("");
				setError("");
				return;
			}
			const parsed = await readCenters(buf, "1센터", setBusy);
			const next = { ...jobs };
			for (const id of Mn()) if (parsed.centers[id]) next[id] = parsed.centers[id];
			setJobs(next);
			setBusy("");
		} catch (err) {
			setBusy("");
			setError(err instanceof Error ? err.message : "파일을 읽지 못했습니다.");
		}
	}
	function saveBand(role, master) {
		const band = role === "2센터FF1" ? "FF1" : role === "2센터FF2" ? "FF2" : "";
		if (!band) return false;
		const places = master.places["2센터"] ?? {};
		const codes = master.codes["2센터"] ?? {};
		setBandMasters((prev) => ({
			...prev,
			"2센터": {
				...prev["2센터"],
				[band]: {
					places,
					codes
				}
			}
		}));
		if (band === "FF1") {
			setMasters((prev) => ({
				...prev,
				"2센터": places
			}));
			setStoreCodes((prev) => ({
				...prev,
				"2센터": codes
			}));
		}
		return true;
	}
	async function onMasters(list) {
		const files = [...list];
		if (files.length === 0 || busy) return;
		setError("");
		const missed = [];
		for (const item of files) {
			const file = item.file ?? item;
			const role = item.role ?? "";
			const id = role.startsWith("2센터") ? "2센터" : /^[1-9]센터$/.test(role) ? role : "";
			setBusy(`${file.name} 배치 읽는 중`);
			await new Promise((resolve) => setTimeout(resolve, 30));
			try {
				const master = await readLocMaster(await file.arrayBuffer(), id || "1센터", id ? `${id}.xls` : file.name, id || void 0);
				if (!master) {
					missed.push(file.name);
					continue;
				}
				if (saveBand(role, master)) continue;
				setMasters((prev) => ({
					...prev,
					...master.places
				}));
				setStoreCodes((prev) => ({
					...prev,
					...master.codes
				}));
			} catch (err) {
				missed.push(err instanceof Error ? `${file.name}: ${err.message}` : file.name);
			}
		}
		setBusy("");
		if (missed.length > 0) setError(`배치표로 읽지 못했습니다. 로케이션코드·점포명 열이 있는 파일인지 확인해 주세요. ${missed.join(", ")}`);
	}
	async function openWebWork() {
		const job = webFiles[0];
		const roles = workSlots(site).slice(1);
		const picked = webFiles.slice(1).map((file, index) => file ? {
			file,
			role: roles[index]?.role || ""
		} : null).filter(Boolean);
		if (!job && picked.length === 0) {
			setError("작업 엑셀이나 배치표를 먼저 찾아 주세요.");
			return;
		}
		if (job) await onFile(job);
		if (picked.length > 0) await onMasters(picked);
		setFileSheet("");
	}
	function rememberTab(id) {
		if (!SUB_LABELS.has(id)) return;
		setOpenTabs((prev) => {
			if (prev.includes(id)) return prev;
			const next = [...prev, id];
			return next.length > 5 ? next.slice(-5) : next;
		});
	}
	function pickTab(id) {
		setTab(id);
		setMenuOpen(false);
		rememberTab(id);
	}
	function closeOpenTab(id) {
		setOpenTabs((prev) => {
			const rest = prev.filter((item) => item !== id);
			setTab((cur) => cur === id ? rest[rest.length - 1] || "summary" : cur);
			return rest;
		});
	}
	function locReady(id) {
		if (site === "포천" && id === "2센터") {
			const bands = bandMasters["2센터"] ?? {};
			return Object.keys(bands.FF1?.places ?? {}).length > 0 && Object.keys(bands.FF2?.places ?? {}).length > 0;
		}
		return Object.keys(masters[id] ?? {}).length > 0;
	}
	function menuItem(id, label, Icon, child) {
		const on = tab === id;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			"aria-current": on ? "page" : void 0,
			onClick: () => pickTab(id),
			className: "flex w-full shrink-0 items-center gap-3 rounded-xl text-left font-medium " + (child ? "h-10 pl-9 pr-3 text-[14px] " : "h-11 px-3 text-[15px] ") + (on ? "bg-[#007aff] text-white" : "bg-transparent text-black"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				size: child ? 18 : 20,
				strokeWidth: 2,
				"aria-hidden": true
			}), label]
		}, id);
	}
	function menuGroup(key, label, Icon, items) {
		const open = openMenu[key];
		const active = items.some(([id]) => id === tab);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "shrink-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				"aria-expanded": open,
				onClick: () => setOpenMenu((prev) => ({
					...prev,
					[key]: !prev[key]
				})),
				className: "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-medium " + (active && !open ? "bg-[#e8f1ff] text-[#007aff]" : "text-black"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
						size: 20,
						strokeWidth: 2,
						"aria-hidden": true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "min-w-0 flex-1",
						children: label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
						size: 16,
						strokeWidth: 2,
						className: "shrink-0 text-[#8e8e93] transition-transform " + (open ? "rotate-180" : ""),
						"aria-hidden": true
					})
				]
			}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 flex flex-col gap-1",
				children: items.map(([id, name, ItemIcon]) => menuItem(id, name, ItemIcon, true))
			}) : null]
		}, key);
	}
	const sheetMenu = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
		className: "flex h-full w-64 shrink-0 flex-col overflow-hidden bg-white p-3",
		"aria-label": "메뉴",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1 flex h-11 shrink-0 items-center justify-between pl-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 text-xs text-[#8e8e93]",
						children: "메뉴"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "inline-flex h-7 shrink-0 items-center rounded-full border border-black/10 px-2.5 text-[11px] font-medium text-[#8e8e93]",
						onClick: () => {
							setMenuOpen(false);
							setManualOpen(true);
						},
						children: "메뉴얼"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "메뉴 접기",
					className: "inline-flex h-11 w-11 items-center justify-center text-[#007aff]",
					onClick: () => setMenuOpen(false),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelLeftClose, {
						size: 22,
						strokeWidth: 2,
						"aria-hidden": true
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto",
				children: [
					menuItem("summary", "요약", LayoutDashboard, false),
					menuGroup("work", "작업 확인", ListChecks, WORK_ITEMS),
					menuItem("location", "로케이션", MapPin, false),
					menuItem("oshipcheck", "오출 확인", TriangleAlert, false),
					menuGroup("data", "데이터분석", ChartPie, DATA_ITEMS)
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-auto flex shrink-0 items-center gap-1.5 pt-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex h-7 min-w-0 flex-1 items-center justify-center truncate rounded-full border border-black/10 px-2 text-[11px] font-medium tabular-nums text-[#8e8e93]",
						title: "Build : " + BUILD_LABEL,
						children: "Build : " + BUILD_LABEL
					}),
					company ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/company-pc.zip",
						download: "회사PC용.zip",
						className: "inline-flex h-7 shrink-0 items-center rounded-full bg-yellow px-2 text-[11px] font-semibold text-title",
						title: "회사 컴퓨터용. 브라우저 업로드는 Privacy-i가 막습니다.",
						children: "생산성 EXE"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "제어판",
						className: "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8e8e93]",
						onClick: () => {
							setMenuOpen(false);
							setControlOpen(true);
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, {
							size: 20,
							strokeWidth: 2,
							"aria-hidden": true
						})
					})
				]
			})
		]
	});
	const menuOverlay = menuOpen && !wide && typeof document !== "undefined" ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": "메뉴 닫기",
		className: "fixed inset-0 z-30 bg-black/40",
		onClick: () => setMenuOpen(false)
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-y-0 left-0 z-40 h-full",
		children: sheetMenu
	})] }), document.body) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex h-screen w-full max-w-none flex-col overflow-hidden px-3 py-2 sm:px-5",
		children: [
			menuOverlay,
			manualOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ManualViewer, { onClose: () => setManualOpen(false) }) : null,
			controlOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlPanel, { onClose: () => setControlOpen(false) }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				ref: headRef,
				className: "relative z-20 shrink-0 rounded-2xl border border-black/5 bg-paper/90 px-3 py-1.5 shadow-sm backdrop-blur-md " + (dragOver ? "border-title" : "border-grid"),
				onDragOver: (event) => {
					event.preventDefault();
					setDragOver(true);
				},
				onDragLeave: () => setDragOver(false),
				onDrop: (event) => {
					event.preventDefault();
					setDragOver(false);
					const files = [...event.dataTransfer.files ?? []];
					if (files.length === 0) return;
					if (files.every((file) => {
						const base = file.name.replace(/\.[^.]+$/, "");
						return /[-_\s][1-9]$/.test(base) || /[1-9]\s*센터|배치|로케이션|점포/.test(base);
					})) onMasters(files);
					else onFile(files[0]);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-x-2 gap-y-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": menuOpen ? "메뉴 접기" : "메뉴 열기",
							"aria-expanded": menuOpen,
							className: "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-black",
							onClick: () => {
								setFileSheet("");
								setMenuOpen((open) => !open);
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelLeft, {
								size: 22,
								strokeWidth: 2,
								"aria-hidden": true
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
							label: "",
							value: site,
							soft: true,
							compact: true,
							float: true,
							onChange: (id) => chooseSite(id),
							options: siteDefs().map((item) => ({
								id: item.name,
								label: item.name
							}))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "shrink-0 text-[15px] font-semibold tracking-tight text-ink",
							children: "센터 생산성"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-1 rounded-full bg-[#f2f2f7] p-0.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"data-file-sheet": "",
									className: "inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold " + (fileSheet === "work" ? "bg-[#1c1c1e] text-white" : "bg-title text-on-dark"),
									title: workSlots(site).some((slot) => slot.role === "2센터FF2") ? "오늘 작업 엑셀과 1센터, 2센터 FF2·FF1 배치표를 올립니다." : "오늘 작업 엑셀과 센터 배치표를 올립니다.",
									onClick: () => setFileSheet((cur) => cur === "work" ? "" : "work"),
									children: "작업 파일"
								}),
								company ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"data-file-sheet": "",
									className: "inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold text-white " + (fileSheet === "merge" ? "bg-[#005ecb]" : "bg-[#007aff]"),
									title: "센터별 원본으로 업로드용 엑셀을 만듭니다.",
									onClick: () => setFileSheet((cur) => cur === "merge" ? "" : "merge"),
									children: "파일 합치기"
								}) : null,
								loaded.length > 0 || Mn().some((id) => masters[id]) || Object.keys(bandMasters["2센터"]?.FF2?.places ?? {}).length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "inline-flex h-7 items-center rounded-full bg-paper px-3 text-xs font-semibold text-muted",
									onClick: () => {
										setJobs({});
										setMasters({});
										setStoreCodes({});
										setBandMasters({});
										setError("");
										setWebFiles(BLANK_FILES());
										setSlotNames({
											work: BLANK_NAMES(),
											merge: BLANK_NAMES()
										});
									},
									children: "지우기"
								}) : null
							]
						}),
						openTabs.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "chrome-tabs",
							role: "tablist",
							"aria-label": "열어 둔 화면",
							children: openTabs.map((id) => {
								const on = tab === id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "chrome-tab" + (on ? " on" : ""),
									role: "tab",
									"aria-selected": on,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "chrome-tab-label",
										onClick: () => pickTab(id),
										children: SUB_LABELS.get(id)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "chrome-tab-x",
										"aria-label": `${SUB_LABELS.get(id)} 탭 닫기`,
										onClick: () => closeOpenTab(id),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
											size: 12,
											strokeWidth: 2.4,
											"aria-hidden": true
										})
									})]
								}, id);
							})
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2",
							children: [
								busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] font-semibold text-title",
									children: busy
								}) : null,
								error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "max-w-md truncate text-[11px] font-medium text-line-1",
									title: error,
									children: error
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-stretch overflow-hidden rounded-2xl bg-white shadow-sm",
									"aria-label": "올린 파일 확인",
									children: Mn().map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border-l border-black/5 px-2.5 py-1 text-center first:border-l-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] font-semibold text-[#1c1c1e]",
											children: id
										}), [["작업", loaded.includes(id)], ["로케이션", locReady(id)]].map(([label, on]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-0.5 flex items-center justify-center gap-1 text-[11px] text-[#3a3a3c]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "inline-flex h-4 w-4 items-center justify-center rounded-[5px] " + (on ? "bg-[#007aff] text-white" : "bg-white shadow-[inset_0_0_0_1.5px_rgba(60,60,67,0.3)]"),
												"aria-label": `${id} ${label} ${on ? "있음" : "없음"}`,
												children: on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
													size: 12,
													strokeWidth: 3,
													"aria-hidden": true
												}) : null
											}), label]
										}, label))]
									}, id))
								})
							]
						})
					]
				}), fileSheet === "work" || fileSheet === "merge" ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					"data-file-sheet": "",
					className: "fixed z-[80] w-[546px] max-w-[calc(100vw-24px)] rounded-2xl bg-[#f2f2f7] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.18)]",
					style: {
						top: sheetPos.top,
						left: sheetPos.left
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-1 pb-2 text-[13px] leading-5 text-[#8e8e93]",
							children: fileSheet === "work" ? workSlots(site).some((slot) => slot.role === "2센터FF2") ? "1번은 업로드용 작업 엑셀. 2센터는 FF2와 FF1 배치표를 각각 올립니다." : "1번은 업로드용 작업 엑셀. 나머지는 센터 배치표입니다." : "폴더가 달라도 센터마다 찾기를 누르세요. OrderDetail 시트를 한 엑셀로 합칩니다."
						}),
						(fileSheet === "work" ? workSlots(site) : mergeSlots(site)).map((slot, index) => {
							const name = slotNames[fileSheet][index];
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-2 flex items-center gap-3 rounded-2xl bg-white px-4 py-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-[168px] shrink-0 whitespace-nowrap text-[15px] font-semibold text-[#1c1c1e]",
										children: slot.label
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "min-w-0 flex-1 truncate text-[14px] " + (name ? "text-[#1c1c1e]" : "text-[#8e8e93]"),
										children: name || "아직 없음"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "inline-flex h-9 shrink-0 items-center rounded-full bg-[#f2f2f7] px-4 text-[14px] font-semibold text-[#1c1c1e]",
										onClick: () => {
											if (company || fileSheet === "merge") {
												window.chrome?.webview?.postMessage(fileSheet === "work" ? `pick-work-${index}|${slot.role}` : `pick-merge-${index}|${slot.role}`);
												return;
											}
											document.getElementById(`web-file-${index}`)?.click();
										},
										children: "찾기"
									}),
									!company && fileSheet === "work" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: `web-file-${index}`,
										type: "file",
										accept: ".xlsx,.xls,.xlsm",
										className: "sr-only",
										onChange: (event) => {
											const file = event.target.files?.[0];
											event.target.value = "";
											if (!file) return;
											setWebFiles((prev) => {
												const next = prev.slice();
												next[index] = file;
												return next;
											});
											setSlotNames((prev) => {
												const next = prev.work.slice();
												next[index] = file.name;
												return {
													...prev,
													work: next
												};
											});
										}
									}) : null
								]
							}, slot.role);
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "mt-1 flex h-11 w-full items-center justify-center rounded-xl bg-[#007aff] text-[16px] font-semibold text-white",
							onClick: () => {
								if (company || fileSheet === "merge") {
									window.chrome?.webview?.postMessage(fileSheet === "work" ? "open-work" : "make-merge");
									return;
								}
								openWebWork();
							},
							children: fileSheet === "work" ? "열기" : "업로드용 엑셀 만들기"
						}),
						fileSheet === "merge" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-1 pt-2 text-[13px] text-[#8e8e93]",
							children: "없는 센터는 비워 두면 그 시트는 만들지 않습니다."
						}) : null
					]
				}), document.body) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				key: site + "-" + siteRev,
				className: "mt-2 flex min-h-0 flex-1 gap-2 overflow-hidden",
				children: [wide && menuOpen ? sheetMenu : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl border border-black/5 bg-paper shadow-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: tab === "summary" ? "absolute inset-0 flex overflow-hidden bg-[#f2f2f7]" : "hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PaceProvider, {
								jobs,
								children: wide ? [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex min-h-0 min-w-0 flex-col",
										style: { flex: `${colPct} 1 0` },
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "min-h-0 overflow-hidden",
												style: { flex: `${rowLeft} 1 0` },
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
													jobs,
													loaded: loaded.length > 0
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaneSplit, {
												axis: "y",
												onDrag: (pct) => setRowLeft(pct)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "min-h-0 overflow-hidden bg-[#f2f2f7]",
												style: { flex: `${100 - rowLeft} 1 0` },
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex h-full min-h-0 items-center justify-center gap-2 overflow-auto",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaceBoard, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineBoard, {})]
												})
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaneSplit, {
										axis: "x",
										onDrag: (pct) => setColPct(pct)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex min-h-0 min-w-0 flex-col",
										style: { flex: `${100 - colPct} 1 0` },
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "min-h-0 overflow-hidden",
												style: { flex: `${rowRight} 1 0` },
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compare, {
													jobs,
													loaded: loaded.length > 0
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaneSplit, {
												axis: "y",
												onDrag: (pct) => setRowRight(pct)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "min-h-0 overflow-hidden bg-[#f2f2f7]",
												style: { flex: `${100 - rowRight} 1 0` },
												children: null
											})
										]
									})
								] : [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "summary-phone flex h-full min-h-0 w-full flex-col",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid shrink-0 grid-cols-3 gap-1 px-2 pt-2",
											children: [
												["lines", "라인별 생산성"],
												["compare", "센터비교"],
												["pace", "예상 작업 종료시간"]
											].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "h-10 rounded-full px-1 text-[12px] font-semibold leading-tight " + (summaryPane === id ? "bg-[#007aff] text-white" : "bg-white text-[#1c1c1e] shadow-sm"),
												onClick: () => setSummaryPane(id),
												children: label
											}, id))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: summaryPane === "lines" ? "min-h-0 flex-1 overflow-hidden" : "hidden",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
												jobs,
												loaded: loaded.length > 0
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: summaryPane === "compare" ? "min-h-0 flex-1 overflow-hidden" : "hidden",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compare, {
												jobs,
												loaded: loaded.length > 0
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: summaryPane === "pace" ? "min-h-0 flex-1 overflow-auto" : "hidden",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex min-h-full flex-col items-stretch",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaceBoard, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineBoard, {})]
											})
										})
									]
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: tab === "time" ? "phone-compact absolute inset-0 overflow-auto" : "hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimeView, {
								jobs,
								loaded: loaded.length > 0
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: tab === "route" ? "phone-compact absolute inset-0 overflow-auto" : "hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouteView, {
								jobs,
								loaded: loaded.length > 0
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: tab === "oship" ? "phone-compact absolute inset-0 overflow-hidden" : "hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OshipView, {
								masters,
								storeCodes,
								bandMasters,
								jobs
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: tab === "store" ? "phone-compact absolute inset-0 overflow-auto" : "hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreView, {
								jobs,
								loaded: loaded.length > 0
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: tab === "goods" ? "phone-compact absolute inset-0 overflow-auto" : "hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoodsView, {
								jobs,
								loaded: loaded.length > 0
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: tab === "worked" ? "phone-compact absolute inset-0 overflow-auto" : "hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkedView, {
								jobs,
								loaded: loaded.length > 0
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: tab === "ledger" ? "phone-compact absolute inset-0 overflow-auto" : "hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LedgerView, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: tab === "location" ? "phone-compact absolute inset-0 overflow-hidden" : "hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocationView, {
								jobs,
								loaded: loaded.length > 0,
								masters,
								storeCodes,
								bandMasters
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: tab === "oshipcheck" ? "phone-compact absolute inset-0 overflow-hidden" : "hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OshipCheckView, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: tab === "archive" ? "phone-compact absolute inset-0 overflow-auto" : "hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArchiveView, { seed: archiveSeed })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: tab === "stock" ? "phone-compact absolute inset-0 bg-white" : "hidden" })
					]
				})]
			})
		]
	});
}
function jobsOf(all, center, dpt) {
	const list = all[center] ?? [];
	return dpt === "전체" ? list : list.filter((job) => zn(job.route, dpt));
}
function jobsForDpt(all, dpt) {
	if (dpt === "전체") return all;
	const next = {};
	for (const id of Mn()) {
		const list = all[id];
		if (list) next[id] = list.filter((job) => zn(job.route, dpt));
	}
	return next;
}
function DptSelect({ value, onChange, compact = false, soft = false, up = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
		label: "DPT",
		value,
		onChange,
		compact,
		soft,
		up,
		options: In.map((item) => ({
			id: item.id,
			label: item.label
		}))
	});
}
function emptyDpt(dpt) {
	return dpt === "전체" ? "이 센터 파일은 아직 없습니다." : "이 DPT에 해당하는 루트가 없습니다.";
}
function CenterSelect({ value, onChange, compact = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
		label: "센터",
		value,
		onChange,
		compact,
		options: Mn().map((id) => ({
			id,
			label: id
		}))
	});
}
function heatColor(count, min, max) {
	if (max <= min) return "rgb(255, 235, 132)";
	const t = Math.min(1, Math.max(0, (count - min) / (max - min)));
	const mix = (from, to, amount) => from.map((value, index) => Math.round(value + (to[index] - value) * amount));
	const green = [
		99,
		190,
		123
	];
	const yellow = [
		255,
		235,
		132
	];
	const rgb = t < .5 ? mix(green, yellow, t * 2) : mix(yellow, [
		248,
		105,
		107
	], (t - .5) * 2);
	return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}
function shortStoreName(name) {
	const raw = String(name ?? "").trim();
	if (raw.length < 9) return raw;
	return raw.replace(/^GS25\s*/i, "").replace(/점$/, "") || raw;
}
function routeTone(route) {
	const n = Number(route.split(" ")[0]);
	return `hsl(${(Number.isFinite(n) ? n * 137.508 % 360 : 210).toFixed(1)} 46% 90%)`;
}
function routeRgb(route) {
	const n = Number(String(route ?? "").split(" ")[0]);
	const h = Number((Number.isFinite(n) ? n * 137.508 % 360 : 210).toFixed(1)) / 360;
	const s = .46;
	const l = .9;
	const q = 1.36 - l * s;
	const p = 2 * l - q;
	const ch = (t) => {
		const u = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
		const v = u < 1 / 6 ? p + .5520000000000005 * u : u < 1 / 2 ? q : u < 2 / 3 ? p + .09200000000000008 * (2 / 3 - u) * 6 : p;
		return Math.round(v * 255).toString(16).padStart(2, "0").toUpperCase();
	};
	return `${ch(h + 1 / 3)}${ch(h)}${ch(h - 1 / 3)}`;
}
function RouteEntry({ value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		value,
		placeholder: "··",
		"aria-label": "루트 입력",
		inputMode: "numeric",
		maxLength: 4,
		className: "m-0 box-content w-auto shrink-0 select-text border-0 bg-transparent p-0 font-[inherit] text-[length:inherit] leading-none font-bold tabular-nums text-ink outline-none placeholder:text-muted/60 " + (value ? "text-left" : "text-center shadow-[inset_0_-1px_0_rgba(93,109,126,0.55)]"),
		style: value ? {
			width: `${value.length}ch`,
			minWidth: `${value.length}ch`
		} : {
			width: "2.6rem",
			minWidth: "2.6rem"
		},
		title: "루트가 없는 점포입니다. 140처럼 적으면 40으로 표시됩니다.",
		onPointerDown: (event) => {
			event.stopPropagation();
			if (event.currentTarget.parentElement) event.currentTarget.parentElement.draggable = false;
		},
		onClick: (event) => event.stopPropagation(),
		onKeyDown: (event) => event.stopPropagation(),
		onChange: (event) => onChange(event.target.value, false),
		onBlur: (event) => {
			if (event.currentTarget.parentElement) event.currentTarget.parentElement.draggable = true;
			onChange(event.target.value, true);
		}
	});
}
function LocationCell({ slot, hit, home, side, big, min, max, unit, routeDraft, onRoute, selected, onToggle, onPlace, onClear, skipClick }) {
	const [hot, setHot] = (0, import_react.useState)(false);
	const dragged = (0, import_react.useRef)(false);
	const dropped = (0, import_react.useRef)(false);
	const box = "grid items-stretch gap-1 overflow-hidden rounded-sm border px-1 " + (big ? "h-11 text-xs" : "h-9 text-[10px]");
	const cols = side === "left" ? " grid-cols-[36px_minmax(0,1fr)_56px]" : " grid-cols-[56px_minmax(0,1fr)_36px]";
	if (slot.kind === "blank") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: box + " border-transparent bg-transparent" });
	if (slot.kind === "pillar") {
		const box = pillarBox(slot.span || 1, big);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "loc-pillar grid items-center justify-center overflow-hidden rounded-sm font-bold tracking-widest text-on-dark " + (big ? "text-xs" : "text-[10px]") + box.className,
			style: box.style,
			children: "기둥"
		});
	}
	const tone = hit?.route ? routeTone(hit.route) : void 0;
	const fill = tone ? { background: tone } : void 0;
	const code = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "flex items-center justify-center truncate text-center font-bold tabular-nums text-ink",
		children: slot.code
	});
	const storeName = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "min-w-0 shrink overflow-hidden whitespace-nowrap",
		title: hit?.store || void 0,
		children: shortStoreName(hit?.store)
	});
	const store = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		draggable: Boolean(home),
		"data-store": home || void 0,
		onPointerDown: (event) => {
			if (!home) return;
			event.currentTarget.draggable = !event.shiftKey;
		},
		onDragStart: (event) => {
			if (!home || event.shiftKey || event.target.closest("input")) {
				event.preventDefault();
				return;
			}
			dragged.current = true;
			event.stopPropagation();
			event.dataTransfer.setData("text/plain", home);
			event.dataTransfer.effectAllowed = "move";
		},
		onClick: (event) => {
			if (!home || skipClick.current || event.target.closest("input")) return;
			if (dragged.current) {
				dragged.current = false;
				return;
			}
			onToggle(home, event.shiftKey);
		},
		className: "flex h-full min-w-0 max-w-full items-center gap-1.5 overflow-hidden whitespace-nowrap rounded px-1 font-bold text-ink " + (home ? "cursor-pointer " : "") + (big ? "text-[13px]" : "text-[12px]"),
		style: fill,
		title: home ? "점포를 클릭한 뒤 Shift를 누른 채 다른 점포를 클릭하면 그 사이가 선택됩니다." : void 0,
		children: [
			side === "right" ? storeName : null,
			onRoute ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouteEntry, {
				value: routeDraft ?? "",
				onChange: onRoute
			}) : hit?.route ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "shrink-0 font-bold tabular-nums leading-none",
				children: hit.route
			}) : null,
			side === "left" ? storeName : null
		]
	});
	const count = hit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "flex h-full items-center justify-center rounded-sm text-center font-bold tabular-nums " + (hit.count > 0 ? "text-ink" : "text-muted"),
		style: { background: hit.count > 0 ? heatColor(hit.count, min, max) : "#eef3f6" },
		children: num(hit.count)
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-cell": slot.code,
		"data-home": home || void 0,
		draggable: home ? void 0 : true,
		className: box + cols + " min-w-0 max-w-full " + (hit ? " border-grid bg-paper" : " border-[#e4ebf0] bg-[#f7fafc]") + (selected ? " ring-2 ring-mark" : "") + (hot ? " ring-2 ring-title" : "") + (!home ? " cursor-pointer" : ""),
		title: hit ? `${slot.code} 루트 ${hit.route} ${hit.store} ${unit} ${nf.format(hit.count)}` : `${slot.code} 빈칸. 클릭하면 선택되고, Shift로 범위를 잡습니다.`,
		onPointerDown: (event) => {
			if (home) return;
			event.currentTarget.draggable = !event.shiftKey;
		},
		onDragStart: (event) => {
			if (event.target !== event.currentTarget) return;
			if (home || event.shiftKey) {
				event.preventDefault();
				return;
			}
			dragged.current = true;
			event.dataTransfer.setData("text/plain", `cell:${slot.code}`);
			event.dataTransfer.effectAllowed = "move";
		},
		onDragOver: (event) => {
			event.preventDefault();
			setHot(true);
		},
		onDragLeave: () => setHot(false),
		onDrop: (event) => {
			event.preventDefault();
			setHot(false);
			dropped.current = true;
			const id = event.dataTransfer.getData("text/plain");
			if (id) onPlace(id, slot.code);
		},
		onClick: (event) => {
			if (home || skipClick.current) return;
			if (dragged.current) {
				dragged.current = false;
				return;
			}
			if (dropped.current) {
				dropped.current = false;
				return;
			}
			onToggle(`cell:${slot.code}`, event.shiftKey);
		},
		children: side === "left" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			code,
			store,
			count
		] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			count,
			store,
			code
		] })
	});
}
var LINE_TONE = [
	"bg-line-1",
	"bg-line-2",
	"bg-line-3",
	"bg-line-4",
	"bg-line-5",
	"bg-line-6",
	"bg-line-7",
	"bg-line-8",
	"bg-line-1",
	"bg-line-5",
	"bg-line-3",
	"bg-line-2"
];
function lineChoices(centers) {
	const count = centers.length ? Math.max(...centers.map((id) => Bn(id))) : 8;
	const n = Math.max(1, Math.min(12, count || 8));
	return Array.from({ length: n }, (_, index) => index + 1);
}
function layoutSpots(layout) {
	const at = /* @__PURE__ */ new Map();
	const cell = /* @__PURE__ */ new Map();
	layout.forEach((line, lineIndex) => {
		["left", "right"].forEach((side, sideIndex) => {
			const x = lineIndex * 2 + sideIndex;
			line[side].forEach((slot, y) => {
				if (slot.kind !== "loc") return;
				at.set(slot.code, {
					x,
					y
				});
				cell.set(`${x},${y}`, slot.code);
			});
		});
	});
	return {
		at,
		cell
	};
}
function sameMoves(a, b) {
	const keys = /* @__PURE__ */ new Set([...Object.keys(a), ...Object.keys(b)]);
	for (const key of keys) if ((a[key] ?? "") !== (b[key] ?? "")) return false;
	return true;
}
function isCellPick(id) {
	return id.startsWith("cell:");
}
function pickPos(id, cur) {
	if (isCellPick(id)) return cur[id] ?? id.slice(5);
	return cur[id] ?? id;
}
function shiftedMoves(homes, cur, storeId, target, picked, spots) {
	const pos = (id) => pickPos(id, cur);
	if (!pos(storeId)) return null;
	let dragId = storeId;
	if (isCellPick(storeId) && !picked.has(storeId)) {
		const code = storeId.slice(5);
		for (const id of picked) if (isCellPick(id) && pos(id) === code) {
			dragId = id;
			break;
		}
	}
	const selected = picked.has(dragId) ? [...picked] : [dragId];
	const anchorId = pos(dragId);
	const next = { ...cur };
	if (target === "tray") {
		let changed = false;
		for (const id of selected) {
			if (pos(id) === "tray") continue;
			next[id] = "tray";
			changed = true;
		}
		return changed ? next : null;
	}
	const anchor = anchorId;
	if (anchor === "tray") {
		const pile = selected.filter((id) => pos(id) === "tray").sort();
		const start = spots.at.get(target);
		if (!start || pile.length === 0) return null;
		const dests = [];
		for (let y = start.y; dests.length < pile.length && y < start.y + 80; y++) {
			const code = spots.cell.get(`${start.x},${y}`);
			if (code) dests.push(code);
		}
		if (dests.length < pile.length) dests.length = 0;
		if (dests.length === 0) return null;
		const occ = /* @__PURE__ */ new Map();
		for (const id of homes) {
			const where = pos(id);
			if (where !== "tray") occ.set(where, id);
		}
		pile.forEach((id, index) => {
			const dest = dests[index];
			const occupant = occ.get(dest);
			if (occupant && occupant !== id && !pile.includes(occupant)) next[occupant] = "tray";
			if (dest === id) delete next[id];
			else next[id] = dest;
		});
		return sameMoves(cur, next) ? null : next;
	}
	const from = spots.at.get(anchor);
	const to = spots.at.get(target);
	if (!from || !to) return null;
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	if (dx === 0 && dy === 0) return null;
	const placed = selected.filter((id) => pos(id) !== "tray" && spots.at.has(pos(id))).map((id) => spots.at.get(pos(id))).filter((spot) => Boolean(spot));
	if (placed.length === 0 || !spots.at.has(anchor)) return null;
	const minX = Math.min(...placed.map((spot) => spot.x));
	const maxX = Math.max(...placed.map((spot) => spot.x));
	const minY = Math.min(...placed.map((spot) => spot.y));
	const maxY = Math.max(...placed.map((spot) => spot.y));
	const occ = /* @__PURE__ */ new Map();
	for (const id of homes) {
		const where = pos(id);
		if (where !== "tray") occ.set(where, id);
	}
	const cellMove = /* @__PURE__ */ new Map();
	for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) {
		const src = spots.cell.get(`${x},${y}`);
		const dst = spots.cell.get(`${x + dx},${y + dy}`);
		if (!src || !dst || src === dst) continue;
		cellMove.set(src, dst);
	}
	if (!cellMove.has(anchor)) return null;
	const planned = /* @__PURE__ */ new Map();
	for (const [src, dst] of cellMove) {
		const id = occ.get(src);
		if (id) planned.set(id, dst);
	}
	for (const id of selected) {
		const src = pos(id);
		const dst = cellMove.get(src);
		if (!dst || occ.get(src) === id) continue;
		if (occ.has(src)) continue;
		if (dst === id) delete next[id];
		else next[id] = dst;
	}
	const origins = new Set(cellMove.keys());
	const dests = new Set(cellMove.values());
	planned.forEach((dest, id) => {
		if (dest === id) delete next[id];
		else next[id] = dest;
	});
	const vacated = [...origins].filter((code) => !dests.has(code));
	const vacatedSet = new Set(vacated);
	const usedLanding = /* @__PURE__ */ new Set();
	for (const code of dests) {
		const id = occ.get(code);
		if (!id || planned.has(id)) continue;
		const spot = spots.at.get(code);
		if (!spot) continue;
		let x = spot.x;
		let y = spot.y;
		let landing = "";
		for (let guard = 0; guard < 80; guard++) {
			x -= dx;
			y -= dy;
			const cell = spots.cell.get(`${x},${y}`);
			if (!cell) break;
			const open = !usedLanding.has(cell) && (vacatedSet.has(cell) || !occ.has(cell));
			if (!dests.has(cell) && open) {
				landing = cell;
				break;
			}
		}
		if (!landing) landing = vacated.find((item) => !usedLanding.has(item)) ?? "";
		if (!landing) continue;
		usedLanding.add(landing);
		if (landing === id) delete next[id];
		else next[id] = landing;
	}
	return sameMoves(cur, next) ? null : next;
}
function LocColumns({ side, unit }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid items-center gap-1 rounded-sm bg-header px-1 py-1 text-[9px] font-bold text-on-dark " + (side === "left" ? "grid-cols-[36px_minmax(0,1fr)_56px]" : "grid-cols-[56px_minmax(0,1fr)_36px]"),
		children: (side === "left" ? [
			"로케이션",
			"점포명",
			unit
		] : [
			unit,
			"점포명",
			"로케이션"
		]).map((label, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "whitespace-nowrap text-center leading-none",
			children: label
		}, index))
	});
}
function LocationView({ jobs: all, loaded, masters, storeCodes, bandMasters }) {
	const [center, setCenter] = (0, import_react.useState)("1센터");
	const jobCenter = center.startsWith("2센터") ? "2센터" : center;
	const placeBand = center === "2센터FF1" ? "FF1" : center === "2센터FF2" ? "FF2" : "";
	const [dpt, setDpt] = (0, import_react.useState)("전체");
	const [route, setRoute] = (0, import_react.useState)("전체");
	const [measure, setMeasure] = (0, import_react.useState)("작업수량");
	const [routeEdits, setRouteEdits] = (0, import_react.useState)({});
	const [checkedByCenter, setCheckedByCenter] = (0, import_react.useState)({});
	const [histByCenter, setHistByCenter] = (0, import_react.useState)({});
	const [pickedByCenter, setPickedByCenter] = (0, import_react.useState)({});
	const [anchorByCenter, setAnchorByCenter] = (0, import_react.useState)({});
	const [trayHot, setTrayHot] = (0, import_react.useState)(false);
	const boardRef = (0, import_react.useRef)(null);
	const barRef = (0, import_react.useRef)(null);
	const yRef = (0, import_react.useRef)(null);
	const [boardScrollHeight, setBoardScrollHeight] = (0, import_react.useState)(0);
	const syncing = (0, import_react.useRef)(false);
	const areaRef = (0, import_react.useRef)(null);
	const bandOrigin = (0, import_react.useRef)(null);
	const bandBox = (0, import_react.useRef)(null);
	const skipClick = (0, import_react.useRef)(false);
	const pan = (0, import_react.useRef)(null);
	const [panning, setPanning] = (0, import_react.useState)(false);
	const [band, setBand] = (0, import_react.useState)(null);
	const [layoutRev, setLayoutRev] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => subscribeLayouts(() => setLayoutRev((value) => value + 1)), []);
	const baseJobs = (0, import_react.useMemo)(() => jobsOf(all, jobCenter, dpt), [
		all,
		jobCenter,
		dpt
	]);
	const routeOptions = (0, import_react.useMemo)(() => {
		const found = /* @__PURE__ */ new Set();
		for (const job of baseJobs) {
			const bucket = Xn(job.route);
			if (bucket) found.add(bucket);
		}
		for (const value of Object.values(routeEdits[center] ?? {})) {
			const bucket = Xn(value.replace(/\D/g, ""));
			if (bucket) found.add(bucket);
		}
		return [...found].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b, "ko"));
	}, [
		baseJobs,
		routeEdits,
		center
	]);
	const jobs = (0, import_react.useMemo)(() => route === "전체" ? baseJobs : baseJobs.filter((job) => Xn(job.route) === route), [baseJobs, route]);
	const placeMaster = placeBand ? bandMasters["2센터"]?.[placeBand]?.places || masters["2센터"] : masters[jobCenter];
	const placeCodes = placeBand ? bandMasters["2센터"]?.[placeBand]?.codes || storeCodes["2센터"] : storeCodes[jobCenter];
	const fileHits = (0, import_react.useMemo)(() => Rn(baseJobs, placeMaster, measure), [
		baseJobs,
		placeMaster,
		measure
	]);
	const hits = (0, import_react.useMemo)(() => {
		const edits = routeEdits[center] ?? {};
		const paint = (code, hit) => {
			if (hit.route) return hit;
			const digits = (edits[code] ?? "").replace(/\D/g, "");
			if (!digits) return hit;
			return {
				...hit,
				route: Xn(digits) || digits
			};
		};
		const visible = Rn(jobs, route === "전체" ? placeMaster : void 0, measure);
		const next = new Map(visible);
		for (const [code, hit] of next) next.set(code, paint(code, hit));
		if (route !== "전체") for (const [code, hit] of fileHits) {
			if (next.has(code) || hit.route) continue;
			const painted = paint(code, hit);
			if (painted.route === route) next.set(code, painted);
		}
		return next;
	}, [
		jobs,
		route,
		masters,
		placeMaster,
		center,
		measure,
		fileHits,
		routeEdits
	]);
	function editRoute(home, value, commit) {
		const digits = value.replace(/\D/g, "").slice(0, 4);
		const next = commit ? digits ? Xn(digits) || digits : "" : digits;
		setRouteEdits((prev) => ({
			...prev,
			[center]: {
				...prev[center] ?? {},
				[home]: next
			}
		}));
	}
	const moves = histByCenter[center]?.past.at(-1) ?? {};
	const picked = new Set(pickedByCenter[center] ?? []);
	function cellSelected(code, home) {
		if (home && picked.has(home)) return true;
		for (const id of picked) {
			if (!isCellPick(id)) continue;
			if (pickPos(id, moves) === code) return true;
		}
		return false;
	}
	function chooseStore(storeId, shift) {
		const current = pickedByCenter[center] ?? [];
		if (!shift) {
			if (current.length === 1 && current[0] === storeId) {
				setPickedByCenter((prev) => ({
					...prev,
					[center]: []
				}));
				setAnchorByCenter((prev) => ({
					...prev,
					[center]: ""
				}));
				return;
			}
			setPickedByCenter((prev) => ({
				...prev,
				[center]: [storeId]
			}));
			setAnchorByCenter((prev) => ({
				...prev,
				[center]: storeId
			}));
			return;
		}
		const anchor = anchorByCenter[center] || current[0];
		if (!anchor) {
			setPickedByCenter((prev) => ({
				...prev,
				[center]: [storeId]
			}));
			setAnchorByCenter((prev) => ({
				...prev,
				[center]: storeId
			}));
			return;
		}
		const spots = layoutSpots(layoutFor(jobCenter));
		const where = (id) => pickPos(id, moves);
		const from = spots.at.get(where(anchor));
		const to = spots.at.get(where(storeId));
		if (!from || !to) {
			setPickedByCenter((prev) => ({
				...prev,
				[center]: [storeId]
			}));
			setAnchorByCenter((prev) => ({
				...prev,
				[center]: storeId
			}));
			return;
		}
		const x1 = Math.min(from.x, to.x);
		const x2 = Math.max(from.x, to.x);
		const y1 = Math.min(from.y, to.y);
		const y2 = Math.max(from.y, to.y);
		const ids = [];
		const occ = /* @__PURE__ */ new Map();
		for (const home of hits.keys()) {
			const at = where(home);
			if (at !== "tray") occ.set(at, home);
		}
		for (let x = x1; x <= x2; x++) for (let y = y1; y <= y2; y++) {
			const code = spots.cell.get(`${x},${y}`);
			if (!code) continue;
			ids.push(occ.get(code) ?? `cell:${code}`);
		}
		setPickedByCenter((prev) => ({
			...prev,
			[center]: ids
		}));
	}
	function clearPicked() {
		setPickedByCenter((prev) => prev[center]?.length ? {
			...prev,
			[center]: []
		} : prev);
		setAnchorByCenter((prev) => ({
			...prev,
			[center]: ""
		}));
	}
	function startBand(event) {
		if (!event.shiftKey || event.button !== 0) return;
		if (event.target.closest("button, select, input, a, label, [data-line-filter]")) return;
		bandOrigin.current = {
			x: event.clientX,
			y: event.clientY
		};
		bandBox.current = null;
	}
	function moveBand(event) {
		const origin = bandOrigin.current;
		if (!origin) return;
		const w = Math.abs(event.clientX - origin.x);
		const h = Math.abs(event.clientY - origin.y);
		if (!bandBox.current && w < 6 && h < 6) return;
		if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
		window.getSelection()?.removeAllRanges();
		const next = {
			x: Math.min(origin.x, event.clientX),
			y: Math.min(origin.y, event.clientY),
			w,
			h
		};
		bandBox.current = next;
		setBand(next);
	}
	function endBand() {
		const box = bandBox.current;
		bandOrigin.current = null;
		bandBox.current = null;
		setBand(null);
		if (!box || box.w < 6 && box.h < 6) return;
		const ids = [];
		areaRef.current?.querySelectorAll("[data-cell]").forEach((node) => {
			const rect = node.getBoundingClientRect();
			const hit = rect.left < box.x + box.w && rect.right > box.x && rect.top < box.y + box.h && rect.bottom > box.y;
			const id = node.dataset.home || (node.dataset.cell ? `cell:${node.dataset.cell}` : "");
			if (hit && id) ids.push(id);
		});
		if (ids.length === 0) return;
		skipClick.current = true;
		window.setTimeout(() => {
			skipClick.current = false;
		}, 0);
		setPickedByCenter((prev) => {
			const cur = new Set(prev[center] ?? []);
			for (const id of ids) cur.add(id);
			return {
				...prev,
				[center]: [...cur]
			};
		});
	}
	function startPan(event) {
		if (event.button !== 0 || event.shiftKey) return;
		if (event.target.closest("button, select, input, a, label, [data-store], [data-cell]")) return;
		const board = boardRef.current;
		if (!board) return;
		pan.current = {
			x: event.clientX,
			y: event.clientY,
			left: board.scrollLeft,
			top: board.scrollTop,
			moved: false
		};
	}
	function movePan(event) {
		const start = pan.current;
		const board = boardRef.current;
		if (!start || !board) return;
		const dx = event.clientX - start.x;
		const dy = event.clientY - start.y;
		if (!start.moved && Math.hypot(dx, dy) < 4) return;
		if (!start.moved) {
			start.moved = true;
			setPanning(true);
		}
		if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
		board.scrollLeft = start.left - dx;
		board.scrollTop = start.top - dy;
		move("board");
	}
	function endPan(event) {
		if (pan.current?.moved) {
			skipClick.current = true;
			window.setTimeout(() => {
				skipClick.current = false;
			}, 0);
		}
		pan.current = null;
		setPanning(false);
		if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
	}
	const placed = (0, import_react.useMemo)(() => {
		const at = /* @__PURE__ */ new Map();
		const tray = [];
		for (const [home, hit] of hits) {
			const dest = moves[home] ?? home;
			if (dest === "tray") tray.push({
				hit,
				home
			});
			else at.set(dest, {
				hit,
				home
			});
		}
		tray.sort((a, b) => a.home.localeCompare(b.home));
		return {
			at,
			tray
		};
	}, [hits, moves]);
	const layout = (0, import_react.useMemo)(() => layoutFor(jobCenter), [
		jobCenter,
		layoutRev,
		Nn()
	]);
	const checkedLines = checkedByCenter[center] ?? layout.map((item) => item.line);
	const lines = layout.filter((item) => checkedLines.includes(item.line));
	const oneLine = lines.length === 1;
	function pickLine(lineNo, shift) {
		setCheckedByCenter((prev) => {
			const all = layout.map((row) => row.line);
			const current = prev[center] ?? all;
			if (shift) {
				const next = current.includes(lineNo) ? current.filter((n) => n !== lineNo) : [...current, lineNo].sort((a, b) => a - b);
				return {
					...prev,
					[center]: next
				};
			}
			const onlyThis = current.length === 1 && current[0] === lineNo;
			return {
				...prev,
				[center]: onlyThis ? all : [lineNo]
			};
		});
	}
	const shown = (0, import_react.useMemo)(() => {
		let count = 0;
		let places = 0;
		let slots = 0;
		for (const item of lines) for (const slot of [...item.left, ...item.right]) {
			if (slot.kind !== "loc") continue;
			slots += 1;
			const hit = placed.at.get(slot.code)?.hit;
			if (!hit) continue;
			places += 1;
			count += hit.count;
		}
		return {
			count,
			places,
			slots
		};
	}, [placed, lines]);
	async function downloadLocation() {
		const ranked = /* @__PURE__ */ new Map();
		for (const job of all[jobCenter] ?? []) {
			const home = Ln(job.location);
			if (!home) continue;
			const key = `${job.storeCd || ""}\t${job.storeNm || job.storeCd || ""}`;
			const box = ranked.get(home) ?? /* @__PURE__ */ new Map();
			const add = measure === "건수" ? 1 : job.orderQty || 0;
			box.set(key, (box.get(key) ?? 0) + add);
			ranked.set(home, box);
		}
		const topStore = (home) => {
			const box = ranked.get(home);
			if (!box) return null;
			let bestKey = "";
			let bestQty = -1;
			for (const [key, qty] of box) if (qty > bestQty) {
				bestKey = key;
				bestQty = qty;
			}
			const [code, name] = bestKey.split("	");
			return {
				code,
				name
			};
		};
		const slots = [];
		for (const item of layout) for (const slot of [...item.left, ...item.right]) if (slot.kind === "loc") slots.push(slot.code);
		slots.sort((a, b) => {
			const na = Number(a);
			const nb = Number(b);
			const aisle = (n) => {
				const line = Math.floor(n / 100);
				return n % 100 >= 50 ? line * 2 : line * 2 - 1;
			};
			return Math.floor(na / 100) - Math.floor(nb / 100) || aisle(na) - aisle(nb) || na - nb;
		});
		const rows = [[
			"블록",
			"통로",
			"로케이션코드",
			"점포코드",
			"점포명"
		]];
		const changed = /* @__PURE__ */ new Set();
		for (const [home, dest] of Object.entries(moves)) {
			if (!dest || dest === home) continue;
			changed.add(home);
			if (dest !== "tray") changed.add(dest);
		}
		const rowColor = /* @__PURE__ */ new Map();
		for (const code of slots) {
			const n = Number(code);
			const line = Math.floor(n / 100);
			const aisle = n % 100 >= 50 ? line * 2 : line * 2 - 1;
			const found = placed.at.get(code);
			const top = found ? topStore(found.home) : null;
			const storeCode = top?.code || placeCodes?.[found?.home ?? ""] || "";
			const storeName = top?.name || found?.hit.store || "";
			if (changed.has(code) || found && found.home !== code) rowColor.set(rows.length + 1, found?.hit?.route ? routeRgb(found.hit.route) : "FFE08A");
			rows.push([
				line,
				aisle,
				code,
				storeCode,
				storeName
			]);
		}
		const xlsx = await import("../_libs/xlsx.mjs").then((n) => n.t);
		const { unzipSync, zipSync, strFromU8, strToU8 } = await import("../_libs/fflate.mjs").then((n) => n.t);
		const book = xlsx.utils.book_new();
		const grid = xlsx.utils.aoa_to_sheet(rows);
		grid["!cols"] = [
			{ wch: 8 },
			{ wch: 8 },
			{ wch: 14 },
			{ wch: 12 },
			{ wch: 24 }
		];
		xlsx.utils.book_append_sheet(book, grid, "Sheet1");
		const packed = unzipSync(new Uint8Array(xlsx.write(book, {
			bookType: "xlsx",
			type: "array"
		})));
		if (rowColor.size > 0) {
			const palette = [];
			const styleOf = /* @__PURE__ */ new Map();
			for (const rgb of rowColor.values()) if (!styleOf.has(rgb)) {
				palette.push(rgb);
				styleOf.set(rgb, palette.length);
			}
			let styles = strFromU8(packed["xl/styles.xml"]);
			styles = styles.replace("<fills count=\"2\">", `<fills count="${2 + palette.length}">`).replace("</fills>", palette.map((rgb) => `<fill><patternFill patternType="solid"><fgColor rgb="FF${rgb}"/></patternFill></fill>`).join("") + "</fills>").replace("<cellXfs count=\"1\">", `<cellXfs count="${1 + palette.length}">`).replace("</cellXfs>", palette.map((_, index) => `<xf numFmtId="0" fontId="0" fillId="${index + 2}" borderId="0" xfId="0" applyFill="1"/>`).join("") + "</cellXfs>");
			let sheet = strFromU8(packed["xl/worksheets/sheet1.xml"]);
			sheet = sheet.replace(/<row r="(\d+)">([\s\S]*?)<\/row>/g, (full, rowNo, inner) => {
				const rgb = rowColor.get(Number(rowNo));
				if (!rgb) return full;
				return `<row r="${rowNo}">${inner.replace(/<c /g, `<c s="${styleOf.get(rgb)}" `)}</row>`;
			});
			packed["xl/styles.xml"] = strToU8(styles);
			packed["xl/worksheets/sheet1.xml"] = strToU8(sheet);
		}
		const out = zipSync(packed);
		const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = `${center}-배치표.xlsx`;
		link.click();
		URL.revokeObjectURL(link.href);
	}
	const scales = (0, import_react.useMemo)(() => {
		const out = {};
		for (const item of lines) {
			let min = Number.POSITIVE_INFINITY;
			let max = 0;
			for (const slot of [...item.left, ...item.right]) {
				if (slot.kind !== "loc") continue;
				const qty = placed.at.get(slot.code)?.hit?.count ?? 0;
				if (qty <= 0) continue;
				if (qty < min) min = qty;
				if (qty > max) max = qty;
			}
			out[item.line] = {
				min: Number.isFinite(min) ? min : 0,
				max
			};
		}
		return out;
	}, [placed, lines]);
	const card = oneLine ? 720 : 600;
	const boardWidth = lines.length * card + Math.max(0, lines.length - 1) * 12;
	function move(from) {
		const bar = barRef.current;
		const board = boardRef.current;
		const y = yRef.current;
		if (!board || syncing.current) return;
		syncing.current = true;
		if (from === "bar" && bar) board.scrollLeft = bar.scrollLeft;
		else if (from === "y" && y) board.scrollTop = y.scrollTop;
		else {
			if (bar) bar.scrollLeft = board.scrollLeft;
			if (y) y.scrollTop = board.scrollTop;
		}
		syncing.current = false;
	}
	(0, import_react.useEffect)(() => {
		const board = boardRef.current;
		if (!board) return;
		const update = () => setBoardScrollHeight(board.scrollHeight);
		update();
		const observer = new ResizeObserver(update);
		observer.observe(board);
		for (const child of board.children) observer.observe(child);
		return () => observer.disconnect();
	}, [
		lines,
		loaded,
		oneLine,
		placed
	]);
	function place(storeId, target) {
		const spots = layoutSpots(layoutFor(jobCenter));
		const next = shiftedMoves(hits.keys(), moves, storeId, target, picked, spots);
		if (!next) return;
		const cleaned = {};
		for (const [key, value] of Object.entries(next)) if (!isCellPick(key)) cleaned[key] = value;
		setPickedByCenter((prev) => {
			const mapped = (prev[center] ?? []).map((id) => {
				if (!isCellPick(id)) return id;
				const dest = next[id];
				return dest && dest !== "tray" ? `cell:${dest}` : id;
			});
			return {
				...prev,
				[center]: [...new Set(mapped)]
			};
		});
		setHistByCenter((prev) => {
			const past = [...(prev[center] ?? {
				past: [{}],
				future: []
			}).past, cleaned];
			if (past.length > 80) past.shift();
			return {
				...prev,
				[center]: {
					past,
					future: []
				}
			};
		});
	}
	(0, import_react.useEffect)(() => {
		function onKey(event) {
			if (!(event.ctrlKey || event.metaKey)) return;
			const key = event.key.toLowerCase();
			if (key !== "z" && key !== "y") return;
			const el = event.target;
			if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
			event.preventDefault();
			const redo = key === "y" || key === "z" && event.shiftKey;
			setHistByCenter((prev) => {
				const hist = prev[center] ?? {
					past: [{}],
					future: []
				};
				if (redo) {
					if (hist.future.length === 0) return prev;
					const [head, ...rest] = hist.future;
					return {
						...prev,
						[center]: {
							past: [...hist.past, head],
							future: rest
						}
					};
				}
				if (hist.past.length <= 1) return prev;
				const current = hist.past[hist.past.length - 1];
				return {
					...prev,
					[center]: {
						past: hist.past.slice(0, -1),
						future: [current, ...hist.future]
					}
				};
			});
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [center]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: areaRef,
		className: "flex h-full min-h-0 select-none flex-col overflow-hidden",
		onPointerDown: startBand,
		onPointerMove: moveBand,
		onPointerUp: endBand,
		onPointerCancel: endBand,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-40 flex shrink-0 flex-wrap items-center gap-2 border-b border-black/5 bg-[#f2f2f7] px-3 py-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
						label: "센터",
						value: center,
						onChange: setCenter,
						options: Mn().flatMap((id) => Nn() === "포천" && id === "2센터" ? [{
							id: "2센터FF2",
							label: "2센터(FF2)"
						}, {
							id: "2센터FF1",
							label: "2센터(FF1)"
						}] : [{
							id,
							label: id
						}])
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
						label: "DPT",
						value: dpt,
						onChange: setDpt,
						options: In.map((item) => ({
							id: item.id,
							label: item.label
						}))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
						label: "루트",
						value: routeOptions.includes(route) ? route : "전체",
						onChange: setRoute,
						options: [{
							id: "전체",
							label: "전체"
						}, ...routeOptions.map((item) => ({
							id: item,
							label: item
						}))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
						label: "표시",
						value: measure,
						onChange: setMeasure,
						options: [{
							id: "건수",
							label: "건수"
						}, {
							id: "작업수량",
							label: "작업수량"
						}]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
						label: "라인",
						text: layout.every((item) => checkedLines.includes(item.line)) ? "전체" : checkedLines.filter((n) => layout.some((item) => item.line === n)).length === 0 ? "선택 없음" : checkedLines.filter((n) => layout.some((item) => item.line === n)).sort((a, b) => a - b).map((n) => `${n}라인`).join(", "),
						rows: [{
							id: "전체",
							label: "전체",
							checked: layout.every((item) => checkedLines.includes(item.line))
						}, ...layout.map((item) => ({
							id: String(item.line),
							label: Pn[item.line - 1].replace(/^\S+\s/, ""),
							checked: checkedLines.includes(item.line),
							swatch: LINE_TONE[item.line - 1]
						}))],
						onToggle: (id) => {
							if (id === "전체") {
								const allOn = layout.every((item) => checkedLines.includes(item.line));
								setCheckedByCenter((prev) => ({
									...prev,
									[center]: allOn ? [] : layout.map((item) => item.line)
								}));
								return;
							}
							const line = Number(id);
							setCheckedByCenter((prev) => {
								const current = prev[center] ?? layout.map((row) => row.line);
								const next = current.includes(line) ? current.filter((n) => n !== line) : [...current, line].sort((a, b) => a - b);
								return {
									...prev,
									[center]: next
								};
							});
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-10 rounded-xl bg-[#8e8e93] px-3 text-sm font-semibold text-white disabled:opacity-40",
						disabled: Object.keys(moves).length === 0,
						onClick: () => setHistByCenter((prev) => {
							const past = [...(prev[center] ?? {
								past: [{}],
								future: []
							}).past, {}];
							if (past.length > 80) past.shift();
							return {
								...prev,
								[center]: {
									past,
									future: []
								}
							};
						}),
						children: "점포 원위치"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "h-10 rounded-xl bg-[#af52de] px-3 text-sm font-semibold text-white disabled:opacity-40",
						disabled: picked.size === 0,
						onClick: () => {
							const ids = [...picked];
							if (ids.length === 0) return;
							place(ids[0], "tray");
						},
						children: ["선택 점포 빼기", picked.size > 0 ? ` ${picked.size}` : ""]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-7 rounded-full bg-[#007aff] px-3 text-xs font-semibold text-white",
						onClick: () => {
							downloadLocation();
						},
						children: "엑셀"
					}),
					loaded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex min-w-0 flex-1 justify-center px-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap justify-center gap-1",
							children: layout.map((item) => {
								let count = 0;
								for (const slot of [...item.left, ...item.right]) {
									if (slot.kind !== "loc") continue;
									count += placed.at.get(slot.code)?.hit.count ?? 0;
								}
								const on = checkedLines.includes(item.line);
								const narrowed = !layout.every((row) => checkedLines.includes(row.line));
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: (event) => pickLine(item.line, event.shiftKey),
									className: "inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-semibold tabular-nums " + LINE_TONE[item.line - 1] + (item.line === 3 ? " text-ink" : " text-white") + (narrowed && !on ? " opacity-35" : "") + (narrowed && on ? " ring-2 ring-[#1c1c1e]" : ""),
									title: "클릭하면 이 라인만 봅니다. Shift를 누른 채 클릭하면 여러 라인을 고릅니다.",
									children: [
										item.line,
										"라인",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: nf.format(count) })
									]
								}, item.line);
							})
						})
					}) : null,
					loaded ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex h-7 items-center gap-2 rounded-full bg-white px-2.5 text-[11px] font-semibold text-muted shadow-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["총 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
								className: "tabular-nums text-ink",
								children: nf.format(shown.slots)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["점포 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
								className: "tabular-nums text-[#007aff]",
								children: nf.format(shown.places)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "적음" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "h-1.5 w-14 rounded-full",
								style: { background: "linear-gradient(90deg, #63be7b, #ffeb84, #f8696b)" }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "많음" })
						]
					}) : null
				]
			}),
			placeMaster && Object.keys(placeMaster).length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "shrink-0 truncate px-2 py-0.5 text-[11px] text-muted",
				children: [
					placeBand ? `2센터 ${placeBand} 배치 ` : "이 센터 배치 ",
					nf.format(Object.keys(placeMaster).length),
					"곳. 발주가 없는 점포는 ",
					measure,
					" 0입니다. 루트를 고르면 그 루트 점포만 봅니다."
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-3 mt-3 shrink-0 rounded-md border border-dashed px-3 py-2 " + (trayHot ? "border-title bg-ice" : "border-grid bg-paper"),
				onDragOver: (event) => {
					event.preventDefault();
					setTrayHot(true);
				},
				onDragLeave: () => setTrayHot(false),
				onDrop: (event) => {
					event.preventDefault();
					setTrayHot(false);
					const id = event.dataTransfer.getData("text/plain");
					if (id) place(id, "tray");
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-1 text-sm font-bold",
					children: ["임시 배치 ", placed.tray.length > 0 ? `${placed.tray.length}곳 · ${measure} ${nf.format(placed.tray.reduce((sum, item) => sum + item.hit.count, 0))}` : ""]
				}), placed.tray.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted",
					children: [
						"점포만 끌어다 여기에 빼 둘 수 있습니다. 로케이션 번호는 움직이지 않고, 빼 둔 ",
						measure,
						"는 라인 합계에서 빠집니다."
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1",
					children: placed.tray.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						draggable: true,
						"data-store": item.home,
						onPointerDown: (event) => {
							event.currentTarget.draggable = !event.shiftKey;
						},
						onDragStart: (event) => {
							if (event.shiftKey) {
								event.preventDefault();
								return;
							}
							event.dataTransfer.setData("text/plain", item.home);
							event.dataTransfer.effectAllowed = "move";
						},
						className: "inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs font-bold text-ink " + (picked.has(item.home) ? "ring-2 ring-mark " : ""),
						style: { background: item.hit.route ? routeTone(item.hit.route) : "#eef2f5" },
						title: `원래 로케이션 ${item.home}. 점포를 클릭한 뒤 Shift를 누른 채 다른 점포를 클릭하면 그 사이가 선택됩니다.`,
						onClick: (event) => {
							if (skipClick.current) return;
							chooseStore(item.home, event.shiftKey);
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.hit.store }),
							!fileHits.get(item.home)?.route ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouteEntry, {
								value: routeEdits[center]?.[item.home] ?? "",
								onChange: (value, commit) => editRoute(item.home, value, commit)
							}) : item.hit.route ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums",
								children: item.hit.route
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums",
								children: nf.format(item.hit.count)
							})
						]
					}, item.home))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-1 flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					ref: barRef,
					className: "loc-bar sticky top-0 z-10 shrink-0 overflow-x-scroll bg-paper px-3",
					onScroll: () => move("bar"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
						width: boardWidth,
						height: 1
					} })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-h-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						ref: boardRef,
						className: "loc-board min-h-0 min-w-0 flex-1 overflow-auto bg-bg px-3 py-3 " + (panning ? "cursor-grabbing" : "cursor-grab"),
						onScroll: () => move("board"),
						onPointerDown: startPan,
						onPointerMove: movePan,
						onPointerUp: endPan,
						onPointerCancel: endPan,
						children: [lines.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-2 py-6 text-sm font-bold text-muted",
							children: "볼 라인을 체크해 주세요."
						}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-3",
							style: { width: boardWidth },
							children: lines.map((item) => {
								let lineCount = 0;
								for (const slot of [...item.left, ...item.right]) {
									if (slot.kind !== "loc") continue;
									lineCount += placed.at.get(slot.code)?.hit.count ?? 0;
								}
								const bar = "px-2 py-1.5 text-center text-sm font-bold " + LINE_TONE[item.line - 1] + (item.line === 3 ? " text-ink" : " text-on-dark");
								const tone = scales[item.line] ?? {
									min: 0,
									max: 0
								};
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									className: "shrink-0 overflow-hidden rounded-md border border-grid bg-paper shadow-sm " + (oneLine ? "w-[720px]" : "w-[600px]"),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
											className: bar,
											children: [Pn[item.line - 1], /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ml-2 tabular-nums",
												children: nf.format(lineCount)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid min-w-0 grid-cols-[minmax(0,1fr)_10px_minmax(0,1fr)] gap-1 p-1.5",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid min-w-0 content-start gap-0.5 overflow-hidden",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocColumns, {
															side: "left",
															unit: measure
														}),
														drawnSlots(item.left).map((drawn) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocationCell, {
															slot: drawn.span > 1 ? {
																...drawn.slot,
																span: drawn.span
															} : drawn.slot,
															side: "left",
															big: oneLine,
															min: tone.min,
															max: tone.max,
															unit: measure,
															routeDraft: drawn.slot.kind === "loc" ? routeEdits[center]?.[placed.at.get(drawn.slot.code)?.home ?? ""] ?? "" : "",
															onRoute: drawn.slot.kind === "loc" && placed.at.get(drawn.slot.code)?.home && !fileHits.get(placed.at.get(drawn.slot.code)?.home ?? "")?.route ? (value, commit) => editRoute(placed.at.get(drawn.slot.code)?.home ?? "", value, commit) : void 0,
															home: drawn.slot.kind === "loc" ? placed.at.get(drawn.slot.code)?.home : void 0,
															hit: drawn.slot.kind === "loc" ? placed.at.get(drawn.slot.code)?.hit : void 0,
															selected: drawn.slot.kind === "loc" && cellSelected(drawn.slot.code, placed.at.get(drawn.slot.code)?.home),
															onToggle: chooseStore,
															onPlace: place,
															onClear: clearPicked,
															skipClick
														}, `L${drawn.index}`)),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocColumns, {
															side: "left",
															unit: measure
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "loc-aisle rounded-sm" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid min-w-0 content-start gap-0.5 overflow-hidden",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocColumns, {
															side: "right",
															unit: measure
														}),
														drawnSlots(item.right).map((drawn) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocationCell, {
															slot: drawn.span > 1 ? {
																...drawn.slot,
																span: drawn.span
															} : drawn.slot,
															side: "right",
															big: oneLine,
															min: tone.min,
															max: tone.max,
															unit: measure,
															routeDraft: drawn.slot.kind === "loc" ? routeEdits[center]?.[placed.at.get(drawn.slot.code)?.home ?? ""] ?? "" : "",
															onRoute: drawn.slot.kind === "loc" && placed.at.get(drawn.slot.code)?.home && !fileHits.get(placed.at.get(drawn.slot.code)?.home ?? "")?.route ? (value, commit) => editRoute(placed.at.get(drawn.slot.code)?.home ?? "", value, commit) : void 0,
															home: drawn.slot.kind === "loc" ? placed.at.get(drawn.slot.code)?.home : void 0,
															hit: drawn.slot.kind === "loc" ? placed.at.get(drawn.slot.code)?.hit : void 0,
															selected: drawn.slot.kind === "loc" && cellSelected(drawn.slot.code, placed.at.get(drawn.slot.code)?.home),
															onToggle: chooseStore,
															onPlace: place,
															onClear: clearPicked,
															skipClick
														}, `R${drawn.index}`)),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocColumns, {
															side: "right",
															unit: measure
														})
													]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
											className: bar,
											children: [Pn[item.line - 1], /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ml-2 tabular-nums",
												children: nf.format(lineCount)
											})]
										})
									]
								}, item.line);
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						ref: yRef,
						className: "loc-y shrink-0 bg-paper",
						onScroll: () => move("y"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
							height: boardScrollHeight,
							width: 1
						} })
					})]
				})]
			}),
			band ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none fixed z-30 border-2 border-mark bg-mark/20",
				style: {
					left: band.x,
					top: band.y,
					width: band.w,
					height: band.h
				}
			}) : null
		]
	});
}
function dairyProgress(jobs) {
	const planned = jobs.length;
	let done = 0;
	let dairy = 0;
	let ff = 0;
	for (const job of jobs) {
		if (job.at != null) done += 1;
		if (zn(job.route, "유제 냉장")) dairy += 1;
		else if (zn(job.route, "FF2")) ff += 1;
	}
	return {
		planned,
		current: planned ? done / planned * 100 : 0,
		dairyShare: planned ? dairy / planned * 100 : 0,
		ffShare: planned ? ff / planned * 100 : 0
	};
}
function avgWorkPct(jobs, minutes) {
	const planned = jobs.length;
	if (!planned) return null;
	const rows = or(jobs, minutes, planned);
	if (!rows.length) return null;
	const avg = rows.reduce((sum, row) => sum + row.sliceRate, 0) / rows.length * 100;
	return avg > 0 ? avg : null;
}
function paceTimes(dairyShare, ffShare, current, now, avg30, ff15, manual, fixedDairy = false) {
	const gap = dairyShare - current;
	const clock = new Date(now);
	const minute = clock.getHours() * 60 + clock.getMinutes();
	const extra = minute < 735 ? 60 : minute < 870 ? 30 : minute < 990 ? 15 : 0;
	const dairyDone = gap <= 0;
	const dairyScale = fixedDairy || !(dairyShare > 0) ? 1 : 100 / dairyShare;
	const dairySpan = fixedDairy ? 15 : 30;
	const dairyMin = !dairyDone && avg30 != null && avg30 > 0 ? gap / avg30 * dairySpan * dairyScale : null;
	const dairyClose = dairyMin == null ? null : now + (dairyMin + extra) * 6e4;
	const rest = Math.max(0, 100 - Math.max(dairyShare, current));
	const rate = manual ? 5 : ff15;
	const ffScale = !manual && ffShare > 0 ? 100 / ffShare : 1;
	const ffMin = rest <= 0 ? 0 : rate != null && rate > 0 ? rest / rate * 15 * ffScale : null;
	const finished = current >= 99.95;
	return {
		dairyClose,
		eta: finished ? now : ffMin == null ? null : dairyDone ? now + ffMin * 6e4 : dairyClose == null ? null : dairyClose + ffMin * 6e4,
		finished,
		dairyDone
	};
}
function wallClock(ms) {
	const date = new Date(ms);
	const hour = date.getHours();
	const minute = String(date.getMinutes()).padStart(2, "0");
	return `${hour % 12 || 12}:${minute} ${hour < 12 ? "오전" : "오후"}`;
}
var PACE_TINT = {
	"1센터": "bg-[#007aff]",
	"2센터": "bg-[#ff9500]",
	"3센터": "bg-[#af52de]"
};
var PACE_HEX = {
	"1센터": "#007aff",
	"2센터": "#ff9500",
	"3센터": "#af52de"
};
function paceSnapshot(jobs, now, hand, useFive = false, full = false) {
	const cards = Mn().map((id) => {
		const list = jobs[id] ?? [];
		const stat = dairyProgress(list);
		const typed = hand?.current[id];
		const typedDairy = hand?.dairy?.[id];
		const noFile = stat.planned === 0;
		const current = full ? typed ?? null : typed != null ? typed : stat.current;
		const dairyShare = full ? typedDairy ?? null : stat.dairyShare;
		const empty = full ? current == null || dairyShare == null : noFile;
		const avg = full ? 2.5 : avgWorkPct(list.filter((job) => zn(job.route, "유제 냉장")), 30) ?? (hand && !noFile ? 5 : null);
		const ff15Rate = avgWorkPct(list.filter((job) => zn(job.route, "FF2")), 15);
		const pace = empty ? {
			dairyClose: null,
			eta: null,
			finished: false,
			dairyDone: false
		} : paceTimes(full ? dairyShare : stat.dairyShare, stat.ffShare, current, now, avg, ff15Rate, useFive || hand != null, full);
		const pct = (value) => value == null ? "—" : `${value.toFixed(1)}%`;
		const dairyText = empty ? "—" : pace.dairyDone ? "종료" : pace.dairyClose == null ? "—" : wallClock(pace.dairyClose);
		const etaText = empty ? "—" : pace.finished ? "종료" : pace.eta == null ? "—" : wallClock(pace.eta);
		const cells = [
			{
				label: "총유제%",
				value: full ? dairyShare == null ? "—" : pct(dairyShare) : noFile ? "—" : pct(stat.dairyShare)
			},
			{
				label: "현재%",
				value: full ? current == null ? "—" : pct(current) : noFile && typed == null ? "—" : pct(current)
			},
			{
				label: "유제마감",
				value: dairyText
			},
			{
				label: "예상종료",
				value: etaText
			}
		];
		return {
			id,
			currentValue: noFile && typed == null ? null : current,
			dairyValue: stat.planned ? stat.dairyShare : null,
			avg: full ? "2.5%" : empty || avg == null ? "—" : pct(avg),
			ff15: full || useFive ? "5%가정" : empty || ff15Rate == null ? "—" : pct(ff15Rate),
			cells
		};
	});
	const cols = Mn().map((id) => {
		const list = jobs[id] ?? [];
		const count = Bn(id);
		const lines = Array.from({ length: 8 }, (_, index) => {
			if (index >= count) return null;
			const line = index + 1;
			let planned = 0;
			let done = 0;
			for (const job of list) {
				if (job.line !== line) continue;
				planned += 1;
				if (job.at != null) done += 1;
			}
			const typed = hand?.lines[id]?.[line];
			const pct = full ? typed ?? null : typed != null ? typed : planned ? done / planned * 100 : null;
			const shown = pct == null ? null : Math.round(pct);
			return {
				line,
				pct: shown,
				rate: shown == null ? "—" : `${shown}%`
			};
		});
		const stat = dairyProgress(list);
		const typed = hand?.current[id];
		const typedDairy = hand?.dairy?.[id];
		const noFile = stat.planned === 0;
		const current = full ? typed ?? null : typed != null ? typed : noFile ? null : stat.current;
		const dairyShare = full ? typedDairy ?? null : noFile ? null : stat.dairyShare;
		return {
			id,
			current: current == null ? "현재 —" : `현재 ${current.toFixed(1)}%`,
			dairy: dairyShare == null ? "—" : `${dairyShare.toFixed(1)}%`,
			lines
		};
	});
	const rates = cols.flatMap((col) => col.lines.flatMap((line) => line?.pct == null ? [] : [line.pct]));
	const heat = rates.length ? {
		min: Math.min(...rates),
		max: Math.max(...rates)
	} : null;
	return {
		clock: wallClock(now),
		cards,
		cols,
		heat
	};
}
function fillRound(ctx, x, y, w, h, r, fill) {
	ctx.beginPath();
	ctx.roundRect(x, y, w, h, r);
	ctx.fillStyle = fill;
	ctx.fill();
}
function drawPaceCapture(snap, kind = "calc") {
	const pad = 28;
	const leftW = 640;
	const rightW = 520;
	const width = 1236;
	const height = 520;
	const canvas = document.createElement("canvas");
	const scale = 2;
	canvas.width = width * scale;
	canvas.height = height * scale;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("이미지를 만들지 못했습니다.");
	ctx.scale(scale, scale);
	ctx.fillStyle = "#f2f2f7";
	ctx.fillRect(0, 0, width, height);
	ctx.textBaseline = "middle";
	ctx.font = "600 18px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
	const title = "센터별 예상 작업 종료시간";
	const titleW = ctx.measureText(title).width;
	const pill = snap.clock;
	ctx.font = "600 13px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
	const pillW = ctx.measureText(pill).width + 20;
	let x = pad + (leftW - (titleW + 8 + pillW)) / 2;
	ctx.font = "600 18px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
	ctx.fillStyle = "#1c1c1e";
	ctx.textAlign = "left";
	ctx.fillText(title, x, 44);
	fillRound(ctx, x + titleW + 8, 32, pillW, 24, 12, "#007aff");
	ctx.fillStyle = "#ffffff";
	ctx.font = "600 13px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
	ctx.textAlign = "center";
	ctx.fillText(pill, x + titleW + 8 + pillW / 2, 44);
	snap.cards.forEach((card, index) => {
		const y = 72 + index * 96;
		fillRound(ctx, pad, y, leftW, 88, 16, "#ffffff");
		ctx.beginPath();
		ctx.arc(46, y + 20, 4, 0, Math.PI * 2);
		ctx.fillStyle = PACE_HEX[card.id];
		ctx.fill();
		ctx.fillStyle = "#1c1c1e";
		ctx.font = "600 14px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
		ctx.textAlign = "left";
		ctx.fillText(card.id, 58, y + 20);
		ctx.fillStyle = "#8e8e93";
		ctx.font = "500 12px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
		ctx.textAlign = "right";
		ctx.fillText(`${kind === "full" ? "유제 15분" : "유제 30분"} ${card.avg}   FF2 15분 ${card.ff15}`, 652, y + 20);
		ctx.strokeStyle = "rgba(0,0,0,0.06)";
		ctx.beginPath();
		ctx.moveTo(pad, y + 36);
		ctx.lineTo(668, y + 36);
		ctx.stroke();
		card.cells.forEach((cell, cellIndex) => {
			const col = pad + leftW / 4 * cellIndex + leftW / 8;
			ctx.fillStyle = "#8e8e93";
			ctx.font = "500 11px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
			ctx.textAlign = "center";
			ctx.fillText(cell.label, col, y + 52);
			ctx.fillStyle = "#1c1c1e";
			ctx.font = "600 15px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
			ctx.fillText(cell.value, col, y + 72);
		});
	});
	ctx.fillStyle = "#8e8e93";
	ctx.font = "12px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
	ctx.textAlign = "center";
	ctx.fillText(kind === "full" ? "완전 수기입니다. 유제는 15분에 2.5%, FF2는 15분에 5%로 계산했습니다." : kind === "manual" ? "수기입니다. 예상종료는 15분에 5%입니다." : kind === "five" ? "5%반영입니다. FF2는 15분에 5%로 계산했습니다." : "예상종료는 FF2 15분 평균으로 계산했습니다.", 348, 72 + snap.cards.length * 96 + 8);
	const rx = 688;
	ctx.fillStyle = "#1c1c1e";
	ctx.font = "600 18px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
	ctx.fillText("라인별 작업%", 948, 44);
	const tableY = 68;
	const tableH = 300;
	ctx.save();
	ctx.beginPath();
	ctx.roundRect(rx, tableY, rightW, tableH, 16);
	ctx.clip();
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(rx, tableY, rightW, tableH);
	const colW = rightW / snap.cols.length;
	snap.cols.forEach((col, index) => {
		const cx = rx + colW * index + colW / 2;
		const pw = 64;
		fillRound(ctx, cx - pw / 2, 78, pw, 22, 11, PACE_HEX[col.id]);
		ctx.fillStyle = "#ffffff";
		ctx.font = "600 12px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(col.id, cx, 89);
		ctx.fillStyle = "#8e8e93";
		ctx.font = "600 12px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
		ctx.fillText(col.current, cx, 116);
	});
	ctx.strokeStyle = "rgba(0,0,0,0.06)";
	ctx.beginPath();
	ctx.moveTo(rx, 132);
	ctx.lineTo(1208, 132);
	ctx.stroke();
	for (let line = 0; line < 8; line++) {
		const y = 132 + line * 26 + 13;
		snap.cols.forEach((col, index) => {
			const cell = col.lines[line];
			const left = rx + colW * index;
			const rowY = 132 + line * 26;
			if (cell?.pct != null && snap.heat) {
				ctx.fillStyle = heatColor(snap.heat.max + snap.heat.min - cell.pct, snap.heat.min, snap.heat.max);
				ctx.fillRect(left + colW * .5, rowY, colW * .5 - 1, 26);
			}
			ctx.fillStyle = "#8e8e93";
			ctx.font = "600 12px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
			ctx.textAlign = "center";
			ctx.fillText(cell ? `${cell.line}라인` : "", left + colW * .32, y);
			ctx.fillStyle = "#1c1c1e";
			ctx.font = "600 13px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
			ctx.fillText(cell ? cell.rate : "", left + colW * .72, y);
		});
	}
	ctx.fillStyle = "#f2f2f7";
	ctx.fillRect(rx, 340, rightW, 28);
	snap.cols.forEach((col, index) => {
		const left = rx + colW * index;
		const y = 354;
		ctx.fillStyle = "#8e8e93";
		ctx.font = "600 12px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
		ctx.textAlign = "center";
		ctx.fillText("유제", left + colW * .32, y);
		ctx.fillStyle = "#1c1c1e";
		ctx.fillText(col.dairy, left + colW * .72, y);
	});
	ctx.restore();
	ctx.beginPath();
	ctx.roundRect(rx, tableY, rightW, tableH, 16);
	ctx.strokeStyle = "rgba(0,0,0,0.06)";
	ctx.stroke();
	return canvas;
}
function parsePct(text) {
	if (text == null) return null;
	const clean = text.trim().replace("%", "");
	if (!clean || clean === ".") return null;
	const value = Number(clean);
	if (!Number.isFinite(value)) return null;
	return Math.min(100, Math.max(0, value));
}
function keepPct(text) {
	const clean = text.replace(/[^\d.]/g, "");
	const dot = clean.indexOf(".");
	if (dot < 0) return clean;
	return `${clean.slice(0, dot + 1)}${clean.slice(dot + 1).replace(/\./g, "").slice(0, 1)}`;
}
function seedHand(jobs, now) {
	const snap = paceSnapshot(jobs, now);
	const current = {};
	const lines = {};
	const dairy = {};
	for (const card of snap.cards) {
		current[card.id] = card.currentValue == null ? "" : String(Math.round(card.currentValue * 10) / 10);
		dairy[card.id] = card.dairyValue == null ? "" : String(Math.round(card.dairyValue * 10) / 10);
	}
	for (const col of snap.cols) {
		const row = {};
		for (const line of col.lines) {
			if (!line) continue;
			row[line.line] = line.pct == null ? "" : String(line.pct);
		}
		lines[col.id] = row;
	}
	return {
		ready: true,
		current,
		lines,
		dairy
	};
}
function handNums(hand) {
	const current = {};
	const lines = {};
	const dairy = {};
	for (const id of Mn()) {
		current[id] = parsePct(hand.current[id]);
		dairy[id] = parsePct(hand.dairy?.[id]);
		const row = {};
		for (let line = 1; line <= Bn(id); line++) row[line] = parsePct(hand.lines[id]?.[line]);
		lines[id] = row;
	}
	return {
		current,
		lines,
		dairy
	};
}
var PaceCtx = (0, import_react.createContext)(null);
function usePace() {
	const value = (0, import_react.useContext)(PaceCtx);
	if (!value) throw new Error("pace");
	return value;
}
function readPaceMemory() {
	const embedded = window.__PACE_HAND__;
	if (embedded && typeof embedded === "object") return embedded;
	try {
		const raw = sessionStorage.getItem("center-pace-hand");
		if (!raw) return null;
		const data = JSON.parse(raw);
		return data && typeof data === "object" ? data : null;
	} catch {
		return null;
	}
}
function PaceProvider({ jobs, children }) {
	const saved = readPaceMemory();
	const [now, setNow] = (0, import_react.useState)(() => Date.now());
	const [mode, setMode] = (0, import_react.useState)(saved?.mode === "five" || saved?.mode === "manual" || saved?.mode === "full" ? saved.mode : "calc");
	const [hand, setHand] = (0, import_react.useState)(saved?.hand?.ready ? saved.hand : {
		ready: false,
		current: {},
		lines: {},
		dairy: {}
	});
	const [copyNote, setCopyNote] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		const timer = window.setInterval(() => setNow(Date.now()), 1e3);
		return () => window.clearInterval(timer);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hand.ready) return;
		const payload = JSON.stringify({
			mode,
			hand
		});
		try {
			sessionStorage.setItem("center-pace-hand", payload);
		} catch {}
		try {
			window.chrome?.webview?.postMessage("pace-save:" + payload);
		} catch {}
	}, [mode, hand]);
	const snap = paceSnapshot(jobs, now, (mode === "manual" || mode === "full") && hand.ready ? handNums(hand) : void 0, mode !== "calc", mode === "full");
	const value = (0, import_react.useMemo)(() => ({
		jobs,
		snap,
		mode,
		hand,
		copyNote,
		setMode,
		setHand,
		setCopyNote
	}), [
		jobs,
		snap,
		mode,
		hand,
		copyNote
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaceCtx.Provider, {
		value,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex h-full min-h-0 min-w-0 flex-1",
			children
		})
	});
}
function PaceMode() {
	const { mode, setMode, setHand, hand, jobs } = usePace();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "inline-flex rounded-full bg-black/5 p-0.5",
		children: [
			["calc", "계산"],
			["five", "5%반영"],
			["manual", "수기"],
			["full", "완전 수기"]
		].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "h-7 rounded-full px-3 text-xs font-semibold " + (mode === id ? "bg-white text-ink shadow-sm" : "text-muted"),
			onClick: () => {
				if ((id === "manual" || id === "full") && !hand.ready) setHand(seedHand(jobs, Date.now()));
				setMode(id);
			},
			children: label
		}, id))
	});
}
function PaceBoard() {
	const { snap, mode, hand, setHand, copyNote, setCopyNote } = usePace();
	const ready = Mn().some((id) => snap.cards.find((card) => card.id === id)?.currentValue != null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pace-board flex h-max max-h-full w-max max-w-[48%] shrink-0 flex-col items-center overflow-auto px-2 py-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1 flex max-w-full shrink-0 flex-wrap items-center justify-center gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "px-1 text-[15px] font-semibold tracking-tight text-ink",
						children: "센터별 예상 작업 종료시간"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "inline-flex h-7 items-center rounded-full bg-[#007aff] px-2.5 text-xs font-semibold text-white tabular-nums",
						children: snap.clock
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaceMode, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: !ready && mode === "calc",
						className: "h-7 rounded-full bg-[#007aff] px-3 text-xs font-semibold text-white disabled:opacity-40",
						onClick: () => {
							setCopyNote("만드는 중");
							copyCanvas(drawPaceCapture(snap, mode)).then(() => setCopyNote("복사했습니다. 카톡에 붙여 넣으세요.")).catch((err) => setCopyNote(err instanceof Error ? err.message : "복사에 실패했습니다."));
						},
						children: "캡처 복사"
					}),
					copyNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-semibold text-[#007aff]",
						children: copyNote
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex w-[26rem] max-w-full flex-col gap-2",
				children: snap.cards.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "overflow-hidden rounded-2xl bg-white shadow-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 px-3 py-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-2 w-2 rounded-full ${PACE_TINT[card.id]}` }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[13px] font-semibold",
								children: card.id
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "ml-auto whitespace-nowrap text-[10px] font-medium text-muted",
								children: [
									mode === "full" ? "유제 15분 " : "유제 30분 ",
									card.avg,
									" · FF2 15분 ",
									card.ff15
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-4 border-t border-black/[0.06]",
						children: card.cells.map((cell) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "px-1 py-1.5 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-medium text-muted",
								children: cell.label
							}), mode === "full" && (cell.label === "총유제%" || cell.label === "현재%") || mode === "manual" && cell.label === "현재%" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								inputMode: "decimal",
								"aria-label": `${card.id} ${cell.label}`,
								value: (cell.label === "총유제%" ? hand.dairy?.[card.id] : hand.current[card.id]) ?? "",
								onChange: (event) => {
									const text = keepPct(event.target.value);
									setHand((prev) => cell.label === "총유제%" ? {
										...prev,
										dairy: {
											...prev.dairy,
											[card.id]: text
										}
									} : {
										...prev,
										current: {
											...prev.current,
											[card.id]: text
										}
									});
								},
								className: "w-full border-0 bg-transparent p-0 text-center text-[13px] font-semibold tabular-nums text-ink outline-none"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[13px] font-semibold tabular-nums text-ink",
								children: cell.value
							})]
						}, cell.label))
					})]
				}, card.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-md text-center text-[10px] leading-4 text-muted",
				children: mode === "full" ? "총유제%와 현재%, 라인%를 직접 넣습니다. 유제는 15분에 2.5%, FF2는 15분에 5%로 유제마감과 예상종료를 계산합니다." : mode === "manual" ? "수기 현재%로 계산합니다. 예상종료는 15분에 5%입니다. 라인%를 바꾸면 그 센터 현재%도 평균으로 바뀝니다." : mode === "five" ? "계산 수치입니다. FF2 예상종료만 15분에 5%로 계산합니다." : "유제 30분은 유제·냉장만, FF2 15분은 FF2만의 구간 평균입니다. 유제마감과 예상종료도 그 속도로 계산합니다."
			})
		]
	});
}
function LineBoard() {
	const { snap, mode, hand, setHand } = usePace();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pace-board flex h-max max-h-full w-max max-w-[48%] shrink-0 flex-col items-center overflow-auto px-2 py-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-1 flex max-w-full shrink-0 flex-wrap items-center justify-center gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "px-1 text-[15px] font-semibold tracking-tight text-ink",
				children: "라인별 작업%"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaceMode, {})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "max-h-full max-w-full overflow-auto rounded-2xl bg-white shadow-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-max border-collapse text-center text-[12px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("thead", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: snap.cols.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					colSpan: 2,
					className: "border-b border-black/10 px-2 py-1.5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `inline-flex min-w-16 justify-center rounded-full px-2 py-0.5 text-xs font-semibold text-white ${PACE_TINT[row.id]}`,
						children: row.id
					})
				}, row.id)) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
					className: "text-[11px] text-muted",
					children: snap.cols.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						colSpan: 2,
						className: "border-b border-black/[0.06] px-2 py-1 font-semibold tabular-nums",
						children: row.current
					}, row.id))
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [Array.from({ length: 8 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: snap.cols.map((row) => {
					const line = row.lines[index];
					if (!line) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "border-b border-black/[0.04] px-2 py-0.5",
						children: " "
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "border-b border-r border-black/[0.04] px-2 py-0.5",
						children: " "
					})] }, row.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
						className: "border-b border-black/[0.06] px-2 py-0.5 text-center text-[11px] font-semibold text-muted",
						children: [line.line, "라인"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "border-b border-r border-black/[0.06] px-1 py-0.5 font-semibold tabular-nums",
						style: line.pct != null && snap.heat ? { backgroundColor: heatColor(snap.heat.max + snap.heat.min - line.pct, snap.heat.min, snap.heat.max) } : void 0,
						children: mode === "manual" || mode === "full" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							inputMode: "decimal",
							"aria-label": `${row.id} ${line.line}라인`,
							value: hand.lines[row.id]?.[line.line] ?? "",
							onChange: (event) => {
								const text = keepPct(event.target.value);
								setHand((prev) => {
									const lines = {
										...prev.lines,
										[row.id]: {
											...prev.lines[row.id],
											[line.line]: text
										}
									};
									const nums = [];
									for (let n = 1; n <= Bn(row.id); n++) {
										const value = parsePct(lines[row.id]?.[n]);
										if (value != null) nums.push(value);
									}
									const current = { ...prev.current };
									if (mode === "manual" && nums.length) {
										const avg = nums.reduce((sum, value) => sum + value, 0) / nums.length;
										current[row.id] = String(Math.round(avg * 10) / 10);
									}
									return {
										...prev,
										current,
										lines
									};
								});
							},
							className: "w-10 border-0 bg-transparent p-0 text-center text-[12px] font-semibold tabular-nums text-ink outline-none"
						}) : line.rate
					})] }, row.id);
				}) }, index)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
					className: "bg-[#f2f2f7]",
					children: snap.cols.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-2 py-1 text-center text-[11px] font-semibold text-muted",
						children: "유제"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "border-r border-black/[0.06] px-2 py-1 font-semibold tabular-nums text-ink",
						children: mode === "full" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							inputMode: "decimal",
							"aria-label": `${row.id} 유제`,
							value: hand.dairy?.[row.id] ?? "",
							onChange: (event) => {
								const text = keepPct(event.target.value);
								setHand((prev) => ({
									...prev,
									dairy: {
										...prev.dairy,
										[row.id]: text
									}
								}));
							},
							className: "w-12 border-0 bg-transparent p-0 text-center text-[12px] font-semibold tabular-nums text-ink outline-none"
						}) : row.dairy
					})] }, row.id))
				})] })]
			})
		})]
	});
}
function PaneSplit({ axis, onDrag }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "separator",
		"aria-orientation": axis === "x" ? "vertical" : "horizontal",
		"aria-label": axis === "x" ? "좌우 크기" : "상하 크기",
		className: "group relative z-10 shrink-0 touch-none " + (axis === "x" ? "w-2 cursor-col-resize" : "h-2 cursor-row-resize"),
		onPointerDown: (event) => {
			const parent = event.currentTarget.parentElement;
			if (!parent) return;
			event.preventDefault();
			const rect = parent.getBoundingClientRect();
			const move = (next) => {
				const raw = axis === "x" ? (next.clientX - rect.left) / rect.width * 100 : (next.clientY - rect.top) / rect.height * 100;
				onDrag(Math.min(82, Math.max(18, raw)));
			};
			const stop = () => {
				window.removeEventListener("pointermove", move);
				window.removeEventListener("pointerup", stop);
			};
			window.addEventListener("pointermove", move);
			window.addEventListener("pointerup", stop);
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute rounded-full bg-black/15 transition-colors group-hover:bg-[#007aff] " + (axis === "x" ? "inset-y-3 left-1/2 w-1 -translate-x-1/2" : "inset-x-3 top-1/2 h-1 -translate-y-1/2") })
	});
}
function Summary({ jobs: all, loaded }) {
	const [center, setCenter] = (0, import_react.useState)("1센터");
	const [dpt, setDpt] = (0, import_react.useState)("전체");
	const [view, setView] = (0, import_react.useState)("basic");
	const [copyNote, setCopyNote] = (0, import_react.useState)("");
	const jobs = (0, import_react.useMemo)(() => jobsOf(all, center, dpt), [
		all,
		center,
		dpt
	]);
	const lines = (0, import_react.useMemo)(() => Yn(jobs, Bn(center)), [jobs, center]);
	const forecasts = (0, import_react.useMemo)(() => tr(jobs, Bn(center)), [jobs, center]);
	const cast = (0, import_react.useMemo)(() => nr(forecasts), [forecasts]);
	const whole = (0, import_react.useMemo)(() => qn(center, jobs), [jobs, center]);
	const workDay = fr(whole.first, whole.last);
	const finish = (0, import_react.useMemo)(() => Sr(lines.map((row) => row.last)), [lines]);
	const etaTone = (0, import_react.useMemo)(() => Sr(forecasts.map((row) => row.left > 0 ? row.eta : null)), [forecasts]);
	const wholeAhead = cast.eta != null && cast.snapshot != null ? cast.eta - cast.snapshot : null;
	const showEta = view === "forecast";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col items-center overflow-hidden px-2 py-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1 flex max-w-full shrink-0 flex-wrap items-center justify-center gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "px-1 text-[15px] font-semibold tracking-tight text-ink",
						children: "라인별 생산성"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CenterSelect, {
						value: center,
						onChange: setCenter,
						compact: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DptSelect, {
						value: dpt,
						onChange: setDpt,
						compact: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
						label: "보기",
						value: view,
						compact: true,
						onChange: setView,
						options: [{
							id: "basic",
							label: "기본"
						}, {
							id: "forecast",
							label: "예상"
						}]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "inline-flex h-7 items-center rounded-full bg-white px-2.5 text-xs font-semibold shadow-sm",
						children: workDay.date
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "inline-flex h-7 items-center rounded-full bg-[#007aff] px-2.5 text-xs font-semibold text-white",
						children: workDay.week
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: !loaded,
						className: "h-7 rounded-full bg-title px-3 text-xs font-semibold text-on-dark disabled:opacity-40",
						onClick: () => {
							setCopyNote("만드는 중");
							copyCanvas(drawSummaryCapture(all, dpt, showEta)).then(() => setCopyNote("복사했습니다. 카톡에 붙여 넣으세요.")).catch((err) => setCopyNote(err instanceof Error ? err.message : "복사에 실패했습니다."));
						},
						children: "캡처 복사"
					}),
					copyNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-semibold text-title",
						children: copyNote
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mb-1 shrink-0 text-center text-[12px] text-muted",
				children: ["총 작업시간", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-1.5 text-[17px] font-semibold tabular-nums text-ink",
					children: whole.first == null ? "— ~ —" : `${cr(whole.first)} ~ ${cr(whole.last)}`
				})]
			}),
			!loaded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, {}) : null,
			loaded && jobs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, { text: emptyDpt(dpt) }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-h-full min-h-0 max-w-full overflow-x-auto overflow-y-hidden rounded-2xl bg-white shadow-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-max border-collapse text-center text-[13px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
							className: "sr-only",
							children: "라인별 생산성"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "text-[11px] font-semibold text-muted",
							children: [
								"라인",
								"작업건수",
								"완료",
								"잔여",
								"%",
								"시작",
								"끝",
								"시간",
								"건/hr",
								"순위",
								...showEta ? ["예상종료", "앞으로"] : []
							].map((label) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								scope: "col",
								className: "whitespace-nowrap border-b border-black/10 px-2.5 py-1 text-center font-semibold",
								children: label
							}, label))
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WholeRow, {
							whole,
							center: true,
							forecast: showEta,
							eta: whole.planned === 0 ? "—" : cast.unknown.length > 0 ? "몰라요" : ir(cast.eta, cast.snapshot),
							ahead: whole.planned === 0 ? "—" : cast.left === 0 ? "끝남" : cast.unknown.length > 0 ? "몰라요" : rr(wholeAhead)
						}), lines.map((row, index) => {
							const seen = forecasts[index];
							const etaMs = row.left > 0 ? seen?.eta ?? null : row.last;
							const ahead = row.planned === 0 ? "—" : row.left === 0 ? "끝남" : seen?.eta == null ? "몰라요" : rr(seen.eta - (row.last ?? seen.eta));
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "row",
									className: "border-b border-black/[0.06] px-2.5 py-1 text-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `inline-flex min-w-16 justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${LINE_CLASS[row.line - 1]}`,
										children: Pn[row.line - 1]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
									center: true,
									children: num(row.planned)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
									center: true,
									children: num(row.done)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
									center: true,
									children: num(row.left)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
									center: true,
									children: pf.format(row.rate)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimeCell, {
									center: true,
									ms: row.first
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimeCell, {
									center: true,
									ms: row.last,
									style: { background: finish(row.last) }
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
									center: true,
									children: hrs(row.hours)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
									center: true,
									children: num(row.perHour)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border-b border-black/[0.06] px-2.5 py-1 text-center text-xs font-semibold",
									children: row.rank
								}),
								showEta ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap border-b border-black/[0.06] px-2.5 py-1 text-center tabular-nums",
									style: { background: etaTone(row.left > 0 ? seen?.eta ?? null : null) },
									children: row.planned === 0 ? "—" : ir(etaMs, cast.snapshot)
								}) : null,
								showEta ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap border-b border-black/[0.06] px-2.5 py-1 text-center",
									children: ahead
								}) : null
							] }, row.line);
						})] })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 shrink-0 text-center text-[10px] text-muted",
				children: showEta ? "총 작업시간은 쉬는 시간이 포함된 첫 완료~마지막 완료입니다. 예상종료는 건/hr 기준이고, 센터는 가장 늦은 라인입니다." : "총 작업시간은 쉬는 시간이 포함된 첫 완료~마지막 완료입니다. 순위는 건/hr입니다."
			})
		]
	});
}
function WholeRow({ whole, center = false, forecast = false, eta = "—", ahead = "—" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		className: center ? "bg-[#f2f2f7] font-semibold" : "bg-slate font-bold",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
				scope: "row",
				className: center ? "border-b border-black/[0.06] px-2.5 py-1 text-center" : "whitespace-nowrap border border-grid px-2 py-1.5 text-left",
				children: center ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "inline-flex min-w-16 justify-center rounded-full bg-header px-2 py-0.5 text-xs font-semibold text-on-dark",
					children: "전체"
				}) : "🏭 전체"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
				center,
				children: num(whole.planned)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
				center,
				children: num(whole.done)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
				center,
				children: num(whole.left)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
				center,
				children: pf.format(whole.rate)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimeCell, {
				center,
				ms: whole.first
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimeCell, {
				center,
				ms: whole.last
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
				center,
				children: hrs(whole.hours)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
				center,
				children: num(whole.perHour)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: center ? "border-b border-black/[0.06] px-3 py-2" : "border border-grid px-2 py-1.5" }),
			forecast ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: center ? "whitespace-nowrap border-b border-black/[0.06] px-2.5 py-1 text-center tabular-nums" : "whitespace-nowrap border border-grid px-2 py-1.5 text-center tabular-nums",
				children: eta
			}) : null,
			forecast ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: center ? "whitespace-nowrap border-b border-black/[0.06] px-2.5 py-1 text-center" : "whitespace-nowrap border border-grid px-2 py-1.5 text-center",
				children: ahead
			}) : null
		]
	});
}
function Num({ children, center = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
		className: center ? "whitespace-nowrap border-b border-black/[0.06] px-2.5 py-1 text-center tabular-nums" : "whitespace-nowrap border border-grid px-2 py-1.5 text-right tabular-nums",
		children
	});
}
function TimeCell({ ms, style, center = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
		className: center ? "whitespace-nowrap border-b border-black/[0.06] px-2.5 py-1 text-center tabular-nums" : "whitespace-nowrap border border-grid px-2 py-1.5 text-center tabular-nums",
		style,
		title: lr(ms),
		children: cr(ms)
	});
}
var GAUGE_DAIRY = "#007aff";
var GAUGE_FF2 = "#5ac8fa";
function gaugeJobs(all, dpt, centers) {
	const scoped = jobsForDpt(all, dpt);
	return centers.flatMap((id) => scoped[id] ?? []);
}
function CenterGauge({ label, parts }) {
	const planned = parts.reduce((sum, part) => sum + part.planned, 0);
	const done = parts.reduce((sum, part) => sum + part.done, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-[#f2f2f7] px-2.5 py-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-1.5 flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `inline-flex min-w-14 justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${CENTER_CLASS[label] ?? "bg-white text-ink"}`,
					children: label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "min-w-0 flex-1 truncate text-[11px] font-medium text-[#8e8e93]",
					children: planned ? `할 일 ${num(planned)}  ·  끝낸 ${num(done)}  ·  남은 ${num(planned - done)}` : "할 일 —"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "shrink-0 text-[15px] font-semibold tabular-nums text-[#1c1c1e]",
					children: planned ? pf.format(done / planned) : "—"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex h-[7px] overflow-hidden rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]",
			children: parts.map((part) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-full",
				style: {
					width: planned ? `${part.done / planned * 100}%` : "0%",
					background: part.color
				}
			}, part.id))
		})]
	});
}
function ProgressGauge({ jobs: all }) {
	const [centers, setCenters] = (0, import_react.useState)(() => [...Mn()]);
	const [dpt, setDpt] = (0, import_react.useState)("전체");
	const list = Mn();
	const picked = list.filter((id) => centers.includes(id));
	const allOn = picked.length === list.length;
	const rows = (0, import_react.useMemo)(() => picked.map((id) => {
		return {
			id,
			parts: dpt === "전체" ? [{
				...qn(id, gaugeJobs(all, "유제 냉장", [id])),
				id: "유제 냉장",
				color: GAUGE_DAIRY
			}, {
				...qn(id, gaugeJobs(all, "FF2", [id])),
				id: "FF2",
				color: GAUGE_FF2
			}] : [{
				...qn(id, gaugeJobs(all, dpt, [id])),
				id: dpt,
				color: dpt === "FF2" ? GAUGE_FF2 : GAUGE_DAIRY
			}]
		};
	}), [
		all,
		dpt,
		picked
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2 w-full shrink-0 rounded-2xl bg-white px-3 py-2.5 shadow-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-1 text-[15px] font-semibold tracking-tight text-[#1c1c1e]",
						children: "작업 진척률"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
						label: "센터",
						soft: true,
						up: true,
						text: allOn ? "전체" : picked.length === 0 ? "선택 없음" : picked.join(", "),
						rows: [{
							id: "all",
							label: "전체",
							checked: allOn
						}, ...list.map((id) => ({
							id,
							label: id,
							checked: centers.includes(id)
						}))],
						onToggle: (id) => {
							if (id === "all") {
								setCenters(allOn ? [] : [...list]);
								return;
							}
							setCenters((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DptSelect, {
						value: dpt,
						onChange: setDpt,
						soft: true,
						up: true
					})
				]
			}),
			dpt === "전체" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex items-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-1 rounded-full bg-[#f2f2f7] px-2 py-0.5 text-[11px] font-semibold text-[#3a3a3c]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "inline-block size-1.5 rounded-full",
						style: { background: GAUGE_DAIRY }
					}), "유제 냉장"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-1 rounded-full bg-[#f2f2f7] px-2 py-0.5 text-[11px] font-semibold text-[#3a3a3c]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "inline-block size-1.5 rounded-full",
						style: { background: GAUGE_FF2 }
					}), "FF2"]
				})]
			}) : null,
			picked.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-[12px] text-[#8e8e93]",
				children: "볼 센터를 체크해 주세요."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1.5 flex flex-col gap-1",
				children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CenterGauge, {
					label: row.id,
					parts: row.parts
				}, row.id))
			})
		]
	});
}
function Compare({ jobs: all, loaded }) {
	const [dpt, setDpt] = (0, import_react.useState)("전체");
	const jobs = (0, import_react.useMemo)(() => jobsForDpt(all, dpt), [all, dpt]);
	const rows = (0, import_react.useMemo)(() => Jn(Mn().map((id) => qn(id, jobs[id] ?? []))), [jobs]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 w-full flex-col items-center overflow-auto px-2 py-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1 flex max-w-full shrink-0 flex-wrap items-center justify-center gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "px-1 text-[15px] font-semibold tracking-tight text-ink",
					children: "센터비교"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DptSelect, {
					value: dpt,
					onChange: setDpt,
					compact: true
				})]
			}),
			!loaded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, {}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-w-full shrink-0 overflow-x-auto rounded-2xl bg-white shadow-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-max border-collapse text-center text-[13px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
							className: "sr-only",
							children: "센터 비교"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "text-[11px] font-semibold text-muted",
							children: [
								"센터",
								"할 일",
								"끝낸 일",
								"남은 일",
								"%",
								"시작",
								"끝",
								"시간",
								"건/hr",
								"순위"
							].map((label) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								scope: "col",
								className: "whitespace-nowrap border-b border-black/10 px-2.5 py-1 text-center font-semibold",
								children: label
							}, label))
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								scope: "row",
								className: "border-b border-black/[0.06] px-2.5 py-1 text-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `inline-flex min-w-16 justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${CENTER_CLASS[row.id]}`,
									children: Fn[row.id]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
								center: true,
								children: num(row.planned)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
								center: true,
								children: num(row.done)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
								center: true,
								children: num(row.left)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
								center: true,
								children: pf.format(row.rate)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimeCell, {
								center: true,
								ms: row.first
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimeCell, {
								center: true,
								ms: row.last
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
								center: true,
								children: hrs(row.hours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
								center: true,
								children: num(row.perHour)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border-b border-black/[0.06] px-2.5 py-1 text-center text-xs font-semibold",
								children: row.rank
							})
						] }, row.id)) })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 shrink-0 text-center text-[11px] text-muted",
				children: "순위는 한 시간에 끝낸 건수입니다."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressGauge, { jobs: all })
		]
	});
}
function TimeView({ jobs: all, loaded }) {
	const [center, setCenter] = (0, import_react.useState)("1센터");
	const [dpt, setDpt] = (0, import_react.useState)("전체");
	const [minutes, setMinutes] = (0, import_react.useState)(15);
	const jobs = (0, import_react.useMemo)(() => jobsOf(all, center, dpt), [
		all,
		center,
		dpt
	]);
	const ready = (all[center]?.length ?? 0) > 0;
	const planned = jobs.length;
	const lineN = Bn(center);
	const rows = (0, import_react.useMemo)(() => or(jobs, minutes, planned), [
		jobs,
		minutes,
		planned
	]);
	const averages = (0, import_react.useMemo)(() => sr(rows).slice(0, lineN), [rows, lineN]);
	const done = rows.length ? rows[rows.length - 1].cumulative : 0;
	const avgSlice = rows.length ? rows.reduce((sum, row) => sum + row.sliceRate, 0) / rows.length : 0;
	const countColor = (0, import_react.useMemo)(() => xr(rows.map((row) => row.count)), [rows]);
	const lineColor = (0, import_react.useMemo)(() => Array.from({ length: lineN }, (_, index) => xr(rows.map((row) => row.lines[index]))), [rows, lineN]);
	const first = rows[0]?.start ?? null;
	const last = jobs.reduce((max, job) => job.at != null && (max == null || job.at > max) ? job.at : max, null);
	const [printReady, setPrintReady] = (0, import_react.useState)(false);
	const [printJob, setPrintJob] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		setPrintReady(true);
	}, []);
	const printedAt = printJob ? (/* @__PURE__ */ new Date()).toLocaleString("ko-KR", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	}) : "";
	(0, import_react.useEffect)(() => {
		if (!printJob) return;
		document.body.classList.add("print-time");
		const done = () => {
			document.body.classList.remove("print-time");
			window.removeEventListener("afterprint", done);
		};
		window.addEventListener("afterprint", done);
		window.print();
		return done;
	}, [printJob]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ios-sheet",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 z-20 flex items-center gap-2 border-b border-black/5 bg-white/90 px-3 py-2 backdrop-blur",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "min-w-0 flex-1 truncate text-[17px] font-semibold text-[#1c1c1e]",
					children: "시간별 확인"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold disabled:opacity-40",
					disabled: !loaded || rows.length === 0,
					onClick: () => setPrintJob((job) => job + 1),
					children: "인쇄"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2 px-3 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CenterSelect, {
						value: center,
						onChange: setCenter
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DptSelect, {
						value: dpt,
						onChange: setDpt
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
						label: "구간(분)",
						value: String(minutes),
						onChange: (id) => setMinutes(Number(id)),
						options: [
							10,
							15,
							30,
							60
						].map((step) => ({
							id: String(step),
							label: String(step)
						}))
					})
				]
			}),
			!loaded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, {}) : null,
			loaded && jobs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, { text: emptyDpt(dpt) }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[1100px] border-collapse text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
						className: "sr-only",
						children: "시간별 확인"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "border border-grid px-2 py-2 text-left font-bold",
								children: "시작"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-2 text-center font-bold tabular-nums",
								children: cr(first)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "border border-grid px-2 py-2 text-left font-bold",
								children: "마지막"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-2 text-center font-bold tabular-nums",
								title: lr(last),
								children: cr(last)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid",
								colSpan: 4
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid",
								colSpan: lineN
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "border border-grid px-2 py-2 text-left font-bold",
								children: "계획"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-2 text-right font-bold tabular-nums",
								children: num(planned)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid",
								colSpan: 5
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid bg-line-4 px-2 py-2 text-center text-sm font-bold",
								children: "평균 %"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "border border-grid bg-ice px-2 py-2 text-center text-base font-bold text-title",
								colSpan: lineN,
								children: [
									"📊",
									minutes,
									"분별 평균작업건수"
								]
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "border border-grid px-2 py-2 text-left font-bold",
								children: "완료"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-2 text-right font-bold tabular-nums",
								children: num(done)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid",
								colSpan: 5
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid bg-line-4 px-2 py-2 text-right font-bold tabular-nums",
								children: loaded && rows.length > 0 ? pf.format(avgSlice) : ""
							}),
							averages.map((value, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: `border border-grid px-2 py-2 text-right font-bold tabular-nums ${LINE_CLASS[index]}`,
								children: ready ? num(value) : ""
							}, index))
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "bg-header text-on-dark",
							children: [[
								"구간시작",
								"구간종료",
								"건수",
								"시간당",
								"누적",
								"총%",
								"피킹",
								"구간%"
							].map((label) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								scope: "col",
								className: "whitespace-nowrap border border-header px-2 py-2 font-bold " + (label === "구간%" ? "bg-line-4" : ""),
								children: label
							}, label)), Pn.slice(0, lineN).map((label, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
								scope: "col",
								className: `whitespace-nowrap border border-grid px-2 py-2 font-bold ${LINE_CLASS[index]}`,
								children: [index + 1, "라인"]
							}, label))]
						}),
						rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BucketRow, {
							row,
							countColor,
							lineColor,
							lineCount: lineN
						}, row.start))
					] })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-3 py-3 text-xs text-muted",
				children: "색이 진할수록 그 구간에 많이 처리한 것입니다. 총%는 처음부터 쌓인 비율, 구간%는 그 구간만의 비율입니다. 평균 %는 구간%를 평균 낸 값입니다. 인쇄는 지금 고른 센터, DPT, 구간만 나갑니다."
			})
		]
	}), printReady ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "time-print",
		"aria-hidden": printJob === 0,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "time-print-head",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "센터 생산성" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "시간별 확인" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						center,
						" · ",
						dpt,
						" · ",
						minutes,
						"분",
						printedAt ? ` · 출력 ${printedAt}` : ""
					] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "time-print-sums",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: cr(first) || "—" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "시작" })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: cr(last) || "—" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "마지막" })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: num(planned) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "계획" })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: num(done) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "완료" })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: rows.length ? pf.format(avgSlice) : "—" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "평균 %" })] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [[
				"구간시작",
				"구간종료",
				"건수",
				"시간당",
				"누적",
				"총%",
				"피킹",
				"구간%"
			].map((label) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: label }, label)), Pn.slice(0, lineN).map((label, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: `${index + 1}라인` }, label))] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: cr(row.start) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: cr(row.end) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					style: { background: countColor(row.count) },
					children: num(row.count)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: num(row.perHour) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: num(row.cumulative) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: pf.format(row.totalRate) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: num(row.pickQty) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: pf.format(row.sliceRate) }),
				row.lines.slice(0, lineN).map((value, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					style: { background: lineColor[index]?.(value) },
					children: num(value)
				}, index))
			] }, row.start)) })] })
		]
	}), document.body) : null] });
}
function BucketRow({ row, countColor, lineColor, lineCount }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "border border-grid px-2 py-1 text-center tabular-nums",
			children: cr(row.start)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "border border-grid px-2 py-1 text-center tabular-nums",
			children: cr(row.end)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "border border-grid px-2 py-1 text-right tabular-nums",
			style: { background: countColor(row.count) },
			children: num(row.count)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "border border-grid px-2 py-1 text-right tabular-nums",
			children: num(row.perHour)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "border border-grid px-2 py-1 text-right tabular-nums",
			children: num(row.cumulative)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "border border-grid px-2 py-1 text-right tabular-nums",
			children: pf.format(row.totalRate)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "border border-grid px-2 py-1 text-right tabular-nums",
			children: num(row.pickQty)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "border border-grid px-2 py-1 text-right tabular-nums",
			children: pf.format(row.sliceRate)
		}),
		row.lines.slice(0, lineCount).map((value, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "border border-grid px-2 py-1 text-right tabular-nums",
			style: { background: lineColor[index]?.(value) },
			children: num(value)
		}, index))
	] });
}
function rateBar(rate) {
	if (rate >= 1) return "bg-line-3";
	if (rate >= .7) return "bg-line-4";
	if (rate >= .4) return "bg-line-2";
	return "bg-line-1";
}
function workSpan(ms) {
	if (ms == null || ms < 0) return "—";
	const minutes = Math.round(ms / 6e4);
	if (minutes <= 0) return "1분 미만";
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours <= 0) return `${rest}분`;
	if (rest === 0) return `${hours}시간`;
	return `${hours}시간 ${rest}분`;
}
function clockNeedle(raw) {
	const text = String(raw ?? "").trim();
	const parts = text.split(":").map((part) => part.trim());
	if (parts.length >= 2 && parts.length <= 3 && parts.every((part) => /^\d{1,2}$/.test(part))) return parts.map((part) => part.padStart(2, "0")).join(":");
	return text;
}
function clockHit(ms, needle) {
	if (!needle || ms == null) return false;
	const clock = lr(ms);
	const parts = needle.split(":");
	if (parts.length >= 3) return clock === needle;
	if (parts.length === 2) return clock.slice(0, 5) === needle;
	return clock.includes(needle);
}
function lineStoreTimes(picks) {
	const map = /* @__PURE__ */ new Map();
	for (const pick of picks) {
		const clock = pick.at == null ? "" : lr(pick.at);
		const key = `${pick.code}|${pick.store}|${clock}`;
		let row = map.get(key);
		if (!row) {
			row = {
				key,
				store: pick.store,
				code: pick.code,
				loc: pick.loc || "",
				at: pick.at,
				count: 0,
				qty: 0,
				doneQty: 0
			};
			map.set(key, row);
		}
		if (!row.loc && pick.loc) row.loc = pick.loc;
		row.count += 1;
		row.qty += pick.qty || 0;
		row.doneQty += pick.pickQty || 0;
	}
	return [...map.values()].sort((a, b) => {
		if (a.at == null && b.at == null) return a.store.localeCompare(b.store, "ko");
		if (a.at == null) return 1;
		if (b.at == null) return -1;
		return a.at - b.at || a.store.localeCompare(b.store, "ko");
	});
}
function WorkedView({ jobs: all, loaded }) {
	const [centers, setCenters] = (0, import_react.useState)(() => [...Mn()]);
	const [dpt, setDpt] = (0, import_react.useState)("전체");
	const [lines, setLines] = (0, import_react.useState)(() => lineChoices(Mn()));
	const [query, setQuery] = (0, import_react.useState)("");
	const [storeQuery, setStoreQuery] = (0, import_react.useState)("");
	const [endQuery, setEndQuery] = (0, import_react.useState)("");
	const [sortKey, setSortKey] = (0, import_react.useState)("last");
	const [sortDir, setSortDir] = (0, import_react.useState)("desc");
	const [openKey, setOpenKey] = (0, import_react.useState)("");
	const [lineSheet, setLineSheet] = (0, import_react.useState)(null);
	const [workedMode, setWorkedMode] = (0, import_react.useState)("상품");
	const [storeSort, setStoreSort] = (0, import_react.useState)("last");
	const [storeDir, setStoreDir] = (0, import_react.useState)("desc");
	const [storeSheet, setStoreSheet] = (0, import_react.useState)(null);
	const [goodsSort, setGoodsSort] = (0, import_react.useState)("last");
	const [goodsDir, setGoodsDir] = (0, import_react.useState)("desc");
	(0, import_react.useEffect)(() => {
		if (!storeSheet && !lineSheet) return;
		const onKey = (event) => {
			if (event.key !== "Escape") return;
			setStoreSheet(null);
			setLineSheet(null);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [storeSheet, lineSheet]);
	const rows = (0, import_react.useMemo)(() => {
		const allLines = lineChoices(centers).every((n) => lines.includes(n));
		const allow = new Set(lines);
		const list = [];
		for (const id of Mn()) {
			if (!centers.includes(id)) continue;
			const map = /* @__PURE__ */ new Map();
			const lineMax = Bn(id);
			for (const job of all[id] ?? []) {
				if (dpt !== "전체" && !zn(job.route, dpt)) continue;
				const code = job.goodsCd || "";
				const name = job.goodsNm || "상품없음";
				const key = `${id}|${code}|${name}`;
				let row = map.get(key);
				if (!row) {
					row = {
						key,
						center: id,
						code,
						name,
						byLine: /* @__PURE__ */ new Map()
					};
					map.set(key, row);
				}
				let cell = row.byLine.get(job.line);
				if (!cell) {
					cell = {
						line: job.line,
						planned: 0,
						done: 0,
						qty: 0,
						doneQty: 0,
						first: null,
						last: null,
						picks: []
					};
					row.byLine.set(job.line, cell);
				}
				cell.planned += 1;
				const need = job.orderQty || 0;
				const picked = job.qty || 0;
				const ordered = need || picked;
				const full = job.at != null && picked > 0 && (need <= 0 || picked >= need);
				cell.qty += ordered;
				cell.doneQty += full ? picked : 0;
				cell.picks.push({
					store: job.storeNm || "점포없음",
					code: job.storeCd || "",
					loc: job.location || "",
					at: job.at,
					qty: ordered,
					pickQty: full ? picked : 0
				});
				if (full) {
					cell.done += 1;
					if (cell.first == null || job.at < cell.first) cell.first = job.at;
					if (cell.last == null || job.at > cell.last) cell.last = job.at;
				}
			}
			const narrowed = !allLines;
			for (const row of map.values()) {
				let planned = 0;
				let qty = 0;
				let doneCount = 0;
				let first = null;
				let last = null;
				for (const cell of row.byLine.values()) {
					if (narrowed && !allow.has(cell.line)) continue;
					planned += cell.planned;
					qty += cell.qty;
					doneCount += cell.done;
					if (cell.first != null && (first == null || cell.first < first)) first = cell.first;
					if (cell.last != null && (last == null || cell.last > last)) last = cell.last;
				}
				if (planned === 0) continue;
				row.planned = planned;
				row.qty = qty;
				row.done = doneCount;
				row.left = planned - doneCount;
				row.first = first;
				row.last = last;
				row.span = first != null && last != null ? last - first : null;
				row.lineTimes = Array.from({ length: lineMax }, (_, index) => index + 1).filter((line) => !narrowed || allow.has(line)).map((line) => {
					const cell = row.byLine.get(line);
					const cellPlanned = cell?.planned ?? 0;
					const cellDone = cell?.done ?? 0;
					return {
						line,
						planned: cellPlanned,
						qty: cell?.qty ?? 0,
						doneQty: cell?.doneQty ?? 0,
						done: cellDone,
						left: cellPlanned - cellDone,
						first: cell?.first ?? null,
						last: cell?.last ?? null,
						picks: cell?.picks ?? []
					};
				});
				list.push(row);
			}
		}
		const needle = query.trim().toLowerCase();
		const endNeedle = clockNeedle(endQuery);
		const picked = list.filter((row) => {
			if (needle && !row.name.toLowerCase().includes(needle) && !row.code.toLowerCase().includes(needle)) return false;
			if (endNeedle && !row.lineTimes.some((cell) => cell.picks.some((pick) => clockHit(pick.at, endNeedle)))) return false;
			return true;
		});
		const dir = sortDir === "asc" ? 1 : -1;
		picked.sort((a, b) => {
			if (sortKey === "name" || sortKey === "center" || sortKey === "code") return String(a[sortKey]).localeCompare(String(b[sortKey]), "ko") * dir || a.name.localeCompare(b.name, "ko");
			return ((a[sortKey] ?? -1) - (b[sortKey] ?? -1)) * dir || a.name.localeCompare(b.name, "ko");
		});
		return picked;
	}, [
		all,
		centers,
		dpt,
		lines,
		query,
		endQuery,
		sortKey,
		sortDir
	]);
	const storeRows = (0, import_react.useMemo)(() => {
		const allLines = lineChoices(centers).every((n) => lines.includes(n));
		const allow = new Set(lines);
		const map = /* @__PURE__ */ new Map();
		for (const id of Mn()) {
			if (!centers.includes(id)) continue;
			for (const job of all[id] ?? []) {
				if (dpt !== "전체" && !zn(job.route, dpt)) continue;
				if (!allLines && !allow.has(job.line)) continue;
				const code = job.storeCd || "";
				const name = job.storeNm || "점포없음";
				const key = `${id}|${code}|${name}`;
				let row = map.get(key);
				if (!row) {
					row = {
						key,
						center: id,
						code,
						name,
						goods: /* @__PURE__ */ new Map()
					};
					map.set(key, row);
				}
				const gcode = job.goodsCd || "";
				const gname = job.goodsNm || "상품없음";
				const gkey = `${gcode}|${gname}`;
				let goods = row.goods.get(gkey);
				if (!goods) {
					goods = {
						key: gkey,
						code: gcode,
						name: gname,
						qty: 0,
						doneQty: 0,
						last: null,
						times: []
					};
					row.goods.set(gkey, goods);
				}
				const need = job.orderQty || 0;
				const picked = job.qty || 0;
				const ordered = need || picked;
				const full = job.at != null && picked > 0 && (need <= 0 || picked >= need);
				goods.qty += ordered;
				if (full) {
					goods.doneQty += picked;
					goods.times.push(job.at);
					if (goods.last == null || job.at > goods.last) goods.last = job.at;
				}
			}
		}
		const needle = query.trim().toLowerCase();
		const storeNeedle = storeQuery.trim().toLowerCase();
		const endNeedle = clockNeedle(endQuery);
		const list = [];
		for (const row of map.values()) {
			if (storeNeedle && !row.name.toLowerCase().includes(storeNeedle) && !row.code.toLowerCase().includes(storeNeedle)) continue;
			let goods = [...row.goods.values()];
			const storeHit = !needle || row.name.toLowerCase().includes(needle) || row.code.toLowerCase().includes(needle);
			if (needle && !storeHit) goods = goods.filter((item) => item.name.toLowerCase().includes(needle) || item.code.toLowerCase().includes(needle));
			if (endNeedle) goods = goods.filter((item) => item.times.some((ms) => clockHit(ms, endNeedle)));
			if (goods.length === 0) continue;
			goods.sort((a, b) => (b.last ?? -1) - (a.last ?? -1) || a.name.localeCompare(b.name, "ko"));
			list.push({
				key: row.key,
				center: row.center,
				code: row.code,
				name: row.name,
				qty: goods.reduce((sum, item) => sum + item.qty, 0),
				doneQty: goods.reduce((sum, item) => sum + item.doneQty, 0),
				last: goods.reduce((max, item) => item.last != null && (max == null || item.last > max) ? item.last : max, null),
				goods
			});
		}
		const dir = storeDir === "asc" ? 1 : -1;
		list.sort((a, b) => {
			if (storeSort === "name" || storeSort === "center" || storeSort === "code") return String(a[storeSort]).localeCompare(String(b[storeSort]), "ko") * dir || a.name.localeCompare(b.name, "ko");
			return ((a[storeSort] ?? -1) - (b[storeSort] ?? -1)) * dir || a.name.localeCompare(b.name, "ko");
		});
		return list;
	}, [
		all,
		centers,
		dpt,
		lines,
		query,
		storeQuery,
		endQuery,
		storeSort,
		storeDir
	]);
	const done = rows.reduce((sum, row) => sum + row.done, 0);
	const first = rows.reduce((min, row) => row.first != null && (min == null || row.first < min) ? row.first : min, null);
	const last = rows.reduce((max, row) => row.last != null && (max == null || row.last > max) ? row.last : max, null);
	const allCenters = Mn().every((id) => centers.includes(id));
	const lineChoicesNow = lineChoices(centers);
	const pickedLines = lines.filter((n) => lineChoicesNow.includes(n));
	const allLines = lineChoicesNow.every((n) => lines.includes(n));
	function toggleSort(key) {
		if (sortKey === key) setSortDir((dir) => dir === "asc" ? "desc" : "asc");
		else {
			setSortKey(key);
			setSortDir(key === "name" || key === "center" || key === "code" ? "asc" : "desc");
		}
	}
	function mark(key, label) {
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
			scope: "col",
			className: "whitespace-nowrap border border-header p-0 text-center font-bold",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "font-bold text-on-dark",
				onClick: () => toggleSort(key),
				children: [label, sortKey === key ? sortDir === "asc" ? " ▲" : " ▼" : ""]
			})
		}, key);
	}
	const timeNeedle = clockNeedle(endQuery);
	const lineRows = lineSheet ? lineSheet.rows.filter((item) => !timeNeedle || clockHit(item.at, timeNeedle)) : [];
	const storeGoods = storeSheet ? storeSheet.goods.filter((item) => !timeNeedle || (item.times ?? []).some((ms) => clockHit(ms, timeNeedle)) || clockHit(item.last, timeNeedle)).sort((a, b) => {
		const dir = goodsDir === "asc" ? 1 : -1;
		if (goodsSort === "name" || goodsSort === "code") return String(a[goodsSort] ?? "").localeCompare(String(b[goodsSort] ?? ""), "ko", { numeric: true }) * dir || a.name.localeCompare(b.name, "ko");
		return ((a[goodsSort] ?? -1) - (b[goodsSort] ?? -1)) * dir || a.name.localeCompare(b.name, "ko");
	}) : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ios-sheet",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 z-20 flex items-center gap-3 border-b border-black/5 bg-white/90 px-3 py-2 backdrop-blur",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "min-w-0 flex-1 truncate text-[17px] font-semibold text-[#1c1c1e]",
					children: "작업 상품"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex h-7 w-[132px] shrink-0 rounded-full bg-[#e5e5ea] p-0.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute top-0.5 left-0.5 h-6 w-[64px] rounded-full bg-white shadow-sm transition-transform duration-200",
						style: { transform: workedMode === "점포" ? "translateX(64px)" : "translateX(0)" }
					}), ["상품", "점포"].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "relative z-10 h-6 w-[64px] text-xs font-semibold " + (workedMode === id ? "text-[#1c1c1e]" : "text-[#8e8e93]"),
						onClick: () => {
							setWorkedMode(id);
							setStoreSheet(null);
						},
						children: id
					}, id))]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2 px-3 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
						label: "센터",
						text: allCenters ? "전체" : centers.length === 0 ? "선택 없음" : centers.join(", "),
						rows: Mn().map((id) => ({
							id,
							label: id,
							checked: centers.includes(id)
						})),
						onToggle: (id) => {
							setCenters((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id].sort((a, b) => Mn().indexOf(a) - Mn().indexOf(b)));
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DptSelect, {
						value: dpt,
						onChange: setDpt
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
						label: "라인",
						text: allLines ? "전체" : pickedLines.length === 0 ? "선택 없음" : pickedLines.map((n) => `${n}라인`).join(", "),
						rows: [{
							id: "all",
							label: "전체",
							checked: allLines
						}, ...lineChoicesNow.map((n) => ({
							id: String(n),
							label: Pn[n - 1].replace(/^\S+\s/, ""),
							checked: lines.includes(n),
							swatch: LINE_TONE[n - 1]
						}))],
						onToggle: (id) => {
							if (id === "all") {
								setLines(allLines ? lines.filter((n) => !lineChoicesNow.includes(n)) : [.../* @__PURE__ */ new Set([...lines, ...lineChoicesNow])]);
								return;
							}
							const n = Number(id);
							setLines((current) => current.includes(n) ? current.filter((item) => item !== n) : [...current, n].sort((a, b) => a - b));
						}
					}),
					workedMode === "점포" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "search",
						value: storeQuery,
						onChange: (event) => setStoreQuery(event.target.value),
						placeholder: "점포 검색",
						"aria-label": "점포 검색",
						className: "h-10 w-40 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none placeholder:text-[#8e8e93]"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						inputMode: "search",
						value: query,
						onChange: (event) => setQuery(event.target.value),
						placeholder: "상품명 또는 바코드",
						"aria-label": "상품 검색",
						className: "h-10 w-52 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none placeholder:text-[#8e8e93]"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						value: endQuery,
						onChange: (event) => setEndQuery(event.target.value),
						placeholder: "00:00:00",
						"aria-label": "작업 종료 시간 검색",
						className: "h-10 w-40 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none placeholder:text-[#8e8e93]"
					})
				]
			}),
			!loaded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, { text: "위에서 올린 엑셀의 상품명과 작업 시각으로 봅니다." }) : null,
			loaded && centers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, { text: "볼 센터를 체크해 주세요." }) : null,
			loaded && centers.length > 0 && pickedLines.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, { text: "선택한 라인이 없습니다. 라인 필터에서 다시 체크해 주세요." }) : null,
			loaded && centers.length > 0 && pickedLines.length > 0 && (workedMode === "점포" ? storeRows.length : rows.length) === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, { text: query.trim() || storeQuery.trim() || endQuery.trim() ? "검색한 상품이 없습니다." : "선택한 센터, DPT, 라인에서 상품이 없습니다." }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "stat-tiles grid gap-2 px-3 pb-3 sm:grid-cols-4",
				children: [
					[
						"상품",
						num(rows.length),
						"bg-title text-on-dark"
					],
					[
						"완료건수",
						num(done),
						"bg-line-3 text-ink"
					],
					[
						"시작",
						first == null ? "—" : cr(first),
						"bg-header text-on-dark"
					],
					[
						"끝",
						last == null ? "—" : cr(last),
						"bg-line-5 text-on-dark"
					]
				].map(([label, value, color]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `rounded-md px-3 py-3 ${color}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-bold",
						children: label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-2xl font-bold tabular-nums",
						children: loaded ? value : "—"
					})]
				}, label))
			}),
			workedMode === "점포" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "col-mid w-full min-w-[760px] border-collapse text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "bg-header text-on-dark",
						children: [
							["center", "센터"],
							["name", "점포명"],
							["qty", "작업수량"],
							["doneQty", "작업완료수량"],
							["last", "작업종료"]
						].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "whitespace-nowrap border border-header p-0 text-center font-bold",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "font-bold text-on-dark",
								onClick: () => {
									if (storeSort === key) setStoreDir((dir) => dir === "asc" ? "desc" : "asc");
									else {
										setStoreSort(key);
										setStoreDir(key === "name" || key === "center" ? "asc" : "desc");
									}
								},
								children: [label, storeSort === key ? storeDir === "asc" ? " ▲" : " ▼" : ""]
							})
						}, key))
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: storeRows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "whitespace-nowrap border border-grid px-2 py-1.5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${CENTER_CLASS[row.center]}`,
								children: row.center
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-grid p-0 font-bold",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "block w-full px-2 py-1.5 text-left font-bold text-title underline-offset-2 hover:underline",
								onClick: () => setStoreSheet(row),
								children: [row.code, row.name].filter(Boolean).join(" ")
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-grid px-2 py-1.5 text-center tabular-nums",
							children: num(row.qty)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-grid px-2 py-1.5 text-center tabular-nums",
							children: num(row.doneQty)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "whitespace-nowrap border border-grid px-2 py-1.5 text-center font-bold tabular-nums",
							children: cr(row.last) || "—"
						})
					] }, row.key)) })]
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "col-mid w-full min-w-[1080px] border-collapse text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
							className: "sr-only",
							children: "작업 상품 시간"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "bg-header text-left text-on-dark",
							children: [
								mark("center", "센터"),
								mark("code", "바코드"),
								mark("name", "상품"),
								mark("qty", "작업수량"),
								mark("planned", "총건수"),
								mark("done", "완료"),
								mark("left", "미완료"),
								mark("first", "시작"),
								mark("last", "종료"),
								mark("span", "작업시간")
							]
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: openKey === row.key ? "bg-ice" : void 0,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "row",
									className: "whitespace-nowrap border border-grid px-2 py-1.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${CENTER_CLASS[row.center]}`,
										children: row.center
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap border border-grid px-2 py-1.5 tabular-nums",
									children: row.code || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-grid p-0 font-bold",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										role: "button",
										tabIndex: 0,
										className: "block w-full cursor-pointer select-text px-2 py-1.5 font-bold text-title underline-offset-2 hover:underline",
										onClick: () => {
											const picked = window.getSelection();
											if (picked && String(picked).trim()) return;
											setOpenKey((current) => current === row.key ? "" : row.key);
										},
										onKeyDown: (event) => {
											if (event.key !== "Enter" && event.key !== " ") return;
											event.preventDefault();
											setOpenKey((current) => current === row.key ? "" : row.key);
										},
										children: row.name
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-grid px-2 py-1.5 tabular-nums",
									children: num(row.qty)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-grid px-2 py-1.5 tabular-nums",
									children: num(row.planned)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-grid px-2 py-1.5 tabular-nums",
									children: num(row.done)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-grid px-2 py-1.5 tabular-nums",
									children: num(row.left)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap border border-grid px-2 py-1.5 tabular-nums",
									children: cr(row.first) || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap border border-grid px-2 py-1.5 tabular-nums",
									children: cr(row.last) || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap border border-grid px-2 py-1.5 font-bold tabular-nums",
									children: workSpan(row.span)
								})
							]
						}), openKey === row.key ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 10,
							className: "border border-grid bg-ice px-3 py-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "mx-auto w-full max-w-3xl border-collapse text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "bg-header text-on-dark",
									children: [
										"라인",
										"작업수량",
										"작업완료수량",
										"총건수",
										"완료",
										"미완료",
										"작업시작",
										"작업종료",
										"작업시간"
									].map((label) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "border border-header px-2 py-1 text-center font-bold",
										children: label
									}, label))
								}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: row.lineTimes.map((cell) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "cursor-pointer bg-paper hover:bg-[#e8f2ff]",
									onClick: () => setLineSheet({
										line: cell.line,
										name: row.name,
										center: row.center,
										rows: lineStoreTimes(cell.picks)
									}),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "border border-grid px-2 py-1 text-center font-bold text-title",
											children: `${cell.line}라인`
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border border-grid px-2 py-1 text-center tabular-nums",
											children: num(cell.qty)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border border-grid px-2 py-1 text-center tabular-nums",
											children: num(cell.doneQty)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border border-grid px-2 py-1 text-center tabular-nums",
											children: num(cell.planned)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border border-grid px-2 py-1 text-center tabular-nums",
											children: num(cell.done)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border border-grid px-2 py-1 text-center tabular-nums",
											children: num(cell.left)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border border-grid px-2 py-1 text-center font-bold tabular-nums",
											children: cr(cell.first) || "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border border-grid px-2 py-1 text-center font-bold tabular-nums",
											children: cr(cell.last) || "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border border-grid px-2 py-1 text-center font-bold tabular-nums",
											children: cell.first == null || cell.last == null ? "—" : workSpan(cell.last - cell.first)
										})
									]
								}, cell.line)) })]
							})
						}) }) : null] }, row.key)) })
					]
				})
			}),
			storeSheet && typeof document !== "undefined" ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4",
				onClick: () => setStoreSheet(null),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-modal": "true",
					"aria-label": `${storeSheet.name} 상품 작업`,
					className: "flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.2)]",
					onClick: (event) => event.stopPropagation(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3 border-b border-black/5 px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-[17px] font-semibold text-[#1c1c1e]",
								children: [storeSheet.code, storeSheet.name].filter(Boolean).join(" ")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm text-[#6b7280]",
								children: storeSheet.center
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-9 shrink-0 rounded-full bg-[#f2f2f7] px-3 text-sm font-semibold text-[#007aff]",
							onClick: () => setStoreSheet(null),
							children: "닫기"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-h-0 flex-1 overflow-auto",
						children: storeGoods.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-4 py-6 text-center text-sm text-[#6b7280]",
							children: "이 점포의 작업 상품이 없습니다."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full border-collapse text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "sticky top-0 bg-header text-on-dark",
								children: [
									["code", "상품코드"],
									["name", "상품명"],
									["qty", "작업수량"],
									["doneQty", "작업완료수량"],
									["last", "작업종료"]
								].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "border border-header p-0 text-center font-bold",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "w-full px-2 py-2 font-bold text-on-dark",
										onClick: () => {
											if (goodsSort === key) setGoodsDir((dir) => dir === "asc" ? "desc" : "asc");
											else {
												setGoodsSort(key);
												setGoodsDir(key === "name" || key === "code" ? "asc" : "desc");
											}
										},
										children: [label, goodsSort === key ? goodsDir === "asc" ? " ▲" : " ▼" : ""]
									})
								}, key))
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: storeGoods.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap border border-grid px-2 py-1.5 text-center tabular-nums",
									children: item.code || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-grid px-2 py-1.5 font-bold",
									children: item.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-grid px-2 py-1.5 text-center tabular-nums",
									children: num(item.qty)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-grid px-2 py-1.5 text-center tabular-nums",
									children: num(item.doneQty)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap border border-grid px-2 py-1.5 text-center font-bold tabular-nums",
									children: lr(item.last) || "—"
								})
							] }, item.key)) })]
						})
					})]
				})]
			}), document.body) : null,
			lineSheet && typeof document !== "undefined" ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4",
				onClick: () => setLineSheet(null),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-modal": "true",
					"aria-label": `${lineSheet.line}라인 점포 작업`,
					className: "flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.2)]",
					onClick: (event) => event.stopPropagation(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3 border-b border-black/5 px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[17px] font-semibold text-[#1c1c1e]",
								children: `${lineSheet.line}라인`
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm text-[#6b7280]",
								children: `${lineSheet.center} · ${lineSheet.name}`
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-9 shrink-0 rounded-full bg-[#f2f2f7] px-3 text-sm font-semibold text-[#007aff]",
							onClick: () => setLineSheet(null),
							children: "닫기"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-h-0 flex-1 overflow-auto",
						children: lineRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-4 py-6 text-center text-sm text-[#6b7280]",
							children: timeNeedle ? "이 시각의 작업이 없습니다." : "이 라인에는 이 상품 작업이 없습니다."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full border-collapse text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "sticky top-0 bg-header text-on-dark",
								children: [
									"점포",
									"작업수량",
									"작업완료수량",
									"건수",
									"작업시각"
								].map((label) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "border border-header px-2 py-2 text-center font-bold",
									children: label
								}, label))
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: lineRows.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
									className: "border border-grid px-2 py-1.5 text-center font-bold",
									children: [[item.code, item.store].filter(Boolean).join(" "), item.loc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-0.5 block text-xs font-medium text-muted",
										children: item.loc
									}) : null]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-grid px-2 py-1.5 text-center tabular-nums",
									children: num(item.qty)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-grid px-2 py-1.5 text-center tabular-nums",
									children: num(item.doneQty)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-grid px-2 py-1.5 text-center tabular-nums",
									children: num(item.count)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap border border-grid px-2 py-1.5 text-center font-bold tabular-nums",
									children: item.at == null ? "미작업" : lr(item.at)
								})
							] }, item.key)) })]
						})
					})]
				})]
			}), document.body) : null
		]
	});
}
function GoodsView({ jobs: all, loaded }) {
	const [center, setCenter] = (0, import_react.useState)("1센터");
	const [dpt, setDpt] = (0, import_react.useState)("전체");
	const [lines, setLines] = (0, import_react.useState)(() => lineChoices(Mn()));
	const [sortKey, setSortKey] = (0, import_react.useState)("openQty");
	const [sortDir, setSortDir] = (0, import_react.useState)("desc");
	const [printReady, setPrintReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setPrintReady(true);
	}, []);
	const choices = lineChoices([center]);
	const pickedLines = lines.filter((n) => choices.includes(n));
	const allLines = choices.every((n) => lines.includes(n));
	const baseJobs = (0, import_react.useMemo)(() => jobsOf(all, center, dpt), [
		all,
		center,
		dpt
	]);
	const picked = (0, import_react.useMemo)(() => {
		if (allLines) return baseJobs;
		const allow = new Set(pickedLines);
		return baseJobs.filter((job) => allow.has(job.line));
	}, [
		baseJobs,
		allLines,
		pickedLines
	]);
	const stats = (0, import_react.useMemo)(() => {
		const allow = allLines ? null : new Set(pickedLines);
		const map = /* @__PURE__ */ new Map();
		for (const job of all[center] ?? []) {
			if (dpt !== "전체" && !zn(job.route, dpt)) continue;
			if (allow && !allow.has(job.line)) continue;
			const code = job.goodsCd || "";
			const name = job.goodsNm || "상품없음";
			const key = `${code}|${name}`;
			let row = map.get(key);
			if (!row) {
				row = {
					key,
					code,
					name,
					byLine: /* @__PURE__ */ new Map()
				};
				map.set(key, row);
			}
			const amount = job.orderQty || job.qty || 0;
			const pickedQty = job.qty || 0;
			const need = job.orderQty || 0;
			const full = job.at != null && pickedQty > 0 && (need <= 0 || pickedQty >= need);
			const bucket = row.byLine.get(job.line) ?? {
				total: 0,
				open: 0
			};
			bucket.total += amount;
			if (!full) bucket.open += amount;
			row.byLine.set(job.line, bucket);
		}
		const list = [];
		for (const row of map.values()) {
			let total = 0;
			let open = 0;
			const parts = [];
			for (const line of [...row.byLine.keys()].sort((a, b) => a - b)) {
				const bucket = row.byLine.get(line);
				total += bucket.total;
				open += bucket.open;
				if (bucket.open > 0) parts.push(`${line}라인 - ${num(bucket.open)}개`);
			}
			list.push({
				key: row.key,
				code: row.code,
				name: row.name,
				totalQty: total,
				openQty: open,
				centers: parts.join(" "),
				rate: total ? (total - open) / total : 0
			});
		}
		return list;
	}, [
		all,
		center,
		dpt,
		allLines,
		pickedLines
	]);
	const rows = (0, import_react.useMemo)(() => {
		const open = stats.filter((row) => row.openQty > 0);
		const dir = sortDir === "asc" ? 1 : -1;
		return [...open].sort((a, b) => {
			if (sortKey === "name" || sortKey === "centers") return String(a[sortKey] || "").localeCompare(String(b[sortKey] || ""), "ko") * dir || a.name.localeCompare(b.name, "ko");
			return ((a[sortKey] ?? -1) - (b[sortKey] ?? -1)) * dir || a.name.localeCompare(b.name, "ko");
		});
	}, [
		stats,
		sortKey,
		sortDir
	]);
	const [checked, setChecked] = (0, import_react.useState)([]);
	const checkedSet = (0, import_react.useMemo)(() => new Set(checked), [checked]);
	const printRows = rows.some((row) => checkedSet.has(row.key)) ? rows.filter((row) => checkedSet.has(row.key)) : rows;
	const printQty = printRows.reduce((sum, row) => sum + (row.totalQty || 0), 0);
	const printOpen = printRows.reduce((sum, row) => sum + (row.openQty || 0), 0);
	const allChecked = rows.length > 0 && rows.every((row) => checkedSet.has(row.key));
	const totalQty = stats.reduce((sum, row) => sum + (row.totalQty || 0), 0);
	const openQty = stats.reduce((sum, row) => sum + (row.openQty || 0), 0);
	const rate = totalQty ? (totalQty - openQty) / totalQty : 0;
	const missing = picked.length > 0 && picked.every((job) => job.goodsNm === "" && job.goodsCd === "");
	const [printJob, setPrintJob] = (0, import_react.useState)(0);
	const lineLabel = lines.length === choices.length ? "전체 라인" : lines.length === 0 ? "선택 없음" : [...lines].sort((a, b) => a - b).map((n) => Pn[n - 1]).join(", ");
	const printedAt = printJob ? (/* @__PURE__ */ new Date()).toLocaleString("ko-KR", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	}) : "";
	(0, import_react.useEffect)(() => {
		if (!printJob) return;
		document.body.classList.add("print-goods");
		const done = () => {
			document.body.classList.remove("print-goods");
			window.removeEventListener("afterprint", done);
		};
		window.addEventListener("afterprint", done);
		window.print();
		return done;
	}, [printJob]);
	function toggleSort(key) {
		if (sortKey === key) setSortDir((dir) => dir === "asc" ? "desc" : "asc");
		else {
			setSortKey(key);
			setSortDir(key === "name" || key === "centers" ? "asc" : "desc");
		}
	}
	function toggleCheck(key) {
		setChecked((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
	}
	function toggleAll() {
		setChecked((current) => {
			const visible = new Set(rows.map((row) => row.key));
			if (allChecked) return current.filter((key) => !visible.has(key));
			return [.../* @__PURE__ */ new Set([...current, ...rows.map((row) => row.key)])];
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ios-sheet",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-black/5 bg-white/90 px-3 py-2 backdrop-blur",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "min-w-0 flex-1 truncate text-[17px] font-semibold text-[#1c1c1e]",
					children: "미작업 상품"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold disabled:opacity-40",
					disabled: !loaded,
					onClick: () => setPrintJob((job) => job + 1),
					children: "인쇄"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2 px-3 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CenterSelect, {
						value: center,
						onChange: setCenter
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMenu, {
						label: "라인",
						text: allLines ? "전체" : pickedLines.length === 0 ? "선택 없음" : [...pickedLines].sort((a, b) => a - b).map((n) => `${n}라인`).join(", "),
						rows: [{
							id: "all",
							label: "전체",
							checked: allLines
						}, ...choices.map((n) => ({
							id: String(n),
							label: Pn[n - 1].replace(/^\S+\s/, ""),
							checked: lines.includes(n),
							swatch: LINE_TONE[n - 1]
						}))],
						onToggle: (id) => {
							if (id === "all") {
								setLines(allLines ? lines.filter((n) => !choices.includes(n)) : [.../* @__PURE__ */ new Set([...lines, ...choices])]);
								return;
							}
							const n = Number(id);
							setLines((current) => current.includes(n) ? current.filter((item) => item !== n) : [...current, n].sort((a, b) => a - b));
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DptSelect, {
						value: dpt,
						onChange: setDpt
					})
				]
			}),
			!loaded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, { text: "위에서 올린 엑셀의 상품명으로 미작업 상품을 봅니다." }) : null,
			loaded && baseJobs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, { text: emptyDpt(dpt) }) : null,
			loaded && baseJobs.length > 0 && lines.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, { text: "선택한 라인이 없습니다. 라인 필터에서 다시 체크해 주세요." }) : null,
			missing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, { text: "이 파일에서 상품명(GoodsNM) 열을 찾지 못했습니다." }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "stat-tiles grid gap-2 px-3 pb-3 sm:grid-cols-3",
				children: [
					[
						"총작업량",
						num(totalQty),
						"bg-title text-on-dark"
					],
					[
						"미작업수량",
						num(openQty),
						"bg-line-1 text-on-dark"
					],
					[
						"몇 %완료",
						pf.format(rate),
						"bg-line-5 text-on-dark"
					]
				].map(([label, value, color]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `rounded-md px-3 py-3 ${color}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-bold",
						children: label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-2xl font-bold tabular-nums",
						children: loaded ? value : "—"
					})]
				}, label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "col-mid w-full min-w-[920px] border-collapse text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
							className: "sr-only",
							children: "미작업 상품리스트"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "bg-header text-left text-on-dark",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									className: "w-10 border border-header px-2 py-2 text-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										"aria-label": "보이는 상품 모두 선택",
										checked: allChecked,
										onChange: toggleAll
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									className: "whitespace-nowrap border border-header px-2 py-2 font-bold",
									children: "바코드"
								}),
								[
									["name", "상품"],
									["totalQty", "총작업량"],
									["openQty", "미작업수량"],
									["centers", "미작업 라인 수량"],
									["rate", "몇 %완료"]
								].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									className: "whitespace-nowrap border border-header p-0 text-center font-bold",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "font-bold text-on-dark",
										onClick: () => toggleSort(key),
										children: [label, sortKey === key ? sortDir === "asc" ? " ▲" : " ▼" : ""]
									})
								}, key))
							]
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-1.5 text-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									"aria-label": `${row.name} 인쇄 선택`,
									checked: checkedSet.has(row.key),
									onChange: () => toggleCheck(row.key)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-1.5 text-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Barcode, { value: row.code })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								scope: "row",
								className: "border border-grid px-2 py-1.5 text-left font-bold",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: row.name })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, { children: num(row.totalQty) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, { children: num(row.openQty) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "whitespace-nowrap border border-grid px-2 py-1.5 text-center font-bold",
								children: row.centers || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-grid px-2 py-1.5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-3 min-w-16 flex-1 overflow-hidden rounded-sm bg-slate",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: `h-full ${rateBar(row.rate)}`,
											style: { width: `${Math.round(row.rate * 100)}%` }
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-14 text-right font-bold tabular-nums",
										children: pf.format(row.rate)
									})]
								})
							})
						] }, row.key)) })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-3 py-3 text-xs text-muted",
				children: "목록은 미작업이 남은 상품만 보여 줍니다. 바코드는 상품코드(GoodsCD)입니다. 체크한 상품만 인쇄되고, 체크가 없으면 보이는 상품 전체를 인쇄합니다."
			})
		]
	}), printReady ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "goods-print",
		"aria-hidden": printJob === 0,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "goods-print-head",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "센터 생산성" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "미작업 상품리스트" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						center,
						" · ",
						lineLabel,
						" · ",
						dpt,
						printRows.length === rows.length ? " · 전체" : ` · 선택 ${nf.format(printRows.length)}종`,
						printedAt ? ` · 출력 ${printedAt}` : ""
					] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "goods-print-sums",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: loaded ? num(printQty) : "—" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "총작업량" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: loaded ? num(printOpen) : "—" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "미작업수량" })] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "번호" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "바코드" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "상품" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "총작업량" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "미작업수량" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "미작업 라인 수량" })
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: printRows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: index + 1 }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "barcode",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Barcode, { value: row.code })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: row.name }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: num(row.totalQty) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: num(row.openQty) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row.centers || "—" })
			] }, row.key)) })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "goods-print-note",
				children: [
					printRows.length === rows.length ? "체크가 없어 보이는 상품 전체를 인쇄합니다." : "체크한 상품만 인쇄합니다.",
					" 미작업 라인 수량은 선택한 센터의 라인별 미작업수량입니다. 총 ",
					nf.format(printRows.length),
					"종."
				]
			})
		]
	}), document.body) : null] });
}
function StoreView({ jobs: all, loaded }) {
	const [center, setCenter] = (0, import_react.useState)("1센터");
	const [dpt, setDpt] = (0, import_react.useState)("전체");
	const jobs = (0, import_react.useMemo)(() => jobsOf(all, center, dpt), [
		all,
		center,
		dpt
	]);
	const [line, setLine] = (0, import_react.useState)(0);
	const lineMax = Bn(center);
	(0, import_react.useEffect)(() => {
		if (line > lineMax) setLine(0);
	}, [line, lineMax]);
	const [storeKey, setStoreKey] = (0, import_react.useState)("전체");
	const [storeQuery, setStoreQuery] = (0, import_react.useState)("");
	const [openKey, setOpenKey] = (0, import_react.useState)("");
	const [sortKey, setSortKey] = (0, import_react.useState)("left");
	const [sortDir, setSortDir] = (0, import_react.useState)("desc");
	const base = (0, import_react.useMemo)(() => Qn(jobs, line), [jobs, line]);
	(0, import_react.useEffect)(() => {
		if (storeKey !== "전체" && !base.some((row) => row.key === storeKey)) setStoreKey("전체");
		if (openKey && !base.some((row) => row.key === openKey)) setOpenKey("");
	}, [
		base,
		storeKey,
		openKey
	]);
	const rows = (0, import_react.useMemo)(() => {
		const needle = storeQuery.trim().toLowerCase();
		const picked = needle ? base.filter((row) => row.store.toLowerCase().includes(needle) || String(row.code || "").toLowerCase().includes(needle)) : storeKey === "전체" ? base : base.filter((row) => row.key === storeKey);
		const dir = sortDir === "asc" ? 1 : -1;
		return [...picked].sort((a, b) => {
			return (sortKey === "store" ? a.store.localeCompare(b.store, "ko") : a[sortKey] - b[sortKey]) * dir || a.store.localeCompare(b.store, "ko");
		});
	}, [
		base,
		storeKey,
		storeQuery,
		sortKey,
		sortDir
	]);
	const planned = rows.reduce((sum, row) => sum + row.planned, 0);
	const done = rows.reduce((sum, row) => sum + row.done, 0);
	const left = planned - done;
	const rate = planned ? done / planned : 0;
	const goods = (0, import_react.useMemo)(() => openKey ? $n(jobs, openKey, line) : [], [
		jobs,
		openKey,
		line
	]);
	const missing = jobs.length > 0 && jobs.every((job) => job.storeNm === "" && job.storeCd === "");
	function toggleSort(key) {
		if (sortKey === key) setSortDir((dir) => dir === "asc" ? "desc" : "asc");
		else {
			setSortKey(key);
			setSortDir(key === "store" ? "asc" : "desc");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ios-sheet",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sticky top-0 z-20 flex items-center border-b border-black/5 bg-white/90 px-3 py-2 backdrop-blur",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "min-w-0 flex-1 truncate text-[17px] font-semibold text-[#1c1c1e]",
					children: "점포 진척"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2 px-3 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CenterSelect, {
						value: center,
						onChange: setCenter
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
						label: "라인",
						value: String(line),
						onChange: (id) => setLine(Number(id)),
						options: [{
							id: "0",
							label: "전체"
						}, ...Pn.slice(0, lineMax).map((label, index) => ({
							id: String(index + 1),
							label: label.replace(/^\S+\s/, "")
						}))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
						label: "점포",
						value: storeKey,
						search: true,
						onSearch: setStoreQuery,
						onChange: setStoreKey,
						options: [{
							id: "전체",
							label: "전체"
						}, ...base.map((row) => ({
							id: row.key,
							label: row.code ? `${row.store} ${row.code}` : row.store
						}))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DptSelect, {
						value: dpt,
						onChange: setDpt
					})
				]
			}),
			!loaded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, { text: "위에서 올린 엑셀의 점포명으로 진척률을 봅니다." }) : null,
			loaded && jobs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, { text: emptyDpt(dpt) }) : null,
			missing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, { text: "이 파일에서 점포명(ClientNM) 열을 찾지 못했습니다." }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "stat-tiles grid gap-2 px-3 pb-3 sm:grid-cols-4",
				children: [
					[
						"작업건수",
						num(planned),
						"bg-title text-on-dark"
					],
					[
						"완료건수",
						num(done),
						"bg-line-3 text-ink"
					],
					[
						"잔여건수",
						num(left),
						"bg-line-1 text-on-dark"
					],
					[
						"몇 %완료",
						pf.format(rate),
						"bg-line-5 text-on-dark"
					]
				].map(([label, value, color]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `rounded-md px-3 py-3 ${color}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-bold",
						children: label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-2xl font-bold tabular-nums",
						children: loaded ? value : "—"
					})]
				}, label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "col-mid w-full min-w-[640px] border-collapse text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
							className: "sr-only",
							children: "점포 작업 진척률"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "bg-header text-left text-on-dark",
							children: [
								["store", "점포"],
								["planned", "작업건수"],
								["done", "완료건수"],
								["left", "잔여건수"],
								["rate", "몇 %완료"]
							].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								scope: "col",
								className: "whitespace-nowrap border border-header p-0 text-center font-bold",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "font-bold text-on-dark",
									onClick: () => toggleSort(key),
									children: [label, sortKey === key ? sortDir === "asc" ? " ▲" : " ▼" : ""]
								})
							}, key))
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: openKey === row.key ? "bg-ice" : void 0,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
									scope: "row",
									className: "border border-grid px-2 py-1.5 text-left font-bold",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "text-left font-bold text-title underline-offset-2 hover:underline",
										onClick: () => setOpenKey((current) => current === row.key ? "" : row.key),
										children: row.store
									}), row.code || row.lines ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "mt-0.5 block text-xs font-medium text-muted",
										children: [
											row.code ? row.code : "",
											row.code && row.lines ? " · " : "",
											row.lines ? `${row.lines}라인` : ""
										]
									}) : null]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, { children: num(row.planned) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, { children: num(row.done) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, { children: num(row.left) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-grid px-2 py-1.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-3 min-w-16 flex-1 overflow-hidden rounded-sm bg-slate",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: `h-full ${rateBar(row.rate)}`,
												style: { width: `${Math.round(row.rate * 100)}%` }
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "w-14 text-right font-bold tabular-nums",
											children: pf.format(row.rate)
										})]
									})
								})
							]
						}), openKey === row.key ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							colSpan: 5,
							className: "border border-grid bg-ice px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mb-1 text-xs font-bold",
								children: [
									"미작업 상품 ",
									nf.format(goods.length),
									"종"
								]
							}), goods.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: "미작업 상품이 없습니다."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-full border-collapse text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
									className: "bg-header text-on-dark",
									children: [
										"상품코드",
										"상품명",
										"미작업건수",
										"총작업수량",
										"작업수량",
										"미작업수량"
									].map((label) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "border border-header px-2 py-1 text-left font-bold",
										children: label
									}, label))
								}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: goods.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "bg-paper",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border border-grid px-2 py-1 tabular-nums",
											children: item.code || "-"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border border-grid px-2 py-1",
											children: item.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border border-grid px-2 py-1 text-right font-bold tabular-nums",
											children: num(item.count)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border border-grid px-2 py-1 text-right tabular-nums",
											children: num(item.totalQty)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border border-grid px-2 py-1 text-right tabular-nums",
											children: num(item.workQty)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border border-grid px-2 py-1 text-right font-bold tabular-nums",
											children: num(item.leftQty)
										})
									]
								}, item.key)) })]
							})]
						}) }, `${row.key}-goods`) : null] }, row.key)) })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-3 py-3 text-xs text-muted",
				children: "점포는 ClientNM입니다. 점포 이름을 누르면 피킹 시각이 없는 미작업 상품이 나옵니다. 총작업수량은 주문수량 합, 작업수량은 이미 피킹한 수량, 미작업수량은 아직 피킹하지 않은 주문수량입니다. 완료는 피킹 시각이 있는 건입니다. 유제 냉장은 루트 100번대, FF2는 루트 200번대입니다. 칸을 누르면 정렬됩니다."
			})
		]
	});
}
function LedgerView() {
	return (0, import_jsx_runtime.jsx)(ChulgoView, {});
}
function RouteView({ jobs: all, loaded }) {
	const [center, setCenter] = (0, import_react.useState)("1센터");
	const [dpt, setDpt] = (0, import_react.useState)("전체");
	const grouped = dpt === "10자리 묶음";
	const dataDpt = grouped ? "전체" : dpt;
	const jobs = (0, import_react.useMemo)(() => jobsOf(all, center, dataDpt), [
		all,
		center,
		dataDpt
	]);
	const [sortKey, setSortKey] = (0, import_react.useState)("route");
	const [sortDir, setSortDir] = (0, import_react.useState)("asc");
	const rows = (0, import_react.useMemo)(() => Zn(jobs, grouped), [jobs, grouped]);
	const sorted = (0, import_react.useMemo)(() => {
		const dir = sortDir === "asc" ? 1 : -1;
		return [...rows].sort((a, b) => {
			if (a.route === "없음") return 1;
			if (b.route === "없음") return -1;
			return (sortKey === "route" ? a.route.localeCompare(b.route, "ko", { numeric: true }) : sortKey === "lines" ? a.lineKey - b.lineKey || a.lines.localeCompare(b.lines) : (a[sortKey] ?? (sortDir === "asc" ? Infinity : -Infinity)) - (b[sortKey] ?? (sortDir === "asc" ? Infinity : -Infinity))) * dir;
		});
	}, [
		rows,
		sortKey,
		sortDir
	]);
	const planned = rows.reduce((sum, row) => sum + row.planned, 0);
	const done = rows.reduce((sum, row) => sum + row.done, 0);
	const left = planned - done;
	const first = rows.reduce((min, row) => row.first != null && (min == null || row.first < min) ? row.first : min, null);
	const last = rows.reduce((max, row) => row.last != null && (max == null || row.last > max) ? row.last : max, null);
	const missing = jobs.length > 0 && jobs.every((job) => job.route === "");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ios-sheet",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sticky top-0 z-20 flex items-center border-b border-black/5 bg-white/90 px-3 py-2 backdrop-blur",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "min-w-0 flex-1 truncate text-[17px] font-semibold text-[#1c1c1e]",
					children: "루트"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2 px-3 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CenterSelect, {
					value: center,
					onChange: setCenter
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickMenu, {
					label: "DPT",
					value: dpt,
					onChange: setDpt,
					options: [...In.map((item) => ({
						id: item.id,
						label: item.label
					})), {
						id: "10자리 묶음",
						label: "10자리 묶음"
					}]
				})]
			}),
			!loaded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, { text: "위에서 올린 엑셀의 RTECOD로 루트별 종료를 봅니다." }) : null,
			loaded && jobs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, { text: emptyDpt(dataDpt) }) : null,
			missing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, { text: "이 파일에서 RTECOD 열을 찾지 못했습니다." }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "col-mid w-full min-w-[760px] border-collapse text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
							className: "sr-only",
							children: "루트 작업 종료"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "bg-header text-left text-on-dark",
							children: [
								["route", "루트"],
								...grouped ? [["lines", "라인"]] : [],
								["planned", "작업건수"],
								["done", "완료건수"],
								["left", "잔여건수"],
								["rate", "몇 %"],
								["first", "작업 시작"],
								["last", "작업 종료"]
							].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								scope: "col",
								className: "whitespace-nowrap border border-header p-0 text-center font-bold",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "font-bold text-on-dark",
									onClick: () => {
										if (sortKey === key) setSortDir((dir) => dir === "asc" ? "desc" : "asc");
										else {
											setSortKey(key);
											setSortDir(key === "route" || key === "lines" ? "asc" : "desc");
										}
									},
									children: [label, sortKey === key ? sortDir === "asc" ? " ▲" : " ▼" : ""]
								})
							}, key))
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "bg-slate font-bold",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "row",
									className: "whitespace-nowrap border border-grid px-2 py-1.5 text-left",
									children: "🏭 전체"
								}),
								grouped ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "border border-grid px-2 py-1.5" }) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, { children: num(planned) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, { children: num(done) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, { children: num(left) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, { children: pf.format(planned ? done / planned : 0) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, { children: first == null ? "—" : cr(first) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, { children: last == null ? "—" : cr(last) })
							]
						}), sorted.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
								scope: "row",
								className: "whitespace-nowrap border border-grid px-2 py-1.5 text-left font-bold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: row.route }), row.members ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-0.5 block text-xs font-medium text-muted",
									children: row.members
								}) : null]
							}),
							grouped ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "whitespace-nowrap border border-grid px-2 py-1.5 text-left tabular-nums",
								children: row.lines || "-"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, { children: num(row.planned) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, { children: num(row.done) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, { children: num(row.left) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, { children: pf.format(row.rate) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, { children: row.first == null ? "—" : cr(row.first) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, { children: row.last == null ? "—" : cr(row.last) })
						] }, row.route))] })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "px-3 py-3 text-xs text-muted",
				children: [
					"루트는 각 센터 시트의 RTECOD입니다. 완료는 피킹 시각이 있는 건입니다. 작업 시작과 작업 종료는 그 루트의 첫 피킹과 마지막 피킹입니다.",
					grouped ? " 10자리 묶음은 140과 240처럼 끝 두 자리가 같으면 한 루트로 합칩니다. 라인은 그 루트가 있는 라인입니다." : "",
					" 칸을 누르면 오름차순, 내림차순으로 바뀝니다."
				]
			})
		]
	});
}
function Barcode({ value }) {
	const bars = code128Bars(value);
	if (!bars) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "text-xs text-muted",
		children: "바코드 없음"
	});
	const quiet = 10;
	const width = bars.reduce((sum, bar) => sum + bar, 0) + 20;
	let x = quiet;
	const marks = bars.map((bar, index) => {
		const mark = index % 2 === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x,
			y: "0",
			width: bar,
			height: "36",
			fill: "#1c2833"
		}, index) : null;
		x += bar;
		return mark;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex flex-col items-center gap-0.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			viewBox: `0 0 ${width} 36`,
			width,
			height: 36,
			role: "img",
			"aria-label": `바코드 ${value}`,
			children: marks
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[10px] leading-none font-medium tabular-nums",
			children: value
		})]
	});
}
function Hint({ text = "위에서 엑셀을 올리면 이 표가 채워집니다." }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mx-3 mb-3 rounded-sm bg-yellow px-3 py-3 text-sm font-medium",
		children: text
	});
}
var Route$2 = createFileRoute("/")({ component: Home });
var _0001_center_panel_default = "create table if not exists center_panel (\n  id integer primary key,\n  body text not null,\n  saved_at bigint not null default 0\n);\n";
/**
* Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
* (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
*
* Applied files are keyed by BASENAME, so the same file applies once no matter
* which directory it is globbed from. That is what makes the auth schema safe to
* copy from `migrations/auth/` into `migrations/` when an app turns sign-in on:
* a database that already has `0001_auth.sql` will not re-run it.
*
* Neither applier descends into subdirectories, so `migrations/auth/*.sql` is
* out of scope for both until it is copied up.
*/
/**
* The `_migrations` key for a migration path (or bare filename).
* @param {string} path
* @returns {string}
*/
function migrationName(path) {
	return path.split("/").pop() ?? path;
}
/**
* @param {string} path
* @returns {boolean}
*/
function isMigrationFile(path) {
	return path.endsWith(".sql");
}
/**
* Migrations in `paths` that are not yet in `applied`, in apply order.
* Non-`.sql` entries (a `readdir` also yields `migrations/auth/`) are dropped.
* @param {Iterable<string>} paths
* @param {Iterable<string>} applied
* @returns {Array<{ name: string, path: string }>}
*/
function pendingMigrations(paths, applied) {
	const done = new Set(applied);
	return [...paths].filter(isMigrationFile).map((path) => ({
		name: migrationName(path),
		path
	})).sort((a, b) => a.name.localeCompare(b.name)).filter(({ name }) => !done.has(name));
}
var rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : void 0;
var databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : void 0;
/**
* Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
* sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
* the app has a working database even with nothing configured — the live preview
* included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
*/
var dbSource = databaseUrl ? "neon" : "pglite";
/**
* Init state lives on globalThis as promises: dev HMR creates new instances of
* this module, and two instances racing module-level state would open a second
* pool or run two concurrent PGLite migration passes (whose duplicate
* `_migrations` insert rejects — and would get memoized, poisoning every later
* `getSql()`). A failed init clears its slot so the next call retries.
*/
var globalRef = globalThis;
/**
* Result-type parity: Postgres sends every value as text plus a type OID — the
* JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
* int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
* JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
* production return identical, JSON-safe shapes:
*   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
*                                   `::text` if you ever need huge integers)
*   date                         -> 'YYYY-MM-DD' string
*   interval                     -> Postgres interval text
* numeric already comes back as a string on both (arbitrary precision).
*/
var OID_INT8 = 20;
var OID_DATE = 1082;
var OID_INTERVAL = 1186;
var identity = (v) => v;
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run) {
	const sql = (async (strings, ...values) => {
		let text = strings[0];
		for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	return sql;
}
function createNeonSql() {
	globalRef.__pgSqlPromise__ ??= (async () => {
		const { Pool, types } = await import("../_libs/pg.mjs").then((n) => n.t);
		types.setTypeParser(OID_INT8, Number);
		types.setTypeParser(OID_DATE, identity);
		types.setTypeParser(OID_INTERVAL, identity);
		const pool = new Pool({ connectionString: databaseUrl });
		return toSql(async (text, params) => {
			return (await pool.query(text, params)).rows;
		});
	})().catch((err) => {
		globalRef.__pgSqlPromise__ = void 0;
		throw err;
	});
	return globalRef.__pgSqlPromise__;
}
async function createPgliteSql() {
	globalRef.__pgliteInstance__ ??= (async () => {
		const { PGlite } = await import("../_libs/electric-sql__pglite.mjs").then((n) => n.t);
		const pg = new PGlite({ parsers: {
			[OID_INT8]: Number,
			[OID_DATE]: identity,
			[OID_INTERVAL]: identity
		} });
		await pg.waitReady;
		await pg.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
		return pg;
	})().catch((err) => {
		globalRef.__pgliteInstance__ = void 0;
		throw err;
	});
	const pg = await globalRef.__pgliteInstance__;
	const migrate = async () => {
		const migrations = /* #__PURE__ */ Object.assign({ "/migrations/0001_center_panel.sql": _0001_center_panel_default });
		const done = (await pg.query("select name from _migrations")).rows.map((r) => r.name);
		for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) await pg.transaction(async (tx) => {
			await tx.exec(migrations[path]);
			await tx.query("insert into _migrations (name) values ($1)", [name]);
		});
	};
	const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve()).catch(() => void 0).then(migrate);
	globalRef.__pgliteMigrateChain__ = pass;
	await pass;
	return toSql(async (text, params) => {
		return (await pg.query(text, params)).rows;
	});
}
var sqlPromise = null;
async function createSql() {
	if (typeof window !== "undefined") throw new Error("@/lib/db is server-only — call getSql() from a createServerFn handler or a server route loader, never from client code.");
	return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}
/**
* Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
* otherwise the local PGLite fallback. Memoized — safe to call per request.
*
* Schema comes from `migrations/*.sql`, auto-applied before the first query on
* both backends — define tables there, never inline in server functions.
*/
function getSql() {
	sqlPromise ??= createSql().catch((err) => {
		sqlPromise = null;
		throw err;
	});
	return sqlPromise;
}
/**
* Finish DB bootstrap before the server handles traffic.
*
* - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
*   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
* - **Neon**: no-op (pool is created lazily on first query).
*
* Vite `configureServer` awaits this at dev startup; production imports of this
* module kick it off immediately (see bottom of file).
*/
function ensureDbReady() {
	if (dbSource !== "pglite") return Promise.resolve();
	return getSql().then(() => void 0);
}
var globalBoot = globalThis;
if (typeof window === "undefined" && dbSource === "pglite") globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
	globalBoot.__pgBootstrapPromise__ = void 0;
	console.error("[db] PGLite bootstrap failed:", err);
	throw err;
});
var MAX = 5e5;
function json(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"access-control-allow-origin": "*",
			"access-control-allow-methods": "GET, POST, OPTIONS",
			"access-control-allow-headers": "content-type",
			"cache-control": "no-store"
		}
	});
}
async function readStored() {
	const rows = await (await getSql())`select body from center_panel where id = 1`;
	if (!rows[0]?.body) return {};
	try {
		return asPanel(JSON.parse(rows[0].body));
	} catch {
		return {};
	}
}
async function writeStored(state) {
	await (await getSql())`insert into center_panel (id, body, saved_at) values (1, ${JSON.stringify(state)}, ${Number(state.savedAt) || 0})
    on conflict (id) do update set body = excluded.body, saved_at = excluded.saved_at`;
}
var Route$1 = createFileRoute("/api/panel")({ server: { handlers: {
	OPTIONS: async () => json(null, 204),
	GET: async () => json(await readStored()),
	POST: async ({ request }) => {
		const text = await request.text();
		if (text.length === 0 || text.length > MAX) return json({ error: "너무 큽니다." }, 400);
		let incoming;
		try {
			incoming = asPanel(JSON.parse(text));
		} catch {
			return json({ error: "형식이 아닙니다." }, 400);
		}
		const merged = mergePanel(await readStored(), incoming);
		await writeStored(merged);
		return json(merged);
	}
} } });
var rootRouteChildren = {
	IndexRoute: Route$2.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$3
	}),
	ApiPanelRoute: Route$1.update({
		id: "/api/panel",
		path: "/api/panel",
		getParentRoute: () => Route$3
	})
};
var routeTree = Route$3._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		rewrite: previewPathRewrite(),
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { Tr as n, wr as r, router_exports as t };
