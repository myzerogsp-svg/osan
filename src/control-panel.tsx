import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { MASTER_ORDER, addMasterCode, masterRows, subscribeCodes } from "@/lib/chulgo";
import { addLayoutLine, layoutForSite, locRange, removeLayoutLine, resetLayout, setLayoutSlots, subscribeLayouts, type LocSlot } from "@/lib/location-layout";
import { addCenter, addSite, removeCenter, removeSite, setCenterLines, siteDefs, subscribeSites } from "@/lib/sites";
import { clearFrozen, frozenBook, frozenDay, readFrozenFile, saveFrozen, subscribeFrozen } from "@/lib/frozen-loc";
import { FOLDER_ITEMS, folderHost, readFolders, setFolder, subscribeFolders, type FolderId } from "@/lib/folders";
import { pullSharedPanel } from "@/lib/panel-sync";
import { readColorTheme, readUiTheme, setColorTheme, setUiTheme, subscribeUiTheme, type ColorTheme, type UiTheme } from "@/lib/ui-theme";

const MENUS = [
  { id: "general", title: "일반" },
  { id: "goods", title: "마스터 수정" },
  { id: "sites", title: "지역센터" },
  { id: "layout", title: "배치" },
  { id: "frozen", title: "냉동 로케이션" },
  { id: "folders", title: "지정폴더" },
] as const;

const UI_CHOICES: { id: UiTheme; title: string; note: string }[] = [
  { id: "ios", title: "아이폰/맥", note: "둥근 버튼과 회색 카드" },
  { id: "windows", title: "윈도우", note: "네모 버튼과 왼쪽 파란 줄" },
  { id: "chrome", title: "구글 크롬", note: "크롬 탭과 구글 파란색" },
  { id: "naver", title: "네이버", note: "흰 바탕, 초록 버튼" },
];

const COLOR_CHOICES: { id: ColorTheme; title: string; note: string }[] = [
  { id: "plain", title: "일반", note: "지금 쓰는 색" },
  { id: "field", title: "노란볼", note: "노랑 바탕, 흰 버튼" },
  { id: "puff", title: "몽글", note: "연분홍과 크림" },
  { id: "pop", title: "빨강점퍼", note: "빨강과 노랑" },
  { id: "sky", title: "파란주머니", note: "하늘색과 흰색" },
  { id: "naver", title: "네이버", note: "초록" },
];

function copySlot(slot: LocSlot): LocSlot {
  return slot.kind === "loc" ? { kind: "loc", code: slot.code } : slot.kind === "pillar" ? { kind: "pillar" } : { kind: "blank" };
}

