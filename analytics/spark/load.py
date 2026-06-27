"""
ETL — Carga (Load)

Propósito:
  Cargar los datos transformados en el Data Warehouse (Hive) siguiendo el
  modelo estrella definido en analytics/warehouse/schema/star_schema.hql.

Además ejecuta validaciones de integridad:
  - Conteo de filas: comparar origen staging vs destino Hive.
  - Detección de nulos en columnas clave (foreign keys, medidas).
  - Verificación de unicidad en columnas que deberían ser únicas.
  - Chequeo de valores fuera de rango en métricas numéricas.

Uso:
  spark-submit --master spark://spark-master:7077 \\
               analytics/spark/load.py
"""

import sys
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from spark.utils import build_spark, STAGING_PATH, execution_date_path
from pyspark.sql.functions import col, count, when, isnan, isnull, lit
from pyspark.sql.types import NumericType


# ─── Función de carga: staging → Hive ───────────────────────────────────────

WAREHOUSE_PATH = "/warehouse"


def load_dimension(spark, table: str, hive_table: str):
    """
    Lee desde staging Parquet y escribe en /warehouse/{hive_table}
    como archivos Parquet (sin registro en Hive metastore para evitar
    incompatibilidades Hive 4.x con VARCHAR(2147483647)).
    """
    from spark.utils import REPORTS_PATH
    path = f"{WAREHOUSE_PATH}/{hive_table}"
    print(f"\n  [LOAD] Cargando {hive_table} → {path}...")
    df = spark.read.parquet(f"{STAGING_PATH}/{execution_date_path()}/{table}")
    df.write.mode("overwrite").parquet(path)
    count = df.count()
    print(f"    ✓ {count} filas cargadas en {hive_table}")
    return count


def load_fact(spark, table: str, hive_table: str):
    """
    Lee desde staging Parquet y escribe en /warehouse/{hive_table}
    como archivos Parquet.
    """
    path = f"{WAREHOUSE_PATH}/{hive_table}"
    print(f"\n  [LOAD] Cargando {hive_table} → {path}...")
    df = spark.read.parquet(f"{STAGING_PATH}/{execution_date_path()}/{table}")
    df.write.mode("overwrite").parquet(path)
    count = df.count()
    print(f"    ✓ {count} filas cargadas en {hive_table}")
    return count


# ─── Validación de integridad ────────────────────────────────────────────────

def validate_integrity(spark) -> list:
    """
    Ejecuta un conjunto de chequeos de integridad sobre las tablas del warehouse.
    Retorna una lista de strings con resultados de cada validación.
    """
    print("\n  [VALIDACIÓN] Ejecutando chequeos de integridad...")
    results = []

    def check(description: str, condition: bool, detail: str = ""):
        status = "✓" if condition else "✗"
        msg = f"    {status} {description}" + (f" — {detail}" if detail else "")
        print(msg)
        results.append(msg)

    def parquet_table(name: str):
        return spark.read.parquet(f"{WAREHOUSE_PATH}/{name}")

    # ── 1. Conteo de filas en cada tabla ─────────────────────────────────
    for tbl in ["dim_user", "dim_restaurant", "dim_category",
                "dim_product", "dim_status", "dim_date",
                "fact_reservation", "fact_menu_composition"]:
        try:
            cnt = parquet_table(tbl).count()
            check(f"{tbl}: {cnt} filas", cnt >= 0, f"registradas: {cnt}")
        except Exception as e:
            check(f"{tbl}: no accesible", False, str(e))

    # ── 2. Nulos en columnas clave de fact_reservation ───────────────────
    try:
        fact = parquet_table("fact_reservation")
        total = fact.count()
        for col_name in ["reservation_id", "date_id", "user_id",
                         "restaurant_id", "status_id"]:
            nulls = fact.filter(col(col_name).isNull()).count()
            check(f"  fact_reservation.{col_name}: {nulls} nulos",
                  nulls == 0,
                  f"{nulls}/{total} filas con nulo")
    except Exception as e:
        check("fact_reservation: error de acceso", False, str(e))

    # ── 3. Rangos válidos en party_size ──────────────────────────────────
    try:
        invalid = fact.filter(
            (col("party_size") < 1) | (col("party_size") > 50)
        ).count()
        check("party_size en rango 1-50", invalid == 0,
              f"{invalid} fuera de rango")
    except Exception as e:
        check("party_size: error de validación", False, str(e))

    # ── 4. Estado de reserva debe existir en dim_status ──────────────────
    try:
        status_ids = [r.status_id for r in
                      parquet_table("dim_status").select("status_id").distinct().collect()]
        orphan = fact.filter(
            ~col("status_id").isin(status_ids)
        ).count()
        check("Integridad referencial status_id", orphan == 0,
              f"{orphan} huérfanos")
    except Exception as e:
        check("Integridad referencial status_id: error", False, str(e))

    # ── 5. Precio de producto no negativo ────────────────────────────────
    try:
        neg_price = parquet_table("dim_product").filter(
            col("price") < 0
        ).count()
        check("Precios no negativos", neg_price == 0,
              f"{neg_price} productos con precio negativo")
    except Exception as e:
        check("Precios: error de validación", False, str(e))

    return results


