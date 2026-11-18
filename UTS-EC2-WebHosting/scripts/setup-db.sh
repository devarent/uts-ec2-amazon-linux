#!/usr/bin/env bash
# ------------------------------------------------------------------
# Script untuk inisialisasi database dengan password yang aman
# ------------------------------------------------------------------
set -euo pipefail

echo "==> Setting up PostgreSQL database..."

# Check if .env exists
if [[ ! -f .env ]]; then
  echo "ERROR: .env file not found. Copying from .env.example..."
  cp .env.example .env
fi

# Generate secure password if not set
if grep -q "^POSTGRES_PASSWORD=ganti-password-kuat" .env; then
  echo "==> Generating secure database password..."
  if command -v openssl &> /dev/null; then
    NEW_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')
  else
    # Fallback if openssl not available
    NEW_PASSWORD=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 24)
  fi

  # Update .env with new password
  if command -v sed &> /dev/null; then
    sed -i "s/^POSTGRES_PASSWORD=ganti-password-kuat/POSTGRES_PASSWORD=${NEW_PASSWORD}/" .env
  else
    # For Windows/Git Bash environments
    perl -i -pe "s/^POSTGRES_PASSWORD=ganti-password-kuat/POSTGRES_PASSWORD=${NEW_PASSWORD}/" .env
  fi

  echo "==> New password generated and saved to .env"
  echo "    Password: ${NEW_PASSWORD}"
else
  echo "==> Database password already set"
fi

# Generate admin token if not set
if grep -q "^ADMIN_TOKEN=ganti-token-admin-acak" .env; then
  echo "==> Generating admin token..."
  if command -v openssl &> /dev/null; then
    NEW_TOKEN=$(openssl rand -hex 32)
  else
    NEW_TOKEN=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 64)
  fi

  if command -v sed &> /dev/null; then
    sed -i "s/^ADMIN_TOKEN=ganti-token-admin-acak/ADMIN_TOKEN=${NEW_TOKEN}/" .env
  else
    perl -i -pe "s/^ADMIN_TOKEN=ganti-token-admin-acak/ADMIN_TOKEN=${NEW_TOKEN}/" .env
  fi

  echo "==> Admin token generated and saved to .env"
else
  echo "==> Admin token already set"
fi

echo "==> Database setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review and update other values in .env (DOMAIN, APP_IMAGE, etc.)"
echo "  2. Start the database: docker compose up -d db"
echo "  3. Verify connection: docker compose exec db psql -U \${POSTGRES_USER} -d \${POSTGRES_DB} -c 'SELECT version();'"
echo "  4. Start full stack: docker compose up -d"
