"""Entrega de las oportunidades capturadas por los distintos canales."""
import urllib.parse
import httpx
from .config import settings


def link_whatsapp(oportunidades: list[dict]) -> str | None:
    """Genera un link wa.me con el resumen prellenado (envío con 1 clic).
    El envío 100% automático requiere un proveedor (Twilio / WhatsApp Cloud API).
    """
    if not settings.WHATSAPP_DESTINO or not oportunidades:
        return None
    lineas = ["Nuevas licitaciones captadas:"]
    for o in oportunidades[:10]:
        lineas.append(f"• [{o['score']}] {o['nombre']} ({o['codigo']}) "
                      f"cierra {o.get('fecha_cierre','')}")
    texto = urllib.parse.quote("\n".join(lineas))
    return f"https://wa.me/{settings.WHATSAPP_DESTINO}?text={texto}"


def enviar_webhook(oportunidades: list[dict]) -> bool:
    """POST a tu Google Apps Script (guarda en Sheet + envía correo).
    Ver apps_script_captacion.gs para el backend a pegar en Google."""
    if not settings.CAPTACION_WEBHOOK_URL or not oportunidades:
        return False
    payload = {"tipo": "captacion", "oportunidades": oportunidades}
    with httpx.Client(timeout=30, follow_redirects=True) as client:
        r = client.post(settings.CAPTACION_WEBHOOK_URL, json=payload)
        r.raise_for_status()
    return True
