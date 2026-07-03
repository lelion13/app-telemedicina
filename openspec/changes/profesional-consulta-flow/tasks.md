# Tasks: profesional-consulta-flow

## Phase 1: Backend y reglas

- [x] 1.1 `getPatientLinkWindow` + tests
- [x] 1.2 Filtro “solo hoy” timezone Argentina en `profesional-service`
- [x] 1.3 Evolución obligatoria en `ausente` (service + Zod)
- [x] 1.4 GET turno profesional expone `ventanaPaciente`

## Phase 2: UI profesional

- [x] 2.1 Banner ventana paciente en `consulta-panel`
- [x] 2.2 Validación evolución al marcar ausente en UI

## Phase 3: Docs y verify

- [x] 3.1 `docs/smoke-profesional-consulta.md`
- [x] 3.2 Enlace en `docs/deploy.md`
- [ ] 3.3 Smoke manual VPS (operador)
- [x] 3.4 `npm test` + `npm run build`

## Phase 4: Archive

- [ ] 4.1 verify-report + archive al completar smoke VPS
