import json
from fastapi import APIRouter, HTTPException, Body
from ..db import get_conn
from ..ia import claude

router = APIRouter(prefix="/ia", tags=["ia"])


def _contexto(codigo: str) -> str:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT nombre, descripcion, organismo_nombre, region, modalidad, "
            "monto_estimado, fecha_cierre, criterios_json, items_json "
            "FROM licitaciones WHERE codigo = %s", (codigo,))
        r = cur.fetchone()
    if not r:
        raise HTTPException(404, "Licitación no encontrada")
    return (
        f"LICITACIÓN {codigo}\n"
        f"Nombre: {r['nombre']}\n"
        f"Organismo: {r['organismo_nombre']}  |  Región: {r['region']}\n"
        f"Modalidad: {r['modalidad']}\n"
        f"Monto estimado: {r['monto_estimado']}\n"
        f"Cierre: {r['fecha_cierre']}\n"
        f"Ítems solicitados: {json.dumps(r['items_json'], ensure_ascii=False)}\n"
        f"Criterios/adjudicación: {json.dumps(r['criterios_json'], ensure_ascii=False)}\n"
        f"Descripción/bases: {r['descripcion']}"
    )


@router.post("/resumen/{codigo}")
def resumen(codigo: str, refrescar: bool = False):
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT resumen_ia FROM licitaciones WHERE codigo = %s", (codigo,))
        row = cur.fetchone()
        if row and row["resumen_ia"] and not refrescar:
            return {"resumen": row["resumen_ia"], "cacheado": True}
    texto = claude.resumir(_contexto(codigo))
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("UPDATE licitaciones SET resumen_ia = %s WHERE codigo = %s",
                    (texto, codigo))
        conn.commit()
    return {"resumen": texto, "cacheado": False}


@router.post("/chat/{codigo}")
def chat(codigo: str,
         pregunta: str = Body(..., embed=True),
         historial: list = Body(default=[])):
    respuesta = claude.chatear(_contexto(codigo), pregunta, historial)
    return {"respuesta": respuesta}
