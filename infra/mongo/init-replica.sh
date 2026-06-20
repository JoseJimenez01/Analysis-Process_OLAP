#!/usr/bin/env bash
set -e

echo "=== Initializing MongoDB Replica Set ==="

echo "Waiting for mongo1 to be ready..."
until mongosh --host mongo1:27017 --eval "db.adminCommand('ping')" --quiet 2>/dev/null; do
  echo "  mongo1 not ready, retrying in 2s..."
  sleep 2
done

echo "✓ MongoDB nodes are ready"

echo "Initiating replica set rs0..."
mongosh --host mongo1:27017 <<'EOF'
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" }
  ]
})
EOF

echo "✓ Replica set initialized"
echo "=== MongoDB Setup Complete ==="
