"""Módulo de COTIZACIONES (base para la siguiente fase).

Una cotización es la oferta que el proveedor arma para una licitación.
Sus ítems pueden mapearse con los ítems de la licitación (item_lic_ref) para
comparar y calcular márgenes. Aquí queda el CRUD mínimo funcional; la lógica
avanzada (mapeo automático con IA, exportar a PDF, enviar a Mercado Público)
se construye enlazando este módulo.
"""
import json
from fastapi import APIRouter, HTTPException, Body, Query
from fastapi.responses import Response
from pydantic import BaseModel
from ..db import get_conn
from ..config import settings
from .. import catalogo
from ..ia import claude
from ..pdf import cotizacion_pdf

router = APIRouter(prefix="/cotizaciones", tags=["cotizaciones"])


def precio_sugerido(costo: float, margen_pct: float | None = None) -> float:
    """Precio para alcanzar un margen objetivo sobre el costo."""
    m = (margen_pct if margen_pct is not None else settings.MARGEN_OBJETIVO_PCT)
    if not costo:
        return 0.0
    return round(costo / (1 - m / 100))


class ItemIn(BaseModel):
    descripcion: str
    cantidad: float = 1
    unidad: str | None = None
    costo_unitario: float = 0
    precio_unitario: float = 0
    descuento_pct: float = 0
    producto_id: int | None = None
    item_lic_ref: str | None = None


class CotizacionIn(BaseModel):
    user_id: str
    codigo_lic: str | None = None
    folio: str | None = None
    moneda: str = "CLP"
    validez_dias: int | None = None
    observaciones: str | None = None
    items: list[ItemIn] = []


def _recalcular(cur, cotizacion_id: int, iva_pct: float = 19.0):
    cur.execute("SELECT COALESCE(SUM(total_linea),0) AS s, "
                "COALESCE(SUM(cantidad*costo_unitario),0) AS c "
                "FROM cotizacion_items WHERE cotizacion_id = %s", (cotizacion_id,))
    row = cur.fetchone()
    subtotal = float(row["s"] or 0)
    costo = float(row["c"] or 0)
    iva = round(subtotal * iva_pct / 100)
    total = subtotal + iva
    margen = round((subtotal - costo) / subtotal * 100, 2) if subtotal else None
    cur.execute("UPDATE cotizaciones SET subtotal=%s, iva=%s, total=%s, "
                "margen_pct=%s, actualizado_at=now() WHERE id=%s",
                (subtotal, iva, total, margen, cotizacion_id))


@router.post("")
def crear(cot: CotizacionIn):
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO cotizaciones (user_id, codigo_lic, folio, moneda, "
            "validez_dias, observaciones) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
            (cot.user_id, cot.codigo_lic, cot.folio, cot.moneda,
             cot.validez_dias, cot.observaciones))
        cid = cur.fetchone()["id"]
        for it in cot.items:
            cur.execute(
                "INSERT INTO cotizacion_items (cotizacion_id, producto_id, "
                "item_lic_ref, descripcion, cantidad, unidad, costo_unitario, "
                "precio_unitario, descuento_pct) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (cid, it.producto_id, it.item_lic_ref, it.descripcion, it.cantidad,
                 it.unidad, it.costo_unitario, it.precio_unitario, it.descuento_pct))
        _recalcular(cur, cid)
        conn.commit()
    return obtener(cid)


@router.get("/{cotizacion_id}")
def obtener(cotizacion_id: int):
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM cotizaciones WHERE id = %s", (cotizacion_id,))
        cab = cur.fetchone()
        if not cab:
            raise HTTPException(404, "Cotización no encontrada")
        cur.execute("SELECT * FROM cotizacion_items WHERE cotizacion_id = %s "
                    "ORDER BY id", (cotizacion_id,))
        cab["items"] = cur.fetchall()
    return cab


@router.get("")
def listar(user_id: str, codigo_lic: str | None = None):
    sql = "SELECT * FROM cotizaciones WHERE user_id = %s"
    params: list = [user_id]
    if codigo_lic:
        sql += " AND codigo_lic = %s"; params.append(codigo_lic)
    sql += " ORDER BY creado_at DESC"
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(sql, params)
        return {"cotizaciones": cur.fetchall()}


@router.post("/mapear/{codigo_lic}")
def mapear(codigo_lic: str, margen_pct: float | None = None):
    """Propone una cotización: por cada ítem de la licitación, busca en tu
    catálogo (en vivo), deja que la IA elija el mejor match y calcula un precio
    sugerido según el margen objetivo. NO guarda: devuelve el borrador para que
    el usuario lo edite y luego lo cree con POST /cotizaciones.
    """
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT items_json FROM licitaciones WHERE codigo = %s",
                    (codigo_lic,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, "Licitación no encontrada")
    items_lic = (row["items_json"] or {}).get("Listado", [])

    propuesta = []
    for it in items_lic:
        texto = it.get("Descripcion") or it.get("NombreProducto") or ""
        try:
            candidatos = catalogo.buscar(texto, limit=8)
        except catalogo.CatalogoNoConfigurado as e:
            raise HTTPException(400, str(e))
        match = claude.mapear_items(
            {"descripcion": texto, "unidad": it.get("UnidadMedida"),
             "codigo_unspsc": str(it.get("CodigoProducto") or ""),
             "cantidad": it.get("Cantidad")},
            candidatos)
        prod = next((c for c in candidatos
                     if str(c["id"]) == str(match.get("producto_id"))), None)
        propuesta.append({
            "item_lic_ref": str(it.get("Correlativo")),
            "descripcion": texto,
            "cantidad": it.get("Cantidad") or 1,
            "unidad": it.get("UnidadMedida"),
            "producto_id": prod["id"] if prod else None,
            "producto_nombre": prod["nombre"] if prod else None,
            "costo_unitario": float(prod["costo"]) if prod else 0,
            "precio_unitario": precio_sugerido(float(prod["costo"]), margen_pct)
                               if prod else 0,
            "confianza": match.get("confianza"),
            "motivo": match.get("motivo"),
        })
    return {"codigo_lic": codigo_lic, "items_propuestos": propuesta}


@router.get("/{cotizacion_id}/pdf")
def descargar_pdf(cotizacion_id: int):
    cot = obtener(cotizacion_id)
    pdf = cotizacion_pdf(cot, cot["items"])
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition":
                             f'attachment; filename="cotizacion_{cotizacion_id}.pdf"'})
