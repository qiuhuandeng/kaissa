from __future__ import annotations

import re
from pathlib import Path
from typing import Iterable, List, Tuple

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from PIL import Image, ImageDraw, ImageFont


ROOT = Path("/Users/qiu/我的坚果云/caesar-system")
SOURCE = ROOT / "docs/业财底座08-订单生成时的业财计算底表.md"
OUT = ROOT / "docs/业财底座08-订单生成时的业财计算底表-图解版.docx"
ASSET_DIR = ROOT / "outputs/order_calc_visual_assets"


FONT_CANDIDATES = [
    "/System/Library/Fonts/PingFang.ttc",
    "/System/Library/Fonts/STHeiti Light.ttc",
    "/Library/Fonts/Arial Unicode.ttf",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
]


INK = "263238"
MUTED = "607D8B"
BLUE = "2E74B5"
BLUE_DARK = "1F4D78"
BLUE_LIGHT = "EAF2F8"
GREEN = "2E7D32"
GREEN_LIGHT = "EAF6EC"
GOLD = "8A6D1D"
GOLD_LIGHT = "FFF7E0"
RED = "9B1C1C"
RED_LIGHT = "FDECEC"
GRAY_FILL = "F5F7FA"
GRID = "D9E2EC"


def font(size: int, bold: bool = False):
    for p in FONT_CANDIDATES:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size=size, index=1 if bold else 0)
            except Exception:
                try:
                    return ImageFont.truetype(p, size=size)
                except Exception:
                    pass
    return ImageFont.load_default()


def hex_to_rgb(value: str):
    value = value.strip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def wrap_text(draw: ImageDraw.ImageDraw, text: str, fnt, max_width: int) -> List[str]:
    lines: List[str] = []
    for paragraph in text.split("\n"):
        if not paragraph:
            lines.append("")
            continue
        line = ""
        for char in paragraph:
            candidate = line + char
            if draw.textbbox((0, 0), candidate, font=fnt)[2] <= max_width:
                line = candidate
            else:
                if line:
                    lines.append(line)
                line = char
        if line:
            lines.append(line)
    return lines


def rounded_box(
    draw: ImageDraw.ImageDraw,
    xy: Tuple[int, int, int, int],
    title: str,
    body: str = "",
    fill: str = "FFFFFF",
    outline: str = GRID,
    title_color: str = INK,
    body_color: str = INK,
    radius: int = 20,
):
    draw.rounded_rectangle(xy, radius=radius, fill=hex_to_rgb(fill), outline=hex_to_rgb(outline), width=2)
    x1, y1, x2, y2 = xy
    tf = font(30, True)
    bf = font(22)
    draw.text((x1 + 24, y1 + 20), title, font=tf, fill=hex_to_rgb(title_color))
    if body:
        y = y1 + 64
        for line in wrap_text(draw, body, bf, x2 - x1 - 48):
            draw.text((x1 + 24, y), line, font=bf, fill=hex_to_rgb(body_color))
            y += 34


def arrow(draw: ImageDraw.ImageDraw, start: Tuple[int, int], end: Tuple[int, int], color: str = BLUE):
    draw.line([start, end], fill=hex_to_rgb(color), width=5)
    ex, ey = end
    sx, sy = start
    if ex >= sx:
        pts = [(ex, ey), (ex - 18, ey - 10), (ex - 18, ey + 10)]
    else:
        pts = [(ex, ey), (ex + 18, ey - 10), (ex + 18, ey + 10)]
    draw.polygon(pts, fill=hex_to_rgb(color))


def make_canvas(name: str, title: str, h: int = 760) -> Tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (1600, h), "#FFFFFF")
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 1600, 76), fill=hex_to_rgb(GRAY_FILL))
    d.text((48, 18), title, font=font(34, True), fill=hex_to_rgb(BLUE_DARK))
    return img, d


def save_img(img: Image.Image, name: str) -> Path:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    path = ASSET_DIR / f"{name}.png"
    img.save(path, quality=95)
    return path


