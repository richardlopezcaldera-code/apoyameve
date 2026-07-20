"""Conector al catálogo del proveedor (TU sistema), consultado EN VIVO por API.

Tu sistema debe exponer un endpoint HTTP que reciba `q` (texto) y `limit` y
devuelva JSON con esta forma:

    {
      "productos": [
        {
          "id": "SKU-123",
          "sku": "SKU-123",
          "nombre": "Tacha reflectante roja",
          "descripcion": "Tacha vial bidireccional roja",
          "unidad": "Unidad",
          "costo": 1200,
          "precio": 1800,
          "categoria": "Señalética",
          "codigo_unspsc": "46161504"
        }
      ]
    }

Si tu API tiene otra forma, adapta `_normalizar()` (único punto a tocar).
El `codigo_unspsc` es opcional pero MUY recomendable: permite emparejar por
código con el `CodigoProducto` de los ítems de la licitación.
"""
from typing import Any
import httpx
from .config import settings


class CatalogoNoConfigurado(RuntimeError):
    pass


def _headers() -> dict:
    h = {"Accept": "application/json"}
    if settings.CATALOGO_API_KEY:
        h["Authorization"] = f"Bearer {settings.CATALOGO_API_KEY}"
    return h


def _normalizar(p: dict) -> dict:
    """Mapea la respuesta de TU API a la forma interna estándar.
    Ajusta las claves de la izquierda si tu API usa otros nombres."""
    return {
        "id": p.get("id") or p.get("sku"),
        "sku": p.get("sku"),
        "nombre": p.get("nombre") or p.get("name"),
        "descripcion": p.get("descripcion") or p.get("description"),
        "unidad": p.get("unidad") or p.get("unit"),
        "costo": p.get("costo") or p.get("cost") or 0,
        "precio": p.get("precio") or p.get("price") or 0,
        "categoria": p.get("categoria") or p.get("category"),
        "codigo_unspsc": str(p.get("codigo_unspsc") or p.get("unspsc") or ""),
    }


def buscar(q: str, limit: int = 10) -> list[dict]:
    """Consulta EN VIVO el catálogo de tu sistema."""
    if not settings.CATALOGO_API_URL:
        raise CatalogoNoConfigurado(
            "Falta CATALOGO_API_URL en .env (endpoint de tu sistema).")
    with httpx.Client(timeout=20) as client:
        r = client.get(settings.CATALOGO_API_URL,
                        params={"q": q, "limit": limit}, headers=_headers())
        r.raise_for_status()
        data: Any = r.json()
    productos = data.get("productos", data) if isinstance(data, dict) else data
    return [_normalizar(p) for p in productos][:limit]
