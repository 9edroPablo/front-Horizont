// js/api/reservasService.js
// El backend devuelve las reservas "crudas": sólo IDs, sin el nombre de
// la actividad ni el del guía. Aquí se componen esos datos cruzando
// eventos, clases, zonas y usuarios en una sola pasada.

import { API_BASE } from './config.js';
import { DEPORTES } from './rutasService.js';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
               'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const formatearFecha = (iso) => {
    if (!iso) return 'Fecha por confirmar';
    const f = new Date(iso);
    if (isNaN(f)) return 'Fecha por confirmar';
    return `${f.getDate()} ${MESES[f.getMonth()]} ${f.getFullYear()}`;
};

const jsonSeguro = async (url, porDefecto) => {
    try {
        const res = await fetch(url);
        if (!res.ok) return porDefecto;
        return await res.json();
    } catch {
        return porDefecto;
    }
};

// Descarga de una sola vez los catálogos que hacen falta para resolver
// cualquier reserva. Se pide todo en paralelo: no dependen entre sí.
export const cargarCatalogos = async () => {
    const [eventos, clases, zonas, usuarios, resenas] = await Promise.all([
        jsonSeguro(`${API_BASE}/eventos`, []),
        jsonSeguro(`${API_BASE}/clases`, []),
        jsonSeguro(`${API_BASE}/rutas`, []),
        jsonSeguro(`${API_BASE}/usuarios`, []),
        jsonSeguro(`${API_BASE}/resenas`, [])
    ]);

    return {
        eventos: new Map(eventos.map(e => [e.idEvento, e])),
        clases: new Map(clases.map(c => [c.idClase, c])),
        zonas: new Map(zonas.map(z => [z.id, z])),
        usuarios: new Map(usuarios.map(u => [u.idUsuario, u])),
        // idReserva -> reseña, para saber cuáles ya fueron calificadas
        resenasPorReserva: new Map(resenas.map(r => [r.idReserva, r])),
        resenas
    };
};

// El nombre del guía vive en `usuario`, no en `guia` (para no duplicarlo).
// Hace falta un salto extra por cada guía distinto, así que se cachea.
const cacheGuias = new Map();

export const nombreDelGuia = async (idGuia, usuarios) => {
    if (!idGuia) return null;
    if (cacheGuias.has(idGuia)) return cacheGuias.get(idGuia);

    const guia = await jsonSeguro(`${API_BASE}/guias/${idGuia}`, null);
    const usuario = guia ? usuarios.get(guia.idUsuario) : null;

    const datos = guia ? {
        idGuia,
        nombre: usuario ? usuario.nombre : 'Guía Horizon',
        fotoUrl: guia.fotoUrl || (usuario ? usuario.fotoUrl : null),
        especialidad: guia.especialidad || '',
        experienciaAnios: guia.experienciaAnios || 0,
        descripcion: guia.descripcion || ''
    } : null;

    cacheGuias.set(idGuia, datos);
    return datos;
};

// Convierte una reserva cruda en algo mostrable.
// Regla del esquema: apunta a UNA clase o a UN evento, nunca a ambas.
export const componerReserva = async (reserva, catalogos) => {
    const esEvento = reserva.idEvento !== null && reserva.idEvento !== undefined;

    const actividad = esEvento
        ? catalogos.eventos.get(reserva.idEvento)
        : catalogos.clases.get(reserva.idClase);

    if (!actividad) {
        return {
            id: reserva.idReserva,
            titulo: 'Actividad no disponible',
            tipo: '—',
            fechaISO: null,
            fecha: 'Fecha por confirmar',
            precio: Number(reserva.precioReserva || 0),
            estado: reserva.estado,
            guia: null,
            tieneResena: catalogos.resenasPorReserva.has(reserva.idReserva)
        };
    }

    // El guía de una clase es directo; el de un evento se hereda de su zona.
    const idGuia = esEvento
        ? (catalogos.zonas.get(actividad.idZona) || {}).idGuia
        : actividad.idGuia;

    const guia = await nombreDelGuia(idGuia, catalogos.usuarios);

    const ubicacion = esEvento
        ? (catalogos.zonas.get(actividad.idZona) || {}).ubicacion
        : actividad.ubicacion;

    return {
        id: reserva.idReserva,
        titulo: actividad.titulo || 'Actividad sin título',
        tipo: DEPORTES[actividad.idDeporte] || 'Actividad',
        modalidad: esEvento ? 'Evento' : 'Clase',
        ubicacion: ubicacion || '',
        fechaISO: actividad.fecha,
        fecha: formatearFecha(actividad.fecha),
        duracion: actividad.duracion || '',
        precio: Number(reserva.precioReserva || 0),
        estado: reserva.estado,
        capacidad: actividad.capacidad,
        fotoUrl: actividad.fotoUrl,
        idGuia,
        guia,
        idActividad: esEvento ? actividad.idEvento : actividad.idClase,
        esEvento,
        tieneResena: catalogos.resenasPorReserva.has(reserva.idReserva)
    };
};

export const componerReservas = async (reservas, catalogos) => {
    return Promise.all(reservas.map(r => componerReserva(r, catalogos)));
};

