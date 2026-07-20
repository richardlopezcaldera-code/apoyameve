"""Escaneo de captación para ejecutar por CRON (1-2 veces al día).

    python -m app.captacion_scan

Hace: escanea activas -> puntúa -> guarda capturas nuevas en la BD ->
notifica por Google Sheet/correo (webhook) y arma el link de WhatsApp.
"""
from . import captacion, notificaciones, ingesta
from .db import get_conn


def run(umbral: int = captacion.UMBRAL_CAPTURA):
    capturadas = captacion.escanear(umbral=umbral)
    print(f"Licitaciones capturadas (score>={umbral}): {len(capturadas)}")

    nuevas = []
    with get_conn() as conn:
        cur = conn.cursor()
        for c in capturadas:
            # Asegura que la licitación exista en `licitaciones` (FK de capturas).
            ingesta.guardar_licitacion(cur, c["detalle"])
            # ¿ya estaba capturada?
            cur.execute("SELECT 1 FROM capturas WHERE codigo = %s", (c["codigo"],))
            es_nueva = cur.fetchone() is None
            cur.execute("""
                INSERT INTO capturas (codigo, score, motivos)
                VALUES (%s, %s, %s)
                ON CONFLICT (codigo) DO UPDATE SET score = EXCLUDED.score
            """, (c["codigo"], c["score"], c["motivos"]))
            if es_nueva:
                # Sin el detalle crudo: notificaciones y persistencia no lo usan.
                nuevas.append({k: v for k, v in c.items() if k != "detalle"})
        conn.commit()

    print(f"Nuevas (no vistas antes): {len(nuevas)}")

    if nuevas:
        try:
            if notificaciones.enviar_webhook(nuevas):
                print("Notificación enviada a Google Sheet + correo.")
        except Exception as e:
            print("Webhook falló:", e)
        link = notificaciones.link_whatsapp(nuevas)
        if link:
            print("Link WhatsApp:", link)
        # marcar notificadas
        with get_conn() as conn:
            cur = conn.cursor()
            cur.executemany("UPDATE capturas SET notificada = true WHERE codigo=%s",
                            [(c["codigo"],) for c in nuevas])
            conn.commit()
    return nuevas


if __name__ == "__main__":
    run()
