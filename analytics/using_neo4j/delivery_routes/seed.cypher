// ============================================================
// Seed – Delivery Route Simulation
// ============================================================
// Requires base data from graphs_and_routes/seed.cypher (Users,
// Products, Locations, Restaurants, Road network).
//
// Adds: Courier nodes, new Orders with delivery destinations,
// and courier-to-order assignments.
// ============================================================

// 1. Additional Customer Locations ---------------------------------
CREATE (l12:Location {id: 'l12', name: 'Casa Sofía',  type: 'customer', lat: 14.6260, lng: -90.5140})
CREATE (l13:Location {id: 'l13', name: 'Casa Diego',  type: 'customer', lat: 14.6345, lng: -90.5115})
CREATE (l14:Location {id: 'l14', name: 'Casa Admin',  type: 'customer', lat: 14.6460, lng: -90.5080});

// Road connections — MATCH existing nodes, CREATE edges only
MATCH (l4:Location {id: 'l4'}), (l12:Location {id: 'l12'})
CREATE (l4)-[:ROAD_TO {distance_km: 0.5, time_min: 2}]->(l12)
CREATE (l12)-[:ROAD_TO {distance_km: 0.5, time_min: 2}]->(l4);
MATCH (l3:Location {id: 'l3'}), (l13:Location {id: 'l13'})
CREATE (l3)-[:ROAD_TO {distance_km: 0.3, time_min: 1}]->(l13)
CREATE (l13)-[:ROAD_TO {distance_km: 0.3, time_min: 1}]->(l3);
MATCH (l5:Location {id: 'l5'}), (l14:Location {id: 'l14'})
CREATE (l5)-[:ROAD_TO {distance_km: 0.4, time_min: 2}]->(l14)
CREATE (l14)-[:ROAD_TO {distance_km: 0.4, time_min: 2}]->(l5);
MATCH (l12:Location {id: 'l12'}), (l7:Location {id: 'l7'})
CREATE (l12)-[:ROAD_TO {distance_km: 1.0, time_min: 4}]->(l7)
CREATE (l7)-[:ROAD_TO {distance_km: 1.0, time_min: 4}]->(l12);
MATCH (l13:Location {id: 'l13'}), (l8:Location {id: 'l8'})
CREATE (l13)-[:ROAD_TO {distance_km: 0.7, time_min: 3}]->(l8)
CREATE (l8)-[:ROAD_TO {distance_km: 0.7, time_min: 3}]->(l13);
MATCH (l14:Location {id: 'l14'}), (l9:Location {id: 'l9'})
CREATE (l14)-[:ROAD_TO {distance_km: 0.6, time_min: 2}]->(l9)
CREATE (l9)-[:ROAD_TO {distance_km: 0.6, time_min: 2}]->(l14);

// Update users to new locations
MATCH (u6:User {id: 'u6'}), (l12:Location {id: 'l12'}) MERGE (u6)-[:LIVES_AT]->(l12);
MATCH (u7:User {id: 'u7'}), (l13:Location {id: 'l13'}) MERGE (u7)-[:LIVES_AT]->(l13);
MATCH (u9:User {id: 'u9'}), (l14:Location {id: 'l14'}) MERGE (u9)-[:LIVES_AT]->(l14);

// 2. Couriers ----------------------------------------------------
CREATE (c1:Courier {id: 'c1', name: 'Carlos Moto',   vehicle: 'motorcycle', zone: 'Zona 10 / Zona 14', status: 'available'})
CREATE (c2:Courier {id: 'c2', name: 'Ana Bici',      vehicle: 'bicycle',    zone: 'Zona 1 / Centro',    status: 'available'})
CREATE (c3:Courier {id: 'c3', name: 'Pedro Camión',  vehicle: 'car',        zone: 'Todas las zonas',    status: 'available'});

// Assign couriers to hubs
MATCH (c1:Courier {id: 'c1'}), (l1:Location {id: 'l1'}) CREATE (c1)-[:HUB_AT]->(l1);
MATCH (c2:Courier {id: 'c2'}), (l2:Location {id: 'l2'}) CREATE (c2)-[:HUB_AT]->(l2);
MATCH (c3:Courier {id: 'c3'}), (l1:Location {id: 'l1'}) CREATE (c3)-[:HUB_AT]->(l1);

// 3. New Orders for Simulation -----------------------------------
// Each block: MATCH existing User/Product/Location, CREATE Order + edges

// ── Carlos Moto (c1) — Zona 10/14 area ────────────────────────────

MATCH (u1:User {id: 'u1'}), (p1:Product {id: 'p1'}), (p3:Product {id: 'p3'}), (l6:Location {id: 'l6'})
CREATE (o10:Order {id: 'o10', date: date('2025-06-10'), total: 115.00, shift: 'lunch'})
CREATE (u1)-[:PURCHASED]->(o10)
CREATE (o10)-[:CONTAINS {quantity: 2, unit_price: 45.00}]->(p1)
CREATE (o10)-[:CONTAINS {quantity: 1, unit_price: 25.00}]->(p3)
CREATE (o10)-[:DELIVER_TO]->(l6);

