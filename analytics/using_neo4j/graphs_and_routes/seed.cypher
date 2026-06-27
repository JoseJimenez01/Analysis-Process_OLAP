// ============================================================
// Seed Data – graphs_and_routes
// ============================================================

// 1. Users ---------------------------------------------------
CREATE (u1:User {id: 'u1',  name: 'Carlos López',   email: 'carlos@email.com',   role: 'customer'})
CREATE (u2:User {id: 'u2',  name: 'María García',    email: 'maria@email.com',    role: 'customer'})
CREATE (u3:User {id: 'u3',  name: 'José Pérez',      email: 'jose@email.com',     role: 'customer'})
CREATE (u4:User {id: 'u4',  name: 'Ana Martínez',    email: 'ana@email.com',      role: 'customer'})
CREATE (u5:User {id: 'u5',  name: 'Luis Hernández',  email: 'luis@email.com',     role: 'customer'})
CREATE (u6:User {id: 'u6',  name: 'Sofía Ramírez',   email: 'sofia@email.com',    role: 'customer'})
CREATE (u7:User {id: 'u7',  name: 'Diego Torres',    email: 'diego@email.com',    role: 'customer'})
CREATE (u8:User {id: 'u8',  name: 'Valentina Ortiz', email: 'valentina@email.com',role: 'customer'})
CREATE (u9:User {id: 'u9',  name: 'Admin Principal', email: 'admin@email.com',    role: 'admin'})

// 2. Products (menu items) ------------------------------------
CREATE (p1:Product  {id: 'p1',  name: 'Hamburguesa Clásica',    price: 45.00, category: 'Hamburguesas'})
CREATE (p2:Product  {id: 'p2',  name: 'Hamburguesa BBQ',        price: 55.00, category: 'Hamburguesas'})
CREATE (p3:Product  {id: 'p3',  name: 'Papas Fritas',           price: 25.00, category: 'Acompañantes'})
CREATE (p4:Product  {id: 'p4',  name: 'Aros de Cebolla',        price: 30.00, category: 'Acompañantes'})
CREATE (p5:Product  {id: 'p5',  name: 'Refresco Cola',          price: 15.00, category: 'Bebidas'})
CREATE (p6:Product  {id: 'p6',  name: 'Limonada Natural',       price: 20.00, category: 'Bebidas'})
CREATE (p7:Product  {id: 'p7',  name: 'Pizza Pepperoni',        price: 80.00, category: 'Pizzas'})
CREATE (p8:Product  {id: 'p8',  name: 'Pizza Vegetariana',      price: 75.00, category: 'Pizzas'})
CREATE (p9:Product  {id: 'p9',  name: 'Ensalada César',         price: 50.00, category: 'Ensaladas'})
CREATE (p10:Product {id: 'p10', name: 'Tacos al Pastor',        price: 60.00, category: 'Tacos'})
CREATE (p11:Product {id: 'p11', name: 'Quesadillas',            price: 35.00, category: 'Tacos'})
CREATE (p12:Product {id: 'p12', name: 'Nachos con Queso',       price: 40.00, category: 'Acompañantes'})
CREATE (p13:Product {id: 'p13', name: 'Agua Embotellada',       price: 12.00, category: 'Bebidas'})
CREATE (p14:Product {id: 'p14', name: 'Flan Casero',            price: 30.00, category: 'Postres'})
CREATE (p15:Product {id: 'p15', name: 'Pastel de Chocolate',    price: 45.00, category: 'Postres'})

// 3. Locations (geonodes for delivery routing) -----------------
// Hubs (distribution centres)
CREATE (l1:Location {id: 'l1',  name: 'Hub Central',    type: 'hub',        lat: 14.6348, lng: -90.5064})
CREATE (l2:Location {id: 'l2',  name: 'Hub Norte',      type: 'hub',        lat: 14.6512, lng: -90.5132})

// Restaurants
CREATE (l3:Location {id: 'l3',  name: 'Zona 10 - Burger', type: 'restaurant', lat: 14.6361, lng: -90.5091})
CREATE (l4:Location {id: 'l4',  name: 'Zona 14 - Pizza',  type: 'restaurant', lat: 14.6278, lng: -90.5156})
CREATE (l5:Location {id: 'l5',  name: 'Zona 1 - Taquería',type: 'restaurant', lat: 14.6425, lng: -90.5138})

