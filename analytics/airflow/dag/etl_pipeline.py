"""
DAG — ETL Pipeline: Extract → Transform → Load → Reindex → Export

Propósito:
  Orquestar el pipeline ETL completo del Data Warehouse + exportación de
  reportes CSV. Se ejecuta diariamente a las 02:00 AM.

Dependencia entre tareas:
  extract >> transform >> load >> reindex >> export_reports

Cada tarea se ejecuta en modo bloqueante para garantizar consistencia.

Nota: Se usa BashOperator en lugar de SparkSubmitOperator para evitar la
dependencia del proveedor apache-airflow-providers-apache-spark.
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator


# ─── Argumentos por defecto ─────────────────────────────────────────────────
default_args = {
    "owner": "data_engineering",
    "depends_on_past": False,
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
    "execution_timeout": timedelta(hours=2),
}

# ─── DAG ────────────────────────────────────────────────────────────────────
with DAG(
    dag_id="etl_pipeline",
    description="Pipeline ETL: Extraer datos desde PostgreSQL, transformar, "
                "cargar en Hive y reindexar en Elasticsearch.",
    default_args=default_args,
    schedule="0 2 * * *",  # 02:00 AM todos los días
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=["etl", "spark", "hive", "elasticsearch"],
) as dag:

    # ─── Fase 1: Extract ────────────────────────────────────────────────
    # Lee desde PostgreSQL con JDBC, escribe Parquet en staging.
    extract = BashOperator(
        task_id="extract",
        bash_command=(
            "spark-submit --master spark://spark-master:7077 "
            "--packages org.postgresql:postgresql:42.7.1 "
            "/opt/airflow/spark/extract.py"
        ),
    )

    # ─── Fase 2: Transform ──────────────────────────────────────────────
    # Lee Parquet staging, genera reportes TXT en analytics/reports/.
    transform = BashOperator(
        task_id="transform",
        bash_command=(
            "spark-submit --master spark://spark-master:7077 "
            "/opt/airflow/spark/transform.py"
        ),
    )

    # ─── Fase 3: Load ───────────────────────────────────────────────────
    # Carga datos transformados en tablas Hive + valida integridad.
    load = BashOperator(
        task_id="load",
        bash_command=(
            "spark-submit --master spark://spark-master:7077 "
            "/opt/airflow/spark/load.py"
        ),
    )

    # ─── Fase 4: Reindex ────────────────────────────────────────────────
    # Sincroniza el catálogo de productos con Elasticsearch.
    reindex = BashOperator(
        task_id="reindex",
        bash_command=(
            "spark-submit --master spark://spark-master:7077 "
            "--packages org.postgresql:postgresql:42.7.1,"
            "org.elasticsearch:elasticsearch-spark-30_2.12:8.15.5 "
            "/opt/airflow/spark/reindex.py"
        ),
    )

    # ─── Fase 5: Export reportes CSV ────────────────────────────────────
    # Conecta a Hive via PyHive y genera los 3 CSVs de análisis.
    export_reports = BashOperator(
        task_id="export_reports",
        bash_command="python /opt/airflow/superset/export_reports.py",
    )

    # ─── Orden de ejecución ─────────────────────────────────────────────
    extract >> transform >> load >> reindex >> export_reports
