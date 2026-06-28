"""
create_dashboards.py — Crea dashboards en Superset automáticamente.

Propósito:
  Registrar la base de datos Hive como datasource en Superset, crear
  datasets virtuales con las consultas OLAP, y construir un dashboard
  con gráficos para cada uno de los 3 reportes del pipeline ETL.

Flujo:
  1. Autenticar en Superset API
  2. Crear/verificar conexión a Hive (Data Warehouse)
  3. Crear datasets SQL virtuales para los 3 análisis
  4. Crear 3 charts (tabla/barra/pie) basados en esos datasets
  5. Ensamblar dashboard con los charts

Uso (dentro del contenedor airflow):
  python /opt/airflow/superset/create_dashboards.py

Requiere: requests (incluido en imagen Airflow por defecto)
"""

import json
import logging
import time

import requests

logging.basicConfig(level=logging.INFO, format="[DASHBOARDS] %(message)s")
log = logging.getLogger(__name__)

SUPERSET_URL = "http://superset:8088"
ADMIN_USER = "admin"
ADMIN_PASS = "admin"

HIVE_DB_NAME = "Hive (Data Warehouse)"
HIVE_URI = "hive://hive@hive-server:10000/default?auth=NOSASL"

PG_DB_NAME = "PostgreSQL (Transaccional)"
PG_URI = "postgresql://postgres:postgres@postgres:5432/airflow"

REPORTS_DIR = "/opt/airflow/reports"

# ─── Consultas SQL para los 3 análisis (PostgreSQL) ──────────────────────────
# Se ejecutan contra el schema transaccional (Reservation, User, Restaurant,
# Product, Category). GitHub-flavored SQL compatible con PostgreSQL.

REVENUE_SQL = """
    SELECT
        EXTRACT(YEAR FROM r.reservation_date)      AS year,
        EXTRACT(MONTH FROM r.reservation_date)      AS month,
        c.name                                       AS categoria,
        COUNT(r.id)                                  AS total_reservas,
        ROUND(AVG(r.party_size), 1)                  AS avg_comensales,
        ROUND(
            COUNT(r.id) * AVG(r.party_size) * 25.0, 2
        )                                             AS ingreso_estimado_usd
    FROM "Reservation" r
    JOIN "User" u      ON u.id = r.user_id
    JOIN "Restaurant" rest ON rest.id = r.restaurant_id
    CROSS JOIN "Category" c
    WHERE r.status = 'completed'
    GROUP BY EXTRACT(YEAR FROM r.reservation_date),
             EXTRACT(MONTH FROM r.reservation_date),
             c.name
    ORDER BY year, month, ingreso_estimado_usd DESC
"""

ACTIVITY_SQL = """
    SELECT
        rest.name                  AS restaurante,
        rest.address              AS direccion,
        COUNT(r.id)               AS total_reservas,
        COUNT(DISTINCT r.user_id)  AS clientes_unicos,
        ROUND(AVG(r.party_size), 1) AS avg_comensales,
        ROUND(
            COUNT(CASE WHEN r.status = 'completed' THEN 1 END)
            * 100.0 / NULLIF(COUNT(*), 0), 1
        )                          AS tasa_completados_pct
    FROM "Reservation" r
    JOIN "Restaurant" rest ON rest.id = r.restaurant_id
    GROUP BY rest.name, rest.address
    ORDER BY total_reservas DESC
"""

STATUS_SQL = """
    SELECT
        EXTRACT(YEAR FROM r.reservation_date)  AS year,
        EXTRACT(MONTH FROM r.reservation_date) AS month,
        r.status                                AS estado,
        COUNT(*)                                AS total,
        ROUND(
            COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (
                PARTITION BY EXTRACT(YEAR FROM r.reservation_date),
                             EXTRACT(MONTH FROM r.reservation_date)
            ), 2
        )                                       AS porcentaje
    FROM "Reservation" r
    WHERE r.status IN ('completed', 'cancelled')
    GROUP BY EXTRACT(YEAR FROM r.reservation_date),
             EXTRACT(MONTH FROM r.reservation_date),
             r.status
    ORDER BY year, month, estado
"""


# ─── API helpers ─────────────────────────────────────────────────────────────

_CSRF_TOKEN = ""
_session = requests.Session()

def _login() -> str:
    """Autentica y retorna el access_token."""
    global _CSRF_TOKEN
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
    _CSRF_TOKEN = r.json()["result"]
    log.info("Autenticación exitosa en Superset API")
    return token


def _headers(token: str) -> dict:
    h = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    if _CSRF_TOKEN:
        h["X-CSRFToken"] = _CSRF_TOKEN
        h["Referer"] = f"{SUPERSET_URL}/"
    return h


