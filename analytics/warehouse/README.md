# Data Warehouse — PY01 Restaurantes

## Arquitectura

Motor: **Apache Hive 4.0** vía HiveServer2 (JDBC en puerto `10000`).
Almacenamiento: texto plano montado en `/warehouse/` (bind mount a `./analytics/warehouse`).
Metastore: PostgreSQL independiente (`py01_hive_metastore_db:5432`).

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│  API Service  │───▶│  HiveServer2     │◀───│  Beeline CLI  │
│  (Postgres)   │    │  (py01:10000)    │    │  (JDBC/ODBC)  │
└──────────────┘    ├──────────────────┤    └──────────────┘
                    │  Hive Metastore  │
                    │  (py01:9083)     │
                    ├──────────────────┤
                    │  Metastore DB    │
                    │  (PostgreSQL)    │
                    └──────────────────┘
```

## Esquema Estrella

### Dimensiones

| Tabla | Grano | Columnas clave |
|-------|-------|----------------|
| `dim_date` | 1 fila/día | date_id, year, quarter, month, week, day, is_weekend |
| `dim_user` | 1 fila/usuario | user_id, name, email, role |
| `dim_restaurant` | 1 fila/restaurante | restaurant_id, name, city, rating |
| `dim_category` | 1 fila/categoría | category_id, name |
| `dim_product` | 1 fila/producto | product_id, name, price, category_id, category_name |
| `dim_status` | 1 fila/estado | status_id, status_name (pending/confirmed/cancelled/completed) |

### Tablas de Hechos

| Tabla | Grano | Métricas |
|-------|-------|----------|
| `fact_reservation` | 1 fila/reserva | party_size, reservation_count |
| `fact_menu_composition` | 1 fila/producto-en-menú | product_price, display_order |

## Cubos OLAP (6 vistas)

| Vista | Ejes de análisis | Métricas |
|-------|------------------|----------|
| `cube_reservations_by_time` | año, trimestre, mes, semana, día, fin de semana | total_reservations, avg_party_size, total_guests |
| `cube_reservations_by_location` | ciudad, restaurante, año, mes | total_reservations, total_guests, unique_customers |
| `cube_reservations_by_status` | estado, año, mes | total_reservations, avg_party_size |
| `cube_product_category_offering` | categoría, ciudad, restaurante | total_products, avg_price, min/max price |
| `cube_user_frequency` | rol, usuario, año | total_reservations, avg_party_size, distinct_restaurants, engagement_score |
| `cube_restaurant_performance` | restaurante, año, mes | total_reservations, total_guests, unique_customers, completion_rate |

## Uso

```bash
# Conectarse a HiveServer2
docker compose exec hive-server beeline -u jdbc:hive2://localhost:10000

# Ejecutar DDL del esquema
docker compose exec hive-server beeline -u jdbc:hive2://localhost:10000 \
  -f /warehouse/schema/star_schema.hql

# Crear vistas OLAP
docker compose exec hive-server beeline -u jdbc:hive2://localhost:10000 \
  -f /warehouse/schema/olap_cubes.hql

# Consultar un cubo
docker compose exec hive-server beeline -u jdbc:hive2://localhost:10000 \
  -e "SELECT * FROM cube_reservations_by_time WHERE year = 2024;"
```

## Carga de datos

1. Exportar datos desde PostgreSQL a CSV en `analytics/warehouse/staging/`
2. Ejecutar `load_data.hql` desde HiveServer2
3. Los archivos CSV deben seguir el orden de columnas de cada tabla externa

Alternativa JDBC: Hive soporta `JdbcStorageHandler` para leer directamente de PostgreSQL (ver comentarios en `load_data.hql`).

## ETL con Spark (Airflow DAG)

El pipeline ETL completo se ejecuta via Airflow (`http://localhost:8080`, admin/admin):

### Fases

1. **Extract** (`analytics/spark/extract.py`): Lectura JDBC desde PostgreSQL con
   particionamiento por columna numérica (party_size, price) para paralelizar la
   extracción de grandes volúmenes. Transformación a Parquet columnar en staging.

