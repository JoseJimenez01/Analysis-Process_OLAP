// ============================================================
// Queries – Co-purchases, Recommendations & Delivery Routes
// ============================================================

// ---------------------------------------------------------------
// Q1: Top 5 most frequently co-purchased products
// ---------------------------------------------------------------
// Exploits the pre-computed CO_PURCHASED_WITH relationship.
// Returns pairs (product_a, product_b) sorted by co-occurrence.
//
MATCH (p1:Product)-[r:CO_PURCHASED_WITH]->(p2:Product)
RETURN p1.name      AS product_a,
       p2.name      AS product_b,
       r.weight     AS times_bought_together
ORDER BY r.weight DESC
LIMIT 5;

// Alternative (on-the-fly, without pre-computed edges):
//
// MATCH (o:Order)-[:CONTAINS]->(p1:Product)
// MATCH (o)-[:CONTAINS]->(p2:Product)
// WHERE p1 <> p2
// WITH p1, p2, count(DISTINCT o) AS freq
// RETURN p1.name AS product_a, p2.name AS product_b, freq
// ORDER BY freq DESC
// LIMIT 5;

// ---------------------------------------------------------------
// Q2: Users who recommend others (influencer ranking)
// ---------------------------------------------------------------
// (a) Top recommenders — users with the highest out-degree
//
MATCH (u:User)-[:RECOMMENDS]->(recommended:User)
RETURN u.name            AS recommender,
       count(recommended) AS users_recommended,
       collect(recommended.name) AS recommended_list
ORDER BY users_recommended DESC;

// (b) Most recommended users — highly influential (high in-degree)
//
MATCH (recommender:User)-[:RECOMMENDS]->(u:User)
RETURN u.name                AS user,
       count(recommender)     AS recommended_by_count,
       collect(recommender.name) AS recommended_by
ORDER BY recommended_by_count DESC;

// (c) Recommendation chain — who influenced whom
//
MATCH path = (a:User)-[:RECOMMENDS*1..4]->(b:User)
WHERE a <> b
RETURN [n IN nodes(path) | n.name] AS chain,
       length(path)                  AS depth
ORDER BY depth DESC;

// ---------------------------------------------------------------
// Q3: Shortest paths between locations (delivery route optimisation)
// ---------------------------------------------------------------
// (a) Shortest route by distance (km) — Hub Central → Casa Luis
//
MATCH (start:Location {id: 'l1'}), (end:Location {id: 'l10'})
MATCH path = shortestPath((start)-[:ROAD_TO*]-(end))
WITH path,
     reduce(total = 0, r IN relationships(path) | total + r.distance_km) AS distance_km
RETURN distance_km,
       [n IN nodes(path) | n.name] AS route
ORDER BY distance_km
LIMIT 1;

// (b) Shortest route by time (min) — Zona 10 Burger → Casa Valentina
//
MATCH path = shortestPath(
  (start:Location {id: 'l3'})-[:ROAD_TO*]->(end:Location {id: 'l11'})
)
WITH path,
     reduce(total = 0, r IN relationships(path) | total + r.time_min) AS total_minutes
RETURN [n IN nodes(path) | n.name]     AS route,
       total_minutes                   AS estimated_time_min
ORDER BY total_minutes
LIMIT 1;

// (c) Delivery route pass — find the best restaurant to fulfill
//     an order for a given customer, minimising distance
//
MATCH (r:Restaurant)-[:LOCATED_AT]->(rl:Location)
MATCH (u:User {name: 'Carlos López'})-[:LIVES_AT]->(cl:Location)
MATCH route = shortestPath((rl)-[:ROAD_TO*]->(cl))
WITH r.name AS restaurant,
     reduce(d = 0, rel IN relationships(route) | d + rel.distance_km) AS distance_km,
     reduce(t = 0, rel IN relationships(route) | t + rel.time_min)    AS time_min
RETURN restaurant, distance_km, time_min
ORDER BY distance_km
LIMIT 3;

// (d) Nearest hub to each restaurant (radius query)
//
MATCH (hub:Location {type: 'hub'})
MATCH (rest_loc:Location {type: 'restaurant'})
WHERE distance(
  point({latitude: hub.lat, longitude: hub.lng}),
  point({latitude: rest_loc.lat, longitude: rest_loc.lng})
) < 5000
RETURN hub.name      AS hub,
       rest_loc.name AS restaurant_location,
       round(distance(
         point({latitude: hub.lat, longitude: hub.lng}),
         point({latitude: rest_loc.lat, longitude: rest_loc.lng})
       ) / 1000, 2) AS distance_km
ORDER BY distance_km;


