// js/dashboard-guia.js
// Panel del guía. Todo se calcula a partir de las reservas que devuelve
// el backend: no hay endpoints de estadísticas ni de finanzas, así que
// los totales se derivan aquí.

import { API_BASE } from './api/config.js';
import { DEPORTES } from './api/rutasService.js';
import {
    cargarCatalogos,
    formatearFecha,
    obtenerGuiaPorUsuario,
    obtenerReservasGuia,
    actualizarGuia
} from './api/reservasService.js';
import { editarPerfilGuia } from './components/perfilGuiaModal.js';

document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. CONTROL DE ACCESO ---
    const sesion = JSON.parse(localStorage.getItem('horizon_user'));
    if (!sesion || sesion.role !== 'guide') {
        window.location.href = '../index.html';
        return;
    }

    // --- 2. NAVEGACIÓN DE PESTAÑAS ---
    const controlesTab = document.querySelectorAll('.tab-control');
    const contenedoresTab = document.querySelectorAll('.tab-wrapper');

    controlesTab.forEach(boton => {
        boton.addEventListener('click', () => {
            controlesTab.forEach(b => b.classList.remove('active'));
            contenedoresTab.forEach(c => c.classList.remove('active'));

            boton.classList.add('active');
            document.getElementById(boton.dataset.tab).classList.add('active');
        });
    });

    // --- 3. CERRAR SESIÓN ---
    // Antes de cargar datos: si la carga falla, el botón sigue sirviendo.
    const btnSalir = document.getElementById('btn-cerrar-sesion');
    if (btnSalir) {
        btnSalir.addEventListener('click', () => {
            localStorage.removeItem('horizon_user');
            window.location.href = '../index.html';
        });
    }

    // --- 4. HELPERS ---
    const dinero = (n) => `$${Math.round(n).toLocaleString()}`;
    const ahora = new Date();
    const enElPasado = (iso) => iso && new Date(iso) < ahora;

    // El nombre del cliente vive en `usuario`, dos saltos más allá de la
    // reserva. Se cachea para no repetir peticiones por cada reseña.
    const cacheClientes = new Map();
    const nombreCliente = async (idExplorador, usuarios) => {
        if (cacheClientes.has(idExplorador)) return cacheClientes.get(idExplorador);
        try {
            const res = await fetch(`${API_BASE}/exploradores/${idExplorador}`);
            const exp = res.ok ? await res.json() : null;
            const usuario = exp ? usuarios.get(exp.idUsuario) : null;
            const nombre = usuario ? usuario.nombre : 'Cliente Horizon';
            cacheClientes.set(idExplorador, nombre);
            return nombre;
        } catch {
            return 'Cliente Horizon';
        }
    };

    // --- 5. CARGA DE DATOS ---
    try {
        const guia = await obtenerGuiaPorUsuario(sesion.id);

        if (!guia) {
            document.getElementById('guide-name').textContent = sesion.name;
            document.getElementById('guide-bio').textContent =
                'No encontramos tu perfil de guía. Contacta al administrador para activarlo.';
            return;
        }

        const [catalogos, reservasCrudas, documentos] = await Promise.all([
            cargarCatalogos(),
            obtenerReservasGuia(guia.idGuia),
            fetch(`${API_BASE}/documentos-guia/guia/${guia.idGuia}`)
                .then(r => r.ok ? r.json() : [])
                .catch(() => [])
        ]);

        // --- ACTIVIDADES DE ESTE GUÍA ---
        // Las clases son suyas directamente; los eventos los hereda de sus zonas.
        const misZonas = [...catalogos.zonas.values()].filter(z => z.idGuia === guia.idGuia);
        const idsMisZonas = new Set(misZonas.map(z => z.id));

        const actividades = [
            ...[...catalogos.clases.values()]
                .filter(c => c.idGuia === guia.idGuia)
                .map(c => ({ ...c, id: c.idClase, esEvento: false, lugar: c.ubicacion })),
            ...[...catalogos.eventos.values()]
                .filter(e => idsMisZonas.has(e.idZona))
                .map(e => ({
                    ...e,
                    id: e.idEvento,
                    esEvento: true,
                    lugar: (catalogos.zonas.get(e.idZona) || {}).nombre || ''
                }))
        ];

        // --- RESERVAS AGRUPADAS POR ACTIVIDAD ---
        const reservasDe = (act) => reservasCrudas.filter(r =>
            act.esEvento ? r.idEvento === act.id : r.idClase === act.id
        );

        const ocupanLugar = (r) => r.estado === 'CONFIRMADA' || r.estado === 'PENDIENTE';

        const actividadesConDatos = actividades.map(act => {
            const reservas = reservasDe(act);
            const inscritos = reservas.filter(ocupanLugar).length;
            const confirmadas = reservas.filter(r => r.estado === 'CONFIRMADA');
            const ingreso = confirmadas.reduce((s, r) => s + Number(r.precioReserva || 0), 0);
            const porcentaje = act.capacidad
                ? Math.round((inscritos / act.capacidad) * 100)
                : 0;

            let estado = 'Abierta';
            if (enElPasado(act.fecha)) estado = 'Completada';
            else if (inscritos >= act.capacidad) estado = 'Cupo lleno';

            return { ...act, reservas, inscritos, confirmadas, ingreso, porcentaje, estado };
        }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        // --- CABECERA ---
        const fotoGuia = guia.fotoUrl || sesion.fotoUrl
            || `https://ui-avatars.com/api/?name=${encodeURIComponent(sesion.name)}&background=0f5b46&color=fff&size=200`;

        document.getElementById('guide-cover').style.backgroundImage =
            "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1400')";
        document.getElementById('guide-avatar').src = fotoGuia;
        document.getElementById('guide-badge-title').textContent = guia.especialidad || 'Guía Horizon';
        document.getElementById('guide-name').textContent = sesion.name;
        // Localidad del guía; si no la ha declarado, la de su primera zona.
        document.getElementById('guide-location').textContent =
            sesion.ubicacion
            || (misZonas.length > 0 ? misZonas[0].ubicacion : 'Sin localidad');
        document.getElementById('guide-bio').textContent =
            guia.descripcion || 'Aún no has escrito tu biografía. Toca "Editar perfil público" para completarla.';

        // --- EDITAR PERFIL PÚBLICO ---
        // El botón ya existe en el HTML; aquí se le da función.
        const btnEditar = [...document.querySelectorAll('.identity-actions button')]
            .find(b => b.textContent.trim().startsWith('Editar'));

        if (btnEditar) {
            btnEditar.addEventListener('click', async () => {
                const datos = await editarPerfilGuia(guia);
                if (!datos) return;

                btnEditar.disabled = true;
                btnEditar.textContent = 'Guardando...';

                const resultado = await actualizarGuia(guia.idGuia, datos);

                btnEditar.disabled = false;
                btnEditar.textContent = 'Editar perfil público';

                if (resultado.success) {
                    // Se repinta sin recargar la página
                    Object.assign(guia, resultado.guia);
                    document.getElementById('guide-badge-title').textContent =
                        guia.especialidad || 'Guía Horizon';
                    document.getElementById('guide-bio').textContent =
                        guia.descripcion || 'Aún no has escrito tu biografía.';
                    document.getElementById('stat-years').textContent = guia.experienciaAnios || 0;
                    if (guia.fotoUrl) document.getElementById('guide-avatar').src = guia.fotoUrl;
                } else {
                    alert(resultado.message);
                }
            });
        }

        // --- RESEÑAS DE SUS CLIENTES ---
        const idsMisReservas = new Set(reservasCrudas.map(r => r.idReserva));
        const misResenas = catalogos.resenas.filter(r => idsMisReservas.has(r.idReserva));

        const promedio = misResenas.length > 0
            ? (misResenas.reduce((s, r) => s + r.calificacion, 0) / misResenas.length)
            : 0;
        const promedioTexto = misResenas.length > 0 ? promedio.toFixed(2) : '—';

        // --- ESTADÍSTICAS ---
        const completadas = actividadesConDatos.filter(a => enElPasado(a.fecha));
        const clientesUnicos = new Set(
            reservasCrudas.filter(r => r.estado === 'CONFIRMADA').map(r => r.idExplorador)
        );

        document.getElementById('stat-routes').textContent = completadas.length;
        document.getElementById('stat-clients').textContent = clientesUnicos.size.toLocaleString();
        document.getElementById('stat-rating').textContent = promedioTexto;
        document.getElementById('stat-years').textContent = guia.experienciaAnios || 0;
        document.getElementById('guide-rating-summary').textContent =
            `${promedioTexto} (${actividadesConDatos.length} actividades) • ${clientesUnicos.size} clientes atendidos`;

        // --- CERTIFICACIONES ---
        const certificaciones = documentos.filter(d => d.tipo === 'CERTIFICACION');
        const listaCerts = document.getElementById('guide-certs');
        listaCerts.innerHTML = certificaciones.length > 0
            ? certificaciones.map((_, i) => `<li>Certificación verificada #${i + 1}</li>`).join('')
            : '<li style="color:#6B7280;">Sin certificaciones registradas</li>';

        // --- PESTAÑA: RUTAS ACTIVAS ---
        const proximas = actividadesConDatos.filter(a => !enElPasado(a.fecha));
        const contenedorRutas = document.getElementById('lista-rutas-activas');

        contenedorRutas.innerHTML = proximas.length === 0
            ? '<p style="color:#6B7280; padding:15px 0;">No tienes actividades programadas próximamente.</p>'
            : proximas.map(act => `
                <div class="group-card">
                    <div class="group-card-top">
                        <div class="group-info">
                            <h4>${act.titulo || 'Actividad sin título'}</h4>
                            <p class="group-meta">🏕️ ${DEPORTES[act.idDeporte] || 'Actividad'} • ${act.lugar} • 📅 ${formatearFecha(act.fecha)} (${act.duracion || 'por definir'})</p>
                        </div>
                        <span class="group-status-pill">${act.estado}</span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${Math.min(act.porcentaje, 100)}%;"></div>
                        </div>
                        <div class="progress-labels">
                            <span>${act.inscritos}/${act.capacidad} inscritos</span>
                            <span>${act.porcentaje}% del cupo</span>
                        </div>
                    </div>
                    <div class="group-actions">
                        <span class="estimated-value">${dinero(act.ingreso)} confirmado</span>
                        <button class="btn-text-action">Ver lista de participantes</button>
                        <button class="btn-text-action">Gestionar grupo</button>
                    </div>
                </div>
            `).join('');

        // --- PESTAÑA: RESEÑAS ---
        document.getElementById('review-score-big').textContent = promedioTexto;
        const contenedorResenas = document.getElementById('lista-resenas');

        if (misResenas.length === 0) {
            contenedorResenas.innerHTML =
                '<p style="color:#6B7280; padding:15px 0;">Todavía no tienes reseñas de clientes.</p>';
        } else {
            // Se resuelven los nombres de cliente y la actividad de cada reseña.
            const tarjetas = await Promise.all(misResenas.map(async (res) => {
                const reserva = reservasCrudas.find(r => r.idReserva === res.idReserva);
                const cliente = reserva
                    ? await nombreCliente(reserva.idExplorador, catalogos.usuarios)
                    : 'Cliente Horizon';

                const actividad = reserva
                    ? actividadesConDatos.find(a =>
                        a.esEvento ? a.id === reserva.idEvento : a.id === reserva.idClase)
                    : null;

                return `
                    <div class="review-card">
                        <div class="review-card-header">
                            <strong>${cliente}</strong>
                            <span>${formatearFecha(res.fecha)}</span>
                        </div>
                        <div class="review-sub">
                            Clasificación: <span class="stars">${'★'.repeat(res.calificacion)}</span>
                            ${actividad ? ` • ${actividad.titulo}` : ''}
                        </div>
                        <p>"${res.comentario || 'Sin comentario.'}"</p>
                    </div>`;
            }));

            contenedorResenas.innerHTML = tarjetas.join('');
        }

        // --- PESTAÑA: GANANCIAS ---
        // Sólo cuentan las reservas CONFIRMADAS: pendientes y canceladas
        // no representan dinero recibido.
        const ingresoDe = (acts) => acts.reduce((s, a) => s + a.ingreso, 0);

        const mismoMes = (iso) => {
            if (!iso) return false;
            const f = new Date(iso);
            return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
        };

        const delMes = completadas.filter(a => mismoMes(a.fecha));
        const futuras = actividadesConDatos.filter(a => !enElPasado(a.fecha));

        document.getElementById('earn-month').textContent = dinero(ingresoDe(delMes));
        document.getElementById('earn-month-sub').textContent =
            `${delMes.length} ${delMes.length === 1 ? 'ruta completada' : 'rutas completadas'}`;
        document.getElementById('earn-total').textContent = dinero(ingresoDe(completadas));
        document.getElementById('earn-future').textContent = dinero(ingresoDe(futuras));
        document.getElementById('earn-future-sub').textContent =
            `de ${futuras.length} ${futuras.length === 1 ? 'ruta programada' : 'rutas programadas'}`;

        const contenedorDesglose = document.getElementById('lista-desglose-ganancias');
        contenedorDesglose.innerHTML = futuras.length === 0
            ? '<p style="color:#6B7280;">Sin ingresos programados.</p>'
            : futuras.map(act => `
                <div class="breakdown-row">
                    <span class="route-name">🏕️ ${act.titulo} (${formatearFecha(act.fecha)})</span>
                    <span class="amount">${dinero(act.ingreso)} confirmado</span>
                </div>
            `).join('');

    } catch (error) {
        console.error("Error inicializando los datos del guía:", error);
        document.getElementById('guide-bio').textContent =
            'No se pudo conectar con el servidor. Revisa que el backend esté encendido.';
    }
});
