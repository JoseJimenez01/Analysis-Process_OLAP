// ============================================================
// Queries – Delivery Route Optimisation (Nearest Neighbour)
// ============================================================
// Heurística: vecino más cercano (nearest neighbour) en Cypher
// puro, sin plugins GDS/APOC.
//
// Algoritmo:
//   1. Desde el hub del courier, ordenar destinos por
//      distancia creciente (shortestPath nativo).
//   2. Recorrer en ese orden, calculando el tramo entre
//      paradas consecutivas.
//   3. Acumular distancias y tiempos.
// ============================================================

// ---------------------------------------------------------------
// Q1: Ruta optimizada para UN courier (por ID)
// ---------------------------------------------------------------
// Devuelve cada tramo con: n° parada, pedido, cliente,
// ubicación de entrega, distancia del tramo, tiempo del tramo,
// distancia acumulada desde el hub.
//
MATCH (c:Courier {id: 'c1'})-[:HUB_AT]->(hub:Location)
MATCH (c)-[:ASSIGNED_TO]->(o:Order)-[:DELIVER_TO]->(dest:Location)
MATCH (u:User)-[:PURCHASED]->(o)

// Distancia del hub a cada destino
WITH c, hub, o, u, dest
MATCH to_hub = shortestPath((hub)-[:ROAD_TO*]-(dest))
WITH c, hub, o, u, dest,
     reduce(d = 0, r IN relationships(to_hub) | d + r.distance_km) AS hub_dist,
     reduce(t = 0, r IN relationships(to_hub) | t + r.time_min) AS hub_time

// Ordenar por vecino más cercano al hub (greedy)
ORDER BY hub_dist ASC, hub_time ASC

// Acumular en lista ordenada
WITH c, hub, collect({o: o, u: u, dest: dest, hdist: hub_dist, htime: hub_time}) AS stops

// Recorrer paradas consecutivas calculando tramos
UNWIND range(0, size(stops)-1) AS i
WITH c, stops, i,
     stops[i]    AS s,
     CASE WHEN i = 0 THEN hub ELSE stops[i-1].dest END AS prev,
     stops[i].dest AS curr_dest

MATCH leg = shortestPath((prev)-[:ROAD_TO*]-(curr_dest))
WITH c, s, i,
     reduce(d = 0, r IN relationships(leg) | d + r.distance_km) AS leg_km,
     reduce(t = 0, r IN relationships(leg) | t + r.time_min)    AS leg_min,
     s.hdist AS cumul_km,
     s.htime AS cumul_min
WHERE leg_km IS NOT NULL

RETURN c.name                                    AS courier,
       i + 1                                     AS stop_no,
       s.o.id                                    AS order_id,
       s.u.name                                  AS customer,
       s.dest.name                               AS delivery_at,
       round(leg_km, 2)                          AS leg_km,
       round(leg_min, 1)                         AS leg_min,
       round(cumul_km, 2)                        AS cumul_km,
       round(cumul_min, 1)                       AS cumul_min
ORDER BY i;

// ---------------------------------------------------------------
// Q2: Rutas para TODOS los couriers (misma lógica, sin filtro)
// ---------------------------------------------------------------
MATCH (c:Courier)-[:HUB_AT]->(hub:Location)
MATCH (c)-[:ASSIGNED_TO]->(o:Order)-[:DELIVER_TO]->(dest:Location)
MATCH (u:User)-[:PURCHASED]->(o)

WITH c, hub, o, u, dest
MATCH to_hub = shortestPath((hub)-[:ROAD_TO*]-(dest))
WITH c, hub, o, u, dest,
     reduce(d = 0, r IN relationships(to_hub) | d + r.distance_km) AS hub_dist,
     reduce(t = 0, r IN relationships(to_hub) | t + r.time_min) AS hub_time
ORDER BY c.id, hub_dist ASC, hub_time ASC

WITH c, hub, collect({o: o, u: u, dest: dest, hdist: hub_dist, htime: hub_time}) AS stops
UNWIND range(0, size(stops)-1) AS i
WITH c, stops, i,
     stops[i]    AS s,
     CASE WHEN i = 0 THEN hub ELSE stops[i-1].dest END AS prev,
     stops[i].dest AS curr_dest

MATCH leg = shortestPath((prev)-[:ROAD_TO*]-(curr_dest))
WITH c, s, i,
     reduce(d = 0, r IN relationships(leg) | d + r.distance_km) AS leg_km,
     reduce(t = 0, r IN relationships(leg) | t + r.time_min)    AS leg_min,
     s.hdist AS cumul_km,
     s.htime AS cumul_min
WHERE leg_km IS NOT NULL

RETURN c.name                                    AS courier,
       i + 1                                     AS stop_no,
       s.o.id                                    AS order_id,
       s.u.name                                  AS customer,
       s.dest.name                               AS delivery_at,
       round(leg_km, 2)                          AS leg_km,
       round(leg_min, 1)                         AS leg_min,
       round(cumul_km, 2)                        AS cumul_km,
       round(cumul_min, 1)                       AS cumul_min
ORDER BY c.name, i;

// ---------------------------------------------------------------
// Q3: Resumen por courier
// ---------------------------------------------------------------
MATCH (c:Courier)-[:HUB_AT]->(hub:Location)
MATCH (c)-[:ASSIGNED_TO]->(o:Order)-[:DELIVER_TO]->(dest:Location)

WITH c, hub, o, dest
MATCH to_hub = shortestPath((hub)-[:ROAD_TO*]-(dest))
WITH c, hub, o, dest,
     reduce(d = 0, r IN relationships(to_hub) | d + r.distance_km) AS hub_dist
ORDER BY c.id, hub_dist ASC

WITH c, hub, collect(dest) AS ordered
UNWIND range(0, size(ordered)-1) AS i
WITH c, ordered, i,
     ordered[i] AS curr,
     CASE WHEN i = 0 THEN hub ELSE ordered[i-1] END AS prev

MATCH leg = shortestPath((prev)-[:ROAD_TO*]-(curr))
WITH c, i,
     reduce(d = 0, r IN relationships(leg) | d + r.distance_km) AS leg_km,
     reduce(t = 0, r IN relationships(leg) | t + r.time_min) AS leg_min
WHERE leg_km IS NOT NULL

WITH c,
     count(*)                                 AS total_stops,
     round(sum(leg_km), 2)                    AS total_km,
     round(sum(leg_min), 1)                   AS total_min,
     round(avg(leg_km), 2)                    AS avg_leg_km,
     round(max(leg_km), 2)                    AS max_leg_km

RETURN c.name                         AS courier,
       c.vehicle                       AS vehicle,
       total_stops                     AS deliveries,
       total_km,
       total_min,
       avg_leg_km,
       max_leg_km
ORDER BY total_km ASC;
