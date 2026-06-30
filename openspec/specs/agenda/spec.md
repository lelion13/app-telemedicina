# Agenda — Franjas Horarias Globales

## Purpose

Definir ventanas de disponibilidad globales que restringen cuándo se pueden agendar turnos en el sistema.

## Requirements

### Requirement: Admin gestiona franjas globales

El sistema DEBE permitir al rol `admin` crear, editar y desactivar franjas horarias globales con: día de la semana, hora de inicio, hora de fin, y estado activo.

#### Scenario: Crear franja válida

- GIVEN un admin autenticado
- WHEN crea una franja lunes 09:00–13:00 activa
- THEN el sistema DEBE persistir la franja y hacerla disponible para agendamiento

#### Scenario: Franja con hora fin anterior a inicio

- GIVEN un admin autenticado
- WHEN crea una franja con horaFin ≤ horaInicio
- THEN el sistema DEBE rechazar la operación con error de validación

### Requirement: Solo admin modifica franjas

Los roles `empresa` y `profesional` NO DEBEN poder crear ni modificar franjas horarias.

### Requirement: Validación al agendar

El sistema DEBE rechazar turnos cuya `fechaHoraProgramada` no caiga dentro de al menos una franja global activa para ese día y hora.

#### Scenario: Turno dentro de franja

- GIVEN una franja activa lunes 09:00–13:00
- WHEN empresa agenda turno lunes 10:30
- THEN el sistema DEBE permitir la creación

#### Scenario: Turno fuera de franja

- GIVEN franjas activas solo lunes 09:00–13:00
- WHEN empresa agenda turno lunes 15:00
- THEN el sistema DEBE rechazar con mensaje indicando horario no disponible

### Requirement: Franjas desactivadas

Una franja con `activa: false` NO DEBE considerarse al validar nuevos turnos. Turnos ya existentes en esa franja NO DEBEN cancelarse automáticamente.
