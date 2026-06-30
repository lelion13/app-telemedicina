# Administración

## Purpose

Proveer al rol `admin` gestión global del sistema, métricas y configuración de franjas horarias.

## Requirements

### Requirement: Visibilidad global

El admin DEBE ver todas las empresas, usuarios, turnos, pacientes, registros GPS y logs de consulta sin restricción de tenant.

### Requirement: CRUD empresas

El admin DEBE poder crear, editar y desactivar empresas con nombre, CUIT opcional, datos de contacto y estado activo.

### Requirement: CRUD usuarios

El admin DEBE poder crear, editar y desactivar usuarios de cualquier rol (`admin`, `empresa`, `profesional`), asignando `empresaId` cuando el rol es `empresa`.

#### Scenario: Crear usuario empresa

- GIVEN un admin autenticado
- WHEN crea usuario con rol `empresa` y empresaId válido
- THEN el sistema DEBE crear usuario activo con contraseña hasheada

### Requirement: Gestión de franjas

El admin DEBE gestionar franjas horarias globales (ver spec `agenda`).

### Requirement: Dashboard de métricas

El admin DEBE ver métricas agregadas: turnos por estado, por empresa, por profesional, y tasa de ausentismo.

#### Scenario: Métricas de ausentismo

- GIVEN turnos en período seleccionado
- WHEN admin consulta dashboard
- THEN el sistema DEBE calcular tasa = ausentes / (finalizados + ausentes) × 100

### Requirement: Agendar turnos

El admin DEBE poder agendar turnos igual que un usuario empresa, para cualquier empresa.

### Requirement: Auditoría GPS

El admin DEBE poder consultar historial de `RegistroGPS` y `LogConsulta` filtrado por turno, empresa o fecha.
