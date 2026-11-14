# 화면 기능을 바꾸면 아래 페이지를 같이 고칩니다.
# 빌드할 때마다 PDF를 다시 만들어 메뉴 버튼과 EXE에 넣습니다.
import base64
import json
from pathlib import Path

from fpdf import FPDF
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "scripts" / "manual-images"
PDF = ROOT / "public" / "manual.pdf"
FONT = "/tmp/zenhei.ttf"
SOURCE_FONT = "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"
TOTAL = 0

PAGES = [
    {
        "title": "시작하기",
        "lead": "엑셀을 올려야 아래 숫자가 생산성이 됩니다. 올리기 전에는 비교할 수 없습니다.",
        "see": [
            "파일 이름의 1·2·3센터로 센터가 갈라집니다.",
            "배치표가 있으면 발주가 없는 점포도 로케이션 칸에 나옵니다.",
        ],
        "use": "오늘 작업 파일을 먼저 올려야 느린 라인, 남은 상품, 종료시간을 볼 수 있습니다.",
        "steps": [
            "왼쪽 위 칸 아이콘으로 메뉴를 엽니다. 순서는 요약, 작업 확인, 로케이션, 데이터분석입니다.",
            "작업 확인과 데이터분석을 누르면 하위 메뉴가 내려오고, 다시 누르면 들어갑니다.",
            "넓은 화면은 메뉴가 왼쪽에 남습니다. 좁은 화면은 왼쪽에서 덮이고, 바깥을 누르면 닫힙니다.",
            "위쪽 엑셀 선택을 누르거나 파일을 화면으로 끌어 넣습니다.",
            "배치표는 로케이션코드, 점포명 열이 있어야 합니다.",
            "회사 PC는 브라우저 파일 선택을 누르지 않습니다. 생산성 EXE의 작업 파일을 씁니다.",
        ],
        "shot": "menu.png",
        "caption": "메뉴. 맨 아래 버튼으로 이 메뉴얼을 엽니다.",
    },
    {
        "title": "요약",
        "lead": "지금 속도면 어디가 느리고, 몇 시에 끝나는지 보는 화면입니다.",
        "see": [
            "라인별 건/시와 순위로 빠른 라인과 느린 라인을 바로 비교합니다.",
            "센터비교는 1·2·3센터 중 뒤처진 센터를 보여 줍니다.",
            "진척률은 유제 냉장과 FF2를 한 막대의 다른 색으로 나눕니다. 센터를 고르면 센터별 막대입니다.",
            "예상 종료는 지금 속도의 마감 시각입니다. 5%반영은 여유를 둔 시각, 수기는 직접 넣은 속도입니다.",
        ],
        "use": "느린 라인으로 사람을 옮길지, 마감 전에 끝나는지를 여기서 결정합니다.",
        "steps": [
            "센터와 DPT를 고릅니다. 센터는 1·2·3을 함께 볼 수 있습니다.",
            "왼쪽이 라인별 생산성, 오른쪽 위가 센터비교, 그 아래가 작업 진척률입니다.",
            "아래는 센터별 예상 종료시간과 라인별 작업%입니다. 계산, 5%반영, 수기로 바꿉니다.",
            "좁은 화면은 위 필터로 세 칸을 하나씩 봅니다.",
            "캡처 복사는 지금 필터 그대로입니다. 센터 캡처는 1·2·3센터가 한 장입니다.",
        ],
        "shot": "summary.png",
        "caption": "요약. 건/시, 순위, 진척률, 예상 종료가 한 화면에 있습니다.",
    },
    {
        "title": "시간별 확인",
        "lead": "일이 몰린 시간과, 일이 끊긴 시간을 구간으로 봅니다.",
        "see": [
            "구간이 진할수록 그 시간에 처리가 많습니다. 비어 있으면 그 구간이 쉼입니다.",
            "색은 그 구간 안에서만 비교합니다. 다른 시간과 섞어 보지 않습니다.",
            "인쇄는 지금 고른 센터, DPT, 구간만 나갑니다.",
        ],
        "use": "피크에 사람이 있었는지, 중간에 흐름이 끊겼는지를 보고 다음 시간 배치를 바꿉니다.",
        "steps": [
            "센터, DPT, 구간(분)을 고릅니다. 처음 구간은 15분입니다.",
            "가로 막대는 그 구간의 완료입니다.",
            "오른쪽 인쇄로 지금 화면만 인쇄합니다.",
        ],
        "shot": "time.png",
        "caption": "시간별 확인. 진한 구간이 일이 몰린 시간입니다.",
    },
    {
        "title": "미작업 상품",
        "lead": "아직 손대지 않은 상품만 모아, 마감 전에 남은 일을 줄입니다.",
        "see": [
            "피킹수량이 0이거나 주문수량보다 적으면 미작업입니다. 2개 중 1개만 한 경우도 안 한 상품으로 나옵니다.",
            "작업건수, 완료건수, 미작업건수, 몇 %완료로 남은 양을 봅니다.",
        ],
        "use": "전체를 다시 뒤지지 않고, 남은 상품만 인쇄해 현장 리스트로 씁니다.",
        "steps": [
            "센터, 라인, DPT로 범위를 줄입니다.",
            "칸을 누르면 그 열로 정렬됩니다. 글자만이 아니라 칸 전체입니다.",
            "체크한 상품만 인쇄됩니다. 체크가 없으면 화면에 보이는 상품 전체가 인쇄됩니다.",
        ],
        "shot": "goods.png",
        "caption": "미작업 상품. 위 숫자로 남은 양을 보고, 표에서 골라 인쇄합니다.",
    },
    {
        "title": "작업 상품",
        "lead": "이 상품이 어느 라인에서, 몇 시 몇 분 몇 초에 끝났는지 추적합니다.",
        "see": [
            "시작과 종료, 작업시간으로 상품이 얼마나 걸렸는지 봅니다. 작업 시각이 없는 상품도 목록에 나옵니다.",
            "작업수량은 주문수량 합, 작업완료수량은 이미 피킹한 수량입니다. 상품을 누르면 라인별로 보입니다.",
            "라인을 누르면 점포별 건수와 시·분·초가 나옵니다.",
        ],
        "use": "늦어진 상품의 원인 라인을 찾고, 그 라인의 마지막 점포까지 확인합니다.",
        "steps": [
            "센터, DPT, 라인으로 줄이고 상품명 또는 바코드를 검색합니다.",
            "상품 글자는 드래그하면 복사됩니다. 글자를 고르지 않고 누르면 전 라인이 열립니다.",
            "라인 줄에는 작업수량, 총건수, 완료, 미완료, 시작, 종료, 작업시간이 있습니다.",
            "라인을 누르면 점포, 작업수량, 건수, 작업시각 창이 열립니다.",
        ],
        "shot": "worked.png",
        "caption": "작업 상품. 검색 후 상품을 누르면 라인별 시간이 열립니다.",
    },
    {
        "title": "점포 진척",
        "lead": "어느 점포가 끝났고, 어느 점포가 남았는지 봅니다.",
        "see": [
            "점포별 완료율로 진도가 낮은 점포를 위로 올립니다.",
            "점포를 누르면 남은 상품이 열립니다. 작업수량은 이미 피킹한 수량입니다.",
            "미작업수량은 아직 피킹하지 않은 주문수량입니다.",
        ],
        "use": "낮은 점포부터 처리하고, 점포 이름 일부만으로 그 점포를 바로 찾습니다.",
        "steps": [
            "센터, 라인, 점포, DPT로 줄입니다.",
            "검색에 수원처럼 일부만 쳐도 그 글자가 들어간 점포가 걸립니다. 지우면 전체로 돌아갑니다.",
            "점포를 누르면 상품코드, 상품명, 미작업건수, 총작업수량, 작업수량, 미작업수량이 나옵니다.",
            "칸을 누르면 정렬됩니다.",
        ],
        "shot": "store.png",
        "caption": "점포 진척. 점포를 누르면 그 점포의 남은 상품이 열립니다.",
    },
    {
        "title": "루트",
        "lead": "어느 루트가 안 끝났는지 보고, 그 루트만 챙깁니다.",
        "see": [
            "루트별 작업건수, 완료, 잔여, 완료율입니다.",
            "유제 냉장은 100번대, FF2는 200번대입니다.",
        ],
        "use": "잔여가 큰 루트부터 사람을 붙여 마감을 맞춥니다.",
        "steps": [
            "센터와 DPT를 고릅니다. DPT에는 10자리 묶음이 있습니다.",
            "칸을 누르면 정렬됩니다.",
            "파일에 RTECOD가 없으면 안내가 나옵니다.",
        ],
        "shot": "route.png",
        "caption": "루트. 잔여건수가 큰 루트가 아직 남은 일입니다.",
    },
    {
        "title": "로케이션",
        "lead": "한 라인에 일이 몰렸는지 보고, 점포 자리를 나눠 라인 부하를 맞춥니다.",
        "see": [
            "색은 그 라인 안에서만 비교합니다. 진한 칸이 그 라인에서 일이 많은 자리입니다.",
            "표시를 건수로 보면 작업 행 수, 작업수량으로 보면 주문수량 합입니다.",
            "칸 번호와 기둥은 제어판의 배치에서 센터마다 바꿉니다. 포천 2센터는 FF2, FF1 배치가 따로입니다.",
        ],
        "use": "몰린 점포를 다른 칸으로 끌어 라인별 일량을 고르게 만듭니다.",
        "steps": [
            "센터, DPT, 루트, 표시, 라인을 고릅니다.",
            "점포를 끌어 칸을 옮깁니다.",
            "점포 원위치는 처음 자리로, 선택 점포 빼기는 고른 점포를 뺍니다.",
            "엑셀로 지금 배치를 받습니다. 배치표 전에는 작업 엑셀의 점포만 보입니다.",
        ],
        "shot": "location.png",
        "caption": "로케이션. 진한 칸이 그 라인에서 일이 많은 자리입니다.",
    },
    {
        "title": "생산성 분석",
        "lead": "하루가 아니라 기간으로, 누구와 어느 센터가 계속 낮은지 봅니다.",
        "see": [
            "여러 날 파일로 일별, 주별, 월별 건/시가 나옵니다.",
            "사람 보기는 근태를 넣어야 누구의 숫자인지 나옵니다. 표는 시간, 건/시, 순위만입니다.",
            "여러 센터·라인이면 1센터1라인,2라인 / 2센터5라인,7라인으로 나옵니다.",
        ],
        "use": "하루 변동이 아니라, 반복해서 낮은 사람과 센터를 찾아 배치를 바꿉니다.",
        "steps": [
            "생산성 파일로 1019_FF1, 1019_FF2처럼 보관한 파일을 여러 개 고릅니다.",
            "기간은 일별·주별·월별, 보기는 센터·라인·사람입니다.",
            "사람 보기는 근태양식에 날짜와 소분류 이름을 적은 뒤 근태표로 올립니다.",
        ],
        "shot": "archive.png",
        "caption": "생산성 분석. 오른쪽의 생산성 파일, 근태표, 근태양식을 씁니다.",
    },
]


