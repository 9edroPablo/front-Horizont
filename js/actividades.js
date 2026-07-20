// js/actividades.js
// Catálogo completo de actividades. Los datos vienen del backend.

import { crearRutaCard } from './components/RutaCard.js';
import { obtenerEventos } from './api/eventosService.js';

const inicializarActividades = async () => {
    const contenedor = document.getElementById('grid-todas-rutas');
    if (!contenedor) return;

    contenedor.innerHTML = '<p style="padding: 20px; color: #6B7280;">Cargando actividades...</p>';

    try {
        const eventos = await obtenerEventos();

        if (eventos.length === 0) {
            contenedor.innerHTML = '<p style="padding: 20px; color: #6B7280;">No hay actividades programadas por ahora.</p>';
            return;
        }

        // Misma plantilla que usa la página de inicio: un solo lugar que mantener
        contenedor.innerHTML = eventos.map(crearRutaCard).join('');

    } catch (error) {
        console.error('Error al cargar las actividades:', error);
        contenedor.innerHTML = `
            <p style="padding: 20px; color: #B91C1C;">
                No se pudieron cargar las actividades.
                Revisa que el servidor esté encendido.
            </p>`;
    }
};

inicializarActividades();
