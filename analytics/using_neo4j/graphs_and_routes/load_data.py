"""
ETL: carga datos reales desde los contenedores de BD (Postgres/MongoDB) a Neo4j.

Conecta directo a Postgres (psycopg2) o MongoDB (pymongo) sin pasar por
Prisma/Mongoose. Ideal para ejecutar desde el host o desde un container.

Uso:
    # Postgres (default)
    python load_data.py

    # MongoDB
    python load_data.py --db-engine mongo

    # Solo seed.cypher, sin datos reales
    python load_data.py --seed-only

    # Reset + recargar todo
    python load_data.py --reset

Variables de entorno (y defaults para container names docker-compose):
    DB_ENGINE       postgres | mongodb     (default: postgres)

    # Postgres
    PG_HOST         localhost              (container: py01_postgres)
    PG_PORT         5432
    PG_USER         postgres
    PG_PASSWORD     postgres
    PG_DB           restaurantes

    # MongoDB
    MONGO_URI       mongodb://localhost:27017/restaurantes
                    (container: mongodb://py01_mongos:27017/restaurantes)

    # Neo4j
    NEO4J_URI       bolt://localhost:7687
    NEO4J_USER      neo4j
    NEO4J_PASSWORD  password

    # Behavior
    SKIP_SEED       set to "1" to skip seed.cypher
"""

import argparse
import os
import sys
from pathlib import Path

from neo4j import GraphDatabase


# ── Config ──────────────────────────────────────────────────────────────────

class Config:
    db_engine = os.getenv("DB_ENGINE", "postgres")

    pg_host = os.getenv("PG_HOST", "localhost")
    pg_port = int(os.getenv("PG_PORT", "5432"))
    pg_user = os.getenv("PG_USER", "postgres")
    pg_pass = os.getenv("PG_PASSWORD", "postgres")
    pg_db = os.getenv("PG_DB", "restaurantes")

    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/restaurantes")

    neo4j_uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    neo4j_user = os.getenv("NEO4J_USER", "neo4j")
    neo4j_pass = os.getenv("NEO4J_PASSWORD", "password")

    skip_seed = os.getenv("SKIP_SEED", "") == "1"


# ── Neo4j client ────────────────────────────────────────────────────────────

class Neo4jLoader:
    def __init__(self, config: Config):
        self.driver = GraphDatabase.driver(
            config.neo4j_uri,
            auth=(config.neo4j_user, config.neo4j_pass),
        )

    def close(self):
        self.driver.close()

    def run(self, query, parameters=None):
        with self.driver.session() as session:
            return list(session.run(query, parameters or {}))

    def reset(self):
        self.run("MATCH (n) DETACH DELETE n")
        print("  Graph cleared.")

    def create_constraints(self):
        for c in [
            "CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE",
            "CREATE CONSTRAINT product_id IF NOT EXISTS FOR (p:Product) REQUIRE p.id IS UNIQUE",
            "CREATE CONSTRAINT order_id IF NOT EXISTS FOR (o:Order) REQUIRE o.id IS UNIQUE",
            "CREATE CONSTRAINT location_id IF NOT EXISTS FOR (l:Location) REQUIRE l.id IS UNIQUE",
        ]:
            self.run(c)
        print("  Constraints created.")

    def load_seed_cypher(self):
        cypher_path = Path(__file__).parent / "seed.cypher"
        if not cypher_path.exists():
            print("  No seed.cypher found, skipping.")
            return

        print("  Loading seed.cypher...")
        content = cypher_path.read_text()
        # Strip single-line comments before splitting
        lines = [l for l in content.split("\n") if not l.strip().startswith("//")]
        clean = "\n".join(lines)
        for stmt in clean.split(";"):
            stmt = stmt.strip()
            if not stmt:
                continue
            try:
                self.run(stmt)
            except Exception as e:
                print(f"  [WARN] {e}")

    def compute_co_purchases(self):
        print("  Computing co-purchase relationships...")
        self.run("""
            MATCH (o:Order)-[:CONTAINS]->(p1:Product)
            MATCH (o)-[:CONTAINS]->(p2:Product)
            WHERE p1 <> p2
            WITH p1, p2, count(DISTINCT o) AS freq
            MERGE (p1)-[:CO_PURCHASED_WITH {weight: freq}]->(p2)
            MERGE (p2)-[:CO_PURCHASED_WITH {weight: freq}]->(p1)
        """)

    def run_in_batch(self, queries):
        with self.driver.session() as session:
            for q in queries:
                session.run(q)


# ── Postgres ETL ────────────────────────────────────────────────────────────

