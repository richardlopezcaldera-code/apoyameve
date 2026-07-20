from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import oportunidades, ia, cotizaciones, captacion

app = FastAPI(title="Sistema de Licitaciones + IA", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(oportunidades.router)
app.include_router(ia.router)
app.include_router(cotizaciones.router)
app.include_router(captacion.router)


@app.get("/")
def health():
    return {"ok": True, "servicio": "licitaciones-app"}
