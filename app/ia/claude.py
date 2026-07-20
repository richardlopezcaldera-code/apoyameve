"""Capa de IA con Claude (Anthropic)."""
from pathlib import Path
from functools import lru_cache
from anthropic import Anthropic
from ..config import settings

_SYSTEM = (Path(__file__).parent / "system_prompt.txt").read_text(encoding="utf-8")


@lru_cache
def _get_client() -> Anthropic:
    """Cliente Claude perezoso: se crea al primer uso, no al importar."""
    return Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def _mensaje(messages: list[dict], max_tokens: int = 1200) -> str:
    resp = _get_client().messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=max_tokens,
        system=_SYSTEM,
        messages=messages,
    )
    return resp.content[0].text


def resumir(contexto: str) -> str:
    """Genera resumen ejecutivo + fechas clave + criterios de evaluación."""
    return _mensaje([{
        "role": "user",
        "content": f"{contexto}\n\nEntrégame el RESUMEN EJECUTIVO, las FECHAS "
                   f"CLAVE y los CRITERIOS DE EVALUACIÓN de esta licitación.",
    }])


def chatear(contexto: str, pregunta: str, historial: list[dict] | None = None) -> str:
    """Responde una pregunta del usuario sobre las bases."""
    messages = [{"role": "user", "content": f"Bases de la licitación:\n{contexto}"}]
    if historial:
        messages += historial
    messages.append({"role": "user", "content": pregunta})
    return _mensaje(messages, max_tokens=1000)


def mapear_items(item_lic: dict, candidatos: list[dict]) -> dict:
    """Dado un ítem de la licitación y productos candidatos del catálogo,
    Claude elige el mejor match. Devuelve dict:
    {producto_id, confianza (0-1), motivo}. Si ninguno calza: producto_id=null.
    """
    import json
    prompt = (
        "Eres un asistente que empareja un ítem solicitado en una licitación "
        "con el producto MÁS adecuado de un catálogo. Responde SOLO con un JSON "
        "válido, sin texto adicional, con las claves: producto_id (o null si "
        "ninguno calza bien), confianza (0 a 1) y motivo (breve).\n\n"
        f"ÍTEM DE LA LICITACIÓN:\n{json.dumps(item_lic, ensure_ascii=False)}\n\n"
        f"PRODUCTOS CANDIDATOS:\n{json.dumps(candidatos, ensure_ascii=False)}\n\n"
        "Prioriza coincidencia por código UNSPSC si existe; luego por "
        "descripción y unidad de medida. Devuelve el JSON."
    )
    txt = _mensaje([{"role": "user", "content": prompt}], max_tokens=400)
    try:
        ini, fin = txt.find("{"), txt.rfind("}")
        return json.loads(txt[ini:fin + 1])
    except Exception:
        return {"producto_id": None, "confianza": 0, "motivo": "sin match claro"}
