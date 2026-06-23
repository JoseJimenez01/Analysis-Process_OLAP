-- ============================================================================
-- Carga de Datos — PY01 Restaurantes Data Warehouse
--
-- Estas consultas extraen datos desde PostgreSQL (vía el conector JDBC de
-- Hive) o desde archivos CSV/TSV. Se asume que los datos han sido exportados
-- desde la base operacional al directorio /warehouse/staging/.
--
-- Para una integración automatizada, reemplazar los LOAD DATA locales con
-- consultas INSERT desde una tabla externa JDBC apuntando a PostgreSQL.
-- ============================================================================

-- 1. Generar dimensión tiempo (2020-2030)
INSERT OVERWRITE TABLE dim_date
SELECT
    TRANSFORM(days.day)
    USING 'python3 -c "
import sys
from datetime import datetime, timedelta
for line in sys.stdin:
    day = int(line.strip())
    d = datetime(2020, 1, 1) + timedelta(days=day)
    print(f\"{d.strftime(\"%Y%m%d\")},{d.strftime(\"%Y-%m-%d\")},{d.year},{ (d.month-1)//3+1},{d.month},{d.strftime(\"%B\")},{d.isocalendar()[1]},{d.day},{d.weekday()},{d.strftime(\"%A\")},{'true' if d.weekday()>=5 else 'false'}\")
"'
FROM (SELECT STACK(4018, {days}) AS day) days;

-- 2. Cargar dimensión usuario (desde staging CSV)
LOAD DATA LOCAL INPATH '/warehouse/staging/dim_user.csv'
OVERWRITE INTO TABLE dim_user;

-- 3. Cargar dimensión restaurante
LOAD DATA LOCAL INPATH '/warehouse/staging/dim_restaurant.csv'
OVERWRITE INTO TABLE dim_restaurant;

-- 4. Cargar dimensión categoría
LOAD DATA LOCAL INPATH '/warehouse/staging/dim_category.csv'
OVERWRITE INTO TABLE dim_category;

-- 5. Cargar dimensión producto
LOAD DATA LOCAL INPATH '/warehouse/staging/dim_product.csv'
OVERWRITE INTO TABLE dim_product;

-- 6. Cargar dimensión estado
INSERT OVERWRITE TABLE dim_status
SELECT 1, 'pending'   UNION ALL
SELECT 2, 'confirmed' UNION ALL
SELECT 3, 'cancelled' UNION ALL
SELECT 4, 'completed';

-- 7. Cargar tabla de hechos: reservas
LOAD DATA LOCAL INPATH '/warehouse/staging/fact_reservation.csv'
OVERWRITE INTO TABLE fact_reservation;

-- 8. Cargar tabla de hechos: composición de menú
LOAD DATA LOCAL INPATH '/warehouse/staging/fact_menu_composition.csv'
OVERWRITE INTO TABLE fact_menu_composition;

-- 9. Ejemplo: extraer datos desde PostgreSQL (vía Hive JDBC storage handler)
-- Requiere: ADD JAR /warehouse/lib/postgresql-42.x.x.jar;
-- CREATE EXTERNAL TABLE staging_users STORED BY
--   'org.apache.hive.storage.jdbc.JdbcStorageHandler'
--   TBLPROPERTIES (
--     'hive.sql.database.type' = 'POSTGRES',
--     'hive.sql.jdbc.driver'   = 'org.postgresql.Driver',
--     'hive.sql.jdbc.url'      = 'jdbc:postgresql://postgres:5432/restaurantes',
--     'hive.sql.dbcp.username' = 'postgres',
--     'hive.sql.dbcp.password' = 'postgres',
--     'hive.sql.table'         = 'User'
--   );
-- INSERT OVERWRITE TABLE dim_user
-- SELECT id, name, email, role FROM staging_users;
