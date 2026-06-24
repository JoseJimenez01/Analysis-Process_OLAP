"""
ETL — Transformación (Transform)

Propósito:
  Leer los datos crudos extraídos (Parquet), aplicar transformaciones con
  Spark DataFrames y SparkSQL, y generar análisis de negocio en formato TXT.

Análisis generados (guardados en analytics/reports/):
  1. Tendencias de consumo: productos más populares, categorías preferidas,
     distribución de estados de reserva.
  2. Horarios pico: distribución de reservas por hora del día y día de la
     semana, identificación de ventanas de alta demanda.
  3. Crecimiento mensual: evolución del volumen de reservas mes a mes con
     tasas de crecimiento.

Uso:
  spark-submit --master spark://spark-master:7077 \\
               analytics/spark/transform.py
"""

import sys
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from spark.utils import build_spark, STAGING_PATH, REPORTS_PATH, execution_date_path
from pyspark.sql.functions import (
    col, hour, dayofweek, month, year, count, sum as spark_sum,
    avg, when, desc, round as spark_round, lit
)


def load_staging(spark, table: str):
    """
    Carga un DataFrame desde Parquet staging.
    Lee automáticamente el último execution_date_path disponible.
    """
    path = f"{STAGING_PATH}/{execution_date_path()}/{table}"
    return spark.read.parquet(path)


def write_report(filename: str, content: str):
    """
    Persiste un reporte de texto en analytics/reports/.
    Cada archivo incluye un timestamp de generación.
    """
    os.makedirs(REPORTS_PATH, exist_ok=True)
    filepath = f"{REPORTS_PATH}/{filename}"
    header = (
        f"========================================\n"
        f"  Reporte: {filename}\n"
        f"  Generado: {datetime.now(timezone.utc).isoformat()}\n"
        f"========================================\n\n"
    )
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(header + content)
    print(f"  [REPORTE] Guardado: {filepath}")


# ─── Análisis 1: Tendencias de Consumo ─────────────────────────────────────

def analyze_consumption_trends(spark):
    """
    Analiza tendencias de consumo:
      - Distribución de estados de reserva.
      - Tamaño promedio de grupo por restaurante.
      - Categorías de productos más ofertadas en menús.
      - Ranking de restaurantes por volumen de reservas.
    """
    print("\n  [ANÁLISIS] Tendencias de consumo...")

    # Registrar DataFrames como vistas temporales para SparkSQL
    df_reservations = load_staging(spark, "reservations")
    df_reservations.createOrReplaceTempView("reservations")

    df_menu_products = load_staging(spark, "menu_products")
    df_menu_products.createOrReplaceTempView("menu_products")

    df_products = load_staging(spark, "products")
    df_products.createOrReplaceTempView("products")

    # ── a) Distribución de estados de reserva ──
    df_status_dist = spark.sql("""
        SELECT
            status,
            COUNT(*)                                     AS total,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS pct
        FROM reservations
        GROUP BY status
        ORDER BY total DESC
    """)
    status_dist_str = "DISTRIBUCIÓN DE ESTADOS DE RESERVA\n" + \
        df_status_dist.toPandas().to_string(index=False)

    # ── b) Tamaño promedio de grupo por restaurante ──
    df_avg_party = spark.sql("""
        SELECT
            restaurant_name,
            ROUND(AVG(party_size), 1) AS avg_party_size,
            COUNT(*)                  AS total_reservations
        FROM reservations
        GROUP BY restaurant_name
        ORDER BY total_reservations DESC
    """)
    avg_party_str = "\n\nTAMAÑO PROMEDIO DE GRUPO POR RESTAURANTE\n" + \
        df_avg_party.toPandas().to_string(index=False)

    # ── c) Categorías más ofertadas en menús ──
    df_cat_offering = spark.sql("""
        SELECT
            category_name,
            COUNT(DISTINCT menu_id)   AS total_menus,
            COUNT(*)                  AS total_occurrences,
            ROUND(AVG(product_price), 2) AS avg_price
        FROM menu_products
        GROUP BY category_name
        ORDER BY total_occurrences DESC
    """)
    cat_offering_str = "\n\nCATEGORÍAS MÁS OFERTADAS EN MENÚS\n" + \
        df_cat_offering.toPandas().to_string(index=False)

    # ── d) Ranking de restaurantes por volumen ──
    df_ranking = spark.sql("""
        SELECT
            restaurant_name,
            COUNT(*)                         AS total_reservations,
            ROUND(AVG(party_size), 1)        AS avg_party,
            ROUND(AVG(CAST(
                CASE WHEN status = 'completed' THEN 1 ELSE 0 END AS DOUBLE
            ) * 100), 1)                     AS completion_rate_pct
        FROM reservations
        GROUP BY restaurant_name
        ORDER BY total_reservations DESC
    """)
    ranking_str = "\n\nRANKING DE RESTAURANTES POR VOLUMEN\n" + \
        df_ranking.toPandas().to_string(index=False)

    return status_dist_str + avg_party_str + cat_offering_str + ranking_str


# ─── Análisis 2: Horarios Pico ──────────────────────────────────────────────

