export const FOLDER_ITEMS = [
  { id: "work", label: "작업 내역", uses: "생산성 분석" },
  { id: "roster", label: "근태표", uses: "생산성 분석" },
  { id: "ship", label: "배송상품군별", uses: "출고 분석" },
  { id: "stock", label: "수불장", uses: "수불분석" },
  { id: "wrong", label: "오출내역", uses: "오출분석" },
] as const;

export type FolderId = (typeof FOLDER_ITEMS)[number]["id"];

const KEY = "center-folders";
const listeners = new Set<() => void>();

function empty(): Record<FolderId, string> {
  return { work: "", roster: "", ship: "", stock: "", wrong: "" };
}

function clean(value: unknown): Record<FolderId, string> {
  const next = empty();
  if (!value || typeof value !== "object") return next;
  const record = value as Record<string, unknown>;
  for (const item of FOLDER_ITEMS) {
    const path = String(record[item.id] ?? "").trim();
    if (path.length > 0 && path.length < 400 && !/[<>"]/.test(path)) next[item.id] = path;
  }
  return next;
}

export function readFolders() {
  if (typeof window === "undefined") return empty();
  const boot = (window as unknown as { __FOLDERS__?: unknown }).__FOLDERS__;
  let stored = empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) stored = clean(JSON.parse(raw));
  } catch { /* 저장된 경로가 없으면 기본 */ }
  const merged = clean({ ...stored, ...(boot && typeof boot === "object" ? boot : {}) });
  for (const item of FOLDER_ITEMS) {
    if (!merged[item.id] && stored[item.id]) merged[item.id] = stored[item.id];
  }
  return merged;
}

export function writeFolders(next: Record<FolderId, string>) {
  if (typeof window === "undefined") return;
  const cleaned = clean(next);
  (window as unknown as { __FOLDERS__?: Record<FolderId, string> }).__FOLDERS__ = cleaned;
  try { localStorage.setItem(KEY, JSON.stringify(cleaned)); } catch { /* 용량 초과여도 화면 값은 유지 */ }
  listeners.forEach((listener) => listener());
}

export function setFolder(id: FolderId, path: string) {
  const next = readFolders();
  next[id] = path.trim();
  writeFolders(next);
}

export function subscribeFolders(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function folderHost() {
  if (typeof window === "undefined") return null;
  return (window as unknown as { chrome?: { webview?: { postMessage: (msg: string) => void; addEventListener?: (type: string, cb: (event: { data: unknown }) => void) => void; removeEventListener?: (type: string, cb: (event: { data: unknown }) => void) => void } } }).chrome?.webview ?? null;
}

export function b64ToArrayBuffer(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

if (typeof window !== "undefined") {
  const host = folderHost();
  host?.addEventListener?.("message", (event) => {
    try {
      const data = typeof event.data === "string" ? JSON.parse(event.data) as { type?: string; key?: string; path?: string } : event.data as { type?: string; key?: string; path?: string };
      if (data?.type !== "folder" || !FOLDER_ITEMS.some((item) => item.id === data.key)) return;
      setFolder(data.key as FolderId, data.path || "");
    } catch { /* 다른 메시지 */ }
  });
}
