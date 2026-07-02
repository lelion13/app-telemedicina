# Delta for Roles

## ADDED Requirements

### Requirement: Rol administrativo

El sistema DEBE soportar el rol `administrativo` como usuario autenticado con dashboard propio en `/administrativo`.

#### Scenario: Login administrativo

- GIVEN un usuario activo con rol `administrativo`
- WHEN inicia sesión en `/login`
- THEN el sistema DEBE redirigir a `/administrativo`

### Requirement: Permisos uniformes del rol administrativo

Todos los usuarios con rol `administrativo` DEBEN tener **exactamente los mismos permisos**: crear/editar/desactivar agendas y supervisar todos los turnos de todas las agendas. El sistema NO DEBE almacenar ni evaluar permisos distintos por usuario administrativo.

#### Scenario: Dos administrativos con mismas capacidades

- GIVEN dos usuarios activos con rol `administrativo`
- WHEN cualquiera de los dos crea una agenda o consulta turnos
- THEN ambos DEBEN poder realizar las mismas acciones sobre cualquier agenda del sistema

### Requirement: Cinco actores del dominio

El sistema DEBE reconocer los actores: `admin`, `administrativo`, `empresa`, `profesional` (con cuenta) y `paciente` (sin cuenta, acceso por token).

#### Scenario: Paciente sin cuenta

- GIVEN un paciente con link de consulta válido
- WHEN accede a `/consulta/[token]`
- THEN el sistema NO DEBE requerir NextAuth

## MODIFIED Requirements

### Requirement: Login con credenciales

El sistema DEBE permitir login con email y contraseña para usuarios con rol `admin`, `administrativo`, `empresa` o `profesional`.

(Previously: solo `admin`, `empresa`, `profesional`)

#### Scenario: Login exitoso administrativo

- GIVEN un usuario activo con rol `administrativo`
- WHEN envía credenciales válidas
- THEN el sistema DEBE crear sesión y redirigir a `/administrativo`

### Requirement: Protección de rutas por rol

El sistema DEBE proteger `/administrativo/**` para rol `administrativo` exclusivamente, además de las rutas existentes por rol.

(Previously: sin ruta administrativo)

## REMOVED Requirements

(Ninguno en este dominio — se agrega rol sin eliminar los demás)
