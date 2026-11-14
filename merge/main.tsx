import { useState } from "react";
import { createRoot } from "react-dom/client";
import { SLOTS, detailSheetName, type CenterSlot } from "./convert";
import "./merge.css";

const COLOR: Record<CenterSlot, string> = { "1센터": "c1", "2센터": "c2", "3센터": "c3" };

type Picked = {
  fileName: string;
  sheetName: string;
  rows: (string | number | boolean | Date | null)[][];
};

async function readDetail(file: File): Promise<Picked> {
  const xlsx = await import("xlsx");
  const book = xlsx.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: false,
    cellStyles: false,
    cellNF: false,
    cellHTML: false,
  });
  const sheetName = detailSheetName(book.SheetNames);
  if (!sheetName) {
    throw new Error(`OrderDetail 시트가 없습니다. 있는 시트: ${book.SheetNames.join(", ")}`);
  }
  const rows = xlsx.utils.sheet_to_json(book.Sheets[sheetName], {
    header: 1,
    raw: true,
    defval: null,
  }) as (string | number | boolean | Date | null)[][];
  if (rows.length < 2) throw new Error("OrderDetail에 데이터 행이 없습니다.");
  return { fileName: file.name, sheetName, rows };
}

function App() {
  const [picked, setPicked] = useState<Partial<Record<CenterSlot, Picked>>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const ready = SLOTS.some((id) => picked[id]);

  async function choose(id: CenterSlot, file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(`${id} 읽는 중`);
    try {
      const detail = await readDetail(file);
      setPicked((current) => ({ ...current, [id]: detail }));
      setBusy("");
    } catch (err) {
      setBusy("");
      setError(err instanceof Error ? `${id}: ${err.message}` : `${id} 파일을 읽지 못했습니다.`);
    }
  }

  async function make() {
    const chosen = SLOTS.filter((id) => picked[id]);
    if (chosen.length === 0) return;
    setError("");
    setBusy("엑셀 만드는 중");
    try {
      const xlsx = await import("xlsx");
      const book = xlsx.utils.book_new();
      for (const id of chosen) {
        const detail = picked[id];
        if (!detail) continue;
        xlsx.utils.book_append_sheet(book, xlsx.utils.aoa_to_sheet(detail.rows), id);
      }
      xlsx.writeFile(book, "업로드용.xlsx");
      setBusy("");
    } catch (err) {
      setBusy("");
      setError(err instanceof Error ? err.message : "엑셀을 만들지 못했습니다.");
    }
  }

  return (
    <main className="app">
      <h1>센터 파일 합치기</h1>
      <p className="lead">
        회사 컴퓨터에서는 이 화면의 파일 선택을 누르지 마세요. Privacy-i가 막습니다.
        파일합치기.bat 만 더블클릭하세요. 집 컴퓨터에서는 아래에서 파일을 골라도 됩니다.
      </p>
      <div className="slots">
        {SLOTS.map((id) => {
          const item = picked[id];
          return (
            <section key={id} className="slot">
              <div className={`badge ${COLOR[id]}`}>{id}</div>
              <div className="meta">
                <strong>{item ? item.fileName : "아직 없음"}</strong>
                <span>
                  {item
                    ? `${item.sheetName} · 데이터 ${item.rows.length - 1}행`
                    : "받은 파일 안의 OrderDetail 시트를 사용합니다."}
                </span>
              </div>
              <label className="pick">
                파일 선택
                <input
                  type="file"
                  accept=".xlsx,.xls,.xlsm"
                  style={{ display: "none" }}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    void choose(id, file);
                    event.target.value = "";
                  }}
                />
              </label>
            </section>
          );
        })}
      </div>
      <button type="button" className="make" disabled={!ready || Boolean(busy)} onClick={() => void make()}>
        {busy || "업로드용 엑셀 만들기"}
      </button>
      {error ? <p className="error">{error}</p> : null}
      <p className="note">센터가 비어 있으면 그 시트는 만들지 않습니다. 만든 파일 이름은 업로드용.xlsx 입니다.</p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