def diagram_boundary() -> Path:
    img, d = make_canvas("boundary", "订单生成时：只生成业财计算基准，不提前生成财务结果", 780)
    rounded_box(d, (90, 150, 520, 590), "订单业财计算底表", "交易责任\n客户成交与优惠\n收款计划\n预计成本\n渠道佣金\n内部结算\n预计经营结果\n后续触发条件", BLUE_LIGHT, BLUE)
    rounded_box(d, (610, 130, 1040, 335), "订单生成时可以形成", "已约定金额、预计金额、计划金额、规则和后续生效条件", GREEN_LIGHT, GREEN, GREEN)
    rounded_box(d, (610, 385, 1040, 620), "订单生成时不能确认", "实际到账、实际成本、正式应收应付、收入确认、付款核销、NC凭证", RED_LIGHT, RED, RED)
    rounded_box(d, (1130, 210, 1510, 540), "后续事实发生后", "收款、履约、账单、结算、审批、付款、退款、关账后调整分别确认", GOLD_LIGHT, GOLD, GOLD)
    arrow(d, (520, 330), (610, 235), GREEN)
    arrow(d, (520, 410), (610, 500), RED)
    arrow(d, (1040, 500), (1130, 380), GOLD)
    return save_img(img, "01_boundary")


def diagram_lifecycle() -> Path:
    img, d = make_canvas("lifecycle", "全系统位置：一个订单从上游依据到NC承接", 680)
    boxes = [
        ("上游依据", "产品/服务、团期、价格、渠道、采购、内部结算规则", 70),
        ("订单生成", "形成订单业财计算底表：责任、金额、预计和计划", 390),
        ("业务执行", "收款、认款、履约、退改、渠道和供应商对账", 710),
        ("财务确认", "应收、应付、收入、成本、付款、核销、发票", 1030),
        ("NC/关账", "只承接已确认会计结果；关账后走调整期间", 1350),
    ]
    for title, body, x in boxes:
        rounded_box(d, (x, 170, x + 245, 470), title, body, "FFFFFF", GRID, BLUE_DARK)
    for x in [315, 635, 955, 1275]:
        arrow(d, (x, 320), (x + 70, 320), BLUE)
    d.text((96, 560), "关键边界：生命周期要完整展示，但订单详情页只做总览、状态和关联入口；正式处理仍回到对应业务或财务模块。", font=font(25, True), fill=hex_to_rgb(INK))
    return save_img(img, "02_lifecycle")


def diagram_amounts() -> Path:
    img, d = make_canvas("amounts", "金额性质先分清：同一个数字在不同阶段代表不同事实", 760)
    items = [
        ("已约定金额", "合同、协议或已生效规则已经明确", GREEN_LIGHT, GREEN),
        ("预计金额", "按当前人数、数量、价格和规则测算", BLUE_LIGHT, BLUE),
        ("计划金额", "未来某个节点预计收或付", GOLD_LIGHT, GOLD),
        ("已发生金额", "到账、履约、账单、审批或银行结果支持", RED_LIGHT, RED),
        ("已确认金额", "已经影响债权债务、结算或会计结果", RED_LIGHT, RED),
        ("已核销金额", "有效收付款、预收或预付已抵减往来", RED_LIGHT, RED),
    ]
    xs = [80, 560, 1040, 80, 560, 1040]
    ys = [150, 150, 150, 430, 430, 430]
    for (title, body, fill, color), x, y in zip(items, xs, ys):
        rounded_box(d, (x, y, x + 400, y + 190), title, body, fill, color, color)
    d.text((80, 660), "订单生成时主要形成前三类；后三类必须由后续真实业务和财务记录产生。", font=font(26, True), fill=hex_to_rgb(INK))
    return save_img(img, "03_amounts")


def diagram_steps() -> Path:
    img, d = make_canvas("steps", "订单生成时的八步计算顺序", 920)
    steps = [
        "确定交易各方\n和财务责任",
        "算清客户成交\n金额和优惠",
        "算清收款路径\n和结回方式",
        "按资源和法人\n计算预计成本",
        "分开优惠、佣金、\n提成和部门贡献",
        "生成集团内部\n结算关系",
        "计算各法人和\n集团预计结果",
        "生成后续计划\n和生效条件",
    ]
    coords = [(70, 150), (430, 150), (790, 150), (1150, 150), (1150, 520), (790, 520), (430, 520), (70, 520)]
    for idx, (text, (x, y)) in enumerate(zip(steps, coords), start=1):
        rounded_box(d, (x, y, x + 300, y + 190), f"第{idx}步", text, "FFFFFF", BLUE, BLUE_DARK)
    for a, b in zip(coords[:3], coords[1:4]):
        arrow(d, (a[0] + 300, a[1] + 95), (b[0] - 12, b[1] + 95))
    arrow(d, (1450, 340), (1450, 515))
    for a, b in zip(coords[4:7], coords[5:8]):
        arrow(d, (a[0] - 12, a[1] + 95), (b[0] + 300, b[1] + 95))
    d.text((88, 805), "顺序不能倒置：先判断责任，再算金额；不能用钱进了谁的账户倒推收入和成本属于谁。", font=font(26, True), fill=hex_to_rgb(INK))
    return save_img(img, "04_steps")