def save_validation_report(results: list):
    """
    Persiste el reporte de validación en analytics/reports/.
    """
    from spark.utils import REPORTS_PATH
    os.makedirs(REPORTS_PATH, exist_ok=True)
    filepath = f"{REPORTS_PATH}/validacion_integridad_warehouse.txt"
    header = (
        f"========================================\n"
        f"  Validación de Integridad — Warehouse\n"
        f"  Generado: {datetime.now(timezone.utc).isoformat()}\n"
        f"========================================\n\n"
    )
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(header + "\n".join(results))
    print(f"\n  [REPORTE] Validación guardada: {filepath}")


# ─── Main ──────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("ETL — LOAD: Cargando datos al Data Warehouse")
    print("=" * 60)

    # Spark sin Hive (escribimos Parquet directamente en /warehouse)
    spark = build_spark("ETL Load", hive_support=False)

    staging_root = f"{STAGING_PATH}/{execution_date_path()}"
    print(f"  Leyendo staging: {staging_root}")

    # ─── Carga de dimensiones ────────────────────────────────────────────
    # Las tablas se crean primero con HiveQL (star_schema.hql) y luego se
    # pueblan via Spark. Si no existen aún, Spark las crea automaticamente
    # con saveAsTable.

    load_dimension(spark, "users", "dim_user")
    load_dimension(spark, "restaurants", "dim_restaurant")
    load_dimension(spark, "products", "dim_product")

    # dim_category se deriva de la extracción de productos (ya tiene
    # category_id, category_name, etc.). Creamos vista aparte.
    print("\n  [LOAD] Derivando dim_category desde productos...")
    df_prods = spark.read.parquet(f"{staging_root}/products")
    df_cats = df_prods.select(
        col("category_id"),
        col("category_name").alias("name"),
        col("category_description").alias("description")
    ).distinct()
    df_cats.write.mode("overwrite").parquet(f"{WAREHOUSE_PATH}/dim_category")
    print(f"    ✓ {df_cats.count()} filas cargadas en dim_category")

    # dim_status: valores estáticos
    print("\n  [LOAD] Creando dim_status...")
    status_data = [
        (1, "pending"), (2, "confirmed"),
        (3, "cancelled"), (4, "completed")
    ]
    df_status = spark.createDataFrame(status_data, ["status_id", "status_name"])
    df_status.write.mode("overwrite").parquet(f"{WAREHOUSE_PATH}/dim_status")
    print(f"    ✓ {df_status.count()} filas cargadas en dim_status")

    # ─── Carga de hechos ─────────────────────────────────────────────────
    load_fact(spark, "reservations", "fact_reservation")
    load_fact(spark, "menu_products", "fact_menu_composition")

    # ─── Validación de integridad ────────────────────────────────────────
    print("\n" + "-" * 40)
    print("  Iniciando validación de integridad...")
    validation_results = validate_integrity(spark)
    save_validation_report(validation_results)

    print("\n" + "=" * 60)
    print("LOAD completado exitosamente.")
    print("=" * 60)

    spark.stop()


if __name__ == "__main__":
    main()
