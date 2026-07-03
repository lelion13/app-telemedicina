# Delta for Profesional

## ADDED Requirements

### Requirement: Ventana del link paciente visible al profesional

En la vista de consulta, el profesional DEBE ver el estado de la ventana del link del paciente: antes de habilitarse, activa o expirada, con horarios en timezone Argentina.

#### Scenario: Paciente aún no puede ingresar

- GIVEN un turno tomado por el profesional y horario futuro fuera de `TOKEN_VALID_BEFORE_MIN`
- WHEN el profesional abre la consulta
- THEN el sistema DEBE indicar desde cuándo el paciente puede ingresar
- AND DEBE permitir iniciar la videollamada igualmente

### Requirement: Evolución obligatoria al marcar ausente

Al cerrar un turno como `ausente`, el profesional DEBE registrar evolución (texto clínico), con la misma obligatoriedad que en `finalizado`.

#### Scenario: Ausente sin evolución

- GIVEN un turno `en_curso` asignado al profesional
- WHEN intenta marcar `ausente` sin texto de evolución
- THEN el sistema DEBE rechazar con error de validación

## MODIFIED Requirements

### Requirement: Filtro de turnos del día

El listado del profesional con filtro “solo hoy” DEBE usar el día calendario en `America/Argentina/Buenos_Aires`, no medianoche local del servidor.

#### Scenario: Turnos del día en Argentina

- GIVEN turnos programados para hoy en timezone Argentina
- WHEN el profesional filtra “solo hoy”
- THEN el sistema DEBE incluir todos los turnos de ese día civil argentino
