import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { drawnSlots, layoutFor, pillarBox, subscribeLayouts, type LineLayout, type LocSlot } from "@/lib/location-layout";
import { b64ToArrayBuffer, folderHost, readFolders } from "@/lib/folders";
import { readCenters } from "@/lib/read-workbook";
import { OSHIP_DPTS, oshipFileMeta, readOship, type OshipDpt, type OshipRow } from "@/lib/oship";
import { centerList, normalizeLoc, shownSite, LINE_LABELS, type CenterId, type Job } from "@/lib/productivity";
import { CheckMenu, PickMenu } from "@/pick-filter";

const nf = new Intl.NumberFormat("ko-KR");
const LINE_TONE = ["bg-line-1", "bg-line-2", "bg-line-3", "bg-line-4", "bg-line-5", "bg-line-6", "bg-line-7", "bg-line-8"];

type RouteBand = "200" | "300" | "400";

function routeKey(route: string): { band: RouteBand; key: string } | null {
  const digits = String(route).replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits.length >= 3 ? digits.slice(0, 3) : digits);
  if (n >= 100 && n <= 199) return { band: "200", key: String(n + 100) };
  if (n >= 200 && n <= 299) return { band: "200", key: String(n) };
  if (n >= 300 && n <= 399) return { band: "300", key: String(n) };
  if (n >= 400 && n <= 499) return { band: "400", key: String(n) };
  return null;
}

function dptBand(dpt: string): RouteBand | "" {
  if (dpt === "냉동") return "400";
  if (dpt === "FF1편" || dpt === "1차상품") return "300";
  if (dpt === "전체") return "";
  return "200";
}

function toBand(route: string, band: RouteBand): string {
  const hit = routeKey(route);
  if (!hit) return "";
  const base = hit.band === "200" ? Number(hit.key) : hit.band === "300" ? Number(hit.key) - 100 : Number(hit.key) - 200;
  if (base < 200 || base > 299) return "";
  return String(base + (band === "200" ? 0 : band === "300" ? 100 : 200));
}

function isoDay(ms: number) {
  const date = new Date(ms);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

function addDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return "";
  return isoDay(Date.UTC(year, month - 1, day + days));
}

function workDayFor(row: OshipRow) {
  const band = dptBand(row.dpt);
  if (!band || !row.date) return "";
  return band === "200" ? addDays(row.date, -1) : row.date;
}

type PlaceJob = { storeCd?: string; location?: string; at?: number | null; route?: string };

function codeKeys(value: string) {
  const raw = String(value ?? "").replace(/\.0$/, "").replace(/\s/g, "").toUpperCase();
  if (!raw) return [];
  const keys = [raw];
  if (/^\d+$/.test(raw)) {
    const slim = raw.replace(/^0+/, "");
    if (slim && slim !== raw) keys.push(slim);
  }
  return keys;
}

function majorityLoc(box: Map<string, number>) {
  let best = "";
  let count = 0;
  for (const [loc, n] of box) {
    if (n > count || (n === count && loc < best)) {
      best = loc;
      count = n;
    }
  }
  return best;
}

function placeIndex(jobs: PlaceJob[]) {
  const dated = new Map<string, Map<string, number>>();
  const banded = new Map<string, Map<string, number>>();
  const any = new Map<string, Map<string, number>>();
  const add = (map: Map<string, Map<string, number>>, key: string, loc: string) => {
    const box = map.get(key) ?? new Map<string, number>();
    box.set(loc, (box.get(loc) ?? 0) + 1);
    map.set(key, box);
  };
  for (const job of jobs) {
    const loc = normalizeLoc(String(job.location ?? ""));
    if (!loc) continue;
    const day = typeof job.at === "number" ? isoDay(job.at) : "";
    const band = routeKey(String(job.route ?? ""))?.band ?? "";
    for (const code of codeKeys(String(job.storeCd ?? ""))) {
      add(any, code, loc);
      if (band) add(banded, `${code}|${band}`, loc);
      if (day) add(dated, `${code}|${day}|${band}`, loc);
    }
  }
  const pick = (map: Map<string, Map<string, number>>) => {
    const out = new Map<string, string>();
    for (const [key, box] of map) out.set(key, majorityLoc(box));
    return out;
  };
  return { dated: pick(dated), banded: pick(banded), any: pick(any) };
}

function lookupPlace(index: ReturnType<typeof placeIndex>, master: Map<string, string>, row: OshipRow) {
  const band = dptBand(row.dpt);
  const day = workDayFor(row);
  for (const code of codeKeys(row.storeCd)) {
    if (day) {
      const hit = index.dated.get(`${code}|${day}|${band}`) || index.dated.get(`${code}|${day}|`);
      if (hit) return hit;
    }
  }
  for (const code of codeKeys(row.storeCd)) {
    const hit = (band ? index.banded.get(`${code}|${band}`) : "") || index.any.get(code) || master.get(code);
    if (hit) return hit;
  }
  return "";
}
type Part = { year: number; month: number; rows: OshipRow[] };
type Book = { parts: Part[] };
type Hit = { store: string; code: string; count: number; amount: number; days: number; dates: Set<string> };
type Measure = "건수" | "금액" | "오출 일수";
type Sheet = { loc: string; line: number; store: string; code: string };

function money(value: number) {
  return `${nf.format(Math.round(value))}원`;
}

function moneyShort(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(Math.round(value));
  if (abs >= 10000) return `${sign}${nf.format(Math.round(abs / 10000))}만`;
  return sign + nf.format(abs);
}

function shownValue(hit: Hit, measure: Measure) {
  if (measure === "금액") return Math.abs(hit.amount);
  if (measure === "오출 일수") return hit.days;
  return hit.count;
}

function shownLabel(hit: Hit, measure: Measure) {
  if (measure === "금액") return moneyShort(hit.amount);
  return nf.format(measure === "오출 일수" ? hit.days : hit.count);
}

function heatColor(count: number, min: number, max: number) {
  if (!(count > 0) || max <= min) return count > 0 ? "rgb(255, 235, 132)" : "#eef3f6";
  const t = Math.min(1, Math.max(0, (count - min) / (max - min)));
  const mix = (from: number[], to: number[], amount: number) => from.map((value, index) => Math.round(value + (to[index] - value) * amount));
  const green = [99, 190, 123];
  const yellow = [255, 235, 132];
  const red = [248, 105, 107];
  const rgb = t < 0.5 ? mix(green, yellow, t * 2) : mix(yellow, red, (t - 0.5) * 2);
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function shortStoreName(name: string) {
  const raw = String(name ?? "").trim();
  if (raw.length < 9) return raw;
  return raw.replace(/^GS25\s*/i, "").replace(/점$/, "") || raw;
}

function lineMapOf(layout: LineLayout[]) {
  const map = new Map<string, number>();
  for (const item of layout) {
    for (const slot of [...item.left, ...item.right]) if (slot.kind === "loc") map.set(slot.code, item.line);
  }
  return map;
}

function locOfStore(codes: Record<string, string> | undefined) {
  const map = new Map<string, string>();
  if (!codes) return map;
  for (const [loc, code] of Object.entries(codes).sort((a, b) => a[0].localeCompare(b[0]))) {
    for (const key of codeKeys(code)) if (key && !map.has(key)) map.set(key, loc);
  }
  return map;
}

function OshipCell({ slot, hit, side, big, measure, min, max, line }: { slot: LocSlot; hit?: Hit; side: "left" | "right"; big: boolean; measure: Measure; min: number; max: number; line: number }) {
  const box = "grid items-stretch gap-1 overflow-hidden rounded-sm border px-1 " + (big ? "h-11 text-xs" : "h-9 text-[10px]");
  const cols = side === "left" ? " grid-cols-[36px_minmax(0,1fr)]" : " grid-cols-[minmax(0,1fr)_36px]";
  if (slot.kind === "blank") return <div className={box + " border-transparent bg-transparent"} />;
  if (slot.kind === "pillar") {
    const box = pillarBox(slot.span || 1, big);
    return <div className={"loc-pillar grid items-center justify-center overflow-hidden rounded-sm font-bold tracking-widest text-on-dark " + (big ? "text-xs" : "text-[10px]") + box.className} style={box.style}>기둥</div>;
  }
  const value = hit ? shownValue(hit, measure) : 0;
  const label = hit ? shownLabel(hit, measure) : "";
  const code = <span className="flex items-center justify-center truncate text-center font-bold tabular-nums text-ink">{slot.code}</span>;
  const count = (
    <span className={"flex h-full items-center justify-center rounded-sm text-center font-bold tabular-nums " + (value > 0 ? "text-ink" : "text-muted")} style={{ background: heatColor(value, min, max) }}>
      {label}
    </span>
  );
  return (
    <div className={box + cols + (hit?.count ? " cursor-pointer border-grid bg-paper" : " border-[#e4ebf0] bg-[#f7fafc]")} title={hit?.count ? `${slot.code} 건수 ${nf.format(hit.count)} 오출 일수 ${nf.format(hit.days)} 금액 ${money(hit.amount)}` : slot.code} data-loc={hit?.count ? slot.code : undefined} data-line={hit?.count ? line : undefined}>
      {side === "left" ? <>{code}{count}</> : <>{count}{code}</>}
    </div>
  );
}

function Columns({ side, unit }: { side: "left" | "right"; unit: string }) {
  const labels = side === "left" ? ["로케이션", unit] : [unit, "로케이션"];
  return (
    <div className={"grid items-center gap-1 rounded-sm bg-header px-1 py-1 text-[9px] font-bold text-on-dark " + (side === "left" ? "grid-cols-[36px_minmax(0,1fr)]" : "grid-cols-[minmax(0,1fr)_36px]")}>
      {labels.map((label) => <span key={label} className="whitespace-nowrap text-center leading-none">{label}</span>)}
    </div>
  );
}

function escPrint(value: string) {
  return value.replace(/[&<>"]/g, (ch) => {
    if (ch === "&") return ["&", "amp;"].join("");
    if (ch === "<") return ["&", "lt;"].join("");
    if (ch === ">") return ["&", "gt;"].join("");
    return ["&", "quot;"].join("");
  });
}

function printHtml(title: string, body: string) {
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

function monthDay(date: string) {
  const bits = date.split("-").filter(Boolean);
  const day = Number(bits[bits.length - 1]);
  const month = Number(bits.length >= 2 ? bits[bits.length - 2] : "");
  if (!month || !day) return date || "날짜 없음";
  return `${month}월 ${day}일`;
}

function TrendLine({ points, unit }: { points: { date: string; value: number; raw: number }[]; unit: "건" | "수량" | "금액" }) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 260;
  const h = 72;
  const values = points.map((point) => point.value);
  const min = Math.min(0, ...values, 0);
  const max = Math.max(0, ...values, 0);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = values.length <= 1 ? w / 2 : (i / (values.length - 1)) * (w - 8) + 4;
    const y = 16 + (1 - (v - min) / span) * (h - 22);
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const zeroY = 16 + (1 - (0 - min) / span) * (h - 22);
  const area = pts.length ? `${pts[0][0]},${h} ${line} ${pts[pts.length - 1][0]},${h}` : "";
  const hot = hover != null ? pts[hover] : null;
  return (
    <div className="relative mt-1.5 h-[92px] overflow-hidden rounded-xl bg-white px-1.5 py-1 shadow-sm">
      {points.length === 0 ? null : (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="h-full w-full"
          preserveAspectRatio="none"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * w;
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
          }}
        >
          <line x1="0" x2={w} y1={zeroY} y2={zeroY} stroke="#e5e5ea" strokeWidth="1" />
          <polygon points={area} fill="#007aff" opacity="0.12" />
          <polyline points={line} fill="none" stroke="#007aff" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {hot ? <line x1={hot[0]} x2={hot[0]} y1="14" y2={h} stroke="#007aff" strokeOpacity="0.35" strokeWidth="1" vectorEffect="non-scaling-stroke" /> : null}
          {hot ? <circle cx={hot[0]} cy={hot[1]} r="2.4" fill="#007aff" /> : null}
        </svg>
      )}
      {hot && hover != null ? (
        <div className="pointer-events-none absolute left-1/2 top-1 z-10 w-max max-w-[calc(100%-8px)] -translate-x-1/2 truncate whitespace-nowrap rounded-full bg-[#1c1c1e]/80 px-2 py-0.5 text-[10px] font-semibold text-white">
          {monthDay(points[hover].date)} · {unit} {unit === "금액" ? moneyShort(points[hover].raw) : nf.format(points[hover].raw)}
        </div>
      ) : null}
    </div>
  );
}

