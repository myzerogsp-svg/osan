import type { CenterId } from "@/lib/productivity";
import { routeBucket } from "@/lib/productivity";

export const OSHIP_DPTS = ["FF1편", "FF2편", "유제", "냉장", "냉동", "1차상품"] as const;
export type OshipDpt = (typeof OSHIP_DPTS)[number];

const DPT_BY_CODE: Record<string, OshipDpt> = {
  "020": "FF1편",
  "024": "FF1편",
  "025": "FF1편",
  "026": "FF1편",
  "032": "FF1편",
  "111": "FF1편",
  "022": "FF2편",
  "030": "FF2편",
  "034": "FF2편",
  "040": "FF2편",
  "060": "유제",
  "061": "유제",
  "070": "냉장",
  "071": "냉장",
  "170": "냉장",
  "270": "냉장",
  "370": "냉장",
  "670": "냉장",
  "770": "냉장",
  "870": "냉장",
  "970": "냉장",
  "080": "냉동",
  "081": "냉동",
  "082": "냉동",
  "090": "냉동",
  "092": "냉동",
  "180": "냉동",
  "190": "1차상품",
  "191": "1차상품",
  "192": "1차상품",
  "193": "1차상품",
  "194": "1차상품",
  "195": "1차상품",
  "290": "1차상품",
};

export type OshipRow = {
  date: string;
  storeCd: string;
  storeNm: string;
  route: string;
  bucket: string;
  group: string;
  code: string;
  goodsCd: string;
  goods: string;
  dpt: OshipDpt | "기타";
  reason: string;
  qty: number;
  amount: number;
};

export function centerFromOshipName(name: string, fallback: CenterId): CenterId {
  return oshipFileMeta(name, fallback).center;
}

export function oshipFileMeta(name: string, fallback: CenterId): { center: CenterId; year: number; month: number } {
  const base = name.replace(/(\.(xlsx|xls|xlsm))+$/i, "");
  const coded = base.match(/(?:^|[^\d])([123])[_-](\d{2})(\d{2})(?!\d)/);
  if (coded) {
    const month = Number(coded[3]);
    if (month >= 1 && month <= 12) return { center: `${coded[1]}센터` as CenterId, year: 2000 + Number(coded[2]), month };
  }
  const marked = base.match(/([123])\s*센터/);
  if (marked) return { center: `${marked[1]}센터` as CenterId, year: 0, month: 0 };
  return { center: fallback, year: 0, month: 0 };
}

function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value ?? "").replace(/,/g, "").trim();
  if (!text) return 0;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${value.getFullYear()}-${month}-${day}`;
  }
  return String(value ?? "").trim();
}

function groupCode(value: unknown): string {
  const digits = text(value).replace(/\.0$/, "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.padStart(3, "0").slice(-3);
}

function headerKey(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
}

export async function readOship(file: ArrayBuffer): Promise<OshipRow[]> {
  const xlsx = await import("xlsx");
  const book = xlsx.read(file, { type: "array", cellDates: true });
  const rows: OshipRow[] = [];
  for (const name of book.SheetNames) {
    const grid = xlsx.utils.sheet_to_json(book.Sheets[name], { header: 1, raw: true, defval: "" }) as unknown[][];
    const limit = Math.min(grid.length, 12);
    let headRow = -1;
    let best = 0;
    let work = false;
    for (let i = 0; i < limit; i++) {
      const keys = (grid[i] ?? []).map((cell) => headerKey(cell));
      if (keys.includes("blockno") || keys.includes("pickdt")) {
        work = true;
        break;
      }
      const score = (keys.includes("점포코드") || keys.includes("clientcd") || keys.includes("storecd") ? 5 : 0) + (keys.includes("미오출사유") ? 4 : 0) + (keys.includes("출고일") ? 2 : 0);
      if (score > best) {
        best = score;
        headRow = i;
      }
    }
    if (work || headRow < 0 || best < 5) continue;
    const head = (grid[headRow] ?? []).map((cell) => headerKey(cell));
    const at = (...labels: string[]) => {
      for (const label of labels) {
        const index = head.indexOf(headerKey(label));
        if (index >= 0) return index;
      }
      return -1;
    };
    const storeAt = at("점포코드", "clientcd", "storecd");
    if (storeAt < 0) continue;
    const nameAt = at("점포명", "clientnm");
    const routeAt = at("배송루트", "rtecod");
    const groupAt = at("배송상품군명");
    const codeAt = at("배송상품군코드");
    const reasonAt = at("미오출사유");
    const qtyAt = at("출고량");
    const amountAt = at("금액");
    const seqAt = at("순번");
    const dateAt = at("출고일");
    const goodsAt = at("상품명", "goodsnm");
    const goodsCdAt = at("상품코드", "goodscd");
    for (let i = headRow + 1; i < grid.length; i++) {
      const line = grid[i] ?? [];
      if (seqAt >= 0 && String(line[seqAt] ?? "").trim() === "합계") continue;
      const storeCd = text(line[storeAt]).toUpperCase();
      if (!storeCd) continue;
      const code = codeAt >= 0 ? groupCode(line[codeAt]) : "";
      const route = routeAt >= 0 ? text(line[routeAt]).replace(/\.0$/, "") : "";
      rows.push({
        date: dateAt >= 0 ? text(line[dateAt]) : "",
        storeCd,
        storeNm: nameAt >= 0 ? text(line[nameAt]) : "",
        route,
        bucket: routeBucket(route.replace(/\D/g, "") || route),
        group: groupAt >= 0 ? text(line[groupAt]) || "없음" : "없음",
        code,
        goodsCd: goodsCdAt >= 0 ? text(line[goodsCdAt]).replace(/\.0$/, "") : "",
        goods: goodsAt >= 0 ? text(line[goodsAt]) : "",
        dpt: DPT_BY_CODE[code] ?? "기타",
        reason: reasonAt >= 0 ? text(line[reasonAt]) || "없음" : "없음",
        qty: qtyAt >= 0 ? num(line[qtyAt]) : 0,
        amount: amountAt >= 0 ? num(line[amountAt]) : 0,
      });
    }
  }
  return rows;
}
