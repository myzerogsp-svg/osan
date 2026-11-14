// 화면의 메뉴, 버튼, 열 이름, 선택 항목, 안내 문구, 계산 기준이 바뀌면
// 이 쪽 데이터도 같은 작업에서 고친다. 메뉴 순서는 왼쪽 메뉴와 같게 유지한다.
// 총 쪽수는 배열 길이로 자동 계산된다.

export type ManualCell =
  | string
  | {
      text?: string;
      dot?: "all" | "line" | "center";
      n?: number;
      heat?: number;
      box?: boolean;
    };

type Grow = { grow?: boolean; flex?: number };

export type ManualNode =
  | ({ k: "col"; gap?: number; children: ManualNode[] } & Grow)
  | ({ k: "row"; gap?: number; children: ManualNode[] } & Grow)
  | ({ k: "grid"; cols: number; gap?: number; children: ManualNode[] } & Grow)
  | ({ k: "chips"; label?: string; items: string[] } & Grow)
  | ({ k: "table"; columns: string[]; rows: ManualCell[][]; note?: string; dense?: boolean; left?: boolean } & Grow)
  | ({ k: "card"; title?: string; body?: string; n?: number; tone?: "navy" | "amber"; children?: ManualNode[] } & Grow)
  | ({ k: "stat"; n: string; label: string } & Grow)
  | ({ k: "kpis"; items: string[] } & Grow)
  | ({ k: "h"; text: string } & Grow)
  | ({ k: "badge"; text: string; tone: "blue" | "orange" | "red" } & Grow)
  | ({ k: "p"; text: string; strong?: boolean; size?: number; color?: string } & Grow)
  | ({ k: "link"; text: string; href: string } & Grow)
  | ({ k: "note"; text: string } & Grow)
  | ({ k: "bar"; title: string; body: string } & Grow)
  | ({ k: "ol"; items: string[] } & Grow)
  | ({ k: "flow"; from: string; to: string } & Grow)
  | ({ k: "menu"; n: number; title: string; body: string } & Grow)
  | ({ k: "lines" } & Grow)
  | ({ k: "shot"; which: "menu" | "screen"; label: string } & Grow)
  | ({ k: "steps"; items: { title: string; body: string }[]; arrows?: boolean } & Grow);

export type ManualPage = {
  cover?: boolean;
  title: string;
  subtitle: string;
  blocks: ManualNode[];
};

const NOTE_EMPTY = "※ 엑셀을 올리기 전의 초기 화면 모양입니다. 올리면 값이 채워집니다.";
const NOTE_SHORT = "※ 엑셀을 올리기 전의 초기 화면 모양입니다.";
const NOTE_COLS = "※ 열 이름은 화면 기준이고, 값은 엑셀을 올리면 채워집니다.";
const NOTE_HEAT = "※ 색 농도는 설명용 예시입니다. 실제 값은 엑셀을 올리면 채워집니다.";

function lineCell(n: number, text: string): ManualCell {
  return { text, dot: "line", n };
}
function centerCell(n: number, text: string): ManualCell {
  return { text, dot: "center", n };
}
function allCell(text: string): ManualCell {
  return { text, dot: "all" };
}

const lineZeros: ManualCell[] = ["0", "0", "0", "0.0%", "", "", "0.0", "0", ""];
const dots = ["⋮", "⋮", "⋮", "⋮", "⋮", "⋮", "⋮", "⋮", "⋮"];

const heatA = [0.12, 0.34, 0.55, 0.16, 0.92, 0.2, 0.6, 0.96];
const heatB = [0.18, 0.46, 0.7, 0.28, 0.5, 0.1, 0.36, 0.76];
const heatC = [0.08, 0.2, 0.38, 0.84, 0.66, 0.4, 0.16, 0.52];

function heatRow(levels: number[]): ManualCell[] {
  return ["··", "··", "··", "··", "··", "··", "··", "··", ...levels.map((heat) => ({ heat }))];
}

