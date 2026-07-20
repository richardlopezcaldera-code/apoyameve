"""Cliente de la API pública de Mercado Público (ChileCompra).

Docs: https://api.mercadopublico.cl/modules/api.aspx
Límite: 10.000 solicitudes/día por ticket.
Fecha en formato ddmmaaaa.
"""
import datetime as dt
import httpx
from .config import settings

BASE = "https://api.mercadopublico.cl/servicios/v1/publico"


def _get(path: str, **params) -> dict:
    params["ticket"] = settings.MP_TICKET
    url = f"{BASE}/{path}"
    with httpx.Client(timeout=60) as client:
        r = client.get(url, params=params)
        r.raise_for_status()
        return r.json()


def fecha_hoy_ddmmaaaa() -> str:
    return dt.date.today().strftime("%d%m%Y")


def licitaciones_activas() -> list[dict]:
    """Listado liviano de licitaciones abiertas (código + nombre + estado)."""
    data = _get("licitaciones.json", estado="activas")
    return data.get("Listado", [])


def licitaciones_por_fecha(ddmmaaaa: str | None = None) -> list[dict]:
    data = _get("licitaciones.json", fecha=ddmmaaaa or fecha_hoy_ddmmaaaa())
    return data.get("Listado", [])


def detalle_licitacion(codigo: str) -> dict | None:
    """Detalle completo de UNA licitación (ítems, fechas, criterios, montos)."""
    data = _get("licitaciones.json", codigo=codigo)
    listado = data.get("Listado", [])
    return listado[0] if listado else None


def ordenes_de_compra(ddmmaaaa: str | None = None) -> list[dict]:
    data = _get("ordenesdecompra.json", fecha=ddmmaaaa or fecha_hoy_ddmmaaaa())
    return data.get("Listado", [])


def buscar_proveedor(rut: str) -> dict:
    return _get("Empresas/BuscarProveedor", rutempresaproveedor=rut)
