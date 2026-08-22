#!/bin/bash
# ─────────────────────────────────────────────
# DevOps Duoo — Docker Inside Container Lab Entrypoint
# Starts Docker daemon (DinD) + ttyd web terminal
# with auto-shutdown
# ─────────────────────────────────────────────

set -e

TTL_MINUTES="${TTL_MINUTES:-30}"
SESSION_ID="${SESSION_ID:-unknown}"
LAB_ID="${LAB_ID:-docker-inside-container}"

echo "🚀 Starting Docker-in-Docker lab environment..."
echo "   Session:  $SESSION_ID"
echo "   Lab:      $LAB_ID"
echo "   TTL:      $TTL_MINUTES minutes"

# ── Start the Docker daemon in background ─────────────────
# DinD requires the container to run with --privileged
echo "🐳 Starting Docker daemon..."

# The official docker:dind image provides dockerd-entrypoint.sh
# which handles cgroup setup and storage driver initialization.
# If it doesn't exist, fall back to running dockerd directly.
if command -v dockerd-entrypoint.sh &>/dev/null; then
    dockerd-entrypoint.sh dockerd \
        --host=unix:///var/run/docker.sock \
        --storage-driver=overlay2 \
        &>/var/log/dockerd.log &
else
    dockerd \
        --host=unix:///var/run/docker.sock \
        --storage-driver=overlay2 \
        &>/var/log/dockerd.log &
fi

# Wait for Docker daemon to be ready (up to 30 seconds)
echo "⏳ Waiting for Docker daemon to be ready..."
RETRIES=30
until docker info &>/dev/null; do
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -eq 0 ]; then
        echo "❌ Docker daemon failed to start after 30 seconds."
        echo "   Check logs: cat /var/log/dockerd.log"
        # Don't exit — still launch ttyd so user can debug
        break
    fi
    sleep 1
done

if docker info &>/dev/null; then
    echo "✅ Docker daemon is ready!"
    # Make Docker socket accessible to labuser
    chmod 666 /var/run/docker.sock 2>/dev/null || true
fi

# ── Schedule auto-termination in background ───────────────
(
    sleep $((TTL_MINUTES * 60))
    echo "⏱️  Session time expired. Shutting down..."
    kill 1 2>/dev/null
) &

# ── Start ttyd — web-based terminal ──────────────────────
# --writable: allow terminal input
# --port 7681: listen on port 7681
# --credential "": no authentication (session is ephemeral)
exec ttyd \
    --writable \
    --port 7681 \
    --ping-interval 30 \
    --max-clients 1 \
    --client-option titleFixed="DevOps Duoo - Docker Lab" \
    su - labuser
