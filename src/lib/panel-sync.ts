import { asPanel, mergePanel } from "./panel-merge";
import { applySharedPanel, readPanel, type PanelState } from "./panel-store";

const PATH = "/api/panel";

function webview() {
  if (typeof window === "undefined") return null;
  return (window as unknown as { chrome?: { webview?: { postMessage: (msg: string) => void } } }).chrome?.webview ?? null;
}

export async function pullSharedPanel() {
  const host = webview();
  const url = host ? "https://osan.grok.me/api/panel?t=" + Date.now() : PATH + "?t=" + Date.now();
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("제어판을 불러오지 못했습니다.");
    const remote = asPanel(await response.json());
    const merged = mergePanel(readPanel(), remote);
    applySharedPanel(merged);
    if (host) host.postMessage("panel-save:" + JSON.stringify(readPanel()));
    else if (JSON.stringify(merged) !== JSON.stringify(remote)) await pushPanel(merged);
    return "ok" as const;
  } catch (err) {
    if (host) {
      host.postMessage("panel-pull");
      return "exe" as const;
    }
    throw err instanceof Error ? err : new Error("제어판을 불러오지 못했습니다.");
  }
}

async function pushPanel(state: PanelState) {
  const response = await fetch(PATH, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(state),
  });
  if (!response.ok) return;
  const merged = mergePanel(readPanel(), asPanel(await response.json()));
  applySharedPanel(merged);
}

let pushTimer = 0;

export function schedulePanelPush() {
  if (typeof window === "undefined" || webview()) return;
  window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    void pushPanel(readPanel()).catch(() => {});
  }, 800);
}
