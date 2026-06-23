-- ============================================================================
-- OLAP Cubes / Vistas Analíticas — PY01 Restaurantes Data Warehouse
-- 6 cubos agregados por: tiempo, ubicación, categoría de producto,
-- frecuencia de usuario, rendimiento de restaurante y métricas diarias.
-- ============================================================================

-- 1. Cubo: Reservas por Tiempo
-- Jerarquía: año → mes → día
-- Métricas: total reservas, avg party_size, total comensales
CREATE VIEW IF NOT EXISTS cube_reservations_by_time AS
SELECT
    d.year,
    d.quarter,
    d.month,
    d.month_name,
    d.week_of_year,
    d.day_of_month,
    d.day_name,
    d.is_weekend,
    COUNT(f.reservation_id)     AS total_reservations,
    ROUND(AVG(f.party_size), 1) AS avg_party_size,
    SUM(f.party_size)           AS total_guests,
    SUM(f.reservation_count)    AS total_bookings
FROM fact_reservation f
JOIN dim_date d ON f.date_id = d.date_id
GROUP BY d.year, d.quarter, d.month, d.month_name, d.week_of_year,
         d.day_of_month, d.day_name, d.is_weekend
WITH CUBE;

-- 2. Cubo: Reservas por Ubicación (ciudad del restaurante)
-- Métricas: reservas, comensales, avg party size por ciudad
CREATE VIEW IF NOT EXISTS cube_reservations_by_location AS
SELECT
    r.city,
    r.name                          AS restaurant_name,
    d.year,
    d.month,
    d.month_name,
    COUNT(f.reservation_id)         AS total_reservations,
    SUM(f.party_size)               AS total_guests,
    ROUND(AVG(f.party_size), 1)     AS avg_party_size,
    COUNT(DISTINCT f.user_id)       AS unique_customers
FROM fact_reservation f
JOIN dim_restaurant r   ON f.restaurant_id = r.restaurant_id
JOIN dim_date d         ON f.date_id = d.date_id
GROUP BY r.city, r.name, d.year, d.month, d.month_name
GROUPING SETS (
    (r.city),
    (r.city, r.name),
    (r.city, d.year),
    (r.city, d.year, d.month),
    (d.year),
    ()
);

-- 3. Cubo: Reservas por Estado
-- Distribución de estados a lo largo del tiempo
CREATE VIEW IF NOT EXISTS cube_reservations_by_status AS
SELECT
    s.status_name,
    d.year,
    d.month,
    d.month_name,
    COUNT(f.reservation_id)     AS total_reservations,
    SUM(f.party_size)           AS total_guests,
    ROUND(AVG(f.party_size), 1) AS avg_party_size
FROM fact_reservation f
JOIN dim_status s   ON f.status_id = s.status_id
JOIN dim_date d     ON f.date_id = d.date_id
GROUP BY s.status_name, d.year, d.month, d.month_name
GROUPING SETS (
    (s.status_name),
    (s.status_name, d.year),
    (s.status_name, d.year, d.month),
    (d.year),
    ()
);

-- 4. Cubo: Oferta de Productos por Categoría
-- Análisis de la oferta: qué categorías de productos ofrecen los
-- restaurantes, cuántos productos por categoría, rango de precios.
CREATE VIEW IF NOT EXISTS cube_product_category_offering AS
SELECT
    dc.name                         AS category_name,
    dr.city                         AS restaurant_city,
    dr.name                         AS restaurant_name,
    COUNT(fmc.product_id)           AS total_products,
    ROUND(AVG(fmc.product_price),2) AS avg_product_price,
    MIN(fmc.product_price)          AS min_price,
    MAX(fmc.product_price)          AS max_price,
    COUNT(DISTINCT fmc.menu_id)     AS total_menus
FROM fact_menu_composition fmc
JOIN dim_category dc        ON fmc.category_id = dc.category_id
JOIN dim_restaurant dr      ON fmc.restaurant_id = dr.restaurant_id
GROUP BY dc.name, dr.city, dr.name
GROUPING SETS (
    (dc.name),
    (dc.name, dr.city),
    (dc.name, dr.city, dr.name),
    (dr.city),
    ()
);

-- 5. Cubo: Frecuencia de Usuarios
-- Comportamiento de clientes: usuarios más frecuentes, rol,
-- preferencias de tamaño de grupo.
CREATE VIEW IF NOT EXISTS cube_user_frequency AS
SELECT
    u.role,
    u.user_id,
    u.name                          AS user_name,
    d.year,
    COUNT(f.reservation_id)         AS total_reservations,
    SUM(f.party_size)               AS total_guests,
    ROUND(AVG(f.party_size), 1)     AS avg_party_size,
    COUNT(DISTINCT f.restaurant_id) AS distinct_restaurants_visited,
    ROUND(AVG(f.party_size) *
          COUNT(f.reservation_id), 0) AS engagement_score
FROM fact_reservation f
JOIN dim_user u ON f.user_id = u.user_id
JOIN dim_date d  ON f.date_id = d.date_id
GROUP BY u.role, u.user_id, u.name, d.year
GROUPING SETS (
    (u.role),
    (u.role, d.year),
    (u.user_id, u.name),
    (u.user_id, u.name, d.year),
    (d.year),
    ()
);

-- 6. Cubo: Rendimiento de Restaurantes
-- KPIs por restaurante: volumen de reservas, ocupación promedio,
-- calificación, estacionalidad.
CREATE VIEW IF NOT EXISTS cube_restaurant_performance AS
SELECT
    r.name                          AS restaurant_name,
    r.city,
    r.rating,
    d.year,
    d.month,
    d.month_name,
    COUNT(f.reservation_id)         AS total_reservations,
    SUM(f.party_size)               AS total_guests,
    ROUND(AVG(f.party_size), 1)     AS avg_party_size,
    COUNT(DISTINCT f.user_id)       AS unique_customers,
    COUNT(DISTINCT CASE WHEN f.status_id = 2 THEN f.reservation_id END)
                                    AS completed_reservations,
    ROUND(
        COUNT(DISTINCT CASE WHEN f.status_id = 2 THEN f.reservation_id END)
        / NULLIF(COUNT(f.reservation_id), 0) * 100, 1
    )                               AS completion_rate_pct
FROM fact_reservation f
JOIN dim_restaurant r   ON f.restaurant_id = r.restaurant_id
JOIN dim_date d         ON f.date_id = d.date_id
GROUP BY r.name, r.city, r.rating, d.year, d.month, d.month_name
GROUPING SETS (
    (r.name, r.city, r.rating),
    (r.name, r.city, r.rating, d.year),
    (r.name, r.city, r.rating, d.year, d.month),
    (d.year),
    ()
);
