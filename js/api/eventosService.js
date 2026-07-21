// js/api/eventosService.js
// Trae los eventos del backend y los traduce al formato de las tarjetas.

import { API_BASE } from './config.js';
import { DEPORTES } from './rutasService.js';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
               'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// "2026-08-15T07:00:00" -> "15 Ago 2026"
const formatearFecha = (iso) => {
    if (!iso) return '';
    const f = new Date(iso);
    if (isNaN(f)) return '';
    return `${f.getDate()} ${MESES[f.getMonth()]} ${f.getFullYear()}`;
};

const adaptarEvento = (e) => ({
    id: e.idEvento,
    tipo: 'evento',
    titulo: e.titulo || 'Actividad sin título',
    descripcion: e.descripcion || '',
    categoria: DEPORTES[e.idDeporte] || 'Otro',
    duracion: e.duracion || '—',
    precio: e.precio !== null ? Number(e.precio) : 0,
    imagen: e.fotoUrl,
    fecha: formatearFecha(e.fecha),
    fechaISO: e.fecha,
    idZona: e.idZona,
    capacidad: e.capacidad,

    // NOTA: el backend todavía no expone cuántas reservas confirmadas
    // tiene cada evento, así que mostramos la capacidad total.
    // Cuando exista ese endpoint, aquí se resta.
    lugaresDisponibles: e.capacidad,

    // La BD no guarda dificultad ni calificación por evento.
    // Se rellenan al cruzar con la zona (ver enriquecerConZona).
    dificultad: '',
    ubicacion: '',
    calificacion: null,
    resenas: null
});

// Los eventos viven en una zona; de ahí sacamos ubicación y dificultad.
const enriquecerConZona = (eventos, rutas) => {
    const porId = new Map(rutas.map(r => [r.id, r]));

    return eventos.map(ev => {
        const zona = porId.get(ev.idZona);
        if (!zona) return ev;
        return {
            ...ev,
            ubicacion: zona.ubicacion,
            dificultad: zona.dificultad
        };
    });
};

export const obtenerEventos = async () => {
    // En paralelo: no dependen uno del otro y así tarda la mitad
    const [resEventos, resRutas] = await Promise.all([
        fetch(`${API_BASE}/eventos`),
        fetch(`${API_BASE}/rutas`)
    ]);

    if (!resEventos.ok) throw new Error(`Error al cargar eventos: HTTP ${resEventos.status}`);

    const eventos = (await resEventos.json()).map(adaptarEvento);

    // Si fallan las zonas seguimos: las tarjetas salen sin ubicación,
    // pero es mejor que no mostrar nada.
    if (!resRutas.ok) return eventos;

    const rutas = (await resRutas.json()).map(z => ({
        id: z.id,
        ubicacion: z.ubicacion,
        dificultad: (z.nivelDificultad || '').toLowerCase()
    }));

    return enriquecerConZona(eventos, rutas);
};

export const obtenerEventoPorId = async (id) => {
    const res = await fetch(`${API_BASE}/eventos/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Error al cargar el evento: HTTP ${res.status}`);
    return adaptarEvento(await res.json());
};