def _exists(token: str, endpoint: str, name_key: str, name: str) -> int | None:
    """
    Busca un recurso por nombre en un endpoint de Superset.
    Retorna el ID si existe, None si no.
    """
    page = 0
    while True:
        r = _session.get(
            f"{SUPERSET_URL}/api/v1/{endpoint}/?q=(page:{page},page_size:100)",
            headers=_headers(token),
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        results = data.get("result", [])
        if not results:
            break
        for item in results:
            if item.get(name_key) == name:
                return item["id"]
        page += 1
    return None


# ─── Database ────────────────────────────────────────────────────────────────

def _get_or_create_database(token: str, name: str, uri: str) -> int:
    """Retorna el ID de la base de datos, creándola si no existe."""
    existing = _exists(token, "database", "database_name", name)
    if existing is not None:
        log.info("  ↪ Base de datos '%s' ya existe (id=%s)", name, existing)
        return existing

    r = _session.post(
        f"{SUPERSET_URL}/api/v1/database/",
        headers=_headers(token),
        json={
            "database_name": name,
            "sqlalchemy_uri": uri,
            "expose_in_sql_lab": True,
            "test_connection": False,
        },
        timeout=30,
    )
    if r.status_code == 201:
        db_id = r.json()["id"]
        log.info("  ✓ Base de datos '%s' creada (id=%s)", name, db_id)
        return db_id
    else:
        log.warning("  ✗ Error al crear DB '%s': %s", name, r.text)
        raise RuntimeError(f"Error creando base de datos: {r.text}")


# ─── Dataset (virtual SQL) ──────────────────────────────────────────────────

def _get_or_create_dataset(token: str, database_id: int, table_name: str,
                           sql: str) -> int:
    """
    Crea un dataset virtual (SQL Lab) en Superset.
    Si ya existe con el mismo table_name, retorna su ID.
    """
    existing = _exists(token, "dataset", "table_name", table_name)
    if existing is not None:
        log.info("  ↪ Dataset '%s' ya existe (id=%s)", table_name, existing)
        return existing

    r = _session.post(
        f"{SUPERSET_URL}/api/v1/dataset/",
        headers=_headers(token),
        json={
            "database": database_id,
            "table_name": table_name,
            "sql": sql,
            "schema": "public",
        },
        timeout=10,
    )
    if r.status_code == 201:
        ds_id = r.json()["id"]
        log.info("  ✓ Dataset '%s' creado (id=%s)", table_name, ds_id)
        return ds_id
    else:
        log.warning("  ✗ Error al crear dataset '%s': %s", table_name, r.text)
        raise RuntimeError(f"Error creando dataset: {r.text}")


# ─── Chart ───────────────────────────────────────────────────────────────────

def _chart_params(dataset_id: int, columns: list[str], row_limit: int = 100
                  ) -> str:
    """
    Genera el JSON string de params para un chart de tipo tabla.

    El formato de params es el que Superset espera como string JSON en el
    campo 'params' del modelo Chart.
    """
    return json.dumps({
        "viz_type": "table",
        "datasource": f"{dataset_id}__table",
        "all_columns": True,
        "columns": columns if columns else [],
        "row_limit": row_limit,
        "query_mode": "raw",
        "include_time": False,
        "order_by_cols": [],
        "adhoc_filters": [],
        "page_length": 20,
        "include_search": True,
        "show_cell_bars": True,
        "table_timestamp_format": "%Y-%m-%d %H:%M:%S",
    })


def _get_or_create_chart(token: str, dataset_id: int, slice_name: str,
                         columns: list[str], row_limit: int = 100) -> int:
    """
    Crea un chart de tipo tabla en Superset. Si ya existe con el mismo nombre,
    retorna su ID.
    """
    existing = _exists(token, "chart", "slice_name", slice_name)
    if existing is not None:
        log.info("  ↪ Chart '%s' ya existe (id=%s)", slice_name, existing)
        return existing

    params = _chart_params(dataset_id, columns, row_limit)

    r = _session.post(
        f"{SUPERSET_URL}/api/v1/chart/",
        headers=_headers(token),
        json={
            "datasource_id": dataset_id,
            "datasource_type": "table",
            "slice_name": slice_name,
            "viz_type": "table",
            "params": params,
        },
        timeout=10,
    )
    if r.status_code == 201:
        chart_id = r.json()["id"]
        log.info("  ✓ Chart '%s' creado (id=%s)", slice_name, chart_id)
        return chart_id
    else:
        log.warning("  ✗ Error al crear chart '%s': %s", slice_name, r.text)
        raise RuntimeError(f"Error creando chart: {r.text}")


# ─── Dashboard ───────────────────────────────────────────────────────────────

def _build_position_json(title: str, chart_ids: list[int]) -> str:
    """
    Construye el position_json necesario para definir el layout del dashboard.

    Cada chart ocupa un tercio del ancho (columna de 4 en grid de 12).
    """
    children = []
    layout = {}

    # Header
    layout["HEADER_ID"] = {
        "type": "HEADER",
        "id": "HEADER_ID",
        "meta": {"text": title},
    }
    children.append("HEADER_ID")

    for i, cid in enumerate(chart_ids):
        ckey = f"CHART-{i}"
        layout[ckey] = {
            "type": "CHART",
            "id": ckey,
            "children": [],
            "meta": {
                "chartId": cid,
                "width": 4,
                "height": 50,
            },
        }
        children.append(ckey)

    layout["GRID_ID"] = {
        "type": "GRID",
        "id": "GRID_ID",
        "children": children,
    }

    layout["ROOT_ID"] = {
        "type": "ROOT",
        "id": "ROOT_ID",
        "children": ["GRID_ID"],
    }

    layout["DASHBOARD_VERSION_KEY"] = "v2"

    return json.dumps(layout)


def _get_or_create_dashboard(token: str, title: str, chart_ids: list[int]):
    """Crea un dashboard con los charts dados. Salta si ya existe."""
    existing = _exists(token, "dashboard", "dashboard_title", title)
    if existing is not None:
        log.info("  ↪ Dashboard '%s' ya existe (id=%s), saltando", title, existing)
        return existing

    position_json = _build_position_json(title, chart_ids)

    r = _session.post(
        f"{SUPERSET_URL}/api/v1/dashboard/",
        headers=_headers(token),
        json={
            "dashboard_title": title,
            "slug": title.lower().replace(" ", "-"),
            "published": True,
            "position_json": position_json,
        },
        timeout=10,
    )
    if r.status_code == 201:
        dash_id = r.json()["id"]
        log.info("  ✓ Dashboard '%s' creado (id=%s)", title, dash_id)
    else:
        log.warning("  ✗ Error al crear dashboard '%s': %s", title, r.text)
        raise RuntimeError(f"Error creando dashboard: {r.text}")


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    log.info("=" * 60)
    log.info("Creando dashboards en Superset...")
    log.info("=" * 60)

    token = _login()

    # ─── 1. Base de datos (PostgreSQL primero, Hive fallback) ──────────
    log.info("\n[1/5] Registrando base de datos PostgreSQL en Superset...")
    db_id = _get_or_create_database(token, PG_DB_NAME, PG_URI)
    # También intentar Hive si está disponible
    try:
        _get_or_create_database(token, HIVE_DB_NAME, HIVE_URI)
    except Exception:
        log.info("  Hive no disponible, usando PostgreSQL")

    # ─── 2. Datasets virtuales ──────────────────────────────────────────
    log.info("\n[2/5] Creando datasets virtuales...")

    ds_ingresos = _get_or_create_dataset(
        token, db_id, "ingresos_por_mes_categoria", REVENUE_SQL,
    )
    ds_actividad = _get_or_create_dataset(
        token, db_id, "actividad_clientes_zona", ACTIVITY_SQL,
    )
    ds_estados = _get_or_create_dataset(
        token, db_id, "completados_vs_cancelados", STATUS_SQL,
    )

    # ─── 3. Charts ──────────────────────────────────────────────────────
    log.info("\n[3/5] Creando charts...")

    ch_ingresos = _get_or_create_chart(
        token, ds_ingresos,
        "Ingresos por Mes y Categoría",
        ["year", "month", "categoria", "total_reservas", "avg_comensales",
         "ingreso_estimado_usd"],
    )
    ch_actividad = _get_or_create_chart(
        token, ds_actividad,
        "Actividad por Zona Geográfica",
        ["restaurante", "direccion", "total_reservas", "clientes_unicos",
         "avg_comensales", "tasa_completados_pct"],
    )
    ch_estados = _get_or_create_chart(
        token, ds_estados,
        "Completados vs Cancelados",
        ["year", "month", "estado", "total", "porcentaje"],
    )

    # ─── 4. Dashboard ───────────────────────────────────────────────────
    log.info("\n[4/5] Ensamblando dashboard...")
    _get_or_create_dashboard(
        token,
        "Analítica de Restaurantes",
        [ch_ingresos, ch_actividad, ch_estados],
    )

    log.info("\n" + "=" * 60)
    log.info("✓ Dashboards creados exitosamente en Superset.")
    log.info("  Accede a http://localhost:8088 (admin/admin)")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
