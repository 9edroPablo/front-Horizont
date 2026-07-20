// js/api/rutasService.js
// Trae las zonas del backend y las traduce al formato que espera el mapa.

import { API_BASE } from './config.js';

// La BD guarda el ID del deporte; el front filtra por nombre.
// IDs según la tabla `deporte` del esquema v4.
export const DEPORTES = {
    1: 'Escalada',
    2: 'Senderismo',
    3: 'Pesca',
    4: 'Kayak'
};

// La BD guarda FACIL / MEDIO / DIFICIL (mayúsculas, sin acento).
// Los botones del filtro usan facil / medio / dificil.
const normalizarDificultad = (valor = '') => valor.toLowerCase();

const adaptarRuta = (z) => ({
    id: z.id,
    nombre: z.nombre,
    ubicacion: z.ubicacion,
    descripcion: z.descripcion || '',
    dificultad: normalizarDificultad(z.nivelDificultad),
    deporte: DEPORTES[z.idDeporte] || 'Otro',
    // Leaflet necesita números; el backend manda BigDecimal serializado
    lat: z.latitud !== null ? Number(z.latitud) : null,
    lng: z.longitud !== null ? Number(z.longitud) : null,
    idGuia: z.idGuia
});

export const obtenerRutas = async () => {
    const res = await fetch(`${API_BASE}/rutas`);
    if (!res.ok) throw new Error(`Error al cargar rutas: HTTP ${res.status}`);

    const zonas = await res.json();

    // Sin coordenadas no se puede pintar el pin: las descartamos
    return zonas.map(adaptarRuta).filter(r => r.lat !== null && r.lng !== null);
};