MATCH (u7:User {id: 'u7'}), (p7:Product {id: 'p7'}), (p5:Product {id: 'p5'}), (l13:Location {id: 'l13'})
CREATE (o11:Order {id: 'o11', date: date('2025-06-10'), total: 95.00, shift: 'lunch'})
CREATE (u7)-[:PURCHASED]->(o11)
CREATE (o11)-[:CONTAINS {quantity: 1, unit_price: 80.00}]->(p7)
CREATE (o11)-[:CONTAINS {quantity: 1, unit_price: 15.00}]->(p5)
CREATE (o11)-[:DELIVER_TO]->(l13);

MATCH (u2:User {id: 'u2'}), (p8:Product {id: 'p8'}), (p6:Product {id: 'p6'}), (l7:Location {id: 'l7'})
CREATE (o12:Order {id: 'o12', date: date('2025-06-10'), total: 95.00, shift: 'lunch'})
CREATE (u2)-[:PURCHASED]->(o12)
CREATE (o12)-[:CONTAINS {quantity: 1, unit_price: 75.00}]->(p8)
CREATE (o12)-[:CONTAINS {quantity: 1, unit_price: 20.00}]->(p6)
CREATE (o12)-[:DELIVER_TO]->(l7);

MATCH (u6:User {id: 'u6'}), (p1:Product {id: 'p1'}), (p4:Product {id: 'p4'}), (l12:Location {id: 'l12'})
CREATE (o13:Order {id: 'o13', date: date('2025-06-10'), total: 75.00, shift: 'dinner'})
CREATE (u6)-[:PURCHASED]->(o13)
CREATE (o13)-[:CONTAINS {quantity: 1, unit_price: 45.00}]->(p1)
CREATE (o13)-[:CONTAINS {quantity: 1, unit_price: 30.00}]->(p4)
CREATE (o13)-[:DELIVER_TO]->(l12);

// Assign orders to Carlos Moto
MATCH (c1:Courier {id: 'c1'}), (o10:Order {id: 'o10'}) CREATE (c1)-[:ASSIGNED_TO]->(o10);
MATCH (c1:Courier {id: 'c1'}), (o11:Order {id: 'o11'}) CREATE (c1)-[:ASSIGNED_TO]->(o11);
MATCH (c1:Courier {id: 'c1'}), (o12:Order {id: 'o12'}) CREATE (c1)-[:ASSIGNED_TO]->(o12);
MATCH (c1:Courier {id: 'c1'}), (o13:Order {id: 'o13'}) CREATE (c1)-[:ASSIGNED_TO]->(o13);

// ── Ana Bici (c2) — Zona 1 / Centro area ─────────────────────────

MATCH (u4:User {id: 'u4'}), (p10:Product {id: 'p10'}), (p13:Product {id: 'p13'}), (l9:Location {id: 'l9'})
CREATE (o14:Order {id: 'o14', date: date('2025-06-10'), total: 72.00, shift: 'lunch'})
CREATE (u4)-[:PURCHASED]->(o14)
CREATE (o14)-[:CONTAINS {quantity: 1, unit_price: 60.00}]->(p10)
CREATE (o14)-[:CONTAINS {quantity: 1, unit_price: 12.00}]->(p13)
CREATE (o14)-[:DELIVER_TO]->(l9);

MATCH (u3:User {id: 'u3'}), (p11:Product {id: 'p11'}), (p12:Product {id: 'p12'}), (p5:Product {id: 'p5'}), (l8:Location {id: 'l8'})
CREATE (o15:Order {id: 'o15', date: date('2025-06-10'), total: 90.00, shift: 'lunch'})
CREATE (u3)-[:PURCHASED]->(o15)
CREATE (o15)-[:CONTAINS {quantity: 1, unit_price: 35.00}]->(p11)
CREATE (o15)-[:CONTAINS {quantity: 1, unit_price: 40.00}]->(p12)
CREATE (o15)-[:CONTAINS {quantity: 1, unit_price: 15.00}]->(p5)
CREATE (o15)-[:DELIVER_TO]->(l8);

MATCH (u5:User {id: 'u5'}), (p10:Product {id: 'p10'}), (p14:Product {id: 'p14'}), (l10:Location {id: 'l10'})
CREATE (o16:Order {id: 'o16', date: date('2025-06-10'), total: 90.00, shift: 'dinner'})
CREATE (u5)-[:PURCHASED]->(o16)
CREATE (o16)-[:CONTAINS {quantity: 1, unit_price: 60.00}]->(p10)
CREATE (o16)-[:CONTAINS {quantity: 1, unit_price: 30.00}]->(p14)
CREATE (o16)-[:DELIVER_TO]->(l10);

