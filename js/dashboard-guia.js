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
    actualizarGuia,
    obtenerDeportes,
    crearActividad,
    actualizarEstadoReserva,
    crearZona,
    actualizarZona,
    eliminarZona
} from './api/reservasService.js';
import { editarPerfilGuia } from './components/perfilGuiaModal.js';
import { crearActividadModal } from './components/actividadModal.js';
import { verParticipantes } from './components/participantesModal.js';
import { editarZonaModal } from './components/zonaModal.js';

// Evita que nombres, comentarios, etc. se interpreten como HTML.
const escapeHtml = (valor) => String(valor ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

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
                        <button class="btn-text-action btn-participantes"
                                data-id="${act.id}" data-tipo="${act.esEvento ? 'evento' : 'clase'}">
                            Ver participantes${act.reservas.filter(r => r.estado === 'PENDIENTE').length > 0
                                ? ` (${act.reservas.filter(r => r.estado === 'PENDIENTE').length} por revisar)`
                                : ''}
                        </button>
                    </div>
                </div>
            `).join('');

        // --- MIS ZONAS ---
        // Una zona es el lugar; las actividades se programan dentro de ella.
        // Sin zonas propias, el guía sólo puede publicar clases sueltas.
        const cabeceraRutas = document.querySelector('#tab-rutas .wrapper-header');

        const pintarZonas = () => {
            let panel = document.getElementById('panel-zonas');
            if (!panel) {
                panel = document.createElement('div');
                panel.id = 'panel-zonas';
                panel.style.marginBottom = '25px';
                cabeceraRutas.insertAdjacentElement('afterend', panel);
            }

            panel.innerHTML = `
                <div class="box-header" style="margin-bottom:10px;">
                    <h4 style="font-size:15px; color:#374151;">Mis zonas (${misZonas.length})</h4>
                    <button class="btn-text-action" id="btn-nueva-zona">+ Registrar zona</button>
                </div>
                ${misZonas.length === 0
                    ? '<p style="color:#6B7280; font-size:13px;">Aún no tienes zonas registradas. Regístrala para poder programar eventos en ella.</p>'
                    : `<div class="earnings-breakdown-list">
                        ${misZonas.map(z => {
                            // Una zona con eventos no se puede borrar: la llave
                            // foránea lo impide. Se avisa antes de intentarlo.
                            const eventosEnZona = [...catalogos.eventos.values()]
                                .filter(e => e.idZona === z.id).length;

                            return `
                            <div class="breakdown-row">
                                <span class="route-name">
                                    📍 ${z.nombre} — ${z.ubicacion || 'sin referencia'}
                                    ${eventosEnZona > 0
                                        ? `<span style="color:#9CA3AF; font-size:12px;">· ${eventosEnZona} ${eventosEnZona === 1 ? 'evento' : 'eventos'}</span>`
                                        : ''}
                                </span>
                                <span style="display:flex; gap:10px;">
                                    <button class="btn-text-action btn-editar-zona" data-id="${z.id}">Editar</button>
                                    <button class="btn-text-action btn-eliminar-zona" data-id="${z.id}"
                                            data-nombre="${z.nombre.replace(/"/g, '&quot;')}"
                                            data-eventos="${eventosEnZona}"
                                            style="color:#B91C1C;">Eliminar</button>
                                </span>
                            </div>`;
                        }).join('')}
                       </div>`}
            `;

            document.getElementById('btn-nueva-zona')
                    .addEventListener('click', () => abrirFormularioZona(null));

            panel.querySelectorAll('.btn-editar-zona').forEach(btn => {
                btn.addEventListener('click', () =>
                    abrirFormularioZona(misZonas.find(z => z.id === Number(btn.dataset.id))));
            });

            panel.querySelectorAll('.btn-eliminar-zona').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const eventos = Number(btn.dataset.eventos);

                    // Se corta aquí en vez de dejar que el servidor rechace:
                    // el usuario se entera antes de confirmar algo imposible.
                    if (eventos > 0) {
                        alert(`No puedes eliminar "${btn.dataset.nombre}": tiene ${eventos} ` +
                              `${eventos === 1 ? 'evento programado' : 'eventos programados'}. ` +
                              `Elimina o reprograma esos eventos primero.`);
                        return;
                    }

                    if (!confirm(`¿Eliminar la zona "${btn.dataset.nombre}"? Esta acción no se puede deshacer.`)) {
                        return;
                    }

                    btn.disabled = true;
                    btn.textContent = 'Eliminando...';

                    const respuesta = await eliminarZona(Number(btn.dataset.id), guia.idGuia);

                    if (respuesta.success) {
                        window.location.reload();
                    } else {
                        btn.disabled = false;
                        btn.textContent = 'Eliminar';
                        alert(respuesta.message);
                    }
                });
            });
        };

        const abrirFormularioZona = async (zonaExistente) => {
            const deportes = await obtenerDeportes();

            const datos = await editarZonaModal({
                zona: zonaExistente
                    ? {
                        id: zonaExistente.id,
                        nombre: zonaExistente.nombre,
                        ubicacion: zonaExistente.ubicacion,
                        descripcion: zonaExistente.descripcion,
                        idDeporte: zonaExistente.idDeporte,
                        dificultad: zonaExistente.nivelDificultad,
                        lat: zonaExistente.latitud !== null ? Number(zonaExistente.latitud) : null,
                        lng: zonaExistente.longitud !== null ? Number(zonaExistente.longitud) : null
                      }
                    : {},
                deportes
            });
            if (!datos) return;

            const respuesta = zonaExistente
                ? await actualizarZona(zonaExistente.id, guia.idGuia, datos)
                : await crearZona(guia.idGuia, datos);

            if (respuesta.success) {
                // La zona nueva cambia el mapa, el selector de eventos y
                // el listado: recargar es más fiable que parchear cada uno.
                window.location.reload();
            } else {
                alert(respuesta.message);
            }
        };

        pintarZonas();

        // --- VER PARTICIPANTES Y GESTIONAR RESERVAS ---
        contenedorRutas.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-participantes');
            if (!btn) return;

            const esEvento = btn.dataset.tipo === 'evento';
            const idActividad = Number(btn.dataset.id);
            const actividad = actividadesConDatos.find(a =>
                a.esEvento === esEvento && a.id === idActividad);
            if (!actividad) return;

            btn.disabled = true;

            // Los nombres viven en `usuario`, dos saltos más allá de la
            // reserva; se resuelven en paralelo con la caché ya montada.
            const inscritos = await Promise.all(actividad.reservas.map(async (r) => ({
                idReserva: r.idReserva,
                cliente: await nombreCliente(r.idExplorador, catalogos.usuarios),
                precio: Number(r.precioReserva || 0),
                estado: r.estado,
                fecha: formatearFecha(r.fechaReserva)
            })));

            btn.disabled = false;

            const huboCambios = await verParticipantes(
                actividad,
                inscritos,
                (idReserva, estado) => actualizarEstadoReserva(idReserva, estado)
            );

            // Cambiar un estado altera cupos, ingresos y estadísticas:
            // recargar es más fiable que recalcular a mano cada número.
            if (huboCambios) window.location.reload();
        });

        // --- PUBLICAR UNA ACTIVIDAD NUEVA ---
        const btnNueva = document.querySelector('.btn-add-route');
        if (btnNueva) {
            btnNueva.addEventListener('click', async () => {
                const deportes = await obtenerDeportes();

                const resultado = await crearActividadModal({
                    zonas: misZonas.map(z => ({ id: z.id, nombre: z.nombre })),
                    deportes
                });
                if (!resultado) return;

                const { tipo, datos } = resultado;

                // Cada tipo lleva sus propios campos: un evento se ancla a
                // una zona, una clase al guía y a una ubicación libre.
                const cuerpo = tipo === 'evento'
                    ? {
                        idDeporte: datos.idDeporte,
                        idZona: datos.idZona,
                        titulo: datos.titulo,
                        descripcion: datos.descripcion,
                        fecha: datos.fecha,
                        duracion: datos.duracion,
                        precio: datos.precio,
                        capacidad: datos.capacidad,
                        fotoUrl: datos.fotoUrl
                    }
                    : {
                        idGuia: guia.idGuia,
                        idDeporte: datos.idDeporte,
                        titulo: datos.titulo,
                        descripcion: datos.descripcion,
                        ubicacion: datos.ubicacion,
                        fecha: datos.fecha,
                        duracion: datos.duracion,
                        precio: datos.precio,
                        capacidad: datos.capacidad,
                        fotoUrl: datos.fotoUrl
                    };

                btnNueva.disabled = true;
                btnNueva.textContent = 'Publicando...';

                const respuesta = await crearActividad(tipo, cuerpo);

                btnNueva.disabled = false;
                btnNueva.textContent = '+ Nueva ruta';

                if (respuesta.success) {
                    window.location.reload();
                } else {
                    alert(respuesta.message);
                }
            });
        }

        // --- PESTAÑA: CALENDARIO ---
        // Se genera a partir de las actividades reales del guía.
        // La semana arranca en lunes, que es como se lee un calendario
        // de trabajo, no en la fecha de hoy.
        const DIAS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
        const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                              'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        const renderCalendario = (offsetSemanas = 0) => {
            const base = new Date();
            base.setHours(0, 0, 0, 0);
            // getDay(): 0 = domingo. Retrocedemos hasta el lunes.
            const diasDesdeLunes = (base.getDay() + 6) % 7;
            base.setDate(base.getDate() - diasDesdeLunes + (offsetSemanas * 7));

            const dias = [];
            for (let i = 0; i < 7; i++) {
                const dia = new Date(base);
                dia.setDate(base.getDate() + i);
                dias.push(dia);
            }

            const mismoDia = (a, b) =>
                a.getFullYear() === b.getFullYear() &&
                a.getMonth() === b.getMonth() &&
                a.getDate() === b.getDate();

            const inicio = dias[0];
            const fin = dias[6];
            const titulo = inicio.getMonth() === fin.getMonth()
                ? `Semana del ${inicio.getDate()}-${fin.getDate()} ${MESES_CORTOS[fin.getMonth()]} ${fin.getFullYear()}`
                : `Semana del ${inicio.getDate()} ${MESES_CORTOS[inicio.getMonth()]} al ${fin.getDate()} ${MESES_CORTOS[fin.getMonth()]} ${fin.getFullYear()}`;

            const celdas = dias.map(dia => {
                const delDia = actividadesConDatos.filter(a =>
                    a.fecha && mismoDia(new Date(a.fecha), dia));

                const contenido = delDia.length > 0
                    ? delDia.map(a => `<p><strong style="display:inline;">${a.titulo}</strong><br>${a.inscritos}/${a.capacidad} inscritos</p>`).join('')
                    : '<p style="color:#D1D5DB;">Sin actividades</p>';

                const esHoy = mismoDia(dia, new Date());

                return `
                    <div class="calendar-day ${delDia.length > 0 ? 'event-day' : ''}"
                         ${esHoy ? 'style="box-shadow: 0 0 0 2px #F97316;"' : ''}>
                        <strong>${DIAS[dia.getDay()]} ${dia.getDate()}</strong>
                        ${contenido}
                    </div>`;
            }).join('');

            const aviso = offsetSemanas === 0
                ? ''
                : `<p style="color:#6B7280; font-size:13px; margin-top:4px;">
                       ${offsetSemanas > 0
                           ? 'Tu próxima actividad programada está en esta semana.'
                           : 'Estás viendo una semana pasada.'}
                   </p>`;

            const tab = document.getElementById('tab-calendario');
            tab.innerHTML = `
                <div class="box-header" style="margin-bottom:15px;">
                    <div>
                        <h3>${titulo}</h3>
                        ${aviso}
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn-text-action" data-semana="${offsetSemanas - 1}">‹ Anterior</button>
                        <button class="btn-text-action" data-semana="0">Hoy</button>
                        <button class="btn-text-action" data-semana="${offsetSemanas + 1}">Siguiente ›</button>
                    </div>
                </div>
                <div class="calendar-grid">${celdas}</div>
            `;

            tab.querySelectorAll('[data-semana]').forEach(btn => {
                btn.addEventListener('click', () =>
                    renderCalendario(Number(btn.dataset.semana)));
            });
        };

        // Abrir siempre en la semana actual dejaría el calendario vacío
        // cuando las actividades están a semanas de distancia. Se arranca
        // en la semana de la próxima actividad programada.
        const semanaDeLaProximaActividad = () => {
            const proxima = actividadesConDatos
                .filter(a => a.fecha && new Date(a.fecha) >= new Date())
                .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0];

            if (!proxima) return 0;

            const lunesDe = (fecha) => {
                const d = new Date(fecha);
                d.setHours(0, 0, 0, 0);
                d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
                return d;
            };

            const MS_POR_SEMANA = 7 * 24 * 60 * 60 * 1000;
            const diferencia = lunesDe(proxima.fecha) - lunesDe(new Date());
            return Math.round(diferencia / MS_POR_SEMANA);
        };

        renderCalendario(semanaDeLaProximaActividad());

        // El lápiz junto a la biografía abre el mismo formulario que
        // "Editar perfil público": es el mismo dato.
        const btnLapiz = document.querySelector('.btn-icon-edit');
        if (btnLapiz && btnEditar) {
            btnLapiz.addEventListener('click', () => btnEditar.click());
        }

        // --- PESTAÑA: RESEÑAS ---
        document.getElementById('review-score-big').textContent = promedioTexto;

        // Desglose de calificaciones (antes venía fijo en el HTML: 92%/6%/2%).
        const contenedorBarras = document.getElementById('score-bars');
        const conteoPorEstrella = [5, 4, 3, 2, 1].map(estrella => ({
            estrella,
            cantidad: misResenas.filter(r => r.calificacion === estrella).length
        }));
        contenedorBarras.innerHTML = conteoPorEstrella.map(({ estrella, cantidad }) => {
            const porcentaje = misResenas.length > 0
                ? Math.round((cantidad / misResenas.length) * 100)
                : 0;
            return `
                <div class="bar-row">
                    <span>${estrella}★</span>
                    <div class="bar"><div class="fill" style="width: ${porcentaje}%;"></div></div>
                    <span>${porcentaje}%</span>
                </div>`;
        }).join('');

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
                            <strong>${escapeHtml(cliente)}</strong>
                            <span>${formatearFecha(res.fecha)}</span>
                        </div>
                        <div class="review-sub">
                            Clasificación: <span class="stars">${'★'.repeat(res.calificacion)}</span>
                            ${actividad ? ` • ${escapeHtml(actividad.titulo)}` : ''}
                        </div>
                        <p>"${escapeHtml(res.comentario || 'Sin comentario.')}"</p>
                    </div>`;
            }));

            contenedorResenas.innerHTML = tarjetas.join('');
        }

        // --- PESTAÑA: GANANCIAS ---
        // Sólo cuentan las reservas CONFIRMADAS: pendientes y canceladas
        // no representan dinero recibido.
        const ingresoDe = (acts) => acts.reduce((s, a) => s + a.ingreso, 0);

        const mismoMes = (iso, offsetMeses = 0) => {
            if (!iso) return false;
            const f = new Date(iso);
            const objetivo = new Date(ahora.getFullYear(), ahora.getMonth() - offsetMeses, 1);
            return f.getMonth() === objetivo.getMonth() && f.getFullYear() === objetivo.getFullYear();
        };

        const delMes = completadas.filter(a => mismoMes(a.fecha));
        const futuras = actividadesConDatos.filter(a => !enElPasado(a.fecha));

        // Últimos 4 meses (incluye el actual) para el total y la gráfica.
        const ultimosMeses = [3, 2, 1, 0].map(offset => {
            const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - offset, 1);
            const actividadesDelMes = completadas.filter(a => mismoMes(a.fecha, offset));
            return {
                offset,
                etiqueta: MESES_CORTOS[fecha.getMonth()],
                ingreso: ingresoDe(actividadesDelMes)
            };
        });
        const totalUltimos4Meses = ultimosMeses.reduce((s, m) => s + m.ingreso, 0);

        // 4 meses previos a esos, para calcular la tendencia (+/-%).
        const totalPeriodoAnterior = [7, 6, 5, 4].reduce(
            (s, offset) => s + ingresoDe(completadas.filter(a => mismoMes(a.fecha, offset))), 0
        );
        const tendencia = totalPeriodoAnterior > 0
            ? Math.round(((totalUltimos4Meses - totalPeriodoAnterior) / totalPeriodoAnterior) * 100)
            : null;
        const tendenciaTexto = tendencia === null
            ? 'Sin datos del período anterior'
            : `${tendencia >= 0 ? '+' : ''}${tendencia}% vs período anterior`;

        document.getElementById('earn-month-label').textContent = MESES_CORTOS[ahora.getMonth()].toUpperCase();
        document.getElementById('earn-month').textContent = dinero(ingresoDe(delMes));
        document.getElementById('earn-month-sub').textContent =
            `${delMes.length} ${delMes.length === 1 ? 'ruta completada' : 'rutas completadas'}`;
        document.getElementById('earn-total').textContent = dinero(totalUltimos4Meses);
        document.getElementById('earn-total-trend').textContent = tendenciaTexto;
        document.getElementById('earn-future').textContent = dinero(ingresoDe(futuras));
        document.getElementById('earn-future-sub').textContent =
            `de ${futuras.length} ${futuras.length === 1 ? 'ruta programada' : 'rutas programadas'}`;
        document.getElementById('earn-trend').textContent = tendenciaTexto;

        // Gráfica de barras: alturas relativas al mes con más ingresos.
        const maxIngresoMes = Math.max(1, ...ultimosMeses.map(m => m.ingreso));
        document.getElementById('earnings-chart').innerHTML = ultimosMeses.map(m => `
            <div class="earnings-chart-col ${m.offset === 0 ? 'actual' : ''}">
                <div class="earnings-chart-bar" style="height: ${Math.round((m.ingreso / maxIngresoMes) * 100)}%;"
                     title="${m.etiqueta}: ${dinero(m.ingreso)}"></div>
                <span>${m.etiqueta}</span>
            </div>
        `).join('');

        const contenedorDesglose = document.getElementById('lista-desglose-ganancias');
        contenedorDesglose.innerHTML = futuras.length === 0
            ? '<p style="color:#6B7280;">Sin ingresos programados.</p>'
            : futuras.map(act => `
                <div class="breakdown-row">
                    <span class="route-name">🏕️ ${escapeHtml(act.titulo)} (${formatearFecha(act.fecha)})</span>
                    <span class="amount">${dinero(act.ingreso)} confirmado</span>
                </div>
            `).join('');

    } catch (error) {
        console.error("Error inicializando los datos del guía:", error);
        document.getElementById('guide-bio').textContent =
            'No se pudo conectar con el servidor. Revisa que el backend esté encendido.';
    }
});