// ============================================================
// Schema – Graph Model for Users, Products, Orders & Routes
// ============================================================
// Constraints (run once)

CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE;
CREATE CONSTRAINT product_id IF NOT EXISTS FOR (p:Product) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT order_id   IF NOT EXISTS FOR (o:Order)   REQUIRE o.id IS UNIQUE;
CREATE CONSTRAINT location_id IF NOT EXISTS FOR (l:Location) REQUIRE l.id IS UNIQUE;

// ============================================================
// Node Labels & Properties
// ============================================================
//
// (:User {id, name, email, role})
// (:Product {id, name, price, category})
// (:Order {id, date, total})
// (:Location {id, name, lat, lng, type})   — type: 'hub' | 'customer' | 'restaurant'
// (:Restaurant {id, name, address})
//
// ============================================================
// Relationship Types
// ============================================================
//
// (u:User)-[:PURCHASED]->(o:Order)
//     —  user placed the order
//
// (o:Order)-[:CONTAINS {quantity, unit_price}]->(p:Product)
//     —  product line item in an order
//
// (u1:User)-[:RECOMMENDS]->(u2:User)
//     —  user referral / influence edge
//
// (p1:Product)-[:CO_PURCHASED_WITH {weight}]->(p2:Product)
//     —  pre-computed co-occurrence (weight = count of orders containing both)
//
// (l1:Location)-[:ROAD_TO {distance_km, time_min}]->(l2:Location)
//     —  directed weighted edge for route optimisation
//
// (r:Restaurant)-[:LOCATED_AT]->(l:Location)
//     —  restaurant geolocation
//
// (u:User)-[:LIVES_AT]->(l:Location)
//     —  user home / delivery address
//
// (o:Order)-[:DELIVER_TO]->(l:Location)
//     —  delivery destination for an order
