import ExcelJS from "exceljs";
import { isoWeekOf, monthOf } from "./productivity";

type Day = {
  iso: string;
  label: string;
  weekday: string;
  dpt: string;
  center: string;
  line: number;
  planned: number;
  done: number;
  start: number | null;
  end: number | null;
  week: string;
  range: string;
  month: string;
};

export type ReportPerson = {
  period: string;
  sub: string;
  sort: string;
  name: string;
  dpt: string;
  center: string;
  lineText: string;
  hours: number;
  done: number;
};

type ArchiveLike = {
  period?: string;
  sub?: string;
  sort?: string;
  dpt?: string;
  center?: string;
  line?: number;
  planned?: number;
  done?: number;
  first?: number | null;
  last?: number | null;
};

const FONT = "맑은 고딕";
const NAVY = "FF1F3A5F";
const PALE = "FFE6ECF4";
const KPI = "FFF3F6FA";
const LINE = "FFD9DEE5";
const MUTED = "FF6B7785";
const ALT = "FFEEF3F9";
const YELLOW = "FFFFFFE0";
const BLUE = "FF0000FF";
const CENTER_ORDER = ["1센터", "2센터", "3센터"];
const DPT_ORDER = ["유제 냉장", "FF2", "FF1"];
const COMBINED = new Set(["유제 냉장", "FF2"]);

function excelTime(ms: number | null | undefined) {
  if (ms == null || !Number.isFinite(ms)) return null;
  const date = new Date(ms);
  return (date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds()) / 86400;
}

function rankCenter(id: string) {
  const index = CENTER_ORDER.indexOf(id);
  return index < 0 ? 9 : index;
}

function rankDpt(id: string) {
  const index = DPT_ORDER.indexOf(id);
  return index < 0 ? 9 : index;
}

function weekNo(label: string) {
  return label.match(/(\d+)주/)?.[1] ?? label;
}

