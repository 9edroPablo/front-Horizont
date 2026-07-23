// js/i18n.js
// Traducción parcial ES/EN: solo el "cascarón" fijo del sitio (menú,
// textos de cada página, footer, botones, formularios). El contenido
// que viene de la base de datos (actividades, reseñas, biografías de
// guía) lo escribió cada usuario y se queda tal cual lo escribió.
//
// Cómo se usa en el HTML:
//   <h1 data-i18n="hero.titulo">La ruta que nos une</h1>
//   <input data-i18n-placeholder="buscar.placeholder" placeholder="...">
// El texto en español que ya está en el HTML es el que se ve por
// defecto; solo se reemplaza si el diccionario tiene esa clave.

const DICCIONARIO = {
    'nav.inicio': { es: 'Inicio', en: 'Home' },
    'nav.actividades': { es: 'Actividades', en: 'Activities' },
    'nav.iniciarSesion': { es: 'Iniciar sesión', en: 'Log in' },

    'hero.titulo': { es: 'La ruta que nos une', en: 'The trail that connects us' },
    'hero.descripcion': {
        es: 'Descubre deportes al aire libre guiados, conéctate con la naturaleza y únete a una apasionada comunidad de ecoturismo.',
        en: 'Discover guided outdoor sports, connect with nature, and join a passionate ecotourism community.'
    },
    'hero.buscar.placeholder': { es: '¿Dónde es tu próxima aventura?', en: 'Where is your next adventure?' },
    'hero.explorar': { es: 'Explorar', en: 'Explore' },

    'mapa.titulo1': { es: 'Mapa de', en: 'Route' },
    'mapa.titulo2': { es: 'Rutas', en: 'Map' },
    'mapa.descripcion': {
        es: 'Encuentra tu próximo destino de ecoturismo. Filtra por tus deportes favoritos y explora rutas y puntos de encuentro verificados por usuarios.',
        en: 'Find your next ecotourism destination. Filter by your favorite sports and explore routes and meeting points verified by users.'
    },
    'mapa.filtrarDeporte': { es: 'Filtrar por Deporte', en: 'Filter by Sport' },
    'mapa.nivelDificultad': { es: 'NIVEL DE DIFICULTAD', en: 'DIFFICULTY LEVEL' },
    'mapa.dif.todos': { es: 'Todos', en: 'All' },
    'mapa.dif.facil': { es: 'Fácil', en: 'Easy' },
    'mapa.dif.medio': { es: 'Medio', en: 'Medium' },
    'mapa.dif.dificil': { es: 'Difícil', en: 'Hard' },
    'deporte.senderismo': { es: 'Senderismo', en: 'Hiking' },
    'deporte.kayak': { es: 'Kayak', en: 'Kayaking' },
    'deporte.escalada': { es: 'Escalada', en: 'Climbing' },
    'deporte.pesca': { es: 'Pesca', en: 'Fishing' },

    'proximas.titulo1': { es: 'Próximas', en: 'Upcoming' },
    'proximas.titulo2': { es: 'aventuras', en: 'adventures' },
    'proximas.descripcion': {
        es: 'Únete a guías locales certificados en nuestras próximas aventuras más populares. Conecta con entusiastas de la naturaleza con ideas afines.',
        en: 'Join certified local guides on our most popular upcoming adventures. Connect with like-minded nature enthusiasts.'
    },
    'proximas.verCalendario': { es: 'Ver calendario completo →', en: 'View full calendar →' },

    'actividades.titulo': { es: 'Explorar Rutas', en: 'Explore Routes' },
    'actividades.descripcion': {
        es: 'Filtra por deporte, dificultad o destino y encuentra tu próxima ruta.',
        en: 'Filter by sport, difficulty, or destination and find your next route.'
    },
    'actividades.buscar.placeholder': { es: 'Buscar por nombre o destino...', en: 'Search by name or destination...' },
    'actividades.deporte': { es: 'DEPORTE', en: 'SPORT' },
    'actividades.dificultad': { es: 'DIFICULTAD', en: 'DIFFICULTY' },

    'rutaDetalle.volver': { es: 'Volver a Explorar Rutas', en: 'Back to Explore Routes' },
    'rutaDetalle.sobreRuta': { es: 'Sobre esta ruta', en: 'About this route' },
    'rutaDetalle.tuGuia': { es: 'Tu Guía', en: 'Your Guide' },
    'rutaDetalle.verificado': { es: 'Verificado', en: 'Verified' },
    'rutaDetalle.resenas': { es: 'Reseñas', en: 'Reviews' },
    'rutaDetalle.sinResenas': { es: 'Todavía no hay reseñas para esta actividad.', en: 'There are no reviews for this activity yet.' },
    'rutaDetalle.consultando': { es: 'Consultando...', en: 'Checking...' },
    'rutaDetalle.personas': { es: 'personas', en: 'people' },
    'rutaDetalle.lugaresDisponibles': { es: 'Lugares disponibles', en: 'Available spots' },
    'rutaDetalle.cupoGrupo': { es: 'Cupo del grupo', en: 'Group size' },
    'rutaDetalle.seguro': { es: 'Seguro de actividad', en: 'Activity insurance' },
    'rutaDetalle.incluido': { es: 'Incluido', en: 'Included' },
    'rutaDetalle.reservarAhora': { es: 'Reservar ahora', en: 'Book now' },
    'rutaDetalle.cancelacion': { es: 'Cancelación gratuita hasta 48h antes', en: 'Free cancellation up to 48h before' },
    'rutaDetalle.persona': { es: '/ persona', en: '/ person' },

    'perfil.reservas': { es: 'Reservas', en: 'Bookings' },
    'perfil.historial': { es: 'Historial', en: 'History' },
    'perfil.guardados': { es: 'Guardados', en: 'Saved' },
    'perfil.configuracion': { es: 'Configuración', en: 'Settings' },
    'perfil.editarPerfil': { es: 'Editar perfil', en: 'Edit profile' },
    'perfil.rutas': { es: 'Rutas', en: 'Routes' },
    'perfil.guias': { es: 'Guías', en: 'Guides' },
    'perfil.resenas': { es: 'Reseñas', en: 'Reviews' },
    'perfil.proximasReservas': { es: 'Próximas Reservas', en: 'Upcoming Bookings' },
    'perfil.explorarMasRutas': { es: '+ Explorar más rutas', en: '+ Explore more routes' },
    'perfil.rutasCompletadas': { es: 'Rutas Completadas', en: 'Completed Routes' },
    'perfil.sinGuardados.titulo': { es: 'Sin rutas guardadas aún', en: 'No saved routes yet' },
    'perfil.sinGuardados.texto': {
        es: 'Guarda rutas que te interesen para encontrarlas fácilmente.',
        en: 'Save routes you like to find them easily later.'
    },
    'perfil.explorarRutas': { es: 'Explorar rutas', en: 'Explore routes' },
    'perfil.configCuenta': { es: 'Configuración de cuenta', en: 'Account settings' },
    'perfil.editarInfo': { es: 'Editar información personal', en: 'Edit personal information' },
    'perfil.editarInfoSub': { es: 'Nombre, email, teléfono', en: 'Name, email, phone' },
    'perfil.privacidad': { es: 'Privacidad y seguridad', en: 'Privacy and security' },
    'perfil.privacidadSub': { es: 'Contraseña, autenticación en dos pasos', en: 'Password, two-factor authentication' },
    'perfil.preferencias': { es: 'Preferencias de actividad', en: 'Activity preferences' },
    'perfil.preferenciasSub': { es: 'Nivel de experiencia', en: 'Experience level' },
    'perfil.cerrarSesion': { es: 'Cerrar sesión', en: 'Log out' },
    'perfil.cerrarSesionSub': { es: 'Salir de tu cuenta de Horizon de forma segura', en: 'Sign out of your Horizon account securely' },

    'guia.editarPerfilPublico': { es: 'Editar perfil público', en: 'Edit public profile' },
    'guia.cerrarSesion': { es: 'Cerrar sesión', en: 'Log out' },
    'guia.rutasGuiadas': { es: 'Rutas Guiadas', en: 'Guided Routes' },
    'guia.completadas': { es: 'completadas', en: 'completed' },
    'guia.clientesAtendidos': { es: 'Clientes Atendidos', en: 'Clients Served' },
    'guia.aventureros': { es: 'aventureros', en: 'adventurers' },
    'guia.calificacionPromedio': { es: 'Calificación Promedio', en: 'Average Rating' },
    'guia.sobre5': { es: 'sobre 5.0 estrellas', en: 'out of 5.0 stars' },
    'guia.aniosExperiencia': { es: 'Años de Experiencia', en: 'Years of Experience' },
    'guia.comoGuia': { es: 'como guía', en: 'as a guide' },
    'guia.en': { es: 'en', en: 'in' },
    'guia.sobreEsteGuia': { es: 'Sobre este guía', en: 'About this guide' },
    'guia.certificaciones': { es: 'Certificaciones', en: 'Certifications' },
    'guia.misRutasActivas': { es: 'Mis Rutas Activas', en: 'My Active Routes' },
    'guia.calendario': { es: 'Calendario', en: 'Calendar' },
    'guia.resenasClientes': { es: 'Reseñas de Clientes', en: 'Client Reviews' },
    'guia.ganancias': { es: '$ Ganancias', en: '$ Earnings' },
    'guia.proximosGrupos': { es: 'Próximos Grupos a Guiar', en: 'Upcoming Groups to Guide' },
    'guia.nuevaRuta': { es: '+ Nueva ruta', en: '+ New route' },
    'guia.puntuacionGlobal': { es: 'Puntuación global', en: 'Overall score' },
    'guia.resumenGanancias': { es: 'Resumen de Ganancias', en: 'Earnings Summary' },
    'guia.totalUltimos4Meses': { es: 'TOTAL ÚLTIMOS 4 MESES', en: 'TOTAL LAST 4 MONTHS' },
    'guia.proximasGanancias': { es: 'PRÓXIMAS GANANCIAS', en: 'UPCOMING EARNINGS' },
    'guia.ganadoEsteMes': { es: 'GANADO ESTE MES', en: 'EARNED THIS MONTH' },
    'guia.gananciasPorMes': { es: 'Ganancias por mes', en: 'Monthly earnings' },
    'guia.desgloseRuta': { es: 'Desglose por ruta (próximos ingresos)', en: 'Breakdown by route (upcoming income)' },

    'auth.bienvenido.titulo': { es: 'Bienvenido de vuelta', en: 'Welcome back' },
    'auth.bienvenido.sub': { es: 'La montaña te espera. Ingresa para continuar.', en: 'The mountain awaits. Log in to continue.' },
    'auth.unete.titulo': { es: 'Únete a la comunidad', en: 'Join the community' },
    'auth.unete.sub': { es: 'Regístrate gratis y comienza tu aventura hoy.', en: 'Sign up for free and start your adventure today.' },
    'auth.tabLogin': { es: 'Iniciar Sesión', en: 'Log In' },
    'auth.tabRegistro': { es: 'Registrarse', en: 'Sign Up' },
    'auth.olvidasteContrasena': { es: '¿Olvidaste tu contraseña?', en: 'Forgot your password?' },
    'auth.entrar': { es: 'Entrar a Horizon', en: 'Enter Horizon' },
    'auth.crearCuenta': { es: 'Crear mi cuenta', en: 'Create my account' },
    'auth.nombreCompleto.placeholder': { es: 'Nombre completo', en: 'Full name' },
    'auth.contrasena.placeholder': { es: 'Contraseña', en: 'Password' },
    'auth.explorador': { es: 'Explorador', en: 'Explorer' },
    'auth.exploradorDesc': { es: 'Quiero reservar actividades', en: 'I want to book activities' },
    'auth.guia': { es: 'Guía', en: 'Guide' },
    'auth.guiaDesc': { es: 'Quiero ofrecer mis rutas', en: 'I want to offer my routes' },
    'auth.oContinuaCon': { es: 'O CONTINÚA CON', en: 'OR CONTINUE WITH' },
    'auth.continuarGoogle': { es: 'Continuar con Google', en: 'Continue with Google' },

    'footer.tagline': {
        es: 'La ruta que nos une. Conectando a las personas con la naturaleza a través de deportes al aire libre guiados y una próspera comunidad de ecoturismo.',
        en: 'The trail that connects us. Connecting people with nature through guided outdoor sports and a thriving ecotourism community.'
    },
    'footer.explorar': { es: 'EXPLORAR', en: 'EXPLORE' },
    'footer.plataforma': { es: 'PLATAFORMA', en: 'PLATFORM' },
    'footer.todasLasRutas': { es: 'Todas las Rutas', en: 'All Routes' },
    'footer.comunidad': { es: 'Comunidad', en: 'Community' },
    'footer.miPerfil': { es: 'Mi Perfil', en: 'My Profile' },
    'footer.normasSeguridad': { es: 'Normas de Seguridad', en: 'Safety Guidelines' },
    'footer.pactoEcoturismo': { es: 'Pacto de Ecoturismo', en: 'Ecotourism Pledge' },
    'footer.contactanos': { es: 'Contáctanos', en: 'Contact Us' },
    'footer.derechos': { es: 'Horizon Ecoturismo. Todos los derechos reservados.', en: 'Horizon Ecotourism. All rights reserved.' },
    'footer.privacidad': { es: 'Política de Privacidad', en: 'Privacy Policy' },
    'footer.terminos': { es: 'Términos de Servicio', en: 'Terms of Service' }
};

