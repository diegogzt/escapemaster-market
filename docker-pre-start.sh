#!/bin/sh
# Pre-start wrapper: kill any process using the app port before launching
PORT=${PORT:-4321}
echo "[pre-start] Checking port $PORT..."
# Use lsof if available, fall back to ss
if command -v lsof >/dev/null 2>&1; then
    PIDS=$(lsof -t -i:${PORT} 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        echo "[pre-start] Killing processes on port $PORT: $PIDS"
        echo "$PIDS" | xargs kill -9 2>/dev/null || true
    fi
fi
# Also kill any stray node processes for this app
if command -v pkill >/dev/null 2>&1; then
    pkill -f "node.*entry.mjs" 2>/dev/null || true
fi
echo "[pre-start] Starting app..."
exec "$@"
