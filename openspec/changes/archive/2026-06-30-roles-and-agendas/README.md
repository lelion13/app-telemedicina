# Archive: roles-and-agendas

**Archivado**: 2026-06-30 (implementación) · **Cierre documental**: 2026-07-03  
**Veredicto**: PASS (smoke VPS validado 2026-07-03)

## Contenido

| Artefacto | Descripción |
|-----------|-------------|
| `proposal.md` | Cinco roles + Agenda como unidad operativa |
| `design.md` | Arquitectura v2, migración franjas |
| `gap-analysis.md` | Delta MVP → v2 |
| `tasks.md` | 27/28 tareas (smoke VPS documentado, no bloqueante) |
| `verify-report.md` | Verificación SDD + post-mortem |
| `lessons-learned.md` | tsx en prod, timezone fechas, curl mongosh |

## Specs actualizados (source of truth)

- `openspec/specs/roles/spec.md` — nuevo
- `openspec/specs/profesional/spec.md` — nuevo
- `openspec/specs/agenda/spec.md` — reemplaza franjas globales
- `openspec/specs/admin/spec.md`, `auth/spec.md`, `turnos/spec.md` — modificados
- `openspec/specs/deployment/spec.md` — migración y scripts VPS

## Documentación de proyecto

- `docs/conventions.md` — fechas AR, roles, prod vs local
- `docs/deploy.md` — migración mongosh, smoke por rol
- `prompt.md` — modelo v2

## Scripts operativos VPS

| Script | Uso |
|--------|-----|
| `scripts/migrate-agendas-mongosh.js` | Migración sin npm (curl \| mongosh) |
| `scripts/migrate-agendas-vps.sh` | Wrapper curl + mongosh |
| `migrate-agendas.mjs` (en imagen) | `npm run migrate-agendas:prod` |

## Supersede

- Modelo MVP: admin gestiona `FranjaHoraria` global
- Change propuesto `polish-admin-empresa-ux` (alcance absorbido)

## Pendiente para próximo change

- Smoke automatizado por rol (E2E)
- SMTP en producción
