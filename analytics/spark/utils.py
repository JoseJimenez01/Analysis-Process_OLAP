"""
Utilidades compartidas para los jobs ETL de Spark.

Proporciona:
  - Creación unificada de SparkSession con soporte Hive y PostgreSQL.
  - Conexión JDBC a la base transaccional PostgreSQL.
  - Paths constantes para staging, reports y warehouse.
  - Fechas de ejecución para particionamiento de datos extraídos.
"""

import os
from datetime import datetime, timezone

from pyspark.sql import SparkSession


# ─── Paths ───────────────────────────────────────────────────────────────────
# Directorio raíz de analytics (montado en contenedores como /analytics)
ANALYTICS_ROOT = os.environ.get(
    "ANALYTICS_ROOT",
    "/analytics"  # valor por defecto dentro de contenedores Docker
)

# Staging: datos crudos extraídos en formato Parquet particionado
STAGING_PATH = f"{ANALYTICS_ROOT}/spark/staging"

# Reports: análisis de tendencias generados como TXT
REPORTS_PATH = f"{ANALYTICS_ROOT}/reports"

# ─── Conexiones a base transaccional ─────────────────────────────────────────
# Se esperan en variables de entorno o se usan defaults para el entorno Docker
JDBC_URL = os.environ.get(
    "ETL_JDBC_URL",
    "jdbc:postgresql://postgres:5432/airflow"
)
JDBC_USER = os.environ.get("ETL_JDBC_USER", "postgres")
JDBC_PASSWORD = os.environ.get("ETL_JDBC_PASSWORD", "postgres")
JDBC_DRIVER = "org.postgresql.Driver"

# Paquete Maven del driver PostgreSQL para spark-submit --packages
JDBC_PACKAGE = "org.postgresql:postgresql:42.7.1"

# ─── Hive Metastore ──────────────────────────────────────────────────────────
HIVE_METASTORE_URIS = os.environ.get(
    "HIVE_METASTORE_URIS",
    "thrift://hive-metastore:9083"
)

# ─── Elasticsearch ───────────────────────────────────────────────────────────
ELASTICSEARCH_HOST = os.environ.get("ELASTICSEARCH_HOST", "elasticsearch")
ELASTICSEARCH_PORT = os.environ.get("ELASTICSEARCH_PORT", "9200")
ELASTICSEARCH_INDEX = "products"

# Paquete Maven para elasticsearch-hadoop connector
ES_PACKAGE = "org.elasticsearch:elasticsearch-spark-30_2.12:8.15.5"


# ─── SparkSession factory ────────────────────────────────────────────────────

def build_spark(app_name: str, hive_support: bool = False) -> SparkSession:
    """
    Crea y retorna una SparkSession configurada.

    Parameters
    ----------
    app_name : str
        Nombre descriptivo de la aplicación Spark.
    hive_support : bool
        Si True, habilita el soporte Hive (lectura/escritura en tablas Hive)
        y conecta con el Metastore configurado.

    Returns
    -------
    SparkSession
    """
    builder = SparkSession.builder.appName(app_name)

    if hive_support:
        # Habilita Hive y apunta al Metastore para resolver tablas del warehouse
        builder = builder \
            .config("spark.sql.catalogImplementation", "hive") \
            .config("hive.metastore.uris", HIVE_METASTORE_URIS) \
            .config("spark.sql.warehouse.dir", "/warehouse") \
            .enableHiveSupport()

    # Configuración general de performance para ETL
    builder = builder \
        .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer") \
        .config("spark.sql.adaptive.enabled", "true") \
        .config("spark.sql.adaptive.coalescePartitions.enabled", "true")

    if hive_support:
        # Evita que Spark genere VARCHAR(2147483647) al escribir en Hive;
        # Hive 4.x rechaza longitudes > 65535.
        builder = builder \
            .config("spark.sql.hive.convertMetastoreParquet", "false")

    return builder.getOrCreate()


# ─── Fecha de ejecución ──────────────────────────────────────────────────────

def execution_date() -> str:
    """
    Retorna la fecha UTC actual como string ISO (usada en particionamiento
    y nombres de archivos de reportes).
    """
    return datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M-%S")


def execution_date_path() -> str:
    """
    Retorna la partición de fecha para almacenamiento staging:
    year=YYYY/month=MM/day=DD
    """
    now = datetime.now(timezone.utc)
    return f"year={now.year}/month={now.month:02d}/day={now.day:02d}"
