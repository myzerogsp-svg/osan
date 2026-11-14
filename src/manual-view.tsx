import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import menuShot from "@/assets/manual/shot_menu.png";
import queryShot from "@/assets/manual/shot_query.png";
import { MANUAL_PAGES, type ManualCell, type ManualNode, type ManualPage } from "@/manual-pages";

const FONT = '"Malgun Gothic", "맑은 고딕", Pretendard, "Noto Sans KR", sans-serif';
const INK = "#1B2631";
const TITLE = "#1A5276";
const SUB = "#5D6D7E";
const CHIP = "#2E86C1";
const LINE = "#D5DDE5";
const CARD = "#EEF3F8";
const TIP = "#F39C12";
const LINES = ["#E74C3C", "#F39C12", "#F1C40F", "#2ECC71", "#3498DB", "#9B59B6", "#FF6FA5", "#1F4E9E"];
const CENTERS = ["#3498DB", "#F39C12", "#9B59B6"];
const W = 1280;
const H = 720;
const X = 58;
const CW = 1164;
/** Card bottom is exclusive: a card at y with height (CARD_BOTTOM - y) ends on pixel 652. */
const CARD_BOTTOM = 653;

const COL_W: Record<number, number[]> = {
  5: [161, 123, 103, 104, 94, 113, 113, 104, 113, 116],
  7: [286, 218, 219, 219, 212],
  8: [151, 123, 89, 89, 90, 89, 89, 89, 89, 90, 154],
  9: [79, 80, 55, 66, 55, 56, 55, 66, 78, 79, 79, 79, 79, 78, 79, 79],
  11: [94, 142, 247, 113, 104, 89, 94, 85, 84, 92],
  13: [334, 209, 209, 209, 193],
};

type CardNode = Extract<ManualNode, { k: "card" }>;
type TableNode = Extract<ManualNode, { k: "table" }>;
type ChipNode = Extract<ManualNode, { k: "chips" }>;

function heatColor(t: number) {
  const x = Math.min(1, Math.max(0, t));
  const from = [214, 234, 248];
  const to = [26, 82, 118];
  const rgb = from.map((v, i) => Math.round(v + (to[i] - v) * x));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function findAll<K extends ManualNode["k"]>(nodes: ManualNode[], kind: K): Extract<ManualNode, { k: K }>[] {
  const out: Extract<ManualNode, { k: K }>[] = [];
  for (const node of nodes) {
    if (node.k === kind) out.push(node as Extract<ManualNode, { k: K }>);
    if ("children" in node && node.children) out.push(...findAll(node.children, kind));
  }
  return out;
}

function Dot({ color, size }: { color: string; size: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        flex: "0 0 auto",
      }}
    />
  );
}

function Num({ n, tone = "navy", size, fontSize }: { n: number | string; tone?: "navy" | "amber"; size: number; fontSize: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: tone === "amber" ? TIP : TITLE,
        color: "#fff",
        fontWeight: 700,
        fontSize,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
        lineHeight: 1,
      }}
    >
      {n}
    </span>
  );
}

function Arrow() {
  return (
    <svg width="18" height="22" viewBox="0 0 18 22" aria-hidden style={{ position: "absolute" }}>
      <path d="M2 1 L16 11 L2 21 Z" fill={TITLE} />
    </svg>
  );
}

function slots(count: number, y: number, bottom = CARD_BOTTOM) {
  const h = bottom - y;
  if (count === 4) {
    const widths = [273, 272, 273, 273];
    const gap = 25;
    let x = 57;
    return widths.map((w) => {
      const slot = { x, y, w, h };
      x += w + gap;
      return slot;
    });
  }
  if (count === 3) {
    const w = 370;
    const gap = 28;
    return [0, 1, 2].map((i) => ({ x: 57 + i * (w + gap), y, w, h }));
  }
  if (count === 2) {
    const w = 569;
    const gap = 28;
    return [0, 1].map((i) => ({ x: 57 + i * (w + gap), y, w, h }));
  }
  if (count === 5) {
    const w = 214;
    const gap = 18;
    return [0, 1, 2, 3, 4].map((i) => ({ x: 57 + i * (w + gap), y, w, h }));
  }
  return [{ x: 57, y, w: 1166, h }];
}

function box(extra: CSSProperties): CSSProperties {
  return {
    position: "absolute",
    boxSizing: "border-box",
    fontFamily: FONT,
    ...extra,
  };
}

