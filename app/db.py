from contextlib import contextmanager
import psycopg
from psycopg.rows import dict_row
from .config import settings


@contextmanager
def get_conn():
    """Conexión a Postgres que devuelve filas como dicts."""
    conn = psycopg.connect(settings.DATABASE_URL, row_factory=dict_row)
    try:
        yield conn
    finally:
        conn.close()
