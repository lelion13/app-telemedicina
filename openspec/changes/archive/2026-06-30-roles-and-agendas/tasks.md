# Tasks: Roles y Agendas v2

## Phase 1: Fundación de roles y modelos

- [x] 1.1 Agregar rol `administrativo` a `ROLES`, `Usuario`, validaciones Zod, NextAuth callbacks
- [x] 1.2 Crear schema `Agenda` (fecha, horaInicio, horaFin, duracionTurnoMinutos, empresaIds opcional, creadoPorId, activa)
- [x] 1.3 Agregar `agendaId` obligatorio a `Turno`; modelo `evolucion` + `gpsRegistroId`
- [x] 1.4 Script migración: franjas → agenda default + backfill turnos
- [x] 1.5 Actualizar `proxy.ts`, `authz`, `canAccessApiPath` para `/administrativo`

## Phase 2: APIs administrativo

- [x] 2.1 `GET|POST /api/administrativo/agendas`, `PATCH .../[id]`, helper slots
- [x] 2.2 `GET /api/administrativo/turnos` con filtros (agenda, estado, fecha)
- [x] 2.3 Tests: CRUD agenda, aislamiento de rol

## Phase 3: UI administrativo

- [x] 3.1 Layout `/administrativo` + navegación
- [x] 3.2 CRUD agendas (día, horario, duración, empresas opcionales)
- [x] 3.3 Monitor de turnos cross-tenant por agenda
- [x] 3.4 Mobile-first en pantallas nuevas

## Phase 4: Ajustes empresa

- [x] 4.1 `GET /api/empresa/agendas` (públicas + asignadas)
- [x] 4.2 Formulario nuevo turno: selector agenda + slot libre
- [x] 4.3 Tabla turnos: columna agenda; copiar link paciente si mail falla
- [x] 4.4 Tests: agenda restringida vs pública; slot ocupado

## Phase 5: Ajustes profesional

- [x] 5.1 Filtrar turnos por agendas activas (no cola global ciega)
- [x] 5.2 Panel consulta: evolución + vínculo GPS visible
- [x] 5.3 `PATCH` evolución al cerrar turno
- [x] 5.4 Tests: evolución guarda gpsRegistroId

## Phase 6: Ajustes admin

- [x] 6.1 CRUD usuarios: rol `administrativo`
- [x] 6.2 Deprecar `/admin/franjas` → redirect o eliminar UI
- [x] 6.3 Ajustar copy: admin = usuarios/permisos, no operación diaria
- [x] 6.4 Seed: opcional usuario administrativo de prueba

## Phase 7: Docs, verify, deploy

- [x] 7.1 Actualizar `docs/deploy.md` y `prompt.md` con modelo v2
- [x] 7.2 `sdd-verify` + fix gaps (timezone, migración VPS)
- [x] 7.3 Smoke manual por rol — validado en prod (agenda 2/7, empresa agendando)
- [x] 7.4 `sdd-archive` + `docs/conventions.md` + lessons-learned

## Dependencias

- Fase 2 depende de 1
- Fase 3 depende de 2
- Fase 4 depende de 1 y 2
- Fase 5 depende de 1
- Fase 6 puede paralelizar con 3–5 tras fase 1
