#!/usr/bin/env bash
# Migra franjas → agendas sin git pull: descarga un solo .js y lo ejecuta en mongosh.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.prod}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
SCRIPT_URL="${MIGRATE_SCRIPT_URL:-https://raw.githubusercontent.com/lelion13/app-telemedicina/main/scripts/migrate-agendas-mongosh.js}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: no existe $ENV_FILE" >&2
  exit 1
fi

if ! docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps --status running --services 2>/dev/null | grep -qx mongo; then
  echo "Error: el servicio mongo no está corriendo." >&2
  exit 1
fi

echo "Ejecutando migración en MongoDB..."
curl -fsSL "$SCRIPT_URL" | docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T mongo \
  mongosh telemedicina --quiet --file /dev/stdin

echo "Migración finalizada."
