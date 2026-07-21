// js/api/favoritosService.js
// Actividades guardadas por el usuario.

import { API_BASE } from './config.js';

// Devuelve un Set con los IDs de evento guardados. Se pide una sola vez
// por página y sirve para pintar el estado inicial de todos los corazones.
export const obtenerIdsFavoritos = async (idUsuario) => {
    if (!idUsuario) return new Set();
    try {
        const res = await fetch(`${API_BASE}/favoritos/usuario/${idUsuario}`);
        if (!res.ok) return new Set();
        const favoritos = await res.json();
        return new Set(favoritos.map(f => f.idEvento));
    } catch {
        return new Set();
    }
};

// Guarda o quita según el estado actual. El servidor decide y responde
// cómo quedó, así que la interfaz nunca se desincroniza de la base.
export const alternarFavorito = async (idUsuario, idEvento) => {
    try {
        const res = await fetch(`${API_BASE}/favoritos/alternar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idUsuario, idEvento })
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            return { success: false, message: error.mensaje || 'No se pudo guardar.' };
        }

        const datos = await res.json();
        return { success: true, guardado: datos.guardado };

    } catch {
        return { success: false, message: 'No se pudo conectar con el servidor.' };
    }
};