function Chips({ node, y }: { node: ChipNode; y: number }) {
  return (
    <div style={box({ left: X, top: y, width: CW, height: 36, display: "flex", alignItems: "center", gap: 10 })}>
      {node.label ? (
        <span style={{ fontSize: 16, fontWeight: 700, color: SUB, lineHeight: "16px", flex: "0 0 auto" }}>{node.label}</span>
      ) : null}
      {node.items.map((item) => (
        <span
          key={item}
          style={{
            height: 36,
            display: "inline-flex",
            alignItems: "center",
            padding: "0 14px",
            borderRadius: 999,
            border: `1.5px solid ${CHIP}`,
            background: "#fff",
            color: TITLE,
            fontWeight: 700,
            fontSize: 16,
            lineHeight: "16px",
            boxSizing: "border-box",
            whiteSpace: "nowrap",
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function cellView(cell: ManualCell) {
  if (typeof cell !== "object") return cell ?? "";
  const color = cell.dot === "line" ? LINES[(cell.n ?? 1) - 1] : cell.dot === "center" ? CENTERS[(cell.n ?? 1) - 1] : TITLE;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      {cell.dot ? <Dot color={color} size={12} /> : null}
      {cell.box ? <span aria-hidden style={{ width: 14, height: 14, border: `1.5px solid ${INK}`, borderRadius: 2, display: "inline-block" }} /> : null}
      {cell.text}
    </span>
  );
}

function DataTable({
  table,
  x,
  y,
  w,
  font = 16,
  widths,
  headH = 36,
  rowH = 33,
}: {
  table: TableNode;
  x: number;
  y: number;
  w: number;
  font?: number;
  widths?: number[];
  headH?: number;
  rowH?: number;
}) {
  const sum = widths?.reduce((a, b) => a + b, 0) ?? 0;
  return (
    <table
      style={box({
        left: x,
        top: y,
        width: w,
        borderCollapse: "collapse",
        tableLayout: "fixed",
        fontSize: font,
        color: INK,
        background: "#fff",
      })}
    >
      {widths && sum > 0 ? (
        <colgroup>
          {widths.map((width, i) => (
            <col key={i} style={{ width: `${(width / sum) * 100}%` }} />
          ))}
        </colgroup>
      ) : null}
      <thead>
        <tr style={{ height: headH }}>
          {table.columns.map((column) => (
            <th
              key={column}
              style={{
                height: headH,
                background: TITLE,
                color: "#fff",
                fontWeight: 700,
                fontSize: font,
                lineHeight: `${headH}px`,
                textAlign: "center",
                border: `1px solid ${LINE}`,
                padding: 0,
                whiteSpace: "nowrap",
              }}
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, ri) => (
          <tr key={ri} style={{ height: rowH }}>
            {row.map((cell, ci) => {
              const heat = typeof cell === "object" ? cell.heat : undefined;
              return (
                <td
                  key={ci}
                  style={{
                    height: rowH,
                    lineHeight: `${rowH}px`,
                    textAlign: table.left ? "left" : "center",
                    padding: table.left ? "0 10px" : 0,
                    border: `1px solid ${LINE}`,
                    background: heat == null ? "#fff" : heatColor(heat),
                    fontSize: font,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  {heat == null ? cellView(cell) : ""}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Note({ text, y }: { text: string; y: number }) {
  return <div style={box({ left: X, top: y, width: CW, height: 20, fontSize: 15, lineHeight: "20px", color: SUB })}>{text}</div>;
}

function cardShell(x: number, y: number, w: number, h: number): CSSProperties {
  return box({
    left: x,
    top: y,
    width: w,
    height: h,
    background: CARD,
    borderRadius: 10,
    padding: 21,
    overflow: "hidden",
  });
}

const bodyText: CSSProperties = { marginTop: 8, fontSize: 19, lineHeight: 1.4, color: INK, whiteSpace: "pre-line" };

function Inner({ node }: { node: ManualNode }) {
  if (node.k === "badge") {
    const background = node.tone === "orange" ? TIP : node.tone === "red" ? LINES[0] : TITLE;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          height: 32,
          padding: "0 14px",
          borderRadius: 999,
          background,
          color: "#fff",
          fontWeight: 700,
          fontSize: 16,
          lineHeight: "16px",
        }}
      >
        {node.text}
      </span>
    );
  }
  if (node.k === "p") {
    const size = node.size ?? (node.strong ? 24 : 19);
    return (
      <div style={{ marginTop: node.strong ? 12 : 8, fontSize: size, fontWeight: node.strong ? 700 : 400, lineHeight: 1.4, color: node.strong ? TITLE : INK }}>
        {node.text}
      </div>
    );
  }
  if (node.k === "link") {
    return (
      <a href={node.href} style={{ display: "inline-block", marginTop: 10, color: CHIP, fontSize: 16, fontWeight: 700, lineHeight: "20px", textDecoration: "none" }}>
        {node.text}
      </a>
    );
  }
  if (node.k === "ol") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
        {node.items.map((item, i) => (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Num n={i + 1} size={40} fontSize={18} />
            <span style={{ fontSize: 19, lineHeight: 1.4, color: INK }}>{item}</span>
          </div>
        ))}
      </div>
    );
  }
  if (node.k === "flow") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 28 }}>
        <span style={{ background: TITLE, color: "#fff", fontWeight: 700, fontSize: 19, borderRadius: 10, padding: "14px 18px", lineHeight: 1.3 }}>{node.from}</span>
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
          <path d="M4 2 L18 11 L4 20 Z" fill={TITLE} />
        </svg>
        <span
          style={{
            border: `2px solid ${TITLE}`,
            color: TITLE,
            fontWeight: 700,
            fontSize: 19,
            borderRadius: 10,
            padding: "12px 16px",
            lineHeight: 1.35,
            background: "#fff",
            whiteSpace: "pre-line",
          }}
        >
          {node.to}
        </span>
      </div>
    );
  }
  if (node.k === "lines") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 44px)", gap: 14, marginTop: 18 }}>
        {LINES.map((color, i) => (
          <span
            key={color}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: color,
              color: "#fff",
              fontWeight: 700,
              fontSize: 21,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {i + 1}
          </span>
        ))}
      </div>
    );
  }
  return null;
}

function CardView({ card, x, y, w, h, titleSize = 21 }: { card: CardNode; x: number; y: number; w: number; h: number; titleSize?: number }) {
  return (
    <div style={cardShell(x, y, w, h)}>
      {card.n != null || card.title ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {card.n != null ? <Num n={card.n} tone={card.tone === "amber" ? "amber" : "navy"} size={44} fontSize={21} /> : null}
          {card.title ? <div style={{ fontSize: titleSize, fontWeight: 700, color: TITLE, lineHeight: 1.25 }}>{card.title}</div> : null}
        </div>
      ) : null}
      {card.body ? <div style={bodyText}>{card.body}</div> : null}
      {card.children?.map((child, i) => (
        <Inner key={i} node={child} />
      ))}
    </div>
  );
}

function StepRow({ items, y, bottom = CARD_BOTTOM, arrows, titleSize = 24 }: { items: { title: string; body: string }[]; y: number; bottom?: number; arrows?: boolean; titleSize?: number }) {
  const place = slots(items.length, y, bottom);
  return (
    <>
      {items.map((item, i) => (
        <div key={item.title} style={cardShell(place[i].x, place[i].y, place[i].w, place[i].h)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Num n={i + 1} size={44} fontSize={21} />
            <div style={{ fontSize: titleSize, fontWeight: 700, color: TITLE, lineHeight: 1.25 }}>{item.title}</div>
          </div>
          <div style={bodyText}>{item.body}</div>
        </div>
      ))}
      {arrows
        ? items.slice(1).map((_, i) => {
            const gap = items.length === 4 ? 26 : 29;
            const left = place[i].x + place[i].w + gap / 2 - 9;
            const top = place[i].y + place[i].h / 2 - 11;
            return (
              <div key={i} style={box({ left, top, width: 18, height: 22 })}>
                <Arrow />
              </div>
            );
          })
        : null}
    </>
  );
}

function TitleBlock({ title }: { title: string }) {
  return (
    <div
      style={box({
        left: X,
        top: 34,
        width: CW,
        height: 72,
        display: "flex",
        alignItems: "center",
        color: TITLE,
        fontSize: 45,
        fontWeight: 700,
        lineHeight: "45px",
        whiteSpace: "nowrap",
      })}
    >
      {title}
    </div>
  );
}

function SubtitleBlock({ text }: { text: string }) {
  return <div style={box({ left: X, top: 100, width: CW, height: 28, color: SUB, fontSize: 21, lineHeight: "28px", whiteSpace: "nowrap" })}>{text}</div>;
}

function Footer({ index }: { index: number }) {
  const dot = 15;
  const gap = 5;
  return (
    <>
      <div style={box({ left: 56, top: 675, height: dot, display: "flex", alignItems: "center", gap })}>
        {LINES.map((color) => (
          <Dot key={color} color={color} size={dot} />
        ))}
      </div>
      <div style={box({ left: 56 + 8 * dot + 7 * gap + 20, top: 676, height: 18, color: SUB, fontSize: 13, lineHeight: "18px" })}>
        센터 생산성 프로그램 사용 매뉴얼 · osan.grok.me
      </div>
      <div style={box({ left: X, top: 676, width: CW, height: 18, textAlign: "right", color: SUB, fontSize: 13, lineHeight: "18px" })}>{index + 1}</div>
    </>
  );
}

function tableMetrics(rows: number, top = 198) {
  const height = 36 + rows * 33;
  const noteY = top + height + 12;
  return { top, height, noteY, cardY: top + height + 47 };
}

function Standard({ page, font = 16, index }: { page: ManualPage; font?: number; index: number }) {
  const chips = findAll(page.blocks, "chips");
  const table = findAll(page.blocks, "table")[0];
  const cards = findAll(page.blocks, "card");
  if (!table) return <Tips page={page} />;
  const metrics = tableMetrics(table.rows.length);
  const place = slots(cards.length, metrics.cardY);
  return (
    <>
      {chips[0] ? <Chips node={chips[0]} y={148} /> : null}
      <DataTable table={table} x={59} y={metrics.top} w={1162} font={font} widths={COL_W[index]} />
      {table.note ? <Note text={table.note} y={metrics.noteY} /> : null}
      {cards.map((card, i) => (
        <CardView key={card.title} card={card} x={place[i].x} y={place[i].y} w={place[i].w} h={place[i].h} />
      ))}
    </>
  );
}

function Intro({ page }: { page: ManualPage }) {
  const stats = findAll(page.blocks, "stat");
  const steps = findAll(page.blocks, "steps")[0];
  const statPlace = slots(3, 172);
  const stepBoxes = [
    { x: 57, y: 393, w: 337, h: 251 },
    { x: 471, y: 393, w: 337, h: 251 },
    { x: 885, y: 393, w: 337, h: 251 },
  ];
  return (
    <>
      {stats.map((stat, i) => (
        <div key={stat.label} style={{ ...cardShell(statPlace[i].x, 172, statPlace[i].w, 184), display: "flex", alignItems: "center", gap: 16, padding: "0 24px" }}>
          <span style={{ fontSize: 80, fontWeight: 700, color: TITLE, lineHeight: "80px" }}>{stat.n}</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: TITLE, lineHeight: "30px" }}>{stat.label}</span>
        </div>
      ))}
      {steps.items.map((item, i) => (
        <div
          key={item.title}
          style={box({
            left: stepBoxes[i].x,
            top: stepBoxes[i].y,
            width: stepBoxes[i].w,
            height: stepBoxes[i].h,
            border: `1.5px solid ${CHIP}`,
            borderRadius: 14,
            background: "#fff",
            padding: "24px 22px",
          })}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Num n={i + 1} size={58} fontSize={27} />
            <div style={{ fontSize: 24, fontWeight: 700, color: TITLE, lineHeight: "30px" }}>{item.title}</div>
          </div>
          <div style={{ marginTop: 18, fontSize: 19, lineHeight: 1.4, color: INK }}>{item.body}</div>
        </div>
      ))}
      {stepBoxes.slice(1).map((item, i) => {
        const prev = stepBoxes[i];
        const left = prev.x + prev.w + (item.x - (prev.x + prev.w)) / 2 - 16;
        return (
          <svg key={item.x} width="32" height="36" viewBox="0 0 32 36" aria-hidden style={box({ left, top: 500, width: 32, height: 36 })}>
            <path d="M2 2 L30 18 L2 34 Z" fill={CHIP} />
          </svg>
        );
      })}
    </>
  );
}

function Connect({ page }: { page: ManualPage }) {
  const cards = findAll(page.blocks, "card");
  const heading = findAll(page.blocks, "h")[0];
  const steps = findAll(page.blocks, "steps")[0];
  const top = slots(2, 172);
  return (
    <>
      {cards.map((card, i) => (
        <CardView key={i} card={card} x={top[i].x} y={172} w={top[i].w} h={241} />
      ))}
      <div style={box({ left: X, top: 438, width: CW, height: 28, color: TITLE, fontSize: 24, fontWeight: 700, lineHeight: "28px" })}>{heading?.text}</div>
      <StepRow items={steps.items} y={479} bottom={649} arrows={false} titleSize={24} />
    </>
  );
}

function MenuGrid({ page }: { page: ManualPage }) {
  const items = findAll(page.blocks, "menu");
  const xs = [57, 455, 853];
  const ten = items.length > 9;
  const ys = ten ? [158, 286, 414, 542] : [172, 335, 499];
  const h = ten ? 116 : 145;
  return (
    <>
      {items.map((item, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        return (
          <div key={item.n} style={{ ...cardShell(xs[col], ys[row], 370, h), display: "flex", alignItems: "center", gap: ten ? 14 : 18, padding: ten ? "12px 16px" : "18px 20px" }}>
            <Num n={item.n} size={ten ? 48 : 58} fontSize={ten ? 22 : 27} />
            <div>
              <div style={{ fontSize: ten ? 22 : 27, fontWeight: 700, color: TITLE, lineHeight: ten ? "26px" : "32px" }}>{item.title}</div>
              <div style={{ marginTop: 4, fontSize: ten ? 15 : 17, lineHeight: 1.3, color: INK }}>{item.body}</div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function plain(cell: ManualCell) {
  if (typeof cell === "object") return cell.text ?? "";
  return cell ?? "";
}

function Glossary({ page }: { page: ManualPage }) {
  const table = findAll(page.blocks, "table")[0];
  const cards = findAll(page.blocks, "card");
  const termYs = [221, 287, 352, 417, 483, 548];
  const termHs = [64, 64, 64, 64, 63, 64];
  return (
    <>
      <div style={box({ left: 59, top: 179, width: 199, height: 41, background: TITLE, color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: "41px", textAlign: "center" })}>
        용어
      </div>
      <div style={box({ left: 260, top: 179, width: 507, height: 41, background: TITLE, color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: "41px", textAlign: "center" })}>
        뜻
      </div>
      {table.rows.map((row, i) => (
        <div key={i}>
          <div
            style={box({
              left: 58,
              top: termYs[i],
              width: 201,
              height: termHs[i],
              background: CARD,
              borderRadius: 10,
              color: INK,
              fontSize: 16,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "0 8px",
            })}
          >
            {plain(row[0])}
          </div>
          <div
            style={box({
              left: 270,
              top: termYs[i],
              width: 496,
              height: termHs[i],
              color: INK,
              fontSize: 16,
              lineHeight: "22px",
              display: "flex",
              alignItems: "center",
            })}
          >
            <span>{plain(row[1])}</span>
          </div>
        </div>
      ))}
      <CardView card={cards[0]} x={796} y={177} w={427} h={236} />
      <CardView card={cards[1]} x={796} y={431} w={427} h={213} />
    </>
  );
}

function Compare({ page }: { page: ManualPage }) {
  const chips = findAll(page.blocks, "chips")[0];
  const table = findAll(page.blocks, "table")[0];
  const cards = findAll(page.blocks, "card");
  return (
    <>
      <Chips node={chips} y={148} />
      <DataTable
        table={table}
        x={59}
        y={198}
        w={718}
        widths={[103, 70, 80, 79, 66, 55, 46, 65, 80, 56]}
        headH={37}
        rowH={38}
      />
      {table.note ? <div style={box({ left: 59, top: 363, width: 718, height: 20, fontSize: 15, lineHeight: "20px", color: SUB })}>{table.note}</div> : null}
      <CardView card={cards[0]} x={806} y={196} w={417} h={203} />
      <CardView card={cards[1]} x={57} y={403} w={721} h={246} />
      <CardView card={cards[2]} x={806} y={417} w={417} h={231} />
    </>
  );
}

function KpiRow({ items, y, h }: { items: string[]; y: number; h: number }) {
  const place = slots(4, y, y + h);
  return (
    <>
      {items.map((label, i) => (
        <div key={label} style={cardShell(place[i].x, place[i].y, place[i].w, place[i].h)}>
          <div style={{ fontSize: 19, color: SUB, fontWeight: 700, lineHeight: "24px" }}>{label}</div>
          <div style={{ marginTop: 10, fontSize: 37, fontWeight: 700, color: TITLE, lineHeight: "37px" }}>—</div>
        </div>
      ))}
    </>
  );
}

function Goods({ page }: { page: ManualPage }) {
  const chips = findAll(page.blocks, "chips")[0];
  const kpis = findAll(page.blocks, "kpis")[0];
  const table = findAll(page.blocks, "table")[0];
  const cards = findAll(page.blocks, "card");
  const place = slots(3, 421, 653);
  return (
    <>
      <Chips node={chips} y={148} />
      <KpiRow items={kpis.items} y={191} h={107} />
      <DataTable table={table} x={59} y={318} w={1162} widths={[48, 140, 220, 110, 120, 360, 164]} />
      {cards.map((card, i) => (
        <CardView key={card.title} card={card} x={place[i].x} y={place[i].y} w={place[i].w} h={place[i].h} />
      ))}
    </>
  );
}

function Store({ page }: { page: ManualPage }) {
  const chips = findAll(page.blocks, "chips")[0];
  const kpis = findAll(page.blocks, "kpis")[0];
  const table = findAll(page.blocks, "table")[0];
  const cards = findAll(page.blocks, "card");
  return (
    <>
      <Chips node={chips} y={148} />
      <KpiRow items={kpis.items} y={191} h={112} />
      <DataTable table={table} x={59} y={327} w={708} widths={[247, 113, 114, 113, 113]} headH={37} />
      <CardView card={cards[0]} x={796} y={326} w={427} h={154} />
      <CardView card={cards[1]} x={57} y={426} w={711} h={223} />
      <CardView card={cards[2]} x={796} y={499} w={427} h={150} />
    </>
  );
}

function Location({ page }: { page: ManualPage }) {
  const chips = findAll(page.blocks, "chips")[0];
  const tables = findAll(page.blocks, "table");
  const note = findAll(page.blocks, "note")[0];
  const cards = findAll(page.blocks, "card");
  const badge = findAll(page.blocks, "badge")[0];
  return (
    <>
      <Chips node={chips} y={148} />
      <div style={box({ left: X, top: 198, height: 32 })}>
        <Inner node={badge} />
      </div>
      <DataTable table={tables[0]} x={59} y={251} w={343} widths={[113, 123, 103]} headH={30} rowH={29} />
      <DataTable table={tables[1]} x={423} y={251} w={344} widths={[104, 123, 113]} headH={30} rowH={29} />
      <div style={box({ left: X, top: 440, width: 720, height: 22, fontSize: 15, lineHeight: "22px", color: SUB })}>{note?.text}</div>
      <CardView card={cards[0]} x={796} y={196} w={427} h={227} />
      <CardView card={cards[1]} x={57} y={479} w={711} h={170} />
      <CardView card={cards[2]} x={796} y={441} w={427} h={208} />
    </>
  );
}

function Archive({ page }: { page: ManualPage }) {
  const chips = findAll(page.blocks, "chips");
  const steps = findAll(page.blocks, "steps")[0];
  const bar = findAll(page.blocks, "bar")[0];
  const items = steps?.items ?? [];
  const places = items.length === 4
    ? [
        { x: 57, w: 270 },
        { x: 355, w: 270 },
        { x: 654, w: 271 },
        { x: 952, w: 271 },
      ]
    : slots(Math.max(items.length, 1), 263, bar ? 500 : 644).map((slot) => ({ x: slot.x, w: slot.w }));
  const cardH = items.length === 4 ? 280 : bar ? 220 : 360;
  return (
    <>
      {chips[0] ? <Chips node={chips[0]} y={148} /> : null}
      {chips[1] ? <Chips node={chips[1]} y={196} /> : null}
      {items.map((item, i) => (
        <div key={item.title} style={cardShell(places[i].x, 263, places[i].w, cardH)}>
          <Num n={i + 1} size={52} fontSize={22} />
          <div style={{ marginTop: 18, fontSize: items.length > 4 ? 20 : 24, fontWeight: 700, color: TITLE, lineHeight: "30px" }}>{item.title}</div>
          <div style={bodyText}>{item.body}</div>
        </div>
      ))}
      {items.length === 4
        ? places.slice(1).map((item, i) => {
            const prev = places[i];
            const left = prev.x + prev.w + (item.x - (prev.x + prev.w)) / 2 - 11;
            return (
              <svg key={item.x} width="22" height="26" viewBox="0 0 22 26" aria-hidden style={box({ left, top: 390, width: 22, height: 26 })}>
                <path d="M2 1 L20 13 L2 25 Z" fill={TITLE} />
              </svg>
            );
          })
        : null}
      {bar ? (
        <div style={cardShell(57, 561, 1166, 87)}>
          <div style={{ fontSize: 21, fontWeight: 700, color: TITLE, lineHeight: "26px" }}>{bar.title}</div>
          <div style={bodyText}>{bar.body}</div>
        </div>
      ) : null}
    </>
  );
}

function ManualImage({ src, x, y, w, h, alt }: { src: string; x: number; y: number; w: number; h: number; alt: string }) {
  const [failed, setFailed] = useState(!src);
  if (failed) {
    return (
      <div
        style={box({
          left: x,
          top: y,
          width: w,
          height: h,
          border: "2px solid #E74C3C",
          color: "#E74C3C",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 12,
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1.4,
        })}
      >
        그림을 불러오지 못했습니다
        <br />
        {alt}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={box({ left: x, top: y, width: w, height: h, objectFit: "contain", objectPosition: "center", background: "#fff", border: `1px solid ${LINE}` })}
    />
  );
}

function Files({ page }: { page: ManualPage }) {
  const cards = findAll(page.blocks, "card");
  return (
    <>
      <div style={box({ left: 58, top: 154, height: 28, fontSize: 16, fontWeight: 700, color: INK, lineHeight: "28px" })}>메뉴 위치</div>
      <ManualImage src={menuShot} x={58} y={192} w={202} h={450} alt="메뉴 위치" />
      {cards[0] ? <CardView card={cards[0]} x={288} y={192} w={326} h={240} /> : null}
      {cards[1] ? <CardView card={cards[1]} x={288} y={452} w={326} h={192} /> : null}
      <div style={box({ left: 662, top: 154, height: 28, fontSize: 16, fontWeight: 700, color: INK, lineHeight: "28px" })}>조회 화면</div>
      <ManualImage src={queryShot} x={662} y={192} w={560} h={306} alt="조회 화면" />
      {cards[2] ? <CardView card={cards[2]} x={662} y={514} w={560} h={134} /> : null}
    </>
  );
}

function Usage({ page }: { page: ManualPage }) {
  const chips = findAll(page.blocks, "chips");
  const cards = findAll(page.blocks, "card");
  const bar = findAll(page.blocks, "bar")[0];
  const place = slots(Math.max(cards.length, 1), 263, 476);
  return (
    <>
      {chips[0] ? <Chips node={chips[0]} y={148} /> : null}
      {chips[1] ? <Chips node={chips[1]} y={196} /> : null}
      {cards.map((card, i) => (
        place[i] ? <CardView key={card.title} card={card} x={place[i].x} y={place[i].y} w={place[i].w} h={place[i].h} /> : null
      ))}
      {bar ? (
        <div style={cardShell(57, 499, 1166, 150)}>
          <div style={{ fontSize: 21, fontWeight: 700, color: TITLE, lineHeight: "26px" }}>{bar.title}</div>
          <div style={bodyText}>{bar.body}</div>
        </div>
      ) : null}
    </>
  );
}

function Tips({ page }: { page: ManualPage }) {
  const chips = findAll(page.blocks, "chips");
  const cards = findAll(page.blocks, "card");
  const top = slots(3, chips.length ? 248 : 172, chips.length ? 430 : 394);
  const bottom = slots(3, chips.length ? 446 : 422, 644);
  return (
    <>
      {chips[0] ? <Chips node={chips[0]} y={148} /> : null}
      {cards.map((card, i) => {
        const row = i < 3 ? top : bottom;
        const place = row[i % 3];
        if (!place) return null;
        return <CardView key={card.title} card={card} x={place.x} y={place.y} w={place.w} h={place.h} />;
      })}
    </>
  );
}

function Cover({ page }: { page: ManualPage }) {
  const [first, second] = page.title.split("\n");
  return (
    <>
      <div style={box({ left: 89, top: 186, width: 1000, color: "#fff", fontSize: 59, fontWeight: 700, lineHeight: "70px" })}>
        {first}
        <br />
        {second}
      </div>
      <div style={box({ left: 88, top: 341, width: 900, color: "#fff", fontSize: 27, fontWeight: 500, lineHeight: "32px" })}>{page.subtitle}</div>
      <div style={box({ left: 86, top: 456, height: 40, display: "flex", gap: 7 })}>
        {LINES.map((color) => (
          <Dot key={color} color={color} size={40} />
        ))}
      </div>
      <div style={box({ left: 88, top: 536, color: "#fff", fontSize: 27, fontWeight: 700, lineHeight: "32px" })}>엑셀 올리고 바로 보기</div>
      <div style={box({ left: 88, top: 632, color: "#fff", fontSize: 19, lineHeight: "24px" })}>2026.11</div>
    </>
  );
}

function PageBody({ page, index }: { page: ManualPage; index: number }) {
  if (index === 1) return <Intro page={page} />;
  if (index === 2) return <Connect page={page} />;
  if (index === 3) return <MenuGrid page={page} />;
  if (index === 4) return <Glossary page={page} />;
  if (index === 6) return <Compare page={page} />;
  if (index === 9) return <Standard page={page} font={15} index={index} />;
  if (index === 10) return <Goods page={page} />;
  if (index === 12) return <Store page={page} />;
  if (index === 17) return <Location page={page} />;
  if (findAll(page.blocks, "shot").length > 0) return <Files page={page} />;
  if (findAll(page.blocks, "steps").length > 0) return <Archive page={page} />;
  if (findAll(page.blocks, "table").length > 0) return <Standard page={page} index={index} />;
  if (findAll(page.blocks, "bar").length > 0) return <Usage page={page} />;
  return <Tips page={page} />;
}

export function ManualSheet({ page, index }: { page: ManualPage; index: number; total: number }) {
  return (
    <article
      className="slide manual-sheet"
      data-slide={index + 1}
      style={{
        width: W,
        height: H,
        position: "relative",
        overflow: "hidden",
        background: page.cover ? TITLE : "#fff",
        color: page.cover ? "#fff" : INK,
        fontFamily: FONT,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {page.cover ? (
        <Cover page={page} />
      ) : (
        <>
          <TitleBlock title={page.title} />
          <SubtitleBlock text={page.subtitle} />
          <PageBody page={page} index={index} />
          <Footer index={index} />
        </>
      )}
    </article>
  );
}

function chromeButton(disabled = false): CSSProperties {
  return {
    height: 40,
    padding: "0 16px",
    borderRadius: 999,
    border: "0",
    background: "#fff",
    color: TITLE,
    fontWeight: 700,
    fontSize: 14,
    fontFamily: FONT,
    opacity: disabled ? 0.38 : 1,
  };
}

export function ManualViewer({ onClose }: { onClose: () => void }) {
  const pages = MANUAL_PAGES;
  const [index, setIndex] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const total = pages.length;
  const page = pages[index] ?? pages[0];

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setScale(Math.max(0.05, Math.min(w / W, h / H)));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((n) => Math.min(total - 1, n + 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((n) => Math.max(0, n - 1));
      } else if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, total]);

  function go(next: number) {
    setIndex(Math.max(0, Math.min(total - 1, next)));
  }

  function onTouchStart(event: TouchEvent) {
    const target = event.target as HTMLElement;
    if (target.closest("button, a")) return;
    const point = event.changedTouches[0];
    touch.current = { x: point.clientX, y: point.clientY };
  }

  function onTouchEnd(event: TouchEvent) {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    go(index + (dx < 0 ? 1 : -1));
  }

  function download() {
    const previous = document.title;
    document.body.classList.add("manual-export");
    document.title = "센터 생산성 프로그램 사용 매뉴얼";
    const style = document.createElement("style");
    style.id = "manual-page-css";
    style.textContent = "@page { size: 1280px 720px; margin: 0; } .slide { break-after: page; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }";
    document.head.appendChild(style);
    const finish = () => {
      document.body.classList.remove("manual-export");
      document.title = previous;
      style.remove();
    };
    window.addEventListener("afterprint", finish, { once: true });
    window.setTimeout(() => window.print(), 50);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="센터 생산성 사용 메뉴얼"
        className="manual-overlay"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 80,
          background: "#10202c",
          display: "flex",
          flexDirection: "column",
          fontFamily: FONT,
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "10px 12px 0" }}>
          <button type="button" style={chromeButton()} onClick={download} aria-label="가로 16:9 PDF로 내보내기">
            다운로드
          </button>
          <button type="button" style={chromeButton()} onClick={onClose}>
            닫기
          </button>
        </div>
        <div ref={stageRef} style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 12px" }}>
          <div style={{ width: W * scale, height: H * scale, position: "relative" }}>
            <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <ManualSheet page={page} index={index} total={total} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4px 12px 14px" }}>
          <button type="button" style={chromeButton(index === 0)} disabled={index === 0} onClick={() => go(index - 1)}>
            이전
          </button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 16, minWidth: 72, textAlign: "center" }}>
            {index + 1} / {total}
          </span>
          <button type="button" style={chromeButton(index === total - 1)} disabled={index === total - 1} onClick={() => go(index + 1)}>
            다음
          </button>
        </div>
      </div>
      <div className="manual-print-root" aria-hidden>
        {pages.map((item, i) => (
          <div className="manual-print-page" key={item.title + i}>
            <ManualSheet page={item} index={i} total={total} />
          </div>
        ))}
      </div>
    </>,
    document.body,
  );
}
