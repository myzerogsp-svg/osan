import type { PanelCenter, PanelState } from "./panel-store";

function stampOf(state: PanelState | undefined) {
  const stamp = Number(state?.savedAt);
  return Number.isFinite(stamp) ? stamp : 0;
}

function cleanCenter(center: PanelCenter | undefined): PanelCenter | null {
  const id = String(center?.id ?? "").trim();
  const lines = Math.max(1, Math.min(12, Math.round(Number(center?.lines) || 0)));
  if (!/^[1-9]센터$/.test(id) || lines <= 0) return null;
  return { id, lines };
}

function mergeSites(base: PanelState, incoming: PanelState, incomingNewer: boolean) {
  const byName = new Map<string, { name: string; centers: PanelCenter[] }>();
  const put = (site: { name?: string; centers?: PanelCenter[] } | undefined, prefer: boolean) => {
    const name = String(site?.name ?? "").trim();
    if (!name) return;
    const centers = (site?.centers ?? []).map(cleanCenter).filter((center): center is PanelCenter => center != null);
    if (centers.length === 0) return;
    const prev = byName.get(name);
    if (!prev) {
      byName.set(name, { name, centers });
      return;
    }
    const map = new Map<string, PanelCenter>();
    const older = prefer ? prev.centers : centers;
    const newer = prefer ? centers : prev.centers;
    for (const center of older) map.set(center.id, center);
    for (const center of newer) map.set(center.id, center);
    byName.set(name, { name, centers: [...map.values()] });
  };
  for (const site of base.sites ?? []) put(site, false);
  for (const site of incoming.sites ?? []) put(site, incomingNewer);
  return [...byName.values()];
}

function mergeRecords<T>(base: Record<string, T> | undefined, incoming: Record<string, T> | undefined, incomingNewer: boolean) {
  const next: Record<string, T> = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(incoming ?? {})) {
    if (value == null) continue;
    if (incomingNewer || !(key in next)) next[key] = value;
  }
  return next;
}

export function mergePanel(base: PanelState, incoming: PanelState): PanelState {
  const incomingNewer = stampOf(incoming) >= stampOf(base);
  const sites = mergeSites(base, incoming, incomingNewer);
  const layouts = mergeRecords(base.layouts, incoming.layouts, incomingNewer);
  const codes = mergeRecords(base.codes, incoming.codes, incomingNewer);
  const frozenLocs = mergeRecords(base.frozenLocs, incoming.frozenLocs, incomingNewer);
  const savedAt = Math.max(stampOf(base), stampOf(incoming));
  return {
    ...(sites.length ? { sites } : {}),
    ...(Object.keys(codes).length ? { codes } : {}),
    ...(Object.keys(layouts).length ? { layouts } : {}),
    ...(Object.keys(frozenLocs).length ? { frozenLocs } : {}),
    savedAt,
  };
}

export function asPanel(value: unknown): PanelState {
  if (!value || typeof value !== "object") return {};
  const record = value as PanelState & { state?: PanelState };
  const state = record.state && typeof record.state === "object" ? record.state : record;
  return {
    sites: Array.isArray(state.sites) ? state.sites : undefined,
    codes: state.codes && typeof state.codes === "object" ? state.codes : undefined,
    layouts: state.layouts && typeof state.layouts === "object" ? state.layouts : undefined,
    frozenLocs: state.frozenLocs && typeof state.frozenLocs === "object" ? state.frozenLocs : undefined,
    savedAt: Number(state.savedAt) || 0,
  };
}
