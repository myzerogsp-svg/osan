import { Fragment, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { folderHost, readFolders } from "@/lib/folders";
import { CheckMenu, PickMenu } from "@/pick-filter";
import {
  CENTER_ORDER,
  applyFilters,
  booksFrom,
  centerColor,
  centerPivot,
  changeText,
  downloadLedger,
  filterLabel,
  mergeDrafts,
  monthLabel,
  monthPoints,
  rateText,
  rateTone,
  readLedgerFiles,
  shipMonthBoard,
  shipWeekBoard,
  sundaySlot,
  uniqueCenters,
  uniqueMasters,
  uniqueWeeks,
  weekBuckets,
  weekPivot,
  weekPoints,
  won,
  wonShort,
  type CenterDraft,
  type ChartPoint,
  type Filters,
  type LedgerRow,
  type MonthBook,
  type ShipBoard,
  type ShipLine,
  type ShipSpan,
} from "@/lib/chulgo";

const STORE = "osan-chulgo-ledger-v1";
const TABS = ["요약", "피벗", "추이", "출고정리"] as const;
const EMPTY: Filters = { centers: [], masters: [], weeks: [] };

function b64ToArrayBuffer(b64: string) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function loadStore(): { books: MonthBook[]; active: string } | null {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { books?: MonthBook[]; active?: string };
    if (!Array.isArray(parsed.books) || parsed.books.length === 0) return null;
    return { books: parsed.books, active: parsed.active || parsed.books[parsed.books.length - 1].key };
  } catch {
    return null;
  }
}

function rateClass(kind: "miss" | "wrong", part: number, whole: number) {
  const tone = rateTone(kind, part, whole);
  if (tone === "none") return "text-[#8e8e93]";
  if (kind === "miss") return tone === "bad" ? "rounded bg-[#fff4e5] px-1.5 py-0.5 font-semibold text-[#ff9500]" : "font-medium text-[#ff9500]";
  return tone === "bad" ? "rounded bg-[#ffeceb] px-1.5 py-0.5 font-semibold text-[#ff3b30]" : "font-medium text-[#ff3b30]";
}

function Money({ bucket, strong = false }: { bucket: { order: number; ship: number; miss: number; wrong: number }; strong?: boolean }) {
  const ink = strong ? "font-semibold" : "";
  return (
    <>
      <td className={`px-2 py-1.5 text-right tabular-nums whitespace-nowrap ${ink}`}>{won(bucket.order)}</td>
      <td className={`px-2 py-1.5 text-right tabular-nums whitespace-nowrap ${ink}`}>{won(bucket.ship)}</td>
      <td className={`px-2 py-1.5 text-right tabular-nums whitespace-nowrap ${ink}`}>{won(bucket.miss)}</td>
      <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap"><span className={rateClass("miss", bucket.miss, bucket.order)}>{rateText(bucket.miss, bucket.order)}</span></td>
      <td className={`px-2 py-1.5 text-right tabular-nums whitespace-nowrap ${ink}`}>{won(bucket.wrong)}</td>
      <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap"><span className={rateClass("wrong", bucket.wrong, bucket.order)}>{rateText(bucket.wrong, bucket.order)}</span></td>
    </>
  );
}

function Heads() {
  return (
    <>
      {["수주금액", "출고금액", "미출금액", "미출율", "오출금액", "오출율"].map((label) => (
        <th key={label} className="sticky top-0 z-10 bg-[#f2f2f7] px-2 py-2 text-right text-xs font-medium whitespace-nowrap text-[#636366]">
          {label}
        </th>
      ))}
    </>
  );
}

function Multi({ label, options, selected, onChange }: { label: string; options: { id: string; label: string }[]; selected: string[]; onChange: (next: string[]) => void }) {
  const ids = options.map((item) => item.id);
  const none = selected.includes("\0");
  const picked = selected.filter((id) => ids.includes(id));
  const all = !none && picked.length === 0;
  const text = all ? "전체" : none || picked.length === 0 ? "없음" : picked.length === 1 ? options.find((item) => item.id === picked[0])?.label ?? "1개" : `${picked.length}개`;
  function set(next: string[]) {
    if (next.length === 0) onChange(["\0"]);
    else if (next.length === ids.length) onChange([]);
    else onChange(next);
  }
  return (
    <CheckMenu
      label={label}
      text={text}
      rows={[
        { id: "__all", label: "전체", checked: all },
        ...options.map((item) => ({ id: item.id, label: item.label, checked: all || picked.includes(item.id) })),
      ]}
      onToggle={(id) => {
        if (id === "__all") {
          onChange(all ? ["\0"] : []);
          return;
        }
        const base = all ? ids : picked;
        const on = all || picked.includes(id);
        set(on ? base.filter((item) => item !== id) : [...base, id]);
      }}
    />
  );
}

function axisTicks(max: number) {
  if (!(max > 0)) return [0, 1];
  const bases = [1, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10];
  const rough = max / 4;
  const exp = Math.floor(Math.log10(rough));
  const mag = 10 ** exp;
  const residual = rough / mag;
  const base = bases.find((item) => item + 1e-9 >= residual) ?? 10;
  const step = base * mag;
  const top = Math.max(step, Math.ceil((max - step * 1e-9) / step) * step);
  const count = Math.round(top / step);
  return Array.from({ length: count + 1 }, (_, index) => Number((step * index).toPrecision(12)));
}

function tickText(value: number, unit: "won" | "pct") {
  if (unit === "pct") {
    if (Math.abs(value) < 1e-9) return "0%";
    const rounded = Math.abs(value - Math.round(value)) < 1e-6 ? String(Math.round(value)) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return `${rounded}%`;
  }
  return wonShort(value);
}

function tipText(value: number, unit: "won" | "pct") {
  return unit === "won" ? won(value) : `${value.toFixed(2)}%`;
}

function monotone(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const slope: number[] = [];
  const dx: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    dx[i] = points[i + 1].x - points[i].x || 1;
    slope[i] = (points[i + 1].y - points[i].y) / dx[i];
  }
  const tangent = slope.map((value, index) => {
    if (index === 0) return value;
    const prev = slope[index - 1];
    if (prev * value <= 0) return 0;
    return (prev + value) / 2;
  });
  tangent.push(slope[slope.length - 1] ?? 0);
  for (let i = 0; i < slope.length; i++) {
    if (Math.abs(slope[i]) < 1e-9) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i] / slope[i];
    const b = tangent[i + 1] / slope[i];
    const h = a * a + b * b;
    if (h > 9) {
      const scale = 3 / Math.sqrt(h);
      tangent[i] = scale * a * slope[i];
      tangent[i + 1] = scale * b * slope[i];
    }
  }
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const h = dx[i];
    path += ` C ${points[i].x + h / 3} ${points[i].y + (tangent[i] * h) / 3}, ${points[i + 1].x - h / 3} ${points[i + 1].y - (tangent[i + 1] * h) / 3}, ${points[i + 1].x} ${points[i + 1].y}`;
  }
  return path;
}


