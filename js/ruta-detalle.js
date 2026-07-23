// js/ruta-detalle.js
// Detalle de una actividad. Compone la información de varios endpoints:
//   evento -> zona (ubicación, dificultad, idGuia) -> guía -> usuario (nombre)

import { API_BASE } from './api/config.js';
import { obtenerEventoPorId } from './api/eventosService.js';
import { obtenerClasePorId } from './api/clasesService.js';
import {
    obtenerCupos,
    crearReserva,
    obtenerExplorador,
    obtenerReservasGuia
} from './api/reservasService.js';
import { t } from './i18n.js';

// Evita que nombres, comentarios, etc. se interpreten como HTML.
const escapeHtml = (valor) => String(valor ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

document.addEventListener("DOMContentLoaded", () => {

    const parametrosURL = new URLSearchParams(window.location.search);
    const rutaId = parseInt(parametrosURL.get('id'));
    const esEvento = parametrosURL.get('tipo') !== 'clase';
    const contenedor = document.getElementById('contenido-dinamico');

    const mostrarMensaje = (titulo, detalle = '') => {
        contenedor.innerHTML = `
            <div class="mensaje-estado">
                <h2>${titulo}</h2>
                ${detalle ? `<p style="color: #6B7280; font-size: 14px; margin-top: 10px;">${detalle}</p>` : ''}
                <a href="actividades.html" class="enlace-volver">Volver a explorar</a>
            </div>
        `;
    };

    if (!rutaId) {
        mostrarMensaje('Ruta no encontrada');
        return;
    }

    // Trae la zona del evento. Si falla, seguimos sin ella.
    const cargarZona = async (idZona) => {
        try {
            const res = await fetch(`${API_BASE}/rutas/${idZona}`);
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    };

    // Trae el perfil del guía y le pega el nombre, que vive en `usuario`.
    const cargarGuia = async (idGuia) => {
        if (!idGuia) return null;
        try {
            const res = await fetch(`${API_BASE}/guias/${idGuia}`);
            if (!res.ok) return null;
            const guia = await res.json();

            const resUsuario = await fetch(`${API_BASE}/usuarios/${guia.idUsuario}`);
            const usuario = resUsuario.ok ? await resUsuario.json() : null;

            return {
                nombre: usuario ? usuario.nombre : 'Guía Horizon',
                imagen: guia.fotoUrl || (usuario ? usuario.fotoUrl : null),
                especialidad: guia.especialidad || '',
                experiencia: guia.experienciaAnios
                    ? `${guia.experienciaAnios} años de experiencia`
                    : '',
                bio: guia.descripcion || ''
            };
        } catch {
            return null;
        }
    };

    // El nombre de quien reseña vive en `usuario`, dos saltos más allá
    // de la reserva (reserva -> explorador -> usuario). Se cachea porque
    // varias reseñas pueden ser del mismo cliente.
    const cacheClientes = new Map();
    const nombreDeExplorador = async (idExplorador) => {
        if (cacheClientes.has(idExplorador)) return cacheClientes.get(idExplorador);
        try {
            const resExp = await fetch(`${API_BASE}/exploradores/${idExplorador}`);
            const exp = resExp.ok ? await resExp.json() : null;
            const resUsuario = exp ? await fetch(`${API_BASE}/usuarios/${exp.idUsuario}`) : null;
            const usuario = resUsuario && resUsuario.ok ? await resUsuario.json() : null;
            const nombre = usuario ? usuario.nombre : 'Explorador Horizon';
            cacheClientes.set(idExplorador, nombre);
            return nombre;
        } catch {
            return 'Explorador Horizon';
        }
    };

    // Reseñas de ESTA actividad puntual: se filtran las reservas del guía
    // (de la zona si es evento, directo si es clase) que apuntan a esta
    // actividad, y de esas se toman las que ya tienen reseña.
    const cargarResenasRuta = async (idActividad, idGuia) => {
        if (!idGuia) return [];
        try {
            const [reservasDelGuia, resResenas] = await Promise.all([
                obtenerReservasGuia(idGuia),
                fetch(`${API_BASE}/resenas`)
            ]);
            const resenas = resResenas.ok ? await resResenas.json() : [];

            const exploradorPorReserva = new Map(
                reservasDelGuia
                    .filter(r => esEvento ? r.idEvento === idActividad : r.idClase === idActividad)
                    .map(r => [r.idReserva, r.idExplorador])
            );

            const propias = resenas.filter(res => exploradorPorReserva.has(res.idReserva));

            return Promise.all(propias.map(async (res) => ({
                ...res,
                cliente: await nombreDeExplorador(exploradorPorReserva.get(res.idReserva))
            })));
        } catch {
            return [];
        }
    };

    const bloqueResenas = (resenas) => {
        const promedio = resenas.length > 0
            ? (resenas.reduce((s, r) => s + r.calificacion, 0) / resenas.length).toFixed(1)
            : null;

        return `
            <div class="seccion-detalle">
                <h2><span data-i18n="rutaDetalle.resenas">${t('rutaDetalle.resenas')}</span>${promedio ? ` · ⭐ ${promedio} (${resenas.length})` : ''}</h2>
                ${resenas.length === 0
                    ? `<p class="descripcion-texto" data-i18n="rutaDetalle.sinResenas">${t('rutaDetalle.sinResenas')}</p>`
                    : `<div class="lista-resenas-ruta">${resenas.map(res => `
                        <div class="resena-card">
                            <div class="resena-card-header">
                                <strong>${escapeHtml(res.cliente)}</strong>
                                <span class="resena-estrellas">${'★'.repeat(res.calificacion)}${'☆'.repeat(5 - res.calificacion)}</span>
                            </div>
                            <p class="resena-comentario">${escapeHtml(res.comentario || 'Sin comentario.')}</p>
                        </div>
                    `).join('')}</div>`
                }
            </div>
        `;
    };

    const bloqueGuia = (guia) => {
        if (!guia) return '';

        const foto = guia.imagen
            || `https://ui-avatars.com/api/?name=${encodeURIComponent(guia.nombre)}&background=E5E7EB&color=374151&size=200`;

        return `
            <div class="guia-card-container">
                <h2 data-i18n="rutaDetalle.tuGuia">${t('rutaDetalle.tuGuia')}</h2>
                <div class="guia-perfil">
                    <img src="${foto}" alt="Foto de ${guia.nombre}" class="guia-foto">
                    <div class="guia-detalles">
                        <div class="guia-info-header">
                            <h3>${guia.nombre}</h3>
                            <span class="badge-verificado">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                <span data-i18n="rutaDetalle.verificado">${t('rutaDetalle.verificado')}</span>
                            </span>
                        </div>
                        ${guia.especialidad ? `<p class="guia-experiencia">${guia.especialidad}${guia.experiencia ? ` • ${guia.experiencia}` : ''}</p>` : ''}
                        ${guia.bio ? `<p class="guia-bio-texto">${guia.bio}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    };

    const cargarDetalleRuta = async () => {
        try {
            const ruta = esEvento
                ? await obtenerEventoPorId(rutaId)
                : await obtenerClasePorId(rutaId);

            if (!ruta) {
                mostrarMensaje(
                    'Esta actividad ya no está disponible',
                    'Puede que haya sido cancelada. Revisa el catálogo para ver las actividades vigentes.'
                );
                return;
            }

            // Un evento hereda ubicación/dificultad/guía de su zona; una
            // clase ya trae su propia ubicación y guía, sin zona de por medio.
            const zona = esEvento ? await cargarZona(ruta.idZona) : null;
            const idGuia = esEvento ? (zona ? zona.idGuia : null) : ruta.idGuia;
            const guia = idGuia ? await cargarGuia(idGuia) : null;
            const resenas = idGuia ? await cargarResenasRuta(rutaId, idGuia) : [];

            const ubicacion = esEvento ? (zona ? zona.ubicacion : '') : ruta.ubicacion;
            const dificultad = esEvento ? (zona ? (zona.nivelDificultad || '').toLowerCase() : '') : '';
            const descripcion = ruta.descripcion
                || (zona ? zona.descripcion : '')
                || 'Sin descripción disponible por el momento.';

            contenedor.innerHTML = `
                <div class="hero-img-container">
                    <img src="${ruta.imagen}" alt="${ruta.titulo}">
                    <div class="hero-badge">
                        ${ruta.categoria}${dificultad ? ` • ${dificultad}` : ''}
                    </div>
                </div>

                <div class="detalle-layout">
                    <!-- COLUMNA IZQUIERDA -->
                    <div class="info-principal">
                        <h1 class="ruta-titulo">${ruta.titulo}</h1>

                        <div class="ruta-meta">
                            ${ubicacion ? `
                            <span class="meta-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                ${ubicacion}
                            </span>` : ''}
                            <span class="meta-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                ${ruta.duracion}
                            </span>
                            ${ruta.fecha ? `
                            <span class="meta-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                ${ruta.fecha}
                            </span>` : ''}
                        </div>

                        <div class="seccion-detalle">
                            <h2 data-i18n="rutaDetalle.sobreRuta">${t('rutaDetalle.sobreRuta')}</h2>
                            <p class="descripcion-texto">${descripcion}</p>
                        </div>

                        ${bloqueGuia(guia)}

                        ${bloqueResenas(resenas)}
                    </div>

                    <!-- COLUMNA DERECHA -->
                    <div>
                        <div class="reserva-card">
                            <div class="reserva-precio-contenedor">
                                <span class="reserva-precio">$${ruta.precio}</span>
                                <span class="reserva-persona" data-i18n="rutaDetalle.persona">${t('rutaDetalle.persona')}</span>
                            </div>

                            <div class="reserva-detalles">
                                <div class="reserva-fila">
                                    <span class="reserva-label" data-i18n="rutaDetalle.lugaresDisponibles">${t('rutaDetalle.lugaresDisponibles')}</span>
                                    <span id="cupos-valor" class="texto-gris" data-i18n="rutaDetalle.consultando">${t('rutaDetalle.consultando')}</span>
                                </div>
                                <div class="reserva-fila">
                                    <span class="reserva-label" data-i18n="rutaDetalle.cupoGrupo">${t('rutaDetalle.cupoGrupo')}</span>
                                    <span class="texto-gris">${ruta.capacidad} <span data-i18n="rutaDetalle.personas">${t('rutaDetalle.personas')}</span></span>
                                </div>
                                <div class="reserva-fila">
                                    <span class="reserva-label" data-i18n="rutaDetalle.seguro">${t('rutaDetalle.seguro')}</span>
                                    <span class="texto-gris" data-i18n="rutaDetalle.incluido">${t('rutaDetalle.incluido')}</span>
                                </div>
                            </div>

                            <button class="btn-reservar" id="btn-reservar" data-i18n="rutaDetalle.reservarAhora">${t('rutaDetalle.reservarAhora')}</button>
                            <p class="reserva-nota" id="reserva-nota" data-i18n="rutaDetalle.cancelacion">
                                ${t('rutaDetalle.cancelacion')}
                            </p>
                        </div>
                    </div>
                </div>
            `;

            // --- CUPOS Y RESERVA ---
            const btnReservar = document.getElementById('btn-reservar');
            const cuposValor = document.getElementById('cupos-valor');
            const nota = document.getElementById('reserva-nota');

            const pintarCupos = (disponibles) => {
                if (disponibles === null) {
                    cuposValor.textContent = 'No disponible';
                    return;
                }
                if (disponibles === 0) {
                    cuposValor.textContent = 'Agotado';
                    cuposValor.className = 'texto-rojo';
                    btnReservar.textContent = 'Actividad agotada';
                    btnReservar.disabled = true;
                    return;
                }
                cuposValor.textContent = `${disponibles} ${disponibles === 1 ? 'lugar' : 'lugares'}`;
                cuposValor.className = 'texto-verde';
            };

            let cupos = await obtenerCupos(rutaId, esEvento);
            pintarCupos(cupos);

            btnReservar.addEventListener('click', async () => {
                const sesion = JSON.parse(localStorage.getItem('horizon_user'));

                if (!sesion) {
                    nota.textContent = 'Inicia sesión para reservar esta actividad.';
                    nota.className = 'reserva-nota texto-rojo';
                    // Abre el modal de autenticación si está en la página
                    const btnLogin = document.querySelector('.btn-iniciar-sesion');
                    if (btnLogin) btnLogin.click();
                    return;
                }

                if (sesion.role === 'guide') {
                    nota.textContent = 'Las cuentas de guía no pueden reservar actividades.';
                    nota.className = 'reserva-nota texto-rojo';
                    return;
                }

                btnReservar.disabled = true;
                btnReservar.textContent = 'Reservando...';

                const explorador = await obtenerExplorador(sesion.id);

                if (!explorador) {
                    nota.textContent = 'Tu perfil de explorador no está disponible.';
                    nota.className = 'reserva-nota texto-rojo';
                    btnReservar.disabled = false;
                    btnReservar.textContent = 'Reservar ahora';
                    return;
                }

                const resultado = await crearReserva({
                    idExplorador: explorador.idExplorador,
                    idActividad: rutaId,
                    esEvento,
                    precio: ruta.precio
                });

                if (resultado.success) {
                    btnReservar.textContent = '✓ Reserva registrada';
                    nota.innerHTML = 'Tu reserva quedó <strong>pendiente</strong> de confirmación por el guía. ' +
                                     'Puedes verla en <a href="perfil.html">tu perfil</a>.';
                    nota.className = 'reserva-nota';

                    // Refrescamos los cupos: acaba de ocuparse uno
                    cupos = await obtenerCupos(rutaId, esEvento);
                    if (cupos !== null) {
                        cuposValor.textContent = `${cupos} ${cupos === 1 ? 'lugar' : 'lugares'}`;
                    }
                } else {
                    nota.textContent = resultado.message;
                    nota.className = 'reserva-nota texto-rojo';
                    btnReservar.disabled = false;
                    btnReservar.textContent = 'Reservar ahora';
                }
            });

        } catch (error) {
            console.error("Error cargando detalle:", error);
            mostrarMensaje(
                'Ocurrió un error al cargar la ruta.',
                'Revisa que el servidor esté encendido e intenta de nuevo.'
            );
        }
    };

    cargarDetalleRuta();
});
