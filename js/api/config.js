// js/api/config.js
// Punto único de configuración de la API.
// Al desplegar, solo se cambia API_BASE aquí.

export const API_BASE = 'http://localhost:8080/api';

// Roles según la tabla `rol` de la base de datos
export const ROL = {
    EXPLORADOR: 1,
    GUIA: 2,
    ADMIN: 3
};