export const MANUAL_PAGES: ManualPage[] = [
  {
    cover: true,
    title: "센터 생산성 프로그램\n사용 매뉴얼",
    subtitle: "신오산저온센터 · osan.grok.me",
    blocks: [],
  },
  {
    title: "프로그램 소개",
    subtitle: "작업 엑셀을 올리면 센터 · 라인 · 루트 · 점포 · 상품 진척이 바로 보입니다",
    blocks: [
      {
        k: "grid",
        cols: 3,
        gap: 16,
        children: [
          { k: "stat", n: "9", label: "메뉴" },
          { k: "stat", n: "8", label: "라인 (1~8 라인)" },
          { k: "stat", n: "3", label: "센터 (1·2·3 센터)" },
        ],
      },
      {
        k: "steps",
        grow: true,
        arrows: true,
        items: [
          { title: "엑셀 올리기", body: "맨 위에서 신오산 또는 포천을 고른 뒤 작업 엑셀을 올립니다. 신오산은 1·2·3센터, 포천은 1·2센터만 나오고 파일은 따로 보관됩니다." },
          { title: "화면에서 확인", body: "왼쪽 메뉴에서 봅니다. 맨 아래 톱니는 제어판입니다. 마스터, 지역센터, 배치를 고칩니다." },
          { title: "꺼내 쓰기", body: "화면에 따라 캡처 · 복사, 인쇄, 엑셀 저장을 쓸 수 있습니다." },
        ],
      },
    ],
  },
  {
    title: "접속과 엑셀 올리기",
    subtitle: "PC 에 따라 올리는 방법이 다릅니다",
    blocks: [
      {
        k: "grid",
        cols: 2,
        gap: 16,
        children: [
          {
            k: "card",
            children: [
              { k: "badge", text: "집 컴퓨터", tone: "blue" },
              { k: "p", text: "화면에서 바로 올립니다", strong: true, size: 22, color: "#1A5276" },
              { k: "p", text: "osan.grok.me 화면 맨 위 ‘올리기’ 영역에서 센터를 고르고 엑셀 파일을 선택합니다.", size: 16 },
            ],
          },
          {
            k: "card",
            children: [
              { k: "badge", text: "회사 컴퓨터", tone: "orange" },
              { k: "p", text: "‘생산성 EXE’ 를 실행합니다", strong: true, size: 22, color: "#1A5276" },
              {
                k: "p",
                text: "회사 PC 에서는 Privacy-i 가 브라우저 업로드를 막습니다. 생산성 EXE를 한 번 받아 실행하면, 다음부터 새 버전이 있을 때 알아서 바뀝니다. 다시 열어도 그대로면 생산성 EXE를 다시 받아, 공용폴더의 생산성보기.exe 와 화면.html 만 바꾸세요. 제어판.json 은 그대로 둡니다.",
                size: 16,
              },
              { k: "link", text: "osan.grok.me/company-pc.zip", href: "https://osan.grok.me/company-pc.zip" },
            ],
          },
        ],
      },
      { k: "h", text: "올리기 순서" },
      {
        k: "steps",
        grow: true,
        arrows: false,
        items: [
          { title: "센터 고르기", body: "올리기 원본을 넣을 센터를 1 센터 · 2 센터 · 3 센터 중에서 고릅니다." },
          { title: "엑셀 선택", body: "올릴 엑셀 파일을 선택합니다. 올리면 모든 화면이 채워집니다." },
          { title: "배치표 선택", body: "로케이션 화면에서 쓰는 센터 배치표입니다. 필요할 때 함께 올립니다." },
        ],
      },
    ],
  },
  {
    title: "화면 구성",
    subtitle: "하위 화면을 열면 지우기 옆에 탭이 생깁니다. 최대 5개까지 오갑니다",
    blocks: [
      {
        k: "grid",
        cols: 3,
        gap: 14,
        grow: true,
        children: [
          { k: "menu", n: 1, title: "요약", body: "라인별 생산성 · 센터비교 · 예상 작업 종료시간 · 라인별 작업 %" },
          { k: "menu", n: 2, title: "작업 확인", body: "누르면 펼칩니다. 시간별 확인 · 미작업 상품 · 작업 상품 · 점포 진척 · 루트. 다시 누르면 접힙니다." },
          { k: "menu", n: 3, title: "로케이션", body: "라인별 점포 배치 · 임시 배치" },
          { k: "menu", n: 4, title: "오출 확인", body: "작업 엑셀과 1·2·3센터 오출 엑셀을 올려 오출 이력을 봅니다. 모든 열 제목의 필터로 검색해 고르고, 열 제목을 누르면 정렬됩니다. 마스터 열 필터는 DPT(FF1 · FF2 · 냉동)입니다." },
          { k: "menu", n: 5, title: "데이터분석", body: "누르면 펼칩니다. 생산성 분석 · 출고 분석 · 수불분석 · 오출분석. 수불분석은 아직 빈 화면입니다." },
        ],
      },
    ],
  },
  {
    title: "먼저 알아둘 기준",
    subtitle: "모든 화면에서 같은 기준으로 계산합니다",
    blocks: [
      {
        k: "row",
        gap: 16,
        grow: true,
        children: [
          {
            k: "table",
            flex: 1.55,
            left: true,
            columns: ["용어", "뜻"],
            rows: [
              ["완료", "피킹 시각이 있는 건"],
              ["잔여 · 미작업", "피킹 시각이 없거나, 피킹수량이 0인 건"],
              ["건/hr", "한 시간에 처리한 건수 ( 순위 기준 )"],
              ["총 작업시간", "첫 완료부터 마지막 완료까지 ( 쉬는 시간 포함 )"],
              ["몇 %", "작업건수 중 완료된 비율"],
              ["작업수량", "주문수량 합은 총작업수량, 피킹한 수량은 작업수량, 안 한 주문수량은 미작업수량"],
            ],
          },
          {
            k: "col",
            flex: 0.85,
            gap: 16,
            children: [
              {
                k: "card",
                flex: 1,
                title: "DPT 구분",
                body: "전체 / 유제 냉장 / FF2 중에서 고릅니다.\n유제 냉장은 루트 100 번대, FF2 는 루트 200 번대입니다.",
              },
              { k: "card", flex: 1, title: "라인 (1~8 라인)", children: [{ k: "lines" }] },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "① 요약 · 라인별 생산성",
    subtitle: "가장 먼저 보는 화면 — 라인마다 진행 상황과 속도를 봅니다",
    blocks: [
      { k: "chips", label: "화면 선택 항목", items: ["센터 1·2·3 센터", "DPT 전체 · 유제 냉장 · FF2", "캡처 · 복사"] },
      {
        k: "table",
        columns: ["라인", "작업건수", "완료", "잔여", "%", "시작", "끝", "시간", "건/hr", "순위"],
        rows: [
          [allCell("전체"), ...lineZeros],
          [lineCell(1, "1 라인"), ...lineZeros],
          [lineCell(2, "2 라인"), ...lineZeros],
          ["⋮", ...dots],
          [lineCell(8, "8 라인"), ...lineZeros],
        ],
        note: NOTE_EMPTY,
      },
      {
        k: "grid",
        cols: 3,
        grow: true,
        children: [
          { k: "card", title: "시간", body: "쉬는 시간을 포함해 첫 완료부터 마지막 완료까지로 셉니다." },
          { k: "card", title: "순위 기준", body: "순위는 건/hr, 곧 한 시간에 처리한 건수로 매깁니다." },
          { k: "card", title: "DPT 바꿔 보기", body: "유제 냉장은 루트 100 번대, FF2 는 루트 200 번대입니다. 위쪽 DPT 버튼으로 바꿉니다." },
        ],
      },
    ],
  },
  {
    title: "① 요약 · 센터비교",
    subtitle: "1~3 센터 비교 — 센터마다 진행 상황과 속도를 나란히 봅니다",
    blocks: [
      { k: "chips", label: "화면 선택 항목", items: ["DPT 전체 · 유제 냉장 · FF2"] },
      {
        k: "row",
        gap: 16,
        children: [
          {
            k: "col",
            flex: 1.7,
            gap: 8,
            children: [
              {
                k: "table",
                columns: ["센터", "할 일", "끝낸 일", "남은 일", "%", "시작", "끝", "시간", "건/hr", "순위"],
                rows: [
                  [centerCell(1, "1 센터"), ...lineZeros],
                  [centerCell(2, "2 센터"), ...lineZeros],
                  [centerCell(3, "3 센터"), ...lineZeros],
                ],
                note: NOTE_SHORT,
              },
            ],
          },
          {
            k: "card",
            flex: 0.72,
            title: "읽는 법",
            body: "할 일은 전체 작업 건수, 끝낸 일은 완료 건수, 남은 일은 아직 안 한 건수입니다. 순위는 건/hr 이 높은 센터가 앞입니다.",
          },
        ],
      },
      {
        k: "row",
        gap: 16,
        grow: true,
        children: [
          {
            k: "card",
            flex: 1.45,
            title: "보는 순서",
            children: [
              {
                k: "ol",
                items: [
                  "위에서 DPT( 전체 · 유제 냉장 · FF2 ) 를 고릅니다.",
                  "남은 일과 % 로 센터별 진행 상황을 봅니다.",
                  "건/hr · 순위로 센터별 속도를 비교합니다.",
                ],
              },
            ],
          },
          {
            k: "card",
            flex: 0.9,
            title: "작업 진척률",
            body: "센터비교 아래에서 1~3 센터와 DPT( 전체 · 유제 냉장 · FF2 ) 별 작업 진척률도 함께 봅니다.",
          },
        ],
      },
    ],
  },
  {
    title: "① 요약 · 예상 작업 종료시간",
    subtitle: "센터별로 유제·FF2 가 몇 시에 끝날지 계산합니다",
    blocks: [
      { k: "chips", label: "화면 선택 항목", items: ["유제 구간 · FF2 구간", "계산 · 5% 반영 · 수기", "캡처 · 복사"] },
      {
        k: "table",
        columns: ["센터", "총유제 %", "현재 %", "유제마감", "예상종료"],
        rows: [
          [centerCell(1, "1 센터"), "", "", "", ""],
          [centerCell(2, "2 센터"), "", "", "", ""],
          [centerCell(3, "3 센터"), "", "", "", ""],
        ],
        note: NOTE_COLS,
      },
      {
        k: "grid",
        cols: 3,
        grow: true,
        children: [
          { k: "card", title: "구간 평균", body: "유제 30 분은 유제 · 냉장만, FF2 15 분은 FF2 만 대상으로 평균을 냅니다." },
          { k: "card", title: "마감 · 예상 종료", body: "유제 마감과 예상 종료도 이 구간 평균 속도로 계산합니다." },
          { k: "card", title: "표시 방식", body: "화면에서 ‘계산 5% 반영’ 과 ‘수기’ 두 가지 표시 중에서 고릅니다." },
        ],
      },
    ],
  },
  {
    title: "① 요약 · 라인별 작업 %",
    subtitle: "센터마다 라인별 작업 비율을 나란히 봅니다",
    blocks: [
      { k: "chips", label: "화면 선택 항목", items: ["센터 1·2·3 센터", "라인 1~8 라인 · 유제", "계산 · 5% 반영 · 수기"] },
      {
        k: "table",
        dense: true,
        columns: ["센터", "현재 %", "1 라인", "2 라인", "3 라인", "4 라인", "5 라인", "6 라인", "7 라인", "8 라인", "유제"],
        rows: [1, 2, 3].map((n) => [centerCell(n, `${n} 센터`), ...Array(10).fill("0.0%")]),
        note: NOTE_COLS,
      },
      {
        k: "grid",
        cols: 3,
        grow: true,
        children: [
          { k: "card", title: "읽는 법", body: "센터별 현재 % 와 1~8 라인, 유제의 작업 % 를 한 줄에서 비교합니다." },
          { k: "card", title: "어느 라인이 느린가", body: "같은 센터 안에서 % 가 낮은 라인이 아직 많이 남은 라인입니다." },
          { k: "card", title: "표시 방식", body: "화면에서 ‘계산 5% 반영’ 과 ‘수기’ 표시 중에서 고릅니다." },
        ],
      },
    ],
  },
  {
    title: "② 시간별 확인",
    subtitle: "시간별로 얼마나 했는지 구간을 나눠 봅니다",
    blocks: [
      {
        k: "chips",
        label: "화면 선택 항목",
        items: ["센터 1·2·3 센터", "DPT 전체 · 유제 냉장 · FF2", "구간 ( 분 ) 10·15·30·60", "인쇄"],
      },
      {
        k: "table",
        dense: true,
        columns: ["구간시작", "구간종료", "건수", "시간당", "누적", "총 %", "피킹", "구간 %", "1 라인", "2 라인", "3 라인", "4 라인", "5 라인", "6 라인", "7 라인", "8 라인"],
        rows: [heatRow(heatA), heatRow(heatB), heatRow(heatC)],
        note: NOTE_HEAT,
      },
      {
        k: "grid",
        cols: 4,
        grow: true,
        children: [
          { k: "card", title: "구간 선택", body: "10·15·30·60 분 중에서 고르면 그 간격으로 시간대를 나눠 보여줍니다." },
          { k: "card", title: "색 농도", body: "색이 진할수록 그 구간에 많이 처리한 것입니다." },
          { k: "card", title: "% 읽는 법", body: "총 % 는 처음부터 쌓인 비율, 구간 % 는 그 구간만의 비율, 평균 % 는 구간 % 를 평균 낸 값입니다." },
          { k: "card", title: "계획 · 완료 행", body: "표 위쪽에서 계획 · 완료 건수와 시작 · 마지막 시각, 15 분별 평균작업건수를 봅니다." },
        ],
      },
    ],
  },
  {
    title: "③ 미작업 상품",
    subtitle: "미작업 상품리스트 — 아직 안 한 상품만 모아 보고 인쇄합니다",
    blocks: [
      {
        k: "chips",
        label: "화면 선택 항목",
        items: ["센터 1·2·3 센터", "라인 전체 · 1~8 라인", "DPT 전체 · 유제 냉장 · FF2", "인쇄"],
      },
      { k: "kpis", items: ["총작업량", "미작업수량", "몇 % 완료"] },
      {
        k: "table",
        columns: ["선택", "바코드", "상품", "총작업량", "미작업수량", "미작업 라인 수량", "몇 % 완료"],
        rows: [[{ box: true }, "상품코드 (GoodsCD)", "상품명", "—", "—", "1라인 - 2개  2라인 - 1개", "—"]],
      },
      {
        k: "grid",
        cols: 3,
        grow: true,
        children: [
          { k: "card", title: "목록 기준", body: "미작업이 남은 상품만 보여 줍니다. 총작업량은 주문수량 합, 미작업수량은 아직 못 한 수량입니다. 미작업 라인 수량은 고른 센터 안에서 1라인 - 2개처럼 라인별 미작업수량입니다. 몇 %완료는 이 수량으로 계산합니다." },
          { k: "card", title: "인쇄", body: "체크한 상품만 인쇄됩니다. 아무것도 체크하지 않으면 화면에 보이는 상품 전체를 인쇄합니다. 인쇄본에는 몇 %완료가 없습니다." },
          { k: "card", title: "찾아가는 길", body: "⑤ 점포 진척에서 점포 이름을 누르면 그 점포의 미작업 상품이 나옵니다." },
        ],
      },
    ],
  },
  {
    title: "④ 작업 상품",
    subtitle: "상품마다 언제 시작해 언제 끝났는지, 작업시간이 얼마나인지 봅니다",
    blocks: [
      { k: "chips", label: "화면 선택 항목", items: ["센터 전체 · 1·2·3 센터", "DPT 전체 · 유제 냉장 · FF2", "라인 전체 · 1~8 라인"] },
      {
        k: "table",
        dense: true,
        columns: ["센터", "바코드", "상품", "작업수량", "총건수", "완료", "미완료", "시작", "종료", "작업시간"],
        rows: [["1 센터", "GoodsCD", "상품명", "—", "—", "—", "—", "—", "—", "—"]],
        note: NOTE_COLS,
      },
      {
        k: "grid",
        cols: 3,
        grow: true,
        children: [
          { k: "card", title: "상품별로 봅니다", body: "작업 시각이 없는 상품도 나옵니다. 상품마다 작업수량, 총건수, 완료 · 미완료 건수를 보여 줍니다." },
          { k: "card", title: "시작 · 종료 · 작업시간", body: "상품을 누르면 라인별 작업수량 옆에 작업완료수량이 있습니다. 주문수량만큼 피킹한 것만 완료수량입니다. 0이거나 모자라면 완료에 넣지 않고 미작업으로 남습니다. 라인을 누르면 점포별 작업수량, 작업완료수량, 건수가 나옵니다." },
          { k: "card", title: "상품 · 점포", body: "오른쪽 슬라이드로 점포를 고르면 점포 목록이 나옵니다. 점포 검색으로 점포를 찾고, 점포명을 누르면 상품코드, 상품명, 작업수량, 작업완료수량, 작업종료가 나옵니다. 시간 칸에는 02:51:12처럼 초까지 넣을 수 있습니다." },
        ],
      },
    ],
  },
  {
    title: "⑤ 점포 진척",
    subtitle: "점포 작업 진척률 — 점포별로 남은 건수를 봅니다",
    blocks: [
      {
        k: "chips",
        label: "화면 선택 항목",
        items: ["센터 1·2·3 센터", "라인 전체 · 1~8 라인", "점포 전체", "DPT 전체 · 유제 냉장 · FF2"],
      },
      { k: "kpis", items: ["작업건수", "완료건수", "잔여건수", "몇 % 완료"] },
      {
        k: "row",
        gap: 16,
        children: [
          {
            k: "table",
            flex: 1.55,
            columns: ["점포", "작업건수", "완료건수", "잔여건수 ▼", "몇 % 완료"],
            rows: [["점포명 ( 누르면 미작업 상품 )", "—", "—", "—", "—"]],
          },
          {
            k: "card",
            flex: 0.75,
            title: "정렬",
            body: "표의 제목을 누르면 그 열 기준으로 정렬되고, 다시 누르면 오름차순 · 내림차순이 바뀝니다.",
          },
        ],
      },
      {
        k: "row",
        gap: 16,
        grow: true,
        children: [
          {
            k: "card",
            flex: 1.55,
            title: "점포 이름을 누르면",
            children: [{ k: "flow", from: "점포 이름 클릭", to: "피킹 시각이 없는\n미작업 상품 목록" }],
          },
          {
            k: "card",
            flex: 0.75,
            title: "점포 · 완료 기준",
            body: "점포는 ClientNM( 점포명 ), 완료는 피킹 시각이 있는 건입니다.",
          },
        ],
      },
    ],
  },
  {
    title: "⑥ 루트",
    subtitle: "루트 작업 종료 — 루트별로 어디까지 끝났는지 봅니다",
    blocks: [
      { k: "chips", label: "화면 선택 항목", items: ["센터 1·2·3 센터", "DPT 전체 · 유제 냉장 · FF2", "10 자리 묶음", "엑셀로 받기"] },
      {
        k: "table",
        columns: ["루트", "작업건수", "완료건수", "잔여건수", "몇 %"],
        rows: [
          [allCell("전체"), "0", "0", "0", "0.0%"],
          ["⋮", "⋮", "⋮", "⋮", "⋮"],
        ],
        note: NOTE_EMPTY,
      },
      {
        k: "grid",
        cols: 3,
        grow: true,
        children: [
          { k: "card", title: "루트 기준", body: "루트는 각 센터 시트의 RTECOD( 루트 코드 ) 입니다." },
          { k: "card", title: "완료 기준", body: "완료는 피킹 시각이 있는 건입니다. 시각이 없으면 잔여건수로 잡힙니다." },
          { k: "card", title: "꺼내 쓰기", body: "‘10 자리 묶음’ 옵션으로 보기 방식을 바꾸고, ‘엑셀로 받기’ 버튼으로 결과를 저장합니다." },
        ],
      },
    ],
  },
  {
    title: "⑦ 오출분석 · 엑셀과 필터",
    subtitle: "오출 엑셀을 올리면 점포 · 상품 · 로케이션에서 오출을 봅니다",
    blocks: [
      { k: "chips", label: "화면 선택 항목", items: ["센터", "년", "월", "라인", "DPT", "루트", "사유", "점포 검색", "표시", "엑셀 올리기"] },
      {
        k: "table",
        columns: ["DPT", "작업일과 오출일", "루트"],
        rows: [
          ["FF2편 · 유제 · 냉장", "작업한 날의 다음 날이 오출일입니다.", "100번대는 200번대로 바꿉니다."],
          ["FF1편 · 1차상품", "작업한 날이 곧 오출일입니다.", "300번대 작업 루트를 씁니다."],
          ["냉동 · 빙과", "작업한 날이 곧 오출일입니다.", "400번대 작업 루트를 씁니다."],
        ],
        note: "※ 그 날 작업 루트가 없으면 오출 엑셀의 배송루트를 같은 번대로 보여 줍니다. 파일 이름은 센터_년월입니다. 1_2601 은 1센터 2026년 1월이고, 냉동은 1센터 파일 안에 있습니다. 읽은 년·월만 필터에 나옵니다.",
      },
      {
        k: "grid",
        cols: 3,
        grow: true,
        children: [
          { k: "card", title: "엑셀 올리기", body: "오출 엑셀을 올리면 센터와 년·월로 나뉩니다. 올린 파일 이름은 화면에 적지 않습니다." },
          { k: "card", title: "DPT 여섯 가지", body: "FF1편, FF2편, 유제, 냉장, 냉동, 1차상품입니다. 빙과는 냉동으로 봅니다." },
          { k: "card", title: "여러 개 고르기", body: "DPT · 루트 · 사유는 여러 개 고릅니다. 루트는 검색 후 엔터로 적용합니다." },
        ],
      },
    ],
  },
  {
    title: "⑦ 오출분석 · 냉장과 냉동",
    subtitle: "위 슬라이드로 냉장 · 냉동을 바꾸고, 아래에서 보는 방식을 고릅니다",
    blocks: [
      { k: "chips", label: "슬라이드", items: ["냉장", "냉동", "로케이션", "점포", "상품"] },
      {
        k: "table",
        columns: ["화면", "내용"],
        rows: [
          ["냉장 로케이션", "로케이션과 건수 · 금액 · 오출 일수만 봅니다. 점포명은 칸에 없습니다."],
          ["냉장 · 냉동 점포", "해당 온도의 점포를 빠짐없이 표로 봅니다."],
          ["상품", "냉장 상품은 냉동을 빼고, 냉동 상품은 냉동만 모읍니다."],
        ],
        note: "※ 미오출사유, 상위 10점, 못 찾은 점포 제목을 누르면 아래로 길어지며 아래 화면을 덮습니다.",
      },
      {
        k: "grid",
        cols: 3,
        grow: true,
        children: [
          { k: "card", title: "라인 필터", body: "냉장 로케이션에 있습니다. 고른 라인만 집계합니다." },
          { k: "card", title: "상위 10점", body: "일수 · 건수 · 금액으로 고르고, 옆의 라인 필터로 라인을 좁힙니다." },
          { k: "card", title: "1센터 냉동", body: "냉동 행은 1센터 파일에 있습니다. 냉동 슬라이드의 점포 · 상품에서 봅니다." },
        ],
      },
    ],
  },
  {
    title: "⑦ 오출분석 · 점포 창과 상품",
    subtitle: "점포명이나 상품명을 누르면 그 오출만 따로 봅니다",
    blocks: [
      { k: "chips", label: "상품 창 필터", items: ["루트", "점포명", "사유", "검색 후 엔터"] },
      {
        k: "table",
        columns: ["출고일", "루트", "로케이션", "점포명", "수량", "금액", "사유"],
        rows: [
          ["····-··-··", "···", "····", "점포명", "0", "0", "사유"],
          ["⋮", "⋮", "⋮", "⋮", "⋮", "⋮", "⋮"],
        ],
        note: "※ 머리글을 누르면 정렬됩니다. 루트는 작업 엑셀 번대입니다.",
      },
      {
        k: "grid",
        cols: 3,
        grow: true,
        children: [
          { k: "card", title: "점포 창", body: "점포명을 누르면 일수 · 건 · 수량 · 금액과 사유, 상품 목록이 나옵니다. DPT · 사유는 여러 개 고릅니다." },
          { k: "card", title: "상품 화면", body: "냉장 상품은 냉동을 빼고, 냉동 상품은 냉동만 모읍니다. 같은 상품코드끼리 묶습니다." },
          { k: "card", title: "닫기", body: "점포 창과 상품 창은 바깥을 누르거나 ESC 로 닫습니다. 오른쪽 위 프린트로 지금 보이는 목록을 출력합니다." },
        ],
      },
    ],
  },
  {
    title: "⑧ 로케이션",
    subtitle: "라인별 점포 배치 — 점포를 끌어다 빼 두는 임시 배치도 여기서 합니다. 포천은 1·2센터 모두 1~6라인이고 칸 번호가 신오산과 다릅니다.",
    blocks: [
      {
        k: "chips",
        label: "화면 선택 항목",
        items: ["센터 1·2·3 센터", "DPT 전체 · 유제 냉장 · FF2", "루트 · 라인 전체", "점포 원위치 · 선택 점포 빼기", "엑셀"],
      },
      {
        k: "row",
        gap: 16,
        children: [
          {
            k: "col",
            flex: 1.55,
            gap: 8,
            children: [
              { k: "badge", text: "1 라인", tone: "red" },
              {
                k: "row",
                gap: 18,
                children: [
                  {
                    k: "table",
                    flex: 1,
                    columns: ["로케이션", "점포명", "작업수량"],
                    rows: [
                      ["0139", "", ""],
                      ["0138", "", ""],
                      ["0137", "", ""],
                      ["⋮", "⋮", "⋮"],
                      ["0101", "", ""],
                    ],
                  },
                  {
                    k: "table",
                    flex: 1,
                    columns: ["작업수량", "점포명", "로케이션"],
                    rows: [
                      ["", "", "0189"],
                      ["", "", "0188"],
                      ["", "", "0187"],
                      ["⋮", "⋮", "⋮"],
                      ["", "", "0151"],
                    ],
                  },
                ],
              },
              { k: "note", text: "↑ 1 라인 예시 : 왼쪽 0139→0101, 오른쪽 0189→0151 ( 라인마다 같은 구조 )" },
            ],
          },
          {
            k: "card",
            flex: 0.72,
            title: "배치표 올리기",
            body: "1·2·3 센터 배치표를 올리면 발주가 없는 점포도 칸에 나옵니다. 올리기 전에는 작업 엑셀에 있는 점포만 보입니다.",
          },
        ],
      },
      {
        k: "row",
        gap: 16,
        grow: true,
        children: [
          {
            k: "card",
            flex: 1.55,
            title: "위치 규칙",
            body: "칸 번호와 기둥은 센터마다 다릅니다. 제어판의 배치에서 고칩니다. 점포는 ClientNM 이고, 빼 두어도 로케이션 번호는 움직이지 않습니다.",
          },
          {
            k: "card",
            flex: 0.72,
            title: "임시 배치",
            body: "점포만 끌어다 빼 둘 수 있습니다. 로케이션 번호는 움직이지 않고, 빼 둔 작업수량은 라인 합계에서 빠집니다.",
          },
        ],
      },
    ],
  },
  {
    title: "오출 확인",
    subtitle: "작업 엑셀과 오출 엑셀을 맞추면 라인 · 로케이션이 붙은 오출 이력이 나옵니다",
    blocks: [
      { k: "chips", label: "열", items: ["오출일자", "센터", "라인", "로케이션", "루트", "점포코드", "점포명", "마스터", "상품코드", "상품명", "출고수량", "수량", "오출금액", "작업 시간", "미오출사유"] },
      {
        k: "row",
        gap: 16,
        grow: true,
        children: [
          { k: "card", flex: 1, title: "파일", body: "엑셀 업로드를 누르거나 파일을 화면에 놓습니다. 센터는 1센터 · 2센터 · 3센터 · 냉동 · 통합, 구분은 작업 · 오출입니다. 통합은 1·2·3센터 작업이 한 파일일 때 씁니다. 1센터 오출 파일 안의 냉동은 냉동으로 나눕니다." },
          { k: "card", flex: 1, title: "맞추는 기준", body: "같은 센터의 점포코드와 상품코드로 작업 행을 찾습니다. 코드가 없으면 상품명으로 찾습니다. 출고수량은 그렇게 찾은 작업 행의 피킹 수량 합입니다. 작업 파일이 없으면 비어 있습니다. 그 상품에 작업 시간이 없어도, 같은 점포의 다른 작업에 있는 라인 · 로케이션을 가져옵니다. 냉동은 표시기주소를 로케이션 파일과 맞춰 라인은 존코드, 로케이션은 로케이션코드로 보입니다. 신오산 파일은 기본으로 들어 있고, 다른 지역은 제어판에서 올립니다." },
          { k: "card", flex: 1, title: "필터", body: "모든 열 제목 옆 필터를 누르면 검색과 체크 목록이 나옵니다. 고른 항목만 표에 남고, 전체 초기화로 다시 다 봅니다. 상품은 이름 또는 바코드로 찾고, 마스터 열은 DPT(FF1 · FF2 · 냉동)로 좁힙니다. 수량이 -5 이하인 줄은 연한 빨강입니다. 왼쪽 회색 칸의 점포 10 · 상품 10은 오출 금액이 마이너스인 항목이고, 이름을 누르면 상세가 열립니다." },
        ],
      },
    ],
  },
  {
    title: "⑨ 생산성 분석",
    subtitle: "보관해 둔 생산성 파일을 여러 개 골라 일 · 주 · 월별로 봅니다",
    blocks: [
      { k: "chips", label: "화면 선택 항목", items: ["연도", "기간 일별 · 주별 · 월별", "보기 센터 · DPT"] },
      { k: "chips", label: "상단 버튼", items: ["생산성 파일", "근태표", "근태양식", "엑셀로 받기"] },
      {
        k: "steps",
        grow: true,
        arrows: true,
        items: [
          { title: "파일 고르기", body: "보관해 둔 업로드 파일을 여러 개 고릅니다.\n예 : 1019_FF1, 1019_FF2\n이미 만든 파일은 제어판 지정폴더의 작업 내역 칸, 오른쪽 아래 라이트하게 만들기로 여러 개 고르면, 같은 폴더에 같은 이름으로 덮어씁니다. 필요한 열만 남습니다." },
          { title: "기간 정하기", body: "일별 · 주별 · 월별 중에서 고릅니다." },
          { title: "범위 좁히기", body: "연도, 센터, DPT 로 좁혀 봅니다." },
          { title: "엑셀로 받기", body: "요약 · 분석 · 일별 · 주별 · 월별 · 사람 · 분석데이터 시트로 받습니다. 분석 시트의 노란 칸(시작 9시, 종료 6시, 연장 1시간)을 바꾸면 판정이 다시 계산됩니다." },
        ],
      },
      {
        k: "bar",
        title: "근태 연계",
        body: "근태표와 근태양식으로 근태 자료를 함께 다루는 버튼입니다. 세부 사용법은 화면의 안내를 따릅니다.",
      },
    ],
  },
  {
    title: "⑩ 출고 분석 · 파일 만들기",
    subtitle: "출고 분석에 쓸 파일은 가맹지원시스템에서 받아 만듭니다",
    blocks: [
      {
        k: "row",
        gap: 16,
        grow: true,
        children: [
          { k: "shot", which: "menu", label: "메뉴 위치", flex: 0.72 },
          {
            k: "col",
            flex: 1,
            gap: 14,
            children: [
              {
                k: "card",
                flex: 1,
                title: "1 단계 · 메뉴 열기",
                body: "가맹지원시스템에서 물류 → 재고 → 입출고실적 → 배송상품군별미출실적조회를 엽니다.",
              },
              {
                k: "card",
                flex: 1,
                title: "3 · 4 단계 · 올리기",
                body: "받은 파일을 ‘업로드 만들기’ 에 올리면 저장 위치를 묻습니다. 취소하면 저장되지 않습니다. 만든 파일은 ‘월 파일 올리기’ 로 올립니다.",
              },
            ],
          },
          {
            k: "col",
            flex: 1.15,
            gap: 14,
            children: [
              { k: "shot", which: "screen", label: "조회 화면", flex: 1.15 },
              {
                k: "card",
                title: "2 단계 · 조건 정하기",
                body: "센터는 전 센터, 기간은 확정월로 합니다. 미출로 한 번 받아 두고, 오출로 한 번 더 받습니다.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "⑩ 출고 분석 · 화면 사용",
    subtitle: "만든 월 파일을 불러와 요약 · 피벗 · 추이 · 출고정리로 봅니다",
    blocks: [
      { k: "chips", label: "화면 선택 항목", items: ["센터", "DPT", "루트", "표시 건수 · 작업수량", "라인"] },
      { k: "chips", label: "하위 메뉴", items: ["요약", "피벗", "추이", "출고정리"] },
      {
        k: "grid",
        cols: 3,
        grow: true,
        children: [
          {
            k: "card",
            n: 1,
            title: "업로드 만들기",
            body: "가맹지원시스템에서 받은 미출 · 오출 파일을 올려 월 파일을 만듭니다. 저장 위치를 묻고, 취소하면 저장되지 않습니다.",
          },
          {
            k: "card",
            n: 2,
            title: "월 파일 올리기",
            body: "만든 월 파일을 올립니다. 화면에 파일을 놓아도 같이 열립니다. 그다음 요약, 피벗, 추이, 출고정리를 봅니다.",
          },
          { k: "card", n: 3, title: "데이터 비우기", body: "불러온 데이터를 비웁니다. 새 월 파일로 바꿀 때 씁니다." },
        ],
      },
      {
        k: "bar",
        title: "사용 순서",
        body: "가맹지원시스템에서 미출 · 오출 파일 받기 → 업로드 만들기 → 월 파일 올리기 → 센터 · DPT · 루트 · 표시 ( 건수 · 작업수량 ) · 라인으로 범위를 좁혀 하위 메뉴에서 확인합니다.",
      },
    ],
  },
  {
    title: "알아두면 좋은 점",
    subtitle: "숫자를 읽을 때 꼭 기억해 둘 여섯 가지",
    blocks: [
      {
        k: "grid",
        cols: 3,
        gap: 16,
        grow: true,
        children: [
          { k: "card", n: 1, tone: "amber", title: "회사 PC 는 EXE 로", body: "브라우저 업로드는 Privacy-i 가 막습니다. EXE 는 새 버전이 있으면 다음에 열 때 바꿉니다. 메뉴 아래 Build 번호로 버전을 확인합니다. 안 바뀌면 생산성 EXE를 다시 받아 생산성보기.exe 와 화면.html 만 바꾸세요. 제어판.json 은 그대로 둡니다." },
          { k: "card", n: 2, tone: "amber", title: "쉬는 시간이 포함됩니다", body: "시간, 건/hr, 예상 종료시간에 쉬는 시간이 들어 있어 실제보다 느리게 보일 수 있습니다." },
          { k: "card", n: 3, tone: "amber", title: "완료 = 피킹 시각", body: "피킹 시각이 없는 건은 잔여 · 미작업으로 셉니다." },
          { k: "card", n: 4, tone: "amber", title: "DPT 는 루트 번대로", body: "유제 냉장은 루트 100 번대, FF2 는 루트 200 번대입니다." },
          { k: "card", n: 5, tone: "amber", title: "인쇄는 선택한 것만", body: "인쇄할 때는 지금 선택한 센터, DPT, 구간만 출력됩니다." },
          {
            k: "card",
            n: 6,
            tone: "amber",
            title: "로케이션 번호는 그대로",
            body: "점포를 빼 두어도 로케이션 번호는 움직이지 않고, 빼 둔 작업수량만 라인 합계에서 빠집니다.",
          },
        ],
      },
    ],
  },
  {
    title: "제어판",
    subtitle: "왼쪽이 메뉴, 오른쪽이 내용입니다. 순서는 마스터 수정 · 지역센터 · 배치 · 냉동 로케이션",
    blocks: [
      { k: "chips", label: "메뉴", items: ["마스터 수정", "지역센터", "배치", "냉동 로케이션", "지정폴더"] },
      { k: "chips", label: "저장", items: ["가져오기", "회사 EXE도 같이 올림", "지역은 합쳐서 남음"] },
      {
        k: "steps",
        items: [
          { title: "마스터 수정", body: "배송상품군 코드를 추가합니다. 코드, 이름, 편(FF1편 · FF2편 · 유제 · 냉장 · 냉동 · 1차상품)을 넣습니다." },
          { title: "지역센터", body: "지역 이름을 추가하거나 지웁니다. 그 안에서 센터를 더하고, 라인 수를 + − 로 바꿉니다." },
          { title: "배치", body: "지역, 센터, 라인을 고른 뒤 왼쪽·오른쪽 칸 수와 이름을 바꿉니다. 포천 2센터는 FF1 · FF2 가 따로입니다." },
          { title: "지정폴더", body: "작업 내역, 근태표, 배송상품군별, 수불장, 오출내역 폴더를 지정합니다. 회사 EXE에서 데이터분석을 열면 그 폴더와 하위 폴더의 엑셀을 바로 읽습니다. 근태표는 폴더 안 파일을 모두 읽어 작업일과 맞춥니다. 경로는 그 컴퓨터 공용 폴더에만 남습니다." },
          { title: "어디에 남나", body: "저장하면 사이트에 올라가고, 다른 센터 EXE와 사이트는 가져오기로 받습니다. 없는 지역만 더하고, 이미 있는 지역은 더 나중에 저장한 쪽이 남습니다. 회사 EXE의 제어판.json 도 같이 갱신됩니다." },
        ],
      },
      { k: "bar", title: "여는 곳", body: "왼쪽 메뉴 맨 아래 톱니입니다. 메뉴를 누르면 오른쪽 화면이 바뀌고, 뒤로 가기는 없습니다." },
    ],
  },
  {
    title: "배치 고치기",
    subtitle: "첫 칸 숫자는 아래, 끝 칸 숫자는 위에 채워집니다",
    blocks: [
      { k: "chips", label: "번호", items: ["첫 칸", "끝 칸", "80칸까지"] },
      { k: "chips", label: "칸", items: ["칸 추가", "기둥 넣기", "위로 · 아래로", "원래 배치"] },
      {
        k: "steps",
        items: [
          { title: "번호 채우기", body: "왼쪽 또는 오른쪽에 첫 칸과 끝 칸을 적고 칸 밖을 누릅니다. 0101 과 0139 이면 위가 0139, 아래가 0101 입니다." },
          { title: "칸 · 기둥", body: "칸을 누른 뒤 칸 추가 또는 기둥 넣기를 누르면 그 칸 위에 생깁니다. 기둥은 한 칸이고, 기둥 다음 기둥은 한 덩어리로 보입니다." },
          { title: "옮기기", body: "≡ 를 끌어 왼쪽·오른쪽으로 옮깁니다. 위로 · 아래로 버튼도 됩니다." },
          { title: "라인", body: "라인 추가 · 라인 삭제로 줄 수를 바꿉니다. 원래 배치는 그 센터를 처음 배치로 되돌립니다." },
        ],
      },
      { k: "bar", title: "기둥은 다시", body: "첫 칸 · 끝 칸으로 번호를 채우면 그 줄의 칸이 번호로 바뀝니다. 사이에 둘 기둥은 기둥 넣기로 다시 끼웁니다." },
    ],
  },
];