// Una reserva es "próxima" si su fecha no ha pasado y no está cancelada.
export const esProxima = (r) => {
    if (r.estado === 'CANCELADA') return false;
    if (!r.fechaISO) return true;
    return new Date(r.fechaISO) >= new Date();
};

// Obtiene el perfil de explorador a partir del ID de usuario de la sesión.
export const obtenerExplorador = async (idUsuario) =>
    jsonSeguro(`${API_BASE}/exploradores/usuario/${idUsuario}`, null);

export const obtenerReservasExplorador = async (idExplorador) =>
    jsonSeguro(`${API_BASE}/reservas/explorador/${idExplorador}`, []);

export const obtenerGuiaPorUsuario = async (idUsuario) =>
    jsonSeguro(`${API_BASE}/guias/usuario/${idUsuario}`, null);

export const obtenerReservasGuia = async (idGuia) =>
    jsonSeguro(`${API_BASE}/reservas/guia/${idGuia}`, []);

// ============================================================
//  ACCIONES DE ESCRITURA
// ============================================================

// Cupos libres según el servidor. Se calcula allá con la misma regla
// que valida la creación, así que lo que se muestra coincide con lo
// que el backend va a aceptar.
export const obtenerCupos = async (idActividad, esEvento = true) => {
    const tipo = esEvento ? 'evento' : 'clase';
    try {
        const res = await fetch(`${API_BASE}/reservas/cupos/${tipo}/${idActividad}`);
        if (!res.ok) return null;
        const datos = await res.json();
        return datos.disponibles;
    } catch {
        return null;
    }
};

// Crea una reserva. El backend asigna fecha y estado PENDIENTE,
// y rechaza con 400 si ya no hay cupo.
export const crearReserva = async ({ idExplorador, idActividad, esEvento, precio }) => {
    try {
        const res = await fetch(`${API_BASE}/reservas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idExplorador,
                idEvento: esEvento ? idActividad : null,
                idClase: esEvento ? null : idActividad,
                precioReserva: precio
            })
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            return {
                success: false,
                message: error.mensaje || 'No se pudo completar la reserva.'
            };
        }

        return { success: true, reserva: await res.json() };

    } catch {
        return {
            success: false,
            message: 'No se pudo conectar con el servidor.'
        };
    }
};

// Cancela una reserva. No se borra: pasa a estado CANCELADA.
export const cancelarReserva = async (idReserva) => {
    try {
        const res = await fetch(`${API_BASE}/reservas/${idReserva}/cancelar`, {
            method: 'PUT'
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            return {
                success: false,
                message: error.mensaje || 'No se pudo cancelar la reserva.'
            };
        }

        return { success: true, reserva: await res.json() };

    } catch {
        return {
            success: false,
            message: 'No se pudo conectar con el servidor.'
        };
    }
};

// Crea una reseña. El backend exige que la reserva esté CONFIRMADA,
// que no tenga ya una reseña, y que la calificación esté entre 1 y 5.
export const crearResena = async ({ idReserva, calificacion, comentario }) => {
    try {
        const res = await fetch(`${API_BASE}/resenas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idReserva, calificacion, comentario })
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            return {
                success: false,
                message: error.mensaje || 'No se pudo guardar la reseña.'
            };
        }

        return { success: true, resena: await res.json() };

    } catch {
        return {
            success: false,
            message: 'No se pudo conectar con el servidor.'
        };
    }
};

// Actualiza el perfil público del guía. El backend reemplaza los cuatro
// campos editables, así que hay que mandarlos todos aunque no cambien.
export const actualizarGuia = async (idGuia, datos) => {
    try {
        const res = await fetch(`${API_BASE}/guias/${idGuia}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            return {
                success: false,
                message: error.mensaje || 'No se pudo guardar el perfil.'
            };
        }

        return { success: true, guia: await res.json() };

    } catch {
        return {
            success: false,
            message: 'No se pudo conectar con el servidor.'
        };
    }
};

// Actualiza nombre, correo y foto del usuario.
export const actualizarUsuario = async (idUsuario, datos) => {
    try {
        const res = await fetch(`${API_BASE}/usuarios/${idUsuario}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            return { success: false, message: error.mensaje || 'No se pudo guardar el perfil.' };
        }

        return { success: true, usuario: await res.json() };

    } catch {
        return { success: false, message: 'No se pudo conectar con el servidor.' };
    }
};

// Actualiza el nivel de experiencia del explorador.
export const actualizarNivel = async (idExplorador, nivel) => {
    try {
        const res = await fetch(`${API_BASE}/exploradores/${idExplorador}/nivel`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nivel })
        });
        if (!res.ok) return { success: false };
        return { success: true, explorador: await res.json() };
    } catch {
        return { success: false };
    }
};

// Cambia la contraseña. El backend exige la actual y la verifica.
export const cambiarPassword = async (idUsuario, passwordActual, passwordNueva) => {
    try {
        const res = await fetch(`${API_BASE}/usuarios/${idUsuario}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passwordActual, passwordNueva })
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            return { success: false, message: error.mensaje || 'No se pudo cambiar la contraseña.' };
        }

        return { success: true };

    } catch {
        return { success: false, message: 'No se pudo conectar con el servidor.' };
    }
};
