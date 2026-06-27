import csv
import logging
import os

logging.basicConfig(level=logging.INFO, format="[REPORT] %(message)s")
log = logging.getLogger(__name__)

REPORTS_DIR = "/opt/airflow/reports"

PG_HOST = os.environ.get("PG_HOST", "postgres")
PG_PORT = os.environ.get("PG_PORT", "5432")
PG_DB = os.environ.get("PG_DB", "restaurantes")
PG_USER = os.environ.get("PG_USER", "postgres")
PG_PASSWORD = os.environ.get("PG_PASSWORD", "postgres")


def get_pg_connection():
    import psycopg2
    conn = psycopg2.connect(
        host=PG_HOST, port=PG_PORT, dbname=PG_DB,
        user=PG_USER, password=PG_PASSWORD,
    )
    log.info(f"Conectado a PostgreSQL en {PG_HOST}:{PG_PORT}/{PG_DB}")
    return conn


def _csv_filename(name: str) -> str:
    return os.path.join(REPORTS_DIR, name)


def _write_csv(filename: str, rows: list, headers: list):
    os.makedirs(REPORTS_DIR, exist_ok=True)
    path = _csv_filename(filename)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
    log.info(f"  \u2713 {filename} ({len(rows)} filas)")


def _query(conn, sql: str) -> tuple:
    cursor = conn.cursor()
    cursor.execute(sql)
    headers = [desc[0] for desc in cursor.description] if cursor.description else []
    rows = cursor.fetchall()
    return headers, rows


REVENUE_SQL = """
    SELECT
        EXTRACT(YEAR FROM r.reservation_date)::int AS year,
        EXTRACT(MONTH FROM r.reservation_date)::int AS month,
        c.name AS categoria,
        COUNT(r.id) AS total_reservas,
        ROUND(AVG(r.party_size), 1) AS avg_comensales,
        ROUND(
            COUNT(r.id) * AVG(r.party_size) * 25.0, 2
        ) AS ingreso_estimado_usd
    FROM "Reservation" r
    JOIN "Restaurant" rest ON r.restaurant_id = rest.id
    CROSS JOIN "Category" c
    WHERE r.status = 'completed'
    GROUP BY year, month, c.name
    ORDER BY year, month, ingreso_estimado_usd DESC
"""

ACTIVITY_SQL = """
    SELECT
        rest.name AS restaurante,
        rest.address AS direccion,
        COUNT(r.id) AS total_reservas,
        COUNT(DISTINCT r.user_id) AS clientes_unicos,
        ROUND(AVG(r.party_size), 1) AS avg_comensales,
        ROUND(
            COUNT(CASE WHEN r.status = 'completed' THEN 1 END)
            * 100.0 / NULLIF(COUNT(*), 0), 1
        ) AS tasa_completados_pct
    FROM "Reservation" r
    JOIN "Restaurant" rest ON r.restaurant_id = rest.id
    GROUP BY rest.name, rest.address
    ORDER BY total_reservas DESC
"""

STATUS_SQL = """
    SELECT
        EXTRACT(YEAR FROM r.reservation_date)::int AS year,
        EXTRACT(MONTH FROM r.reservation_date)::int AS month,
        r.status AS estado,
        COUNT(*) AS total,
        ROUND(
            COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (
                PARTITION BY EXTRACT(YEAR FROM r.reservation_date)::int,
                             EXTRACT(MONTH FROM r.reservation_date)::int
            ), 2
        ) AS porcentaje
    FROM "Reservation" r
    WHERE r.status IN ('completed', 'cancelled')
    GROUP BY year, month, r.status
    ORDER BY year, month, estado
"""


def report_ingresos(conn):
    log.info("Reporte 1: Ingresos por mes y categoria de producto")
    headers, rows = _query(conn, REVENUE_SQL)
    _write_csv("ingresos_por_mes_categoria.csv", rows, headers)


def report_actividad(conn):
    log.info("Reporte 2: Actividad de clientes por zona geografica")
    headers, rows = _query(conn, ACTIVITY_SQL)
    _write_csv("actividad_clientes_zona.csv", rows, headers)


def report_estados(conn):
    log.info("Reporte 3: Estadisticas completados vs cancelados")
    headers, rows = _query(conn, STATUS_SQL)
    _write_csv("pedidos_completados_vs_cancelados.csv", rows, headers)


def main():
    print("=" * 60)
    print("EXPORT — Exportando reportes analiticos desde PostgreSQL")
    print("=" * 60)
    conn = get_pg_connection()
    report_ingresos(conn)
    report_actividad(conn)
    report_estados(conn)
    conn.close()
    print("\n" + "=" * 60)
    print(f"Reportes generados en {REPORTS_DIR}/")
    print("=" * 60)


if __name__ == "__main__":
    main()
