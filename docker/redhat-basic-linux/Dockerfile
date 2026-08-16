# ─────────────────────────────────────────────────────────
# Red Hat Basic Linux Lab — DevOps Duoo
# Uses the official Red Hat UBI9 (Universal Base Image)
# Image: registry.access.redhat.com/ubi9/ubi:latest
# ─────────────────────────────────────────────────────────

FROM registry.access.redhat.com/ubi9/ubi:latest

LABEL maintainer="DevOps Duoo <hello@devopsduoo.com>"
LABEL description="Red Hat Basic Linux Lab environment with web terminal"

# ── Install essential Linux learning tools ────────────────
RUN dnf install -y --allowerasing \
    bash \
    coreutils \
    findutils \
    grep \
    sed \
    gawk \
    procps-ng \
    net-tools \
    iproute \
    curl \
    wget \
    vim-minimal \
    nano \
    which \
    man-db \
    less \
    tar \
    gzip \
    unzip \
    shadow-utils \
    passwd \
    sudo \
    hostname \
    diffutils \
    && dnf clean all \
    && rm -rf /var/cache/dnf

# ── Install ttyd (web-based terminal) ─────────────────────
# ttyd exposes a terminal via HTTP on port 7681
RUN curl -Lo /usr/local/bin/ttyd \
    https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64 \
    && chmod +x /usr/local/bin/ttyd

# ── Create a lab user with sudo access ────────────────────
RUN useradd -m -s /bin/bash labuser \
    && echo "labuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/labuser \
    && chmod 0440 /etc/sudoers.d/labuser

# ── Set up a welcome message & lab environment ────────────
RUN echo '#!/bin/bash' > /etc/profile.d/lab-welcome.sh \
    && echo 'echo ""' >> /etc/profile.d/lab-welcome.sh \
    && echo 'echo "  ╔═══════════════════════════════════════════════════════╗"' >> /etc/profile.d/lab-welcome.sh \
    && echo 'echo "  ║          🐧  DevOps Duoo - Linux Lab  🐧             ║"' >> /etc/profile.d/lab-welcome.sh \
    && echo 'echo "  ║                                                       ║"' >> /etc/profile.d/lab-welcome.sh \
    && echo 'echo "  ║  Welcome to the Red Hat Basic Linux Lab!              ║"' >> /etc/profile.d/lab-welcome.sh \
    && echo 'echo "  ║  You have 30 minutes of free practice time.           ║"' >> /etc/profile.d/lab-welcome.sh \
    && echo 'echo "  ║                                                       ║"' >> /etc/profile.d/lab-welcome.sh \
    && echo 'echo "  ║  OS: \$(cat /etc/redhat-release 2>/dev/null || echo \"Red Hat UBI 9\")  "' >> /etc/profile.d/lab-welcome.sh \
    && echo 'echo "  ║  Follow the lab steps on the left panel.              ║"' >> /etc/profile.d/lab-welcome.sh \
    && echo 'echo "  ╚═══════════════════════════════════════════════════════╝"' >> /etc/profile.d/lab-welcome.sh \
    && echo 'echo ""' >> /etc/profile.d/lab-welcome.sh \
    && chmod +x /etc/profile.d/lab-welcome.sh

# ── Auto-termination script ──────────────────────────────
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# ── Expose ttyd port ─────────────────────────────────────
EXPOSE 7681

# ── Health check ─────────────────────────────────────────
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=10s \
    CMD curl -f http://localhost:7681 || exit 1

# We run ttyd as root to ensure it has permission to allocate pseudo-terminals (/dev/ptmx).
# ttyd will spawn the shell as labuser securely.
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