// Customers
CREATE (l6:Location {id: 'l6',  name: 'Casa Carlos',     type: 'customer',   lat: 14.6322, lng: -90.5088})
CREATE (l7:Location {id: 'l7',  name: 'Casa María',      type: 'customer',   lat: 14.6400, lng: -90.5177})
CREATE (l8:Location {id: 'l8',  name: 'Casa José',       type: 'customer',   lat: 14.6375, lng: -90.5110})
CREATE (l9:Location {id: 'l9',  name: 'Casa Ana',        type: 'customer',   lat: 14.6450, lng: -90.5050})
CREATE (l10:Location {id: 'l10', name: 'Casa Luis',      type: 'customer',   lat: 14.6300, lng: -90.5210})
CREATE (l11:Location {id: 'l11', name: 'Casa Valentina', type: 'customer',   lat: 14.6388, lng: -90.5190})

// 4. Restaurants ----------------------------------------------
CREATE (r1:Restaurant {id: 'r1', name: 'Burger King Z10',  address: '6a Av 12-45 Zona 10, Guatemala'})
CREATE (r2:Restaurant {id: 'r2', name: 'Pizza Hut Z14',    address: '15 Calle 8-20 Zona 14, Guatemala'})
CREATE (r3:Restaurant {id: 'r3', name: 'Taquería El Pastor',address: '7a Av 4-12 Zona 1, Guatemala'})

// 5. Location assignments -------------------------------------
// Restaurants located at
CREATE (r1)-[:LOCATED_AT]->(l3)
CREATE (r2)-[:LOCATED_AT]->(l4)
CREATE (r3)-[:LOCATED_AT]->(l5)

// Users live at
CREATE (u1)-[:LIVES_AT]->(l6)
CREATE (u2)-[:LIVES_AT]->(l7)
CREATE (u3)-[:LIVES_AT]->(l8)
CREATE (u4)-[:LIVES_AT]->(l9)
CREATE (u5)-[:LIVES_AT]->(l10)
CREATE (u8)-[:LIVES_AT]->(l11)

// 6. Road network (directed weighted edges) --------------------
// Road segments between hubs
CREATE (l1)-[:ROAD_TO {distance_km: 2.8, time_min: 6}]->(l2)
CREATE (l2)-[:ROAD_TO {distance_km: 2.8, time_min: 6}]->(l1)

// Hub Central → restaurants
CREATE (l1)-[:ROAD_TO {distance_km: 0.6, time_min: 2}]->(l3)
CREATE (l1)-[:ROAD_TO {distance_km: 1.8, time_min: 5}]->(l4)
CREATE (l1)-[:ROAD_TO {distance_km: 2.2, time_min: 7}]->(l5)

// Hub Norte → restaurants
CREATE (l2)-[:ROAD_TO {distance_km: 2.4, time_min: 7}]->(l3)
CREATE (l2)-[:ROAD_TO {distance_km: 3.6, time_min: 10}]->(l4)
CREATE (l2)-[:ROAD_TO {distance_km: 1.8, time_min: 5}]->(l5)

// Inter-restaurant
CREATE (l3)-[:ROAD_TO {distance_km: 1.4, time_min: 4}]->(l4)
CREATE (l4)-[:ROAD_TO {distance_km: 2.0, time_min: 6}]->(l5)
CREATE (l5)-[:ROAD_TO {distance_km: 1.8, time_min: 5}]->(l3)

// Restaurant → customer
CREATE (l3)-[:ROAD_TO {distance_km: 0.8, time_min: 3}]->(l6)
CREATE (l3)-[:ROAD_TO {distance_km: 1.2, time_min: 4}]->(l8)
CREATE (l4)-[:ROAD_TO {distance_km: 1.0, time_min: 3}]->(l7)
CREATE (l4)-[:ROAD_TO {distance_km: 1.6, time_min: 5}]->(l11)
CREATE (l5)-[:ROAD_TO {distance_km: 2.0, time_min: 6}]->(l9)
CREATE (l5)-[:ROAD_TO {distance_km: 2.5, time_min: 8}]->(l10)

