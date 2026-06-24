"""
ETL — Extracción (Extract)

Propósito:
  Extraer grandes volúmenes de datos desde la base transaccional PostgreSQL
  hacia archivos Parquet particionados en el directorio staging.

Estrategia de volumen:
  - Lectura JDBC con particionamiento por columna numérica (party_size para
    reservas, price para productos) para paralelizar la extracción.
  - Column pruning: solo se seleccionan las columnas necesarias para el
    warehouse, reduciendo transferencia de red.
  - Almacenamiento en Parquet (columnar, comprimido y splittable) con
    particionamiento por fecha de ejecución para facilitar reprocesos.

Tablas extraídas:
  - reservations (con JOIN a users y restaurants)
  - products (con JOIN a categories)
  - menus (con JOIN a restaurants)
  - menu_products (con JOIN a menus y products)
  - users y restaurants como dimensiones de referencia

Uso:
  spark-submit --master spark://spark-master:7077 \\
               --packages org.postgresql:postgresql:42.7.1 \\
               analytics/spark/extract.py
"""

import sys
import os

# Agrega el directorio analytics al path para importar utils
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from spark.utils import (
    build_spark, JDBC_URL, JDBC_USER, JDBC_PASSWORD, JDBC_DRIVER,
    STAGING_PATH, execution_date_path
)


# ─── Configuración de extracción ─────────────────────────────────────────────

# Columnas a extraer de cada tabla (column pruning).
# Se listan explícitamente para evitar traer datos innecesarios.

RESERVATIONS_QUERY = """
    SELECT
        r.id              AS reservation_id,
        r.reservation_date,
        r.party_size,
        r.status,
        r.special_requests,
        r.created_at      AS reservation_created_at,
        u.id              AS user_id,
        u.name            AS user_name,
        u.email           AS user_email,
        u.role            AS user_role,
        rest.id           AS restaurant_id,
        rest.name         AS restaurant_name,
        rest.address      AS restaurant_address,
        rest.phone        AS restaurant_phone,
        rest.rating       AS restaurant_rating
    FROM reservation r
    JOIN "user" u ON r.user_id = u.id
    JOIN restaurant rest ON r.restaurant_id = rest.id
"""

PRODUCTS_QUERY = """
    SELECT
        p.id              AS product_id,
        p.name            AS product_name,
        p.description     AS product_description,
        p.price,
        p.image_url,
        p.available,
        p.created_at      AS product_created_at,
        c.id              AS category_id,
        c.name            AS category_name,
        c.description     AS category_description,
        c.icon            AS category_icon
    FROM product p
    JOIN category c ON p.category_id = c.id
"""

MENUS_QUERY = """
    SELECT
        m.id              AS menu_id,
        m.name            AS menu_name,
        m.description     AS menu_description,
        m.active          AS menu_active,
        m.created_at      AS menu_created_at,
        rest.id           AS restaurant_id,
        rest.name         AS restaurant_name
    FROM menu m
    JOIN restaurant rest ON m.restaurant_id = rest.id
"""

MENU_PRODUCTS_QUERY = """
    SELECT
        mp.id             AS menu_product_id,
        mp.display_order,
        m.id              AS menu_id,
        m.name            AS menu_name,
        p.id              AS product_id,
        p.name            AS product_name,
        p.price           AS product_price,
        c.id              AS category_id,
        c.name            AS category_name
    FROM menu_product mp
    JOIN menu m ON mp.menu_id = m.id
    JOIN product p ON mp.product_id = p.id
    JOIN category c ON p.category_id = c.id
"""

USERS_QUERY = """
    SELECT id, name, email, role, created_at
    FROM "user"
"""

RESTAURANTS_QUERY = """
    SELECT id, name, address, phone, description, rating, created_at
    FROM restaurant
"""


