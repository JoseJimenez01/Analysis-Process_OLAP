"""
init_superset.py — Inicializa conexiones a bases de datos en Superset.

Propósito:
  Ejecutado manualmente o desde el entrypoint del contenedor para registrar
  las conexiones JDBC/SQLAlchemy a Hive y PostgreSQL como bases de datos
  en Superset, permitiendo crear dashboards desde la UI.

Uso (dentro del contenedor):
  docker compose exec superset python /app/init_superset.py
"""

import json
import logging
from urllib.parse import quote

import requests

logging.basicConfig(level=logging.INFO, format="[SUPERSET] %(message)s")
log = logging.getLogger(__name__)

SUPERSET_URL = "http://localhost:8088"
ADMIN_USER = "admin"
ADMIN_PASS = "admin"


def _login() -> str:
    """Autentica y retorna el access_token."""
    r = requests.post(
        f"{SUPERSET_URL}/api/v1/security/login",
        json={
            "username": ADMIN_USER,
            "password": ADMIN_PASS,
            "provider": "db",
            "refresh": True,
        },
        timeout=10,
    )
    r.raise_for_status()
    token = r.json()["access_token"]
    log.info("Autenticación exitosa")
    return token


def _headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def _get_databases(token: str) -> list:
    r = requests.get(
        f"{SUPERSET_URL}/api/v1/database/",
        headers=_headers(token),
        timeout=10,
    )
    r.raise_for_status()
    return [db["database_name"] for db in r.json().get("result", [])]


def _add_database(token: str, name: str, uri: str) -> bool:
    if name in _get_databases(token):
        log.info(f"  ↪ {name} ya existe, saltando")
        return False

    r = requests.post(
        f"{SUPERSET_URL}/api/v1/database/",
        headers=_headers(token),
        json={
            "database_name": name,
            "sqlalchemy_uri": uri,
            "expose_in_sql_lab": True,
        },
        timeout=10,
    )
    if r.status_code == 201:
        log.info(f"  ✓ Conexión '{name}' agregada")
        return True
    else:
        log.warning(f"  ✗ Error al agregar '{name}': {r.status_code} {r.text}")
        return False


def main():
    log.info("Inicializando conexiones en Superset...")

    token = _login()

    # ─── PostgreSQL (datos transaccionales) ──────────────────────────
    # SQLAlchemy URI: postgresql://user:pass@host:port/db
    pg_uri = (
        "postgresql://postgres:postgres@postgres:5432/restaurantes"
    )
    _add_database(token, "PostgreSQL (OLTP)", pg_uri)

    # ─── Hive (Data Warehouse) ───────────────────────────────────────
    # SQLAlchemy URI: hive://hive@host:port/database?auth=NOSASL
    hive_uri = "hive://hive@hive-server:10000/default?auth=NOSASL"
    _add_database(token, "Hive (Data Warehouse)", hive_uri)

    log.info("Inicialización completada.")
    log.info("Accede a Superset en http://localhost:8088 (admin/admin)")


if __name__ == "__main__":
    main()
