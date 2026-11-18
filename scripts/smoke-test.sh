#!/usr/bin/env bash
# ------------------------------------------------------------------
# Smoke test untuk static site UTS Cloud Computing
#   Dapat dipakai untuk:
#   - Local static site: DOMAIN=localhost bash scripts/smoke-test.sh
#   - EC2 deployment: DOMAIN=203.0.113.10 bash scripts/smoke-test.sh
#   - Domain: DOMAIN=uts.example.com bash scripts/smoke-test.sh
# ------------------------------------------------------------------
set -euo pipefail

DOMAIN="${DOMAIN:-localhost}"
BASE="http://${DOMAIN}"
if [[ "${DOMAIN}" == "localhost" ]]; then
  BASE="http://127.0.0.1"
fi

fail=0

check() {
  local name="$1" url="$2" expected="${3:-200}"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" || echo 000)"
  if [[ "$code" == "$expected" ]]; then
    printf 'PASS  %-28s %s\n' "$name" "$code"
  else
    printf 'FAIL  %-28s %s (expected %s)\n' "$name" "$code" "$expected"
    fail=1
  fi
}

check_content() {
  local name="$1" url="$2" pattern="$3"
  local content
  content="$(curl -s --max-time 10 "$url" || echo '')"
  if echo "$content" | grep -qi "$pattern"; then
    printf 'PASS  %-28s (content match)\n' "$name"
  else
    printf 'FAIL  %-28s (pattern not found: %s)\n' "$name" "$pattern"
    fail=1
  fi
}

echo "=== Smoke Test Static Site UTS Cloud Computing ==="
echo "Base URL: $BASE"
echo "Target: $DOMAIN"
echo

# 1. Halaman utama
check "homepage" "${BASE}/"
check_content "homepage content" "${BASE}/" "Muhammad Arya Fatthurahman"

# 2. Halaman tambahan
check "knowledge base" "${BASE}/knowledge.html"
check "login page" "${BASE}/login.html"
check "dashboard page" "${BASE}/dashboard.html"

# 3. Assets
check "style.css" "${BASE}/assets/css/style.css"
check "portal.css" "${BASE}/assets/css/portal.css"
check "portal.js" "${BASE}/assets/js/portal.js"

# 4. Health check (Nginx)
check "healthz endpoint" "${BASE}/healthz"

# 5. Pastikan tidak ada 404 untuk asset penting
check "favicon" "${BASE}/assets/img/favicon.svg"

echo
if [[ "${fail}" -eq 0 ]]; then
  echo "✓ Semua smoke test lulus."
  echo "  Site dapat diakses dari publik."
else
  echo "✗ Ada smoke test yang gagal." >&2
  echo "  Periksa Nginx log dan Security Group." >&2
fi
exit "${fail}"
