import { inflateSync } from "fflate";
import { type CenterId, type Job, lineOf, normalizeLoc, parsePick, routeOf } from "./productivity.ts";

export type ReadResult = {
  centers: Partial<Record<CenterId, Job[]>>;
  used: string[];
};

type Entry = { name: string; method: number; compSize: number; offset: number };

const CENTER_ALIAS: Record<string, CenterId> = {
  "1센터": "1센터",
  "2센터": "2센터",
  "3센터": "3센터",
  원본_1센터: "1센터",
  원본_2센터: "2센터",
  원본_3센터: "3센터",
};

function u16(b: Uint8Array, o: number): number {
  return b[o] | (b[o + 1] << 8);
}

function u32(b: Uint8Array, o: number): number {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}

function zipEntries(buf: Uint8Array): Entry[] {
  let eocd = -1;
  const min = Math.max(0, buf.length - 22 - 65557);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x05 && buf[i + 3] === 0x06) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("엑셀 파일 형식을 알아보지 못했습니다.");
  const cdOff = u32(buf, eocd + 16);
  const cdSize = u32(buf, eocd + 12);
  const entries: Entry[] = [];
  let p = cdOff;
  const end = cdOff + cdSize;
  const decoder = new TextDecoder();
  while (p + 46 <= end && p + 46 <= buf.length) {
    if (u32(buf, p) !== 0x02014b50) break;
    const method = u16(buf, p + 10);
    const compSize = u32(buf, p + 20);
    const nameLen = u16(buf, p + 28);
    const extraLen = u16(buf, p + 30);
    const commentLen = u16(buf, p + 32);
    const localOff = u32(buf, p + 42);
    const name = decoder.decode(buf.subarray(p + 46, p + 46 + nameLen)).replaceAll("\\", "/");
    entries.push({ name, method, compSize, offset: localOff });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function zipRead(buf: Uint8Array, entry: Entry): Uint8Array {
  const p = entry.offset;
  if (u32(buf, p) !== 0x04034b50) throw new Error("엑셀 안 시트를 열지 못했습니다.");
  const nameLen = u16(buf, p + 26);
  const extraLen = u16(buf, p + 28);
  const start = p + 30 + nameLen + extraLen;
  const comp = buf.subarray(start, start + entry.compSize);
  if (entry.method === 0) return comp;
  if (entry.method === 8) return inflateSync(comp);
  throw new Error("이 엑셀 압축은 읽지 못합니다.");
}

function stripNs(xml: string): string {
  return xml.replace(/^\uFEFF/, "").replace(/<\/?x:/g, (tag) => tag.replace("x:", ""));
}

function decodeXml(s: string): string {
  return s.replace(/&(#x[\da-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, ent: string) => {
    if (ent === "amp") return "&";
    if (ent === "lt") return "<";
    if (ent === "gt") return ">";
    if (ent === "quot") return '"';
    if (ent === "apos") return "'";
    if (ent[1] === "x") return String.fromCodePoint(parseInt(ent.slice(2), 16));
    return String.fromCodePoint(parseInt(ent.slice(1), 10));
  });
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? decodeXml(m[1]) : null;
}

function sharedStrings(xml: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < xml.length) {
    const a = xml.indexOf("<si", i);
    const b = xml.indexOf("<x:si", i);
    if (a < 0 && b < 0) break;
    const at = a < 0 ? b : b < 0 ? a : Math.min(a, b);
    const prefixed = xml.startsWith("<x:si", at);
    const openEnd = xml.indexOf(">", at);
    if (openEnd < 0) break;
    if (xml.charCodeAt(openEnd - 1) === 47) {
      i = openEnd + 1;
      out.push("");
      continue;
    }
    const closeMark = prefixed ? "</x:si>" : "</si>";
    const close = xml.indexOf(closeMark, openEnd);
    if (close < 0) break;
    out.push(textOf(xml.slice(openEnd + 1, close)));
    i = close + closeMark.length;
  }
  return out;
}

