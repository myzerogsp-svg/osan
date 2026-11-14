import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

function Tick({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={
        "grid size-[18px] shrink-0 place-items-center rounded-[5px] " +
        (on ? "bg-[#007aff]" : "border border-[#c7c7cc] bg-white")
      }
    >
      {on ? (
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M1.4 5.1 4.3 8.1 10.6 1.6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );
}

function Shell({ label, text, compact, soft = false, up = false, end = false, fill = false, float = false, children }: { label: string; text: string; compact?: boolean; soft?: boolean; up?: boolean; end?: boolean; fill?: boolean; float?: boolean; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      const node = event.target as Node;
      if (ref.current?.contains(node) || menuRef.current?.contains(node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  useEffect(() => {
    if (!open || !float) return;
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setBox({ top: rect.bottom + 4, left: rect.left });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, float]);
  const menu = open ? (
    <div
      ref={menuRef}
      className={(float ? "fixed z-[70] " : up ? "absolute bottom-full z-50 mb-1 " : "absolute z-50 mt-1 ") + (end && !float ? "right-0 " : "left-0 ") + "max-h-72 min-w-52 overflow-auto rounded-2xl border border-black/10 bg-white py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"}
      style={float && box ? { top: box.top, left: box.left } : undefined}
    >
      {children(() => setOpen(false))}
    </div>
  ) : null;
  return (
    <div ref={ref} className={fill ? "relative w-full" : "relative"}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        className={
          (soft
            ? "inline-flex h-7 items-center gap-1 rounded-full bg-[#f2f2f7] px-2.5 text-xs font-semibold"
            : compact
            ? "inline-flex h-7 max-w-full items-center gap-1 rounded-full bg-[#f2f2f7] px-2.5 text-xs font-semibold text-[#1c1c1e]"
            : "flex h-[40px] max-w-64 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-sm") + (fill ? " w-full justify-center" : "")
        }
        onClick={() => {
          if (!open && float) {
            const rect = buttonRef.current?.getBoundingClientRect();
            if (rect) setBox({ top: rect.bottom + 4, left: rect.left });
          }
          setOpen((value) => !value);
        }}
      >
        {label ? <span className="shrink-0 text-[#6b7280]">{label}</span> : null}
        <span className="min-w-0 truncate font-medium text-[#1c1c1e]">{text}</span>
      </button>
      {float ? (open && box ? createPortal(menu, document.body) : null) : menu}
    </div>
  );
}

export function PickMenu({
  label,
  value,
  options,
  onChange,
  compact = false,
  soft = false,
  up = false,
  search = false,
  searchLabel = "검색",
  onSearch,
  float = false,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
  compact?: boolean;
  soft?: boolean;
  up?: boolean;
  search?: boolean;
  searchLabel?: string;
  onSearch?: (query: string) => void;
  float?: boolean;
}) {
  const [query, setQuery] = useState("");
  const current = options.find((item) => item.id === value)?.label ?? value;
  const needle = query.trim().toLowerCase();
  const matches = !needle
    ? options
    : options.filter((item) => item.id !== "전체" && (item.label.toLowerCase().includes(needle) || item.id.toLowerCase().includes(needle)));
  const shown = !search || !needle ? options : matches;
  const text = search && query.trim() ? query.trim() : current;
  function applyQuery(next: string) {
    setQuery(next);
    onSearch?.(next);
    if (!next.trim()) onChange("전체");
  }
  return (
    <Shell label={label} text={text} compact={compact} soft={soft} up={up} float={float}>
      {(close) => (
        <>
          {search ? (
            <div className="sticky top-0 z-10 bg-white px-2 pb-1.5">
              <input
                autoFocus
                value={query}
                onChange={(event) => applyQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  close();
                }}
                placeholder={searchLabel}
                aria-label={searchLabel}
                className="h-9 w-full rounded-lg border border-black/10 px-2.5 text-sm outline-none"
              />
            </div>
          ) : null}
          {shown.length === 0 ? <p className="px-3 py-2 text-sm text-[#8e8e93]">없습니다.</p> : null}
          {shown.map((item) => (
          <button
            key={item.id}
            type="button"
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[15px] text-[#1c1c1e] hover:bg-[#f2f2f7]"
            onClick={() => {
              setQuery("");
              onSearch?.("");
              onChange(item.id);
              close();
            }}
          >
            <Tick on={needle ? true : item.id === value} />
            <span className="whitespace-nowrap">{item.label}</span>
          </button>
          ))}
        </>
      )}
    </Shell>
  );
}

export function CheckMenu({
  label,
  text,
  rows,
  onToggle,
  compact = false,
  soft = false,
  up = false,
  search = false,
  searchLabel = "검색",
  onSearch,
  end = false,
  fill = false,
  float = false,
  showLabel = false,
}: {
  label: string;
  text: string;
  rows: { id: string; label: string; checked: boolean; swatch?: string }[];
  onToggle: (id: string) => void;
  compact?: boolean;
  soft?: boolean;
  up?: boolean;
  end?: boolean;
  fill?: boolean;
  float?: boolean;
  showLabel?: boolean;
  search?: boolean;
  searchLabel?: string;
  onSearch?: (query: string) => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const shown = !search || !needle ? rows : rows.filter((item) => item.id !== "전체" && (item.label.toLowerCase().includes(needle) || item.id.toLowerCase().includes(needle)));
  return (
    <Shell label={compact && !showLabel ? "" : label} text={text} compact={compact} soft={soft} up={up} end={end} fill={fill} float={float}>
      {(close) => (
        <>
          {search ? (
            <div className="sticky top-0 z-10 bg-white px-2 pb-1.5">
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  onSearch?.(query);
                  close();
                }}
                placeholder={searchLabel}
                aria-label={searchLabel}
                className="h-9 w-full rounded-lg border border-black/10 px-2.5 text-sm outline-none"
              />
            </div>
          ) : null}
          {shown.length === 0 ? <p className="px-3 py-2 text-sm text-[#8e8e93]">찾는 항목이 없습니다.</p> : null}
          {shown.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[15px] text-[#1c1c1e] hover:bg-[#f2f2f7]"
              onClick={() => onToggle(item.id)}
            >
              <Tick on={item.checked} />
              {item.swatch ? <span className={"inline-block size-3 shrink-0 rounded-sm " + item.swatch} /> : null}
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </>
      )}
    </Shell>
  );
}
