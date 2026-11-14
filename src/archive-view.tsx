import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PickMenu } from "@/pick-filter";
import { folderHost, readFolders } from "@/lib/folders";
import { readCenters } from "@/lib/read-workbook";
import { downloadRosterTemplate, readRoster, type RosterAssign } from "@/lib/roster";
import {
  CENTERS,
  centerList,
  LINE_LABELS,
  lineCountOf,
  type ArchiveRow,
  type ArchiveKind,
  type CenterId,
  type Job,
  archiveDayRows,
  archiveFileMeta,
  formatHm,
  isoWeekOf,
  monthOf,
  rollupArchive,
} from "@/lib/productivity";

const nf = new Intl.NumberFormat("ko-KR");

type Batch = {
  name: string;
  date: string;
  kind: ArchiveKind;
  centers: Partial<Record<CenterId, Job[]>>;
};

type Grain = "day" | "week" | "month";
type Unit = "center" | "line" | "person";
type DptFilter = "전체" | "유제 냉장" | "FF2" | "FF1";

const LINE_BG = [
  "bg-line-1 text-on-dark",
  "bg-line-2 text-on-dark",
  "bg-line-3 text-ink",
  "bg-line-4 text-on-dark",
  "bg-line-5 text-on-dark",
  "bg-line-6 text-on-dark",
  "bg-line-7 text-on-dark",
  "bg-line-8 text-on-dark",
];
const CENTER_BG: Record<string, string> = {
  "1센터": "bg-line-5 text-on-dark",
  "2센터": "bg-line-2 text-on-dark",
  "3센터": "bg-line-6 text-on-dark",
};

function b64ToArrayBuffer(b64: string): ArrayBuffer {
  const clean = b64.replace(/\s/g, "");
  const bytes = Uint8Array.from(atob(clean), (char) => char.charCodeAt(0));
  return bytes.buffer;
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function hours(value: number): string {
  return value > 0 ? value.toFixed(1) : "";
}

type PersonRow = {
  key: string;
  name: string;
  period: string;
  sub: string;
  sort: string;
  dpt: string;
  center: string;
  lineText: string;
  days: number;
  planned: number;
  done: number;
  left: number;
  rate: number;
  hours: number;
  perHour: number;
  rank: string;
};

function peopleOf(days: ArchiveRow[], roster: RosterAssign[], grain: Grain, dpt: DptFilter, center: "전체" | CenterId, line: number): PersonRow[] {
  const who = new Map<string, string>();
  for (const item of roster) who.set(`${item.date}|${item.center}|${item.line}`, item.name);
  const map = new Map<string, PersonRow & { daySet: Set<string>; centers: Set<string>; spots: Map<string, Set<number>>; dpts: Set<string> }>();
  for (const row of days) {
    if (row.line === 0) continue;
    if (dpt !== "전체" && row.dpt !== dpt) continue;
    if (center !== "전체" && row.center !== center) continue;
    if (line > 0 && row.line !== line) continue;
    const date = row.sort.slice(0, 10);
    const name = who.get(`${date}|${row.center}|${row.line}`);
    if (!name) continue;
    const week = isoWeekOf(date);
    const period = grain === "day" ? row.period : grain === "week" ? week.label : monthOf(date);
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
      daySet: new Set<string>(),
      centers: new Set<string>(),
      spots: new Map<string, Set<number>>(),
      dpts: new Set<string>(),
    };
    acc.planned += row.planned;
    acc.done += row.done;
    acc.hours += row.hours;
    acc.daySet.add(date);
    acc.centers.add(row.center);
    const lines = acc.spots.get(row.center) ?? new Set<number>();
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
    const centerNames = [...acc.centers].sort((a, b) => CENTERS.indexOf(a as CenterId) - CENTERS.indexOf(b as CenterId));
    acc.center = centerNames.join(" · ");
    acc.lineText = personLines(acc.spots);
    acc.dpt = acc.dpts.size === 1 ? ([...acc.dpts][0] ?? "") : "여러 DPT";
    acc.sub = grain === "day" ? acc.sub : grain === "week" ? acc.sub : `${acc.days}일`;
    return acc;
  });
  const groups = new Map<string, PersonRow[]>();
  for (const row of list) {
    const bucket = groups.get(row.sort) ?? [];
    bucket.push(row);
    groups.set(row.sort, bucket);
  }
  for (const bucket of groups.values()) {
    [...bucket].sort((a, b) => b.perHour - a.perHour).forEach((row, index) => {
      row.rank = row.perHour > 0 ? String(index + 1) : "";
    });
  }
  return list.sort((a, b) => a.sort.localeCompare(b.sort) || Number(a.rank || 99) - Number(b.rank || 99));
}

