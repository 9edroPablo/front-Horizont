// js/inicio.js
// Mapa interactivo y próximas rutas guiadas. Datos desde el backend.

import { crearRutaCard } from './components/RutaCard.js';
import { obtenerRutas } from './api/rutasService.js';
import { obtenerEventos } from './api/eventosService.js';

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. INICIALIZACIÓN DEL MAPA
    // ==========================================
    const mapa = L.map('mapa-interactivo').setView([16.5, -92.8], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(mapa);

    // Capa de grupo: nos permite borrar los pines viejos al filtrar.
    const capaPines = L.layerGroup().addTo(mapa);

    // ==========================================
    // 2. DISEÑO DEL PIN PERSONALIZADO
    // ==========================================
    const pinPersonalizado = L.divIcon({
        className: 'custom-pin',
        html: `<svg width="36" height="36" viewBox="0 0 24 24" fill="#0F5B46" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="#ffffff"></circle></svg>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -32]
    });

    // ==========================================
    // 3. LÓGICA DE DATOS Y FILTROS DEL MAPA
    // ==========================================
    let todasLasRutas = [];
    let dificultadActiva = 'todos';

    const cargarRutas = async () => {
        try {
            todasLasRutas = await obtenerRutas();
            aplicarFiltros();
        } catch (error) {
            console.error("Error cargando los pines:", error);
        }
    };

    const renderizarPines = (rutasParaMostrar) => {
        capaPines.clearLayers();

        rutasParaMostrar.forEach(ruta => {
            const pin = L.marker([ruta.lat, ruta.lng], { icon: pinPersonalizado }).addTo(capaPines);

            pin.bindPopup(`
                <strong style="color: #0F5B46; font-size: 16px;">${ruta.nombre}</strong><br>
                <em>${ruta.deporte}</em>
                <span style="background:#eee; padding:2px 6px; border-radius:4px; font-size:11px; margin-left:5px; text-transform:uppercase;">
                    ${ruta.dificultad}
                </span><br>
                <div style="margin-top: 5px;">${ruta.descripcion}</div>
                <div style="margin-top: 5px; color: #6B7280; font-size: 12px;">${ruta.ubicacion || ''}</div>
            `);
        });
    };

    const aplicarFiltros = () => {
        const checkboxes = document.querySelectorAll('.filtro-deporte');
        const deportesSeleccionados = Array.from(checkboxes)
                                           .filter(cb => cb.checked)
                                           .map(cb => cb.value);

        const rutasFiltradas = todasLasRutas.filter(ruta => {
            const coincideDeporte = deportesSeleccionados.includes(ruta.deporte);
            const coincideDificultad = (dificultadActiva === 'todos') || (ruta.dificultad === dificultadActiva);

            return coincideDeporte && coincideDificultad;
        });

        renderizarPines(rutasFiltradas);
    };

    // ==========================================
    // 4. ESCUCHANDO CLICS EN LA INTERFAZ
    // ==========================================
    const checkboxesDeportes = document.querySelectorAll('.filtro-deporte');
    checkboxesDeportes.forEach(cb => {
        cb.addEventListener('change', aplicarFiltros);
    });

    const botonesDificultad = document.querySelectorAll('.btn-dif');
    botonesDificultad.forEach(btn => {
        btn.addEventListener('click', (e) => {
            botonesDificultad.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            dificultadActiva = e.target.getAttribute('data-dificultad');
            aplicarFiltros();
        });
    });

    // ==========================================
    // 5. LÓGICA DEL BUSCADOR DE CIUDADES
    // ==========================================
    const inputBuscador = document.getElementById("buscador-ciudad");
    const btnBuscar = document.getElementById("btn-buscar");
    const mapaSection = document.querySelector(".mapa-section");

    const buscarEnMapa = async () => {
        const ciudad = inputBuscador.value.trim();
        if (ciudad !== "") {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(ciudad)}`);
                const datos = await res.json();
                if (datos.length > 0) {
                    const lat = parseFloat(datos[0].lat);
                    const lon = parseFloat(datos[0].lon);
                    mapa.flyTo([lat, lon], 12);
                    mapaSection.scrollIntoView({ behavior: "smooth" });
                } else {
                    alert("No encontramos esa ubicación. Intenta con otra ciudad.");
                }
            } catch (error) {
                console.error("Error en la búsqueda:", error);
            }
        }
    };

    if (btnBuscar) btnBuscar.addEventListener("click", buscarEnMapa);
    if (inputBuscador) {
        inputBuscador.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                buscarEnMapa();
            }
        });
    }

    // ==========================================
    // 6. RENDERIZADO DE PRÓXIMAS RUTAS GUIADAS
    // ==========================================
    const cargarEventos = async () => {
        const contenedorRutas = document.getElementById('contenedor-rutas-guiadas');
        if (!contenedorRutas) return;

        try {
            const eventos = await obtenerEventos();
            // En la portada mostramos solo las próximas seis
            contenedorRutas.innerHTML = eventos.slice(0, 6).map(crearRutaCard).join('');
        } catch (error) {
            console.error("Error al renderizar los eventos:", error);
            contenedorRutas.innerHTML = `
                <p style="padding: 20px; color: #B91C1C;">
                    No se pudieron cargar las actividades.
                    Revisa que el servidor esté encendido.
                </p>`;
        }
    };

    cargarRutas();
    cargarEventos();
});