def crop_bottom(src, dest):
    image = Image.open(src).convert("RGB")
    width, height = image.size
    pixels = image.load()
    last = 0
    for y in range(height - 1, -1, -1):
        hit = False
        for x in range(0, width, 4):
            red, green, blue = pixels[x, y]
            if red < 236 or green < 236 or blue < 240:
                hit = True
                break
        if hit:
            last = y
            break
    bottom = min(height, last + 18)
    if bottom < height - 8:
        image = image.crop((0, 0, width, bottom))
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest)
    return dest


def build():
    if not Path(FONT).exists():
        from fontTools.ttLib import TTCollection
        TTCollection(SOURCE_FONT).fonts[0].save(FONT)
    cropped = ROOT / "scripts" / "manual-images" / "fit"
    shots = {}
    for page in PAGES:
        shots[page["shot"]] = crop_bottom(IMG / page["shot"], cropped / page["shot"])
    shots["chulgo.png"] = crop_bottom(IMG / "chulgo.png", cropped / "chulgo.png")

    pdf = FPDF(format="A4")
    pdf.set_auto_page_break(auto=False)
    pdf.set_left_margin(16)
    pdf.set_right_margin(16)
    pdf.add_font("zen", "", FONT)
    pdf.set_title("센터 생산성 사용 메뉴얼")
    global TOTAL
    TOTAL = len(PAGES) + 3
    cover(pdf)
    for index, page in enumerate(PAGES, start=1):
        section(pdf, index, page, shots[page["shot"]])
    chulgo(pdf, len(PAGES) + 1, shots["chulgo.png"])
    control(pdf, len(PAGES) + 2)
    company(pdf, len(PAGES) + 3)

    PDF.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(PDF)
    raw = PDF.read_bytes()
    payload = base64.b64encode(raw).decode()
    pieces = [payload[i : i + 120] for i in range(0, len(payload), 120)]
    body = ",\n".join(json.dumps(piece) for piece in pieces)
    (ROOT / "src" / "manual-file.ts").write_text(
        "const body = [\n" + body + "\n].join(\"\");\nexport const manualHref = \"data:application/pdf;base64,\" + body;\n",
        encoding="utf-8",
    )
    print(f"wrote {PDF} ({len(raw)} bytes, pages {pdf.pages_count})")


