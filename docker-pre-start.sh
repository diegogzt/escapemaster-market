#!/bin/sh
# Pre-start wrapper: kill any process using the app port
PORT=${PORT:-4321}
echo "[pre-start] Killing any process on port $PORT..."
fuser -k ${PORT}/tcp 2>/dev/null || true
pkill -f "node.*entry.mjs" 2>/dev/null || true
echo "[pre-start] Starting app..."
exec "$@"
