#!/usr/bin/env bash
set -e

echo "=== Initializing Shard Replica Sets ==="

echo "Waiting for shard 1 nodes to be ready..."
until mongosh --host shard1-node1:27017 --eval "db.adminCommand('ping')" --quiet 2>/dev/null; do
  echo "  Shard 1 node 1 not ready yet, retrying in 2s..."
  sleep 2
done

echo "✓ Shard 1 nodes are ready"

echo "Initiating shard 1 replica set (shard1rs0)..."
mongosh --host shard1-node1:27017 --eval '
  rs.initiate({
    _id: "shard1rs0",
    members: [
      { _id: 0, host: "shard1-node1:27017" },
      { _id: 1, host: "shard1-node2:27018" },
      { _id: 2, host: "shard1-node3:27022" }
    ]
  });
'

echo "✓ Shard 1 replica set initialized"

# Wait for Shard 1 to elect a primary
sleep 5

echo "Waiting for shard 2 nodes to be ready..."
until mongosh --host shard2-node1:27023 --eval "db.adminCommand('ping')" --quiet 2>/dev/null; do
  echo "  Shard 2 node 1 not ready yet, retrying in 2s..."
  sleep 2
done

echo "✓ Shard 2 nodes are ready"

echo "Initiating shard 2 replica set (shard2rs0)..."
mongosh --host shard2-node1:27023 --eval '
  rs.initiate({
    _id: "shard2rs0",
    members: [
      { _id: 0, host: "shard2-node1:27023" },
      { _id: 1, host: "shard2-node2:27024" },
      { _id: 2, host: "shard2-node3:27025" }
    ]
  });
'

echo "✓ Shard 2 replica set initialized"

# Wait for both shards to elect primaries
sleep 5

echo "=== Shard Replica Sets Setup Complete ==="
