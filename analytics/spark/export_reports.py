import os
import sys
from datetime import datetime, timezone
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from spark.utils import build_spark, REPORTS_PATH
from pyspark.sql.functions import col, count, countDistinct, avg, round as spark_round, lit, when, sum as spark_sum

REPORTS_DIR = REPORTS_PATH

def _write_csv(df, filename):
    df.toPandas().to_csv(f"{REPORTS_DIR}/{filename}", index=False)
    cnt = df.count()
    print(f"  \u2713 {filename} ({cnt} filas)")

def main():
    print("=" * 60)
    print("SPARK — Exportando reportes analíticos desde Hive")
    print("=" * 60)
    spark = build_spark("Export Reports", hive_support=True)
    os.makedirs(REPORTS_DIR, exist_ok=True)

    fact = spark.table("fact_reservation")
    dim_date = spark.table("dim_date")
    dim_rest = spark.table("dim_restaurant")
    dim_cat = spark.table("dim_category")
    dim_status = spark.table("dim_status")

    # Reporte 1: Ingresos por mes y categoría
    r1 = fact.alias("fr").join(dim_date.alias("d"), col("fr.date_id") == col("d.date_id")) \
        .join(dim_rest.alias("dr"), col("fr.restaurant_id") == col("dr.restaurant_id")) \
        .crossJoin(dim_cat.alias("dc")) \
        .filter(col("fr.status_id") == 4) \
        .groupBy(col("d.year"), col("d.month"), col("dc.name").alias("categoria")) \
        .agg(
            count("fr.reservation_id").alias("total_reservas"),
            spark_round(avg("fr.party_size"), 1).alias("avg_comensales"),
            spark_round(count("fr.reservation_id") * avg("fr.party_size") * 25.0, 2).alias("ingreso_estimado_usd")
        ) \
        .orderBy(col("d.year"), col("d.month"), col("ingreso_estimado_usd").desc())
    _write_csv(r1, "ingresos_por_mes_categoria.csv")

    # Reporte 2: Actividad de clientes por zona
    r2 = fact.alias("fr").join(dim_rest.alias("dr"), col("fr.restaurant_id") == col("dr.restaurant_id")) \
        .groupBy(col("dr.name").alias("restaurante"), col("dr.address").alias("direccion")) \
        .agg(
            count("fr.reservation_id").alias("total_reservas"),
            countDistinct("fr.user_id").alias("clientes_unicos"),
            spark_round(avg("fr.party_size"), 1).alias("avg_comensales"),
            spark_round(
                count(when(col("fr.status_id") == 4, 1)) * 100.0 / count("*"), 1
            ).alias("tasa_completados_pct")
        ) \
        .orderBy(col("total_reservas").desc())
    _write_csv(r2, "actividad_clientes_zona.csv")

    # Reporte 3: Completados vs Cancelados
    from pyspark.sql import Window
    w = Window.partitionBy("year", "month")
    r3 = fact.alias("fr").join(dim_date.alias("d"), col("fr.date_id") == col("d.date_id")) \
        .join(dim_status.alias("ds"), col("fr.status_id") == col("ds.status_id")) \
        .filter(col("ds.status_name").isin("completed", "cancelled")) \
        .groupBy(col("d.year"), col("d.month"), col("ds.status_name").alias("estado")) \
        .agg(count("*").alias("total")) \
        .withColumn("porcentaje",
            spark_round(col("total") * 100.0 / spark_sum("total").over(w), 2))
    r3 = r3.orderBy(col("year"), col("month"), col("estado"))
    _write_csv(r3, "pedidos_completados_vs_cancelados.csv")

    spark.stop()
    print("\n" + "=" * 60)
    print(f"Reportes generados en {REPORTS_DIR}/")
    print("=" * 60)

if __name__ == "__main__":
    main()
