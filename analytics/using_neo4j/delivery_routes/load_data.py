"""
Simulador de rutas de entrega con heurística de vecino más cercano.

Carga couriers y pedidos en Neo4j, ejecuta el algoritmo de ruteo
en Cypher puro y muestra rutas optimizadas por repartidor.

Uso:
    # Reset + recarga completa (incluye base data de graphs_and_routes)
    python load_data.py --reset

    # Solo agregar datos de delivery a una BD que ya tiene la base
    python load_data.py

    # Especificar motor de BD para carga de seed (postgres por defecto)
    python load_data.py --db-engine mongo

Requisitos:
    - Neo4j corriendo en bolt://localhost:7687
    - La base (graphs_and_routes) cargada: nodos User/Product/Order/\
      Location/Restaurant con sus relaciones y road network
"""

import argparse
import os
import sys
from pathlib import Path

from neo4j import GraphDatabase


class Config:
    db_engine = os.getenv("DB_ENGINE", "postgres")
    neo4j_uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    neo4j_user = os.getenv("NEO4J_USER", "neo4j")
    neo4j_pass = os.getenv("NEO4J_PASSWORD", "password")


class DeliveryLoader:
    def __init__(self, config: Config):
        self.driver = GraphDatabase.driver(
            config.neo4j_uri,
            auth=(config.neo4j_user, config.neo4j_pass),
        )
        self._base_dir = Path(__file__).parent
        self._graphs_dir = self._base_dir.parent / "graphs_and_routes"

    def close(self):
        self.driver.close()

    def run(self, query, parameters=None):
        with self.driver.session() as session:
            return list(session.run(query, parameters or {}))

    # ── Base data (graphs_and_routes) ────────────────────────

    def load_base_schema(self):
        path = self._graphs_dir / "schema.cypher"
        if not path.exists():
            print("  [SKIP] schema.cypher not found")
            return
        for stmt in self._read_cypher(path):
            self.run(stmt)
        print(f"  Base constraints ready.")

    def load_base_seed(self):
        path = self._graphs_dir / "seed.cypher"
        if not path.exists():
            print("  [SKIP] base seed.cypher not found")
            return
        print("  Loading base seed (graphs_and_routes)...")
        for stmt in self._read_cypher(path):
            self.run(stmt)
        print("  Base seed loaded.")

    def compute_base_co_purchases(self):
        self.run("""
            MATCH (o:Order)-[:CONTAINS]->(p1:Product)
            MATCH (o)-[:CONTAINS]->(p2:Product)
            WHERE p1 <> p2
            WITH p1, p2, count(DISTINCT o) AS freq
            MERGE (p1)-[:CO_PURCHASED_WITH {weight: freq}]->(p2)
            MERGE (p2)-[:CO_PURCHASED_WITH {weight: freq}]->(p1)
        """)
        print("  Co-purchase relationships computed.")

    # ── Delivery-specific data ───────────────────────────────

    def load_delivery_schema(self):
        path = self._base_dir / "schema.cypher"
        if not path.exists():
            print("  [SKIP] delivery schema not found")
            return
        for stmt in self._read_cypher(path):
            self.run(stmt)
        print("  Delivery constraints ready.")

    def load_delivery_seed(self):
        path = self._base_dir / "seed.cypher"
        if not path.exists():
            print("  [SKIP] delivery seed not found")
            return
        print("  Loading delivery seed (couriers + new orders)...")
        for stmt in self._read_cypher(path):
            self.run(stmt)
        print("  Delivery seed loaded.")

    def reset(self):
        # Only reset delivery-specific data, keep base graph
        self.run("""
            MATCH (c:Courier)
            OPTIONAL MATCH (c)-[r]-()
            DELETE r, c
        """)
        # Remove orders that are assigned to no user (delivery-only orders)
        # Actually, let's just remove delivery-specific orders by ID pattern
        self.run("""
            MATCH (o:Order)
            WHERE o.id IN ['o10','o11','o12','o13','o14','o15',
                           'o16','o17','o18','o19','o20','o21']
            OPTIONAL MATCH (o)-[r]-()
            DELETE r, o
        """)
        # Remove extra locations
        self.run("""
            MATCH (l:Location)
            WHERE l.id IN ['l12','l13','l14']
            OPTIONAL MATCH (l)-[r]-()
            DELETE r, l
        """)
        print("  Delivery data cleared.")

    def hard_reset(self):
        # Full graph wipe (for fresh start)
        self.run("MATCH (n) DETACH DELETE n")
        print("  Full graph cleared.")

    # ── Cypher file reader ──────────────────────────────────

    def _read_cypher(self, path):
        content = path.read_text()
        lines = [l for l in content.split("\n") if not l.strip().startswith("//")]
        clean = "\n".join(lines)
        for stmt in clean.split(";"):
            stmt = stmt.strip()
            if stmt:
                yield stmt

    # ── Nearest Neighbour Routing ───────────────────────────

    def route_single_courier(self, courier_id):
        """Run Q1 for a single courier, return list of stops."""
        return self.run("""
            MATCH (c:Courier {id: $cid})-[:HUB_AT]->(hub:Location)
            MATCH (c)-[:ASSIGNED_TO]->(o:Order)-[:DELIVER_TO]->(dest:Location)
            MATCH (u:User)-[:PURCHASED]->(o)

            WITH c, hub, o, u, dest
            MATCH to_hub = shortestPath((hub)-[:ROAD_TO*]-(dest))
            WITH c, hub, o, u, dest,
                 reduce(d = 0, r IN relationships(to_hub) | d + r.distance_km) AS hub_dist,
                 reduce(t = 0, r IN relationships(to_hub) | t + r.time_min) AS hub_time
            ORDER BY hub_dist ASC, hub_time ASC

            WITH c, hub,
                 collect({o: o, u: u, dest: dest, hd: hub_dist, ht: hub_time}) AS stops
            UNWIND range(0, size(stops)-1) AS i
            WITH c, stops, i,
                 stops[i] AS s,
                 CASE WHEN i = 0 THEN hub ELSE stops[i-1].dest END AS prev,
                 stops[i].dest AS curr_dest

            MATCH leg = shortestPath((prev)-[:ROAD_TO*]-(curr_dest))
            WITH c, s, i,
                 reduce(d = 0, r IN relationships(leg) | d + r.distance_km) AS leg_km,
                 reduce(t = 0, r IN relationships(leg) | t + r.time_min) AS leg_min,
                 s.hd AS cumul_km,
                 s.ht AS cumul_min
            WHERE leg_km IS NOT NULL

            RETURN i + 1                                AS stop_no,
                   s.o.id                                AS order_id,
                   s.u.name                              AS customer,
                   s.dest.name                           AS delivery_at,
                   round(leg_km, 2)                      AS leg_km,
                   round(leg_min, 1)                     AS leg_min,
                   round(cumul_km, 2)                    AS cumul_km,
                   round(cumul_min, 1)                   AS cumul_min
            ORDER BY i
        """, {"cid": courier_id})

    def route_all_couriers(self):
        """Run Q2 for all couriers, return list of stops with courier name."""
        return self.run("""
            MATCH (c:Courier)-[:HUB_AT]->(hub:Location)
            MATCH (c)-[:ASSIGNED_TO]->(o:Order)-[:DELIVER_TO]->(dest:Location)
            MATCH (u:User)-[:PURCHASED]->(o)

            WITH c, hub, o, u, dest
            MATCH to_hub = shortestPath((hub)-[:ROAD_TO*]-(dest))
            WITH c, hub, o, u, dest,
                 reduce(d = 0, r IN relationships(to_hub) | d + r.distance_km) AS hub_dist,
                 reduce(t = 0, r IN relationships(to_hub) | t + r.time_min) AS hub_time
            ORDER BY c.id, hub_dist ASC, hub_time ASC

            WITH c, hub,
                 collect({o: o, u: u, dest: dest, hd: hub_dist, ht: hub_time}) AS stops
            UNWIND range(0, size(stops)-1) AS i
            WITH c, stops, i,
                 stops[i] AS s,
                 CASE WHEN i = 0 THEN hub ELSE stops[i-1].dest END AS prev,
                 stops[i].dest AS curr_dest

            MATCH leg = shortestPath((prev)-[:ROAD_TO*]-(curr_dest))
            WITH c, s, i,
                 reduce(d = 0, r IN relationships(leg) | d + r.distance_km) AS leg_km,
                 reduce(t = 0, r IN relationships(leg) | t + r.time_min) AS leg_min,
                 s.hd AS cumul_km,
                 s.ht AS cumul_min
            WHERE leg_km IS NOT NULL

            RETURN c.name                                AS courier,
                   i + 1                                 AS stop_no,
                   s.o.id                                AS order_id,
                   s.u.name                              AS customer,
                   s.dest.name                           AS delivery_at,
                   round(leg_km, 2)                      AS leg_km,
                   round(leg_min, 1)                     AS leg_min,
                   round(cumul_km, 2)                    AS cumul_km,
                   round(cumul_min, 1)                   AS cumul_min
            ORDER BY c.name, i
        """)

    def summary_all_couriers(self):
        """Run Q3 for all couriers, return totals."""
        return self.run("""
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
            ORDER BY total_km ASC
        """)

    # ── Display ─────────────────────────────────────────────

    def print_courier_details(self, rows, group_by="courier"):
        if not rows:
            print("  No routes found.")
            return

        # Group by courier
        groups = {}
        for r in rows:
            key = r.get("courier", "unknown")
            groups.setdefault(key, []).append(r)

        for cname, stops in groups.items():
            print(f"\n{'=' * 72}")
            print(f"  Repartidor: {cname}")
            print(f"{'=' * 72}")
            print(f"  {'#':<3} {'Pedido':<8} {'Cliente':<18} {'Entrega':<22} "
                  f"{'Tramo km':<9} {'Tramo min':<9} {'Acum km':<9} {'Acum min':<9}")
            print(f"  {'-'*3} {'-'*8} {'-'*18} {'-'*22} {'-'*9} {'-'*9} {'-'*9} {'-'*9}")
            for s in stops:
                print(f"  {s['stop_no']:<3} {s['order_id']:<8} {s['customer']:<18} "
                      f"{s['delivery_at']:<22} {s['leg_km']:<9} {s['leg_min']:<9} "
                      f"{s['cumul_km']:<9} {s['cumul_min']:<9}")

    def print_summary(self, rows):
        if not rows:
            return
        print(f"\n{'=' * 72}")
        print(f"  RESUMEN POR REPARTIDOR")
        print(f"{'=' * 72}")
        print(f"  {'Courier':<20} {'Vehículo':<14} {'Entregas':<9} "
              f"{'Km tot':<8} {'Min tot':<8} {'Prom km':<8} {'Max km':<8}")
        print(f"  {'-'*20} {'-'*14} {'-'*9} {'-'*8} {'-'*8} {'-'*8} {'-'*8}")
        for r in rows:
            print(f"  {r['courier']:<20} {r['vehicle']:<14} {r['deliveries']:<9} "
                  f"{r['total_km']:<8} {r['total_min']:<8} "
                  f"{r['avg_leg_km']:<8} {r['max_leg_km']:<8}")


