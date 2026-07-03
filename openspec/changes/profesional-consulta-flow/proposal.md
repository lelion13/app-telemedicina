# Proposal: profesional-consulta-flow

## Intent

Validar e implementar de punta a punta el circuito en el que un **profesional** atiende por **videollamada** los turnos agendados por **empresa** en **agendas** creadas por **administrativo**, incluyendo hardening en VPS y smoke manual WebRTC.

Hoy el código base ya tiene piezas (lista de turnos, tomar/atender, panel consulta, tokens LiveKit, evolución), pero **no se probó end-to-end** en producción.

## Contexto (estado actual del código)

| Pieza | Estado |
|-------|--------|
| Listado turnos por agendas activas | Implementado (`listTurnosForProfesional`) |
| Tomar → confirmado → Atender → consulta | Implementado |
| Iniciar consulta → `en_curso` → video | Implementado |
| Token LiveKit profesional/paciente | Implementado |
| Evolución + GPS al cerrar | Implementado (evolución obligatoria solo en `finalizado` hoy) |
| Filtro “solo hoy” | Usa `startOfToday()` **sin** timezone Argentina — riesgo conocido |
| WebRTC en VPS | Documentado en bootstrap; smoke manual pendiente |

## Decisiones acordadas (sin ambigüedad)

| Tema | Decisión |
|------|----------|
| Situación | Validar/implementar circuito completo; no es solo bugfix puntual |
| Asignación | **Cola compartida**: cualquier profesional toma turno libre |
| Inicio videollamada (profesional) | **Libre** después de tomar el turno (sin ventana horaria extra) |
| Orden de entrada | **Cualquiera primero**; el otro se une cuando pueda |
| Paso “Tomar turno” | **Obligatorio** antes de “Atender” (dos pasos) |
| Ventana paciente | **Mantener** ventana por token (`TOKEN_VALID_BEFORE_MIN` / `AFTER`) |
| Evolución al cerrar | **Obligatoria** en `finalizado` **y** en `ausente` (cambio vs. comportamiento actual) |
| Alcance | **App + VPS (WebRTC) + smoke manual**; E2E automatizado de APIs/UI, WebRTC real manual en VPS |
| Nombre change | `profesional-consulta-flow` |

## Tensión explícita a resolver en diseño

El profesional puede iniciar consulta **antes** de que el paciente pueda entrar (ventana del token). El diseño debe:

- Mostrar en UI del profesional si el paciente **aún no puede** abrir el link (fuera de ventana).
- Mantener sala LiveKit usable cuando el paciente entre dentro de su ventana.
- No ampliar ventana del paciente en este change (salvo bug).

## Alcance

### In scope

1. **Flujo profesional** sobre turnos de agendas v2: ver → tomar → atender → iniciar → video → evolución → cerrar.
2. **Alineación timezone** en listados/filtros del profesional (misma convención que `docs/conventions.md`).
3. **Evolución obligatoria** también al marcar `ausente`.
4. **UX consulta**: estados claros (esperando paciente, en llamada, fuera de ventana paciente).
5. **VPS / LiveKit**: checklist y ajustes documentados (UDP, DNS, `LIVEKIT_*`, smoke manual profesional + paciente).
6. **Tests**: unitarios de reglas de estado/token; smoke manual documentado; opcional tests API del flujo PATCH turnos + token LiveKit.

### Out of scope

- Cambiar modelo de asignación (empresa elige profesional, etc.).
- Ampliar ventana del token paciente a “todo el día”.
- Grabación de videollamadas.
- E2E Playwright con WebRTC real en CI.
- TURN server dedicado (solo documentar si NAT falla en smoke).

## Approach (borrador para design)

1. **Gap analysis** contra specs `profesional`, `videollamada`, `turnos`, `paciente`.
2. **Corregir** filtros fecha Argentina en `profesional-service` si aplica.
3. **Endurecer** reglas `closeTurno` + UI para evolución en `ausente`.
4. **Mejorar** panel consulta: indicadores ventana paciente, errores LiveKit accionables.
5. **Smoke VPS**: script/checklist en `docs/` reutilizando lecciones bootstrap + roles-and-agendas.
6. **Verify** con matriz rol profesional + paciente en agenda real.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| WebRTC falla en VPS | Smoke manual UDP/DNS; no cerrar change sin checklist ejecutado |
| Profesional inicia sin paciente | UI “esperando paciente” + ventana token visible |
| Timezone oculta turnos | Tests + `getAgendaDayKey` en filtros |
| Evolución obligatoria en ausente fricciona UX | Textarea mínima + mensaje claro |

## Criterios de éxito

- [ ] Profesional ve turnos del 2/7 (y días siguientes) en agendas activas.
- [ ] Flujo tomar → atender → iniciar → video con paciente en ventana token.
- [ ] Cierre `finalizado` y `ausente` exigen evolución.
- [ ] Smoke manual VPS documentado y ejecutado una vez.
- [ ] `npm test` + `npm run build` verdes.

## Próximos pasos SDD

1. Aprobar esta proposal.
2. `design.md` + delta specs (`profesional`, `videollamada`, `turnos`, `paciente`).
3. `tasks.md` por fases (app, VPS, verify).
4. Implementar → verify → archive.

## Preguntas abiertas (ninguna bloqueante)

Ninguna pendiente tras las rondas de clarificación del 2026-07-03. Si querés ajustar evolución en `ausente` (texto mínimo vs. libre), decilo antes del design.
