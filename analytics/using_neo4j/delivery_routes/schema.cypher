// ============================================================
// Schema – Delivery Route Optimisation
// ============================================================
// Extends the graphs_and_routes model with Courier nodes and
// assignment relationships for route simulation.
//
// Prerequisite: graphs_and_routes/schema.cypher (User, Product,
// Order, Location, Restaurant + constraints) must be loaded first.
// ============================================================

// Constraints (run once)
CREATE CONSTRAINT courier_id IF NOT EXISTS FOR (c:Courier) REQUIRE c.id IS UNIQUE;

// ============================================================
// Node: Courier
// ============================================================
// (:Courier {
//   id:       string   — unique identifier
//   name:     string   — display name
//   vehicle:  string   — 'motorcycle' | 'bicycle' | 'car' | 'truck'
//   zone:     string   — operational zone description
//   status:   string   — 'available' | 'busy' | 'offline'
// })
//
// Relationships:
//
//   (c:Courier)-[:HUB_AT]->(l:Location {type: 'hub'})
//       — the hub/warehouse where the courier starts and returns
//
//   (c:Courier)-[:ASSIGNED_TO]->(o:Order)
//       — order assigned to this couicer for delivery
//
// ============================================================
// Example:
//
// CREATE (c:Courier {id: 'c1', name: 'Carlos Moto',
//                    vehicle: 'motorcycle', zone: 'Zona 10/14',
//                    status: 'available'})
// MATCH (l:Location {id: 'l1'})
// CREATE (c)-[:HUB_AT]->(l)
