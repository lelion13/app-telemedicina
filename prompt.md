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

## ROLES Y PERMISOS (v2 — cinco actores)

### 1. Rol `admin` (configuración del sistema)

- Crea/edita/desactiva **empresas** y **usuarios** (roles `admin`, `administrativo`, `empresa`, `profesional`).
- Dashboard con **métricas agregadas** (turnos por estado, empresa, profesional, ausentismo).
- **No** opera el día a día: no crea agendas ni agenda turnos.
- Puede auditar GPS y logs de consulta a nivel global.

### 2. Rol `administrativo` (operación diaria)

- Usuario autenticado con dashboard en `/administrativo`.
- **Todos** los usuarios administrativos tienen los **mismos permisos fijos** (sin granularidad por persona en MVP).
- Crea/edita/desactiva **Agendas** (día + horario + duración fija de turno + empresas opcionales).
- Supervisa **todos** los turnos de **todas** las agendas (cross-tenant).
- No atiende consultas ni participa en videollamadas.

### 3. Rol `empresa` (usuario de empresa cliente)

- Cuenta con email/password, asociado a una `Empresa` (tenant).
- Lista agendas donde `empresaIds` está vacío (públicas) o incluye su `empresaId`.
- Crea turnos **solo** eligiendo agenda + slot libre dentro de esa agenda.
- Ve y cancela turnos **solo de su empresa**; no participa en la videollamada.

### 4. Rol `profesional` (teleasistencia / operador)

- Cuenta con email/password.
- Ve turnos de **agendas activas** creadas por administrativo (contexto de agenda, no cola global ciega).
- Toma turnos, conduce videollamada LiveKit, registra **evolución** (texto libre) vinculada al último `RegistroGPS` del turno.
- Marca resultado (`finalizado`, `ausente`, etc.).

### 5. "Paciente" (sin cuenta, acceso por token)

- No es un usuario del sistema con login.
- Recibe mail con link único (`/consulta/[token]`) con ventana temporal.
- Pantalla pública: permiso GPS, datos del turno, ingreso a sala LiveKit.
- Si rechaza GPS, puede ingresar igual; queda `origen: no_verificado` visible para profesional y administrativo.

---

## MODELOS DE DATOS (MongoDB / Mongoose)

Generá schemas para, como mínimo:

### `Empresa`

- nombre, CUIT/identificador fiscal (opcional), datos de contacto, activa (boolean)

### `Usuario`

- nombre, apellido, email (único), passwordHash, rol (`admin` | `administrativo` | `empresa` | `profesional`), empresaId (solo si rol = empresa), activo (boolean), createdAt

### `Agenda` (unidad operativa de disponibilidad)

- fecha (día calendario), horaInicio, horaFin, duracionTurnoMinutos (slots calculados en runtime)
- empresaIds (array opcional; vacío = cualquier empresa activa puede agendar)
- creadoPorId (ref Usuario administrativo), activa (boolean)

### `Paciente`

- nombre, apellido, telefono, email, domicilio, descripcion (**único campo no obligatorio**, el resto de los campos de paciente son obligatorios), empresaId (la empresa que lo registró), createdAt

### `Turno`

- pacienteId (ref Paciente)
- empresaId (empresa que agendó)
- **agendaId** (ref Agenda, obligatorio)
- profesionalId (ref Usuario, nullable hasta que alguien lo tome)
- fechaHoraProgramada (Date, debe coincidir con un slot de la agenda)
- estado: `pendiente` | `confirmado` | `en_curso` | `finalizado` | `ausente` | `cancelado`
- accessToken + tokenExpiraEn (link paciente)
- salaVideoId (LiveKit)
- **evolucion**: { texto, registradoEn, gpsRegistroId } (registro clínico al cerrar)
- notasProfesional (string, opcional; legado/compat)
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

1. El **administrativo** crea una **Agenda** (día, horario, duración de slot, empresas opcionales).
2. Usuario **empresa** completa formulario de nuevo turno con:
  - Datos del paciente: **nombre, apellido, teléfono, mail, domicilio (todos obligatorios)** y **descripción (único campo opcional)**.
  - Si el paciente ya existe (buscar por mail o teléfono), reutilizar el registro; si no, crearlo.
  - **Agenda** visible para su tenant y **slot libre** (chip de horario).
3. Al guardar el turno:
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
2. **Profesional**: ve turnos de agendas activas, toma el turno y entra a la sala. Panel con datos del paciente, estado GPS y campo de **evolución** clínica.
3. Al finalizar, el profesional guarda evolución (obligatoria para `finalizado`), vincula GPS si existe, y marca `finalizado` o `ausente`. El estado se refleja en tiempo real en la vista de la empresa.

---

## PANTALLAS A IMPLEMENTAR

1. **Login** (admin / administrativo / empresa / profesional) — paciente no tiene login.
2. **Dashboard administrativo** (`/administrativo`): CRUD agendas + monitor de turnos cross-tenant.
3. **Dashboard empresa**: turnos propios, botón "Nuevo turno" con selector de agenda y slots.
4. **Formulario de nuevo turno** (paciente + agenda + slot).
5. **Dashboard profesional**: turnos por agendas activas, consulta con evolución + GPS.
6. **Sala de videollamada** (profesional y paciente): LiveKit + panel lateral paciente/GPS.
7. **Dashboard admin**: empresas, usuarios (incl. administrativo), métricas — sin franjas ni agendas operativas.
8. **Pantalla pública del paciente** (`/consulta/[token]`): GPS + videollamada.

---

## ESTRUCTURA DOCKER

Necesito un `docker-compose.yml` que levante (nota: Next.js 16 requiere **Node.js 20.9+**, usar imagen base `node:22-alpine` o similar en el Dockerfile):

- `app`: contenedor Next.js (build multistage, producción).
- `mongo`: MongoDB con volumen persistente.
- `livekit`: servidor LiveKit self-hosted (imagen oficial `livekit/livekit-server`), con su archivo de configuración.
- `redis`: si LiveKit lo requiere para su configuración (verificar última versión).
- `reverse-proxy`: Caddy (preferido por manejo automático de HTTPS/Let's Encrypt) exponiendo la app y, si hace falta, el endpoint de LiveKit (notar que LiveKit típicamente necesita también un rango de puertos UDP abiertos para WebRTC — dejarlo documentado en el `docker-compose.yml` y en un README).

Variables de entorno a externalizar en `.env` (no commitear): `MONGODB_URI`, `NEXTAUTH_SECRET`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `APP_BASE_URL`.

