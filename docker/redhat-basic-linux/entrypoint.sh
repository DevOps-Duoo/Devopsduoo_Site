#!/bin/bash
# ─────────────────────────────────────────────
# DevOps Duoo Lab Entrypoint
# Starts ttyd web terminal with auto-shutdown
# ─────────────────────────────────────────────

TTL_MINUTES="${TTL_MINUTES:-30}"
SESSION_ID="${SESSION_ID:-unknown}"
LAB_ID="${LAB_ID:-redhat-basic-linux}"

echo "🚀 Starting lab environment..."
echo "   Session:  $SESSION_ID"
echo "   Lab:      $LAB_ID"
echo "   TTL:      $TTL_MINUTES minutes"

# Schedule auto-termination in background
(
    sleep $((TTL_MINUTES * 60))
    echo "⏱️  Session time expired. Shutting down..."
    kill 1 2>/dev/null
) &

# Start ttyd — web-based terminal
# --writable: allow terminal input
# --port 7681: listen on port 7681
# --base-path /: serve at root
# --credential "": no authentication (session is ephemeral)
exec ttyd \
    --writable \
    --port 7681 \
    --ping-interval 30 \
    --max-clients 1 \
    --title "DevOps Duoo - Linux Lab" \
    bash --login