const CLAVE_STORAGE = 'horizon_idioma';

export const obtenerIdioma = () => localStorage.getItem(CLAVE_STORAGE) || 'es';

export const t = (clave) => {
    const entrada = DICCIONARIO[clave];
    if (!entrada) return null;
    return entrada[obtenerIdioma()] || entrada.es;
};

// Traduce todos los elementos [data-i18n] dentro de un contenedor.
// Se puede llamar varias veces (ej. cada vez que se inyecta el header,
// el footer o el modal, que llegan por fetch después del DOMContentLoaded).
export const aplicarTraducciones = (raiz = document) => {
    raiz.querySelectorAll('[data-i18n]').forEach(el => {
        const texto = t(el.dataset.i18n);
        if (texto !== null) el.textContent = texto;
    });

    raiz.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const texto = t(el.dataset.i18nPlaceholder);
        if (texto !== null) el.placeholder = texto;
    });

    document.querySelectorAll('.btn-idioma').forEach(btn => {
        btn.textContent = obtenerIdioma() === 'es' ? 'EN' : 'ES';
    });
};

export const cambiarIdioma = (idioma) => {
    localStorage.setItem(CLAVE_STORAGE, idioma);
    document.documentElement.lang = idioma;
    aplicarTraducciones(document);
};

document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.lang = obtenerIdioma();
    aplicarTraducciones(document);

    // Delegado en document porque el botón vive dentro del header,
    // que se inyecta después de este evento.
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-idioma')) return;
        cambiarIdioma(obtenerIdioma() === 'es' ? 'en' : 'es');
    });
});
