export type UiTheme = "ios" | "windows" | "chrome" | "naver";
export type ColorTheme = "plain" | "field" | "puff" | "pop" | "sky" | "naver";

const UI_KEY = "center-ui";
const COLOR_KEY = "center-color";
const TONE_CLASS: Record<ColorTheme, string> = {
  plain: "",
  field: "tone-field",
  puff: "tone-puff",
  pop: "tone-pop",
  sky: "tone-sky",
  naver: "tone-naver",
};
const listeners = new Set<() => void>();

function bootUi(): { ui?: string; color?: string } | null {
  if (typeof window === "undefined") return null;
  const value = (window as Window & { __UI__?: { ui?: string; color?: string } }).__UI__;
  return value && typeof value === "object" ? value : null;
}

function asUi(raw: string | null | undefined): UiTheme | null {
  return raw === "windows" || raw === "chrome" || raw === "naver" || raw === "ios" ? raw : null;
}

function asColor(raw: string | null | undefined): ColorTheme | null {
  return raw === "field" || raw === "puff" || raw === "pop" || raw === "sky" || raw === "naver" || raw === "plain" ? raw : null;
}

function remember(theme: UiTheme, color: ColorTheme) {
  try {
    localStorage.setItem(UI_KEY, theme);
    localStorage.setItem(COLOR_KEY, color);
  } catch { /* 저장이 안 돼도 이번 화면에는 적용 */ }
  const host = (window as Window & { chrome?: { webview?: { postMessage: (text: string) => void } } }).chrome?.webview;
  host?.postMessage("set-ui:" + theme + "|" + color);
}

export function readUiTheme(): UiTheme {
  try {
    if (typeof localStorage !== "undefined") {
      const saved = asUi(localStorage.getItem(UI_KEY));
      if (saved) return saved;
    }
  } catch { /* 저장소를 못 열면 켜질 때 넣어 둔 값을 본다 */ }
  return asUi(bootUi()?.ui) ?? "ios";
}

export function readColorTheme(): ColorTheme {
  try {
    if (typeof localStorage !== "undefined") {
      const saved = asColor(localStorage.getItem(COLOR_KEY));
      if (saved) return saved;
    }
  } catch { /* 저장소를 못 열면 켜질 때 넣어 둔 값을 본다 */ }
  return asColor(bootUi()?.color) ?? "plain";
}

export function applyLook() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("win-shell", "chrome-shell", "naver-shell", "kakao-shell", "tone-field", "tone-puff", "tone-pop", "tone-sky", "tone-naver", "tone-kakao");
  const ui = readUiTheme();
  if (ui === "windows") root.classList.add("win-shell");
  if (ui === "chrome") root.classList.add("chrome-shell");
  if (ui === "naver") root.classList.add("naver-shell");
  const tone = TONE_CLASS[readColorTheme()];
  if (tone) root.classList.add(tone);
}

export function setUiTheme(theme: UiTheme) {
  const color = theme === "naver" ? "naver" : readColorTheme();
  remember(theme, color);
  applyLook();
  listeners.forEach((listener) => listener());
}

export function setColorTheme(theme: ColorTheme) {
  remember(readUiTheme(), theme);
  applyLook();
  listeners.forEach((listener) => listener());
}

export function subscribeUiTheme(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
