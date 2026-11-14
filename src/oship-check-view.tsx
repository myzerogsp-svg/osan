import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { createPortal } from "react-dom";
import { CheckMenu } from "@/pick-filter";
import { readOship, type OshipRow } from "@/lib/oship";
import { readCenters } from "@/lib/read-workbook";
import { matchFrozen, subscribeFrozen } from "@/lib/frozen-loc";
import { shownSite } from "@/lib/productivity";

type WorkHit = { center: string; line: number; location: string; route: string; at: number | null; goodsCd: string; lane: string; qty: number };
type CheckRow = {
  center: string;
  lines: string[];
  locations: string[];
  routes: string[];
  groups: string[];
  times: number[];
  date: string;
  storeCd: string;
  storeNm: string;
  master: string;
  group: string;
  reason: string;
  code: string;
  goods: string;
  ship: number | null;
  qty: number;
  amount: number;
};
type SortKey = "date" | "center" | "line" | "location" | "route" | "storeCd" | "storeNm" | "master" | "code" | "goods" | "ship" | "qty" | "amount" | "time" | "reason";
type WorkJob = { line?: number; location?: string; route?: string; storeCd?: string; goodsCd?: string; goodsNm?: string; at?: number | null; groupId?: string; qty?: number };

const nf = new Intl.NumberFormat("ko-KR");
const won = new Intl.NumberFormat("ko-KR");

type WebHost = {
  postMessage: (msg: string) => void;
  addEventListener: (type: string, cb: (event: { data: unknown }) => void) => void;
  removeEventListener: (type: string, cb: (event: { data: unknown }) => void) => void;
};

function webHost() {
  return (window as unknown as { chrome?: { webview?: WebHost }; __COMPANY_PC__?: boolean }).chrome?.webview;
}

function b64ToArrayBuffer(b64: string) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function normCd(value: string) {
  return value.replace(/\.0$/, "").replace(/\s/g, "").toUpperCase();
}

function normNm(value: string) {
  return value.replace(/\s/g, "").toLowerCase();
}

function centerGuess(name: string) {
  const text = name.normalize("NFC");
  if (text.includes("통합")) return "통합";
  if (text.includes("냉동")) return "냉동";
  const marked = text.match(/([123])\s*센터/) ?? text.match(/(?:^|[^0-9])([123])\s*(?:미|오|작업)/) ?? text.match(/(?:^|[^0-9])10([123])(?![0-9])/);
  return marked ? `${marked[1]}센터` : "";
}

function roleGuess(name: string): "" | "work" | "wrong" {
  const text = name.normalize("NFC");
  if (text.includes("오출") || /(?:^|[^가-힣])오(?:[^가-힣]|$)/.test(text)) return "wrong";
  if (text.includes("작업") || text.includes("미출") || /(?:^|[^가-힣])미(?:[^가-힣]|$)/.test(text) || text.includes("미")) return "work";
  return "";
}

function centersInSheets(names: string[]) {
  const found = unique(names.flatMap((name) => {
    const text = name.normalize("NFC").trim();
    if (text.includes("냉동")) return ["냉동"];
    const marked = text.match(/([123])\s*센터/);
    return marked ? [`${marked[1]}센터`] : [];
  }));
  if (found.length > 1) return "통합";
  return found[0] ?? "";
}

async function sniffFile(file: File) {
  const named = { center: centerGuess(file.name), role: roleGuess(file.name) };
  if (named.center && named.role) return named;
  try {
    const xlsx = await import("xlsx");
    const book = xlsx.read(await file.arrayBuffer(), { type: "array", sheetRows: 1 });
    const heads = book.SheetNames.flatMap((name) => {
      const grid = xlsx.utils.sheet_to_json(book.Sheets[name], { header: 1, raw: false, defval: "" }) as unknown[][];
      return (grid[0] ?? []).map((cell) => String(cell ?? "").replace(/\s/g, "").toLowerCase());
    });
    const has = (label: string) => heads.some((cell) => cell === label || cell.includes(label));
    const oship = has("미오출사유") || (has("점포코드") && has("배송루트") && (has("출고량") || has("금액")));
    const work = has("blockno") || has("pickdt") || has("pickqt") || book.SheetNames.some((name) => /torderdetail/i.test(name) || /[123]\s*센터|냉동/.test(name));
    const role = named.role || (oship && !work ? "wrong" : work && !oship ? "work" : "");
    const center = named.center || (role === "work" ? centersInSheets(book.SheetNames) : "");
    return { center, role };
  } catch {
    return named;
  }
}

function frozenOship(row: OshipRow) {
  if (row.dpt === "냉동" || /냉동|빙과/.test(row.group)) return true;
  const digits = row.route.replace(/\D/g, "");
  const head = Number(digits.length >= 3 ? digits.slice(0, 3) : digits);
  return head >= 400 && head <= 499;
}

function addBook(books: { center: string; rows: OshipRow[] }[], center: string, rows: OshipRow[]) {
  if (!rows.length) return;
  const found = books.find((item) => item.center === center);
  if (found) found.rows.push(...rows);
  else books.push({ center, rows: [...rows] });
}

type UploadDraft = { key: string; file: File; center: string; role: "" | "work" | "wrong" };

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

const CENTER_RANK = ["1센터", "2센터", "3센터", "냉동"];

function sortCenters(ids: string[]) {
  return [...ids].sort((a, b) => {
    const ia = CENTER_RANK.indexOf(a);
    const ib = CENTER_RANK.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b, "ko");
  });
}

function frozenLane(groupId: string) {
  const key = groupId.trim().toUpperCase();
  if (key === "A" || key === "소분") return "소분";
  if (key === "B" || key === "빙과") return "빙과";
  return "";
}

function lineRank(line: string) {
  if (line === "소분") return 1000;
  if (line === "빙과") return 1001;
  const num = Number(line);
  return Number.isFinite(num) ? num : 2000;
}