function allows(picked: string[] | null, value: string) {
  if (picked == null) return true;
  return picked.includes(value);
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
      setBox({ top: rect.bottom + 4, left: Math.max(8, Math.min(rect.left, window.innerWidth - 300)) });
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
    <div ref={menuRef} className="fixed z-[80] w-[280px] rounded-xl border border-black/10 bg-white p-2 text-[#1c1c1e] shadow-[0_8px_24px_rgba(0,0,0,0.16)]" style={{ top: box.top, left: box.left }}>
      <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`${label} 검색`} className="h-8 w-full rounded-md border border-black/10 px-2 text-[13px] font-normal outline-none" />
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[12px] font-normal">
        <button type="button" className="font-semibold text-[#007aff]" onClick={() => onChange(null)}>전체 초기화</button>
        <button type="button" className="text-[#8e8e93]" onClick={() => onChange(clearFound(picked, found.map((item) => item.id), options.map((item) => item.id)))}>(검색 선택) 초기화</button>
      </div>
      <ul className="mt-1 max-h-64 overflow-auto font-normal">
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
      <button ref={buttonRef} type="button" aria-label={`${label} 필터`} aria-expanded={open} className={"grid size-5 place-items-center rounded " + (on ? "bg-white text-[#007aff]" : "text-white/80 hover:bg-white/15")} onClick={(event) => { event.stopPropagation(); setOpen((value) => !value); }}>
        <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path fill="currentColor" d="M1 1.5h10L7.2 6.2V10L4.8 8.7V6.2L1 1.5z" /></svg>
      </button>
      {menu}
    </>
  );
}

function cellText(value: unknown): string {
  const text = value == null ? "" : String(value).trim();
  return text || "없음";
}

function mainCell(row: ArchiveRow, key: string): string {
  if (key === "sort") return cellText(row.period);
  if (key === "sub") return cellText(row.sub);
  if (key === "dpt") return cellText(row.dpt);
  if (key === "center") return cellText(row.center);
  if (key === "line") return cellText(`${row.line}라인`);
  if (key === "days") return nf.format(row.days || 0);
  if (key === "planned") return nf.format(row.planned || 0);
  if (key === "done") return nf.format(row.done || 0);
  if (key === "left") return nf.format(row.left || 0);
  if (key === "rate") return pct(row.rate || 0);
  if (key === "first") return cellText(formatHm(row.first));
  if (key === "last") return cellText(formatHm(row.last));
  if (key === "hours") return cellText(hours(row.hours || 0));
  if (key === "perHour") return cellText(row.perHour ? Number(row.perHour).toFixed(0) : "");
  return "없음";
}

function personCell(row: PersonRow, key: string): string {
  if (key === "name") return cellText(row.name);
  if (key === "sort") return cellText(row.period);
  if (key === "sub") return cellText(row.sub);
  if (key === "dpt") return cellText(row.dpt);
  if (key === "center") return cellText(row.center);
  if (key === "lineText") return cellText(row.lineText);
  if (key === "hours") return cellText(hours(row.hours || 0));
  if (key === "perHour") return cellText(row.perHour ? row.perHour.toFixed(0) : "");
  if (key === "rank") return cellText(row.rank);
  return "없음";
}

function personLines(spots: Map<string, Set<number>>): string {
  const centers = [...spots.keys()].sort((a, b) => CENTERS.indexOf(a as CenterId) - CENTERS.indexOf(b as CenterId));
  if (centers.length <= 1) {
    return [...(spots.get(centers[0] ?? "") ?? [])].sort((a, b) => a - b).map((n) => `${n}라인`).join(" ");
  }
  return centers.map((center) => {
    const lines = [...(spots.get(center) ?? [])].sort((a, b) => a - b);
    if (lines.length === 0) return "";
    return `${center}${lines[0]}라인${lines.slice(1).map((n) => `,${n}라인`).join("")}`;
  }).filter(Boolean).join(" / ");
}