def extract_table(
    spark, query: str, name: str, partition_col: str = None,
    lower_bound: int = 0, upper_bound: int = 10000, num_partitions: int = 4
):
    """
    Extrae una tabla vía JDBC con particionamiento opcional para paralelizar
    la lectura de grandes volúmenes.

    Parameters
    ----------
    spark : SparkSession
    query : str
        Consulta SQL a ejecutar en PostgreSQL (puede ser un subquery con alias).
    name : str
        Nombre descriptivo para logging.
    partition_col : str, opcional
        Columna numérica usada como clave de partición. Si es None, se lee
        en una sola partición.
    lower_bound, upper_bound : int
        Rango de valores de partition_col.
    num_partitions : int
        Cantidad de particiones Spark para paralelizar la lectura JDBC.
    """
    print(f"[EXTRACT] Extrayendo {name}...")

    reader = spark.read \
        .format("jdbc") \
        .option("url", JDBC_URL) \
        .option("driver", JDBC_DRIVER) \
        .option("user", JDBC_USER) \
        .option("password", JDBC_PASSWORD) \
        .option("query", query) \
        .option("fetchSize", "10000")  # filas por viaje JDBC (batch)

    if partition_col:
        reader = reader \
            .option("partitionColumn", partition_col) \
            .option("lowerBound", str(lower_bound)) \
            .option("upperBound", str(upper_bound)) \
            .option("numPartitions", str(num_partitions))

    df = reader.load()
    count = df.count()
    print(f"  → {count} filas extraídas de {name}")
    return df


def main():
    """
    Orquesta la extracción de todas las tablas transaccionales y las persiste
    en formato Parquet dentro de STAGING_PATH particionado por fecha.
    """
    print("=" * 60)
    print("ETL — EXTRACT: Iniciando extracción desde PostgreSQL")
    print("=" * 60)

    # Inicializa Spark sin soporte Hive (solo lectura JDBC)
    spark = build_spark("ETL Extract", hive_support=False)

    # Path de salida particionado por fecha de ejecución
    output_path = f"{STAGING_PATH}/{execution_date_path()}"
    print(f"  Salida staging: {output_path}")

    # ─── 1. Reservas (fact table principal) ──────────────────────────────
    # Se particiona por party_size (0-50) para distribuir la carga.
    df_reservations = extract_table(
        spark, RESERVATIONS_QUERY, "reservations",
        partition_col="party_size", lower_bound=0, upper_bound=50,
        num_partitions=6
    )
    df_reservations.write \
        .mode("overwrite") \
        .parquet(f"{output_path}/reservations")

    # ─── 2. Productos ────────────────────────────────────────────────────
    # Particionado por price (0-1000) para paralelizar.
    df_products = extract_table(
        spark, PRODUCTS_QUERY, "products",
        partition_col="price", lower_bound=0, upper_bound=1000,
        num_partitions=4
    )
    df_products.write \
        .mode("overwrite") \
        .parquet(f"{output_path}/products")

    # ─── 3. Menús ────────────────────────────────────────────────────────
    df_menus = extract_table(spark, MENUS_QUERY, "menus")
    df_menus.write \
        .mode("overwrite") \
        .parquet(f"{output_path}/menus")

    # ─── 4. Menu-Products (relación muchos-a-muchos) ────────────────────
    df_menu_products = extract_table(
        spark, MENU_PRODUCTS_QUERY, "menu_products",
        partition_col="display_order", lower_bound=0, upper_bound=100,
        num_partitions=4
    )
    df_menu_products.write \
        .mode("overwrite") \
        .parquet(f"{output_path}/menu_products")

    # ─── 5. Usuarios (dimensión de referencia) ──────────────────────────
    df_users = extract_table(spark, USERS_QUERY, "users")
    df_users.write \
        .mode("overwrite") \
        .parquet(f"{output_path}/users")

    # ─── 6. Restaurantes (dimensión de referencia) ──────────────────────
    df_restaurants = extract_table(spark, RESTAURANTS_QUERY, "restaurants")
    df_restaurants.write \
        .mode("overwrite") \
        .parquet(f"{output_path}/restaurants")

    print("=" * 60)
    print("EXTRACT completado exitosamente.")
    print(f"  Datos persistentes en: {output_path}")
    print("=" * 60)

    spark.stop()


if __name__ == "__main__":
    main()
