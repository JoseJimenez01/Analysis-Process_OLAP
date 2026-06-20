#!/usr/bin/env bash
set -e

echo "=== Initializing Config Servers Replica Set ==="

echo "Waiting for config servers to be ready..."
until mongosh --host config-server-1:27019 --eval "db.adminCommand('ping')" --quiet 2>/dev/null; do
  echo "  Config server 1 not ready yet, retrying in 2s..."
  sleep 2
done

echo "✓ Config servers are ready"

echo "Initiating config server replica set (configrs0)..."
mongosh --host config-server-1:27019 --eval '
  rs.initiate({
    _id: "configrs0",
    members: [
      { _id: 0, host: "config-server-1:27019" },
      { _id: 1, host: "config-server-2:27020" },
      { _id: 2, host: "config-server-3:27021" }
    ]
  });
'

echo "✓ Config server replica set initialized"

# Wait for config server replica set to elect a primary
sleep 5

echo "=== Config Servers Setup Complete ==="