function SeriesChart({ title, note, points, centers, unit, initial, interval = 0 }: { title: string; note: string; points: ChartPoint[]; centers: string[]; unit: "won" | "pct"; initial: "line" | "bar"; interval?: number }) {
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [shape, setShape] = useState(initial);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    const measure = () => setWidth(Math.max(1, Math.round(node.clientWidth)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const height = 256;
  const sub = points.some((point) => point.sub);
  const pad = { left: unit === "won" ? 62 : 46, right: sub ? 46 : 24, top: 10, bottom: sub ? 42 : 28 };
  const innerW = Math.max(width - pad.left - pad.right, 1);
  const innerH = height - pad.top - pad.bottom;
  const peak = Math.max(0, ...points.flatMap((point) => centers.map((center) => point.values[center] ?? 0)));
  const ticks = axisTicks(peak);
  const top = ticks[ticks.length - 1] || 1;
  const y = (value: number) => pad.top + innerH - (value / top) * innerH;
  const xAt = (index: number) => (points.length <= 1 ? pad.left + innerW / 2 : pad.left + (index / (points.length - 1)) * innerW);
  const band = innerW / Math.max(points.length, 1);
  const showLabel = (index: number) => {
    if (interval <= 0 || points.length <= 8) return true;
    if (index === 0 || index === points.length - 1) return true;
    const step = interval + 1;
    if (index % step !== 0) return false;
    return points.length - 1 - index >= step;
  };
  const hoverPoint = hover == null ? null : points[hover];
  const labelX = (index: number) => (shape === "bar" ? pad.left + band * index + band / 2 : xAt(index));
  return (
    <section className="min-w-0 rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#1c1c1e]">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {([["bar", "막대"], ["line", "꺾은선"]] as const).map(([id, label]) => (
              <button key={id} type="button" className={`h-8 rounded-full px-3 text-xs font-medium ${shape === id ? "bg-[#007aff] text-white" : "bg-[#f2f2f7] text-[#1c1c1e]"}`} onClick={() => setShape(id)}>{label}</button>
            ))}
          </div>
          <p className="text-xs text-[#8e8e93]">{note}</p>
        </div>
      </div>
      <div ref={frame} className="relative h-64 w-full min-w-0">
        {points.length === 0 ? <p className="flex h-full items-center justify-center text-sm text-[#8e8e93]">표시할 출고가 없습니다.</p> : width > 0 ? (
          <svg viewBox={`0 0 ${width} ${height}`} className="block h-64 w-full" preserveAspectRatio="none" role="img" aria-label={title} onMouseLeave={() => setHover(null)}>
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} stroke="#e5e5ea" />
                <text x={pad.left - 6} y={y(tick) + 4} textAnchor="end" fill="#8e8e93" fontSize="12">{tickText(tick, unit)}</text>
              </g>
            ))}
            {shape === "bar" ? points.map((point, index) => {
              const inset = band * 0.16;
              const gap = centers.length > 1 ? 3 : 0;
              const barW = Math.max(2, (band - inset * 2 - gap * (centers.length - 1)) / centers.length);
              const origin = pad.left + band * index + inset;
              return (
                <g key={point.label} onMouseEnter={() => setHover(index)}>
                  <rect x={pad.left + band * index} y={pad.top} width={band} height={innerH} fill="transparent" />
                  {centers.map((center, at) => {
                    const value = point.values[center] ?? 0;
                    const barTop = y(value);
                    const barH = Math.max(pad.top + innerH - barTop, 0);
                    return <rect key={center} x={origin + at * (barW + gap)} y={barTop} width={barW} height={barH} fill={centerColor(center, centers)} rx="3" />;
                  })}
                </g>
              );
            }) : centers.map((center) => {
              const dots = points.map((point, index) => ({ x: xAt(index), y: y(point.values[center] ?? 0) }));
              return (
                <g key={center}>
                  <path d={monotone(dots)} fill="none" stroke={centerColor(center, centers)} strokeWidth="2" />
                  {points.length <= 12 ? dots.map((dot, index) => <circle key={index} cx={dot.x} cy={dot.y} r="3.5" fill={centerColor(center, centers)} />) : null}
                </g>
              );
            })}
            {shape === "line" ? points.map((point, index) => (
              <rect key={point.label} x={xAt(index) - band / 2} y={pad.top} width={band} height={innerH} fill="transparent" onMouseEnter={() => setHover(index)} />
            )) : null}
            {hover != null ? <line x1={labelX(hover)} x2={labelX(hover)} y1={pad.top} y2={pad.top + innerH} stroke="#c7c7cc" strokeDasharray="3 3" /> : null}
            {points.map((point, index) => showLabel(index) ? (
              <g key={`${point.label}-${point.sub ?? ""}`}>
                <text x={labelX(index)} y={point.sub ? height - 24 : height - 10} textAnchor="middle" fill="#8e8e93" fontSize="12">{point.label}</text>
                {point.sub ? <text x={labelX(index)} y={height - 8} textAnchor="middle" fill="#8e8e93" fontSize="12">{point.sub}</text> : null}
              </g>
            ) : null)}
          </svg>
        ) : null}
        {hoverPoint ? (
          <div className="pointer-events-none absolute top-2 right-2 rounded-lg border border-[#e5e5ea] bg-white px-3 py-2 text-xs shadow-sm">
            <p className="mb-1 font-medium text-[#1c1c1e]">{hoverPoint.sub ? `${hoverPoint.label} ${hoverPoint.sub}` : hoverPoint.label}</p>
            {centers.map((center) => (
              <p key={center} className="flex items-center gap-2 tabular-nums text-[#1c1c1e]">
                <span className="inline-block size-2 rounded-sm" style={{ background: centerColor(center, centers) }} />
                <span className="text-[#8e8e93]">{center}</span>
                {tipText(hoverPoint.values[center] ?? 0, unit)}
              </p>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[13px] text-[#1c1c1e]">
        {centers.map((center) => (
          <span key={center} className="inline-flex items-center gap-1.5">
            {shape === "bar" ? <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: centerColor(center, centers) }} /> : <span className="relative inline-block h-0.5 w-4" style={{ background: centerColor(center, centers) }}><span className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: centerColor(center, centers) }} /></span>}
            {center}
          </span>
        ))}
      </div>
    </section>
  );
}

