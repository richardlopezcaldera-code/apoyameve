"""Sistema de CAPTACIÓN de oportunidades.

Escanea las licitaciones activas de Mercado Público y captura las que calzan con
el rubro del proveedor, según un perfil derivado de su catálogo. A cada
licitación le asigna un score de afinidad (0-100).

Perfil: app/perfil_captacion.json (palabras clave, familias UNSPSC, regiones).
Se puede regenerar desde el catálogo del proveedor.
"""
import json
import re
import unicodedata
from pathlib import Path
from . import mercadopublico as mp

_PERFIL = json.loads((Path(__file__).parent / "perfil_captacion.json")
                     .read_text(encoding="utf-8"))

# Umbral recomendado: por debajo no se captura. Ajustable.
UMBRAL_CAPTURA = 35


def _norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9 ]", " ", s.lower())


def _palabras(s: str) -> set[str]:
    return {t for t in _norm(s).split() if len(t) > 3}


_KW = set(_PERFIL.get("palabras_clave", []))
_UNSPSC = tuple(_PERFIL.get("unspsc_familias", []))
_REGIONES = {r.lower() for r in _PERFIL.get("regiones", [])}


def score_licitacion(det: dict) -> dict:
    """Puntúa una licitación (dict de detalle de la API) contra el perfil.
    Devuelve {score, motivos, matched_kw, region}."""
    nombre = det.get("Nombre", "")
    desc = det.get("Descripcion", "")
    texto = _palabras(nombre + " " + desc)
    matched = texto & _KW

    score = 0
    motivos = []

    # 1) Palabras clave en nombre/descripción (hasta 45 pts)
    if matched:
        pts = min(45, 12 + 8 * len(matched))
        score += pts
        motivos.append(f"palabras clave: {', '.join(sorted(matched)[:5])}")

    # 2) UNSPSC de los ítems (hasta 45 pts) — muy fuerte
    items = (det.get("Items") or {}).get("Listado", [])
    unspsc_hit = False
    for it in items:
        cod = str(it.get("CodigoProducto") or "")
        if cod.startswith(_UNSPSC):
            unspsc_hit = True
            break
    if unspsc_hit:
        score += 45
        motivos.append("UNSPSC de mobiliario en los ítems")

    # 3) Región (si el perfil filtra regiones)
    region = (det.get("Comprador", {}) or {}).get("RegionUnidad", "").strip()
    if _REGIONES and region and region.lower() not in _REGIONES:
        score = int(score * 0.5)
        motivos.append(f"fuera de región objetivo ({region})")

    # 4) Bonus si el nombre es claramente de mobiliario
    if {"mobiliario", "muebles", "mueble"} & texto:
        score = min(100, score + 10)

    return {"score": min(100, score), "motivos": motivos,
            "matched_kw": sorted(matched), "region": region,
            "unspsc": unspsc_hit}


def escanear(umbral: int = UMBRAL_CAPTURA, max_detalles: int = 400) -> list[dict]:
    """Escanea licitaciones activas y devuelve las capturadas (score >= umbral),
    ordenadas por score desc. Pide el detalle solo de candidatas por nombre para
    cuidar la cuota de la API.
    """
    activas = mp.licitaciones_activas()
    capturadas = []
    revisadas = 0
    for row in activas:
        nombre = row.get("Nombre", "")
        # Pre-filtro barato por nombre para no pedir el detalle de todo
        if not (_palabras(nombre) & _KW):
            continue
        if revisadas >= max_detalles:
            break
        det = mp.detalle_licitacion(row.get("CodigoExterno"))
        revisadas += 1
        if not det:
            continue
        s = score_licitacion(det)
        if s["score"] >= umbral:
            comprador = det.get("Comprador", {}) or {}
            fechas = det.get("Fechas", {}) or {}
            capturadas.append({
                "codigo": det.get("CodigoExterno"),
                "nombre": det.get("Nombre"),
                "organismo": comprador.get("NombreOrganismo"),
                "region": s["region"],
                "monto_estimado": det.get("MontoEstimado"),
                "fecha_cierre": fechas.get("FechaCierre"),
                "cantidad_reclamos": det.get("CantidadReclamos"),
                "score": s["score"],
                "motivos": s["motivos"],
                # Detalle crudo de la API: lo usan los consumidores para
                # persistir la licitación en `licitaciones` (la FK de `capturas`
                # lo exige). No se envía a notificaciones ni a la respuesta HTTP.
                "detalle": det,
            })
    capturadas.sort(key=lambda x: -x["score"])
    return capturadas