export function ArchiveView({ seed = [], active = false }: { seed?: { name: string; buf: ArrayBuffer }[]; active?: boolean }) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(0);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [folderRows, setFolderRows] = useState<ArchiveRow[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [grain, setGrain] = useState<Grain>("day");
  const [unit, setUnit] = useState<Unit>("center");
  const [dpt, setDpt] = useState<"전체" | "유제 냉장" | "FF2" | "FF1">("전체");
  const [center, setCenter] = useState<"전체" | CenterId>("전체");
  const [line, setLine] = useState(0);
  const lineMax = lineCountOf(center as CenterId);
  useEffect(() => {
    if (line > lineMax) setLine(0);
  }, [line, lineMax]);
  const [roster, setRoster] = useState<RosterAssign[]>([]);
  const [rosterNote, setRosterNote] = useState("");
  const [sortKey, setSortKey] = useState("period");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [picks, setPicks] = useState<Record<string, string[] | null>>({});
  const seeded = useRef(false);
  const [company, setCompany] = useState(false);
  useEffect(() => {
    setCompany(Boolean((window as Window & { __COMPANY_PC__?: boolean }).__COMPANY_PC__));
  }, []);

  const loaded = useMemo(() => [...folderRows, ...batches.flatMap((batch) => archiveDayRows(batch.date, batch.kind, batch.centers))], [folderRows, batches]);
  const days = useMemo(() => (month === 0 ? loaded : loaded.filter((row) => Number(String(row.sort ?? "").slice(5, 7)) === month)), [loaded, month]);
  const rolled = useMemo(() => (grain === "day" ? days : rollupArchive(days, grain)), [days, grain]);
  const rows = useMemo(
    () =>
      rolled.filter((row) => {
        if (unit === "center" ? row.line !== 0 : row.line === 0) return false;
        if (dpt !== "전체" && row.dpt !== dpt) return false;
        if (center !== "전체" && row.center !== center) return false;
        if (unit === "line" && line > 0 && row.line !== line) return false;
        return true;
      }),
    [rolled, unit, dpt, center, line],
  );
  const people = useMemo(() => peopleOf(days, roster, grain, dpt, center, line), [days, roster, grain, dpt, center, line]);
  const columnKeys = unit === "person"
    ? ["name", "sort", "sub", "dpt", "center", "lineText", "hours", "perHour", "rank"]
    : ["sort", "sub", "dpt", "center", ...(unit === "line" ? ["line"] : []), "days", "planned", "done", "left", "rate", "first", "last", "hours", "perHour"];
  const source = unit === "person" ? people : rows;
  function columnOf(row: PersonRow | ArchiveRow, key: string) {
    return unit === "person" ? personCell(row as PersonRow, key) : mainCell(row as ArchiveRow, key);
  }
  function matches(row: PersonRow | ArchiveRow, skip?: string) {
    return columnKeys.every((key) => key === skip || allows(picks[key] ?? null, columnOf(row, key)));
  }
  const filtered = source.filter((row) => matches(row));
  const shown = filtered;
  const totals = filtered.reduce(
    (sum, row) => ({ planned: sum.planned + row.planned, done: sum.done + row.done, hours: sum.hours + row.hours }),
    { planned: 0, done: 0, hours: 0 },
  );
  function choices(key: string) {
    const values = new Set<string>();
    for (const row of source) {
      if (matches(row, key)) values.add(columnOf(row, key));
    }
    return [...values].sort((a, b) => a.localeCompare(b, "ko", { numeric: true })).map((id) => ({ id, label: id, search: id.toLowerCase() }));
  }

  async function ingest(items: { name: string; buf: ArrayBuffer }[], fileYear: number) {
    if (items.length === 0) return;
    setError("");
    const next = [...batches];
    const notes: string[] = [];
    for (const item of items) {
      const meta = archiveFileMeta(item.name, fileYear);
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
        next.push({ name: item.name, date: meta.date, kind: meta.kind, centers: parsed.centers });
      } catch (err) {
        notes.push(err instanceof Error ? `${item.name}: ${err.message}` : item.name);
      }
    }
    next.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));
    setBatches(next);
    setBusy("");
    setError(notes.join(" "));
  }

  useEffect(() => {
    if (seeded.current || seed.length === 0) return;
    seeded.current = true;
    void ingest(seed, year);
  }, [seed, year]);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" || key === "period" || key === "center" || key === "dpt" ? "asc" : "desc");
    }
  }

  function ordered<T extends object>(list: T[]): T[] {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey];
      const bv = (b as Record<string, unknown>)[sortKey];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return String(av).localeCompare(String(bv), "ko", { numeric: true }) * dir;
    });
  }

  async function addFiles(list: FileList | File[]) {
    const files = [...list];
    if (files.length === 0 || busy) return;
    const items = await Promise.all(files.map(async (file) => ({ name: file.name, buf: await file.arrayBuffer() })));
    await ingest(items, year);
  }

  async function loadRoster(buf: ArrayBuffer, name: string) {
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

  const rosterRef = useRef(roster);
  rosterRef.current = roster;

  async function loadRosterFiles(items: { name: string; buf: ArrayBuffer }[], reset: boolean) {
    setBusy("근태표 읽는 중");
    setError("");
    try {
      const merged = new Map<string, RosterAssign>();
      if (!reset) {
        for (const row of rosterRef.current) merged.set(`${row.date}|${row.center}|${row.line}`, row);
      }
      const missed: string[] = [];
      for (const item of items) {
        const next = await readRoster(item.buf, yearRef.current);
        if (next.length === 0) {
          missed.push(item.name);
          continue;
        }
        for (const row of next) merged.set(`${row.date}|${row.center}|${row.line}`, row);
      }
      const list = [...merged.values()].sort((a, b) => a.date.localeCompare(b.date) || a.center.localeCompare(b.center, "ko") || a.line - b.line);
      rosterRef.current = list;
      setRoster(list);
      const dates = [...new Set(list.map((item) => item.date))].sort();
      const names = new Set(list.map((item) => item.name));
      const span = dates.length ? `${dates[0]?.slice(5)}~${dates[dates.length - 1]?.slice(5)}` : "";
      setRosterNote(list.length ? `${dates.length}일 · ${span} · ${names.size}명` : "");
      setError(missed.length ? `${missed.join(", ")} 에서 소분류 라인 이름을 찾지 못했습니다.` : "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "근태표를 읽지 못했습니다.");
    }
    setBusy("");
  }

  const yearRef = useRef(year);
  yearRef.current = year;
  const ingestRef = useRef(ingest);
  ingestRef.current = ingest;
  const loadRosterRef = useRef(loadRoster);
  loadRosterRef.current = loadRoster;
  const loadRosterFilesRef = useRef(loadRosterFiles);
  loadRosterFilesRef.current = loadRosterFiles;
  const asked = useRef("");
  const rosterQueue = useRef(Promise.resolve());

  useEffect(() => {
    const host = (window as unknown as { chrome?: { webview?: { addEventListener: (type: string, cb: (event: { data: unknown }) => void) => void; removeEventListener: (type: string, cb: (event: { data: unknown }) => void) => void } } }).chrome?.webview;
    if (!host) return;
    const onMessage = (event: { data: unknown }) => {
      const data = typeof event.data === "string" ? (JSON.parse(event.data) as { type?: string; name?: string; b64?: string; reset?: boolean; files?: { name?: string; b64?: string }[] }) : (event.data as { type?: string; name?: string; b64?: string; reset?: boolean; files?: { name?: string; b64?: string }[] });
      if (data?.type === "roster" && data.b64) void loadRosterRef.current(b64ToArrayBuffer(data.b64), data.name || "근태표");
      if (data?.type === "roster-files" && Array.isArray(data.files)) {
        const items = data.files.filter((item) => item.b64).map((item) => ({ name: item.name || "근태표.xlsx", buf: b64ToArrayBuffer(item.b64 || "") }));
        if (items.length) rosterQueue.current = rosterQueue.current.then(() => loadRosterFilesRef.current(items, data.reset !== false));
      }
      if (data?.type === "archive-status") {
        const text = (data as { text?: string }).text;
        setBusy(text || "");
        return;
      }
      if (data?.type === "archive-rows" && Array.isArray((data as { rows?: ArchiveRow[] }).rows)) {
        const payload = data as { rows?: ArchiveRow[]; note?: string };
        setFolderRows(payload.rows ?? []);
        setBusy("");
        setError(payload.note || "");
        return;
      }
      if (data?.type === "archive-files" && Array.isArray(data.files)) {
        const items = data.files.filter((item) => item.b64).map((item) => ({ name: item.name || "작업.xlsx", buf: b64ToArrayBuffer(item.b64 || "") }));
        if (items.length) void ingestRef.current(items, yearRef.current);
      }
    };
    host.addEventListener("message", onMessage);
    return () => host.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!active) return;
    const paths = readFolders();
    const mark = `${paths.work}|${paths.roster}|${year}`;
    if (!mark.replace("|", "") || asked.current === mark) return;
    asked.current = mark;
    const host = folderHost();
    if (!host) return;
    if (paths.work) {
      setBusy("폴더 읽는 중");
      host.postMessage("read-folder:work|" + year);
    }
    if (paths.roster) host.postMessage("read-folder:roster");
  }, [active, year]);

  async function download() {
    if (days.length === 0) return;
    setBusy("엑셀 만드는 중");
    setError("");
    try {
      const { buildProductivityReport } = await import("@/lib/productivity-report");
      const people = {
        day: peopleOf(days, roster, "day", "전체", "전체", 0),
        week: peopleOf(days, roster, "week", "전체", "전체", 0),
        month: peopleOf(days, roster, "month", "전체", "전체", 0),
      };
      const buffer = await buildProductivityReport(days, people);
      const name = "생산성자료.xlsx";
      const bytes = new Uint8Array(buffer as ArrayBuffer);
      const host = (window as unknown as { chrome?: { webview?: { postMessage: (msg: string) => void } } }).chrome?.webview;
      if (company && host) {
        let binary = "";
        const chunk = 0x8000;
        for (let index = 0; index < bytes.length; index += chunk) binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
        host.postMessage(JSON.stringify({ type: "save-xlsx", name, b64: btoa(binary) }));
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

  function mark(label: string, k: string) {
    const on = sortKey === k;
    return (
      <th key={k} className="whitespace-nowrap border border-header px-2 py-2 font-bold">
        <span className="inline-flex items-center gap-1">
          <button type="button" className="font-bold text-on-dark" onClick={() => toggleSort(k)}>
            {label}
            {on ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
          </button>
          <ColFilter label={label} options={choices(k)} picked={picks[k] ?? null} onChange={(next) => setPicks((prev) => ({ ...prev, [k]: next }))} />
        </span>
      </th>
    );
  }

  return (
    <div className="ios-sheet">
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-black/5 bg-white/90 px-3 py-2 backdrop-blur">
        <p className="min-w-0 flex-1 truncate text-[17px] font-semibold text-[#1c1c1e]">생산성 분석</p>
        {batches.length > 0 || folderRows.length > 0 ? (
          <button type="button" onClick={() => { setBatches([]); setFolderRows([]); }} className="h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold text-[#ff3b30]">
            비우기
          </button>
        ) : null}
        {company ? (
          <button
            type="button"
            className="h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold"
            onClick={() =>
              (window as unknown as { chrome?: { webview?: { postMessage: (msg: string) => void } } }).chrome?.webview?.postMessage("archive")
            }
          >
            생산성 파일
          </button>
        ) : (
          <label className="inline-flex h-9 cursor-pointer items-center rounded-full border border-black/10 bg-white px-3 text-xs font-semibold">
            생산성 파일
            <input
              type="file"
              accept=".xlsx,.xls,.xlsm"
              multiple
              className="sr-only"
              onChange={(event) => {
                const files = event.target.files;
                if (files) void addFiles(files);
                event.target.value = "";
              }}
            />
          </label>
        )}
        {company ? (
          <button
            type="button"
            className="h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold"
            onClick={() =>
              (window as unknown as { chrome?: { webview?: { postMessage: (msg: string) => void } } }).chrome?.webview?.postMessage("roster")
            }
          >
            근태표
          </button>
        ) : (
          <label className="inline-flex h-9 cursor-pointer items-center rounded-full border border-black/10 bg-white px-3 text-xs font-semibold">
            근태표
            <input
              type="file"
              accept=".xlsx,.xls,.xlsm"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void file.arrayBuffer().then((buf) => loadRoster(buf, file.name));
                event.target.value = "";
              }}
            />
          </label>
        )}
        <button
          type="button"
          onClick={() => void downloadRosterTemplate()}
          className="h-9 rounded-full bg-[#007aff] px-3 text-xs font-semibold text-white"
        >
          근태양식
        </button>
        <button
          type="button"
          disabled={days.length === 0}
          onClick={() => void download()}
          className="h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold disabled:opacity-40"
        >
          엑셀로 받기
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-3 py-3">
        <span className="text-sm font-bold">연도</span>
        <input
          id="archive-year"
          aria-label="연도"
          type="number"
          min={2020}
          max={2100}
          value={year}
          onChange={(event) => setYear(Number(event.target.value) || 2026)}
          className="h-10 w-24 rounded-xl border border-black/10 bg-white px-3 text-sm font-medium"
        />
        <span className="text-sm font-bold">월</span>
        <select
          aria-label="월"
          value={month}
          onChange={(event) => setMonth(Number(event.target.value) || 0)}
          className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm font-medium"
        >
          <option value={0}>전체</option>
          {Array.from({ length: 12 }, (_, index) => (
            <option key={index + 1} value={index + 1}>{index + 1}월</option>
          ))}
        </select>
        {busy ? <span className="text-sm font-bold text-title">{busy}</span> : null}
        {rosterNote ? <span className="text-sm font-bold text-title">{rosterNote}</span> : null}
      </div>
      {error ? <p className="px-3 pb-2 text-sm font-medium text-line-1">{error}</p> : null}
      <div className="flex flex-wrap gap-1 px-3">
        {batches.map((batch) => (
          <span key={`${batch.date}-${batch.kind}`} className="rounded-sm bg-ice px-2 py-1 text-xs font-bold text-title">
            {batch.date.slice(5)} {batch.kind}
          </span>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 px-3 py-2">
        <PickMenu
          label="기간"
          value={grain}
          onChange={(id) => setGrain(id as Grain)}
          options={[
            { id: "day", label: "일별" },
            { id: "week", label: "주별" },
            { id: "month", label: "월별" },
          ]}
        />
        <PickMenu
          label="보기"
          value={unit}
          onChange={(id) => setUnit(id as Unit)}
          options={[
            { id: "center", label: "센터" },
            { id: "line", label: "라인" },
            { id: "person", label: "사람" },
          ]}
        />
        <PickMenu
          label="DPT"
          value={dpt}
          onChange={(id) => setDpt(id as DptFilter)}
          options={[
            { id: "전체", label: "전체" },
            { id: "유제 냉장", label: "유제 냉장" },
            { id: "FF2", label: "FF2" },
            { id: "FF1", label: "FF1" },
          ]}
        />
        <PickMenu
          label="센터"
          value={center}
          onChange={(id) => setCenter(id as "전체" | CenterId)}
          options={[{ id: "전체", label: "전체" }, ...centerList().map((id) => ({ id, label: id }))]}
        />
        {unit !== "center" ? (
          <PickMenu
            label="라인"
            value={String(line)}
            onChange={(id) => setLine(Number(id))}
            options={[{ id: "0", label: "전체" }, ...LINE_LABELS.slice(0, lineMax).map((label, index) => ({ id: String(index + 1), label: `${index + 1}라인` }))]}
          />
        ) : null}
      </div>
      {days.length > 0 ? (
        <div className="mx-3 mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-sm bg-title px-3 py-2 text-on-dark">
            <p className="text-xs font-bold">작업건수</p>
            <p className="text-2xl font-bold tabular-nums">{nf.format(totals.planned)}</p>
          </div>
          <div className="rounded-sm bg-header px-3 py-2 text-on-dark">
            <p className="text-xs font-bold">완료건수</p>
            <p className="text-2xl font-bold tabular-nums">{nf.format(totals.done)}</p>
          </div>
          <div className="rounded-sm bg-line-4 px-3 py-2 text-on-dark">
            <p className="text-xs font-bold">완료율</p>
            <p className="text-2xl font-bold tabular-nums">{totals.planned ? pct(totals.done / totals.planned) : "—"}</p>
          </div>
          <div className="rounded-sm bg-mark px-3 py-2 text-on-dark">
            <p className="text-xs font-bold">건/시</p>
            <p className="text-2xl font-bold tabular-nums">{totals.hours > 0 ? (totals.done / totals.hours).toFixed(0) : "—"}</p>
          </div>
        </div>
      ) : null}
      {source.length === 0 ? (
        <p className="px-3 py-6 text-sm text-muted">
          {unit === "person"
            ? roster.length === 0
              ? "오른쪽 근태양식을 받아 위 날짜를 고치고, 소분류에 이름을 적은 뒤 근태표로 올리세요."
              : "배치된 사람과 같은 날짜의 생산성 파일이 없습니다."
            : "1019_FF1, 1019_FF2처럼 보관해 둔 업로드 파일을 여러 개 고르면 일별·주별·월별 생산성이 나옵니다."}
        </p>
      ) : unit === "person" ? (
        <div className="overflow-auto px-3 pb-4">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="bg-header text-left text-on-dark">
                {[
                  ["이름", "name"],
                  ["기간", "sort"],
                  [grain === "day" ? "요일" : "구간", "sub"],
                  ["DPT", "dpt"],
                  ["센터", "center"],
                  ["라인", "lineText"],
                  ["시간", "hours"],
                  ["건/시", "perHour"],
                  ["순위", "rank"],
                ].map(([label, k]) => mark(label, k))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-slate font-bold">
                <td className="border border-grid px-2 py-2">전체</td>
                <td className="border border-grid px-2 py-2" colSpan={5} />
                <td className="border border-grid px-2 py-2 text-right tabular-nums">{hours(totals.hours)}</td>
                <td className="border border-grid px-2 py-2 text-right tabular-nums">{totals.hours > 0 ? (totals.done / totals.hours).toFixed(0) : ""}</td>
                <td className="border border-grid px-2 py-2" />
              </tr>
              {shown.length === 0 ? (
                <tr>
                  <td className="border border-grid px-2 py-3 text-muted" colSpan={9}>필터에 맞는 행이 없습니다.</td>
                </tr>
              ) : ordered(shown as PersonRow[]).map((row) => (
                <tr key={row.key}>
                  <th className="whitespace-nowrap border border-grid bg-ice px-2 py-1.5 text-left font-bold">{row.name}</th>
                  <td className="whitespace-nowrap border border-grid px-2 py-1.5">{row.period}</td>
                  <td className="whitespace-nowrap border border-grid px-2 py-1.5">{row.sub}</td>
                  <td className="whitespace-nowrap border border-grid px-2 py-1.5">{row.dpt}</td>
                  <td className={`whitespace-nowrap border border-grid px-2 py-1.5 font-bold ${CENTER_BG[row.center] ?? ""}`}>{row.center}</td>
                  <td className="whitespace-nowrap border border-grid px-2 py-1.5 font-bold">{row.lineText}</td>
                  <td className="border border-grid px-2 py-1.5 text-right tabular-nums">{hours(row.hours)}</td>
                  <td className="border border-grid px-2 py-1.5 text-right font-bold tabular-nums">{row.perHour ? row.perHour.toFixed(0) : ""}</td>
                  <td className="border border-grid px-2 py-1.5 text-center font-bold">{row.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted">
            1·2·3센터 소분류에 적힌 이름을 그 라인 작업자로 봅니다. 생산성 파일과 같은 날짜만 붙습니다. 같은 날 여러 DPT가 있으면 건수와 시간을 더합니다. 여러 센터를 한 사람이 하면 라인은 1센터1라인,2라인 / 2센터5라인처럼 센터별로 적습니다.
          </p>
        </div>
      ) : (
        <div className="overflow-auto px-3 pb-4">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="bg-header text-left text-on-dark">
                {[
                  ["기간", "sort"],
                  [grain === "day" ? "요일" : "구간", "sub"],
                  ["DPT", "dpt"],
                  ["센터", "center"],
                  ...(unit === "line" ? [["라인", "line"]] : []),
                  ["일수", "days"],
                  ["작업건수", "planned"],
                  ["완료건수", "done"],
                  ["잔여건수", "left"],
                  ["몇 %", "rate"],
                  ["시작", "first"],
                  ["끝", "last"],
                  ["시간", "hours"],
                  ["건/시", "perHour"],
                ].map(([label, k]) => mark(label, k))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-slate font-bold">
                <td className="border border-grid px-2 py-2">전체</td>
                <td className="border border-grid px-2 py-2" colSpan={unit === "line" ? 5 : 4} />
                <td className="border border-grid px-2 py-2 text-right tabular-nums">{nf.format(totals.planned)}</td>
                <td className="border border-grid px-2 py-2 text-right tabular-nums">{nf.format(totals.done)}</td>
                <td className="border border-grid px-2 py-2 text-right tabular-nums">{nf.format(Math.max(0, totals.planned - totals.done))}</td>
                <td className="border border-grid px-2 py-2 text-right tabular-nums">{totals.planned ? pct(totals.done / totals.planned) : ""}</td>
                <td className="border border-grid px-2 py-2" colSpan={2} />
                <td className="border border-grid px-2 py-2 text-right tabular-nums">{hours(totals.hours)}</td>
                <td className="border border-grid px-2 py-2 text-right tabular-nums">{totals.hours > 0 ? (totals.done / totals.hours).toFixed(0) : ""}</td>
              </tr>
              {shown.length === 0 ? (
                <tr>
                  <td className="border border-grid px-2 py-3 text-muted" colSpan={unit === "line" ? 14 : 13}>필터에 맞는 행이 없습니다.</td>
                </tr>
              ) : ordered(shown as ArchiveRow[]).map((row) => (
                <tr key={`${row.sort}-${row.dpt}-${row.center}-${row.line}`}>
                  <td className="whitespace-nowrap border border-grid px-2 py-1.5 font-bold">{row.period}</td>
                  <td className="whitespace-nowrap border border-grid px-2 py-1.5">{row.sub}</td>
                  <td className="whitespace-nowrap border border-grid px-2 py-1.5 font-bold">{row.dpt}</td>
                  <td className={`whitespace-nowrap border border-grid px-2 py-1.5 font-bold ${CENTER_BG[row.center] ?? ""}`}>{row.center}</td>
                  {unit === "line" ? (
                    <td className={`whitespace-nowrap border border-grid px-2 py-1.5 font-bold ${LINE_BG[row.line - 1] ?? ""}`}>{row.line}라인</td>
                  ) : null}
                  <td className="border border-grid px-2 py-1.5 text-right tabular-nums">{row.days}</td>
                  <td className="border border-grid px-2 py-1.5 text-right tabular-nums">{nf.format(row.planned)}</td>
                  <td className="border border-grid px-2 py-1.5 text-right tabular-nums">{nf.format(row.done)}</td>
                  <td className="border border-grid px-2 py-1.5 text-right tabular-nums">{nf.format(row.left)}</td>
                  <td className="border border-grid px-2 py-1.5 text-right font-bold tabular-nums">{pct(row.rate)}</td>
                  <td className="border border-grid px-2 py-1.5 text-center tabular-nums">{formatHm(row.first)}</td>
                  <td className="border border-grid px-2 py-1.5 text-center tabular-nums">{formatHm(row.last)}</td>
                  <td className="border border-grid px-2 py-1.5 text-right tabular-nums">{hours(row.hours)}</td>
                  <td className="border border-grid px-2 py-1.5 text-right font-bold tabular-nums">{row.perHour ? row.perHour.toFixed(0) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted">
            시간은 그날 첫 완료부터 마지막 완료까지입니다. 주·월은 그 날들을 더한 값입니다. FF1은 300번대, FF2 파일은 유제·냉장(100번대)과 FF2(200번대)로 나뉩니다.
          </p>
        </div>
      )}
    </div>
  );
}