def _load_postgres(loader: Neo4jLoader, cfg: Config):
    import psycopg2
    import psycopg2.extras

    conn = psycopg2.connect(
        host=cfg.pg_host,
        port=cfg.pg_port,
        user=cfg.pg_user,
        password=cfg.pg_pass,
        dbname=cfg.pg_db,
    )
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Users
    cur.execute('SELECT id, name, email, role FROM "User"')
    users = cur.fetchall()
    print(f"    Users: {len(users)}")
    for u in users:
        loader.run(
            "MERGE (u:User {id: $id}) SET u.name = $name, u.email = $email, u.role = $role",
            {"id": u["id"], "name": u["name"], "email": u["email"], "role": u["role"]},
        )

    # Categories
    cur.execute('SELECT id, name FROM "Category"')
    categories = {c["id"]: c["name"] for c in cur.fetchall()}

    # Products
    cur.execute('SELECT id, name, price, category_id FROM "Product"')
    products = cur.fetchall()
    print(f"    Products: {len(products)}")
    for p in products:
        cat = categories.get(p["category_id"], "General")
        loader.run(
            "MERGE (p:Product {id: $id}) SET p.name = $name, p.price = $price, p.category = $cat",
            {"id": p["id"], "name": p["name"], "price": float(p["price"]), "cat": cat},
        )

    # Reservations → Orders
    cur.execute('''
        SELECT r.id, r.reservation_date, r.party_size, r.status,
               r.user_id, r.restaurant_id, rest.name AS rest_name
        FROM "Reservation" r
        JOIN "Restaurant" rest ON rest.id = r.restaurant_id
    ''')
    reservations = cur.fetchall()
    print(f"    Reservations (→ Orders): {len(reservations)}")

    batch = []
    for r in reservations:
        oid = f"res-{r['id']}"
        date_str = r["reservation_date"].isoformat()[:10] if r["reservation_date"] else "2025-01-01"
        total = float(r["party_size"] or 1) * 50

        batch.append(f"""
            MERGE (o:Order {{id: '{oid}'}})
            SET o.date = date('{date_str}'), o.total = {total}, o.status = '{r['status'] or 'pending'}'
        """)
        batch.append(f"""
            MATCH (u:User {{id: '{r['user_id']}'}})
            MATCH (o:Order {{id: '{oid}'}})
            MERGE (u)-[:PURCHASED]->(o)
        """)

    if batch:
        loader.run_in_batch(batch)

    cur.close()
    conn.close()


# ── MongoDB ETL ─────────────────────────────────────────────────────────────

def _load_mongo(loader: Neo4jLoader, cfg: Config):
    import pymongo

    client = pymongo.MongoClient(cfg.mongo_uri)
    db = client.get_default_database()

    # Users
    users = list(db.users.find())
    print(f"    Users: {len(users)}")
    for u in users:
        loader.run(
            "MERGE (u:User {id: $id}) SET u.name = $name, u.email = $email, u.role = $role",
            {"id": str(u["_id"]), "name": u.get("name", ""), "email": u.get("email", ""),
             "role": u.get("role", "customer")},
        )

    # Categories
    cats = {str(c["_id"]): c.get("name", "General") for c in db.categories.find()}

    # Products
    products = list(db.products.find())
    print(f"    Products: {len(products)}")
    for p in products:
        cat = cats.get(str(p.get("categoryId", "")), "General")
        loader.run(
            "MERGE (p:Product {id: $id}) SET p.name = $name, p.price = $price, p.category = $cat",
            {"id": str(p["_id"]), "name": p.get("name", ""), "price": float(p.get("price", 0)),
             "cat": cat},
        )

    # Reservations → Orders
    reservations = list(db.reservations.find())
    print(f"    Reservations (→ Orders): {len(reservations)}")

    batch = []
    for r in reservations:
        oid = f"res-{r['_id']}"
        date_val = r.get("reservationDate", r.get("reservation_date"))
        date_str = date_val.isoformat()[:10] if date_val else "2025-01-01"
        total = float(r.get("partySize", r.get("party_size", 1))) * 50

        batch.append(f"""
            MERGE (o:Order {{id: '{oid}'}})
            SET o.date = date('{date_str}'), o.total = {total},
                o.status = '{r.get('status', 'pending')}'
        """)
        batch.append(f"""
            MATCH (u:User {{id: '{r.get('userId', r.get('user_id', ''))}'}})
            MATCH (o:Order {{id: '{oid}'}})
            MERGE (u)-[:PURCHASED]->(o)
        """)
    if batch:
        loader.run_in_batch(batch)

    client.close()


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Load data into Neo4j")
    parser.add_argument("--db-engine", choices=["postgres", "mongo"],
                        default=os.getenv("DB_ENGINE", "postgres"))
    parser.add_argument("--reset", action="store_true", help="Clear graph before loading")
    parser.add_argument("--seed-only", action="store_true",
                        help="Only load seed.cypher, skip real DB ETL")
    args = parser.parse_args()

    cfg = Config()
    if args.db_engine:
        cfg.db_engine = args.db_engine

    print(f"\n  Neo4j Data Loader — Engine: {cfg.db_engine}")
    print(f"  Neo4j: {cfg.neo4j_uri}\n")

    loader = Neo4jLoader(cfg)

    try:
        loader.driver.verify_connectivity()
        print("  Connected to Neo4j.\n")
    except Exception as e:
        print(f"  Cannot connect to Neo4j: {e}")
        print("  Start Neo4j or check NEO4J_URI / credentials.")
        sys.exit(1)

    try:
        if args.reset:
            loader.reset()

        loader.create_constraints()

        if not cfg.skip_seed:
            loader.load_seed_cypher()

        if not args.seed_only:
            if cfg.db_engine == "mongo":
                _load_mongo(loader, cfg)
            else:
                _load_postgres(loader, cfg)

        loader.compute_co_purchases()

        print("\n  Done. Graph loaded successfully.")

    except Exception as e:
        print(f"\n  Error: {e}")
        sys.exit(1)
    finally:
        loader.close()


if __name__ == "__main__":
    main()