MATCH (u8:User {id: 'u8'}), (p1:Product {id: 'p1'}), (p15:Product {id: 'p15'}), (l11:Location {id: 'l11'})
CREATE (o17:Order {id: 'o17', date: date('2025-06-10'), total: 90.00, shift: 'dinner'})
CREATE (u8)-[:PURCHASED]->(o17)
CREATE (o17)-[:CONTAINS {quantity: 1, unit_price: 45.00}]->(p1)
CREATE (o17)-[:CONTAINS {quantity: 1, unit_price: 45.00}]->(p15)
CREATE (o17)-[:DELIVER_TO]->(l11);

// Assign orders to Ana Bici
MATCH (c2:Courier {id: 'c2'}), (o14:Order {id: 'o14'}) CREATE (c2)-[:ASSIGNED_TO]->(o14);
MATCH (c2:Courier {id: 'c2'}), (o15:Order {id: 'o15'}) CREATE (c2)-[:ASSIGNED_TO]->(o15);
MATCH (c2:Courier {id: 'c2'}), (o16:Order {id: 'o16'}) CREATE (c2)-[:ASSIGNED_TO]->(o16);
MATCH (c2:Courier {id: 'c2'}), (o17:Order {id: 'o17'}) CREATE (c2)-[:ASSIGNED_TO]->(o17);

// ── Pedro Camión (c3) — Mixed zones ──────────────────────────────

MATCH (u9:User {id: 'u9'}), (p9:Product {id: 'p9'}), (p15:Product {id: 'p15'}), (p13:Product {id: 'p13'}), (l14:Location {id: 'l14'})
CREATE (o18:Order {id: 'o18', date: date('2025-06-10'), total: 107.00, shift: 'lunch'})
CREATE (u9)-[:PURCHASED]->(o18)
CREATE (o18)-[:CONTAINS {quantity: 1, unit_price: 50.00}]->(p9)
CREATE (o18)-[:CONTAINS {quantity: 1, unit_price: 45.00}]->(p15)
CREATE (o18)-[:CONTAINS {quantity: 1, unit_price: 12.00}]->(p13)
CREATE (o18)-[:DELIVER_TO]->(l14);

MATCH (u3:User {id: 'u3'}), (p2:Product {id: 'p2'}), (p5:Product {id: 'p5'}), (l8:Location {id: 'l8'})
CREATE (o19:Order {id: 'o19', date: date('2025-06-10'), total: 70.00, shift: 'dinner'})
CREATE (u3)-[:PURCHASED]->(o19)
CREATE (o19)-[:CONTAINS {quantity: 1, unit_price: 55.00}]->(p2)
CREATE (o19)-[:CONTAINS {quantity: 1, unit_price: 15.00}]->(p5)
CREATE (o19)-[:DELIVER_TO]->(l8);

MATCH (u1:User {id: 'u1'}), (p7:Product {id: 'p7'}), (p15:Product {id: 'p15'}), (l6:Location {id: 'l6'})
CREATE (o20:Order {id: 'o20', date: date('2025-06-10'), total: 125.00, shift: 'dinner'})
CREATE (u1)-[:PURCHASED]->(o20)
CREATE (o20)-[:CONTAINS {quantity: 1, unit_price: 80.00}]->(p7)
CREATE (o20)-[:CONTAINS {quantity: 1, unit_price: 45.00}]->(p15)
CREATE (o20)-[:DELIVER_TO]->(l6);

MATCH (u2:User {id: 'u2'}), (p10:Product {id: 'p10'}), (p6:Product {id: 'p6'}), (l7:Location {id: 'l7'})
CREATE (o21:Order {id: 'o21', date: date('2025-06-10'), total: 80.00, shift: 'dinner'})
CREATE (u2)-[:PURCHASED]->(o21)
CREATE (o21)-[:CONTAINS {quantity: 1, unit_price: 60.00}]->(p10)
CREATE (o21)-[:CONTAINS {quantity: 1, unit_price: 20.00}]->(p6)
CREATE (o21)-[:DELIVER_TO]->(l7);

// Assign orders to Pedro Camión
MATCH (c3:Courier {id: 'c3'}), (o18:Order {id: 'o18'}) CREATE (c3)-[:ASSIGNED_TO]->(o18);
MATCH (c3:Courier {id: 'c3'}), (o19:Order {id: 'o19'}) CREATE (c3)-[:ASSIGNED_TO]->(o19);
MATCH (c3:Courier {id: 'c3'}), (o20:Order {id: 'o20'}) CREATE (c3)-[:ASSIGNED_TO]->(o20);
MATCH (c3:Courier {id: 'c3'}), (o21:Order {id: 'o21'}) CREATE (c3)-[:ASSIGNED_TO]->(o21);