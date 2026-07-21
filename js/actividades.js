// js/actividades.js
// Catálogo completo de actividades. Los datos vienen del backend.

import { crearRutaCard } from './components/RutaCard.js';
import { obtenerEventos } from './api/eventosService.js';
import { activarFavoritos } from './components/favoritos.js';

const inicializarActividades = async () => {
    const contenedor = document.getElementById('grid-todas-rutas');
    if (!contenedor) return;

    contenedor.innerHTML = '<p style="padding: 20px; color: #6B7280;">Cargando actividades...</p>';

    try {
        const eventos = await obtenerEventos();

        const inputBuscar = document.getElementById('input-buscar');
        const btnToggleFiltros = document.getElementById('btn-toggle-filtros');
        const panelFiltros = document.getElementById('panel-filtros');
        const checkboxesDeporte = document.querySelectorAll('.chk-deporte');
        const botonesDificultad = document.querySelectorAll('.btn-dif-actividades');
        const contador = document.getElementById('contador-rutas');

        let dificultadActiva = 'todos';

        const renderizar = (lista) => {
            contenedor.innerHTML = lista.length === 0
                ? '<p style="padding: 20px; color: #6B7280;">No se encontraron actividades con esos filtros.</p>'
                : lista.map(crearRutaCard).join('');
            activarFavoritos(contenedor);
            if (contador) {
                contador.textContent = `${lista.length} ${lista.length === 1 ? 'ruta encontrada' : 'rutas encontradas'}`;
            }
        };

        // Combina texto buscado + deportes marcados + dificultad activa.
        const aplicarFiltros = () => {
            const texto = inputBuscar.value.trim().toLowerCase();
            const deportesActivos = new Set(
                Array.from(checkboxesDeporte).filter(cb => cb.checked).map(cb => cb.value)
            );

            const filtrados = eventos.filter(ev => {
                const coincideTexto = !texto
                    || ev.titulo.toLowerCase().includes(texto)
                    || (ev.ubicacion || '').toLowerCase().includes(texto);
                const coincideDeporte = deportesActivos.has(ev.categoria);
                const coincideDificultad = dificultadActiva === 'todos' || ev.dificultad === dificultadActiva;
                return coincideTexto && coincideDeporte && coincideDificultad;
            });

            renderizar(filtrados);
        };

        if (eventos.length === 0) {
            renderizar([]);
            return;
        }

        renderizar(eventos);

        if (inputBuscar) {
            inputBuscar.addEventListener('input', aplicarFiltros);
        }

        if (btnToggleFiltros && panelFiltros) {
            btnToggleFiltros.addEventListener('click', () => {
                panelFiltros.hidden = !panelFiltros.hidden;
            });
        }

        checkboxesDeporte.forEach(cb => cb.addEventListener('change', aplicarFiltros));

        botonesDificultad.forEach(btn => {
            btn.addEventListener('click', () => {
                botonesDificultad.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                dificultadActiva = btn.dataset.dificultad;
                aplicarFiltros();
            });
        });

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
