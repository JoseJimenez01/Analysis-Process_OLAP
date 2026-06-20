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
  sh.addShard("shard1rs0/shard1-node1:27017,shard1-node2:27018,shard1-node3:27022");
  sh.addShard("shard2rs0/shard2-node1:27023,shard2-node2:27024,shard2-node3:27025");
  printjson(sh.status());
'

echo "✓ Shards added successfully"

echo "Enabling sharding on database and collections..."
mongosh --host mongos:27017 --eval '
  sh.enableSharding("restaurantes");
  db = db.getSiblingDB("restaurantes");
  db.products.createIndex({ productId: "hashed" });
  sh.shardCollection("restaurantes.products", { productId: "hashed" });
  db.reservations.createIndex({ userId: "hashed" });
  sh.shardCollection("restaurantes.reservations", { userId: "hashed" });
  db.menus.createIndex({ restaurantId: "hashed" });
  sh.shardCollection("restaurantes.menus", { restaurantId: "hashed" });
  printjson(sh.status());
'

echo "✓ Sharding configured on all collections"

echo "=== Sharding Configuration Complete ==="
echo ""
echo "Cluster Information:"
mongosh --host mongos:27017 --eval '
  printjson(db.adminCommand({ listShards: 1 }));
'