def analyze_peak_hours(spark):
    """
    Analiza distribución temporal de reservas:
      - Reservas por hora del día (picos de demanda).
      - Reservas por día de la semana.
      - Combinación hora × día para identificar ventanas críticas.
    """
    print("\n  [ANÁLISIS] Horarios pico...")

    df_reservations = load_staging(spark, "reservations")
    df_reservations.createOrReplaceTempView("reservations")

    # Extraer hora y día de la semana como columnas derivadas
    df_with_time = spark.sql("""
        SELECT
            reservation_id,
            EXTRACT(HOUR FROM reservation_date)   AS hour_of_day,
            EXTRACT(DOW FROM reservation_date)    AS day_of_week,
            party_size,
            status
        FROM reservations
    """)
    df_with_time.createOrReplaceTempView("reservations_time")

    # ── a) Distribución por hora del día ──
    df_by_hour = spark.sql("""
        SELECT
            hour_of_day,
            COUNT(*)                    AS total_reservations,
            ROUND(AVG(party_size), 1)   AS avg_party,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS pct
        FROM reservations_time
        GROUP BY hour_of_day
        ORDER BY hour_of_day
    """)
    by_hour_str = "DISTRIBUCIÓN DE RESERVAS POR HORA DEL DÍA\n" + \
        df_by_hour.toPandas().to_string(index=False)

    # ── b) Distribución por día de la semana ──
    day_names = {0: "Dom", 1: "Lun", 2: "Mar", 3: "Mié",
                 4: "Jue", 5: "Vie", 6: "Sáb"}

    df_by_dow = spark.sql("""
        SELECT
            day_of_week,
            COUNT(*)                    AS total_reservations,
            ROUND(AVG(party_size), 1)   AS avg_party
        FROM reservations_time
        GROUP BY day_of_week
        ORDER BY day_of_week
    """)
    pdf = df_by_dow.toPandas()
    pdf["day_name"] = pdf["day_of_week"].map(day_names)
    by_dow_str = "\n\nDISTRIBUCIÓN POR DÍA DE LA SEMANA\n" + \
        pdf[["day_name", "total_reservations", "avg_party"]].to_string(index=False)

    # ── c) Ventana pico (hora + día combinados) ──
    df_peak = spark.sql("""
        SELECT
            day_of_week,
            hour_of_day,
            COUNT(*) AS total_reservations
        FROM reservations_time
        GROUP BY day_of_week, hour_of_day
        ORDER BY total_reservations DESC
        LIMIT 15
    """)
    pdf_peak = df_peak.toPandas()
    pdf_peak["day_name"] = pdf_peak["day_of_week"].map(day_names)
    peak_str = "\n\nTOP 15 VENTANAS PICO (DÍA × HORA)\n" + \
        pdf_peak[["day_name", "hour_of_day", "total_reservations"]].to_string(index=False)

    return by_hour_str + by_dow_str + peak_str


# ─── Análisis 3: Crecimiento Mensual ────────────────────────────────────────

def analyze_monthly_growth(spark):
    """
    Analiza la evolución mensual de reservas:
      - Reservas por año-mes.
      - Crecimiento mes contra mes (%).
      - Proyección de tendencia (promedio móvil 3 meses).
    """
    print("\n  [ANÁLISIS] Crecimiento mensual...")

    df_reservations = load_staging(spark, "reservations")
    df_reservations.createOrReplaceTempView("reservations")

    # Agregación mensual usando SparkSQL
    df_monthly = spark.sql("""
        SELECT
            YEAR(reservation_date)  AS year,
            MONTH(reservation_date) AS month,
            COUNT(*)                AS total_reservations,
            SUM(party_size)         AS total_guests
        FROM reservations
        GROUP BY YEAR(reservation_date), MONTH(reservation_date)
        ORDER BY year, month
    """)

    # Calcular crecimiento mes contra mes con window function
    df_monthly.createOrReplaceTempView("monthly_agg")
    df_growth = spark.sql("""
        SELECT
            year,
            month,
            total_reservations,
            total_guests,
            LAG(total_reservations, 1) OVER (ORDER BY year, month)
                AS prev_month_reservations,
            ROUND(
                (total_reservations - LAG(total_reservations, 1)
                    OVER (ORDER BY year, month))
                / NULLIF(LAG(total_reservations, 1)
                    OVER (ORDER BY year, month), 0) * 100, 2
            ) AS growth_pct,
            ROUND(AVG(total_reservations) OVER (
                ORDER BY year, month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
            ), 1) AS moving_avg_3m
        FROM monthly_agg
        ORDER BY year, month
    """)

    pdf = df_growth.toPandas()
    monthly_str = "CRECIMIENTO MENSUAL DE RESERVAS\n" + \
        pdf.to_string(index=False)

    return monthly_str


# ─── Main ──────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("ETL — TRANSFORM: Iniciando análisis de datos")
    print("=" * 60)

    spark = build_spark("ETL Transform", hive_support=False)

    print(f"\n  Leyendo staging de: {STAGING_PATH}/{execution_date_path()}")

    # ─── Reporte 1: Tendencias de consumo ────────────────────────────────
    print("\n--- Reporte: Tendencias de Consumo ---")
    consumo = analyze_consumption_trends(spark)
    write_report(
        "analisis_tendencias_consumo.txt",
        consumo
    )

    # ─── Reporte 2: Horarios pico ────────────────────────────────────────
    print("\n--- Reporte: Horarios Pico ---")
    picos = analyze_peak_hours(spark)
    write_report(
        "analisis_horarios_pico.txt",
        picos
    )

    # ─── Reporte 3: Crecimiento mensual ──────────────────────────────────
    print("\n--- Reporte: Crecimiento Mensual ---")
    crecimiento = analyze_monthly_growth(spark)
    write_report(
        "analisis_crecimiento_mensual.txt",
        crecimiento
    )

    print("\n" + "=" * 60)
    print("TRANSFORM completado exitosamente.")
    print(f"  Reportes en: {REPORTS_PATH}")
    print("=" * 60)

    spark.stop()


if __name__ == "__main__":
    main()
