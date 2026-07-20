"""Job de ingesta diaria: descarga licitaciones activas desde Mercado Público
y las guarda/actualiza en la base de datos local.

Uso:
    python -m app.ingesta

Cuida la cuota (10.000 req/día): solo pide el detalle de licitaciones que aún
no están en la BD.
"""
import json
from psycopg.types.json import Jsonb
from . import mercadopublico as mp
from .db import get_conn


def _parse_fecha(valor):
    """La API entrega fechas como 'YYYY-MM-DDTHH:MM:SS' o None."""
    if not valor:
        return None
    return valor  # Postgres castea el ISO8601 directamente


def _existe(cur, codigo: str) -> bool:
    cur.execute("SELECT 1 FROM licitaciones WHERE codigo = %s", (codigo,))
    return cur.fetchone() is not None


def _guardar(cur, d: dict) -> None:
    comprador = d.get("Comprador") or {}
    fechas = d.get("Fechas") or {}
    cur.execute(
        """
        INSERT INTO licitaciones
          (codigo, nombre, descripcion, estado, codigo_organismo, organismo_nombre,
           region, modalidad, monto_estimado, moneda, cantidad_reclamos,
           fecha_publicacion, fecha_cierre, fecha_adjudicacion,
           criterios_json, items_json, raw_json)
        VALUES
          (%(codigo)s, %(nombre)s, %(descripcion)s, %(estado)s, %(codorg)s, %(org)s,
           %(region)s, %(modalidad)s, %(monto)s, %(moneda)s, %(reclamos)s,
           %(fpub)s, %(fcierre)s, %(fadj)s, %(criterios)s, %(items)s, %(raw)s)
        ON CONFLICT (codigo) DO UPDATE SET
           estado = EXCLUDED.estado,
           fecha_cierre = EXCLUDED.fecha_cierre,
           fecha_adjudicacion = EXCLUDED.fecha_adjudicacion,
           cantidad_reclamos = EXCLUDED.cantidad_reclamos,
           actualizado_at = now()
        """,
        {
            "codigo": d.get("CodigoExterno"),
            "nombre": d.get("Nombre"),
            "descripcion": d.get("Descripcion"),
            "estado": d.get("Estado") or d.get("CodigoEstado"),
            "codorg": comprador.get("CodigoOrganismo"),
            "org": comprador.get("NombreOrganismo"),
            "region": (comprador.get("RegionUnidad") or "").strip() or None,
            "modalidad": d.get("Tipo"),                      # LE, LP, L1, etc.
            "monto": d.get("MontoEstimado") or None,          # puede venir null
            "moneda": d.get("Moneda"),
            "reclamos": d.get("CantidadReclamos"),
            "fpub": _parse_fecha(fechas.get("FechaPublicacion")),
            "fcierre": _parse_fecha(fechas.get("FechaCierre")),
            "fadj": _parse_fecha(fechas.get("FechaAdjudicacion")
                                 or fechas.get("FechaEstimadaAdjudicacion")),
            # Adjudicacion queda null hasta que se adjudica; los criterios de
            # evaluación viven en las bases (PDF) y los procesa la IA aparte.
            "criterios": Jsonb(d.get("Adjudicacion") or {}),
            "items": Jsonb(d.get("Items") or {}),
            "raw": Jsonb(d),
        },
    )


def guardar_licitacion(cur, detalle: dict) -> None:
    """Upsert público de una licitación a partir de su detalle de la API.

    Reutilizable desde la captación para garantizar que la licitación exista en
    la tabla `licitaciones` antes de insertar su captura (la FK lo exige).
    """
    _guardar(cur, detalle)


def run() -> int:
    nuevas = 0
    activas = mp.licitaciones_activas()
    print(f"Licitaciones activas listadas: {len(activas)}")
    with get_conn() as conn:
        cur = conn.cursor()
        for row in activas:
            codigo = row.get("CodigoExterno")
            if not codigo or _existe(cur, codigo):
                continue
            detalle = mp.detalle_licitacion(codigo)
            if detalle:
                _guardar(cur, detalle)
                nuevas += 1
                if nuevas % 50 == 0:
                    conn.commit()
                    print(f"  ...{nuevas} nuevas guardadas")
        conn.commit()
    print(f"Ingesta terminada. {nuevas} licitaciones nuevas.")
    return nuevas


if __name__ == "__main__":
    run()