// Customer → hub & inter-customer
CREATE (l6)-[:ROAD_TO {distance_km: 0.6, time_min: 2}]->(l1)
CREATE (l6)-[:ROAD_TO {distance_km: 1.4, time_min: 4}]->(l7)
CREATE (l7)-[:ROAD_TO {distance_km: 1.2, time_min: 4}]->(l8)
CREATE (l8)-[:ROAD_TO {distance_km: 2.0, time_min: 6}]->(l10)
CREATE (l10)-[:ROAD_TO {distance_km: 1.8, time_min: 5}]->(l11)
CREATE (l9)-[:ROAD_TO {distance_km: 2.2, time_min: 7}]->(l10)

// 7. Orders & order items -------------------------------------
// Order 1 — Carlos buys burger + fries + cola
CREATE (o1:Order {id: 'o1', date: date('2025-06-01'), total: 85.00})
CREATE (u1)-[:PURCHASED]->(o1)
CREATE (o1)-[:CONTAINS {quantity: 2, unit_price: 45.00}]->(p1)
CREATE (o1)-[:CONTAINS {quantity: 1, unit_price: 25.00}]->(p3)
CREATE (o1)-[:CONTAINS {quantity: 2, unit_price: 15.00}]->(p5)
CREATE (o1)-[:DELIVER_TO]->(l6)

// Order 2 — María buys pizza + soda
CREATE (o2:Order {id: 'o2', date: date('2025-06-01'), total: 95.00})
CREATE (u2)-[:PURCHASED]->(o2)
CREATE (o2)-[:CONTAINS {quantity: 1, unit_price: 80.00}]->(p7)
CREATE (o2)-[:CONTAINS {quantity: 1, unit_price: 15.00}]->(p5)
CREATE (o2)-[:DELIVER_TO]->(l7)

// Order 3 — José buys tacos + quesadillas + limonada
CREATE (o3:Order {id: 'o3', date: date('2025-06-02'), total: 115.00})
CREATE (u3)-[:PURCHASED]->(o3)
CREATE (o3)-[:CONTAINS {quantity: 2, unit_price: 60.00}]->(p10)
CREATE (o3)-[:CONTAINS {quantity: 1, unit_price: 35.00}]->(p11)
CREATE (o3)-[:CONTAINS {quantity: 2, unit_price: 20.00}]->(p6)
CREATE (o3)-[:DELIVER_TO]->(l8)

// Order 4 — Carlos buys again: BBQ burger + onion rings + cola + flan
CREATE (o4:Order {id: 'o4', date: date('2025-06-03'), total: 130.00})
CREATE (u1)-[:PURCHASED]->(o4)
CREATE (o4)-[:CONTAINS {quantity: 1, unit_price: 55.00}]->(p2)
CREATE (o4)-[:CONTAINS {quantity: 1, unit_price: 30.00}]->(p4)
CREATE (o4)-[:CONTAINS {quantity: 1, unit_price: 15.00}]->(p5)
CREATE (o4)-[:CONTAINS {quantity: 1, unit_price: 30.00}]->(p14)
CREATE (o4)-[:DELIVER_TO]->(l6)

// Order 5 — Ana buys salad + water + cake
CREATE (o5:Order {id: 'o5', date: date('2025-06-03'), total: 107.00})
CREATE (u4)-[:PURCHASED]->(o5)
CREATE (o5)-[:CONTAINS {quantity: 1, unit_price: 50.00}]->(p9)
CREATE (o5)-[:CONTAINS {quantity: 2, unit_price: 12.00}]->(p13)
CREATE (o5)-[:CONTAINS {quantity: 1, unit_price: 45.00}]->(p15)
CREATE (o5)-[:DELIVER_TO]->(l9)

