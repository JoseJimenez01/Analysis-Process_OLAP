"""
ETL — Reindexación en Elasticsearch (Reindex)

Propósito:
  Leer el catálogo de productos desde PostgreSQL y reindexarlo en Elasticsearch
  para mantener sincronizado el motor de búsqueda del servicio Search.

Estrategia:
  - Compara el conteo actual de productos en ES vs el origen para decidir si
    ejecutar un reindex completo o incremental.
  - Usa el conector elasticsearch-hadoop (elasticsearch-spark-30) para escribir
    desde un DataFrame Spark directamente a un índice ES.
  - El índice destino es `products` y se mapea con `product_id` como documento _id
    para evitar duplicados.

Uso:
  spark-submit --master spark://spark-master:7077 \\
               --packages org.postgresql:postgresql:42.7.1,\
                          org.elasticsearch:elasticsearch-spark-30_2.12:8.15.5 \\
               analytics/spark/reindex.py [--full]
  --full: Fuerza un reindex completo (borra y recrea el índice).
"""

import sys
import os
from argparse import ArgumentParser

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from spark.utils import (
    build_spark, JDBC_URL, JDBC_USER, JDBC_PASSWORD, JDBC_DRIVER,
    ES_URL
)


ES_INDEX = "products"
ES_QUERY = """
    SELECT
        p.id            AS product_id,
        p.name          AS product_name,
        p.description   AS product_description,
        p.price,
        p.image_url,
        p.available,
        c.id            AS category_id,
        c.name          AS category_name,
        c.icon          AS category_icon
    FROM product p
    JOIN category c ON p.category_id = c.id
"""


def count_es_products(spark) -> int:
    """Cuenta documentos en el índice ES products."""
    try:
        df = spark.read \
            .format("es") \
            .option("es.nodes", ES_URL.replace("http://", "")) \
            .option("es.resource", ES_INDEX) \
            .option("es.query", '{"query": {"match_all": {}}}') \
            .load()
        return df.count()
    except Exception:
        return 0


def delete_index_if_full(spark, full: bool):
    """Si --full, elimina el índice ES para una recarga completa."""
    if not full:
        return
    print(f"[REINDEX] Modo completo: eliminando índice {ES_INDEX}...")
    spark._jvm.org.elasticsearch.hadoop.cfg.ConfigurationOptions \
        .ES_RESOURCE = ES_INDEX
    spark._jsc.hadoopConfiguration().set("es.nodes", ES_URL.replace("http://", ""))
    spark._jsc.hadoopConfiguration().set("es.resource", ES_INDEX)
    try:
        spark._jvm.org.elasticsearch.spark.rdd.EsSpark \
            .deleteResources(spark._jsc, ES_INDEX)
        print(f"[REINDEX] Índice {ES_INDEX} eliminado.")
    except Exception as e:
        print(f"[REINDEX] No se pudo eliminar índice (puede no existir): {e}")


def reindex(spark, full: bool = False):
    """
    Reindexa productos desde PostgreSQL a Elasticsearch.

    Parameters
    ----------
    full : bool
        Si True, fuerza recarga completa; si False, solo si el conteo difiere.
    """
    print(f"[REINDEX] Leyendo productos desde PostgreSQL...")
    df_source = spark.read \
        .format("jdbc") \
        .option("url", JDBC_URL) \
        .option("driver", JDBC_DRIVER) \
        .option("user", JDBC_USER) \
        .option("password", JDBC_PASSWORD) \
        .option("query", ES_QUERY) \
        .load()

    source_count = df_source.count()
    print(f"[REINDEX] {source_count} productos en origen.")

    # Verificar si el reindex es necesario
    es_count = count_es_products(spark)
    print(f"[REINDEX] {es_count} documentos en Elasticsearch.")

    if not full and source_count == es_count:
        print("[REINDEX] Conteos coinciden, saltando reindex.")
        return

    # Si es full, limpiar índice primero
    if full:
        delete_index_if_full(spark, full)

    # Escribir DataFrame a Elasticsearch
    print(f"[REINDEX] Escribiendo {source_count} documentos a {ES_INDEX}...")
    df_source.write \
        .format("es") \
        .option("es.nodes", ES_URL.replace("http://", "")) \
        .option("es.resource", ES_INDEX) \
        .option("es.mapping.id", "product_id") \
        .option("es.write.operation", "upsert") \
        .mode("append") \
        .save()

    print(f"[REINDEX] Reindexación completada exitosamente.")


def main():
    parser = ArgumentParser(description="Reindexar productos en Elasticsearch")
    parser.add_argument("--full", action="store_true",
                        help="Forzar reindex completo (borra y recrea índice)")
    args = parser.parse_args()

    spark = build_spark("ETL Reindex", hive_support=False)

    print("=" * 60)
    print("ETL — REINDEX: Sincronizando catálogo con Elasticsearch")
    print("=" * 60)

    reindex(spark, full=args.full)

    print("=" * 60)
    print("REINDEX completado exitosamente.")
    print("=" * 60)

    spark.stop()


if __name__ == "__main__":
    main()
