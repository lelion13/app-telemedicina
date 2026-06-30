## CONTEXTO DEL PROYECTO

Quiero construir un sistema web de teleasistencia médica/profesional con las siguientes características generales:

- **Frontend + Backend**: Next.js 16 (App Router, última versión estable, con Turbopack como bundler por defecto) con TypeScript y React 19.
  - Importante: en Next.js 16 las APIs `cookies()`, `headers()` y `params` son asíncronas (hay que usar `await`), y el archivo de middleware se llama `proxy.ts` en vez de `middleware.ts`. Tenelo en cuenta al pedirle a Cursor el middleware de protección de rutas por rol.
- **Base de datos**: MongoDB con Mongoose como ODM.
- **Videollamada**: LiveKit (self-hosted, server + SDK), porque necesito que todo el stack corra dockerizado en mi propio VPS.
- **Autenticación**: NextAuth.js (Credentials Provider) para usuarios con cuenta. Los pacientes NO tienen cuenta: acceden mediante un link único con token firmado (JWT de un solo uso, con expiración) que reciben por mail.
- **Envío de mails**: Nodemailer, configurado por variables de entorno SMTP (para poder usar cualquier proveedor: SendGrid, SES, Mailgun, SMTP propio, etc).
- **Geolocalización**: Si es un dispositivo con GPS tomar de ahi la ubicacion, API nativa del navegador (`navigator.geolocation`) + fallback de geolocalización por IP en backend (usando un servicio como [ip-api.com](http://ip-api.com) o geoip-lite local) cuando el navegador no puede obtener coordenadas o la precisión es muy baja.
- **Contenerización**: todo el stack (app Next.js, MongoDB, LiveKit server, Redis si LiveKit lo requiere, Caddy o Nginx como reverse proxy con HTTPS) debe correr vía `docker-compose` para deploy directo en un VPS.  
el vps ya cuenta con un treafik para enrutar el link que va a ser telemedicina.lionapp.cloud

---

## ROLES Y PERMISOS

### 1. Rol `empresa` (usuario de empresa cliente)

- Tiene cuenta con email/password, asociado a una `Empresa` (tenant).
- Puede crear, editar y cancelar turnos **solo para pacientes de su propia empresa**.
- Puede ver el estado de todos los turnos agendados por su empresa (pendiente, confirmado, en curso, finalizado, ausente, cancelado), pero **no** de otras empresas.
- No participa en la videollamada, solo agenda y monitorea estado.

### 2. Rol `profesional` (usuario de teleasistencia / médico / operador)

- Tiene cuenta con email/password.
- Ve una agenda/cola de turnos **de todas las empresas**, no filtrada por tenant.
- Puede tomar/asignarse cualquier turno disponible (sin importar qué empresa lo agendó) y conducir la videollamada.
- Al iniciar la atención, el sistema dispara la captura de GPS del lado del paciente (ver sección de flujo de consulta).
- Puede marcar el resultado del turno (atendido, ausente, reprogramado) y dejar notas.

### 3. Rol `admin` (superusuario)

- Ve absolutamente todo: todas las empresas, todos los profesionales, toda la agenda, todos los pacientes, logs de GPS, históricos.
- Puede crear/editar/desactivar usuarios de cualquier rol y empresas.
- Acceso a un dashboard con métricas generales (turnos por estado, por empresa, por profesional, tasa de ausentismo, etc).
- crea las agendas para que los usuarios empresa y profesional puedan usarlos.

### 4. "Paciente" (sin cuenta, acceso por token)

- No es un usuario del sistema con login.
- Recibe un mail con un link único y con expiración (ej: válido desde 15 minutos antes del turno hasta X tiempo después).
- Al entrar al link: pantalla simple que pide permiso de geolocalización, muestra los datos del turno (fecha/hora, profesional si ya está asignado) y un botón para ingresar a la sala de videollamada.
- Si rechaza el permiso de geolocalización, igual puede ingresar a la consulta, pero el sistema debe registrar explícitamente "ubicación no verificada" — esto debe quedar visible para el profesional y el admin.

---

## MODELOS DE DATOS (MongoDB / Mongoose)

Generá schemas para, como mínimo:

### `Empresa`

- nombre, CUIT/identificador fiscal (opcional), datos de contacto, activa (boolean)

### `Usuario`

- nombre, apellido, email (único), passwordHash, rol (`empresa` | `profesional` | `admin`), empresaId (solo si rol = empresa), activo (boolean), createdAt

### `Paciente`

- nombre, apellido, telefono, email, domicilio, descripcion (**único campo no obligatorio**, el resto de los campos de paciente son obligatorios), empresaId (la empresa que lo registró), createdAt

### `Turno`

- pacienteId (ref Paciente)
- empresaId (la empresa que agendó el turno — se mantiene aunque después lo atienda un profesional de "afuera")
- profesionalId (ref Usuario, nullable hasta que alguien lo tome)
- fechaHoraProgramada (Date)
- estado: `pendiente` | `confirmado` | `en_curso` | `finalizado` | `ausente` | `cancelado`
- accessToken (string único, para el link del paciente) + tokenExpiraEn (Date)
- salaVideoId (id de la room de LiveKit, generado al crear el turno o al iniciar)
- notasProfesional (string, opcional)
- createdAt, updatedAt

### `RegistroGPS`

- turnoId (ref Turno)
- lat, lng, accuracy (metros)
- origen: `navegador` | `ip_fallback` | `no_verificado`
- timestamp
- userAgent / IP (para auditoría)

### `LogConsulta` (opcional pero recomendado para auditoría)

- turnoId, evento (`paciente_ingreso`, `profesional_ingreso`, `llamada_iniciada`, `llamada_finalizada`, `gps_capturado`, `gps_rechazado`), timestamp, metadata

---

## FLUJO DE AGENDAMIENTO DE TURNO

1. Usuario `empresa` o `admin` completa formulario de nuevo turno con:
  - Datos del paciente: **nombre, apellido, teléfono, mail, domicilio (todos obligatorios)** y **descripción (único campo opcional)**.
  - Si el paciente ya existe (buscar por mail o teléfono), reutilizar el registro; si no, crearlo.
  - Fecha y hora del turno.
2. Al guardar el turno:
  - Se genera un `accessToken` único (JWT o UUID + hash en DB) con expiración acorde al horario del turno.
  - Se dispara automáticamente un mail al paciente (Nodemailer) con:
    - Fecha y hora del turno.
    - Link único de acceso (`/consulta/[token]`).
    - Instrucciones claras de que deberá autorizar el acceso a su ubicación al ingresar.
3. El turno queda en estado `pendiente` hasta que un profesional lo confirma o hasta el momento de la atención.

---

## FLUJO DE LA CONSULTA (al momento de la videollamada)

1. **Paciente**: ingresa al link recibido por mail (`/consulta/[token]`).
  - El sistema valida el token (no expirado, no usado más allá de lo permitido).
  - Se le solicita permiso de geolocalización (`navigator.geolocation.getCurrentPosition`, con `enableHighAccuracy: true`).
  - Se capturan lat/lng/accuracy y se guarda como `RegistroGPS` asociado al turno, vía POST a una API route.
  - Si la precisión (`accuracy`) es mayor a un umbral configurable (ej. 1000m) o el usuario rechazó el permiso, marcar `origen: 'no_verificado'` y hacer fallback a geolocalización por IP en el backend, dejando registrado igual el intento.
  - Una vez capturado (o rechazado) el GPS, se habilita el botón "Ingresar a la consulta", que conecta a la sala de LiveKit.
2. **Profesional**: desde su agenda, ve los turnos del día (de todas las empresas), filtra por estado/hora, y al llegar el momento entra a la sala correspondiente. Puede ver en pantalla, junto al video, los datos del paciente y el estado de la verificación GPS (coordenadas, precisión, mapa simple si querés agregarlo con Leaflet/OpenStreetMap).
3. Al finalizar, el profesional marca el turno como `finalizado` o `ausente` y puede dejar notas. El estado se refleja en tiempo real (o casi) en la vista de la empresa que agendó el turno.

---

## PANTALLAS A IMPLEMENTAR

1. **Login** (empresa / profesional / admin) — paciente no tiene login.
2. **Dashboard empresa**: listado de turnos propios con filtros por estado/fecha, botón "Nuevo turno".
3. **Formulario de nuevo turno** (con los campos de paciente especificados).
4. **Dashboard profesional**: agenda global de turnos (todas las empresas), con botón "Tomar/Atender turno" que lleva a la sala de videollamada.
5. **Sala de videollamada** (vista profesional y vista paciente, son distintas): integración LiveKit, controles básicos (mute, cámara, colgar), panel lateral con datos del paciente y estado del GPS.
6. **Dashboard admin**: vista global de empresas, usuarios, turnos, métricas básicas.
7. **Pantalla pública del paciente** (`/consulta/[token]`): solicitud de permiso GPS + sala de espera + ingreso a videollamada.

---

## ESTRUCTURA DOCKER

Necesito un `docker-compose.yml` que levante (nota: Next.js 16 requiere **Node.js 20.9+**, usar imagen base `node:22-alpine` o similar en el Dockerfile):

- `app`: contenedor Next.js (build multistage, producción).
- `mongo`: MongoDB con volumen persistente.
- `livekit`: servidor LiveKit self-hosted (imagen oficial `livekit/livekit-server`), con su archivo de configuración.
- `redis`: si LiveKit lo requiere para su configuración (verificar última versión).
- `reverse-proxy`: Caddy (preferido por manejo automático de HTTPS/Let's Encrypt) exponiendo la app y, si hace falta, el endpoint de LiveKit (notar que LiveKit típicamente necesita también un rango de puertos UDP abiertos para WebRTC — dejarlo documentado en el `docker-compose.yml` y en un README).

Variables de entorno a externalizar en `.env` (no commitear): `MONGODB_URI`, `NEXTAUTH_SECRET`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `APP_BASE_URL`.

