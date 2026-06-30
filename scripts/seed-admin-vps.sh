#!/usr/bin/env bash
# Crea el usuario admin en MongoDB — solo requiere Docker y .env.prod (sin npm/git clone).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.prod}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: no existe $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@lionapp.cloud}"
ADMIN_NOMBRE="${ADMIN_NOMBRE:-Admin}"
ADMIN_APELLIDO="${ADMIN_APELLIDO:-Sistema}"

if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
  echo "Error: definí ADMIN_PASSWORD en $ENV_FILE (mínimo 12 caracteres)." >&2
  exit 1
fi

if [[ ${#ADMIN_PASSWORD} -lt 12 ]]; then
  echo "Error: ADMIN_PASSWORD debe tener al menos 12 caracteres." >&2
  exit 1
fi

echo "Generando hash bcrypt..."
SEED_HASH=$(docker run --rm node:22-alpine sh -c \
  "npm install bcryptjs@3.0.2 --silent && node -e \"require('bcryptjs').hash(process.argv[1], 12).then(h=>process.stdout.write(h))\"" \
  "$ADMIN_PASSWORD")

echo "Creando usuario admin en MongoDB..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T \
  -e "SEED_HASH=${SEED_HASH}" \
  -e "SEED_EMAIL=${ADMIN_EMAIL}" \
  -e "SEED_NOMBRE=${ADMIN_NOMBRE}" \
  -e "SEED_APELLIDO=${ADMIN_APELLIDO}" \
  mongo mongosh telemedicina --quiet --eval '
const email = (process.env.SEED_EMAIL || "admin@lionapp.cloud").trim().toLowerCase();
const hash = process.env.SEED_HASH;
const nombre = (process.env.SEED_NOMBRE || "Admin").trim();
const apellido = (process.env.SEED_APELLIDO || "Sistema").trim();
if (!hash) {
  print("Error: hash vacío");
  quit(1);
}
if (db.usuarios.findOne({ email })) {
  print("Usuario admin ya existe: " + email);
} else {
  db.usuarios.insertOne({
    nombre,
    apellido,
    email,
    passwordHash: hash,
    rol: "admin",
    activo: true,
    createdAt: new Date(),
  });
  print("Usuario admin creado: " + email);
}
'
