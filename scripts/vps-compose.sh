#!/usr/bin/env bash
# Wrapper seguro para docker compose en producción (VPS).
# Siempre carga .env.prod para interpolación y evita levantar LiveKit sin claves.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.prod}"
COMPOSE_FILE="docker-compose.prod.yml"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: no existe $ENV_FILE" >&2
  echo "  cp .env.prod.example .env.prod" >&2
  echo "  # editá secretos y LIVEKIT_NODE_IP (IP pública del VPS)" >&2
  exit 1
fi

cmd="${1:-}"

validate_env() {
  # shellcheck disable=SC1090
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a

  local missing=()
  local v

  for v in LIVEKIT_API_KEY LIVEKIT_API_SECRET LIVEKIT_NODE_IP NEXTAUTH_SECRET AUTH_SECRET; do
    if [[ -z "${!v:-}" ]]; then
      missing+=("$v")
    elif [[ "${!v}" == tu-api-key* ]] || [[ "${!v}" == generar-* ]]; then
      missing+=("$v (placeholder)")
    fi
  done

  if ((${#missing[@]} > 0)); then
    echo "Error: completá en $ENV_FILE antes de levantar el stack:" >&2
    printf '  - %s\n' "${missing[@]}" >&2
    exit 1
  fi
}

case "$cmd" in
  up|restart|start)
    validate_env
    ;;
esac

exec docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
