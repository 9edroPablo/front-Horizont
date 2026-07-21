# Horizon — Frontend

Plataforma web de ecoturismo para Chiapas: mapa interactivo de rutas, catálogo de actividades guiadas, perfiles de explorador y panel de guía.

Interfaz construida en **HTML, CSS y JavaScript vanilla** con módulos ES6, sin frameworks ni proceso de compilación. Consume una API REST en Spring Boot respaldada por MySQL.

---

## Repositorios del proyecto

| Componente | Repositorio | Responsable |
|---|---|---|
| Frontend | [`front-Horizont`](https://github.com/9edroPablo/front-Horizont) | Pedro |
| Backend | [`back`](https://github.com/Z3K-Erick/back) | Erick |
| Base de datos | [`Horizon_DB`](https://github.com/carlosaalbertolazaro/Horizon_DB) | Carlos |

Los tres se necesitan para ejecutar el sistema completo.

---

## Requisitos

- **MySQL 8** o superior
- **JDK 21** o superior (el backend compila con `release 25`)
- **Maven 3.9+**
- Un servidor web estático — se recomienda la extensión **Live Server** de VS Code

> El frontend **no funciona abriendo `index.html` con doble clic.** Usa módulos ES6 y `fetch()`, que el navegador bloquea bajo el protocolo `file://`. Tiene que servirse por HTTP.

---

## Puesta en marcha

### 1. Base de datos

```bash
git clone https://github.com/carlosaalbertolazaro/Horizon_DB.git
cd Horizon_DB

mysql -u root -p < horizon_db_v4.sql      # esquema
mysql -u root -p < horizon_seeds_v4.sql   # datos de prueba
```

El archivo de semillas termina imprimiendo un conteo por tabla. Debe mostrar 5 usuarios, 2 guías, 2 exploradores, 6 zonas, 6 eventos, 3 clases, 7 reservas y 4 reseñas.

Para reiniciar solo los datos sin tocar el esquema, vuelve a ejecutar el archivo de semillas: empieza limpiando las tablas.

### 2. Backend

```bash
git clone https://github.com/Z3K-Erick/back.git
cd back
```

Edita `src/main/resources/application.properties` con tus credenciales locales:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/horizon_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Mexico_City
spring.datasource.username=root
spring.datasource.password=TU_PASSWORD
```

> **`serverTimezone` importa.** Con `UTC` las fechas de las actividades se muestran con seis horas de desfase respecto a la hora de Chiapas.

Arranca el servidor:

```bash
mvn spring-boot:run
```

Queda escuchando en `http://localhost:8080` y **la terminal no devuelve el prompt**: eso es lo correcto. Para detenerlo, `Ctrl + C`.

Verifica que responde:

```bash
curl http://localhost:8080/api/test
curl http://localhost:8080/api/rutas
```

### 3. Frontend

```bash
git clone https://github.com/9edroPablo/front-Horizont.git
```

Abre **la carpeta del proyecto** en VS Code (no la carpeta que la contiene), clic derecho en `index.html` → *Open with Live Server*.

Si el backend corre en otra dirección, cámbiala en `js/api/config.js`:

```js
export const API_BASE = 'http://localhost:8080/api';
```

Es el único lugar donde está esa URL.

---

## Cuentas de prueba

Todas usan la contraseña **`password123`**.

| Correo | Rol | Notas |
|---|---|---|
| `alex@horizon.com` | Explorador | Tiene 4 reservas y reseñas |
| `laura@horizon.com` | Explorador | Tiene 3 reservas |
| `carlos@horizon.com` | Guía | 3 zonas y 2 clases a su cargo |
| `lucia@horizon.com` | Guía | 2 zonas y 1 clase |
| `admin@horizon.com` | Admin | Sin panel propio todavía |

Las contraseñas se guardan con hash **BCrypt** (`$2a$`, 10 rondas). Si insertas un usuario manualmente con la contraseña en texto plano, el login fallará siempre: `AuthService` compara hashes.

---

## Estructura

```
├── index.html                  Portada: buscador, mapa y próximas rutas
├── pages/
│   ├── actividades.html        Catálogo completo
│   ├── ruta-detalle.html       Detalle de una actividad (?id=)
│   ├── perfil.html             Perfil del explorador
│   ├── dashboard-guia.html     Panel del guía
│   └── Components/             Fragmentos inyectados (header, modal de auth)
├── css/
│   ├── global.css              Variables y estilos base
│   └── components/             Estilos por componente
├── js/
│   ├── api/                    ── Capa de comunicación con el backend ──
│   │   ├── config.js           URL base y catálogo de roles
│   │   ├── authService.js      Login y registro
│   │   ├── rutasService.js     Zonas del mapa
│   │   ├── eventosService.js   Actividades del catálogo
│   │   └── reservasService.js  Reservas y composición de datos
│   ├── components/             Header, modal, tarjeta de ruta
│   ├── utils/validators.js     Validación de formularios
│   └── *.js                    Un archivo por página
└── assets/
    ├── images/
    └── data/                   JSON heredados (ya no se usan)
```

### La capa `js/api/`

El backend y el frontend hablan idiomas distintos: la API devuelve `correo`, `idRol`, `nivelDificultad: "FACIL"`, `idDeporte: 4`; la interfaz espera `email`, `role`, `dificultad: "facil"`, `deporte: "Kayak"`.

Toda esa traducción vive en `js/api/`, en funciones adaptadoras. El resto del código nunca ve la forma cruda de la API. Si el backend cambia un nombre de campo, se corrige en un solo archivo.

`reservasService.js` hace además un trabajo de composición: el backend devuelve las reservas con puros IDs, sin el nombre de la actividad ni el del guía. Para mostrar *"Travesía en kayak · 15 Ago · Guía: Lucía"* hay que cruzar cinco tablas. En vez de una petición por reserva, `cargarCatalogos()` descarga los catálogos completos en paralelo y arma mapas en memoria; resolver cada reserva después es instantáneo.

---

## Endpoints consumidos

| Método | Ruta | Usado en |
|---|---|---|
| `POST` | `/api/auth/login` | Modal de autenticación |
| `POST` | `/api/auth/registro` | Modal de autenticación |
| `GET` | `/api/rutas` | Mapa, catálogo |
| `GET` | `/api/rutas/{id}` | Detalle de ruta |
| `GET` | `/api/eventos` | Catálogo, portada |
| `GET` | `/api/eventos/{id}` | Detalle de ruta |
| `GET` | `/api/clases` | Perfil, dashboard |
| `GET` | `/api/usuarios`, `/api/usuarios/{id}` | Nombres de guías y clientes |
| `GET` | `/api/guias/{id}`, `/api/guias/usuario/{id}` | Detalle de ruta, dashboard |
| `GET` | `/api/exploradores/{id}`, `/api/exploradores/usuario/{id}` | Perfil, dashboard |
| `GET` | `/api/reservas/explorador/{id}` | Perfil |
| `GET` | `/api/reservas/guia/{id}` | Dashboard |
| `GET` | `/api/resenas` | Perfil, dashboard |
| `GET` | `/api/documentos-guia/guia/{id}` | Certificaciones del guía |

---

## Sesión y roles

La sesión se guarda en `localStorage` bajo la clave `horizon_user` y **persiste al cerrar el navegador**. Cerrar sesión la elimina.

Al iniciar sesión, el rol determina el destino:

- `idRol = 1` (Explorador) → permanece en la página actual, el header muestra su perfil
- `idRol = 2` (Guía) → redirección automática a `dashboard-guia.html`

`perfil.html` y `dashboard-guia.html` verifican sesión y rol al cargar, y redirigen al inicio si no corresponde.

Para cerrar sesión manualmente desde la consola del navegador:

```js
localStorage.removeItem('horizon_user'); location.href = '/index.html';
```

---

## Estado actual

### Funcionando contra la base de datos

- Inicio de sesión y registro, con contraseñas hasheadas
- Mapa interactivo con filtros por deporte y dificultad
- Catálogo de actividades con precio, duración y ubicación reales
- Detalle de actividad, incluida la ficha del guía
- Perfil del explorador: reservas, historial y estadísticas calculadas
- Panel del guía: actividades, ocupación, reseñas y finanzas derivadas de las reservas

### Pendiente

Acciones de escritura. Los botones existen en la interfaz pero todavía no persisten cambios:

| Función | Falta |
|---|---|
| Reservar una actividad | Validación de cupos y de la regla clase/evento en el backend |
| Dejar una reseña | Interfaz de calificación (el endpoint ya existe) |
| Editar perfil | `PUT /api/usuarios/{id}` |
| Crear ruta o actividad | `POST /api/rutas` y `POST /api/eventos` |
| Guardados / favoritos | Tabla en la base de datos |
| Calendario del panel | Generarlo a partir de las actividades (hoy es estático) |

### Limitaciones conocidas

- **Sin autenticación por token.** El login valida credenciales pero no emite JWT, y `SecurityConfig` permite todas las peticiones. Cualquiera puede consultar la API directamente. Es la deuda técnica más importante del proyecto.
- **CORS abierto** a cualquier origen: válido en desarrollo, no en producción.
- **Sin diseño responsive.** La interfaz está pensada para escritorio.
- **Las certificaciones se listan sin nombre**, porque `documento_guia` guarda solo el tipo y una URL privada.

---

## Problemas frecuentes

**La página carga pero el mapa está vacío y no hay tarjetas**
El backend no está corriendo. Verifica con `curl http://localhost:8080/api/test`.

**`Failed to fetch` o errores de CORS en la consola**
Abriste el HTML con doble clic. La barra de direcciones debe decir `http://127.0.0.1:5500`, no `file:///`.

**`Port 8080 was already in use`**
Hay otra instancia del backend corriendo. Ciérrala con `lsof -ti:8080 | xargs kill -9`.

**El login siempre devuelve 401**
La contraseña en la base de datos está en texto plano en lugar de hasheada. Vuelve a ejecutar el archivo de semillas.

**Las horas de las actividades salen desfasadas**
Falta ajustar `serverTimezone` en `application.properties`.

**Quedaste atrapado en una página tras iniciar sesión**
La sesión sobrevive al cierre del navegador. Bórrala desde la consola con `localStorage.removeItem('horizon_user')`.