function textOf(body: string): string {
  let text = "";
  let j = 0;
  while (j < body.length) {
    const a = body.indexOf("<t", j);
    const b = body.indexOf("<x:t", j);
    if (a < 0 && b < 0) break;
    const at = a < 0 ? b : b < 0 ? a : Math.min(a, b);
    const prefixed = body.startsWith("<x:t", at);
    const openEnd = body.indexOf(">", at);
    if (openEnd < 0) break;
    if (body.charCodeAt(openEnd - 1) === 47) {
      j = openEnd + 1;
      continue;
    }
    const closeMark = prefixed ? "</x:t>" : "</t>";
    const close = body.indexOf(closeMark, openEnd);
    if (close < 0) break;
    text += decodeXml(body.slice(openEnd + 1, close));
    j = close + closeMark.length;
  }
  return text;
}

function sheetList(workbookXml: string, relsXml: string): { name: string; path: string }[] {
  const rels = new Map<string, string>();
  const relRe = /<Relationship\b([^>]*)\/>/g;
  let rel: RegExpExecArray | null;
  while ((rel = relRe.exec(relsXml))) {
    const id = attr(rel[1], "Id");
    const target = attr(rel[1], "Target");
    if (id && target) rels.set(id, target.replace(/^\/?xl\//, "").replace(/^\//, ""));
  }
  const sheets: { name: string; path: string }[] = [];
  const sheetRe = /<sheet\b([^>]*)\/>/g;
  let sh: RegExpExecArray | null;
  while ((sh = sheetRe.exec(workbookXml))) {
    const name = attr(sh[1], "name");
    const id = attr(sh[1], "r:id") ?? attr(sh[1], "id");
    if (!name || !id) continue;
    const target = rels.get(id);
    if (!target) continue;
    sheets.push({ name, path: target.startsWith("xl/") ? target : `xl/${target}` });
  }
  return sheets;
}

function cellValue(attrs: string, inner: string, strings: string[]): unknown {
  if (!inner) return null;
  if (attrs.includes("inlineStr")) {
    const t0 = inner.indexOf("<t");
    if (t0 < 0) return null;
    const gt = inner.indexOf(">", t0);
    const t1 = inner.indexOf("</t>", gt + 1);
    if (gt < 0 || t1 < 0) return null;
    return decodeXml(inner.slice(gt + 1, t1));
  }
  const v0 = inner.indexOf("<v>");
  if (v0 < 0) return null;
  const v1 = inner.indexOf("</v>", v0 + 3);
  if (v1 < 0) return null;
  const raw = decodeXml(inner.slice(v0 + 3, v1));
  if (attrs.includes('t="s"')) return strings[Number(raw)] ?? null;
  if (attrs.includes('t="str"') || attrs.includes('t="b"')) return raw;
  const n = Number(raw);
  return Number.isFinite(n) ? n : raw;
}

function plainCell(fragment: string): string {
  return fragment.includes("x:") ? fragment.replace(/<\/?x:/g, (tag) => tag.replace("x:", "")) : fragment;
}

function headerKey(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
}

function headerScore(headers: { has: (key: string) => boolean }) {
  let score = 0;
  if (headers.has("clientcd") || headers.has("storecd") || headers.has("점포코드")) score += 5;
  if (headers.has("blockno")) score += 4;
  if (headers.has("pickdt")) score += 4;
  if (headers.has("locationcd") || headers.has("loccd") || headers.has("로케이션코드") || headers.has("로케이션")) score += 2;
  return score;
}

function headerIndex(rows: unknown[][]): number {
  const limit = Math.min(rows.length, 12);
  let best = 0;
  let bestScore = 0;
  for (let i = 0; i < limit; i++) {
    const head = new Set((rows[i] ?? []).map((cell) => headerKey(cell)));
    const score = headerScore(head);
    if (score > bestScore) {
      best = i;
      bestScore = score;
    }
  }
  return bestScore >= 4 ? best : 0;
}

function headerMapFromXml(xml: string, strings: string[]): { row: number; headers: Map<string, string> } | null {
  const rows = new Map<number, Map<string, string>>();
  let i = 0;
  const marked = xml.includes("<x:c ");
  while (i < xml.length) {
    const a = xml.indexOf("<c ", i);
    const b = marked ? xml.indexOf("<x:c ", i) : -1;
    if (a < 0 && b < 0) break;
    const at = a < 0 ? b : b < 0 ? a : Math.min(a, b);
    const prefixed = marked && xml.startsWith("<x:c ", at);
    const gt = xml.indexOf(">", at);
    if (gt < 0) break;
    const open = xml.slice(at, gt + 1);
    let close = gt;
    if (xml.charCodeAt(gt - 1) !== 47) {
      const closeMark = prefixed ? "</x:c>" : "</c>";
      close = xml.indexOf(closeMark, gt);
      if (close < 0) break;
      i = close + closeMark.length;
    } else i = gt + 1;
    const addr = colRow(open);
    if (!addr) continue;
    if (addr.row > 12) break;
    const inner = close === gt ? "" : xml.slice(gt + 1, close);
    const val = cellValue(open, plainCell(inner), strings);
    const key = headerKey(val);
    if (!key) continue;
    const headers = rows.get(addr.row) ?? new Map<string, string>();
    if (!headers.has(key)) headers.set(key, addr.col);
    rows.set(addr.row, headers);
  }
  let best = 0;
  let bestScore = 0;
  for (const [row, headers] of rows) {
    const score = headerScore(headers);
    if (score > bestScore) {
      best = row;
      bestScore = score;
    }
  }
  const headers = rows.get(best);
  return best && headers && bestScore >= 4 ? { row: best, headers } : null;
}

function colRow(open: string): { col: string; row: number } | null {
  const at = open.indexOf('r="');
  if (at < 0) return null;
  let i = at + 3;
  let col = "";
  while (i < open.length) {
    const code = open.charCodeAt(i);
    if (code < 65 || code > 90) break;
    col += open[i];
    i++;
  }
  if (!col) return null;
  let row = 0;
  let any = false;
  while (i < open.length) {
    const code = open.charCodeAt(i);
    if (code < 48 || code > 57) break;
    row = row * 10 + (code - 48);
    any = true;
    i++;
  }
  return any ? { col, row } : null;
}

function jobsFromXml(xml: string, strings: string[]): Job[] {
  const headers = new Map<string, string>();
  const row1: { col: string; val: unknown }[] = [];
  const cells = new Map<string, Map<number, unknown>>();
  let ready = false;
  let hasHeader = false;
  let blockCol = "R";
  let pickCol = "Z";
  let qtyCol = "M";
  let orderCol = "";
  let routeCol = "";
  let storeNameCol = "";
  let storeCodeCol = "";
  let goodsNameCol = "";
  let goodsCodeCol = "";
  let locationCol = "";
  let groupCol = "";
  let needed = new Set<string>();
  let headerRow = 1;
  const sniffed = headerMapFromXml(xml, strings);
  if (sniffed) {
    const headers = sniffed.headers;
    headerRow = sniffed.row;
    hasHeader = true;
    blockCol = headers.get("blockno") ?? "R";
    pickCol = headers.get("pickdt") ?? "Z";
    qtyCol = headers.get("pickqt") ?? "M";
    orderCol = headers.get("orderqt") ?? "";
    routeCol = headers.get("rtecod") ?? "";
    storeNameCol = headers.get("clientnm") ?? headers.get("storenm") ?? headers.get("점포명") ?? "";
    storeCodeCol = headers.get("clientcd") ?? headers.get("storecd") ?? headers.get("점포코드") ?? "";
    goodsNameCol = headers.get("goodsnm") ?? headers.get("상품명") ?? "";
    goodsCodeCol = headers.get("goodscd") ?? headers.get("상품코드") ?? "";
    locationCol = headers.get("locationcd") ?? headers.get("loccd") ?? headers.get("로케이션코드") ?? headers.get("로케이션") ?? "";
    groupCol = headers.get("groupid") ?? "";
    needed = new Set([blockCol, pickCol, qtyCol, orderCol, routeCol, storeNameCol, storeCodeCol, goodsNameCol, goodsCodeCol, locationCol, groupCol].filter(Boolean));
    ready = true;
  }

  function take(col: string, row: number, val: unknown) {
    if (!needed.has(col) || val == null || val === "") return;
    let bucket = cells.get(col);
    if (!bucket) cells.set(col, (bucket = new Map()));
    bucket.set(row, val);
  }

  function setup() {
    hasHeader = headers.has("blockno") && headers.has("pickdt");
    blockCol = headers.get("blockno") ?? "R";
    pickCol = headers.get("pickdt") ?? "Z";
    qtyCol = headers.get("pickqt") ?? "M";
    orderCol = headers.get("orderqt") ?? "";
    routeCol = headers.get("rtecod") ?? "";
    storeNameCol = headers.get("clientnm") ?? headers.get("storenm") ?? headers.get("점포명") ?? "";
    storeCodeCol = headers.get("clientcd") ?? headers.get("storecd") ?? headers.get("점포코드") ?? "";
    goodsNameCol = headers.get("goodsnm") ?? headers.get("상품명") ?? "";
    goodsCodeCol = headers.get("goodscd") ?? headers.get("상품코드") ?? "";
    locationCol = headers.get("locationcd") ?? headers.get("loccd") ?? headers.get("로케이션코드") ?? headers.get("로케이션") ?? "";
    groupCol = headers.get("groupid") ?? "";
    needed = new Set([blockCol, pickCol, qtyCol, orderCol, routeCol, storeNameCol, storeCodeCol, goodsNameCol, goodsCodeCol, locationCol, groupCol].filter(Boolean));
    if (!hasHeader) for (const item of row1) take(item.col, 1, item.val);
    ready = true;
  }

  let i = 0;
  const marked = xml.includes("<x:c ");
  while (i < xml.length) {
    const a = xml.indexOf("<c ", i);
    const b = marked ? xml.indexOf("<x:c ", i) : -1;
    if (a < 0 && b < 0) break;
    const at = a < 0 ? b : b < 0 ? a : Math.min(a, b);
    const prefixed = marked && xml.startsWith("<x:c ", at);
    const gt = xml.indexOf(">", at);
    if (gt < 0) break;
    const open = xml.slice(at, gt + 1);
    let close = gt;
    if (xml.charCodeAt(gt - 1) !== 47) {
      const closeMark = prefixed ? "</x:c>" : "</c>";
      close = xml.indexOf(closeMark, gt);
      if (close < 0) break;
      i = close + closeMark.length;
    } else i = gt + 1;
    const addr = colRow(open);
    if (!addr) continue;
    const col = addr.col;
    const row = addr.row;
    if (!ready && row > 1) setup();
    if (ready && !needed.has(col)) continue;
    const inner = close === gt ? "" : xml.slice(gt + 1, close);
    const val = cellValue(open, plainCell(inner), strings);
    if (!ready) {
      if (val != null && val !== "") {
        const key = headerKey(val);
        if (key) headers.set(key, col);
        row1.push({ col, val });
      }
      continue;
    }
    if (hasHeader && row <= headerRow) continue;
    take(col, row, val);
  }
  if (!ready) setup();

  const blocks = cells.get(blockCol) ?? new Map<number, unknown>();
  const picks = cells.get(pickCol) ?? new Map<number, unknown>();
  const qtys = cells.get(qtyCol) ?? new Map<number, unknown>();
  const orders = orderCol ? (cells.get(orderCol) ?? new Map<number, unknown>()) : new Map<number, unknown>();
  const routes = routeCol ? (cells.get(routeCol) ?? new Map<number, unknown>()) : new Map<number, unknown>();
  const storeNms = storeNameCol ? (cells.get(storeNameCol) ?? new Map<number, unknown>()) : new Map<number, unknown>();
  const storeCds = storeCodeCol ? (cells.get(storeCodeCol) ?? new Map<number, unknown>()) : new Map<number, unknown>();
  const goodsNms = goodsNameCol ? (cells.get(goodsNameCol) ?? new Map<number, unknown>()) : new Map<number, unknown>();
  const goodsCds = goodsCodeCol ? (cells.get(goodsCodeCol) ?? new Map<number, unknown>()) : new Map<number, unknown>();
  const locations = locationCol ? (cells.get(locationCol) ?? new Map<number, unknown>()) : new Map<number, unknown>();
  const groups = groupCol ? (cells.get(groupCol) ?? new Map<number, unknown>()) : new Map<number, unknown>();
  const jobs: Job[] = [];
  const rowKeys = new Set<number>([...blocks.keys(), ...groups.keys()]);
  for (const row of rowKeys) {
    if (hasHeader && row <= headerRow) continue;
    const line = lineOf(blocks.get(row));
    const groupId = String(groups.get(row) ?? "").trim();
    if (line == null && !groupId) continue;
    const qtyRaw = qtys.get(row);
    const qty = typeof qtyRaw === "number" ? qtyRaw : Number(qtyRaw);
    const orderRaw = orders.get(row);
    const orderQty = typeof orderRaw === "number" ? orderRaw : Number(orderRaw);
    jobs.push({
      line,
      at: parsePick(picks.get(row) ?? null),
      qty: Number.isFinite(qty) ? qty : 0,
      orderQty: Number.isFinite(orderQty) ? orderQty : 0,
      route: routeOf(routes.get(row) ?? null),
      storeCd: routeOf(storeCds.get(row) ?? null),
      storeNm: routeOf(storeNms.get(row) ?? null),
      goodsCd: routeOf(goodsCds.get(row) ?? null),
      goodsNm: routeOf(goodsNms.get(row) ?? null),
      location: routeOf(locations.get(row) ?? null),
      groupId,
    });
  }
  return jobs;
}

function centerIdFrom(name: string): CenterId | null {
  const trimmed = name.trim();
  const marked = trimmed.match(/^(?:원본_)?([1-9])\s*센터$/);
  if (marked) return `${marked[1]}센터` as CenterId;
  return CENTER_ALIAS[trimmed] ?? null;
}

function sheetRole(name: string): CenterId | "raw" | null {
  const hit = centerIdFrom(name);
  if (hit) return hit;
  if (/torderdetail/i.test(name.trim())) return "raw";
  return null;
}

function xmlOf(buf: Uint8Array, entries: Entry[], path: string): string {
  const entry = entries.find((item) => item.name === path);
  if (!entry) throw new Error("엑셀 안에서 시트를 찾지 못했습니다.");
  return new TextDecoder().decode(zipRead(buf, entry));
}

async function readXlsx(file: ArrayBuffer, fallback: CenterId, onProgress?: (msg: string) => void): Promise<ReadResult> {
  const buf = new Uint8Array(file);
  const entries = zipEntries(buf);
  const byName = new Map(entries.map((entry) => [entry.name, entry]));
  const workbook = byName.get("xl/workbook.xml");
  const rels = byName.get("xl/_rels/workbook.xml.rels");
  if (!workbook || !rels) throw new Error("엑셀 파일 내용이 비어 있습니다.");
  onProgress?.("시트 이름 확인 중");
  const sheets = sheetList(stripNs(new TextDecoder().decode(zipRead(buf, workbook))), stripNs(new TextDecoder().decode(zipRead(buf, rels))));
  const stringsEntry = byName.get("xl/sharedStrings.xml");
  const strings = stringsEntry ? sharedStrings(new TextDecoder().decode(zipRead(buf, stringsEntry))) : [];
  const named = sheets.filter((sheet) => {
    const role = sheetRole(sheet.name);
    return role != null && role !== "raw";
  });
  const found: Partial<Record<CenterId, Job[]>> = {};
  const used: string[] = [];
  const targets = named.length
    ? named
    : [
        sheets.find((sheet) => sheetRole(sheet.name) === "raw") ??
          sheets.find((sheet) => /sheet/i.test(sheet.path)) ??
          sheets[0],
      ].filter((sheet): sheet is { name: string; path: string } => Boolean(sheet));
  for (const sheet of targets) {
    onProgress?.("센터 읽는 중");
    await new Promise((resolve) => setTimeout(resolve, 0));
    const jobs = jobsFromXml(xmlOf(buf, entries, sheet.path), strings);
    const role = sheetRole(sheet.name);
    const id: CenterId = role && role !== "raw" ? role : fallback;
    found[id] = jobs;
    used.push(named.length ? sheet.name : `${sheet.name} → ${id}`);
  }
  return { centers: found, used };
}

type XlsxModule = {
  read: (data: ArrayBuffer, opts: Record<string, unknown>) => {
    SheetNames: string[];
    Sheets: Record<string, Record<string, { v?: unknown; w?: string; t?: string } | string | undefined>>;
  };
  utils: {
    decode_range: (ref: string) => { s: { r: number; c: number }; e: { r: number; c: number } };
    encode_cell: (addr: { r: number; c: number }) => string;
    sheet_to_json: (sheet: unknown, opts: Record<string, unknown>) => unknown[][];
  };
};

async function readXls(file: ArrayBuffer, fallback: CenterId, onProgress?: (msg: string) => void): Promise<ReadResult> {
  onProgress?.("구형 엑셀 읽는 중");
  const xlsx = (await import("xlsx")) as XlsxModule;
  const book = xlsx.read(file, { type: "array", cellDates: true, cellStyles: false, cellNF: false, cellHTML: false });
  const found: Partial<Record<CenterId, Job[]>> = {};
  const used: string[] = [];
  const named = book.SheetNames.filter((name) => {
    const role = sheetRole(name);
    return role != null && role !== "raw";
  });
  const targets = named.length
    ? named
    : [book.SheetNames.find((name) => sheetRole(name) === "raw") ?? book.SheetNames[0]].filter((name): name is string => Boolean(name));
  for (const name of targets) {
    onProgress?.(`${name} 읽는 중`);
    const rows = xlsx.utils.sheet_to_json(book.Sheets[name], { header: 1, raw: true, defval: null }) as unknown[][];
    const headRow = headerIndex(rows);
    const head = (rows[headRow] ?? []).map((cell) => headerKey(cell));
    const find = (...names: string[]) => names.map((name) => head.indexOf(headerKey(name))).find((index) => index >= 0) ?? -1;
    const blockAt = find("blockno");
    const pickAt = find("pickdt");
    const qtyAt = find("pickqt");
    const orderAt = find("orderqt");
    const routeAt = find("rtecod");
    const storeNameAt = find("clientnm", "storenm", "점포명");
    const storeCodeAt = find("clientcd", "storecd", "점포코드");
    const goodsNameAt = find("goodsnm", "상품명");
    const goodsCodeAt = find("goodscd", "상품코드");
    const locationAt = find("locationcd", "loccd", "로케이션코드", "로케이션");
    const groupAt = find("groupid");
    const b = blockAt >= 0 ? blockAt : 17;
    const p = pickAt >= 0 ? pickAt : 25;
    const q = qtyAt >= 0 ? qtyAt : 12;
    const start = blockAt >= 0 || pickAt >= 0 || storeCodeAt >= 0 ? headRow + 1 : 0;
    const jobs: Job[] = [];
    for (let i = start; i < rows.length; i++) {
      const row = rows[i] ?? [];
      const line = lineOf(row[b]);
      const groupId = groupAt >= 0 ? String(row[groupAt] ?? "").trim() : "";
      if (line == null && !groupId) continue;
      const qtyRaw = row[q];
      const qty = typeof qtyRaw === "number" ? qtyRaw : Number(qtyRaw);
      const orderRaw = orderAt >= 0 ? row[orderAt] : 0;
      const orderQty = typeof orderRaw === "number" ? orderRaw : Number(orderRaw);
      jobs.push({
        line,
        at: parsePick(row[p] ?? null),
        qty: Number.isFinite(qty) ? qty : 0,
        orderQty: Number.isFinite(orderQty) ? orderQty : 0,
        route: routeAt >= 0 ? routeOf(row[routeAt] ?? null) : "",
        storeCd: storeCodeAt >= 0 ? routeOf(row[storeCodeAt] ?? null) : "",
        storeNm: storeNameAt >= 0 ? routeOf(row[storeNameAt] ?? null) : "",
        goodsCd: goodsCodeAt >= 0 ? routeOf(row[goodsCodeAt] ?? null) : "",
        goodsNm: goodsNameAt >= 0 ? routeOf(row[goodsNameAt] ?? null) : "",
        location: locationAt >= 0 ? routeOf(row[locationAt] ?? null) : "",
        groupId,
      });
    }
    const role = sheetRole(name);
    const id: CenterId = role && role !== "raw" ? role : fallback;
    found[id] = jobs;
    used.push(named.length ? name : `${name} → ${id}`);
  }
  return { centers: found, used };
}

function centerFromFileName(name: string, fallback: CenterId): CenterId {
  const base = name.replace(/\.[^.]+$/, "");
  const marked = base.match(/(?:^|[^0-9])([1-9])\s*센터/);
  if (marked) return `${marked[1]}센터` as CenterId;
  const tail = base.match(/[-_\s]([1-9])$/);
  if (tail) return `${tail[1]}센터` as CenterId;
  return fallback;
}

function centerFromSheetName(name: string): CenterId | null {
  return centerIdFrom(name);
}

export async function readLocMaster(
  file: ArrayBuffer,
  fallback: CenterId,
  fileName: string,
  force?: CenterId,
): Promise<{
  places: Partial<Record<CenterId, Record<string, string>>>;
  codes: Partial<Record<CenterId, Record<string, string>>>;
} | null> {
  const xlsx = (await import("xlsx")) as XlsxModule;
  const book = xlsx.read(file, { type: "array", cellDates: false, cellStyles: false, cellNF: false, cellHTML: false });
  const places: Partial<Record<CenterId, Record<string, string>>> = {};
  const codes: Partial<Record<CenterId, Record<string, string>>> = {};
  let matched = false;
  for (const name of book.SheetNames) {
    const rows = xlsx.utils.sheet_to_json(book.Sheets[name], { header: 1, raw: true, defval: "" }) as unknown[][];
    const headRow = headerIndex(rows);
    const head = (rows[headRow] ?? []).map((cell) => headerKey(cell));
    if (head.includes("blockno") || head.includes("pickdt")) continue;
    const find = (...names: string[]) => names.map((name) => head.indexOf(headerKey(name))).find((index) => index >= 0) ?? -1;
    const locAt = find("로케이션코드", "locationcd", "로케이션");
    const nameAt = find("점포명", "clientnm");
    if (locAt < 0 || nameAt < 0) continue;
    matched = true;
    const codeAt = find("점포코드", "clientcd", "storecd");
    const center = force ?? centerFromSheetName(name) ?? centerFromFileName(fileName, fallback);
    const map = { ...(places[center] ?? {}) };
    const codeMap = { ...(codes[center] ?? {}) };
    for (let i = headRow + 1; i < rows.length; i++) {
      const code = normalizeLoc(String(rows[i]?.[locAt] ?? ""));
      const store = String(rows[i]?.[nameAt] ?? "").trim();
      if (!code || !store) continue;
      map[code] = store;
      const storeCode = codeAt >= 0 ? String(rows[i]?.[codeAt] ?? "").trim() : "";
      if (storeCode) codeMap[code] = storeCode;
    }
    places[center] = map;
    if (Object.keys(codeMap).length > 0) codes[center] = codeMap;
  }
  return matched ? { places, codes } : null;
}

export type LedgerSheet = { name: string; headers: string[]; rows: string[][] };

function ledgerCell(value: unknown): string {
  if (value == null || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    const hh = value.getHours();
    const mm = value.getMinutes();
    if (hh || mm || value.getSeconds()) return `${y}-${m}-${d} ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(Math.round(value * 1000) / 1000);
  }
  return String(value).trim();
}

export async function readLedger(file: ArrayBuffer): Promise<LedgerSheet[]> {
  const xlsx = (await import("xlsx")) as XlsxModule;
  const book = xlsx.read(file, { type: "array", cellDates: true, cellStyles: false, cellNF: false, cellHTML: false });
  const sheets = book.SheetNames.map((name) => {
    const grid = xlsx.utils.sheet_to_json(book.Sheets[name], { header: 1, raw: true, defval: "" }) as unknown[][];
    const headerRow = grid.findIndex((row) => (row ?? []).some((cell) => ledgerCell(cell) !== ""));
    if (headerRow < 0) return null;
    const headers = (grid[headerRow] ?? []).map((cell, index) => ledgerCell(cell) || `열${index + 1}`);
    const rows = grid.slice(headerRow + 1).map((row) => headers.map((_, index) => ledgerCell(row?.[index]))).filter((row) => row.some((cell) => cell !== ""));
    return { name, headers, rows };
  }).filter((sheet): sheet is LedgerSheet => Boolean(sheet && sheet.headers.length > 0 && sheet.rows.length > 0));
  if (sheets.length === 0) throw new Error("원장에서 읽을 행을 찾지 못했습니다.");
  return sheets;
}

export async function readCenters(
  file: ArrayBuffer,
  fallback: CenterId,
  onProgress?: (msg: string) => void,
): Promise<ReadResult> {
  const bytes = new Uint8Array(file.slice(0, 4));
  const zip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  const result = zip ? await readXlsx(file, fallback, onProgress) : await readXls(file, fallback, onProgress);
  const total = Object.values(result.centers).reduce((sum, rows) => sum + (rows?.length ?? 0), 0);
  if (total === 0) {
    throw new Error("BlockNO가 있는 작업 행을 찾지 못했습니다. 1센터·2센터·3센터 시트나 tOrderDetail을 올려 주세요.");
  }
  return result;
}
