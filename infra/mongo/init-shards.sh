#!/usr/bin/env bash
set -e

echo "=== Initializing Shard Replica Sets ==="

init_replica_set() {
  local name=$1 host=$2 port=$3 members=$4
  echo "Waiting for $name nodes to be ready..."
  until mongosh --host "$host:$port" --eval "db.adminCommand('ping')" --quiet 2>/dev/null; do
    echo "  $name not ready yet, retrying in 2s..."
    sleep 2
  done
  echo "✓ $name nodes are ready"

  if mongosh --host "$host:$port" --eval "rs.status().ok" --quiet 2>/dev/null | grep -q 1; then
    echo "  $name replica set already initialized, skipping."
    return 0
  fi

  echo "Initiating $name replica set ($host:$port)..."
  mongosh --host "$host:$port" --eval "rs.initiate($members)"
  echo "✓ $name replica set initialized"
}

sleep 5

init_replica_set "shard1rs0" "shard1-node1" 27017 '{
  _id: "shard1rs0",
  members: [
    { _id: 0, host: "shard1-node1:27017" },
    { _id: 1, host: "shard1-node2:27018" },
    { _id: 2, host: "shard1-node3:27022" }
  ]
}'

sleep 5

init_replica_set "shard2rs0" "shard2-node1" 27023 '{
  _id: "shard2rs0",
  members: [
    { _id: 0, host: "shard2-node1:27023" },
    { _id: 1, host: "shard2-node2:27024" },
    { _id: 2, host: "shard2-node3:27025" }
  ]
}'

sleep 5

echo "=== Shard Replica Sets Setup Complete ==="