function lineLabel(line: string) {
  return /^\d+$/.test(line) ? `${line}라인` : line;
}

function lanesOf(hits: WorkHit[]) {
  return unique(hits.map((hit) => (hit.center === "냉동" ? hit.lane : hit.line ? String(hit.line) : ""))).sort((a, b) => lineRank(a) - lineRank(b) || a.localeCompare(b, "ko"));
}

function frozenPlace(site: string, lines: string[], locations: string[]) {
  const zones: string[] = [];
  const codes: string[] = [];
  for (const raw of locations) {
    const hit = matchFrozen(site, raw);
    if (!hit) continue;
    zones.push(hit.zone);
    codes.push(hit.loc);
  }
  if (!codes.length) return { lines, locations };
  return { lines: unique(zones).sort((a, b) => a.localeCompare(b, "ko")), locations: unique(codes) };
}

function routeBand(route: string) {
  const digits = route.replace(/\D/g, "");
  if (!digits) return "";
  const head = Number(digits.length >= 3 ? digits.slice(0, 3) : digits);
  if (head >= 300 && head <= 399) return "FF1";
  if (head >= 100 && head <= 299) return "FF2";
  if (head >= 400 && head <= 499) return "냉동";
  return "";
}

function masterBand(master: string) {
  const name = master.replace(/\s/g, "");
  if (/냉동|빙과/.test(name)) return "냉동";
  if (/FF\s*1|1차/.test(name)) return "FF1";
  if (/FF\s*2|유제|냉장/.test(name)) return "FF2";
  return "";
}

const DPT_OPTIONS = ["FF1", "FF2", "냉동"];

function routeKey(route: string) {
  const digits = route.replace(/\D/g, "");
  if (digits) return digits.slice(0, 3);
  return route.trim().slice(0, 3);
}

function routeKeys(row: CheckRow) {
  return unique(row.routes.map(routeKey));
}

function manyText(picked: string[] | null) {
  if (picked == null) return "전체";
  if (picked.length === 0) return "선택 없음";
  if (picked.length <= 2) return picked.join(", ");
  return `${picked.length}개`;
}

type FilterKey = "date" | "center" | "line" | "location" | "route" | "storeCd" | "store" | "dpt" | "code" | "goods" | "ship" | "qty" | "amount" | "time" | "reason";
type Picks = Record<FilterKey, string[] | null>;

function allows(picked: string[] | null, values: string[]) {
  if (picked == null) return true;
  return values.some((value) => picked.includes(value));
}

function cellValues(row: CheckRow, key: "date" | "location" | "storeCd" | "code" | "ship" | "qty" | "amount" | "time") {
  if (key === "date") return [row.date || "없음"];
  if (key === "location") return row.locations.length ? row.locations : ["없음"];
  if (key === "storeCd") return [row.storeCd || "없음"];
  if (key === "code") return [row.code || "없음"];
  if (key === "ship") return [row.ship == null ? "없음" : nf.format(row.ship)];
  if (key === "qty") return [nf.format(row.qty)];
  if (key === "amount") return [won.format(row.amount)];
  return row.times.length ? row.times.map(clock) : ["없음"];
}