def diagram_triggers() -> Path:
    img, d = make_canvas("triggers", "后续事项：订单只保存触发条件，正式结果等事实发生", 820)
    rows = [
        ("客户收款", "真实到账并完成认款"),
        ("收入确认", "出行、服务完成、项目验收或财务批准条件达到"),
        ("实际成本", "资源实际使用、出票、服务完成或损耗确认"),
        ("供应商应付", "实际成本或合同付款条件达到并确认"),
        ("内部结算", "双方确认同一结算记录和同一期间"),
        ("NC承接", "业务或财务事实正式确认后"),
    ]
    y = 145
    for i, (title, body) in enumerate(rows, start=1):
        rounded_box(d, (120, y, 520, y + 80), f"{i}. {title}", "", BLUE_LIGHT if i < 6 else GOLD_LIGHT, BLUE if i < 6 else GOLD, BLUE_DARK)
        d.text((585, y + 22), body, font=font(25), fill=hex_to_rgb(INK))
        arrow(d, (530, y + 40), (565, y + 40), BLUE if i < 6 else GOLD)
        y += 105
    d.text((120, 735), "订单阶段的NC内容应叫“后续会计事项提示”，不能叫“NC推送清单”。", font=font(26, True), fill=hex_to_rgb(RED))
    return save_img(img, "05_triggers")


def diagram_versions() -> Path:
    img, d = make_canvas("versions", "订单变更：不覆盖原记录，按事实追加本次增减", 760)
    rounded_box(d, (90, 160, 450, 320), "初始订单业财计算基准", "订单生成时形成的第一版责任、金额和计划", BLUE_LIGHT, BLUE, BLUE_DARK)
    rounded_box(d, (610, 110, 1010, 285), "未产生后续事实", "可生成新的订单计算版本；旧版本只读保留", GREEN_LIGHT, GREEN, GREEN)
    rounded_box(d, (610, 380, 1010, 590), "已产生收款、履约、结算或NC", "不能覆盖；通过售后、退款、成本调整、内部结算调整或补充结算记录本次增减", RED_LIGHT, RED, RED)
    rounded_box(d, (1160, 250, 1510, 470), "当前累计结果", "初始基准 + 后续已生效增加事项 - 后续已生效减少事项", GOLD_LIGHT, GOLD, GOLD)
    arrow(d, (450, 240), (610, 200), GREEN)
    arrow(d, (450, 260), (610, 485), RED)
    arrow(d, (1010, 200), (1160, 335), GOLD)
    arrow(d, (1010, 485), (1160, 390), GOLD)
    return save_img(img, "06_versions")


def diagram_order_page() -> Path:
    img, d = make_canvas("order_page", "订单详情页承接：记录底表，不替代下游模块", 860)
    rounded_box(d, (80, 140, 560, 720), "订单详情页 - 业财计算页签", "责任与交易各方\n客户成交与优惠\n收款安排\n预计成本\n佣金与分配\n内部结算\n预计经营结果\n版本与变化\n全周期状态", BLUE_LIGHT, BLUE, BLUE_DARK)
    downstream = [
        ("收款/认款/核销", 700, 150),
        ("履约/成本确认", 1050, 150),
        ("供应商应付/付款", 700, 365),
        ("内部结算/集团抵销", 1050, 365),
        ("发票/NC/关账调整", 875, 580),
    ]
    for title, x, y in downstream:
        rounded_box(d, (x, y, x + 330, y + 125), title, "正式确认和处理在对应模块完成", "FFFFFF", GRID, BLUE_DARK)
        arrow(d, (560, 430), (x - 10, y + 62), BLUE)
    d.text((82, 770), "页面边界：订单页展示摘要、状态、差异、版本和关联入口；财务确认动作回到财务模块。", font=font(26, True), fill=hex_to_rgb(INK))
    return save_img(img, "07_order_page")


def set_cell_text(cell, text: str, bold: bool = False, fill: str | None = None):
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    if fill:
        tc_pr = cell._tc.get_or_add_tcPr()
        shd = OxmlElement("w:shd")
        shd.set(qn("w:fill"), fill)
        tc_pr.append(shd)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(text)
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "PingFang SC")
    run.font.size = Pt(9 if len(text) > 45 else 10)
    run.bold = bold
    run.font.color.rgb = RGBColor.from_string(INK)


