#!/usr/bin/env bash
set -e

echo "=== Configuring Sharding on Mongos ==="

echo "Waiting for mongos to be ready..."
until mongosh --host mongos:27017 --eval "db.adminCommand('ping')" --quiet 2>/dev/null; do
  echo "  Mongos not ready yet, retrying in 2s..."
  sleep 2
done

echo "✓ Mongos is ready"

echo "Adding shards to the cluster..."
mongosh --host mongos:27017 --eval '
  const listShards = db.adminCommand({ listShards: 1 });
  const existing = (listShards.ok && listShards.shards) ? listShards.shards.map(s => s._id) : [];
  if (!existing.includes("shard1rs0")) {
    sh.addShard("shard1rs0/shard1-node1:27017,shard1-node2:27018,shard1-node3:27022");
  } else {
    print("shard1rs0 already added, skipping.");
  }
  if (!existing.includes("shard2rs0")) {
    sh.addShard("shard2rs0/shard2-node1:27023,shard2-node2:27024,shard2-node3:27025");
  } else {
    print("shard2rs0 already added, skipping.");
  }
  printjson(sh.status());
'

echo "✓ Shards added successfully"

echo "Enabling sharding on database and collections..."
mongosh --host mongos:27017 --eval '
  const dbName = "restaurantes";
  const listDatabases = db.adminCommand({ listDatabases: 1 });
  const dbList = listDatabases.databases.map(d => d.name);
  const isSharded = dbList.includes("restaurantes");
  if (!isSharded) {
    sh.enableSharding(dbName);
    db = db.getSiblingDB(dbName);
    db.products.createIndex({ productId: "hashed" });
    sh.shardCollection(dbName + ".products", { productId: "hashed" });
    db.reservations.createIndex({ userId: "hashed" });
    sh.shardCollection(dbName + ".reservations", { userId: "hashed" });
    db.menus.createIndex({ restaurantId: "hashed" });
    sh.shardCollection(dbName + ".menus", { restaurantId: "hashed" });
    print("Sharding enabled on all collections.");
  } else {
    print("Database already sharded, skipping.");
  }
  printjson(sh.status());
'

echo "✓ Sharding configured on all collections"

echo "=== Sharding Configuration Complete ==="
echo ""
echo "Cluster Information:"
mongosh --host mongos:27017 --eval '
  printjson(db.adminCommand({ listShards: 1 }));
'
