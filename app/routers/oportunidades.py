from fastapi import APIRouter, HTTPException, Query
from ..db import get_conn

router = APIRouter(prefix="/oportunidades", tags=["oportunidades"])


@router.get("")
def buscar(
    q: str = "",
    region: str = "",
    modalidad: str = "",
    monto_min: float = 0,
    monto_max: float = 0,
    solo_activas: bool = True,
    limit: int = Query(50, le=200),
    offset: int = 0,
):
    where = ["1=1"]
    params: list = []
    if q:
        where.append(
            "to_tsvector('spanish', nombre || ' ' || coalesce(descripcion,'')) "
            "@@ plainto_tsquery('spanish', %s)")
        params.append(q)
    if region:
        where.append("region = %s"); params.append(region)
    if modalidad:
        where.append("modalidad = %s"); params.append(modalidad)
    if monto_min:
        where.append("monto_estimado >= %s"); params.append(monto_min)
    if monto_max:
        where.append("monto_estimado <= %s"); params.append(monto_max)
    if solo_activas:
        where.append("fecha_cierre > now()")

    sql = f"""
        SELECT codigo, nombre, organismo_nombre, region, modalidad,
               monto_estimado, fecha_cierre, estado
        FROM licitaciones
        WHERE {' AND '.join(where)}
        ORDER BY fecha_cierre ASC NULLS LAST
        LIMIT %s OFFSET %s
    """
    params += [limit, offset]
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(sql, params)
        return {"resultados": cur.fetchall()}


@router.get("/{codigo}")
def ficha(codigo: str):
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM licitaciones WHERE codigo = %s", (codigo,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, "Licitación no encontrada")
    return row
