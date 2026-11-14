import { onSharedPanel, readPanel, writePanel, type PanelSite } from "./panel-store";

const DEFAULTS: PanelSite[] = [
  { name: "신오산", centers: [{ id: "1센터", lines: 8 }, { id: "2센터", lines: 8 }, { id: "3센터", lines: 4 }] },
  { name: "포천", centers: [{ id: "1센터", lines: 6 }, { id: "2센터", lines: 6 }] },
];

function clean(list: PanelSite[]): PanelSite[] {
  const names = new Set<string>();
  const sites: PanelSite[] = [];
  for (const item of list) {
    const name = String(item?.name ?? "").trim();
    if (!name || names.has(name)) continue;
    const centers = (item.centers ?? [])
      .map((center) => ({ id: String(center?.id ?? "").trim(), lines: Math.max(1, Math.min(12, Math.round(Number(center?.lines) || 0))) }))
      .filter((center) => /^[1-9]센터$/.test(center.id) && center.lines > 0);
    const unique = centers.filter((center, index) => centers.findIndex((item) => item.id === center.id) === index);
    if (unique.length === 0) continue;
    names.add(name);
    sites.push({ name, centers: unique });
  }
  return sites.length > 0 ? sites : DEFAULTS.map((site) => ({ ...site, centers: site.centers.map((center) => ({ ...center })) }));
}

let sites = clean(readPanel().sites ?? []);
const listeners = new Set<() => void>();

function save() {
  writePanel({ sites });
  listeners.forEach((listener) => listener());
}

export function siteDefs() {
  return sites;
}

export function subscribeSites(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function centersOf(site: string) {
  return (sites.find((item) => item.name === site) ?? sites[0])?.centers.map((center) => center.id) ?? ["1센터"];
}

export function linesOf(site: string, center: string) {
  const found = sites.find((item) => item.name === site)?.centers.find((item) => item.id === center);
  if (found) return found.lines;
  if (site === "포천") return 6;
  return center === "3센터" ? 4 : 8;
}

export function addSite(name: string) {
  const label = name.trim();
  if (!label) return "이름을 넣어 주세요.";
  if (sites.some((item) => item.name === label)) return "이미 있는 지역입니다.";
  sites = [...sites, { name: label, centers: [{ id: "1센터", lines: 8 }] }];
  save();
  return "";
}

export function removeSite(name: string) {
  if (sites.length <= 1) return;
  sites = sites.filter((item) => item.name !== name);
  save();
}

export function addCenter(site: string) {
  sites = sites.map((item) => {
    if (item.name !== site || item.centers.length >= 9) return item;
    const used = new Set(item.centers.map((center) => center.id));
    let n = 1;
    while (used.has(`${n}센터`)) n += 1;
    return { ...item, centers: [...item.centers, { id: `${n}센터`, lines: 8 }] };
  });
  save();
}

export function removeCenter(site: string, id: string) {
  sites = sites.map((item) => {
    if (item.name !== site || item.centers.length <= 1) return item;
    return { ...item, centers: item.centers.filter((center) => center.id !== id) };
  });
  save();
}

export function setCenterLines(site: string, id: string, lines: number) {
  const next = Math.max(1, Math.min(12, Math.round(lines)));
  sites = sites.map((item) => item.name !== site ? item : {
    ...item,
    centers: item.centers.map((center) => center.id === id ? { ...center, lines: next } : center),
  });
  save();
}

onSharedPanel((state) => {
  if (!Array.isArray(state.sites)) return;
  const next = clean(state.sites);
  if (JSON.stringify(next) === JSON.stringify(sites)) return;
  sites = next;
  listeners.forEach((listener) => listener());
});
