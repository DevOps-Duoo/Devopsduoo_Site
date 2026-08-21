#!/bin/bash
# ─────────────────────────────────────────────────────────
# DevOps Duoo — Nginx SSL Setup Script
# Run on EC2 lab server to configure Nginx + Let's Encrypt
# 
# Usage: ./setup-nginx-ssl.sh <lab-domain> <email>
# Example: ./setup-nginx-ssl.sh lab.devopsduoo.in hello@devopsduoo.com
# ─────────────────────────────────────────────────────────

set -euo pipefail

LAB_DOMAIN="${1:?Usage: $0 <lab-domain> <email>}"
EMAIL="${2:?Usage: $0 <lab-domain> <email>}"

echo "🔧 Setting up Nginx SSL reverse proxy for: $LAB_DOMAIN"

# ── Install Nginx & Certbot ──────────────────────────────
echo "📦 Installing Nginx and Certbot..."
if command -v dnf &>/dev/null; then
    # Amazon Linux 2023 / RHEL
    dnf install -y nginx python3-pip
    pip3 install certbot certbot-nginx
elif command -v yum &>/dev/null; then
    # Amazon Linux 2
    amazon-linux-extras install -y nginx1
    yum install -y python3-pip
    pip3 install certbot certbot-nginx
elif command -v apt-get &>/dev/null; then
    # Ubuntu/Debian
    apt-get update && apt-get install -y nginx certbot python3-certbot-nginx
fi

# ── Create directories ───────────────────────────────────
mkdir -p /var/www/certbot
mkdir -p /etc/nginx/conf.d

# ── Initialize the port map file ─────────────────────────
if [ ! -f /etc/nginx/lab-ports.map ]; then
    cat > /etc/nginx/lab-ports.map << 'MAPEOF'
map $session_id $backend_port {
    default 0;
}
MAPEOF
    echo "✅ Created initial port map: /etc/nginx/lab-ports.map"
fi

# ── Deploy Nginx config ─────────────────────────────────
# Replace the placeholder domain with the actual domain
NGINX_CONF="/etc/nginx/conf.d/lab-proxy.conf"

if [ -f /opt/devops-duoo-labs/nginx-lab-proxy.conf ]; then
    sed "s/LAB_DOMAIN_PLACEHOLDER/$LAB_DOMAIN/g" \
        /opt/devops-duoo-labs/nginx-lab-proxy.conf > "$NGINX_CONF"
else
    # Generate config inline if template not available
    cat > "$NGINX_CONF" << CONFEOF
include /etc/nginx/lab-ports.map;

server {
    listen 80;
    server_name $LAB_DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\\\$host\\\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $LAB_DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$LAB_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$LAB_DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header Content-Security-Policy "frame-ancestors https://*.devopsduoo.in https://devopsduoo.in https://*.devopsduoo.com https://devopsduoo.com" always;
    add_header X-Content-Type-Options "nosniff" always;

    location ~ ^/s/([^/]+)/(.*) {
        set \\\$session_id \\\$1;
        set \\\$remaining_path \\\$2;

        if (\\\$backend_port = 0) {
            return 404 '{"error": "Session not found or expired"}';
        }

        proxy_pass http://127.0.0.1:\\\$backend_port/\\\$remaining_path\\\$is_args\\\$args;
        proxy_http_version 1.1;
        proxy_hide_header X-Frame-Options;
        proxy_hide_header Content-Security-Policy;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;
        proxy_cache off;
    }

    location /health {
        return 200 '{"status": "ok"}';
        add_header Content-Type application/json;
    }

    location / {
        return 200 '{"service": "DevOps Duoo Lab Proxy", "status": "running"}';
        add_header Content-Type application/json;
    }
}
CONFEOF
fi

echo "✅ Nginx config deployed to: $NGINX_CONF"

# ── Remove default server block if it conflicts ──────────
rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true

# ── Start Nginx (HTTP only first, for ACME challenge) ────
# Temporarily create a simple HTTP-only config for certbot
cat > /etc/nginx/conf.d/lab-proxy-temp.conf << TEMPEOF
server {
    listen 80;
    server_name $LAB_DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Waiting for SSL setup...';
    }
}
TEMPEOF

# Disable the full config temporarily (it references certs that don't exist yet)
mv "$NGINX_CONF" "${NGINX_CONF}.pending"

# Start/restart Nginx with temp config
systemctl enable nginx
systemctl restart nginx

echo "🔒 Obtaining SSL certificate from Let's Encrypt..."

# ── Obtain SSL certificate ───────────────────────────────
certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --domain "$LAB_DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --force-renewal

# ── Swap back the full config ────────────────────────────
rm -f /etc/nginx/conf.d/lab-proxy-temp.conf
mv "${NGINX_CONF}.pending" "$NGINX_CONF"

# Test and reload Nginx
nginx -t && systemctl reload nginx

echo "✅ SSL certificate obtained and Nginx reloaded!"

# ── Auto-renewal cron ────────────────────────────────────
echo "0 3 * * * root certbot renew --quiet --deploy-hook 'systemctl reload nginx'" \
    > /etc/cron.d/certbot-renew
chmod 644 /etc/cron.d/certbot-renew

echo "✅ Auto-renewal cron set up (daily at 3 AM)"

# ── Create helper scripts ────────────────────────────────

# Script to add a session to the port map
cat > /usr/local/bin/lab-add-session << 'ADDEOF'
#!/bin/bash
# Usage: lab-add-session <session-id> <port>
SESSION_ID="$1"
PORT="$2"

if [ -z "$SESSION_ID" ] || [ -z "$PORT" ]; then
    echo "Usage: lab-add-session <session-id> <port>"
    exit 1
fi

MAP_FILE="/etc/nginx/lab-ports.map"

# Add the mapping before the closing brace
sed -i "/^}$/i\\    $SESSION_ID $PORT;" "$MAP_FILE"

# Reload Nginx to pick up the new mapping
nginx -s reload 2>/dev/null

echo "✅ Added session $SESSION_ID → port $PORT"
ADDEOF
chmod +x /usr/local/bin/lab-add-session

# Script to remove a session from the port map
cat > /usr/local/bin/lab-remove-session << 'RMEOF'
#!/bin/bash
# Usage: lab-remove-session <session-id>
SESSION_ID="$1"

if [ -z "$SESSION_ID" ]; then
    echo "Usage: lab-remove-session <session-id>"
    exit 1
fi

MAP_FILE="/etc/nginx/lab-ports.map"

# Remove the line containing this session ID
sed -i "/$SESSION_ID/d" "$MAP_FILE"

# Reload Nginx
nginx -s reload 2>/dev/null

echo "✅ Removed session $SESSION_ID"
RMEOF
chmod +x /usr/local/bin/lab-remove-session

echo ""
echo "═══════════════════════════════════════════"
echo "  🎉 Nginx SSL Proxy Setup Complete!"
echo "═══════════════════════════════════════════"
echo "  Domain:    https://$LAB_DOMAIN"
echo "  Config:    $NGINX_CONF"
echo "  Port Map:  /etc/nginx/lab-ports.map"
echo ""
echo "  Helper commands:"
echo "    lab-add-session <session-id> <port>"
echo "    lab-remove-session <session-id>"
echo "═══════════════════════════════════════════"
