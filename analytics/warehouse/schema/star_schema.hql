-- ============================================================================
-- Star Schema — Data Warehouse PY01 Restaurantes
-- Motor: Apache Hive 4.0
-- Esquema estrella que consolida datos históricos de reservas, productos,
-- menús y usuarios para análisis OLAP.
-- ============================================================================

-- 1. Dimensión: Tiempo
-- Granularidad: 1 fila por día (2020-2030)
CREATE EXTERNAL TABLE IF NOT EXISTS dim_date (
    date_id         INT,
    full_date       STRING,
    year            INT,
    quarter         INT,
    month           INT,
    month_name      STRING,
    week_of_year    INT,
    day_of_month    INT,
    day_of_week     INT,
    day_name        STRING,
    is_weekend      BOOLEAN
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION '/warehouse/dim_date';

-- 2. Dimensión: Usuario
CREATE EXTERNAL TABLE IF NOT EXISTS dim_user (
    user_id         STRING,
    name            STRING,
    email           STRING,
    role            STRING
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION '/warehouse/dim_user';

-- 3. Dimensión: Restaurante (desnormalizada con ubicación)
CREATE EXTERNAL TABLE IF NOT EXISTS dim_restaurant (
    restaurant_id   STRING,
    name            STRING,
    address         STRING,
    city            STRING,
    phone           STRING,
    rating          DOUBLE
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION '/warehouse/dim_restaurant';

-- 4. Dimensión: Categoría de producto
CREATE EXTERNAL TABLE IF NOT EXISTS dim_category (
    category_id     STRING,
    name            STRING,
    description     STRING,
    icon            STRING
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION '/warehouse/dim_category';

-- 5. Dimensión: Producto (desnormalizada con categoría)
CREATE EXTERNAL TABLE IF NOT EXISTS dim_product (
    product_id      STRING,
    name            STRING,
    description     STRING,
    price           DECIMAL(10,2),
    category_id     STRING,
    category_name   STRING,
    available       BOOLEAN
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION '/warehouse/dim_product';

-- 6. Dimensión: Estado de reserva
CREATE EXTERNAL TABLE IF NOT EXISTS dim_status (
    status_id       INT,
    status_name     STRING
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION '/warehouse/dim_status';

-- 7. Tabla de Hechos: Reserva
-- Grano: 1 fila por reserva individual
CREATE EXTERNAL TABLE IF NOT EXISTS fact_reservation (
    reservation_id      STRING,
    date_id             INT,
    user_id             STRING,
    restaurant_id       STRING,
    status_id           INT,
    party_size          INT,
    reservation_count   INT
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION '/warehouse/fact_reservation';

-- 8. Tabla de Hechos: Composición de Menú
-- Grano: 1 fila por producto en un menú (puente menú-producto para análisis)
CREATE EXTERNAL TABLE IF NOT EXISTS fact_menu_composition (
    menu_id         STRING,
    menu_name       STRING,
    product_id      STRING,
    restaurant_id   STRING,
    category_id     STRING,
    product_price   DECIMAL(10,2),
    display_order   INT,
    menu_active     BOOLEAN
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION '/warehouse/fact_menu_composition';
