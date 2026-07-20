from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    MP_TICKET: str = ""
    DATABASE_URL: str = "postgresql://licita:licita@localhost:5432/licitaciones"
    ANTHROPIC_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-sonnet-4-5"
    CORS_ORIGINS: str = "http://localhost:5173"

    # === Catálogo del proveedor (tu sistema, consultado en vivo por API) ===
    # Endpoint de TU sistema que devuelve productos. Debe aceptar ?q= y ?limit=
    # y responder JSON: {"productos":[{"id","sku","nombre","descripcion",
    #                    "unidad","costo","precio","categoria","codigo_unspsc"}]}
    CATALOGO_API_URL: str = ""
    CATALOGO_API_KEY: str = ""            # se envía como Authorization: Bearer ...
    MARGEN_OBJETIVO_PCT: float = 20.0     # margen por defecto para precio sugerido

    # === Captación / notificaciones ===
    # Webhook de tu Google Apps Script (/exec) que guarda en Sheet y envía correo
    CAPTACION_WEBHOOK_URL: str = ""
    # WhatsApp: número destino (formato 569XXXXXXXX) para generar el link de aviso
    WHATSAPP_DESTINO: str = ""

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