// Order 6 — Luis buys burger + fries + nachos + cola (party pack)
CREATE (o6:Order {id: 'o6', date: date('2025-06-04'), total: 125.00})
CREATE (u5)-[:PURCHASED]->(o6)
CREATE (o6)-[:CONTAINS {quantity: 3, unit_price: 45.00}]->(p1)
CREATE (o6)-[:CONTAINS {quantity: 2, unit_price: 25.00}]->(p3)
CREATE (o6)-[:CONTAINS {quantity: 1, unit_price: 40.00}]->(p12)
CREATE (o6)-[:CONTAINS {quantity: 3, unit_price: 15.00}]->(p5)
CREATE (o6)-[:DELIVER_TO]->(l10)

// Order 7 — Sofía buys pizza + salad + limonada
CREATE (o7:Order {id: 'o7', date: date('2025-06-04'), total: 145.00})
CREATE (u6)-[:PURCHASED]->(o7)
CREATE (o7)-[:CONTAINS {quantity: 1, unit_price: 80.00}]->(p7)
CREATE (o7)-[:CONTAINS {quantity: 1, unit_price: 50.00}]->(p9)
CREATE (o7)-[:CONTAINS {quantity: 1, unit_price: 20.00}]->(p6)
CREATE (o7)-[:DELIVER_TO]->(l6)  // Sofía at same location as Carlos

// Order 8 — Valentina buys tacos + nachos + 2 cervezas (water as cola proxy)
CREATE (o8:Order {id: 'o8', date: date('2025-06-05'), total: 110.00})
CREATE (u8)-[:PURCHASED]->(o8)
CREATE (o8)-[:CONTAINS {quantity: 1, unit_price: 60.00}]->(p10)
CREATE (o8)-[:CONTAINS {quantity: 1, unit_price: 40.00}]->(p12)
CREATE (o8)-[:CONTAINS {quantity: 2, unit_price: 15.00}]->(p5)
CREATE (o8)-[:DELIVER_TO]->(l11)

// Order 9 — Diego buys veggie pizza + onion rings + water
CREATE (o9:Order {id: 'o9', date: date('2025-06-05'), total: 117.00})
CREATE (u7)-[:PURCHASED]->(o9)
CREATE (o9)-[:CONTAINS {quantity: 1, unit_price: 75.00}]->(p8)
CREATE (o9)-[:CONTAINS {quantity: 1, unit_price: 30.00}]->(p4)
CREATE (o9)-[:CONTAINS {quantity: 1, unit_price: 12.00}]->(p13)
CREATE (o9)-[:DELIVER_TO]->(l7)  // Diego at María's location

// 8. Referral / recommendation edges -------------------------
// Carlos recommends José and Luis
CREATE (u1)-[:RECOMMENDS]->(u3)
CREATE (u1)-[:RECOMMENDS]->(u5)

// María recommends Ana and Sofía
CREATE (u2)-[:RECOMMENDS]->(u4)
CREATE (u2)-[:RECOMMENDS]->(u6)

// José recommends Valentina
CREATE (u3)-[:RECOMMENDS]->(u8)

// Luis recommends Diego
CREATE (u5)-[:RECOMMENDS]->(u7)

// Ana recommends Carlos (cross-referral)
CREATE (u4)-[:RECOMMENDS]->(u1);

// ============================================================
// 9. Pre-compute CO_PURCHASED_WITH relationships
// ============================================================

// Run AFTER importing orders to materialise co-purchase weights
MATCH (o:Order)-[:CONTAINS]->(p1:Product)
MATCH (o)-[:CONTAINS]->(p2:Product)
WHERE p1 <> p2
WITH p1, p2, count(DISTINCT o) AS freq
MERGE (p1)-[:CO_PURCHASED_WITH {weight: freq}]->(p2)
// MERGE handles both directions — you may also add the reverse
MERGE (p2)-[:CO_PURCHASED_WITH {weight: freq}]->(p1);

// ============================================================
// Verify counts (optional — run after create)
// ============================================================
// MATCH (u:User)        RETURN count(u) AS users;
// MATCH (p:Product)     RETURN count(p) AS products;
// MATCH (o:Order)       RETURN count(o) AS orders;
// MATCH (l:Location)    RETURN count(l) AS locations;
// MATCH ()-[r:ROAD_TO]->() RETURN count(r) AS roads;
