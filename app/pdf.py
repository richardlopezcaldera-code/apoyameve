"""Generación del PDF de una cotización con reportlab."""
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import (SimpleDocTemplate, Table, TableStyle, Paragraph,
                                Spacer)
from reportlab.lib.styles import getSampleStyleSheet


def cotizacion_pdf(cab: dict, items: list[dict]) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=20 * mm,
                            bottomMargin=20 * mm)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("COTIZACIÓN", styles["Title"]))
    meta = (f"Folio: {cab.get('folio') or cab['id']} &nbsp;&nbsp; "
            f"Licitación: {cab.get('codigo_lic') or '—'} &nbsp;&nbsp; "
            f"Moneda: {cab.get('moneda')}")
    story.append(Paragraph(meta, styles["Normal"]))
    story.append(Spacer(1, 8 * mm))

    data = [["#", "Descripción", "Cant.", "Unidad", "P. unit.", "Desc.%", "Total"]]
    for i, it in enumerate(items, 1):
        data.append([
            str(i), it["descripcion"], f"{it['cantidad']:g}",
            it.get("unidad") or "", f"{float(it['precio_unitario']):,.0f}",
            f"{float(it.get('descuento_pct') or 0):g}",
            f"{float(it['total_linea']):,.0f}",
        ])
    tbl = Table(data, colWidths=[10*mm, 70*mm, 15*mm, 20*mm, 25*mm, 15*mm, 25*mm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8590c")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 6 * mm))

    tot = [["Subtotal", f"{float(cab.get('subtotal') or 0):,.0f}"],
           ["IVA", f"{float(cab.get('iva') or 0):,.0f}"],
           ["TOTAL", f"{float(cab.get('total') or 0):,.0f}"]]
    tt = Table(tot, colWidths=[40*mm, 30*mm], hAlign="RIGHT")
    tt.setStyle(TableStyle([("FONTSIZE", (0, 0), (-1, -1), 9),
                            ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold")]))
    story.append(tt)

    if cab.get("observaciones"):
        story.append(Spacer(1, 8 * mm))
        story.append(Paragraph(f"<b>Observaciones:</b> {cab['observaciones']}",
                               styles["Normal"]))

    doc.build(story)
    return buf.getvalue()
