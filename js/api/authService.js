// js/api/authService.js
// Capa de traducción entre el backend (correo, passwordHash, idRol)
// y el formato que ya usa el resto del front (email, name, role, avatar).

import { API_BASE, ROL } from './config.js';

// Convierte "Alex Montoya" en "AM" para el círculo del header
const iniciales = (nombre = '') =>
    nombre.trim().split(/\s+/).slice(0, 2)
          .map(p => p[0] || '').join('').toUpperCase();

// Adapta la respuesta del backend al objeto de sesión del front
const adaptarUsuario = (u) => ({
    id: u.idUsuario,
    name: u.nombre,
    email: u.correo,
    avatar: iniciales(u.nombre),
    fotoUrl: u.fotoUrl,
    role: u.idRol === ROL.GUIA ? 'guide' : 'user'
});

export const loginUser = async (email, password) => {
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // El backend espera la contraseña EN TEXTO PLANO dentro
            // del campo passwordHash; él la compara con BCrypt.
            body: JSON.stringify({ correo: email, passwordHash: password })
        });

        if (res.status === 401) {
            return { success: false, message: 'Correo o contraseña incorrectos' };
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        return { success: true, user: adaptarUsuario(await res.json()) };

    } catch (error) {
        console.error('Error de conexión con el servidor:', error);
        return {
            success: false,
            message: 'No se pudo conectar con el servidor. ¿Está encendido el backend?'
        };
    }
};

export const registrarUser = async ({ nombre, email, password, esGuia = false }) => {
    try {
        const res = await fetch(`${API_BASE}/auth/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre,
                correo: email,
                passwordHash: password,
                idRol: esGuia ? ROL.GUIA : ROL.EXPLORADOR
            })
        });

        if (res.status === 400) {
            return { success: false, message: 'Ese correo ya está registrado.' };
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        return { success: true, user: adaptarUsuario(await res.json()) };

    } catch (error) {
        console.error('Error de conexión con el servidor:', error);
        return {
            success: false,
            message: 'No se pudo conectar con el servidor. ¿Está encendido el backend?'
        };
    }
};
