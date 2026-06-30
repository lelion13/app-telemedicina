# Turnos

## Purpose

Gestionar el ciclo de vida completo de un turno de teleasistencia desde el agendamiento hasta su cierre.

## Requirements

### Requirement: Creación de turno

Los roles `empresa` y `admin` DEBEN poder crear turnos especificando datos obligatorios del paciente (nombre, apellido, teléfono, email, domicilio) y fecha/hora. El campo `descripcion` del paciente PUEDE ser opcional; todos los demás campos de paciente son obligatorios.

#### Scenario: Paciente nuevo

- GIVEN un email de paciente no existente en la empresa
- WHEN se crea un turno con datos completos
- THEN el sistema DEBE crear el paciente y el turno en estado `pendiente`

#### Scenario: Paciente existente

- GIVEN un paciente existente con mismo email o teléfono en la empresa
- WHEN se crea un turno
- THEN el sistema DEBE reutilizar el registro existente sin duplicar

### Requirement: Estados del turno

El sistema DEBE soportar estados: `pendiente`, `confirmado`, `en_curso`, `finalizado`, `ausente`, `cancelado`. Las transiciones DEBEN ser válidas según reglas de negocio.

#### Scenario: Profesional toma turno

- GIVEN un turno en estado `pendiente` o `confirmado`
- WHEN un profesional lo asigna a sí mismo
- THEN el sistema DEBE setear `profesionalId` y MAY cambiar estado a `confirmado`

#### Scenario: Inicio de consulta

- GIVEN un turno con profesional asignado al momento programado
- WHEN el profesional ingresa a la sala
- THEN el sistema DEBE cambiar estado a `en_curso`

#### Scenario: Cierre de consulta

- GIVEN un turno `en_curso`
- WHEN el profesional marca como atendido o ausente
- THEN el sistema DEBE cambiar a `finalizado` o `ausente` respectivamente

### Requirement: Cancelación por empresa

Un usuario `empresa` DEBE poder cancelar turnos de su empresa que no estén `en_curso` ni `finalizado`.

### Requirement: Token de acceso paciente

Al crear un turno, el sistema DEBE generar un `accessToken` único (JWT firmado) con `tokenExpiraEn` calculado según ventana configurable (ej. 15 min antes del turno hasta X min después).

### Requirement: Notificación por mail

Al crear un turno, el sistema DEBE enviar mail al paciente con fecha/hora, link `/consulta/[token]` e instrucciones de geolocalización.

### Requirement: Notas del profesional

El profesional PUEDE agregar `notasProfesional` al cerrar un turno. Las notas NO DEBEN ser visibles al paciente.

### Requirement: Vista empresa filtrada

Un usuario `empresa` SOLO DEBE ver y gestionar turnos donde `empresaId` coincide con su empresa.

### Requirement: Vista profesional global

Un usuario `profesional` DEBE ver turnos de todas las empresas en su agenda.