const CAPTURE_FONT = "'Malgun Gothic', 'WenQuanYi Zen Hei', 'Apple SD Gothic Neo', sans-serif";

function shortRange(from: string, to: string) {
  const [, fm, fd] = from.split("-").map(Number);
  const [, tm, td] = to.split("-").map(Number);
  if (!fm || !fd || !tm || !td) return `${from} – ${to}`;
  return fm === tm ? `${fm}/${fd}~${td}` : `${fm}/${fd}~${tm}/${td}`;
}

function deltaColor(value: number | null) {
  if (value == null || !Number.isFinite(value) || value === 0) return "text-[#8e8e93]";
  return value > 0 ? "text-[#007aff]" : "text-[#ff3b30]";
}

function ShipGrid({ name, spans, lines, delta }: { name: string; spans: ShipSpan[]; lines: ShipLine[]; delta: string }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      <h3 className="px-3 pt-3 text-sm font-bold">{name}</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[#f2f2f7] px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">구분</th>
              {spans.map((span) => (
                <Fragment key={span.key}>
                  <th className="px-2 py-2 text-right text-xs font-semibold whitespace-nowrap" style={{ background: span.even ? "#f6e2b8" : "#f2f2f7" }}>
                    <span className="block">{span.title}</span>
                    {span.sub ? <span className="block font-normal text-[#636366]">{span.sub}</span> : null}
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-semibold whitespace-nowrap" style={{ background: span.even ? "#f6e2b8" : "#f2f2f7" }}>{delta}</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const foot = line.label === "합계" || line.label === "평균";
              return (
                <tr key={line.label}>
                  <th className={`sticky left-0 z-10 px-3 py-1.5 text-left whitespace-nowrap ${foot ? "font-semibold" : "font-medium"}`} style={{ background: foot ? "#f2f2f7" : "#ffffff" }}>{line.label}</th>
                  {line.cells.map((cell, index) => {
                    const even = spans[index]?.even;
                    const bg = foot ? (even ? "#f3ddb0" : "#f2f2f7") : even ? "#fbf0d4" : "#ffffff";
                    return (
                      <Fragment key={`${spans[index]?.key ?? index}`}>
                        <td className={`px-2 py-1.5 text-right tabular-nums whitespace-nowrap ${foot ? "font-semibold" : ""}`} style={{ background: bg }}>{won(cell.ship)}</td>
                        <td className={`px-2 py-1.5 text-right tabular-nums whitespace-nowrap ${deltaColor(cell.change)}`} style={{ background: bg }}>{changeText(cell.change)}</td>
                      </Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function drawShipCanvas(board: ShipBoard, deltaLabel: string) {
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new Error("이미지를 만들지 못했습니다.");
  const widthOf = (text: string, size: number, weight = 500) => {
    measure.font = `${weight} ${size}px ${CAPTURE_FONT}`;
    return measure.measureText(text).width;
  };
  const blocks = board.centers.map((block) => ({ ...block, name: block.center === "신오산" ? "전체" : block.center }));
  const labelW = Math.ceil(Math.max(88, ...blocks.flatMap((block) => block.lines.map((line) => widthOf(line.label, 13, line.label === "합계" || line.label === "평균" ? 700 : 500))))) + 24;
  const amountW = Math.ceil(Math.max(108, ...blocks.flatMap((block) => block.lines.flatMap((line) => line.cells.map((cell) => widthOf(won(cell.ship), 13)))))) + 20;
  const deltaW = Math.ceil(Math.max(84, widthOf(deltaLabel, 12, 700), ...blocks.flatMap((block) => block.lines.flatMap((line) => line.cells.map((cell) => widthOf(changeText(cell.change), 13, 600)))))) + 16;
  const headerH = board.spans.some((span) => span.sub) ? 48 : 34;
  const rowH = 30;
  const nameH = 32;
  const titleH = 42;
  const gap = 16;
  const pad = 24;
  const tableW = labelW + board.spans.length * (amountW + deltaW);
  const blockH = nameH + headerH + rowH * (blocks[0]?.lines.length ?? 0);
  const width = Math.max(360, tableW + pad * 2);
  const height = pad + titleH + blocks.length * blockH + Math.max(0, blocks.length - 1) * gap + pad;
  const canvas = document.createElement("canvas");
  const dpr = 2;
  canvas.width = Math.ceil(width * dpr);
  canvas.height = Math.ceil(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 만들지 못했습니다.");
  ctx.scale(dpr, dpr);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#1c1c1e";
  ctx.font = `700 18px ${CAPTURE_FONT}`;
  ctx.textAlign = "left";
  ctx.fillText(board.title, pad, pad + 16);
  const paint = (x: number, y: number, w: number, h: number, bg: string, text: string, color: string, align: CanvasTextAlign, weight: number, size: number) => {
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#e5e5ea";
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px ${CAPTURE_FONT}`;
    ctx.textAlign = align;
    ctx.fillText(text, align === "right" ? x + w - 8 : x + 10, y + h / 2);
  };
  blocks.forEach((block, index) => {
    let y = pad + titleH + index * (blockH + gap);
    ctx.fillStyle = "#1c1c1e";
    ctx.font = `700 15px ${CAPTURE_FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(block.name, pad, y + 14);
    y += nameH;
    paint(pad, y, labelW, headerH, "#f2f2f7", "구분", "#3a3a3c", "left", 700, 12);
    board.spans.forEach((span, at) => {
      const x = pad + labelW + at * (amountW + deltaW);
      const head = span.even ? "#f6e2b8" : "#f2f2f7";
      ctx.fillStyle = head;
      ctx.fillRect(x, y, amountW + deltaW, headerH);
      ctx.strokeStyle = "#e5e5ea";
      ctx.strokeRect(x + 0.5, y + 0.5, amountW - 1, headerH - 1);
      ctx.strokeRect(x + amountW + 0.5, y + 0.5, deltaW - 1, headerH - 1);
      ctx.fillStyle = "#1c1c1e";
      ctx.font = `700 12px ${CAPTURE_FONT}`;
      ctx.textAlign = "right";
      ctx.fillText(span.title, x + amountW - 8, span.sub ? y + 16 : y + headerH / 2);
      if (span.sub) {
        ctx.fillStyle = "#636366";
        ctx.font = `400 11px ${CAPTURE_FONT}`;
        ctx.fillText(span.sub, x + amountW - 8, y + 34);
      }
      ctx.fillStyle = "#3a3a3c";
      ctx.font = `700 12px ${CAPTURE_FONT}`;
      ctx.fillText(deltaLabel, x + amountW + deltaW - 8, y + headerH / 2);
    });
    y += headerH;
    for (const line of block.lines) {
      const foot = line.label === "합계" || line.label === "평균";
      paint(pad, y, labelW, rowH, foot ? "#f2f2f7" : "#ffffff", line.label, "#1c1c1e", "left", foot ? 700 : 500, 13);
      line.cells.forEach((cell, at) => {
        const even = board.spans[at]?.even;
        const bg = foot ? (even ? "#f3ddb0" : "#f2f2f7") : even ? "#fbf0d4" : "#ffffff";
        const x = pad + labelW + at * (amountW + deltaW);
        const color = cell.change == null || !Number.isFinite(cell.change) || cell.change === 0 ? "#8e8e93" : cell.change > 0 ? "#007aff" : "#ff3b30";
        paint(x, y, amountW, rowH, bg, won(cell.ship), "#1c1c1e", "right", foot ? 700 : 500, 13);
        paint(x + amountW, y, deltaW, rowH, bg, changeText(cell.change), color, "right", 600, 13);
      });
      y += rowH;
    }
  });
  return canvas;
}

async function copyBoard(board: ShipBoard, deltaLabel: string) {
  const canvas = drawShipCanvas(board, deltaLabel);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((value) => resolve(value), "image/png"));
  if (!blob) throw new Error("이미지를 만들지 못했습니다.");
  const host = (window as unknown as { chrome?: { webview?: { postMessage: (msg: unknown) => void } } }).chrome?.webview;
  if (host) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
    host.postMessage({ type: "clipboard-png", b64: btoa(binary) });
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  } catch (err) {
    if (!host) throw err instanceof Error ? err : new Error("복사에 실패했습니다.");
  }
}

export function ChulgoView({ open = false }: { open?: boolean }) {
  const [books, setBooks] = useState<MonthBook[]>([]);
  const [active, setActive] = useState("");
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("요약");
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [note, setNote] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [assign, setAssign] = useState<{ drafts: CenterDraft[]; unknown: string[]; note: string | null; intent: "view" | "bundle" } | null>(null);
  const [openCenter, setOpenCenter] = useState<Record<string, boolean>>({});
  const [trendScope, setTrendScope] = useState<"current" | "months">("current");
  const [trendWeeks, setTrendWeeks] = useState<number[]>([]);
  const [shipMode, setShipMode] = useState<"week" | "month">("week");
  const [shipMonths, setShipMonths] = useState<string[]>([]);
  const [shipWeeks, setShipWeeks] = useState<number[]>([]);
  const [shipCalMonths, setShipCalMonths] = useState<string[]>([]);
  const [company, setCompany] = useState(false);
  const intent = useRef<"view" | "bundle">("view");
  const input = useRef<HTMLInputElement>(null);
  const onFilesRef = useRef<(list: FileList | File[] | null) => Promise<void>>(async () => {});
  const allRows = useMemo(() => books.flatMap((item) => item.rows), [books]);
  const monthOptions = useMemo(() => {
    const keys = new Set(books.map((item) => item.key));
    for (const row of allRows) if (row.date) keys.add(sundaySlot(row.date).month);
    return [...keys].sort();
  }, [books, allRows]);
  const book = books.find((item) => item.key === active) ?? null;
  const rows = useMemo(() => (book ? applyFilters(book.rows, filters) : []), [book, filters]);
  const trendBase = useMemo(() => applyFilters(allRows, { centers: filters.centers, masters: filters.masters, weeks: [] }), [allRows, filters.centers, filters.masters]);
  const sundayRows = useMemo(() => trendBase.filter((row) => row.date && sundaySlot(row.date).month === active), [trendBase, active]);
  const sundayAll = useMemo(() => allRows.filter((row) => row.date && sundaySlot(row.date).month === active), [allRows, active]);
  const centers = centerPivot(rows);
  const weeks = weekPivot(rows);
  const weekChoices = useMemo(() => weekBuckets(sundayAll), [sundayAll]);
  const weekAll = useMemo(() => weekBuckets(sundayRows), [sundayRows]);
  const weekNone = trendWeeks.includes(-1);
  const shownWeeks = weekNone ? [] : weekAll.filter((item) => trendWeeks.length === 0 || trendWeeks.includes(item.week));
  const rateOf = (part: number, whole: number) => (whole ? Number(((part / whole) * 100).toFixed(2)) : 0);
  const shipWeek = weekPoints(shownWeeks, (bucket) => bucket.ship);
  const missWeek = weekPoints(shownWeeks, (bucket) => rateOf(bucket.miss, bucket.order));
  const wrongWeek = weekPoints(shownWeeks, (bucket) => rateOf(bucket.wrong, bucket.order));
  const dayMiss = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    for (const week of shownWeeks) {
      for (const day of week.days) {
        const hit = map.get(day.date) ?? {};
        for (const [center, value] of Object.entries(day.miss)) hit[center] = (hit[center] ?? 0) + value;
        map.set(day.date, hit);
      }
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, values]) => ({ label: `${Number(date.slice(5, 7))}/${Number(date.slice(8))}`, values }));
  }, [shownWeeks]);
  const monthShip = monthPoints(trendBase, (bucket) => bucket.ship);
  const monthMiss = monthPoints(trendBase, (bucket) => rateOf(bucket.miss, bucket.order));
  const monthWrong = monthPoints(trendBase, (bucket) => rateOf(bucket.wrong, bucket.order));
  const seriesCenters = uniqueCenters(sundayRows);
  const monthSeries = uniqueCenters(trendBase);
  const rankPool = useMemo(() => {
    const keys = new Set(shownWeeks.map((item) => `${item.month}|${item.week}`));
    const map = new Map<string, { center: string; master: string; order: number; miss: number; wrong: number }>();
    for (const row of sundayRows) {
      const slot = sundaySlot(row.date);
      if (!keys.has(`${slot.month}|${slot.week}`)) continue;
      const key = `${row.center}|${row.master}`;
      const hit = map.get(key) ?? { center: row.center, master: row.master, order: 0, miss: 0, wrong: 0 };
      hit.order += row.order;
      hit.miss += row.miss;
      hit.wrong += row.wrong;
      map.set(key, hit);
    }
    return [...map.values()];
  }, [sundayRows, shownWeeks]);
  const missRank = rankPool.filter((item) => item.miss > 0).sort((a, b) => b.miss - a.miss).slice(0, 8);
  const wrongRank = rankPool.filter((item) => item.wrong > 0).sort((a, b) => b.wrong - a.wrong).slice(0, 8);
  const shipMonthOptions = useMemo(() => {
    const keys = new Set<string>();
    for (const row of allRows) if (row.date) keys.add(sundaySlot(row.date).month);
    return [...keys].sort();
  }, [allRows]);
  const shipWeekOptions = useMemo(() => {
    const set = new Set<number>();
    for (const row of allRows) {
      if (!row.date) continue;
      const slot = sundaySlot(row.date);
      if (shipMonths.includes("\0")) continue;
      if (shipMonths.length && !shipMonths.includes(slot.month)) continue;
      set.add(slot.week);
    }
    return [...set].sort((a, b) => a - b);
  }, [allRows, shipMonths]);
  const weekBoards = useMemo(() => shipWeekBoard(allRows, shipMonths, shipWeeks), [allRows, shipMonths, shipWeeks]);
  const monthBoard = useMemo(() => shipMonthBoard(allRows, shipCalMonths), [allRows, shipCalMonths]);

  useEffect(() => {
    const saved = loadStore();
    if (saved) {
      setBooks(saved.books);
      setActive(saved.active);
    }
    setCompany(Boolean((window as Window & { __COMPANY_PC__?: boolean }).__COMPANY_PC__));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!monthOptions.length) {
      if (active) setActive("");
      return;
    }
    if (!monthOptions.includes(active)) setActive(monthOptions[monthOptions.length - 1]);
  }, [ready, monthOptions, active]);

  useEffect(() => {
    setTrendWeeks([]);
  }, [active]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ books, active }));
    } catch {
      setNote("월 데이터는 화면에 반영됐지만, 브라우저 저장 공간이 부족해 새로고침하면 사라질 수 있습니다.");
    }
  }, [books, active, ready]);

  function resetView(next: MonthBook[], key: string) {
    setBooks(next);
    setActive(key);
    setFilters(EMPTY);
    setTrendWeeks([]);
    setShipMonths([]);
    setShipWeeks([]);
    setShipCalMonths([]);
    setTab("요약");
  }

  function takeRows(list: LedgerRow[], warnings: string[]) {
    const incoming = booksFrom(list, warnings);
    if (!incoming.length) {
      setNote("출고일자를 읽지 못했습니다. 날짜 칸을 확인해 주세요.");
      return;
    }
    const map = new Map(books.map((item) => [item.key, item]));
    for (const item of incoming) map.set(item.key, item);
    const next = [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
    resetView(next, incoming[incoming.length - 1]?.key ?? active);
    setNote("");
    setAssign(null);
  }

  async function onFiles(list: FileList | File[] | null) {
    const files = [...(list ?? [])];
    if (!files.length) return;
    setNote("엑셀 읽는 중");
    const result = await readLedgerFiles(files);
    setNote("");
    if (result.kind === "error") {
      setNote(result.message);
      return;
    }
    if (result.kind === "combined") {
      if (intent.current === "bundle") {
        const months = booksFrom(result.rows, result.warnings);
        const sheets = months.length <= 1
          ? [{ title: filterLabel(EMPTY), rows: months[0]?.rows ?? [] }]
          : months.map((item) => ({ title: monthLabel(item.key), rows: item.rows }));
        await downloadLedger(sheets, months.length === 1 ? `${monthLabel(months[0].key).replace(/\s/g, "")}_업로드.xlsx` : "출고_업로드.xlsx");
        return;
      }
      takeRows(result.rows, result.warnings);
      return;
    }
    setAssign({ drafts: result.drafts, unknown: result.unknown, note: result.note, intent: intent.current });
  }
  onFilesRef.current = onFiles;

  useEffect(() => {
    const host = (window as unknown as { chrome?: { webview?: { addEventListener: (type: string, cb: (event: { data: unknown }) => void) => void; removeEventListener: (type: string, cb: (event: { data: unknown }) => void) => void } } }).chrome?.webview;
    if (!host?.addEventListener) return;
    const onMessage = (event: { data: unknown }) => {
      const data = (typeof event.data === "string" ? JSON.parse(event.data) : event.data) as { type?: string; name?: string; b64?: string; files?: { name?: string; b64?: string }[] };
      if (data?.type !== "ledger") return;
      const items = Array.isArray(data.files) ? data.files : data.b64 ? [{ name: data.name, b64: data.b64 }] : [];
      const files = items.filter((item) => item.b64).map((item) => new File([b64ToArrayBuffer(item.b64 ?? "")], item.name || "출고원장.xlsx"));
      if (files.length) void onFilesRef.current(files);
    };
    host.addEventListener("message", onMessage);
    return () => host.removeEventListener("message", onMessage);
  }, []);

  const shipAsked = useRef("");
  useEffect(() => {
    if (!open) return;
    const path = readFolders().ship;
    if (!path || shipAsked.current === path) return;
    shipAsked.current = path;
    folderHost()?.postMessage("read-folder:ship");
  }, [open]);

  async function applyAssign() {
    if (!assign) return;
    if (assign.drafts.some((draft) => !draft.center || !draft.role)) {
      setNote("센터와 미출·오출을 모두 골라 주세요.");
      return;
    }
    const merged = mergeDrafts(assign.drafts);
    if (assign.intent === "bundle") {
      const months = booksFrom(merged.rows, merged.warnings);
      if (!months.length) {
        setNote("출고일자를 읽지 못했습니다. 날짜 칸을 확인해 주세요.");
        return;
      }
      const sheets = months.length <= 1
        ? [{ title: filterLabel(EMPTY), rows: months[0]?.rows ?? [] }]
        : months.map((item) => ({ title: monthLabel(item.key), rows: item.rows }));
      await downloadLedger(sheets, months.length === 1 ? `${monthLabel(months[0].key).replace(/\s/g, "")}_업로드.xlsx` : "출고_업로드.xlsx");
      setAssign(null);
      return;
    }
    takeRows(merged.rows, merged.warnings);
  }

  async function capture(board: ShipBoard, deltaLabel: string) {
    try {
      await copyBoard(board, deltaLabel);
      setNote("클립보드에 복사했습니다.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "복사에 실패했습니다.");
    }
  }

  function clearData() {
    if (!books.length || !window.confirm("올려 둔 월 데이터를 모두 비울까요?")) return;
    setBooks([]);
    setActive("");
    setFilters(EMPTY);
    setTrendWeeks([]);
    setShipMonths([]);
    setShipWeeks([]);
    setShipCalMonths([]);
    setAssign(null);
    setNote("");
    localStorage.removeItem(STORE);
  }

  function openFiles(next: "view" | "bundle") {
    intent.current = next;
    const host = (window as unknown as { chrome?: { webview?: { postMessage: (msg: string) => void } } }).chrome?.webview;
    const inCompany = company || Boolean((window as Window & { __COMPANY_PC__?: boolean }).__COMPANY_PC__);
    if (inCompany && host) {
      host.postMessage("ledger");
      return;
    }
    input.current?.click();
  }

  function onDropFiles(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    const files = [...event.dataTransfer.files].filter((file) => /\.xls/i.test(file.name));
    if (!files.length) {
      setNote("xlsx 또는 xls 파일만 올릴 수 있습니다.");
      return;
    }
    intent.current = "view";
    void onFiles(files);
  }

  const grand = centers.grand;
  const filteredOn = filters.centers.length > 0 || filters.masters.length > 0 || (tab !== "추이" && filters.weeks.length > 0);
  const filterRows = tab === "추이" ? sundayAll : (book?.rows ?? []);
  const pickedLabel = tab === "추이" ? filterLabel({ ...filters, weeks: [] }) : filterLabel(filters);
  const pickedCount = tab === "추이" ? sundayRows.length : rows.length;

  return (
    <div
      className="relative min-h-full bg-[#f2f2f7] text-[#1c1c1e]"
      onDragEnter={(event) => { if ([...event.dataTransfer.types].includes("Files")) { event.preventDefault(); setDragOver(true); } }}
      onDragOver={(event) => { if ([...event.dataTransfer.types].includes("Files")) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; } }}
      onDragLeave={(event) => { if (event.currentTarget.contains(event.relatedTarget as Node)) return; setDragOver(false); }}
      onDrop={onDropFiles}
    >
      {dragOver ? <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-[#007aff]/10"><p className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold shadow">엑셀을 놓으면 업로드됩니다</p></div> : null}
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-black/5 bg-white/90 px-3 py-2 backdrop-blur">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold">출고 분석</p>
        </div>
        <button type="button" className="h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold text-[#ff3b30] disabled:opacity-40" disabled={!books.length} onClick={clearData}>데이터 비우기</button>
        <button type="button" className="h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold" onClick={() => openFiles("view")}>월 파일 올리기</button>
        <button type="button" className="h-9 rounded-full bg-[#007aff] px-3 text-xs font-semibold text-white" onClick={() => openFiles("bundle")}>업로드 만들기</button>
        <input id="ledger-file" ref={input} type="file" accept=".xlsx,.xls,.xlsm" multiple className="sr-only" onChange={(event) => { void onFiles(event.target.files); event.target.value = ""; }} />
      </div>
      <div className="flex flex-wrap items-center gap-2 px-3 pt-3">
        {TABS.map((item) => (
          <button key={item} type="button" className={`h-9 rounded-full px-4 text-sm font-bold ${tab === item ? "bg-[#007aff] text-white" : "bg-white text-[#1c1c1e]"}`} onClick={() => setTab(item)}>{item}</button>
        ))}
        {monthOptions.length && tab !== "출고정리" ? (
          <PickMenu
            label="월"
            value={monthOptions.includes(active) ? active : monthOptions[monthOptions.length - 1]}
            onChange={(id) => { setActive(id); setFilters(EMPTY); }}
            options={monthOptions.map((key) => ({ id: key, label: monthLabel(key) }))}
          />
        ) : null}
      </div>
      <div className="px-3 py-2 text-sm text-[#8e8e93]">
        {!books.length ? "파일을 올리기 전에는 숫자 없이 메뉴만 보입니다. 월 파일 올리기는 화면에 넣고, 업로드 만들기는 고른 파일을 엑셀로만 받습니다. 파일을 이 화면에 놓으면 월 파일 올리기와 같이 열립니다." : tab === "출고정리" ? "출고금액만 봅니다. 월을 비우면 올린 달이 모두 나옵니다." : book ? `${monthLabel(active)}을 보고 있습니다.` : `${monthLabel(active)}은 일요일 기준 주차만 있습니다. 요약·피벗은 달력 월이라 숫자가 없습니다.`}
        {note ? <span className="mt-1 block font-semibold text-[#ff3b30]">{note}</span> : null}
        {book?.warnings.length ? <ul className="mt-2 rounded-xl bg-[#ffeceb] px-3 py-2 text-[#ff3b30]">{book.warnings.map((item) => <li key={item}>{item}</li>)}</ul> : null}
      </div>
      {assign ? (
        <div className="mx-3 mb-3 rounded-2xl border border-black/10 bg-white p-3 text-sm">
          <p className="text-[#8e8e93]">{assign.intent === "bundle" ? "고른 미출·오출 파일을 하나의 업로드 엑셀로 만듭니다. 화면의 원장은 바꾸지 않습니다." : "미출 파일과 오출 파일을 함께 올리면 날짜·상품군 기준으로 한 줄로 붙입니다. 이름에 센터와 오출이 있으면 미리 골라 둡니다."}</p>
          {assign.note ? <p className="mt-2 text-[#ff3b30]">{assign.note}</p> : null}
          {assign.unknown.map((name) => <p key={name} className="mt-1 text-[#ff3b30]">{name} 은 출고 파일로 인식하지 못했습니다.</p>)}
          <ul className="mt-3 flex flex-col gap-3">
            {assign.drafts.map((draft, index) => (
              <li key={draft.filename} className="rounded-md border border-black/10 p-3">
                <p className="font-medium">{draft.filename}</p>
                <p className="mb-2 text-xs text-[#8e8e93]">{draft.detailCount.toLocaleString("ko-KR")}행</p>
                <div className="flex flex-wrap gap-2">
                  <label className="flex items-center gap-2">센터
                    <select className="h-10 rounded-md border border-black/10 px-2" value={draft.center ?? ""} onChange={(event) => setAssign({ ...assign, drafts: assign.drafts.map((item, at) => at === index ? { ...item, center: event.target.value } : item) })}>
                      <option value="">선택</option>
                      {CENTER_ORDER.filter((item) => item !== "냉동").map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-2">구분
                    <select className="h-10 rounded-md border border-black/10 px-2" value={draft.role ?? ""} onChange={(event) => setAssign({ ...assign, drafts: assign.drafts.map((item, at) => at === index ? { ...item, role: event.target.value as CenterDraft["role"] } : item) })}>
                      <option value="">선택</option>
                      <option value="miss">미출</option>
                      <option value="wrong">오출</option>
                      <option value="both">통합</option>
                    </select>
                  </label>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <button type="button" className="h-10 rounded-full bg-[#007aff] px-4 text-sm font-semibold text-white" onClick={() => void applyAssign()}>적용</button>
            <button type="button" className="h-10 rounded-full border border-black/10 px-4 text-sm" onClick={() => setAssign(null)}>닫기</button>
          </div>
        </div>
      ) : null}
      {books.length && tab !== "출고정리" && (tab === "추이" || book) ? (
        <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
          <Multi label="센터" options={uniqueCenters(filterRows).map((id) => ({ id, label: id }))} selected={filters.centers} onChange={(next) => setFilters({ ...filters, centers: next })} />
          <Multi label="상품군" options={uniqueMasters(filterRows).map((id) => ({ id, label: id }))} selected={filters.masters} onChange={(next) => setFilters({ ...filters, masters: next })} />
          {tab !== "추이" ? (
            <Multi label="주차" options={uniqueWeeks(filterRows).map((week) => ({ id: String(week), label: `${week}주차` }))} selected={filters.weeks.length === 1 && filters.weeks[0] === -1 ? ["\0"] : filters.weeks.map(String)} onChange={(ids) => setFilters({ ...filters, weeks: ids.includes("\0") ? [-1] : ids.map(Number) })} />
          ) : null}
          {filteredOn ? <button type="button" className="h-10 px-2 text-sm font-medium text-[#007aff]" onClick={() => setFilters(EMPTY)}>지우기</button> : null}
          <span className="self-center text-xs text-[#8e8e93]">{pickedLabel} · {pickedCount.toLocaleString("ko-KR")}행</span>
        </div>
      ) : null}
      {tab === "요약" && book ? (
        <div className="grid gap-3 px-3 pb-4 sm:grid-cols-4">
          {[
            ["수주금액", won(grand.order), ""],
            ["출고금액", won(grand.ship), ""],
            ["미출금액", won(grand.miss), "miss"],
            ["오출금액", won(grand.wrong), "wrong"],
          ].map(([label, value, kind]) => (
            <div key={label} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-xs text-[#8e8e93]">{label}</p>
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
              <p className="text-xs text-[#8e8e93]">
                {kind === "miss" ? <span className={rateClass("miss", grand.miss, grand.order)}>미출율 {rateText(grand.miss, grand.order)}</span> : null}
                {kind === "wrong" ? <span className={rateClass("wrong", grand.wrong, grand.order)}>오출율 {rateText(grand.wrong, grand.order)}</span> : null}
                {label === "출고금액" ? `출고율 ${rateText(grand.ship, grand.order)}` : null}
              </p>
            </div>
          ))}
          <div className="grid gap-2 sm:col-span-4 sm:grid-cols-4">
            {centers.centers.map((center) => {
              const on = filters.centers.length === 1 && filters.centers[0] === center.center;
              return (
                <button key={center.center} type="button" className={`rounded-2xl bg-white px-4 py-3 text-left shadow-sm ${on ? "ring-2 ring-[#007aff]" : ""}`} onClick={() => setFilters({ ...filters, centers: on ? [] : [center.center] })}>
                  <p className="font-semibold">{center.center}</p>
                  <p className="mt-1 text-xs text-[#8e8e93]">
                    미출율 <span className={rateClass("miss", center.total.miss, center.total.order)}>{rateText(center.total.miss, center.total.order)}</span>
                    {" · "}
                    오출율 <span className={rateClass("wrong", center.total.wrong, center.total.order)}>{rateText(center.total.wrong, center.total.order)}</span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {tab === "요약" && books.length > 0 && !book ? <p className="px-3 pb-6 text-sm text-[#8e8e93]">요약은 선택한 달의 달력 출고만 봅니다. 추이 이번 달에서 일요일 기준 주차를 볼 수 있습니다.</p> : null}
      {tab === "피벗" && book ? (
        <div className="grid gap-4 px-3 pb-6 xl:grid-cols-2">
          <section>
            <h2 className="mb-2 text-base font-semibold">센터 × 상품군</h2>
            <div className="overflow-auto rounded-lg border border-black/10 bg-white">
              <table className="w-full border-collapse text-sm">
                <thead><tr><th className="sticky top-0 left-0 z-20 bg-[#f2f2f7] px-3 py-2 text-left text-xs">행 레이블</th><Heads /></tr></thead>
                <tbody>
                  {centers.centers.map((center) => {
                    const open = openCenter[center.center] !== false;
                    return (
                      <Fragment key={center.center}>
                        <tr className="border-b border-black/5 bg-[#f2f2f7]">
                          <th className="sticky left-0 bg-[#f2f2f7] px-3 py-2 text-left whitespace-nowrap">
                            <button type="button" className="mr-1 text-[#8e8e93]" onClick={() => setOpenCenter((prev) => ({ ...prev, [center.center]: !open }))}>{open ? "▾" : "▸"}</button>
                            <button type="button" className="font-semibold" onClick={() => setFilters({ ...filters, centers: [center.center] })}>{center.center}</button>
                          </th>
                          <Money bucket={center.total} strong />
                        </tr>
                        {open ? center.groups.map((group) => (
                          <tr key={group.master} className="border-b border-black/5">
                            <th className="sticky left-0 bg-white py-2 pr-3 pl-10 text-left font-normal"><button type="button" onClick={() => setFilters({ ...filters, centers: [center.center], masters: [group.master] })}>{group.master}</button></th>
                            <Money bucket={group.bucket} />
                          </tr>
                        )) : null}
                      </Fragment>
                    );
                  })}
                  <tr className="border-t-2 border-[#1c1c1e] bg-[#f2f2f7]"><th className="sticky left-0 bg-[#f2f2f7] px-3 py-2 text-left font-semibold">총합계</th><Money bucket={centers.grand} strong /></tr>
                </tbody>
              </table>
            </div>
          </section>
          <section>
            <h2 className="mb-2 text-base font-semibold">주차</h2>
            <p className="mb-2 text-xs text-[#8e8e93]">일요일 시작 · 월초 남은 날은 1주차</p>
            <div className="overflow-auto rounded-lg border border-black/10 bg-white">
              <table className="w-full border-collapse text-sm">
                <thead><tr><th className="sticky top-0 left-0 z-20 bg-[#f2f2f7] px-3 py-2 text-left text-xs">행 레이블</th><Heads /></tr></thead>
                <tbody>
                  {weeks.weeks.map((week) => (
                    <tr key={week.week} className="border-b border-black/5">
                      <th className="sticky left-0 bg-white px-3 py-2 text-left"><button type="button" onClick={() => setFilters({ ...filters, weeks: [week.week] })}><span className="font-semibold">{week.week}주차</span><span className="mt-0.5 block text-xs font-normal text-[#8e8e93]">{shortRange(week.from, week.to)}</span></button></th>
                      <Money bucket={week.bucket} strong />
                    </tr>
                  ))}
                  <tr className="border-t-2 border-[#1c1c1e] bg-[#f2f2f7]"><th className="sticky left-0 bg-[#f2f2f7] px-3 py-2 text-left font-semibold">총합계</th><Money bucket={weeks.grand} strong /></tr>
                </tbody>
              </table>
            </div>
          </section>
          <p className="text-xs text-[#8e8e93] xl:col-span-2">단위: 원. 미출율·오출율은 수주금액 대비입니다. 2%·5% 미출, 0.5%·1% 오출부터 색이 진해집니다.</p>
        </div>
      ) : null}
      {tab === "피벗" && books.length > 0 && !book ? <p className="px-3 pb-6 text-sm text-[#8e8e93]">피벗은 선택한 달의 달력 주차입니다. 1일이 일요일이 아니면 첫 일요일 전날은 1주차입니다.</p> : null}
      {tab === "추이" && books.length ? (
        <div className="flex flex-col gap-4 px-3 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            {([["current", "이번 달"], ["months", "월별"]] as const).map(([id, label]) => (
              <button key={id} type="button" className={`h-10 rounded-full px-3 text-sm font-medium ${trendScope === id ? "bg-[#007aff] text-white" : "bg-white text-[#1c1c1e]"}`} onClick={() => setTrendScope(id)}>{label}</button>
            ))}
            {trendScope === "current" ? (
              <Multi label="주차" options={weekChoices.map((item) => ({ id: String(item.week), label: `${item.week}주 ${shortRange(item.sunday, item.saturday)}` }))} selected={trendWeeks.length === 1 && trendWeeks[0] === -1 ? ["\0"] : trendWeeks.map(String)} onChange={(ids) => setTrendWeeks(ids.includes("\0") ? [-1] : ids.map(Number))} />
            ) : null}
          </div>
          {trendScope === "months" ? (
            <>
              <SeriesChart title="월별 출고금액" note="올린 달 전체" points={monthShip} centers={monthSeries} unit="won" initial="line" />
              <div className="grid gap-6 xl:grid-cols-2">
                <SeriesChart title="월별 미출율" note="수주금액 대비 · 올린 달 전체" points={monthMiss} centers={monthSeries} unit="pct" initial="bar" />
                <SeriesChart title="월별 오출율" note="수주금액 대비 · 올린 달 전체" points={monthWrong} centers={monthSeries} unit="pct" initial="bar" />
              </div>
            </>
          ) : (
            <>
              <SeriesChart title="주차별 출하금액" note="일요일~토요일 · 일요일의 달" points={shipWeek} centers={seriesCenters} unit="won" initial="line" />
              <div className="grid gap-6 xl:grid-cols-2">
                <SeriesChart title="주차별 미출율" note="수주금액 대비 · 일요일의 달" points={missWeek} centers={seriesCenters} unit="pct" initial="bar" />
                <SeriesChart title="주차별 오출율" note="수주금액 대비 · 일요일의 달" points={wrongWeek} centers={seriesCenters} unit="pct" initial="bar" />
              </div>
              <SeriesChart title="일자별 미출금액" note="선택한 주차" points={dayMiss} centers={seriesCenters} unit="won" initial="line" interval={2} />
              <div className="grid gap-4 md:grid-cols-2">
                {([["미출금액이 큰 상품군", missRank, "miss"], ["오출금액이 큰 상품군", wrongRank, "wrong"]] as const).map(([title, items, field]) => (
                  <section key={title} className="rounded-2xl bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-base font-semibold">{title}</h2>
                    {items.length === 0 ? <p className="text-sm text-[#8e8e93]">이 조건에 해당하는 상품군이 없습니다.</p> : (
                      <ol className="flex flex-col gap-3">
                        {items.map((item) => {
                          const value = field === "miss" ? item.miss : item.wrong;
                          const max = field === "miss" ? missRank[0]?.miss || 1 : wrongRank[0]?.wrong || 1;
                          return (
                            <li key={`${item.center}-${item.master}`}>
                              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                                <span className="min-w-0 truncate"><span className="text-[#8e8e93]">{item.center}</span> {item.master}</span>
                                <span className="shrink-0 tabular-nums">{won(value)} <span className={rateClass(field, value, item.order)}>{rateText(value, item.order)}</span></span>
                              </div>
                              <div className="h-1.5 rounded-full bg-[#f2f2f7]"><div className={`h-1.5 rounded-full ${field === "miss" ? "bg-[#ff9500]" : "bg-[#ff3b30]"}`} style={{ width: `${Math.max(4, Math.round(value / max * 100))}%` }} /></div>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
      {tab === "출고정리" && books.length ? (
        <div className="flex flex-col gap-4 px-3 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            {([["week", "출고-주차"], ["month", "출고-월"]] as const).map(([id, label]) => (
              <button key={id} type="button" className={`h-10 rounded-full px-3 text-sm font-medium ${shipMode === id ? "bg-[#007aff] text-white" : "bg-white text-[#1c1c1e]"}`} onClick={() => setShipMode(id)}>{label}</button>
            ))}
            {shipMode === "week" ? (
              <>
                <Multi label="월" options={shipMonthOptions.map((id) => ({ id, label: monthLabel(id) }))} selected={shipMonths} onChange={(next) => { setShipMonths(next); setShipWeeks([]); }} />
                <Multi label="주차" options={shipWeekOptions.map((week) => ({ id: String(week), label: `${week}주차` }))} selected={shipWeeks.length === 1 && shipWeeks[0] === -1 ? ["\0"] : shipWeeks.map(String)} onChange={(ids) => setShipWeeks(ids.includes("\0") ? [-1] : ids.map(Number))} />
              </>
            ) : (
              <Multi label="월" options={books.map((item) => ({ id: item.key, label: monthLabel(item.key) }))} selected={shipCalMonths} onChange={setShipCalMonths} />
            )}
          </div>
          {shipMode === "week" ? (
            weekBoards.length === 0 ? <p className="text-sm text-[#8e8e93]">표시할 출고가 없습니다.</p> : weekBoards.map((board) => (
              <section key={board.key} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold">{board.title}</h2>
                  <button type="button" className="h-8 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold" onClick={() => void capture(board, "전주대비")}>캡쳐</button>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {board.centers.map((block) => <ShipGrid key={block.center} name={block.center} spans={board.spans} lines={block.lines} delta="전주대비" />)}
                </div>
              </section>
            ))
          ) : monthBoard.spans.length === 0 ? <p className="text-sm text-[#8e8e93]">표시할 출고가 없습니다.</p> : (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">출고-월</h2>
                <button type="button" className="h-8 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold" onClick={() => void capture(monthBoard, "전월대비")}>캡쳐</button>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {monthBoard.centers.map((block) => <ShipGrid key={block.center} name={block.center} spans={monthBoard.spans} lines={block.lines} delta="전월대비" />)}
              </div>
            </section>
          )}
        </div>
      ) : null}
    </div>
  );
}
