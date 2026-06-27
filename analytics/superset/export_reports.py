"""
export_reports.py — Exporta análisis predefinidos a CSV.

Propósito:
  Conectarse al Data Warehouse (Hive) y generar reportes CSV con los tres
  análisis solicitados. Corre dentro del contenedor Superset (tiene pyhive).

  Puede ejecutarse:
    - Manual: docker compose exec superset python /app/export_reports.py
    - Automático: agregado como tarea final del DAG etl_pipeline

Reportes generados en analytics/reports/:
  1. ingresos_por_mes_categoria.csv
  2. actividad_clientes_zona.csv
  3. pedidos_completados_vs_cancelados.csv
"""

import csv
import logging
import os
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="[REPORT] %(message)s")
log = logging.getLogger(__name__)

REPORTS_DIR = "/opt/airflow/reports"

# ─── Conexión a Hive via PyHive ────────────────────────────────────────────


def get_hive_connection():
    from pyhive import hive

    conn = hive.connect(
        host="hive-server",
        port=10000,
        username="hive",
        database="default",
        auth="NOSASL",
    )
    log.info("Conectado a Hive en hive-server:10000")
    return conn


# ─── Helpers ────────────────────────────────────────────────────────────────


def _csv_filename(name: str) -> str:
    return os.path.join(REPORTS_DIR, name)


def _write_csv(filename: str, rows: list, headers: list):
    os.makedirs(REPORTS_DIR, exist_ok=True)
    path = _csv_filename(filename)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
    log.info(f"  ✓ {filename} ({len(rows)} filas)")


def _query(conn, sql: str) -> tuple:
    """Ejecuta SQL, retorna (headers, rows)."""
    cursor = conn.cursor()
    cursor.execute(sql)
    headers = [desc[0] for desc in cursor.description] if cursor.description else []
    rows = cursor.fetchall()
    return headers, rows


# ─── Reporte 1: Ingresos por mes y categoría ────────────────────────────────

REVENUE_SQL = """
    SELECT
        d.year,
        d.month,
        dc.name             AS categoria,
        COUNT(fr.reservation_id)                        AS total_reservas,
        ROUND(AVG(fr.party_size), 1)                    AS avg_comensales,
        ROUND(
            COUNT(fr.reservation_id)
            * AVG(fr.party_size)
            * 25.0, 2
        )                                                AS ingreso_estimado_usd
    FROM fact_reservation fr
    JOIN dim_date d ON fr.date_id = d.date_id
    JOIN dim_restaurant dr ON fr.restaurant_id = dr.restaurant_id
    CROSS JOIN dim_category dc
    WHERE fr.status_id = 4  -- completed
    GROUP BY d.year, d.month, dc.name
    ORDER BY d.year, d.month, ingreso_estimado_usd DESC
"""


def report_ingresos(conn):
    log.info("Reporte 1: Ingresos por mes y categoría de producto")
    headers, rows = _query(conn, REVENUE_SQL)
    _write_csv("ingresos_por_mes_categoria.csv", rows, headers)


# ─── Reporte 2: Actividad de clientes por zona geográfica ───────────────────

ACTIVITY_SQL = """
    SELECT
        dr.name             AS restaurante,
        dr.address          AS direccion,
        COUNT(fr.reservation_id)                        AS total_reservas,
        COUNT(DISTINCT fr.user_id)                      AS clientes_unicos,
        ROUND(AVG(fr.party_size), 1)                    AS avg_comensales,
        ROUND(
            COUNT(CASE WHEN fr.status_id = 4 THEN 1 END)
            * 100.0 / NULLIF(COUNT(*), 0), 1
        )                                                AS tasa_completados_pct
    FROM fact_reservation fr
    JOIN dim_restaurant dr ON fr.restaurant_id = dr.restaurant_id
    GROUP BY dr.name, dr.address
    ORDER BY total_reservas DESC
"""


def report_actividad(conn):
    log.info("Reporte 2: Actividad de clientes por zona geográfica")
    headers, rows = _query(conn, ACTIVITY_SQL)
    _write_csv("actividad_clientes_zona.csv", rows, headers)


# ─── Reporte 3: Completados vs Cancelados ───────────────────────────────────

STATUS_SQL = """
    SELECT
        d.year,
        d.month,
        ds.status_name                                AS estado,
        COUNT(*)                                      AS total,
        ROUND(
            COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (
                PARTITION BY d.year, d.month
            ), 2
        )                                              AS porcentaje
    FROM fact_reservation fr
    JOIN dim_date d ON fr.date_id = d.date_id
    JOIN dim_status ds ON fr.status_id = ds.status_id
    WHERE ds.status_name IN ('completed', 'cancelled')
    GROUP BY d.year, d.month, ds.status_name
    ORDER BY d.year, d.month, estado
"""


def report_estados(conn):
    log.info("Reporte 3: Estadísticas completados vs cancelados")
    headers, rows = _query(conn, STATUS_SQL)
    _write_csv("pedidos_completados_vs_cancelados.csv", rows, headers)


# ─── Main ───────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("SUPERSET — Exportando reportes analíticos")
    print("=" * 60)

    conn = get_hive_connection()

    report_ingresos(conn)
    report_actividad(conn)
    report_estados(conn)

    conn.close()

    print("\n" + "=" * 60)
    print(f"Reportes generados en {REPORTS_DIR}/")
    print("=" * 60)


if __name__ == "__main__":
    main()
