# Proposal: Roles y Agendas (modelo operativo v2)

## Intent

Alinear el sistema con el modelo de negocio real: **cinco actores** con responsabilidades separadas. El eje operativo deja de ser “franjas globales del admin” y pasa a ser **agendas creadas por administrativo**, dentro de las cuales las empresas agendan turnos y los profesionales atienden.

## Modelo de roles (definición acordada)

| Rol | Cuenta login | Responsabilidad principal |
|-----|--------------|---------------------------|
| **admin** | Sí | Crea usuarios y asigna roles (incl. `administrativo`) |
| **administrativo** | Sí | Crea **agendas** y supervisa todo lo que ocurre en ellas (todas las empresas y profesionales) |
| **empresa** | Sí | Ve solo turnos de su empresa; **solo** puede crear turnos en agendas habilitadas por administrativo |
| **profesional** | Sí | Ve agendas del administrativo, atiende pacientes por video, registra **evolución** vinculada al GPS |
| **paciente** | No (token) | Ingresa por link, comparte ubicación, entra a videollamada |

## Scope

### In Scope

- Nuevo rol `administrativo` en modelo, auth, rutas y UI
- Nueva entidad `Agenda` (reemplaza concepto operativo de franjas globales admin)
- `Turno` obligatoriamente asociado a `agendaId`
- Restricción: empresa agenda en agendas **públicas** (sin empresas) o donde su tenant esté asignado
- Vista administrativo: monitor cross-tenant de turnos por agenda
- Profesional: consulta con evolución clínica + referencia a `RegistroGPS`
- Delta specs + diseño técnico + plan de migración desde MVP actual
- Pulido UX acotado a pantallas que cambien en este refactor

### Out of Scope (fases posteriores)

- SMTP producción (`smtp-prod`)
- TURN LiveKit avanzado
- Facturación / obras sociales
- App móvil nativa
- Permisos granulares configurables por admin (MVP: perfil fijo único para todos los administrativos)

## Gap vs MVP actual

| Hoy (MVP) | Objetivo (v2) |
|-----------|---------------|
| Roles: `admin`, `empresa`, `profesional` | + `administrativo`; `paciente` sigue sin cuenta |
| Franjas globales CRUD por **admin** | **Agendas** CRUD por **administrativo** (día + horario + duración) |
| Empresa agenda en cualquier franja activa | Empresa agenda en agendas **públicas** o **asignadas** a su tenant |
| Profesional ve cola global de todas las empresas | Profesional ve turnos de **agendas activas** |
| Admin: métricas + CRUD + franjas | Admin: **usuarios**; operación en manos de administrativo |
| `notasProfesional` texto libre | **Evolución** texto libre + vínculo explícito a GPS |

## Decisiones acordadas (2026-06-30)

1. **Forma de la agenda**: una agenda = **un día** (`fecha`) + **horario** (`horaInicio`–`horaFin`) + **duración fija por turno** (`duracionTurnoMinutos`, igual para todos los slots de esa agenda). Los slots se calculan automáticamente dentro del horario.
2. **Empresas en agenda**: si `empresaIds` está vacío o no se especifica, **cualquier empresa** puede ver la agenda y crear turnos. Si se listan empresas, solo esas pueden agendar.
3. **Varios administrativos**: puede haber **N usuarios** con rol `administrativo`. Todos comparten la misma vista operativa (crear agendas y ver todos los turnos de todas las agendas).
4. **Evolución**: **texto libre** al finalizar consulta; se guarda referencia al último registro GPS del turno.
5. **Admin vs administrativo (pregunta 4 simplificada)**: el admin **solo crea el usuario** y le asigna el rol `administrativo`. No hay checkboxes ni permisos distintos por persona en MVP — todos los administrativos tienen las mismas capacidades (crear agendas + supervisar turnos).

## Approach

1. **Specs + design** (este change) — acordar entidad Agenda y flujos
2. **Migración datos** — mapear `FranjaHoraria` → agenda default o script de migración
3. **Backend** — modelos, APIs por rol, authz
4. **UI por rol** — `/administrativo`, ajustes `/empresa`, `/profesional`, `/admin`
5. **Verify + archive** cuando esté desplegado

## Affected Areas

| Área | Cambio |
|------|--------|
| `src/models/types.ts` | Rol `administrativo` |
| `src/models/Agenda.ts` | Nuevo |
| `src/models/Turno.ts` | `agendaId`, evolución |
| `src/models/Usuario.ts` | Rol `administrativo` (mismo perfil para todos) |
| `src/proxy.ts`, `authz` | Rutas `/administrativo` |
| `src/app/admin/**` | Quitar franjas; foco usuarios/permisos |
| `src/app/administrativo/**` | Nuevo módulo |
| `src/app/empresa/**` | Selector agenda, scope turnos |
| `src/app/profesional/**` | Evolución + GPS en consulta |
| `openspec/specs/*` | Sync al archivar |

## Risks

| Risk | Mitigation |
|------|------------|
| Breaking change en producción | Agenda default + migración script; feature flag corto |
| Confusión empresa vs administrativo | Labels claros en UI (“Empresa cliente” vs “Coordinación”) |
| Scope grande | Implementar por fases en `tasks.md` |

## Success Criteria

- [ ] Los 5 roles documentados con escenarios Given/When/Then
- [ ] Empresa no puede crear turno en agenda restringida a otras empresas
- [ ] Administrativo ve todos los turnos de todas las agendas sin filtro empresa
- [ ] Profesional completa evolución asociada al GPS del turno
- [ ] Admin gestiona usuarios sin operar agendas

## Open Questions

1. ~~¿Una agenda es por **día/campaña** o por **ventana recurrente**?~~ → **Día + horario + duración fija por turno**
2. ~~¿Administrativo asigna **qué empresas**?~~ → **Opcional; vacío = todas las empresas**
3. ~~¿Campos mínimos de la **evolución**?~~ → **Texto libre**
4. ~~¿Permisos del administrativo configurables?~~ → **Perfil fijo; admin solo asigna el rol**