function dot(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${year}.${month}.${day}`;
}

function shortDot(iso: string) {
  const [, month, day] = iso.split("-");
  return `${Number(month)}.${Number(day)}`;
}

function border(rule: "line" | "none" | "head" | "total") {
  const thin = { style: "thin" as const, color: { argb: LINE } };
  const medium = { style: "medium" as const, color: { argb: NAVY } };
  if (rule === "none") return {};
  if (rule === "head") return { bottom: medium };
  if (rule === "total") return { top: medium, bottom: medium };
  return { bottom: thin };
}

function put(cell: ExcelJS.Cell, value: ExcelJS.CellValue, opts: { fill?: string; bold?: boolean; size?: number; color?: string; align?: "center" | "left" | "right"; fmt?: string; wrap?: boolean; rule?: "line" | "none" | "head" | "total" } = {}) {
  cell.value = value;
  cell.font = { name: FONT, size: opts.size ?? 10, bold: opts.bold ?? false, color: { argb: opts.color ?? "FF1C1C1E" } };
  cell.alignment = { vertical: "middle", horizontal: opts.align ?? "center", wrapText: opts.wrap ?? false };
  if (opts.fill) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts.fill } };
  const rule = opts.rule ?? (opts.fill === NAVY ? "none" : opts.fill === KPI ? ((opts.size ?? 10) >= 16 ? "none" : "total") : "line");
  cell.border = border(rule);
  if (opts.fmt) cell.numFmt = opts.fmt;
}

function formula(cell: ExcelJS.Cell, text: string, opts: Parameters<typeof put>[2] = {}) {
  put(cell, { formula: text }, opts);
}

function header(sheet: ExcelJS.Worksheet, labels: string[], widths: number[]) {
  labels.forEach((label, index) => put(sheet.getRow(1).getCell(index + 1), label, { fill: NAVY, bold: true, color: "FFFFFFFF", wrap: true, size: 11, rule: "head" }));
  sheet.getRow(1).height = 30;
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
  sheet.views = [{ state: "frozen", ySplit: 1, showGridLines: false }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: labels.length } };
  sheet.pageSetup = { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 1 };
  sheet.properties.tabColor = { argb: NAVY };
}

function daysOf(rows: ArchiveLike[]): Day[] {
  const days: Day[] = [];
  for (const row of rows) {
    const iso = String(row.sort ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) continue;
    const week = isoWeekOf(iso);
    const month = Number(iso.slice(5, 7));
    const day = Number(iso.slice(8, 10));
    days.push({
      iso,
      label: `${month}월 ${day}일`,
      weekday: String(row.sub ?? ""),
      dpt: String(row.dpt ?? ""),
      center: String(row.center ?? ""),
      line: Number(row.line) || 0,
      planned: Number(row.planned) || 0,
      done: Number(row.done) || 0,
      start: excelTime(row.first),
      end: excelTime(row.last),
      week: week.label,
      range: week.range,
      month: monthOf(iso),
    });
  }
  return days;
}

function writeDaily(sheet: ExcelJS.Worksheet, rows: Day[], kind: "센터" | "라인") {
  header(sheet, ["기간", "요일/구간", "DPT", "센터", "라인", "일수", "작업건수", "완료건수", "잔여건수", "완료율", "시작", "종료", "시간", "건/시"], [14, 14, 12, 10, 10, 8, 12, 12, 11, 10, 10, 10, 10, 10]);
  const ordered = rows.filter((row) => (kind === "센터" ? row.line === 0 : row.line > 0)).sort((a, b) => a.iso.localeCompare(b.iso) || (kind === "센터" ? rankDpt(a.dpt) - rankDpt(b.dpt) || rankCenter(a.center) - rankCenter(b.center) : rankCenter(a.center) - rankCenter(b.center) || a.line - b.line || rankDpt(a.dpt) - rankDpt(b.dpt)));
  let band = 0;
  let prev = "";
  ordered.forEach((row, index) => {
    if (row.iso !== prev) {
      band = 1 - band;
      prev = row.iso;
    }
    const fill = band ? ALT : "FFFFFFFF";
    const at = index + 2;
    const line = row.line === 0 ? "센터" : `${row.line}라인`;
    put(sheet.getRow(at).getCell(1), row.label, { fill });
    put(sheet.getRow(at).getCell(2), row.weekday, { fill });
    put(sheet.getRow(at).getCell(3), row.dpt, { fill });
    put(sheet.getRow(at).getCell(4), row.center, { fill });
    put(sheet.getRow(at).getCell(5), line, { fill });
    put(sheet.getRow(at).getCell(6), 1, { fill, fmt: "0" });
    put(sheet.getRow(at).getCell(7), row.planned, { fill, fmt: "#,##0", align: "right" });
    put(sheet.getRow(at).getCell(8), row.done, { fill, fmt: "#,##0", align: "right" });
    formula(sheet.getRow(at).getCell(9), `G${at}-H${at}`, { fill, fmt: "#,##0", align: "right" });
    formula(sheet.getRow(at).getCell(10), `IF(G${at}=0,"",H${at}/G${at})`, { fill, fmt: "0.0%" });
    put(sheet.getRow(at).getCell(11), row.start, { fill, fmt: "h:mm" });
    put(sheet.getRow(at).getCell(12), row.end, { fill, fmt: "h:mm" });
    formula(sheet.getRow(at).getCell(13), `IF(OR(K${at}="",L${at}=""),"",(L${at}-K${at})*24)`, { fill, fmt: "0.00" });
    formula(sheet.getRow(at).getCell(14), `IF(OR(M${at}="",M${at}=0),"",H${at}/M${at})`, { fill, fmt: "0.0" });
    put(sheet.getRow(at).getCell(15), row.week, { fill });
    put(sheet.getRow(at).getCell(16), row.month, { fill });
    put(sheet.getRow(at).getCell(17), row.range, { fill });
  });
  sheet.getColumn(15).hidden = true;
  sheet.getColumn(16).hidden = true;
  sheet.getColumn(17).hidden = true;
  const last = Math.max(ordered.length + 1, 2);
  if (ordered.length) {
    sheet.addConditionalFormatting({
      ref: `J2:J${last}`,
      rules: [{ type: "cellIs", operator: "lessThan", formulae: ["0.99"], priority: 1, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFF4C7C3" } }, font: { name: FONT, bold: true, color: { argb: "FF9C1B1B" } } } }],
    });
  }
  return last;
}

function rollup(sheet: ExcelJS.Worksheet, rows: Day[], source: string, sourceLast: number, grain: "week" | "month", kind: "센터" | "라인") {
  header(sheet, ["기간", "요일/구간", "DPT", "센터", "라인", "일수", "작업건수", "완료건수", "잔여건수", "완료율", "시작", "종료", "시간", "건/시"], [16, 14, 12, 10, 10, 8, 12, 12, 11, 10, 10, 10, 10, 10]);
  const key = grain === "week" ? "week" : "month";
  const map = new Map<string, Day>();
  for (const row of rows) {
    if (kind === "센터" ? row.line !== 0 : row.line === 0) continue;
    const id = `${row[key]}|${row.dpt}|${row.center}|${row.line}`;
    if (!map.has(id)) map.set(id, row);
  }
  const list = [...map.values()].sort((a, b) => a[key].localeCompare(b[key], "ko") || rankCenter(a.center) - rankCenter(b.center) || a.line - b.line || rankDpt(a.dpt) - rankDpt(b.dpt));
  const col = grain === "week" ? "O" : "P";
  list.forEach((row, index) => {
    const at = index + 2;
    const line = row.line === 0 ? "센터" : `${row.line}라인`;
    const where = `'${source}'!$${col}$2:$${col}$${sourceLast},A${at},'${source}'!$C$2:$C$${sourceLast},C${at},'${source}'!$D$2:$D$${sourceLast},D${at},'${source}'!$E$2:$E$${sourceLast},E${at}`;
    put(sheet.getRow(at).getCell(1), grain === "week" ? row.week : row.month);
    put(sheet.getRow(at).getCell(2), grain === "week" ? row.range : "");
    put(sheet.getRow(at).getCell(3), row.dpt);
    put(sheet.getRow(at).getCell(4), row.center);
    put(sheet.getRow(at).getCell(5), line);
    formula(sheet.getRow(at).getCell(6), `SUMIFS('${source}'!$F$2:$F$${sourceLast},${where})`, { fmt: "0" });
    formula(sheet.getRow(at).getCell(7), `SUMIFS('${source}'!$G$2:$G$${sourceLast},${where})`, { fmt: "#,##0", align: "right" });
    formula(sheet.getRow(at).getCell(8), `SUMIFS('${source}'!$H$2:$H$${sourceLast},${where})`, { fmt: "#,##0", align: "right" });
    formula(sheet.getRow(at).getCell(9), `G${at}-H${at}`, { fmt: "#,##0", align: "right" });
    formula(sheet.getRow(at).getCell(10), `IF(G${at}=0,"",H${at}/G${at})`, { fmt: "0.0%" });
    formula(sheet.getRow(at).getCell(11), `IFERROR(AVERAGEIFS('${source}'!$K$2:$K$${sourceLast},${where}),"")`, { fmt: "h:mm" });
    formula(sheet.getRow(at).getCell(12), `IFERROR(AVERAGEIFS('${source}'!$L$2:$L$${sourceLast},${where}),"")`, { fmt: "h:mm" });
    formula(sheet.getRow(at).getCell(13), `SUMIFS('${source}'!$M$2:$M$${sourceLast},${where})`, { fmt: "0.00" });
    formula(sheet.getRow(at).getCell(14), `IF(OR(M${at}="",M${at}=0),"",H${at}/M${at})`, { fmt: "0.0" });
  });
  const last = Math.max(list.length + 1, 2);
  if (list.length) {
    sheet.addConditionalFormatting({
      ref: `J2:J${last}`,
      rules: [{ type: "cellIs", operator: "lessThan", formulae: ["0.99"], priority: 1, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFF4C7C3" } }, font: { name: FONT, bold: true, color: { argb: "FF9C1B1B" } } } }],
    });
  }
}

function dailyRow(rows: Day[], kind: "센터" | "라인") {
  const ordered = rows
    .filter((row) => (kind === "센터" ? row.line === 0 : row.line > 0))
    .sort((a, b) => a.iso.localeCompare(b.iso) || (kind === "센터" ? rankDpt(a.dpt) - rankDpt(b.dpt) || rankCenter(a.center) - rankCenter(b.center) : rankCenter(a.center) - rankCenter(b.center) || a.line - b.line || rankDpt(a.dpt) - rankDpt(b.dpt)));
  const map = new Map<string, number>();
  ordered.forEach((row, index) => map.set(`${row.iso}|${row.dpt}|${row.center}|${row.line}`, index + 2));
  return map;
}

function edgeOf(map: Map<string, number>, iso: string, center: string, line: number, column: "K" | "L", fn: "MIN" | "MAX") {
  const sheet = line === 0 ? "일별센터" : "일별라인";
  const cells = ["유제 냉장", "FF2"].flatMap((dpt) => {
    const at = map.get(`${iso}|${dpt}|${center}|${line}`);
    return at ? [`${sheet}!${column}${at}`] : [];
  });
  if (cells.length === 0) return `""`;
  if (cells.length === 1) return cells[0];
  return `${fn}(${cells.join(",")})`;
}

function writeEvidence(sheet: ExcelJS.Worksheet, rows: Day[]) {
  const title = sheet.getRow(1);
  ["기간", "센터", "작업건수", "완료건수", "최초시작", "최종종료", "가동시간(h)", "건/시"].forEach((label, index) => put(title.getCell(index + 1), label, { fill: NAVY, bold: true, color: "FFFFFFFF", wrap: true, rule: "head" }));
  ["기간", "센터", "라인", "작업건수", "완료건수", "최초시작", "최종종료", "가동시간(h)", "건/시"].forEach((label, index) => put(title.getCell(index + 11), label, { fill: NAVY, bold: true, color: "FFFFFFFF", wrap: true, rule: "head" }));
  ["기간", "작업건수", "완료건수", "최초시작", "최종종료", "가동시간(h)", "건/시"].forEach((label, index) => put(title.getCell(index + 22), label, { fill: NAVY, bold: true, color: "FFFFFFFF", wrap: true, rule: "head" }));
  put(title.getCell(30), "※ 센터·라인별 일 단위 산출표 (유제 냉장 + FF2). 작업·완료는 일별 시트를 더하고, 시작·종료는 그날의 최초·최종입니다.", { align: "left", color: MUTED, size: 9, rule: "none" });
  title.height = 30;
  [14, 10, 12, 12, 12, 12, 12, 10].forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  [14, 10, 10, 12, 12, 12, 12, 12, 10].forEach((width, index) => { sheet.getColumn(index + 11).width = width; });
  [14, 12, 12, 12, 12, 12, 10].forEach((width, index) => { sheet.getColumn(index + 22).width = width; });

  const centers = [...new Set(rows.filter((row) => row.line === 0 && COMBINED.has(row.dpt)).map((row) => row.center))].sort((a, b) => rankCenter(a) - rankCenter(b));
  const dates = [...new Set(rows.filter((row) => row.line === 0 && COMBINED.has(row.dpt)).map((row) => row.iso))].sort();
  const centerMap = dailyRow(rows, "센터");
  const lineMap = dailyRow(rows, "라인");
  const centerSpans: { center: string; from: number; to: number }[] = [];
  const dateRows = new Map<string, number[]>();
  let cursor = 2;
  for (const center of centers) {
    const from = cursor;
    for (const iso of dates) {
      const sample = rows.find((row) => row.iso === iso && row.center === center && row.line === 0 && COMBINED.has(row.dpt));
      if (!sample) continue;
      const at = cursor;
      put(sheet.getRow(at).getCell(1), sample.label);
      put(sheet.getRow(at).getCell(2), center);
      formula(sheet.getRow(at).getCell(3), `SUMIFS(일별센터!$G$2:$G$5000,일별센터!$A$2:$A$5000,A${at},일별센터!$D$2:$D$5000,B${at},일별센터!$E$2:$E$5000,"센터",일별센터!$C$2:$C$5000,"유제 냉장")+SUMIFS(일별센터!$G$2:$G$5000,일별센터!$A$2:$A$5000,A${at},일별센터!$D$2:$D$5000,B${at},일별센터!$E$2:$E$5000,"센터",일별센터!$C$2:$C$5000,"FF2")`, { fmt: "#,##0", align: "right" });
      formula(sheet.getRow(at).getCell(4), `SUMIFS(일별센터!$H$2:$H$5000,일별센터!$A$2:$A$5000,A${at},일별센터!$D$2:$D$5000,B${at},일별센터!$E$2:$E$5000,"센터",일별센터!$C$2:$C$5000,"유제 냉장")+SUMIFS(일별센터!$H$2:$H$5000,일별센터!$A$2:$A$5000,A${at},일별센터!$D$2:$D$5000,B${at},일별센터!$E$2:$E$5000,"센터",일별센터!$C$2:$C$5000,"FF2")`, { fmt: "#,##0", align: "right" });
      formula(sheet.getRow(at).getCell(5), edgeOf(centerMap, iso, center, 0, "K", "MIN"), { fmt: "hh:mm" });
      formula(sheet.getRow(at).getCell(6), edgeOf(centerMap, iso, center, 0, "L", "MAX"), { fmt: "hh:mm" });
      formula(sheet.getRow(at).getCell(7), `IF(OR(E${at}="",F${at}=""),"",(F${at}-E${at})*24)`, { fmt: "0.00" });
      formula(sheet.getRow(at).getCell(8), `IF(OR(G${at}="",G${at}=0),"",D${at}/G${at})`, { fmt: "0.0" });
      const listed = dateRows.get(iso) ?? [];
      listed.push(at);
      dateRows.set(iso, listed);
      cursor += 1;
    }
    if (cursor > from) centerSpans.push({ center, from, to: cursor - 1 });
  }
  const centerLast = Math.max(cursor - 1, 2);

  const lines = [...new Set(rows.filter((row) => row.line > 0 && COMBINED.has(row.dpt)).map((row) => `${row.center}|${row.line}`))].sort((a, b) => {
    const [ac, al] = a.split("|");
    const [bc, bl] = b.split("|");
    return rankCenter(ac) - rankCenter(bc) || Number(al) - Number(bl);
  });
  const lineSpans: { center: string; line: number; from: number; to: number }[] = [];
  cursor = 2;
  for (const key of lines) {
    const [center, lineText] = key.split("|");
    const line = Number(lineText);
    const from = cursor;
    for (const iso of dates) {
      const sample = rows.find((row) => row.iso === iso && row.center === center && row.line === line && COMBINED.has(row.dpt));
      if (!sample) continue;
      const at = cursor;
      put(sheet.getRow(at).getCell(11), sample.label);
      put(sheet.getRow(at).getCell(12), center);
      put(sheet.getRow(at).getCell(13), `${line}라인`);
      formula(sheet.getRow(at).getCell(14), `SUMIFS(일별라인!$G$2:$G$5000,일별라인!$A$2:$A$5000,K${at},일별라인!$D$2:$D$5000,L${at},일별라인!$E$2:$E$5000,M${at},일별라인!$C$2:$C$5000,"유제 냉장")+SUMIFS(일별라인!$G$2:$G$5000,일별라인!$A$2:$A$5000,K${at},일별라인!$D$2:$D$5000,L${at},일별라인!$E$2:$E$5000,M${at},일별라인!$C$2:$C$5000,"FF2")`, { fmt: "#,##0", align: "right" });
      formula(sheet.getRow(at).getCell(15), `SUMIFS(일별라인!$H$2:$H$5000,일별라인!$A$2:$A$5000,K${at},일별라인!$D$2:$D$5000,L${at},일별라인!$E$2:$E$5000,M${at},일별라인!$C$2:$C$5000,"유제 냉장")+SUMIFS(일별라인!$H$2:$H$5000,일별라인!$A$2:$A$5000,K${at},일별라인!$D$2:$D$5000,L${at},일별라인!$E$2:$E$5000,M${at},일별라인!$C$2:$C$5000,"FF2")`, { fmt: "#,##0", align: "right" });
      formula(sheet.getRow(at).getCell(16), edgeOf(lineMap, iso, center, line, "K", "MIN"), { fmt: "hh:mm" });
      formula(sheet.getRow(at).getCell(17), edgeOf(lineMap, iso, center, line, "L", "MAX"), { fmt: "hh:mm" });
      formula(sheet.getRow(at).getCell(18), `IF(OR(P${at}="",Q${at}=""),"",(Q${at}-P${at})*24)`, { fmt: "0.00" });
      formula(sheet.getRow(at).getCell(19), `IF(OR(R${at}="",R${at}=0),"",O${at}/R${at})`, { fmt: "0.0" });
      cursor += 1;
    }
    if (cursor > from) lineSpans.push({ center, line, from, to: cursor - 1 });
  }
  const lineLast = Math.max(cursor - 1, 2);

  dates.forEach((iso, index) => {
    const sample = rows.find((row) => row.iso === iso);
    const at = index + 2;
    if (!sample) return;
    put(sheet.getRow(at).getCell(22), sample.label);
    formula(sheet.getRow(at).getCell(23), `SUMIFS($C$2:$C$${centerLast},$A$2:$A$${centerLast},V${at})`, { fmt: "#,##0", align: "right" });
    formula(sheet.getRow(at).getCell(24), `SUMIFS($D$2:$D$${centerLast},$A$2:$A$${centerLast},V${at})`, { fmt: "#,##0", align: "right" });
    const hits = dateRows.get(iso) ?? [];
    const start = hits.length ? (hits.length === 1 ? `E${hits[0]}` : `MIN(${hits.map((row) => `E${row}`).join(",")})`) : `""`;
    const end = hits.length ? (hits.length === 1 ? `F${hits[0]}` : `MAX(${hits.map((row) => `F${row}`).join(",")})`) : `""`;
    formula(sheet.getRow(at).getCell(25), start, { fmt: "hh:mm" });
    formula(sheet.getRow(at).getCell(26), end, { fmt: "hh:mm" });
    formula(sheet.getRow(at).getCell(27), `IF(OR(Y${at}="",Z${at}=""),"",(Z${at}-Y${at})*24)`, { fmt: "0.00" });
    formula(sheet.getRow(at).getCell(28), `IF(OR(AA${at}="",AA${at}=0),"",X${at}/AA${at})`, { fmt: "0.0" });
  });
  sheet.views = [{ state: "frozen", ySplit: 1, showGridLines: false }];
  sheet.pageSetup = { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 1 };
  sheet.properties.tabColor = { argb: "FF8E8E93" };
  return { centers, dates, centerSpans, lineSpans, centerLast, lineLast, dateLast: Math.max(dates.length + 1, 2) };
}

function writePeople(sheet: ExcelJS.Worksheet, people: ReportPerson[]) {
  header(sheet, ["기간", "구간", "이름", "DPT", "센터", "라인", "시간", "건/시", "순위"], [16, 14, 12, 12, 22, 28, 10, 10, 8]);
  const ordered = [...people].sort((a, b) => a.sort.localeCompare(b.sort) || b.done / (b.hours || 1) - a.done / (a.hours || 1));
  ordered.forEach((person, index) => {
    const at = index + 2;
    put(sheet.getRow(at).getCell(1), person.period);
    put(sheet.getRow(at).getCell(2), person.sub);
    put(sheet.getRow(at).getCell(3), person.name, { align: "left" });
    put(sheet.getRow(at).getCell(4), person.dpt);
    put(sheet.getRow(at).getCell(5), person.center);
    put(sheet.getRow(at).getCell(6), person.lineText, { align: "left" });
    put(sheet.getRow(at).getCell(7), Number(person.hours.toFixed(2)), { fmt: "0.00" });
    put(sheet.getRow(at).getCell(10), person.done, { fmt: "0" });
    formula(sheet.getRow(at).getCell(8), `IF(G${at}=0,"",J${at}/G${at})`, { fmt: "0.0" });
    formula(sheet.getRow(at).getCell(9), `IF(OR(H${at}="",H${at}=0),"",COUNTIFS($A$2:$A$5000,A${at},$H$2:$H$5000,">"&H${at})+1)`, { fmt: "0" });
  });
  sheet.getColumn(10).hidden = true;
  const last = Math.max(ordered.length + 1, 2);
  if (ordered.length) {
    sheet.addConditionalFormatting({
      ref: `I2:I${last}`,
      rules: [{ type: "cellIs", operator: "between", formulae: ["1", "3"], priority: 1, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFFF3BF" } }, font: { name: FONT, bold: true } } }],
    });
  }
}

function fillGap(sheet: ExcelJS.Worksheet, row: number, from: number, to: number) {
  for (let column = from; column <= to; column += 1) {
    const cell = sheet.getRow(row).getCell(column);
    if (cell.value == null || cell.value === "") put(cell, null, { fill: KPI, bold: true });
  }
}

function section(sheet: ExcelJS.Worksheet, row: number, text: string, until = 9) {
  for (let column = 2; column <= until; column += 1) {
    const cell = sheet.getRow(row).getCell(column);
    cell.value = column === 2 ? text : null;
    cell.font = { name: FONT, size: column === 2 ? 11 : 12, bold: column === 2, color: { argb: column === 2 ? NAVY : "FF1C1C1E" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALE } };
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: false };
  }
  sheet.getRow(row).height = 22;
}

function writeSummary(sheet: ExcelJS.Worksheet, rows: Day[], evidence: ReturnType<typeof writeEvidence>, monthLast: number, dayCenterLast: number, dayLineLast: number, hasPeople: boolean) {
  sheet.properties.tabColor = { argb: NAVY };
  sheet.views = [{ showGridLines: false }];
  sheet.pageSetup = { orientation: "portrait", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 1 };
  [2, 16, 14, 14, 14, 14, 14, 14, 14].forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  const dates = [...new Set(rows.filter((row) => row.line === 0).map((row) => row.iso))].sort();
  const months = [...new Set(rows.map((row) => row.month))];
  const monthLabel = months.length === 1 ? months[0].replace(/^\d+년\s*/, "") : "";
  const title = monthLabel ? `센터 생산성 요약 (${monthLabel} 누계)` : "센터 생산성 요약";
  const from = dates[0] ? dot(dates[0]) : "";
  const to = dates.at(-1) ? shortDot(dates.at(-1)!) : "";
  put(sheet.getRow(2).getCell(2), title, { bold: true, size: 16, color: NAVY, align: "left", rule: "none" });
  sheet.mergeCells(2, 2, 2, 9);
  put(sheet.getRow(3).getCell(2), `집계기간 ${from} ~ ${to} (${dates.length}일) · 아래 수치는 각 시트에 자동 연동됩니다`, { size: 9, color: MUTED, align: "left", rule: "none" });
  sheet.mergeCells(3, 2, 3, 9);
  [["총 작업건수", 2], ["총 완료건수", 4], ["총 잔여건수", 6], ["완료율", 8]].forEach(([label, column]) => {
    put(sheet.getRow(5).getCell(Number(column)), label, { fill: NAVY, bold: true, color: "FFFFFFFF" });
    sheet.mergeCells(5, Number(column), 5, Number(column) + 1);
  });
  formula(sheet.getRow(6).getCell(2), `SUM(월별센터!G2:G${monthLast})`, { fill: KPI, bold: true, size: 18, color: NAVY, fmt: "#,##0" });
  formula(sheet.getRow(6).getCell(4), `SUM(월별센터!H2:H${monthLast})`, { fill: KPI, bold: true, size: 18, color: NAVY, fmt: "#,##0" });
  formula(sheet.getRow(6).getCell(6), `SUM(월별센터!I2:I${monthLast})`, { fill: KPI, bold: true, size: 18, color: NAVY, fmt: "#,##0" });
  formula(sheet.getRow(6).getCell(8), `IF(B6=0,"",D6/B6)`, { fill: KPI, bold: true, size: 18, color: NAVY, fmt: "0.00%" });
  [2, 4, 6, 8].forEach((column) => sheet.mergeCells(6, column, 6, column + 1));

  section(sheet, 8, "① 센터별 실적");
  ["센터", "작업건수", "완료건수", "잔여건수", "완료율", "유제냉장 건/시", "FF2 건/시", "작업 비중"].forEach((label, index) => put(sheet.getRow(9).getCell(index + 2), label, { fill: NAVY, bold: true, color: "FFFFFFFF" }));
  evidence.centers.forEach((center, index) => {
    const at = 10 + index;
    put(sheet.getRow(at).getCell(2), center, { bold: true });
    formula(sheet.getRow(at).getCell(3), `SUMIFS(월별센터!G$2:G$${monthLast},월별센터!$D$2:$D$${monthLast},$B${at})`, { fmt: "#,##0", align: "right" });
    formula(sheet.getRow(at).getCell(4), `SUMIFS(월별센터!H$2:H$${monthLast},월별센터!$D$2:$D$${monthLast},$B${at})`, { fmt: "#,##0", align: "right" });
    formula(sheet.getRow(at).getCell(5), `SUMIFS(월별센터!I$2:I$${monthLast},월별센터!$D$2:$D$${monthLast},$B${at})`, { fmt: "#,##0", align: "right" });
    formula(sheet.getRow(at).getCell(6), `IF(C${at}=0,"",D${at}/C${at})`, { fmt: "0.00%" });
    formula(sheet.getRow(at).getCell(7), `SUMIFS(월별센터!$N$2:$N$${monthLast},월별센터!$D$2:$D$${monthLast},$B${at},월별센터!$C$2:$C$${monthLast},"유제 냉장")`, { fmt: "#,##0.0", align: "right" });
    formula(sheet.getRow(at).getCell(8), `SUMIFS(월별센터!$N$2:$N$${monthLast},월별센터!$D$2:$D$${monthLast},$B${at},월별센터!$C$2:$C$${monthLast},"FF2")`, { fmt: "#,##0.0", align: "right" });
    formula(sheet.getRow(at).getCell(9), `IF($C$${10 + evidence.centers.length}=0,"",C${at}/$C$${10 + evidence.centers.length})`, { fmt: "0.0%" });
  });
  const totalRow = 10 + evidence.centers.length;
  put(sheet.getRow(totalRow).getCell(2), "합계", { fill: KPI, bold: true });
  formula(sheet.getRow(totalRow).getCell(3), `SUM(C10:C${totalRow - 1})`, { fill: KPI, bold: true, fmt: "#,##0", align: "right" });
  formula(sheet.getRow(totalRow).getCell(4), `SUM(D10:D${totalRow - 1})`, { fill: KPI, bold: true, fmt: "#,##0", align: "right" });
  formula(sheet.getRow(totalRow).getCell(5), `SUM(E10:E${totalRow - 1})`, { fill: KPI, bold: true, fmt: "#,##0", align: "right" });
  formula(sheet.getRow(totalRow).getCell(6), `IF(C${totalRow}=0,"",D${totalRow}/C${totalRow})`, { fill: KPI, bold: true, fmt: "0.00%" });
  formula(sheet.getRow(totalRow).getCell(9), `SUM(I10:I${totalRow - 1})`, { fill: KPI, bold: true, fmt: "0.0%" });
  fillGap(sheet, totalRow, 2, 9);
  sheet.getRow(9).height = 22;

  const weeks = [...new Map(rows.filter((row) => row.line === 0).map((row) => [row.week, row])).values()];
  const weekDays = new Map<string, Set<string>>();
  for (const row of rows) {
    if (row.line !== 0) continue;
    const set = weekDays.get(row.week) ?? new Set<string>();
    set.add(row.iso);
    weekDays.set(row.week, set);
  }
  const weekTitle = weeks.length >= 2
    ? `② 주차별 비교 (일평균 기준 — ${weeks.map((row) => `${weekNo(row.week)}주 ${weekDays.get(row.week)?.size ?? 0}일`).join(" / ")})`
    : "② 주차별 비교 (일평균 기준)";
  const weekHead = totalRow + 2;
  section(sheet, weekHead, weekTitle);
  const head = sheet.getRow(weekHead + 1);
  put(head.getCell(2), "센터", { fill: NAVY, bold: true, color: "FFFFFFFF" });
  if (weeks.length >= 2) {
    const left = weeks[0];
    const right = weeks[weeks.length - 1];
    ["", `${weekNo(left.week)}주 일평균`, `${weekNo(right.week)}주 일평균`, "증감률", `${weekNo(left.week)}주 완료율`, `${weekNo(right.week)}주 완료율`, "증감(%p)", `${weekNo(right.week)}주 일수`].forEach((label, index) => {
      if (index === 0) return;
      put(head.getCell(index + 2), label, { fill: NAVY, bold: true, color: "FFFFFFFF", wrap: true });
    });
    evidence.centers.forEach((center, index) => {
      const at = weekHead + 2 + index;
      put(sheet.getRow(at).getCell(2), center, { bold: true });
      const avg = (week: string, column: number) => `SUMIFS(주별센터!$G$2:$G$500,주별센터!$D$2:$D$500,$B${at},주별센터!$A$2:$A$500,"${week}")/SUMIFS(주별센터!$F$2:$F$500,주별센터!$D$2:$D$500,$B${at},주별센터!$A$2:$A$500,"${week}",주별센터!$C$2:$C$500,"유제 냉장")`;
      formula(sheet.getRow(at).getCell(3), avg(left.week, 3), { fmt: "#,##0", align: "right" });
      formula(sheet.getRow(at).getCell(4), avg(right.week, 4), { fmt: "#,##0", align: "right" });
      formula(sheet.getRow(at).getCell(5), `IF(C${at}=0,"",D${at}/C${at}-1)`, { fmt: "+0.0%;[Red]-0.0%;0.0%" });
      const rate = (week: string) => `SUMIFS(주별센터!$H$2:$H$500,주별센터!$D$2:$D$500,$B${at},주별센터!$A$2:$A$500,"${week}")/SUMIFS(주별센터!$G$2:$G$500,주별센터!$D$2:$D$500,$B${at},주별센터!$A$2:$A$500,"${week}")`;
      formula(sheet.getRow(at).getCell(6), rate(left.week), { fmt: "0.00%" });
      formula(sheet.getRow(at).getCell(7), rate(right.week), { fmt: "0.00%" });
      formula(sheet.getRow(at).getCell(8), `IF(OR(F${at}="",G${at}=""),"",(G${at}-F${at})*100)`, { fmt: "+0.00;[Red]-0.00;0.00" });
      formula(sheet.getRow(at).getCell(9), `SUMIFS(주별센터!$F$2:$F$500,주별센터!$D$2:$D$500,$B${at},주별센터!$A$2:$A$500,"${right.week}",주별센터!$C$2:$C$500,"유제 냉장")`, { fmt: "0" });
    });
    const all = weekHead + 2 + evidence.centers.length;
    put(sheet.getRow(all).getCell(2), "전체", { fill: KPI, bold: true });
    formula(sheet.getRow(all).getCell(3), `SUM(C${weekHead + 2}:C${all - 1})`, { fill: KPI, bold: true, fmt: "#,##0", align: "right" });
    formula(sheet.getRow(all).getCell(4), `SUM(D${weekHead + 2}:D${all - 1})`, { fill: KPI, bold: true, fmt: "#,##0", align: "right" });
    formula(sheet.getRow(all).getCell(5), `IF(C${all}=0,"",D${all}/C${all}-1)`, { fill: KPI, bold: true, fmt: "+0.0%;[Red]-0.0%;0.0%" });
    formula(sheet.getRow(all).getCell(6), `SUMIFS(주별센터!$H$2:$H$500,주별센터!$A$2:$A$500,"${left.week}")/SUMIFS(주별센터!$G$2:$G$500,주별센터!$A$2:$A$500,"${left.week}")`, { fill: KPI, bold: true, fmt: "0.00%" });
    formula(sheet.getRow(all).getCell(7), `SUMIFS(주별센터!$H$2:$H$500,주별센터!$A$2:$A$500,"${right.week}")/SUMIFS(주별센터!$G$2:$G$500,주별센터!$A$2:$A$500,"${right.week}")`, { fill: KPI, bold: true, fmt: "0.00%" });
    formula(sheet.getRow(all).getCell(8), `(G${all}-F${all})*100`, { fill: KPI, bold: true, fmt: "+0.00;[Red]-0.00;0.00" });
    fillGap(sheet, all, 2, 9);
  }

  const trend = weekHead + 5 + evidence.centers.length;
  section(sheet, trend, "③ 일별 추이 (전 센터 합산)");
  ["일자", "요일", "작업건수", "완료건수", "완료율"].forEach((label, index) => put(sheet.getRow(trend + 1).getCell(index + 2), label, { fill: NAVY, bold: true, color: "FFFFFFFF" }));
  dates.forEach((iso, index) => {
    const sample = rows.find((row) => row.iso === iso && row.line === 0);
    const at = trend + 2 + index;
    put(sheet.getRow(at).getCell(2), sample?.label ?? iso);
    formula(sheet.getRow(at).getCell(3), `IFERROR(INDEX(일별센터!$B$2:$B$${dayCenterLast},MATCH(B${at},일별센터!$A$2:$A$${dayCenterLast},0)),"")`);
    formula(sheet.getRow(at).getCell(4), `SUMIFS(일별센터!$G$2:$G$${dayCenterLast},일별센터!$A$2:$A$${dayCenterLast},$B${at})`, { fmt: "#,##0", align: "right" });
    formula(sheet.getRow(at).getCell(5), `SUMIFS(일별센터!$H$2:$H$${dayCenterLast},일별센터!$A$2:$A$${dayCenterLast},$B${at})`, { fmt: "#,##0", align: "right" });
    formula(sheet.getRow(at).getCell(6), `IF(D${at}=0,"",E${at}/D${at})`, { fmt: "0.00%" });
  });
  const trendEnd = trend + 1 + dates.length;
  const sumRow = trendEnd + 1;
  put(sheet.getRow(sumRow).getCell(2), "합계", { fill: KPI, bold: true });
  formula(sheet.getRow(sumRow).getCell(4), `SUM(D${trend + 2}:D${trendEnd})`, { fill: KPI, bold: true, fmt: "#,##0", align: "right" });
  formula(sheet.getRow(sumRow).getCell(5), `SUM(E${trend + 2}:E${trendEnd})`, { fill: KPI, bold: true, fmt: "#,##0", align: "right" });
  formula(sheet.getRow(sumRow).getCell(6), `IF(D${sumRow}=0,"",E${sumRow}/D${sumRow})`, { fill: KPI, bold: true, fmt: "0.00%" });
  fillGap(sheet, sumRow, 2, 6);
  sheet.getRow(weekHead + 1).height = 22;
  sheet.getRow(trend + 1).height = 22;

  const check = sumRow + 2;
  section(sheet, check, "④ 점검 포인트");
  const checks: [string, string, string?][] = [
    ["일별 센터 단위 완료율 99% 미만 (건)", `COUNTIF(일별센터!$J$2:$J$${dayCenterLast},"<0.99")`, "0"],
    ["일별 라인 단위 완료율 99% 미만 (건)", `COUNTIF(일별라인!$J$2:$J$${dayLineLast},"<0.99")`, "0"],
    ["센터 단위 최저 완료율", `MIN(일별센터!$J$2:$J$${dayCenterLast})`, "0.00%"],
    ["  └ 해당 일자 / 센터 / DPT", `INDEX(일별센터!$A$2:$A$${dayCenterLast},MATCH(G${check + 3},일별센터!$J$2:$J$${dayCenterLast},0))&" / "&INDEX(일별센터!$D$2:$D$${dayCenterLast},MATCH(G${check + 3},일별센터!$J$2:$J$${dayCenterLast},0))&" / "&INDEX(일별센터!$C$2:$C$${dayCenterLast},MATCH(G${check + 3},일별센터!$J$2:$J$${dayCenterLast},0))`],
    ["작업건수 최대 일자", `INDEX(B${trend + 2}:B${trendEnd},MATCH(MAX(D${trend + 2}:D${trendEnd}),D${trend + 2}:D${trendEnd},0))`],
    ["  └ 작업건수", `MAX(D${trend + 2}:D${trendEnd})`, "#,##0"],
  ];
  checks.forEach(([label, text, fmt], index) => {
    const at = check + 1 + index;
    put(sheet.getRow(at).getCell(2), label, { align: "left" });
    sheet.mergeCells(at, 2, at, 6);
    formula(sheet.getRow(at).getCell(7), text, { bold: true, fmt, align: "right" });
    sheet.mergeCells(at, 7, at, 9);
    const bottom = { style: "thin" as const, color: { argb: LINE } };
    for (let column = 2; column <= 9; column += 1) sheet.getRow(at).getCell(column).border = { bottom };
  });

  const top = check + 8;
  section(sheet, top, `⑤ 인원 생산성 TOP5 (${monthLabel ? `${monthLabel} 누계` : "누계"}, 건/시)`);
  ["순위", "이름", "센터", "시간", "건/시"].forEach((label, index) => {
    const column = index < 2 ? index + 2 : index + 3;
    put(sheet.getRow(top + 1).getCell(column), label, { fill: NAVY, bold: true, color: "FFFFFFFF" });
  });
  sheet.mergeCells(top + 1, 4, top + 1, 5);
  if (!hasPeople) {
    put(sheet.getRow(top + 2).getCell(2), "근태표를 올리면 이름이 붙습니다.", { align: "left", color: MUTED, rule: "none" });
    sheet.mergeCells(top + 2, 2, top + 2, 7);
  } else {
    for (let rank = 1; rank <= 5; rank += 1) {
      const at = top + 1 + rank;
      formula(sheet.getRow(at).getCell(2), `IFERROR(INDEX(사람월별!I:I,MATCH(LARGE(사람월별!H:H,${rank}),사람월별!H:H,0)),"")`, { fmt: "0" });
      formula(sheet.getRow(at).getCell(3), `IFERROR(INDEX(사람월별!C:C,MATCH(LARGE(사람월별!H:H,${rank}),사람월별!H:H,0)),"")`);
      formula(sheet.getRow(at).getCell(4), `IFERROR(INDEX(사람월별!E:E,MATCH(LARGE(사람월별!H:H,${rank}),사람월별!H:H,0)),"")`);
      sheet.mergeCells(at, 4, at, 5);
      formula(sheet.getRow(at).getCell(6), `IFERROR(INDEX(사람월별!G:G,MATCH(LARGE(사람월별!H:H,${rank}),사람월별!H:H,0)),"")`, { fmt: "#,##0.00", align: "right" });
      formula(sheet.getRow(at).getCell(7), `IFERROR(LARGE(사람월별!H:H,${rank}),"")`, { bold: true, fmt: "#,##0.0", align: "right" });
    }
  }
  const note = top + 8;
  put(sheet.getRow(note).getCell(2), "※ 건/시 = 완료건수 ÷ 작업시간. 증감(%p)은 완료율 차이, 일평균 = 작업건수 ÷ 일수.", { size: 9, color: MUTED, align: "left", rule: "none" });
  sheet.mergeCells(note, 2, note, 9);
  sheet.getRow(2).height = 30;
  sheet.getRow(5).height = 20;
  sheet.getRow(6).height = 36;
  sheet.getRow(top + 1).height = 22;
  if (!dates.length) return null;
  return { header: trend + 1, first: trend + 2, last: trendEnd };
}

function judgeRule(ref: string) {
  return {
    ref,
    rules: [
      { type: "cellIs" as const, operator: "equal" as const, formulae: ['"충족"'], priority: 1, style: { fill: { type: "pattern" as const, pattern: "solid" as const, bgColor: { argb: "FFD8F3DC" } }, font: { name: FONT, bold: true, color: { argb: "FF1B7F3A" } } } },
      { type: "cellIs" as const, operator: "equal" as const, formulae: ['"부족"'], priority: 2, style: { fill: { type: "pattern" as const, pattern: "solid" as const, bgColor: { argb: "FFF4C7C3" } }, font: { name: FONT, bold: true, color: { argb: "FF9C1B1B" } } } },
    ],
  };
}

function writeAnalysis(sheet: ExcelJS.Worksheet, evidence: ReturnType<typeof writeEvidence>) {
  sheet.properties.tabColor = { argb: "FFC0504D" };
  sheet.views = [{ showGridLines: false }];
  sheet.pageSetup = { orientation: "portrait", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 1 };
  [2, 14, 13, 14, 14, 14, 14, 14, 14, 14].forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  const dates = evidence.dates;
  put(sheet.getRow(2).getCell(2), "센터·라인 작업량 / 생산성 분석", { bold: true, size: 16, color: NAVY, align: "left", rule: "none" });
  sheet.mergeCells(2, 2, 2, 10);
  put(sheet.getRow(3).getCell(2), `${dates[0] ? dot(dates[0]) : ""} ~ ${dates.at(-1) ? shortDot(dates.at(-1)!) : ""} (${dates.length}일) · 일 기준은 유제 냉장 + FF2 합산 · 산출 근거는 「분석데이터」 시트`, { size: 9, color: MUTED, align: "left", rule: "none" });
  sheet.mergeCells(3, 2, 3, 10);
  section(sheet, 5, "기준 설정  (9시 ~ 6시 + 1시간 연장)  ※ 파란색 칸은 수정 가능", 10);
  ["기준 시작", "기준 종료", "연장(h)", "허용 종료시각", "허용 가동시간(h)"].forEach((label, index) => put(sheet.getRow(6).getCell(index + 2), label, { fill: NAVY, bold: true, color: "FFFFFFFF", wrap: true }));
  put(sheet.getRow(7).getCell(2), 9 / 24, { fill: YELLOW, color: BLUE, bold: true, fmt: "hh:mm" });
  put(sheet.getRow(7).getCell(3), 18 / 24, { fill: YELLOW, color: BLUE, bold: true, fmt: "hh:mm" });
  put(sheet.getRow(7).getCell(4), 1, { fill: YELLOW, color: BLUE, bold: true, fmt: "0" });
  formula(sheet.getRow(7).getCell(5), "C7+D7/24", { bold: true, fmt: "hh:mm" });
  formula(sheet.getRow(7).getCell(6), "(C7-B7)*24+D7", { bold: true, fmt: "0.0" });
  put(sheet.getRow(7).getCell(7), "가동시간 = 최초 시작 ~ 최종 종료 (휴게 포함 시계 기준)", { align: "left", color: MUTED, size: 9, rule: "none" });
  sheet.mergeCells(7, 7, 7, 10);

  section(sheet, 9, `① 센터별 일 작업건수 · 생산성 (일 단위 ${dates.length}일 기준)`, 10);
  ["센터", "일 평균\n작업건수", "일 중간값\n작업건수", "최소", "최대", "건/시\n일 평균", "건/시\n일 중간값", "소속 라인\n건/시 중간값"].forEach((label, index) => put(sheet.getRow(10).getCell(index + 2), label, { fill: NAVY, bold: true, color: "FFFFFFFF", wrap: true }));
  evidence.centerSpans.forEach((span, index) => {
    const at = 11 + index;
    const lines = evidence.lineSpans.filter((line) => line.center === span.center);
    put(sheet.getRow(at).getCell(2), span.center, { bold: true });
    formula(sheet.getRow(at).getCell(3), `AVERAGE(분석데이터!C${span.from}:C${span.to})`, { fmt: "#,##0.0", align: "right" });
    formula(sheet.getRow(at).getCell(4), `MEDIAN(분석데이터!C${span.from}:C${span.to})`, { fmt: "#,##0", align: "right" });
    formula(sheet.getRow(at).getCell(5), `MIN(분석데이터!C${span.from}:C${span.to})`, { fmt: "#,##0", align: "right" });
    formula(sheet.getRow(at).getCell(6), `MAX(분석데이터!C${span.from}:C${span.to})`, { fmt: "#,##0", align: "right" });
    formula(sheet.getRow(at).getCell(7), `AVERAGE(분석데이터!H${span.from}:H${span.to})`, { fmt: "0.0", align: "right" });
    formula(sheet.getRow(at).getCell(8), `MEDIAN(분석데이터!H${span.from}:H${span.to})`, { fmt: "0.0", align: "right" });
    formula(sheet.getRow(at).getCell(9), lines.length ? `MEDIAN(분석데이터!S${lines[0].from}:S${lines[lines.length - 1].to})` : `""`, { fmt: "0.0", align: "right" });
  });
  const allCenter = 11 + evidence.centerSpans.length;
  put(sheet.getRow(allCenter).getCell(2), evidence.centers.length === 3 ? "전체(3센터)" : "전체", { fill: KPI, bold: true });
  ["C", "C", "C", "C", "H", "H", "S"].forEach((column, index) => {
    const fn = ["AVERAGE", "MEDIAN", "MIN", "MAX", "AVERAGE", "MEDIAN", "MEDIAN"][index];
    const fmt = index < 2 ? "#,##0.0" : index < 4 ? "#,##0" : "0.0";
    const range = column === "S" ? `분석데이터!S2:S${evidence.lineLast}` : `분석데이터!${column === "H" ? "AB" : "W"}2:${column === "H" ? "AB" : "W"}${evidence.dateLast}`;
    formula(sheet.getRow(allCenter).getCell(index + 3), `${fn}(${range})`, { fill: KPI, bold: true, fmt, align: "right" });
  });

  let row = allCenter + 2;
  section(sheet, row, "② 라인별 일 작업건수 · 생산성 (라인 1개 × 하루 기준)", 10);
  row += 1;
  ["센터", "라인", "일 평균\n작업건수", "일 중간값\n작업건수", "건/시\n일 평균", "건/시\n일 중간값", "평균\n가동시간(h)", "허용 종료시각\n초과 일수", "판정"].forEach((label, index) => put(sheet.getRow(row).getCell(index + 2), label, { fill: NAVY, bold: true, color: "FFFFFFFF", wrap: true }));
  const judgeRows: number[] = [];
  let current = "";
  const centerLineRanges: { center: string; from: number; to: number }[] = [];
  for (const line of evidence.lineSpans) {
    row += 1;
    if (line.center !== current) {
      if (current) centerLineRanges[centerLineRanges.length - 1].to = row - 1;
      centerLineRanges.push({ center: line.center, from: row, to: row });
      current = line.center;
    }
    put(sheet.getRow(row).getCell(2), line.center);
    put(sheet.getRow(row).getCell(3), `${line.line}라인`);
    formula(sheet.getRow(row).getCell(4), `AVERAGE(분석데이터!N${line.from}:N${line.to})`, { fmt: "#,##0.0", align: "right" });
    formula(sheet.getRow(row).getCell(5), `MEDIAN(분석데이터!N${line.from}:N${line.to})`, { fmt: "#,##0.0", align: "right" });
    formula(sheet.getRow(row).getCell(6), `AVERAGE(분석데이터!S${line.from}:S${line.to})`, { fmt: "0.0", align: "right" });
    formula(sheet.getRow(row).getCell(7), `MEDIAN(분석데이터!S${line.from}:S${line.to})`, { fmt: "0.0", align: "right" });
    formula(sheet.getRow(row).getCell(8), `AVERAGE(분석데이터!R${line.from}:R${line.to})`, { fmt: "0.00", align: "right" });
    formula(sheet.getRow(row).getCell(9), `COUNTIF(분석데이터!Q${line.from}:Q${line.to},">"&($E$7+0.00001))`, { fmt: "0" });
    formula(sheet.getRow(row).getCell(10), `IF(H${row}="","",IF(H${row}<=$F$7,"충족","부족"))`, { bold: true });
    judgeRows.push(row);
  }
  if (centerLineRanges.length) centerLineRanges[centerLineRanges.length - 1].to = row;
  for (const block of centerLineRanges) {
    row += 1;
    const data = evidence.lineSpans.filter((line) => line.center === block.center);
    const from = data[0].from;
    const to = data[data.length - 1].to;
    put(sheet.getRow(row).getCell(2), `${block.center} 라인 전체`, { fill: KPI, bold: true });
    sheet.mergeCells(row, 2, row, 3);
    formula(sheet.getRow(row).getCell(4), `AVERAGE(분석데이터!N${from}:N${to})`, { fill: KPI, bold: true, fmt: "#,##0.0", align: "right" });
    formula(sheet.getRow(row).getCell(5), `MEDIAN(분석데이터!N${from}:N${to})`, { fill: KPI, bold: true, fmt: "#,##0.0", align: "right" });
    formula(sheet.getRow(row).getCell(6), `AVERAGE(분석데이터!S${from}:S${to})`, { fill: KPI, bold: true, fmt: "0.0", align: "right" });
    formula(sheet.getRow(row).getCell(7), `MEDIAN(분석데이터!S${from}:S${to})`, { fill: KPI, bold: true, fmt: "0.0", align: "right" });
    formula(sheet.getRow(row).getCell(8), `AVERAGE(분석데이터!R${from}:R${to})`, { fill: KPI, bold: true, fmt: "0.00", align: "right" });
    formula(sheet.getRow(row).getCell(9), `COUNTIF(분석데이터!Q${from}:Q${to},">"&($E$7+0.00001))`, { fill: KPI, bold: true, fmt: "0" });
    formula(sheet.getRow(row).getCell(10), `IF(H${row}="","",IF(H${row}<=$F$7,"충족","부족"))`, { fill: KPI, bold: true });
    judgeRows.push(row);
  }
  if (evidence.lineSpans.length) {
    row += 1;
    const from = evidence.lineSpans[0].from;
    const to = evidence.lineSpans[evidence.lineSpans.length - 1].to;
    put(sheet.getRow(row).getCell(2), "전체 라인", { fill: KPI, bold: true });
    sheet.mergeCells(row, 2, row, 3);
    formula(sheet.getRow(row).getCell(4), `AVERAGE(분석데이터!N${from}:N${to})`, { fill: KPI, bold: true, fmt: "#,##0.0", align: "right" });
    formula(sheet.getRow(row).getCell(5), `MEDIAN(분석데이터!N${from}:N${to})`, { fill: KPI, bold: true, fmt: "#,##0.0", align: "right" });
    formula(sheet.getRow(row).getCell(6), `AVERAGE(분석데이터!S${from}:S${to})`, { fill: KPI, bold: true, fmt: "0.0", align: "right" });
    formula(sheet.getRow(row).getCell(7), `MEDIAN(분석데이터!S${from}:S${to})`, { fill: KPI, bold: true, fmt: "0.0", align: "right" });
    formula(sheet.getRow(row).getCell(8), `AVERAGE(분석데이터!R${from}:R${to})`, { fill: KPI, bold: true, fmt: "0.00", align: "right" });
    formula(sheet.getRow(row).getCell(9), `COUNTIF(분석데이터!Q${from}:Q${to},">"&($E$7+0.00001))`, { fill: KPI, bold: true, fmt: "0" });
    formula(sheet.getRow(row).getCell(10), `IF(H${row}="","",IF(H${row}<=$F$7,"충족","부족"))`, { fill: KPI, bold: true });
    judgeRows.push(row);
  }

  row += 2;
  section(sheet, row, "③ 9시~6시 + 1시간 연장 대비 센터 판정 (생산성 충족 / 부족)", 10);
  row += 1;
  ["센터", "평균 시작", "평균 종료", "평균\n가동시간(h)", "허용\n가동시간(h)", "여유(+) /\n초과(−) h", "18시 이후\n종료 일수", "허용 종료\n초과 일수", "판정"].forEach((label, index) => put(sheet.getRow(row).getCell(index + 2), label, { fill: NAVY, bold: true, color: "FFFFFFFF", wrap: true }));
  const judgeStart = row + 1;
  evidence.centerSpans.forEach((span) => {
    row += 1;
    put(sheet.getRow(row).getCell(2), span.center, { bold: true });
    formula(sheet.getRow(row).getCell(3), `AVERAGE(분석데이터!E${span.from}:E${span.to})`, { fmt: "hh:mm" });
    formula(sheet.getRow(row).getCell(4), `AVERAGE(분석데이터!F${span.from}:F${span.to})`, { fmt: "hh:mm" });
    formula(sheet.getRow(row).getCell(5), `AVERAGE(분석데이터!G${span.from}:G${span.to})`, { fmt: "0.00" });
    formula(sheet.getRow(row).getCell(6), "$F$7", { fmt: "0.0" });
    formula(sheet.getRow(row).getCell(7), `F${row}-E${row}`, { fmt: "0.00" });
    formula(sheet.getRow(row).getCell(8), `COUNTIF(분석데이터!F${span.from}:F${span.to},">"&($C$7+0.00001))`, { fmt: "0" });
    formula(sheet.getRow(row).getCell(9), `COUNTIF(분석데이터!F${span.from}:F${span.to},">"&($E$7+0.00001))`, { fmt: "0" });
    formula(sheet.getRow(row).getCell(10), `IF(E${row}="","",IF(E${row}<=F${row},"충족","부족"))`, { bold: true });
  });
  row += 1;
  put(sheet.getRow(row).getCell(2), "전체", { fill: KPI, bold: true });
  formula(sheet.getRow(row).getCell(3), `AVERAGE(분석데이터!Y2:Y${evidence.dateLast})`, { fill: KPI, bold: true, fmt: "hh:mm" });
  formula(sheet.getRow(row).getCell(4), `AVERAGE(분석데이터!Z2:Z${evidence.dateLast})`, { fill: KPI, bold: true, fmt: "hh:mm" });
  formula(sheet.getRow(row).getCell(5), `AVERAGE(분석데이터!AA2:AA${evidence.dateLast})`, { fill: KPI, bold: true, fmt: "0.00" });
  formula(sheet.getRow(row).getCell(6), "$F$7", { fill: KPI, bold: true, fmt: "0.0" });
  formula(sheet.getRow(row).getCell(7), `F${row}-E${row}`, { fill: KPI, bold: true, fmt: "0.00" });
  formula(sheet.getRow(row).getCell(8), `COUNTIF(분석데이터!Z2:Z${evidence.dateLast},">"&($C$7+0.00001))`, { fill: KPI, bold: true, fmt: "0" });
  formula(sheet.getRow(row).getCell(9), `COUNTIF(분석데이터!Z2:Z${evidence.dateLast},">"&($E$7+0.00001))`, { fill: KPI, bold: true, fmt: "0" });
  formula(sheet.getRow(row).getCell(10), `IF(E${row}="","",IF(E${row}<=F${row},"충족","부족"))`, { fill: KPI, bold: true });
  if (judgeRows.length) sheet.addConditionalFormatting(judgeRule(`J${judgeRows[0]}:J${judgeRows[judgeRows.length - 1]}`));
  sheet.addConditionalFormatting(judgeRule(`J${judgeStart}:J${row}`));
  row += 2;
  ["※ 일 작업건수 = 해당 센터(라인)의 유제 냉장 + FF2 하루 합계, 중간값은 그 일수 값의 중앙값입니다.", "※ 건/시 = 완료건수 ÷ 가동시간(최초 시작~최종 종료). 일별 시트의 DPT별 건/시와 산출 기준이 달라 수치가 다릅니다.", "※ 판정: 평균 가동시간이 허용 가동시간(9시~6시 + 연장) 이내면 「충족」, 넘으면 「부족」입니다. 기준 시각은 위 파란색 칸에서 바꿀 수 있습니다."].forEach((text) => {
    put(sheet.getRow(row).getCell(2), text, { size: 9, color: MUTED, align: "left", rule: "none" });
    sheet.mergeCells(row, 2, row, 10);
    row += 1;
  });
  sheet.getRow(2).height = 30;
  sheet.getRow(6).height = 30;
}

export async function buildProductivityReport(rows: ArchiveLike[], people: { day: ReportPerson[]; week: ReportPerson[]; month: ReportPerson[] }) {
  const days = daysOf(rows);
  const book = new ExcelJS.Workbook();
  book.creator = "센터 생산성";
  const summary = book.addWorksheet("요약");
  const analysis = book.addWorksheet("분석");
  const dayCenter = book.addWorksheet("일별센터");
  const dayLine = book.addWorksheet("일별라인");
  const weekCenter = book.addWorksheet("주별센터");
  const weekLine = book.addWorksheet("주별라인");
  const monthCenter = book.addWorksheet("월별센터");
  const monthLine = book.addWorksheet("월별라인");
  const personDay = book.addWorksheet("사람일별");
  const personWeek = book.addWorksheet("사람주별");
  const personMonth = book.addWorksheet("사람월별");
  const data = book.addWorksheet("분석데이터");

  const dayCenterLast = writeDaily(dayCenter, days, "센터");
  const dayLineLast = writeDaily(dayLine, days, "라인");
  rollup(weekCenter, days, "일별센터", dayCenterLast, "week", "센터");
  rollup(weekLine, days, "일별라인", dayLineLast, "week", "라인");
  const monthRows = days.filter((row) => row.line === 0);
  rollup(monthCenter, days, "일별센터", dayCenterLast, "month", "센터");
  rollup(monthLine, days, "일별라인", dayLineLast, "month", "라인");
  writePeople(personDay, people.day);
  writePeople(personWeek, people.week);
  writePeople(personMonth, people.month);
  const evidence = writeEvidence(data, days);
  const monthLast = Math.max(new Set(monthRows.map((row) => `${row.month}|${row.dpt}|${row.center}`)).size + 1, 2);
  const chart = writeSummary(summary, days, evidence, monthLast, dayCenterLast, dayLineLast, people.month.length > 0);
  writeAnalysis(analysis, evidence);
  ["일별센터", "일별라인"].forEach((name) => { book.getWorksheet(name)!.properties.tabColor = { argb: "FF34C759" }; });
  ["주별센터", "주별라인"].forEach((name) => { book.getWorksheet(name)!.properties.tabColor = { argb: "FFFF9500" }; });
  ["월별센터", "월별라인"].forEach((name) => { book.getWorksheet(name)!.properties.tabColor = { argb: "FFAF52DE" }; });
  ["사람일별", "사람주별", "사람월별"].forEach((name) => { book.getWorksheet(name)!.properties.tabColor = { argb: "FFFFCC00" }; });
  const raw = await book.xlsx.writeBuffer();
  if (!chart) return raw;
  return attachChart(raw, chart);
}

async function attachChart(raw: ArrayBuffer | Uint8Array, chart: { header: number; first: number; last: number }) {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(raw);
  const sheetPath = "xl/worksheets/sheet1.xml";
  let sheet = await zip.file(sheetPath)!.async("string");
  if (!sheet.includes("<drawing ")) {
    sheet = sheet.replace("</worksheet>", '<drawing r:id="rId1"/></worksheet>');
    zip.file(sheetPath, sheet);
  }
  const relPath = "xl/worksheets/_rels/sheet1.xml.rels";
  const rel = zip.file(relPath);
  if (rel) {
    let text = await rel.async("string");
    if (!text.includes("drawing1.xml")) {
      text = text.replace("</Relationships>", '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>');
      zip.file(relPath, text);
    }
  } else {
    zip.file(relPath, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>`);
  }
  zip.file("xl/drawings/_rels/drawing1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/></Relationships>`);
  zip.file("xl/drawings/drawing1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>6</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${chart.header - 1}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>12</xdr:col><xdr:colOff>185760</xdr:colOff><xdr:row>${chart.last - 1}</xdr:row><xdr:rowOff>120000</xdr:rowOff></xdr:to><xdr:graphicFrame><xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Chart 1"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="5400000" cy="2700000"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>`);
  zip.file("xl/charts/chart1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr b="1" sz="1800"><a:solidFill><a:srgbClr val="000000"/></a:solidFill><a:latin typeface="맑은 고딕"/></a:defRPr></a:pPr><a:r><a:rPr b="1" sz="1800"><a:solidFill><a:srgbClr val="000000"/></a:solidFill><a:latin typeface="맑은 고딕"/></a:rPr><a:t>일별 작업건수</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:plotArea><c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/><c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:strRef><c:f>요약!D${chart.header}</c:f></c:strRef></c:tx><c:spPr><a:solidFill><a:srgbClr val="2F5D8A"/></a:solidFill><a:ln w="0"><a:noFill/></a:ln></c:spPr><c:invertIfNegative val="0"/><c:cat><c:strRef><c:f>요약!$B$${chart.first}:$B$${chart.last}</c:f></c:strRef></c:cat><c:val><c:numRef><c:f>요약!$D$${chart.first}:$D$${chart.last}</c:f></c:numRef></c:val></c:ser><c:gapWidth val="60"/><c:axId val="1"/><c:axId val="2"/></c:barChart><c:catAx><c:axId val="1"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="2"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/></c:catAx><c:valAx><c:axId val="2"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:numFmt formatCode="#,##0" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="1"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx></c:plotArea><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/><c:legend><c:legendPos val="b"/><c:overlay val="0"/><c:delete val="1"/></c:legend></c:chart><c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln w="9360"><a:solidFill><a:srgbClr val="D9D9D9"/></a:solidFill></a:ln></c:spPr></c:chartSpace>`);
  let types = await zip.file("[Content_Types].xml")!.async("string");
  if (!types.includes("/xl/charts/chart1.xml")) {
    types = types.replace("</Types>", '<Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>');
    zip.file("[Content_Types].xml", types);
  }
  return zip.generateAsync({ type: "arraybuffer" });
}
