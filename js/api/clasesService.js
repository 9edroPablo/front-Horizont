// js/api/clasesService.js
// Trae las clases del backend y las adapta al mismo formato de tarjeta
// que los eventos (ver eventosService.js). A diferencia de un evento,
// una clase ya trae ubicación y guía directos: no depende de una zona.

import { API_BASE } from './config.js';
import { DEPORTES } from './rutasService.js';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
               'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const formatearFecha = (iso) => {
    if (!iso) return '';
    const f = new Date(iso);
    if (isNaN(f)) return '';
    return `${f.getDate()} ${MESES[f.getMonth()]} ${f.getFullYear()}`;
};

const adaptarClase = (c) => ({
    id: c.idClase,
    tipo: 'clase',
    titulo: c.titulo || 'Actividad sin título',
    descripcion: c.descripcion || '',
    categoria: DEPORTES[c.idDeporte] || 'Otro',
    duracion: c.duracion || '—',
    precio: c.precio !== null ? Number(c.precio) : 0,
    imagen: c.fotoUrl,
    fecha: formatearFecha(c.fecha),
    fechaISO: c.fecha,
    idGuia: c.idGuia,
    capacidad: c.capacidad,
    lugaresDisponibles: c.capacidad,
    ubicacion: c.ubicacion || '',
    // Las clases no tienen nivel de dificultad en el esquema.
    dificultad: '',
    calificacion: null,
    resenas: null
});

export const obtenerClases = async () => {
    const res = await fetch(`${API_BASE}/clases`);
    if (!res.ok) throw new Error(`Error al cargar clases: HTTP ${res.status}`);
    return (await res.json()).map(adaptarClase);
};

export const obtenerClasePorId = async (id) => {
    const res = await fetch(`${API_BASE}/clases/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Error al cargar la clase: HTTP ${res.status}`);
    return adaptarClase(await res.json());
};