function chartMarkup(points: { date: string; value: number }[], unit: string) {
  const w = 720;
  const h = 220;
  const left = 58;
  const right = 16;
  const top = 16;
  const bottom = 36;
  const plotW = w - left - right;
  const plotH = h - top - bottom;
  const maxRaw = Math.max(0, ...points.map((point) => point.value));
  const pow = maxRaw > 0 ? 10 ** Math.floor(Math.log10(maxRaw)) : 1;
  const scaled = maxRaw / pow;
  const nice = (scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10) * pow;
  const ceiling = nice || 1;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const label = (value: number) => unit === "금액" ? moneyShort(value) : nf.format(Math.round(value));
  const shortDate = (date: string) => {
    const bits = date.split("-").filter(Boolean);
    const day = Number(bits[bits.length - 1]);
    const month = Number(bits.length >= 2 ? bits[bits.length - 2] : "");
    return month && day ? `${month}/${day}` : date;
  };
  const xAt = (index: number) => points.length <= 1 ? left + plotW / 2 : left + (index / (points.length - 1)) * plotW;
  const yAt = (value: number) => top + (1 - value / ceiling) * plotH;
  const pts = points.map((point, index) => [xAt(index), yAt(point.value)] as const);
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const base = top + plotH;
  const area = pts.length ? `${pts[0][0]},${base} ${line} ${pts[pts.length - 1][0]},${base}` : "";
  const grids = ticks.map((tick) => {
    const y = yAt(ceiling * tick);
    return `<line x1="${left}" x2="${w - right}" y1="${y}" y2="${y}" stroke="#e5e5ea" stroke-width="1"/><text x="${left - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#8e8e93">${escPrint(label(ceiling * tick))}</text>`;
  }).join("");
  const step = Math.max(1, Math.ceil(points.length / 8));
  const dates = points.map((point, index) => {
    if (index % step !== 0 && index !== points.length - 1) return "";
    return `<text x="${xAt(index)}" y="${h - 12}" text-anchor="middle" font-size="11" fill="#8e8e93">${escPrint(shortDate(point.date))}</text>`;
  }).join("");
  const dots = pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#007aff"/>`).join("");
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="180" xmlns="http://www.w3.org/2000/svg" font-family="Malgun Gothic, sans-serif">${grids}<polygon points="${area}" fill="#007aff" opacity="0.12"/><polyline points="${line}" fill="none" stroke="#007aff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${dots}${dates}</svg>`;
}

function PrintButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="h-7 shrink-0 rounded-full bg-[#e5e5ea] px-3 text-[12px] font-semibold text-[#636366]">
      프린트
    </button>
  );
}