function LayoutColumn({ title, side, slots, picked, rangeFrom, rangeTo, onRange, onFill, onPick, onRename, onBlurSide, onRemove, onDragStart, onDrop }: {
  title: string;
  side: "left" | "right";
  slots: LocSlot[];
  picked: { side: "left" | "right"; index: number } | null;
  rangeFrom: string;
  rangeTo: string;
  onRange: (edge: "from" | "to", value: string) => void;
  onFill: () => void;
  onPick: (index: number) => void;
  onRename: (index: number, code: string) => void;
  onBlurSide: () => void;
  onRemove: (index: number) => void;
  onDragStart: (index: number) => void;
  onDrop: (index: number) => void;
}) {
  return (
    <div className="min-w-0" onDragOver={(event) => event.preventDefault()} onDrop={() => onDrop(slots.length)}>
      <div className="mb-1 flex items-center justify-between px-1 text-[12px] font-semibold text-[#8e8e93]">
        <span>{title}</span>
        <span>{slots.length}칸</span>
      </div>
      <div className="mb-1 grid grid-cols-2 gap-1">
        <input value={rangeFrom} inputMode="numeric" placeholder="첫 칸" aria-label={`${title} 첫 칸`} className="h-7 rounded-md bg-white px-1 text-center text-[12px] font-semibold tabular-nums outline-none" onChange={(event) => onRange("from", event.target.value)} onBlur={onFill} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onFill(); } }} />
        <input value={rangeTo} inputMode="numeric" placeholder="끝 칸" aria-label={`${title} 끝 칸`} className="h-7 rounded-md bg-white px-1 text-center text-[12px] font-semibold tabular-nums outline-none" onChange={(event) => onRange("to", event.target.value)} onBlur={onFill} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onFill(); } }} />
      </div>
      <div className="flex flex-col">
        {slots.map((slot, index) => {
          const active = picked?.side === side && picked.index === index;
          const joinedTop = slot.kind === "pillar" && slots[index - 1]?.kind === "pillar";
          const joinedBottom = slot.kind === "pillar" && slots[index + 1]?.kind === "pillar";
          return (
            <div key={`${side}-${index}`} className={"flex items-center gap-1 " + (index > 0 && !joinedTop ? "mt-1" : "")} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); onDrop(index); }}>
              <button type="button" draggable aria-label="칸 이동" className="h-8 w-6 shrink-0 cursor-grab rounded-md bg-white text-[11px] text-[#8e8e93] active:cursor-grabbing" onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", `${side}:${index}`); onDragStart(index); }}>≡</button>
              {slot.kind === "loc" ? (
                <input
                  value={slot.code}
                  onFocus={() => onPick(index)}
                  onChange={(event) => onRename(index, event.target.value)}
                  onBlur={onBlurSide}
                  placeholder="이름"
                  className={"h-8 min-w-0 flex-1 rounded-md border bg-white px-2 text-center text-[13px] font-semibold tabular-nums outline-none " + (active ? "border-[#007aff]" : "border-transparent")}
                />
              ) : (
                <button type="button" className={"h-8 min-w-0 flex-1 border bg-white text-[12px] font-semibold " + (slot.kind === "pillar" ? "border-[#1c1c1e] bg-[#1c1c1e] text-white " : "border-dashed border-[#d1d1d6] text-[#8e8e93] ") + (joinedTop ? "rounded-t-none border-t-0 " : "rounded-t-md ") + (joinedBottom ? "rounded-b-none " : "rounded-b-md ") + (active && slot.kind !== "pillar" ? "border-[#007aff] text-[#007aff]" : "")} onClick={() => onPick(index)}>
                  {slot.kind === "pillar" ? "기둥" : "빈칸"}
                </button>
              )}
              <button type="button" aria-label="이 칸 삭제" className="h-8 w-7 shrink-0 rounded-md bg-white text-[16px] text-[#ff3b30]" onClick={() => onRemove(index)}>×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ControlPanel({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState<"general" | "goods" | "sites" | "layout" | "frozen" | "folders">("general");
  const [siteName, setSiteName] = useState("");
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [master, setMaster] = useState<(typeof MASTER_ORDER)[number]>("FF1편");
  const [error, setError] = useState("");
  const [siteDraft, setSiteDraft] = useState("");
  const [layoutSite, setLayoutSite] = useState("");
  const [layoutCenter, setLayoutCenter] = useState("");
  const [layoutLine, setLayoutLine] = useState(1);
  const [leftSlots, setLeftSlots] = useState<LocSlot[]>([]);
  const [rightSlots, setRightSlots] = useState<LocSlot[]>([]);
  const [pickedSlot, setPickedSlot] = useState<{ side: "left" | "right"; index: number } | null>(null);
  const [range, setRange] = useState({ leftFrom: "", leftTo: "", rightFrom: "", rightTo: "" });
  const rangeRef = useRef(range);
  const [rangeNote, setRangeNote] = useState("");
  const dragFrom = useRef<{ side: "left" | "right"; index: number } | null>(null);
  const rangeDirty = useRef(false);
  const [tick, setTick] = useState(0);
  const [frozenSite, setFrozenSite] = useState("");
  const [frozenNote, setFrozenNote] = useState("");
  const [lightNote, setLightNote] = useState("");
  const [folders, setFolders] = useState(readFolders);
  const [folderDraft, setFolderDraft] = useState(readFolders);
  const [uiTheme, setUiThemeState] = useState<UiTheme>(readUiTheme);
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(readColorTheme);
  const frozenRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  useEffect(() => subscribeCodes(() => setTick((value) => value + 1)), []);
  useEffect(() => subscribeSites(() => setTick((value) => value + 1)), []);
  useEffect(() => subscribeLayouts(() => setTick((value) => value + 1)), []);
  useEffect(() => subscribeFrozen(() => setTick((value) => value + 1)), []);
  useEffect(() => subscribeFolders(() => {
    const next = readFolders();
    setFolders(next);
    setFolderDraft(next);
  }), []);
  useEffect(() => subscribeUiTheme(() => {
    setUiThemeState(readUiTheme());
    setColorThemeState(readColorTheme());
  }), []);
  const rows = masterRows();
  const sites = siteDefs();
  const site = sites.find((item) => item.name === siteName) ?? sites[0] ?? null;
  void tick;
  const pickedSite = sites.find((item) => item.name === layoutSite) ?? sites[0] ?? null;
  const pickedCenter = pickedSite?.centers.find((item) => item.id === layoutCenter)?.id ?? pickedSite?.centers[0]?.id ?? "";
  const layoutRows = pickedSite && pickedCenter ? layoutForSite(pickedSite.name, pickedCenter) : [];
  useEffect(() => {
    if (page !== "layout" || !pickedSite || !pickedCenter) return;
    const row = layoutForSite(pickedSite.name, pickedCenter).find((item) => item.line === layoutLine) ?? layoutForSite(pickedSite.name, pickedCenter)[0];
    if (!row) return;
    if (row.line !== layoutLine) setLayoutLine(row.line);
    setLeftSlots(row.left.map(copySlot));
    setRightSlots(row.right.map(copySlot));
    const edges = (slots: LocSlot[]) => {
      const codes = slots.flatMap((slot) => slot.kind === "loc" ? [slot.code] : []);
      return [codes.at(-1) ?? "", codes[0] ?? ""] as const;
    };
    const [leftFrom, leftTo] = edges(row.left);
    const [rightFrom, rightTo] = edges(row.right);
    rangeDirty.current = false;
    setRangeNote("");
    const nextRange = { leftFrom, leftTo, rightFrom, rightTo };
    rangeRef.current = nextRange;
    setRange(nextRange);
    setPickedSlot(null);
  }, [page, pickedSite, pickedCenter, layoutLine]);
  function sideSlots(side: "left" | "right") {
    return side === "left" ? leftSlots : rightSlots;
  }
  function fillRange(side: "left" | "right") {
    if (!rangeDirty.current) return;
    const current = rangeRef.current;
    const from = side === "left" ? current.leftFrom : current.rightFrom;
    const to = side === "left" ? current.leftTo : current.rightTo;
    if (!from.trim() || !to.trim()) return;
    const slots = locRange(from, to);
    if (!slots) {
      setRangeNote("첫 칸과 끝 칸은 숫자로, 80칸 이하로 적어 주세요.");
      return;
    }
    setRangeNote("");
    rangeDirty.current = false;
    putSlots(side, slots);
    setPickedSlot(null);
  }
  function editRange(side: "left" | "right", edge: "from" | "to", value: string) {
    rangeDirty.current = true;
    const key = side === "left" ? edge === "from" ? "leftFrom" : "leftTo" : edge === "from" ? "rightFrom" : "rightTo";
    const next = { ...rangeRef.current, [key]: value.replace(/[^\d]/g, "").slice(0, 6) };
    rangeRef.current = next;
    setRange(next);
  }
  function putSlots(side: "left" | "right", slots: LocSlot[]) {
    const next = slots.slice(0, 80);
    if (side === "left") setLeftSlots(next);
    else setRightSlots(next);
    if (pickedSite && pickedCenter) setLayoutSlots(pickedSite.name, pickedCenter, layoutLine, side, next);
  }
  function renameSlot(side: "left" | "right", index: number, code: string) {
    const next = sideSlots(side).slice();
    if (next[index]?.kind !== "loc") return;
    next[index] = { kind: "loc", code: code.slice(0, 12) };
    if (side === "left") setLeftSlots(next);
    else setRightSlots(next);
  }
  function saveSide(side: "left" | "right") {
    if (!pickedSite || !pickedCenter) return;
    setLayoutSlots(pickedSite.name, pickedCenter, layoutLine, side, sideSlots(side));
  }
  function insertSlot(side: "left" | "right", index: number, slot: LocSlot = { kind: "loc", code: "" }) {
    const next = sideSlots(side).slice();
    if (next.length >= 80) return;
    next.splice(Math.max(0, Math.min(next.length, index)), 0, slot);
    putSlots(side, next);
    setPickedSlot({ side, index: Math.max(0, Math.min(next.length - 1, index)) });
  }
  function moveSlot(fromSide: "left" | "right", fromIndex: number, toSide: "left" | "right", toIndex: number) {
    if (fromSide === toSide && toIndex === fromIndex) return;
    const source = sideSlots(fromSide).slice();
    const [item] = source.splice(fromIndex, 1);
    if (!item) return;
    if (fromSide === toSide) {
      const at = Math.max(0, Math.min(source.length, toIndex));
      source.splice(at, 0, item);
      putSlots(fromSide, source);
      setPickedSlot({ side: fromSide, index: at });
      return;
    }
    putSlots(fromSide, source.length > 0 ? source : [{ kind: "blank" }]);
    const target = sideSlots(toSide).slice();
    const at = Math.max(0, Math.min(target.length, toIndex));
    target.splice(at, 0, item);
    putSlots(toSide, target);
    setPickedSlot({ side: toSide, index: at });
  }
  function dropSlot(side: "left" | "right", index: number) {
    const from = dragFrom.current;
    dragFrom.current = null;
    if (!from) return;
    const final = from.side === side && from.index < index ? index - 1 : index;
    moveSlot(from.side, from.index, side, final);
  }
  function removeSlot(side: "left" | "right", index: number) {
    const next = sideSlots(side).slice();
    next.splice(index, 1);
    putSlots(side, next.length > 0 ? next : [{ kind: "blank" }]);
    setPickedSlot(null);
  }
  function markSlot(kind: "blank" | "pillar" | "loc") {
    if (!pickedSlot) return;
    const next = sideSlots(pickedSlot.side).slice();
    const current = next[pickedSlot.index];
    if (!current) return;
    next[pickedSlot.index] = kind === "loc"
      ? { kind: "loc", code: current.kind === "loc" ? current.code : "" }
      : kind === "pillar" ? { kind: "pillar" } : { kind: "blank" };
    putSlots(pickedSlot.side, next);
  }
  function saveCode() {
    const message = addMasterCode(code, name, master);
    if (message) {
      setError(message);
      return;
    }
    setCode("");
    setName("");
    setError("");
    setAdding(false);
  }
  const [pullNote, setPullNote] = useState("");
  async function pullPanel() {
    setPullNote("가져오는 중");
    setError("");
    try {
      const result = await pullSharedPanel();
      setPullNote(result === "exe" ? "EXE에서 가져오는 중" : "가져왔습니다");
    } catch (err) {
      setPullNote("");
      setError(err instanceof Error ? err.message : "제어판을 불러오지 못했습니다.");
    }
  }
  function saveFolder(id: FolderId) {
    const path = folderDraft[id].trim();
    const host = folderHost();
    if (host) host.postMessage("set-folder:" + id + "|" + path);
    else setFolder(id, path);
  }
  function saveSite() {
    const message = addSite(siteDraft);
    if (message) {
      setError(message);
      return;
    }
    setSiteDraft("");
    setError("");
  }
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/30 p-3 sm:items-center" onClick={onClose}>
      <section className="flex h-[min(860px,calc(100vh-24px))] w-full max-w-[980px] flex-col overflow-hidden rounded-[20px] bg-[#f2f2f7] shadow-[0_16px_40px_rgba(0,0,0,0.18)]" onClick={(event) => event.stopPropagation()}>
        <header className="flex h-12 shrink-0 items-center border-b border-black/5 px-4">
          <span className="text-[17px] font-semibold text-[#1c1c1e]">제어판</span>
          {pullNote ? <span className="ml-3 text-[12px] font-medium text-[#8e8e93]">{pullNote}</span> : null}
          <button type="button" className="ml-auto inline-flex h-8 items-center rounded-full border border-black/10 bg-white px-3 text-[12px] font-semibold text-[#1c1c1e]" onClick={() => void pullPanel()}>
            가져오기
          </button>
          <button type="button" aria-label="닫기" className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-[#8e8e93]" onClick={onClose}>
            <X size={18} strokeWidth={2} />
          </button>
        </header>
        <div className="flex min-h-0 flex-1">
          <nav className="flex w-[168px] shrink-0 flex-col gap-1 border-r border-black/5 p-3">
            {MENUS.map((item) => (
              <button key={item.id} type="button" className={"h-10 rounded-xl px-3 text-left text-[14px] font-semibold " + (page === item.id ? "bg-white text-[#007aff]" : "text-[#1c1c1e]")} onClick={() => { setPage(item.id); setAdding(false); setError(""); }}>
                {item.title}
              </button>
            ))}
          </nav>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {page === "general" ? (
          <div className="min-h-0 flex-1 overflow-auto px-4 pb-4 pt-4">
            <p className="mb-3 px-1 text-[13px] text-[#8e8e93]">이 컴퓨터 화면에만 적용됩니다. 다른 센터 제어판으로는 넘어가지 않습니다.</p>
            <p className="mb-2 px-1 text-[13px] font-semibold text-[#1c1c1e]">UI</p>
            <div className="mb-4 overflow-hidden rounded-2xl bg-white">
              {UI_CHOICES.map((item) => {
                const on = uiTheme === item.id;
                return (
                  <button key={item.id} type="button" className="flex h-14 w-full items-center gap-3 border-t border-black/5 px-4 text-left first:border-t-0" onClick={() => setUiTheme(item.id)}>
                    <span className={"inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border " + (on ? "border-[#007aff] bg-[#007aff] text-white" : "border-[#c7c7cc] bg-white")}>{on ? "✓" : ""}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-[#1c1c1e]">{item.title}</span>
                      <span className="block truncate text-[12px] text-[#8e8e93]">{item.note}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mb-2 px-1 text-[13px] font-semibold text-[#1c1c1e]">테마</p>
            <div className="overflow-hidden rounded-2xl bg-white">
              {COLOR_CHOICES.map((item) => {
                const on = colorTheme === item.id;
                return (
                  <button key={item.id} type="button" className="flex h-14 w-full items-center gap-3 border-t border-black/5 px-4 text-left first:border-t-0" onClick={() => setColorTheme(item.id)}>
                    <span className={"inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border " + (on ? "border-[#007aff] bg-[#007aff] text-white" : "border-[#c7c7cc] bg-white")}>{on ? "✓" : ""}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-[#1c1c1e]">{item.title}</span>
                      <span className="block truncate text-[12px] text-[#8e8e93]">{item.note}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        {page === "goods" ? (
          <div className="min-h-0 flex-1 overflow-auto px-4 pb-4 pt-4">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-[13px] text-[#8e8e93]">배송상품군코드 {rows.length}개</p>
              <button type="button" className="inline-flex h-7 items-center rounded-full bg-[#007aff] px-3 text-[13px] font-semibold text-white" onClick={() => { setAdding((open) => !open); setError(""); }}>
                코드 추가
              </button>
            </div>
            {adding ? (
              <div className="mb-2 space-y-2 rounded-2xl bg-white p-3">
                <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" placeholder="코드" className="h-9 w-full rounded-xl bg-[#f2f2f7] px-3 text-sm outline-none" />
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="이름" className="h-9 w-full rounded-xl bg-[#f2f2f7] px-3 text-sm outline-none" />
                <select value={master} onChange={(event) => setMaster(event.target.value as (typeof MASTER_ORDER)[number])} className="h-9 w-full rounded-xl bg-[#f2f2f7] px-3 text-sm outline-none">
                  {MASTER_ORDER.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                {error ? <p className="text-xs text-[#ff3b30]">{error}</p> : null}
                <button type="button" className="h-9 w-full rounded-xl bg-[#007aff] text-sm font-semibold text-white" onClick={saveCode}>추가</button>
              </div>
            ) : null}
            <div className="overflow-hidden rounded-2xl bg-white">
              {rows.map((row) => (
                <div key={row.code} className="flex h-11 items-center gap-3 border-t border-black/5 px-4 first:border-t-0">
                  <span className="w-10 shrink-0 text-[15px] font-medium tabular-nums text-[#1c1c1e]">{row.code}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px] text-[#1c1c1e]">{row.name}</span>
                  <span className="shrink-0 text-[13px] text-[#8e8e93]">{row.master}</span>
                </div>
              ))}
            </div>
            <p className="px-3 pt-3 text-[12px] leading-5 text-[#8e8e93]">회사 프로그램에서 추가한 코드는 공용 폴더에 저장되어 다른 컴퓨터의 출고 분석에도 쓰입니다.</p>
          </div>
        ) : null}
        {page === "sites" && site ? (
          <div className="min-h-0 flex-1 overflow-auto px-4 pb-4 pt-4">
            <div className="mb-2 flex gap-2">
              <input value={siteDraft} onChange={(event) => setSiteDraft(event.target.value)} placeholder="지역센터 이름" className="h-9 min-w-0 flex-1 rounded-xl bg-white px-3 text-sm outline-none" />
              <button type="button" className="h-9 shrink-0 rounded-xl bg-[#007aff] px-3 text-sm font-semibold text-white" onClick={saveSite}>추가</button>
            </div>
            {error ? <p className="px-1 pb-2 text-xs text-[#ff3b30]">{error}</p> : null}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {sites.map((item) => (
                <button key={item.name} type="button" className={"h-8 rounded-full px-3 text-[13px] font-semibold " + (item.name === site.name ? "bg-[#007aff] text-white" : "bg-white text-[#1c1c1e]")} onClick={() => { setSiteName(item.name); setError(""); }}>{item.name}</button>
              ))}
            </div>
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-[13px] text-[#8e8e93]">{site.name} 센터 · 라인</p>
              <button type="button" className="text-[13px] text-[#ff3b30] disabled:text-[#c7c7cc]" disabled={sites.length <= 1} onClick={() => removeSite(site.name)}>지역 삭제</button>
            </div>
            <div className="overflow-hidden rounded-2xl bg-white">
              {site.centers.map((center) => (
                <div key={center.id} className="flex h-12 items-center gap-2 border-t border-black/5 px-4 first:border-t-0">
                  <span className="min-w-0 flex-1 text-[15px] text-[#1c1c1e]">{center.id}</span>
                  <span className="text-[13px] text-[#8e8e93]">라인</span>
                  <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f2f2f7] text-[16px]" onClick={() => setCenterLines(site.name, center.id, center.lines - 1)}>−</button>
                  <span className="w-6 text-center text-[15px] font-semibold tabular-nums">{center.lines}</span>
                  <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f2f2f7] text-[16px]" onClick={() => setCenterLines(site.name, center.id, center.lines + 1)}>+</button>
                  <button type="button" className="text-[13px] text-[#ff3b30] disabled:text-[#c7c7cc]" disabled={site.centers.length <= 1} onClick={() => removeCenter(site.name, center.id)}>삭제</button>
                </div>
              ))}
            </div>
            <button type="button" className="mt-2 h-10 w-full rounded-xl bg-white text-sm font-semibold text-[#007aff] disabled:text-[#c7c7cc]" disabled={site.centers.length >= 9} onClick={() => addCenter(site.name)}>센터 추가</button>
            <p className="px-3 pt-3 text-[12px] leading-5 text-[#8e8e93]">회사 프로그램에서 고치면 공용 폴더에 저장되어 다른 컴퓨터에도 보입니다. 사이트에서 고친 내용은 그 브라우저에만 남습니다.</p>
          </div>
        ) : null}
        {page === "layout" && pickedSite ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 px-4 pb-2 pt-4">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {sites.map((item) => (
                  <button key={item.name} type="button" className={"h-8 rounded-full px-3 text-[13px] font-semibold " + (item.name === pickedSite.name ? "bg-[#007aff] text-white" : "bg-white text-[#1c1c1e]")} onClick={() => { setLayoutSite(item.name); setLayoutCenter(""); setLayoutLine(1); }}>{item.name}</button>
                ))}
              </div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {pickedSite.centers.map((center) => (
                  <button key={center.id} type="button" className={"h-8 rounded-full px-3 text-[13px] font-semibold " + (center.id === pickedCenter ? "bg-[#1c1c1e] text-white" : "bg-white text-[#1c1c1e]")} onClick={() => { setLayoutCenter(center.id); setLayoutLine(1); }}>{center.id}</button>
                ))}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {layoutRows.map((row) => (
                  <button key={row.line} type="button" className={"h-8 shrink-0 rounded-full px-3 text-[13px] font-semibold " + (row.line === layoutLine ? "bg-[#007aff] text-white" : "bg-white text-[#1c1c1e]")} onClick={() => setLayoutLine(row.line)}>{row.line}라인</button>
                ))}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto px-4 pb-3">
              <p className="mb-2 text-[12px] leading-5 text-[#8e8e93]">첫 칸은 아래, 끝 칸은 위에 채워집니다. 칸을 누른 뒤 칸 추가·기둥 넣기를 누르면 그 위에 생깁니다.</p>
              {rangeNote ? <p className="mb-2 text-[12px] text-[#ff3b30]">{rangeNote}</p> : null}
              <div className="grid grid-cols-[minmax(0,1fr)_10px_minmax(0,1fr)] items-start gap-2">
                <LayoutColumn title="왼쪽" side="left" slots={leftSlots} picked={pickedSlot} rangeFrom={range.leftFrom} rangeTo={range.leftTo} onRange={(edge, value) => editRange("left", edge, value)} onFill={() => fillRange("left")} onPick={(index) => setPickedSlot({ side: "left", index })} onRename={(index, code) => renameSlot("left", index, code)} onBlurSide={() => saveSide("left")} onRemove={(index) => removeSlot("left", index)} onDragStart={(index) => { dragFrom.current = { side: "left", index }; }} onDrop={(index) => dropSlot("left", index)} />
                <div className="mt-6 h-full min-h-24 rounded-sm bg-[#d5dde3]" />
                <LayoutColumn title="오른쪽" side="right" slots={rightSlots} picked={pickedSlot} rangeFrom={range.rightFrom} rangeTo={range.rightTo} onRange={(edge, value) => editRange("right", edge, value)} onFill={() => fillRange("right")} onPick={(index) => setPickedSlot({ side: "right", index })} onRename={(index, code) => renameSlot("right", index, code)} onBlurSide={() => saveSide("right")} onRemove={(index) => removeSlot("right", index)} onDragStart={(index) => { dragFrom.current = { side: "right", index }; }} onDrop={(index) => dropSlot("right", index)} />
              </div>
            </div>
            <div className="shrink-0 border-t border-black/5 px-4 py-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                <button type="button" className="h-8 rounded-full bg-[#007aff] px-3 text-[12px] font-semibold text-white disabled:bg-[#d1d1d6]" disabled={!pickedSlot} onClick={() => pickedSlot && insertSlot(pickedSlot.side, pickedSlot.index)}>칸 추가</button>
                <button type="button" className="h-8 rounded-full bg-white px-3 text-[12px] font-semibold text-[#1c1c1e] disabled:text-[#c7c7cc]" disabled={!pickedSlot} onClick={() => pickedSlot && insertSlot(pickedSlot.side, pickedSlot.index, { kind: "pillar" })}>기둥 넣기</button>
                <button type="button" className="h-8 rounded-full bg-white px-3 text-[12px] font-semibold text-[#1c1c1e] disabled:text-[#c7c7cc]" disabled={!pickedSlot || pickedSlot.index <= 0} onClick={() => pickedSlot && moveSlot(pickedSlot.side, pickedSlot.index, pickedSlot.side, pickedSlot.index - 1)}>위로</button>
                <button type="button" className="h-8 rounded-full bg-white px-3 text-[12px] font-semibold text-[#1c1c1e] disabled:text-[#c7c7cc]" disabled={!pickedSlot || pickedSlot.index >= sideSlots(pickedSlot.side).length - 1} onClick={() => pickedSlot && moveSlot(pickedSlot.side, pickedSlot.index, pickedSlot.side, pickedSlot.index + 1)}>아래로</button>
                <button type="button" className="h-8 rounded-full bg-white px-3 text-[12px] font-semibold text-[#1c1c1e] disabled:text-[#c7c7cc]" disabled={!pickedSlot} onClick={() => markSlot("loc")}>이름</button>
                <button type="button" className="h-8 rounded-full bg-white px-3 text-[12px] font-semibold text-[#1c1c1e] disabled:text-[#c7c7cc]" disabled={!pickedSlot} onClick={() => markSlot("blank")}>빈칸</button>
                <button type="button" className="h-8 rounded-full bg-white px-3 text-[12px] font-semibold text-[#ff3b30] disabled:text-[#c7c7cc]" disabled={!pickedSlot} onClick={() => pickedSlot && removeSlot(pickedSlot.side, pickedSlot.index)}>칸 삭제</button>
              </div>
              <div className="flex gap-2">
                <button type="button" className="h-10 flex-1 rounded-xl bg-white text-sm font-semibold text-[#007aff] disabled:text-[#c7c7cc]" disabled={layoutRows.length >= 12} onClick={() => addLayoutLine(pickedSite.name, pickedCenter)}>라인 추가</button>
                <button type="button" className="h-10 flex-1 rounded-xl bg-white text-sm font-semibold text-[#ff3b30] disabled:text-[#c7c7cc]" disabled={layoutRows.length <= 1} onClick={() => { removeLayoutLine(pickedSite.name, pickedCenter, layoutLine); setLayoutLine(1); }}>라인 삭제</button>
                <button type="button" className="h-10 flex-1 rounded-xl bg-white text-sm font-semibold text-[#8e8e93]" onClick={() => {
                  resetLayout(pickedSite.name, pickedCenter);
                  const row = layoutForSite(pickedSite.name, pickedCenter).find((item) => item.line === layoutLine) ?? layoutForSite(pickedSite.name, pickedCenter)[0];
                  if (!row) return;
                  setLeftSlots(row.left.map(copySlot));
                  setRightSlots(row.right.map(copySlot));
                  const codes = (slots: LocSlot[]) => slots.flatMap((slot) => slot.kind === "loc" ? [slot.code] : []);
                  const left = codes(row.left);
                  const right = codes(row.right);
                  rangeDirty.current = false;
                  const nextRange = { leftFrom: left.at(-1) ?? "", leftTo: left[0] ?? "", rightFrom: right.at(-1) ?? "", rightTo: right[0] ?? "" };
                  rangeRef.current = nextRange;
                  setRange(nextRange);
                  setPickedSlot(null);
                }}>원래 배치</button>
              </div>
            </div>
          </div>
        ) : null}
        {page === "frozen" ? (
          <div className="min-h-0 flex-1 overflow-auto px-4 pb-4 pt-4">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {sites.map((item) => (
                <button key={item.name} type="button" className={"h-8 rounded-full px-3 text-[13px] font-semibold " + (item.name === (frozenSite || site?.name) ? "bg-[#007aff] text-white" : "bg-white text-[#1c1c1e]")} onClick={() => { setFrozenSite(item.name); setFrozenNote(""); }}>{item.name}</button>
              ))}
            </div>
            {(() => {
              const name = frozenSite || site?.name || "";
              const book = name ? frozenBook(name) : null;
              return (
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-[15px] font-semibold text-[#1c1c1e]">{name || "지역"} 냉동 로케이션</p>
                  {book ? (
                    <p className="mt-2 text-[13px] leading-5 text-[#3a3a3c]">
                      {book.fileName}<br />
                      {book.count.toLocaleString("ko-KR")}칸 · 업데이트 {frozenDay(book.updatedAt)}{book.builtin ? " · 기본 파일" : ""}
                    </p>
                  ) : <p className="mt-2 text-[13px] text-[#8e8e93]">올린 파일이 없습니다.</p>}
                  {frozenNote ? <p className="mt-2 text-[12px] text-[#ff3b30]">{frozenNote}</p> : null}
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="h-9 rounded-full bg-[#007aff] px-4 text-[13px] font-semibold text-white" onClick={() => frozenRef.current?.click()}>엑셀 올리기</button>
                    {book && !book.builtin ? <button type="button" className="h-9 rounded-full bg-[#f2f2f7] px-4 text-[13px] font-semibold text-[#ff3b30]" onClick={() => { if (name) clearFrozen(name); }}>올린 파일 지우기</button> : null}
                  </div>
                  <input ref={frozenRef} type="file" accept=".xlsx,.xls,.xlsm" className="sr-only" onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file || !name) return;
                    void readFrozenFile(file).then((rows) => {
                      if (!rows.length) {
                        setFrozenNote("존코드와 로케이션코드 열을 찾지 못했습니다.");
                        return;
                      }
                      saveFrozen(name, file.name, rows);
                      setFrozenNote("");
                    }).catch(() => setFrozenNote("엑셀을 읽지 못했습니다."));
                  }} />
                </div>
              );
            })()}
            <p className="px-3 pt-3 text-[12px] leading-5 text-[#8e8e93]">표시기주소로 맞춰 오출의 라인은 존코드, 로케이션은 로케이션코드로 보입니다. 고른 지역에만 적용되고, 회사 프로그램에서 올리면 공용 폴더에 남습니다.</p>
          </div>
        ) : null}
        {page === "folders" ? (
          <div className="min-h-0 flex-1 overflow-auto px-4 pb-4 pt-4">
            <p className="mb-3 text-[12px] leading-5 text-[#8e8e93]">회사 EXE가 이 폴더와 그 안의 하위 폴더에 있는 엑셀을 읽어 데이터분석 화면에 바로 띄웁니다. 경로는 이 컴퓨터 공용 폴더에만 남고, 다른 센터로 올라가지 않습니다.</p>
            <div className="flex flex-col gap-2">
              {FOLDER_ITEMS.map((item) => (
                <div key={item.id} className="rounded-2xl bg-white p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[14px] font-semibold text-[#1c1c1e]">{item.label}</p>
                    <span className="text-[11px] text-[#8e8e93]">{item.uses}</span>
                  </div>
                  <input
                    value={folderDraft[item.id]}
                    placeholder="폴더 경로"
                    className="h-9 w-full rounded-lg bg-[#f2f2f7] px-3 text-[13px] text-[#1c1c1e] outline-none"
                    onChange={(event) => setFolderDraft((prev) => ({ ...prev, [item.id]: event.target.value }))}
                    onBlur={() => saveFolder(item.id)}
                    onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); saveFolder(item.id); } }}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button type="button" className="h-8 rounded-full bg-[#007aff] px-3 text-[12px] font-semibold text-white" onClick={() => folderHost()?.postMessage("pick-folder:" + item.id)}>폴더 찾기</button>
                    {folders[item.id] ? <button type="button" className="h-8 rounded-full bg-[#f2f2f7] px-3 text-[12px] font-semibold text-[#ff3b30]" onClick={() => { setFolderDraft((prev) => ({ ...prev, [item.id]: "" })); const host = folderHost(); if (host) host.postMessage("set-folder:" + item.id + "|"); else setFolder(item.id, ""); }}>지우기</button> : null}
                    {item.id === "work" ? <button type="button" className="ml-auto h-8 rounded-full bg-[#34c759] px-3 text-[12px] font-semibold text-white" title="이미 만든 엑셀을 여러 개 고르면, 같은 폴더에 같은 이름으로 가볍게 덮어씁니다." onClick={() => { const host = folderHost(); if (host) { setLightNote(""); host.postMessage("make-light"); } else setLightNote("생산성 EXE에서만 파일을 가볍게 만들 수 있습니다."); }}>라이트하게 만들기</button> : null}
                  </div>
                  {item.id === "work" && lightNote ? <p className="mt-2 text-right text-[12px] text-[#ff3b30]">{lightNote}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
