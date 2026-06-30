# Tiempo Real — Actualización de Estado

## Purpose

Notificar en tiempo real a dashboards de empresa cuando cambia el estado de sus turnos.

## Requirements

### Requirement: SSE para dashboards empresa

El sistema DEBE proveer endpoint SSE (`/api/events/turnos`) autenticado para usuarios con rol `empresa`, emitiendo eventos cuando cambia el estado de un turno de su empresa.

#### Scenario: Profesional finaliza turno

- GIVEN un dashboard empresa conectado por SSE
- WHEN un profesional marca un turno de esa empresa como `finalizado`
- THEN el dashboard DEBE recibir evento `turno_actualizado` sin recargar la página

### Requirement: Filtrado por tenant

Los eventos SSE para rol `empresa` SOLO DEBEN incluir turnos de su `empresaId`.

### Requirement: Reconexión automática

El cliente DEBE implementar reconexión automática SSE con backoff exponencial ante desconexión.

### Requirement: Fallback polling

Si SSE falla tras reintentos configurados, el cliente DEBERÍA degradar a polling cada 30 segundos.

### Requirement: Payload mínimo

Los eventos NO DEBEN incluir datos sensibles innecesarios (solo turnoId, estado, profesionalId, updatedAt).

### Requirement: Admin sin SSE obligatorio

El rol `admin` PUEDE usar refresh manual o polling; SSE para admin es opcional en MVP.
