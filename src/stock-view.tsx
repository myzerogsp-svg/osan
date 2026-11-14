import { useEffect, useRef, useState } from "react";
import { b64ToArrayBuffer, folderHost, readFolders } from "@/lib/folders";

type Grid = string[][];

export function StockView({ open = false }: { open?: boolean }) {
  const [name, setName] = useState("");
  const [sheets, setSheets] = useState<{ name: string; rows: Grid }[]>([]);
  const [sheet, setSheet] = useState(0);
  const [note, setNote] = useState("");
  const asked = useRef("");

  useEffect(() => {
    const host = folderHost();
    if (!host?.addEventListener) return;
    const onMessage = (event: { data: unknown }) => {
      try {
        const data = (typeof event.data === "string" ? JSON.parse(event.data) : event.data) as { type?: string; name?: string; b64?: string };
        if (data?.type !== "stock-file" || !data.b64) return;
        void load(data.b64, data.name || "수불장.xlsx");
      } catch { /* 다른 메시지 */ }
    };
    host.addEventListener("message", onMessage);
    return () => host.removeEventListener?.("message", onMessage);
  }, []);

  useEffect(() => {
    if (!open) return;
    const path = readFolders().stock;
    if (!path || asked.current === path) return;
    asked.current = path;
    folderHost()?.postMessage("read-folder:stock");
  }, [open]);

  async function load(b64: string, fileName: string) {
    setNote("수불장 읽는 중");
    try {
      const xlsx = await import("xlsx");
      const book = xlsx.read(b64ToArrayBuffer(b64), { type: "array", cellDates: false });
      const next = book.SheetNames.map((title) => {
        const grid = xlsx.utils.sheet_to_json(book.Sheets[title], { header: 1, raw: false, defval: "" }) as unknown[][];
        const rows = grid.slice(0, 500).map((line) => (line ?? []).map((cell) => String(cell ?? "")));
        return { name: title, rows };
      }).filter((item) => item.rows.length > 0);
      setSheets(next);
      setSheet(0);
      setName(fileName);
      setNote(next.length ? `${fileName} · ${next.length}시트` : "표로 읽을 칸이 없습니다.");
    } catch {
      setNote("수불장을 읽지 못했습니다.");
    }
  }

  const rows = sheets[sheet]?.rows ?? [];
  const width = rows.reduce((max, line) => Math.max(max, line.length), 0);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f2f2f7]">
      <div className="flex flex-wrap items-center gap-2 border-b border-black/5 bg-white px-3 py-2">
        <p className="text-[17px] font-semibold text-[#1c1c1e]">수불분석</p>
        {note ? <span className="text-[12px] text-[#8e8e93]">{note}</span> : <span className="text-[12px] text-[#8e8e93]">제어판 지정폴더의 수불장에서 가장 최근 엑셀을 읽습니다.</span>}
        <div className="ml-auto flex gap-1 overflow-auto">
          {sheets.map((item, index) => (
            <button key={item.name} type="button" className={"h-8 shrink-0 rounded-full px-3 text-[12px] font-semibold " + (index === sheet ? "bg-[#007aff] text-white" : "bg-[#f2f2f7] text-[#1c1c1e]")} onClick={() => setSheet(index)}>{item.name}</button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-[13px] text-[#8e8e93]">{name ? "표시할 행이 없습니다." : "지정한 수불장 폴더에 엑셀을 넣으면 여기에 나옵니다."}</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="border-collapse text-[12px]">
            <tbody>
              {rows.map((line, row) => (
                <tr key={row} className={row === 0 ? "sticky top-0 bg-[#1c1c1e] text-white" : row % 2 ? "bg-white" : "bg-[#f7f7f8]"}>
                  {Array.from({ length: width }, (_, col) => (
                    <td key={col} className="whitespace-nowrap border border-black/5 px-2 py-1">{line[col] ?? ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length >= 500 ? <p className="px-3 py-2 text-[12px] text-[#8e8e93]">앞 500행만 표시합니다.</p> : null}
        </div>
      )}
    </div>
  );
}
