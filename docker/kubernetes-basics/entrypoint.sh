#!/bin/bash
# ─────────────────────────────────────────────
# DevOps Duoo — K3s Master Node Entrypoint
# Starts K3s server + ttyd web terminal
# with auto-shutdown
# ─────────────────────────────────────────────

set -e

TTL_MINUTES="${TTL_MINUTES:-30}"
SESSION_ID="${SESSION_ID:-unknown}"
LAB_ID="${LAB_ID:-kubernetes-basics}"
K3S_TOKEN="${K3S_TOKEN:-devopsduoo-lab-token}"
MASTER_IP="${MASTER_IP:-}"

echo "🚀 Starting K3s Master Node..."
echo "   Session:  $SESSION_ID"
echo "   Lab:      $LAB_ID"
echo "   TTL:      $TTL_MINUTES minutes"

# ── Start K3s server in background ──────────────────────
echo "☸️  Starting K3s server (control plane)..."

K3S_ARGS=(
    "--disable" "traefik"
    "--disable" "servicelb"
    "--disable" "metrics-server"
    "--disable" "local-storage"
    "--write-kubeconfig-mode" "644"
    "--token" "$K3S_TOKEN"
    "--node-name" "k3s-master"
    "--tls-san" "k3s-master"
    "--kubelet-arg" "max-pods=50"
)

if [ -n "$MASTER_IP" ]; then
    K3S_ARGS+=("--tls-san" "$MASTER_IP")
fi

k3s server "${K3S_ARGS[@]}" &>/var/log/k3s-server.log &

K3S_PID=$!

# Wait for K3s to be ready in the background so we don't block ttyd
(
    echo "⏳ Waiting for K3s API server to be ready..."
    RETRIES=90
    until k3s kubectl get node &>/dev/null; do
        RETRIES=$((RETRIES - 1))
        if [ $RETRIES -eq 0 ]; then
            echo "❌ K3s server failed to start after 90 seconds."
            echo "   Check logs: cat /var/log/k3s-server.log"
            break
        fi
        sleep 1
    done

    if k3s kubectl get node &>/dev/null; then
        echo "✅ K3s server is ready!"

        # Copy kubeconfig so labuser can use kubectl
        mkdir -p /home/labuser/.kube
        cp /etc/rancher/k3s/k3s.yaml /home/labuser/.kube/config
        
        # If MASTER_IP is set, update kubeconfig to use it
        if [ -n "$MASTER_IP" ]; then
            sed -i "s|127.0.0.1|${MASTER_IP}|g" /home/labuser/.kube/config
        fi
        
        chown -R labuser:labuser /home/labuser/.kube
        chmod 600 /home/labuser/.kube/config

        # Also make kubectl accessible without k3s prefix
        ln -sf /usr/local/bin/k3s /usr/local/bin/kubectl 2>/dev/null || true

        # Set KUBECONFIG for all users
        echo "export KUBECONFIG=/home/labuser/.kube/config" >> /etc/profile.d/kubeconfig.sh
        chmod +x /etc/profile.d/kubeconfig.sh

        # Wait for the node to be Ready
        echo "⏳ Waiting for master node to be Ready..."
        for i in $(seq 1 60); do
            STATUS=$(k3s kubectl get node k3s-master -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "False")
            if [ "$STATUS" = "True" ]; then
                echo "✅ Master node is Ready!"
                break
            fi
            sleep 2
        done
    fi
) &

# ── Schedule auto-termination ──────────────────────────
(
    sleep $((TTL_MINUTES * 60))
    echo "⏱️  Session time expired. Shutting down..."
    kill 1 2>/dev/null
) &

# ── Start ttyd — web-based terminal ────────────────────
echo "💻 Starting web terminal on port 7681..."
exec ttyd \
    --writable \
    --port 7681 \
    --ping-interval 30 \
    --client-option titleFixed="DevOps Duoo - K3s Master" \
    su - labuser
