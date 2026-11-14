import { onSharedPanel, readPanel, writePanel } from "./panel-store";
import { OSAN_FROZEN, OSAN_FROZEN_DAY, OSAN_FROZEN_FILE } from "./frozen-osan";

export type FrozenSpot = { zone: string; loc: string };
export type FrozenBook = { site: string; fileName: string; updatedAt: number; count: number; builtin: boolean };

type Index = { byAddr: Map<string, FrozenSpot>; byLoc: Map<string, FrozenSpot>; fileName: string; updatedAt: number; count: number; builtin: boolean };

const listeners = new Set<() => void>();
let cache = new Map<string, Index>();

function keyOf(value: string) {
  return value.replace(/\.0$/, "").replace(/\s/g, "").toUpperCase();
}

function indexRows(rows: [string, string, string][], fileName: string, updatedAt: number, builtin: boolean): Index {
  const byAddr = new Map<string, FrozenSpot>();
  const byLoc = new Map<string, FrozenSpot>();
  for (const [addr, zone, loc] of rows) {
    if (!zone || !loc) continue;
    const spot = { zone, loc };
    const address = keyOf(addr);
    if (address) byAddr.set(address, spot);
    byLoc.set(keyOf(loc), spot);
  }
  return { byAddr, byLoc, fileName, updatedAt, count: byLoc.size, builtin };
}

function savedBook(site: string) {
  const book = readPanel().frozenLocs?.[site];
  if (!book || !Array.isArray(book.rows) || !book.rows.length) return null;
  return indexRows(book.rows, book.fileName || "냉동 로케이션.xlsx", Number(book.updatedAt) || Date.now(), false);
}

function bookOf(site: string) {
  const saved = savedBook(site);
  if (saved) return saved;
  if (site === "신오산") return indexRows(OSAN_FROZEN, OSAN_FROZEN_FILE, Date.parse(`${OSAN_FROZEN_DAY}T12:00:00+09:00`), true);
  return null;
}

function cached(site: string) {
  const found = cache.get(site);
  if (found) return found;
  const next = bookOf(site);
  if (next) cache.set(site, next);
  return next;
}

export function refreshFrozen() {
  cache = new Map();
  listeners.forEach((listener) => listener());
}

onSharedPanel(() => refreshFrozen());

export function subscribeFrozen(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function frozenBook(site: string): FrozenBook | null {
  const book = cached(site);
  if (!book) return null;
  return { site, fileName: book.fileName, updatedAt: book.updatedAt, count: book.count, builtin: book.builtin };
}

export function matchFrozen(site: string, raw: string): FrozenSpot | null {
  const book = cached(site);
  if (!book || !raw) return null;
  const key = keyOf(raw);
  return book.byAddr.get(key) ?? book.byLoc.get(key) ?? null;
}

export function frozenDay(at: number) {
  const date = new Date(at);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export async function readFrozenFile(file: File): Promise<[string, string, string][]> {
  const xlsx = await import("xlsx");
  const book = xlsx.read(await file.arrayBuffer(), { type: "array", cellDates: false });
  const rows: [string, string, string][] = [];
  for (const name of book.SheetNames) {
    const grid = xlsx.utils.sheet_to_json(book.Sheets[name], { header: 1, raw: true, defval: "" }) as unknown[][];
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
      rows.push([addr, zone, loc]);
    }
  }
  return rows;
}

export function saveFrozen(site: string, fileName: string, rows: [string, string, string][]) {
  const current = { ...(readPanel().frozenLocs ?? {}) };
  current[site] = { fileName, updatedAt: Date.now(), rows };
  writePanel({ frozenLocs: current });
  refreshFrozen();
}

export function clearFrozen(site: string) {
  const current = { ...(readPanel().frozenLocs ?? {}) };
  delete current[site];
  writePanel({ frozenLocs: current });
  refreshFrozen();
}
