#!/usr/bin/env bash
# ------------------------------------------------------------------
# Smoke test manual dari laptop/EC2.
#   DOMAIN=app.example.com bash scripts/smoke-test.sh
# ------------------------------------------------------------------
set -euo pipefail

DOMAIN="${DOMAIN:-localhost}"
BASE="https://${DOMAIN}"
if [[ "${DOMAIN}" == "localhost" ]]; then
  BASE="http://127.0.0.1:3000"
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

check "health endpoint" "${BASE}/api/health"
check "guestbook database" "${BASE}/api/guestbook"
check "homepage" "${BASE}/"
check "robots" "${BASE}/robots.txt"
check "sitemap" "${BASE}/sitemap.xml"

echo
if [[ "${fail}" -eq 0 ]]; then
  echo "Semua smoke test lulus."
else
  echo "Ada smoke test yang gagal." >&2
fi
exit "${fail}"
