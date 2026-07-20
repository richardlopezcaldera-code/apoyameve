"""Endpoints del sistema de captación."""
from fastapi import APIRouter, Query
from ..db import get_conn
from .. import captacion, ingesta

router = APIRouter(prefix="/captacion", tags=["captacion"])


@router.get("/oportunidades")
def listar(min_score: int = 0, estado: str = "", limit: int = Query(100, le=500)):
    """Oportunidades ya capturadas, guardadas en la BD."""
    where = ["c.score >= %s"]
    params: list = [min_score]
    if estado:
        where.append("c.estado_captacion = %s"); params.append(estado)
    sql = f"""
        SELECT c.codigo, c.score, c.motivos, c.estado_captacion, c.notificada,
               c.capturada_at, l.nombre, l.organismo_nombre, l.region,
               l.monto_estimado, l.fecha_cierre, l.cantidad_reclamos
        FROM capturas c JOIN licitaciones l ON l.codigo = c.codigo
        WHERE {' AND '.join(where)}
        ORDER BY c.score DESC, l.fecha_cierre ASC
        LIMIT %s
    """
    params.append(limit)
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(sql, params)
        return {"oportunidades": cur.fetchall()}


@router.post("/escanear")
def escanear(umbral: int = captacion.UMBRAL_CAPTURA):
    """Escanea Mercado Público en vivo, puntúa y guarda las capturas.
    Pensado para ejecutarse por cron (ver app/captacion_scan.py)."""
    capturadas = captacion.escanear(umbral=umbral)
    guardadas = 0
    with get_conn() as conn:
        cur = conn.cursor()
        for c in capturadas:
            # Asegura que la licitación exista en `licitaciones` (FK de capturas).
            ingesta.guardar_licitacion(cur, c["detalle"])
            cur.execute("""
                INSERT INTO capturas (codigo, score, motivos)
                VALUES (%s, %s, %s)
                ON CONFLICT (codigo) DO UPDATE SET score = EXCLUDED.score,
                    motivos = EXCLUDED.motivos
            """, (c["codigo"], c["score"], c["motivos"]))
            guardadas += 1
        conn.commit()
    # El detalle crudo se omite en la respuesta (payload liviano para el panel).
    top = [{k: v for k, v in c.items() if k != "detalle"} for c in capturadas[:20]]
    return {"capturadas": guardadas, "top": top}
