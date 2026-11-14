export type CenterSlot = "1센터" | "2센터" | "3센터";

export const SLOTS: CenterSlot[] = ["1센터", "2센터", "3센터"];

export function detailSheetName(names: string[]): string | null {
  const rows = names.map((name) => ({ name, key: name.trim().toLowerCase().replace(/\s+/g, "") }));
  const exact = rows.find((row) => row.key === "torderdetail" || row.key === "orderdetail");
  if (exact) return exact.name;
  const fuzzy = rows.find((row) => row.key.includes("orderdetail"));
  return fuzzy ? fuzzy.name : null;
}