def paper(pdf):
    pdf.set_fill_color(246, 247, 249)
    pdf.rect(0, 0, 210, 297, "F")


def header(pdf, index, title):
    pdf.add_page()
    paper(pdf)
    pdf.set_fill_color(0, 122, 255)
    pdf.rect(0, 0, 210, 24, "F")
    pdf.set_xy(16, 6)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("zen", size=16)
    pdf.cell(140, 12, f"{index}.  {title}")
    pdf.set_font("zen", size=9)
    pdf.set_xy(150, 8)
    pdf.cell(44, 8, f"{index}  /  {TOTAL}", align="R")
    pdf.set_y(32)


def lead(pdf, text):
    pdf.set_x(16)
    pdf.set_text_color(28, 28, 30)
    pdf.set_font("zen", size=11)
    pdf.multi_cell(178, 6, text)
    pdf.ln(2)


def block(pdf, title, lines, foot):
    x, w = 16, 178
    y = pdf.get_y()
    pdf.set_font("zen", size=9.5)
    heights = []
    for line in lines:
        heights.append(max(5.2, 5.2 * (1 + int(pdf.get_string_width(line) > 164))))
    h = 8 + sum(heights) + (7 if foot else 3)
    pdf.set_fill_color(255, 255, 255)
    pdf.rect(x, y, w, h, "F")
    pdf.set_fill_color(0, 122, 255)
    pdf.rect(x, y, 1.6, h, "F")
    pdf.set_xy(x + 5, y + 2.2)
    pdf.set_text_color(0, 122, 255)
    pdf.set_font("zen", size=9)
    pdf.cell(w - 8, 5, title)
    yy = y + 8
    pdf.set_text_color(28, 28, 30)
    pdf.set_font("zen", size=9.5)
    for line, line_h in zip(lines, heights):
        pdf.set_xy(x + 5, yy)
        pdf.multi_cell(w - 10, 5.2, "·  " + line)
        yy += line_h
    if foot:
        pdf.set_xy(x + 5, yy)
        pdf.set_text_color(60, 60, 67)
        pdf.set_font("zen", size=9.5)
        pdf.multi_cell(w - 10, 5.2, foot)
    pdf.set_y(y + h + 3)