2. **Transform** (`analytics/spark/transform.py`): Análisis de negocio con
   Spark DataFrames + SparkSQL:
   - Tendencias de consumo (ranking de productos, categorías, restaurantes)
   - Horarios pico (distribución por hora y día de la semana)
   - Crecimiento mensual (MoM, media móvil 3 meses)
   - Reportes TXT guardados en `analytics/reports/`

3. **Load** (`analytics/spark/load.py`): Carga en tablas Hive del warehouse
   (dimensiones + hechos) y ejecuta validación de integridad:
   - Conteo de filas origen vs destino
   - Detección de nulos en FK y métricas
   - Verificación de rangos y referencias huérfanas
   - Reporte TXT en `analytics/reports/validacion_integridad_warehouse.txt`

4. **Reindex** (`analytics/spark/reindex.py`): Reindexación del catálogo de
   productos en Elasticsearch para mantener sincronizado el motor de búsqueda.

5. **Export Reportes CSV** (`analytics/superset/export_reports.py`): Conecta a
   Hive via PyHive y genera 3 archivos CSV en `analytics/reports/`:
   - `ingresos_por_mes_categoria.csv`
   - `actividad_clientes_zona.csv`
   - `pedidos_completados_vs_cancelados.csv`

### Ejecución manual

```bash
# Extraer datos desde PostgreSQL hacia staging/
docker compose exec spark-master spark-submit --master spark://spark-master:7077 \
  --packages org.postgresql:postgresql:42.7.1 \
  /opt/spark/analytics/extract.py

# Transformar y generar reportes
docker compose exec spark-master spark-submit --master spark://spark-master:7077 \
  /opt/spark/analytics/transform.py

# Cargar en Hive y validar
docker compose exec spark-master spark-submit --master spark://spark-master:7077 \
  /opt/spark/analytics/load.py

# Reindexar productos en Elasticsearch
docker compose exec spark-master spark-submit --master spark://spark-master:7077 \
  --packages org.postgresql:postgresql:42.7.1,org.elasticsearch:elasticsearch-spark-30_2.12:8.15.5 \
  /opt/spark/analytics/reindex.py

# Exportar reportes CSV (ingresos, actividad, estados)
docker compose exec superset python /app/export_reports.py
```

### DAG programado

El DAG `etl_pipeline` en Airflow ejecuta las 5 fases secuencialmente
(extract → transform → load → reindex → export_reports) cada día a las 02:00 AM.

## Apache Superset (BI)

Acceso: `http://localhost:8088` (admin/admin)

Superset se conecta a:
- **Hive (Data Warehouse)**: Consultas SQL sobre el modelo estrella
- **PostgreSQL (OLTP)**: Datos transaccionales en vivo

### Conexiones automáticas

```bash
docker compose exec superset python /app/init_superset.py
```

Esto registra las bases de datos Hive y PostgreSQL en Superset para crear
dashboards desde la UI.

### Reportes CSV exportados

El script `export_reports.py` genera 3 CSVs consultando Hive:

| Archivo | Contenido |
|---------|-----------|
| `ingresos_por_mes_categoria.csv` | Ingreso estimado por mes y categoría de producto |
| `actividad_clientes_zona.csv` | Reservas, clientes únicos y tasa de completados por restaurante |
| `pedidos_completados_vs_cancelados.csv` | Proporción completados/cancelados por mes |

## Archivos

```
analytics/
├── airflow/dag/
│   └── etl_pipeline.py          # DAG programado (diario 2 AM)
├── spark/
│   ├── utils.py                 # SparkSession factory, paths, configuración
│   ├── extract.py               # Extracción JDBC → Parquet staging
│   ├── transform.py             # Análisis → TXT reports
│   ├── load.py                  # Carga Hive + validación
│   └── reindex.py               # Reindexación Elasticsearch
├── superset/
│   ├── superset_config.py       # Configuración de Superset
│   ├── init_superset.py         # Init de conexiones a BD
│   └── export_reports.py        # Exporta CSVs de análisis (ingresos, actividad, estados)
├── warehouse/
│   ├── README.md
│   └── schema/
│       ├── star_schema.hql      # DDL dimensiones + hechos
│       ├── olap_cubes.hql       # 6 vistas OLAP con GROUPING SETS
│       └── load_data.hql        # Scripts de carga (legacy)
└── reports/                     # Reportes TXT/CSV de Transform + Export
```
