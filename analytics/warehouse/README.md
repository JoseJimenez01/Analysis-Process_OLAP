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

## Archivos

```
analytics/warehouse/
├── README.md
└── schema/
    ├── star_schema.hql    # DDL dimensiones + hechos
    ├── olap_cubes.hql     # 6 vistas OLAP con GROUPING SETS
    └── load_data.hql      # Scripts de carga
```