def steps(pdf, lines):
    pdf.set_x(16)
    pdf.set_text_color(142, 142, 147)
    pdf.set_font("zen", size=8.5)
    pdf.cell(0, 5, "보는 순서", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(0.6)
    for index, line in enumerate(lines, start=1):
        y = pdf.get_y()
        pdf.set_fill_color(0, 122, 255)
        pdf.ellipse(16, y + 0.3, 5, 5, "F")
        pdf.set_xy(16, y + 0.7)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("zen", size=8)
        pdf.cell(5, 4, str(index), align="C")
        pdf.set_xy(23, y)
        pdf.set_text_color(28, 28, 30)
        pdf.set_font("zen", size=10)
        pdf.multi_cell(171, 5.2, line)
        pdf.ln(1.2)


def shot(pdf, path, caption, max_h=108):
    y = pdf.get_y()
    room = 286 - y - 6
    if room < 28:
        return
    pdf.set_x(16)
    pdf.set_text_color(142, 142, 147)
    pdf.set_font("zen", size=8)
    pdf.cell(0, 4, caption, new_x="LMARGIN", new_y="NEXT")
    image = Image.open(path)
    width = 178
    height = width * image.height / image.width
    height = min(height, max_h, room)
    width = height * image.width / image.height
    x = 16 + (178 - width) / 2
    top = pdf.get_y() + 1
    pdf.set_fill_color(255, 255, 255)
    pdf.rect(x - 1, top - 1, width + 2, height + 2, "F")
    pdf.set_draw_color(220, 222, 226)
    pdf.rect(x - 1, top - 1, width + 2, height + 2)
    pdf.image(path, x=x, y=top, w=width, h=height)


def section(pdf, index, page, path):
    header(pdf, index, page["title"])
    lead(pdf, page["lead"])
    block(pdf, "이 화면에서 확인하는 것", page["see"], page["use"])
    steps(pdf, page["steps"])
    shot(pdf, path, page["caption"])


def cover(pdf):
    pdf.add_page()
    paper(pdf)
    pdf.set_fill_color(0, 122, 255)
    pdf.rect(0, 0, 210, 78, "F")
    pdf.set_xy(16, 22)
    pdf.set_text_color(210, 230, 255)
    pdf.set_font("zen", size=11)
    pdf.cell(0, 6, "센터 생산성", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(16)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("zen", size=28)
    pdf.cell(0, 14, "사용 메뉴얼", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_x(16)
    pdf.set_font("zen", size=11)
    pdf.multi_cell(170, 6, "어디가 느린지, 무엇이 남았는지, 언제 끝나는지를 숫자로 확인합니다.")

    cards = [
        ("속도", "건/시, 순위, 예상 종료"),
        ("남은 일", "미작업, 점포, 루트"),
        ("원인", "상품 시각, 출고 미오출"),
    ]
    y = 90
    for index, (name, desc) in enumerate(cards):
        x = 16 + index * 60
        pdf.set_fill_color(255, 255, 255)
        pdf.rect(x, y, 56, 24, "F")
        pdf.set_xy(x + 3, y + 3)
        pdf.set_text_color(0, 122, 255)
        pdf.set_font("zen", size=11)
        pdf.cell(50, 6, name)
        pdf.set_xy(x + 3, y + 11)
        pdf.set_text_color(60, 60, 67)
        pdf.set_font("zen", size=8)
        pdf.multi_cell(50, 4.2, desc)

    pdf.set_xy(16, 124)
    pdf.set_text_color(28, 28, 30)
    pdf.set_font("zen", size=12)
    pdf.cell(0, 8, "차례", new_x="LMARGIN", new_y="NEXT")
    names = [page["title"] for page in PAGES] + ["출고 분석", "제어판", "회사 PC"]
    for index, name in enumerate(names, start=1):
        row = pdf.get_y()
        pdf.set_fill_color(255, 255, 255)
        pdf.rect(16, row, 178, 8.2, "F")
        pdf.set_xy(20, row + 1.4)
        pdf.set_text_color(0, 122, 255)
        pdf.set_font("zen", size=10)
        pdf.cell(10, 5.4, str(index))
        pdf.set_text_color(28, 28, 30)
        pdf.cell(0, 5.4, name)
        pdf.set_y(row + 9)


def chulgo(pdf, index, app_shot):
    header(pdf, index, "출고 분석")
    lead(pdf, "확정월에 나가지 않은 것과 잘못 나간 것을 모아, 출고가 정확한지 봅니다.")
    block(
        pdf,
        "이 화면에서 확인하는 것",
        [
            "미출은 나가야 하는데 안 나간 것, 오출은 잘못 나간 것입니다.",
            "월 파일을 올리면 요약, 피벗, 추이, 출고정리에서 금액과 달의 흐름을 봅니다.",
        ],
        "미출·오출이 반복되는 달과 상품군을 찾아 다음 출고에서 줄입니다.",
    )
    steps(pdf, [
        "가맹지원시스템에서 물류, 재고, 입출고실적, 배송상품군별미오출실적조회를 엽니다.",
        "센터는 전 센터, 기간은 확정월. 미출로 받아 두고, 오출로 한 번 더 받습니다.",
        "업로드 만들기에 그 파일들을 올립니다. 저장 위치를 묻고, 취소하면 저장되지 않습니다.",
        "만든 파일을 월 파일 올리기로 올립니다. 그다음 요약, 피벗, 추이, 출고정리를 봅니다.",
    ])
    top = pdf.get_y() + 1
    menu = Image.open(IMG / "chulgo-menu.png")
    screen = Image.open(IMG / "chulgo-screen.png")
    gap = 3
    menu_w = 46
    menu_h = menu_w * menu.height / menu.width
    screen_w = 178 - menu_w - gap
    screen_h = screen_w * screen.height / screen.width
    row = max(menu_h, screen_h)
    room = 286 - top - 34
    if row > room and room > 40:
        scale = room / row
        menu_w *= scale
        menu_h *= scale
        screen_w *= scale
        screen_h *= scale
        row *= scale
    pdf.set_text_color(142, 142, 147)
    pdf.set_font("zen", size=7.5)
    pdf.set_xy(16, top)
    pdf.cell(menu_w, 4, "메뉴 위치")
    pdf.set_xy(16 + menu_w + gap, top)
    pdf.cell(screen_w, 4, "조회 화면")
    y = top + 4.5
    pdf.set_fill_color(255, 255, 255)
    pdf.rect(16, y, menu_w, menu_h, "F")
    pdf.rect(16 + menu_w + gap, y, screen_w, screen_h, "F")
    pdf.image(IMG / "chulgo-menu.png", x=16, y=y, w=menu_w, h=menu_h)
    pdf.image(IMG / "chulgo-screen.png", x=16 + menu_w + gap, y=y, w=screen_w, h=screen_h)
    pdf.set_y(y + row + 1.5)
    shot(pdf, app_shot, "프로그램 화면. 오른쪽 위가 월 파일 올리기와 업로드 만들기입니다.", max_h=36)


def control(pdf, index):
    header(pdf, index, "제어판")
    lead(pdf, "왼쪽 메뉴 맨 아래 톱니를 누르면 제어판이 열립니다. 왼쪽이 메뉴, 오른쪽이 그 내용입니다. 순서는 마스터 수정, 지역센터, 배치입니다.")
    block(
        pdf,
        "이 화면에서 하는 것",
        [
            "마스터 수정은 배송상품군 코드를 추가합니다. 코드, 이름, 편을 넣습니다.",
            "지역센터는 지역을 추가하거나 지우고, 센터와 라인 수를 바꿉니다.",
            "배치는 센터·라인마다 왼쪽·오른쪽 칸 수와 칸 이름을 바꿉니다.",
            "회사 EXE에서 고치면 공용 폴더에 남아 다른 컴퓨터에도 보입니다. 사이트에서 고친 내용은 그 브라우저에만 남습니다.",
        ],
        "새 코드, 새 센터, 다른 칸 배치가 필요할 때 프로그램을 다시 받지 않고 여기서 바꿉니다.",
    )
    steps(pdf, [
        "왼쪽에서 마스터 수정, 지역센터, 배치 중 하나를 고릅니다.",
        "마스터 수정은 코드 추가로 코드와 이름을 넣고 저장합니다.",
        "지역센터는 지역 이름을 추가한 뒤 센터 추가와 라인 +, - 로 줄 수를 맞춥니다.",
        "배치는 지역, 센터, 라인을 고르고 첫 칸과 끝 칸을 적습니다. 첫 칸 숫자는 아래, 끝 칸 숫자는 위입니다.",
        "칸을 고르고 칸 추가 또는 기둥 넣기를 누르면 그 칸 위에 생깁니다. 끌어서 옮기고, 기둥이 연속이면 한 덩어리로 보입니다.",
        "라인 추가·삭제, 원래 배치로 그 센터를 되돌립니다. 한 번에 80칸까지입니다.",
    ])


def company(pdf, index):
    header(pdf, index, "회사 PC")
    lead(pdf, "회사 PC는 브라우저가 아니라 생산성 EXE로 파일을 고릅니다. 한 번 설치하면 새 버전이 있을 때 프로그램이 알아서 받습니다.")
    block(
        pdf,
        "이 화면에서 확인하는 것",
        [
            "작업 파일로 오늘 엑셀과 배치표를 열면 사이트와 같은 생산성이 나옵니다.",
            "파일 합치기는 1·2·3센터 원본을 하나의 업로드용 엑셀로 만듭니다.",
            "제어판에서 고친 마스터, 지역센터, 배치는 공용 폴더에 남아 다른 컴퓨터의 EXE에도 같습니다.",
        ],
        "브라우저 파일 선택은 Privacy-i가 막으므로 EXE 버튼만 사용합니다.",
    )
    steps(pdf, [
        "사이트에서 생산성 EXE를 한 번 받아 압축을 풀고 생산성보기.exe를 실행합니다.",
        "다음에 열 때 새 버전이 있으면 알아서 바뀝니다. 다시 압축을 받지 않아도 됩니다.",
        "작업 파일로 오늘 작업 엑셀과 배치표를 고릅니다. 포천 2센터는 FF2, FF1 배치표를 따로 올립니다.",
        "메뉴 맨 아래 사용 메뉴얼로 이 PDF를 봅니다.",
    ])


if __name__ == "__main__":
    build()
