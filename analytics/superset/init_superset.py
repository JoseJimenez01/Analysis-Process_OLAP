"""
init_superset.py — Inicializa la conexión a PostgreSQL en Superset.

Propósito:
  Ejecutado por el DAG de Airflow para registrar la conexión SQLAlchemy
  a PostgreSQL (base transaccional) en Superset. Cuando Hive está
  disponible también registra el warehouse.

Uso:
  python /opt/airflow/superset/init_superset.py
"""

import logging

import requests

logging.basicConfig(level=logging.INFO, format="[SUPERSET] %(message)s")
log = logging.getLogger(__name__)

SUPERSET_URL = "http://superset:8088"
ADMIN_USER = "admin"
ADMIN_PASS = "admin"

# Shared session to persist CSRF cookies across requests
_session = requests.Session()


def _login() -> tuple[str, str]:
    """Autentica y retorna (access_token, csrf_token). Retry en fallo."""
    import time
    for attempt in range(12):
        try:
            r = _session.post(
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

            r = _session.get(
                f"{SUPERSET_URL}/api/v1/security/csrf_token/",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )
            r.raise_for_status()
            csrf = r.json()["result"]
            log.info("Autenticación exitosa")
            return token, csrf
        except Exception as e:
            log.info(f"  Esperando Superset... (intento {attempt+1}/12): {e.__class__.__name__}")
            time.sleep(5)
    raise RuntimeError("No se pudo conectar a Superset tras 12 intentos")


def _headers(token: str, csrf: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-CSRFToken": csrf,
        "Referer": f"{SUPERSET_URL}/",
    }


def _get_databases(token: str) -> list:
    r = _session.get(
        f"{SUPERSET_URL}/api/v1/database/",
        headers=_headers(token, ""),
        timeout=10,
    )
    r.raise_for_status()
    return [db["database_name"] for db in r.json().get("result", [])]


def _add_database(token: str, csrf: str, name: str, uri: str) -> bool:
    if name in _get_databases(token):
        log.info(f"  ↪ {name} ya existe, saltando")
        return False

    r = _session.post(
        f"{SUPERSET_URL}/api/v1/database/",
        headers=_headers(token, csrf),
        json={
            "database_name": name,
            "sqlalchemy_uri": uri,
            "expose_in_sql_lab": True,
            "test_connection": False,
        },
        timeout=30,
    )
    if r.status_code == 201:
        log.info(f"  ✓ Conexión '{name}' agregada")
        return True
    else:
        log.warning(f"  ✗ Error al agregar '{name}': {r.status_code} {r.text}")
        return False


def main():
    log.info("Inicializando conexiones en Superset...")

    token, csrf = _login()

    # ─── PostgreSQL (base transaccional) ──────────────────────────────
    # Contiene reservas, usuarios, restaurantes, productos, categorías
    pg_uri = "postgresql://postgres:postgres@postgres:5432/airflow"
    _add_database(token, csrf, "PostgreSQL (Transaccional)", pg_uri)

    # ─── Hive (Data Warehouse) — opcional, solo si está disponible ────
    hive_uri = "hive://hive@hive-server:10000/default?auth=NOSASL"
    try:
        _add_database(token, csrf, "Hive (Data Warehouse)", hive_uri)
    except Exception:
        log.info("  Hive no disponible, usando solo PostgreSQL")

    log.info("Inicialización completada.")


if __name__ == "__main__":
    main()