def set_table_width(table):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl = table._tbl
    tbl_pr = tbl.tblPr
    layout = OxmlElement("w:tblLayout")
    layout.set(qn("w:type"), "fixed")
    tbl_pr.append(layout)
    tbl_w = tbl_pr.first_child_found_in("w:tblW")
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.insert(0, tbl_w)
    tbl_w.set(qn("w:type"), "dxa")
    tbl_w.set(qn("w:w"), "9360")


def set_east_asia_font(run, name="PingFang SC"):
    run.font.name = "Calibri"
    if run._element.rPr is None:
        run._element.get_or_add_rPr()
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)


def add_para(doc: Document, text: str, style: str | None = None, bold: bool = False, color: str = INK):
    p = doc.add_paragraph(style=style)
    run = p.add_run(clean_inline(text))
    set_east_asia_font(run)
    run.font.size = Pt(10.5)
    run.bold = bold
    run.font.color.rgb = RGBColor.from_string(color)
    p.paragraph_format.space_after = Pt(5)
    p.paragraph_format.line_spacing = 1.18
    return p


def clean_inline(text: str) -> str:
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = text.replace("**", "")
    text = text.replace("`", "")
    return text.strip()


def parse_table(lines: List[str], start: int):
    rows = []
    i = start
    while i < len(lines) and lines[i].strip().startswith("|"):
        raw = lines[i].strip().strip("|")
        cells = [clean_inline(c.strip()) for c in raw.split("|")]
        rows.append(cells)
        i += 1
    if len(rows) > 1 and all(set(c.replace(" ", "")) <= {"-", ":"} for c in rows[1]):
        rows.pop(1)
    return rows, i


def add_markdown_table(doc: Document, rows: List[List[str]]):
    if not rows:
        return
    max_cols = max(len(r) for r in rows)
    table = doc.add_table(rows=len(rows), cols=max_cols)
    table.style = "Table Grid"
    set_table_width(table)
    for r_idx, row in enumerate(rows):
        for c_idx in range(max_cols):
            text = row[c_idx] if c_idx < len(row) else ""
            set_cell_text(table.cell(r_idx, c_idx), text, bold=(r_idx == 0), fill=("E8EEF5" if r_idx == 0 else None))
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def add_callout(doc: Document, label: str, text: str, fill: str = "F4F6F9", color: str = BLUE_DARK):
    table = doc.add_table(rows=1, cols=1)
    set_table_width(table)
    cell = table.cell(0, 0)
    set_cell_text(cell, "", fill=fill)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    r1 = p.add_run(label + "：")
    set_east_asia_font(r1)
    r1.bold = True
    r1.font.size = Pt(10.5)
    r1.font.color.rgb = RGBColor.from_string(color)
    r2 = p.add_run(clean_inline(text))
    set_east_asia_font(r2)
    r2.font.size = Pt(10.5)
    r2.font.color.rgb = RGBColor.from_string(INK)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)


def configure_doc(doc: Document):
    section = doc.sections[0]
    section.orientation = WD_ORIENT.PORTRAIT
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(0.85)
    section.bottom_margin = Inches(0.75)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)
    section.header_distance = Inches(0.45)
    section.footer_distance = Inches(0.45)
    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Calibri"
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "PingFang SC")
    normal.font.size = Pt(10.5)
    normal.paragraph_format.space_after = Pt(5)
    for name, size, color in [
        ("Heading 1", 16, BLUE),
        ("Heading 2", 13, BLUE),
        ("Heading 3", 12, BLUE_DARK),
    ]:
        st = styles[name]
        st.font.name = "Calibri"
        st._element.rPr.rFonts.set(qn("w:eastAsia"), "PingFang SC")
        st.font.size = Pt(size)
        st.font.color.rgb = RGBColor.from_string(color)
        st.font.bold = True
        st.paragraph_format.space_before = Pt(14 if name == "Heading 1" else 9)
        st.paragraph_format.space_after = Pt(5)
    hdr = section.header.paragraphs[0]
    hdr.text = "业财底座08：订单生成时的业财计算底表（图解版）"
    hdr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for r in hdr.runs:
        set_east_asia_font(r)
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor.from_string(MUTED)


