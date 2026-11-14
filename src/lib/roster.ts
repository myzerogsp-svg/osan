import type { CenterId } from "@/lib/productivity";

export type RosterAssign = {
  date: string;
  center: CenterId;
  line: number;
  name: string;
};

type Cell = { v?: unknown };
type Sheet = Record<string, unknown>;
type XlsxModule = {
  read: (data: ArrayBuffer, opts: Record<string, unknown>) => {
    SheetNames: string[];
    Sheets: Record<string, Sheet>;
  };
  utils: { decode_range: (ref: string) => { e: { r: number } } };
};

const BLOCKS: { center: CenterId; col: string; nameCol: string }[] = [
  { center: "1센터", col: "B", nameCol: "C" },
  { center: "2센터", col: "J", nameCol: "K" },
  { center: "3센터", col: "R", nameCol: "S" },
];

function serialDate(value: number): string {
  const utc = new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 86400000);
  return utc.toISOString().slice(0, 10);
}

function dateFromE2(sheet: Sheet): string {
  const cell = sheet.E2 as Cell | undefined;
  if (!cell || typeof cell === "string") return "";
  if (typeof cell.v === "number" && cell.v > 20000 && cell.v < 80000) return serialDate(cell.v);
  if (cell.v instanceof Date && !Number.isNaN(cell.v.getTime())) return cell.v.toISOString().slice(0, 10);
  return "";
}

function raw(sheet: Sheet, addr: string): unknown {
  const cell = sheet[addr] as Cell | undefined;
  if (!cell || typeof cell === "string") return null;
  return cell.v ?? null;
}

function label(value: unknown): string {
  return String(value ?? "").replace(/\s/g, "");
}

function readSheet(sheet: Sheet, sheetName: string, year: number, xlsx: XlsxModule): RosterAssign[] {
  const named = sheetName.match(/(\d+)\s*월\s*(\d+)\s*일/);
  const fromCell = dateFromE2(sheet);
  if (sheetName === "입사내역" || (!named && !fromCell)) return [];
  const date = fromCell || `${year}-${named![1].padStart(2, "0")}-${named![2].padStart(2, "0")}`;
  const ref = sheet["!ref"];
  const lastRow = ref ? xlsx.utils.decode_range(String(ref)).e.r + 1 : 80;
  const found: RosterAssign[] = [];
  for (const block of BLOCKS) {
    let start = -1;
    for (let row = 1; row <= lastRow; row++) {
      if (label(raw(sheet, `${block.col}${row}`)) === "소분류") {
        start = row + 1;
        break;
      }
    }
    if (start < 0) continue;
    for (let row = start; row <= lastRow; row++) {
      const mark = label(raw(sheet, `${block.col}${row}`));
      if (!mark || mark.startsWith("서브") || mark.startsWith("총")) break;
      const line = Number(mark);
      if (!Number.isInteger(line) || line < 1 || line > 8) continue;
      const name = String(raw(sheet, `${block.nameCol}${row}`) ?? "").trim();
      if (!name || name === "성명" || /^\d+(\.\d+)?$/.test(name)) continue;
      found.push({ date, center: block.center, line, name });
    }
  }
  return found;
}

export async function readRoster(buf: ArrayBuffer, year = 2026): Promise<RosterAssign[]> {
  const xlsx = (await import("xlsx")) as XlsxModule;
  const book = xlsx.read(buf, { type: "array", cellDates: false });
  return book.SheetNames.flatMap((sheetName) => readSheet(book.Sheets[sheetName], sheetName, year, xlsx));
}

export async function downloadRosterTemplate(): Promise<void> {
  const file = (await import("../assets/roster-template.xlsx?url")).default;
  const link = document.createElement("a");
  link.href = file;
  link.download = "근태양식.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
