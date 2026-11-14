// @ts-nocheck
import { Fragment, createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { ArrowLeftRight, ChartColumn, Check, ChevronDown, ClipboardList, Clock, LayoutDashboard, ListChecks, MapPin, Package, PackageCheck, PanelLeft, PanelLeftClose, PieChart, Route, Settings, Store, TriangleAlert, X } from "lucide-react";
import { ArchiveView } from "@/archive-view";
import { ManualViewer } from "@/manual-view";
import { BUILD_LABEL } from "@/build-info";
import { ChulgoView } from "@/chulgo-view";
import { OshipView } from "@/oship-view";
import { OshipCheckView } from "@/oship-check-view";
import { StockView } from "@/stock-view";
import { ControlPanel } from "@/control-panel";
import { applyLook } from "@/lib/ui-theme";
import { CheckMenu, PickMenu } from "@/pick-filter";
import { code128Bars } from "@/lib/barcode";
import { drawnSlots, layoutFor, pillarBox, subscribeLayouts } from "@/lib/location-layout";
import {
  CENTERS,
  centerList,
  setShownCenters,
  setShownSite,
  shownSite,
  CENTER_LABELS,
  DPTS,
  LINE_LABELS,
  buckets,
  centerForecast,
  centerStat,
  finishScale,
  formatAhead,
  formatHm,
  formatHms,
  formatWhen,
  goodsStats,
  heatScale,
  lineAverages,
  lineCountOf,
  lineForecasts,
  lineStats,
  locationHits,
  matchDpt,
  normalizeLoc,
  openGoods,
  routeBucket,
  routeStats,
  storeStats,
  withCenterRanks,
  workDateLabel,
} from "@/lib/productivity";
import { centersOf, siteDefs, subscribeSites } from "@/lib/sites";
import { applySharedPanel, readPanel } from "@/lib/panel-store";
import { pullSharedPanel } from "@/lib/panel-sync";
import { readCenters, readLocMaster } from "@/lib/read-workbook";

var nf = new Intl.NumberFormat("ko-KR");
var pf = new Intl.NumberFormat("ko-KR", {
	style: "percent",
	minimumFractionDigits: 1,
	maximumFractionDigits: 1
});
var LINE_CLASS = [
	"bg-line-1 text-on-dark",
	"bg-line-2 text-on-dark",
	"bg-line-3 text-ink",
	"bg-line-4 text-on-dark",
	"bg-line-5 text-on-dark",
	"bg-line-6 text-on-dark",
	"bg-line-7 text-on-dark",
	"bg-line-8 text-on-dark",
	"bg-line-1 text-on-dark",
	"bg-line-5 text-on-dark",
	"bg-line-3 text-ink",
	"bg-line-2 text-on-dark"
];
var CENTER_CLASS = {
	"1센터": "bg-line-5 text-on-dark",
	"2센터": "bg-line-2 text-on-dark",
	"3센터": "bg-line-6 text-on-dark"
};
function looksLikeMaster(name, buf) {
	const base = name.replace(/\.[^.]+$/, "");
	if (/torderdetail|orderdetail|blockno/i.test(base)) return false;
	if (/[-_\s][1-9]$/.test(base) || /[1-9]\s*센터|배치|로케이션|점포/.test(base)) return true;
	const head = new Uint8Array(buf.slice(0, 2));
	return !(head[0] === 80 && head[1] === 75) && buf.byteLength < 15e5;
}
function num(value) {
	return nf.format(Math.round(value));
}
function hrs(value) {
	return value.toFixed(1);
}
var LINE_FILL = [
	"#e74c3c",
	"#e67e22",
	"#f1c40f",
	"#27ae60",
	"#3498db",
	"#9b59b6",
	"#e91e63",
	"#1abc9c",
	"#795548",
	"#607d8b",
	"#cddc39",
	"#ff5722"
];
var LINE_INK = [
	"#ffffff",
	"#ffffff",
	"#1c2833",
	"#ffffff",
	"#ffffff",
	"#ffffff",
	"#ffffff",
	"#ffffff",
	"#ffffff",
	"#ffffff",
	"#1c2833",
	"#ffffff"
];
var CENTER_FILL = {
	"1센터": "#3498db",
	"2센터": "#e67e22",
	"3센터": "#9b59b6"
};
function bytesToBase64(bytes) {
	let binary = "";
	for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
	return btoa(binary);
}
async function copyCanvas(canvas) {
	const blob = await new Promise((resolve) => canvas.toBlob((value) => resolve(value), "image/png"));
	if (!blob) throw new Error("이미지를 만들지 못했습니다.");
	const host = window.chrome?.webview;
	if (host) host.postMessage({
		type: "clipboard-png",
		b64: bytesToBase64(new Uint8Array(await blob.arrayBuffer()))
	});
	try {
		await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
	} catch (err) {
		if (!host) throw err instanceof Error ? err : /* @__PURE__ */ new Error("복사에 실패했습니다.");
	}
}
const CAP_FONT = "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
const CAP_TINT: Record<CenterId, string> = { "1센터": "#007aff", "2센터": "#ff9500", "3센터": "#af52de" };

function drawSummaryCapture(all: Partial<Record<CenterId, Job[]>>, dpt: DptId, forecast = false): HTMLCanvasElement {
  const headers = forecast
    ? ["라인", "작업건수", "완료", "잔여", "%", "시작", "끝", "시간", "건/hr", "순위", "예상종료", "앞으로"]
    : ["라인", "작업건수", "완료", "잔여", "%", "시작", "끝", "시간", "건/hr", "순위"];
  const widths = forecast
    ? [104, 78, 64, 64, 60, 60, 60, 60, 64, 52, 92, 78]
    : [104, 78, 64, 64, 60, 60, 60, 60, 64, 52];
  const tableW = widths.reduce((sum, width) => sum + width, 0);
  const pad = 22;
  const cardPad = 14;
  const cardW = tableW + cardPad * 2;
  const width = cardW + pad * 2;
  const rowH = 28;
  const headH = 24;
  const gap = 12;
  const blocks = centerList().map((id) => {
    const jobs = jobsOf(all, id, dpt);
    const lines = lineStats(jobs, lineCountOf(id));
    const forecasts = lineForecasts(jobs, lineCountOf(id));
    const cast = centerForecast(forecasts);
    const whole = centerStat(id, jobs);
    return {
      id,
      lines,
      forecasts,
      cast,
      whole,
      day: workDateLabel(whole.first, whole.last),
      finish: finishScale(lines.map((row) => row.last)),
      etaTone: finishScale(forecasts.map((row) => (row.left > 0 ? row.eta : null))),
    };
  });
  const cardH = (count: number) => 54 + headH + (1 + count) * rowH + 12;
  const height = 46 + blocks.reduce((sum, block) => sum + cardH(block.lines.length) + gap, 0) + 8;
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 만들지 못했습니다.");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#f2f2f7";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#1c1c1e";
  ctx.font = `600 20px ${CAP_FONT}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("라인별 생산성", pad, 26);
  const titleW = ctx.measureText("라인별 생산성").width;
  ctx.fillStyle = "#8e8e93";
  ctx.font = `600 14px ${CAP_FONT}`;
  ctx.fillText(`${dpt} · ${forecast ? "예상" : "기본"}`, pad + titleW + 14, 26);
  let y = 46;
  for (const block of blocks) {
    const top = y;
    const h = cardH(block.lines.length);
    fillRound(ctx, pad, top, cardW, h, 16, "#ffffff");
    ctx.beginPath();
    ctx.arc(pad + 24, top + 22, 5, 0, Math.PI * 2);
    ctx.fillStyle = CAP_TINT[block.id];
    ctx.fill();
    ctx.fillStyle = "#1c1c1e";
    ctx.font = `600 15px ${CAP_FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(block.id, pad + 36, top + 22);
    const week = block.day.week || "—";
    ctx.font = `600 12px ${CAP_FONT}`;
    const weekW = ctx.measureText(week).width + 16;
    fillRound(ctx, pad + cardW - cardPad - weekW, top + 10, weekW, 22, 11, "#007aff");
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(week, pad + cardW - cardPad - weekW / 2, top + 21);
    ctx.fillStyle = "#8e8e93";
    ctx.font = `500 12px ${CAP_FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(block.day.date || "—", pad + cardW - cardPad - weekW - 8, top + 21);
    ctx.textAlign = "left";
    ctx.fillStyle = "#8e8e93";
    ctx.font = `500 12px ${CAP_FONT}`;
    const span = block.whole.first == null ? "—" : `${formatHm(block.whole.first)} ~ ${formatHm(block.whole.last)}`;
    ctx.fillText("총 작업시간", pad + 16, top + 44);
    ctx.fillStyle = "#1c1c1e";
    ctx.font = `600 13px ${CAP_FONT}`;
    ctx.fillText(span, pad + 86, top + 44);
    let rowY = top + 58;
    let x = pad + cardPad;
    ctx.font = `600 11px ${CAP_FONT}`;
    ctx.fillStyle = "#8e8e93";
    ctx.textAlign = "center";
    headers.forEach((label, index) => {
      ctx.fillText(label, x + widths[index] / 2, rowY + headH / 2);
      x += widths[index];
    });
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.beginPath();
    ctx.moveTo(pad + cardPad, rowY + headH);
    ctx.lineTo(pad + cardPad + tableW, rowY + headH);
    ctx.stroke();
    rowY += headH;
    const paint = (label: string, fill: string, ink: string, cells: string[], endFill?: string, whole = false, etaFill?: string) => {
      if (whole) {
        ctx.fillStyle = "#f2f2f7";
        ctx.fillRect(pad + 8, rowY, cardW - 16, rowH);
      }
      const pillW = 78;
      fillRound(ctx, pad + cardPad + (widths[0] - pillW) / 2, rowY + 4, pillW, rowH - 8, 10, fill);
      ctx.fillStyle = ink;
      ctx.font = `600 12px ${CAP_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(label, pad + cardPad + widths[0] / 2, rowY + rowH / 2);
      let col = pad + cardPad + widths[0];
      ctx.font = `500 13px ${CAP_FONT}`;
      cells.forEach((cell, index) => {
        if (index === 5 && endFill && endFill !== "transparent") {
          ctx.fillStyle = endFill;
          ctx.fillRect(col, rowY, widths[index + 1], rowH);
        }
        if (index === 9 && etaFill && etaFill !== "transparent") {
          ctx.fillStyle = etaFill;
          ctx.fillRect(col, rowY, widths[index + 1], rowH);
        }
        ctx.fillStyle = "#1c1c1e";
        ctx.fillText(cell, col + widths[index + 1] / 2, rowY + rowH / 2);
        col += widths[index + 1];
      });
      rowY += rowH;
    };
    const cellsOf = (row: { planned: number; done: number; left: number; rate: number; first: number | null; last: number | null; hours: number; perHour: number; rank?: string }) => [
      num(row.planned),
      num(row.done),
      num(row.left),
      pf.format(row.rate),
      formatHm(row.first),
      formatHm(row.last),
      hrs(row.hours),
      num(row.perHour),
      row.rank ?? "",
    ];
    const wholeCells = cellsOf(block.whole);
    const lineCells = (row: (typeof block.lines)[number], index: number) => {
      const cells = cellsOf(row);
      if (!forecast) return { cells, eta: undefined as string | undefined };
      const seen = block.forecasts[index];
      const etaMs = row.left > 0 ? seen?.eta ?? null : row.last;
      const ahead = row.planned === 0 ? "—" : row.left === 0 ? "끝남" : seen?.eta == null ? "몰라요" : formatAhead(seen.eta - (row.last ?? seen.eta));
      cells.push(row.planned === 0 ? "—" : formatWhen(etaMs, block.cast.snapshot));
      cells.push(ahead);
      return { cells, eta: block.etaTone(row.left > 0 ? seen?.eta ?? null : null) };
    };
    if (forecast) {
      const ahead = block.cast.eta != null && block.cast.snapshot != null ? block.cast.eta - block.cast.snapshot : null;
      wholeCells.push(block.whole.planned === 0 ? "—" : block.cast.unknown.length > 0 ? "몰라요" : formatWhen(block.cast.eta, block.cast.snapshot));
      wholeCells.push(block.whole.planned === 0 ? "—" : block.cast.left === 0 ? "끝남" : block.cast.unknown.length > 0 ? "몰라요" : formatAhead(ahead));
    }
    paint("전체", "#2c3e50", "#ffffff", wholeCells, undefined, true);
    block.lines.forEach((row, index) => {
      const painted = lineCells(row, index);
      paint(LINE_LABELS[index].replace(/^\S+\s/, ""), LINE_FILL[index], LINE_INK[index], painted.cells, block.finish(row.last), false, painted.eta);
    });
    y += h + gap;
  }
  ctx.fillStyle = "#8e8e93";
  ctx.font = `12px ${CAP_FONT}`;
  ctx.textAlign = "left";
  ctx.fillText(forecast ? "총 작업시간은 쉬는 시간이 포함된 첫 완료~마지막 완료입니다. 예상종료는 건/hr 기준입니다." : "총 작업시간은 쉬는 시간이 포함된 첫 완료~마지막 완료입니다. 순위는 건/hr입니다.", pad, height - 14);
  return canvas;
}

function drawFinishCapture(all: Partial<Record<CenterId, Job[]>>, dpt: DptId): HTMLCanvasElement {
  const headers = ["라인", "할 일", "끝낸 일", "남은 일", "건/hr", "마지막", "끝나는 시각", "앞으로"];
  const widths = [104, 70, 70, 70, 64, 70, 96, 78];
  const tableW = widths.reduce((sum, width) => sum + width, 0);
  const pad = 22;
  const cardPad = 14;
  const cardW = tableW + cardPad * 2;
  const width = cardW + pad * 2;
  const rowH = 28;
  const headH = 24;
  const gap = 12;
  const blocks = centerList().map((id) => {
    const jobs = jobsOf(all, id, dpt);
    const lines = lineForecasts(jobs, lineCountOf(id));
    const whole = centerForecast(lines);
    const day = workDateLabel(
      jobs.reduce<number | null>((min, job) => (job.at != null && (min == null || job.at < min) ? job.at : min), null),
      whole.snapshot,
    );
    return { id, jobs, lines, whole, day, tone: finishScale(lines.map((row) => (row.left > 0 ? row.eta : null))) };
  });
  const cardH = (count: number) => 54 + headH + (1 + count) * rowH + 12;
  const height = 46 + blocks.reduce((sum, block) => sum + cardH(block.lines.length) + gap, 0) + 8;
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 만들지 못했습니다.");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#f2f2f7";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#1c1c1e";
  ctx.font = `600 20px ${CAP_FONT}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("끝날 시간", pad, 26);
  ctx.fillStyle = "#8e8e93";
  ctx.font = `600 14px ${CAP_FONT}`;
  ctx.fillText(dpt, pad + 92, 26);
  let y = 46;
  for (const block of blocks) {
    const top = y;
    const h = cardH(block.lines.length);
    const ahead = block.whole.eta != null && block.whole.snapshot != null ? block.whole.eta - block.whole.snapshot : null;
    fillRound(ctx, pad, top, cardW, h, 16, "#ffffff");
    ctx.beginPath();
    ctx.arc(pad + 24, top + 22, 5, 0, Math.PI * 2);
    ctx.fillStyle = CAP_TINT[block.id];
    ctx.fill();
    ctx.fillStyle = "#1c1c1e";
    ctx.font = `600 15px ${CAP_FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(block.id, pad + 36, top + 22);
    const week = block.day.week || "—";
    ctx.font = `600 12px ${CAP_FONT}`;
    const weekW = ctx.measureText(week).width + 16;
    fillRound(ctx, pad + cardW - cardPad - weekW, top + 10, weekW, 22, 11, "#007aff");
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(week, pad + cardW - cardPad - weekW / 2, top + 21);
    ctx.fillStyle = "#8e8e93";
    ctx.font = `500 12px ${CAP_FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(block.day.date || "—", pad + cardW - cardPad - weekW - 8, top + 21);
    let status = "—";
    if (block.jobs.length > 0 && block.whole.left === 0) status = "끝남";
    else if (block.whole.unknown.length > 0) status = "속도 모름";
    else if (block.whole.left > 0) {
      const late = block.whole.slowLine != null ? `   늦은 라인 ${LINE_LABELS[block.whole.slowLine - 1].replace(/^\S+\s/, "")}` : "";
      status = `${formatWhen(block.whole.eta, block.whole.snapshot)}   앞으로 ${formatAhead(ahead)}${late}`;
    }
    ctx.textAlign = "left";
    ctx.fillStyle = "#8e8e93";
    ctx.font = `500 12px ${CAP_FONT}`;
    ctx.fillText("끝나는 시각", pad + 16, top + 44);
    ctx.fillStyle = "#1c1c1e";
    ctx.font = `600 13px ${CAP_FONT}`;
    ctx.fillText(status, pad + 86, top + 44);
    let rowY = top + 58;
    let x = pad + cardPad;
    ctx.font = `600 11px ${CAP_FONT}`;
    ctx.fillStyle = "#8e8e93";
    ctx.textAlign = "center";
    headers.forEach((label, index) => {
      ctx.fillText(label, x + widths[index] / 2, rowY + headH / 2);
      x += widths[index];
    });
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.beginPath();
    ctx.moveTo(pad + cardPad, rowY + headH);
    ctx.lineTo(pad + cardPad + tableW, rowY + headH);
    ctx.stroke();
    rowY += headH;
    const clock = (ms: number | null) => formatHm(ms) || "—";
    const paint = (label: string, fill: string, ink: string, cells: string[], endFill?: string, whole = false) => {
      if (whole) {
        ctx.fillStyle = "#f2f2f7";
        ctx.fillRect(pad + 8, rowY, cardW - 16, rowH);
      }
      const pillW = 78;
      fillRound(ctx, pad + cardPad + (widths[0] - pillW) / 2, rowY + 4, pillW, rowH - 8, 10, fill);
      ctx.fillStyle = ink;
      ctx.font = `600 12px ${CAP_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(label, pad + cardPad + widths[0] / 2, rowY + rowH / 2);
      let col = pad + cardPad + widths[0];
      ctx.font = `500 13px ${CAP_FONT}`;
      cells.forEach((cell, index) => {
        if (index === 5 && endFill && endFill !== "transparent") {
          ctx.fillStyle = endFill;
          ctx.fillRect(col, rowY, widths[index + 1], rowH);
        }
        ctx.fillStyle = "#1c1c1e";
        ctx.fillText(cell, col + widths[index + 1] / 2, rowY + rowH / 2);
        col += widths[index + 1];
      });
      rowY += rowH;
    };
    const cellsOf = (planned: number, done: number, left: number, perHour: string, last: number | null, eta: string, remain: string) => [
      num(planned),
      num(done),
      num(left),
      perHour,
      clock(last),
      eta,
      remain,
    ];
    paint(
      "전체",
      "#2c3e50",
      "#ffffff",
      cellsOf(
        block.whole.planned,
        block.whole.done,
        block.whole.left,
        "—",
        block.whole.snapshot,
        block.whole.eta == null ? "—" : formatWhen(block.whole.eta, block.whole.snapshot),
        block.whole.planned === 0 ? "—" : block.whole.left === 0 ? "끝남" : block.whole.unknown.length > 0 ? "몰라요" : formatAhead(ahead),
      ),
      undefined,
      true,
    );
    block.lines.forEach((row) => {
      const etaMs = row.left > 0 ? row.eta : row.last;
      const remain = row.planned === 0 ? "—" : row.left === 0 ? "끝남" : row.eta == null ? "몰라요" : formatAhead(row.eta - (row.last ?? row.eta));
      paint(
        LINE_LABELS[row.line - 1].replace(/^\S+\s/, ""),
        LINE_FILL[row.line - 1],
        LINE_INK[row.line - 1],
        cellsOf(row.planned, row.done, row.left, row.planned === 0 ? "—" : num(row.perHour), row.last, etaMs == null ? "—" : formatWhen(etaMs, block.whole.snapshot), remain),
        block.tone(row.left > 0 ? row.eta : null),
      );
    });
    y += h + gap;
  }
  ctx.fillStyle = "#8e8e93";
  ctx.font = `12px ${CAP_FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("끝나는 시각은 그 라인의 건/hr입니다. 센터는 가장 늦은 라인입니다.", pad, height - 14);
  return canvas;
}
function jobFromFast(row) {
	return {
		line: row?.[0] ?? null,
		at: row?.[1] ?? null,
		qty: Number(row?.[2]) || 0,
		orderQty: Number(row?.[3]) || 0,
		route: row?.[4] || "",
		storeCd: row?.[5] || "",
		storeNm: row?.[6] || "",
		goodsCd: row?.[7] || "",
		goodsNm: row?.[8] || "",
		location: row?.[9] || "",
		groupId: row?.[10] || "",
	};
}
function b64ToArrayBuffer(b64) {
	const clean = b64.replace(/\s/g, "");
	const chunks = [];
	let total = 0;
	for (let i = 0; i < clean.length;) {
		let end = Math.min(clean.length, i + 1048576);
		const span = end - i;
		end -= span % 4;
		if (end <= i) end = clean.length;
		const bin = atob(clean.slice(i, end));
		const part = new Uint8Array(bin.length);
		for (let j = 0; j < bin.length; j++) part[j] = bin.charCodeAt(j);
		chunks.push(part);
		total += part.length;
		i = end;
	}
	const out = new Uint8Array(total);
	let offset = 0;
	for (const part of chunks) {
		out.set(part, offset);
		offset += part.length;
	}
	return out.buffer;
}
const WORK_ITEMS = [
	["time", "시간별 확인", Clock],
	["goods", "미작업 상품", Package],
	["worked", "작업 상품", PackageCheck],
	["store", "점포 진척", Store],
	["route", "루트", Route]
];
const DATA_ITEMS = [
	["archive", "생산성 분석", ChartColumn],
	["ledger", "출고 분석", ClipboardList],
	["stock", "수불분석", ArrowLeftRight],
	["oship", "오출분석", TriangleAlert]
];
const SUB_LABELS = new Map([...WORK_ITEMS, ...DATA_ITEMS, ["location", "로케이션"], ["oshipcheck", "오출 확인"]].map(([id, label]) => [id, label]));
const BLANK_FILES = () => [null, null, null, null, null, null, null, null];
const BLANK_NAMES = () => ["", "", "", "", "", "", "", ""];
function workSlots(site) {
	const slots = [{ label: "1. 작업 엑셀", role: "work" }];
	for (const id of centersOf(site)) {
		if (site === "포천" && id === "2센터") {
			slots.push({ label: `${slots.length + 1}. 2센터 FF2`, role: "2센터FF2" });
			slots.push({ label: `${slots.length + 1}. 2센터 FF1`, role: "2센터FF1" });
		} else slots.push({ label: `${slots.length + 1}. ${id} 배치표`, role: id });
	}
	return slots.slice(0, 8);
}
function mergeSlots(site) {
	return centersOf(site).slice(0, 8).map((id, index) => ({ label: `${index + 1}. ${id}`, role: id }));
}
function emptySite() {
	return {
		jobs: {},
		masters: {},
		storeCodes: {},
		bandMasters: {},
		webFiles: BLANK_FILES(),
		slotNames: { work: BLANK_NAMES(), merge: BLANK_NAMES() },
		archiveSeed: [],
		error: ""
	};
}
export function Home() {
	const [jobs, setJobs] = useState({});
	const [masters, setMasters] = useState({});
	const [storeCodes, setStoreCodes] = useState({});
	const [bandMasters, setBandMasters] = useState({});
	const [busy, setBusy] = useState("");
	const [error, setError] = useState("");
	const [tab, setTab] = useState("summary");
	const [openTabs, setOpenTabs] = useState([]);
	const [menuOpen, setMenuOpen] = useState(false);
	const [openMenu, setOpenMenu] = useState({ work: false, data: false });
	const [manualOpen, setManualOpen] = useState(false);
	const [controlOpen, setControlOpen] = useState(false);
	const [wide, setWide] = useState(false);
	const [colPct, setColPct] = useState(50);
	const [rowLeft, setRowLeft] = useState(50);
	const [rowRight, setRowRight] = useState(50);
	const [summaryPane, setSummaryPane] = useState("lines");
	const [dragOver, setDragOver] = useState(false);
	const [archiveSeed, setArchiveSeed] = useState([]);
	const [company, setCompany] = useState(false);
	const [fileSheet, setFileSheet] = useState("");
	const headRef = useRef(null);
	const [sheetPos, setSheetPos] = useState({ top: 0, left: 0 });
	const [slotNames, setSlotNames] = useState({ work: BLANK_NAMES(), merge: BLANK_NAMES() });
	const [webFiles, setWebFiles] = useState(BLANK_FILES);
	const siteBag = useRef({});
	const [site, setSite] = useState(() => {
		const names = siteDefs().map((item) => item.name);
		try {
			const saved = window.localStorage.getItem("center-site");
			if (saved && names.includes(saved)) return saved;
		} catch {}
		return names[0] ?? "신오산";
	});
	const [siteRev, setSiteRev] = useState(0);
	setShownSite(site);
	setShownCenters(centersOf(site));
	const loaded = centerList().filter((id) => (jobs[id]?.length ?? 0) > 0);
	function chooseSite(next) {
		if (next === site) return;
		siteBag.current[site] = { jobs, masters, storeCodes, bandMasters, webFiles, slotNames, archiveSeed, error };
		const saved = siteBag.current[next] ?? emptySite();
		setJobs(saved.jobs);
		setMasters(saved.masters);
		setStoreCodes(saved.storeCodes);
		setBandMasters(saved.bandMasters ?? {});
		setWebFiles(saved.webFiles);
		setSlotNames(saved.slotNames);
		setArchiveSeed(saved.archiveSeed);
		setError(saved.error);
		setBusy("");
		setFileSheet("");
		setSite(next);
		try {
			window.localStorage.setItem("center-site", next);
		} catch {}
	}
	useEffect(() => subscribeSites(() => {
		setSite((cur) => {
			const names = siteDefs().map((item) => item.name);
			const next = names.includes(cur) ? cur : names[0] ?? "신오산";
			setShownSite(next);
			setShownCenters(centersOf(next));
			return next;
		});
		setSiteRev((value) => value + 1);
	}), []);
	useLayoutEffect(() => {
		const query = window.matchMedia("(min-width: 1024px)");
		const apply = () => setWide(query.matches);
		apply();
		query.addEventListener("change", apply);
		return () => query.removeEventListener("change", apply);
	}, []);
	useEffect(() => {
		applyLook();
	}, []);
	useEffect(() => {
		const host = window.chrome?.webview;
		if (!host?.addEventListener) return;
		const onMessage = (event) => {
			try {
				const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
				if (data?.type === "panel" && data.state && typeof data.state === "object") {
					applySharedPanel(data.state);
					try { host.postMessage("panel-save:" + JSON.stringify(readPanel())); } catch { /* 저장 실패는 다음 가져오기에서 다시 */ }
					return;
				}
				if (data?.type === "work-status") {
					setFileSheet("");
					setBusy(data.text || "");
					if (data.error) setError(data.error);
					return;
				}
				if (data?.type === "work-ready" && data.centers && typeof data.centers === "object") {
					const next = {};
					for (const [id, rows] of Object.entries(data.centers)) next[id] = (Array.isArray(rows) ? rows : []).map(jobFromFast);
					setJobs(next);
					setBusy("");
					setError("");
					setFileSheet("");
					if (Array.isArray(data.files) && data.files.length > 0) void ingestRef.current?.(data.files);
					return;
				}
				if (!data || data.type !== "slot") {
					if (data?.type === "work-open" && Array.isArray(data.files)) void ingestRef.current?.(data.files);
					return;
				}
				const kind = data.kind === "merge" ? "merge" : "work";
				setSlotNames((prev) => {
					const next = prev[kind].slice();
					next[data.index] = data.name || "";
					return { ...prev, [kind]: next };
				});
			} catch { /* 다른 메시지 */ }
		};
		host.addEventListener("message", onMessage);
		return () => host.removeEventListener("message", onMessage);
	}, []);
	useEffect(() => {
		if (!fileSheet) return;
		const onDown = (event) => {
			const el = event.target;
			if (el instanceof Element && el.closest("[data-file-sheet]")) return;
			setFileSheet("");
		};
		document.addEventListener("mousedown", onDown);
		return () => document.removeEventListener("mousedown", onDown);
	}, [fileSheet]);
	useLayoutEffect(() => {
		if (!fileSheet) return;
		const place = () => {
			const rect = headRef.current?.getBoundingClientRect();
			if (!rect) return;
			setSheetPos({ top: rect.bottom + 8, left: rect.left });
		};
		place();
		window.addEventListener("resize", place);
		return () => window.removeEventListener("resize", place);
	}, [fileSheet]);
	useEffect(() => {
		void pullSharedPanel().catch(() => {});
	}, []);
	const ingestRef = useRef(null);
	useEffect(() => {
		const win = window;
		setCompany(Boolean(win.__COMPANY_PC__));
		let cancelled = false;
		async function ingest(files) {
			if (!files || files.length === 0 || cancelled) return;
			setFileSheet("");
			setBusy(files.some((file) => file.role !== "archive") ? "센터 읽는 중" : "엑셀 여는 중");
			setError("");
			await new Promise((resolve) => setTimeout(resolve, 30));
			try {
				const nextJobs = {};
				const nextMasters = {};
				const nextCodes = {};
				const nextBands = {};
				const nextArchive = [];
				const missed = [];
				const stashBand = (role, master) => {
					const band = role === "2센터FF1" ? "FF1" : role === "2센터FF2" ? "FF2" : "";
					if (!band) return false;
					const places = master.places["2센터"] ?? {};
					const codes = master.codes["2센터"] ?? {};
					nextBands["2센터"] = { ...nextBands["2센터"], [band]: { places, codes } };
					if (band === "FF1") {
						nextMasters["2센터"] = places;
						nextCodes["2센터"] = codes;
					}
					return true;
				};
				for (const file of files) {
					if (cancelled) return;
					const name = file.name || "엑셀";
					setBusy(file.role === "archive" ? `${name} 여는 중` : "센터 읽는 중");
					let buf = file.buf;
					if (!buf && file.b64) buf = b64ToArrayBuffer(file.b64);
					if (!buf && file.url) {
						const res = await fetch(file.url);
						if (!res.ok) throw new Error(`${name} 을 읽지 못했습니다.`);
						buf = await res.arrayBuffer();
					}
					if (!buf) buf = b64ToArrayBuffer("");
					if (file.role === "archive") {
						nextArchive.push({
							name,
							buf
						});
						continue;
					}
					const bandRole = file.role === "2센터FF1" || file.role === "2센터FF2" ? file.role : "";
					const forced = /^[1-9]센터$/.test(file.role || "") ? file.role : "";
					if (forced || bandRole) {
						const id = bandRole ? "2센터" : forced;
						const master = await readLocMaster(buf, id, `${id}.xls`, id);
						if (!master) {
							missed.push(`${name} 은 배치표가 아닙니다. 로케이션코드와 점포명 열이 있어야 합니다.`);
							continue;
						}
						if (!stashBand(bandRole, master)) {
							for (const centerId of centerList()) if (master.places[centerId]) nextMasters[centerId] = {
								...nextMasters[centerId] ?? {},
								...master.places[centerId]
							};
							for (const centerId of centerList()) if (master.codes[centerId]) nextCodes[centerId] = {
								...nextCodes[centerId] ?? {},
								...master.codes[centerId]
							};
						}
						continue;
					}
					try {
						const parsed = await readCenters(buf, "1센터", setBusy);
						for (const id of centerList()) if (parsed.centers[id]) nextJobs[id] = parsed.centers[id];
					} catch (err) {
						if (err instanceof Error && err.message.includes("BlockNO")) {
							missed.push(`${name}: ${err.message}`);
							continue;
						}
						const master = await readLocMaster(buf, "1센터", name);
						if (master && centerList().some((id) => master.places[id] && Object.keys(master.places[id] ?? {}).length > 0)) {
							for (const id of centerList()) if (master.places[id]) nextMasters[id] = {
								...nextMasters[id] ?? {},
								...master.places[id]
							};
							for (const id of centerList()) if (master.codes[id]) nextCodes[id] = {
								...nextCodes[id] ?? {},
								...master.codes[id]
							};
							missed.push(`${name} 은 작업 엑셀이 아니라 배치표로 넣었습니다. 작업 파일은 1번에 넣어 주세요.`);
							continue;
						}
						missed.push(err instanceof Error ? `${name}: ${err.message}` : `${name} 을 읽지 못했습니다.`);
					}
				}
				if (cancelled) return;
				const openedWork = files.some((file) => !file.role || file.role === "work");
				if (openedWork) setJobs(nextJobs);
				else if (Object.keys(nextJobs).length > 0) setJobs(nextJobs);
				if (Object.keys(nextMasters).length > 0) setMasters(nextMasters);
				if (Object.keys(nextCodes).length > 0) setStoreCodes(nextCodes);
				if (Object.keys(nextBands).length > 0) setBandMasters(nextBands);
				if (nextArchive.length > 0) {
					setArchiveSeed(nextArchive);
					setTab("archive");
					rememberTab("archive");
					setOpenMenu((prev) => ({ ...prev, data: true }));
				}
				setBusy("");
				if (missed.length > 0) setError(missed.join(" "));
			} catch (err) {
				if (cancelled) return;
				setBusy("");
				setError(err instanceof Error ? err.message : "파일을 읽지 못했습니다.");
			}
		}
		ingestRef.current = ingest;
		const files = Array.isArray(win.__WB_FILES__) && win.__WB_FILES__.some((file) => file?.b64) ? win.__WB_FILES__.filter((file) => file?.b64) : win.__WB__ ? [{
			name: win.__WB_NAME__ || "엑셀",
			b64: win.__WB__
		}] : [];
		if (files.length > 0) void ingest(files);
		return () => {
			cancelled = true;
		};
	}, []);
	async function onFile(file) {
		if (!file || busy) return;
		setBusy(`${file.name} 여는 중`);
		setError("");
		await new Promise((resolve) => setTimeout(resolve, 30));
		try {
			const buf = await file.arrayBuffer();
			const master = looksLikeMaster(file.name, buf) ? await readLocMaster(buf, "1센터", file.name) : null;
			if (master) {
				setMasters((prev) => ({
					...prev,
					...master.places
				}));
				setStoreCodes((prev) => ({
					...prev,
					...master.codes
				}));
				setBusy("");
				setError("");
				return;
			}
			const parsed = await readCenters(buf, "1센터", setBusy);
			const next = { ...jobs };
			for (const id of centerList()) if (parsed.centers[id]) next[id] = parsed.centers[id];
			setJobs(next);
			setBusy("");
		} catch (err) {
			setBusy("");
			setError(err instanceof Error ? err.message : "파일을 읽지 못했습니다.");
		}
	}
	function saveBand(role, master) {
		const band = role === "2센터FF1" ? "FF1" : role === "2센터FF2" ? "FF2" : "";
		if (!band) return false;
		const places = master.places["2센터"] ?? {};
		const codes = master.codes["2센터"] ?? {};
		setBandMasters((prev) => ({
			...prev,
			"2센터": { ...prev["2센터"], [band]: { places, codes } }
		}));
		if (band === "FF1") {
			setMasters((prev) => ({ ...prev, "2센터": places }));
			setStoreCodes((prev) => ({ ...prev, "2센터": codes }));
		}
		return true;
	}
	async function onMasters(list) {
		const files = [...list];
		if (files.length === 0 || busy) return;
		setError("");
		const missed = [];
		for (const item of files) {
			const file = item.file ?? item;
			const role = item.role ?? "";
			const id = role.startsWith("2센터") ? "2센터" : /^[1-9]센터$/.test(role) ? role : "";
			setBusy(`${file.name} 배치 읽는 중`);
			await new Promise((resolve) => setTimeout(resolve, 30));
			try {
				const master = await readLocMaster(await file.arrayBuffer(), id || "1센터", id ? `${id}.xls` : file.name, id || void 0);
				if (!master) {
					missed.push(file.name);
					continue;
				}
				if (saveBand(role, master)) continue;
				setMasters((prev) => ({
					...prev,
					...master.places
				}));
				setStoreCodes((prev) => ({
					...prev,
					...master.codes
				}));
			} catch (err) {
				missed.push(err instanceof Error ? `${file.name}: ${err.message}` : file.name);
			}
		}
		setBusy("");
		if (missed.length > 0) setError(`배치표로 읽지 못했습니다. 로케이션코드·점포명 열이 있는 파일인지 확인해 주세요. ${missed.join(", ")}`);
	}
	async function openWebWork() {
		const job = webFiles[0];
		const roles = workSlots(site).slice(1);
		const picked = webFiles.slice(1).map((file, index) => file ? { file, role: roles[index]?.role || "" } : null).filter(Boolean);
		if (!job && picked.length === 0) {
			setError("작업 엑셀이나 배치표를 먼저 찾아 주세요.");
			return;
		}
		if (job) await onFile(job);
		if (picked.length > 0) await onMasters(picked);
		setFileSheet("");
	}
	function rememberTab(id) {
		if (!SUB_LABELS.has(id)) return;
		setOpenTabs((prev) => {
			if (prev.includes(id)) return prev;
			const next = [...prev, id];
			return next.length > 5 ? next.slice(-5) : next;
		});
	}
	function pickTab(id) {
		setTab(id);
		setMenuOpen(false);
		rememberTab(id);
	}
	function closeOpenTab(id) {
		setOpenTabs((prev) => {
			const rest = prev.filter((item) => item !== id);
			setTab((cur) => cur === id ? rest[rest.length - 1] || "summary" : cur);
			return rest;
		});
	}
	function locReady(id) {
		if (site === "포천" && id === "2센터") {
			const bands = bandMasters["2센터"] ?? {};
			return Object.keys(bands.FF1?.places ?? {}).length > 0 && Object.keys(bands.FF2?.places ?? {}).length > 0;
		}
		return Object.keys(masters[id] ?? {}).length > 0;
	}
	function menuItem(id, label, Icon, child) {
		const on = tab === id;
		return /* @__PURE__ */ jsxs("button", {
			type: "button",
			"aria-current": on ? "page" : void 0,
			onClick: () => pickTab(id),
			className: "flex w-full shrink-0 items-center gap-3 rounded-xl text-left font-medium " + (child ? "h-10 pl-9 pr-3 text-[14px] " : "h-11 px-3 text-[15px] ") + (on ? "bg-[#007aff] text-white" : "bg-transparent text-black"),
			children: [/* @__PURE__ */ jsx(Icon, {
				size: child ? 18 : 20,
				strokeWidth: 2,
				"aria-hidden": true
			}), label]
		}, id);
	}
	function menuGroup(key, label, Icon, items) {
		const open = openMenu[key];
		const active = items.some(([id]) => id === tab);
		return /* @__PURE__ */ jsxs("div", {
			className: "shrink-0",
			children: [/* @__PURE__ */ jsxs("button", {
				type: "button",
				"aria-expanded": open,
				onClick: () => setOpenMenu((prev) => ({ ...prev, [key]: !prev[key] })),
				className: "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-medium " + (active && !open ? "bg-[#e8f1ff] text-[#007aff]" : "text-black"),
				children: [/* @__PURE__ */ jsx(Icon, {
					size: 20,
					strokeWidth: 2,
					"aria-hidden": true
				}), /* @__PURE__ */ jsx("span", {
					className: "min-w-0 flex-1",
					children: label
				}), /* @__PURE__ */ jsx(ChevronDown, {
					size: 16,
					strokeWidth: 2,
					className: "shrink-0 text-[#8e8e93] transition-transform " + (open ? "rotate-180" : ""),
					"aria-hidden": true
				})]
			}), open ? /* @__PURE__ */ jsx("div", {
				className: "mt-1 flex flex-col gap-1",
				children: items.map(([id, name, ItemIcon]) => menuItem(id, name, ItemIcon, true))
			}) : null]
		}, key);
	}
	const sheetMenu = /* @__PURE__ */ jsxs("nav", {
		className: "flex h-full w-64 shrink-0 flex-col overflow-hidden bg-white p-3",
		"aria-label": "메뉴",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mb-1 flex h-11 shrink-0 items-center justify-between pl-3",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex min-w-0 items-center gap-2",
				children: [/* @__PURE__ */ jsx("span", {
					className: "shrink-0 text-xs text-[#8e8e93]",
					children: "메뉴"
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "inline-flex h-7 shrink-0 items-center rounded-full border border-black/10 px-2.5 text-[11px] font-medium text-[#8e8e93]",
					onClick: () => {
						setMenuOpen(false);
						setManualOpen(true);
					},
					children: "메뉴얼"
				})]
			}), /* @__PURE__ */ jsx("button", {
				type: "button",
				"aria-label": "메뉴 접기",
				className: "inline-flex h-11 w-11 items-center justify-center text-[#007aff]",
				onClick: () => setMenuOpen(false),
				children: /* @__PURE__ */ jsx(PanelLeftClose, {
					size: 22,
					strokeWidth: 2,
					"aria-hidden": true
				})
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto",
			children: [
				menuItem("summary", "요약", LayoutDashboard, false),
				menuGroup("work", "작업 확인", ListChecks, WORK_ITEMS),
				menuItem("location", "로케이션", MapPin, false),
				menuItem("oshipcheck", "오출 확인", TriangleAlert, false),
				menuGroup("data", "데이터분석", PieChart, DATA_ITEMS)
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "mt-auto flex shrink-0 items-center gap-1.5 pt-2",
			children: [/* @__PURE__ */ jsx("span", {
				className: "flex h-7 min-w-0 flex-1 items-center justify-center truncate rounded-full border border-black/10 px-2 text-[11px] font-medium tabular-nums text-[#8e8e93]",
				title: "Build : " + BUILD_LABEL,
				children: "Build : " + BUILD_LABEL
			}), company ? null : /* @__PURE__ */ jsx("a", {
				href: "/company-pc.zip",
				download: "회사PC용.zip",
				className: "inline-flex h-7 shrink-0 items-center rounded-full bg-yellow px-2 text-[11px] font-semibold text-title",
				title: "회사 컴퓨터용. 브라우저 업로드는 Privacy-i가 막습니다.",
				children: "생산성 EXE"
			}), /* @__PURE__ */ jsx("button", {
				type: "button",
				"aria-label": "제어판",
				className: "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8e8e93]",
				onClick: () => {
					setMenuOpen(false);
					setControlOpen(true);
				},
				children: /* @__PURE__ */ jsx(Settings, {
					size: 20,
					strokeWidth: 2,
					"aria-hidden": true
				})
			})]
		})]
	});
	const menuOverlay = menuOpen && !wide && typeof document !== "undefined" ? createPortal(/* @__PURE__ */ jsxs(Fragment, {
		children: [/* @__PURE__ */ jsx("button", {
			type: "button",
			"aria-label": "메뉴 닫기",
			className: "fixed inset-0 z-30 bg-black/40",
			onClick: () => setMenuOpen(false)
		}), /* @__PURE__ */ jsx("div", {
			className: "fixed inset-y-0 left-0 z-40 h-full",
			children: sheetMenu
		})]
	}), document.body) : null;
	return /* @__PURE__ */ jsxs("main", {
		className: "mx-auto flex h-screen w-full max-w-none flex-col overflow-hidden px-3 py-2 sm:px-5",
		children: [menuOverlay, manualOpen ? /* @__PURE__ */ jsx(ManualViewer, { onClose: () => setManualOpen(false) }) : null, controlOpen ? /* @__PURE__ */ jsx(ControlPanel, { onClose: () => setControlOpen(false) }) : null, /* @__PURE__ */ jsx("section", {
			ref: headRef,
			className: "relative z-20 shrink-0 rounded-2xl border border-black/5 bg-paper/90 px-3 py-1.5 shadow-sm backdrop-blur-md " + (dragOver ? "border-title" : "border-grid"),
			onDragOver: (event) => {
				event.preventDefault();
				setDragOver(true);
			},
			onDragLeave: () => setDragOver(false),
			onDrop: (event) => {
				event.preventDefault();
				setDragOver(false);
				const files = [...event.dataTransfer.files ?? []];
				if (files.length === 0) return;
				if (files.every((file) => {
					const base = file.name.replace(/\.[^.]+$/, "");
					return /[-_\s][1-9]$/.test(base) || /[1-9]\s*센터|배치|로케이션|점포/.test(base);
				})) onMasters(files);
				else onFile(files[0]);
			},
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-x-2 gap-y-1",
				children: [
					/* @__PURE__ */ jsx("button", {
						type: "button",
						"aria-label": menuOpen ? "메뉴 접기" : "메뉴 열기",
						"aria-expanded": menuOpen,
						className: "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-black",
						onClick: () => {
							setFileSheet("");
							setMenuOpen((open) => !open);
						},
						children: /* @__PURE__ */ jsx(PanelLeft, {
							size: 22,
							strokeWidth: 2,
							"aria-hidden": true
						})
					}),
					/* @__PURE__ */ jsx(PickMenu, {
						label: "",
						value: site,
						soft: true,
						compact: true,
						float: true,
						onChange: (id) => chooseSite(id),
						options: siteDefs().map((item) => ({ id: item.name, label: item.name }))
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "shrink-0 text-[15px] font-semibold tracking-tight text-ink",
						children: "센터 생산성"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center gap-1 rounded-full bg-[#f2f2f7] p-0.5",
						children: [/* @__PURE__ */ jsx("button", {
							type: "button",
							"data-file-sheet": "",
							className: "inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold " + (fileSheet === "work" ? "bg-[#1c1c1e] text-white" : "bg-title text-on-dark"),
							title: workSlots(site).some((slot) => slot.role === "2센터FF2") ? "오늘 작업 엑셀과 1센터, 2센터 FF2·FF1 배치표를 올립니다." : "오늘 작업 엑셀과 센터 배치표를 올립니다.",
							onClick: () => setFileSheet((cur) => cur === "work" ? "" : "work"),
							children: "작업 파일"
						}), company ? /* @__PURE__ */ jsx("button", {
							type: "button",
							"data-file-sheet": "",
							className: "inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold text-white " + (fileSheet === "merge" ? "bg-[#005ecb]" : "bg-[#007aff]"),
							title: "센터별 원본으로 업로드용 엑셀을 만듭니다.",
							onClick: () => setFileSheet((cur) => cur === "merge" ? "" : "merge"),
							children: "파일 합치기"
						}) : null, loaded.length > 0 || centerList().some((id) => masters[id]) || Object.keys(bandMasters["2센터"]?.FF2?.places ?? {}).length > 0 ? /* @__PURE__ */ jsx("button", {
							type: "button",
							className: "inline-flex h-7 items-center rounded-full bg-paper px-3 text-xs font-semibold text-muted",
							onClick: () => {
								setJobs({});
								setMasters({});
								setStoreCodes({});
								setBandMasters({});
								setError("");
								setWebFiles(BLANK_FILES());
								setSlotNames({ work: BLANK_NAMES(), merge: BLANK_NAMES() });
							},
							children: "지우기"
						}) : null]
					}),
					openTabs.length > 0 ? /* @__PURE__ */ jsx("div", {
						className: "chrome-tabs",
						role: "tablist",
						"aria-label": "열어 둔 화면",
						children: openTabs.map((id) => {
							const on = tab === id;
							return /* @__PURE__ */ jsxs("div", {
								className: "chrome-tab" + (on ? " on" : ""),
								role: "tab",
								"aria-selected": on,
								children: [/* @__PURE__ */ jsx("button", {
									type: "button",
									className: "chrome-tab-label",
									onClick: () => pickTab(id),
									children: SUB_LABELS.get(id)
								}), /* @__PURE__ */ jsx("button", {
									type: "button",
									className: "chrome-tab-x",
									"aria-label": `${SUB_LABELS.get(id)} 탭 닫기`,
									onClick: () => closeOpenTab(id),
									children: /* @__PURE__ */ jsx(X, {
										size: 12,
										strokeWidth: 2.4,
										"aria-hidden": true
									})
								})]
							}, id);
						})
					}) : null,
					/* @__PURE__ */ jsxs("div", {
						className: "ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2",
						children: [
							busy ? /* @__PURE__ */ jsx("span", {
								className: "text-[11px] font-semibold text-title",
								children: busy
							}) : null,
							error ? /* @__PURE__ */ jsx("span", {
								className: "max-w-md truncate text-[11px] font-medium text-line-1",
								title: error,
								children: error
							}) : null,
							/* @__PURE__ */ jsx("div", {
								className: "flex items-stretch overflow-hidden rounded-2xl bg-white shadow-sm",
								"aria-label": "올린 파일 확인",
								children: centerList().map((id) => /* @__PURE__ */ jsxs("div", {
									className: "border-l border-black/5 px-2.5 py-1 text-center first:border-l-0",
									children: [/* @__PURE__ */ jsx("p", {
										className: "text-[11px] font-semibold text-[#1c1c1e]",
										children: id
									}), [["작업", loaded.includes(id)], ["로케이션", locReady(id)]].map(([label, on]) => /* @__PURE__ */ jsxs("p", {
										className: "mt-0.5 flex items-center justify-center gap-1 text-[11px] text-[#3a3a3c]",
										children: [/* @__PURE__ */ jsx("span", {
											className: "inline-flex h-4 w-4 items-center justify-center rounded-[5px] " + (on ? "bg-[#007aff] text-white" : "bg-white shadow-[inset_0_0_0_1.5px_rgba(60,60,67,0.3)]"),
											"aria-label": `${id} ${label} ${on ? "있음" : "없음"}`,
											children: on ? /* @__PURE__ */ jsx(Check, {
												size: 12,
												strokeWidth: 3,
												"aria-hidden": true
											}) : null
										}), label]
									}, label))]
								}, id))
							})
						]
					})
				]
			}),
			fileSheet === "work" || fileSheet === "merge" ? createPortal(/* @__PURE__ */ jsxs("div", {
				"data-file-sheet": "",
				className: "fixed z-[80] w-[546px] max-w-[calc(100vw-24px)] rounded-2xl bg-[#f2f2f7] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.18)]",
				style: { top: sheetPos.top, left: sheetPos.left },
				children: [/* @__PURE__ */ jsx("p", {
					className: "px-1 pb-2 text-[13px] leading-5 text-[#8e8e93]",
					children: fileSheet === "work" ? (workSlots(site).some((slot) => slot.role === "2센터FF2") ? "1번은 업로드용 작업 엑셀. 2센터는 FF2와 FF1 배치표를 각각 올립니다." : "1번은 업로드용 작업 엑셀. 나머지는 센터 배치표입니다.") : "폴더가 달라도 센터마다 찾기를 누르세요. OrderDetail 시트를 한 엑셀로 합칩니다."
				}), (fileSheet === "work" ? workSlots(site) : mergeSlots(site)).map((slot, index) => {
					const name = slotNames[fileSheet][index];
					return /* @__PURE__ */ jsxs("div", {
						className: "mb-2 flex items-center gap-3 rounded-2xl bg-white px-4 py-3",
						children: [/* @__PURE__ */ jsx("span", {
							className: "w-[168px] shrink-0 whitespace-nowrap text-[15px] font-semibold text-[#1c1c1e]",
							children: slot.label
						}), /* @__PURE__ */ jsx("span", {
							className: "min-w-0 flex-1 truncate text-[14px] " + (name ? "text-[#1c1c1e]" : "text-[#8e8e93]"),
							children: name || "아직 없음"
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							className: "inline-flex h-9 shrink-0 items-center rounded-full bg-[#f2f2f7] px-4 text-[14px] font-semibold text-[#1c1c1e]",
							onClick: () => {
								if (company || fileSheet === "merge") {
									window.chrome?.webview?.postMessage(fileSheet === "work" ? `pick-work-${index}|${slot.role}` : `pick-merge-${index}|${slot.role}`);
									return;
								}
								document.getElementById(`web-file-${index}`)?.click();
							},
							children: "찾기"
						}), !company && fileSheet === "work" ? /* @__PURE__ */ jsx("input", {
							id: `web-file-${index}`,
							type: "file",
							accept: ".xlsx,.xls,.xlsm",
							className: "sr-only",
							onChange: (event) => {
								const file = event.target.files?.[0];
								event.target.value = "";
								if (!file) return;
								setWebFiles((prev) => {
									const next = prev.slice();
									next[index] = file;
									return next;
								});
								setSlotNames((prev) => {
									const next = prev.work.slice();
									next[index] = file.name;
									return { ...prev, work: next };
								});
							}
						}) : null]
					}, slot.role);
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "mt-1 flex h-11 w-full items-center justify-center rounded-xl bg-[#007aff] text-[16px] font-semibold text-white",
					onClick: () => {
						if (company || fileSheet === "merge") {
							window.chrome?.webview?.postMessage(fileSheet === "work" ? "open-work" : "make-merge");
							return;
						}
						void openWebWork();
					},
					children: fileSheet === "work" ? "열기" : "업로드용 엑셀 만들기"
				}), fileSheet === "merge" ? /* @__PURE__ */ jsx("p", {
					className: "px-1 pt-2 text-[13px] text-[#8e8e93]",
					children: "없는 센터는 비워 두면 그 시트는 만들지 않습니다."
				}) : null]
			}), document.body) : null]
		}), /* @__PURE__ */ jsxs("section", {
			key: site + "-" + siteRev,
			className: "mt-2 flex min-h-0 flex-1 gap-2 overflow-hidden",
			children: [wide && menuOpen ? sheetMenu : null, /* @__PURE__ */ jsxs("div", {
				className: "relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl border border-black/5 bg-paper shadow-sm",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: tab === "summary" ? "absolute inset-0 flex overflow-hidden bg-[#f2f2f7]" : "hidden",
						children: /* @__PURE__ */ jsxs(PaceProvider, {
							jobs,
							children: wide ? [
								/* @__PURE__ */ jsxs("div", {
									className: "flex min-h-0 min-w-0 flex-col",
									style: { flex: `${colPct} 1 0` },
									children: [
										/* @__PURE__ */ jsx("div", {
											className: "min-h-0 overflow-hidden",
											style: { flex: `${rowLeft} 1 0` },
											children: /* @__PURE__ */ jsx(Summary, {
												jobs,
												loaded: loaded.length > 0
											})
										}),
										/* @__PURE__ */ jsx(PaneSplit, {
											axis: "y",
											onDrag: (pct) => setRowLeft(pct)
										}),
										/* @__PURE__ */ jsx("div", {
											className: "min-h-0 overflow-hidden bg-[#f2f2f7]",
											style: { flex: `${100 - rowLeft} 1 0` },
											children: /* @__PURE__ */ jsxs("div", {
												className: "flex h-full min-h-0 items-center justify-center gap-2 overflow-auto",
												children: [/* @__PURE__ */ jsx(PaceBoard, {}), /* @__PURE__ */ jsx(LineBoard, {})]
											})
										})
									]
								}),
								/* @__PURE__ */ jsx(PaneSplit, {
									axis: "x",
									onDrag: (pct) => setColPct(pct)
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex min-h-0 min-w-0 flex-col",
									style: { flex: `${100 - colPct} 1 0` },
									children: [
										/* @__PURE__ */ jsx("div", {
											className: "min-h-0 overflow-hidden",
											style: { flex: `${rowRight} 1 0` },
											children: /* @__PURE__ */ jsx(Compare, {
												jobs,
												loaded: loaded.length > 0
											})
										}),
										/* @__PURE__ */ jsx(PaneSplit, {
											axis: "y",
											onDrag: (pct) => setRowRight(pct)
										}),
										/* @__PURE__ */ jsx("div", {
											className: "min-h-0 overflow-hidden bg-[#f2f2f7]",
											style: { flex: `${100 - rowRight} 1 0` },
											children: null
										})
									]
								})
							] : [/* @__PURE__ */ jsxs("div", {
								className: "summary-phone flex h-full min-h-0 w-full flex-col",
								children: [
									/* @__PURE__ */ jsx("div", {
										className: "grid shrink-0 grid-cols-3 gap-1 px-2 pt-2",
										children: [
											["lines", "라인별 생산성"],
											["compare", "센터비교"],
											["pace", "예상 작업 종료시간"]
										].map(([id, label]) => /* @__PURE__ */ jsx("button", {
											type: "button",
											className: "h-10 rounded-full px-1 text-[12px] font-semibold leading-tight " + (summaryPane === id ? "bg-[#007aff] text-white" : "bg-white text-[#1c1c1e] shadow-sm"),
											onClick: () => setSummaryPane(id),
											children: label
										}, id))
									}),
									/* @__PURE__ */ jsx("div", {
										className: summaryPane === "lines" ? "min-h-0 flex-1 overflow-hidden" : "hidden",
										children: /* @__PURE__ */ jsx(Summary, {
											jobs,
											loaded: loaded.length > 0
										})
									}),
									/* @__PURE__ */ jsx("div", {
										className: summaryPane === "compare" ? "min-h-0 flex-1 overflow-hidden" : "hidden",
										children: /* @__PURE__ */ jsx(Compare, {
											jobs,
											loaded: loaded.length > 0
										})
									}),
									/* @__PURE__ */ jsx("div", {
										className: summaryPane === "pace" ? "min-h-0 flex-1 overflow-auto" : "hidden",
										children: /* @__PURE__ */ jsxs("div", {
											className: "flex min-h-full flex-col items-stretch",
											children: [/* @__PURE__ */ jsx(PaceBoard, {}), /* @__PURE__ */ jsx(LineBoard, {})]
										})
									})
								]
							})]
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: tab === "time" ? "phone-compact absolute inset-0 overflow-auto" : "hidden",
						children: /* @__PURE__ */ jsx(TimeView, {
							jobs,
							loaded: loaded.length > 0
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: tab === "route" ? "phone-compact absolute inset-0 overflow-auto" : "hidden",
						children: /* @__PURE__ */ jsx(RouteView, {
							jobs,
							loaded: loaded.length > 0
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: tab === "oship" ? "phone-compact absolute inset-0 overflow-hidden" : "hidden",
						children: /* @__PURE__ */ jsx(OshipView, {
							masters,
							storeCodes,
							bandMasters,
							jobs,
							open: tab === "oship"
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: tab === "store" ? "phone-compact absolute inset-0 overflow-auto" : "hidden",
						children: /* @__PURE__ */ jsx(StoreView, {
							jobs,
							loaded: loaded.length > 0
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: tab === "goods" ? "phone-compact absolute inset-0 overflow-auto" : "hidden",
						children: /* @__PURE__ */ jsx(GoodsView, {
							jobs,
							loaded: loaded.length > 0
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: tab === "worked" ? "phone-compact absolute inset-0 overflow-auto" : "hidden",
						children: /* @__PURE__ */ jsx(WorkedView, {
							jobs,
							loaded: loaded.length > 0
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: tab === "ledger" ? "phone-compact absolute inset-0 overflow-auto" : "hidden",
						children: /* @__PURE__ */ jsx(LedgerView, { open: tab === "ledger" })
					}),
					/* @__PURE__ */ jsx("div", {
						className: tab === "location" ? "phone-compact absolute inset-0 overflow-hidden" : "hidden",
						children: /* @__PURE__ */ jsx(LocationView, {
							jobs,
							loaded: loaded.length > 0,
							masters,
							storeCodes,
							bandMasters
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: tab === "oshipcheck" ? "phone-compact absolute inset-0 overflow-hidden" : "hidden",
						children: /* @__PURE__ */ jsx(OshipCheckView, {})
					}),
					/* @__PURE__ */ jsx("div", {
						className: tab === "archive" ? "phone-compact absolute inset-0 overflow-auto" : "hidden",
						children: /* @__PURE__ */ jsx(ArchiveView, { seed: archiveSeed, active: tab === "archive" })
					}),
					/* @__PURE__ */ jsx("div", {
						className: tab === "stock" ? "phone-compact absolute inset-0 bg-white" : "hidden",
						children: /* @__PURE__ */ jsx(StockView, { open: tab === "stock" })
					})
				]
			})]
		})]
	});
}
function jobsOf(all, center, dpt) {
	const list = all[center] ?? [];
	return dpt === "전체" ? list : list.filter((job) => matchDpt(job.route, dpt));
}
function jobsForDpt(all, dpt) {
	if (dpt === "전체") return all;
	const next = {};
	for (const id of centerList()) {
		const list = all[id];
		if (list) next[id] = list.filter((job) => matchDpt(job.route, dpt));
	}
	return next;
}
function DptSelect({ value, onChange, compact = false, soft = false, up = false }) {
	return /* @__PURE__ */ jsx(PickMenu, {
		label: "DPT",
		value,
		onChange,
		compact,
		soft,
		up,
		options: DPTS.map((item) => ({ id: item.id, label: item.label }))
	});
}
function emptyDpt(dpt) {
	return dpt === "전체" ? "이 센터 파일은 아직 없습니다." : "이 DPT에 해당하는 루트가 없습니다.";
}
function CenterSelect({ value, onChange, compact = false }) {
	return /* @__PURE__ */ jsx(PickMenu, {
		label: "센터",
		value,
		onChange,
		compact,
		options: centerList().map((id) => ({ id, label: id }))
	});
}
function heatColor(count, min, max) {
	if (max <= min) return "rgb(255, 235, 132)";
	const t = Math.min(1, Math.max(0, (count - min) / (max - min)));
	const mix = (from, to, amount) => from.map((value, index) => Math.round(value + (to[index] - value) * amount));
	const green = [
		99,
		190,
		123
	];
	const yellow = [
		255,
		235,
		132
	];
	const rgb = t < .5 ? mix(green, yellow, t * 2) : mix(yellow, [
		248,
		105,
		107
	], (t - .5) * 2);
	return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}
function shortStoreName(name) {
	const raw = String(name ?? "").trim();
	if (raw.length < 9) return raw;
	const cut = raw.replace(/^GS25\s*/i, "").replace(/점$/, "");
	return cut || raw;
}
function routeTone(route) {
	const n = Number(route.split(" ")[0]);
	return `hsl(${(Number.isFinite(n) ? n * 137.508 % 360 : 210).toFixed(1)} 46% 90%)`;
}
function routeRgb(route) {
	const n = Number(String(route ?? "").split(" ")[0]);
	const h = Number((Number.isFinite(n) ? n * 137.508 % 360 : 210).toFixed(1)) / 360;
	const s = 0.46;
	const l = 0.9;
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	const ch = (t) => {
		const u = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
		const v = u < 1 / 6 ? p + (q - p) * 6 * u : u < 1 / 2 ? q : u < 2 / 3 ? p + (q - p) * (2 / 3 - u) * 6 : p;
		return Math.round(v * 255).toString(16).padStart(2, "0").toUpperCase();
	};
	return `${ch(h + 1 / 3)}${ch(h)}${ch(h - 1 / 3)}`;
}
function RouteEntry({ value, onChange }) {
	return /* @__PURE__ */ jsx("input", {
		value,
		placeholder: "··",
		"aria-label": "루트 입력",
		inputMode: "numeric",
		maxLength: 4,
		className: "m-0 box-content w-auto shrink-0 select-text border-0 bg-transparent p-0 font-[inherit] text-[length:inherit] leading-none font-bold tabular-nums text-ink outline-none placeholder:text-muted/60 " + (value ? "text-left" : "text-center shadow-[inset_0_-1px_0_rgba(93,109,126,0.55)]"),
		style: value ? {
			width: `${value.length}ch`,
			minWidth: `${value.length}ch`
		} : {
			width: "2.6rem",
			minWidth: "2.6rem"
		},
		title: "루트가 없는 점포입니다. 140처럼 적으면 40으로 표시됩니다.",
		onPointerDown: (event) => {
			event.stopPropagation();
			if (event.currentTarget.parentElement) event.currentTarget.parentElement.draggable = false;
		},
		onClick: (event) => event.stopPropagation(),
		onKeyDown: (event) => event.stopPropagation(),
		onChange: (event) => onChange(event.target.value, false),
		onBlur: (event) => {
			if (event.currentTarget.parentElement) event.currentTarget.parentElement.draggable = true;
			onChange(event.target.value, true);
		}
	});
}
function LocationCell({ slot, hit, home, side, big, min, max, unit, routeDraft, onRoute, selected, onToggle, onPlace, onClear, skipClick }) {
	const [hot, setHot] = useState(false);
	const dragged = useRef(false);
	const dropped = useRef(false);
	const box = "grid items-stretch gap-1 overflow-hidden rounded-sm border px-1 " + (big ? "h-11 text-xs" : "h-9 text-[10px]");
	const cols = side === "left" ? " grid-cols-[36px_minmax(0,1fr)_56px]" : " grid-cols-[56px_minmax(0,1fr)_36px]";
	if (slot.kind === "blank") return /* @__PURE__ */ jsx("div", { className: box + " border-transparent bg-transparent" });
	if (slot.kind === "pillar") {
		const box = pillarBox(slot.span || 1, big);
		return /* @__PURE__ */ jsx("div", {
			className: "loc-pillar grid items-center justify-center overflow-hidden rounded-sm font-bold tracking-widest text-on-dark " + (big ? "text-xs" : "text-[10px]") + box.className,
			style: box.style,
			children: "기둥"
		});
	}
	const tone = hit?.route ? routeTone(hit.route) : void 0;
	const fill = tone ? { background: tone } : void 0;
	const code = /* @__PURE__ */ jsx("span", {
		className: "flex items-center justify-center truncate text-center font-bold tabular-nums text-ink",
		children: slot.code
	});
	const storeName = /* @__PURE__ */ jsx("span", {
		className: "min-w-0 shrink overflow-hidden whitespace-nowrap",
		title: hit?.store || void 0,
		children: shortStoreName(hit?.store)
	});
	const store = /* @__PURE__ */ jsxs("span", {
		draggable: Boolean(home),
		"data-store": home || void 0,
		onPointerDown: (event) => {
			if (!home) return;
			event.currentTarget.draggable = !event.shiftKey;
		},
		onDragStart: (event) => {
			if (!home || event.shiftKey || event.target.closest("input")) {
				event.preventDefault();
				return;
			}
			dragged.current = true;
			event.stopPropagation();
			event.dataTransfer.setData("text/plain", home);
			event.dataTransfer.effectAllowed = "move";
		},
		onClick: (event) => {
			if (!home || skipClick.current || event.target.closest("input")) return;
			if (dragged.current) {
				dragged.current = false;
				return;
			}
			onToggle(home, event.shiftKey);
		},
		className: "flex h-full min-w-0 max-w-full items-center gap-1.5 overflow-hidden whitespace-nowrap rounded px-1 font-bold text-ink " + (home ? "cursor-pointer " : "") + (big ? "text-[13px]" : "text-[12px]"),
		style: fill,
		title: home ? "점포를 클릭한 뒤 Shift를 누른 채 다른 점포를 클릭하면 그 사이가 선택됩니다." : void 0,
		children: [
			side === "right" ? storeName : null,
			onRoute ? /* @__PURE__ */ jsx(RouteEntry, {
				value: routeDraft ?? "",
				onChange: onRoute
			}) : hit?.route ? /* @__PURE__ */ jsx("span", {
				className: "shrink-0 font-bold tabular-nums leading-none",
				children: hit.route
			}) : null,
			side === "left" ? storeName : null
		]
	});
	const count = hit ? /* @__PURE__ */ jsx("span", {
		className: "flex h-full items-center justify-center rounded-sm text-center font-bold tabular-nums " + (hit.count > 0 ? "text-ink" : "text-muted"),
		style: { background: hit.count > 0 ? heatColor(hit.count, min, max) : "#eef3f6" },
		children: num(hit.count)
	}) : /* @__PURE__ */ jsx("span", {});
	return /* @__PURE__ */ jsx("div", {
		"data-cell": slot.code,
		"data-home": home || void 0,
		draggable: home ? void 0 : true,
		className: box + cols + " min-w-0 max-w-full " + (hit ? " border-grid bg-paper" : " border-[#e4ebf0] bg-[#f7fafc]") + (selected ? " ring-2 ring-mark" : "") + (hot ? " ring-2 ring-title" : "") + (!home ? " cursor-pointer" : ""),
		title: hit ? `${slot.code} 루트 ${hit.route} ${hit.store} ${unit} ${nf.format(hit.count)}` : `${slot.code} 빈칸. 클릭하면 선택되고, Shift로 범위를 잡습니다.`,
		onPointerDown: (event) => {
			if (home) return;
			event.currentTarget.draggable = !event.shiftKey;
		},
		onDragStart: (event) => {
			if (event.target !== event.currentTarget) return;
			if (home || event.shiftKey) {
				event.preventDefault();
				return;
			}
			dragged.current = true;
			event.dataTransfer.setData("text/plain", `cell:${slot.code}`);
			event.dataTransfer.effectAllowed = "move";
		},
		onDragOver: (event) => {
			event.preventDefault();
			setHot(true);
		},
		onDragLeave: () => setHot(false),
		onDrop: (event) => {
			event.preventDefault();
			setHot(false);
			dropped.current = true;
			const id = event.dataTransfer.getData("text/plain");
			if (id) onPlace(id, slot.code);
		},
		onClick: (event) => {
			if (home || skipClick.current) return;
			if (dragged.current) {
				dragged.current = false;
				return;
			}
			if (dropped.current) {
				dropped.current = false;
				return;
			}
			onToggle(`cell:${slot.code}`, event.shiftKey);
		},
		children: side === "left" ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
			code,
			store,
			count
		] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
			count,
			store,
			code
		] })
	});
}
var LINE_TONE = [
	"bg-line-1",
	"bg-line-2",
	"bg-line-3",
	"bg-line-4",
	"bg-line-5",
	"bg-line-6",
	"bg-line-7",
	"bg-line-8",
	"bg-line-1",
	"bg-line-5",
	"bg-line-3",
	"bg-line-2"
];
function lineChoices(centers) {
	const count = centers.length ? Math.max(...centers.map((id) => lineCountOf(id))) : 8;
	const n = Math.max(1, Math.min(12, count || 8));
	return Array.from({ length: n }, (_, index) => index + 1);
}
function layoutSpots(layout) {
	const at = /* @__PURE__ */ new Map();
	const cell = /* @__PURE__ */ new Map();
	layout.forEach((line, lineIndex) => {
		["left", "right"].forEach((side, sideIndex) => {
			const x = lineIndex * 2 + sideIndex;
			line[side].forEach((slot, y) => {
				if (slot.kind !== "loc") return;
				at.set(slot.code, {
					x,
					y
				});
				cell.set(`${x},${y}`, slot.code);
			});
		});
	});
	return {
		at,
		cell
	};
}
function sameMoves(a, b) {
	const keys = /* @__PURE__ */ new Set([...Object.keys(a), ...Object.keys(b)]);
	for (const key of keys) if ((a[key] ?? "") !== (b[key] ?? "")) return false;
	return true;
}
function isCellPick(id) {
	return id.startsWith("cell:");
}
function pickPos(id, cur) {
	if (isCellPick(id)) return cur[id] ?? id.slice(5);
	return cur[id] ?? id;
}
function shiftedMoves(homes, cur, storeId, target, picked, spots) {
	const pos = (id) => pickPos(id, cur);
	if (!pos(storeId)) return null;
	let dragId = storeId;
	if (isCellPick(storeId) && !picked.has(storeId)) {
		const code = storeId.slice(5);
		for (const id of picked) if (isCellPick(id) && pos(id) === code) {
			dragId = id;
			break;
		}
	}
	const selected = picked.has(dragId) ? [...picked] : [dragId];
	const anchorId = pos(dragId);
	const next = { ...cur };
	if (target === "tray") {
		let changed = false;
		for (const id of selected) {
			if (pos(id) === "tray") continue;
			next[id] = "tray";
			changed = true;
		}
		return changed ? next : null;
	}
	const anchor = anchorId;
	if (anchor === "tray") {
		const pile = selected.filter((id) => pos(id) === "tray").sort();
		const start = spots.at.get(target);
		if (!start || pile.length === 0) return null;
		const dests = [];
		for (let y = start.y; dests.length < pile.length && y < start.y + 80; y++) {
			const code = spots.cell.get(`${start.x},${y}`);
			if (code) dests.push(code);
		}
		if (dests.length < pile.length) dests.length = 0;
		if (dests.length === 0) return null;
		const occ = /* @__PURE__ */ new Map();
		for (const id of homes) {
			const where = pos(id);
			if (where !== "tray") occ.set(where, id);
		}
		pile.forEach((id, index) => {
			const dest = dests[index];
			const occupant = occ.get(dest);
			if (occupant && occupant !== id && !pile.includes(occupant)) next[occupant] = "tray";
			if (dest === id) delete next[id];
			else next[id] = dest;
		});
		return sameMoves(cur, next) ? null : next;
	}
	const from = spots.at.get(anchor);
	const to = spots.at.get(target);
	if (!from || !to) return null;
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	if (dx === 0 && dy === 0) return null;
	const placed = selected.filter((id) => pos(id) !== "tray" && spots.at.has(pos(id))).map((id) => spots.at.get(pos(id))).filter((spot) => Boolean(spot));
	if (placed.length === 0 || !spots.at.has(anchor)) return null;
	const minX = Math.min(...placed.map((spot) => spot.x));
	const maxX = Math.max(...placed.map((spot) => spot.x));
	const minY = Math.min(...placed.map((spot) => spot.y));
	const maxY = Math.max(...placed.map((spot) => spot.y));
	const occ = /* @__PURE__ */ new Map();
	for (const id of homes) {
		const where = pos(id);
		if (where !== "tray") occ.set(where, id);
	}
	const cellMove = /* @__PURE__ */ new Map();
	for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) {
		const src = spots.cell.get(`${x},${y}`);
		const dst = spots.cell.get(`${x + dx},${y + dy}`);
		if (!src || !dst || src === dst) continue;
		cellMove.set(src, dst);
	}
	if (!cellMove.has(anchor)) return null;
	const planned = /* @__PURE__ */ new Map();
	for (const [src, dst] of cellMove) {
		const id = occ.get(src);
		if (id) planned.set(id, dst);
	}
	for (const id of selected) {
		const src = pos(id);
		const dst = cellMove.get(src);
		if (!dst || occ.get(src) === id) continue;
		if (occ.has(src)) continue;
		if (dst === id) delete next[id];
		else next[id] = dst;
	}
	const origins = new Set(cellMove.keys());
	const dests = new Set(cellMove.values());
	planned.forEach((dest, id) => {
		if (dest === id) delete next[id];
		else next[id] = dest;
	});
	const vacated = [...origins].filter((code) => !dests.has(code));
	const vacatedSet = new Set(vacated);
	const usedLanding = /* @__PURE__ */ new Set();
	for (const code of dests) {
		const id = occ.get(code);
		if (!id || planned.has(id)) continue;
		const spot = spots.at.get(code);
		if (!spot) continue;
		let x = spot.x;
		let y = spot.y;
		let landing = "";
		for (let guard = 0; guard < 80; guard++) {
			x -= dx;
			y -= dy;
			const cell = spots.cell.get(`${x},${y}`);
			if (!cell) break;
			const open = !usedLanding.has(cell) && (vacatedSet.has(cell) || !occ.has(cell));
			if (!dests.has(cell) && open) {
				landing = cell;
				break;
			}
		}
		if (!landing) landing = vacated.find((item) => !usedLanding.has(item)) ?? "";
		if (!landing) continue;
		usedLanding.add(landing);
		if (landing === id) delete next[id];
		else next[id] = landing;
	}
	return sameMoves(cur, next) ? null : next;
}
function LocColumns({ side, unit }) {
	return /* @__PURE__ */ jsx("div", {
		className: "grid items-center gap-1 rounded-sm bg-header px-1 py-1 text-[9px] font-bold text-on-dark " + (side === "left" ? "grid-cols-[36px_minmax(0,1fr)_56px]" : "grid-cols-[56px_minmax(0,1fr)_36px]"),
		children: (side === "left" ? [
			"로케이션",
			"점포명",
			unit
		] : [
			unit,
			"점포명",
			"로케이션"
		]).map((label, index) => /* @__PURE__ */ jsx("span", {
			className: "whitespace-nowrap text-center leading-none",
			children: label
		}, index))
	});
}
function LocationView({ jobs: all, loaded, masters, storeCodes, bandMasters }) {
	const [center, setCenter] = useState("1센터");
	const jobCenter = center.startsWith("2센터") ? "2센터" : center;
	const placeBand = center === "2센터FF1" ? "FF1" : center === "2센터FF2" ? "FF2" : "";
	const [dpt, setDpt] = useState("전체");
	const [route, setRoute] = useState("전체");
	const [measure, setMeasure] = useState("작업수량");
	const [routeEdits, setRouteEdits] = useState({});
	const [checkedByCenter, setCheckedByCenter] = useState({});
	const [histByCenter, setHistByCenter] = useState({});
	const [pickedByCenter, setPickedByCenter] = useState({});
	const [anchorByCenter, setAnchorByCenter] = useState({});
	const [trayHot, setTrayHot] = useState(false);
	const boardRef = useRef(null);
	const barRef = useRef(null);
	const yRef = useRef(null);
	const [boardScrollHeight, setBoardScrollHeight] = useState(0);
	const syncing = useRef(false);
	const areaRef = useRef(null);
	const bandOrigin = useRef(null);
	const bandBox = useRef(null);
	const skipClick = useRef(false);
	const pan = useRef(null);
	const [panning, setPanning] = useState(false);
	const [band, setBand] = useState(null);
	const [layoutRev, setLayoutRev] = useState(0);
	useEffect(() => subscribeLayouts(() => setLayoutRev((value) => value + 1)), []);
	const baseJobs = useMemo(() => jobsOf(all, jobCenter, dpt), [
		all,
		jobCenter,
		dpt
	]);
	const routeOptions = useMemo(() => {
		const found = /* @__PURE__ */ new Set();
		for (const job of baseJobs) {
			const bucket = routeBucket(job.route);
			if (bucket) found.add(bucket);
		}
		for (const value of Object.values(routeEdits[center] ?? {})) {
			const bucket = routeBucket(value.replace(/\D/g, ""));
			if (bucket) found.add(bucket);
		}
		return [...found].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b, "ko"));
	}, [
		baseJobs,
		routeEdits,
		center
	]);
	const jobs = useMemo(() => route === "전체" ? baseJobs : baseJobs.filter((job) => routeBucket(job.route) === route), [baseJobs, route]);
	const placeMaster = placeBand
		? bandMasters["2센터"]?.[placeBand]?.places || masters["2센터"]
		: masters[jobCenter];
	const placeCodes = placeBand
		? bandMasters["2센터"]?.[placeBand]?.codes || storeCodes["2센터"]
		: storeCodes[jobCenter];
	const fileHits = useMemo(() => locationHits(baseJobs, placeMaster, measure), [
		baseJobs,
		placeMaster,
		measure
	]);
	const hits = useMemo(() => {
		const edits = routeEdits[center] ?? {};
		const paint = (code, hit) => {
			if (hit.route) return hit;
			const digits = (edits[code] ?? "").replace(/\D/g, "");
			if (!digits) return hit;
			return {
				...hit,
				route: routeBucket(digits) || digits
			};
		};
		const visible = locationHits(jobs, route === "전체" ? placeMaster : void 0, measure);
		const next = new Map(visible);
		for (const [code, hit] of next) next.set(code, paint(code, hit));
		if (route !== "전체") for (const [code, hit] of fileHits) {
			if (next.has(code) || hit.route) continue;
			const painted = paint(code, hit);
			if (painted.route === route) next.set(code, painted);
		}
		return next;
	}, [
		jobs,
		route,
		masters,
		placeMaster,
		center,
		measure,
		fileHits,
		routeEdits
	]);
	function editRoute(home, value, commit) {
		const digits = value.replace(/\D/g, "").slice(0, 4);
		const next = commit ? digits ? routeBucket(digits) || digits : "" : digits;
		setRouteEdits((prev) => ({
			...prev,
			[center]: {
				...prev[center] ?? {},
				[home]: next
			}
		}));
	}
	const moves = histByCenter[center]?.past.at(-1) ?? {};
	const picked = new Set(pickedByCenter[center] ?? []);
	function cellSelected(code, home) {
		if (home && picked.has(home)) return true;
		for (const id of picked) {
			if (!isCellPick(id)) continue;
			if (pickPos(id, moves) === code) return true;
		}
		return false;
	}
	function chooseStore(storeId, shift) {
		const current = pickedByCenter[center] ?? [];
		if (!shift) {
			if (current.length === 1 && current[0] === storeId) {
				setPickedByCenter((prev) => ({
					...prev,
					[center]: []
				}));
				setAnchorByCenter((prev) => ({
					...prev,
					[center]: ""
				}));
				return;
			}
			setPickedByCenter((prev) => ({
				...prev,
				[center]: [storeId]
			}));
			setAnchorByCenter((prev) => ({
				...prev,
				[center]: storeId
			}));
			return;
		}
		const anchor = anchorByCenter[center] || current[0];
		if (!anchor) {
			setPickedByCenter((prev) => ({
				...prev,
				[center]: [storeId]
			}));
			setAnchorByCenter((prev) => ({
				...prev,
				[center]: storeId
			}));
			return;
		}
		const spots = layoutSpots(layoutFor(jobCenter));
		const where = (id) => pickPos(id, moves);
		const from = spots.at.get(where(anchor));
		const to = spots.at.get(where(storeId));
		if (!from || !to) {
			setPickedByCenter((prev) => ({
				...prev,
				[center]: [storeId]
			}));
			setAnchorByCenter((prev) => ({
				...prev,
				[center]: storeId
			}));
			return;
		}
		const x1 = Math.min(from.x, to.x);
		const x2 = Math.max(from.x, to.x);
		const y1 = Math.min(from.y, to.y);
		const y2 = Math.max(from.y, to.y);
		const ids = [];
		const occ = /* @__PURE__ */ new Map();
		for (const home of hits.keys()) {
			const at = where(home);
			if (at !== "tray") occ.set(at, home);
		}
		for (let x = x1; x <= x2; x++) for (let y = y1; y <= y2; y++) {
			const code = spots.cell.get(`${x},${y}`);
			if (!code) continue;
			ids.push(occ.get(code) ?? `cell:${code}`);
		}
		setPickedByCenter((prev) => ({
			...prev,
			[center]: ids
		}));
	}
	function clearPicked() {
		setPickedByCenter((prev) => prev[center]?.length ? {
			...prev,
			[center]: []
		} : prev);
		setAnchorByCenter((prev) => ({
			...prev,
			[center]: ""
		}));
	}
	function startBand(event) {
		if (!event.shiftKey || event.button !== 0) return;
		if (event.target.closest("button, select, input, a, label, [data-line-filter]")) return;
		bandOrigin.current = {
			x: event.clientX,
			y: event.clientY
		};
		bandBox.current = null;
	}
	function moveBand(event) {
		const origin = bandOrigin.current;
		if (!origin) return;
		const w = Math.abs(event.clientX - origin.x);
		const h = Math.abs(event.clientY - origin.y);
		if (!bandBox.current && w < 6 && h < 6) return;
		if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
		window.getSelection()?.removeAllRanges();
		const next = {
			x: Math.min(origin.x, event.clientX),
			y: Math.min(origin.y, event.clientY),
			w,
			h
		};
		bandBox.current = next;
		setBand(next);
	}
	function endBand() {
		const box = bandBox.current;
		bandOrigin.current = null;
		bandBox.current = null;
		setBand(null);
		if (!box || box.w < 6 && box.h < 6) return;
		const ids = [];
		areaRef.current?.querySelectorAll("[data-cell]").forEach((node) => {
			const rect = node.getBoundingClientRect();
			const hit = rect.left < box.x + box.w && rect.right > box.x && rect.top < box.y + box.h && rect.bottom > box.y;
			const id = node.dataset.home || (node.dataset.cell ? `cell:${node.dataset.cell}` : "");
			if (hit && id) ids.push(id);
		});
		if (ids.length === 0) return;
		skipClick.current = true;
		window.setTimeout(() => {
			skipClick.current = false;
		}, 0);
		setPickedByCenter((prev) => {
			const cur = new Set(prev[center] ?? []);
			for (const id of ids) cur.add(id);
			return {
				...prev,
				[center]: [...cur]
			};
		});
	}
	function startPan(event) {
		if (event.button !== 0 || event.shiftKey) return;
		if (event.target.closest("button, select, input, a, label, [data-store], [data-cell]")) return;
		const board = boardRef.current;
		if (!board) return;
		pan.current = {
			x: event.clientX,
			y: event.clientY,
			left: board.scrollLeft,
			top: board.scrollTop,
			moved: false
		};
	}
	function movePan(event) {
		const start = pan.current;
		const board = boardRef.current;
		if (!start || !board) return;
		const dx = event.clientX - start.x;
		const dy = event.clientY - start.y;
		if (!start.moved && Math.hypot(dx, dy) < 4) return;
		if (!start.moved) {
			start.moved = true;
			setPanning(true);
		}
		if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
		board.scrollLeft = start.left - dx;
		board.scrollTop = start.top - dy;
		move("board");
	}
	function endPan(event) {
		if (pan.current?.moved) {
			skipClick.current = true;
			window.setTimeout(() => {
				skipClick.current = false;
			}, 0);
		}
		pan.current = null;
		setPanning(false);
		if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
	}
	const placed = useMemo(() => {
		const at = /* @__PURE__ */ new Map();
		const tray = [];
		for (const [home, hit] of hits) {
			const dest = moves[home] ?? home;
			if (dest === "tray") tray.push({
				hit,
				home
			});
			else at.set(dest, {
				hit,
				home
			});
		}
		tray.sort((a, b) => a.home.localeCompare(b.home));
		return {
			at,
			tray
		};
	}, [hits, moves]);
	const layout = useMemo(() => layoutFor(jobCenter), [jobCenter, layoutRev, shownSite()]);
	const checkedLines = checkedByCenter[center] ?? layout.map((item) => item.line);
	const lines = layout.filter((item) => checkedLines.includes(item.line));
	const oneLine = lines.length === 1;
	function pickLine(lineNo, shift) {
		setCheckedByCenter((prev) => {
			const all = layout.map((row) => row.line);
			const current = prev[center] ?? all;
			if (shift) {
				const next = current.includes(lineNo) ? current.filter((n) => n !== lineNo) : [...current, lineNo].sort((a, b) => a - b);
				return {
					...prev,
					[center]: next
				};
			}
			const onlyThis = current.length === 1 && current[0] === lineNo;
			return {
				...prev,
				[center]: onlyThis ? all : [lineNo]
			};
		});
	}
	const shown = useMemo(() => {
		let count = 0;
		let places = 0;
		let slots = 0;
		for (const item of lines) for (const slot of [...item.left, ...item.right]) {
			if (slot.kind !== "loc") continue;
			slots += 1;
			const hit = placed.at.get(slot.code)?.hit;
			if (!hit) continue;
			places += 1;
			count += hit.count;
		}
		return {
			count,
			places,
			slots
		};
	}, [placed, lines]);
	async function downloadLocation() {
		const ranked = new Map();
		for (const job of all[jobCenter] ?? []) {
			const home = normalizeLoc(job.location);
			if (!home) continue;
			const key = `${job.storeCd || ""}\t${job.storeNm || job.storeCd || ""}`;
			const box = ranked.get(home) ?? new Map();
			const add = measure === "건수" ? 1 : job.orderQty || 0;
			box.set(key, (box.get(key) ?? 0) + add);
			ranked.set(home, box);
		}
		const topStore = (home) => {
			const box = ranked.get(home);
			if (!box) return null;
			let bestKey = "";
			let bestQty = -1;
			for (const [key, qty] of box) if (qty > bestQty) {
				bestKey = key;
				bestQty = qty;
			}
			const [code, name] = bestKey.split("\t");
			return { code, name };
		};
		const slots = [];
		for (const item of layout) for (const slot of [...item.left, ...item.right]) if (slot.kind === "loc") slots.push(slot.code);
		slots.sort((a, b) => {
			const na = Number(a);
			const nb = Number(b);
			const aisle = (n) => {
				const line = Math.floor(n / 100);
				return n % 100 >= 50 ? line * 2 : line * 2 - 1;
			};
			return Math.floor(na / 100) - Math.floor(nb / 100) || aisle(na) - aisle(nb) || na - nb;
		});
		const rows = [["블록", "통로", "로케이션코드", "점포코드", "점포명"]];
		const changed = new Set();
		for (const [home, dest] of Object.entries(moves)) {
			if (!dest || dest === home) continue;
			changed.add(home);
			if (dest !== "tray") changed.add(dest);
		}
		const rowColor = new Map();
		for (const code of slots) {
			const n = Number(code);
			const line = Math.floor(n / 100);
			const aisle = n % 100 >= 50 ? line * 2 : line * 2 - 1;
			const found = placed.at.get(code);
			const top = found ? topStore(found.home) : null;
			const storeCode = top?.code || placeCodes?.[found?.home ?? ""] || "";
			const storeName = top?.name || found?.hit.store || "";
			if (changed.has(code) || found && found.home !== code) rowColor.set(rows.length + 1, found?.hit?.route ? routeRgb(found.hit.route) : "FFE08A");
			rows.push([line, aisle, code, storeCode, storeName]);
		}
		const xlsx = await import("xlsx");
		const { unzipSync, zipSync, strFromU8, strToU8 } = await import("fflate");
		const book = xlsx.utils.book_new();
		const grid = xlsx.utils.aoa_to_sheet(rows);
		grid["!cols"] = [{ wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 24 }];
		xlsx.utils.book_append_sheet(book, grid, "Sheet1");
		const packed = unzipSync(new Uint8Array(xlsx.write(book, { bookType: "xlsx", type: "array" })));
		if (rowColor.size > 0) {
			const palette = [];
			const styleOf = new Map();
			for (const rgb of rowColor.values()) if (!styleOf.has(rgb)) {
				palette.push(rgb);
				styleOf.set(rgb, palette.length);
			}
			let styles = strFromU8(packed["xl/styles.xml"]);
			styles = styles
				.replace('<fills count="2">', `<fills count="${2 + palette.length}">`)
				.replace("</fills>", palette.map((rgb) => `<fill><patternFill patternType="solid"><fgColor rgb="FF${rgb}"/></patternFill></fill>`).join("") + "</fills>")
				.replace('<cellXfs count="1">', `<cellXfs count="${1 + palette.length}">`)
				.replace("</cellXfs>", palette.map((_, index) => `<xf numFmtId="0" fontId="0" fillId="${index + 2}" borderId="0" xfId="0" applyFill="1"/>`).join("") + "</cellXfs>");
			let sheet = strFromU8(packed["xl/worksheets/sheet1.xml"]);
			sheet = sheet.replace(/<row r="(\d+)">([\s\S]*?)<\/row>/g, (full, rowNo, inner) => {
				const rgb = rowColor.get(Number(rowNo));
				if (!rgb) return full;
				return `<row r="${rowNo}">${inner.replace(/<c /g, `<c s="${styleOf.get(rgb)}" `)}</row>`;
			});
			packed["xl/styles.xml"] = strToU8(styles);
			packed["xl/worksheets/sheet1.xml"] = strToU8(sheet);
		}
		const out = zipSync(packed);
		const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = `${center}-배치표.xlsx`;
		link.click();
		URL.revokeObjectURL(link.href);
	}
	const scales = useMemo(() => {
		const out = {};
		for (const item of lines) {
			let min = Number.POSITIVE_INFINITY;
			let max = 0;
			for (const slot of [...item.left, ...item.right]) {
				if (slot.kind !== "loc") continue;
				const qty = placed.at.get(slot.code)?.hit?.count ?? 0;
				if (qty <= 0) continue;
				if (qty < min) min = qty;
				if (qty > max) max = qty;
			}
			out[item.line] = {
				min: Number.isFinite(min) ? min : 0,
				max
			};
		}
		return out;
	}, [placed, lines]);
	const card = oneLine ? 720 : 600;
	const boardWidth = lines.length * card + Math.max(0, lines.length - 1) * 12;
	function move(from) {
		const bar = barRef.current;
		const board = boardRef.current;
		const y = yRef.current;
		if (!board || syncing.current) return;
		syncing.current = true;
		if (from === "bar" && bar) board.scrollLeft = bar.scrollLeft;
		else if (from === "y" && y) board.scrollTop = y.scrollTop;
		else {
			if (bar) bar.scrollLeft = board.scrollLeft;
			if (y) y.scrollTop = board.scrollTop;
		}
		syncing.current = false;
	}
	useEffect(() => {
		const board = boardRef.current;
		if (!board) return;
		const update = () => setBoardScrollHeight(board.scrollHeight);
		update();
		const observer = new ResizeObserver(update);
		observer.observe(board);
		for (const child of board.children) observer.observe(child);
		return () => observer.disconnect();
	}, [
		lines,
		loaded,
		oneLine,
		placed
	]);
	function place(storeId, target) {
		const spots = layoutSpots(layoutFor(jobCenter));
		const next = shiftedMoves(hits.keys(), moves, storeId, target, picked, spots);
		if (!next) return;
		const cleaned = {};
		for (const [key, value] of Object.entries(next)) if (!isCellPick(key)) cleaned[key] = value;
		setPickedByCenter((prev) => {
			const mapped = (prev[center] ?? []).map((id) => {
				if (!isCellPick(id)) return id;
				const dest = next[id];
				return dest && dest !== "tray" ? `cell:${dest}` : id;
			});
			return {
				...prev,
				[center]: [...new Set(mapped)]
			};
		});
		setHistByCenter((prev) => {
			const past = [...(prev[center] ?? {
				past: [{}],
				future: []
			}).past, cleaned];
			if (past.length > 80) past.shift();
			return {
				...prev,
				[center]: {
					past,
					future: []
				}
			};
		});
	}
	useEffect(() => {
		function onKey(event) {
			if (!(event.ctrlKey || event.metaKey)) return;
			const key = event.key.toLowerCase();
			if (key !== "z" && key !== "y") return;
			const el = event.target;
			if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
			event.preventDefault();
			const redo = key === "y" || key === "z" && event.shiftKey;
			setHistByCenter((prev) => {
				const hist = prev[center] ?? {
					past: [{}],
					future: []
				};
				if (redo) {
					if (hist.future.length === 0) return prev;
					const [head, ...rest] = hist.future;
					return {
						...prev,
						[center]: {
							past: [...hist.past, head],
							future: rest
						}
					};
				}
				if (hist.past.length <= 1) return prev;
				const current = hist.past[hist.past.length - 1];
				return {
					...prev,
					[center]: {
						past: hist.past.slice(0, -1),
						future: [current, ...hist.future]
					}
				};
			});
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [center]);
	return /* @__PURE__ */ jsxs("div", {
		ref: areaRef,
		className: "flex h-full min-h-0 select-none flex-col overflow-hidden",
		onPointerDown: startBand,
		onPointerMove: moveBand,
		onPointerUp: endBand,
		onPointerCancel: endBand,
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "relative z-40 flex shrink-0 flex-wrap items-center gap-2 border-b border-black/5 bg-[#f2f2f7] px-3 py-2",
				children: [
					/* @__PURE__ */ jsx(PickMenu, {
						label: "센터",
						value: center,
						onChange: setCenter,
						options: centerList().flatMap((id) => shownSite() === "포천" && id === "2센터" ? [{ id: "2센터FF2", label: "2센터(FF2)" }, { id: "2센터FF1", label: "2센터(FF1)" }] : [{ id, label: id }])
					}),
					/* @__PURE__ */ jsx(PickMenu, {
						label: "DPT",
						value: dpt,
						onChange: setDpt,
						options: DPTS.map((item) => ({ id: item.id, label: item.label }))
					}),
					/* @__PURE__ */ jsx(PickMenu, {
						label: "루트",
						value: routeOptions.includes(route) ? route : "전체",
						onChange: setRoute,
						options: [{ id: "전체", label: "전체" }, ...routeOptions.map((item) => ({ id: item, label: item }))]
					}),
					/* @__PURE__ */ jsx(PickMenu, {
						label: "표시",
						value: measure,
						onChange: setMeasure,
						options: [{ id: "건수", label: "건수" }, { id: "작업수량", label: "작업수량" }]
					}),
					/* @__PURE__ */ jsx(CheckMenu, {
						label: "라인",
						text: layout.every((item) => checkedLines.includes(item.line)) ? "전체" : checkedLines.filter((n) => layout.some((item) => item.line === n)).length === 0 ? "선택 없음" : checkedLines.filter((n) => layout.some((item) => item.line === n)).sort((a, b) => a - b).map((n) => `${n}라인`).join(", "),
						rows: [{
							id: "전체",
							label: "전체",
							checked: layout.every((item) => checkedLines.includes(item.line))
						}, ...layout.map((item) => ({
							id: String(item.line),
							label: LINE_LABELS[item.line - 1].replace(/^\S+\s/, ""),
							checked: checkedLines.includes(item.line),
							swatch: LINE_TONE[item.line - 1]
						}))],
						onToggle: (id) => {
							if (id === "전체") {
								const allOn = layout.every((item) => checkedLines.includes(item.line));
								setCheckedByCenter((prev) => ({
									...prev,
									[center]: allOn ? [] : layout.map((item) => item.line)
								}));
								return;
							}
							const line = Number(id);
							setCheckedByCenter((prev) => {
								const current = prev[center] ?? layout.map((row) => row.line);
								const next = current.includes(line) ? current.filter((n) => n !== line) : [...current, line].sort((a, b) => a - b);
								return {
									...prev,
									[center]: next
								};
							});
						}
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "h-10 rounded-xl bg-[#8e8e93] px-3 text-sm font-semibold text-white disabled:opacity-40",
						disabled: Object.keys(moves).length === 0,
						onClick: () => setHistByCenter((prev) => {
							const past = [...(prev[center] ?? {
								past: [{}],
								future: []
							}).past, {}];
							if (past.length > 80) past.shift();
							return {
								...prev,
								[center]: {
									past,
									future: []
								}
							};
						}),
						children: "점포 원위치"
					}),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "h-10 rounded-xl bg-[#af52de] px-3 text-sm font-semibold text-white disabled:opacity-40",
						disabled: picked.size === 0,
						onClick: () => {
							const ids = [...picked];
							if (ids.length === 0) return;
							place(ids[0], "tray");
						},
						children: ["선택 점포 빼기", picked.size > 0 ? ` ${picked.size}` : ""]
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "h-7 rounded-full bg-[#007aff] px-3 text-xs font-semibold text-white",
						onClick: () => {
							void downloadLocation();
						},
						children: "엑셀"
					}),
					loaded ? /* @__PURE__ */ jsx("div", {
						className: "flex min-w-0 flex-1 justify-center px-2",
						children: /* @__PURE__ */ jsx("div", {
							className: "flex flex-wrap justify-center gap-1",
							children: layout.map((item) => {
									let count = 0;
									for (const slot of [...item.left, ...item.right]) {
										if (slot.kind !== "loc") continue;
										count += placed.at.get(slot.code)?.hit.count ?? 0;
									}
									const on = checkedLines.includes(item.line);
									const narrowed = !layout.every((row) => checkedLines.includes(row.line));
									return /* @__PURE__ */ jsxs("button", {
										type: "button",
										onClick: (event) => pickLine(item.line, event.shiftKey),
										className: "inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-semibold tabular-nums " + LINE_TONE[item.line - 1] + (item.line === 3 ? " text-ink" : " text-white") + (narrowed && !on ? " opacity-35" : "") + (narrowed && on ? " ring-2 ring-[#1c1c1e]" : ""),
										title: "클릭하면 이 라인만 봅니다. Shift를 누른 채 클릭하면 여러 라인을 고릅니다.",
										children: [
											item.line,
											"라인",
											/* @__PURE__ */ jsx("span", { children: nf.format(count) })
										]
									}, item.line);
								})
						})
					}) : null,
					loaded ? /* @__PURE__ */ jsxs("div", {
						className: "flex h-7 items-center gap-2 rounded-full bg-white px-2.5 text-[11px] font-semibold text-muted shadow-sm",
						children: [
							/* @__PURE__ */ jsxs("span", {
								children: ["총 ", /* @__PURE__ */ jsx("b", {
									className: "tabular-nums text-ink",
									children: nf.format(shown.slots)
								})]
							}),
							/* @__PURE__ */ jsxs("span", {
								children: ["점포 ", /* @__PURE__ */ jsx("b", {
									className: "tabular-nums text-[#007aff]",
									children: nf.format(shown.places)
								})]
							}),
							/* @__PURE__ */ jsx("span", { children: "적음" }),
							/* @__PURE__ */ jsx("span", {
								className: "h-1.5 w-14 rounded-full",
								style: { background: "linear-gradient(90deg, #63be7b, #ffeb84, #f8696b)" }
							}),
							/* @__PURE__ */ jsx("span", { children: "많음" })
						]
					}) : null
				]
			}),
			placeMaster && Object.keys(placeMaster).length > 0 ? /* @__PURE__ */ jsxs("p", {
				className: "shrink-0 truncate px-2 py-0.5 text-[11px] text-muted",
				children: [
					placeBand ? `2센터 ${placeBand} 배치 ` : "이 센터 배치 ",
					nf.format(Object.keys(placeMaster).length),
					"곳. 발주가 없는 점포는 ",
					measure,
					" 0입니다. 루트를 고르면 그 루트 점포만 봅니다."
				]
			}) : null,
			/* @__PURE__ */ jsxs("div", {
				className: "mx-3 mt-3 shrink-0 rounded-md border border-dashed px-3 py-2 " + (trayHot ? "border-title bg-ice" : "border-grid bg-paper"),
				onDragOver: (event) => {
					event.preventDefault();
					setTrayHot(true);
				},
				onDragLeave: () => setTrayHot(false),
				onDrop: (event) => {
					event.preventDefault();
					setTrayHot(false);
					const id = event.dataTransfer.getData("text/plain");
					if (id) place(id, "tray");
				},
				children: [/* @__PURE__ */ jsxs("div", {
					className: "mb-1 text-sm font-bold",
					children: ["임시 배치 ", placed.tray.length > 0 ? `${placed.tray.length}곳 · ${measure} ${nf.format(placed.tray.reduce((sum, item) => sum + item.hit.count, 0))}` : ""]
				}), placed.tray.length === 0 ? /* @__PURE__ */ jsxs("p", {
					className: "text-xs text-muted",
					children: [
						"점포만 끌어다 여기에 빼 둘 수 있습니다. 로케이션 번호는 움직이지 않고, 빼 둔 ",
						measure,
						"는 라인 합계에서 빠집니다."
					]
				}) : /* @__PURE__ */ jsx("div", {
					className: "flex flex-wrap gap-1",
					children: placed.tray.map((item) => /* @__PURE__ */ jsxs("span", {
						draggable: true,
						"data-store": item.home,
						onPointerDown: (event) => {
							event.currentTarget.draggable = !event.shiftKey;
						},
						onDragStart: (event) => {
							if (event.shiftKey) {
								event.preventDefault();
								return;
							}
							event.dataTransfer.setData("text/plain", item.home);
							event.dataTransfer.effectAllowed = "move";
						},
						className: "inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs font-bold text-ink " + (picked.has(item.home) ? "ring-2 ring-mark " : ""),
						style: { background: item.hit.route ? routeTone(item.hit.route) : "#eef2f5" },
						title: `원래 로케이션 ${item.home}. 점포를 클릭한 뒤 Shift를 누른 채 다른 점포를 클릭하면 그 사이가 선택됩니다.`,
						onClick: (event) => {
							if (skipClick.current) return;
							chooseStore(item.home, event.shiftKey);
						},
						children: [
							/* @__PURE__ */ jsx("span", { children: item.hit.store }),
							!fileHits.get(item.home)?.route ? /* @__PURE__ */ jsx(RouteEntry, {
								value: routeEdits[center]?.[item.home] ?? "",
								onChange: (value, commit) => editRoute(item.home, value, commit)
							}) : item.hit.route ? /* @__PURE__ */ jsx("span", {
								className: "tabular-nums",
								children: item.hit.route
							}) : null,
							/* @__PURE__ */ jsx("span", {
								className: "tabular-nums",
								children: nf.format(item.hit.count)
							})
						]
					}, item.home))
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex min-h-0 flex-1 flex-col",
				children: [/* @__PURE__ */ jsx("div", {
					ref: barRef,
					className: "loc-bar sticky top-0 z-10 shrink-0 overflow-x-scroll bg-paper px-3",
					onScroll: () => move("bar"),
					children: /* @__PURE__ */ jsx("div", { style: {
						width: boardWidth,
						height: 1
					} })
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex min-h-0 flex-1",
					children: [/* @__PURE__ */ jsxs("div", {
						ref: boardRef,
						className: "loc-board min-h-0 min-w-0 flex-1 overflow-auto bg-bg px-3 py-3 " + (panning ? "cursor-grabbing" : "cursor-grab"),
						onScroll: () => move("board"),
						onPointerDown: startPan,
						onPointerMove: movePan,
						onPointerUp: endPan,
						onPointerCancel: endPan,
						children: [lines.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "px-2 py-6 text-sm font-bold text-muted",
							children: "볼 라인을 체크해 주세요."
						}) : null, /* @__PURE__ */ jsx("div", {
							className: "flex gap-3",
							style: { width: boardWidth },
							children: lines.map((item) => {
								let lineCount = 0;
								for (const slot of [...item.left, ...item.right]) {
									if (slot.kind !== "loc") continue;
									lineCount += placed.at.get(slot.code)?.hit.count ?? 0;
								}
								const bar = "px-2 py-1.5 text-center text-sm font-bold " + LINE_TONE[item.line - 1] + (item.line === 3 ? " text-ink" : " text-on-dark");
								const tone = scales[item.line] ?? {
									min: 0,
									max: 0
								};
								return /* @__PURE__ */ jsxs("section", {
									className: "shrink-0 overflow-hidden rounded-md border border-grid bg-paper shadow-sm " + (oneLine ? "w-[720px]" : "w-[600px]"),
									children: [
										/* @__PURE__ */ jsxs("h3", {
											className: bar,
											children: [LINE_LABELS[item.line - 1], /* @__PURE__ */ jsx("span", {
												className: "ml-2 tabular-nums",
												children: nf.format(lineCount)
											})]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "grid min-w-0 grid-cols-[minmax(0,1fr)_10px_minmax(0,1fr)] gap-1 p-1.5",
											children: [
												/* @__PURE__ */ jsxs("div", {
													className: "grid min-w-0 content-start gap-0.5 overflow-hidden",
													children: [
														/* @__PURE__ */ jsx(LocColumns, {
															side: "left",
															unit: measure
														}),
														drawnSlots(item.left).map((drawn) => /* @__PURE__ */ jsx(LocationCell, {
															slot: drawn.span > 1 ? { ...drawn.slot, span: drawn.span } : drawn.slot,
															side: "left",
															big: oneLine,
															min: tone.min,
															max: tone.max,
															unit: measure,
															routeDraft: drawn.slot.kind === "loc" ? routeEdits[center]?.[placed.at.get(drawn.slot.code)?.home ?? ""] ?? "" : "",
															onRoute: drawn.slot.kind === "loc" && placed.at.get(drawn.slot.code)?.home && !fileHits.get(placed.at.get(drawn.slot.code)?.home ?? "")?.route ? (value, commit) => editRoute(placed.at.get(drawn.slot.code)?.home ?? "", value, commit) : void 0,
															home: drawn.slot.kind === "loc" ? placed.at.get(drawn.slot.code)?.home : void 0,
															hit: drawn.slot.kind === "loc" ? placed.at.get(drawn.slot.code)?.hit : void 0,
															selected: drawn.slot.kind === "loc" && cellSelected(drawn.slot.code, placed.at.get(drawn.slot.code)?.home),
															onToggle: chooseStore,
															onPlace: place,
															onClear: clearPicked,
															skipClick
														}, `L${drawn.index}`)),
														/* @__PURE__ */ jsx(LocColumns, {
															side: "left",
															unit: measure
														})
													]
												}),
												/* @__PURE__ */ jsx("div", { className: "loc-aisle rounded-sm" }),
												/* @__PURE__ */ jsxs("div", {
													className: "grid min-w-0 content-start gap-0.5 overflow-hidden",
													children: [
														/* @__PURE__ */ jsx(LocColumns, {
															side: "right",
															unit: measure
														}),
														drawnSlots(item.right).map((drawn) => /* @__PURE__ */ jsx(LocationCell, {
															slot: drawn.span > 1 ? { ...drawn.slot, span: drawn.span } : drawn.slot,
															side: "right",
															big: oneLine,
															min: tone.min,
															max: tone.max,
															unit: measure,
															routeDraft: drawn.slot.kind === "loc" ? routeEdits[center]?.[placed.at.get(drawn.slot.code)?.home ?? ""] ?? "" : "",
															onRoute: drawn.slot.kind === "loc" && placed.at.get(drawn.slot.code)?.home && !fileHits.get(placed.at.get(drawn.slot.code)?.home ?? "")?.route ? (value, commit) => editRoute(placed.at.get(drawn.slot.code)?.home ?? "", value, commit) : void 0,
															home: drawn.slot.kind === "loc" ? placed.at.get(drawn.slot.code)?.home : void 0,
															hit: drawn.slot.kind === "loc" ? placed.at.get(drawn.slot.code)?.hit : void 0,
															selected: drawn.slot.kind === "loc" && cellSelected(drawn.slot.code, placed.at.get(drawn.slot.code)?.home),
															onToggle: chooseStore,
															onPlace: place,
															onClear: clearPicked,
															skipClick
														}, `R${drawn.index}`)),
														/* @__PURE__ */ jsx(LocColumns, {
															side: "right",
															unit: measure
														})
													]
												})
											]
										}),
										/* @__PURE__ */ jsxs("h3", {
											className: bar,
											children: [LINE_LABELS[item.line - 1], /* @__PURE__ */ jsx("span", {
												className: "ml-2 tabular-nums",
												children: nf.format(lineCount)
											})]
										})
									]
								}, item.line);
							})
						})]
					}), /* @__PURE__ */ jsx("div", {
						ref: yRef,
						className: "loc-y shrink-0 bg-paper",
						onScroll: () => move("y"),
						children: /* @__PURE__ */ jsx("div", { style: {
							height: boardScrollHeight,
							width: 1
						} })
					})]
				})]
			}),
			band ? /* @__PURE__ */ jsx("div", {
				className: "pointer-events-none fixed z-30 border-2 border-mark bg-mark/20",
				style: {
					left: band.x,
					top: band.y,
					width: band.w,
					height: band.h
				}
			}) : null
		]
	});
}
function dairyProgress(jobs) {
	const planned = jobs.length;
	let done = 0;
	let dairy = 0;
	let ff = 0;
	for (const job of jobs) {
		if (job.at != null) done += 1;
		if (matchDpt(job.route, "유제 냉장")) dairy += 1;
		else if (matchDpt(job.route, "FF2")) ff += 1;
	}
	return {
		planned,
		current: planned ? done / planned * 100 : 0,
		dairyShare: planned ? dairy / planned * 100 : 0,
		ffShare: planned ? ff / planned * 100 : 0
	};
}
function avgWorkPct(jobs, minutes) {
	const planned = jobs.length;
	if (!planned) return null;
	const rows = buckets(jobs, minutes, planned);
	if (!rows.length) return null;
	const avg = rows.reduce((sum, row) => sum + row.sliceRate, 0) / rows.length * 100;
	return avg > 0 ? avg : null;
}
function paceTimes(dairyShare, ffShare, current, now, avg30, ff15, manual, fixedDairy = false) {
	const gap = dairyShare - current;
	const clock = new Date(now);
	const minute = clock.getHours() * 60 + clock.getMinutes();
	const extra = minute < 735 ? 60 : minute < 870 ? 30 : minute < 990 ? 15 : 0;
	const dairyDone = gap <= 0;
	const dairyScale = fixedDairy || !(dairyShare > 0) ? 1 : 100 / dairyShare;
	const dairySpan = fixedDairy ? 15 : 30;
	const dairyMin = !dairyDone && avg30 != null && avg30 > 0 ? gap / avg30 * dairySpan * dairyScale : null;
	const dairyClose = dairyMin == null ? null : now + (dairyMin + extra) * 6e4;
	const rest = Math.max(0, 100 - Math.max(dairyShare, current));
	const rate = manual ? 5 : ff15;
	const ffScale = !manual && ffShare > 0 ? 100 / ffShare : 1;
	const ffMin = rest <= 0 ? 0 : rate != null && rate > 0 ? rest / rate * 15 * ffScale : null;
	const finished = current >= 99.95;
	return {
		dairyClose,
		eta: finished ? now : ffMin == null ? null : dairyDone ? now + ffMin * 6e4 : dairyClose == null ? null : dairyClose + ffMin * 6e4,
		finished,
		dairyDone
	};
}
function wallClock(ms) {
	const date = new Date(ms);
	const hour = date.getHours();
	const minute = String(date.getMinutes()).padStart(2, "0");
	return `${hour % 12 || 12}:${minute} ${hour < 12 ? "오전" : "오후"}`;
}
var PACE_TINT = {
	"1센터": "bg-[#007aff]",
	"2센터": "bg-[#ff9500]",
	"3센터": "bg-[#af52de]"
};
var PACE_HEX = {
	"1센터": "#007aff",
	"2센터": "#ff9500",
	"3센터": "#af52de"
};
function paceSnapshot(jobs, now, hand, useFive = false, full = false) {
	const cards = centerList().map((id) => {
		const list = jobs[id] ?? [];
		const stat = dairyProgress(list);
		const typed = hand?.current[id];
		const typedDairy = hand?.dairy?.[id];
		const noFile = stat.planned === 0;
		const current = full ? typed ?? null : typed != null ? typed : stat.current;
		const dairyShare = full ? typedDairy ?? null : stat.dairyShare;
		const empty = full ? current == null || dairyShare == null : noFile;
		const avg = full ? 2.5 : avgWorkPct(list.filter((job) => matchDpt(job.route, "유제 냉장")), 30) ?? (hand && !noFile ? 5 : null);
		const ff15Rate = avgWorkPct(list.filter((job) => matchDpt(job.route, "FF2")), 15);
		const pace = empty ? {
			dairyClose: null,
			eta: null,
			finished: false,
			dairyDone: false
		} : paceTimes(full ? dairyShare : stat.dairyShare, stat.ffShare, current, now, avg, ff15Rate, useFive || hand != null, full);
		const pct = (value) => value == null ? "—" : `${value.toFixed(1)}%`;
		const dairyText = empty ? "—" : pace.dairyDone ? "종료" : pace.dairyClose == null ? "—" : wallClock(pace.dairyClose);
		const etaText = empty ? "—" : pace.finished ? "종료" : pace.eta == null ? "—" : wallClock(pace.eta);
		const cells = [
			{
				label: "총유제%",
				value: full ? dairyShare == null ? "—" : pct(dairyShare) : noFile ? "—" : pct(stat.dairyShare)
			},
			{
				label: "현재%",
				value: full ? current == null ? "—" : pct(current) : noFile && typed == null ? "—" : pct(current)
			},
			{
				label: "유제마감",
				value: dairyText
			},
			{
				label: "예상종료",
				value: etaText
			}
		];
		return {
			id,
			currentValue: noFile && typed == null ? null : current,
			dairyValue: stat.planned ? stat.dairyShare : null,
			avg: full ? "2.5%" : empty || avg == null ? "—" : pct(avg),
			ff15: full || useFive ? "5%가정" : empty || ff15Rate == null ? "—" : pct(ff15Rate),
			cells
		};
	});
	const cols = centerList().map((id) => {
		const list = jobs[id] ?? [];
		const count = lineCountOf(id);
		const lines = Array.from({ length: 8 }, (_, index) => {
			if (index >= count) return null;
			const line = index + 1;
			let planned = 0;
			let done = 0;
			for (const job of list) {
				if (job.line !== line) continue;
				planned += 1;
				if (job.at != null) done += 1;
			}
			const typed = hand?.lines[id]?.[line];
			const pct = full ? typed ?? null : typed != null ? typed : planned ? done / planned * 100 : null;
			const shown = pct == null ? null : Math.round(pct);
			return {
				line,
				pct: shown,
				rate: shown == null ? "—" : `${shown}%`
			};
		});
		const stat = dairyProgress(list);
		const typed = hand?.current[id];
		const typedDairy = hand?.dairy?.[id];
		const noFile = stat.planned === 0;
		const current = full ? typed ?? null : typed != null ? typed : noFile ? null : stat.current;
		const dairyShare = full ? typedDairy ?? null : noFile ? null : stat.dairyShare;
		return {
			id,
			current: current == null ? "현재 —" : `현재 ${current.toFixed(1)}%`,
			dairy: dairyShare == null ? "—" : `${dairyShare.toFixed(1)}%`,
			lines
		};
	});
	const rates = cols.flatMap((col) => col.lines.flatMap((line) => line?.pct == null ? [] : [line.pct]));
	const heat = rates.length ? {
		min: Math.min(...rates),
		max: Math.max(...rates)
	} : null;
	return {
		clock: wallClock(now),
		cards,
		cols,
		heat
	};
}
function fillRound(ctx, x, y, w, h, r, fill) {
	ctx.beginPath();
	ctx.roundRect(x, y, w, h, r);
	ctx.fillStyle = fill;
	ctx.fill();
}
function drawPaceCapture(snap, kind = "calc") {
	const pad = 28;
	const leftW = 640;
	const rightW = 520;
	const width = 1236;
	const height = 520;
	const canvas = document.createElement("canvas");
	const scale = 2;
	canvas.width = width * scale;
	canvas.height = height * scale;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("이미지를 만들지 못했습니다.");
	ctx.scale(scale, scale);
	ctx.fillStyle = "#f2f2f7";
	ctx.fillRect(0, 0, width, height);
	ctx.textBaseline = "middle";
	ctx.font = "600 18px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
	const title = "센터별 예상 작업 종료시간";
	const titleW = ctx.measureText(title).width;
	const pill = snap.clock;
	ctx.font = "600 13px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
	const pillW = ctx.measureText(pill).width + 20;
	let x = pad + (leftW - (titleW + 8 + pillW)) / 2;
	ctx.font = "600 18px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
	ctx.fillStyle = "#1c1c1e";
	ctx.textAlign = "left";
	ctx.fillText(title, x, 44);
	fillRound(ctx, x + titleW + 8, 32, pillW, 24, 12, "#007aff");
	ctx.fillStyle = "#ffffff";
	ctx.font = "600 13px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
	ctx.textAlign = "center";
	ctx.fillText(pill, x + titleW + 8 + pillW / 2, 44);
	snap.cards.forEach((card, index) => {
		const y = 72 + index * 96;
		fillRound(ctx, pad, y, leftW, 88, 16, "#ffffff");
		ctx.beginPath();
		ctx.arc(46, y + 20, 4, 0, Math.PI * 2);
		ctx.fillStyle = PACE_HEX[card.id];
		ctx.fill();
		ctx.fillStyle = "#1c1c1e";
		ctx.font = "600 14px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
		ctx.textAlign = "left";
		ctx.fillText(card.id, 58, y + 20);
		ctx.fillStyle = "#8e8e93";
		ctx.font = "500 12px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
		ctx.textAlign = "right";
		ctx.fillText(`${kind === "full" ? "유제 15분" : "유제 30분"} ${card.avg}   FF2 15분 ${card.ff15}`, 652, y + 20);
		ctx.strokeStyle = "rgba(0,0,0,0.06)";
		ctx.beginPath();
		ctx.moveTo(pad, y + 36);
		ctx.lineTo(668, y + 36);
		ctx.stroke();
		card.cells.forEach((cell, cellIndex) => {
			const col = pad + leftW / 4 * cellIndex + leftW / 8;
			ctx.fillStyle = "#8e8e93";
			ctx.font = "500 11px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
			ctx.textAlign = "center";
			ctx.fillText(cell.label, col, y + 52);
			ctx.fillStyle = "#1c1c1e";
			ctx.font = "600 15px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
			ctx.fillText(cell.value, col, y + 72);
		});
	});
	ctx.fillStyle = "#8e8e93";
	ctx.font = "12px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
	ctx.textAlign = "center";
	ctx.fillText(kind === "full" ? "완전 수기입니다. 유제는 15분에 2.5%, FF2는 15분에 5%로 계산했습니다." : kind === "manual" ? "수기입니다. 예상종료는 15분에 5%입니다." : kind === "five" ? "5%반영입니다. FF2는 15분에 5%로 계산했습니다." : "예상종료는 FF2 15분 평균으로 계산했습니다.", 348, 72 + snap.cards.length * 96 + 8);
	const rx = 688;
	ctx.fillStyle = "#1c1c1e";
	ctx.font = "600 18px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
	ctx.fillText("라인별 작업%", 948, 44);
	const tableY = 68;
	const tableH = 300;
	ctx.save();
	ctx.beginPath();
	ctx.roundRect(rx, tableY, rightW, tableH, 16);
	ctx.clip();
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(rx, tableY, rightW, tableH);
	const colW = rightW / snap.cols.length;
	snap.cols.forEach((col, index) => {
		const cx = rx + colW * index + colW / 2;
		const pw = 64;
		fillRound(ctx, cx - pw / 2, 78, pw, 22, 11, PACE_HEX[col.id]);
		ctx.fillStyle = "#ffffff";
		ctx.font = "600 12px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(col.id, cx, 89);
		ctx.fillStyle = "#8e8e93";
		ctx.font = "600 12px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
		ctx.fillText(col.current, cx, 116);
	});
	ctx.strokeStyle = "rgba(0,0,0,0.06)";
	ctx.beginPath();
	ctx.moveTo(rx, 132);
	ctx.lineTo(1208, 132);
	ctx.stroke();
	for (let line = 0; line < 8; line++) {
		const y = 132 + line * 26 + 13;
		snap.cols.forEach((col, index) => {
			const cell = col.lines[line];
			const left = rx + colW * index;
			const rowY = 132 + line * 26;
			if (cell?.pct != null && snap.heat) {
				ctx.fillStyle = heatColor(snap.heat.max + snap.heat.min - cell.pct, snap.heat.min, snap.heat.max);
				ctx.fillRect(left + colW * .5, rowY, colW * .5 - 1, 26);
			}
			ctx.fillStyle = "#8e8e93";
			ctx.font = "600 12px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
			ctx.textAlign = "center";
			ctx.fillText(cell ? `${cell.line}라인` : "", left + colW * .32, y);
			ctx.fillStyle = "#1c1c1e";
			ctx.font = "600 13px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
			ctx.fillText(cell ? cell.rate : "", left + colW * .72, y);
		});
	}
	ctx.fillStyle = "#f2f2f7";
	ctx.fillRect(rx, 340, rightW, 28);
	snap.cols.forEach((col, index) => {
		const left = rx + colW * index;
		const y = 354;
		ctx.fillStyle = "#8e8e93";
		ctx.font = "600 12px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
		ctx.textAlign = "center";
		ctx.fillText("유제", left + colW * .32, y);
		ctx.fillStyle = "#1c1c1e";
		ctx.fillText(col.dairy, left + colW * .72, y);
	});
	ctx.restore();
	ctx.beginPath();
	ctx.roundRect(rx, tableY, rightW, tableH, 16);
	ctx.strokeStyle = "rgba(0,0,0,0.06)";
	ctx.stroke();
	return canvas;
}
function parsePct(text) {
	if (text == null) return null;
	const clean = text.trim().replace("%", "");
	if (!clean || clean === ".") return null;
	const value = Number(clean);
	if (!Number.isFinite(value)) return null;
	return Math.min(100, Math.max(0, value));
}
function keepPct(text) {
	const clean = text.replace(/[^\d.]/g, "");
	const dot = clean.indexOf(".");
	if (dot < 0) return clean;
	return `${clean.slice(0, dot + 1)}${clean.slice(dot + 1).replace(/\./g, "").slice(0, 1)}`;
}
function seedHand(jobs, now) {
	const snap = paceSnapshot(jobs, now);
	const current = {};
	const lines = {};
	const dairy = {};
	for (const card of snap.cards) {
		current[card.id] = card.currentValue == null ? "" : String(Math.round(card.currentValue * 10) / 10);
		dairy[card.id] = card.dairyValue == null ? "" : String(Math.round(card.dairyValue * 10) / 10);
	}
	for (const col of snap.cols) {
		const row = {};
		for (const line of col.lines) {
			if (!line) continue;
			row[line.line] = line.pct == null ? "" : String(line.pct);
		}
		lines[col.id] = row;
	}
	return {
		ready: true,
		current,
		lines,
		dairy
	};
}
function handNums(hand) {
	const current = {};
	const lines = {};
	const dairy = {};
	for (const id of centerList()) {
		current[id] = parsePct(hand.current[id]);
		dairy[id] = parsePct(hand.dairy?.[id]);
		const row = {};
		for (let line = 1; line <= lineCountOf(id); line++) row[line] = parsePct(hand.lines[id]?.[line]);
		lines[id] = row;
	}
	return {
		current,
		lines,
		dairy
	};
}
var PaceCtx = createContext(null);
function usePace() {
	const value = useContext(PaceCtx);
	if (!value) throw new Error("pace");
	return value;
}
function readPaceMemory() {
	const embedded = window.__PACE_HAND__;
	if (embedded && typeof embedded === "object") return embedded;
	try {
		const raw = sessionStorage.getItem("center-pace-hand");
		if (!raw) return null;
		const data = JSON.parse(raw);
		return data && typeof data === "object" ? data : null;
	} catch {
		return null;
	}
}
function PaceProvider({ jobs, children }) {
	const saved = readPaceMemory();
	const [now, setNow] = useState(() => Date.now());
	const [mode, setMode] = useState(saved?.mode === "five" || saved?.mode === "manual" || saved?.mode === "full" ? saved.mode : "calc");
	const [hand, setHand] = useState(saved?.hand?.ready ? saved.hand : {
		ready: false,
		current: {},
		lines: {},
		dairy: {}
	});
	const [copyNote, setCopyNote] = useState("");
	useEffect(() => {
		const timer = window.setInterval(() => setNow(Date.now()), 1e3);
		return () => window.clearInterval(timer);
	}, []);
	useEffect(() => {
		if (!hand.ready) return;
		const payload = JSON.stringify({ mode, hand });
		try {
			sessionStorage.setItem("center-pace-hand", payload);
		} catch {}
		try {
			window.chrome?.webview?.postMessage("pace-save:" + payload);
		} catch {}
	}, [mode, hand]);
	const snap = paceSnapshot(jobs, now, (mode === "manual" || mode === "full") && hand.ready ? handNums(hand) : void 0, mode !== "calc", mode === "full");
	const value = useMemo(() => ({
		jobs,
		snap,
		mode,
		hand,
		copyNote,
		setMode,
		setHand,
		setCopyNote
	}), [
		jobs,
		snap,
		mode,
		hand,
		copyNote
	]);
	return /* @__PURE__ */ jsx(PaceCtx.Provider, {
		value,
		children: /* @__PURE__ */ jsx("div", {
			className: "flex h-full min-h-0 min-w-0 flex-1",
			children
		})
	});
}
function PaceMode() {
	const { mode, setMode, setHand, hand, jobs } = usePace();
	return /* @__PURE__ */ jsx("div", {
		className: "inline-flex rounded-full bg-black/5 p-0.5",
		children: [
			["calc", "계산"],
			["five", "5%반영"],
			["manual", "수기"],
			["full", "완전 수기"]
		].map(([id, label]) => /* @__PURE__ */ jsx("button", {
			type: "button",
			className: "h-7 rounded-full px-3 text-xs font-semibold " + (mode === id ? "bg-white text-ink shadow-sm" : "text-muted"),
			onClick: () => {
				if ((id === "manual" || id === "full") && !hand.ready) setHand(seedHand(jobs, Date.now()));
				setMode(id);
			},
			children: label
		}, id))
	});
}
function PaceBoard() {
	const { snap, mode, hand, setHand, copyNote, setCopyNote } = usePace();
	const ready = centerList().some((id) => snap.cards.find((card) => card.id === id)?.currentValue != null);
	return /* @__PURE__ */ jsxs("div", {
		className: "pace-board flex h-max max-h-full w-max max-w-[48%] shrink-0 flex-col items-center overflow-auto px-2 py-1.5",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-1 flex max-w-full shrink-0 flex-wrap items-center justify-center gap-1",
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "px-1 text-[15px] font-semibold tracking-tight text-ink",
						children: "센터별 예상 작업 종료시간"
					}),
					/* @__PURE__ */ jsx("span", {
						className: "inline-flex h-7 items-center rounded-full bg-[#007aff] px-2.5 text-xs font-semibold text-white tabular-nums",
						children: snap.clock
					}),
					/* @__PURE__ */ jsx(PaceMode, {}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						disabled: !ready && mode === "calc",
						className: "h-7 rounded-full bg-[#007aff] px-3 text-xs font-semibold text-white disabled:opacity-40",
						onClick: () => {
							setCopyNote("만드는 중");
							copyCanvas(drawPaceCapture(snap, mode)).then(() => setCopyNote("복사했습니다. 카톡에 붙여 넣으세요.")).catch((err) => setCopyNote(err instanceof Error ? err.message : "복사에 실패했습니다."));
						},
						children: "캡처 복사"
					}),
					copyNote ? /* @__PURE__ */ jsx("span", {
						className: "text-xs font-semibold text-[#007aff]",
						children: copyNote
					}) : null
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex w-[26rem] max-w-full flex-col gap-2",
				children: snap.cards.map((card) => /* @__PURE__ */ jsxs("div", {
					className: "overflow-hidden rounded-2xl bg-white shadow-sm",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2 px-3 py-1.5",
						children: [
							/* @__PURE__ */ jsx("span", { className: `h-2 w-2 rounded-full ${PACE_TINT[card.id]}` }),
							/* @__PURE__ */ jsx("p", {
								className: "text-[13px] font-semibold",
								children: card.id
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "ml-auto whitespace-nowrap text-[10px] font-medium text-muted",
								children: [
									mode === "full" ? "유제 15분 " : "유제 30분 ",
									card.avg,
									" · FF2 15분 ",
									card.ff15
								]
							})
						]
					}), /* @__PURE__ */ jsx("div", {
						className: "grid grid-cols-4 border-t border-black/[0.06]",
						children: card.cells.map((cell) => /* @__PURE__ */ jsxs("div", {
							className: "px-1 py-1.5 text-center",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-[10px] font-medium text-muted",
								children: cell.label
							}), (mode === "full" && (cell.label === "총유제%" || cell.label === "현재%") || mode === "manual" && cell.label === "현재%") ? /* @__PURE__ */ jsx("input", {
								inputMode: "decimal",
								"aria-label": `${card.id} ${cell.label}`,
								value: (cell.label === "총유제%" ? hand.dairy?.[card.id] : hand.current[card.id]) ?? "",
								onChange: (event) => {
									const text = keepPct(event.target.value);
									setHand((prev) => cell.label === "총유제%" ? {
										...prev,
										dairy: {
											...prev.dairy,
											[card.id]: text
										}
									} : {
										...prev,
										current: {
											...prev.current,
											[card.id]: text
										}
									});
								},
								className: "w-full border-0 bg-transparent p-0 text-center text-[13px] font-semibold tabular-nums text-ink outline-none"
							}) : /* @__PURE__ */ jsx("p", {
								className: "text-[13px] font-semibold tabular-nums text-ink",
								children: cell.value
							})]
						}, cell.label))
					})]
				}, card.id))
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-2 max-w-md text-center text-[10px] leading-4 text-muted",
				children: mode === "full" ? "총유제%와 현재%, 라인%를 직접 넣습니다. 유제는 15분에 2.5%, FF2는 15분에 5%로 유제마감과 예상종료를 계산합니다." : mode === "manual" ? "수기 현재%로 계산합니다. 예상종료는 15분에 5%입니다. 라인%를 바꾸면 그 센터 현재%도 평균으로 바뀝니다." : mode === "five" ? "계산 수치입니다. FF2 예상종료만 15분에 5%로 계산합니다." : "유제 30분은 유제·냉장만, FF2 15분은 FF2만의 구간 평균입니다. 유제마감과 예상종료도 그 속도로 계산합니다."
			})
		]
	});
}
function LineBoard() {
	const { snap, mode, hand, setHand } = usePace();
	return /* @__PURE__ */ jsxs("div", {
		className: "pace-board flex h-max max-h-full w-max max-w-[48%] shrink-0 flex-col items-center overflow-auto px-2 py-1.5",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mb-1 flex max-w-full shrink-0 flex-wrap items-center justify-center gap-1",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "px-1 text-[15px] font-semibold tracking-tight text-ink",
				children: "라인별 작업%"
			}), /* @__PURE__ */ jsx(PaceMode, {})]
		}), /* @__PURE__ */ jsx("div", {
			className: "max-h-full max-w-full overflow-auto rounded-2xl bg-white shadow-sm",
			children: /* @__PURE__ */ jsxs("table", {
				className: "w-max border-collapse text-center text-[12px]",
				children: [/* @__PURE__ */ jsxs("thead", { children: [/* @__PURE__ */ jsx("tr", { children: snap.cols.map((row) => /* @__PURE__ */ jsx("th", {
					colSpan: 2,
					className: "border-b border-black/10 px-2 py-1.5",
					children: /* @__PURE__ */ jsx("span", {
						className: `inline-flex min-w-16 justify-center rounded-full px-2 py-0.5 text-xs font-semibold text-white ${PACE_TINT[row.id]}`,
						children: row.id
					})
				}, row.id)) }), /* @__PURE__ */ jsx("tr", {
					className: "text-[11px] text-muted",
					children: snap.cols.map((row) => /* @__PURE__ */ jsx("th", {
						colSpan: 2,
						className: "border-b border-black/[0.06] px-2 py-1 font-semibold tabular-nums",
						children: row.current
					}, row.id))
				})] }), /* @__PURE__ */ jsxs("tbody", { children: [Array.from({ length: 8 }, (_, index) => /* @__PURE__ */ jsx("tr", { children: snap.cols.map((row) => {
					const line = row.lines[index];
					if (!line) return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("td", {
						className: "border-b border-black/[0.04] px-2 py-0.5",
						children: " "
					}), /* @__PURE__ */ jsx("td", {
						className: "border-b border-r border-black/[0.04] px-2 py-0.5",
						children: " "
					})] }, row.id);
					return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("th", {
						className: "border-b border-black/[0.06] px-2 py-0.5 text-center text-[11px] font-semibold text-muted",
						children: [line.line, "라인"]
					}), /* @__PURE__ */ jsx("td", {
						className: "border-b border-r border-black/[0.06] px-1 py-0.5 font-semibold tabular-nums",
						style: line.pct != null && snap.heat ? { backgroundColor: heatColor(snap.heat.max + snap.heat.min - line.pct, snap.heat.min, snap.heat.max) } : void 0,
						children: mode === "manual" || mode === "full" ? /* @__PURE__ */ jsx("input", {
							inputMode: "decimal",
							"aria-label": `${row.id} ${line.line}라인`,
							value: hand.lines[row.id]?.[line.line] ?? "",
							onChange: (event) => {
								const text = keepPct(event.target.value);
								setHand((prev) => {
									const lines = {
										...prev.lines,
										[row.id]: {
											...prev.lines[row.id],
											[line.line]: text
										}
									};
									const nums = [];
									for (let n = 1; n <= lineCountOf(row.id); n++) {
										const value = parsePct(lines[row.id]?.[n]);
										if (value != null) nums.push(value);
									}
									const current = { ...prev.current };
									if (mode === "manual" && nums.length) {
										const avg = nums.reduce((sum, value) => sum + value, 0) / nums.length;
										current[row.id] = String(Math.round(avg * 10) / 10);
									}
									return {
										...prev,
										current,
										lines
									};
								});
							},
							className: "w-10 border-0 bg-transparent p-0 text-center text-[12px] font-semibold tabular-nums text-ink outline-none"
						}) : line.rate
					})] }, row.id);
				}) }, index)), /* @__PURE__ */ jsx("tr", {
					className: "bg-[#f2f2f7]",
					children: snap.cols.map((row) => /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("th", {
						className: "px-2 py-1 text-center text-[11px] font-semibold text-muted",
						children: "유제"
					}), /* @__PURE__ */ jsx("td", {
						className: "border-r border-black/[0.06] px-2 py-1 font-semibold tabular-nums text-ink",
						children: mode === "full" ? /* @__PURE__ */ jsx("input", {
							inputMode: "decimal",
							"aria-label": `${row.id} 유제`,
							value: hand.dairy?.[row.id] ?? "",
							onChange: (event) => {
								const text = keepPct(event.target.value);
								setHand((prev) => ({
									...prev,
									dairy: {
										...prev.dairy,
										[row.id]: text
									}
								}));
							},
							className: "w-12 border-0 bg-transparent p-0 text-center text-[12px] font-semibold tabular-nums text-ink outline-none"
						}) : row.dairy
					})] }, row.id))
				})] })]
			})
		})]
	});
}
function PaneSplit({ axis, onDrag }) {
	return /* @__PURE__ */ jsx("div", {
		role: "separator",
		"aria-orientation": axis === "x" ? "vertical" : "horizontal",
		"aria-label": axis === "x" ? "좌우 크기" : "상하 크기",
		className: "group relative z-10 shrink-0 touch-none " + (axis === "x" ? "w-2 cursor-col-resize" : "h-2 cursor-row-resize"),
		onPointerDown: (event) => {
			const parent = event.currentTarget.parentElement;
			if (!parent) return;
			event.preventDefault();
			const rect = parent.getBoundingClientRect();
			const move = (next) => {
				const raw = axis === "x" ? (next.clientX - rect.left) / rect.width * 100 : (next.clientY - rect.top) / rect.height * 100;
				onDrag(Math.min(82, Math.max(18, raw)));
			};
			const stop = () => {
				window.removeEventListener("pointermove", move);
				window.removeEventListener("pointerup", stop);
			};
			window.addEventListener("pointermove", move);
			window.addEventListener("pointerup", stop);
		},
		children: /* @__PURE__ */ jsx("div", { className: "absolute rounded-full bg-black/15 transition-colors group-hover:bg-[#007aff] " + (axis === "x" ? "inset-y-3 left-1/2 w-1 -translate-x-1/2" : "inset-x-3 top-1/2 h-1 -translate-y-1/2") })
	});
}
function Summary({ jobs: all, loaded }) {
	const [center, setCenter] = useState("1센터");
	const [dpt, setDpt] = useState("전체");
	const [view, setView] = useState("basic");
	const [copyNote, setCopyNote] = useState("");
	const jobs = useMemo(() => jobsOf(all, center, dpt), [
		all,
		center,
		dpt
	]);
	const lines = useMemo(() => lineStats(jobs, lineCountOf(center)), [jobs, center]);
	const forecasts = useMemo(() => lineForecasts(jobs, lineCountOf(center)), [jobs, center]);
	const cast = useMemo(() => centerForecast(forecasts), [forecasts]);
	const whole = useMemo(() => centerStat(center, jobs), [jobs, center]);
	const workDay = workDateLabel(whole.first, whole.last);
	const finish = useMemo(() => finishScale(lines.map((row) => row.last)), [lines]);
	const etaTone = useMemo(() => finishScale(forecasts.map((row) => row.left > 0 ? row.eta : null)), [forecasts]);
	const wholeAhead = cast.eta != null && cast.snapshot != null ? cast.eta - cast.snapshot : null;
	const showEta = view === "forecast";
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-full min-h-0 flex-col items-center overflow-hidden px-2 py-1.5",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-1 flex max-w-full shrink-0 flex-wrap items-center justify-center gap-1",
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "px-1 text-[15px] font-semibold tracking-tight text-ink",
						children: "라인별 생산성"
					}),
					/* @__PURE__ */ jsx(CenterSelect, {
						value: center,
						onChange: setCenter,
						compact: true
					}),
					/* @__PURE__ */ jsx(DptSelect, {
						value: dpt,
						onChange: setDpt,
						compact: true
					}),
					/* @__PURE__ */ jsx(PickMenu, {
						label: "보기",
						value: view,
						compact: true,
						onChange: setView,
						options: [
							{ id: "basic", label: "기본" },
							{ id: "forecast", label: "예상" }
						]
					}),
					/* @__PURE__ */ jsx("span", {
						className: "inline-flex h-7 items-center rounded-full bg-white px-2.5 text-xs font-semibold shadow-sm",
						children: workDay.date
					}),
					/* @__PURE__ */ jsx("span", {
						className: "inline-flex h-7 items-center rounded-full bg-[#007aff] px-2.5 text-xs font-semibold text-white",
						children: workDay.week
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						disabled: !loaded,
						className: "h-7 rounded-full bg-title px-3 text-xs font-semibold text-on-dark disabled:opacity-40",
						onClick: () => {
							setCopyNote("만드는 중");
							copyCanvas(drawSummaryCapture(all, dpt, showEta)).then(() => setCopyNote("복사했습니다. 카톡에 붙여 넣으세요.")).catch((err) => setCopyNote(err instanceof Error ? err.message : "복사에 실패했습니다."));
						},
						children: "캡처 복사"
					}),
					copyNote ? /* @__PURE__ */ jsx("span", {
						className: "text-xs font-semibold text-title",
						children: copyNote
					}) : null
				]
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "mb-1 shrink-0 text-center text-[12px] text-muted",
				children: ["총 작업시간", /* @__PURE__ */ jsx("span", {
					className: "ml-1.5 text-[17px] font-semibold tabular-nums text-ink",
					children: whole.first == null ? "— ~ —" : `${formatHm(whole.first)} ~ ${formatHm(whole.last)}`
				})]
			}),
			!loaded ? /* @__PURE__ */ jsx(Hint, {}) : null,
			loaded && jobs.length === 0 ? /* @__PURE__ */ jsx(Hint, { text: emptyDpt(dpt) }) : null,
			/* @__PURE__ */ jsx("div", {
				className: "max-h-full min-h-0 max-w-full overflow-x-auto overflow-y-hidden rounded-2xl bg-white shadow-sm",
				children: /* @__PURE__ */ jsxs("table", {
					className: "w-max border-collapse text-center text-[13px]",
					children: [
						/* @__PURE__ */ jsx("caption", {
							className: "sr-only",
							children: "라인별 생산성"
						}),
						/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", {
							className: "text-[11px] font-semibold text-muted",
							children: [
								"라인",
								"작업건수",
								"완료",
								"잔여",
								"%",
								"시작",
								"끝",
								"시간",
								"건/hr",
								"순위",
								...showEta ? ["예상종료", "앞으로"] : []
							].map((label) => /* @__PURE__ */ jsx("th", {
								scope: "col",
								className: "whitespace-nowrap border-b border-black/10 px-2.5 py-1 text-center font-semibold",
								children: label
							}, label))
						}) }),
						/* @__PURE__ */ jsxs("tbody", { children: [/* @__PURE__ */ jsx(WholeRow, {
							whole,
							center: true,
							forecast: showEta,
							eta: whole.planned === 0 ? "—" : cast.unknown.length > 0 ? "몰라요" : formatWhen(cast.eta, cast.snapshot),
							ahead: whole.planned === 0 ? "—" : cast.left === 0 ? "끝남" : cast.unknown.length > 0 ? "몰라요" : formatAhead(wholeAhead)
						}), lines.map((row, index) => {
							const seen = forecasts[index];
							const etaMs = row.left > 0 ? seen?.eta ?? null : row.last;
							const ahead = row.planned === 0 ? "—" : row.left === 0 ? "끝남" : seen?.eta == null ? "몰라요" : formatAhead(seen.eta - (row.last ?? seen.eta));
							return /* @__PURE__ */ jsxs("tr", { children: [
							/* @__PURE__ */ jsx("th", {
								scope: "row",
								className: "border-b border-black/[0.06] px-2.5 py-1 text-center",
								children: /* @__PURE__ */ jsx("span", {
									className: `inline-flex min-w-16 justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${LINE_CLASS[row.line - 1]}`,
									children: LINE_LABELS[row.line - 1]
								})
							}),
							/* @__PURE__ */ jsx(Num, {
								center: true,
								children: num(row.planned)
							}),
							/* @__PURE__ */ jsx(Num, {
								center: true,
								children: num(row.done)
							}),
							/* @__PURE__ */ jsx(Num, {
								center: true,
								children: num(row.left)
							}),
							/* @__PURE__ */ jsx(Num, {
								center: true,
								children: pf.format(row.rate)
							}),
							/* @__PURE__ */ jsx(TimeCell, {
								center: true,
								ms: row.first
							}),
							/* @__PURE__ */ jsx(TimeCell, {
								center: true,
								ms: row.last,
								style: { background: finish(row.last) }
							}),
							/* @__PURE__ */ jsx(Num, {
								center: true,
								children: hrs(row.hours)
							}),
							/* @__PURE__ */ jsx(Num, {
								center: true,
								children: num(row.perHour)
							}),
							/* @__PURE__ */ jsx("td", {
								className: "border-b border-black/[0.06] px-2.5 py-1 text-center text-xs font-semibold",
								children: row.rank
							}),
							showEta ? /* @__PURE__ */ jsx("td", {
								className: "whitespace-nowrap border-b border-black/[0.06] px-2.5 py-1 text-center tabular-nums",
								style: { background: etaTone(row.left > 0 ? seen?.eta ?? null : null) },
								children: row.planned === 0 ? "—" : formatWhen(etaMs, cast.snapshot)
							}) : null,
							showEta ? /* @__PURE__ */ jsx("td", {
								className: "whitespace-nowrap border-b border-black/[0.06] px-2.5 py-1 text-center",
								children: ahead
							}) : null
						] }, row.line);
						})] })
					]
				})
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-1 shrink-0 text-center text-[10px] text-muted",
				children: showEta ? "총 작업시간은 쉬는 시간이 포함된 첫 완료~마지막 완료입니다. 예상종료는 건/hr 기준이고, 센터는 가장 늦은 라인입니다." : "총 작업시간은 쉬는 시간이 포함된 첫 완료~마지막 완료입니다. 순위는 건/hr입니다."
			})
		]
	});
}
function WholeRow({ whole, center = false, forecast = false, eta = "—", ahead = "—" }) {
	return /* @__PURE__ */ jsxs("tr", {
		className: center ? "bg-[#f2f2f7] font-semibold" : "bg-slate font-bold",
		children: [
			/* @__PURE__ */ jsx("th", {
				scope: "row",
				className: center ? "border-b border-black/[0.06] px-2.5 py-1 text-center" : "whitespace-nowrap border border-grid px-2 py-1.5 text-left",
				children: center ? /* @__PURE__ */ jsx("span", {
					className: "inline-flex min-w-16 justify-center rounded-full bg-header px-2 py-0.5 text-xs font-semibold text-on-dark",
					children: "전체"
				}) : "🏭 전체"
			}),
			/* @__PURE__ */ jsx(Num, {
				center,
				children: num(whole.planned)
			}),
			/* @__PURE__ */ jsx(Num, {
				center,
				children: num(whole.done)
			}),
			/* @__PURE__ */ jsx(Num, {
				center,
				children: num(whole.left)
			}),
			/* @__PURE__ */ jsx(Num, {
				center,
				children: pf.format(whole.rate)
			}),
			/* @__PURE__ */ jsx(TimeCell, {
				center,
				ms: whole.first
			}),
			/* @__PURE__ */ jsx(TimeCell, {
				center,
				ms: whole.last
			}),
			/* @__PURE__ */ jsx(Num, {
				center,
				children: hrs(whole.hours)
			}),
			/* @__PURE__ */ jsx(Num, {
				center,
				children: num(whole.perHour)
			}),
			/* @__PURE__ */ jsx("td", { className: center ? "border-b border-black/[0.06] px-3 py-2" : "border border-grid px-2 py-1.5" }),
			forecast ? /* @__PURE__ */ jsx("td", {
				className: center ? "whitespace-nowrap border-b border-black/[0.06] px-2.5 py-1 text-center tabular-nums" : "whitespace-nowrap border border-grid px-2 py-1.5 text-center tabular-nums",
				children: eta
			}) : null,
			forecast ? /* @__PURE__ */ jsx("td", {
				className: center ? "whitespace-nowrap border-b border-black/[0.06] px-2.5 py-1 text-center" : "whitespace-nowrap border border-grid px-2 py-1.5 text-center",
				children: ahead
			}) : null
		]
	});
}
function Num({ children, center = false }) {
	return /* @__PURE__ */ jsx("td", {
		className: center ? "whitespace-nowrap border-b border-black/[0.06] px-2.5 py-1 text-center tabular-nums" : "whitespace-nowrap border border-grid px-2 py-1.5 text-right tabular-nums",
		children
	});
}
function TimeCell({ ms, style, center = false }) {
	return /* @__PURE__ */ jsx("td", {
		className: center ? "whitespace-nowrap border-b border-black/[0.06] px-2.5 py-1 text-center tabular-nums" : "whitespace-nowrap border border-grid px-2 py-1.5 text-center tabular-nums",
		style,
		title: formatHms(ms),
		children: formatHm(ms)
	});
}
var GAUGE_DAIRY = "#007aff";
var GAUGE_FF2 = "#5ac8fa";
function gaugeJobs(all, dpt, centers) {
	const scoped = jobsForDpt(all, dpt);
	return centers.flatMap((id) => scoped[id] ?? []);
}
function CenterGauge({ label, parts }) {
	const planned = parts.reduce((sum, part) => sum + part.planned, 0);
	const done = parts.reduce((sum, part) => sum + part.done, 0);
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-2xl bg-[#f2f2f7] px-2.5 py-1.5",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-1.5 flex items-center gap-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: `inline-flex min-w-14 justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${CENTER_CLASS[label] ?? "bg-white text-ink"}`,
						children: label
					}),
					/* @__PURE__ */ jsx("span", {
						className: "min-w-0 flex-1 truncate text-[11px] font-medium text-[#8e8e93]",
						children: planned ? `할 일 ${num(planned)}  ·  끝낸 ${num(done)}  ·  남은 ${num(planned - done)}` : "할 일 —"
					}),
					/* @__PURE__ */ jsx("span", {
						className: "shrink-0 text-[15px] font-semibold tabular-nums text-[#1c1c1e]",
						children: planned ? pf.format(done / planned) : "—"
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex h-[7px] overflow-hidden rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]",
				children: parts.map((part) => /* @__PURE__ */ jsx("div", {
					className: "h-full",
					style: {
						width: planned ? `${part.done / planned * 100}%` : "0%",
						background: part.color
					}
				}, part.id))
			})
		]
	});
}
function ProgressGauge({ jobs: all }) {
	const [centers, setCenters] = useState(() => [...centerList()]);
	const [dpt, setDpt] = useState("전체");
	const list = centerList();
	const picked = list.filter((id) => centers.includes(id));
	const allOn = picked.length === list.length;
	const rows = useMemo(() => picked.map((id) => {
		const parts = dpt === "전체" ? [
			{ ...centerStat(id, gaugeJobs(all, "유제 냉장", [id])), id: "유제 냉장", color: GAUGE_DAIRY },
			{ ...centerStat(id, gaugeJobs(all, "FF2", [id])), id: "FF2", color: GAUGE_FF2 }
		] : [{
			...centerStat(id, gaugeJobs(all, dpt, [id])),
			id: dpt,
			color: dpt === "FF2" ? GAUGE_FF2 : GAUGE_DAIRY
		}];
		return { id, parts };
	}), [all, dpt, picked]);
	return /* @__PURE__ */ jsxs("div", {
		className: "mt-2 w-full shrink-0 rounded-2xl bg-white px-3 py-2.5 shadow-sm",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-1",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "px-1 text-[15px] font-semibold tracking-tight text-[#1c1c1e]",
						children: "작업 진척률"
					}),
					/* @__PURE__ */ jsx(CheckMenu, {
						label: "센터",
						soft: true,
						up: true,
						text: allOn ? "전체" : picked.length === 0 ? "선택 없음" : picked.join(", "),
						rows: [{
							id: "all",
							label: "전체",
							checked: allOn
						}, ...list.map((id) => ({
							id,
							label: id,
							checked: centers.includes(id)
						}))],
						onToggle: (id) => {
							if (id === "all") {
								setCenters(allOn ? [] : [...list]);
								return;
							}
							setCenters((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
						}
					}),
					/* @__PURE__ */ jsx(DptSelect, {
						value: dpt,
						onChange: setDpt,
						soft: true,
						up: true
					})
				]
			}),
			dpt === "전체" ? /* @__PURE__ */ jsxs("div", {
				className: "mt-2 flex items-center gap-1.5",
				children: [
					/* @__PURE__ */ jsxs("span", {
						className: "inline-flex items-center gap-1 rounded-full bg-[#f2f2f7] px-2 py-0.5 text-[11px] font-semibold text-[#3a3a3c]",
						children: [/* @__PURE__ */ jsx("span", { className: "inline-block size-1.5 rounded-full", style: { background: GAUGE_DAIRY } }), "유제 냉장"]
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "inline-flex items-center gap-1 rounded-full bg-[#f2f2f7] px-2 py-0.5 text-[11px] font-semibold text-[#3a3a3c]",
						children: [/* @__PURE__ */ jsx("span", { className: "inline-block size-1.5 rounded-full", style: { background: GAUGE_FF2 } }), "FF2"]
					})
				]
			}) : null,
			picked.length === 0 ? /* @__PURE__ */ jsx("p", {
				className: "mt-2 text-[12px] text-[#8e8e93]",
				children: "볼 센터를 체크해 주세요."
			}) : /* @__PURE__ */ jsx("div", {
				className: "mt-1.5 flex flex-col gap-1",
				children: rows.map((row) => /* @__PURE__ */ jsx(CenterGauge, {
					label: row.id,
					parts: row.parts
				}, row.id))
			})
		]
	});
}
function Compare({ jobs: all, loaded }) {
	const [dpt, setDpt] = useState("전체");
	const jobs = useMemo(() => jobsForDpt(all, dpt), [all, dpt]);
	const rows = useMemo(() => withCenterRanks(centerList().map((id) => centerStat(id, jobs[id] ?? []))), [jobs]);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-full min-h-0 w-full flex-col items-center overflow-auto px-2 py-1.5",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-1 flex max-w-full shrink-0 flex-wrap items-center justify-center gap-1",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "px-1 text-[15px] font-semibold tracking-tight text-ink",
					children: "센터비교"
				}), /* @__PURE__ */ jsx(DptSelect, {
					value: dpt,
					onChange: setDpt,
					compact: true
				})]
			}),
			!loaded ? /* @__PURE__ */ jsx(Hint, {}) : null,
			/* @__PURE__ */ jsx("div", {
				className: "max-w-full shrink-0 overflow-x-auto rounded-2xl bg-white shadow-sm",
				children: /* @__PURE__ */ jsxs("table", {
					className: "w-max border-collapse text-center text-[13px]",
					children: [
						/* @__PURE__ */ jsx("caption", {
							className: "sr-only",
							children: "센터 비교"
						}),
						/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", {
							className: "text-[11px] font-semibold text-muted",
							children: [
								"센터",
								"할 일",
								"끝낸 일",
								"남은 일",
								"%",
								"시작",
								"끝",
								"시간",
								"건/hr",
								"순위"
							].map((label) => /* @__PURE__ */ jsx("th", {
								scope: "col",
								className: "whitespace-nowrap border-b border-black/10 px-2.5 py-1 text-center font-semibold",
								children: label
							}, label))
						}) }),
						/* @__PURE__ */ jsx("tbody", { children: rows.map((row) => /* @__PURE__ */ jsxs("tr", { children: [
							/* @__PURE__ */ jsx("th", {
								scope: "row",
								className: "border-b border-black/[0.06] px-2.5 py-1 text-center",
								children: /* @__PURE__ */ jsx("span", {
									className: `inline-flex min-w-16 justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${CENTER_CLASS[row.id]}`,
									children: CENTER_LABELS[row.id]
								})
							}),
							/* @__PURE__ */ jsx(Num, {
								center: true,
								children: num(row.planned)
							}),
							/* @__PURE__ */ jsx(Num, {
								center: true,
								children: num(row.done)
							}),
							/* @__PURE__ */ jsx(Num, {
								center: true,
								children: num(row.left)
							}),
							/* @__PURE__ */ jsx(Num, {
								center: true,
								children: pf.format(row.rate)
							}),
							/* @__PURE__ */ jsx(TimeCell, {
								center: true,
								ms: row.first
							}),
							/* @__PURE__ */ jsx(TimeCell, {
								center: true,
								ms: row.last
							}),
							/* @__PURE__ */ jsx(Num, {
								center: true,
								children: hrs(row.hours)
							}),
							/* @__PURE__ */ jsx(Num, {
								center: true,
								children: num(row.perHour)
							}),
							/* @__PURE__ */ jsx("td", {
								className: "border-b border-black/[0.06] px-2.5 py-1 text-center text-xs font-semibold",
								children: row.rank
							})
						] }, row.id)) })
					]
				})
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-2 shrink-0 text-center text-[11px] text-muted",
				children: "순위는 한 시간에 끝낸 건수입니다."
			}),
			/* @__PURE__ */ jsx(ProgressGauge, { jobs: all })
		]
	});
}
function TimeView({ jobs: all, loaded }) {
	const [center, setCenter] = useState("1센터");
	const [dpt, setDpt] = useState("전체");
	const [minutes, setMinutes] = useState(15);
	const jobs = useMemo(() => jobsOf(all, center, dpt), [
		all,
		center,
		dpt
	]);
	const ready = (all[center]?.length ?? 0) > 0;
	const planned = jobs.length;
	const lineN = lineCountOf(center);
	const rows = useMemo(() => buckets(jobs, minutes, planned), [
		jobs,
		minutes,
		planned
	]);
	const averages = useMemo(() => lineAverages(rows).slice(0, lineN), [rows, lineN]);
	const done = rows.length ? rows[rows.length - 1].cumulative : 0;
	const avgSlice = rows.length ? rows.reduce((sum, row) => sum + row.sliceRate, 0) / rows.length : 0;
	const countColor = useMemo(() => heatScale(rows.map((row) => row.count)), [rows]);
	const lineColor = useMemo(() => Array.from({ length: lineN }, (_, index) => heatScale(rows.map((row) => row.lines[index]))), [rows, lineN]);
	const first = rows[0]?.start ?? null;
	const last = jobs.reduce((max, job) => job.at != null && (max == null || job.at > max) ? job.at : max, null);
	const [printReady, setPrintReady] = useState(false);
	const [printJob, setPrintJob] = useState(0);
	useEffect(() => {
		setPrintReady(true);
	}, []);
	const printedAt = printJob ? (/* @__PURE__ */ new Date()).toLocaleString("ko-KR", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	}) : "";
	useEffect(() => {
		if (!printJob) return;
		document.body.classList.add("print-time");
		const done = () => {
			document.body.classList.remove("print-time");
			window.removeEventListener("afterprint", done);
		};
		window.addEventListener("afterprint", done);
		window.print();
		return done;
	}, [printJob]);
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("div", {
		className: "ios-sheet",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "sticky top-0 z-20 flex items-center gap-2 border-b border-black/5 bg-white/90 px-3 py-2 backdrop-blur",
				children: [/* @__PURE__ */ jsx("p", {
					className: "min-w-0 flex-1 truncate text-[17px] font-semibold text-[#1c1c1e]",
					children: "시간별 확인"
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold disabled:opacity-40",
					disabled: !loaded || rows.length === 0,
					onClick: () => setPrintJob((job) => job + 1),
					children: "인쇄"
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-2 px-3 py-3",
				children: [
					/* @__PURE__ */ jsx(CenterSelect, {
						value: center,
						onChange: setCenter
					}),
					/* @__PURE__ */ jsx(DptSelect, {
						value: dpt,
						onChange: setDpt
					}),
					/* @__PURE__ */ jsx(PickMenu, {
						label: "구간(분)",
						value: String(minutes),
						onChange: (id) => setMinutes(Number(id)),
						options: [10, 15, 30, 60].map((step) => ({ id: String(step), label: String(step) }))
					})
				]
			}),
			!loaded ? /* @__PURE__ */ jsx(Hint, {}) : null,
			loaded && jobs.length === 0 ? /* @__PURE__ */ jsx(Hint, { text: emptyDpt(dpt) }) : null,
			/* @__PURE__ */ jsx("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ jsxs("table", {
					className: "w-full min-w-[1100px] border-collapse text-sm",
					children: [/* @__PURE__ */ jsx("caption", {
						className: "sr-only",
						children: "시간별 확인"
					}), /* @__PURE__ */ jsxs("tbody", { children: [
						/* @__PURE__ */ jsxs("tr", { children: [
							/* @__PURE__ */ jsx("th", {
								className: "border border-grid px-2 py-2 text-left font-bold",
								children: "시작"
							}),
							/* @__PURE__ */ jsx("td", {
								className: "border border-grid px-2 py-2 text-center font-bold tabular-nums",
								children: formatHm(first)
							}),
							/* @__PURE__ */ jsx("th", {
								className: "border border-grid px-2 py-2 text-left font-bold",
								children: "마지막"
							}),
							/* @__PURE__ */ jsx("td", {
								className: "border border-grid px-2 py-2 text-center font-bold tabular-nums",
								title: formatHms(last),
								children: formatHm(last)
							}),
							/* @__PURE__ */ jsx("td", {
								className: "border border-grid",
								colSpan: 4
							}),
							/* @__PURE__ */ jsx("td", {
								className: "border border-grid",
								colSpan: lineN
							})
						] }),
						/* @__PURE__ */ jsxs("tr", { children: [
							/* @__PURE__ */ jsx("th", {
								className: "border border-grid px-2 py-2 text-left font-bold",
								children: "계획"
							}),
							/* @__PURE__ */ jsx("td", {
								className: "border border-grid px-2 py-2 text-right font-bold tabular-nums",
								children: num(planned)
							}),
							/* @__PURE__ */ jsx("td", {
								className: "border border-grid",
								colSpan: 5
							}),
							/* @__PURE__ */ jsx("td", {
								className: "border border-grid bg-line-4 px-2 py-2 text-center text-sm font-bold",
								children: "평균 %"
							}),
							/* @__PURE__ */ jsxs("td", {
								className: "border border-grid bg-ice px-2 py-2 text-center text-base font-bold text-title",
								colSpan: lineN,
								children: [
									"📊",
									minutes,
									"분별 평균작업건수"
								]
							})
						] }),
						/* @__PURE__ */ jsxs("tr", { children: [
							/* @__PURE__ */ jsx("th", {
								className: "border border-grid px-2 py-2 text-left font-bold",
								children: "완료"
							}),
							/* @__PURE__ */ jsx("td", {
								className: "border border-grid px-2 py-2 text-right font-bold tabular-nums",
								children: num(done)
							}),
							/* @__PURE__ */ jsx("td", {
								className: "border border-grid",
								colSpan: 5
							}),
							/* @__PURE__ */ jsx("td", {
								className: "border border-grid bg-line-4 px-2 py-2 text-right font-bold tabular-nums",
								children: loaded && rows.length > 0 ? pf.format(avgSlice) : ""
							}),
							averages.map((value, index) => /* @__PURE__ */ jsx("td", {
								className: `border border-grid px-2 py-2 text-right font-bold tabular-nums ${LINE_CLASS[index]}`,
								children: ready ? num(value) : ""
							}, index))
						] }),
						/* @__PURE__ */ jsxs("tr", {
							className: "bg-header text-on-dark",
							children: [[
								"구간시작",
								"구간종료",
								"건수",
								"시간당",
								"누적",
								"총%",
								"피킹",
								"구간%"
							].map((label) => /* @__PURE__ */ jsx("th", {
								scope: "col",
								className: "whitespace-nowrap border border-header px-2 py-2 font-bold " + (label === "구간%" ? "bg-line-4" : ""),
								children: label
							}, label)), LINE_LABELS.slice(0, lineN).map((label, index) => /* @__PURE__ */ jsxs("th", {
								scope: "col",
								className: `whitespace-nowrap border border-grid px-2 py-2 font-bold ${LINE_CLASS[index]}`,
								children: [index + 1, "라인"]
							}, label))]
						}),
						rows.map((row) => /* @__PURE__ */ jsx(BucketRow, {
							row,
							countColor,
							lineColor,
							lineCount: lineN
						}, row.start))
					] })]
				})
			}),
			/* @__PURE__ */ jsx("p", {
				className: "px-3 py-3 text-xs text-muted",
				children: "색이 진할수록 그 구간에 많이 처리한 것입니다. 총%는 처음부터 쌓인 비율, 구간%는 그 구간만의 비율입니다. 평균 %는 구간%를 평균 낸 값입니다. 인쇄는 지금 고른 센터, DPT, 구간만 나갑니다."
			})
		]
	}), printReady ? createPortal(/* @__PURE__ */ jsxs("section", {
		className: "time-print",
		"aria-hidden": printJob === 0,
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "time-print-head",
				children: [
					/* @__PURE__ */ jsx("p", { children: "센터 생산성" }),
					/* @__PURE__ */ jsx("h1", { children: "시간별 확인" }),
					/* @__PURE__ */ jsxs("p", { children: [center, " · ", dpt, " · ", minutes, "분", printedAt ? ` · 출력 ${printedAt}` : ""] })
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "time-print-sums",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("strong", { children: formatHm(first) || "—" }), /* @__PURE__ */ jsx("span", { children: "시작" })] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("strong", { children: formatHm(last) || "—" }), /* @__PURE__ */ jsx("span", { children: "마지막" })] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("strong", { children: num(planned) }), /* @__PURE__ */ jsx("span", { children: "계획" })] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("strong", { children: num(done) }), /* @__PURE__ */ jsx("span", { children: "완료" })] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("strong", { children: rows.length ? pf.format(avgSlice) : "—" }), /* @__PURE__ */ jsx("span", { children: "평균 %" })] })
				]
			}),
			/* @__PURE__ */ jsxs("table", { children: [
				/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
					["구간시작", "구간종료", "건수", "시간당", "누적", "총%", "피킹", "구간%"].map((label) => /* @__PURE__ */ jsx("th", { children: label }, label)),
					LINE_LABELS.slice(0, lineN).map((label, index) => /* @__PURE__ */ jsx("th", { children: `${index + 1}라인` }, label))
				] }) }),
				/* @__PURE__ */ jsx("tbody", { children: rows.map((row) => /* @__PURE__ */ jsxs("tr", { children: [
					/* @__PURE__ */ jsx("td", { children: formatHm(row.start) }),
					/* @__PURE__ */ jsx("td", { children: formatHm(row.end) }),
					/* @__PURE__ */ jsx("td", { style: { background: countColor(row.count) }, children: num(row.count) }),
					/* @__PURE__ */ jsx("td", { children: num(row.perHour) }),
					/* @__PURE__ */ jsx("td", { children: num(row.cumulative) }),
					/* @__PURE__ */ jsx("td", { children: pf.format(row.totalRate) }),
					/* @__PURE__ */ jsx("td", { children: num(row.pickQty) }),
					/* @__PURE__ */ jsx("td", { children: pf.format(row.sliceRate) }),
					row.lines.slice(0, lineN).map((value, index) => /* @__PURE__ */ jsx("td", {
						style: { background: lineColor[index]?.(value) },
						children: num(value)
					}, index))
				] }, row.start)) })
			] })
		]
	}), document.body) : null] });
}
function BucketRow({ row, countColor, lineColor, lineCount }) {
	return /* @__PURE__ */ jsxs("tr", { children: [
		/* @__PURE__ */ jsx("td", {
			className: "border border-grid px-2 py-1 text-center tabular-nums",
			children: formatHm(row.start)
		}),
		/* @__PURE__ */ jsx("td", {
			className: "border border-grid px-2 py-1 text-center tabular-nums",
			children: formatHm(row.end)
		}),
		/* @__PURE__ */ jsx("td", {
			className: "border border-grid px-2 py-1 text-right tabular-nums",
			style: { background: countColor(row.count) },
			children: num(row.count)
		}),
		/* @__PURE__ */ jsx("td", {
			className: "border border-grid px-2 py-1 text-right tabular-nums",
			children: num(row.perHour)
		}),
		/* @__PURE__ */ jsx("td", {
			className: "border border-grid px-2 py-1 text-right tabular-nums",
			children: num(row.cumulative)
		}),
		/* @__PURE__ */ jsx("td", {
			className: "border border-grid px-2 py-1 text-right tabular-nums",
			children: pf.format(row.totalRate)
		}),
		/* @__PURE__ */ jsx("td", {
			className: "border border-grid px-2 py-1 text-right tabular-nums",
			children: num(row.pickQty)
		}),
		/* @__PURE__ */ jsx("td", {
			className: "border border-grid px-2 py-1 text-right tabular-nums",
			children: pf.format(row.sliceRate)
		}),
		row.lines.slice(0, lineCount).map((value, index) => /* @__PURE__ */ jsx("td", {
			className: "border border-grid px-2 py-1 text-right tabular-nums",
			style: { background: lineColor[index]?.(value) },
			children: num(value)
		}, index))
	] });
}
function rateBar(rate) {
	if (rate >= 1) return "bg-line-3";
	if (rate >= .7) return "bg-line-4";
	if (rate >= .4) return "bg-line-2";
	return "bg-line-1";
}
function workSpan(ms) {
	if (ms == null || ms < 0) return "—";
	const minutes = Math.round(ms / 60000);
	if (minutes <= 0) return "1분 미만";
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours <= 0) return `${rest}분`;
	if (rest === 0) return `${hours}시간`;
	return `${hours}시간 ${rest}분`;
}
function clockNeedle(raw) {
	const text = String(raw ?? "").trim();
	const parts = text.split(":").map((part) => part.trim());
	if (parts.length >= 2 && parts.length <= 3 && parts.every((part) => /^\d{1,2}$/.test(part))) return parts.map((part) => part.padStart(2, "0")).join(":");
	return text;
}
function clockHit(ms, needle) {
	if (!needle || ms == null) return false;
	const clock = formatHms(ms);
	const parts = needle.split(":");
	if (parts.length >= 3) return clock === needle;
	if (parts.length === 2) return clock.slice(0, 5) === needle;
	return clock.includes(needle);
}
function lineStoreTimes(picks) {
	const map = new Map();
	for (const pick of picks) {
		const clock = pick.at == null ? "" : formatHms(pick.at);
		const key = `${pick.code}|${pick.store}|${clock}`;
		let row = map.get(key);
		if (!row) {
			row = {
				key,
				store: pick.store,
				code: pick.code,
				loc: pick.loc || "",
				at: pick.at,
				count: 0,
				qty: 0,
				doneQty: 0
			};
			map.set(key, row);
		}
		if (!row.loc && pick.loc) row.loc = pick.loc;
		row.count += 1;
		row.qty += pick.qty || 0;
		row.doneQty += pick.pickQty || 0;
	}
	return [...map.values()].sort((a, b) => {
		if (a.at == null && b.at == null) return a.store.localeCompare(b.store, "ko");
		if (a.at == null) return 1;
		if (b.at == null) return -1;
		return a.at - b.at || a.store.localeCompare(b.store, "ko");
	});
}
function WorkedView({ jobs: all, loaded }) {
	const [centers, setCenters] = useState(() => [...centerList()]);
	const [dpt, setDpt] = useState("전체");
	const [lines, setLines] = useState(() => lineChoices(centerList()));
	const [query, setQuery] = useState("");
	const [storeQuery, setStoreQuery] = useState("");
	const [endQuery, setEndQuery] = useState("");
	const [sortKey, setSortKey] = useState("last");
	const [sortDir, setSortDir] = useState("desc");
	const [openKey, setOpenKey] = useState("");
	const [lineSheet, setLineSheet] = useState(null);
	const [workedMode, setWorkedMode] = useState("상품");
	const [storeSort, setStoreSort] = useState("last");
	const [storeDir, setStoreDir] = useState("desc");
	const [storeSheet, setStoreSheet] = useState(null);
	const [goodsSort, setGoodsSort] = useState("last");
	const [goodsDir, setGoodsDir] = useState("desc");
	useEffect(() => {
		if (!storeSheet && !lineSheet) return;
		const onKey = (event) => {
			if (event.key !== "Escape") return;
			setStoreSheet(null);
			setLineSheet(null);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [storeSheet, lineSheet]);
	const rows = useMemo(() => {
		const choices = lineChoices(centers);
		const allLines = choices.every((n) => lines.includes(n));
		const allow = new Set(lines);
		const list = [];
		for (const id of centerList()) {
			if (!centers.includes(id)) continue;
			const map = new Map();
			const lineMax = lineCountOf(id);
			for (const job of all[id] ?? []) {
				if (dpt !== "전체" && !matchDpt(job.route, dpt)) continue;
				const code = job.goodsCd || "";
				const name = job.goodsNm || "상품없음";
				const key = `${id}|${code}|${name}`;
				let row = map.get(key);
				if (!row) {
					row = {
						key,
						center: id,
						code,
						name,
						byLine: new Map()
					};
					map.set(key, row);
				}
				let cell = row.byLine.get(job.line);
				if (!cell) {
					cell = { line: job.line, planned: 0, done: 0, qty: 0, doneQty: 0, first: null, last: null, picks: [] };
					row.byLine.set(job.line, cell);
				}
				cell.planned += 1;
				const need = job.orderQty || 0;
				const picked = job.qty || 0;
				const ordered = need || picked;
				const full = job.at != null && picked > 0 && (need <= 0 || picked >= need);
				cell.qty += ordered;
				cell.doneQty += full ? picked : 0;
				cell.picks.push({
					store: job.storeNm || "점포없음",
					code: job.storeCd || "",
					loc: job.location || "",
					at: job.at,
					qty: ordered,
					pickQty: full ? picked : 0
				});
				if (full) {
					cell.done += 1;
					if (cell.first == null || job.at < cell.first) cell.first = job.at;
					if (cell.last == null || job.at > cell.last) cell.last = job.at;
				}
			}
			const narrowed = !allLines;
			for (const row of map.values()) {
				let planned = 0;
				let qty = 0;
				let doneCount = 0;
				let first = null;
				let last = null;
				for (const cell of row.byLine.values()) {
					if (narrowed && !allow.has(cell.line)) continue;
					planned += cell.planned;
					qty += cell.qty;
					doneCount += cell.done;
					if (cell.first != null && (first == null || cell.first < first)) first = cell.first;
					if (cell.last != null && (last == null || cell.last > last)) last = cell.last;
				}
				if (planned === 0) continue;
				row.planned = planned;
				row.qty = qty;
				row.done = doneCount;
				row.left = planned - doneCount;
				row.first = first;
				row.last = last;
				row.span = first != null && last != null ? last - first : null;
				row.lineTimes = Array.from({ length: lineMax }, (_, index) => index + 1).filter((line) => !narrowed || allow.has(line)).map((line) => {
					const cell = row.byLine.get(line);
					const cellPlanned = cell?.planned ?? 0;
					const cellDone = cell?.done ?? 0;
					return {
						line,
						planned: cellPlanned,
						qty: cell?.qty ?? 0,
						doneQty: cell?.doneQty ?? 0,
						done: cellDone,
						left: cellPlanned - cellDone,
						first: cell?.first ?? null,
						last: cell?.last ?? null,
						picks: cell?.picks ?? []
					};
				});
				list.push(row);
			}
		}
		const needle = query.trim().toLowerCase();
		const endNeedle = clockNeedle(endQuery);
		const picked = list.filter((row) => {
			if (needle && !row.name.toLowerCase().includes(needle) && !row.code.toLowerCase().includes(needle)) return false;
			if (endNeedle && !row.lineTimes.some((cell) => cell.picks.some((pick) => clockHit(pick.at, endNeedle)))) return false;
			return true;
		});
		const dir = sortDir === "asc" ? 1 : -1;
		picked.sort((a, b) => {
			const text = sortKey === "name" || sortKey === "center" || sortKey === "code";
			if (text) return String(a[sortKey]).localeCompare(String(b[sortKey]), "ko") * dir || a.name.localeCompare(b.name, "ko");
			return ((a[sortKey] ?? -1) - (b[sortKey] ?? -1)) * dir || a.name.localeCompare(b.name, "ko");
		});
		return picked;
	}, [all, centers, dpt, lines, query, endQuery, sortKey, sortDir]);
	const storeRows = useMemo(() => {
		const choices = lineChoices(centers);
		const allLines = choices.every((n) => lines.includes(n));
		const allow = new Set(lines);
		const map = new Map();
		for (const id of centerList()) {
			if (!centers.includes(id)) continue;
			for (const job of all[id] ?? []) {
				if (dpt !== "전체" && !matchDpt(job.route, dpt)) continue;
				if (!allLines && !allow.has(job.line)) continue;
				const code = job.storeCd || "";
				const name = job.storeNm || "점포없음";
				const key = `${id}|${code}|${name}`;
				let row = map.get(key);
				if (!row) {
					row = { key, center: id, code, name, goods: new Map() };
					map.set(key, row);
				}
				const gcode = job.goodsCd || "";
				const gname = job.goodsNm || "상품없음";
				const gkey = `${gcode}|${gname}`;
				let goods = row.goods.get(gkey);
				if (!goods) {
					goods = { key: gkey, code: gcode, name: gname, qty: 0, doneQty: 0, last: null, times: [] };
					row.goods.set(gkey, goods);
				}
				const need = job.orderQty || 0;
				const picked = job.qty || 0;
				const ordered = need || picked;
				const full = job.at != null && picked > 0 && (need <= 0 || picked >= need);
				goods.qty += ordered;
				if (full) {
					goods.doneQty += picked;
					goods.times.push(job.at);
					if (goods.last == null || job.at > goods.last) goods.last = job.at;
				}
			}
		}
		const needle = query.trim().toLowerCase();
		const storeNeedle = storeQuery.trim().toLowerCase();
		const endNeedle = clockNeedle(endQuery);
		const list = [];
		for (const row of map.values()) {
			if (storeNeedle && !row.name.toLowerCase().includes(storeNeedle) && !row.code.toLowerCase().includes(storeNeedle)) continue;
			let goods = [...row.goods.values()];
			const storeHit = !needle || row.name.toLowerCase().includes(needle) || row.code.toLowerCase().includes(needle);
			if (needle && !storeHit) goods = goods.filter((item) => item.name.toLowerCase().includes(needle) || item.code.toLowerCase().includes(needle));
			if (endNeedle) goods = goods.filter((item) => item.times.some((ms) => clockHit(ms, endNeedle)));
			if (goods.length === 0) continue;
			goods.sort((a, b) => (b.last ?? -1) - (a.last ?? -1) || a.name.localeCompare(b.name, "ko"));
			list.push({
				key: row.key,
				center: row.center,
				code: row.code,
				name: row.name,
				qty: goods.reduce((sum, item) => sum + item.qty, 0),
				doneQty: goods.reduce((sum, item) => sum + item.doneQty, 0),
				last: goods.reduce((max, item) => item.last != null && (max == null || item.last > max) ? item.last : max, null),
				goods
			});
		}
		const dir = storeDir === "asc" ? 1 : -1;
		list.sort((a, b) => {
			if (storeSort === "name" || storeSort === "center" || storeSort === "code") return String(a[storeSort]).localeCompare(String(b[storeSort]), "ko") * dir || a.name.localeCompare(b.name, "ko");
			return ((a[storeSort] ?? -1) - (b[storeSort] ?? -1)) * dir || a.name.localeCompare(b.name, "ko");
		});
		return list;
	}, [all, centers, dpt, lines, query, storeQuery, endQuery, storeSort, storeDir]);
	const done = rows.reduce((sum, row) => sum + row.done, 0);
	const first = rows.reduce((min, row) => row.first != null && (min == null || row.first < min) ? row.first : min, null);
	const last = rows.reduce((max, row) => row.last != null && (max == null || row.last > max) ? row.last : max, null);
	const allCenters = centerList().every((id) => centers.includes(id));
	const lineChoicesNow = lineChoices(centers);
	const pickedLines = lines.filter((n) => lineChoicesNow.includes(n));
	const allLines = lineChoicesNow.every((n) => lines.includes(n));
	function toggleSort(key) {
		if (sortKey === key) setSortDir((dir) => dir === "asc" ? "desc" : "asc");
		else {
			setSortKey(key);
			setSortDir(key === "name" || key === "center" || key === "code" ? "asc" : "desc");
		}
	}
	function mark(key, label) {
		return /* @__PURE__ */ jsx("th", {
			scope: "col",
			className: "whitespace-nowrap border border-header p-0 text-center font-bold",
			children: /* @__PURE__ */ jsxs("button", {
				type: "button",
				className: "font-bold text-on-dark",
				onClick: () => toggleSort(key),
				children: [label, sortKey === key ? sortDir === "asc" ? " ▲" : " ▼" : ""]
			})
		}, key);
	}
	const timeNeedle = clockNeedle(endQuery);
	const lineRows = lineSheet ? lineSheet.rows.filter((item) => !timeNeedle || clockHit(item.at, timeNeedle)) : [];
	const storeGoods = storeSheet ? storeSheet.goods.filter((item) => !timeNeedle || (item.times ?? []).some((ms) => clockHit(ms, timeNeedle)) || clockHit(item.last, timeNeedle)).sort((a, b) => {
		const dir = goodsDir === "asc" ? 1 : -1;
		if (goodsSort === "name" || goodsSort === "code") return String(a[goodsSort] ?? "").localeCompare(String(b[goodsSort] ?? ""), "ko", { numeric: true }) * dir || a.name.localeCompare(b.name, "ko");
		return ((a[goodsSort] ?? -1) - (b[goodsSort] ?? -1)) * dir || a.name.localeCompare(b.name, "ko");
	}) : [];
	return /* @__PURE__ */ jsxs("div", {
		className: "ios-sheet",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "sticky top-0 z-20 flex items-center gap-3 border-b border-black/5 bg-white/90 px-3 py-2 backdrop-blur",
				children: [/* @__PURE__ */ jsx("p", {
					className: "min-w-0 flex-1 truncate text-[17px] font-semibold text-[#1c1c1e]",
					children: "작업 상품"
				}), /* @__PURE__ */ jsxs("div", {
					className: "relative flex h-7 w-[132px] shrink-0 rounded-full bg-[#e5e5ea] p-0.5",
					children: [/* @__PURE__ */ jsx("span", {
						className: "absolute top-0.5 left-0.5 h-6 w-[64px] rounded-full bg-white shadow-sm transition-transform duration-200",
						style: { transform: workedMode === "점포" ? "translateX(64px)" : "translateX(0)" }
					}), ["상품", "점포"].map((id) => /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "relative z-10 h-6 w-[64px] text-xs font-semibold " + (workedMode === id ? "text-[#1c1c1e]" : "text-[#8e8e93]"),
						onClick: () => {
							setWorkedMode(id);
							setStoreSheet(null);
						},
						children: id
					}, id))]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-2 px-3 py-3",
				children: [/* @__PURE__ */ jsx(CheckMenu, {
					label: "센터",
					text: allCenters ? "전체" : centers.length === 0 ? "선택 없음" : centers.join(", "),
					rows: centerList().map((id) => ({
						id,
						label: id,
						checked: centers.includes(id)
					})),
					onToggle: (id) => {
						setCenters((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id].sort((a, b) => centerList().indexOf(a) - centerList().indexOf(b)));
					}
				}), /* @__PURE__ */ jsx(DptSelect, {
					value: dpt,
					onChange: setDpt
				}), /* @__PURE__ */ jsx(CheckMenu, {
					label: "라인",
					text: allLines ? "전체" : pickedLines.length === 0 ? "선택 없음" : pickedLines.map((n) => `${n}라인`).join(", "),
					rows: [{ id: "all", label: "전체", checked: allLines }, ...lineChoicesNow.map((n) => ({
						id: String(n),
						label: LINE_LABELS[n - 1].replace(/^\S+\s/, ""),
						checked: lines.includes(n),
						swatch: LINE_TONE[n - 1]
					}))],
					onToggle: (id) => {
						if (id === "all") {
							setLines(allLines ? lines.filter((n) => !lineChoicesNow.includes(n)) : [...new Set([...lines, ...lineChoicesNow])]);
							return;
						}
						const n = Number(id);
						setLines((current) => current.includes(n) ? current.filter((item) => item !== n) : [...current, n].sort((a, b) => a - b));
					}
				}), workedMode === "점포" ? /* @__PURE__ */ jsx("input", {
					type: "search",
					value: storeQuery,
					onChange: (event) => setStoreQuery(event.target.value),
					placeholder: "점포 검색",
					"aria-label": "점포 검색",
					className: "h-10 w-40 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none placeholder:text-[#8e8e93]"
				}) : null, /* @__PURE__ */ jsx("input", {
					type: "text",
					inputMode: "search",
					value: query,
					onChange: (event) => setQuery(event.target.value),
					placeholder: "상품명 또는 바코드",
					"aria-label": "상품 검색",
					className: "h-10 w-52 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none placeholder:text-[#8e8e93]"
				}), /* @__PURE__ */ jsx("input", {
					type: "text",
					value: endQuery,
					onChange: (event) => setEndQuery(event.target.value),
					placeholder: "00:00:00",
					"aria-label": "작업 종료 시간 검색",
					className: "h-10 w-40 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none placeholder:text-[#8e8e93]"
				})]
			}),
			!loaded ? /* @__PURE__ */ jsx(Hint, { text: "위에서 올린 엑셀의 상품명과 작업 시각으로 봅니다." }) : null,
			loaded && centers.length === 0 ? /* @__PURE__ */ jsx(Hint, { text: "볼 센터를 체크해 주세요." }) : null,
			loaded && centers.length > 0 && pickedLines.length === 0 ? /* @__PURE__ */ jsx(Hint, { text: "선택한 라인이 없습니다. 라인 필터에서 다시 체크해 주세요." }) : null,
			loaded && centers.length > 0 && pickedLines.length > 0 && (workedMode === "점포" ? storeRows.length : rows.length) === 0 ? /* @__PURE__ */ jsx(Hint, { text: query.trim() || storeQuery.trim() || endQuery.trim() ? "검색한 상품이 없습니다." : "선택한 센터, DPT, 라인에서 상품이 없습니다." }) : null,
			/* @__PURE__ */ jsx("div", {
				className: "stat-tiles grid gap-2 px-3 pb-3 sm:grid-cols-4",
				children: [
					["상품", num(rows.length), "bg-title text-on-dark"],
					["완료건수", num(done), "bg-line-3 text-ink"],
					["시작", first == null ? "—" : formatHm(first), "bg-header text-on-dark"],
					["끝", last == null ? "—" : formatHm(last), "bg-line-5 text-on-dark"]
				].map(([label, value, color]) => /* @__PURE__ */ jsxs("div", {
					className: `rounded-md px-3 py-3 ${color}`,
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-xs font-bold",
						children: label
					}), /* @__PURE__ */ jsx("p", {
						className: "text-2xl font-bold tabular-nums",
						children: loaded ? value : "—"
					})]
				}, label))
			}),
			workedMode === "점포" ? /* @__PURE__ */ jsx("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ jsxs("table", {
					className: "col-mid w-full min-w-[760px] border-collapse text-sm",
					children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", {
						className: "bg-header text-on-dark",
						children: [["center", "센터"], ["name", "점포명"], ["qty", "작업수량"], ["doneQty", "작업완료수량"], ["last", "작업종료"]].map(([key, label]) => /* @__PURE__ */ jsx("th", {
							className: "whitespace-nowrap border border-header p-0 text-center font-bold",
							children: /* @__PURE__ */ jsxs("button", {
								type: "button",
								className: "font-bold text-on-dark",
								onClick: () => {
									if (storeSort === key) setStoreDir((dir) => dir === "asc" ? "desc" : "asc");
									else {
										setStoreSort(key);
										setStoreDir(key === "name" || key === "center" ? "asc" : "desc");
									}
								},
								children: [label, storeSort === key ? storeDir === "asc" ? " ▲" : " ▼" : ""]
							})
						}, key))
					}) }), /* @__PURE__ */ jsx("tbody", { children: storeRows.map((row) => /* @__PURE__ */ jsxs("tr", {
						children: [
							/* @__PURE__ */ jsx("th", {
								className: "whitespace-nowrap border border-grid px-2 py-1.5",
								children: /* @__PURE__ */ jsx("span", {
									className: `inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${CENTER_CLASS[row.center]}`,
									children: row.center
								})
							}),
							/* @__PURE__ */ jsx("td", {
								className: "border border-grid p-0 font-bold",
								children: /* @__PURE__ */ jsx("button", {
									type: "button",
									className: "block w-full px-2 py-1.5 text-left font-bold text-title underline-offset-2 hover:underline",
									onClick: () => setStoreSheet(row),
									children: [row.code, row.name].filter(Boolean).join(" ")
								})
							}),
							/* @__PURE__ */ jsx("td", {
								className: "border border-grid px-2 py-1.5 text-center tabular-nums",
								children: num(row.qty)
							}),
							/* @__PURE__ */ jsx("td", {
								className: "border border-grid px-2 py-1.5 text-center tabular-nums",
								children: num(row.doneQty)
							}),
							/* @__PURE__ */ jsx("td", {
								className: "whitespace-nowrap border border-grid px-2 py-1.5 text-center font-bold tabular-nums",
								children: formatHm(row.last) || "—"
							})
						]
					}, row.key)) })]
				})
			}) : /* @__PURE__ */ jsx("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ jsxs("table", {
					className: "col-mid w-full min-w-[1080px] border-collapse text-sm",
					children: [
						/* @__PURE__ */ jsx("caption", {
							className: "sr-only",
							children: "작업 상품 시간"
						}),
						/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", {
							className: "bg-header text-left text-on-dark",
							children: [
								mark("center", "센터"),
								mark("code", "바코드"),
								mark("name", "상품"),
								mark("qty", "작업수량"),
								mark("planned", "총건수"),
								mark("done", "완료"),
								mark("left", "미완료"),
								mark("first", "시작"),
								mark("last", "종료"),
								mark("span", "작업시간")
							]
						}) }),
						/* @__PURE__ */ jsx("tbody", { children: rows.map((row) => /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("tr", {
							className: openKey === row.key ? "bg-ice" : void 0,
							children: [
								/* @__PURE__ */ jsx("th", {
									scope: "row",
									className: "whitespace-nowrap border border-grid px-2 py-1.5",
									children: /* @__PURE__ */ jsx("span", {
										className: `inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${CENTER_CLASS[row.center]}`,
										children: row.center
									})
								}),
								/* @__PURE__ */ jsx("td", {
									className: "whitespace-nowrap border border-grid px-2 py-1.5 tabular-nums",
									children: row.code || "—"
								}),
								/* @__PURE__ */ jsx("td", {
									className: "border border-grid p-0 font-bold",
									children: /* @__PURE__ */ jsx("span", {
										role: "button",
										tabIndex: 0,
										className: "block w-full cursor-pointer select-text px-2 py-1.5 font-bold text-title underline-offset-2 hover:underline",
										onClick: () => {
											const picked = window.getSelection();
											if (picked && String(picked).trim()) return;
											setOpenKey((current) => current === row.key ? "" : row.key);
										},
										onKeyDown: (event) => {
											if (event.key !== "Enter" && event.key !== " ") return;
											event.preventDefault();
											setOpenKey((current) => current === row.key ? "" : row.key);
										},
										children: row.name
									})
								}),
								/* @__PURE__ */ jsx("td", {
									className: "border border-grid px-2 py-1.5 tabular-nums",
									children: num(row.qty)
								}),
								/* @__PURE__ */ jsx("td", {
									className: "border border-grid px-2 py-1.5 tabular-nums",
									children: num(row.planned)
								}),
								/* @__PURE__ */ jsx("td", {
									className: "border border-grid px-2 py-1.5 tabular-nums",
									children: num(row.done)
								}),
								/* @__PURE__ */ jsx("td", {
									className: "border border-grid px-2 py-1.5 tabular-nums",
									children: num(row.left)
								}),
								/* @__PURE__ */ jsx("td", {
									className: "whitespace-nowrap border border-grid px-2 py-1.5 tabular-nums",
									children: formatHm(row.first) || "—"
								}),
								/* @__PURE__ */ jsx("td", {
									className: "whitespace-nowrap border border-grid px-2 py-1.5 tabular-nums",
									children: formatHm(row.last) || "—"
								}),
								/* @__PURE__ */ jsx("td", {
									className: "whitespace-nowrap border border-grid px-2 py-1.5 font-bold tabular-nums",
									children: workSpan(row.span)
								})
							]
						}), openKey === row.key ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", {
							colSpan: 10,
							className: "border border-grid bg-ice px-3 py-2",
							children: /* @__PURE__ */ jsxs("table", {
								className: "mx-auto w-full max-w-3xl border-collapse text-xs",
								children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", {
									className: "bg-header text-on-dark",
									children: ["라인", "작업수량", "작업완료수량", "총건수", "완료", "미완료", "작업시작", "작업종료", "작업시간"].map((label) => /* @__PURE__ */ jsx("th", {
										className: "border border-header px-2 py-1 text-center font-bold",
										children: label
									}, label))
								}) }), /* @__PURE__ */ jsx("tbody", { children: row.lineTimes.map((cell) => /* @__PURE__ */ jsxs("tr", {
									className: "cursor-pointer bg-paper hover:bg-[#e8f2ff]",
									onClick: () => setLineSheet({
										line: cell.line,
										name: row.name,
										center: row.center,
										rows: lineStoreTimes(cell.picks)
									}),
									children: [
										/* @__PURE__ */ jsx("th", {
											className: "border border-grid px-2 py-1 text-center font-bold text-title",
											children: `${cell.line}라인`
										}),
										/* @__PURE__ */ jsx("td", {
											className: "border border-grid px-2 py-1 text-center tabular-nums",
											children: num(cell.qty)
										}),
										/* @__PURE__ */ jsx("td", {
											className: "border border-grid px-2 py-1 text-center tabular-nums",
											children: num(cell.doneQty)
										}),
										/* @__PURE__ */ jsx("td", {
											className: "border border-grid px-2 py-1 text-center tabular-nums",
											children: num(cell.planned)
										}),
										/* @__PURE__ */ jsx("td", {
											className: "border border-grid px-2 py-1 text-center tabular-nums",
											children: num(cell.done)
										}),
										/* @__PURE__ */ jsx("td", {
											className: "border border-grid px-2 py-1 text-center tabular-nums",
											children: num(cell.left)
										}),
										/* @__PURE__ */ jsx("td", {
											className: "border border-grid px-2 py-1 text-center font-bold tabular-nums",
											children: formatHm(cell.first) || "—"
										}),
										/* @__PURE__ */ jsx("td", {
											className: "border border-grid px-2 py-1 text-center font-bold tabular-nums",
											children: formatHm(cell.last) || "—"
										}),
										/* @__PURE__ */ jsx("td", {
											className: "border border-grid px-2 py-1 text-center font-bold tabular-nums",
											children: cell.first == null || cell.last == null ? "—" : workSpan(cell.last - cell.first)
										})
									]
								}, cell.line)) })]
							})
						}) }) : null] }, row.key)) })
					]
				})
			}),
			storeSheet && typeof document !== "undefined" ? createPortal(/* @__PURE__ */ jsxs("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4",
				onClick: () => setStoreSheet(null),
				children: [/* @__PURE__ */ jsxs("div", {
					role: "dialog",
					"aria-modal": "true",
					"aria-label": `${storeSheet.name} 상품 작업`,
					className: "flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.2)]",
					onClick: (event) => event.stopPropagation(),
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-start gap-3 border-b border-black/5 px-4 py-3",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ jsx("p", {
								className: "truncate text-[17px] font-semibold text-[#1c1c1e]",
								children: [storeSheet.code, storeSheet.name].filter(Boolean).join(" ")
							}), /* @__PURE__ */ jsx("p", {
								className: "truncate text-sm text-[#6b7280]",
								children: storeSheet.center
							})]
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							className: "h-9 shrink-0 rounded-full bg-[#f2f2f7] px-3 text-sm font-semibold text-[#007aff]",
							onClick: () => setStoreSheet(null),
							children: "닫기"
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "min-h-0 flex-1 overflow-auto",
						children: storeGoods.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "px-4 py-6 text-center text-sm text-[#6b7280]",
							children: "이 점포의 작업 상품이 없습니다."
						}) : /* @__PURE__ */ jsxs("table", {
							className: "w-full border-collapse text-sm",
							children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", {
								className: "sticky top-0 bg-header text-on-dark",
								children: [["code", "상품코드"], ["name", "상품명"], ["qty", "작업수량"], ["doneQty", "작업완료수량"], ["last", "작업종료"]].map(([key, label]) => /* @__PURE__ */ jsx("th", {
									className: "border border-header p-0 text-center font-bold",
									children: /* @__PURE__ */ jsxs("button", {
										type: "button",
										className: "w-full px-2 py-2 font-bold text-on-dark",
										onClick: () => {
											if (goodsSort === key) setGoodsDir((dir) => dir === "asc" ? "desc" : "asc");
											else {
												setGoodsSort(key);
												setGoodsDir(key === "name" || key === "code" ? "asc" : "desc");
											}
										},
										children: [label, goodsSort === key ? goodsDir === "asc" ? " ▲" : " ▼" : ""]
									})
								}, key))
							}) }), /* @__PURE__ */ jsx("tbody", { children: storeGoods.map((item) => /* @__PURE__ */ jsxs("tr", {
								children: [
									/* @__PURE__ */ jsx("td", {
										className: "whitespace-nowrap border border-grid px-2 py-1.5 text-center tabular-nums",
										children: item.code || "—"
									}),
									/* @__PURE__ */ jsx("td", {
										className: "border border-grid px-2 py-1.5 font-bold",
										children: item.name
									}),
									/* @__PURE__ */ jsx("td", {
										className: "border border-grid px-2 py-1.5 text-center tabular-nums",
										children: num(item.qty)
									}),
									/* @__PURE__ */ jsx("td", {
										className: "border border-grid px-2 py-1.5 text-center tabular-nums",
										children: num(item.doneQty)
									}),
									/* @__PURE__ */ jsx("td", {
										className: "whitespace-nowrap border border-grid px-2 py-1.5 text-center font-bold tabular-nums",
										children: formatHms(item.last) || "—"
									})
								]
							}, item.key)) })]
						})
					})]
				})]
			}), document.body) : null,
			lineSheet && typeof document !== "undefined" ? createPortal(/* @__PURE__ */ jsxs("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4",
				onClick: () => setLineSheet(null),
				children: [/* @__PURE__ */ jsxs("div", {
					role: "dialog",
					"aria-modal": "true",
					"aria-label": `${lineSheet.line}라인 점포 작업`,
					className: "flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.2)]",
					onClick: (event) => event.stopPropagation(),
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-start gap-3 border-b border-black/5 px-4 py-3",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-[17px] font-semibold text-[#1c1c1e]",
								children: `${lineSheet.line}라인`
							}), /* @__PURE__ */ jsx("p", {
								className: "truncate text-sm text-[#6b7280]",
								children: `${lineSheet.center} · ${lineSheet.name}`
							})]
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							className: "h-9 shrink-0 rounded-full bg-[#f2f2f7] px-3 text-sm font-semibold text-[#007aff]",
							onClick: () => setLineSheet(null),
							children: "닫기"
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "min-h-0 flex-1 overflow-auto",
						children: lineRows.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "px-4 py-6 text-center text-sm text-[#6b7280]",
							children: timeNeedle ? "이 시각의 작업이 없습니다." : "이 라인에는 이 상품 작업이 없습니다."
						}) : /* @__PURE__ */ jsxs("table", {
							className: "w-full border-collapse text-sm",
							children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", {
								className: "sticky top-0 bg-header text-on-dark",
								children: ["점포", "작업수량", "작업완료수량", "건수", "작업시각"].map((label) => /* @__PURE__ */ jsx("th", {
									className: "border border-header px-2 py-2 text-center font-bold",
									children: label
								}, label))
							}) }), /* @__PURE__ */ jsx("tbody", { children: lineRows.map((item) => /* @__PURE__ */ jsxs("tr", {
								children: [
									/* @__PURE__ */ jsxs("th", {
										className: "border border-grid px-2 py-1.5 text-center font-bold",
										children: [[item.code, item.store].filter(Boolean).join(" "), item.loc ? /* @__PURE__ */ jsx("span", {
											className: "mt-0.5 block text-xs font-medium text-muted",
											children: item.loc
										}) : null]
									}),
									/* @__PURE__ */ jsx("td", {
										className: "border border-grid px-2 py-1.5 text-center tabular-nums",
										children: num(item.qty)
									}),
									/* @__PURE__ */ jsx("td", {
										className: "border border-grid px-2 py-1.5 text-center tabular-nums",
										children: num(item.doneQty)
									}),
									/* @__PURE__ */ jsx("td", {
										className: "border border-grid px-2 py-1.5 text-center tabular-nums",
										children: num(item.count)
									}),
									/* @__PURE__ */ jsx("td", {
										className: "whitespace-nowrap border border-grid px-2 py-1.5 text-center font-bold tabular-nums",
										children: item.at == null ? "미작업" : formatHms(item.at)
									})
								]
							}, item.key)) })]
						})
					})]
				})]
			}), document.body) : null
		]
	});
}
function GoodsView({ jobs: all, loaded }) {
	const [center, setCenter] = useState("1센터");
	const [dpt, setDpt] = useState("전체");
	const [lines, setLines] = useState(() => lineChoices(centerList()));
	const [sortKey, setSortKey] = useState("openQty");
	const [sortDir, setSortDir] = useState("desc");
	const [printReady, setPrintReady] = useState(false);
	useEffect(() => {
		setPrintReady(true);
	}, []);
	const choices = lineChoices([center]);
	const pickedLines = lines.filter((n) => choices.includes(n));
	const allLines = choices.every((n) => lines.includes(n));
	const baseJobs = useMemo(() => jobsOf(all, center, dpt), [
		all,
		center,
		dpt
	]);
	const picked = useMemo(() => {
		if (allLines) return baseJobs;
		const allow = new Set(pickedLines);
		return baseJobs.filter((job) => allow.has(job.line));
	}, [
		baseJobs,
		allLines,
		pickedLines
	]);
	const stats = useMemo(() => {
		const allow = allLines ? null : new Set(pickedLines);
		const map = new Map();
		for (const job of all[center] ?? []) {
			if (dpt !== "전체" && !matchDpt(job.route, dpt)) continue;
			if (allow && !allow.has(job.line)) continue;
			const code = job.goodsCd || "";
			const name = job.goodsNm || "상품없음";
			const key = `${code}|${name}`;
			let row = map.get(key);
			if (!row) {
				row = { key, code, name, byLine: new Map() };
				map.set(key, row);
			}
			const amount = job.orderQty || job.qty || 0;
			const pickedQty = job.qty || 0;
			const need = job.orderQty || 0;
			const full = job.at != null && pickedQty > 0 && (need <= 0 || pickedQty >= need);
			const bucket = row.byLine.get(job.line) ?? { total: 0, open: 0 };
			bucket.total += amount;
			if (!full) bucket.open += amount;
			row.byLine.set(job.line, bucket);
		}
		const list = [];
		for (const row of map.values()) {
			let total = 0;
			let open = 0;
			const parts = [];
			for (const line of [...row.byLine.keys()].sort((a, b) => a - b)) {
				const bucket = row.byLine.get(line);
				total += bucket.total;
				open += bucket.open;
				if (bucket.open > 0) parts.push(`${line}라인 - ${num(bucket.open)}개`);
			}
			list.push({
				key: row.key,
				code: row.code,
				name: row.name,
				totalQty: total,
				openQty: open,
				centers: parts.join(" "),
				rate: total ? (total - open) / total : 0
			});
		}
		return list;
	}, [all, center, dpt, allLines, pickedLines]);
	const rows = useMemo(() => {
		const open = stats.filter((row) => row.openQty > 0);
		const dir = sortDir === "asc" ? 1 : -1;
		return [...open].sort((a, b) => {
			if (sortKey === "name" || sortKey === "centers") return String(a[sortKey] || "").localeCompare(String(b[sortKey] || ""), "ko") * dir || a.name.localeCompare(b.name, "ko");
			return ((a[sortKey] ?? -1) - (b[sortKey] ?? -1)) * dir || a.name.localeCompare(b.name, "ko");
		});
	}, [
		stats,
		sortKey,
		sortDir
	]);
	const [checked, setChecked] = useState([]);
	const checkedSet = useMemo(() => new Set(checked), [checked]);
	const printRows = rows.some((row) => checkedSet.has(row.key)) ? rows.filter((row) => checkedSet.has(row.key)) : rows;
	const printQty = printRows.reduce((sum, row) => sum + (row.totalQty || 0), 0);
	const printOpen = printRows.reduce((sum, row) => sum + (row.openQty || 0), 0);
	const allChecked = rows.length > 0 && rows.every((row) => checkedSet.has(row.key));
	const totalQty = stats.reduce((sum, row) => sum + (row.totalQty || 0), 0);
	const openQty = stats.reduce((sum, row) => sum + (row.openQty || 0), 0);
	const rate = totalQty ? (totalQty - openQty) / totalQty : 0;
	const missing = picked.length > 0 && picked.every((job) => job.goodsNm === "" && job.goodsCd === "");
	const [printJob, setPrintJob] = useState(0);
	const lineLabel = lines.length === choices.length ? "전체 라인" : lines.length === 0 ? "선택 없음" : [...lines].sort((a, b) => a - b).map((n) => LINE_LABELS[n - 1]).join(", ");
	const printedAt = printJob ? (/* @__PURE__ */ new Date()).toLocaleString("ko-KR", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	}) : "";
	useEffect(() => {
		if (!printJob) return;
		document.body.classList.add("print-goods");
		const done = () => {
			document.body.classList.remove("print-goods");
			window.removeEventListener("afterprint", done);
		};
		window.addEventListener("afterprint", done);
		window.print();
		return done;
	}, [printJob]);
	function toggleSort(key) {
		if (sortKey === key) setSortDir((dir) => dir === "asc" ? "desc" : "asc");
		else {
			setSortKey(key);
			setSortDir(key === "name" || key === "centers" ? "asc" : "desc");
		}
	}
	function toggleCheck(key) {
		setChecked((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
	}
	function toggleAll() {
		setChecked((current) => {
			const visible = new Set(rows.map((row) => row.key));
			if (allChecked) return current.filter((key) => !visible.has(key));
			return [.../* @__PURE__ */ new Set([...current, ...rows.map((row) => row.key)])];
		});
	}
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("div", {
		className: "ios-sheet",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-black/5 bg-white/90 px-3 py-2 backdrop-blur",
				children: [/* @__PURE__ */ jsx("p", {
					className: "min-w-0 flex-1 truncate text-[17px] font-semibold text-[#1c1c1e]",
					children: "미작업 상품"
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold disabled:opacity-40",
					disabled: !loaded,
					onClick: () => setPrintJob((job) => job + 1),
					children: "인쇄"
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-2 px-3 py-3",
				children: [
					/* @__PURE__ */ jsx(CenterSelect, {
						value: center,
						onChange: setCenter
					}),
					/* @__PURE__ */ jsx(CheckMenu, {
						label: "라인",
						text: allLines ? "전체" : pickedLines.length === 0 ? "선택 없음" : [...pickedLines].sort((a, b) => a - b).map((n) => `${n}라인`).join(", "),
						rows: [{ id: "all", label: "전체", checked: allLines }, ...choices.map((n) => ({
							id: String(n),
							label: LINE_LABELS[n - 1].replace(/^\S+\s/, ""),
							checked: lines.includes(n),
							swatch: LINE_TONE[n - 1]
						}))],
						onToggle: (id) => {
							if (id === "all") {
								setLines(allLines ? lines.filter((n) => !choices.includes(n)) : [...new Set([...lines, ...choices])]);
								return;
							}
							const n = Number(id);
							setLines((current) => current.includes(n) ? current.filter((item) => item !== n) : [...current, n].sort((a, b) => a - b));
						}
					}),
					/* @__PURE__ */ jsx(DptSelect, {
						value: dpt,
						onChange: setDpt
					})
				]
			}),
			!loaded ? /* @__PURE__ */ jsx(Hint, { text: "위에서 올린 엑셀의 상품명으로 미작업 상품을 봅니다." }) : null,
			loaded && baseJobs.length === 0 ? /* @__PURE__ */ jsx(Hint, { text: emptyDpt(dpt) }) : null,
			loaded && baseJobs.length > 0 && lines.length === 0 ? /* @__PURE__ */ jsx(Hint, { text: "선택한 라인이 없습니다. 라인 필터에서 다시 체크해 주세요." }) : null,
			missing ? /* @__PURE__ */ jsx(Hint, { text: "이 파일에서 상품명(GoodsNM) 열을 찾지 못했습니다." }) : null,
			/* @__PURE__ */ jsx("div", {
				className: "stat-tiles grid gap-2 px-3 pb-3 sm:grid-cols-3",
				children: [
					[
						"총작업량",
						num(totalQty),
						"bg-title text-on-dark"
					],
					[
						"미작업수량",
						num(openQty),
						"bg-line-1 text-on-dark"
					],
					[
						"몇 %완료",
						pf.format(rate),
						"bg-line-5 text-on-dark"
					]
				].map(([label, value, color]) => /* @__PURE__ */ jsxs("div", {
					className: `rounded-md px-3 py-3 ${color}`,
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-xs font-bold",
						children: label
					}), /* @__PURE__ */ jsx("p", {
						className: "text-2xl font-bold tabular-nums",
						children: loaded ? value : "—"
					})]
				}, label))
			}),
			/* @__PURE__ */ jsx("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ jsxs("table", {
					className: "col-mid w-full min-w-[920px] border-collapse text-sm",
					children: [
						/* @__PURE__ */ jsx("caption", {
							className: "sr-only",
							children: "미작업 상품리스트"
						}),
						/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", {
							className: "bg-header text-left text-on-dark",
							children: [
								/* @__PURE__ */ jsx("th", {
									scope: "col",
									className: "w-10 border border-header px-2 py-2 text-center",
									children: /* @__PURE__ */ jsx("input", {
										type: "checkbox",
										"aria-label": "보이는 상품 모두 선택",
										checked: allChecked,
										onChange: toggleAll
									})
								}),
								/* @__PURE__ */ jsx("th", {
									scope: "col",
									className: "whitespace-nowrap border border-header px-2 py-2 font-bold",
									children: "바코드"
								}),
								[
									["name", "상품"],
									["totalQty", "총작업량"],
									["openQty", "미작업수량"],
									["centers", "미작업 라인 수량"],
									["rate", "몇 %완료"]
								].map(([key, label]) => /* @__PURE__ */ jsx("th", {
									scope: "col",
									className: "whitespace-nowrap border border-header p-0 text-center font-bold",
									children: /* @__PURE__ */ jsxs("button", {
										type: "button",
										className: "font-bold text-on-dark",
										onClick: () => toggleSort(key),
										children: [label, sortKey === key ? sortDir === "asc" ? " ▲" : " ▼" : ""]
									})
								}, key))
							]
						}) }),
						/* @__PURE__ */ jsx("tbody", { children: rows.map((row) => /* @__PURE__ */ jsxs("tr", { children: [
							/* @__PURE__ */ jsx("td", {
								className: "border border-grid px-2 py-1.5 text-center",
								children: /* @__PURE__ */ jsx("input", {
									type: "checkbox",
									"aria-label": `${row.name} 인쇄 선택`,
									checked: checkedSet.has(row.key),
									onChange: () => toggleCheck(row.key)
								})
							}),
							/* @__PURE__ */ jsx("td", {
								className: "border border-grid px-2 py-1.5 text-center",
								children: /* @__PURE__ */ jsx(Barcode, { value: row.code })
							}),
							/* @__PURE__ */ jsx("th", {
								scope: "row",
								className: "border border-grid px-2 py-1.5 text-left font-bold",
								children: /* @__PURE__ */ jsx("span", { children: row.name })
							}),
							/* @__PURE__ */ jsx(Num, { children: num(row.totalQty) }),
							/* @__PURE__ */ jsx(Num, { children: num(row.openQty) }),
							/* @__PURE__ */ jsx("td", {
								className: "whitespace-nowrap border border-grid px-2 py-1.5 text-center font-bold",
								children: row.centers || "—"
							}),
							/* @__PURE__ */ jsx("td", {
								className: "border border-grid px-2 py-1.5",
								children: /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ jsx("div", {
										className: "h-3 min-w-16 flex-1 overflow-hidden rounded-sm bg-slate",
										children: /* @__PURE__ */ jsx("div", {
											className: `h-full ${rateBar(row.rate)}`,
											style: { width: `${Math.round(row.rate * 100)}%` }
										})
									}), /* @__PURE__ */ jsx("span", {
										className: "w-14 text-right font-bold tabular-nums",
										children: pf.format(row.rate)
									})]
								})
							})
						] }, row.key)) })
					]
				})
			}),
			/* @__PURE__ */ jsx("p", {
				className: "px-3 py-3 text-xs text-muted",
				children: "목록은 미작업이 남은 상품만 보여 줍니다. 바코드는 상품코드(GoodsCD)입니다. 체크한 상품만 인쇄되고, 체크가 없으면 보이는 상품 전체를 인쇄합니다."
			})
		]
	}), printReady ? createPortal(/* @__PURE__ */ jsxs("section", {
		className: "goods-print",
		"aria-hidden": printJob === 0,
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "goods-print-head",
				children: [
					/* @__PURE__ */ jsx("p", { children: "센터 생산성" }),
					/* @__PURE__ */ jsx("h1", { children: "미작업 상품리스트" }),
					/* @__PURE__ */ jsxs("p", { children: [
						center,
						" · ",
						lineLabel,
						" · ",
						dpt,
						printRows.length === rows.length ? " · 전체" : ` · 선택 ${nf.format(printRows.length)}종`,
						printedAt ? ` · 출력 ${printedAt}` : ""
					] })
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "goods-print-sums",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("strong", { children: loaded ? num(printQty) : "—" }), /* @__PURE__ */ jsx("span", { children: "총작업량" })] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("strong", { children: loaded ? num(printOpen) : "—" }), /* @__PURE__ */ jsx("span", { children: "미작업수량" })] })
				]
			}),
			/* @__PURE__ */ jsxs("table", { children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
				/* @__PURE__ */ jsx("th", { children: "번호" }),
				/* @__PURE__ */ jsx("th", { children: "바코드" }),
				/* @__PURE__ */ jsx("th", { children: "상품" }),
				/* @__PURE__ */ jsx("th", { children: "총작업량" }),
				/* @__PURE__ */ jsx("th", { children: "미작업수량" }),
				/* @__PURE__ */ jsx("th", { children: "미작업 라인 수량" })
			] }) }), /* @__PURE__ */ jsx("tbody", { children: printRows.map((row, index) => /* @__PURE__ */ jsxs("tr", { children: [
				/* @__PURE__ */ jsx("td", { children: index + 1 }),
				/* @__PURE__ */ jsx("td", {
					className: "barcode",
					children: /* @__PURE__ */ jsx(Barcode, { value: row.code })
				}),
				/* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("b", { children: row.name }) }),
				/* @__PURE__ */ jsx("td", { children: num(row.totalQty) }),
				/* @__PURE__ */ jsx("td", { children: num(row.openQty) }),
				/* @__PURE__ */ jsx("td", { children: row.centers || "—" })
			] }, row.key)) })] }),
			/* @__PURE__ */ jsxs("p", {
				className: "goods-print-note",
				children: [
					printRows.length === rows.length ? "체크가 없어 보이는 상품 전체를 인쇄합니다." : "체크한 상품만 인쇄합니다.",
					" 미작업 라인 수량은 선택한 센터의 라인별 미작업수량입니다. 총 ",
					nf.format(printRows.length),
					"종."
				]
			})
		]
	}), document.body) : null] });
}
function StoreView({ jobs: all, loaded }) {
	const [center, setCenter] = useState("1센터");
	const [dpt, setDpt] = useState("전체");
	const jobs = useMemo(() => jobsOf(all, center, dpt), [
		all,
		center,
		dpt
	]);
	const [line, setLine] = useState(0);
	const lineMax = lineCountOf(center);
	useEffect(() => {
		if (line > lineMax) setLine(0);
	}, [line, lineMax]);
	const [storeKey, setStoreKey] = useState("전체");
	const [storeQuery, setStoreQuery] = useState("");
	const [openKey, setOpenKey] = useState("");
	const [sortKey, setSortKey] = useState("left");
	const [sortDir, setSortDir] = useState("desc");
	const base = useMemo(() => storeStats(jobs, line), [jobs, line]);
	useEffect(() => {
		if (storeKey !== "전체" && !base.some((row) => row.key === storeKey)) setStoreKey("전체");
		if (openKey && !base.some((row) => row.key === openKey)) setOpenKey("");
	}, [
		base,
		storeKey,
		openKey
	]);
	const rows = useMemo(() => {
		const needle = storeQuery.trim().toLowerCase();
		const picked = needle
			? base.filter((row) => row.store.toLowerCase().includes(needle) || String(row.code || "").toLowerCase().includes(needle))
			: storeKey === "전체" ? base : base.filter((row) => row.key === storeKey);
		const dir = sortDir === "asc" ? 1 : -1;
		return [...picked].sort((a, b) => {
			return (sortKey === "store" ? a.store.localeCompare(b.store, "ko") : a[sortKey] - b[sortKey]) * dir || a.store.localeCompare(b.store, "ko");
		});
	}, [
		base,
		storeKey,
		storeQuery,
		sortKey,
		sortDir
	]);
	const planned = rows.reduce((sum, row) => sum + row.planned, 0);
	const done = rows.reduce((sum, row) => sum + row.done, 0);
	const left = planned - done;
	const rate = planned ? done / planned : 0;
	const goods = useMemo(() => openKey ? openGoods(jobs, openKey, line) : [], [
		jobs,
		openKey,
		line
	]);
	const missing = jobs.length > 0 && jobs.every((job) => job.storeNm === "" && job.storeCd === "");
	function toggleSort(key) {
		if (sortKey === key) setSortDir((dir) => dir === "asc" ? "desc" : "asc");
		else {
			setSortKey(key);
			setSortDir(key === "store" ? "asc" : "desc");
		}
	}
	return /* @__PURE__ */ jsxs("div", {
		className: "ios-sheet",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "sticky top-0 z-20 flex items-center border-b border-black/5 bg-white/90 px-3 py-2 backdrop-blur",
				children: /* @__PURE__ */ jsx("p", {
					className: "min-w-0 flex-1 truncate text-[17px] font-semibold text-[#1c1c1e]",
					children: "점포 진척"
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-2 px-3 py-3",
				children: [
					/* @__PURE__ */ jsx(CenterSelect, {
						value: center,
						onChange: setCenter
					}),
					/* @__PURE__ */ jsx(PickMenu, {
						label: "라인",
						value: String(line),
						onChange: (id) => setLine(Number(id)),
						options: [{ id: "0", label: "전체" }, ...LINE_LABELS.slice(0, lineMax).map((label, index) => ({ id: String(index + 1), label: label.replace(/^\S+\s/, "") }))]
					}),
					/* @__PURE__ */ jsx(PickMenu, {
						label: "점포",
						value: storeKey,
						search: true,
						onSearch: setStoreQuery,
						onChange: setStoreKey,
						options: [{ id: "전체", label: "전체" }, ...base.map((row) => ({ id: row.key, label: row.code ? `${row.store} ${row.code}` : row.store }))]
					}),
					/* @__PURE__ */ jsx(DptSelect, {
						value: dpt,
						onChange: setDpt
					})
				]
			}),
			!loaded ? /* @__PURE__ */ jsx(Hint, { text: "위에서 올린 엑셀의 점포명으로 진척률을 봅니다." }) : null,
			loaded && jobs.length === 0 ? /* @__PURE__ */ jsx(Hint, { text: emptyDpt(dpt) }) : null,
			missing ? /* @__PURE__ */ jsx(Hint, { text: "이 파일에서 점포명(ClientNM) 열을 찾지 못했습니다." }) : null,
			/* @__PURE__ */ jsx("div", {
				className: "stat-tiles grid gap-2 px-3 pb-3 sm:grid-cols-4",
				children: [
					[
						"작업건수",
						num(planned),
						"bg-title text-on-dark"
					],
					[
						"완료건수",
						num(done),
						"bg-line-3 text-ink"
					],
					[
						"잔여건수",
						num(left),
						"bg-line-1 text-on-dark"
					],
					[
						"몇 %완료",
						pf.format(rate),
						"bg-line-5 text-on-dark"
					]
				].map(([label, value, color]) => /* @__PURE__ */ jsxs("div", {
					className: `rounded-md px-3 py-3 ${color}`,
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-xs font-bold",
						children: label
					}), /* @__PURE__ */ jsx("p", {
						className: "text-2xl font-bold tabular-nums",
						children: loaded ? value : "—"
					})]
				}, label))
			}),
			/* @__PURE__ */ jsx("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ jsxs("table", {
					className: "col-mid w-full min-w-[640px] border-collapse text-sm",
					children: [
						/* @__PURE__ */ jsx("caption", {
							className: "sr-only",
							children: "점포 작업 진척률"
						}),
						/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", {
							className: "bg-header text-left text-on-dark",
							children: [
								["store", "점포"],
								["planned", "작업건수"],
								["done", "완료건수"],
								["left", "잔여건수"],
								["rate", "몇 %완료"]
							].map(([key, label]) => /* @__PURE__ */ jsx("th", {
								scope: "col",
								className: "whitespace-nowrap border border-header p-0 text-center font-bold",
								children: /* @__PURE__ */ jsxs("button", {
									type: "button",
									className: "font-bold text-on-dark",
									onClick: () => toggleSort(key),
									children: [label, sortKey === key ? sortDir === "asc" ? " ▲" : " ▼" : ""]
								})
							}, key))
						}) }),
						/* @__PURE__ */ jsx("tbody", { children: rows.map((row) => /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("tr", {
							className: openKey === row.key ? "bg-ice" : void 0,
							children: [
								/* @__PURE__ */ jsxs("th", {
									scope: "row",
									className: "border border-grid px-2 py-1.5 text-left font-bold",
									children: [/* @__PURE__ */ jsx("button", {
										type: "button",
										className: "text-left font-bold text-title underline-offset-2 hover:underline",
										onClick: () => setOpenKey((current) => current === row.key ? "" : row.key),
										children: row.store
									}), row.code || row.lines ? /* @__PURE__ */ jsxs("span", {
										className: "mt-0.5 block text-xs font-medium text-muted",
										children: [
											row.code ? row.code : "",
											row.code && row.lines ? " · " : "",
											row.lines ? `${row.lines}라인` : ""
										]
									}) : null]
								}),
								/* @__PURE__ */ jsx(Num, { children: num(row.planned) }),
								/* @__PURE__ */ jsx(Num, { children: num(row.done) }),
								/* @__PURE__ */ jsx(Num, { children: num(row.left) }),
								/* @__PURE__ */ jsx("td", {
									className: "border border-grid px-2 py-1.5",
									children: /* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ jsx("div", {
											className: "h-3 min-w-16 flex-1 overflow-hidden rounded-sm bg-slate",
											children: /* @__PURE__ */ jsx("div", {
												className: `h-full ${rateBar(row.rate)}`,
												style: { width: `${Math.round(row.rate * 100)}%` }
											})
										}), /* @__PURE__ */ jsx("span", {
											className: "w-14 text-right font-bold tabular-nums",
											children: pf.format(row.rate)
										})]
									})
								})
							]
						}), openKey === row.key ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", {
							colSpan: 5,
							className: "border border-grid bg-ice px-3 py-2",
							children: [/* @__PURE__ */ jsxs("p", {
								className: "mb-1 text-xs font-bold",
								children: [
									"미작업 상품 ",
									nf.format(goods.length),
									"종"
								]
							}), goods.length === 0 ? /* @__PURE__ */ jsx("p", {
								className: "text-xs text-muted",
								children: "미작업 상품이 없습니다."
							}) : /* @__PURE__ */ jsxs("table", {
								className: "w-full border-collapse text-xs",
								children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", {
									className: "bg-header text-on-dark",
									children: [
										"상품코드",
										"상품명",
										"미작업건수",
										"총작업수량",
										"작업수량",
										"미작업수량"
									].map((label) => /* @__PURE__ */ jsx("th", {
										className: "border border-header px-2 py-1 text-left font-bold",
										children: label
									}, label))
								}) }), /* @__PURE__ */ jsx("tbody", { children: goods.map((item) => /* @__PURE__ */ jsxs("tr", {
									className: "bg-paper",
									children: [
										/* @__PURE__ */ jsx("td", {
											className: "border border-grid px-2 py-1 tabular-nums",
											children: item.code || "-"
										}),
										/* @__PURE__ */ jsx("td", {
											className: "border border-grid px-2 py-1",
											children: item.name
										}),
										/* @__PURE__ */ jsx("td", {
											className: "border border-grid px-2 py-1 text-right font-bold tabular-nums",
											children: num(item.count)
										}),
										/* @__PURE__ */ jsx("td", {
											className: "border border-grid px-2 py-1 text-right tabular-nums",
											children: num(item.totalQty)
										}),
										/* @__PURE__ */ jsx("td", {
											className: "border border-grid px-2 py-1 text-right tabular-nums",
											children: num(item.workQty)
										}),
										/* @__PURE__ */ jsx("td", {
											className: "border border-grid px-2 py-1 text-right font-bold tabular-nums",
											children: num(item.leftQty)
										})
									]
								}, item.key)) })]
							})]
						}) }, `${row.key}-goods`) : null] }, row.key)) })
					]
				})
			}),
			/* @__PURE__ */ jsx("p", {
				className: "px-3 py-3 text-xs text-muted",
				children: "점포는 ClientNM입니다. 점포 이름을 누르면 피킹 시각이 없는 미작업 상품이 나옵니다. 총작업수량은 주문수량 합, 작업수량은 이미 피킹한 수량, 미작업수량은 아직 피킹하지 않은 주문수량입니다. 완료는 피킹 시각이 있는 건입니다. 유제 냉장은 루트 100번대, FF2는 루트 200번대입니다. 칸을 누르면 정렬됩니다."
			})
		]
	});
}
function LedgerView({ open }) {
	return jsx(ChulgoView, { open: Boolean(open) });
}
function RouteView({ jobs: all, loaded }) {
	const [center, setCenter] = useState("1센터");
	const [dpt, setDpt] = useState("전체");
	const grouped = dpt === "10자리 묶음";
	const dataDpt = grouped ? "전체" : dpt;
	const jobs = useMemo(() => jobsOf(all, center, dataDpt), [
		all,
		center,
		dataDpt
	]);
	const [sortKey, setSortKey] = useState("route");
	const [sortDir, setSortDir] = useState("asc");
	const rows = useMemo(() => routeStats(jobs, grouped), [jobs, grouped]);
	const sorted = useMemo(() => {
		const dir = sortDir === "asc" ? 1 : -1;
		return [...rows].sort((a, b) => {
			if (a.route === "없음") return 1;
			if (b.route === "없음") return -1;
			return (sortKey === "route" ? a.route.localeCompare(b.route, "ko", { numeric: true }) : sortKey === "lines" ? a.lineKey - b.lineKey || a.lines.localeCompare(b.lines) : (a[sortKey] ?? (sortDir === "asc" ? Infinity : -Infinity)) - (b[sortKey] ?? (sortDir === "asc" ? Infinity : -Infinity))) * dir;
		});
	}, [
		rows,
		sortKey,
		sortDir
	]);
	const planned = rows.reduce((sum, row) => sum + row.planned, 0);
	const done = rows.reduce((sum, row) => sum + row.done, 0);
	const left = planned - done;
	const first = rows.reduce((min, row) => row.first != null && (min == null || row.first < min) ? row.first : min, null);
	const last = rows.reduce((max, row) => row.last != null && (max == null || row.last > max) ? row.last : max, null);
	const missing = jobs.length > 0 && jobs.every((job) => job.route === "");
	return /* @__PURE__ */ jsxs("div", {
		className: "ios-sheet",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "sticky top-0 z-20 flex items-center border-b border-black/5 bg-white/90 px-3 py-2 backdrop-blur",
				children: /* @__PURE__ */ jsx("p", {
					className: "min-w-0 flex-1 truncate text-[17px] font-semibold text-[#1c1c1e]",
					children: "루트"
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-2 px-3 py-3",
				children: [
					/* @__PURE__ */ jsx(CenterSelect, {
						value: center,
						onChange: setCenter
					}),
					/* @__PURE__ */ jsx(PickMenu, {
						label: "DPT",
						value: dpt,
						onChange: setDpt,
						options: [...DPTS.map((item) => ({ id: item.id, label: item.label })), { id: "10자리 묶음", label: "10자리 묶음" }]
					})
				]
			}),
			!loaded ? /* @__PURE__ */ jsx(Hint, { text: "위에서 올린 엑셀의 RTECOD로 루트별 종료를 봅니다." }) : null,
			loaded && jobs.length === 0 ? /* @__PURE__ */ jsx(Hint, { text: emptyDpt(dataDpt) }) : null,
			missing ? /* @__PURE__ */ jsx(Hint, { text: "이 파일에서 RTECOD 열을 찾지 못했습니다." }) : null,
			/* @__PURE__ */ jsx("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ jsxs("table", {
					className: "col-mid w-full min-w-[760px] border-collapse text-sm",
					children: [
						/* @__PURE__ */ jsx("caption", {
							className: "sr-only",
							children: "루트 작업 종료"
						}),
						/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", {
							className: "bg-header text-left text-on-dark",
							children: [
								["route", "루트"],
								...grouped ? [["lines", "라인"]] : [],
								["planned", "작업건수"],
								["done", "완료건수"],
								["left", "잔여건수"],
								["rate", "몇 %"],
								["first", "작업 시작"],
								["last", "작업 종료"]
							].map(([key, label]) => /* @__PURE__ */ jsx("th", {
								scope: "col",
								className: "whitespace-nowrap border border-header p-0 text-center font-bold",
								children: /* @__PURE__ */ jsxs("button", {
									type: "button",
									className: "font-bold text-on-dark",
									onClick: () => {
										if (sortKey === key) setSortDir((dir) => dir === "asc" ? "desc" : "asc");
										else {
											setSortKey(key);
											setSortDir(key === "route" || key === "lines" ? "asc" : "desc");
										}
									},
									children: [label, sortKey === key ? sortDir === "asc" ? " ▲" : " ▼" : ""]
								})
							}, key))
						}) }),
						/* @__PURE__ */ jsxs("tbody", { children: [/* @__PURE__ */ jsxs("tr", {
							className: "bg-slate font-bold",
							children: [
								/* @__PURE__ */ jsx("th", {
									scope: "row",
									className: "whitespace-nowrap border border-grid px-2 py-1.5 text-left",
									children: "🏭 전체"
								}),
								grouped ? /* @__PURE__ */ jsx("td", { className: "border border-grid px-2 py-1.5" }) : null,
								/* @__PURE__ */ jsx(Num, { children: num(planned) }),
								/* @__PURE__ */ jsx(Num, { children: num(done) }),
								/* @__PURE__ */ jsx(Num, { children: num(left) }),
								/* @__PURE__ */ jsx(Num, { children: pf.format(planned ? done / planned : 0) }),
								/* @__PURE__ */ jsx(Num, { children: first == null ? "—" : formatHm(first) }),
								/* @__PURE__ */ jsx(Num, { children: last == null ? "—" : formatHm(last) })
							]
						}), (sorted).map((row) => /* @__PURE__ */ jsxs("tr", { children: [
							/* @__PURE__ */ jsxs("th", {
								scope: "row",
								className: "whitespace-nowrap border border-grid px-2 py-1.5 text-left font-bold",
								children: [/* @__PURE__ */ jsx("span", { children: row.route }), row.members ? /* @__PURE__ */ jsx("span", {
									className: "mt-0.5 block text-xs font-medium text-muted",
									children: row.members
								}) : null]
							}),
							grouped ? /* @__PURE__ */ jsx("td", {
								className: "whitespace-nowrap border border-grid px-2 py-1.5 text-left tabular-nums",
								children: row.lines || "-"
							}) : null,
							/* @__PURE__ */ jsx(Num, { children: num(row.planned) }),
							/* @__PURE__ */ jsx(Num, { children: num(row.done) }),
							/* @__PURE__ */ jsx(Num, { children: num(row.left) }),
							/* @__PURE__ */ jsx(Num, { children: pf.format(row.rate) }),
							/* @__PURE__ */ jsx(Num, { children: row.first == null ? "—" : formatHm(row.first) }),
							/* @__PURE__ */ jsx(Num, { children: row.last == null ? "—" : formatHm(row.last) })
						] }, row.route))] })
					]
				})
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "px-3 py-3 text-xs text-muted",
				children: ["루트는 각 센터 시트의 RTECOD입니다. 완료는 피킹 시각이 있는 건입니다. 작업 시작과 작업 종료는 그 루트의 첫 피킹과 마지막 피킹입니다.", grouped ? " 10자리 묶음은 140과 240처럼 끝 두 자리가 같으면 한 루트로 합칩니다. 라인은 그 루트가 있는 라인입니다." : "", " 칸을 누르면 오름차순, 내림차순으로 바뀝니다."]
			})
		]
	});
}
function FinishView({ jobs: all, loaded }) {
	const [center, setCenter] = useState("1센터");
	const [dpt, setDpt] = useState("전체");
	const [copyNote, setCopyNote] = useState("");
	const jobs = useMemo(() => jobsOf(all, center, dpt), [
		all,
		center,
		dpt
	]);
	const lines = useMemo(() => lineForecasts(jobs, lineCountOf(center)), [jobs, center]);
	const whole = useMemo(() => centerForecast(lines), [lines]);
	const workDay = workDateLabel(jobs.reduce((min, job) => job.at != null && (min == null || job.at < min) ? job.at : min, null), whole.snapshot);
	const finish = useMemo(() => finishScale(lines.map((row) => row.left > 0 ? row.eta : null)), [lines]);
	const ahead = whole.eta != null && whole.snapshot != null ? whole.eta - whole.snapshot : null;
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-full min-h-0 flex-col items-center overflow-hidden px-2 py-1.5",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-1 flex max-w-full shrink-0 flex-wrap items-center justify-center gap-1",
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "px-1 text-[15px] font-semibold tracking-tight text-ink",
						children: "끝날 시간"
					}),
					/* @__PURE__ */ jsx(CenterSelect, {
						value: center,
						onChange: setCenter,
						compact: true
					}),
					/* @__PURE__ */ jsx(DptSelect, {
						value: dpt,
						onChange: setDpt,
						compact: true
					}),
					/* @__PURE__ */ jsx("span", {
						className: "inline-flex h-7 items-center rounded-full bg-white px-2.5 text-xs font-semibold shadow-sm",
						children: workDay.date
					}),
					/* @__PURE__ */ jsx("span", {
						className: "inline-flex h-7 items-center rounded-full bg-[#007aff] px-2.5 text-xs font-semibold text-white",
						children: workDay.week
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						disabled: !loaded,
						className: "h-7 rounded-full bg-title px-3 text-xs font-semibold text-on-dark disabled:opacity-40",
						onClick: () => {
							setCopyNote("만드는 중");
							copyCanvas(drawFinishCapture(all, dpt)).then(() => setCopyNote("복사했습니다. 카톡에 붙여 넣으세요.")).catch((err) => setCopyNote(err instanceof Error ? err.message : "복사에 실패했습니다."));
						},
						children: "캡처 복사"
					}),
					copyNote ? /* @__PURE__ */ jsx("span", {
						className: "text-xs font-semibold text-title",
						children: copyNote
					}) : null
				]
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "mb-1 shrink-0 text-center text-[12px] text-muted",
				children: [
					"끝나는 시각",
					/* @__PURE__ */ jsx("span", {
						className: "ml-1.5 text-[17px] font-semibold tabular-nums text-ink",
						children: !loaded || jobs.length === 0 ? "—" : whole.left === 0 ? "끝남" : whole.unknown.length > 0 ? "속도 모름" : formatWhen(whole.eta, whole.snapshot)
					}),
					loaded && jobs.length > 0 && whole.left > 0 && whole.unknown.length === 0 ? /* @__PURE__ */ jsxs("span", {
						className: "ml-1.5 font-semibold text-ink",
						children: ["앞으로 ", formatAhead(ahead)]
					}) : null,
					whole.slowLine != null ? /* @__PURE__ */ jsxs("span", {
						className: "ml-1.5",
						children: ["늦은 라인 ", LINE_LABELS[whole.slowLine - 1]]
					}) : null
				]
			}),
			!loaded ? /* @__PURE__ */ jsx(Hint, {}) : null,
			loaded && jobs.length === 0 ? /* @__PURE__ */ jsx(Hint, { text: emptyDpt(dpt) }) : null,
			/* @__PURE__ */ jsx("div", {
				className: "max-h-full min-h-0 max-w-full overflow-x-auto overflow-y-hidden rounded-2xl bg-white shadow-sm",
				children: /* @__PURE__ */ jsxs("table", {
					className: "w-max border-collapse text-center text-[13px]",
					children: [
						/* @__PURE__ */ jsx("caption", {
							className: "sr-only",
							children: "예상 종료"
						}),
						/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", {
							className: "text-[11px] font-semibold text-muted",
							children: [
								"라인",
								"할 일",
								"끝낸 일",
								"남은 일",
								"건/hr",
								"마지막",
								"끝나는 시각",
								"앞으로"
							].map((label) => /* @__PURE__ */ jsx("th", {
								scope: "col",
								className: "whitespace-nowrap border-b border-black/10 px-2.5 py-1 text-center font-semibold",
								children: label
							}, label))
						}) }),
						/* @__PURE__ */ jsxs("tbody", { children: [/* @__PURE__ */ jsxs("tr", {
							className: "bg-[#f2f2f7] font-semibold",
							children: [
								/* @__PURE__ */ jsx("th", {
									scope: "row",
									className: "border-b border-black/[0.06] px-2.5 py-1 text-center",
									children: /* @__PURE__ */ jsx("span", {
										className: "inline-flex min-w-16 justify-center rounded-full bg-header px-2 py-0.5 text-xs font-semibold text-on-dark",
										children: "전체"
									})
								}),
								/* @__PURE__ */ jsx(Num, {
									center: true,
									children: num(whole.planned)
								}),
								/* @__PURE__ */ jsx(Num, {
									center: true,
									children: num(whole.done)
								}),
								/* @__PURE__ */ jsx(Num, {
									center: true,
									children: num(whole.left)
								}),
								/* @__PURE__ */ jsx("td", { className: "border-b border-black/[0.06] px-2.5 py-1" }),
								/* @__PURE__ */ jsx(TimeCell, {
									center: true,
									ms: whole.snapshot
								}),
								/* @__PURE__ */ jsx(TimeCell, {
									center: true,
									ms: whole.eta
								}),
								/* @__PURE__ */ jsx("td", {
									className: "whitespace-nowrap border-b border-black/[0.06] px-2.5 py-1 text-center font-semibold",
									children: whole.left === 0 ? "끝남" : whole.unknown.length > 0 ? "몰라요" : formatAhead(ahead)
								})
							]
						}), lines.map((row) => /* @__PURE__ */ jsxs("tr", { children: [
							/* @__PURE__ */ jsx("th", {
								scope: "row",
								className: "border-b border-black/[0.06] px-2.5 py-1 text-center",
								children: /* @__PURE__ */ jsx("span", {
									className: `inline-flex min-w-16 justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${LINE_CLASS[row.line - 1]}`,
									children: LINE_LABELS[row.line - 1]
								})
							}),
							/* @__PURE__ */ jsx(Num, {
								center: true,
								children: num(row.planned)
							}),
							/* @__PURE__ */ jsx(Num, {
								center: true,
								children: num(row.done)
							}),
							/* @__PURE__ */ jsx(Num, {
								center: true,
								children: num(row.left)
							}),
							/* @__PURE__ */ jsx(Num, {
								center: true,
								children: row.planned === 0 ? "—" : num(row.perHour)
							}),
							/* @__PURE__ */ jsx(TimeCell, {
								center: true,
								ms: row.last
							}),
							/* @__PURE__ */ jsx(TimeCell, {
								center: true,
								ms: row.left > 0 ? row.eta : row.last,
								style: { background: finish(row.left > 0 ? row.eta : null) }
							}),
							/* @__PURE__ */ jsx("td", {
								className: "whitespace-nowrap border-b border-black/[0.06] px-2.5 py-1 text-center",
								children: row.planned === 0 ? "—" : row.left === 0 ? "끝남" : row.eta == null ? "몰라요" : formatAhead(row.eta - (row.last ?? row.eta))
							})
						] }, row.line))] })
					]
				})
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-1 shrink-0 text-center text-[10px] text-muted",
				children: "끝나는 시각은 그 라인의 건/hr입니다. 센터는 가장 늦은 라인입니다."
			})
		]
	});
}
function Barcode({ value }) {
	const bars = code128Bars(value);
	if (!bars) return /* @__PURE__ */ jsx("span", {
		className: "text-xs text-muted",
		children: "바코드 없음"
	});
	const quiet = 10;
	const width = bars.reduce((sum, bar) => sum + bar, 0) + 20;
	let x = quiet;
	const marks = bars.map((bar, index) => {
		const mark = index % 2 === 0 ? /* @__PURE__ */ jsx("rect", {
			x,
			y: "0",
			width: bar,
			height: "36",
			fill: "#1c2833"
		}, index) : null;
		x += bar;
		return mark;
	});
	return /* @__PURE__ */ jsxs("span", {
		className: "inline-flex flex-col items-center gap-0.5",
		children: [/* @__PURE__ */ jsx("svg", {
			viewBox: `0 0 ${width} 36`,
			width,
			height: 36,
			role: "img",
			"aria-label": `바코드 ${value}`,
			children: marks
		}), /* @__PURE__ */ jsx("span", {
			className: "text-[10px] leading-none font-medium tabular-nums",
			children: value
		})]
	});
}
function Hint({ text = "위에서 엑셀을 올리면 이 표가 채워집니다." }) {
	return /* @__PURE__ */ jsx("p", {
		className: "mx-3 mb-3 rounded-sm bg-yellow px-3 py-3 text-sm font-medium",
		children: text
	});
}