def add_title_block(doc: Document):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run("业财底座08")
    set_east_asia_font(r)
    r.font.size = Pt(12)
    r.font.bold = True
    r.font.color.rgb = RGBColor.from_string(MUTED)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(5)
    r = p.add_run("订单生成时的业财计算底表（图解版）")
    set_east_asia_font(r)
    r.font.size = Pt(23)
    r.font.bold = True
    r.font.color.rgb = RGBColor.from_string(BLUE_DARK)
    p = doc.add_paragraph()
    r = p.add_run("按原文结构重排：用流程图、分流图、泳道关系和核对表表达订单生成时必须完成的底层业财计算。")
    set_east_asia_font(r)
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor.from_string(INK)
    add_callout(
        doc,
        "阅读口径",
        "本图解版不替换原文的业务判断，只把原文的十二章结构可视化；核心仍是订单生成时算清基准，后续事实发生后再确认。",
        fill="EAF2F8",
    )


DIAGRAMS = {
    "一、这份底表解决什么问题": diagram_boundary,
    "二、这张订单在全系统链路中的位置": diagram_lifecycle,
    "三、先把四类金额分开": diagram_amounts,
    "五、订单生成时的具体计算顺序": diagram_steps,
    "第八步：生成后续执行计划和生效条件": diagram_triggers,
    "九、订单变更和历史记录怎样处理": diagram_versions,
    "十、面向业务页面的展示建议": diagram_order_page,
}


def add_picture(doc: Document, path: Path, caption: str):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    run = p.add_run()
    run.add_picture(str(path), width=Inches(6.75))
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_after = Pt(7)
    r = cap.add_run(caption)
    set_east_asia_font(r)
    r.font.size = Pt(9)
    r.font.color.rgb = RGBColor.from_string(MUTED)


def build():
    doc = Document()
    configure_doc(doc)
    add_title_block(doc)

    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    i = 1
    in_code = False
    code_lines: List[str] = []
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith("```"):
            if not in_code:
                in_code = True
                code_lines = []
            else:
                in_code = False
                add_callout(doc, "计算关系", "\n".join(code_lines), fill="F7F9FC", color=BLUE_DARK)
            i += 1
            continue

        if in_code:
            code_lines.append(line)
            i += 1
            continue

        if not stripped:
            i += 1
            continue

        if stripped.startswith("|"):
            rows, i = parse_table(lines, i)
            add_markdown_table(doc, rows)
            continue

        if stripped.startswith("# "):
            i += 1
            continue

        if stripped.startswith("## "):
            heading = clean_inline(stripped[3:])
            doc.add_heading(heading, level=1)
            if heading in DIAGRAMS:
                add_picture(doc, DIAGRAMS[heading](), f"图：{heading}的业务表达")
            i += 1
            continue

        if stripped.startswith("### "):
            heading = clean_inline(stripped[4:])
            doc.add_heading(heading, level=2)
            if heading in DIAGRAMS:
                add_picture(doc, DIAGRAMS[heading](), f"图：{heading}的业务表达")
            i += 1
            continue

        if stripped.startswith("#### "):
            doc.add_heading(clean_inline(stripped[5:]), level=3)
            i += 1
            continue

        if stripped.startswith(">"):
            add_callout(doc, "核心口径", stripped.lstrip("> ").strip(), fill="FFF7E0", color=GOLD)
            i += 1
            continue

        if stripped.startswith("- "):
            p = doc.add_paragraph(style=None)
            p.style = doc.styles["Normal"]
            p.paragraph_format.left_indent = Inches(0.25)
            p.paragraph_format.first_line_indent = Inches(-0.12)
            p.paragraph_format.space_after = Pt(3)
            r = p.add_run("• " + clean_inline(stripped[2:]))
            set_east_asia_font(r)
            r.font.size = Pt(10.2)
            r.font.color.rgb = RGBColor.from_string(INK)
            i += 1
            continue

        numbered = re.match(r"^(\d+)\.\s+(.*)$", stripped)
        if numbered:
            p = doc.add_paragraph(style=None)
            p.paragraph_format.left_indent = Inches(0.25)
            p.paragraph_format.first_line_indent = Inches(-0.12)
            p.paragraph_format.space_after = Pt(3)
            r = p.add_run(f"{numbered.group(1)}. {clean_inline(numbered.group(2))}")
            set_east_asia_font(r)
            r.font.size = Pt(10.2)
            i += 1
            continue

        add_para(doc, stripped)
        i += 1

    doc.save(OUT)
    print(OUT)


if __name__ == "__main__":
    build()
