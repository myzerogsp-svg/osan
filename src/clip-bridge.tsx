import { useEffect, useState } from "react";

function readCap() {
  const hash = window.location.hash;
  if (!hash.startsWith("#cap=")) return "";
  const body = hash.slice(5).replace(/\s/g, "");
  if (body.length < 32) return "";
  return `data:image/jpeg;base64,${body}`;
}

export function ClipBridge() {
  const [src, setSrc] = useState("");
  const [note, setNote] = useState("이 컴퓨터에 복사한 뒤 카톡에 붙여넣으세요.");
  useEffect(() => {
    const apply = () => setSrc(readCap());
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#f2f2f7]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="text-[15px] font-semibold text-[#1c1c1e]">캡쳐 그림</p>
        <button
          type="button"
          className="h-10 rounded-full bg-[#007aff] px-4 text-[15px] font-semibold text-white"
          onClick={() => {
            const image = new Image();
            image.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = image.naturalWidth;
              canvas.height = image.naturalHeight;
              canvas.getContext("2d")?.drawImage(image, 0, 0);
              canvas.toBlob(async (blob) => {
                if (!blob) {
                  setNote("그림을 복사하지 못했습니다.");
                  return;
                }
                try {
                  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                  setNote("이 컴퓨터에 복사했습니다. 카톡에 붙여넣으세요.");
                } catch {
                  setNote("복사 버튼을 한 번 더 눌러 주세요.");
                }
              }, "image/png");
            };
            image.onerror = () => setNote("그림을 열지 못했습니다.");
            image.src = src;
          }}
        >
          이 컴퓨터에 복사
        </button>
      </div>
      <p className="px-4 pb-3 text-[13px] text-[#8e8e93]">{note}</p>
      <div className="min-h-0 flex-1 overflow-auto px-4 pb-6">
        <img src={src} alt="캡쳐한 그림" className="mx-auto max-w-full rounded-2xl bg-white shadow-sm" />
      </div>
    </div>
  );
}
