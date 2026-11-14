import { asPanel, mergePanel } from "./panel-merge";
import { schedulePanelPush } from "./panel-sync";

export type PanelCode = { name: string; master: string };
export type PanelCenter = { id: string; lines: number };
export type PanelSite = { name: string; centers: PanelCenter[] };
export type PanelState = { sites?: PanelSite[]; codes?: Record<string, PanelCode>; layouts?: Record<string, PanelLayoutLine[]>; frozenLocs?: Record<string, { fileName: string; updatedAt: number; rows: [string, string, string][] }>; savedAt?: number };

export type PanelLayoutLine = { line: number; left: string[]; right: string[] };

const KEY = "center-panel";
const sharedListeners = new Set<(state: PanelState) => void>();

function readStored(): PanelState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PanelState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function readPanel(): PanelState {
  const stored = readStored();
  if (typeof window === "undefined") return stored;
  const boot = (window as unknown as { __PANEL__?: PanelState }).__PANEL__;
  if (!boot || typeof boot !== "object") return stored;
  const merged = mergePanel(stored, asPanel(boot));
  if (JSON.stringify(merged) !== JSON.stringify(stored)) {
    try { localStorage.setItem(KEY, JSON.stringify(merged)); } catch {}
  }
  return merged;
}

export function onSharedPanel(listener: (state: PanelState) => void) {
  sharedListeners.add(listener);
  return () => sharedListeners.delete(listener);
}

export function applySharedPanel(state: PanelState) {
  if (!state || typeof state !== "object" || typeof window === "undefined") return;
  const merged = mergePanel(readStored(), asPanel(state));
  (window as unknown as { __PANEL__?: PanelState }).__PANEL__ = merged;
  try {
    localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {}
  sharedListeners.forEach((listener) => listener(merged));
}

export function writePanel(patch: Partial<PanelState>) {
  const next = { ...readPanel(), ...patch, savedAt: Date.now() };
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  (window as unknown as { __PANEL__?: PanelState }).__PANEL__ = next;
  try {
    const webview = (window as unknown as { chrome?: { webview?: { postMessage: (msg: string) => void } } }).chrome?.webview;
    webview?.postMessage("panel-save:" + JSON.stringify(next));
  } catch {}
  schedulePanelPush();
}