export function OshipView({ masters, storeCodes, bandMasters, jobs, open = false }: { masters: Partial<Record<CenterId, Record<string, string>>>; storeCodes: Partial<Record<CenterId, Record<string, string>>>; bandMasters?: { "2센터"?: { FF1?: { places?: Record<string, string>; codes?: Record<string, string> }; FF2?: { places?: Record<string, string>; codes?: Record<string, string> } } }; jobs: Partial<Record<CenterId, Job[]>>; open?: boolean }) {
  const [files, setFiles] = useState<Partial<Record<CenterId, Book>>>({});
  const [extraJobs, setExtraJobs] = useState<Partial<Record<CenterId, PlaceJob[]>>>({});
  const [center, setCenter] = useState<CenterId>("1센터");
  const [yearPick, setYearPick] = useState<number | null>(null);
  const [monthPick, setMonthPick] = useState<number | null>(null);
  const [pickedDpts, setPickedDpts] = useState<string[] | null>(null);
  const [pickedRoutes, setPickedRoutes] = useState<string[] | null>(null);
  const [routeQuery, setRouteQuery] = useState("");
  const [pickedReasons, setPickedReasons] = useState<string[] | null>(null);
  const [storeFind, setStoreFind] = useState("");
  const [measure, setMeasure] = useState<Measure>("건수");
  const [temp, setTemp] = useState<"냉장" | "냉동">("냉장");
  const [mode, setMode] = useState<"로케이션" | "점포" | "상품">("로케이션");
  const [topBy, setTopBy] = useState<"days" | "count" | "amount">("count");
  const [topLines, setTopLines] = useState<number[] | null>(null);
  const [summaryOpen, setSummaryOpen] = useState<null | "reason" | "top" | "miss">(null);
  const [storeSort, setStoreSort] = useState<"name" | "line" | "loc" | "days" | "count" | "qty" | "amount">("count");
  const [storeDir, setStoreDir] = useState<"asc" | "desc">("desc");
  const [productSort, setProductSort] = useState<"name" | "dpt" | "days" | "count" | "qty" | "amount">("count");
  const [productDir, setProductDir] = useState<"asc" | "desc">("desc");
  const [productSheet, setProductSheet] = useState<{ code: string; name: string; dpt: string } | null>(null);
  const [detailRoutes, setDetailRoutes] = useState<string[] | null>(null);
  const [detailStores, setDetailStores] = useState<string[] | null>(null);
  const [detailReasons, setDetailReasons] = useState<string[] | null>(null);
  const [detailRouteQuery, setDetailRouteQuery] = useState("");
  const [detailStoreQuery, setDetailStoreQuery] = useState("");
  const [detailReasonQuery, setDetailReasonQuery] = useState("");
  const [detailSort, setDetailSort] = useState<"date" | "route" | "loc" | "store" | "qty" | "amount" | "reason">("date");
  const [detailDir, setDetailDir] = useState<"asc" | "desc">("asc");
  const [checkedByCenter, setCheckedByCenter] = useState<Partial<Record<CenterId, number[]>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [sheetChart, setSheetChart] = useState<"count" | "qty" | "amount">("count");
  const [sheetSort, setSheetSort] = useState<"date" | "goods" | "qty" | "amount" | "reason">("date");
  const [sheetDir, setSheetDir] = useState<"asc" | "desc">("asc");
  const [sheetDpts, setSheetDpts] = useState<string[] | null>(null);
  const [sheetReasonPick, setSheetReasonPick] = useState<string[] | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const pan = useRef<{ x: number; y: number; left: number; top: number; moved: boolean; loc: string; line: number } | null>(null);
  const [panning, setPanning] = useState(false);
  const [layoutRev, setLayoutRev] = useState(0);
  useEffect(() => subscribeLayouts(() => setLayoutRev((value) => value + 1)), []);
  const book = files[center];
  const layout = useMemo(() => layoutFor(center), [center, layoutRev, shownSite()]);
  const checked = checkedByCenter[center] ?? layout.map((item) => item.line);
  const allLines = layout.every((item) => checked.includes(item.line));
  const lines = layout.filter((item) => checked.includes(item.line));
  const oneLine = lines.length === 1;
  const locOf = useMemo(() => {
    if (shownSite() === "포천" && center === "2센터") {
      const list = temp === "냉동" ? ["냉동"] : OSHIP_DPTS.filter((id) => id !== "냉동");
      const selected = pickedDpts == null ? list : pickedDpts.filter((id) => list.includes(id as OshipDpt));
      const ff2 = selected.length > 0 && selected.every((id) => id === "FF2편");
      const codes = bandMasters?.["2센터"]?.[ff2 ? "FF2" : "FF1"]?.codes;
      if (codes && Object.keys(codes).length > 0) return locOfStore(codes);
    }
    return locOfStore(storeCodes[center]);
  }, [storeCodes, center, bandMasters, temp, pickedDpts]);
  const placeOf = useMemo(() => {
    const index = placeIndex([...(jobs[center] ?? []), ...(extraJobs[center] ?? [])]);
    return (row: OshipRow) => lookupPlace(index, locOf, row);
  }, [jobs, extraJobs, center, locOf]);
  const where = useMemo(() => lineMapOf(layout), [layout]);
  const workRoute = useMemo(() => {
    const empty = () => ({ "200": new Map<string, number>(), "300": new Map<string, number>(), "400": new Map<string, number>() });
    const counts = new Map<string, ReturnType<typeof empty>>();
    const dated = new Map<string, ReturnType<typeof empty>>();
    const options = { "200": new Set<string>(), "300": new Set<string>(), "400": new Set<string>() };
    for (const job of jobs[center] ?? []) {
      const hit = routeKey(String(job.route ?? ""));
      if (!hit) continue;
      options[hit.band].add(hit.key);
      const code = String(job.storeCd ?? "").trim().toUpperCase();
      if (!code) continue;
      const bump = (box: ReturnType<typeof empty>) => {
        box[hit.band].set(hit.key, (box[hit.band].get(hit.key) ?? 0) + 1);
      };
      const box = counts.get(code) ?? empty();
      bump(box);
      counts.set(code, box);
      if (typeof job.at === "number") {
        const key = `${code}|${isoDay(job.at)}`;
        const dayBox = dated.get(key) ?? empty();
        bump(dayBox);
        dated.set(key, dayBox);
      }
    }
    const pick = (box: ReturnType<typeof empty>, band: RouteBand) => [...box[band].entries()].sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))[0]?.[0] ?? "";
    const choose = (box: ReturnType<typeof empty>) => ({ "200": pick(box, "200"), "300": pick(box, "300"), "400": pick(box, "400") }) as Record<RouteBand, string>;
    const byStore = new Map<string, Record<RouteBand, string>>();
    for (const [code, box] of counts) byStore.set(code, choose(box));
    const byStoreDate = new Map<string, Record<RouteBand, string>>();
    for (const [key, box] of dated) byStoreDate.set(key, choose(box));
    const sort = (band: RouteBand) => [...options[band]].sort((a, b) => Number(a) - Number(b));
    return { byStore, byStoreDate, options: { "200": sort("200"), "300": sort("300"), "400": sort("400") } };
  }, [jobs, center]);
  function ownedRoute(row: OshipRow) {
    const band = dptBand(row.dpt);
    if (!band) return "";
    const day = workDayFor(row);
    if (day) return workRoute.byStoreDate.get(`${row.storeCd}|${day}`)?.[band] || toBand(row.route, band);
    return workRoute.byStore.get(row.storeCd)?.[band] || toBand(row.route, band);
  }

  const years = useMemo(() => [...new Set((book?.parts ?? []).map((part) => part.year).filter((year) => year > 0))].sort((a, b) => a - b), [book]);
  const months = useMemo(() => [...new Set((book?.parts ?? []).filter((part) => yearPick == null || part.year === yearPick).map((part) => part.month).filter((month) => month > 0))].sort((a, b) => a - b), [book, yearPick]);
  useEffect(() => {
    if (yearPick != null && !years.includes(yearPick)) setYearPick(null);
  }, [years, yearPick]);
  useEffect(() => {
    if (monthPick != null && !months.includes(monthPick)) setMonthPick(null);
  }, [months, monthPick]);
  const source = useMemo(() => {
    const rows = (book?.parts ?? []).filter((part) => (yearPick == null || part.year === yearPick) && (monthPick == null || part.month === monthPick)).flatMap((part) => part.rows);
    return temp === "냉동" ? rows.filter((row) => row.dpt === "냉동") : rows.filter((row) => row.dpt !== "냉동");
  }, [book, temp, yearPick, monthPick]);
  const dptList = temp === "냉동" ? (["냉동"] as OshipDpt[]) : OSHIP_DPTS.filter((id) => id !== "냉동");
  const selectedDpts = pickedDpts == null ? dptList : pickedDpts.filter((id) => dptList.includes(id as OshipDpt));
  const dptAll = dptList.length === 0 || selectedDpts.length === dptList.length;
  const routeOptions = useMemo(() => {
    const want200 = dptAll || selectedDpts.some((id) => dptBand(id) === "200");
    const want300 = dptAll || selectedDpts.some((id) => dptBand(id) === "300");
    const want400 = dptAll || selectedDpts.some((id) => dptBand(id) === "400");
    return [...(want200 ? workRoute.options["200"] : []), ...(want300 ? workRoute.options["300"] : []), ...(want400 ? workRoute.options["400"] : [])];
  }, [workRoute, dptAll, selectedDpts]);
  const selectedRoutes = pickedRoutes == null ? routeOptions : pickedRoutes.filter((id) => routeOptions.includes(id));
  const routeNeedle = routeQuery.trim().toLowerCase();
  const queriedRoutes = routeNeedle ? routeOptions.filter((id) => id.toLowerCase().includes(routeNeedle)) : selectedRoutes;
  const routeAll = !routeNeedle && (routeOptions.length === 0 || selectedRoutes.length === routeOptions.length);
  const storeNeedle = storeFind.trim().toLowerCase();

  const sliced = useMemo(() => {
    const allowRoute = routeNeedle ? new Set(queriedRoutes) : routeAll ? null : new Set(selectedRoutes);
    return source.filter((row) => {
      if (storeNeedle && !row.storeNm.toLowerCase().includes(storeNeedle) && !row.storeCd.toLowerCase().includes(storeNeedle)) return false;
      const lineMode = temp === "냉장" && mode === "로케이션";
      if (lineMode && !allLines) {
        const loc = placeOf(row);
        const line = loc ? where.get(loc) : undefined;
        if (line == null || !checked.includes(line)) return false;
      }
      if (!(temp === "냉장" && mode === "로케이션")) return true;
      if (!allowRoute) return true;
      return allowRoute.has(ownedRoute(row));
    });
  }, [source, temp, mode, allLines, placeOf, where, checked, routeAll, routeNeedle, queriedRoutes, selectedRoutes, workRoute, storeNeedle]);

  useEffect(() => {
    setPickedRoutes((cur) => {
      if (cur == null) return null;
      const next = cur.filter((id) => routeOptions.includes(id));
      if (next.length === cur.length) return cur;
      return next.length === routeOptions.length ? null : next;
    });
  }, [routeOptions]);

  useEffect(() => {
    if (!sheet && !productSheet && !summaryOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSheet(null);
      setProductSheet(null);
      setSummaryOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet, productSheet, summaryOpen]);
  useEffect(() => {
    if (!summaryOpen) return;
    const onDown = (event: PointerEvent) => {
      const el = event.target;
      if (el instanceof Element && el.closest("[data-summary]")) return;
      setSummaryOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [summaryOpen]);

  const shown = useMemo(() => dptAll ? sliced : sliced.filter((row) => selectedDpts.includes(row.dpt)), [sliced, dptAll, selectedDpts]);
  const reasonOptions = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of shown) map.set(row.reason, (map.get(row.reason) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")).map(([name]) => name);
  }, [shown]);
  const selectedReasons = pickedReasons == null ? reasonOptions : pickedReasons.filter((id) => reasonOptions.includes(id));
  const reasonAll = reasonOptions.length === 0 || selectedReasons.length === reasonOptions.length;
  const onLayout = useMemo(() => {
    if (reasonAll) return shown;
    const allow = new Set(selectedReasons);
    return shown.filter((row) => allow.has(row.reason));
  }, [shown, reasonAll, selectedReasons]);

  const dptTotals = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    for (const id of dptList) map.set(id, { count: 0, amount: 0 });
    for (const row of sliced) {
      const box = map.get(row.dpt) ?? { count: 0, amount: 0 };
      box.count += 1;
      box.amount += row.amount;
      map.set(row.dpt, box);
    }
    return map;
  }, [sliced, dptList]);

  const reasons = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    for (const row of shown) {
      const box = map.get(row.reason) ?? { count: 0, amount: 0 };
      box.count += 1;
      box.amount += row.amount;
      map.set(row.reason, box);
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0], "ko"));
  }, [shown]);

  const hits = useMemo(() => {
    const map = new Map<string, Hit>();
    const pocheon2 = shownSite() === "포천" && center === "2센터";
    const list = temp === "냉동" ? ["냉동"] : OSHIP_DPTS.filter((id) => id !== "냉동");
    const selected = pickedDpts == null ? list : pickedDpts.filter((id) => list.includes(id as OshipDpt));
    const ff2 = pocheon2 && selected.length > 0 && selected.every((id) => id === "FF2편");
    const pack = pocheon2 ? bandMasters?.["2센터"]?.[ff2 ? "FF2" : "FF1"] : undefined;
    const places = pack?.places && Object.keys(pack.places).length > 0 ? pack.places : masters[center];
    const codes = pack?.codes && Object.keys(pack.codes).length > 0 ? pack.codes : storeCodes[center];
    for (const [loc, name] of Object.entries(places ?? {})) {
      const store = name.trim();
      if (!store) continue;
      const code = (codes?.[loc] ?? "").trim().toUpperCase();
      if (storeNeedle && !store.toLowerCase().includes(storeNeedle) && !code.toLowerCase().includes(storeNeedle)) continue;
      map.set(loc, { store, code, count: 0, amount: 0, days: 0, dates: new Set() });
    }
    for (const row of onLayout) {
      const loc = placeOf(row);
      if (!loc) continue;
      const hit = map.get(loc) ?? { store: row.storeNm, code: row.storeCd, count: 0, amount: 0, days: 0, dates: new Set<string>() };
      hit.count += 1;
      hit.amount += row.amount;
      if (row.date) hit.dates.add(row.date);
      hit.days = hit.dates.size;
      if (!hit.store) hit.store = row.storeNm;
      if (!hit.code) hit.code = row.storeCd;
      map.set(loc, hit);
    }
    return map;
  }, [masters, center, onLayout, placeOf, storeCodes, storeNeedle, bandMasters, temp, pickedDpts]);

  const unmatched = useMemo(() => {
    const map = new Map<string, { name: string; count: number; amount: number }>();
    for (const row of onLayout) {
      if (placeOf(row)) continue;
      const box = map.get(row.storeCd) ?? { name: row.storeNm, count: 0, amount: 0 };
      box.count += 1;
      box.amount += row.amount;
      if (!box.name) box.name = row.storeNm;
      map.set(row.storeCd, box);
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count);
  }, [onLayout, placeOf]);

  const rankRows = useMemo(() => {
    if (topLines == null || layout.every((item) => topLines.includes(item.line))) return onLayout;
    const allow = new Set(topLines);
    return onLayout.filter((row) => {
      const loc = placeOf(row);
      const line = loc ? where.get(loc) : undefined;
      return line != null && allow.has(line);
    });
  }, [onLayout, topLines, layout, placeOf, where]);
  const topStores = useMemo(() => {
    const map = new Map<string, { name: string; code: string; loc: string; count: number; amount: number; dates: Set<string> }>();
    for (const row of rankRows) {
      const key = row.storeCd || row.storeNm;
      const box = map.get(key) ?? { name: row.storeNm, code: row.storeCd, loc: placeOf(row) ?? "", count: 0, amount: 0, dates: new Set<string>() };
      box.count += 1;
      box.amount += row.amount;
      if (row.date) box.dates.add(row.date);
      if (!box.name) box.name = row.storeNm;
      if (!box.loc) box.loc = placeOf(row) ?? "";
      map.set(key, box);
    }
    return [...map.values()]
      .map((box) => ({ ...box, days: box.dates.size }))
      .sort((a, b) => {
        const av = topBy === "amount" ? Math.abs(a.amount) : a[topBy];
        const bv = topBy === "amount" ? Math.abs(b.amount) : b[topBy];
        return bv - av || b.count - a.count || a.name.localeCompare(b.name, "ko");
      })
      .slice(0, 10);
  }, [rankRows, placeOf, topBy]);

  const productRows = useMemo(() => {
    const map = new Map<string, { code: string; name: string; dpt: string; count: number; qty: number; amount: number; dates: Set<string> }>();
    for (const row of onLayout) {
      const key = row.goodsCd || row.goods || "상품명 없음";
      const box = map.get(key) ?? { code: row.goodsCd, name: row.goods || "상품명 없음", dpt: row.dpt, count: 0, qty: 0, amount: 0, dates: new Set<string>() };
      box.count += 1;
      box.qty += row.qty;
      box.amount += row.amount;
      if (row.date) box.dates.add(row.date);
      if (!box.name && row.goods) box.name = row.goods;
      map.set(key, box);
    }
    const dir = productDir === "asc" ? 1 : -1;
    return [...map.values()]
      .map((box) => ({ ...box, days: box.dates.size }))
      .sort((a, b) => {
        if (productSort === "name" || productSort === "dpt") return a[productSort].localeCompare(b[productSort], "ko") * dir || b.count - a.count;
        const delta = (a[productSort] - b[productSort]) * dir;
        return delta || b.count - a.count || a.name.localeCompare(b.name, "ko");
      });
  }, [onLayout, productSort, productDir]);
  const storeRows = useMemo(() => {
    const map = new Map<string, { code: string; name: string; loc: string; line: number; count: number; qty: number; amount: number; dates: Set<string> }>();
    for (const row of onLayout) {
      const loc = placeOf(row) ?? "";
      const key = row.storeCd || row.storeNm || "점포명 없음";
      const box = map.get(key) ?? { code: row.storeCd, name: row.storeNm || "점포명 없음", loc, line: loc ? where.get(loc) ?? 0 : 0, count: 0, qty: 0, amount: 0, dates: new Set<string>() };
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
    return [...map.values()]
      .map((box) => ({ ...box, days: box.dates.size }))
      .sort((a, b) => {
        if (storeSort === "name" || storeSort === "loc") return a[storeSort].localeCompare(b[storeSort], "ko") * dir || b.count - a.count;
        return (a[storeSort] - b[storeSort]) * dir || b.count - a.count || a.name.localeCompare(b.name, "ko");
      });
  }, [onLayout, placeOf, where, storeSort, storeDir]);
  const topProducts = useMemo(() => {
    const map = new Map<string, { code: string; name: string; dpt: string; count: number; qty: number; amount: number; dates: Set<string> }>();
    for (const row of rankRows) {
      const key = row.goodsCd || row.goods || "상품명 없음";
      const box = map.get(key) ?? { code: row.goodsCd, name: row.goods || "상품명 없음", dpt: row.dpt, count: 0, qty: 0, amount: 0, dates: new Set<string>() };
      box.count += 1;
      box.qty += row.qty;
      box.amount += row.amount;
      if (row.date) box.dates.add(row.date);
      map.set(key, box);
    }
    return [...map.values()]
      .map((box) => ({ ...box, days: box.dates.size }))
      .sort((a, b) => {
        const av = topBy === "amount" ? Math.abs(a.amount) : a[topBy];
        const bv = topBy === "amount" ? Math.abs(b.amount) : b[topBy];
        return bv - av || b.count - a.count || a.name.localeCompare(b.name, "ko");
      })
      .slice(0, 10);
  }, [rankRows, topBy]);
  const productDetail = useMemo(() => {
    if (!productSheet) return [];
    return onLayout.filter((row) => (productSheet.code ? row.goodsCd === productSheet.code : row.goods === productSheet.name));
  }, [onLayout, productSheet]);
  const routeOf = ownedRoute;
  const detailRouteOptions = useMemo(() => {
    const want200 = productDetail.some((row) => dptBand(row.dpt) === "200");
    const want300 = productDetail.some((row) => dptBand(row.dpt) === "300");
    const want400 = productDetail.some((row) => dptBand(row.dpt) === "400");
    const set = new Set<string>([...(want200 ? workRoute.options["200"] : []), ...(want300 ? workRoute.options["300"] : []), ...(want400 ? workRoute.options["400"] : [])]);
    for (const row of productDetail) {
      if (ownedRoute(row)) set.add(ownedRoute(row));
    }
    return [...set].sort((a, b) => Number(a) - Number(b));
  }, [productDetail, workRoute]);
  const detailStoreOptions = useMemo(() => [...new Set(productDetail.map((row) => row.storeNm || "점포명 없음"))].sort((a, b) => a.localeCompare(b, "ko")), [productDetail]);
  const detailReasonOptions = useMemo(() => [...new Set(productDetail.map((row) => row.reason || "없음"))].sort((a, b) => a.localeCompare(b, "ko")), [productDetail]);
  const detailRouteNeedle = detailRouteQuery.trim().toLowerCase();
  const detailStoreNeedle = detailStoreQuery.trim().toLowerCase();
  const detailReasonNeedle = detailReasonQuery.trim().toLowerCase();
  const pickedDetailRoutes = detailRoutes == null ? detailRouteOptions : detailRoutes.filter((id) => detailRouteOptions.includes(id));
  const pickedDetailStores = detailStores == null ? detailStoreOptions : detailStores.filter((id) => detailStoreOptions.includes(id));
  const pickedDetailReasons = detailReasons == null ? detailReasonOptions : detailReasons.filter((id) => detailReasonOptions.includes(id));
  const detailRouteAll = !detailRouteNeedle && (detailRouteOptions.length === 0 || pickedDetailRoutes.length === detailRouteOptions.length);
  const detailStoreAll = !detailStoreNeedle && (detailStoreOptions.length === 0 || pickedDetailStores.length === detailStoreOptions.length);
  const detailReasonAll = !detailReasonNeedle && (detailReasonOptions.length === 0 || pickedDetailReasons.length === detailReasonOptions.length);
  const visibleProductRows = useMemo(() => {
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
      const av = detailSort === "route" ? routeOf(a) : detailSort === "loc" ? placeOf(a) ?? "" : detailSort === "store" ? a.storeNm : detailSort === "reason" ? a.reason : a.date;
      const bv = detailSort === "route" ? routeOf(b) : detailSort === "loc" ? placeOf(b) ?? "" : detailSort === "store" ? b.storeNm : detailSort === "reason" ? b.reason : b.date;
      return av.localeCompare(bv, "ko", { numeric: true }) * dir || a.date.localeCompare(b.date);
    });
  }, [productDetail, workRoute, placeOf, detailRouteNeedle, detailStoreNeedle, detailReasonNeedle, detailRouteAll, detailStoreAll, detailReasonAll, pickedDetailRoutes, pickedDetailStores, pickedDetailReasons, detailSort, detailDir]);
  useEffect(() => {
    setDetailRoutes(null);
    setDetailStores(null);
    setDetailReasons(null);
    setDetailRouteQuery("");
    setDetailStoreQuery("");
    setDetailReasonQuery("");
  }, [productSheet?.code, productSheet?.name]);
  const productSum = useMemo(() => {
    const dates = new Set<string>();
    let qty = 0;
    let amount = 0;
    for (const row of visibleProductRows) {
      qty += row.qty;
      amount += row.amount;
      if (row.date) dates.add(row.date);
    }
    return { days: dates.size, count: visibleProductRows.length, qty, amount };
  }, [visibleProductRows]);

  const totals = useMemo(() => {
    const dates = new Set<string>();
    let count = 0;
    let amount = 0;
    for (const row of onLayout) {
      count += 1;
      amount += row.amount;
      if (row.date) dates.add(row.date);
    }
    return { count, amount, days: dates.size };
  }, [onLayout]);
  const sheetRows = useMemo(() => {
    if (!sheet) return [];
    const dir = sheetDir === "asc" ? 1 : -1;
    const text = sheetSort === "date" || sheetSort === "goods" || sheetSort === "reason";
    return onLayout
      .filter((row) => (sheet.code && row.storeCd === sheet.code) || placeOf(row) === sheet.loc)
      .slice()
      .sort((a, b) => text ? a[sheetSort].localeCompare(b[sheetSort], "ko") * dir || a.goods.localeCompare(b.goods, "ko") : (a[sheetSort] - b[sheetSort]) * dir || a.date.localeCompare(b.date));
  }, [onLayout, sheet, placeOf, sheetSort, sheetDir]);
  const sheetDptOptions = useMemo(() => {
    const found = new Set<string>();
    for (const row of sheetRows) if (row.dpt) found.add(row.dpt);
    return [...found];
  }, [sheetRows]);
  const sheetReasonChoices = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of sheetRows) map.set(row.reason, (map.get(row.reason) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")).map(([name]) => name);
  }, [sheetRows]);
  const pickedSheetDpts = sheetDpts == null ? sheetDptOptions : sheetDpts.filter((id) => sheetDptOptions.includes(id));
  const sheetDptAll = sheetDptOptions.length === 0 || pickedSheetDpts.length === sheetDptOptions.length;
  const pickedSheetReasons = sheetReasonPick == null ? sheetReasonChoices : sheetReasonPick.filter((id) => sheetReasonChoices.includes(id));
  const sheetReasonAll = sheetReasonChoices.length === 0 || pickedSheetReasons.length === sheetReasonChoices.length;
  const visibleSheetRows = useMemo(() => sheetRows.filter((row) => (sheetDptAll || pickedSheetDpts.includes(row.dpt)) && (sheetReasonAll || pickedSheetReasons.includes(row.reason))), [sheetRows, sheetDptAll, pickedSheetDpts, sheetReasonAll, pickedSheetReasons]);
  useEffect(() => {
    setSheetDpts(null);
    setSheetReasonPick(null);
    setSheetChart("count");
  }, [sheet?.code, sheet?.loc, sheet?.line]);
  const sheetTrend = useMemo(() => {
    const map = new Map<string, { count: number; qty: number; amount: number }>();
    for (const row of visibleSheetRows) {
      const box = map.get(row.date) ?? { count: 0, qty: 0, amount: 0 };
      box.count += 1;
      box.qty += row.qty;
      box.amount += row.amount;
      map.set(row.date, box);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, box]) => ({ date, ...box }));
  }, [visibleSheetRows]);
  const sheetSum = useMemo(() => {
    const dates = new Set<string>();
    const reasons = new Map<string, { count: number; amount: number }>();
    let count = 0;
    let qty = 0;
    let amount = 0;
    for (const row of visibleSheetRows) {
      count += 1;
      qty += row.qty;
      amount += row.amount;
      if (row.date) dates.add(row.date);
      const box = reasons.get(row.reason) ?? { count: 0, amount: 0 };
      box.count += 1;
      box.amount += row.amount;
      reasons.set(row.reason, box);
    }
    return {
      count,
      qty,
      amount,
      days: dates.size,
      reasons: [...reasons.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0], "ko")),
    };
  }, [visibleSheetRows]);

  async function upload(list: File[]) {
    if (!list?.length) return;
    setBusy(true);
    setError("");
    try {
      const incoming: Partial<Record<CenterId, Part[]>> = {};
      const incomingJobs: Partial<Record<CenterId, PlaceJob[]>> = {};
      const missed: string[] = [];
      for (const file of list) {
        const meta = oshipFileMeta(file.name, center);
        const buf = await file.arrayBuffer();
        const rows = await readOship(buf);
        if (rows.length) {
          const parts = incoming[meta.center] ?? [];
          const found = parts.find((part) => part.year === meta.year && part.month === meta.month);
          if (found) found.rows = found.rows.concat(rows);
          else parts.push({ year: meta.year, month: meta.month, rows });
          incoming[meta.center] = parts;
          continue;
        }
        try {
          const parsed = await readCenters(buf, meta.center);
          let placed = 0;
          for (const id of centerList()) {
            const slim = (parsed.centers[id] ?? []).flatMap((job) => {
              const storeCd = String(job.storeCd ?? "").trim();
              const location = String(job.location ?? "").trim();
              if (!storeCd || !location) return [];
              placed += 1;
              return [{ storeCd, location, at: typeof job.at === "number" ? job.at : null, route: String(job.route ?? "") }];
            });
            if (slim.length) incomingJobs[id] = [...(incomingJobs[id] ?? []), ...slim];
          }
          if (!placed) missed.push(file.name);
        } catch {
          missed.push(file.name);
        }
      }
      setFiles((prev) => {
        const next = { ...prev };
        for (const id of centerList()) {
          const added = incoming[id];
          if (!added) continue;
          const parts = [...(prev[id]?.parts ?? [])];
          for (const part of added) {
            const at = parts.findIndex((item) => item.year === part.year && item.month === part.month);
            if (at >= 0) parts[at] = { ...parts[at], rows: parts[at].rows.concat(part.rows) };
            else parts.push(part);
          }
          next[id] = { parts };
        }
        return next;
      });
      setExtraJobs((prev) => {
        const next = { ...prev };
        for (const id of centerList()) {
          const added = incomingJobs[id];
          if (added?.length) next[id] = [...(prev[id] ?? []), ...added];
        }
        return next;
      });
      if (missed.length) setError(`${missed.join(", ")} 에서 점포코드(ClientCD) 열을 찾지 못했습니다.`);
    } catch {
      setError("엑셀을 읽지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  const uploadRef = useRef(upload);
  uploadRef.current = upload;
  const wrongAsked = useRef("");
  useEffect(() => {
    const host = folderHost();
    if (!host?.addEventListener) return;
    const onMessage = (event: { data: unknown }) => {
      try {
        const data = (typeof event.data === "string" ? JSON.parse(event.data) : event.data) as { type?: string; files?: { name?: string; b64?: string }[] };
        if (data?.type !== "oship-files" || !Array.isArray(data.files)) return;
        const files = data.files.filter((item) => item.b64).map((item) => new File([b64ToArrayBuffer(item.b64 || "")], item.name || "오출.xlsx"));
        if (files.length) void uploadRef.current(files);
      } catch { /* 다른 메시지 */ }
    };
    host.addEventListener("message", onMessage);
    return () => host.removeEventListener?.("message", onMessage);
  }, []);
  useEffect(() => {
    if (!open) return;
    const path = readFolders().wrong;
    if (!path || wrongAsked.current === path) return;
    wrongAsked.current = path;
    folderHost()?.postMessage("read-folder:wrong");
  }, [open]);

  const masterReady = Object.keys(masters[center] ?? {}).length > 0;

  function startPan(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, select, input, a, label")) return;
    const board = boardRef.current;
    if (!board) return;
    const node = (event.target as HTMLElement).closest("[data-loc]");
    const loc = node?.getAttribute("data-loc") ?? "";
    const line = Number(node?.getAttribute("data-line") ?? "0");
    pan.current = { x: event.clientX, y: event.clientY, left: board.scrollLeft, top: board.scrollTop, moved: false, loc, line };
  }
  function movePan(event: ReactPointerEvent<HTMLDivElement>) {
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
  function endPan(event: ReactPointerEvent<HTMLDivElement>) {
    const start = pan.current;
    pan.current = null;
    setPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (event.type === "pointercancel" || !start || start.moved || !start.loc) return;
    const hit = hits.get(start.loc);
    if (!hit?.count) return;
    setSheet({ loc: start.loc, line: start.line, store: hit.store, code: hit.code });
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f2f2f7]">
      <div className="relative z-40 flex shrink-0 flex-wrap items-center gap-2 bg-[#f2f2f7] px-3 py-2">
        <PickMenu label="센터" value={center} onChange={(id) => { setCenter(id as CenterId); setYearPick(null); setMonthPick(null); setPickedDpts(null); setPickedRoutes(null); setRouteQuery(""); setPickedReasons(null); setProductSheet(null); }} options={centerList().map((id) => ({ id, label: id }))} />
        {years.length > 0 ? <PickMenu label="년" value={yearPick == null ? "전체" : String(yearPick)} onChange={(id) => { setYearPick(id === "전체" ? null : Number(id)); setMonthPick(null); }} options={[{ id: "전체", label: "전체" }, ...years.map((year) => ({ id: String(year), label: `${year}년` }))]} /> : null}
        {months.length > 0 ? <PickMenu label="월" value={monthPick == null ? "전체" : String(monthPick)} onChange={(id) => setMonthPick(id === "전체" ? null : Number(id))} options={[{ id: "전체", label: "전체" }, ...months.map((month) => ({ id: String(month), label: `${month}월` }))]} /> : null}
        {temp === "냉장" && mode === "로케이션" ? (
        <CheckMenu
          label="라인"
          text={allLines ? "전체" : checked.length === 0 ? "선택 없음" : checked.slice().sort((a, b) => a - b).map((n) => `${n}라인`).join(", ")}
          rows={[
            { id: "전체", label: "전체", checked: allLines },
            ...layout.map((item) => ({
              id: String(item.line),
              label: LINE_LABELS[item.line - 1].replace(/^\S+\s/, ""),
              checked: checked.includes(item.line),
              swatch: LINE_TONE[item.line - 1],
            })),
          ]}
          onToggle={(id) => {
            if (id === "전체") {
              setCheckedByCenter((prev) => ({ ...prev, [center]: allLines ? [] : layout.map((row) => row.line) }));
              return;
            }
            const line = Number(id);
            setCheckedByCenter((prev) => {
              const current = prev[center] ?? layout.map((row) => row.line);
              const next = current.includes(line) ? current.filter((n) => n !== line) : [...current, line].sort((a, b) => a - b);
              return { ...prev, [center]: next };
            });
          }}
        />
        ) : null}
        <CheckMenu
          label="DPT"
          text={dptAll ? "전체" : selectedDpts.length === 0 ? "선택 없음" : selectedDpts.join(", ")}
          rows={[
            { id: "전체", label: "전체", checked: dptAll && dptList.length > 0 },
            ...dptList.map((id) => ({ id, label: id, checked: selectedDpts.includes(id) })),
          ]}
          onToggle={(id) => {
            if (id === "전체") {
              setPickedDpts(dptAll ? [] : null);
              return;
            }
            const current = pickedDpts == null ? [...dptList] : pickedDpts.filter((item) => dptList.includes(item as OshipDpt));
            const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
            setPickedDpts(dptList.every((item) => next.includes(item)) ? null : next);
          }}
        />
        {temp === "냉장" && mode === "로케이션" ? (
        <CheckMenu
          label="루트"
          search
          searchLabel="루트 검색"
          onSearch={(next) => {
            setRouteQuery(next);
            if (!next.trim()) setPickedRoutes(null);
          }}
          text={routeQuery.trim() ? routeQuery.trim() : routeAll ? "전체" : selectedRoutes.length === 0 ? "선택 없음" : selectedRoutes.join(", ")}
          rows={[
            { id: "전체", label: "전체", checked: !routeNeedle && routeAll && routeOptions.length > 0 },
            ...routeOptions.map((id) => ({ id, label: id, checked: routeNeedle ? id.toLowerCase().includes(routeNeedle) : selectedRoutes.includes(id) })),
          ]}
          onToggle={(id) => {
            setRouteQuery("");
            if (id === "전체") {
              setPickedRoutes(routeAll ? [] : null);
              return;
            }
            const current = pickedRoutes == null ? [...routeOptions] : pickedRoutes.filter((item) => routeOptions.includes(item));
            const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
            setPickedRoutes(routeOptions.every((item) => next.includes(item)) ? null : next);
          }}
        />
        ) : null}
        <CheckMenu
          label="사유"
          text={reasonAll ? "전체" : selectedReasons.length === 0 ? "선택 없음" : selectedReasons.join(", ")}
          rows={[
            { id: "전체", label: "전체", checked: reasonAll && reasonOptions.length > 0 },
            ...reasonOptions.map((id) => ({ id, label: id, checked: selectedReasons.includes(id) })),
          ]}
          onToggle={(id) => {
            if (id === "전체") {
              setPickedReasons(reasonAll ? [] : null);
              return;
            }
            const current = pickedReasons == null ? reasonOptions : pickedReasons.filter((item) => reasonOptions.includes(item));
            const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
            setPickedReasons(reasonOptions.every((item) => next.includes(item)) ? null : next);
          }}
        />
        <input
          value={storeFind}
          onChange={(event) => setStoreFind(event.target.value)}
          placeholder="점포 검색"
          aria-label="점포 검색"
          className="h-10 w-36 rounded-xl border border-black/10 bg-white px-3 text-sm text-[#1c1c1e] outline-none placeholder:text-[#8e8e93]"
        />
        {temp === "냉장" && mode === "로케이션" ? <PickMenu label="표시" value={measure} onChange={(id) => setMeasure(id as Measure)} options={[{ id: "건수", label: "건수" }, { id: "금액", label: "금액" }, { id: "오출 일수", label: "오출 일수" }]} /> : null}
        <label className="inline-flex h-10 cursor-pointer items-center rounded-xl bg-[#007aff] px-3 text-sm font-semibold text-white">
          {busy ? "읽는 중" : "엑셀 올리기"}
          <input type="file" accept=".xlsx,.xls,.xlsm" multiple className="sr-only" disabled={busy} onChange={(event) => { const list = [...(event.target.files ?? [])]; event.target.value = ""; void upload(list); }} />
        </label>
        {book || extraJobs[center]?.length ? <button type="button" className="h-10 rounded-xl bg-[#8e8e93] px-3 text-sm font-semibold text-white" onClick={() => { setFiles((prev) => ({ ...prev, [center]: undefined })); setExtraJobs((prev) => ({ ...prev, [center]: undefined })); setYearPick(null); setMonthPick(null); }}>이 센터 지우기</button> : null}
        <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
          <div className="relative flex h-7 w-[132px] rounded-full bg-[#e5e5ea] p-0.5">
            <span className="absolute top-0.5 left-0.5 h-6 w-[64px] rounded-full bg-white shadow-sm transition-transform duration-200" style={{ transform: temp === "냉동" ? "translateX(64px)" : "translateX(0)" }} />
            {(["냉장", "냉동"] as const).map((id) => (
              <button key={id} type="button" className={"relative z-10 h-6 w-[64px] text-xs font-semibold " + (temp === id ? "text-[#1c1c1e]" : "text-[#8e8e93]")} onClick={() => {
                setTemp(id);
                setSheet(null);
                setProductSheet(null);
              }}>{id}</button>
            ))}
          </div>
          <div className="relative flex h-7 w-[196px] rounded-full bg-[#e5e5ea] p-0.5">
            <span className="absolute top-0.5 left-0.5 h-6 w-16 rounded-full bg-white shadow-sm transition-transform duration-200" style={{ transform: `translateX(${["로케이션", "점포", "상품"].indexOf(mode) * 64}px)` }} />
            {(["로케이션", "점포", "상품"] as const).map((id) => (
              <button key={id} type="button" className={"relative z-10 h-6 w-16 text-[11px] font-semibold " + (mode === id ? "text-[#1c1c1e]" : "text-[#8e8e93]")} onClick={() => { setMode(id); setSheet(null); setProductSheet(null); }}>{id}</button>
            ))}
          </div>
        </div>
      </div>
      {error ? <p className="shrink-0 px-3 pb-1 text-xs font-semibold text-[#c0392b]">{error}</p> : null}
      {book ? (
          <div className={"shrink-0 space-y-2 px-3 pb-2 " + (summaryOpen ? "relative z-30" : "")}>
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[11px] font-semibold text-muted shadow-sm">건수 <b className="ml-1 tabular-nums text-ink">{nf.format(totals.count)}</b></span>
              <span className="inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[11px] font-semibold text-muted shadow-sm">금액 <b className="ml-1 tabular-nums text-ink">{money(totals.amount)}</b></span>
              <span className="inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[11px] font-semibold text-muted shadow-sm">오출 일수 <b className="ml-1 tabular-nums text-ink">{nf.format(totals.days)}</b></span>
              {dptList.map((id) => {
                const box = dptTotals.get(id) ?? { count: 0, amount: 0 };
                const on = !dptAll && selectedDpts.includes(id);
                return (
                  <button key={id} type="button" onClick={() => {
                    const current = pickedDpts == null ? [...dptList] : pickedDpts.filter((item) => dptList.includes(item as OshipDpt));
                    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
                    setPickedDpts(dptList.every((item) => next.includes(item)) ? null : next);
                  }} className={"inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold shadow-sm " + (on ? "bg-[#007aff] text-white" : "bg-white text-ink")}>
                    {id}
                    <span className="tabular-nums">{nf.format(box.count)}</span>
                    <span className={"tabular-nums " + (on ? "text-white/80" : "text-muted")}>{moneyShort(box.amount)}</span>
                  </button>
                );
              })}
            </div>
            <div className={"grid gap-2 " + (temp === "냉장" && mode === "로케이션" ? "md:grid-cols-3" : "md:grid-cols-2")}>
              <div className="relative h-24">
              <div data-summary="" className={"rounded-2xl bg-white text-xs shadow-sm " + (summaryOpen === "reason" ? "absolute inset-x-0 top-0 z-30 max-h-[420px] overflow-auto shadow-[0_16px_40px_rgba(0,0,0,0.18)]" : "h-24 overflow-auto")}>
                <table className="w-full border-collapse text-xs">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-muted">
                      <th className="px-3 py-1 text-left"><button type="button" className="font-semibold text-ink" onClick={() => setSummaryOpen((cur) => cur === "reason" ? null : "reason")}>미오출사유</button></th>
                      <th className="px-3 py-1 text-right">건수</th>
                      <th className="px-3 py-1 text-right">금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reasons.map(([name, box]) => (
                      <tr key={name} className="border-t border-black/5">
                        <td className="px-3 py-0.5">{name}</td>
                        <td className="px-3 py-0.5 text-right tabular-nums">{nf.format(box.count)}</td>
                        <td className="px-3 py-0.5 text-right tabular-nums">{money(box.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
              <div className="relative h-24">
              <div data-summary="" className={"rounded-2xl bg-white text-xs shadow-sm " + (summaryOpen === "top" ? "absolute inset-x-0 top-0 z-30 max-h-[420px] shadow-[0_16px_40px_rgba(0,0,0,0.18)]" : "h-24")}>
                <div className="relative z-20 flex items-center justify-between gap-2 px-3 pt-1.5">
                  <button type="button" className="font-semibold text-ink" onClick={() => setSummaryOpen((cur) => cur === "top" ? null : "top")}>상위 10점</button>
                  <div className="flex items-center gap-1">
                    <CheckMenu
                      compact
                      soft
                      end
                      label="라인"
                      text={topLines == null || layout.every((item) => topLines.includes(item.line)) ? "전체" : topLines.length === 0 ? "없음" : topLines.slice().sort((a, b) => a - b).map((n) => `${n}라인`).join(", ")}
                      rows={[
                        { id: "전체", label: "전체", checked: topLines == null || layout.every((item) => topLines.includes(item.line)) },
                        ...layout.map((item) => ({
                          id: String(item.line),
                          label: LINE_LABELS[item.line - 1].replace(/^\S+\s/, ""),
                          checked: topLines == null || topLines.includes(item.line),
                          swatch: LINE_TONE[item.line - 1],
                        })),
                      ]}
                      onToggle={(id) => {
                        const all = topLines == null || layout.every((item) => topLines.includes(item.line));
                        if (id === "전체") {
                          setTopLines(all ? [] : null);
                          return;
                        }
                        const line = Number(id);
                        const current = topLines == null ? layout.map((row) => row.line) : topLines;
                        const next = current.includes(line) ? current.filter((n) => n !== line) : [...current, line].sort((a, b) => a - b);
                        setTopLines(layout.every((item) => next.includes(item.line)) ? null : next);
                      }}
                    />
                    <div className="flex rounded-full bg-[#f2f2f7] p-0.5">
                      {([["days", "일수"], ["count", "건수"], ["amount", "금액"]] as const).map(([id, label]) => (
                        <button key={id} type="button" onClick={() => setTopBy(id)} className={"h-5 rounded-full px-2 text-[10px] font-semibold " + (topBy === id ? "bg-white text-[#007aff] shadow-sm" : "text-[#8e8e93]")}>{label}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <ol className={"space-y-0.5 overflow-auto px-3 pb-1.5 " + (summaryOpen === "top" ? "max-h-[360px]" : "max-h-16")}>
                  {(mode === "상품" ? topProducts : topStores).map((box, index) => (
                    <li key={box.code || box.name}>
                      <button type="button" className="flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-left hover:bg-[#e8f2ff]" onClick={() => {
                        if (mode === "상품") {
                          const hit = topProducts[index];
                          if (hit) setProductSheet({ code: hit.code, name: hit.name, dpt: hit.dpt });
                          return;
                        }
                        const hit = topStores[index];
                        if (!hit) return;
                        setSheet({ loc: hit.loc, line: hit.loc ? where.get(hit.loc) ?? 0 : 0, store: hit.name || hit.code, code: hit.code });
                      }}>
                        <span className="w-4 shrink-0 tabular-nums text-muted">{index + 1}</span>
                        <span className="min-w-0 flex-1 truncate font-semibold text-[#007aff]">{box.name || box.code}</span>
                        <span className="shrink-0 tabular-nums text-muted">{topBy === "days" ? `${nf.format(box.days)}일` : topBy === "count" ? `${nf.format(box.count)}건` : moneyShort(box.amount)}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
              </div>
              {temp === "냉장" && mode === "로케이션" ? (
              <div className="relative h-24">
              <div data-summary="" className={"rounded-2xl bg-white px-3 py-1.5 text-xs shadow-sm " + (summaryOpen === "miss" ? "absolute inset-x-0 top-0 z-30 max-h-[420px] overflow-auto shadow-[0_16px_40px_rgba(0,0,0,0.18)]" : "h-24 overflow-auto")}>
                <button type="button" className="font-semibold text-ink" onClick={() => setSummaryOpen((cur) => cur === "miss" ? null : "miss")}>점포코드로 못 찾은 점포 {nf.format(unmatched.length)}</button>
                {unmatched.length === 0 ? <p className="mt-1 text-muted">{masterReady ? "올린 점포가 배치표 점포코드와 맞습니다." : "배치표를 올리면 점포명이 로케이션에 붙습니다."}</p> : (
                  <ul className="mt-1 space-y-0.5">
                    {unmatched.map(([code, box]) => (
                      <li key={code}>
                        <button type="button" className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-0.5 text-left hover:bg-[#e8f2ff]" onClick={() => setSheet({ loc: "", line: 0, store: box.name || code, code })}>
                          <span className="truncate font-semibold text-[#007aff]">{box.name || code}</span>
                          <span className="shrink-0 tabular-nums text-muted">{nf.format(box.count)} · {moneyShort(box.amount)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              </div>
              ) : null}
            </div>
          </div>
      ) : <p className="shrink-0 px-3 pb-1 text-[11px] font-semibold text-muted">{temp === "냉동" ? "오출 엑셀을 올리면 냉동 오출이 나옵니다." : mode === "상품" ? "오출 엑셀을 올리면 냉동을 뺀 상품 오출이 나옵니다." : mode === "점포" ? "오출 엑셀을 올리면 점포 오출이 나옵니다." : "오출 엑셀을 올리면 건수와 금액이 칸에 칠해집니다."}</p>}
      {temp === "냉동" && mode === "로케이션" ? <div className="min-h-0 flex-1" /> : mode === "상품" ? (
        <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
          {!book ? null : productRows.length === 0 ? <p className="px-2 py-6 text-sm font-bold text-muted">{temp === "냉동" ? "냉동 상품 오출이 없습니다." : "냉동을 뺀 상품 오출이 없습니다."}</p> : (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="sticky top-0 bg-white text-[11px] text-[#8e8e93]">
                    {([["name", "상품명"], ["dpt", "DPT"], ["days", "일수"], ["count", "건"], ["qty", "수량"], ["amount", "금액"]] as const).map(([key, label]) => (
                      <th key={key} className={"px-3 py-2 font-medium " + (key === "name" || key === "dpt" ? "text-left" : "text-right")}>
                        <button type="button" className="bg-transparent font-medium text-[#8e8e93]" onClick={() => {
                          if (productSort === key) setProductDir((dir) => dir === "asc" ? "desc" : "asc");
                          else {
                            setProductSort(key);
                            setProductDir(key === "name" || key === "dpt" ? "asc" : "desc");
                          }
                        }}>{label}{productSort === key ? productDir === "asc" ? " ▲" : " ▼" : ""}</button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productRows.map((row) => (
                    <tr key={row.code || row.name} className="cursor-pointer border-t border-black/[0.06] hover:bg-[#f2f2f7]" onClick={() => setProductSheet({ code: row.code, name: row.name, dpt: row.dpt })}>
                      <td className="px-3 py-2 font-semibold text-[#1c1c1e]">{row.name}</td>
                      <td className="px-3 py-2 text-[#3a3a3c]">{row.dpt}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{nf.format(row.days)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{nf.format(row.count)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{nf.format(row.qty)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{moneyShort(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : mode === "점포" ? (
        <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
          {!book ? null : storeRows.length === 0 ? <p className="px-2 py-6 text-sm font-bold text-muted">{temp === "냉동" ? "냉동 점포 오출이 없습니다." : "점포 오출이 없습니다."}</p> : (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="sticky top-0 bg-white text-[11px] text-[#8e8e93]">
                    {([["name", "점포명"], ["days", "일수"], ["count", "건"], ["qty", "수량"], ["amount", "금액"]] as const).map(([key, label]) => (
                      <th key={key} className={"px-3 py-2 font-medium " + (key === "name" ? "text-left" : "text-right")}>
                        <button type="button" className="bg-transparent font-medium text-[#8e8e93]" onClick={() => {
                          if (storeSort === key) setStoreDir((dir) => dir === "asc" ? "desc" : "asc");
                          else {
                            setStoreSort(key);
                            setStoreDir(key === "name" ? "asc" : "desc");
                          }
                        }}>{label}{storeSort === key ? storeDir === "asc" ? " ▲" : " ▼" : ""}</button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {storeRows.map((row) => (
                    <tr key={row.code || row.name} className="cursor-pointer border-t border-black/[0.06] hover:bg-[#f2f2f7]" onClick={() => setSheet({ loc: row.loc, line: row.loc ? where.get(row.loc) ?? 0 : 0, store: row.name, code: row.code })}>
                      <td className="px-3 py-2 font-semibold text-[#1c1c1e]">{row.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{nf.format(row.days)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{nf.format(row.count)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{nf.format(row.qty)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{moneyShort(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
      <div ref={boardRef} className={"min-h-0 flex-1 overflow-auto bg-bg px-3 py-3 " + (panning ? "cursor-grabbing select-none" : "cursor-grab")} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan}>
            {lines.length === 0 ? <p className="px-2 py-6 text-sm font-bold text-muted">볼 라인을 체크해 주세요.</p> : (
              <div className="flex gap-3" style={{ width: lines.length * (oneLine ? 720 : 600) + Math.max(0, lines.length - 1) * 12 }}>
                {lines.map((item) => {
                  let lineCount = 0;
                  let lineAmount = 0;
                  const lineDates = new Set<string>();
                  const values: number[] = [];
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
                  const bar = "px-2 py-1.5 text-center text-sm font-bold " + LINE_TONE[item.line - 1] + (item.line === 3 ? " text-ink" : " text-on-dark");
                  const head = measure === "금액" ? moneyShort(lineAmount) : measure === "오출 일수" ? `${nf.format(lineDates.size)}일` : nf.format(lineCount);
                  return (
                    <section key={item.line} className={"shrink-0 overflow-hidden rounded-md border border-grid bg-paper shadow-sm " + (oneLine ? "w-[720px]" : "w-[600px]")}>
                      <h3 className={bar}>{LINE_LABELS[item.line - 1]}<span className="ml-2 tabular-nums">{head}</span></h3>
                      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_10px_minmax(0,1fr)] gap-1 p-1.5">
                        <div className="grid min-w-0 content-start gap-0.5 overflow-hidden">
                          <Columns side="left" unit={measure} />
                          {drawnSlots(item.left).map((drawn) => <OshipCell key={`L${drawn.index}`} slot={drawn.span > 1 ? { ...drawn.slot, span: drawn.span } : drawn.slot} side="left" big={oneLine} measure={measure} min={min} max={max} line={item.line} hit={drawn.slot.kind === "loc" ? hits.get(drawn.slot.code) : undefined} />)}
                          <Columns side="left" unit={measure} />
                        </div>
                        <div className="loc-aisle rounded-sm" />
                        <div className="grid min-w-0 content-start gap-0.5 overflow-hidden">
                          <Columns side="right" unit={measure} />
                          {drawnSlots(item.right).map((drawn) => <OshipCell key={`R${drawn.index}`} slot={drawn.span > 1 ? { ...drawn.slot, span: drawn.span } : drawn.slot} side="right" big={oneLine} measure={measure} min={min} max={max} line={item.line} hit={drawn.slot.kind === "loc" ? hits.get(drawn.slot.code) : undefined} />)}
                          <Columns side="right" unit={measure} />
                        </div>
                      </div>
                      <h3 className={bar}>{LINE_LABELS[item.line - 1]}<span className="ml-2 tabular-nums">{head}</span></h3>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
      )}
      {sheet && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6" onClick={() => setSheet(null)}>
          <div role="dialog" aria-modal="true" aria-label={sheet.line ? `${sheet.line}라인 오출` : "오출"} className="flex h-[420px] w-full max-w-[860px] overflow-hidden rounded-[22px] bg-[#f2f2f7] shadow-[0_18px_50px_rgba(0,0,0,0.22)]" onClick={(event) => event.stopPropagation()}>
            <aside className="flex w-[300px] shrink-0 flex-col px-4 pb-4 pt-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[17px] font-semibold tracking-tight text-[#1c1c1e]">{[sheet.code, shortStoreName(sheet.store)].filter(Boolean).join(" ")}</p>
                  <p className="truncate text-[13px] text-[#8e8e93]">{[center, sheet.line ? `${sheet.line}라인` : "", sheet.loc].filter(Boolean).join(" ")}</p>
                </div>
                <PrintButton onClick={() => {
                  const reasons = sheetSum.reasons.map(([name, box]) => `<tr><td>${escPrint(name)}</td><td class="r">${nf.format(box.count)}</td><td class="r">${escPrint(moneyShort(box.amount))}</td></tr>`).join("");
                  const lines = visibleSheetRows.map((row) => `<tr><td>${escPrint(row.date.slice(5))}</td><td>${escPrint(row.goods || "상품명 없음")}<div class="sub">${escPrint(`${row.dpt} · ${row.group}`)}</div></td><td class="r">${nf.format(row.qty)}</td><td class="r">${escPrint(moneyShort(row.amount))}</td><td>${escPrint(row.reason)}</td></tr>`).join("");
                  const chartLabel = sheetChart === "count" ? "건" : sheetChart === "qty" ? "수량" : "금액";
                  const chartValues = sheetTrend.map((row) => ({ date: row.date, value: sheetChart === "count" ? row.count : Math.abs(row[sheetChart]) }));
                  printHtml(sheet.store, `<h1>${escPrint([sheet.code, shortStoreName(sheet.store)].filter(Boolean).join(" "))}</h1><p class="sub">${escPrint([center, sheet.line ? `${sheet.line}라인` : "", sheet.loc].filter(Boolean).join(" "))}</p><div class="stats"><div><span>일수</span><b>${nf.format(sheetSum.days)}</b></div><div><span>건</span><b>${nf.format(sheetSum.count)}</b></div><div><span>수량</span><b>${nf.format(sheetSum.qty)}</b></div><div><span>금액</span><b>${escPrint(moneyShort(sheetSum.amount))}</b></div></div><h2>${escPrint(chartLabel)} 추이</h2>${chartMarkup(chartValues, chartLabel)}<h2>미오출사유</h2><table><thead><tr><th>미오출사유</th><th class="r">건수</th><th class="r">금액</th></tr></thead><tbody>${reasons}</tbody></table><h2>상품</h2><table><thead><tr><th>출고일</th><th>상품명</th><th class="r">수량</th><th class="r">금액</th><th>사유</th></tr></thead><tbody>${lines}</tbody></table>`);
                }} />
              </div>
              <div className="relative z-30 mt-2.5 grid grid-cols-2 gap-1.5">
                <CheckMenu
                  compact
                  fill
                  label="DPT"
                  text={sheetDptAll ? "DPT" : pickedSheetDpts.length === 0 ? "없음" : pickedSheetDpts.join(", ")}
                  rows={[
                    { id: "전체", label: "전체", checked: sheetDptAll && sheetDptOptions.length > 0 },
                    ...sheetDptOptions.map((id) => ({ id, label: id, checked: pickedSheetDpts.includes(id) })),
                  ]}
                  onToggle={(id) => {
                    if (id === "전체") {
                      setSheetDpts(sheetDptAll ? [] : null);
                      return;
                    }
                    const current = sheetDpts == null ? [...sheetDptOptions] : sheetDpts.filter((item) => sheetDptOptions.includes(item));
                    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
                    setSheetDpts(sheetDptOptions.every((item) => next.includes(item)) ? null : next);
                  }}
                />
                <CheckMenu
                  compact
                  fill
                  end
                  label="사유"
                  text={sheetReasonAll ? "사유" : pickedSheetReasons.length === 0 ? "없음" : pickedSheetReasons.join(", ")}
                  rows={[
                    { id: "전체", label: "전체", checked: sheetReasonAll && sheetReasonChoices.length > 0 },
                    ...sheetReasonChoices.map((id) => ({ id, label: id, checked: pickedSheetReasons.includes(id) })),
                  ]}
                  onToggle={(id) => {
                    if (id === "전체") {
                      setSheetReasonPick(sheetReasonAll ? [] : null);
                      return;
                    }
                    const current = sheetReasonPick == null ? [...sheetReasonChoices] : sheetReasonPick.filter((item) => sheetReasonChoices.includes(item));
                    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
                    setSheetReasonPick(sheetReasonChoices.every((item) => next.includes(item)) ? null : next);
                  }}
                />
              </div>
              <TrendLine unit={sheetChart === "count" ? "건" : sheetChart === "qty" ? "수량" : "금액"} points={sheetTrend.map((row) => ({ date: row.date, raw: row[sheetChart], value: sheetChart === "count" ? row.count : Math.abs(row[sheetChart]) }))} />
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                {([
                  ["일수", nf.format(sheetSum.days), ""] as const,
                  ["건", nf.format(sheetSum.count), "count"] as const,
                  ["수량", nf.format(sheetSum.qty), "qty"] as const,
                  ["금액", moneyShort(sheetSum.amount), "amount"] as const,
                ]).map(([label, value, key]) => {
                  const on = key !== "" && sheetChart === key;
                  if (!key) {
                    return (
                      <div key={label} className="rounded-xl bg-white px-1.5 py-1.5 text-center shadow-sm">
                        <p className="text-[10px] font-medium text-[#8e8e93]">{label}</p>
                        <p className="truncate text-[13px] font-semibold tabular-nums text-[#1c1c1e]">{value}</p>
                      </div>
                    );
                  }
                  return (
                    <button key={label} type="button" className={"rounded-xl bg-white px-1.5 py-1.5 text-center shadow-sm " + (on ? "ring-1 ring-[#007aff]" : "")} onClick={() => setSheetChart(key)}>
                      <p className={"text-[10px] font-medium " + (on ? "text-[#007aff]" : "text-[#8e8e93]")}>{label}</p>
                      <p className="truncate text-[13px] font-semibold tabular-nums text-[#1c1c1e]">{value}</p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2.5 min-h-0 flex-1 overflow-auto rounded-2xl bg-white shadow-sm">
                {sheetSum.reasons.length === 0 ? <p className="px-3 py-6 text-center text-[13px] text-[#8e8e93]">이 점포의 오출이 없습니다.</p> : (
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="sticky top-0 bg-white text-[11px] text-[#8e8e93]">
                        <th className="px-3 py-2 text-left font-medium">미오출사유</th>
                        <th className="px-2 py-2 text-right font-medium">건수</th>
                        <th className="px-3 py-2 text-right font-medium">금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheetSum.reasons.map(([name, box]) => (
                        <tr key={name} className="border-t border-black/[0.06]">
                          <td className="px-3 py-2 text-[#1c1c1e]">{name}</td>
                          <td className="px-2 py-2 text-right tabular-nums text-[#1c1c1e]">{nf.format(box.count)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-[#1c1c1e]">{moneyShort(box.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </aside>
            <div className="flex min-w-0 flex-1 flex-col py-4 pr-4">
              <div className="min-h-0 flex-1 overflow-auto rounded-2xl bg-white shadow-sm">
                {visibleSheetRows.length === 0 ? <p className="px-3 py-6 text-center text-[13px] text-[#8e8e93]">이 점포의 오출이 없습니다.</p> : (
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="sticky top-0 bg-white text-[11px] text-[#8e8e93]">
                        {([["date", "출고일"], ["goods", "상품명"], ["qty", "수량"], ["amount", "금액"], ["reason", "사유"]] as const).map(([key, label]) => (
                          <th key={key} className={"px-2 py-2 font-medium " + (key === "goods" || key === "reason" ? "text-left" : "text-center")}>
                            <button type="button" className={"bg-transparent font-medium text-[#8e8e93] " + (key === "goods" || key === "reason" ? "text-left" : "w-full text-center")} onClick={() => {
                              if (sheetSort === key) setSheetDir((dir) => dir === "asc" ? "desc" : "asc");
                              else {
                                setSheetSort(key);
                                setSheetDir(key === "qty" || key === "amount" ? "desc" : "asc");
                              }
                            }}>{label}{sheetSort === key ? sheetDir === "asc" ? " ▲" : " ▼" : ""}</button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleSheetRows.map((row, index) => (
                        <tr key={`${row.date}-${row.goods}-${index}`} className="border-t border-black/[0.06]">
                          <td className="whitespace-nowrap px-2 py-1.5 text-center tabular-nums text-[#3a3a3c]">{row.date.slice(5)}</td>
                          <td className="min-w-0 px-2 py-1.5">
                            <p className="truncate font-semibold text-[#1c1c1e]">{row.goods || "상품명 없음"}</p>
                            <p className="truncate text-[11px] text-[#8e8e93]">{row.dpt} · {row.group}</p>
                          </td>
                          <td className="px-2 py-1.5 text-center tabular-nums">{nf.format(row.qty)}</td>
                          <td className="whitespace-nowrap px-2 py-1.5 text-center tabular-nums">{moneyShort(row.amount)}</td>
                          <td className="px-2 py-1.5 text-[#3a3a3c]">{row.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
      {productSheet && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6" onClick={() => setProductSheet(null)}>
          <div role="dialog" aria-modal="true" aria-label={productSheet.name} className="flex h-[460px] w-full max-w-[860px] flex-col overflow-hidden rounded-[22px] bg-[#f2f2f7] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[17px] font-semibold tracking-tight text-[#1c1c1e]">{productSheet.name}</p>
                <p className="truncate text-[13px] text-[#8e8e93]">{productSheet.dpt}</p>
              </div>
              <PrintButton onClick={() => {
                const lines = visibleProductRows.map((row) => `<tr><td>${escPrint(row.date)}</td><td>${escPrint(routeOf(row) || "없음")}</td><td>${escPrint(placeOf(row) || "—")}</td><td>${escPrint(row.storeNm)}</td><td class="r">${nf.format(row.qty)}</td><td class="r">${escPrint(moneyShort(row.amount))}</td><td>${escPrint(row.reason)}</td></tr>`).join("");
                printHtml(productSheet.name, `<h1>${escPrint(productSheet.name)}</h1><p class="sub">${escPrint(productSheet.dpt)}</p><div class="stats"><div><span>일수</span><b>${nf.format(productSum.days)}</b></div><div><span>건</span><b>${nf.format(productSum.count)}</b></div><div><span>수량</span><b>${nf.format(productSum.qty)}</b></div><div><span>금액</span><b>${escPrint(moneyShort(productSum.amount))}</b></div></div><table><thead><tr><th>출고일</th><th>루트</th><th>로케이션</th><th>점포명</th><th class="r">수량</th><th class="r">금액</th><th>사유</th></tr></thead><tbody>${lines}</tbody></table>`);
              }} />
            </div>
            <div className="relative z-30 mt-2.5 grid grid-cols-3 gap-1.5">
              <CheckMenu
                compact
                fill
                search
                searchLabel="루트 검색"
                label="루트"
                onSearch={(next) => {
                  setDetailRouteQuery(next);
                  if (!next.trim()) setDetailRoutes(null);
                }}
                text={detailRouteQuery.trim() ? detailRouteQuery.trim() : detailRouteAll ? "루트" : pickedDetailRoutes.length === 0 ? "없음" : pickedDetailRoutes.join(", ")}
                rows={[
                  { id: "전체", label: "전체", checked: !detailRouteNeedle && detailRouteAll && detailRouteOptions.length > 0 },
                  ...detailRouteOptions.map((id) => ({ id, label: id, checked: detailRouteNeedle ? id.toLowerCase().includes(detailRouteNeedle) : pickedDetailRoutes.includes(id) })),
                ]}
                onToggle={(id) => {
                  setDetailRouteQuery("");
                  if (id === "전체") {
                    setDetailRoutes(detailRouteAll ? [] : null);
                    return;
                  }
                  const current = detailRoutes == null ? [...detailRouteOptions] : detailRoutes.filter((item) => detailRouteOptions.includes(item));
                  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
                  setDetailRoutes(detailRouteOptions.every((item) => next.includes(item)) ? null : next);
                }}
              />
              <CheckMenu
                compact
                fill
                search
                searchLabel="점포 검색"
                label="점포명"
                onSearch={(next) => {
                  setDetailStoreQuery(next);
                  if (!next.trim()) setDetailStores(null);
                }}
                text={detailStoreQuery.trim() ? detailStoreQuery.trim() : detailStoreAll ? "점포명" : pickedDetailStores.length === 0 ? "없음" : pickedDetailStores.join(", ")}
                rows={[
                  { id: "전체", label: "전체", checked: !detailStoreNeedle && detailStoreAll && detailStoreOptions.length > 0 },
                  ...detailStoreOptions.map((id) => ({ id, label: id, checked: detailStoreNeedle ? id.toLowerCase().includes(detailStoreNeedle) : pickedDetailStores.includes(id) })),
                ]}
                onToggle={(id) => {
                  setDetailStoreQuery("");
                  if (id === "전체") {
                    setDetailStores(detailStoreAll ? [] : null);
                    return;
                  }
                  const current = detailStores == null ? [...detailStoreOptions] : detailStores.filter((item) => detailStoreOptions.includes(item));
                  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
                  setDetailStores(detailStoreOptions.every((item) => next.includes(item)) ? null : next);
                }}
              />
              <CheckMenu
                compact
                fill
                end
                search
                searchLabel="사유 검색"
                label="사유"
                onSearch={(next) => {
                  setDetailReasonQuery(next);
                  if (!next.trim()) setDetailReasons(null);
                }}
                text={detailReasonQuery.trim() ? detailReasonQuery.trim() : detailReasonAll ? "사유" : pickedDetailReasons.length === 0 ? "없음" : pickedDetailReasons.join(", ")}
                rows={[
                  { id: "전체", label: "전체", checked: !detailReasonNeedle && detailReasonAll && detailReasonOptions.length > 0 },
                  ...detailReasonOptions.map((id) => ({ id, label: id, checked: detailReasonNeedle ? id.toLowerCase().includes(detailReasonNeedle) : pickedDetailReasons.includes(id) })),
                ]}
                onToggle={(id) => {
                  setDetailReasonQuery("");
                  if (id === "전체") {
                    setDetailReasons(detailReasonAll ? [] : null);
                    return;
                  }
                  const current = detailReasons == null ? [...detailReasonOptions] : detailReasons.filter((item) => detailReasonOptions.includes(item));
                  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
                  setDetailReasons(detailReasonOptions.every((item) => next.includes(item)) ? null : next);
                }}
              />
            </div>
            <div className="mt-2.5 grid grid-cols-4 gap-1.5">
              {([
                ["일수", nf.format(productSum.days)],
                ["건", nf.format(productSum.count)],
                ["수량", nf.format(productSum.qty)],
                ["금액", moneyShort(productSum.amount)],
              ] as const).map(([label, value]) => (
                <div key={label} className="rounded-xl bg-white px-1.5 py-1.5 text-center shadow-sm">
                  <p className="text-[10px] font-medium text-[#8e8e93]">{label}</p>
                  <p className="truncate text-[13px] font-semibold tabular-nums text-[#1c1c1e]">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-2.5 min-h-0 flex-1 overflow-auto rounded-2xl bg-white shadow-sm">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="sticky top-0 bg-white text-[11px] text-[#8e8e93]">
                    {([["date", "출고일", "left"], ["route", "루트", "left"], ["loc", "로케이션", "left"], ["store", "점포명", "left"], ["qty", "수량", "right"], ["amount", "금액", "right"], ["reason", "사유", "left"]] as const).map(([key, label, align]) => (
                      <th key={key} className={"px-3 py-2 font-medium " + (align === "right" ? "text-right" : "text-left")}>
                        <button type="button" className={"bg-transparent font-medium text-[#8e8e93] " + (align === "right" ? "w-full text-right" : "text-left")} onClick={() => {
                          if (detailSort === key) setDetailDir((dir) => dir === "asc" ? "desc" : "asc");
                          else {
                            setDetailSort(key);
                            setDetailDir(key === "qty" || key === "amount" ? "desc" : "asc");
                          }
                        }}>{label}{detailSort === key ? detailDir === "asc" ? " ▲" : " ▼" : ""}</button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleProductRows.map((row, index) => (
                    <tr key={`${row.date}-${row.storeCd}-${index}`} className="border-t border-black/[0.06]">
                      <td className="whitespace-nowrap px-3 py-1.5 tabular-nums text-[#3a3a3c]">{row.date}</td>
                      <td className="whitespace-nowrap px-3 py-1.5 tabular-nums text-[#1c1c1e]">{routeOf(row) || "없음"}</td>
                      <td className="whitespace-nowrap px-3 py-1.5 tabular-nums text-[#3a3a3c]">{placeOf(row) || "—"}</td>
                      <td className="max-w-[220px] truncate px-3 py-1.5 font-semibold text-[#1c1c1e]" title={row.storeNm}>{row.storeNm}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{nf.format(row.qty)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{moneyShort(row.amount)}</td>
                      <td className="px-3 py-1.5 text-[#3a3a3c]">{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