# ── Main ────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Simulador de rutas de entrega (Neo4j + nearest neighbour)"
    )
    parser.add_argument("--db-engine", choices=["postgres", "mongo"],
                        default=os.getenv("DB_ENGINE", "postgres"))
    parser.add_argument("--reset", action="store_true",
                        help="Clear delivery data before loading")
    parser.add_argument("--hard-reset", action="store_true",
                        help="Clear ENTIRE graph before loading")
    parser.add_argument("--load-base", action="store_true",
                        help="Also load base data (graphs_and_routes schema + seed)")
    parser.add_argument("--courier", type=str, default=None,
                        help="Route only this courier ID (default: all)")

    args = parser.parse_args()
    cfg = Config()
    loader = DeliveryLoader(cfg)

    print(f"\n  Delivery Route Simulator — Engine: {cfg.db_engine}")
    print(f"  Neo4j: {cfg.neo4j_uri}\n")

    try:
        loader.driver.verify_connectivity()
        print("  Connected to Neo4j.\n")
    except Exception as e:
        print(f"  Cannot connect to Neo4j: {e}")
        print("  Start Neo4j or check NEO4J_URI / credentials.")
        sys.exit(1)

    try:
        if args.hard_reset:
            loader.hard_reset()
        elif args.reset:
            loader.reset()

        # ── Load data ──────────────────────────────────────

        if args.load_base or args.hard_reset:
            loader.load_base_schema()
            loader.load_base_seed()
            loader.compute_base_co_purchases()

        loader.load_delivery_schema()
        loader.load_delivery_seed()

        # ── Run routing ────────────────────────────────────

        if args.courier:
            couriers = [args.courier]
        else:
            # Detect available couriers
            courier_rows = loader.run("MATCH (c:Courier) RETURN c.id AS id ORDER BY c.id")
            couriers = [r["id"] for r in courier_rows]

        if not couriers:
            print("\n  No couriers found in the graph.")
            print("  Run with --load-base (or --hard-reset) first, or load base seed.\n")
            sys.exit(0)

        all_routes = []
        for cid in couriers:
            stops = loader.route_single_courier(cid)
            name_rows = loader.run(
                "MATCH (c:Courier {id: $id}) RETURN c.name AS name", {"id": cid})
            courier_name = name_rows[0]["name"] if name_rows else cid
            for s in stops:
                all_routes.append({**dict(s), "courier": courier_name})

        loader.print_courier_details(all_routes)

        summary = loader.summary_all_couriers()
        loader.print_summary(summary)

        print(f"\n  Done. {len(couriers)} courier(s) routed.\n")

    except Exception as e:
        print(f"\n  Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        loader.close()


if __name__ == "__main__":
    main()