function rowHits(row: CheckRow, picks: Picks, skip?: FilterKey) {
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

function toggleValue(prev: string[] | null, id: string, all: string[]) {
  const base = prev ?? all;
  const next = base.includes(id) ? base.filter((item) => item !== id) : [...base, id];
  if (next.length === 0) return [];
  return all.length > 0 && all.every((item) => next.includes(item)) ? null : next;
}

function clearFound(prev: string[] | null, found: string[], all: string[]) {
  const base = prev ?? all;
  const next = base.filter((item) => !found.includes(item));
  if (next.length === 0) return [];
  return all.length > 0 && all.every((item) => next.includes(item)) ? null : next;
}

function ColFilter({ label, options, picked, onChange }: { label: string; options: { id: string; label: string; search: string }[]; picked: string[] | null; onChange: (next: string[] | null) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [box, setBox] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const on = picked != null;
  const needle = query.trim().toLowerCase();
  const found = needle ? options.filter((item) => item.search.includes(needle) || item.label.toLowerCase().includes(needle)) : options;
  const shown = found.slice(0, 300);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      const node = event.target as Node;
      if (buttonRef.current?.contains(node) || menuRef.current?.contains(node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const left = Math.min(rect.left, window.innerWidth - 300);
      setBox({ top: rect.bottom + 4, left: Math.max(8, left) });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);
  const menu = open && box ? createPortal(
    <div ref={menuRef} className="fixed z-[80] w-[280px] rounded-xl border border-black/10 bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.16)]" style={{ top: box.top, left: box.left }}>
      <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`${label} 검색`} className="h-8 w-full rounded-md border border-black/10 px-2 text-[13px] outline-none" />
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[12px]">
        <button type="button" className="font-semibold text-[#007aff]" onClick={() => onChange(null)}>전체 초기화</button>
        <button type="button" className="text-[#8e8e93]" onClick={() => onChange(clearFound(picked, found.map((item) => item.id), options.map((item) => item.id)))}>(검색 선택) 초기화</button>
      </div>
      <ul className="mt-1 max-h-64 overflow-auto">
        {shown.length === 0 ? <li className="px-1 py-2 text-[12px] text-[#8e8e93]">없습니다.</li> : shown.map((item) => {
          const checked = picked == null || picked.includes(item.id);
          return (
            <li key={item.id}>
              <button type="button" className="flex w-full items-center gap-2 rounded px-1 py-1 text-left text-[13px] hover:bg-[#f2f2f7]" onClick={() => onChange(toggleValue(picked, item.id, options.map((row) => row.id)))}>
                <span className={"grid size-4 shrink-0 place-items-center rounded-[4px] " + (checked ? "bg-[#007aff] text-white" : "border border-[#c7c7cc] bg-white")}>{checked ? "✓" : ""}</span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </button>
            </li>
          );
        })}
        {found.length > shown.length ? <li className="px-1 py-1 text-[11px] text-[#8e8e93]">검색으로 더 좁혀 주세요.</li> : null}
      </ul>
    </div>,
    document.body,
  ) : null;
  return (
    <>
      <button ref={buttonRef} type="button" aria-label={`${label} 필터`} aria-expanded={open} title={on ? manyText(picked) : "전체"} className={"grid size-5 place-items-center rounded " + (on ? "bg-[#007aff] text-white" : "text-[#8e8e93] hover:bg-black/5")} onClick={(event) => { event.stopPropagation(); setOpen((value) => !value); }}>
        <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path fill="currentColor" d="M1 1.5h10L7.2 6.2V10L4.8 8.7V6.2L1 1.5z" /></svg>
      </button>
      {menu}
    </>
  );
}

function moneyShort(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(Math.round(value));
  if (abs >= 10000) return `${sign}${nf.format(Math.round(abs / 10000))}만`;
  return sign + nf.format(abs);
}

function shortStoreName(name: string) {
  const raw = name.trim();
  if (raw.length < 9) return raw;
  return raw.replace(/^GS25\s*/i, "").replace(/점$/, "") || raw;
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

function StoreSheet({ rows, kind, onClose }: { rows: CheckRow[]; kind: "점포" | "상품"; onClose: () => void }) {
  const [dpts, setDpts] = useState<string[] | null>(null);
  const [reasons, setReasons] = useState<string[] | null>(null);
  const [sortKey, setSortKey] = useState<"date" | "goods" | "ship" | "qty" | "amount" | "time">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const head = rows[0];
  const dptOptions = useMemo(() => unique(rows.map((row) => row.master)).sort((a, b) => a.localeCompare(b, "ko")), [rows]);
  const reasonOptions = useMemo(() => unique(rows.map((row) => row.reason || "없음")).sort((a, b) => a.localeCompare(b, "ko")), [rows]);
  const dptAll = dpts == null;
  const reasonAll = reasons == null;
  const visible = useMemo(() => {
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
      const left = sortKey === "goods" && kind === "상품" ? (a.storeNm || a.storeCd) : a[sortKey];
      const right = sortKey === "goods" && kind === "상품" ? (b.storeNm || b.storeCd) : b[sortKey];
      return String(left).localeCompare(String(right), "ko") * dir;
    });
    return list;
  }, [rows, dpts, dptAll, reasons, reasonAll, sortKey, sortDir, kind]);
  const days = new Set(visible.map((row) => row.date).filter(Boolean)).size;
  const qty = visible.reduce((sum, row) => sum + row.qty, 0);
  const amount = visible.reduce((sum, row) => sum + row.amount, 0);
  const reasonRows = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    for (const row of visible) {
      const name = row.reason || "없음";
      const hit = map.get(name) ?? { count: 0, amount: 0 };
      hit.count += 1;
      hit.amount += row.amount;
      map.set(name, hit);
    }
    return [...map.entries()].sort((a, b) => a[1].amount - b[1].amount);
  }, [visible]);
  const centers = unique(rows.map((row) => row.center));
  const lineText = unique(rows.flatMap((row) => row.lines)).sort((a, b) => lineRank(a) - lineRank(b)).map(lineLabel).join(", ");
  const locationText = unique(rows.flatMap((row) => row.locations)).sort((a, b) => a.localeCompare(b, "ko", { numeric: true })).join(", ");
  const title = kind === "상품" ? (head?.goods || head?.code || "상품") : [head?.storeCd, shortStoreName(head?.storeNm || "")].filter(Boolean).join(" ");
  const subtitle = kind === "상품" ? [head?.code, unique(rows.map((row) => row.master)).join(", ")].filter(Boolean).join(" · ") : [centers.join(", "), lineText, locationText].filter(Boolean).join(" · ");
  function toggle(key: typeof sortKey) {
    if (sortKey === key) setSortDir((dir) => dir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir(key === "qty" || key === "amount" || key === "ship" ? "desc" : "asc");
    }
  }
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title || "이상점포"} className="flex h-[420px] w-full max-w-[860px] overflow-hidden rounded-[22px] bg-[#f2f2f7] shadow-[0_18px_50px_rgba(0,0,0,0.22)]" onClick={(event) => event.stopPropagation()}>
        <aside className="flex w-[300px] shrink-0 flex-col px-4 pb-4 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[17px] font-semibold tracking-tight text-[#1c1c1e]">{title || (kind === "상품" ? "상품" : "점포")}</p>
              <p className="truncate text-[13px] text-[#8e8e93]" title={subtitle}>{subtitle}</p>
            </div>
            <button type="button" className="h-7 shrink-0 rounded-full bg-[#e5e5ea] px-3 text-[12px] font-semibold text-[#636366]" onClick={() => {
              const reasonHtml = reasonRows.map(([name, box]) => `<tr><td>${escPrint(name)}</td><td class="r">${nf.format(box.count)}</td><td class="r">${escPrint(moneyShort(box.amount))}</td></tr>`).join("");
              const lines = visible.map((row) => {
                const name = kind === "상품" ? (row.storeNm || row.storeCd || "점포없음") : (row.goods || "상품명 없음");
                const place = [row.center, row.lines.map(lineLabel).join(", "), row.locations.join(", ")].filter(Boolean).join(" ");
                const sub = kind === "상품" ? place : (row.group ? `${row.master} · ${row.group}` : row.master);
                return `<tr${row.qty <= -5 ? ' style="background:#fdecec"' : ""}><td>${escPrint(row.date.length > 5 ? row.date.slice(5) : row.date)}</td><td>${escPrint(name)}<div class="sub">${escPrint(sub)}</div></td><td class="r">${row.ship == null ? "—" : nf.format(row.ship)}</td><td class="r">${nf.format(row.qty)}</td><td class="r">${escPrint(moneyShort(row.amount))}</td><td>${escPrint(row.times.map(clock).join(", "))}</td></tr>`;
              }).join("");
              const nameHead = kind === "상품" ? "점포명" : "상품명";
              printHtml(title, `<h1>${escPrint(title)}</h1><p class="sub">${escPrint(subtitle)}</p><div class="stats"><div><span>일수</span><b>${nf.format(days)}</b></div><div><span>건</span><b>${nf.format(visible.length)}</b></div><div><span>수량</span><b>${nf.format(qty)}</b></div><div><span>금액</span><b>${escPrint(moneyShort(amount))}</b></div></div><h2>미오출사유</h2><table><thead><tr><th>미오출사유</th><th class="r">건수</th><th class="r">금액</th></tr></thead><tbody>${reasonHtml}</tbody></table><h2>${nameHead}</h2><table><thead><tr><th>출고일</th><th>${nameHead}</th><th class="r">출고수량</th><th class="r">수량</th><th class="r">금액</th><th>작업시간</th></tr></thead><tbody>${lines}</tbody></table>`);
            }}>프린트</button>
          </div>
          <div className="relative z-30 mt-2.5 grid grid-cols-2 gap-1.5">
            <CheckMenu compact fill label="DPT" text={dptAll ? "DPT" : (dpts ?? []).length === 0 ? "없음" : (dpts ?? []).join(", ")} rows={[{ id: "전체", label: "전체", checked: dptAll && dptOptions.length > 0 }, ...dptOptions.map((id) => ({ id, label: id, checked: dptAll || (dpts ?? []).includes(id) }))]} onToggle={(id) => {
              if (id === "전체") { setDpts(dptAll ? [] : null); return; }
              const current = dpts == null ? [...dptOptions] : dpts.filter((item) => dptOptions.includes(item));
              const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
              setDpts(dptOptions.every((item) => next.includes(item)) ? null : next);
            }} />
            <CheckMenu compact fill end label="사유" text={reasonAll ? "사유" : (reasons ?? []).length === 0 ? "없음" : (reasons ?? []).join(", ")} rows={[{ id: "전체", label: "전체", checked: reasonAll && reasonOptions.length > 0 }, ...reasonOptions.map((id) => ({ id, label: id, checked: reasonAll || (reasons ?? []).includes(id) }))]} onToggle={(id) => {
              if (id === "전체") { setReasons(reasonAll ? [] : null); return; }
              const current = reasons == null ? [...reasonOptions] : reasons.filter((item) => reasonOptions.includes(item));
              const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
              setReasons(reasonOptions.every((item) => next.includes(item)) ? null : next);
            }} />
          </div>
          <div className="mt-2.5 grid grid-cols-4 gap-1.5">
            {([["일수", nf.format(days)], ["건", nf.format(visible.length)], ["수량", nf.format(qty)], ["금액", moneyShort(amount)]] as const).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white px-1.5 py-1.5 text-center shadow-sm">
                <p className="text-[10px] font-medium text-[#8e8e93]">{label}</p>
                <p className="truncate text-[13px] font-semibold tabular-nums text-[#1c1c1e]">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-2.5 min-h-0 flex-1 overflow-auto rounded-2xl bg-white shadow-sm">
            {reasonRows.length === 0 ? <p className="px-3 py-6 text-center text-[13px] text-[#8e8e93]">이 점포의 오출이 없습니다.</p> : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="sticky top-0 bg-white text-[11px] text-[#8e8e93]">
                    <th className="px-3 py-2 text-left font-medium">미오출사유</th>
                    <th className="px-2 py-2 text-right font-medium">건수</th>
                    <th className="px-3 py-2 text-right font-medium">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {reasonRows.map(([name, box]) => (
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
            {visible.length === 0 ? <p className="px-3 py-6 text-center text-[13px] text-[#8e8e93]">이 점포의 오출이 없습니다.</p> : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="sticky top-0 bg-white text-[11px] text-[#8e8e93]">
                    {([["date", "출고일"], ["goods", kind === "상품" ? "점포명" : "상품명"], ["ship", "출고수량"], ["qty", "수량"], ["amount", "금액"], ["time", "작업시간"]] as const).map(([key, label]) => (
                      <th key={key} className={"px-2 py-2 font-medium " + (key === "goods" ? "text-left" : "text-center")}>
                        <button type="button" className={"bg-transparent font-medium text-[#8e8e93] " + (key === "goods" ? "text-left" : "w-full text-center")} onClick={() => toggle(key)}>{label}{sortKey === key ? sortDir === "asc" ? " ▲" : " ▼" : ""}</button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row, index) => (
                    <tr key={`${row.date}-${row.goods}-${index}`} className={"border-t border-black/[0.06]" + (row.qty <= -5 ? " bg-[#fdecec]" : "")}>
                      <td className="whitespace-nowrap px-2 py-1.5 text-center tabular-nums text-[#3a3a3c]">{row.date.length > 5 ? row.date.slice(5) : row.date || "—"}</td>
                      <td className="min-w-0 px-2 py-1.5">
                        <p className="truncate font-semibold text-[#1c1c1e]">{kind === "상품" ? (row.storeNm || row.storeCd || "점포없음") : (row.goods || "상품명 없음")}</p>
                        <p className="truncate text-[11px] text-[#8e8e93]">{kind === "상품" ? ([row.center, row.lines.map(lineLabel).join(", "), row.locations.join(", ")].filter(Boolean).join(" ") || "—") : (row.group ? `${row.master} · ${row.group}` : row.master || "—")}</p>
                      </td>
                      <td className="px-2 py-1.5 text-center tabular-nums text-[#1c1c1e]">{row.ship == null ? "—" : nf.format(row.ship)}</td>
                      <td className="px-2 py-1.5 text-center tabular-nums text-[#1c1c1e]">{nf.format(row.qty)}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-center tabular-nums">{moneyShort(row.amount)}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-center tabular-nums text-[#3a3a3c]">{row.times.length ? row.times.map(clock).join(", ") : "—"}</td>
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
  );
}

function clock(at: number) {
  const time = new Date(at);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())}`;
}

function indexWork(centers: Record<string, WorkJob[]>) {
  const byCode = new Map<string, WorkHit[]>();
  const byName = new Map<string, WorkHit[]>();
  const byStore = new Map<string, WorkHit[]>();
  const byFrozenName = new Map<string, WorkHit[]>();
  const byFrozenCode = new Map<string, WorkHit[]>();
  const storeCenters = new Map<string, Set<string>>();
  const push = (map: Map<string, WorkHit[]>, key: string, hit: WorkHit) => {
    const list = map.get(key) ?? [];
    list.push(hit);
    map.set(key, list);
  };
  for (const [center, jobs] of Object.entries(centers)) {
    for (const job of jobs ?? []) {
      const store = normCd(job.storeCd || "");
      const goods = normCd(job.goodsCd || "");
      const name = normNm(job.goodsNm || "");
      const hit: WorkHit = {
        center,
        line: Number(job.line) || 0,
        location: String(job.location || ""),
        route: String(job.route || ""),
        at: typeof job.at === "number" && Number.isFinite(job.at) ? job.at : null,
        goodsCd: String(job.goodsCd || "").replace(/\.0$/, ""),
        lane: center === "냉동" ? frozenLane(String(job.groupId || "")) : "",
        qty: Number(job.qty) || 0,
      };
      if (store) {
        const found = storeCenters.get(store) ?? new Set<string>();
        found.add(center);
        storeCenters.set(store, found);
        push(byStore, `${center}|${store}`, hit);
      }
      if (store && goods) push(byCode, `${store}|${goods}`, hit);
      if (store && name) push(byName, `${store}|${name}`, hit);
      if (center === "냉동" && name) push(byFrozenName, name, hit);
      if (center === "냉동" && goods) push(byFrozenCode, goods, hit);
    }
  }
  return { byCode, byName, byStore, byFrozenName, byFrozenCode, storeCenters };
}

function hitsFor(index: ReturnType<typeof indexWork>, center: string, store: string, goods: string, name: string) {
  const coded = (goods ? index.byCode.get(`${store}|${goods}`) : undefined) ?? [];
  const named = coded.length || !name ? [] : index.byName.get(`${store}|${name}`) ?? [];
  const hits = coded.length ? coded : named;
  if (!center) return hits;
  return hits.filter((hit) => hit.center === center);
}

function buildRows(work: Record<string, WorkJob[]>, books: { center: string; rows: OshipRow[] }[], site: string) {
  const index = indexWork(work);
  const out: CheckRow[] = [];
  for (const book of books) {
    for (const row of book.rows) {
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
      const frozenHits = center === "냉동" ? ((name ? index.byFrozenName.get(name) : undefined) ?? (goods ? index.byFrozenCode.get(goods) : undefined) ?? []) : [];
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
      const times = unique(hits.map((hit) => (hit.at == null ? "" : String(hit.at)))).map(Number).sort((a, b) => a - b);
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
        amount: row.amount,
      });
    }
  }
  return out;
}

const COLUMNS: { key: SortKey; label: string; num?: boolean }[] = [
  { key: "date", label: "오출일자" },
  { key: "center", label: "센터" },
  { key: "line", label: "라인" },
  { key: "location", label: "로케이션" },
  { key: "route", label: "루트" },
  { key: "storeCd", label: "점포코드" },
  { key: "storeNm", label: "점포명" },
  { key: "master", label: "마스터" },
  { key: "code", label: "상품코드" },
  { key: "goods", label: "상품명" },
  { key: "ship", label: "출고수량", num: true },
  { key: "qty", label: "수량", num: true },
  { key: "amount", label: "오출금액", num: true },
  { key: "time", label: "작업 시간" },
  { key: "reason", label: "미오출사유" },
];

function textOf(row: CheckRow, key: SortKey) {
  if (key === "line") return row.lines.map(lineLabel).join(", ");
  if (key === "location") return row.locations.join(", ");
  if (key === "route") return routeKeys(row).join(", ");
  if (key === "time") return row.times.map(clock).join(", ");
  if (key === "ship") return row.ship == null ? "" : nf.format(row.ship);
  if (key === "qty") return nf.format(row.qty);
  if (key === "amount") return won.format(row.amount);
  if (key === "reason") return row.reason || "없음";
  return row[key] || "";
}

export function OshipCheckView() {
  const fileRef = useRef<HTMLInputElement>(null);
  const queueRef = useRef<(list: File[], role?: UploadDraft["role"]) => void>(() => {});
  const [uploads, setUploads] = useState<UploadDraft[] | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [workName, setWorkName] = useState("");
  const [wrongName, setWrongName] = useState("");
  const [rows, setRows] = useState<CheckRow[]>([]);
  const [work, setWork] = useState<Record<string, WorkJob[]>>({});
  const [books, setBooks] = useState<{ center: string; rows: OshipRow[] }[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [center, setCenter] = useState<string[] | null>(null);
  const [line, setLine] = useState<string[] | null>(null);
  const [route, setRoute] = useState<string[] | null>(null);
  const [store, setStore] = useState<string[] | null>(null);
  const [pickedDpts, setPickedDpts] = useState<string[] | null>(null);
  const [pickedReasons, setPickedReasons] = useState<string[] | null>(null);
  const [pickedGoods, setPickedGoods] = useState<string[] | null>(null);
  const [pickedShip, setPickedShip] = useState<string[] | null>(null);
  const [pickedDate, setPickedDate] = useState<string[] | null>(null);
  const [pickedLocation, setPickedLocation] = useState<string[] | null>(null);
  const [pickedStoreCd, setPickedStoreCd] = useState<string[] | null>(null);
  const [pickedCode, setPickedCode] = useState<string[] | null>(null);
  const [pickedQty, setPickedQty] = useState<string[] | null>(null);
  const [pickedAmount, setPickedAmount] = useState<string[] | null>(null);
  const [pickedTime, setPickedTime] = useState<string[] | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("amount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [oddStore, setOddStore] = useState<{ kind: "점포" | "상품"; name: string; code: string } | null>(null);
  const [locRev, setLocRev] = useState(0);
  const site = shownSite();

  useEffect(() => subscribeFrozen(() => setLocRev((value) => value + 1)), []);
  useEffect(() => {
    setRows(buildRows(work, books, site));
  }, [work, books, site, locRev]);

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
        const merged: Record<string, WorkJob[]> = {};
        const missed: string[] = [];
        for (const item of workFiles) {
          try {
            if (item.center === "통합") {
              const result = await readCenters(await item.file.arrayBuffer(), "통합");
              let placed = false;
              for (const [id, jobs] of Object.entries(result.centers)) {
                if (!jobs?.length || id === "통합") continue;
                merged[id] = [...(merged[id] ?? []), ...(jobs as WorkJob[])];
                placed = true;
              }
              if (!placed) missed.push(`${item.file.name}(1·2·3센터 시트를 찾지 못함)`);
              continue;
            }
            const result = await readCenters(await item.file.arrayBuffer(), item.center);
            const jobs = Object.values(result.centers).flat() as WorkJob[];
            if (!jobs.length) {
              missed.push(item.file.name);
              continue;
            }
            merged[item.center] = [...(merged[item.center] ?? []), ...jobs];
          } catch {
            missed.push(item.file.name);
          }
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
        const next: { center: string; rows: OshipRow[] }[] = [];
        const missed: string[] = [];
        for (const item of wrongFiles) {
          const parsed = await readOship(await item.file.arrayBuffer());
          if (!parsed.length) {
            missed.push(item.file.name);
            continue;
          }
          if (item.center === "1센터") {
            addBook(next, "1센터", parsed.filter((row) => !frozenOship(row)));
            addBook(next, "냉동", parsed.filter((row) => frozenOship(row)));
          } else {
            addBook(next, item.center, parsed);
          }
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

  async function queueUploads(list: File[], role: UploadDraft["role"] = "") {
    const files = list.filter((file) => /\.xls/i.test(file.name));
    if (!files.length) {
      setError("xlsx 또는 xls 파일만 올릴 수 있습니다.");
      return;
    }
    setError("");
    setBusy("파일을 구분하는 중");
    const drafts = await Promise.all(files.map(async (file, index) => {
      const found = role ? { center: centerGuess(file.name), role } : await sniffFile(file);
      return { key: `${index}-${file.name}-${file.size}`, file, center: found.center, role: found.role };
    }));
    setBusy("");
    setUploads(drafts);
  }
  queueRef.current = queueUploads;

  useEffect(() => {
    const host = webHost();
    if (!host?.addEventListener) return;
    const onMessage = (event: { data: unknown }) => {
      try {
        const data = (typeof event.data === "string" ? JSON.parse(event.data) : event.data) as { type?: string; kind?: string; files?: { name?: string; b64?: string }[] };
        if (data?.type !== "oship-check" || !Array.isArray(data.files)) return;
        const files = data.files.filter((item) => item.b64).map((item) => new File([b64ToArrayBuffer(item.b64 ?? "")], item.name || "엑셀.xlsx"));
        if (!files.length) return;
        const role = data.kind === "work" ? "work" : data.kind === "wrong" ? "wrong" : "";
        queueRef.current(files, role);
      } catch { /* 다른 메시지 */ }
    };
    host.addEventListener("message", onMessage);
    return () => host.removeEventListener("message", onMessage);
  }, []);

  function openPicker() {
    const host = webHost();
    const company = (window as unknown as { __COMPANY_PC__?: boolean }).__COMPANY_PC__;
    if (host && company) {
      host.postMessage("oship-upload");
      return;
    }
    fileRef.current?.click();
  }

  function onDropFiles(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    queueUploads([...event.dataTransfer.files]);
  }

  const picks: Picks = { date: pickedDate, center, line, location: pickedLocation, route, storeCd: pickedStoreCd, store, dpt: pickedDpts, code: pickedCode, goods: pickedGoods, ship: pickedShip, qty: pickedQty, amount: pickedAmount, time: pickedTime, reason: pickedReasons };
  const filterOptions = useMemo(() => {
    const dates = new Set<string>();
    const centers = new Set<string>();
    const lines = new Set<string>();
    const locations = new Set<string>();
    const routes = new Set<string>();
    const storeCds = new Set<string>();
    const stores = new Map<string, string>();
    const codes = new Set<string>();
    const reasons = new Set<string>();
    const goods = new Map<string, string>();
    const ships = new Set<string>();
    const qtys = new Set<string>();
    const amounts = new Set<string>();
    const times = new Set<string>();
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
    const opt = (id: string, label = id, extra = "") => ({ id, label, search: `${label} ${id} ${extra}`.toLowerCase() });
    const words = (values: Set<string>) => [...values].sort((a, b) => a.localeCompare(b, "ko", { numeric: true })).map((id) => opt(id));
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
      time: words(times),
    };
  }, [rows, pickedDate, center, line, pickedLocation, route, pickedStoreCd, store, pickedDpts, pickedCode, pickedReasons, pickedGoods, pickedShip, pickedQty, pickedAmount, pickedTime]);
  const shown = useMemo(() => {
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
  }, [rows, pickedDate, center, line, pickedLocation, route, pickedStoreCd, store, pickedDpts, pickedCode, pickedReasons, pickedGoods, pickedShip, pickedQty, pickedAmount, pickedTime, sortKey, sortDir]);
  const qtySum = shown.reduce((sum, row) => sum + row.qty, 0);
  const amountSum = shown.reduce((sum, row) => sum + row.amount, 0);
  const oddStores = useMemo(() => {
    const map = new Map<string, { name: string; code: string; count: number; amount: number }>();
    for (const row of shown) {
      if (!(row.amount < 0)) continue;
      const name = row.storeNm || row.storeCd || "점포없음";
      const key = `${row.storeCd}|${name}`;
      const hit = map.get(key) ?? { name, code: row.storeCd, count: 0, amount: 0 };
      hit.count += 1;
      hit.amount += row.amount;
      map.set(key, hit);
    }
    return [...map.values()].sort((a, b) => b.count - a.count || a.amount - b.amount || a.name.localeCompare(b.name, "ko")).slice(0, 10);
  }, [shown]);
  const oddGoods = useMemo(() => {
    const map = new Map<string, { name: string; code: string; count: number; amount: number }>();
    for (const row of shown) {
      if (!(row.amount < 0)) continue;
      const name = row.goods || row.code || "상품없음";
      const key = `${row.code}|${name}`;
      const hit = map.get(key) ?? { name, code: row.code, count: 0, amount: 0 };
      hit.count += 1;
      hit.amount += row.amount;
      map.set(key, hit);
    }
    return [...map.values()].sort((a, b) => b.count - a.count || a.amount - b.amount || a.name.localeCompare(b.name, "ko")).slice(0, 10);
  }, [shown]);
  const sheetRows = useMemo(() => {
    if (!oddStore) return [];
    return shown.filter((row) => {
      if (!(row.amount < 0)) return false;
      if (oddStore.kind === "상품") return row.code === oddStore.code && (row.goods || row.code || "상품없음") === oddStore.name;
      return row.storeCd === oddStore.code && (row.storeNm || row.storeCd || "점포없음") === oddStore.name;
    });
  }, [shown, oddStore]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((dir) => dir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir(key === "qty" || key === "amount" || key === "ship" ? "desc" : "asc");
    }
  }

  return (
    <div
      className="ios-sheet relative flex h-full min-h-0 flex-col"
      onDragEnter={(event) => { if ([...event.dataTransfer.types].includes("Files")) { event.preventDefault(); setDragOver(true); } }}
      onDragOver={(event) => { if ([...event.dataTransfer.types].includes("Files")) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; } }}
      onDragLeave={(event) => { if (event.currentTarget.contains(event.relatedTarget as Node)) return; setDragOver(false); }}
      onDrop={onDropFiles}
    >
      {dragOver ? <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-[#007aff]/10"><p className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold shadow">엑셀을 놓으면 업로드됩니다</p></div> : null}
      <div className="sticky top-0 z-20 border-b border-black/5 bg-white/90 px-3 py-2 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-1 text-[17px] font-semibold text-[#1c1c1e]">오출 확인</p>
          <button type="button" className="h-8 rounded-full bg-[#007aff] px-3 text-xs font-semibold text-white" onClick={openPicker}>엑셀 업로드</button>
          {rows.length === 0 ? <span className="text-[12px] text-[#8e8e93]">엑셀 업로드를 누르거나 파일을 이 화면에 놓으세요. 센터와 작업·오출을 고른 뒤 적용합니다.</span> : null}
          <input id="oship-upload-file" ref={fileRef} type="file" accept=".xlsx,.xls,.xlsm" multiple className="sr-only" onChange={(event) => { const list = [...(event.target.files ?? [])]; event.target.value = ""; queueUploads(list); }} />
          {workName ? <span className="max-w-[220px] truncate text-[11px] text-[#8e8e93]" title={workName}>작업 {workName}</span> : null}
          {wrongName ? <span className="max-w-[280px] truncate text-[11px] text-[#8e8e93]" title={wrongName}>오출 {wrongName}</span> : null}
          {busy ? <span className="text-[11px] font-semibold text-[#007aff]">{busy}</span> : null}
          {error ? <span className="text-[11px] font-medium text-[#ff3b30]">{error}</span> : null}
        </div>
      </div>
      {uploads ? (
        <div className="relative z-40 mx-3 mt-3 rounded-2xl border border-black/10 bg-white p-3 text-sm">
          <p className="text-[#8e8e93]">파일 내용으로 센터와 작업·오출을 채웁니다. 비어 있으면 직접 고르세요. 1·2·3센터가 한 파일이면 통합입니다. 1센터 오출에 같이 있는 냉동은 냉동으로 나눕니다.</p>
          <ul className="mt-3 grid grid-cols-3 gap-3">
            {uploads.map((item, index) => (
              <li key={item.key} className="min-w-0 rounded-md border border-black/10 p-3">
                <p className="truncate font-medium" title={item.file.name}>{item.file.name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <label className="flex items-center gap-2">센터
                    <select className="h-10 rounded-md border border-black/10 px-2" value={item.center} onChange={(event) => setUploads(uploads.map((row, at) => at === index ? { ...row, center: event.target.value } : row))}>
                      <option value="">선택</option>
                      {["1센터", "2센터", "3센터", "냉동", "통합"].map((id) => <option key={id}>{id}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-2">구분
                    <select className="h-10 rounded-md border border-black/10 px-2" value={item.role} onChange={(event) => setUploads(uploads.map((row, at) => at === index ? { ...row, role: event.target.value as UploadDraft["role"] } : row))}>
                      <option value="">선택</option>
                      <option value="work">작업</option>
                      <option value="wrong">오출</option>
                    </select>
                  </label>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <button type="button" className="h-8 rounded-full bg-[#007aff] px-4 text-sm font-semibold text-white" onClick={() => void applyUploads()}>적용</button>
            <button type="button" className="h-10 rounded-full border border-black/10 px-4 text-sm" onClick={() => setUploads(null)}>닫기</button>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-start gap-2 bg-[#f2f2f7] px-3 py-2">
        {uploads ? null : (
        <div className="grid w-full grid-cols-2 gap-2 md:w-[640px]">
          {([["점포", oddStores], ["상품", oddGoods]] as const).map(([kind, items]) => (
            <aside key={kind} className="h-24 overflow-auto rounded-2xl bg-white px-3 py-1.5 text-xs shadow-sm">
              <p className="sticky top-0 flex items-center justify-between bg-white pb-0.5 font-semibold text-[#1c1c1e]">
                <span>{kind}</span>
                <span className="tabular-nums text-[#8e8e93]">{nf.format(items.length)}</span>
              </p>
              {items.length === 0 ? <p className="text-[#8e8e93]">없습니다.</p> : (
                <ul>
                  {items.map((item, index) => (
                    <li key={`${item.code}-${item.name}-${index}`}>
                      <button type="button" className="flex w-full items-center justify-between gap-2 rounded px-0.5 py-0.5 text-left hover:bg-[#e8f2ff]" onClick={() => setOddStore({ kind, name: item.name, code: item.code })}>
                        <span className="min-w-0 flex-1 truncate font-semibold text-[#007aff]">{item.name}</span>
                        <span className="shrink-0 tabular-nums text-[#8e8e93]">{nf.format(item.count)} · {moneyShort(item.amount)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          ))}
        </div>
        )}
        <span className="text-[11px] text-[#8e8e93]">{rows.length === 0 ? "열 제목의 필터로 좁힙니다." : `${nf.format(shown.length)}건 · 수량 ${nf.format(qtySum)} · ${won.format(amountSum)}원`}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {shown.length === 0 && rows.length > 0 ? <p className="px-4 py-2 text-sm text-[#8e8e93]">필터에 맞는 오출이 없습니다.</p> : null}
          <table className="w-full border-collapse text-[12px]">
            <thead className="sticky top-0 z-10 bg-[#f2f2f7]">
              <tr>
                {COLUMNS.map((col) => {
                  const filter = col.key === "date" ? { label: "오출일자", options: filterOptions.date, picked: pickedDate, onChange: setPickedDate }
                    : col.key === "center" ? { label: "센터", options: filterOptions.center, picked: center, onChange: setCenter }
                    : col.key === "line" ? { label: "라인", options: filterOptions.line, picked: line, onChange: setLine }
                    : col.key === "location" ? { label: "로케이션", options: filterOptions.location, picked: pickedLocation, onChange: setPickedLocation }
                    : col.key === "route" ? { label: "루트", options: filterOptions.route, picked: route, onChange: setRoute }
                    : col.key === "storeCd" ? { label: "점포코드", options: filterOptions.storeCd, picked: pickedStoreCd, onChange: setPickedStoreCd }
                    : col.key === "storeNm" ? { label: "점포명", options: filterOptions.store, picked: store, onChange: setStore }
                    : col.key === "master" ? { label: "DPT", options: filterOptions.dpt, picked: pickedDpts, onChange: setPickedDpts }
                    : col.key === "code" ? { label: "상품코드", options: filterOptions.code, picked: pickedCode, onChange: setPickedCode }
                    : col.key === "goods" ? { label: "상품명 또는 바코드", options: filterOptions.goods, picked: pickedGoods, onChange: setPickedGoods }
                    : col.key === "ship" ? { label: "출고수량", options: filterOptions.ship, picked: pickedShip, onChange: setPickedShip }
                    : col.key === "qty" ? { label: "수량", options: filterOptions.qty, picked: pickedQty, onChange: setPickedQty }
                    : col.key === "amount" ? { label: "오출금액", options: filterOptions.amount, picked: pickedAmount, onChange: setPickedAmount }
                    : col.key === "time" ? { label: "작업 시간", options: filterOptions.time, picked: pickedTime, onChange: setPickedTime }
                    : col.key === "reason" ? { label: "미오출사유", options: filterOptions.reason, picked: pickedReasons, onChange: setPickedReasons }
                    : null;
                  return (
                  <th key={col.key} className={"whitespace-nowrap px-2 py-2 font-semibold text-[#1c1c1e] " + (col.num ? "text-right" : "text-left")}>
                    <span className={"inline-flex items-center gap-1 " + (col.num ? "justify-end" : "")}>
                      <button type="button" className="font-semibold" onClick={() => toggleSort(col.key)}>
                        {col.label}{sortKey === col.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                      </button>
                      {filter ? <ColFilter label={filter.label} options={filter.options} picked={filter.picked} onChange={filter.onChange} /> : null}
                    </span>
                  </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {shown.map((row, index) => (
                <tr key={`${row.center}-${row.storeCd}-${row.goods}-${index}`} className={"border-t border-black/5 " + (row.qty <= -5 ? "bg-[#fdecec]" : "bg-white")}>
                  {COLUMNS.map((col) => (
                    <td key={col.key} className={"max-w-[220px] truncate px-2 py-1.5 text-[#1c1c1e] " + (col.num ? "text-right tabular-nums" : col.key === "time" ? "tabular-nums" : "text-left")} title={col.key === "route" ? row.routes.join(", ") : textOf(row, col.key)}>
                      {textOf(row, col.key) || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
      </div>
      {oddStore ? <StoreSheet key={`${oddStore.kind}|${oddStore.code}|${oddStore.name}`} kind={oddStore.kind} rows={sheetRows} onClose={() => setOddStore(null)} /> : null}
    </div>
  );
}
