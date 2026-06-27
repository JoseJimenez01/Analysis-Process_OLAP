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


def write_report_csv(filename: str, content: str):
    """
    Persiste un reporte CSV en analytics/reports/.
    """
    os.makedirs(REPORTS_PATH, exist_ok=True)
    filepath = f"{REPORTS_PATH}/{filename}"
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
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
    pdf_status = df_status_dist.toPandas()
    pdf_status.to_csv(f"{REPORTS_PATH}/tendencias_estados.csv", index=False)
    status_dist_str = "seccion,status,total,pct\n" + \
        "\n".join(f"distribucion_estados,{r['status']},{r['total']},{r['pct']}"
                  for _, r in pdf_status.iterrows())

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
    pdf_party = df_avg_party.toPandas()
    pdf_party.to_csv(f"{REPORTS_PATH}/tendencias_avg_party.csv", index=False)
    avg_party_str = "\n\nseccion,restaurant_name,avg_party_size,total_reservations\n" + \
        "\n".join(f"avg_party_rest,{r['restaurant_name']},{r['avg_party_size']},{r['total_reservations']}"
                  for _, r in pdf_party.iterrows())

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
    pdf_cat = df_cat_offering.toPandas()
    pdf_cat.to_csv(f"{REPORTS_PATH}/tendencias_categorias.csv", index=False)
    cat_offering_str = "\n\nseccion,category_name,total_menus,total_occurrences,avg_price\n" + \
        "\n".join(f"cat_ofertadas,{r['category_name']},{r['total_menus']},{r['total_occurrences']},{r['avg_price']}"
                  for _, r in pdf_cat.iterrows())

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
    pdf_rank = df_ranking.toPandas()
    pdf_rank.to_csv(f"{REPORTS_PATH}/tendencias_ranking.csv", index=False)
    ranking_str = "\n\nseccion,restaurant_name,total_reservations,avg_party,completion_rate_pct\n" + \
        "\n".join(f"ranking_rest,{r['restaurant_name']},{r['total_reservations']},{r['avg_party']},{r['completion_rate_pct']}"
                  for _, r in pdf_rank.iterrows())

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
    pdf_hour = df_by_hour.toPandas()
    pdf_hour.to_csv(f"{REPORTS_PATH}/horarios_por_hora.csv", index=False)
    by_hour_str = "seccion,hour_of_day,total_reservations,avg_party,pct\n" + \
        "\n".join(f"por_hora,{r['hour_of_day']},{r['total_reservations']},{r['avg_party']},{r['pct']}"
                  for _, r in pdf_hour.iterrows())

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
    pdf_dow = df_by_dow.toPandas()
    pdf_dow["day_name"] = pdf_dow["day_of_week"].map(day_names)
    pdf_dow[["day_name", "total_reservations", "avg_party"]].to_csv(
        f"{REPORTS_PATH}/horarios_por_dia.csv", index=False)
    by_dow_str = "\n\nseccion,day_name,total_reservations,avg_party\n" + \
        "\n".join(f"por_dia,{r['day_name']},{r['total_reservations']},{r['avg_party']}"
                  for _, r in pdf_dow.iterrows())

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
    pdf_peak[["day_name", "hour_of_day", "total_reservations"]].to_csv(
        f"{REPORTS_PATH}/horarios_ventanas_pico.csv", index=False)
    peak_str = "\n\nseccion,day_name,hour_of_day,total_reservations\n" + \
        "\n".join(f"ventana_pico,{r['day_name']},{r['hour_of_day']},{r['total_reservations']}"
                  for _, r in pdf_peak.iterrows())

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

    pdf_growth = df_growth.toPandas()
    pdf_growth.to_csv(f"{REPORTS_PATH}/crecimiento_mensual.csv", index=False)
    monthly_str = "seccion,year,month,total_reservations,total_guests,prev_month_reservations,growth_pct,moving_avg_3m\n" + \
        "\n".join(f"crecimiento_mensual,{r['year']},{r['month']},{r['total_reservations']},{r['total_guests']},{r['prev_month_reservations']},{r['growth_pct']},{r['moving_avg_3m']}"
                  for _, r in pdf_growth.iterrows())

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
    write_report_csv(
        "analisis_tendencias_consumo.csv",
        consumo
    )

    # ─── Reporte 2: Horarios pico ────────────────────────────────────────
    print("\n--- Reporte: Horarios Pico ---")
    picos = analyze_peak_hours(spark)
    write_report_csv(
        "analisis_horarios_pico.csv",
        picos
    )

    # ─── Reporte 3: Crecimiento mensual ──────────────────────────────────
    print("\n--- Reporte: Crecimiento Mensual ---")
    crecimiento = analyze_monthly_growth(spark)
    write_report_csv(
        "analisis_crecimiento_mensual.csv",
        crecimiento
    )

    print("\n" + "=" * 60)
    print("TRANSFORM completado exitosamente.")
    print(f"  Reportes en: {REPORTS_PATH}")
    print("=" * 60)

    spark.stop()


if __name__ == "__main__":
    main()
