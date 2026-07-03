# Lessons Learned — Roles y Agendas v2

**Período**: 2026-06-30 — 2026-07-03  
**Entorno**: VPS `srv1623377`, `telemedicina.lionapp.cloud`

## Incidentes y correcciones

| # | Error | Impacto | Causa raíz | Fix aplicado |
|---|--------|---------|------------|--------------|
| 1 | `tsx: not found` en VPS | Migración v2 no corre | Imagen GHCR = Next standalone; `tsx` es devDependency | `scripts/migrate-agendas-mongosh.js` + curl \| mongosh; `migrate-agendas.mjs` en Dockerfile |
| 2 | Empresa no ve agenda del día | No puede agendar | `new Date("YYYY-MM-DD")` guardó día anterior (UTC→AR); filtro `fecha >= hoy` la excluye | `normalizeAgendaDateInput()` en `src/lib/agenda/slots.ts` |
| 3 | Documentación pedía `git pull` en VPS | Descarga repo innecesario | Asumir scripts npm en contenedor prod | Migración por curl de un solo `.js`; deploy = solo `docker pull` |
| 4 | `npm run migrate-agendas` en docs | Comando inválido en prod | Mismo patrón que seed MVP (incidente #5 bootstrap) | `docs/conventions.md` + tabla local vs VPS |

## Patrones que funcionan

1. **Scripts VPS sin repo**: un archivo `*-mongosh.js` + `curl` + `docker compose exec -T mongo mongosh` (como `seed-admin-vps.sh`).
2. **Fechas de calendario**: tratar `YYYY-MM-DD` como día civil argentino, no como `Date` UTC.
3. **Bundles en imagen**: scripts que deban correr en `app` → esbuild en Dockerfile → `npm run *:prod`.
4. **Visibilidad empresa**: checklist activa + fecha + `empresaIds` documentado en `docs/conventions.md`.

## Comandos de referencia (VPS)

```bash
# Migración v2 (sin git pull)
curl -fsSL https://raw.githubusercontent.com/lelion13/app-telemedicina/main/scripts/migrate-agendas-mongosh.js \
  | docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T mongo mongosh telemedicina --quiet --file /dev/stdin

# Ver agendas en DB (debug visibilidad empresa)
docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T mongo \
  mongosh telemedicina --quiet --eval 'db.agendas.find({}, {nombre:1, fecha:1, activa:1, empresaIds:1}).toArray()'

# Migración en imagen nueva (post-Dockerfile)
docker compose --env-file .env.prod -f docker-compose.prod.yml exec app npm run migrate-agendas:prod
```

## Corregir agendas creadas con fecha errónea (pre-fix)

Si una agenda quedó con el día anterior, el administrativo puede **editar y guardar** la misma fecha tras el deploy del fix, o ajustar en mongosh:

```javascript
// Ejemplo: mover agenda al 2026-07-02 (mediodía UTC estándar del proyecto)
db.agendas.updateOne(
  { _id: ObjectId("…") },
  { $set: { fecha: new Date("2026-07-02T12:00:00.000Z") } }
);
```

## Proceso — qué hacer distinto en próximos changes

1. Al agregar scripts `npm run` operativos, definir **desde el diseño** la variante VPS (mongosh o bundle prod).
2. Todo campo `type="date"` que persista en Mongo → test de timezone Argentina obligatorio.
3. Verificar flujo **administrativo crea → empresa lista** en smoke manual antes de archivar.
4. Actualizar `docs/conventions.md` cuando una convención nueva evite repetir un incidente.

## Próximos changes sugeridos

| Change | Prioridad |
|--------|-----------|
| Smoke E2E por rol (Playwright) | Alta |
| SMTP prod + link consulta en UI empresa | Alta |
| Job one-shot re-normalizar `Agenda.fecha` en DB legacy | Media (si hay datos pre-fix) |
