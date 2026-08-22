# ─────────────────────────────────────────────────────────
# Docker Inside Container Lab — DevOps Duoo
# Docker-in-Docker (DinD) with web terminal
# Base: docker:27-dind (Alpine-based)
# ─────────────────────────────────────────────────────────

FROM docker:27-dind

LABEL maintainer="DevOps Duoo <hello@devopsduoo.com>"
LABEL description="Docker Inside Container (DinD) Lab environment with web terminal"

# ── Install essential tools ───────────────────────────────
# docker:dind is Alpine-based, so we use apk
# Note: docker-cli-compose is the v2 plugin (docker compose),
# while docker-compose is the legacy v1 standalone binary.
# We install both for compatibility.
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
    docker-cli-compose

# ── Install ttyd (web-based terminal) ─────────────────────
# ttyd exposes a terminal via HTTP on port 7681
RUN curl -Lo /usr/local/bin/ttyd \
    https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64 \
    && chmod +x /usr/local/bin/ttyd

# ── Create a lab user with Docker & sudo access ──────────
# The 'docker' group is created by the docker:dind image.
# We add labuser to it so they can run docker commands.
RUN adduser -D -s /bin/bash labuser \
    && echo "labuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/labuser \
    && chmod 0440 /etc/sudoers.d/labuser \
    && addgroup labuser docker 2>/dev/null || true

# ── Set up a welcome message & lab environment ────────────
RUN mkdir -p /etc/profile.d \
    && cat > /etc/profile.d/lab-welcome.sh << 'WELCOME'
#!/bin/bash
echo ""
echo "  ╔═══════════════════════════════════════════════════════╗"
echo "  ║       🐳  DevOps Duoo - Docker Inside Container  🐳  ║"
echo "  ║                                                       ║"
echo "  ║  Welcome to the Docker-in-Docker (DinD) Lab!         ║"
echo "  ║  You have 30 minutes of free practice time.           ║"
echo "  ║                                                       ║"
echo "  ║  Follow the lab steps on the left panel.              ║"
echo "  ╚═══════════════════════════════════════════════════════╝"
echo ""
echo "  Docker version: $(docker --version 2>/dev/null || echo 'starting...')"
echo ""
WELCOME
RUN chmod +x /etc/profile.d/lab-welcome.sh

# ── Entrypoint ───────────────────────────────────────────
COPY --chmod=755 entrypoint.sh /usr/local/bin/entrypoint.sh

# ── Expose ttyd port ─────────────────────────────────────
EXPOSE 7681

# ── Health check ─────────────────────────────────────────
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=30s \
    CMD curl -f http://localhost:7681 || exit 1

# DinD requires privileged mode at runtime (docker run --privileged)
# The entrypoint starts dockerd + ttyd
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
