# ─────────────────────────────────────────────────────────
# K3s Master Node — DevOps Duoo Kubernetes Lab
# Runs K3s server (control plane) + ttyd web terminal
# Base: rancher/k3s (Alpine-based)
# ─────────────────────────────────────────────────────────

# ── Stage 1: Get k3s binary ──────────────────────────────
FROM rancher/k3s:v1.31.4-k3s1 AS k3s-bin

# ── Stage 2: Final lab image ─────────────────────────────
FROM alpine:3.19

LABEL maintainer="DevOps Duoo <hello@devopsduoo.com>"
LABEL description="K3s Master Node lab environment with web terminal"

# Copy k3s binary and set up symlinks
COPY --from=k3s-bin /bin/k3s /usr/local/bin/k3s
RUN ln -s /usr/local/bin/k3s /usr/local/bin/kubectl \
    && ln -s /usr/local/bin/k3s /usr/local/bin/crictl \
    && ln -s /usr/local/bin/k3s /usr/local/bin/ctr

# ── Install essential tools ───────────────────────────────
# We use Alpine as the base, so we can use apk
RUN apk add --no-cache \
    bash \
    coreutils \
    findutils \
    grep \
    sed \
    gawk \
    procps \
    net-tools \
    iproute2 \
    curl \
    wget \
    vim \
    nano \
    less \
    tar \
    gzip \
    unzip \
    shadow \
    sudo \
    jq \
    git \
    tree \
    openssl \
    iptables \
    socat \
    ipset \
    ebtables

# ── Install ttyd (web-based terminal) ─────────────────────
# ttyd exposes a terminal via HTTP on port 7681
RUN curl -Lo /usr/local/bin/ttyd \
    https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64 \
    && chmod +x /usr/local/bin/ttyd

# ── Install Helm ─────────────────────────────────────────
RUN curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# ── Create a lab user with sudo access ───────────────────
RUN adduser -D -s /bin/bash labuser \
    && echo "labuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/labuser \
    && chmod 0440 /etc/sudoers.d/labuser

# ── Set up kubectl config directory for labuser ──────────
RUN mkdir -p /home/labuser/.kube \
    && chown -R labuser:labuser /home/labuser/.kube

# ── Set up welcome message ───────────────────────────────
RUN mkdir -p /etc/profile.d \
    && cat > /etc/profile.d/lab-welcome.sh << 'WELCOME'
#!/bin/bash
echo ""
echo "  ╔═══════════════════════════════════════════════════════╗"
echo "  ║    ☸️  DevOps Duoo — Kubernetes Lab (Master Node)  ☸️  ║"
echo "  ║                                                       ║"
echo "  ║  You are on the K3s MASTER (control plane).           ║"
echo "  ║  kubectl is pre-configured. Try: kubectl get nodes    ║"
echo "  ║                                                       ║"
echo "  ║  Follow the lab steps on the left panel.              ║"
echo "  ╚═══════════════════════════════════════════════════════╝"
echo ""
echo "  K3s version: $(k3s --version 2>/dev/null | head -1 || echo 'starting...')"
echo "  Helm version: $(helm version --short 2>/dev/null || echo 'starting...')"
echo ""
WELCOME
RUN chmod +x /etc/profile.d/lab-welcome.sh

# ── Shared volume for K3s node token ─────────────────────
# The worker node reads the token from this volume to join the cluster
VOLUME /var/lib/rancher/k3s/server

# ── Entrypoint ───────────────────────────────────────────
COPY --chmod=755 entrypoint.sh /usr/local/bin/entrypoint.sh

# ── Expose ports ─────────────────────────────────────────
# 7681 = ttyd web terminal
# 6443 = K3s API server (for worker to join)
EXPOSE 7681 6443

# ── Health check ─────────────────────────────────────────
HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=60s \
    CMD curl -f http://localhost:7681 || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
