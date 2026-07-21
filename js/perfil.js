// js/perfil.js
// Perfil del explorador. Los datos vienen del backend:
//   sesión -> explorador -> reservas -> actividades y guías

import {
    cargarCatalogos,
    componerReservas,
    esProxima,
    obtenerExplorador,
    obtenerReservasExplorador,
    cancelarReserva
} from './api/reservasService.js';

document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. LÓGICA DE LAS PESTAÑAS ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    // --- 2. CERRAR SESIÓN ---
    // Se registra antes de cargar datos: si la carga falla, el botón sirve igual.
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            localStorage.removeItem('horizon_user');
            window.location.href = '../index.html';
        });
    }

    // --- 3. CONTROL DE ACCESO ---
    const sesion = JSON.parse(localStorage.getItem('horizon_user'));
    if (!sesion) {
        window.location.href = '../index.html';
        return;
    }

    // Un guía tiene su propio panel; aquí no le toca nada.
    if (sesion.role === 'guide') {
        window.location.href = 'dashboard-guia.html';
        return;
    }

    // --- 4. CABECERA: lo que ya viene en la sesión ---
    document.getElementById('user-name').textContent = sesion.name;
    document.getElementById('user-handle').textContent = sesion.email;

    const avatar = document.getElementById('user-avatar');
    if (avatar) {
        avatar.src = sesion.fotoUrl
            || `https://ui-avatars.com/api/?name=${encodeURIComponent(sesion.name)}&background=0f5b46&color=fff&size=200`;
        avatar.alt = sesion.name;
    }

    const listaReservas = document.getElementById('lista-reservas');
    const listaHistorial = document.getElementById('lista-historial');

    const vacio = (mensaje, enlace = true) => `
        <div class="empty-state" style="padding: 30px 0;">
            <p style="color: #6B7280;">${mensaje}</p>
            ${enlace ? '<a href="actividades.html" class="btn-primary">Explorar rutas</a>' : ''}
        </div>`;

    listaReservas.innerHTML = '<p style="color:#6B7280; padding:15px 0;">Cargando reservas...</p>';

    // --- 5. DATOS DEL BACKEND ---
    try {
        const explorador = await obtenerExplorador(sesion.id);

        if (!explorador) {
            // Cuentas creadas desde el modal de registro todavía no tienen
            // fila en `explorador`: el backend sólo inserta en `usuario`.
            document.getElementById('user-bio').textContent =
                'Tu perfil de explorador aún no está completo. Reserva tu primera actividad para empezar.';
            listaReservas.innerHTML = vacio('Todavía no tienes reservas.');
            listaHistorial.innerHTML = vacio('Aún no has completado ninguna actividad.', false);
            return;
        }

        // El nivel es el único dato descriptivo que guarda la BD.
        const nivel = explorador.nivel || 'PRINCIPIANTE';
        document.getElementById('user-bio').textContent =
            `Explorador de nivel ${nivel.toLowerCase()} en Horizon.`;

        document.getElementById('user-badges').innerHTML =
            `<span class="badge-item">🏅 Nivel ${nivel.toLowerCase()}</span>`;

        const [catalogos, reservasCrudas] = await Promise.all([
            cargarCatalogos(),
            obtenerReservasExplorador(explorador.idExplorador)
        ]);

        const reservas = await componerReservas(reservasCrudas, catalogos);

        // Ubicación: la de la actividad más reciente que haya reservado.
        const conUbicacion = reservas.find(r => r.ubicacion);
        document.getElementById('user-location').textContent =
            conUbicacion ? conUbicacion.ubicacion : 'Chiapas, México';

        // --- ESTADÍSTICAS ---
        const completadas = reservas.filter(r => r.estado === 'CONFIRMADA' && !esProxima(r));
        const guiasDistintos = new Set(
            reservas.filter(r => r.idGuia).map(r => r.idGuia)
        );
        const misResenas = reservas.filter(r => r.tieneResena);

        document.getElementById('stat-rutas').textContent = completadas.length;
        document.getElementById('stat-guias').textContent = guiasDistintos.size;
        document.getElementById('stat-resenas').textContent = misResenas.length;

        // --- PRÓXIMAS RESERVAS ---
        const proximas = reservas.filter(esProxima)
                                 .sort((a, b) => new Date(a.fechaISO) - new Date(b.fechaISO));

        listaReservas.innerHTML = proximas.length === 0
            ? vacio('Todavía no tienes reservas próximas.')
            : proximas.map(res => `
                <div class="list-item-card" data-reserva="${res.id}">
                    <div class="item-main-info">
                        <h4>${res.titulo}</h4>
                        <p class="item-meta">
                            🏕️ ${res.tipo} • ${res.fecha}${res.guia ? ` • Guía: ${res.guia.nombre}` : ''}
                        </p>
                    </div>
                    <div class="item-actions">
                        <span class="item-price">$${res.precio.toLocaleString()}</span>
                        <span class="status-badge ${res.estado.toLowerCase()}">${res.estado}</span>
                        <button class="btn-ghost btn-cancelar" style="margin:0;" data-id="${res.id}">
                            Cancelar
                        </button>
                    </div>
                </div>
            `).join('');

        // --- CANCELAR RESERVA ---
        // Un solo listener delegado en el contenedor: los botones se
        // regeneran al recargar la lista y así no hay que re-asignarlos.
        listaReservas.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-cancelar');
            if (!btn) return;

            const idReserva = btn.dataset.id;
            const tarjeta = btn.closest('.list-item-card');

            if (!confirm('¿Seguro que quieres cancelar esta reserva? El lugar quedará libre para otra persona.')) {
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Cancelando...';

            const resultado = await cancelarReserva(idReserva);

            if (resultado.success) {
                // La reserva pasa a CANCELADA: sale de "próximas" y
                // aparecerá en el historial al recargar.
                tarjeta.style.opacity = '0.5';
                btn.textContent = 'Cancelada';
                const badge = tarjeta.querySelector('.status-badge');
                if (badge) {
                    badge.textContent = 'CANCELADA';
                    badge.className = 'status-badge cancelada';
                }
            } else {
                btn.disabled = false;
                btn.textContent = 'Cancelar';
                alert(resultado.message);
            }
        });

        // --- HISTORIAL ---
        const historial = reservas.filter(r => !esProxima(r))
                                  .sort((a, b) => new Date(b.fechaISO) - new Date(a.fechaISO));

        listaHistorial.innerHTML = historial.length === 0
            ? vacio('Aún no has completado ninguna actividad.', false)
            : historial.map(hist => `
                <div class="list-item-card">
                    <div class="item-main-info">
                        <h4>${hist.titulo}</h4>
                        <p class="item-meta">🏕️ ${hist.tipo} • ${hist.fecha}${hist.estado === 'CANCELADA' ? ' • Cancelada' : ''}</p>
                    </div>
                    <div class="item-actions">
                        <button class="btn-ghost" style="margin: 0;" ${hist.tieneResena ? 'disabled' : ''}>
                            ${hist.tieneResena ? 'Ya reseñada' : 'Dejar reseña'}
                        </button>
                    </div>
                </div>
            `).join('');

    } catch (error) {
        console.error("Error cargando la información del perfil:", error);
        listaReservas.innerHTML = vacio(
            'No se pudo conectar con el servidor. Revisa que el backend esté encendido.',
            false
        );
    }
});
